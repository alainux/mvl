import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { notation } from '../docs/assets/core/algebra.js';
import { compileGuide, INSTALLED_LANGUAGES } from '../docs/assets/learning/compile.js';
import { CURRICULUM } from '../docs/assets/learning/curriculum.js';
import { expandBlock } from '../docs/assets/learning/expand.js';
import { generatePractice, matchesModel } from '../docs/assets/learning/practice.js';
import { realizeEnglish } from '../docs/assets/languages/en.js';
import { linearize } from '../docs/assets/languages/index.js';

const readGuide = (code) => JSON.parse(readFileSync(`docs/guides/${code}.json`, 'utf8'));

test('shared lesson plans contain semantic blocks, not translated sentence pairs', () => {
  assert.equal(CURRICULUM.length, 11);
  for (const lesson of CURRICULUM) {
    assert.ok(lesson.blocks.length > 0);
    for (const block of lesson.blocks) {
      assert.ok(['paradigm', 'where', 'price', 'conventions'].includes(block.kind));
      assert.equal(Object.hasOwn(block, 'target'), false);
      assert.equal(Object.hasOwn(block, 'english'), false);
      assert.ok(expandBlock(block).length > 0);
    }
  }
});

test('build creates exactly three deterministic, independently realized guides', () => {
  assert.deepEqual(INSTALLED_LANGUAGES, ['de', 'fr', 'es']);
  for (const code of INSTALLED_LANGUAGES) {
    const compiled = compileGuide(code);
    const published = readGuide(code);
    assert.deepEqual(published, compiled, `docs/guides/${code}.json is stale`);
    assert.equal(compiled.lessons.length, 11);
    assert.ok(compiled.lessons.every((lesson) => lesson.examples.length >= 4));
  }
});

test('every productive learning example comes from one AST in English and target', () => {
  let composed = 0;
  let conventions = 0;
  for (const code of INSTALLED_LANGUAGES) {
    for (const lesson of compileGuide(code).lessons) {
      for (const example of lesson.examples) {
        if (example.source.kind === 'convention') {
          conventions += 1;
          assert.equal(example.provenance, 'conventional');
          continue;
        }
        composed += 1;
        assert.equal(example.provenance, 'composed');
        assert.equal(example.english, realizeEnglish(example.source.expression));
        assert.equal(example.target, linearize(example.source.expression, code));
      }
    }
  }
  assert.ok(composed >= 140, `Only ${composed} productive examples`);
  assert.ok(conventions <= 45, 'Conventional chunks must stay a small exception layer');
});

test('practice creates unseen compositions rather than simply repeating teaching examples', () => {
  for (const code of INSTALLED_LANGUAGES) {
    const guide = compileGuide(code);
    for (const lesson of guide.lessons) {
      const practice = generatePractice(lesson, code);
      assert.ok(practice.length >= 1);
      const teaching = new Set(lesson.examples
        .filter((item) => item.source.kind === 'expression')
        .map((item) => notation(item.source.expression)));
      for (const item of practice) {
        if (item.source.kind === 'convention') continue;
        assert.equal(item.target, linearize(item.source.expression, code));
        assert.equal(item.english, realizeEnglish(item.source.expression));
        // Some fully enumerated closed-class operators have no novel slot to use.
        if (!['places', 'shopping'].includes(lesson.id)) {
          assert.ok(!teaching.has(notation(item.source.expression)), `${code}/${lesson.id} repeats a sample`);
        }
      }
    }
  }
});

test('the practice comparison does not pretend to evaluate all valid paraphrases', () => {
  assert.ok(matchesModel(' Können Sie mir helfen? ', 'Können Sie mir helfen?'));
  assert.ok(matchesModel('können sie mir helfen', 'Können Sie mir helfen?'));
  assert.equal(matchesModel('Kannst du mir helfen?', 'Können Sie mir helfen?'), false);
});
