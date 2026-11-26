import type { Strategy } from '../../engine';
import type { Kind, LabConfig, PortSpec, SettingSpec } from '../../lab';
import { choice, datum, josa, port, received, setting } from '../kit';
import { fanOut, incoming, request, requestSummary, respond } from './request';
import { withRules } from './rules';

/**
 * AWS 서비스와 리소스 노드 카탈로그. 실습과 Playground가 필요한 종류만 골라 쓴다.
 * 서비스(service: true)는 다른 노드를 담는 영역이고, 나머지는 자료를 주고받는 리소스이다.
 * 실행 규칙(설정에 따른 성공·실패)은 rules.ts가 각 리소스의 run을 감싸서 더한다.
 */
export interface AwsKind {
  label: string;
  service?: boolean;
  ports?: PortSpec[];
  settings?: SettingSpec[];
  run?: Strategy;
}

/** 노드 사이로 오가는 자료. 포트와 선의 타입이다. */
export const awsMaterials: Record<string, string> = {
  request: 'HTTP 요청',
  query: 'DB 쿼리',
  message: '메시지',
  event: '이벤트',
  image: '컨테이너 이미지',
  code: '소스 코드',
  metric: '지표',
  response: '응답',
};

const connected = (ctx: Parameters<Strategy>[0], portId: string) => fanOut(ctx, portId) > 0;

const responsePort = port('out', 'response', 'response');

const num = (
  key: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  help?: string,
) => ({ key, label, type: 'number', initial, min, max, step: 1, help }) as SettingSpec;

/** 요청을 받아 그대로 다음 노드로 넘기는 리소스. */
const relay =
  (verb: string): Strategy =>
  (ctx) => {
    const data = incoming(ctx);
    ctx.emit(request(data));
    return josa(requestSummary(data), '을/를') + ' ' + verb;
  };
/** 요청을 처리하고 연결된 DB·메시지·지표 출력으로 결과를 보내는 실행 자원. */
const serve =
  (name: string): Strategy =>
  (ctx) => {
    const data = incoming(ctx);
    if (connected(ctx, 'out-query'))
      ctx.emit(
        datum('query', '쿼리 ' + data.count + '건', { count: data.count, total: data.total }),
        'out-query',
      );
    if (connected(ctx, 'out-message'))
      ctx.emit(
        datum('message', '메시지 ' + data.count + '건', { count: data.count }),
        'out-message',
      );
    if (connected(ctx, 'out-metric'))
      ctx.emit(
        datum('metric', name + ' 지표', { source: ctx.node.name, requests: data.count }),
        'out-metric',
      );
    respond(ctx, data.count, data.total);
    return name + '에서 요청 ' + data.count + '건을 처리했습니다.';
  };
const store =
  (material: string, unit: string, name: string): Strategy =>
  (ctx) => {
    const items = received(ctx.inputs, material);
    if (!items.length) throw new Error(awsMaterials[material] + ' 입력이 없습니다.');
    const count = items.reduce((sum, item) => sum + Number(item.data.count ?? 1), 0);
    const total = Math.max(count, ...items.map((item) => Number(item.data.total ?? 0)));
    respond(ctx, count, total);
    return name + '에서 ' + unit + ' ' + count + '건을 처리했습니다.';
  };

export const awsKinds: Record<Kind, AwsKind> = {
  root: { label: '전체 서비스', service: true },

  // 서비스 영역
  internet: { label: '인터넷', service: true },
  edge: { label: '엣지 네트워크', service: true },
  vpc: {
    label: 'VPC',
    service: true,
    settings: [
      choice('cidr', 'IPv4 CIDR', '10.0.0.0/16', [
        ['10.0.0.0/16', '10.0.0.0/16 (약 65,000개)'],
        ['10.0.0.0/24', '10.0.0.0/24 (약 250개)'],
      ]),
      choice(
        'outage',
        '장애 실험',
        'none',
        [
          ['none', '정상'],
          ['a', 'ap-northeast-2a 중단'],
          ['c', 'ap-northeast-2c 중단'],
        ],
        '가용 영역 하나가 멈췄을 때 서비스가 버티는지 확인합니다.',
      ),
    ],
  },
  subnet: {
    label: '서브넷',
    service: true,
    settings: [
      choice('tier', '서브넷 종류', 'public', [
        ['public', '퍼블릭'],
        ['private', '프라이빗'],
      ]),
      choice('az', '가용 영역', 'a', [
        ['a', 'ap-northeast-2a'],
        ['c', 'ap-northeast-2c'],
      ]),
      choice(
        'route',
        '라우팅 테이블 0.0.0.0/0',
        'igw',
        [
          ['igw', '인터넷 게이트웨이'],
          ['nat', 'NAT 게이트웨이'],
          ['none', '경로 없음'],
        ],
        '외부로 나가는 기본 경로입니다. 퍼블릭 서브넷은 인터넷 게이트웨이로 보냅니다.',
      ),
      choice(
        'nacl',
        '네트워크 ACL',
        'allow',
        [
          ['allow', '모두 허용 (기본)'],
          ['deny-web', '100번 규칙: 80·443 거부'],
        ],
        'NACL은 서브넷 단위로, 규칙 번호가 낮은 것부터 평가합니다.',
      ),
    ],
  },
  storage: { label: '스토리지·DB', service: true },
  containers: { label: '컨테이너', service: true },
  messaging: { label: '메시징', service: true },
  serverless: { label: '서버리스', service: true },
  monitoring: { label: '모니터링', service: true },
  cicd: { label: 'CI/CD', service: true },

  // 사용자·진입
  user: {
    label: '사용자',
    ports: [port('out', 'request', 'request')],
    settings: [
      choice('traffic', '요청 수', '100', [
        ['10', '10건 (평상시)'],
        ['100', '100건'],
        ['1000', '1,000건 (트래픽 급증)'],
      ]),
      choice('protocol', '프로토콜', 'https', [
        ['https', 'HTTPS (443)'],
        ['http', 'HTTP (80)'],
      ]),
      choice('path', '요청 경로', '/', [
        ['/', '/ (웹 페이지)'],
        ['/static/logo.png', '/static/logo.png (정적 파일)'],
        ['/api/orders', '/api/orders (API)'],
      ]),
    ],
    run: (ctx) => {
      const count = Number(setting(ctx.node, 'traffic'));
      const protocol = setting(ctx.node, 'protocol') === 'http' ? 'http' : 'https';
      const path = String(setting(ctx.node, 'path'));
      ctx.emit(
        request({ count, total: count, protocol, path, trace: [ctx.node.name], hops: ['user'] }),
      );
      return (
        '사용자가 ' + path + '로 ' + protocol.toUpperCase() + ' 요청 ' + count + '건을 보냈습니다.'
      );
    },
  },
  route53: {
    label: 'Route 53',
    ports: [port('in', 'request', 'request', true), port('out', 'request', 'request')],
    run: relay('도메인 이름으로 찾아 연결했습니다.'),
  },
  cloudfront: {
    label: 'CloudFront',
    ports: [
      port('in', 'request', 'request', true),
      port('out', 'request', 'request', false, '오리진 요청'),
      port('out', 'response', 'response', false, '캐시 응답'),
    ],
    settings: [
      choice('cacheKey', '캐시 키', 'path', [
        ['path', '경로만 (CachingOptimized)'],
        ['all', '쿼리·쿠키·헤더 모두'],
      ]),
      choice('ttl', '기본 TTL', '86400', [
        ['60', '1분'],
        ['86400', '24시간'],
      ]),
      choice('deploy', '새 버전 배포 후', 'versioned', [
        ['none', '아무것도 안 함'],
        ['invalidate', 'Invalidation 실행'],
        ['versioned', '파일 이름에 버전 붙이기'],
      ]),
    ],
    run: relay('엣지 로케이션에서 받아 오리진으로 보냈습니다.'),
  },
  igw: {
    label: '인터넷 게이트웨이',
    ports: [port('in', 'request', 'request', true), port('out', 'request', 'request')],
    run: relay('VPC 안으로 들여보냈습니다.'),
  },
  alb: {
    label: 'ALB',
    ports: [
      port('in', 'request', 'request', true),
      port('out', 'request', 'request', false, '대상 그룹'),
      port('out', 'metric', 'metric'),
    ],
    settings: [
      choice('listener', '리스너', 'https', [
        ['https', 'HTTPS : 443'],
        ['http', 'HTTP : 80'],
      ]),
      choice('health', '헬스 체크 경로', '/health', [
        ['/health', '/health (앱이 응답하는 경로)'],
        ['/status', '/status (앱에 없는 경로)'],
      ]),
    ],
    run: (ctx) => {
      const data = incoming(ctx);
      const targets = fanOut(ctx, 'out-request');
      if (!targets) throw new Error('대상 그룹에 연결된 대상이 없습니다.');
      const share = Math.ceil(data.count / targets);
      ctx.emit(request({ ...data, count: share }), 'out-request');
      if (connected(ctx, 'out-metric'))
        ctx.emit(
          datum('metric', 'ALB 지표', { source: ctx.node.name, requests: data.count }),
          'out-metric',
        );
      return '요청 ' + data.count + '건을 대상 ' + targets + '곳에 ' + share + '건씩 나눴습니다.';
    },
  },
  apigw: {
    label: 'API Gateway',
    ports: [
      port('in', 'request', 'request', true),
      port('out', 'event', 'event', false, '통합 호출'),
    ],
    settings: [
      choice('api', 'API 유형', 'http', [
        ['http', 'HTTP API (저렴·저지연)'],
        ['rest', 'REST API (캐싱·변환 지원)'],
      ]),
    ],
    run: (ctx) => {
      const data = incoming(ctx);
      ctx.emit(
        datum('event', '호출 ' + data.count + '건', {
          count: data.count,
          total: data.total,
          source: 'api',
        }),
      );
      return data.path + ' 요청 ' + data.count + '건을 통합 대상으로 넘겼습니다.';
    },
  },

  // 실행 자원
  ec2: {
    label: 'EC2',
    ports: [
      port('in', 'request', 'request', true),
      port('out', 'query', 'query'),
      port('out', 'message', 'message'),
      responsePort,
      port('out', 'metric', 'metric'),
    ],
    settings: [
      choice('type', '인스턴스 유형', 't3.micro', [
        ['t3.micro', 't3.micro (2 vCPU · 1GiB)'],
        ['t3.large', 't3.large (2 vCPU · 8GiB)'],
      ]),
      choice(
        'sg',
        '보안 그룹 인바운드',
        '443',
        [
          ['443', 'HTTPS 443 허용'],
          ['80', 'HTTP 80 허용'],
          ['22', 'SSH 22만 허용'],
        ],
        '보안 그룹은 허용 규칙만 있고, 들어온 요청의 응답은 자동으로 나갑니다(Stateful).',
      ),
      choice('publicIp', '퍼블릭 IP', 'yes', [
        ['yes', '할당'],
        ['no', '없음'],
      ]),
    ],
    run: serve('EC2'),
  },
  asg: {
    label: 'Auto Scaling 그룹',
    ports: [
      port('in', 'request', 'request', true),
      port('out', 'query', 'query'),
      responsePort,
      port('out', 'metric', 'metric'),
    ],
    settings: [
      num('min', '최소', 1, 0, 10),
      num('desired', '원하는 수', 2, 0, 10),
      num('max', '최대', 4, 1, 10, '트래픽이 몰려도 이 수를 넘겨 늘리지 않습니다.'),
      choice('policy', '조정 정책', 'target', [
        ['target', '대상 추적 (CPU 50%)'],
        ['none', '없음 (고정)'],
      ]),
      choice('spread', '인스턴스 배치', 'multi', [
        ['multi', '두 가용 영역에 분산'],
        ['single', '한 가용 영역에만'],
      ]),
    ],
    run: serve('Auto Scaling 그룹'),
  },
  ecs: {
    label: 'ECS 서비스',
    ports: [
      port('in', 'request', 'request', true),
      port('in', 'image', 'image', false, '실행할 이미지'),
      port('out', 'query', 'query'),
      responsePort,
      port('out', 'metric', 'metric'),
    ],
    settings: [
      choice('launch', '시작 유형', 'fargate', [
        ['fargate', 'Fargate (서버리스)'],
        ['ec2', 'EC2 (직접 관리)'],
      ]),
      num('tasks', '태스크 수', 2, 0, 6),
      choice(
        'role',
        'S3 권한',
        'task',
        [
          ['task', '태스크 역할 (컨테이너마다)'],
          ['instance', '인스턴스 프로파일 (호스트 공유)'],
        ],
        '태스크 역할은 컨테이너별로 권한을 나누고, 인스턴스 프로파일은 같은 호스트의 컨테이너가 권한을 공유합니다.',
      ),
    ],
    run: (ctx) => {
      const image = received(ctx.inputs, 'image')[0];
      if (!image) throw new Error('실행할 컨테이너 이미지가 없습니다. ECR을 연결하세요.');
      const message = serve('ECS 서비스')(ctx);
      return String(image.data.tag) + ' 이미지로 ' + message;
    },
  },
  lambda: {
    label: 'Lambda',
    ports: [
      port('in', 'event', 'event', true),
      port('in', 'message', 'message', true),
      port('out', 'query', 'query'),
      port('out', 'message', 'message'),
      responsePort,
      port('out', 'metric', 'metric'),
    ],
    settings: [
      choice('runtime', '런타임', 'nodejs', [
        ['nodejs', 'Node.js'],
        ['python', 'Python'],
        ['java', 'Java'],
      ]),
      choice('memory', '메모리', '512', [
        ['128', '128MB'],
        ['512', '512MB'],
        ['1024', '1,024MB'],
      ]),
    ],
    run: (ctx) => {
      const items = [...received(ctx.inputs, 'event'), ...received(ctx.inputs, 'message')];
      if (!items.length) throw new Error('Lambda를 실행할 이벤트가 없습니다. 트리거를 연결하세요.');
      const count = items.reduce((sum, item) => sum + Number(item.data.count ?? 1), 0);
      const total = Math.max(count, ...items.map((item) => Number(item.data.total ?? 0)));
      // 표준 큐에서 한 번 더 전달된 메시지도 함수는 그대로 한 번 더 처리한다.
      const duplicates = items.reduce((sum, item) => sum + Number(item.data.duplicates ?? 0), 0);
      if (connected(ctx, 'out-query'))
        ctx.emit(
          datum('query', '쿼리 ' + (count + duplicates) + '건', { count, total, duplicates }),
          'out-query',
        );
      if (connected(ctx, 'out-message'))
        ctx.emit(
          datum('message', '메시지 ' + count + '건', { count, total, duplicates }),
          'out-message',
        );
      if (connected(ctx, 'out-metric'))
        ctx.emit(
          datum('metric', 'Lambda 지표', { source: ctx.node.name, requests: count }),
          'out-metric',
        );
      respond(ctx, count, total);
      return '이벤트 ' + count + '건으로 함수를 실행했습니다.';
    },
  },

  // 저장
  s3: {
    label: 'S3 버킷',
    ports: [
      port('in', 'request', 'request', true),
      port('out', 'event', 'event', false, '객체 생성 이벤트'),
      responsePort,
    ],
    settings: [
      choice('access', '퍼블릭 액세스', 'private', [
        ['private', '차단 (기본)'],
        ['public', '버킷 정책으로 공개'],
      ]),
      choice('versioning', '버전 관리', 'off', [
        ['off', '꺼짐'],
        ['on', '켜짐'],
      ]),
    ],
    run: (ctx) => {
      const data = incoming(ctx, '객체 요청');
      if (connected(ctx, 'out-event'))
        ctx.emit(
          datum('event', '객체 이벤트 ' + data.count + '건', { count: data.count, source: 's3' }),
        );
      respond(ctx, data.count, data.total);
      return '객체 요청 ' + data.count + '건에 응답했습니다.';
    },
  },
  rds: {
    label: 'RDS',
    ports: [
      port('in', 'query', 'query', true),
      port('out', 'response', 'response', false, '처리 결과'),
    ],
    settings: [
      choice('engine', 'DB 엔진', 'postgres', [
        ['postgres', 'PostgreSQL'],
        ['mysql', 'MySQL'],
      ]),
      choice('multiAz', 'Multi-AZ', 'off', [
        ['off', '꺼짐 (단일 AZ)'],
        ['on', '켜짐 (대기 복제본)'],
      ]),
      choice('replica', '읽기 복제본', '0', [
        ['0', '없음'],
        ['1', '1개'],
      ]),
    ],
    run: store('query', '쿼리', 'RDS'),
  },
  dynamodb: {
    label: 'DynamoDB',
    ports: [
      port('in', 'query', 'query', true),
      port('out', 'response', 'response', false, '처리 결과'),
    ],
    settings: [
      choice('key', '파티션 키', 'orderId', [
        ['orderId', 'orderId (고르게 분산)'],
        ['date', 'date (오늘 날짜에 몰림)'],
      ]),
      choice('capacity', '용량 모드', 'ondemand', [
        ['ondemand', '온디맨드'],
        ['provisioned', '프로비저닝 (WCU 10)'],
      ]),
    ],
    run: store('query', '쿼리', 'DynamoDB'),
  },

  // 컨테이너·CI/CD
  repo: {
    label: 'GitHub 저장소',
    ports: [port('out', 'code', 'code')],
    settings: [
      choice('commit', '커밋', 'v2', [
        ['v1', 'v1'],
        ['v2', 'v2 (최신)'],
      ]),
    ],
    run: (ctx) => {
      const commit = String(setting(ctx.node, 'commit'));
      ctx.emit(datum('code', '커밋 ' + commit, { commit }));
      return '커밋 ' + josa(commit, '을/를') + ' 내보냈습니다.';
    },
  },
  build: {
    label: 'GitHub Actions',
    ports: [port('in', 'code', 'code'), port('out', 'image', 'image')],
    settings: [
      choice('test', '테스트 단계', 'on', [
        ['on', '테스트 통과 후 빌드'],
        ['off', '테스트 없이 빌드'],
      ]),
    ],
    run: (ctx) => {
      const code = received(ctx.inputs, 'code')[0];
      if (!code) throw new Error('빌드할 소스 코드가 없습니다.');
      const tag = 'app:' + String(code.data.commit);
      ctx.emit(datum('image', tag, { tag, commit: code.data.commit }));
      return (
        '커밋 ' + String(code.data.commit) + '을 빌드해 ' + josa(tag, '을/를') + ' 만들었습니다.'
      );
    },
  },
  ecr: {
    label: 'ECR',
    ports: [
      port('in', 'image', 'image', false, '푸시'),
      port('out', 'image', 'image', false, '풀'),
    ],
    settings: [
      choice('tag', '보관 중인 태그', 'v1', [
        ['v1', 'app:v1'],
        ['v2', 'app:v2'],
      ]),
    ],
    run: (ctx) => {
      const pushed = received(ctx.inputs, 'image')[0];
      const tag = pushed ? String(pushed.data.tag) : 'app:' + String(setting(ctx.node, 'tag'));
      ctx.emit(datum('image', tag, { tag }));
      return (pushed ? '푸시된 ' : '보관 중인 ') + josa(tag, '을/를') + ' 내보냈습니다.';
    },
  },

  // 메시징
  sqs: {
    label: 'SQS 큐',
    ports: [
      port('in', 'message', 'message', true),
      port('out', 'message', 'message', false, '소비자'),
    ],
    settings: [
      choice('type', '큐 유형', 'standard', [
        ['standard', '표준 (최소 1회 · 순서 보장 안 함)'],
        ['fifo', 'FIFO (정확히 1회 · 순서 보장)'],
      ]),
      choice('visibility', '가시성 제한 시간', '30', [
        ['30', '30초'],
        ['5', '5초 (처리 시간보다 짧음)'],
      ]),
    ],
    run: (ctx) => {
      const items = received(ctx.inputs, 'message');
      if (!items.length) throw new Error('메시지 입력이 없습니다.');
      const count = items.reduce((sum, item) => sum + Number(item.data.count ?? 1), 0);
      const total = Math.max(count, ...items.map((item) => Number(item.data.total ?? 0)));
      ctx.emit(datum('message', '메시지 ' + count + '건', { count, total }));
      return '메시지 ' + count + '건을 대기열에 넣고 소비자에게 전달했습니다.';
    },
  },
  sns: {
    label: 'SNS 주제',
    ports: [
      port('in', 'message', 'message', true),
      port('out', 'message', 'message', false, '구독자'),
    ],
    run: (ctx) => {
      const items = received(ctx.inputs, 'message');
      if (!items.length) throw new Error('게시할 메시지가 없습니다.');
      const count = items.reduce((sum, item) => sum + Number(item.data.count ?? 1), 0);
      const subscribers = fanOut(ctx, 'out-message');
      if (!subscribers) throw new Error('구독자가 없습니다. 큐나 함수를 구독자로 연결하세요.');
      const total = Math.max(count, ...items.map((item) => Number(item.data.total ?? 0)));
      ctx.emit(datum('message', '메시지 ' + count + '건', { count, total }));
      return '메시지 ' + count + '건을 구독자 ' + subscribers + '곳에 똑같이 보냈습니다.';
    },
  },
  kinesis: {
    label: 'Kinesis Data Streams',
    ports: [port('in', 'event', 'event', true), port('out', 'event', 'event')],
    settings: [num('shards', '샤드 수', 1, 1, 4, '샤드 하나는 초당 1,000건까지 받습니다.')],
    run: (ctx) => {
      const items = received(ctx.inputs, 'event');
      if (!items.length) throw new Error('이벤트 입력이 없습니다.');
      const count = items.reduce((sum, item) => sum + Number(item.data.count ?? 1), 0);
      ctx.emit(datum('event', '스트림 레코드 ' + count + '건', { count, source: 'kinesis' }));
      return '레코드 ' + count + '건을 스트림에 기록했습니다.';
    },
  },
  eventbridge: {
    label: 'EventBridge 일정',
    ports: [port('out', 'event', 'event')],
    settings: [
      choice('schedule', '일정', '5m', [
        ['5m', '5분마다'],
        ['1d', '매일 0시'],
      ]),
    ],
    run: (ctx) => {
      ctx.emit(datum('event', '예약 이벤트 1건', { count: 1, source: 'schedule' }));
      return '정해진 일정에 이벤트를 보냈습니다.';
    },
  },

  // 관측
  cloudwatch: {
    label: 'CloudWatch',
    ports: [
      port('in', 'metric', 'metric', true),
      port('out', 'metric', 'metric', false, '대시보드'),
    ],
    settings: [num('threshold', '경보 기준 (요청 수)', 500, 1, 5000)],
    run: (ctx) => {
      const items = received(ctx.inputs, 'metric');
      if (!items.length) throw new Error('수집할 지표가 없습니다.');
      if (connected(ctx, 'out-metric'))
        ctx.emit(
          datum('metric', '대시보드 · 지표 ' + items.length + '종', {
            source: ctx.node.name,
            via: ctx.node.kind,
            sources: items.map((item) => String(item.data.source)),
            requests: Math.max(0, ...items.map((item) => Number(item.data.requests ?? 0))),
          }),
          'out-metric',
        );
      return '지표 ' + items.length + '종을 수집했습니다.';
    },
  },
  prometheus: {
    label: 'Prometheus',
    ports: [
      port('in', 'metric', 'metric', true),
      port('out', 'metric', 'metric', false, '대시보드'),
    ],
    settings: [
      choice('interval', '스크랩 간격', '15', [
        ['15', '15초'],
        ['60', '60초'],
      ]),
    ],
    run: (ctx) => {
      const items = received(ctx.inputs, 'metric');
      if (!items.length) throw new Error('스크랩할 대상이 없습니다.');
      if (connected(ctx, 'out-metric'))
        ctx.emit(
          datum('metric', '대시보드 · 지표 ' + items.length + '종', {
            source: ctx.node.name,
            via: ctx.node.kind,
            sources: items.map((item) => String(item.data.source)),
            requests: Math.max(0, ...items.map((item) => Number(item.data.requests ?? 0))),
          }),
          'out-metric',
        );
      return '대상 ' + items.length + '곳의 지표를 당겨 왔습니다(Pull).';
    },
  },
};

/** 서비스별로 만들 수 있는 노드. */
export const awsTools: Record<Kind, readonly Kind[]> = {
  internet: ['user'],
  edge: ['route53', 'cloudfront'],
  vpc: ['subnet', 'igw', 'alb'],
  subnet: ['ec2', 'asg', 'rds', 'ecs'],
  storage: ['s3', 'dynamodb'],
  containers: ['ecr'],
  messaging: ['sqs', 'sns', 'kinesis', 'eventbridge'],
  serverless: ['apigw', 'lambda'],
  monitoring: ['cloudwatch', 'prometheus'],
  cicd: ['repo', 'build'],
};
/** 최상위에 둘 수 있는 서비스. 서브넷은 VPC 안에만 둔다. */
export const topServices = Object.keys(awsTools).filter((kind) => kind !== 'subnet');

type Parts = Pick<
  LabConfig,
  | 'labels'
  | 'materials'
  | 'portTypes'
  | 'managedPorts'
  | 'settingSpecs'
  | 'strategies'
  | 'tools'
  | 'resourceDefaults'
>;
/**
 * 고른 종류로 LabConfig의 공통 부분을 만든다.
 * custom으로 실습에만 쓰는 종류(시작·도착 등)를 더하거나 공통 종류를 바꿀 수 있다.
 */
export function fromAws(pick: {
  kinds: readonly Kind[];
  tools?: Record<Kind, readonly Kind[]>;
  custom?: Record<Kind, AwsKind>;
  root?: readonly Kind[];
}): Parts {
  const all: Record<Kind, AwsKind> = {
    root: awsKinds.root,
    ...Object.fromEntries(pick.kinds.map((kind) => [kind, awsKinds[kind]])),
    ...pick.custom,
  };
  const labels: Parts['labels'] = {};
  const portTypes: Parts['portTypes'] = {};
  const managedPorts: Record<Kind, string[]> = {};
  const settingSpecs: Record<Kind, readonly SettingSpec[]> = {};
  const strategies: Parts['strategies'] = {};
  const ports: Record<Kind, PortSpec[]> = {};
  for (const [kind, def] of Object.entries(all)) {
    if (!def) throw new Error('카탈로그에 없는 종류입니다: ' + kind);
    labels[kind] = def.label;
    const list = def.ports ?? [];
    const ins = [...new Set(list.filter((p) => p.direction === 'in').map((p) => p.material))];
    const outs = [...new Set(list.filter((p) => p.direction === 'out').map((p) => p.material))];
    portTypes[kind] = { in: ins, out: outs };
    managedPorts[kind] = [...ins, ...outs];
    if (def.ports) ports[kind] = def.ports;
    if (def.settings) settingSpecs[kind] = def.settings;
    if (def.run) strategies[kind] = withRules(kind, def.run);
  }
  const services = Object.keys(all).filter((kind) => all[kind].service && kind !== 'root');
  const tools = pick.tools ?? awsTools;
  return {
    labels,
    materials: awsMaterials,
    portTypes,
    managedPorts,
    settingSpecs,
    strategies,
    tools: {
      root: pick.root ?? services.filter((kind) => kind !== 'subnet'),
      ...Object.fromEntries(
        services.map((kind) => [kind, (tools[kind] ?? []).filter((k) => k in all)]),
      ),
    },
    resourceDefaults: (kind) => (ports[kind] ? { ports: ports[kind] } : {}),
  };
}
