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

/** German: formal Sie; the infinitive follows other constituents after a modal. */
const FINITE: Readonly<Record<PredicateId | Modality, readonly [string, string]>> = {
  need: ['brauche', 'brauchen'],
  have: ['habe', 'haben'],
  understand: ['verstehe', 'verstehen'],
  help: ['helfe', 'helfen'],
  go: ['gehe', 'gehen'],
  buy: ['kaufe', 'kaufen'],
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
};

const TIMES: Readonly<Record<Time, string>> = {
  today: 'heute',
  tomorrow: 'morgen',
};

function argument(analysis: Analysis): string {
  const { event, negative } = analysis;

  switch (event.predicate) {
    case 'need':
      return event.theme === 'help'
        ? (negative ? 'keine Hilfe' : 'Hilfe')
        : (negative ? 'kein Ticket' : 'ein Ticket');
    case 'have':
      return event.theme === 'time'
        ? (negative ? 'keine Zeit' : 'Zeit')
        : (negative ? 'kein Ticket' : 'ein Ticket');
    case 'buy':
      return negative ? 'kein Ticket' : 'ein Ticket';
    case 'understand':
      return 'das';
    case 'help':
      // The verb helfen takes a dative object, unlike French and Spanish.
      return event.recipient === 'speaker' ? 'mir' : 'Ihnen';
    case 'go':
      return event.destination === 'home' ? 'nach Hause' : 'zum Bahnhof';
  }
}

function realize(expression: Expression): string {
  const analysis = analyze(expression);
  const { event, modality, negative, question, polite } = analysis;
  const subject = event.agent === 'speaker' ? 'ich' : 'Sie';
  const finite = selectForm(FINITE[modality ?? event.predicate], event.agent);
  const temporal = timeWord(analysis.time, TIMES);
  const nominalNegation = ['need', 'have', 'buy'].includes(event.predicate);
  const negation = negative && !nominalNegation ? 'nicht' : '';

  let remainder: string;
  if (event.predicate === 'go') {
    // For movement, time normally precedes the negated destination phrase.
    remainder = words(temporal, negation, argument(analysis));
  } else {
    remainder = words(argument(analysis), temporal, negation);
  }

  if (modality) {
    const politeness = polite ? 'bitte' : '';
    remainder = words(remainder, politeness, INFINITIVE[event.predicate]);
  } else if (polite) {
    remainder = words(remainder, 'bitte');
  }

  // Verb-first questions versus declarative verb-second order.
  const sentence = question
    ? words(finite, subject, remainder)
    : words(subject, finite, remainder);

  return punctuate(sentence, analysis);
}

export const german: LanguageAdapter = {
  profile: {
    code: 'de',
    name: 'German',
    variety: 'Standard German · formal Sie',
    features: [
      'Finite verb is second in statements, first in yes/no questions',
      'Modal verbs send the infinitive to the clause end',
      'Noun negation uses kein; other negation uses nicht',
      'The verb helfen takes a dative recipient',
    ],
  },
  realize,
};
