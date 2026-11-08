/**
 * Controller for the visual block studio.
 *
 * In contrast to a translation phrasebook, the studio contains no target-
 * language sentences. Presets and exercises are semantic programs; every
 * rendered sentence is compiled by the same realizer as the study guide.
 *
 * Click-to-edit blocks work with mouse, touch, keyboard and screen readers.
 * Drag-and-drop is deliberately not required to make the learning tool usable.
 */
import { notation } from '../core/algebra.js';
import type {
  BuilderSelection,
  LanguageProfile,
  Connection,
  PresencePlace,
  Quality,
  Tense,
} from '../core/model.js';
import {
  CONCEPTS,
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
import { escapeHtml as escape, required } from './dom.js';
import {
  MISSIONS,
  RECIPES,
  applyRecipe,
  allowedArgumentsFor,
  availableOperator,
  clauseFromSelection,
  editCompositeClause,
  isCompositeField,
  initialStudio,
  isPresent,
  operatorApplied,
  matchesMission,
  missionAnswer,
  missionPendingSockets,
  missionSlotMatches,
  normalizeStudio,
  startMission,
  studioExpression,
  toggleOperator,
  type Mission,
  type StudioOperator,
  type StudioSlot,
  type StudioState,
} from './studio-model.js';
import { grammarSteps, ruleFor } from './studio-rules.js';
import { traceSurfaceOrder } from './surface-order.js';
import { actionCue } from './quest-recipe.js';
import { awardXP } from './state.js';

export const REMIX_STORAGE_KEY = 'mvl:studio:remix';

type Code = LanguageProfile['code'];
type Choice = Readonly<{ value: string; label: string }>;
type BlockTone = 'person' | 'action' | 'object' | 'time' | 'operator' | 'question';

interface VisualBlock {
  readonly slot: StudioSlot;
  readonly title: string;
  readonly value: string;
  readonly tone: BlockTone;
  readonly optional?: boolean;
}

const SUBJECT_CHOICES: readonly Choice[] = [
  { value: 'speaker', label: 'I' },
  { value: 'addressee', label: 'You (formal)' },
  { value: 'we', label: 'We' },
  { value: 'other', label: 'He' },
];

const TIME_CHOICES: Readonly<Record<Tense, readonly Choice[]>> = {
  present: [
    { value: '', label: 'No time word' }, { value: 'now', label: 'Now' },
    { value: 'today', label: 'Today' }, { value: 'this_week', label: 'This week' },
  ],
  past: [
    { value: '', label: 'No time word' }, { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_week', label: 'Last week' }, { value: 'last_month', label: 'Last month' },
  ],
  future: [
    { value: '', label: 'No time word' }, { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'next_week', label: 'Next week' }, { value: 'next_month', label: 'Next month' },
    { value: 'soon', label: 'Soon' }, { value: 'tonight', label: 'Tonight' },
  ],
};

const FREQUENCY_CHOICES: readonly Choice[] = [
  { value: '', label: 'Not recurring' }, { value: 'every_day', label: 'Every day' },
  { value: 'every_week', label: 'Every week' }, { value: 'often', label: 'Often' },
  { value: 'sometimes', label: 'Sometimes' },
];

const REASON_CHOICES: readonly Choice[] = [
  { value: 'none', label: 'No reason' }, { value: 'sick', label: 'Because I am sick' },
  { value: 'busy', label: 'Because I am busy' }, { value: 'no_time', label: 'Because I have no time' },
];

const OPERATOR_LABELS: Readonly<Record<StudioOperator, { name: string; hint: string; slot: StudioSlot }>> = {
  past: { name: 'Past', hint: 'Yesterday', slot: 'tense' },
  future: { name: 'Future', hint: 'Tomorrow', slot: 'tense' },
  can: { name: 'Can', hint: 'Ability', slot: 'modal' },
  want: { name: 'Want', hint: 'Intention', slot: 'modal' },
  must: { name: 'Must', hint: 'Obligation', slot: 'modal' },
  negative: { name: 'Not', hint: 'Negation', slot: 'negative' },
  question: { name: 'Question', hint: 'Ask', slot: 'question' },
  polite: { name: 'Please', hint: 'Politeness', slot: 'polite' },
  frequency: { name: 'Every day', hint: 'Habit', slot: 'frequency' },
  reason: { name: 'Because', hint: 'Explanation', slot: 'reason' },
  quantity: { name: 'Two', hint: 'Quantity', slot: 'quantity' },
};

const OPERATOR_ORDER: readonly StudioOperator[] = [
  'past', 'future', 'can', 'want', 'must',
  'negative', 'question', 'polite', 'frequency', 'reason', 'quantity',
];

const SLOT_EXPLANATIONS: Readonly<Partial<Record<StudioSlot, string>>> = {
  agent: 'Who is acting? Changing the person changes the verb form in many languages.',
  predicate: 'The action is the core of the sentence. It defines which objects and operators fit.',
  argument: 'What is affected, wanted, bought—or where are we going? Available choices depend on the action.',
  quantity: 'Change the number of countable objects; noun and article forms adjust automatically.',
  tense: 'Change when the event happens. Each language uses its own simplest common construction.',
  modal: 'Ability, desire and obligation wrap around an action. Not every verb needs a modal.',
  negative: 'Turn a statement into its negative without rebuilding the action.',
  question: 'Turn a statement into a yes/no question. The word order may change.',
  polite: 'Add a polite marker to a request made to another person.',
  reason: 'Attach a short reason to explain why something happens.',
  frequency: 'Make an activity recurring, such as every day or every week.',
  descriptionThing: 'Pick something you want to describe.',
  quality: 'Pick a property that naturally applies to the selected thing.',
  descriptionTense: 'Describe how something is now or how it was in the past.',
  presenceThing: 'Select an item or place whose existence you want to mention.',
  presencePlace: 'Anchor the statement to a place, or keep its location unspecified.',
  objectPredicate: 'Choose what kind of missing information you want to ask about.',
  objectAgent: 'Choose who you are asking about.',
  routePlace: 'Choose the destination. The directions construction stays the same.',
  wherePlace: 'The same location question works with many places.',
  priceThing: 'Ask how much an item costs without memorizing a separate question.',
  whenPrompt: 'Ask WHEN about an event. German, French and Spanish each place their question word differently.',
  connection: 'Connect two independent statements with and, but, or because.',
  clause0: 'First statement in a connected idea or story. Edit its grammar without changing the other statements.',
  clause1: 'Second statement in a connected idea or story. Edit its subject, action, object and time.',
  clause2: 'Third statement. Each event has an independent tense and participants.',
  clause3: 'Fourth statement. Keep narratives short to communicate clearly.',
};

function concept(id: string): string {
  return CONCEPTS[id as SemanticArgument] ?? id.replaceAll('_', ' ');
}

/** Visual stories are editable semantic clauses, not pretranslated sentence text. */
function actionLabel(predicate: PredicateId): string {
  const name = actionCue(predicate).toLocaleLowerCase('en');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isClauseSlot(value: StudioSlot): value is 'clause0' | 'clause1' | 'clause2' | 'clause3' {
  return /^clause[0-3]$/u.test(value);
}

function clauseAt(state: StudioState, index: number): BuilderSelection | null {
  if (state.pattern === 'link') return index === 0 ? state.action : index === 1 ? state.secondAction : null;
  if (state.pattern === 'sequence') return state.steps[index] ?? null;
  return null;
}

function clausePreview(selection: BuilderSelection): string {
  return realizeEnglish(clauseFromSelection(selection));
}

function visualBlocks(state: StudioState): readonly VisualBlock[] {
  if (state.pattern === 'link') {
    return [
      { slot: 'clause0', title: 'STATEMENT 1', value: clausePreview(state.action), tone: 'action' },
      { slot: 'connection', title: 'CONNECTOR', value: state.connection.toUpperCase(), tone: 'operator' },
      { slot: 'clause1', title: 'STATEMENT 2', value: clausePreview(state.secondAction), tone: 'action' },
    ];
  }
  if (state.pattern === 'sequence') {
    return state.steps.map((step, index) => ({
      slot: `clause${index}` as StudioSlot,
      title: `STEP ${index + 1}`,
      value: clausePreview(step),
      tone: 'action' as const,
    }));
  }
  if (state.pattern === 'description') {
    return [
      { slot: 'descriptionThing', title: 'THING', value: concept(state.descriptionThing), tone: 'object' },
      { slot: 'quality', title: 'QUALITY', value: concept(state.quality), tone: 'action' },
      ...(state.descriptionTense === 'past'
        ? [{ slot: 'descriptionTense', title: 'TIME', value: 'past', tone: 'time', optional: true } as const] : []),
      ...(state.descriptionNegative
        ? [{ slot: 'negative', title: 'OPERATOR', value: 'NOT', tone: 'operator', optional: true } as const] : []),
      ...(state.descriptionQuestion
        ? [{ slot: 'question', title: 'OPERATOR', value: 'QUESTION', tone: 'question', optional: true } as const] : []),
    ];
  }
  if (state.pattern === 'presence') {
    return [
      { slot: 'presenceThing', title: 'EXISTS', value: concept(state.presenceThing), tone: 'object' },
      { slot: 'presencePlace', title: 'WHERE', value: state.presencePlace ? concept(state.presencePlace) : 'anywhere', tone: 'time' },
      ...(state.presenceNegative
        ? [{ slot: 'negative', title: 'OPERATOR', value: 'NOT', tone: 'operator', optional: true } as const] : []),
      ...(state.presenceQuestion
        ? [{ slot: 'question', title: 'OPERATOR', value: 'QUESTION', tone: 'question', optional: true } as const] : []),
    ];
  }
  if (state.pattern === 'ask-object') {
    return [
      { slot: 'objectAgent', title: 'WHO', value: SUBJECT_CHOICES.find((item) => item.value === state.objectAgent)?.label ?? 'You', tone: 'person' },
      { slot: 'objectPredicate', title: 'ASK WHAT', value: actionLabel(state.objectPredicate), tone: 'question' },
    ];
  }
  if (state.pattern === 'route') {
    return [
      { slot: 'routePlace', title: 'GET TO', value: concept(state.routePlace), tone: 'object' },
    ];
  }
  if (state.pattern === 'where') {
    return [{ slot: 'wherePlace', title: 'WHERE IS', value: concept(state.wherePlace), tone: 'object' }];
  }
  if (state.pattern === 'price') {
    return [{ slot: 'priceThing', title: 'HOW MUCH', value: concept(state.priceThing), tone: 'object' }];
  }

  const { action } = state;
  const result: VisualBlock[] = [
    ...(state.pattern === 'ask-when' ? [{ slot: 'whenPrompt', title: 'QUESTION', value: 'WHEN?', tone: 'question' } as const] : []),
    { slot: 'agent', title: 'WHO', value: SUBJECT_CHOICES.find((item) => item.value === action.agent)?.label ?? 'I', tone: 'person' },
    { slot: 'predicate', title: 'ACTION', value: actionLabel(action.predicate), tone: 'action' },
    { slot: 'argument', title: 'OBJECT / PLACE', value: concept(action.argument), tone: 'object' },
  ];
  if (state.pattern === 'ask-when') result.push({ slot: 'tense', title: 'TENSE',
    value: action.tense, tone: 'time' });
  if (isPresent(state, 'quantity')) result.push({ slot: 'quantity', title: 'COUNT', value: 'two', tone: 'object', optional: true });
  if (isPresent(state, 'tense')) result.push({ slot: 'tense', title: 'TIME', value:
    `${action.tense}${action.time ? ` · ${concept(action.time)}` : ''}`, tone: 'time', optional: true });
  if (isPresent(state, 'frequency')) result.push({ slot: 'frequency', title: 'HABIT', value: concept(action.frequency), tone: 'time', optional: true });
  if (isPresent(state, 'modal')) result.push({ slot: 'modal', title: 'MODAL', value: action.modal, tone: 'operator', optional: true });
  if (isPresent(state, 'negative')) result.push({ slot: 'negative', title: 'OPERATOR', value: 'NOT', tone: 'operator', optional: true });
  if (isPresent(state, 'question')) result.push({ slot: 'question', title: 'OPERATOR', value: 'QUESTION', tone: 'question', optional: true });
  if (isPresent(state, 'polite')) result.push({ slot: 'polite', title: 'OPERATOR', value: 'PLEASE', tone: 'question', optional: true });
  if (isPresent(state, 'reason')) result.push({ slot: 'reason', title: 'EXPLAIN', value: `because · ${action.reason.replaceAll('_', ' ')}`, tone: 'operator', optional: true });
  return result;
}

function blockMarkup(block: VisualBlock, selected: StudioSlot): string {
  if (block.slot === 'whenPrompt') return `<span class="studio-block is-question studio-readonly-block" aria-label="Question operator: when">
    <span class="studio-block-type">QUESTION</span><strong>WHEN?</strong></span>`;
  return `<button type="button" data-slot="${block.slot}" class="studio-block is-${block.tone} ${selected === block.slot ? 'is-selected' : ''}"
    aria-pressed="${selected === block.slot}" aria-label="Edit ${escape(block.title.toLowerCase())}: ${escape(block.value)}">
    <span class="studio-block-type">${escape(block.title)}</span>
    <strong>${escape(block.value)}</strong>
    <span class="studio-block-edit">EDIT <span aria-hidden="true">↗</span></span>
  </button>`;
}

function choices(state: StudioState, slot: StudioSlot): readonly Choice[] {
  const { action } = state;
  switch (slot) {
    case 'agent': return SUBJECT_CHOICES;
    case 'predicate': return Object.keys(PREDICATES).map((value) => ({ value, label: actionLabel(value as PredicateId) }));
    case 'argument': return allowedArgumentsFor(action.predicate, action.agent)
      .map((id) => ({ value: id, label: concept(id) }));
    case 'quantity': return [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }];
    case 'tense': return action.predicate === 'like'
      ? [{ value: 'present', label: 'Present' }]
      : [{ value: 'present', label: 'Present' }, { value: 'past', label: 'Completed past' }, { value: 'future', label: 'Future / plan' }];
    case 'modal': return [
      { value: '', label: 'No modal' },
      ...(PREDICATES[action.predicate].allowedModalities as readonly string[]).map((value) => ({ value, label:
        ({ can: 'Can', want: 'Want to', must: 'Must' } as Record<string, string>)[value] ?? value })),
    ];
    case 'negative': case 'question': case 'polite': return [
      { value: 'false', label: 'Off' }, { value: 'true', label: 'On' },
    ];
    case 'reason': return REASON_CHOICES;
    case 'frequency': return FREQUENCY_CHOICES;
    case 'descriptionThing': return Object.keys(DESCRIPTION_QUALITIES).map((value) => ({ value, label: concept(value) }));
    case 'quality': return (DESCRIPTION_QUALITIES[state.descriptionThing] as readonly Quality[])
      .map((value) => ({ value, label: concept(value) }));
    case 'descriptionTense': return [{ value: 'present', label: 'Present' }, { value: 'past', label: 'Past' }];
    case 'presenceThing': return PRESENCE_THINGS.map((value) => ({ value, label: concept(value) }));
    case 'presencePlace': return [
      { value: '', label: 'Anywhere' }, { value: 'here', label: 'Here' },
      { value: 'station', label: 'At the station' }, { value: 'hotel', label: 'At the hotel' },
      { value: 'airport', label: 'At the airport' }, { value: 'city_center', label: 'In the city centre' },
    ];
    case 'objectPredicate': return OBJECT_QUESTION_PREDICATES.map((value) => ({ value, label: actionLabel(value) }));
    case 'objectAgent': return SUBJECT_CHOICES.filter(({ value }) => value === 'speaker' || value === 'addressee');
    case 'routePlace': case 'wherePlace': return LOCATABLE_PLACES.map((value) => ({ value, label: concept(value) }));
    case 'whenPrompt': case 'clause0': case 'clause1': case 'clause2': case 'clause3': return [];
    case 'connection': return [
      { value: 'and', label: 'And' }, { value: 'but', label: 'But' }, { value: 'because', label: 'Because' },
    ];
    case 'priceThing': return ['ticket', 'coffee', 'book', 'room', 'computer', 'bag', 'apartment']
      .map((value) => ({ value, label: concept(value) }));
  }
}

function currentValue(state: StudioState, slot: StudioSlot): string {
  switch (slot) {
    case 'agent': case 'predicate': case 'argument': case 'quantity':
    case 'tense': case 'modal': case 'negative': case 'question':
    case 'polite': case 'reason': case 'frequency': {
      if (slot === 'negative' && state.pattern === 'description') return String(state.descriptionNegative);
      if (slot === 'negative' && state.pattern === 'presence') return String(state.presenceNegative);
      if (slot === 'question' && state.pattern === 'description') return String(state.descriptionQuestion);
      if (slot === 'question' && state.pattern === 'presence') return String(state.presenceQuestion);
      if (slot === 'tense' && state.pattern === 'description') return state.descriptionTense;
      return String(state.action[slot]);
    }
    case 'descriptionThing': return state.descriptionThing;
    case 'quality': return state.quality;
    case 'descriptionTense': return state.descriptionTense;
    case 'presenceThing': return state.presenceThing;
    case 'presencePlace': return state.presencePlace ?? '';
    case 'objectPredicate': return state.objectPredicate;
    case 'objectAgent': return state.objectAgent;
    case 'routePlace': return state.routePlace;
    case 'wherePlace': return state.wherePlace;
    case 'priceThing': return state.priceThing;
    case 'connection': return state.connection;
    case 'whenPrompt': case 'clause0': case 'clause1': case 'clause2': case 'clause3': return '';
  }
}

function setSlot(state: StudioState, slot: StudioSlot, value: string): StudioState {
  const next = structuredClone(state);
  switch (slot) {
    case 'agent': next.action.agent = value as BuilderSelection['agent']; break;
    case 'predicate': next.action.predicate = value as PredicateId; break;
    case 'argument': next.action.argument = value as SemanticArgument; break;
    case 'quantity': next.action.quantity = Number(value) as BuilderSelection['quantity']; break;
    case 'tense':
      if (state.pattern === 'description') { next.descriptionTense = value as 'present' | 'past'; break; }
      next.action.tense = value as Tense;
      next.action.time = '';
      next.action.frequency = '';
      break;
    case 'modal': next.action.modal = value as BuilderSelection['modal']; break;
    case 'negative':
      if (state.pattern === 'description') next.descriptionNegative = value === 'true';
      else if (state.pattern === 'presence') next.presenceNegative = value === 'true';
      else next.action.negative = value === 'true';
      break;
    case 'question':
      if (state.pattern === 'description') next.descriptionQuestion = value === 'true';
      else if (state.pattern === 'presence') next.presenceQuestion = value === 'true';
      else {
        next.action.question = value === 'true';
        if (next.action.question) next.action.reason = 'none';
      }
      break;
    case 'polite':
      next.action.polite = value === 'true';
      if (next.action.polite) next.action.question = true;
      break;
    case 'reason':
      next.action.reason = value as BuilderSelection['reason'];
      if (next.action.reason !== 'none') { next.action.question = false; next.action.polite = false; }
      break;
    case 'frequency':
      next.action.frequency = value as BuilderSelection['frequency'];
      next.action.time = '';
      break;
    case 'descriptionThing': next.descriptionThing = value as StudioState['descriptionThing']; break;
    case 'quality': next.quality = value as Quality; break;
    case 'descriptionTense': next.descriptionTense = value as 'present' | 'past'; break;
    case 'presenceThing': next.presenceThing = value as StudioState['presenceThing']; break;
    case 'presencePlace': next.presencePlace = value ? value as PresencePlace : null; break;
    case 'objectPredicate': next.objectPredicate = value as StudioState['objectPredicate']; break;
    case 'objectAgent': next.objectAgent = value as StudioState['objectAgent']; break;
    case 'routePlace': next.routePlace = value as StudioState['routePlace']; break;
    case 'wherePlace': next.wherePlace = value as StudioState['wherePlace']; break;
    case 'priceThing': next.priceThing = value as StudioState['priceThing']; break;
    case 'connection': next.connection = value as Connection; break;
    case 'whenPrompt': case 'clause0': case 'clause1': case 'clause2': case 'clause3': break;
  }
  return normalizeStudio(next);
}

/**
 * Build a temporary comparison program for the currently selected block.
 *
 * For optional operators, remove the operator. For required semantic slots,
 * substitute a valid alternative. Both sentences go through the same language
 * realizer, so the highlighted surface words come from grammar, not a lookup.
 */
function contrastForSlot(state: StudioState, slot: StudioSlot): StudioState | null {
  if (isClauseSlot(slot)) {
    const index = Number(slot.slice(-1));
    const existing = clauseAt(state, index);
    if (!existing) return null;
    const alternate = { ...existing, negative: !existing.negative };
    const next = structuredClone(state);
    if (state.pattern === 'link') {
      if (index === 0) next.action = alternate;
      else next.secondAction = alternate;
    } else if (state.pattern === 'sequence') next.steps[index] = alternate;
    return normalizeStudio(next);
  }
  if (slot === 'whenPrompt') return null;
  if (slot === 'descriptionTense') {
    return setSlot(state, slot, state.descriptionTense === 'past' ? 'present' : 'past');
  }

  const visible = visualBlocks(state).find((block) => block.slot === slot);
  if (visible?.optional) return removeSlot(state, slot);

  const options = choices(state, slot);
  const current = currentValue(state, slot);
  const alternative = options.find((choice) => choice.value !== current);
  return alternative ? setSlot(state, slot, alternative.value) : null;
}

function removeSlot(state: StudioState, slot: StudioSlot): StudioState {
  switch (slot) {
    case 'tense': return setSlot(state, 'tense', 'present');
    case 'modal': case 'frequency': return setSlot(state, slot, '');
    case 'quantity': return setSlot(state, 'quantity', '1');
    case 'negative': case 'question': case 'polite': return setSlot(state, slot, 'false');
    case 'reason': return setSlot(state, slot, 'none');
    default: return state;
  }
}

function isState(value: unknown): value is StudioState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return ['action', 'description', 'presence', 'ask-object', 'route', 'where', 'price',
      'ask-when', 'link', 'sequence'].includes(String(record['pattern']))
    && typeof record['action'] === 'object' && record['action'] !== null
    && typeof (record['action'] as Record<string, unknown>)['predicate'] === 'string';
}

function readState(code: Code): StudioState {
  try {
    const remix = sessionStorage.getItem(REMIX_STORAGE_KEY);
    if (remix) {
      sessionStorage.removeItem(REMIX_STORAGE_KEY);
      const parsed: unknown = JSON.parse(remix);
      if (isState(parsed)) return normalizeStudio({ ...initialStudio(), ...parsed });
    }
    const saved = localStorage.getItem(`mvl:studio:${code}`) ?? localStorage.getItem('mvl:studio:last');
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isState(parsed)) return normalizeStudio({ ...initialStudio(), ...parsed });
    }
  } catch { /* Storage can be disabled, or the saved model might be outdated. */ }
  return initialStudio();
}

function saveState(code: Code, state: StudioState): void {
  try {
    const encoded = JSON.stringify(state);
    localStorage.setItem(`mvl:studio:${code}`, encoded);
    localStorage.setItem('mvl:studio:last', encoded);
  } catch { /* Offline learning works without storage. */ }
}

function defaultSlot(state: StudioState): StudioSlot {
  switch (state.pattern) {
    case 'action': return 'predicate';
    case 'description': return 'quality';
    case 'presence': return 'presenceThing';
    case 'ask-object': return 'objectPredicate';
    case 'route': return 'routePlace';
    case 'where': return 'wherePlace';
    case 'price': return 'priceThing';
    case 'ask-when': return 'predicate';
    case 'link': case 'sequence': return 'clause0';
  }
}

/** A screen instance stays mounted until the hash route changes. */
export function initializeStudio(code: Code, signal: AbortSignal): void {
  let state: StudioState = readState(code);
  let activeSlot: StudioSlot = defaultSlot(state);
  let recipeId: string | null = null;
  let showAllRecipes = false;
  let activeMission: Mission | null = null;
  let missionRevealed = false;
  let status = '';
  let adjustmentMessage = '';
  let priorOutput: string | null = null;
  let lastChange = '';
  let activeSnapSlot: StudioSlot | 'power' = 'predicate';
  let snapStatus = '';
  const clearedKey = 'mvl:studio:blueprints:' + code;
  let clearedBlueprints = new Set<string>();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(clearedKey) ?? '[]');
    if (Array.isArray(saved))
      clearedBlueprints = new Set(saved.filter((value): value is string => typeof value === 'string'));
  } catch { /* A fresh round works without local storage. */ }

  const canvas = required<HTMLElement>('#studio-blocks');
  const adjustment = required<HTMLElement>('#studio-adjustment');
  const palette = required<HTMLElement>('#studio-palette');
  const inspector = required<HTMLElement>('#studio-inspector-body');
  const recipes = required<HTMLElement>('#studio-recipes-list');
  const missions = required<HTMLElement>('#studio-missions');
  const result = required<HTMLElement>('#studio-result');
  const orderedWords = required<HTMLElement>('#studio-order-words');
  const structure = required<HTMLElement>('#studio-structure');
  const orderedHint = required<HTMLElement>('#studio-order-hint');
  const orderedLanguage = required<HTMLElement>('#studio-order-language');
  const orderedComparison = required<HTMLElement>('#studio-order-comparison');
  const delta = required<HTMLElement>('#studio-delta');
  const meaning = required<HTMLElement>('#studio-english');
  const note = required<HTMLElement>('#studio-grammar-note');
  const error = required<HTMLElement>('#studio-error');
  const feedback = required<HTMLElement>('#studio-mission-feedback');
  const copy = required<HTMLButtonElement>('#studio-copy');
  const showRecipes = required<HTMLButtonElement>('#studio-show-recipes');
  const snap = required<HTMLElement>('#snap-game');
  const workshop = required<HTMLDetailsElement>('#studio-workshop');

  function renderRecipes(): void {
    recipes.innerHTML = RECIPES.slice(0, showAllRecipes ? RECIPES.length : 6).map((recipe) => {
      const stateForRecipe = applyRecipe(initialStudio(), recipe);
      const target = linearize(studioExpression(stateForRecipe), code);
      const selected = recipe.id === recipeId;
      return `<button type="button" data-recipe="${recipe.id}" class="studio-recipe ${selected ? 'is-active' : ''}" aria-pressed="${selected}">
        <span class="studio-recipe-code">${escape(recipe.intent)}</span>
        <strong>${escape(recipe.title)}</strong>
        <span class="studio-recipe-example" lang="${code}">${escape(target)}</span>
        <span class="studio-recipe-arrow" aria-hidden="true">↗</span>
      </button>`;
    }).join('');
    showRecipes.textContent = showAllRecipes ? 'Show fewer ↑' : 'Show all patterns ↓';
    showRecipes.setAttribute('aria-expanded', String(showAllRecipes));
  }

  function renderCanvas(): void {
    const blocks = visualBlocks(state);
    const markup = blocks.map((block, index) => `${index > 0 ? '<span class="studio-join" aria-hidden="true">⊕</span>' : ''}${blockMarkup(block, activeSlot)}`).join('');
    canvas.innerHTML = `${markup}<p class="studio-canvas-caption">${blocks.length} meaning ingredients · ⊕ means “combine meanings”, not “put these words in this order”</p>`;
    adjustment.textContent = adjustmentMessage;
    adjustment.hidden = !adjustmentMessage;
  }

  function renderPalette(): void {
    const paletteHeading = document.querySelector<HTMLElement>('.studio-add-header');
    if (paletteHeading) paletteHeading.firstElementChild!.textContent =
      state.pattern === 'link' || state.pattern === 'sequence' || state.pattern === 'ask-when'
        ? 'EDIT THE COMPONENTS ABOVE' : 'ADD AN OPERATOR';
    if (state.pattern === 'link' || state.pattern === 'sequence' || state.pattern === 'ask-when') {
      palette.innerHTML = '<p class="studio-order-comparison">Each statement is a complete building block. Select it above to change its subject, action, time or negation.</p>';
      return;
    }
    palette.innerHTML = OPERATOR_ORDER.map((operator) => {
      const meta = OPERATOR_LABELS[operator];
      const supported = availableOperator(state, operator);
      const selected = supported && operatorApplied(state, operator);
      return `<button type="button" data-operator="${operator}" class="studio-operator ${selected ? 'is-added' : ''}"
        aria-pressed="${selected}" ${supported ? '' : 'disabled title="This block does not fit the current pattern"'}>
        <span class="studio-operator-sign">${selected ? '✓' : '+'}</span>
        <span><strong>${meta.name}</strong><small>${meta.hint}</small></span>
      </button>`;
    }).join('');
  }

  /** An editable inspector for a complete statement nested inside a story. */
  function renderCompositeInspector(slot: StudioSlot): string {
    const index = Number(slot.slice(-1));
    const selection = clauseAt(state, index);
    if (!selection) return '<p>This statement is not available.</p>';
    const field = (key: string, label: string, choices: readonly Choice[], value: string): string => `
      <label class="studio-composite-field">${escape(label)}
        <select data-composite-index="${index}" data-composite-field="${key}">
          ${choices.map((choice) => `<option value="${escape(choice.value)}" ${choice.value === value ? 'selected' : ''}>${escape(choice.label)}</option>`).join('')}
        </select>
      </label>`;
    const predicateChoices = Object.keys(PREDICATES).map((value) => ({ value, label: actionLabel(value as PredicateId) }));
    const argumentChoices = allowedArgumentsFor(selection.predicate, selection.agent)
      .map((value) => ({ value, label: concept(value) }));
    const tenseChoices: readonly Choice[] = [
      { value: 'present', label: 'Present' },
      { value: 'past', label: 'Completed past' },
      { value: 'future', label: 'Future / plan' },
    ];
    return `<div class="studio-inspector-identity">
      <span class="studio-inspector-type is-action">STEP ${index + 1}</span>
      <h2 id="studio-inspector-title">Edit this statement</h2>
      <p>The other statements stay unchanged. Each step has its own subject, action, time and negation.</p>
    </div>
    <div class="studio-composite-fields">
      ${field('agent', 'Who?', SUBJECT_CHOICES, selection.agent)}
      ${field('predicate', 'Action', predicateChoices, selection.predicate)}
      ${field('argument', 'Object / place', argumentChoices, selection.argument)}
      ${field('tense', 'When?', tenseChoices, selection.tense)}
      ${field('time', 'Time expression', TIME_CHOICES[selection.tense], selection.time)}
      ${field('negative', 'Negation', [{ value: 'false', label: 'Yes / positive' }, { value: 'true', label: 'No / negative' }], String(selection.negative))}
    </div>
    <div class="studio-inspector-tip"><strong>WHY IT WORKS</strong><p>${escape(ruleFor(state, code, slot))}</p></div>
    ${state.pattern === 'sequence' ? `<div class="studio-sequence-controls">
      ${state.steps.length < 4 ? '<button type="button" data-add-step="true" class="studio-text-button">+ Add step</button>' : ''}
      ${state.steps.length > 2 ? `<button type="button" data-remove-step="${index}" class="studio-text-button">− Remove this step</button>` : ''}
    </div>` : ''}`;
  }

  function renderInspector(): void {
    const block = visualBlocks(state).find((item) => item.slot === activeSlot);
    if (!block) {
      activeSlot = visualBlocks(state)[0]?.slot ?? 'predicate';
    }
    const current = visualBlocks(state).find((item) => item.slot === activeSlot);
    if (!current) return;
    if (isClauseSlot(activeSlot) && (state.pattern === 'link' || state.pattern === 'sequence')) {
      inspector.innerHTML = renderCompositeInspector(activeSlot);
      return;
    }
    const options = choices(state, activeSlot);
    const selected = currentValue(state, activeSlot);
    const long = options.length > 12;
    const title = current.title === 'ACTION' ? 'What happens?' : current.title;
    inspector.innerHTML = `<div class="studio-inspector-identity">
      <span class="studio-inspector-type is-${current.tone}">${escape(current.title)}</span>
      <h2 id="studio-inspector-title">${escape(title)}</h2>
      <p>${escape(SLOT_EXPLANATIONS[activeSlot] ?? 'Choose a block to change this meaning.')}</p>
    </div>
    <label class="studio-option-title">Choose a value</label>
    ${long ? '<label class="visually-hidden" for="studio-option-filter">Search block values</label><input type="search" id="studio-option-filter" class="studio-filter" placeholder="Find a verb or object…" autocomplete="off" />' : ''}
    <div class="studio-option-grid ${long ? 'is-scrollable' : ''}" role="group" aria-label="${escape(title)} values">
      ${options.map((option) => `<button type="button" data-choice-slot="${activeSlot}" data-choice-value="${escape(option.value)}"
        class="studio-choice ${selected === option.value ? 'is-selected' : ''}" aria-pressed="${selected === option.value}">
        ${escape(option.label)}${selected === option.value ? '<span aria-hidden="true">✓</span>' : ''}
      </button>`).join('')}
    </div>
    ${activeSlot === 'tense' && state.pattern === 'action' ? `
      <label class="studio-option-title studio-time-label">Time word</label>
      <div class="studio-option-grid" role="group" aria-label="Time words">
        ${TIME_CHOICES[state.action.tense].map((item) => `<button type="button" data-choice-slot="time" data-choice-value="${escape(item.value)}"
          class="studio-choice ${state.action.time === item.value ? 'is-selected' : ''}" aria-pressed="${state.action.time === item.value}">${escape(item.label)}</button>`).join('')}
      </div>` : ''}
    <div class="studio-inspector-tip"><strong>WHY IT WORKS</strong><p>${escape(ruleFor(state, code, activeSlot))}</p></div>
    ${current.optional ? `<button type="button" class="studio-remove" data-remove="${activeSlot}">− Remove this block</button>` : ''}`;
  }

  function rememberBefore(label: string): void {
    try { priorOutput = linearize(studioExpression(state), code); }
    catch { priorOutput = null; }
    lastChange = label;
    adjustmentMessage = '';
  }

  function renderResult(): void {
    try {
      const expression = studioExpression(state);
      const current = linearize(expression, code);
      result.textContent = current;
      result.lang = code;

      // Show the *spoken* word order separately from the semantic ingredients.
      // A contrast with the selected block highlights its actual surface effect.
      let comparison: string | null = null;
      try {
        const alternative = contrastForSlot(state, activeSlot);
        if (alternative) comparison = linearize(studioExpression(alternative), code);
      } catch {
        // Some slots have no alternative in a particular construction.
      }
      const tokens = traceSurfaceOrder(current, comparison);
      structure.innerHTML = grammarSteps(state, code)
        .map((step) => '<span class="studio-structure-step"><strong>' + escape(step.role) +
          '</strong><small>' + escape(step.explanation) + '</small></span>').join('');
      orderedLanguage.textContent = ({ de: '· German', fr: '· French', es: '· Spanish' } as const)[code];
      orderedWords.lang = code;
      orderedWords.innerHTML = tokens.map((token) => `
        <span class="studio-order-word ${token.affected ? 'is-affected' : ''}">${escape(token.text)}</span>
      `).join('');
      const selectedBlock = visualBlocks(state).find((block) => block.slot === activeSlot);
      const affectedCount = tokens.filter((token) => token.affected).length;
      orderedHint.textContent = affectedCount > 0 && selectedBlock
        ? isClauseSlot(activeSlot)
          ? 'Highlighted words would change if you negated this statement. This comparison is not a full grammatical parse.'
          : `Highlighted words differ when you change ${selectedBlock.value}. This comparison is not a full grammatical parse.`
        : 'These words are in spoken order. Select an editable meaning block to compare another possible sentence.';
      orderedComparison.textContent = comparison === null ? '' : `Compare with: ${comparison}`;
      delta.hidden = !(priorOutput && priorOutput !== current);
      if (!delta.hidden && priorOutput) {
        required<HTMLElement>('#studio-delta-content').innerHTML = `
          <div><small>BEFORE</small><span lang="${code}">${escape(priorOutput)}</span></div>
          <span aria-hidden="true" class="studio-delta-arrow">→</span>
          <div><small>${escape(lastChange.toUpperCase())}</small><strong lang="${code}">${escape(current)}</strong></div>`;
      }

      meaning.textContent = realizeEnglish(expression);
      note.textContent = ruleFor(state, code, activeSlot);
      required('#studio-notation').textContent = notation(expression);
      const other = (['de', 'fr', 'es'] as const).filter((language) => language !== code);
      required('#studio-other-languages').innerHTML = `<span class="micro-label">SAME BLOCKS, DIFFERENT LANGUAGE</span>
        ${other.map((language) => `<div><small>${({ de: 'German', fr: 'French', es: 'Spanish' } as const)[language]}</small>
          <strong lang="${language}">${escape(linearize(expression, language))}</strong></div>`).join('')}`;
      copy.disabled = false;
      error.hidden = true;
    } catch (cause: unknown) {
      result.textContent = 'This combination is not supported.';
      meaning.textContent = '';
      orderedWords.textContent = '';
      structure.textContent = '';
      orderedComparison.textContent = '';
      orderedHint.textContent = 'This combination could not be realized.';
      copy.disabled = true;
      error.textContent = cause instanceof Error ? cause.message : 'Unsupported grammar combination.';
      error.hidden = false;
    }
  }

  function renderMissions(): void {
    missions.innerHTML = MISSIONS.map((mission, index) => {
      const active = activeMission?.id === mission.id;
      const success = active && matchesMission(state, mission);
      const goal = realizeEnglish(missionAnswer(mission));
      return `<div class="studio-mission ${active ? 'is-active' : ''} ${success ? 'is-complete' : ''}">
        <span class="studio-mission-index">${String(index + 1).padStart(2, '0')}</span>
        <div><strong>${escape(mission.title)}</strong><p>${escape(mission.description)}</p>
          ${active ? `<div class="studio-mission-goal">YOUR GOAL: <strong>${escape(goal)}</strong></div>` : ''}</div>
        <button type="button" data-mission="${mission.id}" class="studio-mission-start">${active ? 'Restart ↺' : 'Build ↗'}</button>
      </div>`;
    }).join('');
    if (!activeMission) {
      feedback.innerHTML = '<p>Select a challenge to start with only the basic blocks.</p>';
    } else if (matchesMission(state, activeMission)) {
      feedback.innerHTML = '<span class="studio-mission-success">✓ You built the intended meaning. Try changing one more block.</span>';
    } else {
      feedback.innerHTML = `<p>${status ? escape(status) : 'Edit the blocks above until they express the goal.'}</p>
        <button type="button" data-check-mission="true" class="button secondary">Check my blocks</button>
        <button type="button" data-reveal-mission="true" class="studio-text-button">${missionRevealed ? 'Hide answer ↑' : 'See one solution ↓'}</button>
        ${missionRevealed ? `<div class="studio-mission-answer" lang="${code}">${escape(linearize(missionAnswer(activeMission), code))}</div>` : ''}`;
    }
  }


  /** The puzzle board is a direct view of StudioState, not a separate game model.
   * All pieces and sockets are semantic and run through choices/setSlot/
   * normalizeStudio. The target-language order stays in the live output. */
  function snapLanes(): readonly (StudioSlot | 'power')[] {
    if (state.pattern === 'action') return ['agent', 'predicate', 'argument', 'tense', 'power'];
    return visualBlocks(state).filter((block) => block.slot !== 'whenPrompt').map((block) => block.slot);
  }

  function snapSolved(): boolean {
    return Boolean(activeMission && matchesMission(state, activeMission));
  }

  function grantBlueprintXP(): void {
    if (!activeMission || !snapSolved() || clearedBlueprints.has(activeMission.id)) return;
    clearedBlueprints.add(activeMission.id);
    try { localStorage.setItem(clearedKey, JSON.stringify([...clearedBlueprints])); }
    catch { /* Playing without saved progress still works. */ }
    const updated = awardXP(code, 50);
    const label = document.querySelector<HTMLElement>('.game-top-score');
    if (label) label.textContent = '✦ ' + updated.xp + ' XP';
    snapStatus = 'Blueprint cleared! +50 XP · The meaning and grammar match your goal.';
  }

  function renderSnap(): void {
    grantBlueprintXP();
    const lanes = snapLanes();
    if (!lanes.includes(activeSnapSlot)) activeSnapSlot = lanes[0] ?? 'predicate';
    const laneLabels: Readonly<Record<string, string>> = {
      agent: 'WHO', predicate: 'ACTION', argument: 'OBJECT', tense: 'WHEN',
      power: 'POWER', descriptionThing: 'THING', quality: 'QUALITY',
      descriptionTense: 'WHEN', presenceThing: 'WHAT EXISTS', presencePlace: 'WHERE',
      objectAgent: 'WHO', objectPredicate: 'ASK WHAT', routePlace: 'DESTINATION',
      wherePlace: 'WHERE', priceThing: 'PRICE', connection: 'CONNECTOR',
    };
    const laneTones: Readonly<Record<string, string>> = {
      agent: 'person', predicate: 'action', argument: 'object', tense: 'time', power: 'operator',
    };
    const actionPowers = OPERATOR_ORDER
      .filter((op) => op !== 'past' && op !== 'future' && operatorApplied(state, op))
      .map((op) => OPERATOR_LABELS[op].name);
    const blocks = state.pattern === 'action'
      ? [
        { slot: 'agent' as StudioSlot, value: SUBJECT_CHOICES.find((x) => x.value === state.action.agent)?.label ?? 'I' },
        { slot: 'predicate' as StudioSlot, value: actionLabel(state.action.predicate) },
        { slot: 'argument' as StudioSlot, value: concept(state.action.argument) },
        { slot: 'tense' as StudioSlot, value: state.action.tense.toUpperCase() +
          (state.action.time ? ' · ' + concept(state.action.time) : '') },
        { slot: 'power' as const, value: actionPowers.join(' + ') || '+ Add a power' },
      ] : visualBlocks(state).filter((block) => block.slot !== 'whenPrompt')
        .map((block) => ({ slot: block.slot, value: block.value }));
    const goalAction = activeMission
      ? { ...initialStudio().action, ...activeMission.target } : null;
    const pending = activeMission ? missionPendingSockets(state, activeMission) : [];
    const matched = activeMission ? 5 - pending.length : 0;
    function matchesSlot(slot: string): boolean {
      if (!activeMission || state.pattern !== 'action') return false;
      switch (slot) {
        case 'agent': case 'predicate': case 'argument': case 'tense': case 'power':
          return missionSlotMatches(state, activeMission, slot);
        default: return false;
      }
    }
    required<HTMLElement>('#snap-sockets').innerHTML = blocks.map((block, i) => {
      const slot = block.slot;
      const selected = activeSnapSlot === slot;
      const matches = matchesSlot(slot);
      return `<button type="button" class="snap-socket is-${laneTones[slot] ?? 'other'} ${selected ? 'is-selected' : ''} ${matches ? 'is-match' : activeMission ? 'is-needs-work' : ''}"
        data-snap-slot="${slot}" aria-pressed="${selected}" aria-label="Select ${escape(laneLabels[slot] ?? slot)}: ${escape(block.value)}">
        <span class="snap-socket-top"><b>${String(i + 1).padStart(2, '0')} · ${escape(laneLabels[slot] ?? slot.toUpperCase())}</b><small>${matches ? '✓ FITS GOAL' : activeMission ? 'CHANGE FOR GOAL' : selected ? 'SELECTED' : 'SWAP ↗'}</small></span>
        <strong>${escape(block.value)}</strong><span class="snap-socket-foot">${selected ? '▼ PICK A PIECE' : 'CLICK TO EDIT'}</span>
      </button>`;
    }).join('');
    const missionButtons = MISSIONS.map((mission, i) => {
      const cleared = clearedBlueprints.has(mission.id);
      const active = activeMission?.id === mission.id;
      return `<button type="button" data-snap-mission="${mission.id}" class="snap-mission ${active ? 'is-active' : ''} ${cleared ? 'is-cleared' : ''}"
        aria-pressed="${active}"><span>${String(i + 1).padStart(2, '0')}</span>
          <strong>${escape(mission.title)}</strong><small>${cleared ? '✓ CLEARED' : active ? '● PLAYING' : 'PLAY ↗'}</small></button>`;
    }).join('');
    required<HTMLElement>('#snap-mission-grid').innerHTML = missionButtons;
    required<HTMLElement>('#snap-cleared').textContent = clearedBlueprints.size + ' / ' + MISSIONS.length;
    required<HTMLElement>('#snap-objective').innerHTML = activeMission
      ? `<span>YOUR BLUEPRINT · ${escape(activeMission.title)} · ${snapSolved() ? '✓ COMPLETE' : `${matched} / 5 MATCH`}</span>
          <strong>${escape(realizeEnglish(missionAnswer(activeMission)))}</strong>
          <p>${escape(activeMission.description)}</p>`
      : '<span>FREE BUILD</span><strong>Make your own sentence.</strong><p>Choose a blueprint above for a goal, or experiment freely with the sockets below.</p>';

    type SnapChoice = Readonly<{ slot: string; value: string; label: string; active: boolean; group?: string }>;
    let pieces: SnapChoice[] = [];
    if (activeSnapSlot === 'power' && state.pattern === 'action') {
      pieces = OPERATOR_ORDER.filter((op) => op !== 'past' && op !== 'future' && availableOperator(state, op))
        .map((op) => ({ slot: 'power', value: op,
          label: OPERATOR_LABELS[op].name, active: operatorApplied(state, op) }));
    } else if (activeSnapSlot === 'tense' && state.pattern === 'action') {
      pieces = [
        ...choices(state, 'tense').map((item) => ({
          slot: 'tense', value: item.value, label: item.label,
          active: state.action.tense === item.value, group: 'TENSE',
        })),
        ...TIME_CHOICES[state.action.tense].map((item) => ({
          slot: 'time', value: item.value, label: item.label,
          active: state.action.time === item.value, group: 'TIME WORD',
        })),
      ];
    } else {
      pieces = choices(state, activeSnapSlot as StudioSlot).map((item) => ({
        slot: activeSnapSlot, value: item.value, label: item.label,
        active: currentValue(state, activeSnapSlot as StudioSlot) === item.value,
      }));
    }
    function pieceMatchesGoal(piece: SnapChoice): boolean {
      if (!piece.active || !goalAction) return false;
      switch (piece.slot) {
        case 'tense': return state.action.tense === goalAction.tense;
        case 'time': return state.action.time === goalAction.time;
        case 'power':
          switch (piece.value) {
            case 'negative': return goalAction.negative;
            case 'question': return goalAction.question;
            case 'polite': return goalAction.polite;
            case 'frequency': return goalAction.frequency !== '';
            case 'reason': return goalAction.reason !== 'none';
            case 'quantity': return goalAction.quantity === 2;
            case 'can': case 'want': case 'must': return goalAction.modal === piece.value;
            default: return false;
          }
        default: return matchesSlot(piece.slot);
      }
    }
    const filter = required<HTMLInputElement>('#snap-filter');
    filter.value = '';
    filter.hidden = pieces.length < 14;
    required<HTMLElement>('#snap-tray-title').textContent = (laneLabels[activeSnapSlot] ?? activeSnapSlot.toUpperCase()) + ' · ' + pieces.length + ' compatible pieces';
    required<HTMLElement>('#snap-pieces').innerHTML = pieces.length
      ? pieces.map((piece) => `<button type="button" class="snap-piece ${piece.active ? 'is-inserted' : ''} ${piece.active && activeMission ? pieceMatchesGoal(piece) ? 'is-goal-match' : 'is-goal-mismatch' : ''}"
          data-snap-for="${piece.slot}" data-snap-value="${escape(piece.value)}" draggable="true"
          aria-pressed="${piece.active}" title="Snap ${escape(piece.label)} into ${escape(laneLabels[activeSnapSlot] ?? activeSnapSlot)}">
          ${piece.group ? `<small>${escape(piece.group)}</small>` : ''}
          <span>${escape(piece.label)}</span><b aria-hidden="true">${piece.active ? pieceMatchesGoal(piece) ? '✓' : '●' : '+'}</b></button>`).join('')
      : '<p class="snap-no-pieces">This is a complete statement block. Open the grammar workshop below to edit its parts.</p>';
    const line = required<HTMLElement>('#snap-sentence');
    line.textContent = result.textContent ?? '';
    line.lang = code;
    required<HTMLElement>('#snap-meaning').textContent = meaning.textContent ?? '';
    const goalReminder = required<HTMLElement>('#snap-target');
    goalReminder.hidden = !activeMission;
    goalReminder.textContent = activeMission
      ? 'GOAL · ' + realizeEnglish(missionAnswer(activeMission)) : '';
    const feedbackLine = required<HTMLElement>('#snap-feedback');
    feedbackLine.classList.toggle('is-pending', Boolean(activeMission && !snapSolved()));
    feedbackLine.textContent = snapSolved()
      ? (snapStatus.startsWith('Blueprint cleared') ? snapStatus : '✓ Target built! All five sockets match the blueprint.')
      : activeMission
        ? matched + ' / 5 sockets match. Change: ' +
          pending.map((slot) => laneLabels[slot] ?? slot).join(', ') + '. ' + snapStatus
        : snapStatus || 'Select a socket and snap in a piece. Incompatible pieces cannot be placed.';
    const resetButton = required<HTMLButtonElement>('#snap-reset-goal');
    resetButton.hidden = !activeMission;
    const nextButton = required<HTMLButtonElement>('#snap-next');
    nextButton.hidden = !snapSolved();
    nextButton.textContent = activeMission === MISSIONS[MISSIONS.length - 1] ? 'Play the first blueprint ↻' : 'Next blueprint →';
  }

  function startBlueprint(mission: Mission): void {
    rememberBefore('Blueprint: ' + mission.title);
    activeMission = mission;
    state = startMission(state, mission);
    activeSlot = 'predicate';
    activeSnapSlot = 'predicate';
    recipeId = null;
    missionRevealed = false;
    snapStatus = '';
    status = '';
    render();
  }

  /** Called both by tapping a tray piece and dropping it onto a socket. */
  function fitSnapPiece(slot: string, value: string, destination: string): void {
    const fitsSocket = slot === destination || (slot === 'time' && destination === 'tense');
    if (!fitsSocket) {
      snapStatus = 'That piece does not fit this socket. Match the role labels first.';
      required<HTMLElement>('#snap-feedback').textContent = snapStatus;
      return;
    }
    if (slot === 'power') {
      const operator = slot === 'power' ? value as StudioOperator : 'negative';
      if (!OPERATOR_ORDER.includes(operator) || operator === 'past' || operator === 'future' ||
        !availableOperator(state, operator)) return;
      rememberBefore('Snap ' + OPERATOR_LABELS[operator].name);
      state = toggleOperator(state, operator);
      activeSlot = OPERATOR_LABELS[operator].slot;
      activeSnapSlot = 'power';
      recipeId = null;
      snapStatus = 'Power changed. Compare this with the blueprint goal.';
      render();
      return;
    }
    if (slot === 'time') {
      if (!TIME_CHOICES[state.action.tense].some((item) => item.value === value)) return;
      activeSnapSlot = 'tense';
      applyChoice('time', value);
    } else {
      const editSlot = slot as StudioSlot;
      if (!snapLanes().includes(editSlot) || !choices(state, editSlot).some((item) => item.value === value)) return;
      if (editSlot === 'tense' && state.pattern === 'action') {
        rememberBefore('Snap timeline');
        state = setSlot(state, 'tense', value);
        // A blueprint's PAST and FUTURE pieces include their canonical time
        // word; the advanced workshop can still choose other time expressions.
        if (value === 'past' || value === 'future') {
          state = normalizeStudio({ ...state, action: { ...state.action,
            time: value === 'past' ? 'yesterday' : 'tomorrow' } });
        }
        activeSlot = 'tense';
        activeSnapSlot = 'tense';
        recipeId = null;
        snapStatus = 'Timeline changed. Compare the new time with the goal.';
        render();
      } else {
        activeSnapSlot = editSlot;
        applyChoice(editSlot, value);
      }
    }
    if (!snapSolved()) snapStatus = 'Piece changed. Keep matching the blueprint sockets.';
    renderSnap();
  }

  function render(): void {
    renderRecipes();
    renderCanvas();
    renderPalette();
    renderInspector();
    renderResult();
    renderSnap();
    renderMissions();
    saveState(code, state);
  }

  function applyChoice(slot: StudioSlot | 'time', value: string): void {
    const oldArgument = state.action.argument;
    const oldModal = state.action.modal;
    rememberBefore(`Edit ${slot}`);
    if (slot === 'time') {
      const next = structuredClone(state);
      next.action.time = value as BuilderSelection['time'];
      if (value) next.action.frequency = '';
      state = normalizeStudio(next);
    } else {
      state = setSlot(state, slot, value);
      activeSlot = slot;
    }
    if (slot === 'predicate' || slot === 'agent') {
      if (oldArgument !== state.action.argument)
        adjustmentMessage = 'This subject/action cannot use the previous object; it was changed to ' + concept(state.action.argument) + '.';
      else if (oldModal && !state.action.modal)
        adjustmentMessage = 'The previous modal does not fit this verb, so it was removed.';
    }
    recipeId = null;
    status = '';
    render();
  }

  function editCompositeStep(index: number, field: string, value: string): void {
    if (!isCompositeField(field) || !clauseAt(state, index)) return;
    rememberBefore(`Edit step ${index + 1}`);
    state = editCompositeClause(state, index, field, value);
    recipeId = null;
    render();
  }

  const studio = required<HTMLElement>('#studio');
  studio.addEventListener('click', (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest<HTMLButtonElement>('button');
    if (!trigger || !studio.contains(trigger)) return;


    const missionFromBoard = trigger.dataset['snapMission'];
    if (missionFromBoard) {
      const mission = MISSIONS.find((item) => item.id === missionFromBoard);
      if (mission) startBlueprint(mission);
      return;
    }
    if (trigger.id === 'snap-next' && activeMission && snapSolved()) {
      const nextIndex = (MISSIONS.indexOf(activeMission) + 1) % MISSIONS.length;
      startBlueprint(MISSIONS[nextIndex]!);
      return;
    }
    if (trigger.id === 'snap-reset-goal' && activeMission) {
      startBlueprint(activeMission);
      return;
    }
    if (trigger.id === 'snap-free') {
      activeMission = null;
      snapStatus = '';
      render();
      return;
    }
    if (trigger.id === 'snap-lab') {
      workshop.open = true;
      workshop.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const snapSlot = trigger.dataset['snapSlot'] as StudioSlot | 'power' | undefined;
    if (snapSlot !== undefined) {
      if (!snapLanes().includes(snapSlot)) return;
      activeSnapSlot = snapSlot;
      if (snapSlot !== 'power') activeSlot = snapSlot;
      renderInspector();
      renderResult();
      renderSnap();
      return;
    }
    const snapFor = trigger.dataset['snapFor'];
    if (snapFor !== undefined) {
      fitSnapPiece(snapFor, trigger.dataset['snapValue'] ?? '', activeSnapSlot);
      return;
    }

    const recipe = trigger.dataset['recipe'];
    if (recipe) {
      const chosen = RECIPES.find((item) => item.id === recipe);
      if (!chosen) return;
      rememberBefore(`Pattern: ${chosen.title}`);
      state = applyRecipe(state, chosen);
      activeSlot = defaultSlot(state);
      recipeId = chosen.id;
      activeMission = null;
      render();
      return;
    }

    const slot = trigger.dataset['slot'] as StudioSlot | undefined;
    if (slot) { activeSlot = slot; renderCanvas(); renderInspector(); renderResult(); return; }

    const op = trigger.dataset['operator'] as StudioOperator | undefined;
    if (op && availableOperator(state, op)) {
      rememberBefore(`${OPERATOR_LABELS[op].name} block`);
      state = toggleOperator(state, op);
      activeSlot = state.pattern === 'description' && op === 'past'
        ? 'descriptionTense' : OPERATOR_LABELS[op].slot;
      recipeId = null;
      status = '';
      render();
      return;
    }

    if (trigger.dataset['addStep'] && state.pattern === 'sequence' && state.steps.length < 4) {
      rememberBefore('Add a story step');
      state = normalizeStudio({ ...state, steps: [...state.steps, { ...initialStudio().secondAction }] });
      activeSlot = `clause${state.steps.length - 1}` as StudioSlot;
      render();
      return;
    }
    const removeStep = trigger.dataset['removeStep'];
    if (removeStep !== undefined && state.pattern === 'sequence' && state.steps.length > 2) {
      rememberBefore('Remove a story step');
      state = normalizeStudio({ ...state, steps: state.steps.filter((_, index) => index !== Number(removeStep)) });
      activeSlot = 'clause0';
      render();
      return;
    }

    const choiceSlot = trigger.dataset['choiceSlot'] as StudioSlot | 'time' | undefined;
    if (choiceSlot !== undefined) {
      applyChoice(choiceSlot, trigger.dataset['choiceValue'] ?? '');
      return;
    }

    const remove = trigger.dataset['remove'] as StudioSlot | undefined;
    if (remove) { rememberBefore('Remove block'); state = removeSlot(state, remove); activeSlot = defaultSlot(state); render(); return; }

    const missionId = trigger.dataset['mission'];
    if (missionId) {
      const mission = MISSIONS.find((item) => item.id === missionId);
      if (!mission) return;
      rememberBefore(`Challenge: ${mission.title}`);
      startBlueprint(mission);
      return;
    }
    if (trigger.dataset['checkMission'] && activeMission) {
      status = matchesMission(state, activeMission)
        ? 'Correct! Your blocks express the goal.'
        : 'Not quite yet. Compare the goal with your subject, action, time and operators.';
      renderMissions();
      return;
    }
    if (trigger.dataset['revealMission'] && activeMission) {
      missionRevealed = !missionRevealed;
      renderMissions();
    }
  });

  studio.addEventListener('change', (event: Event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const { compositeIndex, compositeField } = event.target.dataset;
    if (compositeIndex === undefined || !compositeField) return;
    editCompositeStep(Number(compositeIndex), compositeField, event.target.value);
  });

  studio.addEventListener('input', (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const filter = event.target.value.trim().toLowerCase();
    if (event.target.id === 'snap-filter') {
      snap.querySelectorAll<HTMLButtonElement>('[data-snap-for]').forEach((button) => {
        button.hidden = !(button.textContent ?? '').toLowerCase().includes(filter);
      });
    } else if (event.target.id === 'studio-option-filter') {
      inspector.querySelectorAll<HTMLButtonElement>('[data-choice-slot]').forEach((button) => {
        button.hidden = !(button.textContent ?? '').toLowerCase().includes(filter);
      });
    }
  });

  // Desktop drag/drop is optional; every action is also available by tap and
  // keyboard. Reject mismatched socket types instead of silently changing meaning.
  studio.addEventListener('dragstart', (event: DragEvent) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-snap-for]') : null;
    if (!target || !snap.contains(target) || !event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', JSON.stringify({
      slot: target.dataset['snapFor'], value: target.dataset['snapValue'],
    }));
    event.dataTransfer.effectAllowed = 'copy';
  }, { signal });
  studio.addEventListener('dragover', (event: DragEvent) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-snap-slot]') : null;
    if (!target || !snap.contains(target)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }, { signal });
  studio.addEventListener('drop', (event: DragEvent) => {
    const target = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-snap-slot]') : null;
    if (!target || !snap.contains(target)) return;
    event.preventDefault();
    try {
      const data: unknown = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
      if (!data || typeof data !== 'object') return;
      const piece = data as Record<string, unknown>;
      if (typeof piece['slot'] !== 'string' || typeof piece['value'] !== 'string') return;
      const slot = target.dataset['snapSlot'];
      if (slot) fitSnapPiece(piece['slot'], piece['value'], slot);
    } catch { /* Ignore external invalid drags. */ }
  }, { signal });

  required<HTMLButtonElement>('#studio-reset').addEventListener('click', () => {
    rememberBefore('Reset');
    state = initialStudio();
    recipeId = null;
    activeMission = null;
    activeSlot = 'predicate';
    render();
  });
  showRecipes.addEventListener('click', () => { showAllRecipes = !showAllRecipes; renderRecipes(); });
  required<HTMLButtonElement>('#studio-swap').addEventListener('click', () => {
    rememberBefore('Swap vocabulary');
    if (state.pattern === 'action') {
      const valid = allowedArgumentsFor(state.action.predicate, state.action.agent);
      const nextIndex = (valid.indexOf(state.action.argument) + 1) % valid.length;
      const nextArgument = valid[nextIndex];
      if (nextArgument) state = setSlot(state, 'argument', nextArgument);
      activeSlot = 'argument';
    } else if (state.pattern === 'description') {
      const valid = DESCRIPTION_QUALITIES[state.descriptionThing];
      const next = valid[(valid.indexOf(state.quality as never) + 1) % valid.length];
      if (next) state = setSlot(state, 'quality', next);
      activeSlot = 'quality';
    } else if (state.pattern === 'presence') {
      const nextIndex = (PRESENCE_THINGS.indexOf(state.presenceThing) + 1) % PRESENCE_THINGS.length;
      const nextThing = PRESENCE_THINGS[nextIndex];
      if (nextThing) state = setSlot(state, 'presenceThing', nextThing);
      activeSlot = 'presenceThing';
    } else if (state.pattern === 'ask-when') {
      const frame = PREDICATES[state.action.predicate];
      const valid = frame.allowedArguments as readonly SemanticArgument[];
      const replacement = valid[(valid.indexOf(state.action.argument) + 1) % valid.length];
      if (replacement) state = setSlot(state, 'argument', replacement);
      activeSlot = 'argument';
    } else if (state.pattern === 'link' || state.pattern === 'sequence') {
      const index = isClauseSlot(activeSlot) ? Number(activeSlot.slice(-1)) : 0;
      const current = clauseAt(state, index);
      if (current) {
        const available = allowedArgumentsFor(current.predicate, current.agent);
        const replacement = available[(available.indexOf(current.argument) + 1) % available.length];
        if (replacement) editCompositeStep(index, 'argument', replacement);
      }
    } else { activeSlot = defaultSlot(state); }
    recipeId = null;
    render();
  });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(result.textContent ?? '');
      copy.textContent = 'Copied ✓';
    } catch {
      copy.textContent = 'Copy unavailable';
    }
  });

  render();
}
