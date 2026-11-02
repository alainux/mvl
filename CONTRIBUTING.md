# Contributing to MVL

The public app is a set of **minimal expressive language manuals**. Its core
is a reusable, typed semantic system; it is not a phrasebook or a user-facing
framework playground.

## Development

```bash
npm install
npm run check   # strict types + build + tests
npm run dev     # serve the generated site
```

Use human-readable TypeScript, named functions and comments explaining the
*linguistic decision* rather than narrating the obvious. Generated JavaScript
is also unminified. No custom CI workflows are required.

## Add communicative coverage

1. Define the **meaning** in `src/core/vocabulary.ts` and, if necessary,
   `src/core/model.ts` / `src/core/algebra.ts`. Define valid semantic roles.
2. Implement language-specific grammar rules in `src/languages/de.ts`,
   `fr.ts`, `es.ts`, and an independent English gloss in `en.ts`.
3. Add a declarative lesson program to `src/learning/curriculum.ts` or `curriculum-everyday.ts`, **not** a
   list of translated answers. The compiled guide must derive new expressions.
4. Supply self-study grammar explanations in `src/learning/notes.ts` or `notes-everyday.ts`.
5. Add curated linguistic golden tests, including generated practice variants;
   run the broad composition and browser
   smoke checks where available.

**Never silently replace a missing grammar rule with a static translated
sentence**. Reject unsupported combinations until they are implemented.

## Minimality guidelines

Choose a natural, short productive form that supports many intentions. In the
current profile, German future plans use the present with an explicit future
time phrase; French and Spanish use the near future. German reasons use `denn`
to avoid verb-final subordinate clauses. Past events use the smallest natural
spoken past strategy available in each language.

Avoid adding a second form merely because it exists. Add it when users cannot
reasonably express a useful goal with the first form.

## Add a new language

Implement the `LanguageAdapter` contract and register the language in
`src/languages/index.ts`, the model code union, `src/learning/compile.ts`,
`src/learning/notes.ts` and `src/learning/routines.ts`. Test **every declared
operator**, not just a few example strings. Use native-speaker review for
register, tense, case and idiomaticity.

## Source of truth and publishing

- `src/` and `tests/` are authored.
- `docs/` is generated and must be committed for GitHub Pages.
- `src/learning/routines.ts` is the **only** intentional small whole-expression
  exception for greetings and social conventions.
- `npm run pages` builds and verifies the static artifact before a commit.

GitHub Pages publishes from `main:/docs`. This repository intentionally avoids
a custom Actions CI pipeline to reduce recurring build minutes.

## Scope honesty

MVL is A2-oriented in its **production goals**. It has not been validated as an
A2 course, it cannot automatically judge every valid paraphrase, and it does
not replace reading and listening practice. Document morphological assumptions
(e.g. French/Spanish adjective agreement) and regional defaults explicitly.
