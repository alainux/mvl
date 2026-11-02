import { DEFAULT_SELECTION, makeTree, price, where } from '../core/algebra.js';
import type { BuilderSelection } from '../core/model.js';
import type { ExampleSource, LessonBlock } from './types.js';

/** Turn a compact semantic lesson plan into fully typed meaning trees. */
export function expandBlock(block: LessonBlock): readonly ExampleSource[] {
  switch (block.kind) {
    case 'paradigm':
      return block.arguments.map((argument) => {
        const selection: BuilderSelection = {
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

        return { kind: 'expression', expression: makeTree(selection), selection } as const;
      });
    case 'where':
      return block.places.map((place) => ({ kind: 'expression', expression: where(place) } as const));
    case 'price':
      return block.things.map((thing) => ({ kind: 'expression', expression: price(thing) } as const));
    case 'conventions':
      return block.ids.map((routine) => ({ kind: 'convention', routine } as const));
  }
}
