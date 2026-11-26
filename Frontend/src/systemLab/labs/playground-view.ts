import type { LabView } from '../labContext';
import { awsView } from './aws/view';

/** 플레이그라운드 화면. AWS 카탈로그의 아이콘·색·설명을 그대로 쓴다. */
export const playgroundView: LabView = awsView({
  title: 'AWS 플레이그라운드',
  description:
    '단원 실습에서 쓴 AWS 서비스를 자유롭게 연결해 보세요. `인터넷`에 사용자를 추가해 요청을 보내고, `VPC`의 서브넷에 EC2·RDS를 두거나 `서버리스`·`메시징`으로 구성을 이어 가세요. 연결이 하나라도 있는 노드는 모두 실행됩니다.',
  ariaLabel: 'AWS 플레이그라운드',
  entry: '서비스 안에 노드를 추가하고, 출력에서 같은 자료 타입의 입력으로 연결하세요.',
  panels: {},
  hints: {
    root: '서비스를 선택해 노드를 추가하세요. 연결이 하나라도 있는 노드는 모두 실행됩니다.',
  },
});
