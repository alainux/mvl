import type { Analysis, Participant, Time } from '../core/model.js';

export type PersonIndex = 0 | 1;

export function personIndex(participant: Participant): PersonIndex {
  return participant === 'speaker' ? 0 : 1;
}

/** Morphological paradigms in this prototype have two supported persons. */
export function selectForm(
  forms: readonly [speaker: string, addressee: string],
  participant: Participant,
): string {
  return forms[personIndex(participant)];
}

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

export function punctuate(text: string, analysis: Analysis, inverted = false): string {
  if (analysis.question) {
    return `${inverted ? '¿' : ''}${capitalize(text)}?`;
  }
  return `${capitalize(text)}.`;
}

export function timeWord(
  time: Time | null,
  words: Readonly<Record<Time, string>>,
): string {
  return time === null ? '' : words[time];
}

/** Avoid accidental duplicate spaces in inflection and constituent assembly. */
export function words(...parts: readonly string[]): string {
  return parts.filter((part) => part.length > 0).join(' ');
}
