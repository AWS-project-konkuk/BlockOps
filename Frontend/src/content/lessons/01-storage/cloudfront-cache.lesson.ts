import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'cloudfront-cache',
  unit: 1,
  order: 3,
  title: 'CloudFront 캐시: 캐시 키·TTL·무효화',
  minutes: 14,
  summary: 'CDN이 엣지 로케이션에 파일을 캐싱하는 원리와 캐시 키·TTL·무효화의 선택을 배웁니다.',
  scenario:
    '새 로고를 배포했는데 사용자는 하루 동안 예전 로고를 봅니다. 캐시 적중률과 최신성 사이에서 캐시 키와 TTL, Invalidation과 파일 버저닝을 비교해 보세요.',
  concepts: [
    'CDN',
    '엣지 로케이션',
    '오리진',
    '캐시 적중·미스',
    '캐시 키',
    'TTL',
    'Invalidation',
    'OAC',
  ],
  assessment: {
    question: '캐시 키에 쿼리·쿠키·헤더를 모두 넣었더니 생긴 변화로 알맞은 것은?',
    options: [
      '같은 파일도 요청마다 키가 달라져 캐시 적중률이 낮아지고 오리진 요청이 늘어난다',
      '키가 정확해져서 캐시 적중률이 높아진다',
      'TTL이 자동으로 길어진다',
      '오리진이 S3에서 ALB로 바뀐다',
    ],
    correct: 0,
    explanation:
      '캐시 키에 값이 많을수록 같은 파일도 다른 키로 저장되어 적중률이 떨어집니다. 응답이 정말 달라지는 값만 키에 넣습니다.',
  },
  caution: '캐시 키를 너무 줄이면 서로 다른 응답이 같은 키로 섞이는 캐시 오염이 생깁니다.',
  reflection:
    '우리 서비스는 Invalidation과 파일 이름 버저닝 중 무엇이 더 맞을까요? 배포 빈도를 기준으로 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 2차시 · 스토리지와 CDN 워크북',
      url: 'https://www.notion.so/e00ebb1cb38a8206a6c80113b289da8f',
    },
    {
      title: 'Amazon CloudFront · 캐시 키 이해',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/understanding-the-cache-key.html',
    },
    {
      title: 'Amazon CloudFront · 파일 무효화',
      url: 'https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/Invalidation_Requests.html',
    },
  ],
});
