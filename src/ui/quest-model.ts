/**
 * A real game loop built on the same generated sentences as the manual.
 * Players assemble surface-language words, not an English semantic tree.
 * This is deliberate: choosing meaning blocks alone does not demonstrate
 * that a learner can produce the target language.
 */
import { generatePractice } from '../learning/practice.js';
import type { GeneratedExample, GeneratedGuide, GeneratedLesson } from '../learning/types.js';
import { questRecipe } from './quest-recipe.js';

export const QUEST_HEARTS = 3;
export const QUEST_ROUNDS = 5;

export interface WordTile {
  readonly id: number;
  readonly word: string;
}

export interface QuestRound {
  readonly id: string;
  readonly goal: string;
  readonly target: string;
  readonly expected: readonly string[];
  readonly tiles: readonly WordTile[];
  readonly recipe: readonly string[];
  readonly example: GeneratedExample;
  readonly boss: boolean;
}

export interface QuestSession {
  readonly key: string;
  readonly round: number;
  readonly hearts: number;
  readonly selected: readonly number[];
  readonly phase: 'play' | 'won' | 'lost' | 'victory';
  readonly combo: number;
  readonly bestCombo: number;
  readonly misses: number;
  readonly hints: number;
  readonly hintUsed: boolean;
  readonly hintTile: number | null;
  readonly score: number;
  readonly feedback: string;
}

function tokens(sentence: string): readonly string[] {
  return sentence.trim().split(/\s+/u).filter(Boolean);
}
function hash(seed: string): number {
  let value = 2166136261;
  for (const ch of seed) {
    value = Math.imul(value ^ ch.charCodeAt(0), 16777619);
  }
  return value >>> 0;
}
function shuffled<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let state = hash(seed);
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
function unique(examples: readonly GeneratedExample[]): GeneratedExample[] {
  const seen = new Set<string>();
  return examples.filter((example) => {
    const key = example.target.normalize('NFC').trim().toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function questRounds(guide: GeneratedGuide, lesson: GeneratedLesson): readonly QuestRound[] {
  const idx = guide.lessons.findIndex((l) => l.id === lesson.id);
  if (idx < 0) throw new Error('Quest level missing from guide');
  const code = guide.language.code;
  // Encounter 5 is a new generated combination whenever the curriculum
  // offers one; encounters 1-4 are taught by the worked examples.
  const novel = generatePractice(lesson, code, 12).filter((e) => e.source.kind === 'expression');
  const productive = lesson.examples.filter((e) => e.source.kind === 'expression');
  const routines = lesson.examples.filter((e) => e.source.kind === 'convention');
  const selected = unique([
    ...productive.slice(0, QUEST_ROUNDS - 1),
    ...routines.slice(0, 2),
    ...novel,
    ...lesson.examples,
  ]).slice(0, QUEST_ROUNDS);
  const knownSentences = unique([
    ...lesson.examples,
    ...novel,
    ...guide.lessons.slice(0, idx).flatMap((l) => l.examples),
  ]).map((example) => example.target);

  return selected.map((example, roundIndex) => {
    const expected = tokens(example.target);
    const words = new Set(expected);
    const extras = shuffled(
      [...new Set(knownSentences.flatMap((sentence) => tokens(sentence))
        .filter((word) => !words.has(word)))],
      lesson.id + ':' + roundIndex + ':extras',
    );
    // A distractor is a real inflected word from this or an earlier level.
    const count = Math.min(extras.length, roundIndex === QUEST_ROUNDS - 1 ? 3 : roundIndex >= 2 ? 2 : 1);
    const bank = [
      ...expected.map((word, i) => ({ id: i, word })),
      ...extras.slice(0, count).map((word, i) => ({ id: expected.length + i, word })),
    ];
    let tiles = shuffled(bank, lesson.id + ':' + example.id + ':bank');
    // Even short constructions should not already appear fully assembled.
    if (tiles.length > 1 && tiles.slice(0, expected.length).every((t, i) => t.word === expected[i])) {
      tiles = [...tiles.slice(1), tiles[0]!];
    }
    return {
      id: lesson.id + ':' + example.id,
      goal: example.english,
      target: example.target,
      expected,
      tiles,
      recipe: questRecipe(example, code),
      example,
      boss: roundIndex === selected.length - 1,
    };
  });
}

export function beginQuest(key: string): QuestSession {
  return { key, round: 0, hearts: QUEST_HEARTS, selected: [], phase: 'play',
    combo: 0, bestCombo: 0, misses: 0, hints: 0, hintUsed: false,
    hintTile: null, score: 0, feedback: '' };
}

export function selectedWords(state: QuestSession, round: QuestRound): readonly string[] {
  return state.selected.map((id) => round.tiles.find((tile) => tile.id === id)?.word ?? '');
}

export function addQuestTile(state: QuestSession, round: QuestRound, id: number): QuestSession {
  if (state.phase !== 'play' || state.selected.length >= round.expected.length || state.selected.includes(id) || !round.tiles.some((tile) => tile.id === id)) return state;
  return { ...state, selected: [...state.selected, id], hintTile: null, feedback: '' };
}

export function removeQuestTile(state: QuestSession, position: number): QuestSession {
  if (state.phase !== 'play' || position < 0 || position >= state.selected.length) return state;
  return { ...state, selected: state.selected.filter((_, i) => i !== position), feedback: '', hintTile: null };
}

export function clearQuestTiles(state: QuestSession): QuestSession {
  if (state.phase !== 'play') return state;
  return { ...state, selected: [], feedback: '', hintTile: null };
}

export function checkQuest(state: QuestSession, round: QuestRound): QuestSession {
  if (state.phase !== 'play' || !state.selected.length) return state;
  const answer = selectedWords(state, round);
  const correct = answer.length === round.expected.length &&
    answer.every((word, index) => word === round.expected[index]);
  if (correct) {
    const combo = state.combo + 1;
    const points = Math.max(40, 100 + (combo - 1) * 20 - (state.hintUsed ? 30 : 0));
    return { ...state, phase: 'won', score: state.score + points,
      combo, bestCombo: Math.max(state.bestCombo, combo),
      hintTile: null, feedback: 'Sentence built! The path is open.' };
  }
  const positions = answer.filter((word, i) => word === round.expected[i]).length;
  const hearts = state.hearts - 1;
  const feedback = positions + ' of ' + round.expected.length +
    ' blocks are in the correct positions. Fix the order or choose different words.';
  return { ...state, hearts, combo: 0, misses: state.misses + 1,
    phase: hearts <= 0 ? 'lost' : 'play', feedback, hintTile: null };
}

export function questHint(state: QuestSession, round: QuestRound): QuestSession {
  if (state.phase !== 'play' || state.hintUsed) return state;
  const words = selectedWords(state, round);
  const prefix = words.every((word, index) => word === round.expected[index]);
  if (!prefix) return { ...state, feedback: 'Remove the incorrect block before asking for a clue.' };
  const next = round.expected[words.length];
  if (!next) return { ...state, feedback: 'Check your completed sentence to continue.' };
  const tile = round.tiles.find((candidate) => candidate.word === next && !state.selected.includes(candidate.id));
  if (!tile) return state;
  return { ...state, hints: state.hints + 1, hintUsed: true,
    hintTile: tile.id, feedback: 'The glowing tile is the next word. Clues reduce your final star rating.' };
}

export function nextQuestRound(state: QuestSession, total: number): QuestSession {
  if (state.phase !== 'won') return state;
  if (state.round + 1 >= total) return { ...state, phase: 'victory', feedback: '' };
  return { ...state, phase: 'play', round: state.round + 1, selected: [],
    hintUsed: false, hintTile: null, feedback: '' };
}

export function questStars(state: QuestSession): 1 | 2 | 3 {
  if (state.misses === 0 && state.hints === 0) return 3;
  if (state.misses <= 1 && state.hints <= 2) return 2;
  return 1;
}
