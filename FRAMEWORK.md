# MVL framework specification

This is the **developer-facing specification**. The published app is intended to
teach German, French, and Spanish. Its normal navigation does not ask learners
to learn this meta-model.

## 1. Design goals

1. Represent a small, high-utility **communicative meaning** independently of
   any target-language word order.
2. Compose meaning from typed reusable operators rather than treating each
   sentence as a key in a phrase dictionary.
3. Let each natural language make its own grammatical decisions.
4. Generate learner manuals (lessons, examples, and drills) from shared goals
   while allowing **authored, language-specific teaching explanations**.
5. Fail visibly when an operation falls outside the implemented subset.
6. Keep the source readable and outputs reproducible, without a hosted backend.

## 2. Meaning algebra

### Types

The starter uses disjoint semantic types such as `Participant`, `Thing`,
`Place`, `Time`, `PredicateId`, and `Modality`.

The `Event` discriminated union enforces predicate-specific argument roles.
For example:

```ts
// The helper is a participant and the receiver must be another participant.
type HelpEvent = Readonly<{
  kind: 'event';
  predicate: 'help';
  agent: Participant;
  recipient: Participant;
}>;
```

A `go` event accepts destinations, not objects that one can purchase; a `buy`
event accepts countable or mass items, not a location. Constructor runtime checks
protect the browser interface from invalid user-generated selections.

### Operators

| Operator | Input | Meaning |
| --- | --- | --- |
| `EVENT` | predicate + participant + typed argument | Situation |
| `CAN` | event | Ability or permission |
| `WANT` | event | Intention |
| `NOT` | clause | Negation |
| `WHEN` | clause + time | Temporal qualification |
| `ASK` | clause | Yes/no question |
| `PLEASE` | question | Courteous request |
| `WHERE` | place | Location question |
| `PRICE` | purchasable thing | Cost question |

Composition is constrained. `PLEASE` accepts a question; an unsupported modal
for a predicate is rejected. Explicit AST nesting preserves operator scope.

```text
PLEASE(ASK(CAN(EVENT(help, addressee, speaker))))
```

The target grammar receives this tree, not a literal English sentence. The
language adapters may flatten the supported operator order into a typed
`Analysis` structure before realizing surface forms.

## 3. Language adapters

A language adapter implements:

```ts
interface LanguageAdapter {
  readonly profile: LanguageProfile;
  realize(expression: Expression): string;
}
```

The German adapter has forms for case-marked noun phrases and dative recipients.
French has obligatory clitic positioning, article elision, and one predictable
`est-ce que` question pattern. Spanish has formal second-person conjugations,
pronoun placement, and inverted written question punctuation. English is a
**fourth renderer** used only to generate learning prompts from the same AST.

Adapters may share trivial helpers (whitespace, casing) but cannot share rules
that are actually language-specific. Lexical entries may store lemmas, gender,
countability, or irregular morphology. They must not store a full translation of
every teachable utterance.

## 4. Generation pipeline

### Shared curriculum

`src/learning/curriculum.ts` declares goals and `LessonBlock` programs.
A `paradigm` block specifies a predicate, person, compatible arguments, and
optional operator settings. `expandBlock` enumerates these inputs into valid
ASTs. Location and price blocks construct typed questions directly.

**No productive lesson block contains a `target` or `english` sentence.**

### Language-local explanation

`src/learning/notes.ts` contains each language's recipe, explanation, detail,
and caution. These explanations are **authored** because an explanation of
German verb-second or French negation is not just a translation of an abstract
rule. It is pedagogical content, not a phrase lookup engine.

### Compilation

`compileGuide(code)` expands each lesson block and calls two realizers for each
productive AST: `realizeEnglish(expression)` and
`linearize(expression, code)`. The build script writes the resulting guides to
`docs/guides/{de,fr,es}.json`. Learner pages load these artifacts.

### Practice

`generatePractice` transforms a teaching AST by changing a valid semantic slot
or an operator, avoiding already-shown ASTs where possible. It then realizes
**both** its English prompt and the target-language model form from the new tree.
No practice answer dictionary exists. A few closed-class patterns, and the
conventional social formulas, cannot produce distinct unseen combinations.

## 5. Conventional language is not an anti-pattern

A very small number of social formulas have lexicalized meanings which are not
compositional in this starter grammar: greeting, thanks, polite social repair.
These are stored in the separate `routines.ts` map and tagged
`provenance: 'conventional'` when compiled. They should remain a modest exception
rather than an alternative implementation of the curriculum.

To add an expression, first ask whether it can be composed from an existing
meaning, a new operator, or a new lexical entry. Only preserve it as a whole
chunk if its conventional structure truly falls outside the grammar's scope.

## 6. Quality gates

The local check command runs strict TypeScript checking, builds every guide,
and executes automated tests:

- Constructor and AST scope tests.
- Grammar regression cases for German, French, and Spanish.
- A matrix of supported argument/operator/person combinations.
- A contract proving every productive example is exactly the result of a
  shared AST rendered into English and the target language.
- A comparison proving each checked-in JSON guide matches a fresh compiler run.
- Practice checks that new combinations use semantic transformations.

Golden surface strings in tests are **assertions only**, not production data.
The browser never imports them to generate an utterance.

A comprehensive grammar review by native speakers remains valuable; tests
cover established intended forms, not all possible meanings or dialects.

## 7. Minimality and coverage

Minimality is a design optimization with a moving target. More rules can unlock
further communicative tasks but also impose teaching overhead. MVL's starting
scope privileges practical production:

- ask for help;
- say what one needs or has;
- ask a yes/no question;
- navigate common places;
- buy or pay for common items;
- add a time and negate a statement.

The current model is intentionally not an unrestricted interlingua. Languages
have distinctions that cannot always be cleanly erased: German noun case,
French partitives, Spanish subject omission, politeness, or aspect. The grammar
adapter must retain whichever distinction makes a supported construction
natural and intelligible. Support is narrower than general A1, and is not a
claim of CEFR proficiency.

## 8. Precedents and research direction

The architecture draws on several established ideas without claiming to
implement any one framework fully:

- **Grammatical Framework (GF):** abstract syntax separated from language-specific
  concrete syntax. <https://www.grammaticalframework.org/>
- **Construction Grammar:** reusable form–meaning pairings rather than isolated
  grammatical facts. <https://www.constructiongrammar.org/>
- **Council of Europe Threshold Level / CEFR:** communicative functions and
  observable can-do goals rather than a grammar-only syllabus.
  <https://www.coe.int/en/web/common-european-framework-reference-languages>
- **Basic English:** the idea of a deliberately restricted productive inventory,
  while acknowledging that its English-specific choices cannot be generalized.

Future work includes grammar coverage metrics, independent language review,
more systematic lexical features, alternative politeness registers, and an
explicit optimization model for learning burden versus communicative reach.
