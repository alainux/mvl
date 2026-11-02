/**
 * Abstract syntax for a compact, compositional set of communicative meanings.
 * None of these types encodes German, French, or Spanish surface word order.
 */
export type Participant = 'speaker' | 'addressee';

export type Place = 'home' | 'station' | 'bathroom' | 'hotel';
export type LocatablePlace = Exclude<Place, 'home'>;

export type Thing =
  | 'help'
  | 'ticket'
  | 'time'
  | 'this'
  | 'coffee'
  | 'water'
  | 'german'
  | 'french'
  | 'spanish'
  | 'english'
  | 'card'
  | 'cash';

export type LanguageConcept = 'german' | 'french' | 'spanish' | 'english';
export type PricedThing = 'ticket' | 'coffee';
export type Time = 'today' | 'tomorrow';
export type Modality = 'can' | 'want';

export type PredicateId =
  | 'need'
  | 'have'
  | 'understand'
  | 'help'
  | 'go'
  | 'buy'
  | 'speak'
  | 'repeat'
  | 'would_like'
  | 'pay';

export type SemanticArgument = Participant | Place | Thing;
export type ArgumentRole = 'theme' | 'recipient' | 'destination';

/**
 * Each predicate has its own permissible semantic role and argument type.
 * A single optional `argument: string` field would allow nonsense like
 * BUY(home) or GO(coffee) and push validation into every language adapter.
 */
export type Event =
  | Readonly<{
      kind: 'event';
      predicate: 'need';
      agent: Participant;
      theme: 'help' | 'ticket' | 'coffee' | 'water';
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'have';
      agent: Participant;
      theme: 'time' | 'ticket';
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'understand';
      agent: Participant;
      theme: 'this';
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'help';
      agent: Participant;
      recipient: Participant;
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'go';
      agent: Participant;
      destination: Place;
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'buy';
      agent: Participant;
      theme: 'ticket' | 'coffee' | 'water';
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'speak';
      agent: Participant;
      theme: LanguageConcept;
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'repeat';
      agent: Participant;
      theme: 'this';
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'would_like';
      agent: Participant;
      theme: 'ticket' | 'coffee' | 'water';
    }>
  | Readonly<{
      kind: 'event';
      predicate: 'pay';
      agent: Participant;
      theme: 'card' | 'cash';
    }>;

/** Explicit operator nesting makes permitted scope unambiguous. */
export type ModalClause = Readonly<{
  kind: 'modal';
  modality: Modality;
  value: Event;
}>;

export type BaseClause = Event | ModalClause;
export type NegativeClause = Readonly<{ kind: 'not'; value: BaseClause }>;
export type PolarityClause = BaseClause | NegativeClause;
export type TimedClause = Readonly<{
  kind: 'when';
  value: PolarityClause;
  time: Time;
}>;

export type Clause = PolarityClause | TimedClause;
export type Question = Readonly<{ kind: 'ask'; value: Clause }>;
export type PoliteQuestion = Readonly<{ kind: 'please'; value: Question }>;
export type SentenceExpression = Clause | Question | PoliteQuestion;

/** Independent question forms avoid over-generalizing the starter grammar. */
export type LocationQuestion = Readonly<{ kind: 'where'; place: LocatablePlace }>;
export type PriceQuestion = Readonly<{ kind: 'price'; thing: PricedThing }>;
export type Expression = SentenceExpression | LocationQuestion | PriceQuestion;

/** A form selection can come from an HTML UI; constructors validate it at runtime. */
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

/** Only grammar adapters use the flattened analysis of an AST. */
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
