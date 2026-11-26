import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'serverless-workflow',
  unit: 6,
  order: 4,
  title: '실습 · 서버 없이 주문 API 만들기',
  minutes: 10,
  summary: 'API Gateway·Lambda·DynamoDB를 연결해 주문 100건을 저장하고 핫 파티션을 고칩니다.',
  scenario:
    '주문 API와 함수, 테이블이 준비되어 있지만 아직 연결되지 않았습니다. 요청이 테이블까지 가게 이은 뒤, 쓰기가 거절되는 이유를 테이블의 키 설계에서 찾아 주문 100건을 모두 기록하세요.',
  concepts: ['API Gateway', 'Lambda 트리거', 'DynamoDB 파티션 키', '핫 파티션', '프로비저닝 용량'],
  assessment: {
    question: '파티션 키를 orderId로 바꾸자 쓰기가 성공한 이유는?',
    options: [
      '온디맨드 모드로 자동 전환되어서',
      'Lambda 메모리가 늘어나서',
      '주문 ID는 값이 다양해 쓰기가 여러 파티션에 고르게 퍼져서',
      'API Gateway가 요청 수를 줄여서',
    ],
    correct: 2,
    explanation:
      '파티션 키의 값이 다양할수록 해시가 여러 파티션에 퍼져 한 파티션의 용량을 넘지 않습니다.',
  },
  references: [
    {
      title: '원문 · DevOps 7차시 · Serverless 워크북',
      url: 'https://www.notion.so/badebb1cb38a839c970f81ff7a4a399d',
    },
    {
      title: 'Amazon DynamoDB · 파티션 키 설계 모범 사례',
      url: 'https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/bp-partition-key-design.html',
    },
  ],
});
