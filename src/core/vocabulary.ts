import type {
  ArgumentRole,
  Modality,
  PredicateId,
  SemanticArgument,
} from './model.js';

/**
 * Shared semantic concepts are not target-language translations. They are
 * English UI labels for slots that can appear in a typed predicate frame.
 */
export const PARTICIPANTS = {
  speaker: 'I',
  addressee: 'you (formal)',
} as const;

export const CONCEPTS: Readonly<Record<SemanticArgument, string>> = {
  speaker: 'me',
  addressee: 'you (formal)',
  help: 'help',
  ticket: 'a ticket',
  time: 'time',
  this: 'this',
  coffee: 'a coffee',
  water: 'water',
  german: 'German',
  french: 'French',
  spanish: 'Spanish',
  english: 'English',
  card: 'by card',
  cash: 'in cash',
  home: 'home',
  station: 'the station',
  bathroom: 'the bathroom',
  hotel: 'the hotel',
};

export interface PredicateDefinition {
  readonly description: string;
  readonly argumentRole: ArgumentRole;
  readonly allowedArguments: readonly SemanticArgument[];
  readonly allowedModalities: readonly Modality[];
}

/**
 * Predicate frames enforce learnable, reliably realizable combinations.
 * Lexical restrictions are explicit rather than silently accepting nonsense.
 */
export const PREDICATES: Readonly<Record<PredicateId, PredicateDefinition>> = {
  need: {
    description: 'Need something',
    argumentRole: 'theme',
    allowedArguments: ['help', 'ticket', 'coffee', 'water'],
    allowedModalities: [],
  },
  have: {
    description: 'Have something',
    argumentRole: 'theme',
    allowedArguments: ['time', 'ticket'],
    allowedModalities: [],
  },
  understand: {
    description: 'Understand this',
    argumentRole: 'theme',
    allowedArguments: ['this'],
    allowedModalities: ['can'],
  },
  help: {
    description: 'Help someone',
    argumentRole: 'recipient',
    allowedArguments: ['speaker', 'addressee'],
    allowedModalities: ['can', 'want'],
  },
  go: {
    description: 'Go somewhere',
    argumentRole: 'destination',
    allowedArguments: ['home', 'station', 'bathroom', 'hotel'],
    allowedModalities: ['can', 'want'],
  },
  buy: {
    description: 'Buy something',
    argumentRole: 'theme',
    allowedArguments: ['ticket', 'coffee', 'water'],
    allowedModalities: ['can', 'want'],
  },
  speak: {
    description: 'Speak a language',
    argumentRole: 'theme',
    allowedArguments: ['german', 'french', 'spanish', 'english'],
    allowedModalities: [],
  },
  repeat: {
    description: 'Repeat this',
    argumentRole: 'theme',
    allowedArguments: ['this'],
    allowedModalities: ['can'],
  },
  would_like: {
    description: 'Would like something',
    argumentRole: 'theme',
    allowedArguments: ['ticket', 'coffee', 'water'],
    allowedModalities: [],
  },
  pay: {
    description: 'Pay by a method',
    argumentRole: 'theme',
    allowedArguments: ['card', 'cash'],
    allowedModalities: ['can', 'want'],
  },
};

export type OperatorId =
  | 'EVENT'
  | 'CAN'
  | 'WANT'
  | 'NOT'
  | 'WHEN'
  | 'ASK'
  | 'PLEASE'
  | 'WHERE'
  | 'PRICE';

export interface OperatorDefinition {
  readonly id: OperatorId;
  readonly signature: string;
  readonly description: string;
}

export const OPERATORS: readonly OperatorDefinition[] = [
  { id: 'EVENT', signature: 'Predicate × Person × Argument → Event', description: 'Describe a situation.' },
  { id: 'CAN', signature: 'Event → Clause', description: 'Say what someone can do.' },
  { id: 'WANT', signature: 'Event → Clause', description: 'Say what someone wants to do.' },
  { id: 'NOT', signature: 'Clause → Clause', description: 'Negate a statement.' },
  { id: 'WHEN', signature: 'Clause × Time → Clause', description: 'Add a time expression.' },
  { id: 'ASK', signature: 'Clause → Question', description: 'Ask for a yes/no answer.' },
  { id: 'PLEASE', signature: 'Question → Question', description: 'Add a courteous marker.' },
  { id: 'WHERE', signature: 'Place → Question', description: 'Ask for a location.' },
  { id: 'PRICE', signature: 'PricedThing → Question', description: 'Ask how much something costs.' },
];
