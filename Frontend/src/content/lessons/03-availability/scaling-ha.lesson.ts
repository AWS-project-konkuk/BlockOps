import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'scaling-ha',
  unit: 3,
  order: 1,
  title: '확장성과 고가용성: 더 크게, 더 많이',
  minutes: 11,
  summary: '수직·수평 확장의 차이와 고가용성을 위해 여러 가용 영역에 나눠 두는 이유를 배웁니다.',
  scenario:
    '세일 첫날 접속이 열 배로 늘고, 같은 날 데이터 센터 하나에 정전이 났습니다. 서버를 키우는 방법과 늘리는 방법이 각각 어느 문제를 해결하는지 나눠 보세요.',
  concepts: ['확장성', '고가용성', '수직 확장', '수평 확장', 'Active·Passive', '멀티 AZ'],
  assessment: {
    question: '서버 한 대를 더 큰 인스턴스로 바꾸는 수직 확장만으로 막기 어려운 문제는?',
    options: [
      '그 서버가 있는 가용 영역이 멈추는 장애',
      '요청 하나를 처리하는 시간이 긴 문제',
      '메모리가 부족한 문제',
      'CPU 사용률이 높은 문제',
    ],
    correct: 0,
    explanation:
      '수직 확장은 서버 한 대의 성능을 높일 뿐이라 그 서버나 가용 영역이 멈추면 서비스도 멈춥니다. 여러 가용 영역에 수평으로 늘려야 고가용성을 얻습니다.',
  },
  caution:
    '수평 확장은 서버를 늘리는 것만으로 끝나지 않습니다. 요청을 나눠 줄 로드 밸런서가 함께 있어야 합니다.',
  reflection:
    '우리 서비스에서 Active·Active와 Active·Passive 중 무엇이 맞을지 비용과 복구 시간을 기준으로 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 4차시 · 확장성과 고가용성 워크북',
      url: 'https://www.notion.so/fa2ebb1cb38a8267aa20818d08f186be',
    },
    {
      title: 'AWS 백서 · 고가용성 및 확장성',
      url: 'https://docs.aws.amazon.com/ko_kr/whitepapers/latest/real-time-communication-on-aws/high-availability-and-scalability-on-aws.html',
    },
  ],
});
