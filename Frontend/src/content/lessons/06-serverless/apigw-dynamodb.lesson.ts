import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'apigw-dynamodb',
  unit: 6,
  order: 2,
  title: 'API Gateway와 DynamoDB로 서버리스 백엔드 만들기',
  minutes: 15,
  summary:
    'API Gateway로 HTTP 요청을 Lambda에 넘기고 DynamoDB의 키와 용량으로 데이터를 저장하는 방법을 배웁니다.',
  scenario:
    '주문 API를 서버 없이 만들려 합니다. 요청을 받아 함수를 부르는 입구를 고르고, 주문을 저장할 테이블의 파티션 키를 정하세요. 날짜를 키로 쓰면 무슨 일이 생기는지도 생각해 보세요.',
  concepts: [
    'API Gateway',
    'HTTP API·REST API',
    'DynamoDB',
    '파티션 키',
    '정렬 키',
    'RCU·WCU',
    '읽기 일관성',
    'Streams',
    'TTL',
  ],
  assessment: {
    question: '주문 테이블의 파티션 키로 주문 날짜(date)를 쓰면 생기는 문제는?',
    options: [
      '오늘 주문이 모두 같은 파티션에 몰려 그 파티션의 처리량을 넘는다',
      '날짜는 문자열이라 키로 쓸 수 없다',
      '정렬 키를 쓸 수 없게 된다',
      '읽기가 항상 강력한 일관성으로 바뀐다',
    ],
    correct: 0,
    explanation:
      'DynamoDB는 파티션 키의 해시로 저장 위치를 정합니다. 오늘 날짜 하나에 쓰기가 몰리면 한 파티션만 바빠지는 핫 파티션이 됩니다. 고르게 퍼지는 키를 고릅니다.',
  },
  caution:
    '강력한 일관된 읽기는 최신 값을 보장하지만 RCU를 두 배로 쓰고 글로벌 보조 인덱스에서는 쓸 수 없습니다.',
  reflection: 'API Gateway 없이 Lambda만 쓸 수 있을까요? API Gateway가 맡는 역할을 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 7차시 · Serverless 워크북',
      url: 'https://www.notion.so/badebb1cb38a839c970f81ff7a4a399d',
    },
    {
      title: 'Amazon API Gateway · REST API와 HTTP API 중에서 선택',
      url: 'https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/http-api-vs-rest.html',
    },
    {
      title: 'AWS 블로그 · DynamoDB 파티션 키 고르기',
      url: 'https://aws.amazon.com/ko/blogs/database/choosing-the-right-dynamodb-partition-key/',
    },
  ],
});
