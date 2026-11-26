import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'alb-asg',
  unit: 3,
  order: 2,
  title: 'ALB와 Auto Scaling: 나누고 늘리고 교체하기',
  minutes: 15,
  summary:
    'ALB가 요청을 대상 그룹에 나누고 Auto Scaling 그룹이 서버 수를 조절·교체하는 흐름을 배웁니다.',
  scenario:
    '헬스 체크에 실패한 서버에 요청이 계속 가고, 트래픽이 몰리는데 서버가 늘지 않습니다. 리스너·대상 그룹·헬스 체크와 Launch Template·ASG 설정이 어떻게 맞물리는지 따라가 보세요.',
  concepts: [
    'ALB',
    '리스너',
    '대상 그룹',
    '헬스 체크',
    'Launch Template',
    'Auto Scaling 그룹',
    '조정 정책',
    'Cooldown',
  ],
  assessment: {
    question: '대상 그룹의 헬스 체크가 연속으로 실패하면 일어나는 일의 순서로 알맞은 것은?',
    options: [
      'ASG가 먼저 서버를 지우고, ALB는 계속 요청을 보낸다',
      'ALB가 Unhealthy로 판정해 요청을 끊고, ASG가 그 서버를 종료한 뒤 Launch Template으로 새로 띄운다',
      'ALB가 서버를 재부팅하고 ASG는 아무것도 하지 않는다',
      '헬스 체크는 기록만 남기고 요청 흐름에는 영향이 없다',
    ],
    correct: 1,
    explanation:
      '간격 × 임계값만큼 연속 실패하면 ALB가 Unhealthy로 판정해 트래픽을 끊고, ASG는 이를 보고 인스턴스를 교체합니다.',
  },
  caution:
    'ASG의 최대 수는 비용 상한이기도 합니다. 최대를 정하지 않으면 공격성 트래픽에 서버가 끝없이 늘 수 있습니다.',
  reflection:
    'Launch Template 버전을 여러 개 두면 새 버전 배포에 문제가 생겼을 때 어떻게 도움이 될까요?',
  references: [
    {
      title: '원문 · DevOps 4차시 · 확장성과 고가용성 워크북',
      url: 'https://www.notion.so/fa2ebb1cb38a8267aa20818d08f186be',
    },
    {
      title: 'Elastic Load Balancing · Application Load Balancer',
      url: 'https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/introduction.html',
    },
    {
      title: 'Amazon EC2 Auto Scaling · Auto Scaling 그룹',
      url: 'https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/auto-scaling-groups.html',
    },
  ],
});
