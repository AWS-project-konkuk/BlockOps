import { defineMdxLesson } from '../../defineLesson';

// 본문과 실습 안내는 같은 이름의 .mdx에서 작성합니다.
export default defineMdxLesson({
  id: 'sg-nacl',
  unit: 2,
  order: 3,
  title: '보안 그룹과 NACL: 어디서 무엇을 검사할까',
  minutes: 13,
  summary: '인스턴스 단위의 보안 그룹과 서브넷 단위의 NACL이 트래픽을 검사하는 방식을 비교합니다.',
  scenario:
    '보안 그룹에 443번을 열었는데도 요청이 막힙니다. 요청이 서브넷 경계와 인스턴스 앞을 지날 때 각각 무엇이 검사하는지 따라가 보세요.',
  concepts: [
    '보안 그룹',
    'NACL',
    'Stateful·Stateless',
    '규칙 번호',
    '임시 포트',
    '보안 그룹 체이닝',
  ],
  assessment: {
    question: '보안 그룹과 NACL의 차이로 옳은 것은?',
    options: [
      '보안 그룹은 서브넷에, NACL은 인스턴스에 적용된다',
      '보안 그룹은 거부 규칙만, NACL은 허용 규칙만 쓸 수 있다',
      '보안 그룹은 응답을 기억하지만(Stateful), NACL은 나가는 응답도 다시 검사한다(Stateless)',
      '둘 다 규칙 번호가 낮은 것부터 평가한다',
    ],
    correct: 2,
    explanation:
      '보안 그룹은 인스턴스(ENI)에 붙고 허용 규칙만 있으며 응답을 자동 허용합니다. NACL은 서브넷에 붙고 허용·거부를 번호 순서로 평가하며 응답 방향도 따로 검사합니다.',
  },
  caution:
    'NACL로 인바운드를 막을 때 응답이 나가는 임시 포트(1024~65535)를 아웃바운드에서 막지 않았는지 함께 봅니다.',
  reflection:
    'SSH(22)를 열었는데도 접속이 안 될 때 NACL, 라우팅, 퍼블릭 IP 중 무엇부터 의심할지 순서를 정해 보세요.',
  references: [
    {
      title: '원문 · DevOps 3차시 · 네트워킹 워크북',
      url: 'https://www.notion.so/60cebb1cb38a82688ff2013bcf3500ce',
    },
    {
      title: 'Amazon VPC · 보안 그룹',
      url: 'https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/vpc-security-groups.html',
    },
    {
      title: 'Amazon VPC · 네트워크 ACL',
      url: 'https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/vpc-network-acls.html',
    },
  ],
});
