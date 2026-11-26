import type { Answer, LabState } from '../curriculum/types';
import { resolveScenario } from './scenarios';
import { workflowEdge } from './engine';

const working: Record<string, Record<string, Answer>> = {
  'week2-workflow': { image: 'v1', deployment: 'v1', healing: 'on' },
  'week6-workflow': { strategy: 'shadow', ready: 'yes' },
};

/** 과제 모드가 바뀌면 연결과 설정을 함께 초기화해 이전 답을 남기지 않는다. */
export function applyWorkflowPreset(
  id: string,
  lab: LabState,
  mode: 'example' | 'repair' | 'new',
): LabState {
  const base = resolveScenario(id, {});
  const defaults = Object.fromEntries(base.fields.map((field) => [field.id, field.initial]));
  const answers = {
    ...lab.answers,
    ...defaults,
    ...(mode === 'example' ? working[id] : {}),
    ...(id === 'week2-workflow' && mode === 'repair'
      ? { image: 'v2', deployment: 'v1', healing: 'off' }
      : {}),
    _workflowQuiz: '',
  };
  const spec = resolveScenario(id, answers);
  return {
    ...lab,
    answers,
    activeNodes: spec.nodes.map((node) => node.id),
    edges: (mode === 'new' ? [] : mode === 'repair' ? spec.starter : spec.wires).map(workflowEdge),
  };
}
