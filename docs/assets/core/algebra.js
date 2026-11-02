import { PREDICATES } from './vocabulary.js';
function invalid(message) {
    throw new TypeError(message);
}
function assertNever(value) {
    throw new TypeError(`Unexpected value: ${String(value)}`);
}
/**
 * Construct a well-typed event from potentially untrusted UI selections.
 * The static Event union protects authored code; these guards protect the UI.
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
            if (argument === 'help' || argument === 'ticket' ||
                argument === 'coffee' || argument === 'water') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'buy':
        case 'would_like':
            if (argument === 'ticket' || argument === 'coffee' || argument === 'water') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'have':
            if (argument === 'time' || argument === 'ticket') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'understand':
        case 'repeat':
            if (argument === 'this') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'help':
            if (agent === argument) {
                invalid('The helping agent and recipient must differ in this profile');
            }
            if (argument === 'speaker' || argument === 'addressee') {
                return Object.freeze({ kind: 'event', predicate, agent, recipient: argument });
            }
            break;
        case 'go':
            if (argument === 'home' || argument === 'station' ||
                argument === 'bathroom' || argument === 'hotel') {
                return Object.freeze({ kind: 'event', predicate, agent, destination: argument });
            }
            break;
        case 'speak':
            if (argument === 'german' || argument === 'french' ||
                argument === 'spanish' || argument === 'english') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        case 'pay':
            if (argument === 'card' || argument === 'cash') {
                return Object.freeze({ kind: 'event', predicate, agent, theme: argument });
            }
            break;
        default:
            return assertNever(predicate);
    }
    return invalid(`Invalid argument ${argument} for predicate ${predicate}`);
}
export function modal(modality, value) {
    if (!PREDICATES[value.predicate].allowedModalities.includes(modality)) {
        invalid(`${modality} is not supported for ${value.predicate}`);
    }
    return Object.freeze({ kind: 'modal', modality, value });
}
export function negate(value) {
    return Object.freeze({ kind: 'not', value });
}
export function when(value, time) {
    if (time !== 'today' && time !== 'tomorrow') {
        invalid(`Unknown time: ${time}`);
    }
    return Object.freeze({ kind: 'when', value, time });
}
export function ask(value) {
    return Object.freeze({ kind: 'ask', value });
}
export function please(value) {
    return Object.freeze({ kind: 'please', value });
}
export function where(place) {
    if (place !== 'station' && place !== 'bathroom' && place !== 'hotel') {
        invalid(`Unknown locatable place: ${place}`);
    }
    return Object.freeze({ kind: 'where', place });
}
export function price(thing) {
    if (thing !== 'ticket' && thing !== 'coffee') {
        invalid(`Unknown priced item: ${thing}`);
    }
    return Object.freeze({ kind: 'price', thing });
}
export const DEFAULT_SELECTION = Object.freeze({
    predicate: 'help',
    agent: 'addressee',
    argument: 'speaker',
    modal: 'can',
    negative: false,
    time: '',
    question: true,
    polite: true,
});
/**
 * A teachable subset permits one canonical operator order. General arbitrary
 * nesting would require substantially larger grammar implementations.
 */
export function makeTree(selection) {
    const action = event(selection.predicate, selection.agent, selection.argument);
    const base = selection.modal ? modal(selection.modal, action) : action;
    const withPolarity = selection.negative ? negate(base) : base;
    const clause = selection.time
        ? when(withPolarity, selection.time)
        : withPolarity;
    if (selection.polite && !selection.question)
        invalid('PLEASE requires ASK');
    if (!selection.question)
        return clause;
    const question = ask(clause);
    return selection.polite ? please(question) : question;
}
/** Flatten the bounded AST once; language adapters decide all surface forms. */
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
    if (current.kind !== 'event') {
        invalid('Malformed sentence AST: expected EVENT');
    }
    return Object.freeze({ event: current, modality, negative, time, question, polite });
}
export function eventArgument(value) {
    if (value.predicate === 'help')
        return value.recipient;
    if (value.predicate === 'go')
        return value.destination;
    return value.theme;
}
/** Stable notation is useful for debugging, documentation, and AST comparisons. */
export function notation(expression) {
    switch (expression.kind) {
        case 'event':
            return `EVENT(${expression.predicate}, ${expression.agent}, ${eventArgument(expression)})`;
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
        case 'where':
            return `WHERE(${expression.place})`;
        case 'price':
            return `PRICE(${expression.thing})`;
        default:
            return assertNever(expression);
    }
}
