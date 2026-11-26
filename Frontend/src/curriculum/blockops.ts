import { units } from '../content/course';
import { lessonDocuments } from '../content/lessons';
import type { Lesson } from './types';
export const weeks = units.slice(0, -1);
export const chapterLabel = (unit: number) => `${unit}단원`;
export const lessons = lessonDocuments.map((document) => document.lesson);
/** 강의가 하나 이상 있는 단원만 목차에 보인다. 아직 작성하지 않은 단원은 숨긴다. */
export const chapters = units.filter((unit) => lessons.some((lesson) => lesson.week === unit.week));
export const lessonById = Object.fromEntries(
  lessons.map((lesson) => [lesson.id, lesson]),
) as Record<string, Lesson>;
