import test from 'node:test';
import assert from 'node:assert/strict';

import { event, clause, negate, inTense, modal, ask, presence } from '../docs/assets/core/algebra.js';
import { COUNTABLE_THINGS, PREDICATES } from '../docs/assets/core/vocabulary.js';
import { linearize } from '../docs/assets/languages/index.js';
import { realizeEnglish } from '../docs/assets/languages/en.js';
import { matchesModel } from '../docs/assets/learning/practice.js';
import { availableOperator, initialStudio, normalizeStudio } from '../docs/assets/ui/studio-model.js';

/**
 * Property checks focus on the relationship between semantic operations
 * and their generated surface forms. Punctuated output alone is not proof
 * of correct realization: a NOT block must actually negate the meaning.
 */
test('NOT changes every supported predicate/argument combination in all three languages', () => {
  let checked = 0;
  for (const [predicate, frame] of Object.entries(PREDICATES)) {
    for (const argument of frame.allowedArguments) {
      for (const agent of ['speaker', 'addressee', 'we', 'other']) {
        let base;
        try { base = clause(event(predicate, agent, argument)); }
        catch { continue; }
        for (const language of ['de', 'fr', 'es']) {
          const positive = linearize(base, language);
          const negative = linearize(negate(base), language);
          assert.notEqual(positive, negative, `${language}: negating ${predicate}(${agent}, ${argument}) must change the sentence`);
          checked += 1;
        }
      }
    }
  }
  assert.ok(checked > 1500, `Only ${checked} polarity pairs checked`);
});

test('TWO is enabled only when quantity is meaningful and visibly realized', () => {
  let checked = 0;
  for (const [predicate, frame] of Object.entries(PREDICATES)) {
    for (const argument of frame.allowedArguments) {
      if (!(COUNTABLE_THINGS).includes(argument)) continue;
      if (frame.argumentRole !== 'thing' || predicate === 'like') {
        assert.throws(() => event(predicate, 'speaker', argument, 2), /Cannot count/);
        continue;
      }
      const one = clause(event(predicate, 'speaker', argument));
      const two = clause(event(predicate, 'speaker', argument, 2));
      for (const language of ['de', 'fr', 'es']) {
        assert.notEqual(linearize(one, language), linearize(two, language),
          `${language}: TWO must affect ${predicate}(${argument})`);
        checked += 1;
      }
    }
  }
  const irrelevant = normalizeStudio({
    ...initialStudio(), action: { ...initialStudio().action, predicate: 'stay', argument: 'apartment' },
  });
  assert.equal(availableOperator(irrelevant, 'quantity'), false);
  assert.ok(checked >= 100);
});

test('English prompts use correct third-person, past be and future question grammar', () => {
  const form = (p, a, agent = 'other') => realizeEnglish(clause(event(p, agent, a)));
  assert.equal(form('have', 'ticket'), 'He has a ticket.');
  assert.equal(form('go', 'station'), 'He goes to the station.');
  assert.equal(form('return', 'none'), 'He comes back.');
  assert.equal(form('look_for', 'job'), 'He looks for a job.');
  assert.equal(form('fill_out', 'form'), 'He fills out a form.');
  assert.equal(realizeEnglish(negate(clause(event('need', 'other', 'help')))), 'He does not need help.');
  assert.equal(realizeEnglish(modal(clause(event('work', 'other', 'none')), 'must')), 'He has to work.');
  assert.equal(realizeEnglish(negate(modal(clause(event('work', 'other', 'none')), 'must'))), 'He does not have to work.');
  assert.equal(realizeEnglish(ask(modal(clause(event('work', 'other', 'none')), 'must'))), 'Does he have to work?');
  assert.equal(realizeEnglish(inTense(clause(event('be', 'addressee', 'ready')), 'past')), 'You were ready.');
  assert.equal(realizeEnglish(ask(inTense(clause(event('be', 'other', 'ready')), 'future'))), 'Will he be ready soon?');
});

test('German specials preserve NOT and TWO; French no-obligation is not prohibition', () => {
  const deInternet = clause(event('use', 'speaker', 'internet'));
  assert.equal(linearize(negate(deInternet), 'de'), 'Ich benutze das Internet nicht.');
  const bill = clause(event('would_like', 'speaker', 'bill'));
  assert.equal(linearize(negate(bill), 'de'), 'Ich möchte keine Rechnung.');
  const twoBills = clause(event('would_like', 'speaker', 'bill', 2));
  assert.equal(linearize(twoBills, 'de'), 'Ich möchte zwei Rechnungen.');
  assert.equal(linearize(twoBills, 'fr'), 'Je voudrais deux additions.');
  assert.equal(linearize(twoBills, 'es'), 'Quisiera dos cuentas.');
  assert.equal(linearize(clause(event('look_for', 'speaker', 'job', 2)), 'es'), 'Busco dos trabajos.');
  const noNeed = negate(modal(clause(event('work', 'speaker', 'none')), 'must'));
  assert.equal(realizeEnglish(noNeed), 'I do not have to work.');
  assert.equal(linearize(noNeed, 'de'), 'Ich muss nicht arbeiten.');
  assert.equal(linearize(noNeed, 'fr'), 'Je n’ai pas besoin de travailler.');
  assert.equal(linearize(noNeed, 'es'), 'No tengo que trabajar.');
  assert.equal(linearize(inTense(noNeed, 'past'), 'fr'), 'Je n’ai pas eu besoin de travailler.');
});

test('keyboard apostrophes and negative existence questions keep their meaning', () => {
  assert.ok(matchesModel("J'ai besoin d'aide.", 'J’ai besoin d’aide.'));
  assert.ok(matchesModel("Je n'ai pas de billet.", 'Je n’ai pas de billet.'));
  assert.equal(realizeEnglish(presence('pharmacy', 'here', { negative: true, question: true })),
    'Is there no pharmacy here?');
});

test('self-directed group pronouns are not accidentally offered as simple person slots', () => {
  assert.throws(() => event('help', 'we', 'speaker'), /Self-directed/);
  assert.throws(() => event('call', 'speaker', 'we'), /Self-directed/);
});


test('the productive food action avoids redundant beginner phrases', () => {
  const example = clause(event('eat', 'we', 'food'));
  assert.equal(realizeEnglish(example), 'We eat.');
  assert.equal(linearize(example, 'de'), 'Wir essen.');
  assert.equal(linearize(example, 'fr'), 'Nous mangeons.');
  assert.equal(linearize(example, 'es'), 'Nosotros comemos.');
});
