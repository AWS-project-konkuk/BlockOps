import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'network-workflow',
  unit: 2,
  order: 4,
  title: '실습 · 퍼블릭 서브넷의 웹 서버에 닿게 하기',
  minutes: 12,
  summary: '라우팅 테이블과 보안 그룹을 고쳐 인터넷 요청이 퍼블릭 서브넷의 웹 서버에 닿게 합니다.',
  scenario:
    '인터넷 게이트웨이까지는 왔는데 웹 서버가 응답하지 않습니다. 실패 메시지를 따라 서브넷 경로와 인스턴스 앞의 검문소를 하나씩 고치고, DB는 프라이빗 서브넷에 둔 채 요청 100건에 응답하세요.',
  concepts: ['인터넷 게이트웨이', '라우팅 테이블', '보안 그룹', '퍼블릭 IP', '프라이빗 서브넷'],
  assessment: {
    question: '이번 실습에서 라우팅 경로를 고친 뒤에도 요청이 막힌 이유는?',
    options: [
      'DB가 프라이빗 서브넷에 있어서',
      '인터넷 게이트웨이가 두 개 필요해서',
      '보안 그룹이 SSH 22번만 허용해 HTTPS 443 요청을 막아서',
      'VPC의 CIDR이 너무 작아서',
    ],
    correct: 2,
    explanation:
      '경로가 생겨도 인스턴스 앞의 보안 그룹이 요청 포트를 허용하지 않으면 닿지 않습니다. 웹 서버는 443을, DB는 웹 서버의 보안 그룹만 허용합니다.',
  },
  references: [
    {
      title: '원문 · DevOps 3차시 · 네트워킹 워크북',
      url: 'https://www.notion.so/60cebb1cb38a82688ff2013bcf3500ce',
    },
    {
      title: 'Amazon VPC · 웹 서버와 DB 서버를 위한 VPC 예시',
      url: 'https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/vpc-example-web-database-servers.html',
    },
  ],
});
