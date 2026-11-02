# Minimum Viable Language

**Three practical language manuals, generated from one compositional language framework.**

MVL helps independent learners communicate with a deliberately small subset of
standard German, French, or Spanish. The published application presents rules,
worked examples, a sentence builder, active-recall practice, and a quick reference.
It is a **learning product**; the language-engine specification lives separately
in [FRAMEWORK.md](FRAMEWORK.md).

The learner-facing site is at **https://alainux.github.io/mvl/**.

## What is generated?

A lesson does not contain German, French, or Spanish translations. It specifies
*meanings* such as “speaker needs one of these objects” and the operators permitted
for that lesson. The compiler expands the meaning specifications into abstract
syntax trees (ASTs). English prompts and target-language sentences are **both**
realizations of those trees.

```text
Shared learning goal
   └── Lesson plan: NEED(speaker, [water, ticket, coffee])
         └── Semantic AST: EVENT(need, speaker, ticket)
               ├── English renderer → I need a ticket.
               ├── German grammar   → Ich brauche ein Ticket.
               ├── French grammar   → J’ai besoin d’un billet.
               └── Spanish grammar  → Necesito un billete.
```

Changing the object triggers new morphology and word order from the grammar,
not a translation lookup. The sentence builder composes the same ASTs live.
Exercises derive additional valid combinations by changing slots and operators.

**Intentional exception:** greetings, thanks, and a few conventional social
formulas are stored whole because the starter grammar cannot derive them safely.
They live only in `src/learning/routines.ts`, and are explicitly marked as
`conventional` in generated output. Productive content is marked `composed`.

## Development

Node.js 20+ is required.

```bash
npm install
npm run check   # strict type check, compile three guides, run 32+ tests
npm run dev     # serve the last compiled /docs at localhost:4174
```

`npm run build` compiles unminified TypeScript modules and generates:

```text
/docs/index.html
/docs/assets/...
/docs/guides/de.json
/docs/guides/fr.json
/docs/guides/es.json
```

`docs/` is a checked-in **build artifact**, not authored source. The frontend
loads the compiled guides and uses the same core grammar to power its interactive
builder and practice tools.

### Publishing

The repository uses GitHub Pages **Deploy from a branch → main → /docs**.
There is no custom CI workflow. To release:

```bash
npm run pages  # same as check; regenerates docs/ and verifies outputs
git add .
git commit -m "Improve language guides"
git push
```

GitHub Pages then publishes the committed static output. This approach minimizes
CI minutes, but reviewers must check that `docs/` matches `src/`.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/core/` | Typed AST, semantic roles, composable operators, capability profiles |
| `src/languages/` | Independent grammatical realizers and English gloss generator |
| `src/learning/curriculum.ts` | Shared learning goals and declarative semantic lesson plans |
| `src/learning/expand.ts` | Expands lesson plans into ASTs |
| `src/learning/compile.ts` | Creates per-language learner guides |
| `src/learning/notes.ts` | Language-specific explanations; not translated phrase inventories |
| `src/learning/practice.ts` | Derives unseen exercises from meaning-tree transformations |
| `src/ui/` | Learner screens and interactive controls |
| `scripts/build.mjs` | Reproducible generation of the static deployment |
| `tests/` | Grammar regression tests, composition matrix, generation contracts |

Read [FRAMEWORK.md](FRAMEWORK.md) for the formal model and
[CONTRIBUTING.md](CONTRIBUTING.md) for adding a language, operator, or lesson.

## Scope and limitations

This is a controlled **production subset**, not a CEFR certification or a
complete grammar. Current coverage emphasizes requests, possession, questions,
places, small transactions, time adverbs, and negation. The initial grammar
supports first-person singular and formal second-person constructions, singular
objects, and a few simple tense and register choices. It does not understand
arbitrary user-written sentences or certify other valid phrasings.

MVL deliberately prefers standard-language constructions where possible rather
than inventing a new dialect. Minimality is about the learning surface, not a
claim that human languages share one grammar.

## License

MIT. See [LICENSE](LICENSE).
