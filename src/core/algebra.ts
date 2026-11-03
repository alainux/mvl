import type {
  BuilderSelection,
  Clause,
  Connection,
  Discourse,
  DescribableThing, Description, Frequency, ObjectQuestion, ObjectQuestionPredicate,
  Presence, PresencePlace, PresenceThing, Quality, RouteQuestion, Sequence,
  Event,
  Expression,
  LocatablePlace,
  LocationQuestion,
  Modality,
  Participant,
  PricedThing,
  PriceQuestion,
  Quantity,
  Tense,
  Time,
  TimeQuestion,
} from './model.js';
import { COUNTABLE_THINGS, DESCRIPTION_QUALITIES, LOCATABLE_PLACES, OBJECT_QUESTION_PREDICATES, PREDICATES, PRESENCE_THINGS, type PredicateId, type SemanticArgument } from './vocabulary.js';

function invalid(message: string): never {
  throw new TypeError(message);
}

/** A deliberately small temporal system; contradictions are rejected. */
const TIMES_BY_TENSE: Readonly<Record<Tense, readonly (Time | null)[]>> = {
  present: [null, 'today', 'now', 'this_week'],
  past: [null, 'yesterday', 'last_week', 'last_month'],
  future: [null, 'tomorrow', 'next_week', 'next_month', 'soon', 'tonight'],
};

export function event(
  predicate: PredicateId,
  agent: Participant,
  argument: SemanticArgument,
  quantity: Quantity = 1,
): Event {
  const frame = PREDICATES[predicate] as (typeof PREDICATES)[PredicateId] | undefined;
  if (!frame) invalid(`Unknown predicate: ${predicate}`);
  if (!(['speaker', 'addressee', 'we', 'other'] as string[]).includes(agent)) {
    invalid(`Unknown participant: ${agent}`);
  }
  if (!(frame.allowedArguments as readonly string[]).includes(argument)) {
    invalid(`${predicate} requires ${frame.argumentRole} in {${frame.allowedArguments.join(', ')}}`);
  }
  if (frame.argumentRole === 'person' && (
    agent === argument ||
    (agent === 'we' && argument === 'speaker') ||
    (agent === 'speaker' && argument === 'we')
  )) {
    invalid('Self-directed help and calls are not in this learning profile');
  }
  if (quantity !== 1 && quantity !== 2) invalid('Quantity must be one or two');
  if (quantity > 1 && (
    frame.argumentRole !== 'thing' || predicate === 'like' ||
    !(COUNTABLE_THINGS as readonly string[]).includes(argument)
  )) {
    invalid(`Cannot count ${argument} for ${predicate} in this profile`);
  }

  // The only assertion in the model: a validated dynamic input becomes the
  // frame-specific union. Internal authored code stays type-checked.
  return Object.freeze({ kind: 'event', predicate, agent, argument, quantity }) as Event;
}

export function clause(action: Event): Clause {
  return Object.freeze({
    kind: 'clause', event: action, tense: 'present', modality: null,
    negative: false, time: null, frequency: null, question: false, polite: false,
  });
}

export function inTense(value: Clause, tense: Tense): Clause {
  if (!Object.hasOwn(TIMES_BY_TENSE, tense)) invalid(`Unknown tense: ${tense}`);
  if (value.event.predicate === 'like' && tense !== 'present') invalid('Only present preferences are in this profile');
  if (value.frequency !== null && tense !== 'present') invalid('Habit frequency requires the present tense');
  if (value.time !== null && !TIMES_BY_TENSE[tense].includes(value.time)) {
    invalid(`${value.time} is incompatible with ${tense}`);
  }
  return Object.freeze({ ...value, tense });
}

export function modal(value: Clause, modality: Modality): Clause {
  const frame = PREDICATES[value.event.predicate];
  if (!(frame.allowedModalities as readonly string[]).includes(modality)) {
    invalid(`${modality} is not supported for ${value.event.predicate}`);
  }
  return Object.freeze({ ...value, modality });
}

export function negate(value: Clause): Clause {
  return Object.freeze({ ...value, negative: true });
}

export function when(value: Clause, time: Time): Clause {
  if (value.frequency !== null) invalid('Choose a concrete time or a repeating habit, not both');
  if (!TIMES_BY_TENSE[value.tense].includes(time)) {
    invalid(`Time ${time} is incompatible with ${value.tense} tense`);
  }
  return Object.freeze({ ...value, time });
}

/** Recurring habits need a present action, not a completed or future event. */
export function habit(value: Clause, frequency: Frequency): Clause {
  if (value.tense !== 'present' || value.time !== null) {
    invalid('Habit frequency requires a present statement without a date');
  }
  if (!['work', 'study', 'read', 'write', 'cook', 'sleep', 'take',
        'drink', 'eat', 'wait', 'use', 'meet', 'go', 'speak'].includes(value.event.predicate)) {
    invalid(`Recurring activity not supported for ${value.event.predicate}`);
  }
  return Object.freeze({ ...value, frequency });
}

/** Productive noun–quality description with a constrained semantic domain. */
export function describe(
  thing: DescribableThing,
  quality: Quality,
  options: Partial<Pick<Description, 'tense' | 'negative' | 'question'>> = {},
): Description {
  const allowed = DESCRIPTION_QUALITIES[thing] as readonly Quality[] | undefined;
  if (!allowed?.includes(quality)) invalid(`${thing} cannot be described as ${quality} in this profile`);
  return Object.freeze({
    kind: 'describe', thing, quality, tense: options.tense ?? 'present',
    negative: options.negative ?? false, question: options.question ?? false,
  });
}

/** There is / there are, optionally anchored at a familiar place. */
export function presence(
  thing: PresenceThing,
  place: PresencePlace | null = null,
  options: Partial<Pick<Presence, 'negative' | 'question'>> = {},
): Presence {
  if (!(PRESENCE_THINGS as readonly string[]).includes(thing)) invalid(`Unknown presence concept: ${thing}`);
  if (place !== null && !(['here', 'station', 'hotel', 'airport', 'city_center'] as string[]).includes(place)) {
    invalid(`Unknown presence location: ${place}`);
  }
  return Object.freeze({ kind: 'presence', thing, place, negative: options.negative ?? false, question: options.question ?? false });
}

/** Open questions have an unfilled semantic object slot. */
export function askObject(predicate: ObjectQuestionPredicate, agent: ObjectQuestion['agent']): ObjectQuestion {
  if (!(OBJECT_QUESTION_PREDICATES as readonly string[]).includes(predicate)) {
    invalid(`Predicate does not accept an open-object question: ${predicate}`);
  }
  return Object.freeze({ kind: 'ask_object', predicate, agent });
}

export function howToGet(place: LocatablePlace): RouteQuestion {
  if (!(LOCATABLE_PLACES as readonly string[]).includes(place)) invalid(`Unknown destination: ${place}`);
  return Object.freeze({ kind: 'route', place });
}

/** Short independent sentences can form a narrative without subordinate syntax. */
export function sequence(...steps: readonly Clause[]): Sequence {
  if (steps.length < 2 || steps.length > 4 || steps.some((step) => step.question || step.polite)) {
    invalid('A sequence requires two to four ordinary statements');
  }
  return Object.freeze({ kind: 'sequence', steps: Object.freeze([...steps]) });
}

export function ask(value: Clause): Clause {
  return Object.freeze({ ...value, question: true });
}

export function please(value: Clause): Clause {
  if (!value.question) invalid('PLEASE requires a question');
  return Object.freeze({ ...value, polite: true });
}

/** Ask when an event happens without introducing a new event predicate. */
export function askWhen(value: Clause): TimeQuestion {
  if (value.time !== null || value.question || value.polite) {
    invalid('WHEN questions require a statement without a time marker or question wrapper');
  }
  return Object.freeze({ kind: 'ask_when', value });
}

/** Short independent statements carry more meaning without subordinate syntax. */
export function link(first: Clause, connection: Connection, second: Clause): Discourse {
  if (first.question || second.question || first.polite || second.polite) {
    invalid('Only statements can be joined in the minimal discourse profile');
  }
  return Object.freeze({ kind: 'link', connection, first, second });
}

export function where(place: LocatablePlace): LocationQuestion {
  if (!(LOCATABLE_PLACES as readonly string[]).includes(place)) {
    invalid(`Unknown locatable place: ${place}`);
  }
  return Object.freeze({ kind: 'where', place });
}

export function price(thing: PricedThing): PriceQuestion {
  if (!( ['ticket', 'coffee', 'book', 'room', 'computer', 'bag', 'apartment'] as string[]).includes(thing)) {
    invalid(`Unknown priced item: ${thing}`);
  }
  return Object.freeze({ kind: 'price', thing });
}

export const DEFAULT_SELECTION: Readonly<BuilderSelection> = Object.freeze({
  predicate: 'help', agent: 'addressee', argument: 'speaker', quantity: 1,
  tense: 'present', modal: 'can', negative: false, time: '', frequency: '',
  question: true, polite: true, reason: 'none',
});

/** Build from semantic controls; no language-specific string operations. */
export function makeTree(selection: BuilderSelection): Expression {
  let result = clause(event(selection.predicate, selection.agent, selection.argument, selection.quantity));
  result = inTense(result, selection.tense);
  if (selection.modal) result = modal(result, selection.modal);
  if (selection.negative) result = negate(result);
  if (selection.time) result = when(result, selection.time);
  if (selection.frequency) result = habit(result, selection.frequency);
  if (selection.question) result = ask(result);
  if (selection.polite) result = please(result);

  if (selection.reason !== 'none') {
    if (result.question) invalid('A reason cannot be attached to a question');
    const reason = selection.reason === 'no_time'
      ? negate(clause(event('have', selection.agent, 'time')))
      : clause(event('be', selection.agent, selection.reason));
    return link(result, 'because', reason);
  }
  return result;
}

/** Parenthesized, language-independent notation for teaching and debugging. */
export function notation(expression: Expression): string {
  switch (expression.kind) {
    case 'where': return `WHERE(${expression.place})`;
    case 'route': return `HOW_TO_GET(${expression.place})`;
    case 'ask_object': return `ASK_OBJECT(${expression.predicate}, ${expression.agent})`;
    case 'presence': return `EXISTS(${expression.thing}, ${expression.place ?? 'unspecified'}, ${expression.negative}, ${expression.question})`;
    case 'describe': return `DESCRIBE(${expression.thing}, ${expression.quality}, ${expression.tense}, ${expression.negative}, ${expression.question})`;
    case 'sequence': return `SEQUENCE(${expression.steps.map(notation).join(', ')})`;
    case 'price': return `PRICE(${expression.thing})`;
    case 'ask_when': return `ASK_WHEN(${notation(expression.value)})`;
    case 'link':
      return `${expression.connection.toUpperCase()}(${notation(expression.first)}, ${notation(expression.second)})`;
    case 'clause': {
      const { event: action, modality, negative, tense, time, frequency, question, polite } = expression;
      let text = `EVENT(${action.predicate}, ${action.agent}, ${action.argument}${action.quantity === 2 ? ', two' : ''})`;
      if (modality) text = `${modality.toUpperCase()}(${text})`;
      if (tense !== 'present') text = `${tense.toUpperCase()}(${text})`;
      if (negative) text = `NOT(${text})`;
      if (time) text = `WHEN(${text}, ${time})`;
      if (frequency) text = `HABIT(${text}, ${frequency})`;
      if (question) text = `ASK(${text})`;
      if (polite) text = `PLEASE(${text})`;
      return text;
    }
  }
}

/** Downstream grammar adapters receive validated semantic clauses. */
export function analyze(value: Clause): Clause {
  return value;
}
