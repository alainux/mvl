import { makeTree, notation, price, where } from '../core/algebra.js';
import type { BuilderSelection, LanguageProfile, LocatablePlace, PricedThing } from '../core/model.js';
import { PREDICATES } from '../core/vocabulary.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
import type { ExampleSource, GeneratedExample, GeneratedLesson } from './types.js';

/**
 * Practice derives NEW meanings from lesson examples by transforming AST slots
 * or operators. No answers or translations are authored in the curriculum.
 */
function alternatives(selection: BuilderSelection): readonly BuilderSelection[] {
  const frame = PREDICATES[selection.predicate];
  const changedArguments = frame.allowedArguments
    .filter((argument) => argument !== selection.argument)
    .filter((argument) => selection.predicate !== 'help' || selection.agent !== argument)
    .map((argument) => ({ ...selection, argument }));

  return [
    ...changedArguments,
    { ...selection, negative: !selection.negative, polite: false },
    { ...selection, time: selection.time === 'tomorrow' ? 'today' : 'tomorrow' },
    { ...selection, question: !selection.question, polite: false },
  ];
}

function changeSource(source: ExampleSource, seen: ReadonlySet<string>): ExampleSource {
  if (source.kind === 'convention') return source;

  if (source.selection) {
    for (const selection of alternatives(source.selection)) {
      try {
        const expression = makeTree(selection);
        if (seen.has(notation(expression))) continue;
        return { kind: 'expression', expression, selection };
      } catch {
        // Invalid modal or semantic-role combinations are not practice items.
      }
    }
    return source;
  }

  if (source.expression.kind === 'where') {
    const places: readonly LocatablePlace[] = ['station', 'hotel', 'bathroom'];
    const replacement = places.find((place) =>
      !seen.has(notation(where(place))));
    return replacement ? { kind: 'expression', expression: where(replacement) } : source;
  }

  if (source.expression.kind === 'price') {
    const things: readonly PricedThing[] = ['ticket', 'coffee'];
    const replacement = things.find((thing) =>
      !seen.has(notation(price(thing))));
    return replacement ? { kind: 'expression', expression: price(replacement) } : source;
  }

  return source;
}

function textFor(source: ExampleSource, code: LanguageProfile['code'], original: GeneratedExample): GeneratedExample {
  if (source.kind === 'convention') return original;

  return {
    ...original,
    source,
    english: realizeEnglish(source.expression),
    target: linearize(source.expression, code),
    provenance: 'composed',
  };
}

/** Deterministic practice session; same input produces the same practice. */
export function generatePractice(
  lesson: GeneratedLesson,
  code: LanguageProfile['code'],
  limit = 6,
): readonly GeneratedExample[] {
  const seen = new Set(lesson.examples.flatMap((example) =>
    example.source.kind === 'expression' ? [notation(example.source.expression)] : []));
  const used = new Set<string>();
  const results: GeneratedExample[] = [];

  for (const original of lesson.examples) {
    const variant = changeSource(original.source, seen);
    const exercise = textFor(variant, code, original);
    if (used.has(exercise.target)) continue;
    used.add(exercise.target);
    results.push({ ...exercise, id: `practice-${original.id}` });
    if (results.length >= limit) break;
  }

  return results;
}

/** Comparison checks the displayed model, not every acceptable paraphrase. */
export function matchesModel(answer: string, target: string): boolean {
  const normalize = (value: string): string => value
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase()
    .replace(/[.!?¿\s]+$/gu, '')
    .replace(/\s+/gu, ' ');

  return normalize(answer) === normalize(target);
}
