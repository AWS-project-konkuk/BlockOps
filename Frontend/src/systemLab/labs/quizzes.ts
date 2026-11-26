export interface Quiz {
  question: string;
  options: string[];
  /** 정답 보기의 위치. */
  correct: number;
  explanation: string;
}

/** 시스템 실습의 이해 확인. 모든 문항은 4지선다이며 정답 위치를 고르게 나눈다. */
export const quizzes: Readonly<Record<string, Quiz>> = {
  'week2-workflow': {
    question: '사용자의 새 리뷰를 실제로 예측하는 곳과 Kubernetes의 역할을 올바르게 연결하면?',
    options: [
      'Service가 모델을 학습하고 Deployment가 모든 리뷰의 예측을 계산한다.',
      'Docker 이미지가 직접 요청을 받아 모델 예측을 계산한다.',
      'Pod 안의 서빙 컨테이너가 모델로 추론하고, Kubernetes는 그 실행 상태와 접근 구성을 관리한다.',
      'Kubernetes가 모델을 직접 로딩해 예측하고 Pod는 로그만 보관한다.',
    ],
    correct: 2,
    explanation:
      '이미지는 앱 실행 환경, 컨테이너는 실행본, Pod는 Kubernetes의 실행 단위입니다. 실제 추론은 모델을 로딩한 앱이 수행하며, Deployment는 실행본 관리, Service는 요청 접근을 담당합니다.',
  },
  'week6-workflow': {
    question: 'Shadow에서 신규 버전으로 요청을 복제했다면 신규 버전의 사용자 응답 수는?',
    options: [
      '복제한 요청 수만큼. 복제는 곧 사용자 응답이다.',
      '복제 비율의 절반. 나머지는 기존 버전이 응답한다.',
      'Canary와 같이 복제 비율만큼 신규 버전이 사용자에게 응답한다.',
      '0건. 사용자 응답은 기존 버전이 담당하고 복제 결과는 비교 로그에만 남는다.',
    ],
    correct: 3,
    explanation:
      '요청 복제와 사용자 응답 전환은 다른 관계입니다. 관측 후 승격 여부를 별도로 결정합니다.',
  },
};
