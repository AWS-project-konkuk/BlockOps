import type { SystemEntity } from '../../lab';

/** 초기 그래프의 서브넷에 이름과 설정을 붙인다. */
export const named = (
  entity: SystemEntity,
  name: string,
  settings: Record<string, string> = {},
): SystemEntity => ({ ...entity, name, settings: { ...entity.settings, ...settings } });
