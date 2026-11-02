import type { Expression, LanguageAdapter } from '../core/model.js';
import { german } from './de.js';
import { french } from './fr.js';
import { spanish } from './es.js';

/** The registry is the only place that knows which adapters are installed. */
export const languages: readonly LanguageAdapter[] = [german, french, spanish];

export function linearize(expression: Expression, code: string): string {
  const language = languages.find((adapter) => adapter.profile.code === code);
  if (!language) throw new TypeError(`Unknown language implementation: ${code}`);
  return language.realize(expression);
}
