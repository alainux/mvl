import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('Pages root serves a learner app and not a framework whitepaper', () => {
  const html = read('docs/index.html');
  assert.match(html, /Practical language manuals/);
  assert.match(html, /id="app"/);
  assert.match(html, /assets\/main\.js/);
  assert.match(html, /assets\/style\.css/);
  assert.doesNotMatch(html, /semantic algebra reference|pseudo-minified/);
});

test('all generated guide artifacts exist as committed static outputs', () => {
  for (const code of ['de', 'fr', 'es']) {
    assert.ok(existsSync(`docs/guides/${code}.json`));
    assert.ok(read(`docs/guides/${code}.json`).length > 2000);
  }
  assert.ok(existsSync('docs/.nojekyll'));
  assert.ok(existsSync('docs/assets/ui/app.js'));
  assert.ok(existsSync('docs/assets/ui/studio.js'));
  assert.ok(existsSync('docs/assets/ui/studio-model.js'));
  assert.ok(existsSync('docs/assets/ui/studio-view.js'));
  assert.ok(existsSync('docs/assets/learning/practice.js'));
});

test('published JS is readable, modular, and not minified', () => {
  for (const filename of ['core/algebra.js', 'languages/de.js', 'ui/app.js', 'learning/compile.js']) {
    const content = read(`docs/assets/${filename}`);
    assert.ok(content.split('\n').length > 25, filename);
    assert.ok(content.includes('\n'), filename);
    assert.ok(content.length > 200, filename);
  }
});

test('plain-language UI supports mobile reading and accessibility hooks', () => {
  const css = read('docs/assets/style.css');
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media print/);
  const ui = read('docs/assets/ui/views.js');
  for (const label of ['Block studio', 'Practice lab', 'Quick reference', 'Worked examples']) {
    assert.ok(ui.includes(label), label);
  }
  assert.ok(read('docs/assets/ui/studio-view.js').includes('building blocks'));
  assert.ok(read('docs/assets/ui/studio.js').includes('operatorApplied'));
});

test('GitHub Actions verifies the typed builders and generated guides', () => {
  assert.ok(existsSync('.github/workflows/verify.yml'));
  assert.match(read('.github/workflows/verify.yml'), /npm run check/);
  assert.ok(readdirSync('docs/assets/languages').includes('fr.js'));
});


test('the root URL opens the interactive block studio, not the old homepage', async () => {
  const { currentRoute } = await import('../docs/assets/ui/router.js');
  const previousLocation = globalThis.location;

  try {
    globalThis.location = { hash: '' };
    assert.deepEqual(currentRoute(), { page: 'builder', code: 'de' });

    globalThis.location.hash = '#fr/builder';
    assert.deepEqual(currentRoute(), { page: 'builder', code: 'fr' });

    globalThis.location.hash = '#home';
    assert.deepEqual(currentRoute(), { page: 'home' });
  } finally {
    if (previousLocation === undefined) delete globalThis.location;
    else globalThis.location = previousLocation;
  }
});
