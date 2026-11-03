import test from 'node:test';
import assert from 'node:assert/strict';
import { compileGuide } from '../docs/assets/learning/compile.js';
import { nextLevelIndex, levelUnlocked, drillQuestions, memoryExamples, meaningBlocks } from '../docs/assets/ui/game-model.js';

test('levels unlock sequentially without hiding previously cleared levels', () => {
  const guide = compileGuide('de');
  assert.equal(nextLevelIndex(guide, new Set()), 0);
  assert.equal(levelUnlocked(guide, new Set(), 0), true);
  assert.equal(levelUnlocked(guide, new Set(), 1), false);
  const completed = new Set([guide.lessons[0].id, guide.lessons[1].id]);
  assert.equal(nextLevelIndex(guide, completed), 2);
  assert.equal(levelUnlocked(guide, completed, 0), true);
  assert.equal(levelUnlocked(guide, completed, 2), true);
  assert.equal(levelUnlocked(guide, completed, 3), false);
});

test('every level has a playable drill with a single unambiguous correct option', () => {
  for (const code of ['de', 'fr', 'es']) {
    const guide = compileGuide(code);
    for (const lesson of guide.lessons) {
      const questions = drillQuestions(guide, lesson);
      assert.ok(questions.length >= 4, code + '/' + lesson.id);
      for (const question of questions) {
        assert.equal(question.options.length, 4, code + '/' + lesson.id);
        assert.equal(new Set(question.options).size, 4);
        assert.equal(question.options.filter((option) => option === question.target).length, 1);
        assert.ok(question.english.length > 1);
      }
      for (const example of memoryExamples(lesson)) assert.ok(meaningBlocks(example).length >= 1);
    }
  }
});
