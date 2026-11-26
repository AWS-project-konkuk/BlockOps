import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 's3-security',
  unit: 1,
  order: 2,
  title: 'S3 버킷 권한과 퍼블릭 액세스 차단',
  minutes: 12,
  summary: '버킷과 객체, 버킷 정책, 퍼블릭 액세스 차단으로 S3의 접근을 관리합니다.',
  scenario:
    '쇼핑몰 상품 이미지를 버킷에 올렸는데 브라우저에서 403이 뜹니다. 누가 이 버킷에 접근할 수 있는지 IAM 정책·버킷 정책·퍼블릭 액세스 차단 순서로 따져 보세요.',
  concepts: [
    '버킷·객체',
    '스토리지 클래스',
    'IAM 정책',
    '버킷 정책',
    '퍼블릭 액세스 차단',
    '버전 관리',
  ],
  assessment: {
    question:
      '상품 이미지를 전 세계에 보여 주되 버킷은 공개하고 싶지 않습니다. 가장 알맞은 구성은?',
    options: [
      '퍼블릭 액세스 차단을 끄고 모든 사람에게 GetObject를 허용한다',
      '퍼블릭 액세스 차단을 유지하고 CloudFront(OAC)에만 읽기를 허용한다',
      '이미지를 EBS에 옮겨 EC2에서 직접 내려준다',
      'IAM 사용자를 만들어 방문자에게 액세스 키를 나눠 준다',
    ],
    correct: 1,
    explanation:
      '버킷은 비공개로 두고 버킷 정책에서 CloudFront의 OAC만 읽게 하면, 사용자는 CloudFront를 거쳐서만 파일을 받습니다.',
  },
  caution: 'S3 리소스는 기본으로 비공개입니다. 공개는 버킷 정책으로 명시적으로 열 때만 일어납니다.',
  reflection:
    '버킷 정책으로 권한을 주는 것이 IAM 사용자 수백 명에게 각각 주는 것보다 나은 이유는 무엇일까요?',
  references: [
    {
      title: '원문 · DevOps 2차시 · 스토리지와 CDN 워크북',
      url: 'https://www.notion.so/e00ebb1cb38a8206a6c80113b289da8f',
    },
    {
      title: 'Amazon S3 · 액세스 제어',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/access-management.html',
    },
    {
      title: 'Amazon S3 · 퍼블릭 액세스 차단',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/access-control-block-public-access.html',
    },
  ],
});
