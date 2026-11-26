import { named } from './aws/subnet';
import { defineAwsLab } from './aws/workflow';
import { wired } from './kit';

/** 5단원 종합 실습. 빌드한 이미지를 ECR에서 받아 프라이빗 서브넷의 ECS(Fargate)로 서비스한다. */
export const containerLab = defineAwsLab({
  id: 'container-workflow',
  kinds: ['vpc', 'subnet', 'igw', 'alb', 'ecs', 'containers', 'ecr', 'cicd', 'repo', 'build'],
  tools: {
    vpc: ['subnet', 'igw', 'alb'],
    subnet: ['ecs'],
    containers: ['ecr'],
    cicd: ['repo', 'build'],
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 200 }),
      system('cicd', 'cicd', 'root', { x: 0, y: 420 }, 232, 360),
      node('repo', 'code', 'cicd', { x: 24, y: 52 }, { name: '주문 API 저장소' }),
      node('build', 'ci', 'cicd', { x: 24, y: 200 }, { name: '빌드 파이프라인' }),
      system('containers', 'containers', 'root', { x: 280, y: 420 }, 232, 200),
      node('ecr', 'registry', 'containers', { x: 24, y: 52 }, { name: '주문 API 이미지' }),
      system('vpc', 'vpc', 'root', { x: 280, y: 0 }, 516, 380),
      node('igw', 'gateway', 'vpc', { x: 24, y: 52 }, { name: '인터넷 게이트웨이' }),
      node('alb', 'lb', 'vpc', { x: 24, y: 200 }, { name: '주문 ALB' }),
      named(system('subnet', 'app', 'vpc', { x: 248, y: 52 }, 232, 300), '앱 서브넷', {
        tier: 'private',
        az: 'a',
        route: 'none',
      }),
      node(
        'ecs',
        'api',
        'app',
        { x: 24, y: 52 },
        { name: '주문 API 서비스', settings: { role: 'instance' } },
      ),
      node('end', 'end', 'root', { x: 860, y: 200 }),
    ],
    connections: [
      wired('start', 'request', 'gateway', 'request'),
      wired('gateway', 'request', 'lb', 'request'),
      wired('lb', 'request', 'api', 'request'),
      wired('code', 'code', 'ci', 'code'),
    ],
  }),
  starterTasks: [
    wired('ci', 'image', 'registry', 'image'),
    wired('registry', 'image', 'api', 'image'),
    wired('api', 'response', 'end', 'response'),
  ],
  required: ['gateway', 'lb', 'api', 'registry', 'code', 'ci'],
  observations: ['image-pull-failed', 'shared-role'],
});
