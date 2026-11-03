import type { LanguageProfile } from '../core/model.js';
import { CURRICULUM } from '../learning/curriculum.js';
import type { LessonId } from '../learning/types.js';
import { getLanguage } from './state.js';

export type Code = LanguageProfile['code'];
export type Route =
  | Readonly<{ page: 'home' }>
  | Readonly<{ page: 'framework' }>
  | Readonly<{ page: 'start' | 'builder' | 'reference'; code: Code }>
  | Readonly<{ page: 'practice' | 'cards' | 'play'; code: Code; lesson: LessonId | null }>
  | Readonly<{ page: 'lesson'; code: Code; lesson: LessonId }>;

function isLanguageCode(value: string | undefined): value is Code {
  return value === 'de' || value === 'fr' || value === 'es';
}
function isLessonId(value: string | undefined): value is LessonId {
  return CURRICULUM.some((lesson) => lesson.id === value);
}

/** The landing page is the level map. Legacy routes remain shareable. */
export function currentRoute(): Route {
  const [first, second, third] = location.hash.replace(/^#\/?/, '').split('/');
  if (!first) return { page: 'play', code: getLanguage(), lesson: null };
  if (first === 'home') return { page: 'home' };
  if (first === 'framework') return { page: 'framework' };
  if (isLanguageCode(first)) {
    if (second === 'lesson' && isLessonId(third)) return { page: 'lesson', code: first, lesson: third };
    if (second === 'practice' || second === 'cards' || second === 'play')
      return { page: second, code: first, lesson: isLessonId(third) ? third : null };
    if (second === 'builder' || second === 'reference')
      return { page: second, code: first };
    return { page: 'start', code: first };
  }
  return { page: 'start', code: getLanguage() };
}

export function href(code: Code, page: string): string {
  return '#' + code + '/' + page;
}
