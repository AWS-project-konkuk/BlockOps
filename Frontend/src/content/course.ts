/** DevOps 스터디 워크북(3학년 2학기) Notion 페이지. 1~7차시 순서이고 마지막은 Prometheus 정리입니다. */
export const notionWorkbooks = [
  'c67ebb1cb38a828db9d381b8f8372e3c',
  'e00ebb1cb38a8206a6c80113b289da8f',
  '60cebb1cb38a82688ff2013bcf3500ce',
  'fa2ebb1cb38a8267aa20818d08f186be',
  '8f2ebb1cb38a834fa96381de7e3aef03',
  '392ebb1cb38a8286b9b501e0da4e0fdc',
  'badebb1cb38a839c970f81ff7a4a399d',
  '36eebb1cb38a807695a0f040e6c41652',
];
const workbookTitles = [
  'DevOps 1차시 · AWS 시작하기',
  'DevOps 2차시 · 스토리지와 CDN',
  'DevOps 3차시 · 네트워킹',
  'DevOps 4차시 · 확장성과 고가용성',
  'DevOps 5차시 · 디커플링 애플리케이션',
  'DevOps 6차시 · 컨테이너',
  'DevOps 7차시 · Serverless',
  'DevOps · Prometheus',
];
const titles = [
  '클라우드와 EC2',
  '스토리지와 CDN',
  '네트워킹',
  '확장성과 고가용성',
  '디커플링',
  '컨테이너',
  '서버리스',
  '관측',
  '전체 아키텍처 종합',
  'CI/CD와 배포 전략',
];
const summaries = [
  'IAM·Region·AZ·EC2·EBS·AMI·S3와 첫 노드 실습',
  'S3 권한·스토리지 클래스·CloudFront 캐시',
  'VPC·서브넷·라우팅·IGW·NAT·보안 그룹·NACL',
  'ALB·Auto Scaling Group·RDS Multi-AZ',
  'SQS·SNS·Kinesis와 비동기 처리',
  'Docker·ECR·ECS·EKS·Kubernetes',
  'Lambda·API Gateway·DynamoDB',
  'Metrics·Logs·Traces와 Prometheus',
  '1~7단원 서비스를 하나의 구조로 연결',
  '빌드·배포 자동화와 Recreate·Blue-Green·Canary',
];
export const units = titles.map((title, week) => ({
  week,
  title,
  summary: summaries[week],
  color: '#8a82c4',
}));
/** 단원별 워크북 번호(1부터). 워크북이 없는 단원은 undefined입니다. */
export const sourceWeeks: (number | undefined)[] = [1, 2, 3, 4, 5, 6, 7, 8, undefined, undefined];
/** 전체 구조 지도(`WorkflowMap`)에서 강조할 영역. */
export const stages = [
  ['compute'],
  ['storage'],
  ['network'],
  ['scale'],
  ['messaging'],
  ['compute'],
  ['compute', 'storage'],
  ['observe'],
  ['compute', 'storage', 'network', 'scale', 'messaging', 'observe', 'delivery'],
  ['delivery'],
];

const official = [
  'https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/concepts.html',
  'https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/Introduction.html',
  'https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/what-is-amazon-vpc.html',
  'https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/auto-scaling-groups.html',
  'https://docs.aws.amazon.com/ko_kr/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html',
  'https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/Welcome.html',
  'https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/welcome.html',
  'https://prometheus.io/docs/introduction/overview/',
  'https://docs.aws.amazon.com/ko_kr/wellarchitected/latest/framework/welcome.html',
  'https://docs.github.com/ko/actions/about-github-actions/understanding-github-actions',
];
export function references(unit: number) {
  const workbook = sourceWeeks[unit];
  return [
    ...(workbook
      ? [
          {
            title: `원문 · ${workbookTitles[workbook - 1]} 워크북`,
            url: `https://www.notion.so/${notionWorkbooks[workbook - 1]}`,
          },
        ]
      : []),
    { title: '공식 자료 · 원리와 적용 조건', url: official[unit] },
  ];
}
