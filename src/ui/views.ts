import { PREDICATES, CONCEPTS } from '../core/vocabulary.js';
import { generatePractice } from '../learning/practice.js';
import type {
  GeneratedExample,
  GeneratedGuide,
  GeneratedLesson,
  LessonId,
} from '../learning/types.js';
import { escapeHtml as escape } from './dom.js';
import { href, type Code, type Route } from './router.js';
import { completedLessons, getLanguage } from './state.js';
import { renderStudio } from './studio-view.js';
import { fromExpression } from './studio-model.js';

const LANGUAGE_NAMES: Readonly<Record<Code, string>> = {
  de: 'German',
  fr: 'French',
  es: 'Spanish',
};

const TAGLINES: Readonly<Record<Code, string>> = {
  de: 'Clear German, built from reusable rules.',
  fr: 'Clear French, built from reusable rules.',
  es: 'Clear Spanish, built from reusable rules.',
};

function selected(value: string, current: string): string {
  return value === current ? 'selected' : '';
}

function active(route: Route, page: string, id?: string): string {
  if (route.page !== page) return '';
  return route.page === 'lesson' && id !== undefined && route.lesson !== id ? '' : 'is-active';
}

function lessonLabel(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function renderSidebar(route: Route, model: GeneratedGuide): string {
  const code = model.language.code;
  const completed = completedLessons(code);
  const navigation = model.lessons.map((lesson, index) => `
    <a class="sidebar-link lesson-link ${active(route, 'lesson', lesson.id)}"
       href="${href(code, `lesson/${lesson.id}`)}">
      <span class="nav-index">${lessonLabel(index)}</span>
      <span class="nav-link-label">${escape(lesson.title)}</span>
      ${completed.has(lesson.id) ? '<span class="lesson-check" aria-label="Studied">✓</span>' : ''}
    </a>
  `).join('');

  return `<aside class="sidebar" id="sidebar" aria-label="Guide navigation">
    <a class="brand" href="#home" aria-label="Minimum Viable Language home">
      <span class="brand-mark">mvl<span>.</span></span>
      <span class="brand-copy"><strong>Minimum Viable</strong><small>Language manuals</small></span>
    </a>

    <label class="sidebar-label" for="language-switch">CURRENT MANUAL</label>
    <select id="language-switch" aria-label="Select language">
      ${(['de', 'fr', 'es'] as const).map((item) => `<option value="${item}" ${selected(item, code)}>${LANGUAGE_NAMES[item]}</option>`).join('')}
    </select>

    <div class="sidebar-label has-top">STUDY</div>
    <nav class="sidebar-group" aria-label="Study tools">
      <a class="sidebar-link ${active(route, 'builder')}" href="${href(code, 'builder')}"><span class="nav-icon">▦</span> Block studio</a>
      <a class="sidebar-link ${active(route, 'start')}" href="${href(code, 'start')}"><span class="nav-icon">⌂</span> Learning path</a>
      <a class="sidebar-link ${active(route, 'practice')}" href="${href(code, 'practice')}"><span class="nav-icon">✎</span> Practice lab</a>
      <a class="sidebar-link ${active(route, 'reference')}" href="${href(code, 'reference')}"><span class="nav-icon">≡</span> Quick reference</a>
    </nav>

    <div class="sidebar-label has-top label-flex"><span>LESSONS</span><span>${completed.size}/${model.lessons.length}</span></div>
    <nav class="sidebar-group sidebar-lessons" aria-label="Lessons">${navigation}</nav>
    <div class="sidebar-footer">
      <a href="#framework">About the project</a>
      <a href="https://github.com/alainux/mvl" target="_blank" rel="noopener noreferrer">Source code ↗</a>
    </div>
  </aside>`;
}

function titleFor(route: Route, guide: GeneratedGuide): string {
  switch (route.page) {
    case 'home': return 'Choose a language';
    case 'framework': return 'About the project';
    case 'start': return 'Overview';
    case 'builder': return 'Block studio';
    case 'practice': return 'Practice lab';
    case 'reference': return 'Quick reference';
    case 'lesson': return guide.lessons.find((lesson) => lesson.id === route.lesson)?.title ?? 'Lesson';
  }
}

function renderHeader(route: Route, guide: GeneratedGuide): string {
  return `<header class="topbar">
    <button id="menu-toggle" class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button>
    <div class="breadcrumbs"><a href="${href(guide.language.code, 'start')}">${escape(guide.language.name)}</a><span>/</span>${escape(titleFor(route, guide))}</div>
    <div class="topbar-actions">
      <div class="search-area">
        <label class="visually-hidden" for="site-search">Search this manual</label>
        <input type="search" id="site-search" autocomplete="off" placeholder="Search the manual…" />
        <span class="search-shortcut">/</span>
        <div class="search-results" id="search-results" hidden></div>
      </div>
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle light and dark theme" title="Toggle theme">◐</button>
    </div>
  </header>`;
}

export function renderShell(route: Route, content: string, guide: GeneratedGuide): string {
  return `<div class="app-shell">
    ${renderSidebar(route, guide)}
    <div class="workspace">
      ${renderHeader(route, guide)}
      <main class="main" id="main-content">${content}</main>
      <footer class="footer"><span>Minimum Viable ${escape(guide.language.name)}</span><span>Small rules, useful language.</span></footer>
    </div>
    <button id="nav-backdrop" class="nav-backdrop" aria-label="Close navigation" hidden></button>
  </div>`;
}

function renderLanguageCard(guide: GeneratedGuide): string {
  const code = guide.language.code;
  const total = guide.lessons.length;
  const completed = completedLessons(code).size;
  const width = Math.round((completed / total) * 100);

  return `<a class="language-card" href="${href(code, 'builder')}">
    <span class="language-letters">${code.toUpperCase()}</span>
    <span class="language-card-arrow">↗</span>
    <h3>${escape(guide.language.name)}</h3>
    <p>${escape(TAGLINES[code])}</p>
    <div class="progress-rail"><span style="width:${width}%"></span></div>
    <small>${completed} of ${total} lessons studied</small>
  </a>`;
}

function renderHome(guides: Readonly<Record<Code, GeneratedGuide>>): string {
  return `<section class="page home-page">
    <div class="eyebrow"><span class="eyebrow-line"></span>INDEPENDENT LANGUAGE STUDY</div>
    <h1>Learn the useful parts.<br /><em>Start communicating.</em></h1>
    <p class="lead">See the meaning blocks, snap them together, and watch real sentences emerge. Practice the smallest useful grammar for today, yesterday, tomorrow—and everyday life.</p>
    <div class="section-heading"><h2>Choose your manual</h2><p>Choose a language to start building your own sentences.</p></div>
    <div class="language-grid">${(['de', 'fr', 'es'] as const).map((code) => renderLanguageCard(guides[code])).join('')}</div>
    <div class="principles">
      <div><b>01 <span>Understand</span></b><p>Explore the meaning blocks and the possibilities each one unlocks.</p></div>
      <div><b>02 <span>Substitute</span></b><p>Connect who, action and object; add operators like past or not.</p></div>
      <div><b>03 <span>Produce</span></b><p>Build a target expression, then use it in new situations.</p></div>
    </div>
  </section>`;
}

function renderGuideOverview(model: GeneratedGuide): string {
  const code = model.language.code;
  const completed = completedLessons(code);
  const firstUnfinished = model.lessons.find((lesson) => !completed.has(lesson.id)) ?? model.lessons[0];
  if (!firstUnfinished) throw new Error('A guide must contain at least one lesson');
  const examples = model.lessons.reduce((total, lesson) => total + lesson.examples.length, 0);

  const chapters = model.lessons.map((lesson, index) => `
    <a class="chapter" href="${href(code, `lesson/${lesson.id}`)}">
      <span class="chapter-number">${lessonLabel(index)}</span>
      <span class="chapter-copy"><strong>${escape(lesson.title)}</strong><small>${escape(lesson.goal)}</small></span>
      <span class="chapter-arrow">${completed.has(lesson.id) ? '✓' : '↗'}</span>
    </a>`).join('');

  const featured = model.lessons.find((lesson) => lesson.id === 'ability')?.examples[1];
  return `<section class="page overview-page">
    <div class="eyebrow">THE PRACTICAL MANUAL · ${escape(model.language.variety.toUpperCase())}</div>
    <h1>Minimum Viable<br /><em>${escape(model.language.name)}.</em></h1>
    <p class="lead">${escape(TAGLINES[code])} Start by assembling sentences as visual blocks. The lessons explain the grammar when you want to understand a transformation in more depth.</p>
    <div class="hero-buttons">
      <a class="button primary" href="${href(code, 'builder')}">Open block studio <span>↗</span></a>
      <a class="button secondary" href="${href(code, `lesson/${firstUnfinished.id}`)}">${completed.size ? 'Continue lessons' : 'Follow the learning path'}</a>
    </div>
    <div class="guide-metrics"><span><strong>${model.lessons.length}</strong> lessons</span><span><strong>${examples}</strong> worked examples</span><span><strong>${completed.size}</strong> studied</span></div>
    ${featured ? `<div class="sample-card"><span class="micro-label">A USEFUL PATTERN</span><strong lang="${code}">${escape(featured.target)}</strong><p>${escape(featured.english)}</p></div>` : ''}
    <div class="section-heading"><h2>Learning path</h2><p>Study in order, or open the rule you need.</p></div>
    <div class="chapter-list">${chapters}</div>
    <aside class="aside-note"><strong>Small on purpose.</strong> These lessons teach a productive A2-oriented subset, not the whole language. You can speak simply and gradually expand what you understand.</aside>
  </section>`;
}

function renderExample(example: GeneratedExample, code: Code): string {
  const canRemix = example.source.kind === 'expression'
    && fromExpression(example.source.expression) !== null;
  return `<div class="example-row">
    <div class="example-copy"><strong lang="${code}">${escape(example.target)}</strong><small>${escape(example.english)}</small></div>
    <div class="example-actions">${canRemix ? `<button class="copy-button" data-remix-example="${escape(example.id)}" title="Open this meaning in the block studio">Remix ↗</button>` : ''}<button class="copy-button" data-copy-example="${escape(example.id)}" aria-label="Copy example" title="Copy sentence">Copy</button></div>
  </div>`;
}

function renderSubstitution(lesson: GeneratedLesson, code: Code): string {
  const source = lesson.examples.find((example) =>
    example.source.kind === 'expression' && example.source.selection !== undefined);
  if (!source || source.source.kind !== 'expression' || !source.source.selection) return '';

  const selection = source.source.selection;
  const available = PREDICATES[selection.predicate].allowedArguments
    .filter((argument) => selection.predicate !== 'help' || selection.agent !== argument);
  if (available.length <= 1) return '';

  const options = available.map((argument) => `
    <option value="${argument}" ${selected(argument, selection.argument)}>${escape(CONCEPTS[argument])}</option>`).join('');

  return `<div class="substitution-panel" data-initial-example="${escape(source.id)}">
    <div><span class="micro-label">CHANGE ONE BUILDING BLOCK</span><p>Try replacing the object. The rest of the sentence adapts automatically.</p></div>
    <label for="substitution-argument">Replace the object</label>
    <select id="substitution-argument">${options}</select>
    <strong id="substitution-output" lang="${code}">${escape(source.target)}</strong>
    <small id="substitution-english">${escape(source.english)}</small>
  </div>`;
}

function renderLesson(model: GeneratedGuide, lesson: GeneratedLesson): string {
  const code = model.language.code;
  const index = model.lessons.findIndex((item) => item.id === lesson.id);
  const prev = model.lessons[index - 1];
  const next = model.lessons[index + 1];
  const completed = completedLessons(code).has(lesson.id);
  const practice = generatePractice(lesson, code, 1)[0];

  return `<article class="page lesson-page" data-lesson="${lesson.id}">
    <div class="eyebrow">LESSON ${lessonLabel(index)} / ${model.lessons.length} · ${escape(model.language.name.toUpperCase())}</div>
    <h1>${escape(lesson.title)}</h1>
    <p class="lead">${escape(lesson.goal)}.</p>
    <p class="lesson-intro">${escape(lesson.introduction)}</p>
    <div class="lesson-studio-jump"><span><strong>Make it yours.</strong> Open any worked example as editable blocks, or start from a blank canvas.</span>
      <a class="button primary" href="${href(code, 'builder')}">Open block studio ↗</a></div>

    <section class="lesson-section">
      <div class="section-heading"><h2>The recipe</h2><span class="section-caption">01 / UNDERSTAND</span></div>
      <div class="recipe-box"><code>${escape(lesson.notes.recipe)}</code><p>${escape(lesson.notes.explanation)}</p></div>
      <p class="lesson-detail">${escape(lesson.notes.detail)}</p>
    </section>

    <section class="lesson-section">
      <div class="section-heading"><h2>Worked examples</h2><span class="section-caption">02 / OBSERVE</span></div>
      <div class="examples">${lesson.examples.map((example) => renderExample(example, code)).join('')}</div>
      ${renderSubstitution(lesson, code)}
    </section>

    <aside class="caution"><span>REMEMBER</span><p>${escape(lesson.notes.caution)}</p></aside>

    ${practice ? `<section class="lesson-section mini-practice">
      <div class="section-heading"><h2>Check your recall</h2><span class="section-caption">03 / PRODUCE</span></div>
      <p>How would you say this in ${escape(model.language.name)}?</p>
      <div class="practice-prompt">${escape(practice.english)}</div>
      <button id="mini-reveal" class="button secondary" aria-expanded="false">Show model answer</button>
      <div id="mini-answer" class="mini-answer" hidden lang="${code}">${escape(practice.target)}</div>
    </section>` : ''}

    <section class="lesson-section"><div class="section-heading"><h2>Your notes</h2><span class="section-caption">SAVED ON THIS DEVICE</span></div>
      <label class="visually-hidden" for="lesson-note">Notes for ${escape(lesson.title)}</label>
      <textarea id="lesson-note" rows="4" placeholder="Rewrite the rule in your own words, or note a useful pattern…"></textarea>
    </section>
    <div class="lesson-actions">
      <button class="button ${completed ? 'secondary' : 'primary'}" id="mark-complete">${completed ? '✓ Studied — undo' : 'Mark as studied ✓'}</button>
      <a class="button secondary" href="${href(code, 'practice')}">Open practice lab ↗</a>
    </div>
    <nav class="chapter-pagination" aria-label="Other lessons">
      ${prev ? `<a href="${href(code, `lesson/${prev.id}`)}"><small>← Previous lesson</small><strong>${escape(prev.title)}</strong></a>` : '<span></span>'}
      ${next ? `<a href="${href(code, `lesson/${next.id}`)}"><small>Next lesson →</small><strong>${escape(next.title)}</strong></a>` : '<span></span>'}
    </nav>
  </article>`;
}

function renderReference(model: GeneratedGuide): string {
  const code = model.language.code;
  const entries = model.lessons.map((lesson, index) => `
    <article class="reference-entry">
      <span class="chapter-number">${lessonLabel(index)}</span>
      <div>
        <h3><a href="${href(code, `lesson/${lesson.id}`)}">${escape(lesson.title)}</a></h3>
        <code>${escape(lesson.notes.recipe)}</code>
        <p>${escape(lesson.notes.explanation)}</p>
        ${lesson.examples[0] ? `<small lang="${code}">${escape(lesson.examples[0].target)}</small>` : ''}
      </div>
    </article>`).join('');

  return `<section class="page reference-page">
    <div class="eyebrow">QUICK REFERENCE · ${escape(model.language.name.toUpperCase())}</div>
    <h1>All the patterns.<br /><em>One place.</em></h1>
    <p class="lead">An index of the useful constructions from the manual. Every entry links to a detailed explanation and examples.</p>
    <button id="print-reference" class="button secondary">Print reference ↗</button>
    <div class="reference-list">${entries}</div>
  </section>`;
}


export interface PracticeViewState {
  readonly lessonId: LessonId;
  readonly index: number;
  readonly revealed: boolean;
  readonly feedback: 'matched' | 'compare' | null;
}

function renderPractice(model: GeneratedGuide, state: PracticeViewState): string {
  const lesson = model.lessons.find((item) => item.id === state.lessonId) ?? model.lessons[0];
  if (!lesson) throw new Error('No practice lessons');
  const exercises = generatePractice(lesson, model.language.code);
  const exercise = exercises[state.index % exercises.length];
  if (!exercise) throw new Error('No practice examples');

  const lessonOptions = model.lessons.map((entry) => `
    <option value="${entry.id}" ${selected(entry.id, lesson.id)}>${escape(entry.title)}</option>`).join('');

  return `<section class="page practice-page">
    <div class="eyebrow">ACTIVE RECALL · ${escape(model.language.name.toUpperCase())}</div>
    <h1>Practice<br /><em>lab.</em></h1>
    <p class="lead">Try producing the sentence before seeing the answer. These prompts are derived from the same grammatical building blocks as your lessons, including new combinations.</p>
    <div class="practice-toolbar"><label for="practice-lesson">Practise a lesson</label><select id="practice-lesson">${lessonOptions}</select></div>
    <div class="practice-card" data-practice-id="${escape(exercise.id)}">
      <div class="practice-card-head"><span>TRANSLATE THE MEANING</span><span>${(state.index % exercises.length) + 1} / ${exercises.length}</span></div>
      <h2>${escape(exercise.english)}</h2>
      <label for="practice-answer">Your ${escape(model.language.name)} sentence</label>
      <textarea id="practice-answer" rows="3" autocomplete="off" spellcheck="false" placeholder="Type what you would say…"></textarea>
      <div class="practice-controls">
        <button id="practice-check" class="button primary">Check against model</button>
        <button id="practice-reveal" class="button secondary">Show answer</button>
      </div>
      <div class="practice-feedback" id="practice-feedback" ${state.revealed ? '' : 'hidden'}>
        <span id="practice-feedback-title">${state.feedback === 'matched' ? 'Matches the model' : 'Model answer'}</span>
        <strong id="practice-model-answer" lang="${model.language.code}">${escape(exercise.target)}</strong>
        <p>${state.feedback === 'matched'
          ? 'Your response matches the model form.'
          : 'Compare your answer with this form. Other valid ways to say it may exist.'}</p>
      </div>
      <button id="practice-next" class="button secondary practice-next" ${state.revealed ? '' : 'disabled'}>Next prompt →</button>
    </div>
    <aside class="aside-note">This is a writing exercise, not an automated grammar examiner. It compares your input with one model sentence; it cannot judge every valid alternative.</aside>
  </section>`;
}

function renderFramework(): string {
  return `<article class="page about-page">
    <div class="eyebrow">PROJECT REFERENCE · FOR CONTRIBUTORS</div>
    <h1>How the manuals<br /><em>are built.</em></h1>
    <p class="lead">One shared curriculum describes meanings and operations. Separate language implementations produce the surface forms, while language-specific notes explain the relevant grammar.</p>
    <div class="architecture-grid">
      <div><span>01</span><h2>Semantic building blocks</h2><p>Typed predicates, participants, arguments, and operators represent what someone wants to communicate, independently of a particular language.</p></div>
      <div><span>02</span><h2>Language realization</h2><p>German, French and Spanish modules handle conjugation, pronouns, noun phrases, word order, and negation. Productive examples are generated rather than translated from a phrase table.</p></div>
      <div><span>03</span><h2>Teaching guides</h2><p>Reusable lesson plans compile into readable guides and automatically derived exercises. A small separate lexicon covers conventional expressions such as greetings.</p></div>
    </div>
    <div class="about-links">
      <h2>Read the specification</h2>
      <p>The reference documents define the current grammar boundaries, contribution rules, and tests.</p>
      <a href="https://github.com/alainux/mvl/blob/main/FRAMEWORK.md" target="_blank" rel="noopener noreferrer">Framework specification ↗</a>
      <a href="https://github.com/alainux/mvl/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing ↗</a>
      <a href="https://github.com/alainux/mvl/tree/main/src/learning" target="_blank" rel="noopener noreferrer">Curriculum compiler ↗</a>
      <a href="https://github.com/alainux/mvl/tree/main/src/languages" target="_blank" rel="noopener noreferrer">Language implementations ↗</a>
    </div>
  </article>`;
}

export function renderContent(
  route: Route,
  guides: Readonly<Record<Code, GeneratedGuide>>,
  practiceState: PracticeViewState,
): string {
  if (route.page === 'home') return renderHome(guides);
  if (route.page === 'framework') return renderFramework();

  const model = guides[route.code];
  switch (route.page) {
    case 'start': return renderGuideOverview(model);
    case 'builder': return renderStudio();
    case 'practice': return renderPractice(model, practiceState);
    case 'reference': return renderReference(model);
    case 'lesson': {
      const lesson = model.lessons.find((entry) => entry.id === route.lesson);
      return lesson ? renderLesson(model, lesson) : renderGuideOverview(model);
    }
  }
}

export function activeLanguage(route: Route): Code {
  return route.page === 'home' || route.page === 'framework' ? getLanguage() : route.code;
}

export interface SearchResult {
  readonly label: string;
  readonly description: string;
  readonly url: string;
}

export function searchGuide(model: GeneratedGuide, rawQuery: string): readonly SearchResult[] {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (query.length < 2) return [];

  return model.lessons.flatMap((lesson) => {
    const fields = [lesson.title, lesson.goal, lesson.notes.recipe, lesson.notes.explanation];
    const matches = lesson.examples.filter((example) =>
      `${example.english} ${example.target}`.toLocaleLowerCase().includes(query));
    if (!fields.some((field) => field.toLocaleLowerCase().includes(query)) && matches.length === 0) {
      return [];
    }
    return [{
      label: lesson.title,
      description: matches[0] ? `${matches[0].target} · ${matches[0].english}` : lesson.goal,
      url: href(model.language.code, `lesson/${lesson.id}`),
    }];
  }).slice(0, 7);
}
