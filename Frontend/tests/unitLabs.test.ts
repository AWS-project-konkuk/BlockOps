import { describe, expect, it } from 'vitest';
import { applyCommand, type Command } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import type { Connection, Graph, LabConfig, SettingValue } from '../src/systemLab/lab';
import { labFor } from '../src/systemLab/labs';
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
    for (const id of ['cdn-workflow', 'network-workflow']) {
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
