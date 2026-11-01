# Contributing

Contributions are welcome via issues and pull requests (with repository access while private; public contributions if the repo is made public).

1. Pick a real, everyday communication goal. Prefer a simple, natural reusable pattern over a literal translation.
2. For German, edit the relevant `content/` JSON file; add the ID to `content/manifest.json` if it's a new lesson.
3. For a shared goal, update `framework/intents.json` **and every language pack**, preserving aligned slot meaning IDs.
4. Double-check articles, case, agreement, formality, punctuation, regional usage, and ambiguity.
5. Run `npm run pages`. This checks the build and regenerates `docs/`. Commit generated files alongside source changes.
6. In your PR describe why the expression is useful and which language variety and sources or reviewers support it.

There is no custom CI; maintainers run validation locally before merging. Please don't edit compiled `docs/` by hand or copy copyrighted textbook explanations.

This repository is an educational experiment. Content contributions are distributed under the repository's MIT license.
