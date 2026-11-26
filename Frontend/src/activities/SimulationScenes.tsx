import type { ActivitySceneProps } from './types';
import styles from './SimulationScenes.module.css';

const trafficOutcomes = [
  { key: 'old', label: '기존 모델 응답' },
  { key: 'new', label: '신규 모델 응답' },
  { key: 'failed', label: '실패' },
] as const;

export function ReleaseScene({ spec, result }: ActivitySceneProps) {
  const [next, previous, failed, shadow] = result.metrics;
  if (!next || !previous || !failed || !shadow) return null;
  const recreate = spec.variant === 'recreate';
  const counts = [previous.amount ?? 0, next.amount ?? 0, failed.amount ?? 0];
  const cells = counts.flatMap((count, index) =>
    Array.from({ length: count }, () => trafficOutcomes[index].key),
  );

  return (
    <figure className={styles.scene}>
      <figcaption>
        <strong>사용자 요청 100건의 결과</strong>
        <span>한 칸은 사용자 요청 한 건입니다.</span>
      </figcaption>
      <div className={styles.trafficLayout}>
        <div className={styles.requests} aria-hidden="true">
          {cells.map((state, i) => (
            <span key={i} data-outcome={state} />
          ))}
        </div>
        <dl className={styles.trafficLegend}>
          {trafficOutcomes.map(({ key, label }, index) => {
            if (recreate && key === 'new') return null;
            return (
              <div key={key}>
                <dt>
                  <span data-outcome={key} />
                  {recreate && key === 'old' ? '처리한 요청' : label}
                </dt>
                <dd>{counts[index]}건</dd>
              </div>
            );
          })}
        </dl>
      </div>
      {spec.variant === 'shadow' && (
        <div className={styles.shadowTraffic}>
          <strong>비교 로그로 보낸 복제 요청 {shadow.amount}건</strong>
          <div className={styles.shadowBar} aria-hidden="true">
            <span style={{ width: `${shadow.amount}%` }} />
          </div>
          <p>신규 모델의 처리 결과는 비교 로그에 기록합니다.</p>
        </div>
      )}
    </figure>
  );
}
