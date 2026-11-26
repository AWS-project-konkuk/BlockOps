import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'cicd-pipeline',
  unit: 9,
  order: 0.5,
  title: 'CI/CD: 커밋에서 배포까지 자동으로',
  minutes: 12,
  summary:
    '커밋을 테스트·빌드해 이미지를 만들고 배포까지 자동으로 이어 주는 CI/CD 파이프라인을 배웁니다.',
  scenario:
    '배포할 때마다 누군가 노트북에서 이미지를 빌드해 올리다 보니, 테스트를 건너뛴 이미지가 운영에 나간 적이 있습니다. 커밋부터 배포까지 어느 단계를 자동화하고 어디서 멈춰야 하는지 정해 보세요.',
  concepts: ['CI', 'CD', 'GitHub Actions', '워크플로', '이미지 태그', 'ECR 푸시', '배포 전략'],
  assessment: {
    question: 'CI 단계에서 테스트가 실패했을 때 파이프라인이 해야 할 일은?',
    options: [
      '이미지를 빌드해 ECR에 올리고 배포는 사람이 판단하게 한다',
      '빌드와 배포를 멈추고 실패를 알린다',
      '테스트를 건너뛰고 배포한 뒤 문제가 생기면 되돌린다',
      '이전 커밋으로 자동으로 되돌려 다시 배포한다',
    ],
    correct: 1,
    explanation:
      'CI의 목적은 문제가 있는 변경이 다음 단계로 가지 않게 막는 것입니다. 테스트가 실패하면 빌드·배포를 멈추고 알립니다.',
  },
  caution:
    '이미지 태그에 latest만 쓰면 어떤 커밋이 배포됐는지 알 수 없고 되돌리기 어렵습니다. 커밋 해시나 버전으로 태그를 붙입니다.',
  reflection:
    '우리 팀의 GitHub Actions 워크플로에서 PR과 main 병합 때 각각 어떤 단계가 도는지 설명해 보세요.',
  references: [
    {
      title: 'GitHub Docs · GitHub Actions 이해',
      url: 'https://docs.github.com/ko/actions/about-github-actions/understanding-github-actions',
    },
    {
      title: 'Amazon ECS · 롤링 업데이트 배포',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/deployment-type-ecs.html',
    },
  ],
});
