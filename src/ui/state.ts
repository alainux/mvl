import type { LanguageProfile } from '../core/model.js';
import type { LessonId } from '../learning/types.js';

type LanguageCode = LanguageProfile['code'];

/** Local browser state. The guide works without accounts, cookies, or a backend. */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Browsers may disable local storage. The guide remains usable without it.
  }
}

export function getLanguage(): LanguageCode {
  const code = read('mvl:language');
  return code === 'fr' || code === 'es' ? code : 'de';
}

export function rememberLanguage(code: LanguageCode): void {
  write('mvl:language', code);
}

export function completedLessons(code: LanguageCode): Set<string> {
  try {
    const value: unknown = JSON.parse(read(`mvl:completed:${code}`) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

export function setLessonCompleted(code: LanguageCode, id: LessonId, completed: boolean): void {
  const current = completedLessons(code);
  if (completed) current.add(id);
  else current.delete(id);
  write(`mvl:completed:${code}`, JSON.stringify([...current]));
}

export function readNote(code: LanguageCode, id: LessonId): string {
  return read(`mvl:note:${code}:${id}`) ?? '';
}

export function saveNote(code: LanguageCode, id: LessonId, value: string): void {
  write(`mvl:note:${code}:${id}`, value);
}

export function getTheme(): 'light' | 'dark' {
  return read('mvl:theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: 'light' | 'dark'): void {
  write('mvl:theme', theme);
}
