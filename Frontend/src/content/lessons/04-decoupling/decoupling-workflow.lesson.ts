import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'decoupling-workflow',
  unit: 4,
  order: 4,
  title: '실습 · 주문 이벤트를 큐와 주제로 나눠 처리하기',
  minutes: 14,
  summary:
    '주문 이벤트를 SNS로 Fan-out해 재고와 메일을 함께 처리하고, 재고는 FIFO 큐로 한 번씩만 차감합니다.',
  scenario:
    '주문 함수가 재고 큐에만 메시지를 보내 고객에게 메일이 가지 않습니다. 주제를 사이에 두어 두 일을 나눠 맡기고, 재고가 두 번 빠지는 문제까지 고쳐 주문 100건을 마무리하세요.',
  concepts: ['SNS Fan-out', 'SQS 구독', 'FIFO 큐', '정확히 한 번', '중복 전달'],
  assessment: {
    question: '메일 큐는 표준 큐로 두고 재고 큐만 FIFO로 바꿔도 되는 이유는?',
    options: [
      '메일 큐는 SNS를 거치지 않기 때문',
      '표준 큐는 메시지를 보관하지 않기 때문',
      'FIFO 큐는 하나만 만들 수 있기 때문',
      '메일은 드물게 중복돼도 치명적이지 않지만 재고는 한 번만 차감해야 하기 때문',
    ],
    correct: 3,
    explanation:
      '큐 유형은 일의 성격에 맞게 고릅니다. 처리량이 큰 표준 큐는 중복을 견딜 수 있는 일에, FIFO는 순서와 횟수가 중요한 일에 씁니다.',
  },
  references: [
    {
      title: '원문 · DevOps 5차시 · 디커플링 애플리케이션 워크북',
      url: 'https://www.notion.so/8f2ebb1cb38a834fa96381de7e3aef03',
    },
    {
      title: 'Amazon SQS · FIFO 대기열',
      url: 'https://docs.aws.amazon.com/ko_kr/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queues.html',
    },
  ],
});
