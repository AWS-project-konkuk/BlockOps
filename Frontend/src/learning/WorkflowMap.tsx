import { Link } from 'react-router';
import { lessons } from '../curriculum/blockops';
import type { Lesson } from '../curriculum/types';
import styles from './LessonLayout.module.css';

/** [영역 키, 제목, 설명, 대표 단원] */
type Stage = [string, string, string, number];
const lanes: { title: string; stages: Stage[] }[] = [
  {
    title: '요청 처리 · 사용자에서 데이터까지',
    stages: [
      ['compute', '실행 자원', 'EC2·컨테이너·Lambda가 코드를 실행', 0],
      ['storage', '저장과 전달', 'S3·CloudFront·RDS·DynamoDB', 1],
      ['network', '네트워크 경계', 'VPC·서브넷·라우팅·보안 그룹', 2],
      ['scale', '확장과 가용성', '로드 밸런서·Auto Scaling·Multi-AZ', 3],
    ],
  },
  {
    title: '비동기 처리',
    stages: [['messaging', '메시지와 스트림', 'SQS·SNS·Kinesis로 서비스 분리', 4]],
  },
  {
    title: '운영',
    stages: [
      ['delivery', '빌드와 배포', '배포 자동화와 Blue-Green·Canary', 9],
      ['observe', '관측', '지표·로그·추적으로 상태 확인', 7],
    ],
  },
];
const firstLessonOf = (unit: number) => lessons.find((item) => item.week === unit)?.id;

export function WorkflowMap({ lesson }: { lesson: Lesson }) {
  return (
    <section className={styles.workflowMap} aria-label="전체 구조 지도">
      <h2>전체 구조에서 지금 배우는 곳</h2>
      <p>강조한 영역이 이 강의와 연결됩니다. 각 영역을 선택하면 관련 강의로 이동합니다.</p>
      {lanes.map((lane) => (
        <div key={lane.title}>
          <h3>{lane.title}</h3>
          <ol>
            {lane.stages.map(([id, title, detail, unit]) => {
              const target = firstLessonOf(unit);
              const content = (
                <>
                  <strong>{title}</strong>
                  <span>{target ? detail : `${detail} · 준비 중`}</span>
                </>
              );
              return (
                <li key={id} data-current={lesson.mapStages?.includes(id)}>
                  {target ? <Link to={`/learn/${target}`}>{content}</Link> : <div>{content}</div>}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
