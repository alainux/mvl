# Minimum Viable Language (MVL)

**Documentation-style language learning.** Start with the smallest practical subset of standard German, then use shared communication goals to expand the approach to more languages.

The site preserves the complete **Minimum Viable German** interactive manual, including **20 sentence recipes, 10 core grammar rules, 12 real-life dialogues, 86 phrases, an interactive builder, quizzes and writing practice, notes, bookmarks, dark mode and printing**. An experimental **Language blocks** screen demonstrates the same **19 communication intents** in German and Spanish, each with individually curated grammar and vocabulary.

## Live site

After you enable Pages: **https://alainux.github.io/mvl/**

> The repository was initially private. GitHub Pages on private repos requires an eligible plan; for GitHub Free, make the repository public if you want to publish it. Pages itself can still be public even when source is private. You must enable Pages in repository settings; source code cannot automatically toggle that setting.

## Deploy without custom CI

This repo deliberately has **no GitHub Actions workflow**. The compiled site is committed to **`docs/`**, which GitHub Pages can serve using branch deployment. In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → main → /docs → Save**.

To build locally, you need **Node.js 20.11+**; there are no npm dependencies:

```bash
git clone https://github.com/alainux/mvl.git
cd mvl
npm run dev      # open http://127.0.0.1:4173
npm run check    # validate build and JavaScript
npm run pages    # check and regenerate docs/ for Pages
git add . && git commit -m "Update the manual" && git push
```

When contributing, **edit source**, not `docs/`. Commit generated `docs/` alongside your source files to publish changes without consuming custom CI minutes.

## Edit the source

| Directory | Contents |
| --- | --- |
| `content/recipes/*.json` | Individual German sentence recipes |
| `content/grammar/*.json` | Grammar rule explanations |
| `content/scenarios/*.json` | Short dialogues |
| `content/phrases.json` | Phrase library |
| `content/builders/*.json` | German sentence builder |
| `content/quiz.json`, `content/writing.json` | Practice questions |
| `framework/intents.json` | Shared goals independent of any language |
| `framework/languages/*.json` | Language-specific constructions and safe substitutions |
| `src/js/`, `src/styles.css` | UI code and styling |
| `site/index.template.html` | HTML shell |
| `scripts/build.mjs` | Dependency-free compiler to dist/ |
| `docs/` | Versioned GitHub Pages output; don't edit by hand |

See [FRAMEWORK.md](FRAMEWORK.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for principles and collaboration instructions.

## Philosophy

- **Intent first:** what does a learner need to accomplish?
- **Small, reusable constructions:** teach patterns rather than isolated grammar trivia.
- **Standard, natural sentences:** preserve communicative success without inventing a dialect.
- **Curated substitutions:** case, register, and agreement depend on the language and phrase.
- **Progressive disclosure:** minimal recipe first, exceptions when needed.

It is a learning experiment, **not** an official language standard or a replacement for conversational listening practice. Browser progress and notes stay local; no external API, account, audio lesson or tracking is needed.

Code and original educational content: MIT licensed.
