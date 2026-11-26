import { defineAwsLab } from './aws/workflow';
import { port, received, wired } from './kit';

/** 4단원 종합 실습. 주문 이벤트를 SNS로 Fan-out하고 재고 차감은 FIFO 큐로 정확히 한 번 처리한다. */
export const decouplingLab = defineAwsLab({
  id: 'decoupling-workflow',
  kinds: ['serverless', 'messaging', 'apigw', 'lambda', 'sqs', 'sns'],
  tools: { serverless: ['apigw', 'lambda'], messaging: ['sqs', 'sns'] },
  end: {
    label: '주문 처리 확인',
    ports: [
      port('in', 'query', 'query', false, '재고 차감 기록'),
      port('in', 'message', 'message', false, '메일 발송 기록'),
    ],
    run: (ctx) => {
      const [stock] = received(ctx.inputs, 'query');
      const [mail] = received(ctx.inputs, 'message');
      if (!stock) throw new Error('재고 차감 기록이 없습니다. 재고 함수의 쿼리를 연결하세요.');
      const orders = Number(stock.data.total ?? stock.data.count);
      const duplicates = Number(stock.data.duplicates ?? 0);
      ctx.report([
        { label: '주문', value: orders + '건' },
        { label: '재고 차감', value: Number(stock.data.count) + duplicates + '건' },
        { label: '중복 차감', value: duplicates + '건' },
        { label: '메일 발송', value: mail ? Number(mail.data.count) + '건' : '없음' },
      ]);
      if (!mail) {
        ctx.observe('no-fanout');
        throw new Error(
          '주문 완료 메일이 한 건도 발송되지 않았습니다. 주문 이벤트를 SNS에 게시해 재고 큐와 메일 큐가 함께 받게 하세요.',
        );
      }
      if (duplicates)
        throw new Error(
          '재고가 ' +
            duplicates +
            '건 중복 차감됐습니다. 재고 큐는 순서대로 정확히 한 번 전달하는 FIFO로 바꾸세요.',
        );
      return '주문 ' + orders + '건의 재고를 한 번씩 차감하고 메일을 발송했습니다.';
    },
  },
  initial: ({ system, node }) => ({
    entities: [
      node('start', 'start', 'root', { x: 0, y: 200 }, { settings: { path: '/api/orders' } }),
      system('serverless', 'serverless', 'root', { x: 280, y: 0 }, 464, 400),
      node('apigw', 'api', 'serverless', { x: 24, y: 52 }, { name: '주문 API' }),
      node('lambda', 'order', 'serverless', { x: 24, y: 220 }, { name: '주문 함수' }),
      node('lambda', 'stock', 'serverless', { x: 256, y: 52 }, { name: '재고 차감 함수' }),
      node('lambda', 'mailer', 'serverless', { x: 256, y: 220 }, { name: '메일 발송 함수' }),
      system('messaging', 'messaging', 'root', { x: 280, y: 440 }, 464, 260),
      node('sns', 'topic', 'messaging', { x: 24, y: 52 }, { name: '주문 완료 주제' }),
      node('sqs', 'stockQueue', 'messaging', { x: 256, y: 52 }, { name: '재고 큐' }),
      node('sqs', 'mailQueue', 'messaging', { x: 256, y: 150 }, { name: '메일 큐' }),
      node('end', 'end', 'root', { x: 820, y: 200 }),
    ],
    connections: [
      wired('start', 'request', 'api', 'request'),
      wired('api', 'event', 'order', 'event'),
      wired('order', 'message', 'stockQueue', 'message'),
      wired('stockQueue', 'message', 'stock', 'message'),
      wired('stock', 'query', 'end', 'query'),
    ],
  }),
  starterTasks: [
    wired('order', 'message', 'topic', 'message'),
    wired('topic', 'message', 'stockQueue', 'message'),
    wired('topic', 'message', 'mailQueue', 'message'),
    wired('mailQueue', 'message', 'mailer', 'message'),
    wired('mailer', 'message', 'end', 'message'),
  ],
  required: ['api', 'order', 'stock', 'mailer', 'topic', 'stockQueue', 'mailQueue'],
  observations: {
    'no-fanout': '주문 이벤트가 메일 발송까지 가지 않은 실행',
    'duplicate-delivery': '표준 큐에서 같은 메시지가 한 번 더 전달된 실행',
  },
});
