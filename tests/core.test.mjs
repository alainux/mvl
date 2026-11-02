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
  price,
  when,
  where,
} from '../docs/assets/core/algebra.js';
import { deriveProfile } from '../docs/assets/core/profile.js';
import { OPERATORS, PREDICATES } from '../docs/assets/core/vocabulary.js';

const selection = (overrides) => ({
  ...DEFAULT_SELECTION,
  modal: '',
  question: false,
  polite: false,
  ...overrides,
});

test('the starter meaning algebra declares its bounded inventory', () => {
  assert.equal(Object.keys(PREDICATES).length, 10);
  assert.equal(OPERATORS.length, 9);
  assert.deepEqual(Object.keys(PREDICATES).includes('need'), true);
  assert.deepEqual(Object.keys(PREDICATES).includes('buy'), true);
});

test('meaning trees contain no target-language words', () => {
  const tree = makeTree(selection({
    predicate: 'help',
    agent: 'addressee',
    argument: 'speaker',
    modal: 'can',
    question: true,
    polite: true,
  }));

  assert.equal(notation(tree), 'PLEASE(ASK(CAN(EVENT(help, addressee, speaker))))');
  assert.equal(analyze(tree).event.predicate, 'help');
  assert.doesNotMatch(JSON.stringify(tree), /Sie|vous|usted|helfen|ayudar/);
  assert.ok(Object.isFrozen(tree));
});

test('operators preserve scope and allow composition', () => {
  const action = event('help', 'addressee', 'speaker');
  const expression = please(ask(when(negate(modal('can', action)), 'tomorrow')));

  assert.equal(
    notation(expression),
    'PLEASE(ASK(WHEN(NOT(CAN(EVENT(help, addressee, speaker))), tomorrow)))',
  );
  assert.deepEqual(analyze(expression), {
    event: action,
    modality: 'can',
    negative: true,
    time: 'tomorrow',
    question: true,
    polite: true,
  });
});

test('place and price questions are represented by separate operators', () => {
  assert.equal(notation(where('station')), 'WHERE(station)');
  assert.equal(notation(price('coffee')), 'PRICE(coffee)');
});

test('meaning constructors reject unsupported arguments and combinations', () => {
  assert.throws(() => event('need', 'speaker', 'station'), /requires/);
  assert.throws(() => event('help', 'speaker', 'speaker'), /must differ/);
  assert.throws(() => event('unknown', 'speaker', 'help'), /Unknown predicate/);
  assert.throws(() => event('need', 'third-person', 'help'), /Unknown participant/);
  assert.throws(() => modal('can', event('have', 'speaker', 'time')), /not supported/);
  assert.throws(() => makeTree(selection({ polite: true })), /requires ASK/);
  assert.throws(() => when(event('go', 'speaker', 'home'), 'yesterday'), /Unknown time/);
});

test('the minimal capability planner is deterministic', () => {
  assert.deepEqual(deriveProfile(['assert']).operators, ['EVENT']);
  assert.deepEqual(deriveProfile(['request']).operators, ['EVENT', 'CAN', 'ASK', 'PLEASE']);
  assert.deepEqual(deriveProfile(['ask', 'deny', 'situate']).operators, [
    'EVENT', 'NOT', 'WHEN', 'ASK',
  ]);
  assert.throws(() => deriveProfile([]), /Select at least one/);
});
