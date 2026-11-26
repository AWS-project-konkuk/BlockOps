import { describe, expect, it } from 'vitest';
import { applyCommand, size } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import { absolute, signature, type Graph, type SettingValue } from '../src/systemLab/lab';
import { labConfigs, labFor, playgroundLab as lab } from '../src/systemLab/labs';
import { wired } from '../src/systemLab/labs/kit';
import { exampleWorkflows, examplePipeline } from '../src/systemLab/labs/playground-example';
import { playgroundTools } from '../src/systemLab/labs/playground';
import { playgroundView } from '../src/systemLab/labs/playground-view';
import { buildHintRequest, canRequestHint } from '../src/systemLab/hint';
import { parseSaved } from '../src/systemLab/store';

type Node = [id: string, kind: string, parent: string, settings?: Record<string, SettingValue>];
function build(nodes: Node[], wires: ReturnType<typeof wired>[] = []): Graph {
  let graph = lab.initial();
  for (const [id, kind, parent, settings] of nodes) {
    graph = applyCommand(graph, { type: 'add', id, kind, parent }, lab);
    for (const [key, value] of Object.entries(settings ?? {}))
      graph = applyCommand(graph, { type: 'setting', id, key, value }, lab);
  }
  return wires.reduce((next, edge) => applyCommand(next, { type: 'connect', edge }, lab), graph);
}
const run = (graph: Graph) => runLab(graph, 'test', lab);
const roundTrip = (graph: Graph) =>
  parseSaved(JSON.stringify({ version: 1, graph, quiz: false, proof: null, observed: [] }), lab)
    .graph;

const web: Node[] = [
  ['user', 'user', 'internet', { traffic: '100' }],
  ['gw', 'igw', 'vpc'],
  ['lb', 'alb', 'vpc'],
  ['a', 'ec2', 'public'],
  ['b', 'ec2', 'public'],
  ['db', 'rds', 'private'],
];
const webWires = [
  wired('user', 'request', 'gw', 'request'),
  wired('gw', 'request', 'lb', 'request'),
  wired('lb', 'request', 'a', 'request'),
  wired('lb', 'request', 'b', 'request'),
  wired('a', 'query', 'db', 'query'),
  wired('b', 'query', 'db', 'query'),
];

describe('플레이그라운드 구성', () => {
  it('강의 완료 집계에는 넣지 않고 labFor로만 찾는다', () => {
    expect(labFor('playground')).toBe(lab);
    expect(Object.keys(labConfigs)).not.toContain('playground');
    expect(lab.freeform).toBe(true);
  });

  it('서비스와 노드가 모두 정의·설명·아이콘을 갖는다', () => {
    for (const [service, kinds] of Object.entries(playgroundTools)) {
      expect(lab.tools[service], service).toEqual(kinds);
      for (const name of [service, ...kinds]) {
        expect(lab.labels[name], name).toBeTruthy();
        expect(playgroundView.icons[name], name).toBeTruthy();
        expect(playgroundView.hints[name], name).toBeTruthy();
      }
      for (const kind of kinds.filter((k) => !(k in playgroundTools)))
        expect(lab.strategies[kind], kind).toBeTypeOf('function');
    }
    for (const kind of Object.values(playgroundTools).flat())
      for (const direction of ['in', 'out'] as const)
        for (const material of lab.portTypes[kind][direction]) {
          expect(lab.materials[material], kind + ' ' + material).toBeTruthy();
          expect(playgroundView.tones[material], material).toBeTruthy();
        }
  });

  it('서브넷은 VPC 안에만, 리소스는 서비스 안에만 만들 수 있다', () => {
    expect(lab.tools.root).not.toContain('subnet');
    expect(() =>
      applyCommand(lab.initial(), { type: 'add', id: 'x', kind: 'subnet', parent: 'root' }, lab),
    ).toThrow();
    expect(() =>
      applyCommand(lab.initial(), { type: 'add', id: 'x', kind: 'ec2', parent: 'vpc' }, lab),
    ).toThrow();
    const initial = lab.initial();
    expect(initial.entities.filter((e) => e.kind === 'subnet').map((e) => e.parent)).toEqual([
      'vpc',
      'vpc',
    ]);
    expect(initial.entities.filter((e) => e.type === 'resource')).toHaveLength(0);
  });

  it('VPC에 새 서브넷과 리소스를 추가해도 기존 서브넷과 겹치지 않는다', () => {
    let graph = lab.initial();
    graph = applyCommand(graph, { type: 'add', id: 'third', kind: 'subnet', parent: 'vpc' }, lab);
    graph = applyCommand(graph, { type: 'add', id: 'gw', kind: 'igw', parent: 'vpc' }, lab);
    graph = applyCommand(graph, { type: 'add', id: 'lb', kind: 'alb', parent: 'vpc' }, lab);
    const children = graph.entities.filter((e) => e.parent === 'vpc');
    for (const a of children)
      for (const b of children) {
        if (a === b) continue;
        const [pa, pb] = [absolute(graph, a), absolute(graph, b)];
        const [sa, sb] = [size(a), size(b)];
        const overlap =
          pa.x < pb.x + sb.width &&
          pb.x < pa.x + sa.width &&
          pa.y < pb.y + sb.height &&
          pb.y < pa.y + sa.height;
        expect(overlap, a.id + ' · ' + b.id).toBe(false);
      }
  });

  it('구성을 저장 형식으로 다시 읽을 수 있다', () => {
    const graph = build(web, webWires);
    expect(signature(roundTrip(graph))).toBe(signature(graph));
  });
});

describe('플레이그라운드 실행', () => {
  it('연결이 없으면 실행하지 않고 안내한다', () => {
    const result = run(build([['user', 'user', 'internet']]));
    expect(result.success).toBe(false);
    expect(result.steps).toHaveLength(0);
    expect(result.message).toContain('연결');
  });

  it('ALB는 요청을 대상 수로 나누고 연결된 노드가 모두 실행된다', () => {
    const result = run(build(web, webWires));
    expect(result.success).toBe(true);
    expect(result.steps).toHaveLength(web.length);
    const lb = result.steps.find((step) => step.node === 'lb')!;
    expect(lb.transfers.map((transfer) => transfer.description)).toEqual([
      'HTTPS 요청 50건',
      'HTTPS 요청 50건',
    ]);
  });

  it('연결하지 않은 노드는 실행 대상에서 빠진다', () => {
    const graph = build([...web, ['spare', 'ec2', 'private']], webWires);
    expect(run(graph).steps.some((step) => step.node === 'spare')).toBe(false);
  });

  it('SNS는 구독자마다 같은 메시지를 보낸다', () => {
    const graph = build(
      [
        ['user', 'user', 'internet', { traffic: '10' }],
        ['gw', 'igw', 'vpc'],
        ['web', 'ec2', 'public'],
        ['topic', 'sns', 'messaging'],
        ['q1', 'sqs', 'messaging'],
        ['q2', 'sqs', 'messaging'],
      ],
      [
        wired('user', 'request', 'gw', 'request'),
        wired('gw', 'request', 'web', 'request'),
        wired('web', 'message', 'topic', 'message'),
        wired('topic', 'message', 'q1', 'message'),
        wired('topic', 'message', 'q2', 'message'),
      ],
    );
    const result = run(graph);
    expect(result.success).toBe(true);
    for (const id of ['q1', 'q2'])
      expect(result.steps.find((step) => step.node === id)?.message).toContain('메시지 10건');
  });
});

describe('플레이그라운드 AI 조언', () => {
  const nodes: Node[] = [
    ['user', 'user', 'internet'],
    ['gw', 'igw', 'vpc'],
    ['app', 'ecs', 'private'],
  ];
  const wires = [
    wired('user', 'request', 'gw', 'request'),
    wired('gw', 'request', 'app', 'request'),
  ];

  it('실패한 실행에서만 요청할 수 있고 요청에 구성이 담긴다', () => {
    const graph = build(nodes, wires);
    const result = run(graph);
    expect(result.success).toBe(false);
    const state = { result, stamp: signature(graph), cursor: result.steps.length, stopped: false };
    expect(canRequestHint('playground', graph, state)).toBe(true);
    const fixed = build(
      [...nodes, ['registry', 'ecr', 'containers']],
      [...wires, wired('registry', 'image', 'app', 'image')],
    );
    const ok = run(fixed);
    expect(ok.success).toBe(true);
    expect(
      canRequestHint('playground', fixed, { ...state, result: ok, cursor: ok.steps.length }),
    ).toBe(false);
    const request = buildHintRequest(
      { id: 'playground', title: 't', scenario: 's', summary: 'u' },
      graph,
      state,
    );
    expect(request.lessonId).toBe('playground');
    expect(request.ruleCheck.issues.join(' ')).toContain('이미지');
    expect(request.nodes.some((node) => node.kind === 'ecs' && node.id === 'app')).toBe(true);
  });
});

describe('AWS 예시 5단계', () => {
  const levels = exampleWorkflows.map((example) => ({ example, graph: example.build() }));
  const nodeCount = (graph: Graph) => graph.entities.filter((e) => e.type === 'resource').length;

  it('5개이며 단계가 올라갈수록 노드와 연결이 늘어난다', () => {
    expect(levels.map(({ example }) => example.id)).toEqual([
      'level-1',
      'level-2',
      'level-3',
      'level-4',
      'level-5',
    ]);
    for (let i = 1; i < levels.length; i++) {
      expect(nodeCount(levels[i].graph)).toBeGreaterThan(nodeCount(levels[i - 1].graph));
      expect(levels[i].graph.connections.length).toBeGreaterThan(
        levels[i - 1].graph.connections.length,
      );
    }
  });

  it('노드가 없는 서비스는 두지 않고 빠진 서비스는 다시 추가할 수 있다', () => {
    for (const { example, graph } of levels) {
      const services = graph.entities.filter((e) => e.type === 'system' && e.parent === 'root');
      const top = (id: string): string => {
        const entity = graph.entities.find((e) => e.id === id)!;
        return entity.parent === 'root' ? id : top(entity.parent);
      };
      for (const service of services)
        expect(
          graph.entities.some((e) => e.type === 'resource' && top(e.id) === service.id),
          example.title + ' · ' + service.id,
        ).toBe(true);
    }
    const first = levels[0].graph;
    expect(first.entities.some((e) => e.id === 'vpc')).toBe(false);
    const added = applyCommand(first, { type: 'add', id: 'vpc', kind: 'vpc', parent: 'root' }, lab);
    expect(added.entities.some((e) => e.id === 'vpc')).toBe(true);
  });

  it('모든 단계가 오류 없이 끝까지 실행된다', () => {
    for (const { example, graph } of levels) {
      const result = run(graph);
      const failed = result.steps.filter((s) => s.status !== 'success');
      expect(
        failed.map((s) => s.node + ': ' + s.message),
        example.title,
      ).toEqual([]);
      expect(result.success, example.title).toBe(true);
      expect(result.steps, example.title).toHaveLength(nodeCount(graph));
    }
  });

  it('최상위 서비스끼리 겹치지 않고 저장 형식으로 다시 읽을 수 있다', () => {
    for (const { example, graph } of levels) {
      const services = graph.entities.filter((e) => e.type === 'system' && e.parent === 'root');
      for (const a of services)
        for (const b of services) {
          if (a === b) continue;
          const overlap =
            a.position.x < b.position.x + size(b).width &&
            b.position.x < a.position.x + size(a).width &&
            a.position.y < b.position.y + size(b).height &&
            b.position.y < a.position.y + size(a).height;
          expect(overlap, example.title + ' · ' + a.id + ' · ' + b.id).toBe(false);
        }
      expect(signature(roundTrip(graph))).toBe(signature(graph));
    }
    expect(signature(examplePipeline())).toBe(signature(levels[4].graph));
  });
});
