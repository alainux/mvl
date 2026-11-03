import test from 'node:test';
import assert from 'node:assert/strict';

import { linguisticCases } from './fixtures/linguistic-cases.mjs';
import { linearize } from '../docs/assets/languages/index.js';
import { realizeEnglish } from '../docs/assets/languages/en.js';
import { fromExpression, studioExpression } from '../docs/assets/ui/studio-model.js';

/**
 * Human-authored test expectations are never imported into production source.
 * Each tested sentence must still be generated from the meaning AST, including
 * when a learner imports it into the block editor.
 */
test('curated everyday grammar expectations are stable in all three languages', () => {
  assert.ok(linguisticCases.length >= 30);
  for (const fixture of linguisticCases) {
    assert.equal(realizeEnglish(fixture.meaning), fixture.expected.en, `${fixture.id}/English`);
    for (const code of ['de', 'fr', 'es']) {
      assert.equal(linearize(fixture.meaning, code), fixture.expected[code], `${fixture.id}/${code}`);
    }
  }
});

test('every golden example can be opened and edited without phrase lookup', () => {
  for (const fixture of linguisticCases) {
    const edited = fromExpression(fixture.meaning);
    assert.ok(edited, `${fixture.id} should be editable`);
    for (const code of ['de', 'fr', 'es']) {
      assert.equal(linearize(studioExpression(edited), code), fixture.expected[code], `${fixture.id}/${code}`);
    }
  }
});
