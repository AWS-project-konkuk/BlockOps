import type { StepContext, Strategy } from '../../engine';
import type { Entity, Kind } from '../../lab';
import { datum, received, setting } from '../kit';
import { request, requestsOf, respond, type RequestData } from './request';

/**
 * AWS 노드의 실행 규칙. 워크북의 "질문"과 "트러블 슈팅"에서 나온 실패 상황을 설정과 배치로 판정한다.
 * 각 규칙은 기본 동작(catalog.ts의 run)을 감싸고, 어기면 이유를 담은 오류를 낸다.
 * 규칙 목록과 근거는 docs/simulation-rules.md에 있다.
 */

/** 처리 용량. 인스턴스·태스크 하나가 한 번에 받는 요청 수. */
export const PER_INSTANCE = 100;
/** CloudFront 캐시 키를 경로로만 잡았을 때의 캐시 적중률. */
export const CACHE_HIT = 0.9;

const parentOf = (ctx: StepContext, entity: Entity = ctx.node) =>
  ctx.graph.entities.find((e) => e.id === entity.parent);
/** 노드가 들어 있는 서브넷. */
export const subnetOf = (ctx: StepContext) => {
  let current = parentOf(ctx);
  while (current && current.kind !== 'subnet') current = parentOf(ctx, current);
  return current;
};
const vpcOf = (ctx: StepContext) => {
  let current = parentOf(ctx);
  while (current && current.kind !== 'vpc') current = parentOf(ctx, current);
  return current;
};
const value = (entity: Entity | undefined, key: string) =>
  entity?.settings?.[key] === undefined ? undefined : String(entity.settings[key]);
const portOf = (protocol: string) => (protocol === 'http' ? '80' : '443');

/** 앞 노드의 요청 입력을 바꿔 기본 동작에 넘긴다. */
const withRequests = (ctx: StepContext, map: (data: RequestData) => RequestData): StepContext => {
  const inputs = ctx.inputs.map((item) =>
    item.type === 'data' && item.material === 'request'
      ? request(map(item.data as RequestData))
      : item,
  );
  return { ...ctx, inputs };
};
const total = (ctx: StepContext) => requestsOf(ctx.inputs).reduce((sum, r) => sum + r.count, 0);
/** 요청이 ALB를 거쳐 왔는지(직접 인터넷에서 온 요청이 아닌지). */
const viaLoadBalancer = (ctx: StepContext) =>
  requestsOf(ctx.inputs).every((r) => r.hops?.includes('alb') || r.hops?.includes('apigw'));
const fromInternet = (ctx: StepContext) =>
  requestsOf(ctx.inputs).some((r) => r.hops?.includes('igw'));

/** 서브넷 안의 자원이 요청을 받을 수 있는지. NACL과 가용 영역 장애를 먼저 본다. */
function subnetGate(ctx: StepContext, name: string) {
  const subnet = subnetOf(ctx);
  if (!subnet) return;
  const outage = value(vpcOf(ctx), 'outage');
  if (outage && outage !== 'none' && value(subnet, 'az') === outage) {
    ctx.observe('az-outage');
    throw new Error(
      subnet.name +
        '이 있는 가용 영역(ap-northeast-2' +
        outage +
        ')이 멈춰 ' +
        name +
        '에 닿을 수 없습니다. 다른 가용 영역에도 자원을 두세요.',
    );
  }
  if (requestsOf(ctx.inputs).length && value(subnet, 'nacl') === 'deny-web') {
    ctx.observe('nacl-deny');
    throw new Error(
      subnet.name +
        '의 네트워크 ACL 100번 규칙이 80·443을 거부합니다. 보안 그룹이 허용해도 NACL이 먼저 막습니다.',
    );
  }
}
/** 인터넷에서 ALB 없이 바로 들어오는 요청은 퍼블릭 서브넷과 퍼블릭 IP가 필요하다. */
function internetGate(ctx: StepContext, name: string, publicIp: boolean) {
  if (!requestsOf(ctx.inputs).length || viaLoadBalancer(ctx) || !fromInternet(ctx)) return;
  const subnet = subnetOf(ctx);
  if (value(subnet, 'tier') !== 'public' || value(subnet, 'route') !== 'igw') {
    ctx.observe('no-public-route');
    throw new Error(
      (subnet?.name ?? '서브넷') +
        '의 라우팅 테이블에 0.0.0.0/0 → 인터넷 게이트웨이 경로가 없어 인터넷에서 ' +
        name +
        '에 닿지 않습니다. 퍼블릭 서브넷에 두거나 ALB를 앞에 두세요.',
    );
  }
  if (!publicIp) {
    ctx.observe('no-public-ip');
    throw new Error(
      name + '에 퍼블릭 IP가 없어 인터넷에서 접속할 수 없습니다. 퍼블릭 IP를 할당하세요.',
    );
  }
}
/** 보안 그룹 인바운드가 요청 포트를 허용하는지. */
function securityGroup(ctx: StepContext, name: string) {
  const allowed = String(setting(ctx.node, 'sg'));
  const needed = [...new Set(requestsOf(ctx.inputs).map((r) => portOf(r.protocol)))];
  const blocked = needed.filter((p) => p !== allowed);
  if (blocked.length) {
    ctx.observe('sg-blocked');
    throw new Error(
      name +
        '의 보안 그룹이 ' +
        allowed +
        '번 포트만 허용해 ' +
        blocked.join('·') +
        '번 포트 요청이 막혔습니다. 인바운드 규칙에 ' +
        blocked.join('·') +
        '번을 추가하세요.',
    );
  }
}
/** 받은 요청이 처리 용량을 넘으면 넘친 만큼 실패한다. */
function capacity(ctx: StepContext, name: string, units: number, unit: string) {
  const count = total(ctx);
  const limit = units * PER_INSTANCE;
  if (count > limit) {
    ctx.observe('overload');
    throw new Error(
      name +
        '의 ' +
        unit +
        ' ' +
        units +
        '개가 받을 수 있는 요청은 ' +
        limit +
        '건인데 ' +
        count +
        '건이 들어와 ' +
        (count - limit) +
        '건이 실패했습니다.',
    );
  }
}
const outageAz = (ctx: StepContext) => {
  const outage = value(vpcOf(ctx), 'outage');
  return outage && outage !== 'none' ? outage : undefined;
};

/** 종류별 규칙. 기본 동작을 받아 규칙을 더한 동작을 돌려준다. */
export const awsRules: Record<Kind, (base: Strategy) => Strategy> = {
  cloudfront: (base) => (ctx) => {
    const key = String(setting(ctx.node, 'cacheKey'));
    const ttl = String(setting(ctx.node, 'ttl'));
    const deploy = String(setting(ctx.node, 'deploy'));
    const statics = requestsOf(ctx.inputs).every((r) => r.path.startsWith('/static'));
    if (statics && ttl === '86400' && deploy === 'none') {
      ctx.observe('stale-cache');
      throw new Error(
        '새 버전을 배포했지만 TTL 24시간 동안 엣지 캐시가 이전 파일을 줍니다. Invalidation을 실행하거나 파일 이름에 버전을 붙이세요.',
      );
    }
    const hit = key === 'path' ? CACHE_HIT : 0;
    if (!hit) ctx.observe('cache-miss');
    const arrived = total(ctx);
    const hits = Math.round(arrived * hit);
    respond(ctx, hits, Math.max(...requestsOf(ctx.inputs).map((r) => r.total)), { cache: true });
    const message = base(
      withRequests(ctx, (r) => ({ ...r, count: Math.max(1, Math.round(r.count * (1 - hit))) })),
    );
    return '캐시 적중 ' + Math.round(hit * 100) + '% · ' + (hit ? '나머지만 ' : '모두 ') + message;
  },
  alb: (base) => (ctx) => {
    if (String(setting(ctx.node, 'health')) !== '/health') {
      ctx.observe('health-failed');
      throw new Error(
        '헬스 체크 경로 /status에 앱이 응답하지 않아 대상이 모두 Unhealthy로 판정됐습니다. 요청을 보낼 대상이 없습니다.',
      );
    }
    const listener = String(setting(ctx.node, 'listener'));
    const wrong = requestsOf(ctx.inputs).filter((r) => r.protocol !== listener);
    if (wrong.length) {
      ctx.observe('listener-mismatch');
      throw new Error(
        'ALB 리스너는 ' +
          listener.toUpperCase() +
          '인데 ' +
          wrong[0].protocol.toUpperCase() +
          ' 요청이 들어왔습니다. 리스너가 없는 포트의 요청은 받지 않습니다.',
      );
    }
    return base(ctx);
  },
  ec2: (base) => (ctx) => {
    subnetGate(ctx, ctx.node.name);
    internetGate(ctx, ctx.node.name, String(setting(ctx.node, 'publicIp')) === 'yes');
    securityGroup(ctx, ctx.node.name);
    capacity(ctx, ctx.node.name, 1, '인스턴스');
    return base(ctx);
  },
  asg: (base) => (ctx) => {
    const min = Number(setting(ctx.node, 'min'));
    const desired = Number(setting(ctx.node, 'desired'));
    const max = Number(setting(ctx.node, 'max'));
    if (min > desired || desired > max)
      throw new Error('최소 ≤ 원하는 수 ≤ 최대가 되도록 설정하세요.');
    subnetGate(ctx, ctx.node.name);
    internetGate(ctx, ctx.node.name, false);
    const scaling = String(setting(ctx.node, 'policy')) === 'target';
    let units = scaling
      ? Math.max(desired, Math.min(max, Math.ceil(total(ctx) / PER_INSTANCE)))
      : desired;
    if (scaling && units > desired) ctx.observe('scaled-out');
    const outage = outageAz(ctx);
    if (outage) {
      if (String(setting(ctx.node, 'spread')) === 'single') {
        ctx.observe('az-outage');
        throw new Error(
          '인스턴스를 한 가용 영역에만 두어 그 영역이 멈추자 모두 중단됐습니다. 두 가용 영역에 분산하세요.',
        );
      }
      units = Math.ceil(units / 2);
      if (scaling) units = Math.min(max, Math.max(units, Math.ceil(total(ctx) / PER_INSTANCE)));
      ctx.observe('az-survived');
    }
    capacity(ctx, ctx.node.name, units, '인스턴스');
    return base(ctx) + ' 인스턴스 ' + units + '대가 나눠 처리했습니다.';
  },
  ecs: (base) => (ctx) => {
    subnetGate(ctx, ctx.node.name);
    internetGate(ctx, ctx.node.name, false);
    const subnet = subnetOf(ctx);
    if (received(ctx.inputs, 'image').length && value(subnet, 'route') === 'none') {
      ctx.observe('image-pull-failed');
      throw new Error(
        (subnet?.name ?? '서브넷') +
          '에 외부로 나가는 경로가 없어 ECR에서 이미지를 받지 못했습니다. NAT 게이트웨이 경로를 추가하세요.',
      );
    }
    const launch = String(setting(ctx.node, 'launch'));
    if (launch === 'fargate' && String(setting(ctx.node, 'role')) === 'instance') {
      ctx.observe('shared-role');
      throw new Error(
        'Fargate에는 직접 관리하는 인스턴스가 없어 인스턴스 프로파일을 쓸 수 없습니다. 태스크 역할로 권한을 주세요.',
      );
    }
    if (String(setting(ctx.node, 'role')) === 'instance') ctx.observe('shared-role');
    const tasks = Number(setting(ctx.node, 'tasks'));
    if (!tasks) throw new Error('실행 중인 태스크가 없습니다. 태스크 수를 1 이상으로 정하세요.');
    capacity(ctx, ctx.node.name, tasks, '태스크');
    return base(ctx);
  },
  rds: (base) => (ctx) => {
    const subnet = subnetOf(ctx);
    if (value(subnet, 'tier') === 'public' && value(subnet, 'route') === 'igw') {
      ctx.observe('db-exposed');
      throw new Error(
        'DB가 인터넷 경로가 있는 퍼블릭 서브넷에 있습니다. 프라이빗 서브넷으로 옮기고 앱 서버의 보안 그룹만 허용하세요.',
      );
    }
    const outage = outageAz(ctx);
    if (outage && value(subnet, 'az') === outage) {
      if (String(setting(ctx.node, 'multiAz')) !== 'on') {
        ctx.observe('az-outage');
        throw new Error(
          '단일 AZ DB가 있는 가용 영역이 멈췄습니다. Multi-AZ를 켜면 대기 복제본이 자동으로 승격됩니다.',
        );
      }
      ctx.observe('db-failover');
      return base(ctx) + ' 대기 복제본이 승격되어 계속 응답했습니다.';
    }
    const queries = received(ctx.inputs, 'query').reduce(
      (s, q) => s + Number(q.data.count ?? 1),
      0,
    );
    const limit = String(setting(ctx.node, 'replica')) === '1' ? 1000 : 500;
    if (queries > limit) {
      ctx.observe('db-overload');
      throw new Error(
        'DB 한 대가 받을 수 있는 쿼리 ' +
          limit +
          '건을 넘었습니다(' +
          queries +
          '건). 읽기 복제본을 두거나 큐로 쓰기를 늦추세요.',
      );
    }
    return base(ctx);
  },
  s3: (base) => (ctx) => {
    const access = String(setting(ctx.node, 'access'));
    const list = requestsOf(ctx.inputs);
    const direct = list.some((r) => !r.hops?.includes('cloudfront'));
    if (access === 'private' && direct) {
      ctx.observe('s3-blocked');
      throw new Error(
        '퍼블릭 액세스 차단이 켜진 버킷에 사용자가 바로 요청했습니다. CloudFront(OAC)를 거쳐 요청하게 하세요.',
      );
    }
    if (access === 'public' && !direct) {
      ctx.observe('s3-public');
      throw new Error(
        '버킷이 공개되어 있어 CloudFront를 우회해 바로 받을 수 있습니다. 퍼블릭 액세스를 차단하고 OAC로만 허용하세요.',
      );
    }
    if (access === 'public') ctx.observe('s3-public');
    return base(ctx);
  },
  dynamodb: (base) => (ctx) => {
    const queries = received(ctx.inputs, 'query').reduce(
      (s, q) => s + Number(q.data.count ?? 1),
      0,
    );
    if (String(setting(ctx.node, 'key')) === 'date') {
      ctx.observe('hot-partition');
      if (String(setting(ctx.node, 'capacity')) === 'provisioned' && queries > 10)
        throw new Error(
          '파티션 키 date는 오늘 날짜 하나에 쓰기가 몰려 한 파티션의 용량(WCU 10)을 넘었습니다. 고르게 퍼지는 키(orderId)를 쓰세요.',
        );
    }
    return base(ctx);
  },
  sqs: (base) => (ctx) => {
    const fifo = String(setting(ctx.node, 'type')) === 'fifo';
    const shortVisibility = String(setting(ctx.node, 'visibility')) === '5';
    const message = base(ctx);
    const count = received(ctx.inputs, 'message').reduce(
      (s, m) => s + Number(m.data.count ?? 1),
      0,
    );
    const duplicates = fifo ? 0 : Math.max(1, Math.round(count * (shortVisibility ? 0.2 : 0.02)));
    if (duplicates) ctx.observe('duplicate-delivery');
    return (
      message +
      (duplicates
        ? ' 표준 큐라 ' + duplicates + '건이 한 번 더 전달될 수 있습니다.'
        : ' FIFO라 순서대로 한 번씩 전달합니다.')
    );
  },
  lambda: (base) => (ctx) => {
    const runtime = String(setting(ctx.node, 'runtime'));
    const memory = Number(setting(ctx.node, 'memory'));
    const cold = runtime === 'java' ? (memory >= 1024 ? 1200 : 3000) : memory >= 512 ? 200 : 400;
    if (runtime === 'java') ctx.observe('cold-start');
    return base(ctx) + ' 첫 호출 콜드 스타트 약 ' + cold + 'ms.';
  },
  prometheus: (base) => (ctx) => {
    const sources = received(ctx.inputs, 'metric');
    const lambdas = sources.filter((m) => {
      const id = String(m.data.source ?? '');
      return ctx.graph.entities.some((e) => e.name === id && e.kind === 'lambda');
    });
    if (lambdas.length) {
      ctx.observe('pull-mismatch');
      throw new Error(
        'Lambda는 잠깐 실행되고 꺼져서 Prometheus가 주기적으로 당겨 올(Pull) 수 없습니다. Lambda 지표는 CloudWatch로 보내세요(Push).',
      );
    }
    return base(ctx);
  },
  cloudwatch: (base) => (ctx) => {
    const threshold = Number(setting(ctx.node, 'threshold'));
    const peak = Math.max(
      0,
      ...received(ctx.inputs, 'metric').map((m) => Number(m.data.requests ?? 0)),
    );
    const message = base(ctx);
    if (peak > threshold) {
      ctx.observe('alarm');
      return message + ' 요청 ' + peak + '건이 기준 ' + threshold + '건을 넘어 경보를 냈습니다.';
    }
    return message;
  },
  build: (base) => (ctx) => {
    const message = base(ctx);
    if (String(setting(ctx.node, 'test')) === 'off') ctx.observe('untested-build');
    return message;
  },
};

/** 규칙을 더한 동작. 규칙이 없는 종류는 기본 동작을 그대로 쓴다. */
export const withRules = (kind: Kind, base: Strategy): Strategy =>
  awsRules[kind] ? awsRules[kind](base) : base;

/** 규칙이 남기는 관찰 태그와 설명. 실습의 관찰 조건과 AI 조언에 쓴다. */
export const awsObservations: Record<string, string> = {
  'az-outage': '가용 영역 장애로 자원이 멈춘 실행',
  'az-survived': '가용 영역 하나가 멈춰도 다른 영역이 처리한 실행',
  'nacl-deny': '네트워크 ACL이 웹 트래픽을 거부한 실행',
  'no-public-route': '인터넷 게이트웨이 경로가 없어 닿지 않은 실행',
  'no-public-ip': '퍼블릭 IP가 없어 접속하지 못한 실행',
  'sg-blocked': '보안 그룹이 요청 포트를 막은 실행',
  overload: '처리 용량을 넘어 요청이 실패한 실행',
  'scaled-out': 'Auto Scaling이 인스턴스를 늘린 실행',
  'stale-cache': 'TTL 동안 이전 파일이 보인 실행',
  'cache-miss': '캐시 키가 세분화되어 모두 오리진으로 간 실행',
  'health-failed': '헬스 체크 실패로 대상이 빠진 실행',
  'listener-mismatch': '리스너 포트와 요청 프로토콜이 다른 실행',
  'image-pull-failed': '외부 경로가 없어 이미지를 받지 못한 실행',
  'shared-role': '컨테이너가 인스턴스 권한을 공유한 실행',
  'db-exposed': 'DB를 퍼블릭 서브넷에 둔 실행',
  'db-failover': 'Multi-AZ 대기 복제본이 승격된 실행',
  'db-overload': 'DB 쿼리 한도를 넘은 실행',
  's3-blocked': '퍼블릭 액세스 차단으로 직접 요청이 막힌 실행',
  's3-public': '버킷을 공개한 실행',
  'hot-partition': '한 파티션 키에 쓰기가 몰린 실행',
  'duplicate-delivery': '표준 큐에서 중복 전달이 생길 수 있는 실행',
  'cold-start': 'Java 런타임의 긴 콜드 스타트',
  'pull-mismatch': 'Pull 방식으로 Lambda 지표를 수집하려 한 실행',
  alarm: 'CloudWatch 경보가 울린 실행',
  'untested-build': '테스트 없이 빌드한 실행',
};

/** 규칙 설명에서 쓰는 도우미. 테스트에서 지표를 만들 때 쓴다. */
export const metricOf = (source: string, requests: number) =>
  datum('metric', source + ' 지표', { source, requests });
