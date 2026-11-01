# Contributing to MVL

MVL is a semantic and grammar framework. Contributions should add **primitives, compositional operators, precise realization rules or language adapters** rather than inventories of pretranslated phrases.

1. Explain the new expressive capability and its semantic type. Include at least one new tree and describe what old trees could not express.
2. Add the change in `src/algebra.mjs` if it is language-independent. Keep all natural-language words in the specific adapter.
3. Update **all three adapters** or explicitly document and enforce an unsupported capability. Preserve ordinary standard register, not invented pseudo-grammar.
4. Add hand-checked golden test cases and invalid-expression tests under `tests/`.
5. Run `npm run check` locally; it builds `docs/` and validates the runtime modules. Commit changed `docs/` with source.
6. Describe limitations, register and regional choices accurately. Native-speaker review is recommended for new output constructions.

The project deliberately has no custom CI workflow; checks are local to conserve Actions minutes. Reviews should prioritize correctness and clearly declared gaps, not coverage counts.
