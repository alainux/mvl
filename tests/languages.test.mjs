import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_SELECTION, makeTree, price, where } from '../docs/assets/core/algebra.js';
import { PREDICATES } from '../docs/assets/core/vocabulary.js';
import { languages, linearize } from '../docs/assets/languages/index.js';
import { realizeEnglish } from '../docs/assets/languages/en.js';

const selection = (overrides) => ({
  ...DEFAULT_SELECTION,
  agent: 'speaker',
  predicate: 'need',
  argument: 'help',
  modal: '',
  question: false,
  polite: false,
  negative: false,
  time: '',
  ...overrides,
});

test('German, French, Spanish use the same typed AST contract', () => {
  assert.deepEqual(languages.map((language) => language.profile.code), ['de', 'fr', 'es']);
  assert.ok(languages.every((language) => language.profile.features.length >= 4));
  assert.throws(() => linearize(makeTree(selection({})), 'xx'), /Unknown language/);
});

/** Golden outputs are regression assertions; they are never used to produce lessons. */
const cases = [
  {
    meaning: { predicate: 'help', agent: 'addressee', argument: 'speaker', modal: 'can', question: true },
    expected: ['Können Sie mir helfen?', 'Est-ce que vous pouvez m’aider ?', '¿Puede ayudarme?'],
  },
  {
    meaning: { predicate: 'need', argument: 'coffee' },
    expected: ['Ich brauche einen Kaffee.', 'J’ai besoin d’un café.', 'Necesito un café.'],
  },
  {
    meaning: { predicate: 'understand', argument: 'this', negative: true },
    expected: ['Ich verstehe das nicht.', 'Je ne comprends pas ça.', 'No entiendo esto.'],
  },
  {
    meaning: { predicate: 'go', argument: 'station', modal: 'want', time: 'tomorrow' },
    expected: ['Ich will morgen zum Bahnhof gehen.', 'Je veux aller à la gare demain.', 'Quiero ir a la estación mañana.'],
  },
  {
    meaning: { predicate: 'have', agent: 'addressee', argument: 'time', negative: true, question: true },
    expected: ['Haben Sie keine Zeit?', 'Est-ce que vous n’avez pas le temps ?', '¿No tiene tiempo?'],
  },
  {
    meaning: { predicate: 'help', agent: 'addressee', argument: 'speaker', modal: 'can', question: true, polite: true },
    expected: ['Können Sie mir bitte helfen?', 'Est-ce que vous pouvez m’aider, s’il vous plaît ?', '¿Puede ayudarme, por favor?'],
  },
  {
    meaning: { predicate: 'buy', argument: 'ticket', negative: true },
    expected: ['Ich kaufe kein Ticket.', 'Je n’achète pas de billet.', 'No compro un billete.'],
  },
  {
    meaning: { predicate: 'help', agent: 'speaker', argument: 'addressee' },
    expected: ['Ich helfe Ihnen.', 'Je vous aide.', 'Le ayudo.'],
  },
  {
    meaning: { predicate: 'have', argument: 'ticket', negative: true },
    expected: ['Ich habe kein Ticket.', 'Je n’ai pas de billet.', 'No tengo un billete.'],
  },
  {
    meaning: { predicate: 'have', argument: 'time', time: 'today' },
    expected: ['Ich habe heute Zeit.', 'J’ai le temps aujourd’hui.', 'Tengo tiempo hoy.'],
  },
  {
    meaning: { predicate: 'buy', argument: 'ticket', modal: 'want', time: 'today' },
    expected: ['Ich will heute ein Ticket kaufen.', 'Je veux acheter un billet aujourd’hui.', 'Quiero comprar un billete hoy.'],
  },
  {
    meaning: { predicate: 'pay', argument: 'card', modal: 'can', question: true },
    expected: ['Kann ich mit Karte bezahlen?', 'Est-ce que je peux payer par carte ?', '¿Puedo pagar con tarjeta?'],
  },
  {
    meaning: { predicate: 'speak', argument: 'spanish', negative: true },
    expected: ['Ich spreche kein Spanisch.', 'Je ne parle pas espagnol.', 'No hablo español.'],
  },
];

for (const { meaning, expected } of cases) {
  test(`compositional grammar: ${JSON.stringify(meaning)}`, () => {
    const tree = makeTree(selection(meaning));
    assert.deepEqual(languages.map((language) => language.realize(tree)), expected);
    assert.ok(realizeEnglish(tree).length > 5);
  });
}

test('place and price grammars realize semantic slots, not phrase keys', () => {
  assert.deepEqual(languages.map((entry) => entry.realize(where('bathroom'))), [
    'Wo ist die Toilette?',
    'Où sont les toilettes ?',
    '¿Dónde está el baño?',
  ]);
  assert.deepEqual(languages.map((entry) => entry.realize(price('coffee'))), [
    'Wie viel kostet ein Kaffee?',
    'Combien coûte un café ?',
    '¿Cuánto cuesta un café?',
  ]);
});

test('every valid composition has a well-formed result in all languages', () => {
  let tested = 0;
  for (const [predicate, frame] of Object.entries(PREDICATES)) {
    for (const agent of ['speaker', 'addressee']) {
      for (const argument of frame.allowedArguments) {
        if (predicate === 'help' && agent === argument) continue;
        for (const modal of ['', ...frame.allowedModalities]) {
          for (const negative of [false, true]) {
            for (const question of [false, true]) {
              for (const time of ['', 'today', 'tomorrow']) {
                const tree = makeTree(selection({
                  predicate, agent, argument, modal, negative, question, time,
                }));
                for (const adapter of languages) {
                  const result = adapter.realize(tree);
                  assert.ok(result.length > 4, `${adapter.profile.code} ${predicate}`);
                  assert.doesNotMatch(result, /undefined|null|  /);
                  assert.match(result, question ? /\?$/ : /\.$/);
                  assert.doesNotMatch(result, /^j’n’/i, 'French subject elision');
                  tested += 1;
                }
              }
            }
          }
        }
      }
    }
  }
  assert.ok(tested >= 1000, `Expected over 1000 generated forms, got ${tested}`);
});
