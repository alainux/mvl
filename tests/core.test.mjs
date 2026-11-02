import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SELECTION,
  analyze,
  ask,
  event,
  makeTree,
  modal,
  negate,
  notation,
  please,
  when,
} from '../docs/assets/core/algebra.js';
import { deriveProfile } from '../docs/assets/core/profile.js';
import { OPERATORS, PREDICATES } from '../docs/assets/core/vocabulary.js';

test('the starter profile exposes its declared inventory', () => {
  assert.equal(Object.keys(PREDICATES).length, 6);
  assert.equal(OPERATORS.length, 7);
});

test('the syntax tree is independent of surface language', () => {
  const tree = makeTree({
    ...DEFAULT_SELECTION,
    predicate: 'help',
    agent: 'addressee',
    argument: 'speaker',
    modal: 'can',
    question: true,
    polite: true,
  });

  assert.equal(notation(tree), 'PLEASE(ASK(CAN(EVENT(help, addressee, speaker))))');
  assert.equal(analyze(tree).event.predicate, 'help');
  assert.doesNotMatch(JSON.stringify(tree), /Sie|vous|usted|helfen/);
  assert.ok(Object.isFrozen(tree));
});

test('operator composition preserves explicit scope', () => {
  const first = event('help', 'addressee', 'speaker');
  const expression = please(ask(when(negate(modal('can', first)), 'tomorrow')));

  assert.equal(
    notation(expression),
    'PLEASE(ASK(WHEN(NOT(CAN(EVENT(help, addressee, speaker))), tomorrow)))',
  );
  assert.deepEqual(analyze(expression), {
    event: first,
    modality: 'can',
    negative: true,
    time: 'tomorrow',
    question: true,
    polite: true,
  });
});

test('runtime inputs reject unsupported frames and combinations', () => {
  assert.throws(() => event('need', 'speaker', 'station'), /requires/);
  assert.throws(() => event('help', 'speaker', 'speaker'), /must differ/);
  assert.throws(() => event('missing', 'speaker', 'help'), /Unknown predicate/);
  assert.throws(() => event('need', 'third-person', 'help'), /Unknown participant/);
  assert.throws(() => modal('can', event('have', 'speaker', 'time')), /not supported/);
  assert.throws(() => makeTree({ ...DEFAULT_SELECTION, question: false, polite: true }), /requires ASK/);
  assert.throws(() => when(event('go', 'speaker', 'home'), 'yesterday'), /Unknown time/);
});

test('profile planning returns deterministic dependency closure', () => {
  assert.deepEqual(deriveProfile(['assert']).operators, ['EVENT']);
  assert.deepEqual(deriveProfile(['request']).operators, ['EVENT', 'CAN', 'ASK', 'PLEASE']);
  assert.deepEqual(deriveProfile(['ask', 'deny', 'situate']).operators, [
    'EVENT', 'NOT', 'WHEN', 'ASK',
  ]);
  assert.deepEqual(deriveProfile(['assert', 'assert']).goals, ['assert']);
  assert.throws(() => deriveProfile([]), /Select at least one/);
  assert.throws(() => deriveProfile(['does-not-exist']), /Unknown capability/);
});
