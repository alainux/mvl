import test from 'node:test';
import assert from 'node:assert/strict';
import { compileGuide } from '../docs/assets/learning/compile.js';
import {
  QUEST_ROUNDS, QUEST_HEARTS, questRounds, beginQuest,
  addQuestTile, removeQuestTile, clearQuestTiles, checkQuest, questHint,
  nextQuestRound, questStars, selectedWords,
} from '../docs/assets/ui/quest-model.js';

for (const code of ['de','fr','es']) {
  test(code + ': every level generates a playable five-encounter quest from its lessons', () => {
    const guide = compileGuide(code);
    assert.equal(guide.lessons.length, 40);
    for (const lesson of guide.lessons) {
      const rounds = questRounds(guide, lesson);
      assert.equal(rounds.length, QUEST_ROUNDS, lesson.id);
      assert.equal(rounds.filter(r => r.boss).length, 1);
      assert.equal(rounds.at(-1).boss, true);
      for (const round of rounds) {
        assert.ok(round.target && round.goal && round.recipe.length);
        assert.equal(round.expected.join(' '), round.target.trim());
        assert.equal(new Set(round.tiles.map(t => t.id)).size, round.tiles.length);
        const bank = round.tiles.map(t => t.word);
        for (const word of new Set(round.expected)) {
          assert.ok(bank.filter(w => w === word).length >= round.expected.filter(w => w === word).length,
            lesson.id + ': ' + word);
        }
        assert.ok(round.tiles.length > round.expected.length, 'Each round needs a distractor: '+lesson.id);
        assert.deepEqual(questRounds(guide, lesson), rounds, 'Rerendering must preserve word tile IDs and order');
      }
    }
  });
}

test('a winning run requires actual assembly across all encounters and awards three stars', () => {
  const guide = compileGuide('de');
  const rounds = questRounds(guide, guide.lessons[0]);
  let game = beginQuest('de:first-words');
  for (const [index, round] of rounds.entries()) {
    assert.equal(game.round, index);
    for (const word of round.expected) {
      const tile = round.tiles.find(t => t.word === word && !game.selected.includes(t.id));
      assert.ok(tile);
      game = addQuestTile(game, round, tile.id);
    }
    assert.deepEqual(selectedWords(game, round), round.expected);
    game = checkQuest(game, round);
    assert.equal(game.phase, 'won');
    game = nextQuestRound(game, rounds.length);
  }
  assert.equal(game.phase, 'victory');
  assert.equal(game.hearts, QUEST_HEARTS);
  assert.equal(game.combo, rounds.length);
  assert.equal(game.bestCombo, rounds.length);
  assert.equal(questStars(game), 3);
});

test('a wrong answer costs one heart and can be repaired without losing chosen blocks', () => {
  const guide = compileGuide('de');
  const round = questRounds(guide, guide.lessons[0])[0];
  let game = beginQuest('de:first-words');
  const wrong = round.tiles.find(t => !round.expected.includes(t.word));
  assert.ok(wrong);
  game = addQuestTile(game, round, wrong.id);
  game = checkQuest(game, round);
  assert.equal(game.phase, 'play');
  assert.equal(game.hearts, QUEST_HEARTS - 1);
  assert.equal(game.misses, 1);
  assert.equal(game.selected[0], wrong.id);

  game = removeQuestTile(game, 0);
  assert.equal(game.selected.length, 0);
  for (const word of round.expected) {
    const correct = round.tiles.find(t => t.word === word && !game.selected.includes(t.id));
    assert.ok(correct);
    game = addQuestTile(game, round, correct.id);
  }
  game = checkQuest(game, round);
  assert.equal(game.phase, 'won');
  assert.equal(questStars(game), 2);
});

test('clues identify the next matching tile and reduce star ranking; incorrect prefixes cannot consume clues', () => {
  const guide = compileGuide('de');
  const round = questRounds(guide, guide.lessons[0])[0];
  let state = beginQuest('de:first-words');
  const wrong = round.tiles.find(t => !round.expected.includes(t.word));
  assert.ok(wrong);
  state = addQuestTile(state, round, wrong.id);
  const blocked = questHint(state, round);
  assert.equal(blocked.hints, 0);
  assert.match(blocked.feedback, /Remove the incorrect block/);

  state = clearQuestTiles(state);
  state = questHint(state, round);
  assert.equal(state.hints, 1);
  assert.ok(state.hintTile !== null);
  assert.equal(round.tiles.find(t => t.id === state.hintTile)?.word, round.expected[0]);
  assert.equal(questHint(state, round).hints, 1);
});

test('three failed checks end the game; winning later rounds is impossible after defeat', () => {
  const guide = compileGuide('de');
  const round = questRounds(guide, guide.lessons[0])[0];
  let state = beginQuest('de:first-words');
  const wrong = round.tiles.find(t => !round.expected.includes(t.word));
  assert.ok(wrong);
  state = addQuestTile(state, round, wrong.id);
  for (let n = 0; n < QUEST_HEARTS; n++) state = checkQuest(state, round);
  assert.equal(state.hearts, 0);
  assert.equal(state.phase, 'lost');
  assert.deepEqual(nextQuestRound(state, 5), state);
  assert.equal(addQuestTile(state, round, 0), state);
});
