# Contributing to MVL

MVL's public pages are **learning guides**. Its reusable compiler is the
implementation mechanism, not the subject of the learner-facing interface.

## Start locally

```bash
npm install
npm run check
npm run dev
```

The command `npm run check` runs `tsc --strict`, builds compiled modules and all
three JSON guides into `/docs`, and runs the test suite. Make sure it succeeds
before opening a pull request.

## What to edit

### Teach another communicative goal

Edit `src/learning/curriculum.ts` with a semantic lesson plan. Compose a typed
`paradigm`, `where`, or `price` block; do **not** supply hand-translated German,
French, and Spanish sentences. When genuinely needed, extend the AST operators
and each language adapter first. A lesson addition needs language-specific
explanatory notes in `src/learning/notes.ts`.

### Add vocabulary

Use semantic concepts in `src/core/model.ts` and predicate argument constraints
in `src/core/vocabulary.ts`. Add lexical information to each language module.
Noun gender, article behavior, irregular verb forms, and prepositions are normal
lexical or morphological facts. **Do not add a phrase lookup table** for
ordinary examples.

### Add another language

1. Implement `LanguageAdapter` in `src/languages/<code>.ts`.
2. Register it in `src/languages/index.ts` and `INSTALLED_LANGUAGES`.
3. Extend the language-code type, authored lesson notes, and social formulas.
4. Include grammatical golden tests and support every declared starter AST.
5. Generate the site's guide artifact and check all interactive routes.

The first three language modules are German, French, and Spanish. Their
production scope is limited and documented in `FRAMEWORK.md`.

### Add a conventional expression

Use `src/learning/routines.ts` only if the form is idiomatic and outside the
productive grammar. Conventional formulas are explicitly labeled in the
compiled JSON. Avoid adding arbitrary daily phrases there.

## Source standards

- Write strict TypeScript; use discriminated unions and typed function signatures.
- Keep named functions and variables readable. Do not minify source or build
  outputs. Favor comments explaining linguistic or semantic decisions over
  comments that merely repeat the code.
- Keep compositional semantics and language-specific surface morphology apart.
- Add a regression test for each new form or morphology rule.
- Do not silently fall back to an approximate or grammatically incorrect phrase.
- Test copy, navigation, and responsive layout when modifying the UI.
- Prefer a concrete, scoped rule over making a claim about all dialects.

## Publication and CI

The site is deployed through GitHub Pages from `main:/docs` and has **no custom
CI workflows**. This avoids running a Node build on every push. Contributors
must regenerate `/docs` with `npm run pages`, commit the resulting files, and
include them in their pull request. Tests detect stale guide JSON.

## Human language review

Automation validates composition and expected outputs, but it cannot certify
whether a construction is the best teaching choice. Please explain register,
regional assumptions, and native-speaker judgments in PRs that change grammar.
Do not expand the language model beyond what the adapters can reliably produce.
