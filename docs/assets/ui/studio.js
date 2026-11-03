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
import { CONCEPTS, DESCRIPTION_QUALITIES, LOCATABLE_PLACES, OBJECT_QUESTION_PREDICATES, PREDICATES, PRESENCE_THINGS, } from '../core/vocabulary.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
import { escapeHtml as escape, required } from './dom.js';
import { MISSIONS, RECIPES, applyRecipe, availableOperator, initialStudio, isPresent, operatorApplied, matchesMission, missionAnswer, normalizeStudio, startMission, studioExpression, toggleOperator, } from './studio-model.js';
import { ruleFor } from './studio-rules.js';
import { traceSurfaceOrder } from './surface-order.js';
export const REMIX_STORAGE_KEY = 'mvl:studio:remix';
const SUBJECT_CHOICES = [
    { value: 'speaker', label: 'I' },
    { value: 'addressee', label: 'You (formal)' },
    { value: 'we', label: 'We' },
    { value: 'other', label: 'He' },
];
const TIME_CHOICES = {
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
const FREQUENCY_CHOICES = [
    { value: '', label: 'Not recurring' }, { value: 'every_day', label: 'Every day' },
    { value: 'every_week', label: 'Every week' }, { value: 'often', label: 'Often' },
    { value: 'sometimes', label: 'Sometimes' },
];
const REASON_CHOICES = [
    { value: 'none', label: 'No reason' }, { value: 'sick', label: 'Because I am sick' },
    { value: 'busy', label: 'Because I am busy' }, { value: 'no_time', label: 'Because I have no time' },
];
const OPERATOR_LABELS = {
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
const OPERATOR_ORDER = [
    'past', 'future', 'can', 'want', 'must',
    'negative', 'question', 'polite', 'frequency', 'reason', 'quantity',
];
const SLOT_EXPLANATIONS = {
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
};
function concept(id) {
    return CONCEPTS[id] ?? id.replaceAll('_', ' ');
}
function visualBlocks(state) {
    if (state.pattern === 'description') {
        return [
            { slot: 'descriptionThing', title: 'THING', value: concept(state.descriptionThing), tone: 'object' },
            { slot: 'quality', title: 'QUALITY', value: concept(state.quality), tone: 'action' },
            ...(state.descriptionTense === 'past'
                ? [{ slot: 'descriptionTense', title: 'TIME', value: 'past', tone: 'time', optional: true }] : []),
            ...(state.descriptionNegative
                ? [{ slot: 'negative', title: 'OPERATOR', value: 'NOT', tone: 'operator', optional: true }] : []),
            ...(state.descriptionQuestion
                ? [{ slot: 'question', title: 'OPERATOR', value: 'QUESTION', tone: 'question', optional: true }] : []),
        ];
    }
    if (state.pattern === 'presence') {
        return [
            { slot: 'presenceThing', title: 'EXISTS', value: concept(state.presenceThing), tone: 'object' },
            { slot: 'presencePlace', title: 'WHERE', value: state.presencePlace ? concept(state.presencePlace) : 'anywhere', tone: 'time' },
            ...(state.presenceNegative
                ? [{ slot: 'negative', title: 'OPERATOR', value: 'NOT', tone: 'operator', optional: true }] : []),
            ...(state.presenceQuestion
                ? [{ slot: 'question', title: 'OPERATOR', value: 'QUESTION', tone: 'question', optional: true }] : []),
        ];
    }
    if (state.pattern === 'ask-object') {
        return [
            { slot: 'objectAgent', title: 'WHO', value: SUBJECT_CHOICES.find((item) => item.value === state.objectAgent)?.label ?? 'You', tone: 'person' },
            { slot: 'objectPredicate', title: 'ASK WHAT', value: PREDICATES[state.objectPredicate].description, tone: 'question' },
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
    const result = [
        { slot: 'agent', title: 'WHO', value: SUBJECT_CHOICES.find((item) => item.value === action.agent)?.label ?? 'I', tone: 'person' },
        { slot: 'predicate', title: 'ACTION', value: PREDICATES[action.predicate].description, tone: 'action' },
        { slot: 'argument', title: 'OBJECT / PLACE', value: concept(action.argument), tone: 'object' },
    ];
    if (isPresent(state, 'quantity'))
        result.push({ slot: 'quantity', title: 'COUNT', value: 'two', tone: 'object', optional: true });
    if (isPresent(state, 'tense'))
        result.push({ slot: 'tense', title: 'TIME', value: `${action.tense}${action.time ? ` · ${concept(action.time)}` : ''}`, tone: 'time', optional: true });
    if (isPresent(state, 'frequency'))
        result.push({ slot: 'frequency', title: 'HABIT', value: concept(action.frequency), tone: 'time', optional: true });
    if (isPresent(state, 'modal'))
        result.push({ slot: 'modal', title: 'MODAL', value: action.modal, tone: 'operator', optional: true });
    if (isPresent(state, 'negative'))
        result.push({ slot: 'negative', title: 'OPERATOR', value: 'NOT', tone: 'operator', optional: true });
    if (isPresent(state, 'question'))
        result.push({ slot: 'question', title: 'OPERATOR', value: 'QUESTION', tone: 'question', optional: true });
    if (isPresent(state, 'polite'))
        result.push({ slot: 'polite', title: 'OPERATOR', value: 'PLEASE', tone: 'question', optional: true });
    if (isPresent(state, 'reason'))
        result.push({ slot: 'reason', title: 'EXPLAIN', value: `because · ${action.reason.replaceAll('_', ' ')}`, tone: 'operator', optional: true });
    return result;
}
function blockMarkup(block, selected) {
    return `<button type="button" data-slot="${block.slot}" class="studio-block is-${block.tone} ${selected === block.slot ? 'is-selected' : ''}"
    aria-pressed="${selected === block.slot}" aria-label="Edit ${escape(block.title.toLowerCase())}: ${escape(block.value)}">
    <span class="studio-block-type">${escape(block.title)}</span>
    <strong>${escape(block.value)}</strong>
    <span class="studio-block-edit">EDIT <span aria-hidden="true">↗</span></span>
  </button>`;
}
function choices(state, slot) {
    const { action } = state;
    switch (slot) {
        case 'agent': return SUBJECT_CHOICES;
        case 'predicate': return Object.entries(PREDICATES).map(([value, frame]) => ({ value, label: frame.description }));
        case 'argument': return PREDICATES[action.predicate].allowedArguments
            .filter((id) => !(PREDICATES[action.predicate].argumentRole === 'person' && id === action.agent))
            .map((id) => ({ value: id, label: concept(id) }));
        case 'quantity': return [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }];
        case 'tense': return action.predicate === 'like'
            ? [{ value: 'present', label: 'Present' }]
            : [{ value: 'present', label: 'Present' }, { value: 'past', label: 'Completed past' }, { value: 'future', label: 'Future / plan' }];
        case 'modal': return [
            { value: '', label: 'No modal' },
            ...PREDICATES[action.predicate].allowedModalities.map((value) => ({ value, label: { can: 'Can', want: 'Want to', must: 'Must' }[value] ?? value })),
        ];
        case 'negative':
        case 'question':
        case 'polite': return [
            { value: 'false', label: 'Off' }, { value: 'true', label: 'On' },
        ];
        case 'reason': return REASON_CHOICES;
        case 'frequency': return FREQUENCY_CHOICES;
        case 'descriptionThing': return Object.keys(DESCRIPTION_QUALITIES).map((value) => ({ value, label: concept(value) }));
        case 'quality': return DESCRIPTION_QUALITIES[state.descriptionThing]
            .map((value) => ({ value, label: concept(value) }));
        case 'descriptionTense': return [{ value: 'present', label: 'Present' }, { value: 'past', label: 'Past' }];
        case 'presenceThing': return PRESENCE_THINGS.map((value) => ({ value, label: concept(value) }));
        case 'presencePlace': return [
            { value: '', label: 'Anywhere' }, { value: 'here', label: 'Here' },
            { value: 'station', label: 'At the station' }, { value: 'hotel', label: 'At the hotel' },
            { value: 'airport', label: 'At the airport' }, { value: 'city_center', label: 'In the city centre' },
        ];
        case 'objectPredicate': return OBJECT_QUESTION_PREDICATES.map((value) => ({ value, label: PREDICATES[value].description }));
        case 'objectAgent': return SUBJECT_CHOICES.filter(({ value }) => value === 'speaker' || value === 'addressee');
        case 'routePlace':
        case 'wherePlace': return LOCATABLE_PLACES.map((value) => ({ value, label: concept(value) }));
        case 'priceThing': return ['ticket', 'coffee', 'book', 'room', 'computer', 'bag', 'apartment']
            .map((value) => ({ value, label: concept(value) }));
    }
}
function currentValue(state, slot) {
    switch (slot) {
        case 'agent':
        case 'predicate':
        case 'argument':
        case 'quantity':
        case 'tense':
        case 'modal':
        case 'negative':
        case 'question':
        case 'polite':
        case 'reason':
        case 'frequency': {
            if (slot === 'negative' && state.pattern === 'description')
                return String(state.descriptionNegative);
            if (slot === 'negative' && state.pattern === 'presence')
                return String(state.presenceNegative);
            if (slot === 'question' && state.pattern === 'description')
                return String(state.descriptionQuestion);
            if (slot === 'question' && state.pattern === 'presence')
                return String(state.presenceQuestion);
            if (slot === 'tense' && state.pattern === 'description')
                return state.descriptionTense;
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
    }
}
function setSlot(state, slot, value) {
    const next = structuredClone(state);
    switch (slot) {
        case 'agent':
            next.action.agent = value;
            break;
        case 'predicate':
            next.action.predicate = value;
            break;
        case 'argument':
            next.action.argument = value;
            break;
        case 'quantity':
            next.action.quantity = Number(value);
            break;
        case 'tense':
            if (state.pattern === 'description') {
                next.descriptionTense = value;
                break;
            }
            next.action.tense = value;
            next.action.time = '';
            next.action.frequency = '';
            break;
        case 'modal':
            next.action.modal = value;
            break;
        case 'negative':
            if (state.pattern === 'description')
                next.descriptionNegative = value === 'true';
            else if (state.pattern === 'presence')
                next.presenceNegative = value === 'true';
            else
                next.action.negative = value === 'true';
            break;
        case 'question':
            if (state.pattern === 'description')
                next.descriptionQuestion = value === 'true';
            else if (state.pattern === 'presence')
                next.presenceQuestion = value === 'true';
            else {
                next.action.question = value === 'true';
                if (next.action.question)
                    next.action.reason = 'none';
            }
            break;
        case 'polite':
            next.action.polite = value === 'true';
            if (next.action.polite)
                next.action.question = true;
            break;
        case 'reason':
            next.action.reason = value;
            if (next.action.reason !== 'none') {
                next.action.question = false;
                next.action.polite = false;
            }
            break;
        case 'frequency':
            next.action.frequency = value;
            next.action.time = '';
            break;
        case 'descriptionThing':
            next.descriptionThing = value;
            break;
        case 'quality':
            next.quality = value;
            break;
        case 'descriptionTense':
            next.descriptionTense = value;
            break;
        case 'presenceThing':
            next.presenceThing = value;
            break;
        case 'presencePlace':
            next.presencePlace = value ? value : null;
            break;
        case 'objectPredicate':
            next.objectPredicate = value;
            break;
        case 'objectAgent':
            next.objectAgent = value;
            break;
        case 'routePlace':
            next.routePlace = value;
            break;
        case 'wherePlace':
            next.wherePlace = value;
            break;
        case 'priceThing':
            next.priceThing = value;
            break;
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
function contrastForSlot(state, slot) {
    if (slot === 'descriptionTense') {
        return setSlot(state, slot, state.descriptionTense === 'past' ? 'present' : 'past');
    }
    const visible = visualBlocks(state).find((block) => block.slot === slot);
    if (visible?.optional)
        return removeSlot(state, slot);
    const options = choices(state, slot);
    const current = currentValue(state, slot);
    const alternative = options.find((choice) => choice.value !== current);
    return alternative ? setSlot(state, slot, alternative.value) : null;
}
function removeSlot(state, slot) {
    switch (slot) {
        case 'tense': return setSlot(state, 'tense', 'present');
        case 'modal':
        case 'frequency': return setSlot(state, slot, '');
        case 'quantity': return setSlot(state, 'quantity', '1');
        case 'negative':
        case 'question':
        case 'polite': return setSlot(state, slot, 'false');
        case 'reason': return setSlot(state, slot, 'none');
        default: return state;
    }
}
function isState(value) {
    if (!value || typeof value !== 'object')
        return false;
    const record = value;
    return ['action', 'description', 'presence', 'ask-object', 'route', 'where', 'price'].includes(String(record['pattern']))
        && typeof record['action'] === 'object' && record['action'] !== null
        && typeof record['action']['predicate'] === 'string';
}
function readState(code) {
    try {
        const remix = sessionStorage.getItem(REMIX_STORAGE_KEY);
        if (remix) {
            sessionStorage.removeItem(REMIX_STORAGE_KEY);
            const parsed = JSON.parse(remix);
            if (isState(parsed))
                return normalizeStudio(parsed);
        }
        const saved = localStorage.getItem(`mvl:studio:${code}`) ?? localStorage.getItem('mvl:studio:last');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (isState(parsed))
                return normalizeStudio(parsed);
        }
    }
    catch { /* Storage can be disabled, or the saved model might be outdated. */ }
    return initialStudio();
}
function saveState(code, state) {
    try {
        const encoded = JSON.stringify(state);
        localStorage.setItem(`mvl:studio:${code}`, encoded);
        localStorage.setItem('mvl:studio:last', encoded);
    }
    catch { /* Offline learning works without storage. */ }
}
function defaultSlot(state) {
    switch (state.pattern) {
        case 'action': return 'predicate';
        case 'description': return 'quality';
        case 'presence': return 'presenceThing';
        case 'ask-object': return 'objectPredicate';
        case 'route': return 'routePlace';
        case 'where': return 'wherePlace';
        case 'price': return 'priceThing';
    }
}
/** A screen instance stays mounted until the hash route changes. */
export function initializeStudio(code) {
    let state = readState(code);
    let activeSlot = defaultSlot(state);
    let recipeId = null;
    let showAllRecipes = false;
    let activeMission = null;
    let missionRevealed = false;
    let status = '';
    let priorOutput = null;
    let lastChange = '';
    const canvas = required('#studio-blocks');
    const palette = required('#studio-palette');
    const inspector = required('#studio-inspector-body');
    const recipes = required('#studio-recipes-list');
    const missions = required('#studio-missions');
    const result = required('#studio-result');
    const orderedWords = required('#studio-order-words');
    const orderedHint = required('#studio-order-hint');
    const orderedLanguage = required('#studio-order-language');
    const delta = required('#studio-delta');
    const meaning = required('#studio-english');
    const note = required('#studio-grammar-note');
    const error = required('#studio-error');
    const feedback = required('#studio-mission-feedback');
    const copy = required('#studio-copy');
    const showRecipes = required('#studio-show-recipes');
    function renderRecipes() {
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
    function renderCanvas() {
        const blocks = visualBlocks(state);
        const markup = blocks.map((block, index) => `${index > 0 ? '<span class="studio-join" aria-hidden="true">⊕</span>' : ''}${blockMarkup(block, activeSlot)}`).join('');
        canvas.innerHTML = `${markup}<p class="studio-canvas-caption">${blocks.length} meaning ingredients · ⊕ means “combine meanings”, not “put these words in this order”</p>`;
    }
    function renderPalette() {
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
    function renderInspector() {
        const block = visualBlocks(state).find((item) => item.slot === activeSlot);
        if (!block) {
            activeSlot = visualBlocks(state)[0]?.slot ?? 'predicate';
        }
        const current = visualBlocks(state).find((item) => item.slot === activeSlot);
        if (!current)
            return;
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
    function rememberBefore(label) {
        try {
            priorOutput = linearize(studioExpression(state), code);
        }
        catch {
            priorOutput = null;
        }
        lastChange = label;
    }
    function renderResult() {
        try {
            const expression = studioExpression(state);
            const current = linearize(expression, code);
            result.textContent = current;
            result.lang = code;
            // Show the *spoken* word order separately from the semantic ingredients.
            // A contrast with the selected block highlights its actual surface effect.
            let comparison = null;
            try {
                const alternative = contrastForSlot(state, activeSlot);
                if (alternative)
                    comparison = linearize(studioExpression(alternative), code);
            }
            catch {
                // Some slots have no alternative in a particular construction.
            }
            const tokens = traceSurfaceOrder(current, comparison);
            orderedLanguage.textContent = { de: '· German', fr: '· French', es: '· Spanish' }[code];
            orderedWords.lang = code;
            orderedWords.innerHTML = tokens.map((token) => `
        <span class="studio-order-word ${token.affected ? 'is-affected' : ''}">${escape(token.text)}</span>
      `).join('');
            const selectedBlock = visualBlocks(state).find((block) => block.slot === activeSlot);
            const affectedCount = tokens.filter((token) => token.affected).length;
            orderedHint.textContent = affectedCount > 0 && selectedBlock
                ? `Highlighted: words affected by ${selectedBlock.value}. Select another meaning block to inspect its effect.`
                : 'These words are in the order you would say them. Select a meaning block to inspect what it changes.';
            delta.hidden = !(priorOutput && priorOutput !== current);
            if (!delta.hidden && priorOutput) {
                required('#studio-delta-content').innerHTML = `
          <div><small>BEFORE</small><span lang="${code}">${escape(priorOutput)}</span></div>
          <span aria-hidden="true" class="studio-delta-arrow">→</span>
          <div><small>${escape(lastChange.toUpperCase())}</small><strong lang="${code}">${escape(current)}</strong></div>`;
            }
            meaning.textContent = realizeEnglish(expression);
            note.textContent = ruleFor(state, code, activeSlot);
            required('#studio-notation').textContent = notation(expression);
            const other = ['de', 'fr', 'es'].filter((language) => language !== code);
            required('#studio-other-languages').innerHTML = `<span class="micro-label">SAME BLOCKS, DIFFERENT LANGUAGE</span>
        ${other.map((language) => `<div><small>${{ de: 'German', fr: 'French', es: 'Spanish' }[language]}</small>
          <strong lang="${language}">${escape(linearize(expression, language))}</strong></div>`).join('')}`;
            copy.disabled = false;
            error.hidden = true;
        }
        catch (cause) {
            result.textContent = 'This combination is not supported.';
            meaning.textContent = '';
            orderedWords.textContent = '';
            orderedHint.textContent = 'This combination could not be realized.';
            copy.disabled = true;
            error.textContent = cause instanceof Error ? cause.message : 'Unsupported grammar combination.';
            error.hidden = false;
        }
    }
    function renderMissions() {
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
        }
        else if (matchesMission(state, activeMission)) {
            feedback.innerHTML = '<span class="studio-mission-success">✓ You built the intended meaning. Try changing one more block.</span>';
        }
        else {
            feedback.innerHTML = `<p>${status ? escape(status) : 'Edit the blocks above until they express the goal.'}</p>
        <button type="button" data-check-mission="true" class="button secondary">Check my blocks</button>
        <button type="button" data-reveal-mission="true" class="studio-text-button">${missionRevealed ? 'Hide answer ↑' : 'See one solution ↓'}</button>
        ${missionRevealed ? `<div class="studio-mission-answer" lang="${code}">${escape(linearize(missionAnswer(activeMission), code))}</div>` : ''}`;
        }
    }
    function render() {
        renderRecipes();
        renderCanvas();
        renderPalette();
        renderInspector();
        renderResult();
        renderMissions();
        saveState(code, state);
    }
    function applyChoice(slot, value) {
        rememberBefore(`Edit ${slot}`);
        if (slot === 'time') {
            const next = structuredClone(state);
            next.action.time = value;
            if (value)
                next.action.frequency = '';
            state = normalizeStudio(next);
        }
        else {
            state = setSlot(state, slot, value);
            activeSlot = slot;
        }
        recipeId = null;
        status = '';
        render();
    }
    const studio = required('#studio');
    studio.addEventListener('click', (event) => {
        if (!(event.target instanceof Element))
            return;
        const trigger = event.target.closest('button');
        if (!trigger || !studio.contains(trigger))
            return;
        const recipe = trigger.dataset['recipe'];
        if (recipe) {
            const chosen = RECIPES.find((item) => item.id === recipe);
            if (!chosen)
                return;
            rememberBefore(`Pattern: ${chosen.title}`);
            state = applyRecipe(state, chosen);
            activeSlot = defaultSlot(state);
            recipeId = chosen.id;
            activeMission = null;
            render();
            return;
        }
        const slot = trigger.dataset['slot'];
        if (slot) {
            activeSlot = slot;
            renderCanvas();
            renderInspector();
            renderResult();
            return;
        }
        const op = trigger.dataset['operator'];
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
        const choiceSlot = trigger.dataset['choiceSlot'];
        if (choiceSlot !== undefined) {
            applyChoice(choiceSlot, trigger.dataset['choiceValue'] ?? '');
            return;
        }
        const remove = trigger.dataset['remove'];
        if (remove) {
            rememberBefore('Remove block');
            state = removeSlot(state, remove);
            activeSlot = defaultSlot(state);
            render();
            return;
        }
        const missionId = trigger.dataset['mission'];
        if (missionId) {
            const mission = MISSIONS.find((item) => item.id === missionId);
            if (!mission)
                return;
            rememberBefore(`Challenge: ${mission.title}`);
            activeMission = mission;
            state = startMission(state, mission);
            recipeId = null;
            activeSlot = 'predicate';
            missionRevealed = false;
            status = '';
            render();
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
    studio.addEventListener('input', (event) => {
        if (!(event.target instanceof HTMLInputElement) || event.target.id !== 'studio-option-filter')
            return;
        const filter = event.target.value.trim().toLowerCase();
        inspector.querySelectorAll('[data-choice-slot]').forEach((button) => {
            button.hidden = !(button.textContent ?? '').toLowerCase().includes(filter);
        });
    });
    required('#studio-reset').addEventListener('click', () => {
        rememberBefore('Reset');
        state = initialStudio();
        recipeId = null;
        activeMission = null;
        activeSlot = 'predicate';
        render();
    });
    showRecipes.addEventListener('click', () => { showAllRecipes = !showAllRecipes; renderRecipes(); });
    required('#studio-swap').addEventListener('click', () => {
        rememberBefore('Swap vocabulary');
        if (state.pattern === 'action') {
            const frame = PREDICATES[state.action.predicate];
            const valid = frame.allowedArguments
                .filter((id) => !(frame.argumentRole === 'person' && id === state.action.agent));
            const nextIndex = (valid.indexOf(state.action.argument) + 1) % valid.length;
            const nextArgument = valid[nextIndex];
            if (nextArgument)
                state = setSlot(state, 'argument', nextArgument);
            activeSlot = 'argument';
        }
        else if (state.pattern === 'description') {
            const valid = DESCRIPTION_QUALITIES[state.descriptionThing];
            const next = valid[(valid.indexOf(state.quality) + 1) % valid.length];
            if (next)
                state = setSlot(state, 'quality', next);
            activeSlot = 'quality';
        }
        else if (state.pattern === 'presence') {
            const nextIndex = (PRESENCE_THINGS.indexOf(state.presenceThing) + 1) % PRESENCE_THINGS.length;
            const nextThing = PRESENCE_THINGS[nextIndex];
            if (nextThing)
                state = setSlot(state, 'presenceThing', nextThing);
            activeSlot = 'presenceThing';
        }
        else {
            activeSlot = defaultSlot(state);
        }
        recipeId = null;
        render();
    });
    copy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(result.textContent ?? '');
            copy.textContent = 'Copied ✓';
        }
        catch {
            copy.textContent = 'Copy unavailable';
        }
    });
    render();
}
