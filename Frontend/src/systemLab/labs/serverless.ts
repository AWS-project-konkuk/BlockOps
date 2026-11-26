import { defineAwsLab } from './aws/workflow';
import { wired } from './kit';

/** 6단원 종합 실습. API Gateway와 Lambda로 주문을 받고 DynamoDB의 파티션 키를 고른다. */
export const serverlessLab = defineAwsLab({
  id: 'serverless-workflow',
  kinds: ['serverless', 'storage', 'apigw', 'lambda', 'dynamodb'],
  tools: { serverless: ['apigw', 'lambda'], storage: ['dynamodb'] },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 150 }, { settings: { path: '/api/orders' } }),
      system('serverless', 'serverless', 'root', { x: 280, y: 0 }, 232, 360),
      node('apigw', 'api', 'serverless', { x: 24, y: 52 }, { name: '주문 API' }),
      node('lambda', 'order', 'serverless', { x: 24, y: 200 }, { name: '주문 저장 함수' }),
      system('storage', 'storage', 'root', { x: 560, y: 0 }, 232, 230),
      node(
        'dynamodb',
        'orders',
        'storage',
        { x: 24, y: 52 },
        {
          name: '주문 테이블',
          settings: { key: 'date', capacity: 'provisioned' },
        },
      ),
      node('end', 'end', 'root', { x: 860, y: 150 }),
    ],
    connections: [wired('start', 'request', 'api', 'request')],
  }),
  starterTasks: [
    wired('api', 'event', 'order', 'event'),
    wired('order', 'query', 'orders', 'query'),
    wired('orders', 'response', 'end', 'response'),
  ],
  required: ['api', 'order', 'orders'],
  observations: ['hot-partition'],
});
