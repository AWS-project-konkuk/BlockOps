import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'cdn-workflow',
  unit: 1,
  order: 4,
  title: '실습 · 비공개 S3를 CloudFront로 배포하기',
  minutes: 12,
  summary:
    '퍼블릭 액세스 차단을 유지한 채 CloudFront로 정적 파일을 배포하고 새 버전이 바로 보이게 합니다.',
  scenario:
    '사용자가 버킷에 바로 요청해 막히는 구성에서 시작합니다. 요청 경로를 CloudFront로 바꾸고, 배포 후 예전 파일이 보이는 문제까지 고쳐 요청 100건이 모두 응답받게 하세요.',
  concepts: ['퍼블릭 액세스 차단', 'CloudFront', 'OAC', '캐시 응답', 'TTL', '파일 버저닝'],
  assessment: {
    question: '이번 실습에서 사용자 요청 100건 중 버킷까지 간 요청은 왜 10건뿐이었나요?',
    options: [
      '나머지 90건은 엣지 캐시가 바로 응답했기 때문',
      '버킷이 90건을 거부했기 때문',
      'TTL이 끝나 90건이 실패했기 때문',
      '사용자가 90건을 취소했기 때문',
    ],
    correct: 0,
    explanation:
      '캐시 키를 경로로만 잡으면 같은 파일 요청은 엣지 캐시가 응답합니다. 캐시에 없을 때만 오리진인 버킷까지 갑니다.',
  },
  references: [
    {
      title: '원문 · DevOps 2차시 · 스토리지와 CDN 워크북',
      url: 'https://www.notion.so/e00ebb1cb38a8206a6c80113b289da8f',
    },
    {
      title: 'Amazon CloudFront · S3 오리진 액세스 제한(OAC)',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html',
    },
  ],
});
