import type { SystemEntity } from '../lab';
import { defineAwsLab } from './aws/workflow';
import { wired } from './kit';

const withSettings = (entity: SystemEntity, settings: Record<string, string>): SystemEntity => ({
  ...entity,
  settings: { ...entity.settings, ...settings },
});

/** 2단원 종합 실습. 라우팅 테이블과 보안 그룹을 고쳐 퍼블릭 서브넷의 웹 서버에 닿게 한다. */
export const networkLab = defineAwsLab({
  id: 'network-workflow',
  kinds: ['vpc', 'subnet', 'igw', 'ec2', 'rds'],
  tools: { vpc: ['subnet', 'igw'], subnet: ['ec2', 'rds'] },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 240 }),
      system('vpc', 'vpc', 'root', { x: 280, y: 0 }, 772, 400),
      node('igw', 'gateway', 'vpc', { x: 24, y: 140 }, { name: '인터넷 게이트웨이' }),
      withSettings(
        {
          ...system('subnet', 'public', 'vpc', { x: 248, y: 52 }, 232, 320),
          name: '퍼블릭 서브넷',
        },
        { tier: 'public', az: 'a', route: 'none' },
      ),
      node('ec2', 'web', 'public', { x: 24, y: 52 }, { name: '웹 서버', settings: { sg: '22' } }),
      withSettings(
        {
          ...system('subnet', 'private', 'vpc', { x: 504, y: 52 }, 232, 320),
          name: '프라이빗 서브넷',
        },
        { tier: 'private', az: 'c', route: 'nat' },
      ),
      node('rds', 'db', 'private', { x: 24, y: 52 }, { name: '상품 DB' }),
      node('end', 'end', 'root', { x: 1100, y: 240 }),
    ],
    connections: [
      wired('start', 'request', 'gateway', 'request'),
      wired('web', 'query', 'db', 'query'),
    ],
  }),
  starterTasks: [
    wired('gateway', 'request', 'web', 'request'),
    wired('web', 'response', 'end', 'response'),
  ],
  required: ['gateway', 'web', 'db'],
  observations: ['no-public-route', 'sg-blocked'],
});
