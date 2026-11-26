import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import type { Graph, SettingValue } from '../src/systemLab/lab';
import { playgroundLab as lab } from '../src/systemLab/labs';
import { awsObservations } from '../src/systemLab/labs/aws/rules';
import { wired } from '../src/systemLab/labs/kit';

type Node = [id: string, kind: string, parent: string, settings?: Record<string, SettingValue>];
type Change = [id: string, settings: Record<string, SettingValue>];
function build(nodes: Node[], wires: ReturnType<typeof wired>[], changes: Change[] = []): Graph {
  let graph = lab.initial();
  for (const [id, kind, parent, settings] of nodes) {
    graph = applyCommand(graph, { type: 'add', id, kind, parent }, lab);
    for (const [key, value] of Object.entries(settings ?? {}))
      graph = applyCommand(graph, { type: 'setting', id, key, value }, lab);
  }
  for (const [id, settings] of changes)
    for (const [key, value] of Object.entries(settings))
      graph = applyCommand(graph, { type: 'setting', id, key, value }, lab);
  return wires.reduce((next, edge) => applyCommand(next, { type: 'connect', edge }, lab), graph);
}
const run = (graph: Graph) => runLab(graph, 'test', lab);
const failure = (graph: Graph) => {
  const result = run(graph);
  return { result, message: result.success ? '' : result.message };
};

const direct = (ec2: Record<string, SettingValue> = {}, user: Record<string, SettingValue> = {}) =>
  build(
    [
      ['user', 'user', 'internet', user],
      ['gw', 'igw', 'vpc'],
      ['web', 'ec2', 'public', ec2],
    ],
    [wired('user', 'request', 'gw', 'request'), wired('gw', 'request', 'web', 'request')],
  );

describe('0·2단원 · EC2 접속과 네트워크 경로', () => {
  it('퍼블릭 서브넷·퍼블릭 IP·보안 그룹 443이 맞으면 접속한다', () => {
    expect(run(direct()).success).toBe(true);
  });
  it('퍼블릭 IP가 없으면 접속하지 못한다', () => {
    const { result, message } = failure(direct({ publicIp: 'no' }));
    expect(message).toContain('퍼블릭 IP');
    expect(result.observations).toContain('no-public-ip');
  });
  it('보안 그룹이 22번만 허용하면 HTTPS 요청이 막힌다', () => {
    const { result, message } = failure(direct({ sg: '22' }));
    expect(message).toContain('443번 포트 요청이 막혔습니다');
    expect(result.observations).toContain('sg-blocked');
    expect(run(direct({ sg: '80' }, { protocol: 'http' })).success).toBe(true);
  });
  it('라우팅 테이블에 인터넷 게이트웨이 경로가 없으면 닿지 않는다', () => {
    const graph = applyCommand(
      direct(),
      { type: 'setting', id: 'public', key: 'route', value: 'none' },
      lab,
    );
    const { result, message } = failure(graph);
    expect(message).toContain('0.0.0.0/0');
    expect(result.observations).toContain('no-public-route');
  });
  it('보안 그룹이 허용해도 NACL이 거부하면 막힌다', () => {
    const graph = applyCommand(
      direct(),
      { type: 'setting', id: 'public', key: 'nacl', value: 'deny-web' },
      lab,
    );
    const { result, message } = failure(graph);
    expect(message).toContain('NACL');
    expect(result.observations).toContain('nacl-deny');
  });
  it('인스턴스 한 대는 요청 100건까지 처리한다', () => {
    const { result, message } = failure(direct({}, { traffic: '1000' }));
    expect(message).toContain('900건이 실패');
    expect(result.observations).toContain('overload');
  });
});

describe('1단원 · S3와 CloudFront', () => {
  const cdn = (s3: Record<string, SettingValue> = {}, cf: Record<string, SettingValue> = {}) =>
    build(
      [
        ['user', 'user', 'internet', { path: '/static/logo.png' }],
        ['cf', 'cloudfront', 'edge', cf],
        ['bucket', 's3', 'storage', s3],
      ],
      [wired('user', 'request', 'cf', 'request'), wired('cf', 'request', 'bucket', 'request')],
    );
  it('비공개 버킷과 CloudFront(OAC)는 동작하고 캐시가 대부분 응답한다', () => {
    const result = run(cdn());
    expect(result.success).toBe(true);
    expect(result.steps.find((s) => s.node === 'cf')?.message).toContain('캐시 적중 90%');
    expect(result.steps.find((s) => s.node === 'bucket')?.message).toContain('10건');
  });
  it('버킷을 공개하면 CloudFront를 우회할 수 있어 거부한다', () => {
    const { result, message } = failure(cdn({ access: 'public' }));
    expect(message).toContain('우회');
    expect(result.observations).toContain('s3-public');
  });
  it('비공개 버킷에 사용자가 바로 요청하면 막힌다', () => {
    const graph = build(
      [
        ['user', 'user', 'internet'],
        ['bucket', 's3', 'storage'],
      ],
      [wired('user', 'request', 'bucket', 'request')],
    );
    expect(failure(graph).message).toContain('퍼블릭 액세스 차단');
  });
  it('TTL 24시간에 무효화도 버전도 없으면 이전 파일이 보인다', () => {
    const { result, message } = failure(cdn({}, { deploy: 'none' }));
    expect(message).toContain('이전 파일');
    expect(result.observations).toContain('stale-cache');
    expect(run(cdn({}, { deploy: 'invalidate' })).success).toBe(true);
  });
  it('캐시 키에 쿼리·쿠키·헤더를 모두 넣으면 모두 오리진으로 간다', () => {
    const result = run(cdn({}, { cacheKey: 'all' }));
    expect(result.steps.find((s) => s.node === 'bucket')?.message).toContain('100건');
    expect(result.observations).toContain('cache-miss');
  });
});

describe('3단원 · ALB·Auto Scaling·RDS', () => {
  const fleet = (
    asg: Record<string, SettingValue> = {},
    user: Record<string, SettingValue> = {},
    rds: Record<string, SettingValue> = {},
    changes: Change[] = [],
  ) =>
    build(
      [
        ['user', 'user', 'internet', user],
        ['gw', 'igw', 'vpc'],
        ['lb', 'alb', 'vpc'],
        ['group', 'asg', 'private', asg],
        ['db', 'rds', 'private', rds],
      ],
      [
        wired('user', 'request', 'gw', 'request'),
        wired('gw', 'request', 'lb', 'request'),
        wired('lb', 'request', 'group', 'request'),
        wired('group', 'query', 'db', 'query'),
      ],
      changes,
    );
  it('ALB 뒤 프라이빗 서브넷의 Auto Scaling 그룹이 요청을 처리한다', () => {
    expect(run(fleet()).success).toBe(true);
  });
  it('트래픽이 몰리면 최대 수까지 늘리고, 최대를 넘으면 실패한다', () => {
    const scaled = run(fleet({ max: 10 }, { traffic: '1000' }, { replica: '1' }));
    expect(scaled.success).toBe(true);
    expect(scaled.observations).toContain('scaled-out');
    const { result, message } = failure(fleet({ max: 4 }, { traffic: '1000' }));
    expect(message).toContain('600건이 실패');
    expect(result.observations).toContain('overload');
    expect(failure(fleet({ policy: 'none' }, { traffic: '1000' })).message).toContain('실패');
  });
  it('헬스 체크 경로가 틀리면 대상이 모두 빠진다', () => {
    const graph = applyCommand(
      fleet(),
      { type: 'setting', id: 'lb', key: 'health', value: '/status' },
      lab,
    );
    expect(failure(graph).message).toContain('Unhealthy');
  });
  it('가용 영역 하나가 멈춰도 분산 배치와 Multi-AZ면 버틴다', () => {
    const outage: Change[] = [['vpc', { outage: 'c' }]];
    const single = failure(fleet({}, {}, {}, outage));
    expect(single.message).toContain('가용 영역');
    expect(single.result.observations).toContain('az-outage');
    // 서브넷이 c에 있으면 서브넷 자체가 멈추므로, 그룹은 a 서브넷에 두고 DB만 c에 남긴다.
    const graph = build(
      [
        ['user', 'user', 'internet'],
        ['gw', 'igw', 'vpc'],
        ['lb', 'alb', 'vpc'],
        ['group', 'asg', 'public'],
        ['db', 'rds', 'private', { multiAz: 'on' }],
      ],
      [
        wired('user', 'request', 'gw', 'request'),
        wired('gw', 'request', 'lb', 'request'),
        wired('lb', 'request', 'group', 'request'),
        wired('group', 'query', 'db', 'query'),
      ],
      outage,
    );
    const survived = run(graph);
    expect(survived.success).toBe(true);
    expect(survived.observations).toEqual(expect.arrayContaining(['az-survived', 'db-failover']));
  });
  it('한 가용 영역에만 둔 그룹은 그 영역이 멈추면 중단된다', () => {
    const graph = applyCommand(
      fleet({ spread: 'single' }),
      { type: 'setting', id: 'vpc', key: 'outage', value: 'a' },
      lab,
    );
    expect(failure(graph).message).toContain('한 가용 영역');
  });
  it('DB를 인터넷 경로가 있는 퍼블릭 서브넷에 두면 거부한다', () => {
    const graph = build(
      [
        ['user', 'user', 'internet'],
        ['gw', 'igw', 'vpc'],
        ['web', 'ec2', 'public'],
        ['db', 'rds', 'public'],
      ],
      [
        wired('user', 'request', 'gw', 'request'),
        wired('gw', 'request', 'web', 'request'),
        wired('web', 'query', 'db', 'query'),
      ],
    );
    const { result, message } = failure(graph);
    expect(message).toContain('프라이빗 서브넷');
    expect(result.observations).toContain('db-exposed');
  });
});

describe('4단원 · 큐와 데이터 저장', () => {
  const queue = (sqs: Record<string, SettingValue>) =>
    build(
      [
        ['user', 'user', 'internet'],
        ['gw', 'igw', 'vpc'],
        ['web', 'ec2', 'public'],
        ['q', 'sqs', 'messaging', sqs],
        ['fn', 'lambda', 'serverless'],
      ],
      [
        wired('user', 'request', 'gw', 'request'),
        wired('gw', 'request', 'web', 'request'),
        wired('web', 'message', 'q', 'message'),
        wired('q', 'message', 'fn', 'message'),
      ],
    );
  it('표준 큐는 중복 전달 가능성을 남기고 FIFO는 남기지 않는다', () => {
    const standard = run(queue({ type: 'standard' }));
    expect(standard.observations).toContain('duplicate-delivery');
    const fifo = run(queue({ type: 'fifo' }));
    expect(fifo.success).toBe(true);
    expect(fifo.observations).not.toContain('duplicate-delivery');
  });
  it('날짜를 파티션 키로 쓰면 한 파티션에 쓰기가 몰린다', () => {
    const graph = build(
      [
        ['api', 'user', 'internet', { path: '/api/orders' }],
        ['gw', 'apigw', 'serverless'],
        ['fn', 'lambda', 'serverless'],
        ['table', 'dynamodb', 'storage', { key: 'date', capacity: 'provisioned' }],
      ],
      [
        wired('api', 'request', 'gw', 'request'),
        wired('gw', 'event', 'fn', 'event'),
        wired('fn', 'query', 'table', 'query'),
      ],
    );
    const { result, message } = failure(graph);
    expect(message).toContain('한 파티션');
    expect(result.observations).toContain('hot-partition');
  });
});

describe('5단원 · 컨테이너', () => {
  const service = (ecs: Record<string, SettingValue> = {}, changes: Change[] = []) =>
    build(
      [
        ['user', 'user', 'internet'],
        ['gw', 'igw', 'vpc'],
        ['lb', 'alb', 'vpc'],
        ['app', 'ecs', 'private', ecs],
        ['registry', 'ecr', 'containers'],
      ],
      [
        wired('user', 'request', 'gw', 'request'),
        wired('gw', 'request', 'lb', 'request'),
        wired('lb', 'request', 'app', 'request'),
        wired('registry', 'image', 'app', 'image'),
      ],
      changes,
    );
  it('프라이빗 서브넷에 외부 경로가 없으면 이미지를 받지 못한다', () => {
    expect(run(service()).success).toBe(true);
    const { result, message } = failure(service({}, [['private', { route: 'none' }]]));
    expect(message).toContain('NAT');
    expect(result.observations).toContain('image-pull-failed');
  });
  it('Fargate에는 인스턴스 프로파일이 없다', () => {
    expect(failure(service({ role: 'instance' })).message).toContain('태스크 역할');
    const shared = run(service({ role: 'instance', launch: 'ec2' }));
    expect(shared.success).toBe(true);
    expect(shared.observations).toContain('shared-role');
  });
  it('태스크 수만큼 요청을 처리한다', () => {
    expect(failure(service({ tasks: 0 })).message).toContain('태스크가 없습니다');
  });
});

describe('6·7단원 · 서버리스와 관측', () => {
  it('Lambda 지표는 Prometheus Pull로 수집하지 않는다', () => {
    const graph = build(
      [
        ['api', 'user', 'internet'],
        ['gw', 'apigw', 'serverless'],
        ['fn', 'lambda', 'serverless'],
        ['prom', 'prometheus', 'monitoring'],
        ['cw', 'cloudwatch', 'monitoring'],
      ],
      [
        wired('api', 'request', 'gw', 'request'),
        wired('gw', 'event', 'fn', 'event'),
        wired('fn', 'metric', 'prom', 'metric'),
      ],
    );
    const { result, message } = failure(graph);
    expect(message).toContain('Push');
    expect(result.observations).toContain('pull-mismatch');
    const fixed = applyCommand(
      applyCommand(graph, { type: 'disconnect', ids: [graph.connections[2].id] }, lab),
      { type: 'connect', edge: wired('fn', 'metric', 'cw', 'metric') },
      lab,
    );
    expect(run(fixed).success).toBe(true);
  });
  it('Java 런타임은 콜드 스타트가 길다', () => {
    const graph = build(
      [
        ['api', 'user', 'internet'],
        ['gw', 'apigw', 'serverless'],
        ['fn', 'lambda', 'serverless', { runtime: 'java', memory: '128' }],
      ],
      [wired('api', 'request', 'gw', 'request'), wired('gw', 'event', 'fn', 'event')],
    );
    const result = run(graph);
    expect(result.observations).toContain('cold-start');
    expect(result.steps.find((s) => s.node === 'fn')?.message).toContain('3000ms');
  });
});

describe('규칙 관찰 태그', () => {
  it('모든 관찰 태그에 설명이 있다', () => {
    for (const label of Object.values(awsObservations)) expect(label).toBeTruthy();
  });
});
