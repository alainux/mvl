import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import { compileGuide } from '../docs/assets/learning/compile.js';

test('the reviewer export covers all three generated guides without feeding a phrasebook', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mvl-review-'));
  try {
    const report = join(directory, 'review.tsv');
    execFileSync(process.execPath, ['scripts/export-linguistic-review.mjs', report]);
    const rows = readFileSync(report, 'utf8').trim().split('\n');
    const expected = ['de', 'fr', 'es'].reduce((total, code) =>
      total + compileGuide(code).lessons.reduce((count, lesson) => count + lesson.examples.length, 0), 0);
    assert.equal(rows.length, expected + 1);
    assert.match(rows[0], /^language\tvariety\tlesson\t/);
    assert.ok(rows.some((row) => row.startsWith('fr\t')));
    assert.ok(rows.some((row) => row.startsWith('es\t')));
    assert.ok(rows.every((row) => !row.includes('\taccepted\t')), 'no human approval is invented');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
