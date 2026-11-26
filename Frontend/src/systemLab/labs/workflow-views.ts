import {
  Cpu,
  File,
  FileText,
  GitBranch,
  GitCommitHorizontal,
  Network,
  Package,
  Vault,
} from 'lucide-react';
import type { LabView } from '../labContext';
import { awsView } from './aws/view';
import { kindClass, tone } from './palette';

type WorkflowView = Pick<LabView, 'title' | 'description' | 'entry' | 'hints'> &
  Partial<Pick<LabView, 'icons' | 'materialIcons' | 'tones' | 'kindColors'>>;

/** 단원 실습 화면. AWS 카탈로그의 아이콘·색에 실습 전용 노드의 아이콘을 더한다. */
export function workflowView(view: WorkflowView): LabView {
  const { title, description, entry, hints } = view;
  const base = awsView({
    title,
    description,
    entry,
    hints,
    ariaLabel: title + ' 시스템 실습',
    panels: {},
  });
  return {
    ...base,
    icons: { ...base.icons, ...view.icons },
    materialIcons: { ...base.materialIcons, ...view.materialIcons },
    tones: { ...base.tones, ...view.tones },
    kindColors: { ...base.kindColors, ...view.kindColors },
  };
}

export const workflowViews = {
  'intro-workflow': workflowView({
    icons: { git: GitBranch, repo: GitCommitHorizontal, readObjects: File, executeCode: Cpu },
    materialIcons: { objects: File, dataset: Package, 'task-result': FileText },
    tones: { objects: tone.gold, dataset: tone.teal, 'task-result': tone.green },
    kindColors: { git: kindClass.slate, repo: kindClass.slate, readObjects: kindClass.gold },
    title: 'EC2·저장소·Git 첫 연결 실습',
    description:
      '`Git`의 실행 코드와 `저장소`의 입력 파일을 `EC2`의 코드 실행에 연결하세요. 실행해서 리뷰 3건을 확인하세요.',
    entry: '준비된 노드의 출력을 알맞은 입력에 연결하고 첫 실습을 실행하세요.',
    hints: {
      start: '저장소에서 읽을 reviews.csv를 지정합니다.',
      git: '코드와 버전을 보관하는 저장소입니다.',
      ec2: '코드를 실행하는 서버입니다.',
      repo: '커밋 a1b2c3d에서 리뷰 수를 세는 코드를 제공합니다.',
      storage: 'EC2가 읽을 입력 파일을 보관합니다.',
      readObjects:
        'reviews.csv를 저장소에서 읽습니다. 출력을 EC2 코드 실행의 입력 파일에 연결하세요.',
      executeCode: 'Git의 코드와 저장소의 파일을 모두 받으면 리뷰 수를 셉니다.',
      end: 'EC2에서 보낸 작업 결과를 표시합니다.',
    },
  }),
  'cdn-workflow': workflowView({
    title: '비공개 S3를 CloudFront로 배포하기',
    description:
      '`사용자`가 `정적 파일 버킷`에 바로 요청하고 있습니다. 버킷은 비공개로 둔 채 `CloudFront`를 거쳐 로고 파일 `100건`이 모두 응답을 받게 하세요.',
    entry:
      '먼저 그대로 실행해 막히는 이유를 확인하고, CloudFront를 거치게 연결한 뒤 새 버전이 바로 보이도록 설정을 고치세요.',
    hints: {
      start: '/static/logo.png로 요청 100건을 보냅니다.',
      end: '캐시 응답과 버킷 응답을 합쳐 모든 요청이 응답을 받았는지 확인합니다.',
    },
  }),
  'network-workflow': workflowView({
    title: '퍼블릭 서브넷의 웹 서버에 닿게 하기',
    description:
      '`사용자`의 HTTPS 요청이 `인터넷 게이트웨이`를 지나 `웹 서버`에 닿지 않습니다. 라우팅 테이블과 보안 그룹을 고쳐 요청 `100건`이 모두 응답을 받게 하세요. DB는 프라이빗 서브넷에 그대로 둡니다.',
    entry:
      '인터넷 게이트웨이를 웹 서버에 연결하고 실행한 뒤, 실패 메시지가 가리키는 서브넷과 웹 서버의 설정을 차례로 고치세요.',
    hints: {
      start: 'HTTPS(443)로 요청 100건을 보냅니다.',
      end: '웹 서버가 보낸 응답으로 모든 요청이 응답을 받았는지 확인합니다.',
    },
  }),
  'ha-workflow': workflowView({
    title: '트래픽 급증과 가용 영역 장애를 버티는 웹 서비스',
    description:
      '세일 첫날 요청 `1,000건`이 몰립니다. `웹 ALB`와 `웹 서버 그룹`을 고쳐 모든 요청에 응답하고, `VPC`의 장애 실험으로 가용 영역 하나를 멈춰도 `주문 DB`가 버티게 하세요.',
    entry:
      '주문 DB의 처리 결과를 응답 확인에 연결하고 실행하세요. 실패 메시지를 따라 헬스 체크와 조정 정책을 고친 뒤, VPC에서 2c 장애를 켜고 DB를 지키세요.',
    hints: {
      start: '요청 1,000건을 HTTPS로 보냅니다.',
      end: '주문 DB까지 처리된 요청 수로 모든 주문이 완료됐는지 확인합니다.',
    },
  }),
  'decoupling-workflow': workflowView({
    title: '주문 이벤트를 큐와 주제로 나눠 처리하기',
    description:
      '`주문 함수`가 `재고 큐`에만 메시지를 보내고 있습니다. `주문 완료 주제`로 Fan-out해 재고 차감과 메일 발송이 함께 일어나게 하고, 재고는 `한 번씩만` 차감되게 하세요.',
    entry:
      '그대로 실행해 빠진 처리를 확인하고, SNS 주제로 두 큐에 나눠 보낸 뒤 재고 큐의 유형을 고치세요.',
    hints: {
      start: '주문 API로 요청 100건을 보냅니다.',
      end: '재고 차감 기록에 중복이 없는지, 메일이 발송됐는지 확인합니다.',
    },
  }),
  'week6-workflow': workflowView({
    icons: { gateway: Network, routeTraffic: Network, infer: Cpu, observeResponses: FileText },
    materialIcons: {
      'deployed-model': Vault,
      'traffic-plan': Network,
      prediction: Cpu,
      'serving-report': FileText,
    },
    tones: {
      'deployed-model': tone.purple,
      'traffic-plan': tone.orange,
      prediction: tone.green,
      'serving-report': tone.teal,
    },
    kindColors: { gateway: kindClass.pink, routeTraffic: kindClass.pink },
    title: '사용자 응답을 지키는 버전 전환 실습',
    description:
      '응답을 처리하는 동안 단 한 번도 멈추면 안 됩니다. `버전 처리`를 하나 추가하고, 배포 전략을 바꿔 요청 `100건`에 응답하세요.',
    entry:
      '신규 버전 경로를 만든 뒤 중단 배포와 Blue-Green의 누락을 확인하고, Canary 또는 Shadow로 응답을 유지하세요.',
    hints: {
      start: '번호가 붙은 사용자 요청 100건과 기존·신규 버전을 보냅니다.',
      routeTraffic: '배포 전략과 비율에 따라 사용자 요청과 Shadow 비교 요청을 나눕니다.',
      infer: '들어온 요청을 연결된 버전으로 처리합니다.',
      observeResponses: '사용자 응답과 별도 비교 로그를 운영 보고에 기록합니다.',
      end: '모든 사용자 요청이 한 번씩 응답을 받았는지, 신규 응답과 비교 로그가 분배 내역과 일치하는지 확인합니다.',
    },
  }),
};
