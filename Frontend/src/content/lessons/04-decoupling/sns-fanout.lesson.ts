import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'sns-fanout',
  unit: 4,
  order: 2,
  title: 'SNS와 Fan-out: 한 번 게시해 여럿이 받기',
  minutes: 12,
  summary:
    'SNS 주제에 게시한 메시지를 여러 구독자가 함께 받는 Pub/Sub과 SNS·SQS Fan-out 패턴을 배웁니다.',
  scenario:
    '주문이 완료되면 재고 차감, 메일 발송, 정산 기록이 모두 일어나야 합니다. 주문 서버가 세 곳을 따로 부르는 대신 한 번만 게시하게 하려면 무엇을 두어야 하는지 생각해 보세요.',
  concepts: ['Pub/Sub', 'SNS 주제', '구독자', 'Fan-out', '메시지 필터링', 'FIFO 주제'],
  assessment: {
    question: 'SNS 주제 하나에 SQS 큐 두 개를 구독시킨 Fan-out의 장점으로 알맞은 것은?',
    options: [
      '두 큐 중 한 곳에만 메시지가 가서 비용이 절반이 된다',
      '생산자는 한 번만 게시하고, 각 큐의 소비자는 서로의 속도에 영향받지 않고 처리한다',
      '메시지가 두 큐를 차례로 거쳐 순서가 보장된다',
      '구독자가 없어도 메시지가 주제에 영구 보관된다',
    ],
    correct: 1,
    explanation:
      'SNS가 메시지를 복제해 모든 구독자에게 보내므로 생산자는 구독자를 몰라도 됩니다. 각 큐는 독립적으로 쌓이고 처리됩니다.',
  },
  caution:
    'SNS는 메시지를 보관하지 않고 바로 밀어 보냅니다(Push). 소비자가 자기 속도로 처리해야 하면 구독자로 SQS 큐를 둡니다.',
  reflection: 'Fan-out 패턴은 왜 필요하고, SNS 없이 구현한다면 무엇이 어려워질까요?',
  references: [
    {
      title: '원문 · DevOps 5차시 · 디커플링 애플리케이션 워크북',
      url: 'https://www.notion.so/8f2ebb1cb38a834fa96381de7e3aef03',
    },
    {
      title: 'Amazon SNS · SQS 대기열로 팬아웃',
      url: 'https://docs.aws.amazon.com/ko_kr/sns/latest/dg/sns-sqs-as-subscriber.html',
    },
    {
      title: 'Amazon SNS · 메시지 필터링',
      url: 'https://docs.aws.amazon.com/ko_kr/sns/latest/dg/sns-message-filtering.html',
    },
  ],
});
