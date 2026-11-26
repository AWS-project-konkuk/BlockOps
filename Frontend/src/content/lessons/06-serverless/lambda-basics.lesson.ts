import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'lambda-basics',
  unit: 6,
  order: 1,
  title: '서버리스와 Lambda: 필요할 때만 실행하기',
  minutes: 14,
  summary:
    '서버를 관리하지 않는 서버리스의 흐름과 Lambda의 함수·런타임·핸들러·계층·콜드 스타트·과금을 배웁니다.',
  scenario:
    '하루에 몇 번 쓰지 않는 쿠폰 발급 기능 때문에 서버를 24시간 켜 두고 있습니다. 요청이 올 때만 코드를 실행하면 무엇이 달라지는지, 첫 요청만 느린 이유는 무엇인지 생각해 보세요.',
  concepts: [
    '모놀리식·MSA',
    '서버리스',
    'BaaS·FaaS',
    'Lambda 함수',
    '런타임',
    '핸들러',
    '계층',
    '콜드 스타트',
    '요청·실행 시간 과금',
  ],
  assessment: {
    question: 'Lambda의 콜드 스타트에 대한 설명으로 옳은 것은?',
    options: [
      '함수가 실행될 때마다 항상 같은 시간만큼 걸린다',
      '오랜만의 첫 호출에서 격리 환경과 런타임을 준비하느라 느려지고, 이후 호출은 웜 상태로 빠르다',
      '메모리를 줄일수록 콜드 스타트가 짧아진다',
      '콜드 스타트는 API Gateway에서만 생긴다',
    ],
    correct: 1,
    explanation:
      '처음이거나 오래 호출되지 않은 함수는 실행 환경을 새로 만들어야 합니다. 이미 만든 환경이 남아 있으면 핸들러만 다시 부르므로 빠릅니다. Java처럼 무거운 런타임은 더 깁니다.',
  },
  caution:
    '표준 Lambda 함수는 한 번에 최대 15분까지 실행됩니다. 오래 걸리는 일은 나누거나 다른 실행 환경을 씁니다.',
  reflection: 'EC2로 서버를 운영하는 것과 Lambda로 구성하는 것을 언제 각각 고를지 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 7차시 · Serverless 워크북',
      url: 'https://www.notion.so/badebb1cb38a839c970f81ff7a4a399d',
    },
    {
      title: 'AWS Lambda · 작동 방식',
      url: 'https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/concepts-basics.html',
    },
    { title: 'AWS Lambda · 요금', url: 'https://aws.amazon.com/ko/lambda/pricing/' },
  ],
});
