import type { LabField } from '../curriculum/types';
import type { Material, Port, Stage, Scenario, Wire } from './types';
const p = (id: string, label: string, material: Material, required = true): Port => ({
  id,
  label,
  material,
  required,
});
const node = (
  id: string,
  title: string,
  purpose: string,
  lane: string,
  x: number,
  y: number,
  inputs: Port[],
  outputs: Port[],
  fields: string[] = [],
): Stage => ({ id, title, purpose, lane, x, y, inputs, outputs, fields });
export const wire = (
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
): Wire => ({ source, sourceHandle, target, targetHandle });
const n = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  help: string,
  step = 1,
): LabField => ({ id, label, initial, min, max, step, help });
const s = (
  id: string,
  label: string,
  initial: string,
  choices: [string, string][],
  help: string,
): LabField => ({
  id,
  label,
  initial,
  options: choices.map(([value, label]) => ({ value, label })),
  help,
});
const w = wire;
const scenarios: Scenario[] = [
  {
    id: 'week2-workflow',
    week: 2,
    title: '학습된 모델을 Pod 안에서 서비스하기',
    problem:
      '학습과 평가를 마친 리뷰 분류 모델을 사용자가 호출할 수 있는 서비스로 만들려 합니다. 모델 파일, 실행 환경, Pod 관리, 요청 경로를 연결하세요.',
    task: '서빙 이미지와 검증된 모델을 두 Pod에 연결하고, Deployment의 관리 선언과 Service의 사용자 요청을 구분해 예측 응답까지 추적하세요.',
    takeaway:
      '컨테이너는 서빙 앱을 실행하고, Pod는 그 컨테이너가 실행되는 Kubernetes의 단위입니다. 모델을 읽은 앱이 추론하며 Deployment와 Service는 실행 유지와 요청 접근을 돕습니다.',
    fields: [
      s(
        'image',
        '서빙 이미지 태그',
        'v1',
        [
          ['v1', 'v1'],
          ['v2', 'v2'],
        ],
        '빌드 결과와 배포에 지정한 태그를 비교하세요.',
      ),
      s(
        'deployment',
        'Deployment 이미지 태그',
        'v1',
        [
          ['v1', 'v1'],
          ['v2', 'v2'],
        ],
        'Deployment는 이미지를 빌드하지 않고 사용할 버전을 지정합니다.',
      ),
      s(
        'healing',
        '장애 뒤 복제본 복구',
        'on',
        [
          ['off', '복구 사용 안 함'],
          ['on', '원하는 복제본 2개로 복구'],
        ],
        '기본 실습은 사용 상태로 둡니다. 확장에서 사용 안 함으로 바꾸면 Pod 1 장애를 복구하지 않는 경우를 비교합니다.',
      ),
    ],
    nodes: [
      node(
        'model',
        '검증된 모델 model-v1',
        '학습과 평가를 마친 모델 파일입니다. 이 실습에서 새로 학습하지 않습니다.',
        '모델 준비',
        0,
        0,
        [],
        [p('model', '검증된 모델 파일', 'model')],
      ),
      node(
        'image',
        '서빙 컨테이너 이미지',
        '추론 코드·Python·라이브러리를 담은 실행 템플릿입니다. 모델은 별도 입력으로 읽습니다.',
        '실행 환경',
        0,
        220,
        [],
        [p('image', '실행 이미지', 'image')],
        ['image'],
      ),
      node(
        'controller',
        'Deployment',
        '두 복제본과 이미지 버전을 선언합니다.',
        '관리',
        0,
        440,
        [],
        [p('desired', '원하는 상태', 'control')],
        ['deployment', 'healing'],
      ),
      node(
        'requests',
        '요청 10건',
        '예측 요청이 Service에 도착합니다.',
        '요청',
        0,
        680,
        [],
        [p('request', '사용자 요청', 'request')],
      ),
      node(
        'service',
        'Service',
        '요청을 두 Pod 경로로 분배합니다.',
        '전달',
        290,
        680,
        [p('request', '사용자 요청', 'request')],
        [p('a', '요청 1~5', 'request'), p('b', '요청 6~10', 'request')],
      ),
      node(
        'pod1',
        'Pod 1 · 서빙 컨테이너',
        '이 Pod 안의 컨테이너가 앱을 실행하고 model-v1을 읽어 추론합니다.',
        '실행',
        600,
        50,
        [
          p('image', '실행 환경 이미지', 'image'),
          p('model', '로딩할 모델 파일', 'model'),
          p('desired', '관리 선언', 'control'),
          p('request', '요청', 'request'),
        ],
        [p('response', '예측 응답', 'prediction')],
      ),
      node(
        'pod2',
        'Pod 2 · 서빙 컨테이너',
        '같은 이미지와 모델을 사용하는 별도 실행본입니다. 메모리 상태는 공유하지 않습니다.',
        '실행',
        600,
        350,
        [
          p('image', '실행 환경 이미지', 'image'),
          p('model', '로딩할 모델 파일', 'model'),
          p('desired', '관리 선언', 'control'),
          p('request', '요청', 'request'),
        ],
        [p('response', '예측 응답', 'prediction')],
      ),
      node(
        'response',
        '사용자 응답',
        '두 복제본의 처리 결과를 확인합니다.',
        '결과',
        920,
        200,
        [p('a', 'Pod 1 응답', 'prediction'), p('b', 'Pod 2 응답', 'prediction')],
        [p('result', '10건 처리', 'prediction')],
      ),
    ],
    wires: [
      w('model', 'model', 'pod1', 'model'),
      w('model', 'model', 'pod2', 'model'),
      w('requests', 'request', 'service', 'request'),
      w('image', 'image', 'pod1', 'image'),
      w('image', 'image', 'pod2', 'image'),
      w('controller', 'desired', 'pod1', 'desired'),
      w('controller', 'desired', 'pod2', 'desired'),
      w('service', 'a', 'pod1', 'request'),
      w('service', 'b', 'pod2', 'request'),
      w('pod1', 'response', 'response', 'a'),
      w('pod2', 'response', 'response', 'b'),
    ],
    starter: [
      w('model', 'model', 'pod1', 'model'),
      w('requests', 'request', 'service', 'request'),
      w('image', 'image', 'pod1', 'image'),
      w('image', 'image', 'pod2', 'image'),
    ],
    question: '사용자의 새 리뷰를 실제로 예측하는 곳과 Kubernetes의 역할을 올바르게 연결하면?',
    options: [
      'Pod 안의 서빙 컨테이너가 모델로 추론하고, Kubernetes는 그 실행 상태와 접근 구성을 관리한다.',
      'Service가 모델을 학습하고 Deployment가 모든 리뷰의 예측을 계산한다.',
    ],
    explanation:
      '이미지는 앱 실행 환경, 컨테이너는 실행본, Pod는 Kubernetes의 실행 단위입니다. 실제 추론은 모델을 로딩한 앱이 수행하며, Deployment는 실행본 관리, Service는 요청 접근을 담당합니다.',
  },
  {
    id: 'week6-workflow',
    week: 6,
    title: '사용자 응답을 지키며 모델 전환하기',
    problem:
      '신규 모델이 아직 준비되지 않았습니다. 전환 비율과 Shadow 복제 비율을 혼동하면 어떤 요청이 영향을 받을까요?',
    task: '요청 경로·사용자 응답·비교 로그를 각각 연결하세요. 중단 배포 실패와 안전한 전략을 비교하고 신규 모델의 실제 응답 수를 확인하세요.',
    takeaway:
      'Canary의 신규 응답은 사용자에게 전달됩니다. Shadow는 복제 요청을 비교하지만 사용자에게는 기존 모델의 응답을 전달합니다.',
    fields: [
      s(
        'strategy',
        '배포 전략',
        'recreate',
        [
          ['recreate', '중단 배포'],
          ['bluegreen', 'Blue·Green'],
          ['canary', 'Canary'],
          ['shadow', 'Shadow'],
        ],
        '실제 요청 100건을 고정적으로 분배하는 예시입니다.',
      ),
      n(
        'traffic',
        '신규 또는 복제 비율 (%)',
        10,
        0,
        100,
        'Canary는 실제 신규 응답, Shadow는 복제 요청의 비율입니다.',
      ),
      s(
        'ready',
        '신규 모델 준비',
        'no',
        [
          ['no', '준비되지 않음'],
          ['yes', '준비 확인 완료'],
        ],
        '새 버전을 활성화하기 전 상태를 확인합니다.',
      ),
      s(
        'phase',
        'Blue·Green 전환',
        'prepare',
        [
          ['prepare', '준비 · 기존 경로 유지'],
          ['switch', '신규로 전환'],
          ['rollback', '기존으로 롤백'],
        ],
        'Blue·Green 전략일 때 사용합니다.',
      ),
    ],
    nodes: [
      node(
        'requests',
        '사용자 요청',
        '100개 실제 요청이 들어옵니다.',
        '입력',
        0,
        140,
        [],
        [p('request', '100건 요청', 'request')],
      ),
      node(
        'router',
        '요청 라우터',
        '실제 트래픽과 복제 트래픽을 구분합니다.',
        '분배',
        300,
        140,
        [p('request', '사용자 요청', 'request')],
        [p('old', '기존 경로', 'request'), p('new', '신규·복제 경로', 'request')],
        ['strategy', 'traffic', 'phase'],
      ),
      node(
        'old',
        '기존 모델',
        '운영 버전에서 요청을 처리합니다.',
        '실행',
        620,
        0,
        [p('request', '기존 요청', 'request')],
        [p('actual', '실제 응답', 'prediction'), p('log', '관측 로그', 'metrics')],
      ),
      node(
        'new',
        '신규 모델',
        '준비 상태와 신규 요청의 의미를 확인합니다.',
        '실행',
        620,
        300,
        [p('request', '신규·복제 요청', 'request')],
        [p('actual', '실제 응답', 'prediction'), p('log', '비교 로그', 'metrics')],
        ['ready'],
      ),
      node(
        'response',
        '사용자에게 전달',
        '실제 응답 수·실패 수를 계산합니다.',
        '결과',
        960,
        0,
        [p('old', '기존 응답', 'prediction'), p('new', '신규 응답', 'prediction')],
        [p('response', '사용자 결과', 'prediction')],
      ),
      node(
        'observe',
        '배포 관측',
        '실제 응답과 Shadow 비교 결과를 따로 봅니다.',
        '관측',
        960,
        300,
        [p('old', '기존 로그', 'metrics'), p('new', '신규 로그', 'metrics')],
        [p('decision', '확대·롤백 판단', 'decision')],
      ),
    ],
    wires: [
      w('requests', 'request', 'router', 'request'),
      w('router', 'old', 'old', 'request'),
      w('router', 'new', 'new', 'request'),
      w('old', 'actual', 'response', 'old'),
      w('new', 'actual', 'response', 'new'),
      w('old', 'log', 'observe', 'old'),
      w('new', 'log', 'observe', 'new'),
    ],
    starter: [
      w('requests', 'request', 'router', 'request'),
      w('router', 'old', 'old', 'request'),
      w('old', 'actual', 'response', 'old'),
    ],
    question: 'Shadow에서 새 모델로 복제 요청 100건을 보냈다면 신규 사용자 응답 수는?',
    options: [
      '0건. 사용자 응답은 기존 모델이 담당한다.',
      '100건. 복제 비율이 사용자 응답 비율과 같다.',
    ],
    explanation:
      '요청 복제와 사용자 응답 전환은 다른 관계입니다. 관측 후 승격 여부를 별도로 결정합니다.',
  },
];
export const scenarioById = Object.fromEntries(scenarios.map((s) => [s.id, s])) as Record<
  string,
  Scenario
>;
/** 설정값에 따라 노드 구성이 바뀌는 시나리오는 여기서 변형한다. 지금은 바뀌는 시나리오가 없다. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resolveScenario(id: string, _answers: Record<string, unknown>): Scenario {
  return scenarioById[id];
}
