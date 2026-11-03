import { escapeHtml as esc } from './dom.js';
import { href } from './router.js';
import { questRecords } from './state.js';
import { questRounds, questStars, selectedWords, QUEST_HEARTS } from './quest-model.js';
import { fromExpression } from './studio-model.js';
import { ruleFor } from './studio-rules.js';
const WORLDS = {
    foundation: { place: 'Arrival Port', guide: 'Pip the courier', avatar: '🦊', intro: 'Your words are the key to the city. Help Pip deliver the message.' },
    'time-and-plans': { place: 'Clocktower District', guide: 'Tock the keeper', avatar: '🦉', intro: 'The clocks are mixed up. Put yesterday, today and tomorrow in order.' },
    'connected-speech': { place: 'Bridge Quarter', guide: 'Nova the explorer', avatar: '🦝', intro: 'A bridge opens when your message connects the right ideas.' },
    'everyday-life': { place: 'Market Maze', guide: 'Kit the merchant', avatar: '🐱', intro: 'Shop, travel and solve everyday problems with your words.' },
    'independent-speech': { place: 'The Lighthouse', guide: 'Sol the navigator', avatar: '🐧', intro: 'Combine everything you have learned to light the last beacon.' },
};
const starLine = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
function finishScreen(guide, lesson, session, success, target) {
    const code = guide.language.code;
    const chapter = guide.lessons.indexOf(lesson);
    const next = guide.lessons[chapter + 1];
    const stars = questStars(session);
    const best = questRecords(code)[lesson.id];
    return `<section class="page quest-page quest-end" id="quest" data-quest-phase="${session.phase}">
    <div class="quest-end-card ${success ? 'is-victory' : 'is-defeat'}">
      <div class="quest-end-symbol" aria-hidden="true">${success ? '🏆' : '💔'}</div>
      <span class="game-kicker">${success ? 'LEVEL ' + (chapter + 1) + ' · GATE OPEN' : 'THE GATE IS STILL CLOSED'}</span>
      <h1>${success ? 'Quest complete!' : 'Out of hearts!'}</h1>
      <p>${success ? 'You built all five messages. The next path is now open.' : 'Mistakes are part of the game. Take another shot, or inspect the examples.'}</p>
      ${success ? `<div class="quest-end-stars" aria-label="${stars} of 3 stars">${starLine(stars)}</div>
        <div class="quest-results"><span><b>${session.score}</b>POINTS</span><span><b>${session.bestCombo}</b>BEST COMBO</span>
          <span><b>${session.misses}</b>MISTAKES</span></div>
        <p class="quest-end-best">Best rating: ${starLine(best?.stars ?? stars)} · Replay to improve it.</p>`
        : `<div class="quest-last-answer"><small>THIS WAS THE SENTENCE</small><strong lang="${code}">${esc(target ?? '')}</strong></div>`}
      <div class="quest-end-actions">
        ${success && next ? `<a class="game-primary" href="${href(code, 'lesson/' + next.id)}">Next level →</a>` : ''}
        <button type="button" id="quest-restart" class="game-primary">↻ Play again</button>
        <a class="game-secondary" href="${href(code, 'lesson/' + lesson.id)}">Worked examples</a>
        <a class="game-secondary" href="${href(code, 'start')}">Map</a>
      </div>
    </div>
  </section>`;
}
export function renderQuest(guide, lesson, session) {
    const code = guide.language.code;
    const rounds = questRounds(guide, lesson);
    const round = rounds[session.round];
    if (session.phase === 'victory')
        return finishScreen(guide, lesson, session, true);
    if (!round)
        throw new Error('Missing game encounter');
    if (session.phase === 'lost')
        return finishScreen(guide, lesson, session, false, round.target);
    const world = WORLDS[lesson.stage];
    const answer = selectedWords(session, round);
    const full = answer.length === round.expected.length;
    const bank = round.tiles.filter((tile) => !session.selected.includes(tile.id));
    const expr = round.example.source.kind === 'expression' ? round.example.source.expression : null;
    const focus = expr?.kind === 'link' ? 'connection' :
        expr?.kind === 'clause' && expr.negative ? 'negative' :
            expr?.kind === 'clause' && expr.tense !== 'present' ? 'tense' : 'predicate';
    const editable = expr ? fromExpression(expr) : null;
    const why = editable ? ruleFor(editable, code, focus) :
        'This is a conventional expression. Remember it as a useful whole.';
    const steps = rounds.map((_, i) => `<span class="quest-step ${i < session.round ? 'done' : i === session.round ? 'active' : ''}"
    aria-label="Encounter ${i + 1}"></span>`).join('');
    const slots = Array.from({ length: round.expected.length }, (_, i) => {
        const tileId = session.selected[i];
        if (tileId === undefined)
            return '<span class="quest-empty-tile" aria-hidden="true">+</span>';
        return `<button type="button" data-quest-remove="${i}" class="quest-placed-tile" aria-label="Remove ${esc(answer[i] ?? '')} at position ${i + 1}">
      ${esc(answer[i] ?? '')}<small aria-hidden="true">×</small></button>`;
    }).join('');
    const wordBank = bank.map((tile, i) => `<button type="button" data-quest-tile="${tile.id}"
    class="quest-word-tile ${session.hintTile === tile.id ? 'is-hinted' : ''}" aria-label="Place ${esc(tile.word)}" ${session.phase !== 'play' ? 'disabled' : ''}>
      ${esc(tile.word)}<small aria-hidden="true">${i < 9 ? i + 1 : '＋'}</small></button>`).join('');
    return `<section class="page quest-page" id="quest" data-quest-phase="${session.phase}" data-quest-round="${session.round}">
    <div class="quest-top"><a href="${href(code, 'lesson/' + lesson.id)}" class="quest-back">← Leave quest</a>
      <span class="quest-world-name">✦ ${esc(world.place)} · LEVEL ${guide.lessons.indexOf(lesson) + 1}</span>
      <span class="quest-run-score">${session.score} PTS</span></div>
    <div class="quest-arena">
      <div class="quest-hud"><div><span class="quest-encounter-name">${round.boss ? '★ FINAL GATE — BOSS ROUND' : 'ENCOUNTER ' + (session.round + 1) + ' / ' + rounds.length}</span>
        <h2>${esc(lesson.title)}</h2></div>
        <div class="quest-resources"><span aria-label="${session.hearts} hearts remaining" class="quest-hearts">${'♥'.repeat(session.hearts)}<span>${'♡'.repeat(QUEST_HEARTS - session.hearts)}</span></span>
          <span class="quest-combo">⚡ ${session.combo} COMBO</span></div></div>
      <div class="quest-progress" aria-label="Your progress">${steps}</div>
      <div class="quest-scene">
        <div class="quest-sidekick"><span class="quest-avatar" aria-hidden="true">${world.avatar}</span><strong>${esc(world.guide)}</strong></div>
        <div class="quest-dialogue">
          <span>${round.boss ? 'THE FINAL MESSAGE' : 'YOUR MISSION · SAY THIS IN ' + guide.language.name.toUpperCase()}</span>
          <h1>${esc(round.goal)}</h1>
          <p>${esc(round.boss ? 'The gatekeeper added extra decoys. Choose carefully!' : world.intro)}</p>
        </div>
      </div>
      <div class="quest-workbench">
        <div class="quest-workbench-heading"><div><span class="game-kicker">THE SENTENCE FORGE</span><h2>Build the answer.</h2></div>
          <span class="quest-word-count">${answer.length} / ${round.expected.length} WORDS</span></div>
        <div class="quest-recipe">${round.recipe.map((part) => `<span>${esc(part)}</span>`).join('')}</div>
        <div class="quest-assembly" id="quest-answer" role="group" aria-label="Your assembled sentence">${slots}</div>
        <div class="quest-bank-label"><strong>WORD BLOCKS</strong><small>Tap a word to place it; tap your answer to remove it</small></div>
        <div class="quest-bank" role="group" id="quest-bank" aria-label="Available word blocks">${wordBank}</div>
        <div class="quest-controls">
          <div><button id="quest-undo" class="quest-utility" ${answer.length && session.phase === 'play' ? '' : 'disabled'}>↶ Undo</button>
            <button id="quest-clear" class="quest-utility" ${answer.length && session.phase === 'play' ? '' : 'disabled'}>Reset</button>
            <button id="quest-hint" class="quest-utility" ${session.hintUsed || session.phase !== 'play' ? 'disabled' : ''}>✦ ${session.hintUsed ? 'Clue used' : 'Get clue'}</button></div>
          ${session.phase === 'play' ? `<button id="quest-check" class="game-primary quest-check" ${full ? '' : 'disabled'}>Check sentence →</button>` : ''}
        </div>
        <p class="quest-feedback ${session.feedback ? session.phase === 'won' ? 'is-success' : 'is-warning' : ''}" role="status" aria-live="polite">${esc(session.feedback || 'Complete the sentence to open the gate. You have three hearts for five encounters.')}</p>
        ${session.phase === 'won' ? `<div class="quest-won-panel">
          <span class="quest-won-icon" aria-hidden="true">✓</span>
          <div><span class="game-kicker">GATE OPENED!</span><strong lang="${code}">${esc(round.target)}</strong>
            <p>${esc(why)}</p></div>
          <button id="quest-next" class="game-primary">${round.boss ? 'Claim your stars →' : 'Next encounter →'}</button>
        </div>` : ''}
      </div>
    </div>
    <p class="quest-key-help">Keyboard: 1–9 to place a block · Backspace to undo · Enter to check or continue</p>
  </section>`;
}
