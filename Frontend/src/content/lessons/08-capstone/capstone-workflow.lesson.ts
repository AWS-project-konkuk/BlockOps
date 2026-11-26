import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'capstone-workflow',
  unit: 8,
  order: 2,
  title: '실습 · 주문 서비스 장애 진단하기',
  minutes: 15,
  summary: '여러 단원의 실수가 섞인 주문 서비스를 요청 경로 순서로 진단해 주문을 DB까지 넣습니다.',
  scenario:
    'shop.example.com의 주문이 하나도 DB에 들어가지 않습니다. 실행할 때마다 나오는 첫 실패를 따라 로드 밸런서와 컨테이너, 서브넷 설정을 하나씩 고쳐 주문 100건을 완료하세요.',
  concepts: [
    '장애 진단',
    'ALB 헬스 체크',
    '리스너',
    '프라이빗 서브넷 경로',
    'ECR 이미지 풀',
    'Multi-AZ',
  ],
  assessment: {
    question: '이번 실습에서 세 가지 장애를 찾을 때 가장 도움이 된 방법은?',
    options: [
      '모든 설정을 기본값으로 되돌리기',
      '서버 수를 늘려 보기',
      'DB 엔진을 바꿔 보기',
      '실행할 때마다 처음 실패한 노드의 메시지를 읽고 그 노드의 설정을 고치기',
    ],
    correct: 3,
    explanation:
      '장애는 한 번에 하나씩 드러납니다. 처음 실패한 지점의 메시지가 원인과 고칠 방향을 알려 주므로, 고치고 다시 실행하기를 반복합니다.',
  },
  references: [
    {
      title: 'AWS Well-Architected · 신뢰성 원칙',
      url: 'https://docs.aws.amazon.com/ko_kr/wellarchitected/latest/reliability-pillar/welcome.html',
    },
  ],
});
