import { defineMdxLesson } from '../../defineLesson';

export default defineMdxLesson({
  id: 'observe-workflow',
  unit: 7,
  order: 3,
  title: '실습 · 컨테이너와 함수의 지표를 한곳에서 보기',
  minutes: 10,
  summary:
    '컨테이너 지표는 Prometheus로 당겨 오고, Lambda 지표는 CloudWatch로 보내 두 대시보드를 완성합니다.',
  scenario:
    '주문 API 서비스와 매일 도는 정산 함수의 지표를 모두 Prometheus에 연결했더니 수집이 실패합니다. 대상마다 Pull과 Push 중 어떤 수집 방식이 맞는지 판단해 대시보드를 완성하세요.',
  concepts: ['Metrics', 'Prometheus Pull', 'CloudWatch Push', '스크랩 대상', '대시보드'],
  assessment: {
    question: 'Prometheus가 Lambda 지표를 수집하지 못한 이유는?',
    options: [
      'Lambda는 지표를 만들지 않아서',
      'Prometheus의 스크랩 간격이 너무 길어서',
      'CloudWatch가 Prometheus보다 항상 정확해서',
      'Lambda는 잠깐 실행되고 꺼져서 Prometheus가 주기적으로 당겨 올 대상이 남아 있지 않아서',
    ],
    correct: 3,
    explanation:
      'Pull 방식은 계속 떠 있는 대상에서 지표를 가져옵니다. 짧게 실행되는 함수나 배치는 스스로 지표를 보내는 Push 방식이 맞습니다.',
  },
  references: [
    {
      title: '원문 · DevOps · Prometheus 정리',
      url: 'https://www.notion.so/36eebb1cb38a807695a0f040e6c41652',
    },
    {
      title: 'AWS Lambda · CloudWatch 지표',
      url: 'https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/monitoring-metrics.html',
    },
  ],
});
