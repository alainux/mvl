import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');

test('the published site uses local relative assets and compiled TypeScript', () => {
  assert.match(html, /\.\/assets\/main\.js/);
  assert.match(html, /\.\/assets\/style\.css/);
  assert.ok(existsSync(new URL('../docs/assets/main.js', import.meta.url)));
  assert.ok(existsSync(new URL('../docs/assets/core/algebra.js', import.meta.url)));
  assert.ok(existsSync(new URL('../docs/assets/languages/fr.js', import.meta.url)));
  assert.ok(existsSync(new URL('../docs/.nojekyll', import.meta.url)));
  assert.doesNotMatch(html, /\.\/assets\/app\.mjs/);
});

test('all UI insertion points exist and none contain publishing instructions', () => {
  const ids = [
    'types-grid', 'operators-list', 'predicate-table', 'adapter-cards',
    'capability-options', 'profile-count', 'profile-goals', 'profile-ops',
    'predicate', 'agent', 'argument', 'modal', 'time', 'negative', 'question',
    'polite', 'ast-view', 'ast-json', 'status', 'output-grid',
  ];

  for (const id of ids) assert.match(html, new RegExp(`id="${id}"`));
  assert.doesNotMatch(html, /private repository|CI usage|enable GitHub Pages/i);
});
