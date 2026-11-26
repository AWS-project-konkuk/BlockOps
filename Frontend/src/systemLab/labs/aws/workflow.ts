import { rootId, type Connection, type Graph, type Kind, type LabConfig } from '../../lab';
import { defineLab, layout, port, received, setting } from '../kit';
import { awsKinds, awsMaterials, fromAws, type AwsKind } from './catalog';
import { awsToolPosition } from './layout';
import { request } from './request';
import { awsObservations } from './rules';

/** 단원 실습의 시작 노드. 설정한 요청을 보낸다. 설정은 사용자 노드와 같다. */
export const userStart = (label = '사용자'): AwsKind => ({
  ...awsKinds.user,
  label,
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
});

/** 단원 실습의 도착 노드. 받은 응답을 세어 모든 요청이 응답을 받았는지 확인한다. */
export const responseEnd = (label = '응답 확인'): AwsKind => ({
  label,
  ports: [port('in', 'response', 'response', true)],
  run: (ctx) => {
    const responses = received(ctx.inputs, 'response');
    if (!responses.length)
      throw new Error('도착한 응답이 없습니다. 요청을 처리한 노드의 응답을 연결하세요.');
    const answered = responses.reduce((sum, item) => sum + Number(item.data.count ?? 0), 0);
    const total = Math.max(...responses.map((item) => Number(item.data.total ?? 0)));
    const cached = responses
      .filter((item) => item.data.cache)
      .reduce((sum, item) => sum + Number(item.data.count ?? 0), 0);
    const ok = Math.min(answered, total);
    ctx.report([
      { label: '보낸 요청', value: total + '건' },
      { label: '받은 응답', value: ok + '건' },
      ...(cached ? [{ label: '캐시 응답', value: cached + '건' }] : []),
      {
        label: '응답한 곳',
        value: [...new Set(responses.map((item) => String(item.data.from)))].join(', '),
      },
    ]);
    if (ok < total)
      throw new Error('요청 ' + total + '건 중 ' + (total - ok) + '건이 응답을 받지 못했습니다.');
    return '요청 ' + total + '건이 모두 응답을 받았습니다.';
  },
});

interface Setup {
  id: string;
  /** 이 실습에서 쓰는 카탈로그 종류(서비스와 리소스). */
  kinds: readonly Kind[];
  /** 서비스별로 열어 둘 노드. 없으면 카탈로그 기본값에서 실습 종류만 남긴다. */
  tools?: Record<Kind, readonly Kind[]>;
  /** 실습에서만 쓰는 종류. 카탈로그 종류를 덮어쓸 수도 있다. */
  custom?: Record<Kind, AwsKind>;
  /** 실습에서만 쓰는 자료 타입. */
  materials?: Record<string, string>;
  start?: AwsKind;
  end?: AwsKind;
  initial: (tools: ReturnType<typeof layout>) => Graph;
  starterTasks: Connection[];
  /** 지울 수 없는 노드. */
  required: string[];
  /** 완료에 필요한 관찰 태그. 설명이 없으면 규칙의 기본 설명을 쓴다. */
  observations: readonly string[] | Record<string, string>;
}

/** AWS 카탈로그로 단원 실습을 만든다. 시작은 사용자, 도착은 응답 확인이 기본이다. */
export function defineAwsLab(setup: Setup): LabConfig {
  const observations = Array.isArray(setup.observations)
    ? Object.fromEntries(setup.observations.map((tag) => [tag, awsObservations[tag] ?? tag]))
    : (setup.observations as Record<string, string>);
  const parts = fromAws({
    kinds: setup.kinds,
    tools: setup.tools,
    custom: { ...setup.custom, start: setup.start ?? userStart(), end: setup.end ?? responseEnd() },
  });
  const lab: LabConfig = defineLab({
    ...parts,
    materials: { ...awsMaterials, ...setup.materials },
    toolPosition: awsToolPosition,
    id: setup.id,
    storageKey: 'blockops:system-lab:' + setup.id + ':v1',
    initial: () => {
      const make = layout(lab);
      const graph = setup.initial(make);
      const root = make.system('root', rootId, '', { x: 0, y: 0 }, 0, 0);
      return { ...graph, entities: [root, ...graph.entities] };
    },
    starterTasks: setup.starterTasks,
    requiredNodeIds: new Set(['start', ...setup.required, 'end']),
    requiredObservations: Object.keys(observations),
    observationLabels: { ...awsObservations, ...observations },
  });
  return lab;
}
