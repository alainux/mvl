/**
 * A small visual programming model for human communication.
 *
 * StudioState stores *meaning*, never a translated sentence. The very same
 * state feeds the German, French and Spanish realizers. The UI is merely a
 * visual editor for these typed semantic structures.
 */
import { DEFAULT_SELECTION, askObject, askWhen, link, sequence, describe, howToGet, makeTree, presence, price, where, } from '../core/algebra.js';
import { COUNTABLE_THINGS, DESCRIPTION_QUALITIES, PREDICATES, } from '../core/vocabulary.js';
/** The gallery stores semantic configurations, not translations. */
export const RECIPES = [
    { id: 'need', title: 'Say what you need', intent: 'NEED + OBJECT', pattern: 'action',
        start: {}, action: { predicate: 'need', agent: 'speaker', argument: 'help' } },
    { id: 'past', title: 'Talk about yesterday', intent: 'PAST + ACTION', pattern: 'action',
        start: {}, action: { predicate: 'buy', agent: 'speaker', argument: 'ticket', tense: 'past', time: 'yesterday' } },
    { id: 'future', title: 'Make a plan', intent: 'FUTURE + ACTION', pattern: 'action',
        start: {}, action: { predicate: 'go', agent: 'we', argument: 'station', tense: 'future', time: 'tomorrow' } },
    { id: 'request', title: 'Ask for help', intent: 'CAN + QUESTION + PLEASE', pattern: 'action',
        start: {}, action: { predicate: 'help', agent: 'addressee', argument: 'speaker', modal: 'can', question: true, polite: true } },
    { id: 'reason', title: 'Explain a problem', intent: 'NOT + BECAUSE', pattern: 'action',
        start: {}, action: { predicate: 'come', agent: 'speaker', argument: 'none', negative: true, reason: 'busy' } },
    { id: 'habit', title: 'Describe a habit', intent: 'ACTION + FREQUENCY', pattern: 'action',
        start: {}, action: { predicate: 'study', agent: 'speaker', argument: 'german', frequency: 'every_day' } },
    { id: 'description', title: 'Describe something', intent: 'THING + QUALITY', pattern: 'description',
        start: { descriptionThing: 'room', quality: 'small' } },
    { id: 'nearby', title: 'Ask what is nearby', intent: 'EXISTS + QUESTION', pattern: 'presence',
        start: { presenceThing: 'pharmacy', presencePlace: 'here', presenceQuestion: true } },
    { id: 'what', title: 'Ask what someone wants', intent: 'QUESTION + OBJECT', pattern: 'ask-object',
        start: { objectPredicate: 'would_like', objectAgent: 'addressee' } },
    { id: 'directions', title: 'Ask for directions', intent: 'ROUTE + PLACE', pattern: 'route',
        start: { routePlace: 'station' } },
    { id: 'where', title: 'Find a place', intent: 'WHERE + PLACE', pattern: 'where',
        start: { wherePlace: 'pharmacy' } },
    { id: 'price', title: 'Ask the price', intent: 'PRICE + THING', pattern: 'price',
        start: { priceThing: 'ticket' } },
    { id: 'when', title: 'Ask when something happens', intent: 'WHEN + ACTION', pattern: 'ask-when',
        start: {}, action: { predicate: 'return', agent: 'addressee', argument: 'none', modal: '', question: false, polite: false } },
    { id: 'connect', title: 'Connect two statements', intent: 'STATEMENT + BUT + STATEMENT', pattern: 'link',
        start: { connection: 'but', secondAction: { ...DEFAULT_SELECTION,
                predicate: 'have', agent: 'speaker', argument: 'money', modal: '',
                negative: true, question: false, polite: false } },
        action: { predicate: 'need', agent: 'speaker', argument: 'ticket', modal: '', question: false, polite: false } },
    { id: 'story', title: 'Tell a three-step story', intent: 'ACTION + ACTION + ACTION', pattern: 'sequence',
        start: { steps: [
                { ...DEFAULT_SELECTION, predicate: 'work', agent: 'speaker', argument: 'none', modal: '',
                    tense: 'past', time: 'yesterday', question: false, polite: false },
                { ...DEFAULT_SELECTION, predicate: 'be', agent: 'speaker', argument: 'tired', modal: '', question: false, polite: false },
                { ...DEFAULT_SELECTION, predicate: 'sleep', agent: 'speaker', argument: 'none', modal: '',
                    tense: 'future', time: 'tonight', question: false, polite: false },
            ] }, action: { predicate: 'work', agent: 'speaker', argument: 'none', modal: '', question: false, polite: false } },
];
/** A mission has a starting *meaning* and a target *meaning*, not answer text. */
export const MISSIONS = [
    {
        id: 'yesterday', title: 'Change the timeline',
        description: 'Make this a completed action from yesterday.',
        start: { predicate: 'buy', agent: 'speaker', argument: 'ticket' },
        target: { predicate: 'buy', agent: 'speaker', argument: 'ticket', tense: 'past', time: 'yesterday' },
        mustMatch: ['predicate', 'agent', 'argument', 'tense', 'time'],
    },
    {
        id: 'tomorrow', title: 'Make a future plan',
        description: 'Say that we must work tomorrow.',
        start: { predicate: 'work', agent: 'we', argument: 'none' },
        target: { predicate: 'work', agent: 'we', argument: 'none', modal: 'must', tense: 'future', time: 'tomorrow' },
        mustMatch: ['predicate', 'agent', 'argument', 'modal', 'tense', 'time'],
    },
    {
        id: 'polite', title: 'Make a polite request',
        description: 'Ask formally if someone can help you, politely.',
        start: { predicate: 'help', agent: 'addressee', argument: 'speaker' },
        target: { predicate: 'help', agent: 'addressee', argument: 'speaker', modal: 'can', question: true, polite: true },
        mustMatch: ['predicate', 'agent', 'argument', 'modal', 'question', 'polite'],
    },
    {
        id: 'because', title: 'Explain why',
        description: 'Say you cannot come because you are busy.',
        start: { predicate: 'come', agent: 'speaker', argument: 'none' },
        target: { predicate: 'come', agent: 'speaker', argument: 'none', modal: 'can', negative: true, reason: 'busy' },
        mustMatch: ['predicate', 'agent', 'argument', 'modal', 'negative', 'reason'],
    },
];
export function initialStudio() {
    return {
        pattern: 'action',
        action: { ...DEFAULT_SELECTION, predicate: 'need', agent: 'speaker', argument: 'help',
            modal: '', question: false, polite: false },
        descriptionThing: 'room', quality: 'small', descriptionTense: 'present',
        descriptionNegative: false, descriptionQuestion: false,
        presenceThing: 'pharmacy', presencePlace: 'here',
        presenceNegative: false, presenceQuestion: false,
        objectPredicate: 'need', objectAgent: 'addressee', routePlace: 'station',
        wherePlace: 'pharmacy', priceThing: 'ticket',
        connection: 'and',
        secondAction: { ...DEFAULT_SELECTION, predicate: 'work', agent: 'speaker', argument: 'none',
            modal: '', question: false, polite: false },
        steps: [
            { ...DEFAULT_SELECTION, predicate: 'work', agent: 'speaker', argument: 'none',
                modal: '', question: false, polite: false },
            { ...DEFAULT_SELECTION, predicate: 'sleep', agent: 'speaker', argument: 'none',
                modal: '', question: false, polite: false },
        ],
    };
}
export function applyRecipe(current, recipe) {
    const next = {
        ...current,
        ...recipe.start,
        pattern: recipe.pattern,
        action: { ...initialStudio().action, ...recipe.action },
    };
    return normalizeStudio(next);
}
const HABITUAL = new Set([
    'work', 'study', 'read', 'write', 'cook', 'sleep', 'take',
    'drink', 'eat', 'wait', 'use', 'meet', 'go', 'speak',
]);
/** Only object-taking predicates can receive a numeric quantity block. */
export function canCount(predicate, argument) {
    return PREDICATES[predicate].argumentRole === 'thing' && predicate !== 'like'
        && COUNTABLE_THINGS.includes(argument);
}
/**
 * Normalization removes now-incompatible blocks after an edit. It does not
 * invent translations or change the meaning of a supported combination.
 */
export function normalizeStudio(state) {
    const next = structuredClone(state);
    const selection = next.action;
    const frame = PREDICATES[selection.predicate];
    const argumentsForFrame = frame.allowedArguments
        .filter((id) => !(frame.argumentRole === 'person' && (id === selection.agent ||
        (selection.agent === 'we' && id === 'speaker') ||
        (selection.agent === 'speaker' && id === 'we'))));
    if (!argumentsForFrame.includes(selection.argument)) {
        selection.argument = argumentsForFrame[0] ?? selection.argument;
    }
    if (!canCount(selection.predicate, selection.argument))
        selection.quantity = 1;
    if (selection.modal && !frame.allowedModalities.includes(selection.modal)) {
        selection.modal = '';
    }
    if (selection.predicate === 'like') {
        selection.tense = 'present';
        selection.time = '';
    }
    const timeByTense = {
        present: ['', 'now', 'today', 'this_week'],
        past: ['', 'yesterday', 'last_week', 'last_month'],
        future: ['', 'tomorrow', 'next_week', 'next_month', 'soon', 'tonight'],
    };
    if (!timeByTense[selection.tense].includes(selection.time))
        selection.time = '';
    if (selection.tense !== 'present' || !HABITUAL.has(selection.predicate))
        selection.frequency = '';
    if (selection.frequency)
        selection.time = '';
    if (selection.time)
        selection.frequency = '';
    if (!selection.question)
        selection.polite = false;
    if (selection.question)
        selection.reason = 'none';
    if (!DESCRIPTION_QUALITIES[next.descriptionThing].includes(next.quality)) {
        next.quality = DESCRIPTION_QUALITIES[next.descriptionThing][0];
    }
    if (next.pattern === 'ask-when') {
        selection.time = '';
        selection.frequency = '';
        selection.question = false;
        selection.polite = false;
        selection.reason = 'none';
    }
    if (next.pattern === 'link' || next.pattern === 'sequence') {
        // Child clauses use the same validation as ordinary sentence blocks.
        // A story can change each action independently without modifying others.
        const normalizeChild = (child) => {
            const safe = normalizeStudio({ ...initialStudio(), pattern: 'action',
                action: { ...child, question: false, polite: false, reason: 'none' } });
            return safe.action;
        };
        next.action = normalizeChild(next.action);
        next.secondAction = normalizeChild(next.secondAction);
        next.steps = next.steps.map(normalizeChild);
    }
    return next;
}
export function isCompositeField(value) {
    return ['agent', 'predicate', 'argument', 'tense', 'time', 'negative'].includes(value);
}
/**
 * Edit one child of a multi-clause expression. The other children are copied
 * unchanged, and the usual predicate-frame rules validate the edited child.
 */
export function editCompositeClause(state, index, field, value) {
    if (state.pattern !== 'link' && state.pattern !== 'sequence') {
        throw new TypeError('Composite editing requires a connected statement or story');
    }
    const next = structuredClone(state);
    const current = next.pattern === 'link'
        ? index === 0 ? next.action : index === 1 ? next.secondAction : undefined
        : next.steps[index];
    if (!current)
        throw new RangeError(`Unknown statement ${index + 1}`);
    const edited = { ...current };
    switch (field) {
        case 'agent':
            edited.agent = value;
            break;
        case 'predicate':
            edited.predicate = value;
            break;
        case 'argument':
            edited.argument = value;
            break;
        case 'tense':
            edited.tense = value;
            edited.time = '';
            edited.frequency = '';
            break;
        case 'time':
            edited.time = value;
            break;
        case 'negative':
            edited.negative = value === 'true';
            break;
    }
    if (next.pattern === 'link') {
        if (index === 0)
            next.action = edited;
        else
            next.secondAction = edited;
    }
    else {
        next.steps[index] = edited;
    }
    return normalizeStudio(next);
}
/** Reuse the core compiler's validation for every sentence inside a larger tree. */
export function clauseFromSelection(selection) {
    const expression = makeTree({ ...selection, question: false, polite: false, reason: 'none' });
    if (expression.kind !== 'clause')
        throw new TypeError('Expected a simple statement');
    return expression;
}
export function studioExpression(state) {
    switch (state.pattern) {
        case 'action': return makeTree(state.action);
        case 'ask-when': return askWhen(clauseFromSelection({ ...state.action, time: '', frequency: '' }));
        case 'link': return link(clauseFromSelection(state.action), state.connection, clauseFromSelection(state.secondAction));
        case 'sequence': return sequence(...state.steps.map(clauseFromSelection));
        case 'description': return describe(state.descriptionThing, state.quality, {
            tense: state.descriptionTense, negative: state.descriptionNegative, question: state.descriptionQuestion,
        });
        case 'presence': return presence(state.presenceThing, state.presencePlace, {
            negative: state.presenceNegative, question: state.presenceQuestion,
        });
        case 'ask-object': return askObject(state.objectPredicate, state.objectAgent);
        case 'route': return howToGet(state.routePlace);
        case 'where': return where(state.wherePlace);
        case 'price': return price(state.priceThing);
    }
}
export function availableOperator(state, operator) {
    if (state.pattern === 'description')
        return operator === 'past' || operator === 'negative' || operator === 'question';
    if (state.pattern === 'presence')
        return operator === 'negative' || operator === 'question';
    if (state.pattern !== 'action')
        return false;
    const selection = state.action;
    switch (operator) {
        case 'past':
        case 'future': return selection.predicate !== 'like';
        case 'can':
        case 'want':
        case 'must':
            return PREDICATES[selection.predicate].allowedModalities.includes(operator);
        case 'negative':
        case 'question': return true;
        case 'polite': return selection.agent === 'addressee';
        case 'frequency': return HABITUAL.has(selection.predicate) && selection.tense === 'present';
        case 'reason': return !selection.question;
        case 'quantity': return canCount(selection.predicate, selection.argument);
    }
}
/** Palette clicks are AST operations. An active optional block toggles off. */
export function toggleOperator(state, operator) {
    if (!availableOperator(state, operator))
        return state;
    const next = structuredClone(state);
    if (state.pattern === 'description') {
        if (operator === 'past')
            next.descriptionTense = state.descriptionTense === 'past' ? 'present' : 'past';
        if (operator === 'negative')
            next.descriptionNegative = !state.descriptionNegative;
        if (operator === 'question')
            next.descriptionQuestion = !state.descriptionQuestion;
        return next;
    }
    if (state.pattern === 'presence') {
        if (operator === 'negative')
            next.presenceNegative = !state.presenceNegative;
        if (operator === 'question')
            next.presenceQuestion = !state.presenceQuestion;
        return next;
    }
    const selection = next.action;
    switch (operator) {
        case 'past': {
            const past = selection.tense === 'past';
            selection.tense = past ? 'present' : 'past';
            selection.time = past ? '' : 'yesterday';
            selection.frequency = '';
            break;
        }
        case 'future': {
            const future = selection.tense === 'future';
            selection.tense = future ? 'present' : 'future';
            selection.time = future ? '' : 'tomorrow';
            selection.frequency = '';
            break;
        }
        case 'can':
        case 'want':
        case 'must':
            selection.modal = selection.modal === operator ? '' : operator;
            break;
        case 'negative':
            selection.negative = !selection.negative;
            break;
        case 'question':
            selection.question = !selection.question;
            if (selection.question)
                selection.reason = 'none';
            if (!selection.question)
                selection.polite = false;
            break;
        case 'polite':
            selection.polite = !selection.polite;
            if (selection.polite) {
                selection.question = true;
                selection.reason = 'none';
            }
            break;
        case 'frequency':
            selection.frequency = selection.frequency ? '' : 'every_day';
            selection.time = '';
            break;
        case 'reason':
            selection.reason = selection.reason === 'none' ? 'busy' : 'none';
            break;
        case 'quantity':
            selection.quantity = selection.quantity === 1 ? 2 : 1;
            break;
    }
    return normalizeStudio(next);
}
export function matchesMission(state, mission) {
    if (state.pattern !== 'action')
        return false;
    const target = { ...initialStudio().action, ...mission.target };
    // Extra operators change the meaning too; a mission is only complete when
    // the whole selection agrees, not just its headline slots.
    return Object.keys(target)
        .every((key) => state.action[key] === target[key]);
}
export function startMission(state, mission) {
    return normalizeStudio({ ...state, pattern: 'action',
        action: { ...initialStudio().action, ...mission.start } });
}
/** Recover an editable action from a semantic clause without losing its operators. */
function fromClause(value) {
    return {
        ...initialStudio().action,
        predicate: value.event.predicate,
        agent: value.event.agent,
        argument: value.event.argument,
        quantity: value.event.quantity,
        tense: value.tense,
        modal: value.modality ?? '',
        negative: value.negative,
        time: value.time ?? '',
        frequency: value.frequency ?? '',
        question: value.question,
        polite: value.polite,
        reason: 'none',
    };
}
/**
 * Import *all* productive lesson expressions as editable programs. This is a
 * structural inverse of studioExpression, not an attempt to parse sentences.
 * Conventional greetings have no AST and are deliberately excluded.
 */
export function fromExpression(expression) {
    const base = initialStudio();
    switch (expression.kind) {
        case 'clause': return normalizeStudio({ ...base, pattern: 'action', action: fromClause(expression) });
        case 'ask_when': return normalizeStudio({ ...base, pattern: 'ask-when', action: fromClause(expression.value) });
        case 'sequence': return normalizeStudio({ ...base, pattern: 'sequence',
            steps: expression.steps.map(fromClause) });
        case 'describe': return { ...base, pattern: 'description', descriptionThing: expression.thing,
            quality: expression.quality, descriptionTense: expression.tense,
            descriptionNegative: expression.negative, descriptionQuestion: expression.question };
        case 'presence': return { ...base, pattern: 'presence', presenceThing: expression.thing,
            presencePlace: expression.place, presenceNegative: expression.negative,
            presenceQuestion: expression.question };
        case 'ask_object': return { ...base, pattern: 'ask-object', objectPredicate: expression.predicate,
            objectAgent: expression.agent };
        case 'route': return { ...base, pattern: 'route', routePlace: expression.place };
        case 'where': return { ...base, pattern: 'where', wherePlace: expression.place };
        case 'price': return { ...base, pattern: 'price', priceThing: expression.thing };
        case 'link': {
            // Common short reasons are also available as a single WHY operator.
            if (expression.connection === 'because') {
                const second = expression.second;
                if (second.event.agent === expression.first.event.agent && second.tense === 'present') {
                    const reason = second.event.predicate === 'have' && second.event.argument === 'time' && second.negative
                        ? 'no_time'
                        : second.event.predicate === 'be' && ['sick', 'busy'].includes(second.event.argument)
                            ? second.event.argument : null;
                    if (reason !== null)
                        return normalizeStudio({ ...base, pattern: 'action', action: {
                                ...fromClause(expression.first), reason,
                            } });
                }
            }
            return normalizeStudio({ ...base, pattern: 'link', connection: expression.connection,
                action: fromClause(expression.first), secondAction: fromClause(expression.second) });
        }
    }
}
/** Construct a challenge answer from the same semantics as the editor. */
export function missionAnswer(mission) {
    return studioExpression(normalizeStudio({
        ...initialStudio(), pattern: 'action',
        action: { ...initialStudio().action, ...mission.target },
    }));
}
/** Full descriptive text is in the UI, so the engine stays language-neutral. */
export function isPresent(state, slot) {
    const a = state.action;
    switch (slot) {
        case 'tense': return state.pattern === 'action' && (a.tense !== 'present' || Boolean(a.time));
        case 'modal': return state.pattern === 'action' && Boolean(a.modal);
        case 'negative': return state.pattern === 'action' ? a.negative : state.pattern === 'description'
            ? state.descriptionNegative : state.presenceNegative;
        case 'question': return state.pattern === 'action' ? a.question : state.pattern === 'description'
            ? state.descriptionQuestion : state.presenceQuestion;
        case 'polite': return a.polite;
        case 'frequency': return Boolean(a.frequency);
        case 'reason': return a.reason !== 'none';
        case 'quantity': return a.quantity === 2;
        default: return true;
    }
}
/** Which palette blocks are currently installed on the meaning tree? */
export function operatorApplied(state, operator) {
    if (state.pattern === 'description') {
        return operator === 'past' ? state.descriptionTense === 'past'
            : operator === 'negative' ? state.descriptionNegative
                : operator === 'question' && state.descriptionQuestion;
    }
    if (state.pattern === 'presence') {
        return operator === 'negative' ? state.presenceNegative
            : operator === 'question' && state.presenceQuestion;
    }
    if (state.pattern !== 'action')
        return false;
    const value = state.action;
    switch (operator) {
        case 'past': return value.tense === 'past';
        case 'future': return value.tense === 'future';
        case 'can':
        case 'want':
        case 'must': return value.modal === operator;
        case 'negative': return value.negative;
        case 'question': return value.question;
        case 'polite': return value.polite;
        case 'frequency': return Boolean(value.frequency);
        case 'reason': return value.reason !== 'none';
        case 'quantity': return value.quantity === 2;
    }
}
