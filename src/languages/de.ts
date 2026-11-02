import { analyze } from '../core/algebra.js';
import type {
  Analysis,
  Expression,
  LanguageAdapter,
  Modality,
  PredicateId,
  Time,
} from '../core/model.js';
import { punctuate, selectForm, timeWord, words } from './shared.js';

/** German noun inflection is implemented as a rule over lexical features. */
type Gender = 'masculine' | 'feminine' | 'neuter';
type NounId = 'ticket' | 'coffee' | 'water' | 'help' | 'time';
type Case = 'nominative' | 'accusative';

interface Noun {
  readonly lemma: string;
  readonly gender: Gender;
  readonly countable: boolean;
}

const NOUNS: Readonly<Record<NounId, Noun>> = {
  ticket: { lemma: 'Ticket', gender: 'neuter', countable: true },
  coffee: { lemma: 'Kaffee', gender: 'masculine', countable: true },
  water: { lemma: 'Wasser', gender: 'neuter', countable: false },
  help: { lemma: 'Hilfe', gender: 'feminine', countable: false },
  time: { lemma: 'Zeit', gender: 'feminine', countable: false },
};

const INDEFINITE: Readonly<Record<Case, Record<Gender, string>>> = {
  nominative: { masculine: 'ein', feminine: 'eine', neuter: 'ein' },
  accusative: { masculine: 'einen', feminine: 'eine', neuter: 'ein' },
};

const NEGATIVE_ARTICLE: Readonly<Record<Case, Record<Gender, string>>> = {
  nominative: { masculine: 'kein', feminine: 'keine', neuter: 'kein' },
  accusative: { masculine: 'keinen', feminine: 'keine', neuter: 'kein' },
};

function nounPhrase(id: NounId, grammaticalCase: Case, negative: boolean): string {
  const noun = NOUNS[id];
  if (negative) return words(NEGATIVE_ARTICLE[grammaticalCase][noun.gender], noun.lemma);
  return noun.countable
    ? words(INDEFINITE[grammaticalCase][noun.gender], noun.lemma)
    : noun.lemma;
}

const FINITE: Readonly<Record<PredicateId | Modality, readonly [string, string]>> = {
  need: ['brauche', 'brauchen'],
  have: ['habe', 'haben'],
  understand: ['verstehe', 'verstehen'],
  help: ['helfe', 'helfen'],
  go: ['gehe', 'gehen'],
  buy: ['kaufe', 'kaufen'],
  speak: ['spreche', 'sprechen'],
  repeat: ['wiederhole', 'wiederholen'],
  would_like: ['möchte', 'möchten'],
  pay: ['bezahle', 'bezahlen'],
  can: ['kann', 'können'],
  want: ['will', 'wollen'],
};

const INFINITIVE: Readonly<Record<PredicateId, string>> = {
  need: 'brauchen',
  have: 'haben',
  understand: 'verstehen',
  help: 'helfen',
  go: 'gehen',
  buy: 'kaufen',
  speak: 'sprechen',
  repeat: 'wiederholen',
  would_like: 'möchten',
  pay: 'bezahlen',
};

const TIMES: Readonly<Record<Time, string>> = {
  today: 'heute',
  tomorrow: 'morgen',
};

const LANGUAGE_NAMES = {
  german: 'Deutsch',
  french: 'Französisch',
  spanish: 'Spanisch',
  english: 'Englisch',
} as const;

type PlaceId = 'station' | 'bathroom' | 'hotel';
const PLACES: Readonly<Record<PlaceId, { noun: string; gender: Gender }>> = {
  station: { noun: 'Bahnhof', gender: 'masculine' },
  bathroom: { noun: 'Toilette', gender: 'feminine' },
  hotel: { noun: 'Hotel', gender: 'neuter' },
};

function definiteNominative(place: PlaceId): string {
  const { noun, gender } = PLACES[place];
  const article = { masculine: 'der', feminine: 'die', neuter: 'das' }[gender];
  return words(article, noun);
}

function destination(place: PlaceId | 'home'): string {
  if (place === 'home') return 'nach Hause';
  const { noun, gender } = PLACES[place];
  // zu + dem contracts to zum; zu + der contracts to zur.
  return words(gender === 'feminine' ? 'zur' : 'zum', noun);
}

/** Translate an event's argument using its semantic role and clause polarity. */
function complement(analysis: Analysis): string {
  const { event, negative } = analysis;

  switch (event.predicate) {
    case 'need':
    case 'buy':
    case 'would_like':
      return nounPhrase(event.theme, 'accusative', negative);
    case 'have':
      return nounPhrase(event.theme, 'accusative', negative);
    case 'understand':
    case 'repeat':
      return 'das';
    case 'help':
      // helfen selects the dative case, independently of ordinary objects.
      return event.recipient === 'speaker' ? 'mir' : 'Ihnen';
    case 'go':
      return destination(event.destination);
    case 'speak':
      return words(negative ? 'kein' : '', LANGUAGE_NAMES[event.theme]);
    case 'pay':
      return event.theme === 'card' ? 'mit Karte' : 'bar';
  }
}

function realize(expression: Expression): string {
  if (expression.kind === 'where') {
    return `Wo ist ${definiteNominative(expression.place)}?`;
  }
  if (expression.kind === 'price') {
    return `Wie viel kostet ${nounPhrase(expression.thing, 'nominative', false)}?`;
  }

  const analysis = analyze(expression);
  const { event, modality, negative, question, polite } = analysis;
  const subject = event.agent === 'speaker' ? 'ich' : 'Sie';
  const finite = selectForm(FINITE[modality ?? event.predicate], event.agent);
  const temporal = timeWord(analysis.time, TIMES);
  const nominalNegation = ['need', 'have', 'buy', 'would_like', 'speak'].includes(event.predicate);
  const nicht = negative && !nominalNegation ? 'nicht' : '';

  // Temporal adverbs commonly precede new nominal information. Short object
  // pronouns and demonstratives normally stay closer to the finite verb.
  const pronounLike = ['help', 'understand', 'repeat'].includes(event.predicate);
  let rest = pronounLike
    ? words(complement(analysis), temporal, nicht)
    : words(temporal, nicht, complement(analysis));

  if (modality) {
    rest = words(rest, polite ? 'bitte' : '', INFINITIVE[event.predicate]);
  } else if (polite) {
    rest = words(rest, 'bitte');
  }

  // Only the finite verb moves: verb-second statement, verb-first question.
  const sentence = question
    ? words(finite, subject, rest)
    : words(subject, finite, rest);
  return punctuate(sentence, analysis);
}

export const german: LanguageAdapter = {
  profile: {
    code: 'de',
    name: 'German',
    variety: 'Standard German · formal Sie',
    features: [
      'In statements, the finite verb normally occupies the second position.',
      'Yes/no questions normally start with the finite verb.',
      'A modal moves the main verb to the end in its infinitive form.',
      'Noun negation uses forms of kein; verb negation commonly uses nicht.',
      'Learn a noun together with its gender and the cases a verb requires.',
    ],
  },
  realize,
};
