import type { Participant, Time } from '../core/model.js';

/** Fixed index contract shared by verb tables; not a claim of universal grammar. */
export type Forms = readonly [speaker: string, addressee: string, we: string, other: string];

export const PERSON: Readonly<Record<Participant, 0 | 1 | 2 | 3>> = {
  speaker: 0,
  addressee: 1,
  we: 2,
  other: 3,
};

export function form(forms: Forms, person: Participant): string {
  return forms[PERSON[person]];
}

export function words(...parts: readonly string[]): string {
  return parts.filter(Boolean).join(' ');
}

export function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

export function finish(text: string, question: boolean, inverted = false): string {
  return `${inverted && question ? '¿' : ''}${capitalize(text)}${question ? '?' : '.'}`;
}

export function timeWord(time: Time | null, map: Readonly<Record<Time, string>>): string {
  return time === null ? '' : map[time];
}

/** Remove end punctuation before joining two independently realized clauses. */
export function bare(sentence: string): string {
  return sentence.replace(/[.!?]$/u, '').replace(/^¿/u, '');
}
