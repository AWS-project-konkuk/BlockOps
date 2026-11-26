import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'kinesis-compare',
  unit: 4,
  order: 3,
  title: 'Kinesis와 메시징 서비스 고르기',
  minutes: 11,
  summary:
    '대량 이벤트를 순서대로 기록하는 Kinesis를 배우고 SQS·SNS·Kinesis·Amazon MQ를 비교해 고릅니다.',
  scenario:
    '초당 수만 건의 클릭 로그를 모아 실시간 집계와 저장에 함께 쓰려고 합니다. 큐에서 꺼내면 사라지는 SQS로 충분한지, 여러 소비자가 같은 기록을 다시 읽어야 하는지 따져 보세요.',
  concepts: ['Kinesis Data Streams', '샤드', 'KPL·KCL', 'Data Firehose', 'Amazon MQ', 'Push·Pull'],
  assessment: {
    question:
      '같은 클릭 로그를 실시간 집계와 장기 저장 두 소비자가 각각 읽어야 합니다. 알맞은 서비스는?',
    options: [
      'SQS 표준 큐. 한 소비자가 읽으면 메시지가 지워지므로',
      'SNS. 메시지를 보관해 두고 다시 읽게 해 주므로',
      'Kinesis Data Streams. 기록을 정해진 기간 보관하고 여러 소비자가 읽을 수 있으므로',
      'Amazon MQ. 대량 스트림을 가장 싸게 처리하므로',
    ],
    correct: 2,
    explanation:
      'Kinesis는 레코드를 설정한 기간 보관하고, 샤드 안에서 순서를 지키며, 여러 소비자가 같은 데이터를 각자 읽을 수 있습니다.',
  },
  caution:
    'Kinesis의 처리량은 샤드 수로 정해집니다. 샤드 하나가 받을 수 있는 양을 넘으면 쓰기가 거절됩니다.',
  reflection: 'Kinesis와 SQS의 차이를 데이터 보관과 소비자 수의 관점에서 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 5차시 · 디커플링 애플리케이션 워크북',
      url: 'https://www.notion.so/8f2ebb1cb38a834fa96381de7e3aef03',
    },
    {
      title: 'Amazon Kinesis Data Streams · 개요',
      url: 'https://docs.aws.amazon.com/ko_kr/streams/latest/dev/introduction.html',
    },
    {
      title: 'Amazon MQ · 개요',
      url: 'https://docs.aws.amazon.com/ko_kr/amazon-mq/latest/developer-guide/welcome.html',
    },
  ],
});
