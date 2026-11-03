import type { LanguageProfile } from '../core/model.js';
import type { GeneratedGuide, GeneratedLesson } from '../learning/types.js';
import { clozeFor, clozeHint, matchesCloze } from './drill-cloze.js';
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

function newDrill(key: string): DrillSession {
  return { key, index: 0, score: 0, streak: 0, best: 0, points: 0,
    answered: false, chosen: null, correct: false, hints: 0, lastGain: 0 };
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

  const restart = document.querySelector<HTMLButtonElement>('#drill-restart');
  if (restart) {
    restart.addEventListener('click', () => {
      runtime.drill = newDrill(session.key);
      render(runtime);
    });
    return;
  }
  required<HTMLSelectElement>('#drill-lesson').addEventListener('change', (event) => {
    location.hash = href(code, 'practice/' + (event.target as HTMLSelectElement).value);
  });

  const roundIndex = session.index;
  const question = deck[roundIndex];
  if (!question) throw new Error('Missing drill phrase');
  const cloze = clozeFor(question.target, roundIndex, code);

  function next(): void {
    const state = runtime.drill;
    if (!state?.answered || state.index !== roundIndex) return;
    runtime.drill = { ...state, index: state.index + 1,
      answered: false, chosen: null, correct: false, hints: 0, lastGain: 0 };
    render(runtime);
    document.querySelector<HTMLInputElement>('#drill-input')?.focus();
  }

  function answer(input: string | null): void {
    const state = runtime.drill;
    if (!state || state.answered || state.index !== roundIndex) return;
    const correct = input !== null && matchesCloze(input, cloze.word);
    const streak = correct ? state.streak + 1 : 0;
    // Recall matters more than speed. Optional hints reduce points, not accuracy.
    const gain = correct ? [12, 7, 4][state.hints]! + Math.min(streak - 1, 4) * 2 : 0;
    if (correct) awardXP(code, gain, true, streak);
    runtime.drill = { ...state, answered: true, chosen: input, correct,
      score: state.score + Number(correct), streak, best: Math.max(state.best, streak),
      points: state.points + gain, lastGain: gain };
    render(runtime);
    document.querySelector<HTMLButtonElement>('#drill-next')?.focus();
  }

  document.querySelector<HTMLFormElement>('#drill-cloze-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = required<HTMLInputElement>('#drill-input');
    if (input.value.trim()) answer(input.value.trim());
    else input.focus();
  });
  document.querySelector<HTMLButtonElement>('#drill-next')?.addEventListener('click', next);
  document.querySelector<HTMLButtonElement>('#drill-reveal')?.addEventListener('click', () => answer(null));
  document.querySelector<HTMLButtonElement>('#drill-hint')?.addEventListener('click', () => {
    const state = runtime.drill;
    if (!state || state.answered || state.index !== roundIndex || state.hints >= 2) return;
    const hints = (state.hints + 1) as 1 | 2;
    runtime.drill = { ...state, hints };
    const message = document.querySelector<HTMLElement>('#drill-hint-message');
    if (message) message.textContent = clozeHint(cloze, hints);
    const button = document.querySelector<HTMLButtonElement>('#drill-hint');
    if (button) {
      button.textContent = hints === 2 ? '✧ Hints revealed' : '✧ Another hint';
      button.disabled = hints === 2;
    }
    document.querySelector<HTMLInputElement>('#drill-input')?.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey || event.repeat || event.defaultPrevented) return;
    if (event.key === 'Enter' && runtime.drill?.answered &&
        runtime.drill.index === roundIndex) {
      event.preventDefault();
      next();
    }
  }, { signal: activeListeners!.signal });
  if (!session.answered) document.querySelector<HTMLInputElement>('#drill-input')?.focus();
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
