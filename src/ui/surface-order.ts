/**
 * Word-by-word contrast for the learner-facing sentence order strip.
 *
 * The language realizer remains the single source of output text. This module
 * compares two of its outputs; it never contains translated words or guesses
 * at a language's word order. A selected meaning block can affect one word,
 * several separated words (e.g. French negation), or an inflected verb.
 */
export interface SurfaceWord {
  readonly text: string;
  readonly affected: boolean;
}

/** Keep contractions and punctuation attached to their displayed words. */
function wordsIn(sentence: string): readonly string[] {
  return sentence.trim().split(/\s+/u).filter(Boolean);
}

/**
 * Mark words in `current` not shared, in sequence, with `comparison`.
 *
 * Longest-common-subsequence alignment handles insertions, replacements and
 * word movement without assuming that a grammatical operator stays in place.
 * The strings come directly from the language adapter (not a phrase table).
 */
export function traceSurfaceOrder(current: string, comparison: string | null): readonly SurfaceWord[] {
  const output = wordsIn(current);
  if (comparison === null) {
    return output.map((text) => ({ text, affected: false }));
  }

  const baseline = wordsIn(comparison);
  const lengths: number[][] = Array.from(
    { length: output.length + 1 },
    () => Array<number>(baseline.length + 1).fill(0),
  );

  for (let a = output.length - 1; a >= 0; a -= 1) {
    for (let b = baseline.length - 1; b >= 0; b -= 1) {
      lengths[a]![b] = output[a] === baseline[b]
        ? 1 + lengths[a + 1]![b + 1]!
        : Math.max(lengths[a + 1]![b]!, lengths[a]![b + 1]!);
    }
  }

  const unchanged = new Set<number>();
  let a = 0;
  let b = 0;
  while (a < output.length && b < baseline.length) {
    if (output[a] === baseline[b]) {
      unchanged.add(a);
      a += 1;
      b += 1;
    } else if (lengths[a + 1]![b]! >= lengths[a]![b + 1]!) {
      a += 1;
    } else {
      b += 1;
    }
  }

  return output.map((text, index) => ({ text, affected: !unchanged.has(index) }));
}
