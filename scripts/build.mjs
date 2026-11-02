/**
 * Build the static GitHub Pages site without a bundler or a runtime backend.
 *
 * Only docs/ is deployed. The TypeScript source remains human-readable and
 * each compiled module keeps the same name and directory structure.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = resolve(root, 'docs');

rmSync(output, { recursive: true, force: true });
mkdirSync(resolve(output, 'assets'), { recursive: true });

const typescript = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
execFileSync(typescript, ['--project', 'tsconfig.json'], {
  cwd: root,
  stdio: 'inherit',
});

cpSync(resolve(root, 'src/index.html'), resolve(output, 'index.html'));
cpSync(resolve(root, 'src/style.css'), resolve(output, 'assets/style.css'));
cpSync(resolve(root, 'src/favicon.svg'), resolve(output, 'favicon.svg'));

// An explicit marker prevents Jekyll from filtering static module paths.
writeFileSync(resolve(output, '.nojekyll'), '');
console.log('Built docs/ for GitHub Pages.');
