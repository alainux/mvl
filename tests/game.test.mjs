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
        assert.equal(question.optionMeanings.length, question.options.length);
        assert.equal(question.optionMeanings[question.options.indexOf(question.target)], question.english);
        assert.equal(new Set(question.optionMeanings.map((meaning) => meaning.toLowerCase())).size, 4);
        assert.ok(question.english.length > 1);
      }
      for (const example of memoryExamples(lesson)) assert.ok(meaningBlocks(example, code).length >= 1);
    }
  }
});

test('a locked drill URL resolves to the same unlocked lesson as its validator', async () => {
  const { playableLesson } = await import('../docs/assets/ui/game-model.js');
  const guide = compileGuide('de');
  const distant = guide.lessons[guide.lessons.length - 1].id;
  assert.equal(playableLesson(guide, new Set(), distant).id, guide.lessons[0].id);
  const completed = new Set([guide.lessons[0].id]);
  assert.equal(playableLesson(guide, completed, distant).id, guide.lessons[1].id);
  assert.equal(playableLesson(guide, completed, guide.lessons[0].id).id, guide.lessons[0].id);
});

test('German formal-you prompts are explicit and contrast similar sentences', () => {
  const guide = compileGuide('de');
  const identity = guide.lessons.find((lesson) => lesson.id === 'identity');
  assert.ok(identity);
  const sick = drillQuestions(guide, identity).find((question) => question.english === 'Are you sick?');
  assert.ok(sick, 'the generated identity drill must contain this prompt');
  assert.equal(sick.target, 'Sind Sie krank?');
  assert.equal(sick.contextHint, 'Formal you · Sie');
  assert.match(sick.patternHint, /verb comes before the subject/);
  for (const option of sick.options) assert.match(option, /^Sind Sie /, option);
  for (const meaning of sick.optionMeanings) assert.match(meaning, /^Are you /, meaning);
});

test('German yes/no question blocks put YOU after the verb', () => {
  const german = compileGuide('de');
  const lesson = german.lessons.find((item) => item.id === 'identity');
  assert.ok(lesson);
  const question = drillQuestions(german, lesson).find((item) => item.english === 'Are you sick?');
  assert.ok(question);
  assert.equal(question.target, 'Sind Sie krank?');
  assert.equal(meaningBlocks(question.example, 'de')[1], 'YOU');
  assert.notEqual(meaningBlocks(question.example, 'de')[0], 'YOU');

  const french = compileGuide('fr');
  const frenchIdentity = french.lessons.find((item) => item.id === 'identity');
  assert.ok(frenchIdentity);
  const frenchQuestion = drillQuestions(french, frenchIdentity).find((item) => item.english === 'Are you sick?');
  assert.ok(frenchQuestion);
  assert.equal(meaningBlocks(frenchQuestion.example, 'fr')[0], 'YOU');
});

test('formal register is marked in all supported target languages', () => {
  for (const [code, expected] of [['de', 'Sie'], ['fr', 'vous'], ['es', 'usted']]) {
    const guide = compileGuide(code);
    const lesson = guide.lessons.find((item) => item.id === 'identity');
    assert.ok(lesson);
    const question = drillQuestions(guide, lesson).find((item) => item.english === 'Are you sick?');
    assert.ok(question);
    assert.match(question.contextHint, new RegExp(expected));
  }
});
