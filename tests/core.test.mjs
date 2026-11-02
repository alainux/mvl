import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SELECTION,
  describe,
  habit,
  presence,
  sequence,
  ask,
  askWhen,
  clause,
  event,
  inTense,
  link,
  makeTree,
  modal,
  negate,
  notation,
  please,
  when,
} from '../docs/assets/core/algebra.js';
import { PREDICATES } from '../docs/assets/core/vocabulary.js';

const selection = (changes) => ({
  ...DEFAULT_SELECTION,
  predicate: 'buy',
  agent: 'speaker',
  argument: 'ticket',
  modal: '',
  question: false,
  polite: false,
  negative: false,
  reason: 'none',
  time: '',
  ...changes,
});

test('the productive core has broad events, not a phrase inventory', () => {
  assert.ok(Object.keys(PREDICATES).length >= 20);
  for (const predicate of ['go','work','buy','call','help','have','be','study']) {
    assert.ok(Object.hasOwn(PREDICATES, predicate));
  }
});

test('tense, questions and negation are composable operations', () => {
  const base = clause(event('buy', 'speaker', 'ticket', 2));
  const past = when(negate(inTense(base, 'past')), 'yesterday');
  assert.equal(notation(past), 'WHEN(NOT(PAST(EVENT(buy, speaker, ticket, two))), yesterday)');
  assert.equal(past.tense, 'past');
  assert.equal(past.negative, true);
  assert.ok(Object.isFrozen(past));
  assert.ok(Object.isFrozen(past.event));
});

test('the modal and question operators preserve scope', () => {
  const question = please(ask(modal(clause(event('help', 'addressee', 'speaker')), 'can')));
  assert.equal(notation(question), 'PLEASE(ASK(CAN(EVENT(help, addressee, speaker))))');
});

test('the same event can be used in past, present and future', () => {
  const outputs = ['present','past','future'].map((tense) => makeTree(selection({tense})));
  assert.equal(new Set(outputs.map(notation)).size, 3);
  assert.ok(outputs.every((output) => output.kind === 'clause' && output.event.predicate === 'buy'));
});

test('independent clauses compose into reasons and contrasts', () => {
  const first = negate(modal(clause(event('come','speaker','none')), 'can'));
  const second = clause(event('be','speaker','sick'));
  const explanation = link(first, 'because', second);
  assert.equal(explanation.kind, 'link');
  assert.match(notation(explanation), /^BECAUSE\(/);
  assert.throws(() => link(ask(first), 'and', second), /Only statements/);
});

test('semantic slots and incompatible time combinations are validated', () => {
  assert.throws(() => event('buy','speaker','station'), /requires/);
  assert.throws(() => event('go','speaker','coffee'), /requires/);
  assert.throws(() => event('help','speaker','speaker'), /Self-directed/);
  assert.throws(() => event('need','speaker','water',2), /Cannot count/);
  assert.throws(() => modal(clause(event('have','speaker','time')),'must'), /not supported/);
  assert.throws(() => when(inTense(clause(event('work','speaker','none')),'past'),'tomorrow'), /incompatible/);
  assert.throws(() => makeTree(selection({tense:'past',time:'tomorrow'})), /incompatible/);
  assert.throws(() => please(clause(event('work','speaker','none'))), /requires a question/);
  assert.throws(() => askWhen(when(clause(event('work','speaker','none')),'today')), /without a time marker/);
});


test('quality, habit and narrative primitives reject nonsensical compositions', () => {
  assert.equal(describe('room', 'clean').kind, 'describe');
  assert.throws(() => describe('room', 'late'), /cannot be described/);
  assert.throws(() => presence('room', 'unknown'), /Unknown presence location/);
  assert.equal(habit(clause(event('read', 'speaker', 'book')), 'every_day').frequency, 'every_day');
  assert.throws(() => habit(inTense(clause(event('read','speaker','book')),'past'), 'often'), /present/);
  assert.throws(() => sequence(clause(event('buy','speaker','ticket'))), /two to four/);
  assert.throws(() => makeTree(selection({predicate:'like', argument:'music', tense:'past'})), /Only present preferences/);
});
