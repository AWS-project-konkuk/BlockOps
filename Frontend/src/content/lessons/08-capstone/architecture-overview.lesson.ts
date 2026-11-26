import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'architecture-overview',
  unit: 8,
  order: 1,
  title: '1~7단원 한 장으로 연결하기',
  minutes: 12,
  summary:
    '네트워크·저장·확장·디커플링·컨테이너·서버리스·관측을 쇼핑몰 하나의 아키텍처로 연결합니다.',
  scenario:
    '지금까지 배운 서비스로 쇼핑몰 전체를 그려 봅니다. 사용자의 요청이 어떤 경로로 들어와 어디에 저장되고, 장애가 나면 어느 단원의 지식으로 원인을 찾을지 경로별로 정리하세요.',
  concepts: ['요청 경로', '정적 파일 경로', '비동기 경로', '관측 경로', '장애 진단 순서'],
  assessment: {
    question: '주문이 DB에 들어가지 않을 때 원인을 찾는 순서로 가장 알맞은 것은?',
    options: [
      'DB 엔진부터 바꿔 보고, 안 되면 네트워크를 본다',
      '요청 경로를 앞에서부터 따라가며 처음 실패한 곳의 메시지와 설정을 확인한다',
      '모든 서비스를 한 번에 재시작한다',
      '서버 수를 최대로 늘려 본다',
    ],
    correct: 1,
    explanation:
      '요청 경로를 앞에서부터 따라가며 처음 실패한 지점을 찾고, 그 지점이 속한 단원의 규칙(경로·보안 그룹·헬스 체크·이미지 경로)을 확인합니다.',
  },
  caution:
    '구성도는 단순하게 시작하세요. 각 경로가 왜 필요한지 설명할 수 있을 때 서비스를 더합니다.',
  reflection:
    '우리 서비스의 요청 하나를 사용자에서 DB까지 따라가며, 거치는 서비스와 각자의 역할을 말해 보세요.',
  references: [
    {
      title: '원문 · DevOps 7차시 · Serverless 워크북(전체 아키텍처 정리)',
      url: 'https://www.notion.so/badebb1cb38a839c970f81ff7a4a399d',
    },
    {
      title: 'AWS Well-Architected 프레임워크',
      url: 'https://docs.aws.amazon.com/ko_kr/wellarchitected/latest/framework/welcome.html',
    },
  ],
});
