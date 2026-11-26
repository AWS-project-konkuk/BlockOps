import { describe, it, expect } from 'vitest';
import { lessons, lessonById, weeks } from '../src/curriculum/blockops';
import {
  simulate,
  activitySignature,
  observationHistory,
  dockerCommand,
  metricSamples,
} from '../src/activities/simulation';
import { createNodeLab } from '../src/nodes/lessonNodes';
import { evaluateGoals, experimentSignature } from '../src/curriculum/engine';
import {
  emptyLearning,
  parseLearning,
  serializeLearning,
  learningKey,
} from '../src/learning/blockProgress';
import type { LabState } from '../src/curriculum/types';
const lab = (id: string) => createNodeLab(lessonById[id]);
const result = (id: string, changes: Record<string, string | number | boolean> = {}) =>
  simulate(lessonById[id].activity!, { ...lab(id).answers, ...changes });
function observed(state: LabState): LabState {
  const sig = activitySignature(state.answers);
  return {
    ...state,
    attempts: 2,
    answers: {
      ...state.answers,
      _observed: sig,
      _history: JSON.stringify(['previous-settings', sig]),
      _quiz: 'a',
      _understanding: lessonById['canary'].assessment!.correct,
    },
  };
}
describe('BlockOps 과정과 활동 계약', () => {
  it('0~9단원의 설명과 선택 활동을 제공한다', () => {
    expect(weeks).toHaveLength(9);
    expect(lessons).toHaveLength(23);
    for (const l of lessons.filter((l) => l.activity)) {
      expect(l.minutes).toBeGreaterThanOrEqual(5);
      expect(l.minutes).toBeLessThanOrEqual(18);
      expect(l.activity).toBeDefined();
      expect(l.references[0].url).toMatch(/^https:/);
      expect(result(l.id).steps.length).toBeGreaterThan(0);
      expect(evaluateGoals(l, lab(l.id)).some((g) => !g.passed)).toBe(true);
    }
  });
  it('새 설정은 관찰 기록을 무효화하고 노드 이동은 결과를 바꾸지 않는다', () => {
    const s = observed(lab('canary'));
    const signature = experimentSignature(s);
    s.nodes[0].position.x = 900;
    expect(experimentSignature(s)).toBe(signature);
    s.answers.traffic = 50;
    s.answers._understanding = -1;
    expect(
      evaluateGoals(lessonById['canary'], s).find((g) => g.id === 'understanding')?.passed,
    ).toBe(false);
    expect(observationHistory({ _history: 'broken' })).toEqual([]);
  });
});
describe('교육용 계산의 핵심 조건', () => {
  it('Docker 명령은 실제 상태 전이를 수행하고 잘못된 순서를 설명한다', () => {
    let a = dockerCommand({}, 'run');
    expect(a._container).toBeUndefined();
    a = dockerCommand(a, 'build');
    a = dockerCommand(a, 'run');
    expect(a._container).toBe('실행 중');
    expect(dockerCommand(a, 'rm')._container).toBe('실행 중');
    a = dockerCommand(a, 'stop');
    expect(a._container).toBe('중지됨');
    a = dockerCommand(a, 'rm');
    expect(a._container).toBe('없음');
    expect(a._image).toBe(true);
  });
  it('배포 방식마다 실제 응답과 복제 요청 수가 다르다', () => {
    expect(result('canary', { traffic: 10 }).metrics[0].amount).toBe(10);
    expect(result('shadow', { traffic: 100 }).metrics[0].amount).toBe(0);
    expect(result('shadow', { traffic: 100 }).metrics[3].amount).toBe(100);
    expect(result('blue-green', { phase: 'switch' }).metrics[0].amount).toBe(100);
    expect(result('blue-green', { phase: 'rollback' }).metrics[0].amount).toBe(0);
    expect(result('recreate-release', { gap: 20 }).metrics[2].amount).toBe(20);
  });
  it('수집 간격이 짧은 스파이크 관측에 영향을 준다', () => {
    expect(metricSamples(30).some((p) => p.y > 200)).toBe(false);
    expect(metricSamples(1).some((p) => p.y > 200)).toBe(true);
  });
});
describe('종합 실행·피드백·저장', () => {
  it('새 저장 버전으로 복원하며 변경된 목표를 재검사한다', () => {
    const data = emptyLearning();
    data.lessons['canary'] = observed(lab('canary'));
    data.lessons['canary'].completed = true;
    const restored = parseLearning(serializeLearning(data));
    expect(restored.lessons['canary'].completed).toBe(true);
    expect(learningKey).not.toContain('flow-lab');
    restored.lessons['canary'].answers._understanding = -1;
    expect(parseLearning(serializeLearning(restored)).lessons['canary'].completed).toBe(false);
    expect(() => parseLearning('{broken')).toThrow();
    expect(() => parseLearning('{"version":2,"lessons":{}}')).toThrow();
  });
  it('중복 노드·손상 연결·범위 밖 설정을 복원하지 않는다', () => {
    const data = emptyLearning();
    data.lessons['canary'] = lab('canary');
    data.lessons['canary'].answers.traffic = 10000;
    expect(() => parseLearning(serializeLearning(data))).toThrow();
    data.lessons['canary'] = lab('canary');
    data.lessons['canary'].nodes[1].id = 'n0';
    expect(() => parseLearning(serializeLearning(data))).toThrow();
  });
});
