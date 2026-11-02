import type {
  BuilderSelection,
  Expression,
  LanguageProfile,
  LocatablePlace,
  Participant,
  PredicateId,
  PricedThing,
  SemanticArgument,
} from '../core/model.js';

/**
 * A conventional utterance without a productive derivation in the starter
 * grammar. These are deliberately few and kept separate from generated text.
 */
export type RoutineId =
  | 'hello'
  | 'good_morning'
  | 'goodbye'
  | 'thank_you'
  | 'you_are_welcome'
  | 'excuse_me'
  | 'yes'
  | 'no'
  | 'slowly'
  | 'learning';

/**
 * A lesson plan is a recipe for a family of meanings, NOT a sentence list.
 * Multiple arguments generate multiple ASTs by substituting a semantic slot.
 */
export type LessonBlock =
  | Readonly<{
      kind: 'paradigm';
      predicate: PredicateId;
      agent: Participant;
      arguments: readonly SemanticArgument[];
      options?: Partial<Omit<BuilderSelection, 'predicate' | 'agent' | 'argument'>>;
    }>
  | Readonly<{ kind: 'where'; places: readonly LocatablePlace[] }>
  | Readonly<{ kind: 'price'; things: readonly PricedThing[] }>
  | Readonly<{ kind: 'conventions'; ids: readonly RoutineId[] }>;

/** AST or a deliberately documented lexical exception. */
export type ExampleSource =
  | Readonly<{ kind: 'expression'; expression: Expression; selection?: BuilderSelection }>
  | Readonly<{ kind: 'convention'; routine: RoutineId }>;

export type LessonId =
  | 'first-words'
  | 'needs'
  | 'preferences'
  | 'questions'
  | 'help'
  | 'repair'
  | 'places'
  | 'shopping'
  | 'time'
  | 'negation'
  | 'combine';

export interface LessonDefinition {
  readonly id: LessonId;
  readonly title: string;
  readonly goal: string;
  readonly introduction: string;
  readonly blocks: readonly LessonBlock[];
}

/** Language-specific grammatical instruction is authored, not translated. */
export interface LessonNotes {
  readonly recipe: string;
  readonly explanation: string;
  readonly detail: string;
  readonly caution: string;
}

export interface GeneratedExample {
  readonly id: string;
  readonly english: string;
  readonly target: string;
  readonly source: ExampleSource;
  readonly provenance: 'composed' | 'conventional';
}

export interface GeneratedLesson extends Omit<LessonDefinition, 'blocks'> {
  readonly notes: LessonNotes;
  readonly examples: readonly GeneratedExample[];
}

export interface GeneratedGuide {
  readonly language: LanguageProfile;
  readonly lessons: readonly GeneratedLesson[];
}
