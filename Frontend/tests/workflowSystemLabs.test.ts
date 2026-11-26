import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/systemLab/commands';
import { runLab } from '../src/systemLab/engine';
import {
  type Connection,
  type Graph,
  type LabConfig,
  type SettingValue,
} from '../src/systemLab/lab';
import { labConfigs, labFor } from '../src/systemLab/labs';
import { introWorkflowLab } from '../src/systemLab/labs/intro-workflow';
import { wired } from '../src/systemLab/labs/kit';
import { transitionLab } from '../src/systemLab/labs/transition';
import { parseSaved } from '../src/systemLab/store';

const labs = [introWorkflowLab, transitionLab];
const connect = (lab: LabConfig, graph: Graph, edges: Connection[] = lab.starterTasks) =>
  edges.reduce((next, edge) => applyCommand(next, { type: 'connect', edge }, lab), graph);
const run = (lab: LabConfig, graph: Graph) => runLab(graph, 'test', lab);
const set = (lab: LabConfig, graph: Graph, id: string, key: string, value: SettingValue) =>
  applyCommand(graph, { type: 'setting', id, key, value }, lab);
const metrics = (result: ReturnType<typeof run>) =>
  Object.fromEntries(result.metrics.map(({ label, value }) => [label, value]));

describe('단원 말미 시스템 실습', () => {
  it('단원 종합 실습 강의만 시스템 실습을 연다', () => {
    expect(Object.keys(labConfigs).sort()).toEqual([
      'intro-workflow',
      'week2-workflow',
      'week6-workflow',
    ]);
    expect(labFor('pv-pvc')).toBeUndefined();
  });

  it('0단원에서 Git 코드와 S3 파일이 모두 들어오면 EC2가 리뷰 수를 계산한다', () => {
    const lab = introWorkflowLab;
    expect(run(lab, connect(lab, lab.initial(), lab.starterTasks.slice(0, 1))).success).toBe(false);
    expect(run(lab, connect(lab, lab.initial(), lab.starterTasks.slice(1))).success).toBe(false);
    const result = run(lab, connect(lab, lab.initial()));
    expect(result.success).toBe(true);
    expect(metrics(result)).toEqual({
      '실행한 코드의 커밋': 'a1b2c3d',
      '읽은 파일': 'reviews.csv',
      '리뷰 수': '3건',
    });
  });

  it.each(labs)('$id의 초기 그래프와 저장한 관찰을 복원한다', (lab) => {
    const graph = lab.initial();
    expect(run(lab, graph).success).toBe(false);
    const restored = parseSaved(
      JSON.stringify({
        version: 1,
        graph,
        quiz: false,
        proof: null,
        observed: lab.requiredObservations.slice(0, 1),
      }),
      lab,
    );
    expect(restored.graph).toEqual(graph);
    expect(restored.observed).toEqual(lab.requiredObservations.slice(0, 1));
  });

  it('전환 공백을 감지하고 Canary와 Shadow의 결과를 다르게 집계한다', () => {
    const lab = transitionLab;
    let graph = lab.initial();
    expect(graph.entities.filter((e) => e.kind === 'infer')).toHaveLength(1);
    graph = applyCommand(graph, { type: 'add', parent: 'gateway', kind: 'infer', id: 'new' }, lab);
    graph = connect(lab, graph, [
      wired('router', 'new', 'new', 'request'),
      wired('start', 'new', 'new', 'model'),
      wired('new', 'prediction', 'observe', 'prediction'),
    ]);
    const interrupted = run(lab, graph);
    expect(interrupted.success).toBe(false);
    expect(interrupted.observations).toEqual(['release-gap']);
    expect(metrics(interrupted)['전환 중 실패']).toBe('20건');
    const blueGreen = run(lab, set(lab, graph, 'router', 'strategy', 'blue-green'));
    expect(blueGreen.success).toBe(false);
    expect(blueGreen.message).toContain('이번 배포를 반려합니다');
    expect(blueGreen.observations).toEqual(['switch-gap']);
    expect(metrics(blueGreen)['전환 중 실패']).toBe('5건');
    graph = set(lab, graph, 'router', 'strategy', 'canary');
    expect(run(lab, graph).success).toBe(true);
    expect(metrics(run(lab, graph))['신규 모델 사용자 응답']).toBe('10건');
    graph = set(lab, graph, 'router', 'strategy', 'shadow');
    graph = set(lab, graph, 'router', 'share', '50');
    const shadow = run(lab, graph);
    expect(shadow.success).toBe(true);
    expect(metrics(shadow)).toMatchObject({
      '사용자 응답': '100건',
      '신규 모델 사용자 응답': '0건',
      'Shadow 비교 로그': '50건',
    });
    graph = applyCommand(graph, { type: 'remove', id: 'new' }, lab);
    expect(run(lab, graph).success).toBe(false);
  });
});
