/**
 * Export the compiled manuals for independent linguistic review.
 *
 * The generated TSV is a review worksheet, NOT an input to the grammar engine.
 * Reviewers annotate correctness, naturalness, register and regional fit.
 * This intentionally has no network calls, external dependencies or CI jobs.
 *
 * Usage: npm run review:export
 *        node scripts/export-linguistic-review.mjs ./my-review.tsv
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = resolve(root, process.argv[2] ?? 'review/linguistic-review.tsv');
const { compileGuide, INSTALLED_LANGUAGES } = await import('../docs/assets/learning/compile.js');

function cell(value) {
  return String(value ?? '').replaceAll('\t', ' ').replaceAll(/\r?\n/gu, ' ');
}

const header = [
  'language', 'variety', 'lesson', 'example_id', 'source_type',
  'meaning_english', 'generated_target', 'review_status',
  'regional_alternative', 'reviewer', 'notes',
];
const rows = [header];

for (const code of INSTALLED_LANGUAGES) {
  const guide = compileGuide(code);
  for (const lesson of guide.lessons) {
    for (const example of lesson.examples) {
      rows.push([
        code, guide.language.variety, lesson.id, example.id,
        example.provenance, example.english, example.target,
        'unreviewed', '', '', '',
      ]);
    }
  }
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${rows.map((row) => row.map(cell).join('\t')).join('\n')}\n`, 'utf8');
console.log(`Prepared ${rows.length - 1} sentence reviews: ${output}`);
