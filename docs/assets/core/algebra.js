import { PREDICATES } from './vocabulary.js';
function invalid(message) {
    throw new TypeError(message);
}
/**
 * Check runtime input as well as compile-time types. UI controls are typed,
 * but future callers might read AST parameters from JSON or other input.
 */
export function event(predicate, agent, argument) {
    const frame = PREDICATES[predicate];
    if (!frame)
        invalid(`Unknown predicate: ${predicate}`);
    if (agent !== 'speaker' && agent !== 'addressee') {
        invalid(`Unknown participant: ${agent}`);
    }
    if (!frame.allowedArguments.includes(argument)) {
        invalid(`${predicate} requires ${frame.argumentRole} in {${frame.allowedArguments.join(', ')}}`);
    }
    switch (predicate) {
        case 'need':
            if (argument === 'help' || argument === 'ticket') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'have':
            if (argument === 'time' || argument === 'ticket') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'understand':
            if (argument === 'this') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'help':
            if (argument === agent) {
                invalid('The helping agent and recipient must differ in this starter profile');
            }
            if (argument === 'speaker' || argument === 'addressee') {
                return Object.freeze({ kind: 'event', predicate, agent, recipient: argument });
            }
            break;
        case 'go':
            if (argument === 'home' || argument === 'station') {
                return Object.freeze({ kind: 'event', predicate, agent, destination: argument });
            }
            break;
        case 'buy':
            if (argument === 'ticket') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        default:
            return assertNever(predicate);
    }
    // This guards invalid data supplied by callers that bypass TypeScript.
    return invalid(`Invalid argument ${argument} for predicate ${predicate}`);
}
function assertNever(value) {
    throw new TypeError(`Unexpected value: ${String(value)}`);
}
export function modal(modality, value) {
    const frame = PREDICATES[value.predicate];
    if (!frame.allowedModalities.includes(modality)) {
        invalid(`${modality} is not supported for ${value.predicate}`);
    }
    return Object.freeze({ kind: 'modal', modality, value });
}
export function negate(value) {
    return Object.freeze({ kind: 'not', value });
}
export function when(value, time) {
    if (time !== 'today' && time !== 'tomorrow')
        invalid(`Unknown time: ${time}`);
    return Object.freeze({ kind: 'when', time, value });
}
export function ask(value) {
    return Object.freeze({ kind: 'ask', value });
}
export function please(value) {
    return Object.freeze({ kind: 'please', value });
}
export const DEFAULT_SELECTION = Object.freeze({
    predicate: 'help',
    agent: 'addressee',
    argument: 'speaker',
    modal: 'can',
    negative: false,
    time: '',
    question: true,
    polite: false,
});
/** Build a tree in the only supported scope order: modal → not → when → ask → please. */
export function makeTree(selection) {
    const baseEvent = event(selection.predicate, selection.agent, selection.argument);
    const base = selection.modal
        ? modal(selection.modal, baseEvent)
        : baseEvent;
    const withPolarity = selection.negative ? negate(base) : base;
    const statement = selection.time ? when(withPolarity, selection.time) : withPolarity;
    if (selection.polite && !selection.question) {
        invalid('PLEASE requires ASK');
    }
    if (!selection.question)
        return statement;
    const question = ask(statement);
    return selection.polite ? please(question) : question;
}
/** Normalize a valid expression for the bounded concrete syntax implementations. */
export function analyze(expression) {
    let current = expression;
    let polite = false;
    let question = false;
    let time = null;
    let negative = false;
    let modality = null;
    if (current.kind === 'please') {
        polite = true;
        current = current.value;
    }
    if (current.kind === 'ask') {
        question = true;
        current = current.value;
    }
    if (current.kind === 'when') {
        time = current.time;
        current = current.value;
    }
    if (current.kind === 'not') {
        negative = true;
        current = current.value;
    }
    if (current.kind === 'modal') {
        modality = current.modality;
        current = current.value;
    }
    if (current.kind !== 'event')
        invalid('Malformed AST: expected EVENT');
    return Object.freeze({ event: current, modality, negative, time, question, polite });
}
/** Human-readable notation keeps operator scope visible in the UI and tests. */
export function notation(expression) {
    switch (expression.kind) {
        case 'event': {
            const argument = eventArgument(expression);
            return `EVENT(${expression.predicate}, ${expression.agent}, ${argument})`;
        }
        case 'modal':
            return `${expression.modality.toUpperCase()}(${notation(expression.value)})`;
        case 'not':
            return `NOT(${notation(expression.value)})`;
        case 'when':
            return `WHEN(${notation(expression.value)}, ${expression.time})`;
        case 'ask':
            return `ASK(${notation(expression.value)})`;
        case 'please':
            return `PLEASE(${notation(expression.value)})`;
        default:
            return assertNever(expression);
    }
}
/** Extract a typed semantic slot without guessing a property name at runtime. */
export function eventArgument(value) {
    switch (value.predicate) {
        case 'need':
        case 'have':
        case 'understand':
        case 'buy':
            return value.theme;
        case 'help':
            return value.recipient;
        case 'go':
            return value.destination;
        default:
            return assertNever(value);
    }
}
