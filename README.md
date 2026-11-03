# Minimum Viable Language (MVL)

A **small, expressive subset of a real language**, taught through reusable rules
instead of memorized conversations. The same semantic curriculum builds a German,
French, and Spanish manual.

**Live interactive language studio:** https://alainux.github.io/mvl/

## What can you communicate?

The curriculum works toward the **communicative scope of A2**: routine
information exchange, daily needs, simple reports about the past, future plans,
requests, personal circumstances, and short explanations. It does **not** award,
measure, or guarantee CEFR A2. Reading and listening competence require further
real-world practice.

The current guides have **40 progressive lessons and over 420 generated examples each**.
The primary learning surface is an interactive **block studio**, not a page of
prewritten phrases.
The working subset includes:

- Present actions and states, negatives, yes/no and where/when/price questions.
- Completed past events, past journeys, common past states and past modals.
- Future plans, intentions, permission/ability and obligation.
- People, objects, common places, two-item quantities, preferences, habits and brief reasons.
- Descriptions (cheap, clean, open, ready), existence (there is / there are),
  open-object questions, requests for directions and short multi-sentence stories.
- Everyday domains: housing, services, work, shopping, food, healthcare,
  appointments, paperwork, technology, travel and lost property.
- Joining short independent clauses without needing complex subordination.

### Minimality means choosing easy natural forms

| Meaning | German | French | Spanish |
| --- | --- | --- | --- |
| Completed past | `haben/sein` + participle | `passé composé` | `pretérito indefinido` |
| Future plan | present + future time | `aller` + infinitive | `ir a` + infinitive |
| Need | `brauchen` + noun | `avoir besoin de` | `necesitar` |
| Why / reason | two clauses + `denn` | two clauses + `parce que` | two clauses + `porque` |

These are *representative grammar constructions*, not translated sentence entries
used by the compiler. Where unavoidable, each language retains a few irregular
forms and its own inflection rules. We do not pretend that one grammar applies to
all languages.

## Learn through visual composition

The learner chooses German, French or Spanish and opens the **Block studio**.
It is a small semantic editor with directly manipulable, keyboard-accessible
building blocks:

1. **Inspect:** each block has a role (WHO, ACTION, OBJECT, TIME, MODAL, WHY),
   valid alternatives and one brief explanation of how it works.
2. **Assemble:** start from a semantic recipe or three basic blocks; edit the
   agent, action and compatible argument; add or remove operators such as PAST,
   FUTURE, CAN, MUST, NOT, QUESTION, PLEASE, HABIT and BECAUSE.
3. **Observe:** the language adapter regenerates the sentence and shows the
   *before → after* transformation. The same expression can be inspected in the
   other installed languages.
4. **Practice:** four build missions start from incomplete meaning configurations
   and check the **whole semantic state**, not a memorized translation string.
5. **Remix:** all productive worked examples in the 40-lesson guide open directly in
   the block studio with their meaning tree restored for editing.

The studio can now edit WHEN questions, joined independent clauses, and short
stories with separately editable events. It also models descriptions, existence, open-object questions, prices,
locations and routes. Operators which do not type-check for a chosen action are
unavailable rather than producing ungrammatical combinations. Drag-and-drop is
not required: every block is a button, including on touch devices.

**Architecture invariant:** recipes, missions and UI state contain semantic
identifiers and typed operators; they never contain German, French or Spanish
sentence translations. Conjugations, articles and word order come from the
existing independent language realizers.

## How the guides are generated

A shared curriculum describes events and **operators**, not translated phrases.
For example, the meaning of a completed purchase is:

```ts
const purchase = inTense(clause(event('buy', 'speaker', 'ticket')), 'past');
```

The same expression is independently linearized into German, French, Spanish
and English. Teaching examples and translation exercises are *generated* from
these expressions. Changing the verb, object, person, polarity, tense or modal
causes grammar rules to rebuild the sentence.

Stored full sentences are limited to a small set of conventional social forms
(`src/learning/routines.ts`). Every generated example has a provenance marker.

The site is a **learning manual**. Implementation details belong in
[FRAMEWORK.md](FRAMEWORK.md), not on the learner's landing page.

## Code layout

| Folder | Role |
| --- | --- |
| `src/core/model.ts` | Shared event, clause and discourse AST types |
| `src/core/algebra.ts` | Typed constructors and semantic composition |
| `src/core/vocabulary.ts` | Predicate frames and argument constraints |
| `src/languages/de.ts` | German inflection and linearization |
| `src/languages/fr.ts` | French inflection and linearization |
| `src/languages/es.ts` | Spanish inflection and linearization |
| `src/languages/en.ts` | English renderer for independently generated prompts |
| `src/learning/curriculum.ts` and `curriculum-everyday.ts` | 40 shared lesson programs over typed meaning blocks |
| `src/learning/notes.ts` and `notes-everyday.ts` | Human-authored, language-specific teaching explanations |
| `src/learning/compile.ts` | Deterministic guide compiler |
| `src/learning/practice.ts` | AST transformations to generate further exercises |
| `src/ui/studio-model.ts` | Meaning-only recipe, mission and block editor model |
| `src/ui/studio.ts` and `studio-view.ts` | Accessible visual composition studio and interactions |
| `src/ui/` | Learner UI, progress, search, lessons and practice |
| `docs/` | Built, checked-in GitHub Pages artifacts; never edit directly |

## Develop, verify, publish

Requires Node.js 20 or newer:

```bash
npm install
npm run check    # strict types, generation, tests
npm run dev      # local server for the generated /docs
npm run review:export  # compile a human review worksheet (not deployed)
```

To publish via GitHub Pages (`main:/docs`):

```bash
npm run pages
git add .
git commit -m "Improve the language guides"
git push
```

The build emits readable, unminified JavaScript modules and three generated
`docs/guides/*.json` manuals. There is **no custom Actions CI pipeline**.
GitHub's ordinary Pages publication workflow serves the committed static output.

## What remains outside this subset?

The grammar deliberately limits verb and noun inventories, regional register,
complex subordinate clauses, rich adjectives, many prepositions, and nuanced
aspect. French and Spanish speaker adjectives use a documented masculine default;
other genders require corresponding agreement. Natural speakers can use many
phrases not generated by these rules. This is a bounded, extensible pedagogical
system, not a universal grammatical parser.

The curriculum follows the Council of Europe's A2 communicative descriptors
(see references in [FRAMEWORK.md](FRAMEWORK.md)). Independent native-speaker
review of language outputs is still needed as coverage expands. For a reviewer-ready
export and quality criteria, see [LINGUISTIC_REVIEW.md](LINGUISTIC_REVIEW.md).

## License

MIT. See [LICENSE](LICENSE).
