import test from 'node:test';
import assert from 'node:assert/strict';

import { askObject, askWhen, clause, DEFAULT_SELECTION, describe, event, habit, howToGet, inTense, makeTree, presence, sequence, when } from '../docs/assets/core/algebra.js';
import { PREDICATES } from '../docs/assets/core/vocabulary.js';
import { languages, linearize } from '../docs/assets/languages/index.js';
import { realizeEnglish } from '../docs/assets/languages/en.js';

function selection(changes) {
  return {
    ...DEFAULT_SELECTION,
    predicate:'buy',agent:'speaker',argument:'ticket',modal:'',
    tense:'present',time:'',negative:false,question:false,polite:false,reason:'none',quantity:1,
    ...changes,
  };
}

/**
 * Regression snapshots are TEST fixtures only, not runtime phrase lookup data.
 * Realizers are independently implemented in src/languages/.
 */
const goldens = [
  { ast:{predicate:'buy',tense:'past',time:'yesterday'},
    de:'Ich habe gestern ein Ticket gekauft.', fr:'J’ai acheté un billet hier.', es:'Compré un billete ayer.' },
  { ast:{predicate:'go',argument:'station',tense:'past',time:'yesterday'},
    de:'Ich bin gestern zum Bahnhof gegangen.', fr:'Je suis allé à la gare hier.', es:'Fui a la estación ayer.' },
  { ast:{predicate:'buy',tense:'future',time:'tomorrow'},
    de:'Ich kaufe morgen ein Ticket.', fr:'Je vais acheter un billet demain.', es:'Voy a comprar un billete mañana.' },
  { ast:{predicate:'work',argument:'none',tense:'past',time:'yesterday'},
    de:'Ich habe gestern gearbeitet.', fr:'J’ai travaillé hier.', es:'Trabajé ayer.' },
  { ast:{predicate:'be',argument:'sick',tense:'past',time:'yesterday'},
    de:'Ich war gestern krank.', fr:'J’étais malade hier.', es:'Estaba enfermo ayer.' },
  { ast:{predicate:'go',argument:'home',tense:'past',modal:'must',time:'yesterday'},
    de:'Ich musste gestern nach Hause gehen.', fr:'J’ai dû aller chez moi hier.', es:'Tuve que ir a casa ayer.' },
  { ast:{predicate:'come',argument:'none',modal:'can',negative:true,reason:'sick'},
    de:'Ich kann nicht kommen, denn ich bin krank.', fr:'Je ne peux pas venir, parce que je suis malade.', es:'No puedo venir, porque estoy enfermo.' },
  { ast:{predicate:'help',argument:'speaker',agent:'addressee',modal:'can',question:true,polite:true},
    de:'Können Sie mir bitte helfen?', fr:'Est-ce que vous pouvez m’aider, s’il vous plaît ?', es:'¿Usted puede ayudarme, por favor?' },
  { ast:{predicate:'need',argument:'appointment',quantity:2},
    de:'Ich brauche zwei Termine.', fr:'J’ai besoin de deux rendez-vous.', es:'Necesito dos citas.' },
  { ast:{predicate:'have',argument:'time',negative:true},
    de:'Ich habe keine Zeit.', fr:'Je n’ai pas le temps.', es:'No tengo tiempo.' },
  { ast:{predicate:'be',argument:'late'},
    de:'Ich bin spät dran.', fr:'Je suis en retard.', es:'Llego tarde.' },
  { ast:{predicate:'call',argument:'addressee',tense:'future',time:'tomorrow'},
    de:'Ich rufe Sie morgen an.', fr:'Je vais vous appeler demain.', es:'Voy a llamarle mañana.' },
  { ast:{predicate:'study',argument:'german',tense:'past',time:'yesterday'},
    de:'Ich habe gestern Deutsch gelernt.', fr:'J’ai appris l’allemand hier.', es:'Estudié alemán ayer.' },
  { ast:{predicate:'stay',argument:'hotel',tense:'future',time:'tomorrow'},
    de:'Ich bleibe morgen im Hotel.', fr:'Je vais rester à l’hôtel demain.', es:'Voy a quedarme en el hotel mañana.' },
  { ast:{predicate:'have',argument:'ticket',tense:'past',negative:true,time:'yesterday'},
    de:'Ich hatte gestern kein Ticket.', fr:'Je n’avais pas de billet hier.', es:'No tenía billete ayer.' },
  { ast:{predicate:'go',argument:'home',tense:'past',negative:true,time:'yesterday'},
    de:'Ich bin gestern nicht nach Hause gegangen.', fr:'Je ne suis pas allé chez moi hier.', es:'No fui a casa ayer.' },
];

test('the three language implementations are independent and typed', () => {
  assert.deepEqual(languages.map((entry) => entry.profile.code), ['de','fr','es']);
  assert.ok(languages.every((entry) => entry.profile.features.length >= 5));
  assert.throws(() => linearize(makeTree(selection({})), 'xx'), /Unknown language/);
});

test('golden linguistic samples cover past, future, modalities and reasons', () => {
  for (const fixture of goldens) {
    const meaning = makeTree(selection(fixture.ast));
    for (const code of ['de','fr','es']) {
      assert.equal(linearize(meaning,code), fixture[code], `${code}: ${JSON.stringify(fixture.ast)}`);
    }
    assert.ok(realizeEnglish(meaning).length > 7);
  }
});

test('when questions are productive in all three languages', () => {
  const meaning = askWhen(clause(event('come','addressee','none')));
  assert.deepEqual(['de','fr','es'].map((code) => linearize(meaning,code)), [
    'Wann kommen Sie?', 'Quand est-ce que vous venez ?', '¿Cuándo viene usted?',
  ]);
  assert.equal(realizeEnglish(meaning), 'When do you come?');
});



test('extended composition passes native-form regression fixtures', () => {
  const cases = [
    {
      meaning: habit(clause(event('read', 'speaker', 'book')), 'often'),
      de: 'Ich lese oft ein Buch.',
      fr: 'Je lis souvent un livre.',
      es: 'Leo un libro a menudo.',
    },
    {
      meaning: describe('room', 'small'),
      de: 'Das Zimmer ist klein.',
      fr: 'La chambre est petite.',
      es: 'La habitación es pequeña.',
    },
    {
      meaning: presence('pharmacy', 'here', { question: true }),
      de: 'Gibt es hier eine Apotheke?',
      fr: 'Est-ce qu’il y a une pharmacie ici ?',
      es: '¿Hay una farmacia aquí?',
    },
    {
      meaning: askObject('need', 'addressee'),
      de: 'Was brauchen Sie?',
      fr: 'De quoi est-ce que vous avez besoin ?',
      es: '¿Qué necesita usted?',
    },
    {
      meaning: howToGet('station'),
      de: 'Wie komme ich zum Bahnhof?',
      fr: 'Comment est-ce que je vais à la gare ?',
      es: '¿Cómo llego a la estación?',
    },
    {
      meaning: when(inTense(clause(event('meet', 'speaker', 'doctor')), 'future'), 'tomorrow'),
      de: 'Ich sehe morgen einen Arzt.',
      fr: 'Je vais voir un médecin demain.',
      es: 'Voy a ver a un médico mañana.',
    },
    {
      meaning: clause(event('would_like', 'speaker', 'bill')),
      de: 'Ich möchte die Rechnung.',
      fr: 'Je voudrais l’addition.',
      es: 'Quisiera la cuenta.',
    },
    {
      meaning: clause(event('need', 'speaker', 'information')),
      de: 'Ich brauche Informationen.',
      fr: 'J’ai besoin d’informations.',
      es: 'Necesito información.',
    },
    {
      meaning: sequence(
        when(inTense(clause(event('work', 'speaker', 'none')), 'past'), 'yesterday'),
        clause(event('be', 'speaker', 'tired')),
      ),
      de: 'Ich habe gestern gearbeitet. Ich bin müde.',
      fr: 'J’ai travaillé hier. Je suis fatigué.',
      es: 'Trabajé ayer. Estoy cansado.',
    },
  ];

  for (const fixture of cases) {
    for (const code of ['de','fr','es']) {
      assert.equal(linearize(fixture.meaning, code), fixture[code]);
    }
    assert.ok(realizeEnglish(fixture.meaning).length > 12);
  }
});

test('broad combinatorial audit produces complete, punctuated sentences', () => {
  let produced = 0;
  for (const [predicate,frame] of Object.entries(PREDICATES)) {
    for (const argument of frame.allowedArguments) {
      for (const agent of ['speaker','addressee','we','other']) {
        if (['help','call'].includes(predicate) && argument === agent) continue;
        for (const tense of ['present','past','future']) {
          for (const negative of [false,true]) {
            for (const modality of ['', ...frame.allowedModalities]) {
              if (predicate === 'like' && tense !== 'present') continue;
              const tree = makeTree(selection({predicate,argument,agent,tense,negative,modal:modality}));
              assert.ok(realizeEnglish(tree).endsWith('.'));
              for (const code of ['de','fr','es']) {
                const result = linearize(tree,code);
                assert.ok(/^[A-ZÀ-ÖØ-Þ¿ÉÜ]/u.test(result), `${code}: ${result}`);
                assert.ok(/[.!?]$/u.test(result), `${code}: ${result}`);
                assert.doesNotMatch(result,/undefined|null|\[object Object\]|\s{2,}/u);
                produced++;
              }
            }
          }
        }
      }
    }
  }
  assert.ok(produced >= 5000, `Only ${produced} valid compositions`);
});
