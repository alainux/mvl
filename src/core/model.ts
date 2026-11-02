import type { DESCRIPTION_QUALITIES, PREDICATES, PredicateId, SemanticArgument, OBJECT_QUESTION_PREDICATES, PRESENCE_THINGS } from './vocabulary.js';

/** Shared meanings: never encode French, German or Spanish word order here. */
export type Participant = 'speaker' | 'addressee' | 'we' | 'other';
export type Tense = 'present' | 'past' | 'future';
export type Modality = 'can' | 'want' | 'must';
export type Time =
  | 'today' | 'now' | 'this_week'
  | 'yesterday' | 'last_week' | 'last_month'
  | 'tomorrow' | 'next_week' | 'next_month' | 'soon' | 'tonight';
export type Frequency = 'every_day' | 'every_week' | 'often' | 'sometimes';
export type Connection = 'and' | 'but' | 'because';
export type Quantity = 1 | 2;
export type Place =
  | 'home' | 'station' | 'hotel' | 'office' | 'hospital'
  | 'restaurant' | 'supermarket' | 'pharmacy' | 'airport'
  | 'bank' | 'school' | 'park' | 'library' | 'post_office'
  | 'city_center' | 'cafe' | 'bus_stop';
export type LocatablePlace = Exclude<Place, 'home'>;
export type PricedThing = 'ticket' | 'coffee' | 'book' | 'room' | 'computer' | 'bag' | 'apartment';

/** The discriminated union is generated from the predicate frame definitions. */
export type Event = {
  [P in PredicateId]: Readonly<{
    kind: 'event';
    predicate: P;
    agent: Participant;
    argument: (typeof PREDICATES)[P]['allowedArguments'][number];
    quantity: Quantity;
  }>;
}[PredicateId];

/**
 * A clause is a semantic AST node, not a translated sentence template.
 * Every operation returns a new immutable clause.
 */
export interface Clause {
  readonly kind: 'clause';
  readonly event: Event;
  readonly tense: Tense;
  readonly modality: Modality | null;
  readonly negative: boolean;
  readonly time: Time | null;
  readonly frequency: Frequency | null;
  readonly question: boolean;
  readonly polite: boolean;
}

export type Discourse = Readonly<{
  kind: 'link';
  connection: Connection;
  first: Clause;
  second: Clause;
}>;

export type LocationQuestion = Readonly<{ kind: 'where'; place: LocatablePlace }>;
export type PriceQuestion = Readonly<{ kind: 'price'; thing: PricedThing }>;
export type TimeQuestion = Readonly<{ kind: 'ask_when'; value: Clause }>;
export type DescribableThing = keyof typeof DESCRIPTION_QUALITIES;
export type Quality = (typeof DESCRIPTION_QUALITIES)[DescribableThing][number];
export type PresenceThing = (typeof PRESENCE_THINGS)[number];
export type PresencePlace = 'here' | 'station' | 'hotel' | 'airport' | 'city_center';
export type ObjectQuestionPredicate = (typeof OBJECT_QUESTION_PREDICATES)[number];

/** Typed propositions extend the same shared meanings, not translation pairs. */
export interface Description {
  readonly kind: 'describe';
  readonly thing: DescribableThing;
  readonly quality: Quality;
  readonly tense: 'present' | 'past';
  readonly negative: boolean;
  readonly question: boolean;
}
export interface Presence {
  readonly kind: 'presence';
  readonly thing: PresenceThing;
  readonly place: PresencePlace | null;
  readonly negative: boolean;
  readonly question: boolean;
}
export interface ObjectQuestion {
  readonly kind: 'ask_object';
  readonly predicate: ObjectQuestionPredicate;
  readonly agent: 'speaker' | 'addressee';
}
export interface RouteQuestion {
  readonly kind: 'route';
  readonly place: LocatablePlace;
}
export interface Sequence {
  readonly kind: 'sequence';
  readonly steps: readonly Clause[];
}

export type Expression =
  | Clause | Discourse | LocationQuestion | PriceQuestion | TimeQuestion
  | Description | Presence | ObjectQuestion | RouteQuestion | Sequence;

/** Values are validated when converting external form input into an Event. */
export interface BuilderSelection {
  predicate: PredicateId;
  agent: Participant;
  argument: SemanticArgument;
  quantity: Quantity;
  tense: Tense;
  modal: Modality | '';
  negative: boolean;
  time: Time | '';
  frequency: Frequency | '';
  question: boolean;
  polite: boolean;
  reason: 'none' | 'sick' | 'busy' | 'no_time';
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
