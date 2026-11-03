# Linguistic quality review

The MVL language adapters are **experimental pedagogical subsets**, not
native-speaker-certified grammars. TypeScript compilation, model-based tests and
stable expected strings cannot alone establish naturalness or A2 attainment.

## Independent review workflow

Run `npm run review:export` to generate `review/linguistic-review.tsv`. It
contains every compiled example in German, French and Spanish, its English
meaning and source lesson. The worksheet is not loaded by the application.

For each row, a qualified reviewer should mark the review status as one of
`accepted`, `needs_revision` or `needs_context`, add their name or reviewer ID,
and note their regional variety. Check the following:

1. **Meaning fidelity:** Does the target express the English meaning without
   adding or dropping information? In particular, check negation, time,
   quantity, questions and obligation versus prohibition.
2. **Grammaticality:** Are person, agreement, articles, cases, auxiliary verbs,
   pronouns, word order and punctuation valid?
3. **Naturalness:** Would a speaker actually use this construction in an
   everyday interaction? If not, suggest a simpler natural alternative.
4. **Register / variety:** Is the form formal, informal, regional, gendered or
   ambiguous? Is that information visible to a learner?
5. **Pedagogical minimality:** Is this the simplest reliable construction for
   the intended meaning, or does a shorter accurate one exist?

Do **not** insert the approved sentences into the runtime as a translation
lookup. Fix the shared predicate frame, morphology or syntax rule, and add or
update an expected-output regression test. Then regenerate all three guides.

## Automatic checks

- `tests/golden.test.mjs` checks a test-only curated corpus of common A2-like
  meaning trees and expected output in all three languages. These are editorial
  seed expectations, **not** recorded native-speaker approvals.
- `tests/linguistic-contract.test.mjs` checks negation, quantities, high-value
  inflection cases and predicate constraints across many combinations.
- `tests/studio.test.mjs` checks that all generated productive lesson expressions
  round-trip through the block studio with their meaning and output intact.
- `tests/guides.test.mjs` ensures published JSON is regenerated from source.

## Explicit limitations

- French and Spanish include masculine-default speaker forms in certain past
  or adjectival constructions; a real guide needs to teach gender alternatives.
- Spanish has some legitimate written present/past ambiguities (for example,
  *compramos*). Word-level diffs cannot always demonstrate tense visually.
- The word-order strip compares **two generated sentences** and highlights
  different tokens. It is not a linguistic morpheme-provenance annotation.
- Regional variation, idiomatic usage, open-ended conversation and listening
  comprehension are not tested by this codebase.

Review results should be attached to a pull request with the language variety
and context noted. A native-speaker signoff is a human review, not an assertion
in an automated test.
