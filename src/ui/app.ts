import { makeTree } from '../core/algebra.js';
import type { LanguageProfile } from '../core/model.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
import { generatePractice, matchesModel } from '../learning/practice.js';
import type { GeneratedGuide, GeneratedLesson, LessonId } from '../learning/types.js';
import { initializeStudio, REMIX_STORAGE_KEY } from './studio.js';
import { fromExpression } from './studio-model.js';
import { ruleFor } from './studio-rules.js';
import { escapeHtml, required } from './dom.js';
import { currentRoute, href, type Code, type Route } from './router.js';
import {
  completedLessons,
  getTheme,
  readNote,
  rememberLanguage,
  saveNote,
  setLessonCompleted,
  setTheme,
} from './state.js';
import {
  activeLanguage,
  renderContent,
  renderShell,
  searchGuide,
  type PracticeViewState,
} from './views.js';

const CODES: readonly Code[] = ['de', 'fr', 'es'];

/** Guides are *compiled build artifacts*, not an authored phrase collection. */
async function loadGuide(code: Code): Promise<GeneratedGuide> {
  const response = await fetch(`./guides/${code}.json`);
  if (!response.ok) throw new Error(`Cannot load ${code} guide (${response.status})`);
  return await response.json() as GeneratedGuide;
}

function lessonFor(guide: GeneratedGuide, id: LessonId): GeneratedLesson {
  const lesson = guide.lessons.find((entry) => entry.id === id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
}

interface Runtime {
  readonly guides: Readonly<Record<Code, GeneratedGuide>>;
  practice: PracticeViewState;
}

function practiceDefaults(): PracticeViewState {
  return { lessonId: 'needs', index: 0, revealed: false, feedback: null };
}

function initializeTheme(): void {
  document.documentElement.dataset['theme'] = getTheme();
}

function initializeHeader(runtime: Runtime, route: Route): void {
  const code = activeLanguage(route);
  const model = runtime.guides[code];
  const search = required<HTMLInputElement>('#site-search');
  const results = required<HTMLElement>('#search-results');

  const language = required<HTMLSelectElement>('#language-switch');
  language.addEventListener('change', () => {
    const target = language.value as Code;
    rememberLanguage(target);
    location.hash = href(target, route.page === 'builder' ? 'builder' : 'start');
  });

  required<HTMLButtonElement>('#theme-toggle').addEventListener('click', () => {
    const next = getTheme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    initializeTheme();
  });

  const menu = required<HTMLButtonElement>('#menu-toggle');
  const backdrop = required<HTMLButtonElement>('#nav-backdrop');
  function closeMenu(): void {
    document.body.classList.remove('nav-open');
    menu.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
  }
  menu.addEventListener('click', () => {
    const opened = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', opened);
    menu.setAttribute('aria-expanded', String(opened));
    backdrop.hidden = !opened;
  });
  backdrop.addEventListener('click', closeMenu);
  required<HTMLElement>('#sidebar').querySelectorAll('a').forEach((anchor) => {
    anchor.addEventListener('click', closeMenu);
  });

  search.addEventListener('input', () => {
    const matches = searchGuide(model, search.value);
    results.hidden = search.value.trim().length < 2;
    results.innerHTML = matches.length
      ? matches.map((match) => `
          <a href="${match.url}"><strong>${escapeHtml(match.label)}</strong><small>${escapeHtml(match.description)}</small></a>`).join('')
      : '<span class="no-search-results">No matching lessons.</span>';
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      results.hidden = true;
      search.blur();
    }
    if (event.key === 'Enter') {
      const first = results.querySelector<HTMLAnchorElement>('a');
      first?.click();
    }
  });
  results.addEventListener('click', () => { results.hidden = true; });
}

function initializeLesson(runtime: Runtime, route: Extract<Route, { page: 'lesson' }>): void {
  const code = route.code;
  const lesson = lessonFor(runtime.guides[code], route.lesson);

  const notes = required<HTMLTextAreaElement>('#lesson-note');
  notes.value = readNote(code, lesson.id);
  notes.addEventListener('input', () => saveNote(code, lesson.id, notes.value));

  required<HTMLButtonElement>('#mark-complete').addEventListener('click', () => {
    setLessonCompleted(code, lesson.id, !completedLessons(code).has(lesson.id));
    render(runtime);
  });

  const reveal = document.querySelector<HTMLButtonElement>('#mini-reveal');
  reveal?.addEventListener('click', () => {
    const answer = required<HTMLElement>('#mini-answer');
    answer.hidden = !answer.hidden;
    reveal.setAttribute('aria-expanded', String(!answer.hidden));
    reveal.textContent = answer.hidden ? 'Show model answer' : 'Hide model answer';
  });

  const substitution = document.querySelector<HTMLSelectElement>('#substitution-argument');
  substitution?.addEventListener('change', () => {
    const original = lesson.examples.find((example) =>
      example.source.kind === 'expression' && example.source.selection !== undefined);
    if (!original || original.source.kind !== 'expression' || !original.source.selection) return;

    const selection = { ...original.source.selection, argument: substitution.value as typeof original.source.selection.argument };
    const expression = makeTree(selection);
    required('#substitution-output').textContent = linearize(expression, code);
    required('#substitution-english').textContent = realizeEnglish(expression);
  });

  // All productive examples can be opened as editable semantic programs.
  document.querySelectorAll<HTMLButtonElement>('[data-remix-example]').forEach((button) => {
    button.addEventListener('click', () => {
      const example = lesson.examples.find((entry) => entry.id === button.dataset['remixExample']);
      if (!example || example.source.kind !== 'expression') return;
      const studioState = fromExpression(example.source.expression);
      if (!studioState) return;
      try { sessionStorage.setItem(REMIX_STORAGE_KEY, JSON.stringify(studioState)); }
      catch { /* Storage restrictions should not prevent opening the studio. */ }
      location.hash = href(code, 'builder');
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-copy-example]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset['copyExample'];
      const text = lesson.examples.find((example) => example.id === id)?.target;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied ✓';
      } catch {
        button.textContent = 'Unavailable';
      }
    });
  });
}

function initializePractice(runtime: Runtime, code: LanguageProfile['code']): void {
  const selector = required<HTMLSelectElement>('#practice-lesson');
  selector.addEventListener('change', () => {
    runtime.practice = {
      lessonId: selector.value as LessonId,
      index: 0,
      revealed: false,
      feedback: null,
    };
    render(runtime);
  });

  const lesson = lessonFor(runtime.guides[code], runtime.practice.lessonId);
  const exercises = generatePractice(lesson, code);
  const exercise = exercises[runtime.practice.index % exercises.length];
  if (!exercise) return;

  const answer = required<HTMLTextAreaElement>('#practice-answer');
  const check = required<HTMLButtonElement>('#practice-check');
  const reveal = required<HTMLButtonElement>('#practice-reveal');
  const next = required<HTMLButtonElement>('#practice-next');
    const hintButton = required<HTMLButtonElement>('#practice-hint');
  const hintContent = required<HTMLElement>('#practice-hint-content');
  const feedback = required<HTMLElement>('#practice-feedback');
  const heading = required<HTMLElement>('#practice-feedback-title');

  const editable = exercise.source.kind === 'expression' ? fromExpression(exercise.source.expression) : null;
  const expression = exercise.source.kind === 'expression' ? exercise.source.expression : null;
  const focus = expression?.kind === 'link' ? 'connection'
    : expression?.kind === 'sequence' ? 'clause0'
    : expression?.kind === 'clause' && expression.negative ? 'negative'
    : expression?.kind === 'clause' && expression.tense !== 'present' ? 'tense'
    : expression?.kind === 'clause' && expression.modality ? 'modal' : 'predicate';
  const hintText = editable ? ruleFor(editable, code, focus)
    : 'Recall the construction, then try to produce it without looking at the example.';
  hintButton.addEventListener('click', () => {
    const visible = !hintContent.hidden;
    hintContent.hidden = visible;
    hintButton.setAttribute('aria-expanded', String(!visible));
    hintContent.textContent = visible ? '' : hintText;
  });
  const remix = document.querySelector<HTMLButtonElement>('#practice-remix');
  remix?.addEventListener('click', () => {
    if (!editable) return;
    try { sessionStorage.setItem(REMIX_STORAGE_KEY, JSON.stringify(editable)); }
    catch { /* Storage restrictions must not prevent opening the studio. */ }
    location.hash = href(code, 'builder');
  });
  function showModel(kind: 'matched' | 'compare'): void {
    runtime.practice = { ...runtime.practice, revealed: true, feedback: kind };
    heading.textContent = kind === 'matched' ? 'Matches the model' : 'Model answer';
    feedback.hidden = false;
    next.disabled = false;
    const note = feedback.querySelector('p');
    if (note) note.textContent = kind === 'matched'
      ? 'Your response matches the model form.'
      : 'Not an exact match to the model. Your answer may still be valid. ' + hintText;
  }

  check.addEventListener('click', () => {
    if (!answer.value.trim()) {
      answer.focus();
      answer.placeholder = 'Enter your sentence, or choose “Show answer”.';
      return;
    }
    showModel(matchesModel(answer.value, exercise.target) ? 'matched' : 'compare');
  });
  reveal.addEventListener('click', () => showModel('compare'));
  next.addEventListener('click', () => {
    runtime.practice = {
      ...runtime.practice,
      index: runtime.practice.index + 1,
      revealed: false,
      feedback: null,
    };
    render(runtime);
    required<HTMLTextAreaElement>('#practice-answer').focus();
  });
}

/** One screen corresponds to one route, and all controllers are scoped to it. */
function render(runtime: Runtime): void {
  const route = currentRoute();
  const code = activeLanguage(route);
  if (route.page !== 'home' && route.page !== 'framework') rememberLanguage(code);
  document.body.classList.remove('nav-open');

  const content = renderContent(route, runtime.guides, runtime.practice);
  const root = required<HTMLElement>('#app');
  root.removeAttribute('role');
  root.removeAttribute('aria-live');
  root.className = '';
  root.innerHTML = renderShell(route, content, runtime.guides[code]);
  document.title = `${route.page === 'home' ? 'Choose a language' : runtime.guides[code].language.name} · Minimum Viable Language`;
  initializeHeader(runtime, route);

  if (route.page === 'lesson') initializeLesson(runtime, route);
  if (route.page === 'builder') initializeStudio(code);
  if (route.page === 'practice') initializePractice(runtime, code);
  if (route.page === 'reference') {
    required<HTMLButtonElement>('#print-reference').addEventListener('click', () => window.print());
  }
}

export async function startApplication(): Promise<void> {
  initializeTheme();

  try {
    const loaded = await Promise.all(CODES.map(loadGuide));
    const guides = Object.fromEntries(loaded.map((guide) => [guide.language.code, guide])) as Record<Code, GeneratedGuide>;
    const runtime: Runtime = { guides, practice: practiceDefaults() };

    // Navigate without server-side rewrites; works from any Pages project path.
    window.addEventListener('hashchange', () => {
      render(runtime);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !(
        event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      )) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('#site-search')?.focus();
      }
    });

    render(runtime);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    const root = required<HTMLElement>('#app');
    root.className = 'loading';
    root.textContent = `The manual could not load: ${reason}`;
  }
}
