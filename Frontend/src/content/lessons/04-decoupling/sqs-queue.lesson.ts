import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'sqs-queue',
  unit: 4,
  order: 1,
  title: 'SQS: 줄을 세워 서비스를 떼어 놓기',
  minutes: 14,
  summary:
    '동기·비동기 통신의 차이와 SQS 대기열로 생산자와 소비자를 떼어 놓는 디커플링을 배웁니다.',
  scenario:
    '주문 서버가 재고·결제·메일을 차례로 직접 부르다 보니, 메일 서버가 느려지면 주문 전체가 멈춥니다. 대기열을 사이에 두면 무엇이 달라지는지, 표준과 FIFO 큐 중 무엇을 골라야 하는지 따져 보세요.',
  concepts: [
    '동기·비동기',
    '디커플링',
    '메시지 브로커',
    '표준 큐',
    'FIFO 큐',
    '가시성 제한 시간',
    '긴 폴링',
  ],
  assessment: {
    question: '재고 차감처럼 순서가 중요하고 한 번만 처리되어야 하는 작업에 알맞은 큐는?',
    options: [
      '표준 큐. 처리량이 거의 무제한이라서',
      '가시성 제한 시간을 0초로 둔 표준 큐',
      'FIFO 큐. 순서를 지키고 정확히 한 번 전달하므로',
      '큐 없이 주문 서버가 재고 서버를 직접 호출',
    ],
    correct: 2,
    explanation:
      '표준 큐는 최소 한 번 전달이라 중복과 순서 바뀜이 생길 수 있습니다. FIFO 큐는 처리량 한도가 있지만 순서와 정확히 한 번 전달을 보장합니다.',
  },
  caution:
    '가시성 제한 시간이 처리 시간보다 짧으면 처리 중인 메시지가 다른 소비자에게 다시 보여 중복 처리됩니다.',
  reflection: 'FIFO 큐가 표준 큐와 다르게 설계된 이유를 처리량과 순서 보장의 관계로 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 5차시 · 디커플링 애플리케이션 워크북',
      url: 'https://www.notion.so/8f2ebb1cb38a834fa96381de7e3aef03',
    },
    {
      title: 'Amazon SQS · 개요',
      url: 'https://docs.aws.amazon.com/ko_kr/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html',
    },
    {
      title: 'Amazon SQS · 가시성 제한 시간',
      url: 'https://docs.aws.amazon.com/ko_kr/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html',
    },
  ],
});
