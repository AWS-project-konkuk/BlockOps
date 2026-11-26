import { named } from './aws/subnet';
import { defineAwsLab } from './aws/workflow';
import { wired } from './kit';

/** 8단원 종합 실습. 1~7단원의 실수가 섞인 구성을 진단해 주문이 DB까지 들어가게 한다. */
export const capstoneLab = defineAwsLab({
  id: 'capstone-workflow',
  kinds: ['edge', 'route53', 'vpc', 'subnet', 'igw', 'alb', 'ecs', 'rds', 'containers', 'ecr'],
  tools: {
    edge: ['route53'],
    vpc: ['subnet', 'igw', 'alb'],
    subnet: ['ecs', 'rds'],
    containers: ['ecr'],
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 200 }),
      system('edge', 'edge', 'root', { x: 280, y: 0 }, 232, 200),
      node('route53', 'dns', 'edge', { x: 24, y: 52 }, { name: 'shop.example.com' }),
      system('containers', 'containers', 'root', { x: 280, y: 240 }, 232, 200),
      node('ecr', 'registry', 'containers', { x: 24, y: 52 }, { name: '주문 API 이미지' }),
      system('vpc', 'vpc', 'root', { x: 560, y: 0 }, 772, 400),
      node('igw', 'gateway', 'vpc', { x: 24, y: 52 }, { name: '인터넷 게이트웨이' }),
      node(
        'alb',
        'lb',
        'vpc',
        { x: 24, y: 200 },
        { name: '주문 ALB', settings: { health: '/status', listener: 'http' } },
      ),
      named(system('subnet', 'app', 'vpc', { x: 248, y: 52 }, 232, 320), '앱 서브넷 (2a)', {
        tier: 'private',
        az: 'a',
        route: 'none',
      }),
      node('ecs', 'api', 'app', { x: 24, y: 52 }, { name: '주문 API 서비스' }),
      named(system('subnet', 'data', 'vpc', { x: 504, y: 52 }, 232, 320), 'DB 서브넷 (2c)', {
        tier: 'private',
        az: 'c',
        route: 'none',
      }),
      node('rds', 'db', 'data', { x: 24, y: 52 }, { name: '주문 DB', settings: { multiAz: 'on' } }),
      node('end', 'end', 'root', { x: 1380, y: 200 }),
    ],
    connections: [
      wired('start', 'request', 'dns', 'request'),
      wired('dns', 'request', 'gateway', 'request'),
      wired('gateway', 'request', 'lb', 'request'),
      wired('lb', 'request', 'api', 'request'),
      wired('registry', 'image', 'api', 'image'),
      wired('api', 'query', 'db', 'query'),
      wired('db', 'response', 'end', 'response'),
    ],
  }),
  starterTasks: [],
  required: ['dns', 'gateway', 'lb', 'api', 'registry', 'db'],
  observations: ['health-failed', 'listener-mismatch', 'image-pull-failed'],
});
