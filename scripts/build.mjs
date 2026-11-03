/**
 * Build the learner-facing, static GitHub Pages application.
 *
 * The only authored learning data is a shared typed curriculum and local
 * grammar instruction. A guide is compiled from that curriculum for each
 * installed language; /docs/guides/*.json are generated artifacts.
 *
 * Nothing is minified. GitHub Pages deploys the checked-in docs/ directory,
 * so CI does not need to run the TypeScript compiler on every push.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = resolve(root, 'docs');

rmSync(output, { recursive: true, force: true });
mkdirSync(resolve(output, 'assets'), { recursive: true });

// Compile readable ES modules with the same directory structure as src/.
const compiler = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
execFileSync(compiler, ['--project', 'tsconfig.json'], {
  cwd: root,
  stdio: 'inherit',
});

const { compileGuide, INSTALLED_LANGUAGES } = await import(
  `../docs/assets/learning/compile.js?build=${Date.now()}`
);

mkdirSync(resolve(output, 'guides'), { recursive: true });
for (const code of INSTALLED_LANGUAGES) {
  const guide = compileGuide(code);
  writeFileSync(
    resolve(output, 'guides', `${code}.json`),
    `${JSON.stringify(guide, null, 2)}\n`,
    'utf8',
  );
  const exampleCount = guide.lessons.reduce((sum, lesson) => sum + lesson.examples.length, 0);
  console.log(`Generated ${guide.language.name}: ${guide.lessons.length} lessons, ${exampleCount} examples.`);
}

cpSync(resolve(root, 'src/index.html'), resolve(output, 'index.html'));
cpSync(resolve(root, 'src/style.css'), resolve(output, 'assets/style.css'));
cpSync(resolve(root, 'src/quest.css'), resolve(output, 'assets/quest.css'));
cpSync(resolve(root, 'src/favicon.svg'), resolve(output, 'favicon.svg'));
writeFileSync(resolve(output, '.nojekyll'), '');

console.log('Built docs/ for GitHub Pages without a CI dependency.');
