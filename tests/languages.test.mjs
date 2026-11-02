import test from 'node:test';
import assert from 'node:assert/strict';

import { makeTree, DEFAULT_SELECTION } from '../docs/assets/core/algebra.js';
import { PREDICATES } from '../docs/assets/core/vocabulary.js';
import { languages, linearize } from '../docs/assets/languages/index.js';

function selection(partial) {
  return { ...DEFAULT_SELECTION, modal: '', question: false, ...partial };
}

test('all three adapters implement the same contract', () => {
  assert.deepEqual(languages.map((language) => language.profile.code), ['de', 'fr', 'es']);
  assert.ok(languages.every(({ profile, realize }) =>
    profile.features.length >= 4 && typeof realize === 'function'));
  assert.throws(() => linearize(makeTree(selection({
    predicate: 'need', argument: 'help',
  })), 'xx'), /Unknown language/);
});

/**
 * Golden examples are expected surface grammar, not a phrase catalog used by
 * the realizers. Human review is still needed before extending coverage.
 */
const goldenCases = [
  {
    options: { predicate: 'help', agent: 'addressee', argument: 'speaker', modal: 'can', question: true },
    expected: ['Können Sie mir helfen?', 'Est-ce que vous pouvez m’aider ?', '¿Usted puede ayudarme?'],
  },
  {
    options: { predicate: 'need', agent: 'speaker', argument: 'help' },
    expected: ['Ich brauche Hilfe.', 'J’ai besoin d’aide.', 'Necesito ayuda.'],
  },
  {
    options: { predicate: 'understand', agent: 'speaker', argument: 'this', negative: true },
    expected: ['Ich verstehe das nicht.', 'Je ne comprends pas ça.', 'No entiendo esto.'],
  },
  {
    options: { predicate: 'go', agent: 'speaker', argument: 'station', modal: 'want', time: 'tomorrow' },
    expected: ['Ich will morgen zum Bahnhof gehen.', 'Je veux aller à la gare demain.', 'Quiero ir a la estación mañana.'],
  },
  {
    options: { predicate: 'have', agent: 'addressee', argument: 'time', negative: true, question: true },
    expected: ['Haben Sie keine Zeit?', 'Est-ce que vous n’avez pas le temps ?', '¿Usted no tiene tiempo?'],
  },
  {
    options: { predicate: 'help', agent: 'addressee', argument: 'speaker', modal: 'can', question: true, polite: true },
    expected: ['Können Sie mir bitte helfen?', 'Est-ce que vous pouvez m’aider, s’il vous plaît ?', '¿Usted puede ayudarme, por favor?'],
  },
  {
    options: { predicate: 'buy', agent: 'speaker', argument: 'ticket', negative: true },
    expected: ['Ich kaufe kein Ticket.', 'Je n’achète pas de billet.', 'No compro un billete.'],
  },
  {
    options: { predicate: 'help', agent: 'speaker', argument: 'addressee' },
    expected: ['Ich helfe Ihnen.', 'Je vous aide.', 'Le ayudo.'],
  },
  {
    options: { predicate: 'help', agent: 'addressee', argument: 'speaker', negative: true },
    expected: ['Sie helfen mir nicht.', 'Vous ne m’aidez pas.', 'Usted no me ayuda.'],
  },
  {
    // Regression: before the refactor, French incorrectly elided je with n’.
    options: { predicate: 'have', agent: 'speaker', argument: 'ticket', negative: true },
    expected: ['Ich habe kein Ticket.', 'Je n’ai pas de billet.', 'No tengo un billete.'],
  },
  {
    options: { predicate: 'need', agent: 'speaker', argument: 'ticket', question: true },
    expected: ['Brauche ich ein Ticket?', 'Est-ce que j’ai besoin d’un billet ?', '¿Necesito un billete?'],
  },
];

for (const { options, expected } of goldenCases) {
  test(`golden realization: ${JSON.stringify(options)}`, () => {
    const tree = makeTree(selection(options));
    assert.deepEqual(languages.map((language) => language.realize(tree)), expected);
  });
}

test('every supported combination compiles across all adapters', () => {
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

                for (const language of languages) {
                  const result = language.realize(tree);
                  assert.ok(result.length > 4, language.profile.code);
                  assert.doesNotMatch(result, /undefined|null|  /);
                  assert.match(result, question ? /\?$/ : /\.$/);
                  assert.doesNotMatch(result, /^j’n’/i, 'French subject elision is invalid');
                  tested += 1;
                }
              }
            }
          }
        }
      }
    }
  }

  assert.ok(tested >= 400, `${tested} combinations checked`);
});
