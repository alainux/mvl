/**
 * A small visual programming model for human communication.
 *
 * StudioState stores *meaning*, never a translated sentence. The very same
 * state feeds the German, French and Spanish realizers. The UI is merely a
 * visual editor for these typed semantic structures.
 */
import { DEFAULT_SELECTION, askObject, describe, howToGet, makeTree, presence, price, where, } from '../core/algebra.js';
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
    return next;
}
export function studioExpression(state) {
    switch (state.pattern) {
        case 'action': return makeTree(state.action);
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
/** Rehydrate an authored/generated lesson example into its editable slots. */
export function fromExpression(expression) {
    const base = initialStudio();
    switch (expression.kind) {
        case 'clause': return normalizeStudio({ ...base, action: {
                ...base.action,
                predicate: expression.event.predicate,
                agent: expression.event.agent,
                argument: expression.event.argument,
                quantity: expression.event.quantity,
                tense: expression.tense,
                modal: expression.modality ?? '',
                negative: expression.negative,
                time: expression.time ?? '',
                frequency: expression.frequency ?? '',
                question: expression.question,
                polite: expression.polite,
                reason: 'none',
            } });
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
            // A two-clause lesson may use AND/BUT or an arbitrary reason. The visual
            // studio currently models only a small WHY operator, so never silently
            // drop a second clause when importing a lesson example.
            if (expression.connection !== 'because')
                return null;
            const first = fromExpression(expression.first);
            if (!first)
                return null;
            const second = expression.second;
            if (second.event.agent !== expression.first.event.agent || second.tense !== 'present')
                return null;
            const reason = second.event.predicate === 'have' && second.event.argument === 'time' && second.negative
                ? 'no_time'
                : second.event.predicate === 'be' && ['sick', 'busy'].includes(second.event.argument)
                    ? second.event.argument : null;
            if (reason === null)
                return null;
            first.action.reason = reason;
            return normalizeStudio(first);
        }
        default: return null;
    }
}
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
