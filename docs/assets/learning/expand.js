import { DEFAULT_SELECTION, makeTree, price, where } from '../core/algebra.js';
/** Turn a compact semantic lesson plan into fully typed meaning trees. */
export function expandBlock(block) {
    switch (block.kind) {
        case 'paradigm':
            return block.arguments.map((argument) => {
                const selection = {
                    ...DEFAULT_SELECTION,
                    agent: block.agent,
                    predicate: block.predicate,
                    argument,
                    modal: '',
                    negative: false,
                    time: '',
                    question: false,
                    polite: false,
                    ...block.options,
                };
                return { kind: 'expression', expression: makeTree(selection), selection };
            });
        case 'where':
            return block.places.map((place) => ({ kind: 'expression', expression: where(place) }));
        case 'price':
            return block.things.map((thing) => ({ kind: 'expression', expression: price(thing) }));
        case 'conventions':
            return block.ids.map((routine) => ({ kind: 'convention', routine }));
    }
}
