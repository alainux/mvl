export const PARTICIPANTS = {
    speaker: 'the speaker',
    addressee: 'the person addressed',
};
export const CONCEPTS = {
    speaker: 'the speaker',
    addressee: 'the person addressed',
    help: 'assistance',
    ticket: 'a ticket',
    time: 'available time',
    this: 'this information',
    home: 'home',
    station: 'the station',
};
/**
 * Frames describe semantic *roles*, not how languages express them.
 * A realizer is free to express a theme as an object, a prepositional phrase,
 * or an entirely different construction when the meaning is preserved.
 */
export const PREDICATES = {
    need: {
        description: 'A person needs something',
        argumentRole: 'theme',
        allowedArguments: ['help', 'ticket'],
        allowedModalities: [],
    },
    have: {
        description: 'A person possesses something',
        argumentRole: 'theme',
        allowedArguments: ['time', 'ticket'],
        allowedModalities: [],
    },
    understand: {
        description: 'A person understands information',
        argumentRole: 'theme',
        allowedArguments: ['this'],
        allowedModalities: ['can'],
    },
    help: {
        description: 'One person helps another',
        argumentRole: 'recipient',
        allowedArguments: ['speaker', 'addressee'],
        allowedModalities: ['can', 'want'],
    },
    go: {
        description: 'A person goes to a destination',
        argumentRole: 'destination',
        allowedArguments: ['home', 'station'],
        allowedModalities: ['can', 'want'],
    },
    buy: {
        description: 'A person purchases something',
        argumentRole: 'theme',
        allowedArguments: ['ticket'],
        allowedModalities: ['can', 'want'],
    },
};
export const OPERATORS = [
    { id: 'EVENT', signature: 'Predicate × Person × Argument → Event', description: 'Create an atomic event.' },
    { id: 'CAN', signature: 'Event → Clause', description: 'Express ability or possibility.' },
    { id: 'WANT', signature: 'Event → Clause', description: 'Express intention or desire.' },
    { id: 'NOT', signature: 'Clause → Clause', description: 'Negate the clause within its scope.' },
    { id: 'WHEN', signature: 'Clause × Time → Clause', description: 'Locate an event in time.' },
    { id: 'ASK', signature: 'Clause → Question', description: 'Form a yes/no question.' },
    { id: 'PLEASE', signature: 'Question → Question', description: 'Mark a question as a polite request.' },
];
