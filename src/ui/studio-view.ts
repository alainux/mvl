/**
 * Stable HTML shell for the interactive block studio.
 * Dynamic blocks, recipes, output and inspector are rendered by studio.ts.
 */
export function renderStudio(): string {
  return `<section class="page studio-page" id="studio" aria-labelledby="studio-title">
    <div class="studio-heading">
      <div class="eyebrow"><span class="eyebrow-line"></span> THE BLOCK STUDIO · BUILD YOUR OWN LANGUAGE</div>
      <h1 id="studio-title">Build meaning.<br /><em>Make a sentence.</em></h1>
      <p class="lead">Start with three simple blocks. Add time, ability, negation or a question. Every change creates a real sentence using the grammar of your chosen language.</p>
      <div class="studio-steps" aria-label="How to learn with blocks">
        <span><b>01</b> Pick a pattern</span>
        <span><b>02</b> Connect blocks</span>
        <span><b>03</b> Change one thing</span>
      </div>
    </div>

    <section class="studio-recipes" aria-labelledby="studio-recipes-title">
      <div class="studio-section-head">
        <div><span class="micro-label">START WITH AN EXAMPLE</span><h2 id="studio-recipes-title">Patterns you can take apart</h2></div>
        <button class="studio-text-button" id="studio-show-recipes" aria-expanded="false">Show all patterns ↓</button>
      </div>
      <div class="studio-recipe-list" id="studio-recipes-list" aria-label="Example compositions"></div>
    </section>

    <div class="studio-main-grid">
      <div class="studio-canvas-column">
        <section class="studio-board" aria-labelledby="studio-canvas-title">
          <div class="studio-section-head">
            <div><span class="micro-label">YOUR WORKSPACE</span><h2 id="studio-canvas-title">The building blocks</h2></div>
            <button id="studio-reset" class="studio-text-button">Reset ↺</button>
          </div>
          <p class="studio-instruction">Choose the meaning ingredients below. Their order is not the spoken word order: each language arranges and inflects them differently.</p>
          <div class="studio-block-canvas" id="studio-blocks" aria-label="Editable meaning blocks"></div>
          <div class="studio-order" aria-labelledby="studio-order-title">
            <div class="studio-order-heading">
              <div>
                <span class="micro-label">THE GRAMMAR ENGINE ARRANGES THEM</span>
                <h3 id="studio-order-title">Actual word order <span id="studio-order-language"></span></h3>
              </div>
              <span class="studio-order-arrow" aria-hidden="true">↓</span>
            </div>
            <div class="studio-order-words" id="studio-order-words" aria-live="polite" aria-atomic="true"></div>
            <p class="studio-order-hint" id="studio-order-hint"></p>
            <p class="studio-order-comparison" id="studio-order-comparison"></p>
          </div>
          <div class="studio-add-header"><span class="micro-label">ADD AN OPERATOR</span><span>Optional blocks</span></div>
          <div class="studio-palette" id="studio-palette" aria-label="Available operators"></div>
        </section>

        <section class="studio-output-panel" aria-labelledby="studio-result-title">
          <div class="studio-section-head"><div><span class="micro-label">LIVE RESULT</span><h2 id="studio-result-title">What you've built</h2></div><span class="studio-live-dot">● Changes instantly</span></div>
          <div class="studio-output-sentence" id="studio-result" aria-live="polite" aria-atomic="true"></div>
          <div class="studio-delta" id="studio-delta" hidden><span class="micro-label">WATCH THE TRANSFORMATION</span><div id="studio-delta-content"></div></div>
          <div class="studio-output-meaning"><span>MEANING</span><p id="studio-english"></p></div>
          <p class="studio-grammar-note" id="studio-grammar-note"></p>
          <div class="studio-output-actions">
            <button class="button primary" id="studio-copy">Copy sentence</button>
            <button class="button secondary" id="studio-swap">Try another object ↻</button>
          </div>
          <details class="studio-underhood"><summary>See how the blocks fit together</summary>
            <p>The colored blocks represent meaning. The actual words and word order are created by this language's grammar rules.</p>
            <pre id="studio-notation"></pre>
            <div class="studio-other-languages" id="studio-other-languages"></div>
          </details>
          <p class="studio-error" id="studio-error" role="alert" hidden></p>
        </section>

        <section class="studio-challenges" aria-labelledby="studio-challenges-title">
          <div class="studio-section-head"><div><span class="micro-label">NOW BUILD IT YOURSELF</span><h2 id="studio-challenges-title">Four small challenges</h2></div></div>
          <p>Pick a challenge to load a starting sentence. Add or change the blocks until your expression matches the goal.</p>
          <div class="studio-challenge-list" id="studio-missions"></div>
          <div class="studio-mission-feedback" id="studio-mission-feedback" role="status" aria-live="polite"></div>
        </section>
      </div>

      <aside class="studio-inspector" id="studio-inspector" aria-labelledby="studio-inspector-title">
        <div class="studio-inspector-top"><span class="micro-label">BLOCK INSPECTOR</span><span class="studio-inspector-indicator">● EDITABLE</span></div>
        <div id="studio-inspector-body"></div>
      </aside>
    </div>
  </section>`;
}
