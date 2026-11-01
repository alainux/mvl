# MVL Meta-framework · Specification 0.1

## 1. Purpose

Define a **portable, typed semantic core** for tiny, useful subsets of natural languages. An MVL implementation is not a translation table. It maps abstract meaning trees to standard utterances using declared linguistic rules. A minimum viable language is a *profile*: a selected semantic capability set, composition operations, one or more realizers, and testable limitations.

MVL separates three planes:

1. **Semantic plane**: concepts and predicates independent of any writing system, case system or syntactic order.
2. **Composition plane**: type-checked operators that transform structured meaning.
3. **Realization plane**: regional and register-aware morphosyntax that renders the meaning to a surface string.

This follows the broad abstract/concrete syntax pattern of Grammatical Framework, but MVL is its own intentionally much smaller JavaScript system, not an implementation of GF.

## 2. Types and expression syntax

```text
Person      := speaker | addressee
Thing       := help | ticket | time | this
Place       := home | station
Event       := EVENT(predicate, Person, argument)
Clause      := Event | CAN(Event) | WANT(Event) | NOT(Clause) | WHEN(Clause, Time)
Question    := ASK(Clause) | PLEASE(Question)
Time        := today | tomorrow

CAN  : Event -> Clause
WANT : Event -> Clause
NOT  : Clause -> Clause
WHEN : Clause x Time -> Clause
ASK  : Clause -> Question
PLEASE : Question -> Question
```

`EVENT` is a schema family whose last slot varies by predicate. For example `help` takes a recipient of type Person; `go` takes a destination of type Place. The compiler enforces available values and restricts modal combinations. These are engineering choices and can be revisited in later profiles.

A strictly compositional program:

```text
PLEASE(ASK(CAN(EVENT(help, addressee, speaker))))
```

Generated realization for selected formal registers:

- `de`: Können Sie mir bitte helfen?
- `fr`: Est-ce que vous pouvez m’aider, s’il vous plaît ?
- `es`: ¿Usted puede ayudarme, por favor?

These outputs are a *demonstration of linearization* and do not constitute a phrase corpus. No translated sentence is a key in the core semantic layer.

## 3. Type safety and restrictions

- Reject unknown predicates or roles and out-of-domain arguments.
- Reject `CAN` and `WANT` on predicates whose frame has no vetted modal construction in this profile.
- Reject `PLEASE` unless applied to an `ASK` tree.
- Do not pretend `NOT(WANT(E))` and `WANT(NOT(E))` are equivalent. Version 0.1 exposes the former only.
- Do not assume that a structure in one language predicts its structure in another.
- Any unsupported realization should fail explicitly rather than return invented grammar.

## 4. Implementer contract

Each adapter in `src/languages` exports:

```ts
export const profile: {
  code: string;
  name: string;
  region: string;
  features: string[];
};
export function realize(tree: MVLTree): string;
```

A realizer must:

- Preserve the core meaning as far as possible; surface politeness and idiom vary.
- Implement word order, agreement, morphological form, clitics/case and negation locally.
- State the intended register and regional standard in `profile`.
- Never mutate the input AST or infer unrepresented semantic properties.
- Be tested across the complete supported meaning tree corpus.

Initial choices: German uses formal `Sie`, French formal `vous` and `est-ce que` questions, and Spanish `usted` in a European Spanish profile. These choices are *one* viable register, not universal norms for all contexts. The test suite includes a Cartesian matrix of permitted combinations as a structural sanity check plus hand-reviewed golden examples. Generated grammaticality still requires native-speaker review.

## 5. Extending the core

Before adding a primitive: (a) identify a communicative capability the current system cannot express, (b) give it a type, (c) define composition and scope, (d) specify which language adapters need new rules, (e) add golden fixtures and invalid-program tests. Adding one concept may require different articles, cases or lexicalization strategies in each adapter.

Longer-term features may include tense/aspect, polarity scope, information questions, comparison, reference resolution, quantification, plural/number, and discourse state. They should be introduced as explicit operators or semantic features rather than hidden string templates.

**Evaluation framework:** count *typed expressible meanings*, linguistic features implemented, and task coverage. Do not report CEFR proficiency or "number of sentences" as a proxy for useful communication. Test a curated set of communicative tasks (request clarification, express a need, seek help, ask for information), inspired by the CEFR, but preserve semantics-first design.

## 6. Research relationships

| Source | Contribution | Not adopted wholesale |
| --- | --- | --- |
| [Grammatical Framework](https://www.grammaticalframework.org/doc/tutorial/gf-tutorial.html) | Abstract syntax / many concrete syntaxes, linearization | Full GF formalism and resource grammar library |
| [Minimal Language](https://tidsskrift.dk/sss/article/view/135070) / [NSM](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-language-in-context/natural-semantic-metalanguage-and-context/3CB8DE484FAC6AD8190D95D0501B6424) | Small semantic vocabularies; proposed semantic primes | Claims of 65 universals or exhaustive reducibility |
| [FrameNet](https://berkeleyfn.framenetbr.ufjf.br/WhatIsFrameNet) | Semantic predicates with participant slots | Complete lexical-frame database |
| [Universal Dependencies](https://universaldependencies.org/) | Comparable morphosyntactic categories across languages | UD annotation format for all our trees |
| [CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors) | Human tasks and testable communicative outcomes | Claim of A1–C2 equivalence |
| [ISO 24617-2](https://www.iso.org/standard/76443.html) | Annotation of dialogue acts, useful when adding speech acts | ISO's complete taxonomy and markup language |

### What MVL is not

A conlang, a standardized simplified dialect, a phrasebook, an automatic all-purpose translator, a claim of universal grammar, or a replacement for human validation.
