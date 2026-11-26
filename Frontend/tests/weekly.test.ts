import { describe, expect, it } from 'vitest';
import { lessonById, lessons } from '../src/curriculum/blockops';
import type { Answer, LabState } from '../src/curriculum/types';
import { emptyLearning, parseLearning, serializeLearning } from '../src/learning/blockProgress';
import { createNodeLab } from '../src/nodes/lessonNodes';
import {
  runWorkflow,
  workflowEdge,
  workflowGoals,
  workflowIssues,
  workflowSignature,
} from '../src/weekly/engine';
import { resolveScenario } from '../src/weekly/scenarios';
import { applyWorkflowPreset } from '../src/weekly/presets';
const fixes: Record<string, Record<string, Answer>> = {
  'week2-workflow': { image: 'v2', deployment: 'v2', healing: 'on' },
  'week6-workflow': { strategy: 'shadow', ready: 'yes' },
};
const connected = (id: string, changes: Record<string, Answer> = {}): LabState => {
  const lab = createNodeLab(lessonById[id]);
  lab.answers = { ...lab.answers, ...changes };
  lab.edges = resolveScenario(id, lab.answers).wires.map(workflowEdge);
  return lab;
};
describe('개념과 주차 종합 과정 분리', () => {
  it('주차 종합 실습 강의를 단원에 배치한다', () => {
    expect(lessons.filter((l) => l.id.endsWith('-workflow')).length).toBeGreaterThan(2);
    expect(lessonById['week2-workflow'].week).toBe(5);
    expect(lessonById['week6-workflow'].week).toBe(9);
  });
  for (const id of Object.keys(fixes).filter((id) => id !== 'week2-workflow'))
    it(`${id}: 조건 실패 후 개선하면 실제 자료를 전달해 완료한다`, () => {
      const bad = connected(id);
      expect(workflowIssues(resolveScenario(id, bad.answers), bad)).toEqual([]);
      const failed = runWorkflow(id, bad);
      expect(failed.success).toBe(false);
      expect(failed.stages.some((s) => s.status === 'failed')).toBe(true);
      expect(
        failed.stages.filter((s) => s.status !== 'success').every((s) => s.outputs.length === 0),
      ).toBe(true);
      const good = connected(id, fixes[id]);
      const result = runWorkflow(id, good);
      expect(result.success).toBe(true);
      expect(result.stages.every((s) => s.status === 'success')).toBe(true);
      expect(result.stages.at(-1)!.outputs.length).toBeGreaterThan(0);
    });
  it('모델 서빙 실습은 정상 연결에서 시작하며 모델 입력이 빠지면 예측을 만들지 않는다', () => {
    const id = 'week2-workflow';
    const lab = connected(id);
    const ready = runWorkflow(id, lab);
    expect(ready.success).toBe(true);
    expect(ready.stages.find((stage) => stage.node === 'pod2')!.outputs[0].content).toContain(
      'model-v1',
    );
    lab.edges = lab.edges.filter(
      (edge) => !(edge.target === 'pod2' && edge.targetHandle === 'model'),
    );
    const missing = runWorkflow(id, lab);
    expect(missing.success).toBe(false);
    expect(missing.stages.find((stage) => stage.node === 'pod2')!.outputs).toEqual([]);
    expect(missing.stages.find((stage) => stage.node === 'response')!.status).toBe('blocked');
    expect(workflowGoals(lessonById[id], lab).some((goal) => goal.id === 'compare')).toBe(false);
  });
  it('버전·복구 실패는 모델 서빙 기본 구성과 별도인 확장 과제로 불러온다', () => {
    const id = 'week2-workflow';
    const repair = applyWorkflowPreset(id, createNodeLab(lessonById[id]), 'repair');
    repair.edges = resolveScenario(id, repair.answers).wires.map(workflowEdge);
    expect(runWorkflow(id, repair).success).toBe(false);
    Object.assign(repair.answers, fixes[id]);
    expect(runWorkflow(id, repair).success).toBe(true);
  });
  it('노드 이동·배열 순서는 결과에 영향을 주지 않는다', () => {
    const lab = connected('week6-workflow', fixes['week6-workflow']);
    const signature = workflowSignature(lab),
      run = runWorkflow('week6-workflow', lab);
    lab.nodes[0].position.x = -3000;
    lab.nodes.reverse();
    lab.edges.reverse();
    lab.activeNodes!.reverse();
    expect(workflowSignature(lab)).toBe(signature);
    expect(runWorkflow('week6-workflow', lab)).toEqual(run);
  });
});
describe('자료 종류·입출력·차단', () => {
  it('Shadow의 비교 실패가 신규 사용자 응답으로 집계되지 않는다', () => {
    const r = runWorkflow(
      'week6-workflow',
      connected('week6-workflow', { strategy: 'shadow', ready: 'no', traffic: 100 }),
    );
    expect(r.metrics[0].value).toBe('0 / 100');
    expect(r.metrics[1].value).toBe('0 / 100');
    expect(r.stages.find((s) => s.node === 'response')!.status).toBe('success');
    expect(r.stages.find((s) => s.node === 'observe')!.status).toBe('failed');
  });
});
describe('학습 증거·포트 저장·이전 진행 복구', () => {
  it('포트별 연결과 완료를 복원하고 잘못된 포트 저장을 거절한다', () => {
    const id = 'week6-workflow',
      lab = connected(id, fixes[id]),
      data = emptyLearning();
    data.lessons[id] = lab;
    const restored = parseLearning(serializeLearning(data));
    expect(restored.lessons[id].edges).toEqual(lab.edges);
    const raw = JSON.parse(serializeLearning(data));
    delete raw.lessons[id].edges[0].targetHandle;
    expect(() => parseLearning(JSON.stringify(raw))).toThrow();
  });
  it('이전 저장의 완료를 개편 목표로 승격하지 않는다', () => {
    const lab = createNodeLab(lessonById['docker-image']);
    const data = {
      version: 3,
      lessons: { 'docker-image': lab, 'pipeline-capstone': { old: 'graph' } },
    };
    const restored = parseLearning(JSON.stringify(data));
    expect(restored.version).toBe(5);
    expect(restored.lessons['docker-image']).toBeUndefined();
    expect(restored.lessons['pipeline-capstone']).toBeUndefined();
  });
});
