/**
 * Stable HTML shell for the interactive block studio.
 * Dynamic blocks, recipes, output and inspector are rendered by studio.ts.
 */
export function renderStudio() {
    return `<section class="page studio-page" id="studio" aria-labelledby="studio-title">
    <div class="studio-heading">
      <a class="game-back" id="studio-back" href="#de/start">← Back to levels</a>
      <div class="eyebrow"><span class="eyebrow-line"></span> MODE 01 · GRAMMAR PUZZLES</div>
      <h1 id="studio-title">Build meaning.<br /><em>See language click.</em></h1>
      <p class="lead">Like a block puzzle: only compatible pieces fit. Solve a sentence blueprint, then see how German, French or Spanish puts your meaning into words.</p>
      <div class="studio-steps" aria-label="How to play">
        <span><b>01</b> Choose a blueprint</span>
        <span><b>02</b> Snap compatible pieces</span>
        <span><b>03</b> Build the target sentence</span>
      </div>
    </div>

    <section class="snap-game" id="snap-game" aria-label="Sentence builder game">
      <header class="snap-header">
        <div><span class="snap-kicker">▦ THE SENTENCE MACHINE / BUILD MODE</span>
          <h2>Make the pieces fit.</h2>
          <p>Pick a socket, then snap in a compatible meaning piece. The grammar engine assembles the real sentence.</p>
        </div>
        <div class="snap-score"><span>BLUEPRINTS CLEARED</span><strong id="snap-cleared">0 / 4</strong></div>
      </header>
      <div class="snap-missions">
        <div class="snap-overline"><strong>CHOOSE A BLUEPRINT</strong><span>4 challenges · each build teaches a new move</span></div>
        <div class="snap-mission-grid" id="snap-mission-grid" role="group" aria-label="Sentence blueprints"></div>
      </div>
      <div class="snap-objective" id="snap-objective" role="status" aria-live="polite"></div>
      <div class="snap-play-surface">
        <div class="snap-section-caption"><strong>01 / WORD BLOCKS · SPOKEN ORDER</strong><span>Tap a word to edit its grammar</span></div>
        <div class="snap-sockets" id="snap-sockets" role="group" aria-label="Sentence words in spoken order"></div>
        <div class="snap-control-panel">
          <div class="snap-control-heading"><strong>EDIT OR ADD GRAMMAR</strong><span>Use these controls when a part has no separate word</span></div>
          <div class="snap-tools" id="snap-tools" role="group" aria-label="Meaning and grammar controls"></div>
        </div>
        <p class="snap-explanation">The word blocks above follow <strong>the exact sentence order</strong>. A single grammar choice may change several words, add a word, or move a verb.</p>
        <div class="snap-tray">
          <div class="snap-section-caption"><strong>02 / PIECE TRAY</strong><span id="snap-tray-title">Choose a block to edit</span></div>
          <label for="snap-filter" class="visually-hidden">Find a compatible piece</label>
          <input id="snap-filter" class="snap-filter" type="search" placeholder="Find a word or block…" autocomplete="off">
          <div id="snap-pieces" class="snap-pieces" role="group" aria-label="Compatible meaning pieces"></div>
          <p class="snap-tray-note">Every piece here fits the selected slot. Tap to snap it in, or drag to a matching socket.</p>
        </div>
      </div>
      <div class="snap-result">
        <div class="snap-section-caption"><strong>03 / THE LANGUAGE ENGINE</strong><span class="snap-live-indicator">● LIVE</span></div>
        <strong class="snap-sentence" id="snap-sentence" aria-live="polite" aria-atomic="true"></strong>
        <p id="snap-meaning" class="snap-meaning"></p>
        <p id="snap-target" class="snap-target" hidden></p>
        <p id="snap-feedback" class="snap-feedback" role="status" aria-live="polite"></p>
        <div class="snap-actions">
          <button type="button" id="snap-next" class="game-primary" hidden>Next blueprint →</button>
          <button type="button" id="snap-reset-goal" class="snap-secondary" hidden>↻ Restart blueprint</button>
          <button type="button" id="snap-free" class="snap-secondary">Free build</button>
          <button type="button" id="snap-lab" class="snap-secondary">Explore grammar ↗</button>
        </div>
      </div>
    </section>

    <details class="studio-workshop" id="studio-workshop">
      <summary><strong>Open the grammar workshop</strong><span>Worked examples, advanced sentence patterns and deep editing ↗</span></summary>
          <section class="studio-recipes" aria-labelledby="studio-recipes-title">
      <div class="studio-section-head">
        <div><span class="micro-label">REMIX A LEVEL</span><h2 id="studio-recipes-title">Load a prebuilt combo</h2></div>
        <button class="studio-text-button" id="studio-show-recipes" aria-expanded="false">Show all patterns ↓</button>
      </div>
      <div class="studio-recipe-list" id="studio-recipes-list" aria-label="Example compositions"></div>
    </section>

    <div class="studio-main-grid">
      <div class="studio-canvas-column">
        <section class="studio-board" aria-labelledby="studio-canvas-title">
          <div class="studio-section-head">
            <div><span class="micro-label">FREEPLAY · MANUAL MODE</span><h2 id="studio-canvas-title">The building blocks lab</h2></div>
            <button id="studio-reset" class="studio-text-button">Reset ↺</button>
          </div>
          <p class="studio-instruction">Tap any block to customize it. The lab shows meaning order; the grammar engine determines actual word order.</p>
          <div class="studio-block-canvas" id="studio-blocks" aria-label="Editable meaning blocks"></div>
          <p id="studio-adjustment" class="studio-adjustment" role="status" aria-live="polite" hidden></p>
          <div class="studio-order" aria-labelledby="studio-order-title">
            <div class="studio-order-heading">
              <div>
                <span class="micro-label">LANGUAGE PHYSICS</span>
                <h3 id="studio-order-title">Spoken word order <span id="studio-order-language"></span></h3>
              </div>
              <span class="studio-order-arrow" aria-hidden="true">↓</span>
            </div>
            <div class="studio-order-words" id="studio-order-words" aria-live="polite" aria-atomic="true"></div>
            <div class="studio-structure" id="studio-structure" aria-label="Sentence assembly rules"></div>
            <p class="studio-order-hint" id="studio-order-hint"></p>
            <p class="studio-order-comparison" id="studio-order-comparison"></p>
          </div>
          <div class="studio-add-header"><span class="micro-label">ADD AN OPERATOR</span><span>Optional blocks</span></div>
          <div class="studio-palette" id="studio-palette" aria-label="Available operators"></div>
        </section>

        <section class="studio-output-panel" aria-labelledby="studio-result-title">
          <div class="studio-section-head"><div><span class="micro-label">SENTENCE OUTPUT</span><h2 id="studio-result-title">What you've built</h2></div><span class="studio-live-dot">● Changes instantly</span></div>
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
          <div class="studio-section-head"><div><span class="micro-label">NOW BUILD IT YOURSELF</span><h2 id="studio-challenges-title">Bonus challenges</h2></div></div>
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
    </details>
  </section>`;
}
