import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'route-igw-nat',
  unit: 2,
  order: 2,
  title: '라우팅 테이블로 퍼블릭·프라이빗 나누기',
  minutes: 14,
  summary: '인터넷 게이트웨이와 라우팅 테이블, NAT 게이트웨이로 서브넷의 통신 경로를 정합니다.',
  scenario:
    '퍼블릭 서브넷에 둔 웹 서버에 접속이 안 되고, 프라이빗 서브넷의 서버는 패키지를 내려받지 못합니다. 두 서브넷의 라우팅 테이블에 어떤 경로가 있어야 하는지 찾아보세요.',
  concepts: [
    '인터넷 게이트웨이',
    'Attach·Associate',
    '라우팅 테이블',
    '0.0.0.0/0',
    'NAT 게이트웨이',
    'Bastion',
    'VPC 엔드포인트',
  ],
  assessment: {
    question:
      '인터넷 게이트웨이를 VPC에 붙였는데도 웹 서버에 접속이 안 됩니다. 가장 먼저 확인할 것은?',
    options: [
      '웹 서버의 인스턴스 유형',
      '서브넷 라우팅 테이블에 0.0.0.0/0 → 인터넷 게이트웨이 경로가 있는지',
      'S3 버킷의 버전 관리',
      'RDS의 Multi-AZ 설정',
    ],
    correct: 1,
    explanation:
      '인터넷 게이트웨이는 VPC에 붙이는 것(Attach)만으로는 쓰이지 않습니다. 라우팅 테이블에 경로를 두고 서브넷에 연결(Associate)해야 트래픽이 지나갑니다.',
  },
  caution:
    'NAT 게이트웨이는 안에서 밖으로 나가는 연결만 허용합니다. 인터넷에서 프라이빗 서브넷으로 들어오는 길을 열어 주지 않습니다.',
  reflection:
    'S3 게이트웨이 엔드포인트가 있으면 NAT 없이도 S3에 접근할 수 있는 이유를 한 문장으로 설명해 보세요.',
  references: [
    {
      title: '원문 · DevOps 3차시 · 네트워킹 워크북',
      url: 'https://www.notion.so/60cebb1cb38a82688ff2013bcf3500ce',
    },
    {
      title: 'Amazon VPC · 라우팅 테이블 구성',
      url: 'https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/VPC_Route_Tables.html',
    },
    {
      title: 'Amazon VPC · NAT 게이트웨이',
      url: 'https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/vpc-nat-gateway.html',
    },
  ],
});
