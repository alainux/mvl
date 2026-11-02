import {
  askObject,
  DEFAULT_SELECTION,
  describe,
  howToGet,
  makeTree,
  notation,
  presence,
} from '../core/algebra.js';
import type {
  BuilderSelection,
  DescribableThing,
  Expression,
  Frequency,
  LanguageProfile,
  LocatablePlace,
  Modality,
  ObjectQuestionPredicate,
  Participant,
  PresencePlace,
  PresenceThing,
  Quality,
  Quantity,
  Tense,
  Time,
} from '../core/model.js';
import {
  CONCEPTS,
  COUNTABLE_THINGS,
  DESCRIPTION_QUALITIES,
  LOCATABLE_PLACES,
  OBJECT_QUESTION_PREDICATES,
  PREDICATES,
  PRESENCE_THINGS,
  type PredicateId,
  type SemanticArgument,
} from '../core/vocabulary.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
import { option, required } from './dom.js';

/** The learner selects a meaning family, not a prewritten translation. */
type BuilderMode = 'action' | 'describe' | 'presence' | 'ask-object' | 'route';
type Option = readonly [value: string, label: string];

const SUBJECTS: readonly Option[] = [
  ['speaker', 'I'], ['addressee', 'You (formal)'], ['we', 'We'], ['other', 'He'],
];
const TIMES: readonly Option[] = [
  ['', 'Unspecified'], ['today', 'Today'], ['now', 'Now'], ['this_week', 'This week'],
  ['yesterday', 'Yesterday'], ['last_week', 'Last week'], ['last_month', 'Last month'],
  ['tomorrow', 'Tomorrow'], ['next_week', 'Next week'],
  ['next_month', 'Next month'], ['soon', 'Soon'], ['tonight', 'Tonight'],
];
const TIMES_BY_TENSE: Readonly<Record<Tense, readonly string[]>> = {
  present: ['', 'today', 'now', 'this_week'],
  past: ['', 'yesterday', 'last_week', 'last_month'],
  future: ['', 'tomorrow', 'next_week', 'next_month', 'soon', 'tonight'],
};
const FREQUENCIES: readonly Option[] = [
  ['', 'No frequency'], ['every_day', 'Every day'],
  ['every_week', 'Every week'], ['often', 'Often'], ['sometimes', 'Sometimes'],
];
const MODALS: Readonly<Record<Modality, string>> = {
  can: 'Can / be allowed to', want: 'Want to', must: 'Must / have to',
};
const HABITUAL_ACTIONS = new Set([
  'work', 'study', 'read', 'write', 'cook', 'sleep', 'take',
  'drink', 'eat', 'wait', 'use', 'meet', 'go', 'speak',
]);

function select(id: string): HTMLSelectElement {
  return required<HTMLSelectElement>(`#${id}`);
}

function fill(element: HTMLSelectElement, values: readonly Option[], current: string): void {
  element.replaceChildren(...values.map(([value, label]) => option(value, label, value === current)));
}

function labelFor(value: string): string {
  return CONCEPTS[value as SemanticArgument] ?? value.replaceAll('_', ' ');
}

/** Binds five independently typed constructors to a single live learning surface. */
export function initializeBuilder(code: LanguageProfile['code']): void {
  const selection: BuilderSelection = { ...DEFAULT_SELECTION };
  let mode: BuilderMode = 'action';
  let describedThing: DescribableThing = 'room';
  let quality: Quality = 'big';
  let descriptionTense: 'present' | 'past' = 'present';
  let presenceThing: PresenceThing = 'pharmacy';
  let presencePlace: PresencePlace | null = 'here';
  let objectPredicate: ObjectQuestionPredicate = 'need';
  let objectAgent: 'speaker' | 'addressee' = 'addressee';
  let routePlace: LocatablePlace = 'station';

  const negative = required<HTMLInputElement>('#builder-negative');
  const question = required<HTMLInputElement>('#builder-question');
  const polite = required<HTMLInputElement>('#builder-polite');
  const output = required<HTMLElement>('#builder-output');
  const translation = required<HTMLElement>('#builder-english');
  const construction = required<HTMLElement>('#builder-tree');
  const validation = required<HTMLElement>('#builder-validation');
  const copy = required<HTMLButtonElement>('#builder-copy');

  fill(select('builder-mode'), [
    ['action', 'Perform an action, including past / future'],
    ['describe', 'Describe a person or thing'],
    ['presence', 'Is there something nearby?'],
    ['ask-object', 'Ask what someone needs, has or wants'],
    ['route', 'Ask how to reach a place'],
  ], mode);

  fill(select('builder-description-thing'),
    Object.keys(DESCRIPTION_QUALITIES).map((id) => [id, labelFor(id)]), describedThing);
  fill(select('builder-description-tense'),
    [['present', 'Present'], ['past', 'Past']], descriptionTense);
  fill(select('builder-presence-thing'),
    PRESENCE_THINGS.map((id) => [id, labelFor(id)]), presenceThing);
  fill(select('builder-presence-place'), [
    ['', 'Somewhere (unspecified)'], ['here', 'Here'],
    ['station', 'At the station'], ['hotel', 'At the hotel'],
    ['airport', 'At the airport'], ['city_center', 'In the city centre'],
  ], presencePlace ?? '');
  fill(select('builder-object-predicate'),
    OBJECT_QUESTION_PREDICATES.map((id) => [id, PREDICATES[id].description]), objectPredicate);
  fill(select('builder-object-agent'),
    [['addressee', 'You (formal)'], ['speaker', 'I']], objectAgent);
  fill(select('builder-route-place'),
    LOCATABLE_PLACES.map((id) => [id, labelFor(id)]), routePlace);

  function updateEventControls(): void {
    const frame = PREDICATES[selection.predicate];
    const argumentsForPredicate = (frame.allowedArguments as readonly SemanticArgument[])
      .filter((candidate) => !(['help', 'call'].includes(selection.predicate)
        && candidate === selection.agent));

    if (!argumentsForPredicate.includes(selection.argument)) {
      selection.argument = argumentsForPredicate[0] ?? selection.argument;
    }
    const modalities = frame.allowedModalities as readonly Modality[];
    if (selection.modal && !modalities.includes(selection.modal)) selection.modal = '';
    if (selection.predicate === 'like' && selection.tense !== 'present') selection.tense = 'present';
    if (!TIMES_BY_TENSE[selection.tense].includes(selection.time)) selection.time = '';
    if (!selection.question) selection.polite = false;
    if (selection.question) selection.reason = 'none';

    const canCount = (COUNTABLE_THINGS as readonly string[]).includes(selection.argument);
    if (!canCount) selection.quantity = 1;
    if (!HABITUAL_ACTIONS.has(selection.predicate) || selection.tense !== 'present') {
      selection.frequency = '';
    }
    if (selection.frequency) selection.time = '';
    if (selection.time) selection.frequency = '';

    fill(select('builder-predicate'),
      Object.entries(PREDICATES).map(([id, frame]) => [id, frame.description]), selection.predicate);
    fill(select('builder-agent'), SUBJECTS, selection.agent);
    fill(select('builder-argument'),
      argumentsForPredicate.map((id) => [id, labelFor(id)]), selection.argument);
    fill(select('builder-modal'), [
      ['', 'No modal'], ...modalities.map((id): Option => [id, MODALS[id]]),
    ], selection.modal);
    fill(select('builder-tense'),
      (selection.predicate === 'like'
        ? [['present', 'Present']]
        : [['present', 'Present'], ['past', 'Completed past'], ['future', 'Future plan']]) as Option[],
      selection.tense);
    fill(select('builder-time'),
      TIMES.filter(([id]) => TIMES_BY_TENSE[selection.tense].includes(id)
        && (!selection.frequency || !id)), selection.time);
    fill(select('builder-frequency'),
      HABITUAL_ACTIONS.has(selection.predicate) && selection.tense === 'present' && !selection.time
        ? FREQUENCIES
        : [['', 'Not available for this event']], selection.frequency);
    fill(select('builder-quantity'),
      canCount ? [['1', 'One'], ['2', 'Two']] : [['1', 'One / uncountable']],
      String(selection.quantity));
    fill(select('builder-reason'), [
      ['none', 'No reason'], ['sick', 'Because I am sick'],
      ['busy', 'Because I am busy'], ['no_time', 'Because I have no time'],
    ], selection.reason);
    select('builder-reason').disabled = selection.question;
  }

  function updatePresentation(): void {
    updateEventControls();
    const sections: Readonly<Record<BuilderMode, string>> = {
      action: 'builder-action-fields', describe: 'builder-description-fields',
      presence: 'builder-presence-fields', 'ask-object': 'builder-object-fields',
      route: 'builder-route-fields',
    };
    for (const [sectionMode, id] of Object.entries(sections)) {
      required<HTMLElement>(`#${id}`).hidden = mode !== sectionMode;
    }

    const qualities = DESCRIPTION_QUALITIES[describedThing] as readonly Quality[];
    if (!qualities.includes(quality)) quality = qualities[0] ?? quality;
    fill(select('builder-description-quality'), qualities.map((id) => [id, labelFor(id)]), quality);
    fill(select('builder-mode'), [
      ['action', 'Perform an action, including past / future'],
      ['describe', 'Describe a person or thing'],
      ['presence', 'Is there something nearby?'],
      ['ask-object', 'Ask what someone needs, has or wants'],
      ['route', 'Ask how to reach a place'],
    ], mode);

    required<HTMLElement>('#builder-negative-field').hidden = mode === 'ask-object' || mode === 'route';
    required<HTMLElement>('#builder-question-field').hidden = mode === 'ask-object' || mode === 'route';
    required<HTMLElement>('#builder-polite-field').hidden = mode !== 'action';
    negative.checked = selection.negative;
    question.checked = selection.question;
    polite.checked = selection.polite;
    polite.disabled = !selection.question;
  }

  function meaning(): Expression {
    switch (mode) {
      case 'action': return makeTree(selection);
      case 'describe': return describe(describedThing, quality, {
        tense: descriptionTense, negative: selection.negative, question: selection.question,
      });
      case 'presence': return presence(presenceThing, presencePlace, {
        negative: selection.negative, question: selection.question,
      });
      case 'ask-object': return askObject(objectPredicate, objectAgent);
      case 'route': return howToGet(routePlace);
    }
  }

  function regenerate(): void {
    updatePresentation();
    try {
      const expression = meaning();
      output.textContent = linearize(expression, code);
      output.lang = code;
      translation.textContent = realizeEnglish(expression);
      construction.textContent = notation(expression);
      validation.textContent = 'Generated from grammar and meaning blocks.';
      validation.className = 'builder-validation is-valid';
      copy.disabled = false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      output.textContent = 'This combination is not supported.';
      translation.textContent = '';
      construction.textContent = message;
      validation.textContent = message;
      validation.className = 'builder-validation is-invalid';
      copy.disabled = true;
    }
  }

  select('builder-mode').addEventListener('change', (event) => {
    mode = (event.target as HTMLSelectElement).value as BuilderMode;
    regenerate();
  });
  select('builder-predicate').addEventListener('change', (event) => {
    selection.predicate = (event.target as HTMLSelectElement).value as PredicateId;
    regenerate();
  });
  select('builder-agent').addEventListener('change', (event) => {
    selection.agent = (event.target as HTMLSelectElement).value as Participant;
    regenerate();
  });
  select('builder-argument').addEventListener('change', (event) => {
    selection.argument = (event.target as HTMLSelectElement).value as SemanticArgument;
    regenerate();
  });
  select('builder-modal').addEventListener('change', (event) => {
    selection.modal = (event.target as HTMLSelectElement).value as Modality | '';
    regenerate();
  });
  select('builder-tense').addEventListener('change', (event) => {
    selection.tense = (event.target as HTMLSelectElement).value as Tense;
    regenerate();
  });
  select('builder-time').addEventListener('change', (event) => {
    selection.time = (event.target as HTMLSelectElement).value as Time | '';
    if (selection.time) selection.frequency = '';
    regenerate();
  });
  select('builder-frequency').addEventListener('change', (event) => {
    selection.frequency = (event.target as HTMLSelectElement).value as Frequency | '';
    if (selection.frequency) selection.time = '';
    regenerate();
  });
  select('builder-quantity').addEventListener('change', (event) => {
    selection.quantity = Number((event.target as HTMLSelectElement).value) as Quantity;
    regenerate();
  });
  select('builder-reason').addEventListener('change', (event) => {
    selection.reason = (event.target as HTMLSelectElement).value as BuilderSelection['reason'];
    regenerate();
  });
  select('builder-description-thing').addEventListener('change', (event) => {
    describedThing = (event.target as HTMLSelectElement).value as DescribableThing;
    regenerate();
  });
  select('builder-description-quality').addEventListener('change', (event) => {
    quality = (event.target as HTMLSelectElement).value as Quality;
    regenerate();
  });
  select('builder-description-tense').addEventListener('change', (event) => {
    descriptionTense = (event.target as HTMLSelectElement).value as 'present' | 'past';
    regenerate();
  });
  select('builder-presence-thing').addEventListener('change', (event) => {
    presenceThing = (event.target as HTMLSelectElement).value as PresenceThing;
    regenerate();
  });
  select('builder-presence-place').addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value;
    presencePlace = value ? value as PresencePlace : null;
    regenerate();
  });
  select('builder-object-predicate').addEventListener('change', (event) => {
    objectPredicate = (event.target as HTMLSelectElement).value as ObjectQuestionPredicate;
    regenerate();
  });
  select('builder-object-agent').addEventListener('change', (event) => {
    objectAgent = (event.target as HTMLSelectElement).value as typeof objectAgent;
    regenerate();
  });
  select('builder-route-place').addEventListener('change', (event) => {
    routePlace = (event.target as HTMLSelectElement).value as LocatablePlace;
    regenerate();
  });
  negative.addEventListener('change', () => { selection.negative = negative.checked; regenerate(); });
  question.addEventListener('change', () => { selection.question = question.checked; regenerate(); });
  polite.addEventListener('change', () => { selection.polite = polite.checked; regenerate(); });

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.textContent ?? '');
      copy.textContent = 'Copied ✓';
    } catch {
      copy.textContent = 'Copy unavailable';
    }
  });

  regenerate();
}
