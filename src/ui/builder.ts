import { DEFAULT_SELECTION, makeTree, notation } from '../core/algebra.js';
import type {
  BuilderSelection,
  LanguageProfile,
  Modality,
  Participant,
  PredicateId,
  SemanticArgument,
  Time,
} from '../core/model.js';
import { CONCEPTS, PREDICATES } from '../core/vocabulary.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
import { option, required } from './dom.js';

const SUBJECTS: readonly [Participant, string][] = [
  ['speaker', 'I'],
  ['addressee', 'You (formal)'],
];

const TIMES: readonly [Time | '', string][] = [
  ['', 'Not specified'],
  ['today', 'Today'],
  ['tomorrow', 'Tomorrow'],
];

function optionsFor(
  element: HTMLSelectElement,
  items: readonly (readonly [string, string])[],
  current: string,
): void {
  element.replaceChildren(...items.map(([value, label]) => option(value, label, value === current)));
}

/** A small form-based editor for semantic ASTs. It never edits target strings. */
export function initializeBuilder(code: LanguageProfile['code']): void {
  const selection: BuilderSelection = { ...DEFAULT_SELECTION };
  const predicate = required<HTMLSelectElement>('#builder-predicate');
  const agent = required<HTMLSelectElement>('#builder-agent');
  const argument = required<HTMLSelectElement>('#builder-argument');
  const modal = required<HTMLSelectElement>('#builder-modal');
  const time = required<HTMLSelectElement>('#builder-time');
  const negative = required<HTMLInputElement>('#builder-negative');
  const question = required<HTMLInputElement>('#builder-question');
  const polite = required<HTMLInputElement>('#builder-polite');
  const output = required<HTMLElement>('#builder-output');
  const translation = required<HTMLElement>('#builder-english');
  const construction = required<HTMLElement>('#builder-tree');
  const validation = required<HTMLElement>('#builder-validation');
  const copy = required<HTMLButtonElement>('#builder-copy');

  function updateControls(): void {
    const frame = PREDICATES[selection.predicate];
    const allowed = frame.allowedArguments.filter((candidate) =>
      selection.predicate !== 'help' || candidate !== selection.agent);

    if (!allowed.includes(selection.argument)) {
      selection.argument = allowed[0] ?? selection.argument;
    }
    if (selection.modal && !frame.allowedModalities.includes(selection.modal)) {
      selection.modal = '';
    }
    if (!selection.question) selection.polite = false;

    optionsFor(predicate, Object.entries(PREDICATES).map(([value, definition]) =>
      [value, definition.description]), selection.predicate);
    optionsFor(agent, SUBJECTS, selection.agent);
    optionsFor(argument, allowed.map((value) => [value, CONCEPTS[value]]), selection.argument);
    optionsFor(modal, [
      ['', 'No modal'],
      ...frame.allowedModalities.map((value): readonly [string, string] => [
        value, value === 'can' ? 'Can (ability or permission)' : 'Want to',
      ]),
    ], selection.modal);
    optionsFor(time, TIMES, selection.time);

    negative.checked = selection.negative;
    question.checked = selection.question;
    polite.checked = selection.polite;
    polite.disabled = !selection.question;
  }

  function regenerate(): void {
    updateControls();

    try {
      const expression = makeTree(selection);
      output.textContent = linearize(expression, code);
      output.lang = code;
      translation.textContent = realizeEnglish(expression);
      construction.textContent = notation(expression);
      validation.textContent = 'This combination is supported by the current grammar.';
      validation.className = 'builder-validation is-valid';
      copy.disabled = false;
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      output.textContent = 'This combination is not supported.';
      translation.textContent = '';
      construction.textContent = reason;
      validation.textContent = reason;
      validation.className = 'builder-validation is-invalid';
      copy.disabled = true;
    }
  }

  predicate.addEventListener('change', () => {
    selection.predicate = predicate.value as PredicateId;
    regenerate();
  });
  agent.addEventListener('change', () => {
    selection.agent = agent.value as Participant;
    regenerate();
  });
  argument.addEventListener('change', () => {
    selection.argument = argument.value as SemanticArgument;
    regenerate();
  });
  modal.addEventListener('change', () => {
    selection.modal = modal.value as Modality | '';
    regenerate();
  });
  time.addEventListener('change', () => {
    selection.time = time.value as Time | '';
    regenerate();
  });
  negative.addEventListener('change', () => {
    selection.negative = negative.checked;
    regenerate();
  });
  question.addEventListener('change', () => {
    selection.question = question.checked;
    regenerate();
  });
  polite.addEventListener('change', () => {
    selection.polite = polite.checked;
    regenerate();
  });

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.textContent ?? '');
      copy.textContent = 'Copied ✓';
    } catch {
      copy.textContent = 'Copy unavailable';
    }
  });

  regenerate();
}
