# Minimum Viable Language (MVL)

**A meta-framework for constructing minimal, compositional subsets of natural languages.** Rather than storing example phrases, MVL defines language-independent semantic primitives and typed composition operators. Independent grammar adapters realize the resulting trees as ordinary German, French, or Spanish.

**Live reference:** https://alainux.github.io/mvl/

## Architecture

```text
src/algebra.mjs               # language-neutral types, predicates and AST operators
src/profile.mjs               # derive minimal operator closure from capability goals
src/languages/de.mjs          # German: finite verb order, case, nicht/kein, inflection
src/languages/fr.mjs          # French: ne…pas, contractions, clitics, est-ce que
src/languages/es.mjs          # Spanish: pro-drop, verb forms, pronouns, ¿…?
src/app.mjs                   # interactive semantic tree composer
src/index.html, src/style.css # developer-reference UI
tests/spec.test.mjs           # golden fixtures + Cartesian cross-language matrix
scripts/build.mjs            # offline, dependency-free build into docs/
docs/                        # GitHub Pages output (generated and committed)
```

## Design

A meaning tree is built once:

```js
import {makeTree} from './src/algebra.mjs';
import {linearize} from './src/languages/index.mjs';

const tree=makeTree({
  predicate:'help',agent:'addressee',argument:'speaker',
  modal:'can',question:true,polite:true
});
linearize(tree,'de'); // Können Sie mir bitte helfen?
linearize(tree,'fr'); // Est-ce que vous pouvez m’aider, s’il vous plaît ?
linearize(tree,'es'); // ¿Usted puede ayudarme, por favor?
```

The interactive **profile planner** derives the smallest operator set required by a selected set of communicative capabilities (under the declared dependency graph). This is a formal subset calculation, not an empirical learning-cost optimization.

The displayed sentences are **generated compositionally**, not read from a translated phrase catalog. The first deliberately small profile has two participant roles, six predicates, six argument concepts, and seven typed operators. That is a **prototype fragment**, not A1 coverage or a claim of universal semantic primes.

## Develop and publish

Requires **Node.js 20+**, no `npm install` and no network dependencies:

```bash
npm run check  # golden fixtures, exhaustive supported combinations, build docs/
npm run dev    # local http://127.0.0.1:4174
npm run pages  # regenerate static output for GitHub Pages
```

GitHub Pages serves **main /docs**. Generated `docs/` files are committed with source changes; the repository uses **no custom GitHub Actions CI workflows**. This keeps project Actions usage minimal. Each collaborator can validate locally before pushing.

## Adding languages and operators

Read [FRAMEWORK.md](FRAMEWORK.md) for semantic contracts, typing, extension guidelines, scope boundaries and research references; [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution checklist. Every adapter must implement `profile` and `realize(tree)` and pass the same cross-language fixtures. Realizers may diverge in morphology, syntax, register, and idiomatic strategies; they must not silently change the meaning tree.

## Scientific grounding

MVL synthesizes ideas from Grammatical Framework (abstract/concrete syntax), Frame Semantics (semantic roles), Natural Semantic Metalanguage/Minimal Language (small meaning vocabularies), Universal Dependencies (language-comparable categories), and CEFR (communicative performance). MVL is **not endorsed by or compatible with these standards by default**. Its engineering primitives are not claimed to be universal or empirically optimal; those are future research questions.

Code and original documentation licensed MIT.
