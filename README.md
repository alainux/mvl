# Minimum Viable Language

**A typed meta-framework for constructing small, compositional fragments of natural languages.**

MVL models an utterance as a language-independent meaning tree. An adapter then
realizes that tree with the grammar of a particular language. Its first three
implementations are **German**, **French**, and **Spanish**. The implementations
are intentionally bounded; MVL is not a phrasebook, a universal translator, or
an established language-learning standard.

**Interactive reference:** https://alainux.github.io/mvl/

## Get started

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run check  # strict type check, compile docs/, and run regression tests
npm run dev    # serve the last build at http://127.0.0.1:4174/
```

The project has **one development dependency: TypeScript**. Browser execution
uses native JavaScript modules, with no framework, runtime dependencies, CDN,
backend, or bundler.

## Repository layout

```text
src/
  core/
    model.ts       Types: Event, Clause, Expression, language adapter contract
    vocabulary.ts  Typed predicates, semantic roles, operator signatures
    algebra.ts     Validated AST constructors, normalization and notation
    profile.ts     Capability sets and operator dependency closure
  languages/
    shared.ts      Small morphology / orthography helpers
    de.ts          German realizer: verb placement, dative, negation
    fr.ts          French realizer: elision, clitics, negation, questions
    es.ts          Spanish realizer: agreement, clitics, questions
    index.ts       Registered adapters and linearization entry point
  ui/
    dom.ts         Safe, small DOM helpers
    reference.ts   Render documentation from the real specifications
    profiles.ts    Interactive capability planner
    workbench.ts   Typed expression builder and compilation output
  main.ts          Browser bootstrap
  index.html       Semantic page structure
  style.css        Responsive presentation
scripts/
  build.mjs        Compile TypeScript and copy static assets to docs/
  serve.mjs        Tiny local development server

tests/
  core.test.mjs    AST validation, scope, profile dependencies
  languages.test.mjs  Golden outputs + full supported combination matrix
  site.test.mjs    Publishable-asset contract

docs/              Generated, committed GitHub Pages site
```

Source files under `src/` are the canonical implementation. Files under `docs/`
are generated build artifacts and **must not be edited directly**.

## How composition works

```ts
import { event, modal, ask, please } from './core/algebra.js';
import { linearize } from './languages/index.js';

// Shared semantics. No words from any particular language appear in the AST.
const assistance = event('help', 'addressee', 'speaker');
const request = please(ask(modal('can', assistance)));

linearize(request, 'de'); // Können Sie mir bitte helfen?
linearize(request, 'fr'); // Est-ce que vous pouvez m’aider, s’il vous plaît ?
linearize(request, 'es'); // ¿Usted puede ayudarme, por favor?
```

The example above is illustrative TypeScript source: its relative imports assume
it lives in `src/`. The browser also offers an interactive workbench for the
same construction process.

`Event`, `Clause`, and `Question` are **discriminated unions**. The compiler
rejects unsupported predicate–argument pairs and predicate–modal combinations.
The syntax prevents `PLEASE` from applying to a statement. Language adapters
receive the same `Expression` and cannot alter its semantic types.

The profile planner computes the smallest **operator dependency closure** for
selected goals. This does not establish an optimal teaching order or a complete
communication curriculum; see [FRAMEWORK.md](FRAMEWORK.md).

## Quality gates

- **Strict TypeScript:** `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, unused-symbol checks, and additional guards.
- **Runtime contracts:** Invalid events and unsupported combinations throw
  instead of returning invented phrases.
- **Regression cases:** Human-readable expected realizations for each adapter,
  including elision and clitic placement.
- **Combination matrix:** Every supported predicate, agent, argument, modality,
  negation, question, and time combination is compiled by every adapter.
- **Static assets:** The generated site uses relative paths, so it works under
  a repository-specific GitHub Pages URL.

Unit tests validate invariants and selected outputs; they **cannot guarantee**
that every generated sentence is idiomatic. New constructions should receive
native-speaker review.

## Publish

GitHub Pages is configured to serve `main` from `/docs`. Build and check locally:

```bash
npm run pages

git add src docs tests README.md FRAMEWORK.md CONTRIBUTING.md

git commit -m "Extend MVL grammar"
git push
```

The repository does not define a custom CI pipeline. Compiled Pages assets are
committed so hosting does not require a TypeScript build on GitHub Actions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for code style, semantic extension rules,
and the language review checklist. See [FRAMEWORK.md](FRAMEWORK.md) for the
formal model and its relationship to GF, Frame Semantics, NSM, and CEFR.

Original code and documentation: MIT license.
