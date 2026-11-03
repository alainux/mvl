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


export interface GameStats {
  readonly xp: number;
  readonly correct: number;
  readonly bestStreak: number;
}

export interface CardRecall {
  readonly strength: number;
  readonly due: number;
}

const EMPTY_STATS: GameStats = { xp: 0, correct: 0, bestStreak: 0 };

export function gameStats(code: LanguageCode): GameStats {
  try {
    const value: unknown = JSON.parse(read('mvl:game:stats:' + code) ?? 'null');
    if (value && typeof value === 'object') {
      const data = value as Record<string, unknown>;
      return {
        xp: typeof data['xp'] === 'number' && Number.isFinite(data['xp']) ? Math.max(0, data['xp']) : 0,
        correct: typeof data['correct'] === 'number' && Number.isFinite(data['correct']) ? Math.max(0, data['correct']) : 0,
        bestStreak: typeof data['bestStreak'] === 'number' && Number.isFinite(data['bestStreak']) ? Math.max(0, data['bestStreak']) : 0,
      };
    }
  } catch { /* Corrupted local data starts a fresh game. */ }
  return EMPTY_STATS;
}

export function awardXP(code: LanguageCode, points: number, correct = false, streak = 0): GameStats {
  const previous = gameStats(code);
  const next = {
    xp: previous.xp + Math.max(0, Math.round(points)),
    correct: previous.correct + (correct ? 1 : 0),
    bestStreak: Math.max(previous.bestStreak, streak),
  };
  write('mvl:game:stats:' + code, JSON.stringify(next));
  return next;
}

export function cardRecalls(code: LanguageCode): Readonly<Record<string, CardRecall>> {
  try {
    const value: unknown = JSON.parse(read('mvl:game:cards:' + code) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: Record<string, CardRecall> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (!entry || typeof entry !== 'object') continue;
      const data = entry as Record<string, unknown>;
      if (typeof data['strength'] === 'number' && typeof data['due'] === 'number')
        result[key] = { strength: Math.min(5, Math.max(0, data['strength'])), due: data['due'] };
    }
    return result;
  } catch { return {}; }
}

export function recordCard(code: LanguageCode, key: string, remembered: boolean, now = Date.now()): CardRecall {
  const all = { ...cardRecalls(code) };
  const strength = remembered ? Math.min(5, (all[key]?.strength ?? 0) + 1) : 0;
  const intervals = [0, 10 * 60_000, 24 * 60 * 60_000, 3 * 24 * 60 * 60_000,
    7 * 24 * 60 * 60_000, 14 * 24 * 60 * 60_000];
  const recall = { strength, due: now + (intervals[strength] ?? 0) };
  all[key] = recall;
  write('mvl:game:cards:' + code, JSON.stringify(all));
  return recall;
}

export function dueCardCount(code: LanguageCode, ids: readonly string[], now = Date.now()): number {
  const recalls = cardRecalls(code);
  return ids.filter((id) => !recalls[id] || recalls[id].due <= now).length;
}


/** A level clear can earn 1–3 stars. Replay improves the best score without
 * printing free XP on every visit. Old "studied" progress is still respected. */
export interface QuestRecord {
  readonly stars: number;
  readonly score: number;
  readonly clears: number;
}
export function questRecords(code: LanguageCode): Readonly<Record<string, QuestRecord>> {
  try {
    const decoded: unknown = JSON.parse(read('mvl:quest:records:' + code) ?? '{}');
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return {};
    const result: Record<string, QuestRecord> = {};
    for (const [key, raw] of Object.entries(decoded)) {
      if (!raw || typeof raw !== 'object') continue;
      const row = raw as Record<string, unknown>;
      if (typeof row['stars'] !== 'number' || typeof row['score'] !== 'number') continue;
      result[key] = {
        stars: Math.min(3, Math.max(0, Math.round(row['stars']))),
        score: Math.max(0, row['score']),
        clears: typeof row['clears'] === 'number' ? Math.max(0, row['clears']) : 1,
      };
    }
    return result;
  } catch { return {}; }
}
export function recordQuestVictory(code: LanguageCode, id: LessonId, stars: number, score: number): number {
  const records = { ...questRecords(code) };
  const existing = records[id];
  const nextStars = Math.max(existing?.stars ?? 0, Math.min(3, Math.max(1, stars)));
  records[id] = {
    stars: nextStars, score: Math.max(existing?.score ?? 0, score),
    clears: (existing?.clears ?? 0) + 1,
  };
  write('mvl:quest:records:' + code, JSON.stringify(records));
  const bonus = !existing ? 70 + 20 * nextStars : 20 * (nextStars - existing.stars);
  if (bonus > 0) awardXP(code, bonus);
  setLessonCompleted(code, id, true);
  return bonus;
}
