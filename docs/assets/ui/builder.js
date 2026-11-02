import { DEFAULT_SELECTION, makeTree, notation } from '../core/algebra.js';
import { CONCEPTS, PREDICATES } from '../core/vocabulary.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
import { option, required } from './dom.js';
const SUBJECTS = [
    ['speaker', 'I'],
    ['addressee', 'You (formal)'],
];
const TIMES = [
    ['', 'Not specified'],
    ['today', 'Today'],
    ['tomorrow', 'Tomorrow'],
];
function optionsFor(element, items, current) {
    element.replaceChildren(...items.map(([value, label]) => option(value, label, value === current)));
}
/** A small form-based editor for semantic ASTs. It never edits target strings. */
export function initializeBuilder(code) {
    const selection = { ...DEFAULT_SELECTION };
    const predicate = required('#builder-predicate');
    const agent = required('#builder-agent');
    const argument = required('#builder-argument');
    const modal = required('#builder-modal');
    const time = required('#builder-time');
    const negative = required('#builder-negative');
    const question = required('#builder-question');
    const polite = required('#builder-polite');
    const output = required('#builder-output');
    const translation = required('#builder-english');
    const construction = required('#builder-tree');
    const validation = required('#builder-validation');
    const copy = required('#builder-copy');
    function updateControls() {
        const frame = PREDICATES[selection.predicate];
        const allowed = frame.allowedArguments.filter((candidate) => selection.predicate !== 'help' || candidate !== selection.agent);
        if (!allowed.includes(selection.argument)) {
            selection.argument = allowed[0] ?? selection.argument;
        }
        if (selection.modal && !frame.allowedModalities.includes(selection.modal)) {
            selection.modal = '';
        }
        if (!selection.question)
            selection.polite = false;
        optionsFor(predicate, Object.entries(PREDICATES).map(([value, definition]) => [value, definition.description]), selection.predicate);
        optionsFor(agent, SUBJECTS, selection.agent);
        optionsFor(argument, allowed.map((value) => [value, CONCEPTS[value]]), selection.argument);
        optionsFor(modal, [
            ['', 'No modal'],
            ...frame.allowedModalities.map((value) => [
                value, value === 'can' ? 'Can (ability or permission)' : 'Want to',
            ]),
        ], selection.modal);
        optionsFor(time, TIMES, selection.time);
        negative.checked = selection.negative;
        question.checked = selection.question;
        polite.checked = selection.polite;
        polite.disabled = !selection.question;
    }
    function regenerate() {
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
        }
        catch (error) {
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
        selection.predicate = predicate.value;
        regenerate();
    });
    agent.addEventListener('change', () => {
        selection.agent = agent.value;
        regenerate();
    });
    argument.addEventListener('change', () => {
        selection.argument = argument.value;
        regenerate();
    });
    modal.addEventListener('change', () => {
        selection.modal = modal.value;
        regenerate();
    });
    time.addEventListener('change', () => {
        selection.time = time.value;
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
        }
        catch {
            copy.textContent = 'Copy unavailable';
        }
    });
    regenerate();
}
