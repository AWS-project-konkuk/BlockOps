import { describe, expect, it } from 'vitest';
import { applyCommand, type Command } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import type { Connection, Graph, LabConfig, SettingValue } from '../src/systemLab/lab';
import { labConfigs, labFor } from '../src/systemLab/labs';
import { parseSaved } from '../src/systemLab/store';

/** 단원 종합 실습을 학습자가 푸는 순서대로 따라가며 실패와 해결을 확인한다. */
const lab = (id: string) => labFor(id)!;
const apply = (config: LabConfig, graph: Graph, ...commands: Command[]) =>
  commands.reduce((next, command) => applyCommand(next, command, config), graph);
const connect = (edges: Connection[]): Command[] =>
  edges.map((edge) => ({ type: 'connect', edge }));
const disconnect = (...edges: Connection[]): Command => ({
  type: 'disconnect',
  ids: edges.map((edge) => edge.id),
});
const set = (id: string, key: string, value: SettingValue): Command => ({
  type: 'setting',
  id,
  key,
  value,
});
const run = (config: LabConfig, graph: Graph) => runLab(graph, 'test', config);
const metric = (result: ReturnType<typeof run>, label: string) =>
  result.metrics.find((item) => item.label === label)?.value;

export { apply, connect, disconnect, set, run, metric, lab };

describe('1단원 · 비공개 S3를 CloudFront로 배포하기', () => {
  const config = lab('cdn-workflow');
  it('버킷에 바로 요청하면 막히고, CloudFront로 바꾸면 예전 파일 문제를 만난 뒤 해결한다', () => {
    let graph = config.initial();
    let result = run(config, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toEqual(['s3-blocked']);
    graph = apply(
      config,
      graph,
      disconnect(graph.connections.find((e) => e.from.node === 'start')!),
      ...connect(config.starterTasks),
    );
    result = run(config, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toEqual(['stale-cache']);
    graph = apply(config, graph, set('cdn', 'deploy', 'versioned'));
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(metric(result, '받은 응답')).toBe('100건');
    expect(metric(result, '캐시 응답')).toBe('90건');
  });
});

describe('단원 종합 실습 공통', () => {
  it('초기 그래프와 관찰을 저장 형식으로 복원한다', () => {
    for (const id of Object.keys(labConfigs)) {
      const config = lab(id);
      const graph = config.initial();
      const restored = parseSaved(
        JSON.stringify({ version: 1, graph, quiz: false, proof: null, observed: [] }),
        config,
      );
      expect(restored.graph, id).toEqual(graph);
    }
  });
});

describe('2단원 · 퍼블릭 서브넷의 웹 서버에 닿게 하기', () => {
  const config = lab('network-workflow');
  it('라우팅 경로와 보안 그룹을 차례로 고쳐 100건에 응답한다', () => {
    let graph = apply(config, config.initial(), ...connect(config.starterTasks));
    let result = run(config, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toEqual(['no-public-route']);
    graph = apply(config, graph, set('public', 'route', 'igw'));
    result = run(config, graph);
    expect(result.observations).toEqual(['sg-blocked']);
    graph = apply(config, graph, set('web', 'sg', '443'));
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(metric(result, '받은 응답')).toBe('100건');
    graph = apply(config, graph, set('web', 'publicIp', 'no'));
    expect(run(config, graph).observations).toEqual(['no-public-ip']);
  });
});

describe('3단원 · 트래픽 급증과 가용 영역 장애', () => {
  const config = lab('ha-workflow');
  it('헬스 체크와 조정 정책을 고치고 Multi-AZ로 DB 장애를 버틴다', () => {
    let graph = apply(config, config.initial(), ...connect(config.starterTasks));
    let result = run(config, graph);
    expect(result.observations).toEqual(['health-failed']);
    graph = apply(config, graph, set('lb', 'health', '/health'));
    result = run(config, graph);
    expect(result.observations).toEqual(['overload']);
    expect(result.message).toContain('800건이 실패');
    graph = apply(config, graph, set('group', 'policy', 'target'), set('group', 'max', 10));
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('scaled-out');
    expect(metric(result, '받은 응답')).toBe('1000건');
    graph = apply(config, graph, set('vpc', 'outage', 'c'));
    result = run(config, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('az-outage');
    graph = apply(config, graph, set('db', 'multiAz', 'on'));
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(result.observations).toContain('db-failover');
  });
});

describe('4단원 · 주문 이벤트를 큐와 주제로 나눠 처리하기', () => {
  const config = lab('decoupling-workflow');
  it('Fan-out으로 메일 발송을 더하고 FIFO로 중복 차감을 없앤다', () => {
    let graph = config.initial();
    let result = run(config, graph);
    expect(result.success).toBe(false);
    expect(result.observations).toContain('no-fanout');
    graph = apply(
      config,
      graph,
      disconnect(graph.connections.find((e) => e.from.node === 'order')!),
      ...connect(config.starterTasks),
    );
    result = run(config, graph);
    expect(result.success).toBe(false);
    expect(result.message).toContain('중복 차감');
    expect(result.observations).toContain('duplicate-delivery');
    graph = apply(config, graph, set('stockQueue', 'type', 'fifo'));
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(metric(result, '중복 차감')).toBe('0건');
    expect(metric(result, '메일 발송')).toBe('100건');
  });
});

describe('5단원 · 빌드한 이미지를 ECS로 서비스하기', () => {
  const config = lab('container-workflow');
  it('외부 경로와 태스크 역할을 고쳐 이미지를 받아 응답한다', () => {
    let graph = apply(config, config.initial(), ...connect(config.starterTasks));
    let result = run(config, graph);
    expect(result.observations).toEqual(['image-pull-failed']);
    graph = apply(config, graph, set('app', 'route', 'nat'));
    result = run(config, graph);
    expect(result.observations).toEqual(['shared-role']);
    graph = apply(config, graph, set('api', 'role', 'task'));
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(result.steps.find((s) => s.node === 'api')?.message).toContain('app:v2');
  });
});

describe('6단원 · 서버 없이 주문 API 만들기', () => {
  const config = lab('serverless-workflow');
  it('날짜 파티션 키의 쓰기 몰림을 고르게 퍼지는 키로 고친다', () => {
    let graph = apply(config, config.initial(), ...connect(config.starterTasks));
    let result = run(config, graph);
    expect(result.observations).toEqual(['hot-partition']);
    expect(result.success).toBe(false);
    graph = apply(config, graph, set('orders', 'key', 'orderId'));
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(metric(result, '받은 응답')).toBe('100건');
  });
});

describe('7단원 · 컨테이너와 함수의 지표를 한곳에서 보기', () => {
  const config = lab('observe-workflow');
  it('Lambda 지표를 CloudWatch로 옮겨 두 대시보드에서 모두 본다', () => {
    let graph = config.initial();
    let result = run(config, graph);
    expect(result.observations).toEqual(['pull-mismatch']);
    graph = apply(
      config,
      graph,
      disconnect(graph.connections.find((e) => e.from.node === 'settle')!),
      ...connect(config.starterTasks),
    );
    result = run(config, graph);
    expect(result.success).toBe(true);
    expect(metric(result, '대시보드')).toBe('앱 지표 수집, 서비스 지표');
  });
});

describe('8단원 · 주문 서비스 장애 진단하기', () => {
  const config = lab('capstone-workflow');
  it('헬스 체크·리스너·이미지 경로를 차례로 고쳐 주문을 DB에 넣는다', () => {
    let graph = config.initial();
    const steps: string[][] = [];
    for (const fix of [
      set('lb', 'health', '/health'),
      set('lb', 'listener', 'https'),
      set('app', 'route', 'nat'),
    ]) {
      steps.push(run(config, graph).observations);
      graph = apply(config, graph, fix);
    }
    expect(steps[0]).toContain('health-failed');
    expect(steps[1]).toContain('listener-mismatch');
    expect(steps[2]).toEqual(['image-pull-failed']);
    const result = run(config, graph);
    expect(result.success).toBe(true);
    expect(metric(result, '받은 응답')).toBe('100건');
  });
});
