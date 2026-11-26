import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'container-workflow',
  unit: 5,
  order: 11,
  title: '실습 · 빌드한 이미지를 ECS로 서비스하기',
  minutes: 13,
  summary:
    '빌드한 이미지를 ECR에 올리고 프라이빗 서브넷의 ECS(Fargate)가 받아 요청에 응답하게 합니다.',
  scenario:
    '빌드 파이프라인은 이미지를 만들었지만 주문 API 서비스가 뜨지 않습니다. 이미지가 ECR을 거쳐 태스크까지 가는 길과, 태스크가 쓸 권한을 차례로 점검해 요청 100건에 응답하세요.',
  concepts: [
    'GitHub Actions 빌드',
    'ECR',
    'ECS 서비스',
    'Fargate',
    'NAT 게이트웨이',
    '태스크 역할',
  ],
  assessment: {
    question: '프라이빗 서브넷의 ECS 태스크가 ECR에서 이미지를 받지 못한 이유는?',
    options: [
      '서브넷에 바깥으로 나가는 경로(NAT 게이트웨이)가 없어서',
      'ALB가 HTTPS 리스너만 있어서',
      '태스크 수가 너무 많아서',
      'GitHub Actions가 테스트를 건너뛰어서',
    ],
    correct: 0,
    explanation:
      '태스크는 시작할 때 ECR에서 이미지를 받아야 합니다. 프라이빗 서브넷은 NAT 게이트웨이나 VPC 엔드포인트가 있어야 ECR에 닿습니다.',
  },
  references: [
    {
      title: '원문 · DevOps 6차시 · 컨테이너 워크북',
      url: 'https://www.notion.so/392ebb1cb38a8286b9b501e0da4e0fdc',
    },
    {
      title: 'Amazon ECS · Fargate 태스크 네트워킹',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/fargate-task-networking.html',
    },
  ],
});
