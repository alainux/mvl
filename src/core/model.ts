/**
 * Language-independent types used by every MVL implementation.
 *
 * The abstract syntax describes what an utterance means. It intentionally
 * contains no articles, conjugations, word order, or other surface grammar.
 */

export type Participant = 'speaker' | 'addressee';
export type Place = 'home' | 'station';
export type Thing = 'help' | 'ticket' | 'time' | 'this';
export type Time = 'today' | 'tomorrow';
export type Modality = 'can' | 'want';

export type PredicateId =
  | 'need'
  | 'have'
  | 'understand'
  | 'help'
  | 'go'
  | 'buy';

export type SemanticArgument = Participant | Place | Thing;

export type ArgumentRole = 'theme' | 'recipient' | 'destination';

/** A predicate determines the type and semantic role of its final argument. */
export type Event =
  | Readonly<{ kind: 'event'; predicate: 'need'; agent: Participant; theme: 'help' | 'ticket' }>
  | Readonly<{ kind: 'event'; predicate: 'have'; agent: Participant; theme: 'time' | 'ticket' }>
  | Readonly<{ kind: 'event'; predicate: 'understand'; agent: Participant; theme: 'this' }>
  | Readonly<{ kind: 'event'; predicate: 'help'; agent: Participant; recipient: Participant }>
  | Readonly<{ kind: 'event'; predicate: 'go'; agent: Participant; destination: Place }>
  | Readonly<{ kind: 'event'; predicate: 'buy'; agent: Participant; theme: 'ticket' }>;

export type ModalClause = Readonly<{
  kind: 'modal';
  modality: Modality;
  value: Event;
}>;

export type BaseClause = Event | ModalClause;

export type NegativeClause = Readonly<{
  kind: 'not';
  value: BaseClause;
}>;

export type PolarityClause = BaseClause | NegativeClause;

export type TimedClause = Readonly<{
  kind: 'when';
  value: PolarityClause;
  time: Time;
}>;

export type Clause = PolarityClause | TimedClause;

export type Question = Readonly<{
  kind: 'ask';
  value: Clause;
}>;

export type PoliteQuestion = Readonly<{
  kind: 'please';
  value: Question;
}>;

/** Type unions constrain composition order and therefore operator scope. */
export type Expression = Clause | Question | PoliteQuestion;

export interface BuilderSelection {
  predicate: PredicateId;
  agent: Participant;
  argument: SemanticArgument;
  modal: Modality | '';
  negative: boolean;
  time: Time | '';
  question: boolean;
  polite: boolean;
}

/** Normalized semantics consumed by the small concrete grammars. */
export interface Analysis {
  readonly event: Event;
  readonly modality: Modality | null;
  readonly negative: boolean;
  readonly time: Time | null;
  readonly question: boolean;
  readonly polite: boolean;
}

export interface LanguageProfile {
  readonly code: 'de' | 'fr' | 'es';
  readonly name: string;
  readonly variety: string;
  readonly features: readonly string[];
}

export interface LanguageAdapter {
  readonly profile: LanguageProfile;
  realize(expression: Expression): string;
}
