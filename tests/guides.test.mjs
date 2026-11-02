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

const publishedGuide = (code) => JSON.parse(readFileSync(`docs/guides/${code}.json`, 'utf8'));

test('the shared curriculum is A2-oriented and contains only semantic plans', () => {
  assert.equal(CURRICULUM.length, 40);
  assert.equal(new Set(CURRICULUM.map((entry) => entry.id)).size, 40);
  for (const lesson of CURRICULUM) {
    assert.ok(lesson.blocks.length > 0);
    for (const block of lesson.blocks) {
      assert.ok(['paradigm','timeline','combine','where','price','when-question','conventions','describe','presence','ask-object','route','sequence'].includes(block.kind));
      assert.ok(!('target' in block) && !('english' in block));
      assert.ok(expandBlock(block).length > 0, lesson.id);
    }
  }
  for (const id of ['past','past-movement','future','obligation','reasons','small-story','habits','housing','health','work-and-study','more-past','more-future','stories']) {
    assert.ok(CURRICULUM.some((lesson) => lesson.id === id));
  }
});

test('compiled guides exactly match published generated JSON', () => {
  assert.deepEqual(INSTALLED_LANGUAGES, ['de','fr','es']);
  for (const code of INSTALLED_LANGUAGES) {
    const compiled = compileGuide(code);
    assert.deepEqual(publishedGuide(code), compiled);
    assert.equal(compiled.lessons.length, 40);
    assert.ok(compiled.lessons.reduce((sum, lesson) => sum + lesson.examples.length, 0) > 420);
  }
});

test('every productive example is realized from its own AST', () => {
  let composed = 0;
  let conventional = 0;
  for (const code of INSTALLED_LANGUAGES) {
    for (const lesson of compileGuide(code).lessons) {
      for (const example of lesson.examples) {
        if (example.source.kind === 'convention') {
          conventional++;
          assert.equal(example.provenance, 'conventional');
        } else {
          composed++;
          assert.equal(example.english, realizeEnglish(example.source.expression));
          assert.equal(example.target, linearize(example.source.expression,code));
        }
      }
    }
  }
  assert.ok(composed > 1200);
  assert.ok(conventional < 30);
});

test('generative practice composes fresh meanings for key tense lessons', () => {
  for (const code of INSTALLED_LANGUAGES) {
    const guide = compileGuide(code);
    for (const id of ['past','future','obligation','reasons','plans']) {
      const lesson = guide.lessons.find((entry) => entry.id === id);
      const original = new Set(lesson.examples.map((entry) =>
        entry.source.kind === 'expression' ? notation(entry.source.expression) : 'conventional'));
      const practice = generatePractice(lesson,code,6);
      assert.ok(practice.length >= 3, `${code}: ${id}`);
      for (const example of practice) {
        assert.equal(example.target,linearize(example.source.expression,code));
        assert.ok(!original.has(notation(example.source.expression)), `${code}/${id} duplicates example`);
      }
    }
  }
});



test('new capability lessons generate fresh practice from the grammar, not phrase pairs', () => {
  for (const code of INSTALLED_LANGUAGES) {
    const guide = compileGuide(code);
    for (const id of [
      'habits', 'preferences', 'description', 'housing', 'services-nearby',
      'directions', 'work-and-study', 'digital-life', 'forms', 'health',
      'appointments', 'lost-property', 'more-past', 'more-future', 'stories',
    ]) {
      const lesson = guide.lessons.find((item) => item.id === id);
      const shown = new Set(lesson.examples.map((example) =>
        example.source.kind === 'expression' ? notation(example.source.expression) : 'convention'));
      const practice = generatePractice(lesson, code, 6);
      assert.ok(practice.length >= 3 || id === 'stories', `${code}: ${id} practice coverage`);
      for (const example of practice) {
        assert.equal(example.provenance, 'composed');
        assert.equal(example.target, linearize(example.source.expression, code));
        assert.ok(!shown.has(notation(example.source.expression)), `${code}/${id}: repeated an example`);
      }
    }
  }
});

test('text comparison only checks the model answer, not valid paraphrases', () => {
  assert.ok(matchesModel(' Können Sie mir helfen? ', 'Können Sie mir helfen?'));
  assert.ok(matchesModel('können sie mir helfen', 'Können Sie mir helfen?'));
  assert.equal(matchesModel('Kannst du mir helfen?', 'Können Sie mir helfen?'), false);
});
