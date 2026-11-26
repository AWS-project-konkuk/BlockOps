import { size } from '../../commands';
import type { LabConfig } from '../../lab';
import { awsKinds } from './catalog';

/** 리소스 노드 열의 너비. 서브넷 같은 하위 서비스는 이 열의 오른쪽부터 놓는다. */
export const RESOURCE_COLUMN = 24 + 184 + 40;
export const SERVICE_WIDTH = 232;
export const subnetHeight = 52 + 4 * 150 + 24;

/**
 * 서비스 안에 새 노드를 놓을 자리. 리소스는 왼쪽 열에 아래로 쌓고,
 * 서브넷 같은 하위 서비스는 오른쪽으로 나란히 놓아 서로 겹치지 않게 한다.
 */
export const awsToolPosition: LabConfig['toolPosition'] = (index, at) => {
  if (!at) return { x: 24, y: 52 + index * 150 };
  const children = at.graph.entities.filter((entity) => entity.parent === at.parent.id);
  if (awsKinds[at.kind]?.service) {
    const systems = children.filter((entity) => entity.type === 'system');
    const right = Math.max(
      RESOURCE_COLUMN,
      ...systems.map((entity) => entity.position.x + size(entity).width + 24),
    );
    return { x: right, y: 52 };
  }
  const resources = children.filter((entity) => entity.type === 'resource');
  return {
    x: 24,
    y: Math.max(52, ...resources.map((entity) => entity.position.y + size(entity).height + 24)),
  };
};
