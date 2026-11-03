import test from 'node:test';
import assert from 'node:assert/strict';

import { makeTree } from '../docs/assets/core/algebra.js';
import { linearize } from '../docs/assets/languages/index.js';
import { realizeEnglish } from '../docs/assets/languages/en.js';
import {
  RECIPES, MISSIONS, initialStudio, applyRecipe, studioExpression, normalizeStudio,
  availableOperator, toggleOperator, operatorApplied, startMission, matchesMission,
  missionAnswer, fromExpression,
} from '../docs/assets/ui/studio-model.js';

const codes = ['de', 'fr', 'es'];

test('all twelve semantic patterns produce sentences in German, French, and Spanish', () => {
  assert.equal(RECIPES.length, 12);
  for (const recipe of RECIPES) {
    const state = applyRecipe(initialStudio(), recipe);
    const expression = studioExpression(state);
    for (const code of codes) {
      const text = linearize(expression, code);
      assert.ok(text.length > 4, `${recipe.id}/${code}`);
      assert.match(text, /[.!?]$/, `${recipe.id}/${code}`);
    }
    assert.ok(realizeEnglish(expression).length > 4);
  }
});

test('the Past block changes grammar, not a stored translation', () => {
  const source = applyRecipe(initialStudio(), RECIPES[0]);
  const past = toggleOperator(source, 'past');
  assert.equal(past.action.tense, 'past');
  assert.equal(past.action.time, 'yesterday');
  assert.ok(operatorApplied(past, 'past'));
  for (const code of codes) {
    assert.notEqual(linearize(studioExpression(source), code), linearize(studioExpression(past), code));
  }
  const undone = toggleOperator(past, 'past');
  assert.equal(undone.action.tense, 'present');
  assert.equal(undone.action.time, '');
});

test('the palette respects predicate frames; incompatible modal blocks stay unavailable', () => {
  const state = initialStudio();
  assert.equal(state.action.predicate, 'need');
  assert.equal(availableOperator(state, 'can'), false);
  const permitted = applyRecipe(state, RECIPES.find((recipe) => recipe.id === 'request'));
  assert.equal(availableOperator(permitted, 'can'), true);
  assert.equal(permitted.action.modal, 'can');
  assert.equal(operatorApplied(permitted, 'polite'), true);
  assert.equal(operatorApplied(permitted, 'question'), true);
});

test('four guided missions have attainable, validated semantic targets', () => {
  assert.equal(MISSIONS.length, 4);
  for (const mission of MISSIONS) {
    const start = startMission(initialStudio(), mission);
    assert.equal(matchesMission(start, mission), false, `${mission.id} should require editing`);
    const completed = normalizeStudio({
      ...start, action: { ...initialStudio().action, ...mission.target },
    });
    assert.equal(matchesMission(completed, mission), true, mission.id);
    const wrong = normalizeStudio({
      ...completed,
      action: { ...completed.action, negative: !completed.action.negative },
    });
    assert.equal(matchesMission(wrong, mission), false, `${mission.id} should reject unrelated operators`);
    const answer = missionAnswer(mission);
    for (const code of codes) assert.ok(linearize(answer, code).length > 5);
  }
});

test('prebuilt lesson expression roundtrips into editable blocks without phrase lookup', () => {
  const selection = {
    ...initialStudio().action,
    predicate: 'buy', agent: 'we', argument: 'ticket', quantity: 2,
    modal: '', tense: 'future', time: 'tomorrow', question: false, polite: false,
  };
  const expression = makeTree(selection);
  const rehydrated = fromExpression(expression);
  assert.ok(rehydrated);
  assert.deepEqual(studioExpression(rehydrated), expression);
  for (const code of codes) {
    assert.equal(linearize(studioExpression(rehydrated), code), linearize(expression, code));
  }
});

test('non-action patterns expose their own valid operators', () => {
  const description = applyRecipe(initialStudio(), RECIPES.find((recipe) => recipe.id === 'description'));
  assert.equal(availableOperator(description, 'must'), false);
  assert.equal(availableOperator(description, 'negative'), true);
  const negative = toggleOperator(description, 'negative');
  assert.equal(negative.descriptionNegative, true);
  for (const code of codes) {
    assert.notEqual(linearize(studioExpression(description), code), linearize(studioExpression(negative), code));
  }
});

test('word order strip is based on generated surface text, not semantic tile order', async () => {
  const { traceSurfaceOrder } = await import('../docs/assets/ui/surface-order.js');
  const selection = {
    ...initialStudio().action,
    predicate: 'need', argument: 'help', tense: 'future', time: 'tomorrow',
    negative: true, modal: '',
  };
  const current = makeTree(selection);
  const withoutNegation = makeTree({ ...selection, negative: false });
  for (const code of codes) {
    const output = linearize(current, code);
    const baseline = linearize(withoutNegation, code);
    const words = traceSurfaceOrder(output, baseline);
    assert.equal(words.map((word) => word.text).join(' '), output);
    assert.ok(words.some((word) => word.affected), `negation should change ${code}`);
    assert.ok(words.some((word) => !word.affected), `unchanged words should remain ${code}`);
  }

  const german = traceSurfaceOrder('Ich brauche morgen keine Hilfe.', 'Ich brauche morgen Hilfe.');
  assert.deepEqual(german.filter((word) => word.affected).map((word) => word.text), ['keine']);
  assert.deepEqual(german.map((word) => word.text), ['Ich', 'brauche', 'morgen', 'keine', 'Hilfe.']);
});

test('surface contrast covers split operators and reordering without phrase dictionaries', async () => {
  const { traceSurfaceOrder } = await import('../docs/assets/ui/surface-order.js');
  const french = traceSurfaceOrder('Je ne parle pas français.', 'Je parle français.');
  assert.deepEqual(french.filter((word) => word.affected).map((word) => word.text), ['ne', 'pas']);

  const moved = traceSurfaceOrder('Kann ich morgen kommen?', 'Ich kann morgen kommen.');
  assert.deepEqual(moved.map((word) => word.text), ['Kann', 'ich', 'morgen', 'kommen?']);
  assert.ok(moved.some((word) => word.affected));
});
