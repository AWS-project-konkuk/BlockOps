import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'vpc-subnet',
  unit: 2,
  order: 1,
  title: 'VPC와 서브넷: 내 네트워크의 경계 나누기',
  minutes: 14,
  summary: 'VPC로 격리된 네트워크를 만들고 CIDR로 서브넷을 나누는 방법을 배웁니다.',
  scenario:
    '쇼핑몰 서버와 DB를 같은 네트워크에 두되 DB는 바깥에서 보이지 않게 하려 합니다. VPC의 IP 범위를 정하고, 가용 영역별로 서브넷을 나눠 보세요.',
  concepts: ['VPC', 'CIDR', '서브넷 마스크', '예약 IP', '가용 영역', '퍼블릭·프라이빗 서브넷'],
  assessment: {
    question: '10.0.0.0/24 서브넷에서 EC2에 실제로 줄 수 있는 IP는 몇 개일까요?',
    options: ['256개', '254개', '251개', '128개'],
    correct: 2,
    explanation:
      '/24는 2의 8제곱인 256개 주소입니다. AWS는 네트워크 주소, VPC 라우터, DNS, 예비, 브로드캐스트로 5개를 예약하므로 251개를 쓸 수 있습니다.',
  },
  caution:
    '서브넷끼리 CIDR이 겹치면 만들 수 없습니다. VPC 하나는 리전 하나에 속하고, 서브넷 하나는 가용 영역 하나에 속합니다.',
  reflection: '같은 VPC의 두 서브넷은 무엇이 같고, 무엇이 반드시 달라야 할까요?',
  references: [
    {
      title: '원문 · DevOps 3차시 · 네트워킹 워크북',
      url: 'https://www.notion.so/60cebb1cb38a82688ff2013bcf3500ce',
    },
    {
      title: 'Amazon VPC · VPC와 서브넷의 IP 주소 지정',
      url: 'https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/vpc-ip-addressing.html',
    },
  ],
});
