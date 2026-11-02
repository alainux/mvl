# Contributing to MVL

MVL is a **meta-framework**. Contributions should improve semantic expressivity,
validated composition, concrete grammar, or evaluation—not add catalogs of
translated sentences.

## Local workflow

```bash
npm install
npm run check
npm run dev
```

`npm run check` performs the strict TypeScript check, regenerates `docs/`, and
runs the local Node test suite. Commit the generated `docs/` files alongside
source changes; GitHub Pages serves that directory directly.

## Code conventions

- Use **strict TypeScript** for production code; keep public types explicit.
- Use discriminated unions rather than untyped AST objects or stringly-typed
  access to arbitrary properties.
- Prefer named, small functions with one responsibility. Keep semantics in
  `src/core`, language rules in `src/languages`, and DOM code in `src/ui`.
- Explain *why* a rule exists (case assignment, clitic placement, semantic
  scope); do not annotate self-evident assignments with redundant comments.
- Avoid minification, compressed expressions, giant render functions, global
  mutation, and unnecessary dependencies.
- Never let language-specific words enter the semantic core. Do not introduce
  literal sentence-output lookup tables as a substitute for grammar rules.
- Preserve existing accessible markup and support for mobile layouts.

## Extending the meaning algebra

1. Describe a communicative capability the current model cannot express.
2. Add or update its semantic type in `src/core/model.ts` and its frame in
   `src/core/vocabulary.ts`.
3. Add validated constructors, normalization, or composition logic in
   `src/core/algebra.ts`. Specify scope explicitly.
4. Update the capability dependency model if the change introduces operators.
5. Implement the new construction in **all three** language adapters or model
   unsupported capabilities explicitly. Do not silently change the meaning.
6. Add positive and negative tests, and check new expected outputs with a
   competent speaker of each affected language.
7. Update `FRAMEWORK.md` when the public semantic contract changes.

## Adding a language

Create `src/languages/<code>.ts`, export a `LanguageAdapter` object conforming
to `src/core/model.ts`, and register it in `src/languages/index.ts`.
Document the regional variety, formality, and rules used by the implementation.
Make inflection and constituent ordering explicit. Include golden fixtures and
extend the cross-language matrix before claiming support.

A language adapter is not required to use the same *surface* structures as the
others. It is required to express the same *meaning*, or reject unsupported
features clearly.

## Review checklist

- [ ] Type checking and `npm run check` pass locally.
- [ ] A new semantic distinction is not hidden in a language adapter.
- [ ] All adapters and tests cover the change (or declare the gap).
- [ ] Golden examples have been linguistically reviewed.
- [ ] `docs/` is regenerated from source.
- [ ] Documentation explains behavior and limitations, without deployment
      anecdotes or conversation-related commentary on the user-facing page.

There is no per-commit Actions CI workflow. Local checks keep maintenance and
compute usage modest.
