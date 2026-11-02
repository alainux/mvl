# MVL: framework specification

This document is for implementers. The generated website is a **language
learning tool**, not an interface to the semantic engine itself.

## 1. Desired result

An MVL implementation is a **minimal but expressive production grammar** that
covers a declared set of communicative capabilities with as few independent
constructions as reasonably possible. A small tourist phrase inventory fails
this requirement: it cannot freely report yesterday's events, express a plan,
or explain a problem.

The initial profile is **A2-oriented** and operationalizes portions of the
Council of Europe's descriptors: exchanging routine information, describing
one's circumstances, talking about past activity, and discussing plans. It is
not an official CEFR specification or an assessment of a learner's ability.

References:
- [Council of Europe: CEFR levels](https://www.coe.int/en/web/common-European-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale)
- [CEFR Companion Volume](https://www.coe.int/en/web/education/-/common-european-framework-of-reference-for-languages-learning-teaching-assessment-14)
- [Goethe-Institut: Perfekt for spoken German](https://lernplattform.goethe.de/pluginfile.php/1534641/mod_folder/content/0/DTonlineA2_K10_GR-RM_Rueckschau_EN.pdf)

The architecture draws inspiration from construction-based approaches and from
the abstract-syntax / concrete-syntax separation in
[Grammatical Framework](https://www.grammaticalframework.org/), without
attempting to implement all of GF.

## 2. Core algebra

The shared meaning types are located in `src/core/model.ts`:

- `Event` — a typed predicate, agent, argument and optional two-item quantity.
- `Clause` — an event plus tense, modality, polarity, time, frequency, question and politeness.
- `Discourse` — two clauses joined by `and`, `but` or `because`.
- `LocationQuestion`, `PriceQuestion`, `TimeQuestion` — specialized questions.
- `Description` — a constrained noun–quality predication.
- `Presence` — an existence statement or question anchored in a place.
- `ObjectQuestion`, `RouteQuestion` — ask for an unknown object or directions.
- `Sequence` — a short narrative composed from independent clauses.

Typed constructors in `src/core/algebra.ts` form legal expressions:

```ts
const bought = when(
  inTense(clause(event('buy', 'speaker', 'ticket')), 'past'),
  'yesterday',
);

const cannotCome = negate(
  modal(clause(event('come', 'speaker', 'none')), 'can'),
);

const reason = clause(event('be', 'speaker', 'sick'));
const explanation = link(cannotCome, 'because', reason);
```

These examples are **semantic programs**; they contain no inflected words in a
target language. The constructors validate semantic roles, countability and
incompatible time/tense combinations. They reject unimplemented compositions
rather than silently fall back to machine translation.

### Operator contract

| Operation | Purpose |
| --- | --- |
| `event(...)` | Create an event with semantic role restrictions |
| `inTense(..., 'past'/'present'/'future')` | Report, describe or plan |
| `when(..., time)` | Add a time anchor consistent with tense |
| `modal(..., 'can'/'want'/'must')` | Ability, intention and obligation |
| `negate(...)` | Deny a clause or its nominal content |
| `ask(...)` / `askWhen(...)` | Request confirmation or timing |
| `please(...)` | Add politeness to a request |
| `link(a, connection, b)` | Build a brief explanation or contrast |
| `where(place)` / `price(thing)` | Ask common location and price questions |
| `habit(clause, frequency)` | Talk about routines |
| `describe(thing, quality)` | Predication with agreement where required |
| `presence(thing, place)` | Ask or say that something exists |
| `askObject(predicate, agent)` | Open question about the unknown object |
| `howToGet(place)` | Ask for directions |
| `sequence(...clauses)` | Tell a short, compositional story |

> Type safety is a programming contract, not a linguistic correctness proof.
> Linguistic outputs must still be reviewed and regression-tested.

## 3. Concrete language realizers

Each of `de`, `fr`, `es` implements:

```ts
interface LanguageAdapter {
  readonly profile: LanguageProfile;
  realize(expression: Expression): string;
}
```

Shared *meanings* do not entail shared *morphology*:

- German: V2/main-clause question order; accusative/dative noun and recipient
  forms; `Perfekt` with `haben` or `sein`; preterite of common states/modals;
  present plus a future adverb; simple reasons with `denn`.
- French: `est-ce que` questions; subject elision and object clitics;
  `passé composé` for completed actions, simple `imparfait` for past states;
  `aller + infinitive` for future plans; `ne ... pas` negation.
- Spanish: formal `usted` conjugations; object clitics; `pretérito indefinido`
  for completed events and simple imperfect past states; near future
  `ir a + infinitive`; sentence negation using `no`.

Lemmas, gender, irregular verb forms, past participles and prepositional
preferences are *necessary lexical data*. Complete translated phrases are not.

## 4. Generating lessons

`src/learning/curriculum.ts` and `curriculum-everyday.ts` contain 40
language-neutral lessons over
semantically typed `LessonBlock`s, including:

- `paradigm`: substitute compatible objects, people, quantities or operators.
- `timeline`: vary present/past/future while keeping the action constant.
- `combine`: compose two independently realized clauses.
- `where`, `price`, `when-question`, `ask-object`, `route`: generate questions.
- `describe`, `presence`: compose noun–property and existential propositions.
- `sequence`: combine short independent clauses into a story.
- `conventions`: a small explicitly marked store of social formulas.

`src/learning/expand.ts` executes these programs to produce ASTs, and
`src/learning/compile.ts` independently realizes every AST into an English
prompt and a target-language output. The human-authored notes in
`src/learning/notes.ts` and `notes-everyday.ts` explain language-specific grammar.

The learning application prioritizes a **visual block studio**. A typed
`StudioState` is edited using WHO/ACTION/OBJECT slots and optional operator
blocks. All output passes through the same realizer used by the compiler;
recipes and semantic build challenges carry **no translated sentences**.
See `src/ui/studio-model.ts` for semantic presets and validation,
`studio.ts` for the UI controller, and `studio-rules.ts` for pedagogical grammar
explanations. The same source expressions power the lessons, quick reference,
remix buttons and practice. Progress tracking and notes remain local.

## 5. What does minimal mean?

Minimality is **not the number of lines of code**, vocabulary size alone, or the
number of memorized phrases. It is a practical trade-off between:

1. **Communicative coverage:** how many useful intentions can be expressed?
2. **Grammar cost:** how many independent inflections and exceptions must be
   learned to express those intentions?
3. **Composability:** can learned rules combine to express something novel?
4. **Naturalness:** can an ordinary native speaker understand the resulting
   standard-language utterance without learning a special dialect?
5. **Reliability:** will the chosen short construction remain correct in the
   domain for which it is taught?

These are distinct measures, not a solved optimization problem. Claims of A2
coverage require real learner trials, native-speaker review, and reception
(reading/listening) evaluation beyond what tests can establish.

## 6. Quality and extension

`npm run check` runs strict TypeScript compilation, rebuilds generated guides,
then tests their provenance, representative grammatical outputs, invalid
semantic operations and thousands of supported combinations.

When adding a language or semantic operator, implement it in *every installed
adapter*, update the curriculum, add native-reviewed golden tests, and regenerate
`docs/`. Do not patch output strings for individual examples in the lesson data.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution contract.
