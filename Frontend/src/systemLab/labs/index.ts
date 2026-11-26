import type { LabConfig } from '../lab';
import { introWorkflowLab } from './intro-workflow';
import { playgroundLab } from './playground';
import { transitionLab } from './transition';
import { week2Lab } from './week2';

/** 시스템 실습을 쓰는 강의 ID와 설정. 전환한 강의는 여기에 등록한다. */
export const labConfigs: Readonly<Record<string, LabConfig>> = {
  [introWorkflowLab.id]: introWorkflowLab,
  [week2Lab.id]: week2Lab,
  [transitionLab.id]: transitionLab,
};
/** 강의 ID에 속하지 않는 자유 구성 실습. 강의 완료 집계(`labConfigs`)에는 넣지 않는다. */
export { playgroundLab };
export const labFor = (lessonId: string): LabConfig | undefined =>
  Object.hasOwn(labConfigs, lessonId)
    ? labConfigs[lessonId]
    : lessonId === playgroundLab.id
      ? playgroundLab
      : undefined;

export const hasNodePractice = (lesson: { id: string; workflow?: string }): boolean =>
  Boolean(lesson.workflow || labFor(lesson.id));
