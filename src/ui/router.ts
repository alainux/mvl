import type { LanguageProfile } from '../core/model.js';
import { CURRICULUM } from '../learning/curriculum.js';
import type { LessonId } from '../learning/types.js';
import { getLanguage } from './state.js';

export type Code = LanguageProfile['code'];
export type Route =
  | Readonly<{ page: 'home' }>
  | Readonly<{ page: 'framework' }>
  | Readonly<{ page: 'start' | 'builder' | 'practice' | 'reference'; code: Code }>
  | Readonly<{ page: 'lesson'; code: Code; lesson: LessonId }>;

function isLanguageCode(value: string | undefined): value is Code {
  return value === 'de' || value === 'fr' || value === 'es';
}

function isLessonId(value: string | undefined): value is LessonId {
  return CURRICULUM.some((lesson) => lesson.id === value);
}

/** Hash URLs work directly on GitHub Pages: no server-side rewrite required. */
export function currentRoute(): Route {
  const [first, second, third] = location.hash.replace(/^#\/?/, '').split('/');
  if (!first || first === 'home') return { page: 'home' };
  if (first === 'framework') return { page: 'framework' };

  if (isLanguageCode(first)) {
    if (second === 'lesson' && isLessonId(third)) {
      return { page: 'lesson', code: first, lesson: third };
    }
    if (second === 'builder' || second === 'practice' || second === 'reference') {
      return { page: second, code: first };
    }
    return { page: 'start', code: first };
  }

  return { page: 'start', code: getLanguage() };
}

export function href(code: Code, page: string): string {
  return `#${code}/${page}`;
}
