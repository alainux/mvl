import type { LanguageProfile } from '../core/model.js';
import type { GeneratedGuide, GeneratedLesson } from '../learning/types.js';
import { matchesModel } from '../learning/practice.js';
import { required } from './dom.js';
import { currentRoute, href, type Code, type Route } from './router.js';
import { initializeStudio, REMIX_STORAGE_KEY } from './studio.js';
import { fromExpression } from './studio-model.js';
import { beginQuest, type QuestSession } from './quest-model.js';
import { mountQuest } from './quest-controller.js';
import { drillQuestions, memoryExamples, playableLesson } from './game-model.js';
import {
  awardXP, cardRecalls, completedLessons, getTheme,
  rememberLanguage, recordCard, setTheme,
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
  quest: QuestSession | null;
}

let activeListeners: AbortController | null = null;

function chosenLesson(model: GeneratedGuide, requested: string | null): GeneratedLesson {
  return playableLesson(model, completedLessons(model.language.code), requested);
}

function newDrill(key: string, mode: 'pick' | 'type' = 'pick'): DrillSession {
  return { key, index: 0, score: 0, streak: 0, best: 0,
    mode, answered: false, chosen: null, correct: false, bonus: 0,
    questionStartedAt: Date.now(), lastGain: 0 };
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

  if (route.page === 'play') {
    const guide = runtime.guides[route.code];
    const lesson = chosenLesson(guide, route.lesson);
    const key = route.code + ':' + lesson.id;
    if (runtime.quest?.key !== key) {
      let restored: QuestSession | null = null;
      try {
        const raw: unknown = JSON.parse(sessionStorage.getItem('mvl:quest:session:' + key) ?? 'null');
        if (raw && typeof raw === 'object') {
          const data = raw as Record<string, unknown>;
          if (data['key'] === key && typeof data['round'] === 'number' &&
            typeof data['hearts'] === 'number' && Array.isArray(data['selected']) &&
            ['play', 'won', 'lost', 'victory'].includes(String(data['phase']))) restored = raw as QuestSession;
        }
      } catch { /* An invalid browser session restarts safely. */ }
      runtime.quest = restored ?? beginQuest(key);
    }
  } else runtime.quest = null;
}

function initializeHeader(runtime: Runtime, route: Route): void {
  const language = required<HTMLSelectElement>('#language-switch');
  language.addEventListener('change', () => {
    const target = language.value as Code;
    rememberLanguage(target);
    const destination = route.page === 'builder' ? 'builder'
      : route.page === 'practice' ? 'practice'
      : route.page === 'cards' ? 'cards'
      : route.page === 'play' ? 'play' : 'start';
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
  const signal = activeListeners!.signal;

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
      runtime.drill = { ...runtime.drill, mode, questionStartedAt: Date.now() };
      render(runtime);
      if (mode === 'type') document.querySelector<HTMLInputElement>('#drill-input')?.focus();
    });
  });

  const question = deck[session.index];
  if (!question) throw new Error('Missing current drill question');
  const expectedSentence = question.target;
  const seconds = session.mode === 'pick' ? 14 : 22;

  function next(): void {
    const state = runtime.drill;
    if (!state?.answered || state.index !== session.index) return;
    // Speed drills are for retrieval; the sentence quest is the mastery gate.
    runtime.drill = { ...state, index: state.index + 1, lastGain: 0,
      questionStartedAt: Date.now(), answered: false, chosen: null, correct: false };
    render(runtime);
    document.querySelector<HTMLElement>(state.mode === 'type' ? '#drill-input' : '[data-drill-option="0"]')?.focus();
  }

  function answer(input: string): void {
    const state = runtime.drill;
    if (!state || state.answered || state.index !== session.index) return;
    const remaining = Math.max(0, seconds - (Date.now() - state.questionStartedAt) / 1000);
    const timedOut = remaining <= 0;
    const attempted = timedOut ? '' : input;
    const correct = !timedOut && (state.mode === 'pick'
      ? attempted === expectedSentence : matchesModel(attempted, expectedSentence));
    const streak = correct ? state.streak + 1 : 0;
    const speedBonus = correct ? Math.ceil(remaining) * 2 + Math.min(4, streak - 1) * 3 : 0;
    const gain = correct ? 10 + speedBonus : 0;
    if (correct) awardXP(code, gain, true, streak);
    runtime.drill = { ...state, answered: true, chosen: attempted || null, correct,
      score: state.score + Number(correct), streak, best: Math.max(state.best, streak),
      bonus: state.bonus + speedBonus, lastGain: gain };
    render(runtime);
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

  if (session.answered) {
    // Briefly reveal both the right answer and the semantic contrast, then
    // keep the flow moving. Enter/Next allows an immediate manual skip.
    const pending = setTimeout(next, session.correct ? 1350 : 1900);
    signal.addEventListener('abort', () => clearTimeout(pending), { once: true });
  } else {
    const clock = document.querySelector<HTMLElement>('#drill-clock');
    const fill = document.querySelector<HTMLElement>('#drill-clock-fill');
    const track = document.querySelector<HTMLElement>('.rush-time-track');
    const frame = document.querySelector<HTMLElement>('.rush-frame');
    function updateClock(): void {
      const state = runtime.drill;
      if (document.hidden || signal.aborted || !state || state.answered || state.index !== session.index) return;
      const remaining = Math.max(0, seconds - (Date.now() - state.questionStartedAt) / 1000);
      if (clock) clock.textContent = remaining.toFixed(1);
      if (fill) fill.style.width = remaining / seconds * 100 + '%';
      if (track) track.setAttribute('aria-valuenow', String(Math.ceil(remaining)));
      frame?.classList.toggle('rush-urgent', remaining < 5);
      if (remaining <= 0) answer('');
    }
    const timer = setInterval(updateClock, 100);
    signal.addEventListener('abort', () => clearInterval(timer), { once: true });
    let hiddenSince: number | null = null;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hiddenSince = Date.now();
      else if (hiddenSince !== null) {
        const state = runtime.drill;
        if (state && !state.answered && state.index === session.index)
          runtime.drill = { ...state, questionStartedAt: state.questionStartedAt + Date.now() - hiddenSince };
        hiddenSince = null;
        updateClock();
      }
    }, { signal });
    updateClock();
  }

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
  }, { signal });
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
  const content = renderContent(route, runtime.guides, runtime.drill, runtime.cards, runtime.quest);
  const root = required<HTMLElement>('#app');
  root.removeAttribute('role');
  root.removeAttribute('aria-live');
  root.className = '';
  root.innerHTML = renderShell(route, content, runtime.guides[code]);
  document.title = (route.page === 'home' ? 'Choose a language' : runtime.guides[code].language.name)
    + ' · MVL Language Game';
  initializeHeader(runtime, route);

  if (route.page === 'builder') {
    initializeStudio(code, activeListeners!.signal);
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
  if (route.page === 'play' && runtime.quest) {
    const lesson = chosenLesson(runtime.guides[code], route.lesson);
    mountQuest(runtime.guides[code], lesson, runtime.quest, (newState) => {
      runtime.quest = newState;
      try { sessionStorage.setItem('mvl:quest:session:' + newState.key, JSON.stringify(newState)); }
      catch { /* Gameplay remains available without storage. */ }
      render(runtime);
      document.querySelector<HTMLButtonElement>(newState.phase === 'won' ? '#quest-next' :
        newState.phase === 'play' ? '#quest-check:not(:disabled)' : '#quest-restart')?.focus();
    }, activeListeners!.signal);
  }
}

export async function startApplication(): Promise<void> {
  document.documentElement.dataset['theme'] = getTheme();
  try {
    const loaded = await Promise.all(CODES.map(loadGuide));
    const guides = Object.fromEntries(loaded.map((guide) => [guide.language.code, guide])) as Record<Code, GeneratedGuide>;
    const runtime: Runtime = { guides, drill: null, cards: null, quest: null };
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
