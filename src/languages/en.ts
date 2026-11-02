import { analyze } from '../core/algebra.js';
import type { Analysis, Event, Expression, Participant } from '../core/model.js';
import { capitalize, words } from './shared.js';

/**
 * English is the gloss renderer for the *same* meaning tree as the learner's
 * target language. This avoids maintaining a parallel translation catalog.
 * It is intentionally restricted to the meanings available in the starter AST.
 */
const NOUNS = {
  help: 'help',
  ticket: 'a ticket',
  coffee: 'a coffee',
  water: 'water',
  time: 'time',
  this: 'this',
  english: 'English',
  german: 'German',
  french: 'French',
  spanish: 'Spanish',
  card: 'by card',
  cash: 'in cash',
  home: 'home',
  station: 'to the station',
  bathroom: 'to the bathroom',
  hotel: 'to the hotel',
} as const;

const INFINITIVES = {
  need: 'need', have: 'have', understand: 'understand',
  help: 'help', go: 'go', buy: 'buy', speak: 'speak',
  repeat: 'repeat', would_like: 'like', pay: 'pay',
} as const;

function complement(value: Event): string {
  if (value.predicate === 'help') return value.recipient === 'speaker' ? 'me' : 'you';
  if (value.predicate === 'go') return NOUNS[value.destination];
  return NOUNS[value.theme];
}

function subject(agent: Participant): string {
  return agent === 'speaker' ? 'I' : 'you';
}

function finiteVerb(analysis: Analysis): string {
  const { predicate, agent } = analysis.event;
  const root = INFINITIVES[predicate];
  if (predicate === 'would_like') return 'would like';
  if (agent === 'speaker') return root;
  // Starter grammar only has first-person singular and second-person forms.
  return root;
}

function realizeSentence(analysis: Analysis): string {
  const { event, modality, negative, question, polite, time } = analysis;
  const person = subject(event.agent);
  const object = complement(event);
  const infinitive = words(INFINITIVES[event.predicate], object);
  const when = time ?? '';
  let clause: string;

  if (modality) {
    if (modality === 'can') {
      clause = question
        ? words('Can', person, negative ? 'not' : '', infinitive)
        : words(person, negative ? 'cannot' : 'can', infinitive);
    } else {
      const stem = words('want', 'to', infinitive);
      clause = question
        ? words('Do', person, negative ? 'not' : '', stem)
        : words(person, negative ? 'do not' : '', stem);
      if (!negative && !question) clause = words(person, 'want to', infinitive);
    }
  } else if (event.predicate === 'would_like') {
    clause = question
      ? words('Would', person, negative ? 'not' : '', 'like', object)
      : words(person, negative ? 'would not like' : 'would like', object);
  } else {
    clause = question
      ? words('Do', person, negative ? 'not' : '', finiteVerb(analysis), object)
      : words(person, negative ? 'do not' : '', finiteVerb(analysis), object);
    if (!negative && !question) clause = words(person, finiteVerb(analysis), object);
  }

  if (time) clause = words(clause, when);
  if (polite) clause += ', please';
  return `${capitalize(clause)}${question ? '?' : '.'}`;
}

/** Independent English linearizer for learning cues and exercise prompts. */
export function realizeEnglish(expression: Expression): string {
  if (expression.kind === 'where') {
    return `Where is the ${expression.place === 'bathroom' ? 'bathroom' : expression.place}?`;
  }
  if (expression.kind === 'price') {
    return `How much does ${NOUNS[expression.thing]} cost?`;
  }
  return realizeSentence(analyze(expression));
}
