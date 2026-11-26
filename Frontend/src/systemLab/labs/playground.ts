import { rootId, type Graph, type LabConfig, type SystemEntity } from '../lab';
import { awsTools, fromAws, topServices } from './aws/catalog';
import { RESOURCE_COLUMN, SERVICE_WIDTH, awsToolPosition, subnetHeight } from './aws/layout';
import { defineLab, layout } from './kit';

/**
 * 플레이그라운드 · AWS 서비스와 노드를 자유롭게 연결해 구성한다.
 * 시작·도착이 없고, 연결된 노드를 모두 실행한다. 사용자 노드가 요청의 출발점이다.
 */
export const playgroundId = 'playground';

/** 서비스별로 열어 둘 노드. */
export const playgroundTools = awsTools;
const kinds = [...topServices, ...new Set(Object.values(playgroundTools).flat())];

/** 서비스를 놓을 열. 왼쪽부터 사용자 → 엣지 → VPC → 관리형 서비스 순서이다. */
export const playgroundColumns = [
  ['internet', 'edge', 'cicd'],
  ['vpc'],
  ['storage', 'containers', 'serverless'],
  ['messaging', 'monitoring'],
];
export const GAP = 40;
export const serviceHeight = (kind: string) =>
  52 + Math.max(1, playgroundTools[kind]?.length ?? 1) * 150 + 24;
/** VPC 안에 처음부터 두는 서브넷. */
export const playgroundSubnets = [
  { id: 'public', name: '퍼블릭 서브넷', settings: { tier: 'public', az: 'a', route: 'igw' } },
  { id: 'private', name: '프라이빗 서브넷', settings: { tier: 'private', az: 'c', route: 'nat' } },
] as const;
export const VPC_WIDTH = RESOURCE_COLUMN + playgroundSubnets.length * (SERVICE_WIDTH + 24);
export const VPC_HEIGHT = 52 + subnetHeight + 24;
const widthOf = (kind: string) => (kind === 'vpc' ? VPC_WIDTH : SERVICE_WIDTH);
const heightOf = (kind: string) => (kind === 'vpc' ? VPC_HEIGHT : serviceHeight(kind));

/** 열 배치에 따라 서비스 위치를 정한다. 빠진 서비스는 건너뛴다. */
export function placeServices(services: readonly string[]) {
  const places = new Map<string, { x: number; y: number; width: number; height: number }>();
  let x = 0;
  for (const column of playgroundColumns) {
    const used = column.filter((kind) => services.includes(kind));
    if (!used.length) continue;
    let y = 0;
    for (const kind of used) {
      places.set(kind, { x, y, width: widthOf(kind), height: heightOf(kind) });
      y += heightOf(kind) + GAP;
    }
    x += Math.max(...used.map(widthOf)) + GAP;
  }
  return places;
}

function initial(lab: LabConfig): Graph {
  const { system } = layout(lab);
  const places = placeServices(topServices);
  const services = topServices.map((kind) => {
    const place = places.get(kind)!;
    return system(kind, kind, rootId, { x: place.x, y: place.y }, place.width, place.height);
  });
  const subnets = playgroundSubnets.map((subnet, index): SystemEntity => {
    const entity = system(
      'subnet',
      subnet.id,
      'vpc',
      { x: RESOURCE_COLUMN + index * (SERVICE_WIDTH + 24), y: 52 },
      SERVICE_WIDTH,
      subnetHeight,
    );
    return { ...entity, name: subnet.name, settings: { ...entity.settings, ...subnet.settings } };
  });
  return {
    entities: [system('root', rootId, '', { x: 0, y: 0 }, 0, 0), ...services, ...subnets],
    connections: [],
  };
}

export const playgroundLab: LabConfig = defineLab({
  ...fromAws({ kinds }),
  toolPosition: awsToolPosition,
  id: playgroundId,
  storageKey: 'blockops:system-lab:playground:v3',
  fixedKinds: ['root'],
  initial: () => initial(playgroundLab),
  starterTasks: [],
  requiredNodeIds: new Set(),
  freeform: true,
});
