# Minimum Viable Language — experimental framework v0.1

## Goal

MVL aims to give learners a **small, productive, everyday subset of a real language**, with understandable rules and safe examples. It does not define a universal simplified language, promise CEFR certification, or equate similar-looking grammatical constructions across languages.

## Design influences

- **Threshold Level and CEFR Can-Do:** define observable communication tasks and situations.
- **ACTFL Can-Do:** frame progress in abilities, not chapter counts.
- **Construction Grammar:** learn form–meaning patterns as productive blocks.
- **Basic English:** a bounded active vocabulary as a design constraint.
- **Natural Semantic Metalanguage:** separate meaning from language-specific words (without adopting its full semantic theory).
- **Grammatical Framework:** one shared abstract intent with independent concrete realizations (without implementing its full grammar formalism).

References: [CEFR](https://www.coe.int/en/web/common-european-framework-reference-languages), [ACTFL](https://www.actfl.org/), [GF](https://www.grammaticalframework.org/).

## Lego layers

1. **Intent:** `request_help`, `ask_price`, etc., independent of any language.
2. **Realization:** a natural target-language sentence pattern.
3. **Slots:** pre-reviewed noun phrases / phrases that are safe in that specific sentence.
4. **Usage:** brief explanation of register and grammatical constraints.
5. **Can-Do:** a measurable task the learner can perform.

Example:

```json
{
  "id": "request_help",
  "category": "Repair",
  "label": "Ask for help",
  "canDo": "I can ask another person for assistance.",
  "priority": 3
}
```

German realization: `Können Sie mir bitte helfen?` Spanish: `¿Me puede ayudar, por favor?` Both express the same intent; **they don't have the same grammar**.

## Current schema

`framework/intents.json` lists the canonical intent IDs. Each `framework/languages/{code}.json` defines `code`, `name`, `variety`, `htmlLang`, `editorialNote`, `status`, and a map of `realizations` keyed by intent ID.

Each realization defines `pattern`, `usage`, `register`, `slots`. The pilot allows **at most one named slot** per expression. Slot alternatives are `{id, value, gloss}`. The `id` and its order must match across language packs, but the `value` may be an entire morphologically correct phrase. There is intentionally no naive word-by-word translation.

To add a new language, add its JSON file, include its code in the language array in `scripts/build.mjs`, implement all existing intents, and regenerate `docs/` with `npm run pages`. Human review by a speaker proficient in the target language/variety is recommended.

## Limitations

German has a full reference manual; Spanish is **only a 19-intent pilot**. The framework isn't yet a grammar engine, and it cannot generically join every arbitrary phrase or guarantee naturalness across all dialects.
