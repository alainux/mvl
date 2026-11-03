import test from 'node:test';
import assert from 'node:assert/strict';
import { clozeFor, clozeHint, matchesCloze } from '../docs/assets/ui/drill-cloze.js';
import { compileGuide } from '../docs/assets/learning/compile.js';
import { drillQuestions } from '../docs/assets/ui/game-model.js';

test('a cloze removes exactly one real word while preserving the exact target sentence', () => {
  const c = clozeFor('Ich habe eine Frage.', 0, 'de');
  assert.equal(c.word, 'habe');
  assert.equal(c.before + c.word + c.after, 'Ich habe eine Frage.');
  assert.equal(c.before + '____' + c.after, 'Ich ____ eine Frage.');
});

test('punctuation, apostrophes, inverted question marks and Unicode remain intact', () => {
  for (const [text, code] of [
    ['¿Dónde está la estación?', 'es'],
    ["J’aimerais un café, s’il vous plaît.", 'fr'],
    ['Wo ist der nächste Bahnhof?', 'de'],
  ]) {
    const c = clozeFor(text, 1, code);
    assert.equal(c.before + c.word + c.after, text);
    assert.ok(c.length >= 3);
  }
});

test('word grading ignores case and outer punctuation but not meaning-changing accents', () => {
  assert.equal(matchesCloze('  HABE! ', 'habe'), true);
  assert.equal(matchesCloze('CAFÉ', 'café'), true);
  assert.equal(matchesCloze('cafe', 'café'), false);
  assert.equal(matchesCloze('schon', 'schön'), false);
  assert.equal(matchesCloze('someone else', 'habe'), false);
});

test('the two optional hints never invent words or silently give full solutions', () => {
  const cloze = clozeFor('Ich habe eine Frage.', 0, 'de');
  assert.match(clozeHint(cloze, 1), /4 letters/);
  assert.match(clozeHint(cloze, 1), /h/);
  assert.match(clozeHint(cloze, 2), /h a/);
  assert.doesNotMatch(clozeHint(cloze, 2), /h a b e/);
});

test('every supported lesson produces reconstructible missing-word phrases', () => {
  for (const code of ['de', 'fr', 'es']) {
    const guide = compileGuide(code);
    for (const lesson of guide.lessons) {
      const deck = drillQuestions(guide, lesson);
      for (const [i, question] of deck.entries()) {
        const c = clozeFor(question.target, i, code);
        assert.equal(c.before + c.word + c.after, question.target, code + ':' + lesson.id);
        assert.ok(c.word.trim().length >= 1);
        assert.ok(matchesCloze(c.word, c.word));
      }
    }
  }
});
