import { named } from './aws/subnet';
import { defineAwsLab } from './aws/workflow';
import { port, received, wired } from './kit';

/** 7단원 종합 실습. 컨테이너 지표는 Prometheus(Pull)로, Lambda 지표는 CloudWatch(Push)로 모은다. */
export const observeLab = defineAwsLab({
  id: 'observe-workflow',
  kinds: [
    'vpc',
    'subnet',
    'igw',
    'alb',
    'ecs',
    'containers',
    'ecr',
    'messaging',
    'eventbridge',
    'serverless',
    'lambda',
    'monitoring',
    'prometheus',
    'cloudwatch',
  ],
  tools: {
    vpc: ['subnet', 'igw', 'alb'],
    subnet: ['ecs'],
    containers: ['ecr'],
    messaging: ['eventbridge'],
    serverless: ['lambda'],
    monitoring: ['prometheus', 'cloudwatch'],
  },
  end: {
    label: '관측 확인',
    ports: [port('in', 'metric', 'metric', true, '대시보드')],
    run: (ctx) => {
      const boards = received(ctx.inputs, 'metric');
      const sources = boards.flatMap((board) =>
        Array.isArray(board.data.sources) ? (board.data.sources as string[]) : [],
      );
      const kinds = new Set(
        ctx.graph.entities.filter((e) => sources.includes(e.name)).map((e) => e.kind),
      );
      ctx.report([
        { label: '대시보드', value: boards.map((b) => String(b.data.source)).join(', ') || '없음' },
        { label: '수집한 대상', value: sources.join(', ') || '없음' },
      ]);
      if (!kinds.has('ecs')) throw new Error('주문 API 서비스(ECS)의 지표가 대시보드에 없습니다.');
      if (!kinds.has('lambda')) throw new Error('정산 함수(Lambda)의 지표가 대시보드에 없습니다.');
      return '컨테이너와 함수의 지표를 모두 대시보드에서 확인했습니다.';
    },
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 180 }),
      system('vpc', 'vpc', 'root', { x: 280, y: 0 }, 516, 380),
      node('igw', 'gateway', 'vpc', { x: 24, y: 52 }, { name: '인터넷 게이트웨이' }),
      node('alb', 'lb', 'vpc', { x: 24, y: 200 }, { name: '주문 ALB' }),
      named(system('subnet', 'app', 'vpc', { x: 248, y: 52 }, 232, 300), '앱 서브넷', {
        tier: 'private',
        route: 'nat',
      }),
      node('ecs', 'api', 'app', { x: 24, y: 52 }, { name: '주문 API 서비스' }),
      system('containers', 'containers', 'root', { x: 280, y: 420 }, 232, 200),
      node('ecr', 'registry', 'containers', { x: 24, y: 52 }, { name: '주문 API 이미지' }),
      system('messaging', 'messaging', 'root', { x: 0, y: 420 }, 232, 200),
      node('eventbridge', 'nightly', 'messaging', { x: 24, y: 52 }, { name: '매일 정산' }),
      system('serverless', 'serverless', 'root', { x: 560, y: 420 }, 232, 200),
      node('lambda', 'settle', 'serverless', { x: 24, y: 52 }, { name: '정산 함수' }),
      system('monitoring', 'monitoring', 'root', { x: 840, y: 0 }, 232, 380),
      node('prometheus', 'prom', 'monitoring', { x: 24, y: 52 }, { name: '앱 지표 수집' }),
      node('cloudwatch', 'watch', 'monitoring', { x: 24, y: 200 }, { name: '서비스 지표' }),
      node('end', 'end', 'root', { x: 1120, y: 180 }),
    ],
    connections: [
      wired('start', 'request', 'gateway', 'request'),
      wired('gateway', 'request', 'lb', 'request'),
      wired('lb', 'request', 'api', 'request'),
      wired('registry', 'image', 'api', 'image'),
      wired('api', 'metric', 'prom', 'metric'),
      wired('nightly', 'event', 'settle', 'event'),
      wired('settle', 'metric', 'prom', 'metric'),
      wired('prom', 'metric', 'end', 'metric'),
    ],
  }),
  starterTasks: [
    wired('settle', 'metric', 'watch', 'metric'),
    wired('watch', 'metric', 'end', 'metric'),
  ],
  required: ['api', 'settle', 'prom', 'watch'],
  observations: ['pull-mismatch'],
});
