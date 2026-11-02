import { DEFAULT_SELECTION, askWhen, askObject, clause, describe, event, howToGet, link, makeTree, presence, price, sequence, where } from '../core/algebra.js';
const DEFAULT_TIME = {
    present: 'today',
    past: 'yesterday',
    future: 'tomorrow',
};
/**
 * Compile lesson programs into expression trees. The exact same program runs
 * for de, fr, es, and the English gloss; there is no per-language lesson list.
 */
export function expandBlock(block) {
    switch (block.kind) {
        case 'describe':
            return block.qualities.map((quality) => ({
                kind: 'expression', expression: describe(block.thing, quality, block.options),
            }));
        case 'presence':
            return block.places.flatMap((place) => block.things.map((thing) => ({
                kind: 'expression', expression: presence(thing, place, block.options),
            })));
        case 'ask-object':
            return block.predicates.map((predicate) => ({
                kind: 'expression', expression: askObject(predicate, block.agent),
            }));
        case 'route':
            return block.places.map((place) => ({ kind: 'expression', expression: howToGet(place) }));
        case 'sequence': {
            const steps = block.steps.map((step) => makeTree({
                ...DEFAULT_SELECTION,
                modal: '', negative: false, question: false, polite: false,
                time: '', frequency: '', reason: 'none',
                ...step,
            }));
            if (!steps.every((step) => step.kind === 'clause')) {
                throw new TypeError('Narrative requires ordinary statements');
            }
            return [{ kind: 'expression', expression: sequence(...steps) }];
        }
        case 'when-question':
            return [{ kind: 'expression', expression: askWhen(clause(event(block.predicate, block.agent, block.argument))) }];
        case 'combine': {
            const first = makeTree({ ...DEFAULT_SELECTION, tense: 'present', modal: '', question: false, polite: false, time: '', reason: 'none', ...block.first });
            const second = makeTree({ ...DEFAULT_SELECTION, tense: 'present', modal: '', question: false, polite: false, time: '', reason: 'none', ...block.second });
            if (first.kind !== 'clause' || second.kind !== 'clause') {
                throw new TypeError('A combined example must contain two independent clauses');
            }
            return [{ kind: 'expression', expression: link(first, block.connection, second) }];
        }
        case 'conventions':
            return block.ids.map((routine) => ({ kind: 'convention', routine }));
        case 'where':
            return block.places.map((place) => ({ kind: 'expression', expression: where(place) }));
        case 'price':
            return block.things.map((thing) => ({ kind: 'expression', expression: price(thing) }));
        case 'paradigm':
            return block.arguments.map((argument) => {
                const selection = {
                    ...DEFAULT_SELECTION,
                    predicate: block.predicate,
                    agent: block.agent,
                    argument,
                    quantity: 1,
                    tense: 'present',
                    modal: '',
                    negative: false,
                    time: '',
                    question: false,
                    polite: false,
                    reason: 'none',
                    ...block.options,
                };
                return { kind: 'expression', expression: makeTree(selection), selection };
            });
        case 'timeline':
            return block.arguments.flatMap((argument) => block.tenses.map((tense) => {
                const selection = {
                    ...DEFAULT_SELECTION,
                    predicate: block.predicate,
                    agent: block.agent,
                    argument,
                    quantity: 1,
                    tense,
                    modal: '',
                    negative: false,
                    time: DEFAULT_TIME[tense],
                    question: false,
                    polite: false,
                    reason: 'none',
                    ...block.options,
                };
                return { kind: 'expression', expression: makeTree(selection), selection };
            }));
    }
}
