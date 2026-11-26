import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'ecr-ecs',
  unit: 5,
  order: 9.5,
  title: 'AWS에서 컨테이너 실행하기: ECR·ECS·EKS',
  minutes: 15,
  summary:
    'ECR에 이미지를 보관하고 ECS·EKS로 실행하는 AWS 컨테이너 서비스의 구조와 선택 기준을 배웁니다.',
  scenario:
    '로컬에서 만든 Docker 이미지를 AWS에서 여러 개 띄우려 합니다. 이미지를 어디에 두고, 누가 몇 개를 유지하며, 서버를 직접 관리할지 맡길지 ECS와 EKS, EC2와 Fargate를 비교해 정해 보세요.',
  concepts: [
    'ECR',
    'ECS',
    '태스크 정의',
    'ECS 서비스',
    'EC2·Fargate 시작 유형',
    'EKS',
    '태스크 역할',
  ],
  assessment: {
    question: '컨테이너마다 S3 접근 권한을 따로 주려면 무엇을 써야 할까요?',
    options: [
      'EC2 인스턴스 프로파일. 호스트의 모든 컨테이너가 같은 권한을 쓴다',
      '컨테이너 이미지에 액세스 키를 넣는다',
      'ECS 태스크 역할. 태스크 정의마다 권한을 따로 준다',
      '보안 그룹에 S3 포트를 연다',
    ],
    correct: 2,
    explanation:
      '인스턴스 프로파일은 같은 EC2의 컨테이너가 권한을 공유합니다. 태스크 역할은 태스크마다 권한을 나누고, 호스트가 없는 Fargate에서도 씁니다.',
  },
  caution:
    '이미지를 너무 많이 지우면 문제가 생겼을 때 이전 버전으로 되돌릴 수 없습니다. 태그를 남기는 수명 주기 정책을 둡니다.',
  reflection:
    'Fargate는 정말 서버리스일까요? Lambda와 비교해 무엇이 같고 무엇이 다른지 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 6차시 · 컨테이너 워크북',
      url: 'https://www.notion.so/392ebb1cb38a8286b9b501e0da4e0fdc',
    },
    {
      title: 'Amazon ECS · 시작 유형과 용량 공급자',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/capacity-launch-type-comparison.html',
    },
    {
      title: 'Amazon ECS · 태스크 IAM 역할',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/task-iam-roles.html',
    },
  ],
});
