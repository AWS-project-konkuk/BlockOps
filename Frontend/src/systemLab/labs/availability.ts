import type { SystemEntity } from '../lab';
import { defineAwsLab } from './aws/workflow';
import { wired } from './kit';

const withSettings = (entity: SystemEntity, name: string, settings: Record<string, string>) => ({
  ...entity,
  name,
  settings: { ...entity.settings, ...settings },
});

/** 3단원 종합 실습. 헬스 체크·조정 정책을 고치고 가용 영역 장애를 Multi-AZ로 버틴다. */
export const availabilityLab = defineAwsLab({
  id: 'ha-workflow',
  kinds: ['vpc', 'subnet', 'igw', 'alb', 'asg', 'rds'],
  tools: { vpc: ['subnet', 'igw', 'alb'], subnet: ['asg', 'rds'] },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 260 }, { settings: { traffic: '1000' } }),
      system('vpc', 'vpc', 'root', { x: 280, y: 0 }, 772, 470),
      node('igw', 'gateway', 'vpc', { x: 24, y: 52 }, { name: '인터넷 게이트웨이' }),
      node(
        'alb',
        'lb',
        'vpc',
        { x: 24, y: 220 },
        { name: '웹 ALB', settings: { health: '/status' } },
      ),
      withSettings(system('subnet', 'app', 'vpc', { x: 248, y: 52 }, 232, 390), '앱 서브넷 (2a)', {
        tier: 'private',
        az: 'a',
        route: 'nat',
      }),
      node(
        'asg',
        'group',
        'app',
        { x: 24, y: 52 },
        { name: '웹 서버 그룹', settings: { policy: 'none' } },
      ),
      withSettings(system('subnet', 'data', 'vpc', { x: 504, y: 52 }, 232, 390), 'DB 서브넷 (2c)', {
        tier: 'private',
        az: 'c',
        route: 'none',
      }),
      node('rds', 'db', 'data', { x: 24, y: 52 }, { name: '주문 DB', settings: { replica: '1' } }),
      node('end', 'end', 'root', { x: 1100, y: 260 }),
    ],
    connections: [
      wired('start', 'request', 'gateway', 'request'),
      wired('gateway', 'request', 'lb', 'request'),
      wired('lb', 'request', 'group', 'request'),
      wired('group', 'query', 'db', 'query'),
    ],
  }),
  starterTasks: [wired('db', 'response', 'end', 'response')],
  required: ['gateway', 'lb', 'group', 'db'],
  observations: ['health-failed', 'overload', 'db-failover'],
});
