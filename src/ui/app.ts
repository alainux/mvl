import type { LanguageProfile } from '../core/model.js';
import type { GeneratedGuide, GeneratedLesson } from '../learning/types.js';
import { matchesModel } from '../learning/practice.js';
import { required } from './dom.js';
import { currentRoute, href, type Code, type Route } from './router.js';
import { initializeStudio, REMIX_STORAGE_KEY } from './studio.js';
import { fromExpression } from './studio-model.js';
import { drillQuestions, levelUnlocked, memoryExamples, nextLevelIndex } from './game-model.js';
import {
  awardXP, cardRecalls, completedLessons, getTheme,
  rememberLanguage, recordCard, setLessonCompleted, setTheme,
} from './state.js';
import { activeLanguage, renderContent, renderShell, type DrillSession, type CardSession } from './views.js';

const CODES: readonly Code[] = ['de', 'fr', 'es'];

async function loadGuide(code: Code): Promise<GeneratedGuide> {
  const response = await fetch('./guides/' + code + '.json');
  if (!response.ok) throw new Error('Cannot load ' + code + ' guide (' + response.status + ')');
  return await response.json() as GeneratedGuide;
}

interface Runtime {
  readonly guides: Readonly<Record<Code, GeneratedGuide>>;
  drill: DrillSession | null;
  cards: CardSession | null;
}

let activeListeners: AbortController | null = null;

function chosenLesson(model: GeneratedGuide, requested: string | null): GeneratedLesson {
  const completed = completedLessons(model.language.code);
  const requestedIndex = model.lessons.findIndex((lesson) => lesson.id === requested);
  const index = requestedIndex >= 0 && levelUnlocked(model, completed, requestedIndex)
    ? requestedIndex : nextLevelIndex(model, completed);
  const lesson = model.lessons[index];
  if (!lesson) throw new Error('Missing level');
  return lesson;
}

function newDrill(key: string, mode: 'pick' | 'type' = 'pick'): DrillSession {
  return { key, index: 0, score: 0, streak: 0, best: 0,
    mode, answered: false, chosen: null, correct: false, bonus: 0 };
}

function newCards(code: Code, lesson: GeneratedLesson): CardSession {
  const recalls = cardRecalls(code);
  const now = Date.now();
  const ids = memoryExamples(lesson)
    .map((example) => lesson.id + ':' + example.id)
    .filter((id) => !recalls[id] || recalls[id].due <= now);
  return { key: code + ':' + lesson.id, ids, index: 0, flipped: false, known: 0, again: 0 };
}

function prepareSessions(runtime: Runtime, route: Route): void {
  if (route.page === 'practice') {
    const guide = runtime.guides[route.code];
    const lesson = chosenLesson(guide, route.lesson);
    const key = route.code + ':' + lesson.id;
    if (runtime.drill?.key !== key) runtime.drill = newDrill(key);
  } else runtime.drill = null;

  if (route.page === 'cards') {
    const guide = runtime.guides[route.code];
    const lesson = chosenLesson(guide, route.lesson);
    const key = route.code + ':' + lesson.id;
    if (runtime.cards?.key !== key) runtime.cards = newCards(route.code, lesson);
  } else runtime.cards = null;
}

function initializeHeader(runtime: Runtime, route: Route): void {
  const language = required<HTMLSelectElement>('#language-switch');
  language.addEventListener('change', () => {
    const target = language.value as Code;
    rememberLanguage(target);
    const destination = route.page === 'builder' ? 'builder'
      : route.page === 'practice' ? 'practice'
      : route.page === 'cards' ? 'cards' : 'start';
    location.hash = href(target, destination);
  });
  required<HTMLButtonElement>('#theme-toggle').addEventListener('click', () => {
    const next = getTheme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset['theme'] = next;
  });
  const menu = required<HTMLButtonElement>('#menu-toggle');
  const backdrop = required<HTMLButtonElement>('#nav-backdrop');
  function closeMenu(): void {
    document.body.classList.remove('nav-open');
    menu.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
  }
  menu.addEventListener('click', () => {
    const open = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', open);
    menu.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
  });
  backdrop.addEventListener('click', closeMenu);
  document.querySelectorAll<HTMLAnchorElement>('#sidebar a').forEach((anchor) =>
    anchor.addEventListener('click', closeMenu));
  // Keep an Escape exit for the mobile navigation.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  }, { signal: activeListeners!.signal });
  void runtime;
}

function initializeLevel(route: Extract<Route, { page: 'lesson' }>, model: GeneratedGuide): void {
  const lesson = model.lessons.find((entry) => entry.id === route.lesson);
  if (!lesson) return;
  document.querySelectorAll<HTMLButtonElement>('[data-remix-example]').forEach((button) => {
    button.addEventListener('click', () => {
      const example = lesson.examples.find((entry) => entry.id === button.dataset['remixExample']);
      if (!example || example.source.kind !== 'expression') return;
      const state = fromExpression(example.source.expression);
      if (!state) return;
      try {
        sessionStorage.setItem(REMIX_STORAGE_KEY, JSON.stringify(state));
        sessionStorage.setItem('mvl:game:last-level:' + route.code, lesson.id);
      } catch { /* Private browsing must not block the builder. */ }
      location.hash = href(route.code, 'builder');
    });
  });
}

function initializeDrill(runtime: Runtime, code: LanguageProfile['code'], lesson: GeneratedLesson): void {
  const guide = runtime.guides[code];
  const deck = drillQuestions(guide, lesson);
  const session = runtime.drill;
  if (!session) return;

  const restart = document.querySelector<HTMLButtonElement>('#drill-restart');
  if (restart) {
    restart.addEventListener('click', () => {
      runtime.drill = newDrill(session.key, session.mode);
      render(runtime);
    });
    return;
  }
  const selector = required<HTMLSelectElement>('#drill-lesson');
  selector.addEventListener('change', () => { location.hash = href(code, 'practice/' + selector.value); });
  document.querySelectorAll<HTMLButtonElement>('[data-drill-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!runtime.drill || runtime.drill.answered) return;
      const mode = button.dataset['drillMode'];
      if (mode !== 'pick' && mode !== 'type') return;
      runtime.drill = { ...runtime.drill, mode };
      render(runtime);
    });
  });

  const question = deck[session.index];
  if (!question) throw new Error('Missing current drill question');
  const expectedSentence = question.target;

  function answer(input: string): void {
    const state = runtime.drill;
    if (!state || state.answered) return;
    const correct = state.mode === 'pick' ? input === expectedSentence : matchesModel(input, expectedSentence);
    const streak = correct ? state.streak + 1 : 0;
    if (correct) awardXP(code, 10, true, streak);
    runtime.drill = { ...state, answered: true, chosen: input, correct,
      score: state.score + Number(correct), streak, best: Math.max(state.best, streak) };
    render(runtime);
    document.querySelector<HTMLButtonElement>('#drill-next')?.focus();
  }

  function next(): void {
    const state = runtime.drill;
    if (!state?.answered) return;
    const isFinal = state.index + 1 === deck.length;
    let bonus = state.bonus;
    if (isFinal && state.score >= Math.ceil(deck.length * 0.7) && !completedLessons(code).has(lesson.id)) {
      setLessonCompleted(code, lesson.id, true);
      awardXP(code, 40);
      bonus = 40;
    }
    runtime.drill = { ...state, index: state.index + 1,
      answered: false, chosen: null, correct: false, bonus };
    render(runtime);
    const focus = runtime.drill.mode === 'type' ? '#drill-input' : '[data-drill-option="0"]';
    document.querySelector<HTMLElement>(focus)?.focus();
  }

  document.querySelectorAll<HTMLButtonElement>('[data-drill-option]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset['drillOption']);
      const option = question.options[index];
      if (option !== undefined) answer(option);
    });
  });
  document.querySelector<HTMLFormElement>('#drill-type-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = required<HTMLInputElement>('#drill-input');
    if (input.value.trim()) answer(input.value.trim());
    else input.focus();
  });
  document.querySelector<HTMLButtonElement>('#drill-next')?.addEventListener('click', next);
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey || event.repeat) return;
    const active = document.activeElement;
    const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement;
    if (event.key === 'Enter' && runtime.drill?.answered) {
      event.preventDefault();
      next();
    } else if (!typing && !runtime.drill?.answered && runtime.drill?.mode === 'pick' &&
      /^[1-4]$/.test(event.key)) {
      const option = question.options[Number(event.key) - 1];
      if (option !== undefined) { event.preventDefault(); answer(option); }
    }
  }, { signal: activeListeners!.signal });
}

function initializeCards(runtime: Runtime, code: Code): void {
  const session = runtime.cards;
  if (!session) return;
  document.querySelector<HTMLSelectElement>('#cards-lesson')?.addEventListener('change', (event) => {
    location.hash = href(code, 'cards/' + (event.target as HTMLSelectElement).value);
  });
  const flip = document.querySelector<HTMLButtonElement>('#card-flip');
  if (!flip) return;
  function doFlip(): void {
    if (!runtime.cards) return;
    runtime.cards = { ...runtime.cards, flipped: !runtime.cards.flipped };
    render(runtime);
    document.querySelector<HTMLButtonElement>(runtime.cards.flipped ? '#card-known' : '#card-flip')?.focus();
  }
  function grade(remembered: boolean): void {
    const current = runtime.cards;
    if (!current || !current.flipped) return;
    const key = current.ids[current.index];
    if (!key) return;
    recordCard(code, key, remembered);
    if (remembered) awardXP(code, 5);
    runtime.cards = { ...current, index: current.index + 1, flipped: false,
      known: current.known + Number(remembered), again: current.again + Number(!remembered) };
    render(runtime);
    document.querySelector<HTMLButtonElement>('#card-flip')?.focus();
  }
  flip.addEventListener('click', doFlip);
  document.querySelector<HTMLButtonElement>('#card-known')?.addEventListener('click', () => grade(true));
  document.querySelector<HTMLButtonElement>('#card-again')?.addEventListener('click', () => grade(false));
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return;
    if (event.key === ' ' && active !== flip) { event.preventDefault(); doFlip(); }
    else if (event.key === '1' && runtime.cards?.flipped) { event.preventDefault(); grade(false); }
    else if (event.key === '2' && runtime.cards?.flipped) { event.preventDefault(); grade(true); }
  }, { signal: activeListeners!.signal });
}

function render(runtime: Runtime): void {
  activeListeners?.abort();
  activeListeners = new AbortController();
  const route = currentRoute();
  const code = activeLanguage(route);
  if (route.page !== 'home' && route.page !== 'framework') rememberLanguage(code);
  document.body.classList.remove('nav-open');
  prepareSessions(runtime, route);
  const content = renderContent(route, runtime.guides, runtime.drill, runtime.cards);
  const root = required<HTMLElement>('#app');
  root.removeAttribute('role');
  root.removeAttribute('aria-live');
  root.className = '';
  root.innerHTML = renderShell(route, content, runtime.guides[code]);
  document.title = (route.page === 'home' ? 'Choose a language' : runtime.guides[code].language.name)
    + ' · MVL Language Game';
  initializeHeader(runtime, route);

  if (route.page === 'builder') {
    initializeStudio(code);
    const back = document.querySelector<HTMLAnchorElement>('#studio-back');
    if (back) {
      try {
        const saved = sessionStorage.getItem('mvl:game:last-level:' + code);
        back.href = href(code, saved ? 'lesson/' + saved : 'start');
      } catch { back.href = href(code, 'start'); }
    }
  }
  if (route.page === 'lesson') initializeLevel(route, runtime.guides[code]);
  if (route.page === 'practice') {
    const lesson = chosenLesson(runtime.guides[code], route.lesson);
    initializeDrill(runtime, code, lesson);
  }
  if (route.page === 'cards') initializeCards(runtime, code);
}

export async function startApplication(): Promise<void> {
  document.documentElement.dataset['theme'] = getTheme();
  try {
    const loaded = await Promise.all(CODES.map(loadGuide));
    const guides = Object.fromEntries(loaded.map((guide) => [guide.language.code, guide])) as Record<Code, GeneratedGuide>;
    const runtime: Runtime = { guides, drill: null, cards: null };
    window.addEventListener('hashchange', () => {
      render(runtime);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    render(runtime);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    const root = required<HTMLElement>('#app');
    root.className = 'loading';
    root.textContent = 'Could not load the language game: ' + reason;
  }
}
