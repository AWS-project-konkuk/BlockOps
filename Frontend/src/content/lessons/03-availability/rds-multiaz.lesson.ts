import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'rds-multiaz',
  unit: 3,
  order: 3,
  title: 'RDS: Multi-AZ와 읽기 복제본',
  minutes: 12,
  summary:
    'DB를 EC2에서 분리해 RDS로 두고, Multi-AZ와 읽기 복제본으로 가용성과 성능을 나눠 챙깁니다.',
  scenario:
    '웹 서버는 두 가용 영역에 나눴는데 DB는 한 곳에만 있습니다. 그 가용 영역이 멈추면 무엇이 남는지, 읽기 요청이 몰리면 무엇을 늘려야 하는지 구분해 보세요.',
  concepts: ['RDS', 'DB 서브넷 그룹', 'Multi-AZ', '장애 조치', '읽기 복제본', '동기·비동기 복제'],
  assessment: {
    question: 'Multi-AZ와 읽기 복제본의 차이로 옳은 것은?',
    options: [
      '둘 다 평소에 읽기 요청을 나눠 받는다',
      '읽기 복제본은 장애 시 자동으로 메인 DB가 된다',
      'Multi-AZ는 성능을, 읽기 복제본은 가용성을 위한 것이다',
      'Multi-AZ는 동기 복제로 장애 시 자동 승격되고, 읽기 복제본은 비동기 복제로 읽기를 나눈다',
    ],
    correct: 3,
    explanation:
      'Multi-AZ의 대기 DB는 평소에 요청을 받지 않고 장애 때 승격됩니다. 읽기 복제본은 약간 늦게 따라오지만 평소에 읽기 요청을 받아 메인 DB의 부하를 줄입니다.',
  },
  caution:
    'DB는 프라이빗 서브넷에 두고, 보안 그룹에서 앱 서버의 보안 그룹만 허용합니다. 앱이 클라이언트, DB가 서버입니다.',
  reflection:
    '앱이 RDS에 붙을 때 보안 그룹에서 어느 방향의 트래픽을 허용해야 할지, 누가 클라이언트인지 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 4차시 · 확장성과 고가용성 워크북',
      url: 'https://www.notion.so/fa2ebb1cb38a8267aa20818d08f186be',
    },
    {
      title: 'Amazon RDS · Multi-AZ 배포',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html',
    },
    {
      title: 'Amazon RDS · 읽기 전용 복제본',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/USER_ReadRepl.html',
    },
  ],
});
