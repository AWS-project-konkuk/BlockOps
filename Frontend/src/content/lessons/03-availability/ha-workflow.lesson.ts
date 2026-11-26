import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'ha-workflow',
  unit: 3,
  order: 4,
  title: '실습 · 트래픽 급증과 가용 영역 장애 버티기',
  minutes: 15,
  summary: '헬스 체크·조정 정책을 고쳐 1,000건을 처리하고, 가용 영역 장애를 Multi-AZ로 버팁니다.',
  scenario:
    '세일 첫날 요청 1,000건이 몰리는데 주문이 하나도 완료되지 않습니다. ALB와 Auto Scaling 그룹의 실패를 차례로 고친 뒤, DB가 있는 가용 영역을 멈춰도 주문이 계속 들어가게 하세요.',
  concepts: ['헬스 체크', '대상 추적 조정', '최대 인스턴스 수', 'Multi-AZ', '장애 조치'],
  assessment: {
    question: '2c 가용 영역을 멈췄을 때 주문 DB가 계속 응답한 이유는?',
    options: [
      '읽기 복제본이 쓰기 요청을 대신 받았기 때문',
      'Multi-AZ의 대기 DB가 다른 가용 영역에서 자동으로 승격됐기 때문',
      '웹 서버 그룹이 인스턴스를 더 늘렸기 때문',
      'ALB가 DB로 가는 요청을 끊었기 때문',
    ],
    correct: 1,
    explanation:
      'Multi-AZ는 다른 가용 영역에 동기 복제한 대기 DB를 두고, 메인이 멈추면 자동으로 승격합니다. 읽기 복제본은 자동 승격되지 않습니다.',
  },
  references: [
    {
      title: '원문 · DevOps 4차시 · 확장성과 고가용성 워크북',
      url: 'https://www.notion.so/fa2ebb1cb38a8267aa20818d08f186be',
    },
    {
      title: 'Amazon EC2 Auto Scaling · 대상 추적 조정 정책',
      url: 'https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/as-scaling-target-tracking.html',
    },
  ],
});
