import { applyCommand, size } from '../commands';
import { rootId, type Connection, type Graph, type SettingValue } from '../lab';
import { wired } from './kit';
import { placeServices, playgroundLab as lab } from './playground';

/**
 * 플레이그라운드의 AWS 예시 5단계. 단원 순서를 따라 쉬운 구성에서 시작해 서비스를 더한다.
 * 1 정적 웹 호스팅 → 2 웹 서버와 DB → 3 고가용성 → 4 디커플링 → 5 컨테이너·CI/CD·관측까지 전체.
 */
type Node = {
  id: string;
  kind: string;
  parent: string;
  name: string;
  settings?: Record<string, SettingValue>;
};
const nodes: Node[] = [
  {
    id: 'visitor',
    kind: 'user',
    parent: 'internet',
    name: '웹 방문자',
    settings: { path: '/static/logo.png' },
  },
  {
    id: 'shopper',
    kind: 'user',
    parent: 'internet',
    name: '쇼핑몰 사용자',
    settings: { path: '/api/orders' },
  },
  { id: 'dns', kind: 'route53', parent: 'edge', name: 'shop.example.com' },
  { id: 'cdn', kind: 'cloudfront', parent: 'edge', name: '정적 파일 배포' },
  { id: 'assets', kind: 's3', parent: 'storage', name: '정적 파일 버킷' },
  { id: 'orders', kind: 'dynamodb', parent: 'storage', name: '주문 테이블' },
  { id: 'gateway', kind: 'igw', parent: 'vpc', name: '인터넷 게이트웨이' },
  { id: 'lb', kind: 'alb', parent: 'vpc', name: '웹 ALB' },
  { id: 'web', kind: 'ec2', parent: 'public', name: '웹 서버', settings: { sg: '443' } },
  { id: 'fleet', kind: 'asg', parent: 'private', name: '웹 서버 그룹' },
  { id: 'app', kind: 'ecs', parent: 'private', name: '주문 API 서비스' },
  { id: 'db', kind: 'rds', parent: 'private', name: '상품 DB', settings: { multiAz: 'on' } },
  { id: 'topic', kind: 'sns', parent: 'messaging', name: '주문 완료 알림' },
  { id: 'mailQueue', kind: 'sqs', parent: 'messaging', name: '메일 발송 큐' },
  {
    id: 'stockQueue',
    kind: 'sqs',
    parent: 'messaging',
    name: '재고 차감 큐',
    settings: { type: 'fifo' },
  },
  {
    id: 'nightly',
    kind: 'eventbridge',
    parent: 'messaging',
    name: '매일 정산',
    settings: { schedule: '1d' },
  },
  { id: 'mailer', kind: 'lambda', parent: 'serverless', name: '메일 발송 함수' },
  { id: 'stock', kind: 'lambda', parent: 'serverless', name: '재고 차감 함수' },
  { id: 'settle', kind: 'lambda', parent: 'serverless', name: '정산 함수' },
  { id: 'code', kind: 'repo', parent: 'cicd', name: '주문 API 저장소' },
  { id: 'ci', kind: 'build', parent: 'cicd', name: '빌드 파이프라인' },
  { id: 'registry', kind: 'ecr', parent: 'containers', name: '주문 API 이미지' },
  { id: 'watch', kind: 'cloudwatch', parent: 'monitoring', name: '서비스 경보' },
  { id: 'prom', kind: 'prometheus', parent: 'monitoring', name: '앱 지표 수집' },
];

const staticWires = [
  wired('visitor', 'request', 'cdn', 'request'),
  wired('cdn', 'request', 'assets', 'request'),
];
const serverWires = [
  wired('shopper', 'request', 'gateway', 'request'),
  wired('gateway', 'request', 'web', 'request'),
  wired('web', 'query', 'db', 'query'),
];
const availableWires = [
  ...staticWires,
  wired('shopper', 'request', 'dns', 'request'),
  wired('dns', 'request', 'gateway', 'request'),
  wired('gateway', 'request', 'lb', 'request'),
  wired('lb', 'request', 'fleet', 'request'),
  wired('fleet', 'query', 'db', 'query'),
  wired('fleet', 'metric', 'watch', 'metric'),
];
const decoupledWires = [
  ...availableWires,
  wired('lb', 'request', 'web', 'request'),
  wired('web', 'message', 'topic', 'message'),
  wired('topic', 'message', 'mailQueue', 'message'),
  wired('topic', 'message', 'stockQueue', 'message'),
  wired('mailQueue', 'message', 'mailer', 'message'),
  wired('stockQueue', 'message', 'stock', 'message'),
  wired('stock', 'query', 'orders', 'query'),
];
const fullWires = [
  ...decoupledWires,
  wired('code', 'code', 'ci', 'code'),
  wired('ci', 'image', 'registry', 'image'),
  wired('registry', 'image', 'app', 'image'),
  wired('lb', 'request', 'app', 'request'),
  wired('app', 'query', 'db', 'query'),
  wired('app', 'metric', 'prom', 'metric'),
  wired('assets', 'event', 'settle', 'event'),
  wired('nightly', 'event', 'settle', 'event'),
  wired('settle', 'query', 'orders', 'query'),
];

const idsOf = (wires: Connection[]) => [
  ...new Set(wires.flatMap((wire) => [wire.from.node, wire.to.node])),
];

function buildExample(wires: Connection[]): Graph {
  const ids = idsOf(wires);
  let graph = lab.initial();
  const apply = (command: Parameters<typeof applyCommand>[1]) => {
    graph = applyCommand(graph, command, lab);
  };
  for (const node of nodes.filter((item) => ids.includes(item.id))) {
    apply({ type: 'add', id: node.id, kind: node.kind, parent: node.parent });
    apply({ type: 'settings', id: node.id, name: node.name });
    for (const [key, value] of Object.entries(node.settings ?? {}))
      apply({ type: 'setting', id: node.id, key, value });
  }
  for (const edge of wires) apply({ type: 'connect', edge });
  // 노드가 없는 서비스는 빼고, 남은 서비스를 열 배치대로 다시 놓는다. 서브넷은 VPC를 따라간다.
  const top = (id: string): string => {
    const entity = graph.entities.find((e) => e.id === id);
    return !entity || entity.parent === rootId ? id : top(entity.parent);
  };
  const used = new Set(
    graph.entities.filter((e) => e.type === 'resource').map((e) => top(e.parent)),
  );
  const bottom = (id: string) =>
    Math.max(
      52 + 150,
      ...graph.entities
        .filter((e) => e.parent === id)
        .map((e) => e.position.y + size(e).height + 24),
    );
  const places = placeServices([...used]);
  return {
    ...graph,
    entities: graph.entities
      .filter((e) => e.id === rootId || used.has(top(e.id)))
      .map((e) => {
        const place = places.get(e.id);
        if (!place || e.type !== 'system' || e.parent !== rootId) return e;
        return {
          ...e,
          position: { x: place.x, y: place.y },
          height: e.kind === 'vpc' ? e.height : bottom(e.id),
        };
      }),
  };
}

export interface ExampleWorkflow {
  id: string;
  title: string;
  build: () => Graph;
}
/** 플레이그라운드에서 고를 수 있는 AWS 예시. 위에서 아래로 갈수록 복잡하다. */
export const exampleWorkflows: ExampleWorkflow[] = [
  {
    id: 'level-1',
    title: '1단계 · CloudFront로 정적 파일 배포하기',
    build: () => buildExample(staticWires),
  },
  {
    id: 'level-2',
    title: '2단계 · 퍼블릭 서브넷의 웹 서버와 프라이빗 DB',
    build: () => buildExample(serverWires),
  },
  {
    id: 'level-3',
    title: '3단계 · ALB와 Auto Scaling으로 고가용성 구성',
    build: () => buildExample(availableWires),
  },
  {
    id: 'level-4',
    title: '4단계 · SNS·SQS로 주문 처리 디커플링',
    build: () => buildExample(decoupledWires),
  },
  {
    id: 'level-5',
    title: '5단계 · 컨테이너 배포·서버리스·관측까지 전체 구성',
    build: () => buildExample(fullWires),
  },
];

/** 가장 복잡한 5단계 예시. */
export const examplePipeline = (): Graph => buildExample(fullWires);
