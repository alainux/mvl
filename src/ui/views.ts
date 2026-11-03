import type { GeneratedExample, GeneratedGuide, GeneratedLesson } from '../learning/types.js';
import { escapeHtml as escape } from './dom.js';
import { href, type Code, type Route } from './router.js';
import { completedLessons, gameStats, getLanguage, questRecords } from './state.js';
import { drillQuestions, levelUnlocked, memoryExamples, meaningBlocks, nextLevelIndex, playableLesson } from './game-model.js';
import { renderStudio } from './studio-view.js';
import { renderQuest } from './quest-view.js';
import type { QuestSession } from './quest-model.js';
import { clozeFor, clozeHint } from './drill-cloze.js';
import { fromExpression } from './studio-model.js';

const NAMES: Readonly<Record<Code, string>> = { de: 'German', fr: 'French', es: 'Spanish' };
const STAGES = [
  { id: 'foundation', name: 'Arrival Port', subtitle: 'Find your voice and enter the city', symbol: '⚓' },
  { id: 'time-and-plans', name: 'Clocktower District', subtitle: 'Untangle yesterday and tomorrow', symbol: '◷' },
  { id: 'connected-speech', name: 'Bridge Quarter', subtitle: 'Connect people, questions and reasons', symbol: '◇' },
  { id: 'everyday-life', name: 'Market Maze', subtitle: 'Make your way through everyday situations', symbol: '⌁' },
  { id: 'independent-speech', name: 'The Lighthouse', subtitle: 'Bring your patterns together', symbol: '✦' },
] as const;

export interface DrillSession {
  readonly key: string;
  readonly index: number;
  readonly score: number;
  readonly streak: number;
  readonly best: number;
  readonly points: number;
  readonly answered: boolean;
  readonly chosen: string | null;
  readonly correct: boolean;
  readonly hints: 0 | 1 | 2;
  readonly lastGain: number;
}
export interface CardSession {
  readonly key: string;
  readonly ids: readonly string[];
  readonly index: number;
  readonly flipped: boolean;
  readonly known: number;
  readonly again: number;
}

function padded(number: number): string { return String(number).padStart(2, '0'); }

function currentLesson(model: GeneratedGuide): GeneratedLesson {
  const next = nextLevelIndex(model, completedLessons(model.language.code));
  const lesson = model.lessons[next];
  if (!lesson) throw new Error('Guide must contain a level');
  return lesson;
}

function sidebar(route: Route, model: GeneratedGuide): string {
  const code = model.language.code;
  const stats = gameStats(code);
  const completed = completedLessons(code).size;
  const totalStars = Object.values(questRecords(code)).reduce((sum, record) => sum + record.stars, 0);
  const nav = [
    { page: 'start', icon: '◈', label: 'Campaign', caption: 'Play your next quest' },
    { page: 'builder', icon: '▦', label: 'Builder', caption: 'Play with blocks' },
    { page: 'practice', icon: '⚡', label: 'Speed drill', caption: 'Quick-fire rounds' },
    { page: 'cards', icon: '▤', label: 'Memory cards', caption: 'Keep it fresh' },
  ] as const;
  return `<aside class="sidebar game-sidebar" id="sidebar" aria-label="Game navigation">
    <a class="brand game-brand" href="${href(code, 'start')}" aria-label="MVL level map">
      <span class="brand-mark">mvl<span>.</span></span>
      <span class="brand-copy"><strong>Build your language</strong><small>THE LANGUAGE GAME</small></span>
    </a>
    <label class="sidebar-label" for="language-switch">I'M LEARNING</label>
    <select id="language-switch" aria-label="Select language">
      ${(['de', 'fr', 'es'] as const).map((item) => `<option value="${item}" ${item === code ? 'selected' : ''}>${NAMES[item]}</option>`).join('')}
    </select>
    <div class="sidebar-label has-top">PLAY</div>
    <nav class="sidebar-group game-nav" aria-label="Study tools">
      ${nav.map((item) => `<a class="sidebar-link game-nav-item ${route.page === item.page || (item.page === 'start' && (route.page === 'lesson' || route.page === 'play')) ? 'is-active' : ''}"
        href="${href(code, item.page)}"><span class="nav-icon">${item.icon}</span>
        <span><strong>${item.label}</strong><small>${item.caption}</small></span></a>`).join('')}
    </nav>
    <div class="game-sidebar-score">
      <span class="micro-label">YOUR ADVENTURE</span>
      <strong>${stats.xp} <small>XP</small></strong>
      <div class="game-mini-track"><span style="width:${Math.round(completed / model.lessons.length * 100)}%"></span></div>
      <p>${completed} of ${model.lessons.length} levels cleared · ${totalStars} ★</p>
    </div>
    <div class="sidebar-footer"><a href="#home">Change language</a><a href="#framework">About MVL</a></div>
  </aside>`;
}

function titleFor(route: Route, model: GeneratedGuide): string {
  switch (route.page) {
    case 'home': return 'Choose language';
    case 'framework': return 'The idea';
    case 'start': return 'Campaign';
    case 'play': return 'Sentence quest';
    case 'builder': return 'Block builder';
    case 'practice': return 'Speed drill';
    case 'cards': return 'Memory cards';
    case 'reference': return 'Levels';
    case 'lesson': return model.lessons.find((lesson) => lesson.id === route.lesson)?.title ?? 'Level';
  }
}

export function renderShell(route: Route, content: string, model: GeneratedGuide): string {
  const code = model.language.code;
  const stats = gameStats(code);
  return `<div class="app-shell game-shell">
    ${sidebar(route, model)}
    <div class="workspace game-workspace">
      <header class="topbar game-topbar">
        <button id="menu-toggle" class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button>
        <div class="breadcrumbs"><a href="${href(code, 'start')}">${escape(NAMES[code])}</a><span>/</span>${escape(titleFor(route, model))}</div>
        <div class="topbar-actions"><span class="game-top-score" aria-label="Experience points">✦ ${stats.xp} XP</span>
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle light and dark theme" title="Toggle theme">◐</button></div>
      </header>
      <main class="main" id="main-content">${content}</main>
      <footer class="footer"><span>mvl. · Learn by playing</span><span>Made from reusable grammar, not phrase lists.</span></footer>
    </div>
    <button id="nav-backdrop" class="nav-backdrop" aria-label="Close navigation" hidden></button>
  </div>`;
}

function renderHome(guides: Readonly<Record<Code, GeneratedGuide>>): string {
  return `<section class="page game-home">
    <span class="game-kicker">HELLO, LANGUAGE EXPLORER ✦</span>
    <h1>Words are blocks.<br><em>Learning is play.</em></h1>
    <p class="lead">Choose your language, enter the campaign, and forge sentences to open each gate. Drills and memory cards help you keep your powers sharp.</p>
    <div class="game-language-grid">
      ${(['de', 'fr', 'es'] as const).map((code) => `<a class="game-language-tile" href="${href(code, 'start')}">
        <span class="game-language-code">${code.toUpperCase()}</span><strong>${NAMES[code]}</strong>
        <small>${completedLessons(code).size} / ${guides[code].lessons.length} levels</small><span class="game-tile-arrow">→</span></a>`).join('')}
    </div>
  </section>`;
}

function modeCards(code: Code, lesson: GeneratedLesson): string {
  return `<div class="game-modes">
    <a class="game-mode game-mode-builder" href="${href(code, 'play/' + lesson.id)}"><span class="game-mode-icon">⚔</span>
      <strong>Play a quest</strong><small>Forge sentences. Win stars. Open gates.</small><span>Enter the game →</span></a>
    <a class="game-mode game-mode-drill" href="${href(code, 'practice/' + lesson.id)}"><span class="game-mode-icon">⚡</span>
      <strong>Speed drill</strong><small>Fast answers. A strong streak.</small><span>Play a round →</span></a>
    <a class="game-mode game-mode-memory" href="${href(code, 'cards/' + lesson.id)}"><span class="game-mode-icon">▤</span>
      <strong>Memory cards</strong><small>Flip, recall and remember</small><span>Review cards →</span></a>
  </div>`;
}

function renderOverview(model: GeneratedGuide): string {
  const code = model.language.code;
  const completed = completedLessons(code);
  const records = questRecords(code);
  const current = currentLesson(model);
  const currentIndex = model.lessons.indexOf(current);
  const progress = Math.round(completed.size / model.lessons.length * 100);
  const groups = STAGES.map((stage) => {
    const lessons = model.lessons.map((lesson, index) => ({ lesson, index })).filter(({ lesson }) => lesson.stage === stage.id);
    if (!lessons.length) return '';
    return `<section class="game-world" aria-label="${escape(stage.name)}">
      <div class="game-world-heading"><span class="game-world-icon">${stage.symbol}</span><div><span class="micro-label">WORLD ${STAGES.indexOf(stage) + 1}</span>
        <h2>${escape(stage.name)}</h2><p>${escape(stage.subtitle)}</p></div></div>
      <div class="game-level-grid">
        ${lessons.map(({ lesson, index }) => {
          const done = completed.has(lesson.id);
          const open = levelUnlocked(model, completed, index);
          const score = records[lesson.id]?.stars ?? 0;
          const cleared = score ? '★'.repeat(score) + '☆'.repeat(3 - score) + ' · Cleared' : '✓ Cleared';
          const label = `<span class="game-level-number">${padded(index + 1)}</span><span class="game-level-copy"><strong>${escape(lesson.title)}</strong><small>${done ? cleared : open ? '● Ready to play' : '○ Unlock later'}</small></span><span class="game-level-arrow">${done ? '✓' : open ? '↗' : '⌑'}</span>`;
          return open ? `<a class="game-level-node ${done ? 'is-done' : 'is-current'}" href="${href(code, 'lesson/' + lesson.id)}">${label}</a>`
            : `<div class="game-level-node is-locked" aria-label="Level ${index + 1} locked">${label}</div>`;
        }).join('')}
      </div>
    </section>`;
  }).join('');
  return `<section class="page game-page game-overview">
    <div class="game-hero">
      <div><span class="game-kicker">✦ YOUR LANGUAGE QUEST · ${escape(NAMES[code].toUpperCase())}</span>
        <h1>Words are your power.<br><em>Open the next gate.</em></h1>
        <p>Five encounters. Three hearts. One final gate. Arrange real language blocks to clear the quest and unlock your next chapter.</p>
        <a class="game-primary" href="${href(code, 'play/' + current.id)}">${completed.size ? 'Continue your quest' : 'Enter your first quest'} <span>→</span></a>
        <a class="game-hero-secondary" href="${href(code, 'lesson/' + current.id)}">Explore the worked examples ↗</a>
      </div>
      <div class="game-hero-progress">
        <span class="micro-label">YOUR PROGRESS</span>
        <strong>${padded(currentIndex + 1)}<small> / 40</small></strong>
        <div class="game-mini-track"><span style="width:${progress}%"></span></div>
        <p>${completed.size} levels cleared · ${progress}% complete</p>
        <span class="game-progress-orb">✦</span>
      </div>
    </div>
    <div class="game-section-heading"><div><span class="micro-label">THREE WAYS TO LEARN</span><h2>Three ways to train.</h2></div></div>
    ${modeCards(code, current)}
    <div class="game-section-heading game-map-heading"><div><span class="micro-label">THE ADVENTURE</span><h2>Your level map.</h2></div><p>Win a five-encounter sentence quest to unlock the next level.</p></div>
    ${groups}
  </section>`;
}

function exampleTile(example: GeneratedExample, code: Code, index: number): string {
  const editable = example.source.kind === 'expression' && fromExpression(example.source.expression) !== null;
  return `<div class="game-example-card">
    <div class="game-example-top"><span>EXAMPLE ${padded(index + 1)}</span><span>${editable ? 'EDITABLE BLOCKS' : 'EVERYDAY EXPRESSION'}</span></div>
    <div class="game-example-blocks">${meaningBlocks(example).map((block) => `<span>${escape(block)}</span>`).join('')}</div>
    <strong lang="${code}">${escape(example.target)}</strong>
    <p>${escape(example.english)}</p>
    ${editable
      ? `<button type="button" class="game-example-play" data-remix-example="${escape(example.id)}">Open in builder ↗</button>`
      : `<span class="game-example-hint">Practice this in memory cards</span>`}
  </div>`;
}

function renderLevel(model: GeneratedGuide, lesson: GeneratedLesson): string {
  const code = model.language.code;
  const index = model.lessons.indexOf(lesson);
  const completed = completedLessons(code);
  if (!levelUnlocked(model, completed, index)) {
    const previous = model.lessons[nextLevelIndex(model, completed)];
    return `<section class="page game-page game-locked-page">
      <span class="game-kicker">LEVEL ${padded(index + 1)} · LOCKED</span><h1>One level at a time.</h1>
      <p>Beat the previous level's sentence quest to unlock ${escape(lesson.title)}.</p>
      <a class="game-primary" href="${href(code, 'lesson/' + (previous?.id ?? lesson.id))}">Go to your next level →</a>
    </section>`;
  }
  // Show productive configurations first; routine greetings are memory cards,
  // never mistaken for independently composable grammar.
  const allExamples = [
    ...lesson.examples.filter((item) => item.source.kind === 'expression'),
    ...lesson.examples.filter((item) => item.source.kind === 'convention'),
  ];
  const examples = allExamples.slice(0, 4);
  const extraExamples = allExamples.slice(4, 12);
  return `<article class="page game-page game-level-page" data-lesson="${lesson.id}">
    <a class="game-back" href="${href(code, 'start')}">← All levels</a>
    <div class="game-level-hero"><div><span class="game-kicker">✦ LEVEL ${padded(index + 1)} / ${model.lessons.length}</span>
      <h1>${escape(lesson.title)}</h1><p>${escape(lesson.goal)}.</p></div>
      <div class="game-level-medal">${completed.has(lesson.id) ? '★' : padded(index + 1)}<small>${completed.has(lesson.id) ? 'CLEARED' : 'LEVEL'}</small></div>
    </div>
    <div class="game-level-quest-cta">
      <div><span class="game-kicker">YOUR NEXT CHALLENGE</span><strong>Five encounters. Three hearts. One boss gate.</strong>
        <p>Build the real sentences in the right order. Beat the gate to earn stars and unlock the next level.</p></div>
      <a class="game-primary" href="${href(code, 'play/' + lesson.id)}">⚔ Enter the quest →</a>
    </div>
    <div class="game-rule"><span class="game-rule-symbol">✧</span><div><span class="micro-label">TODAY'S POWER-UP</span>
      <strong>${escape(lesson.notes.recipe)}</strong><p>${escape(lesson.notes.explanation)}</p></div></div>
    <div class="game-section-heading"><div><span class="micro-label">OPTIONAL PREPARATION · LEARN A MOVE</span><h2>Study a move, then play it.</h2></div>
      <p>Every editable example is a pre-built block configuration. Open it and change one thing.</p></div>
    <div class="game-example-grid">${examples.map((example, i) => exampleTile(example, code, i)).join('')}</div>
    ${extraExamples.length ? `<details class="game-more-examples"><summary>Explore more prebuilt block configurations (+${extraExamples.length})</summary>
      <div class="game-example-grid">${extraExamples.map((example, i) => exampleTile(example, code, i + 4)).join('')}</div>
    </details>` : ''}
    <div class="game-level-finish"><div><span class="micro-label">02 · YOUR TURN</span><h2>Ready for a round?</h2>
      <p>Build five sentences to open the gate. Drills and memory cards help you prepare.</p></div>
      <div><a class="game-primary" href="${href(code, 'play/' + lesson.id)}">⚔ Enter the quest →</a>
        <a class="game-secondary" href="${href(code, 'practice/' + lesson.id)}">⚡ Speed drill</a>
        <a class="game-secondary" href="${href(code, 'cards/' + lesson.id)}">▤ Review cards</a></div></div>
  </article>`;
}

function renderDrill(model: GeneratedGuide, lesson: GeneratedLesson, session: DrillSession): string {
  const code = model.language.code;
  const questions = drillQuestions(model, lesson);
  if (session.index >= questions.length) {
    const accuracy = Math.round(100 * session.score / questions.length);
    const cleared = accuracy >= 70;
    return `<section class="page game-page game-drill-page cloze-page">
      <div class="game-round-end cloze-finish">
        <span class="game-kicker">PHRASE DRILL · ROUND COMPLETE</span>
        <span class="game-celebrate">${cleared ? '✦' : '↻'}</span>
        <h1>${cleared ? 'Drill conquered!' : 'Try another round.'}</h1>
        <p>${cleared ? 'You recalled the missing words in real sentences. Bring that skill into the sentence quest.' : 'Repeat the phrases you missed and build your recall.'}</p>
        <div class="game-round-stats">
          <span><strong>${accuracy}%</strong>Accuracy</span>
          <span><strong>${session.best}</strong>Longest streak</span>
          <span><strong>${session.points}</strong>XP earned</span>
        </div>
        <small>Hints help you learn. Unassisted answers earn the most XP. Drills don't unlock levels on their own.</small>
        <div class="game-round-actions"><button class="game-primary" id="drill-restart">↻ Practice again</button>
          <a class="game-secondary" href="${href(code, 'play/' + lesson.id)}">Play sentence quest →</a>
          <a class="game-secondary" href="${href(code, 'cards/' + lesson.id)}">Memory cards</a></div>
      </div></section>`;
  }
  const question = questions[session.index];
  if (!question) throw new Error('Missing drill question');
  const cloze = clozeFor(question.target, session.index, code);
  const progress = Math.round(session.index / questions.length * 100);
  const completed = session.index + (session.answered ? 1 : 0);
  return `<section class="page game-page game-drill-page cloze-page">
    <header class="cloze-heading">
      <div><span class="game-kicker">⚡ PHRASE DRILL · LEVEL ${padded(model.lessons.indexOf(lesson) + 1)}</span>
        <h1>Fill the gap.</h1><p>One missing word. Real sentences. Your answer.</p></div>
      <a class="game-back" href="${href(code, 'lesson/' + lesson.id)}">← Leave drill</a>
    </header>
    <div class="cloze-toolbar">
      <label for="drill-lesson">LEVEL</label><select id="drill-lesson">
        ${model.lessons.map((item, i) => `<option value="${item.id}" ${item.id === lesson.id ? 'selected' : ''} ${levelUnlocked(model, completedLessons(code), i) ? '' : 'disabled'}>${padded(i + 1)} · ${escape(item.title)}</option>`).join('')}
      </select>
      <span class="cloze-session-stat">✦ ${session.points} XP <span>·</span> 🔥 ${session.streak} streak</span>
    </div>
    <div class="cloze-shell">
      <div class="cloze-meter">
        <span>PHRASE <strong>${padded(session.index + 1)}</strong> / ${padded(questions.length)}</span>
        <span>${session.score} correct <b>·</b> ${session.best} best streak</span>
      </div>
      <div class="cloze-progress" role="progressbar" aria-label="Drill progress" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${completed}">
        <span style="width:${completed / questions.length * 100}%"></span>
      </div>
      <div class="cloze-prompt">
        <span class="cloze-label">COMPLETE THE PHRASE</span>
        <p class="cloze-translation">${escape(question.english)}</p>
        ${question.contextHint ? `<span class="cloze-register">${escape(question.contextHint)}</span>` : ''}
        <div class="cloze-target" lang="${code}" aria-label="Sentence with one missing word">
          ${escape(cloze.before)}<span class="cloze-blank ${session.answered ? session.correct ? 'is-right' : 'is-wrong' : ''}" aria-label="Missing word">${session.answered ? escape(cloze.word) : '······'}</span>${escape(cloze.after)}
        </div>
      </div>
      ${!session.answered ? `<form id="drill-cloze-form" autocomplete="off">
        <label for="drill-input">MISSING WORD</label>
        <div class="cloze-input-row">
          <input id="drill-input" name="answer" type="text" enterkeyhint="done" autocapitalize="off" autocomplete="off"
            autocorrect="off" spellcheck="false" placeholder="Type the missing word…" aria-describedby="drill-hint-message" required>
          <button type="submit" class="game-primary" id="drill-check">Check ↵</button>
        </div>
      </form>
      <div class="cloze-assists">
        <button id="drill-hint" type="button" ${session.hints === 2 ? 'disabled' : ''}>✧ ${session.hints === 0 ? 'Need a hint?' : session.hints === 1 ? 'Another hint' : 'Hints revealed'}</button>
        <button id="drill-reveal" type="button">Show the word / skip →</button>
      </div>
      <p id="drill-hint-message" class="cloze-hint" role="status" aria-live="polite">${session.hints ? escape(clozeHint(cloze, session.hints)) : 'Hints are optional. Try remembering before revealing them.'}</p>
      ` : `<div id="drill-feedback" class="cloze-feedback ${session.correct ? 'is-correct' : 'is-wrong'}" role="status" aria-live="polite">
        <strong>${session.correct ? '✓ That’s it! +' + session.lastGain + ' XP' : session.chosen ? 'Not quite — here is the word.' : 'Answer revealed — try recalling it next time.'}</strong>
        ${session.chosen && !session.correct ? `<span class="cloze-your-answer">You entered: ${escape(session.chosen)}</span>` : ''}
        <div class="cloze-complete" lang="${code}">${escape(question.target)}</div>
        ${!session.correct && question.patternHint ? `<p>${escape(question.patternHint)}</p>` : ''}
        <button id="drill-next" type="button" class="game-primary">${session.index + 1 === questions.length ? 'See results →' : 'Next phrase →'}</button>
      </div>`}
      <p class="cloze-footnote">Type one word · Enter to check · ${session.answered ? 'Enter for next' : 'No countdown'} · Hints only if you need them</p>
    </div>
  </section>`;
}

function renderCards(model: GeneratedGuide, lesson: GeneratedLesson, session: CardSession): string {
  const code = model.language.code;
  const examples = memoryExamples(lesson);
  const example = examples.find((candidate) => lesson.id + ':' + candidate.id === session.ids[session.index]);
  if (!example) {
    return `<section class="page game-page game-memory-page">
      <div class="game-round-end"><span class="game-celebrate">✦</span><span class="game-kicker">MEMORY MODE</span>
        <h1>Deck complete.</h1><p>${session.ids.length === 0 ? 'Nothing is due right now. Your reviewed cards return after an interval.' : 'Great review. The cards you remembered will reappear later; missed cards are ready to try again.'}</p>
        <div class="game-round-stats"><span><strong>${session.known}</strong>Remembered</span><span><strong>${session.again}</strong>Try again</span></div>
        <a class="game-primary" href="${href(code, 'lesson/' + lesson.id)}">Back to level →</a>
        <a class="game-secondary" href="${href(code, 'start')}">Level map</a></div>
    </section>`;
  }
  return `<section class="page game-page game-memory-page">
    <div class="game-section-heading"><div><span class="game-kicker">▤ MEMORY CARDS · LEVEL ${padded(model.lessons.indexOf(lesson) + 1)}</span>
      <h1>Make it stick.</h1></div><a class="game-back" href="${href(code, 'lesson/' + lesson.id)}">← Level examples</a></div>
    <div class="game-card-toolbar"><label for="cards-lesson">DECK</label><select id="cards-lesson">
      ${model.lessons.map((item, i) => `<option value="${item.id}" ${item.id === lesson.id ? 'selected' : ''} ${levelUnlocked(model, completedLessons(code), i) ? '' : 'disabled'}>${padded(i + 1)} · ${escape(item.title)}</option>`).join('')}
    </select><span>${session.index + 1} / ${session.ids.length} cards</span></div>
    <div class="game-memory-progress game-mini-track"><span style="width:${Math.round(session.index / session.ids.length * 100)}%"></span></div>
    <button id="card-flip" class="game-flashcard ${session.flipped ? 'is-flipped' : ''}" aria-label="${session.flipped ? 'Show English meaning' : 'Reveal target sentence'}" aria-pressed="${session.flipped}">
      <span class="game-flash-top">${session.flipped ? escape(NAMES[code].toUpperCase()) : 'THE MEANING'}</span>
      <strong lang="${session.flipped ? code : 'en'}">${escape(session.flipped ? example.target : example.english)}</strong>
      <span class="game-flash-bottom">${session.flipped ? 'TAP TO SEE MEANING ↺' : 'TAP TO FLIP ↗'}</span>
    </button>
    <div class="game-card-controls">
      ${session.flipped ? `<button class="game-recall-again" id="card-again">↻ Again <small>1</small></button>
        <button class="game-recall-known" id="card-known">✓ Got it <small>2</small></button>`
      : `<p>Say the sentence before flipping. <kbd>Space</kbd> reveals it.</p>`}
    </div>
    <p class="game-memory-note">Remembered cards come back later. Cards marked “Again” remain due for another review.</p>
  </section>`;
}

export function renderContent(
  route: Route,
  guides: Readonly<Record<Code, GeneratedGuide>>,
  drill: DrillSession | null,
  cards: CardSession | null,
  quest: QuestSession | null,
): string {
  if (route.page === 'home') return renderHome(guides);
  if (route.page === 'framework') return `<section class="page game-page game-home">
    <span class="game-kicker">ABOUT THE GAME</span><h1>Small rules.<br><em>Big possibilities.</em></h1>
    <p class="lead">MVL teaches a small, productive language system. Levels, drills and memory cards are different ways of working with the same generated semantic examples, not unrelated phrase lists.</p>
    <a class="game-primary" href="${href(getLanguage(), 'start')}">Back to levels →</a>
    <p><a href="https://github.com/alainux/mvl">Source and grammar framework</a></p>
  </section>`;
  const model = guides[route.code];
  switch (route.page) {
    case 'start': case 'reference': return renderOverview(model);
    case 'builder': return renderStudio();
    case 'play': {
      const lesson = playableLesson(model, completedLessons(route.code), route.lesson);
      if (!quest) throw new Error('Quest session not initialized');
      return renderQuest(model, lesson, quest);
    }
    case 'lesson': return renderLevel(model, model.lessons.find((lesson) => lesson.id === route.lesson) ?? currentLesson(model));
    case 'practice': {
      const lesson = playableLesson(model, completedLessons(route.code), route.lesson);
      if (!drill) throw new Error('Drill session must be initialized');
      return renderDrill(model, lesson, drill);
    }
    case 'cards': {
      const lesson = playableLesson(model, completedLessons(route.code), route.lesson);
      if (!cards) throw new Error('Card session must be initialized');
      return renderCards(model, lesson, cards);
    }
  }
}

export function activeLanguage(route: Route): Code {
  return route.page === 'home' || route.page === 'framework' ? getLanguage() : route.code;
}

export function searchGuide(model: GeneratedGuide, rawQuery: string): readonly { label: string; description: string; url: string }[] {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];
  return model.lessons.filter((lesson) => (lesson.title + ' ' + lesson.goal).toLowerCase().includes(query))
    .slice(0, 6).map((lesson) => ({ label: lesson.title, description: lesson.goal,
      url: href(model.language.code, 'lesson/' + lesson.id) }));
}
