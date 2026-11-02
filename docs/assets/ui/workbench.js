import { DEFAULT_SELECTION, makeTree, notation } from '../core/algebra.js';
import { CONCEPTS, PARTICIPANTS, PREDICATES } from '../core/vocabulary.js';
import { languages } from '../languages/index.js';
import { escapeHtml, option, required } from './dom.js';
/** Curated input trees demonstrate composition, not memorized phrase translations. */
const PRESETS = {
    assistance: {
        predicate: 'help', agent: 'addressee', argument: 'speaker', modal: 'can',
        negative: false, time: '', question: true, polite: true,
    },
    information: {
        predicate: 'understand', agent: 'speaker', argument: 'this', modal: '',
        negative: true, time: '', question: false, polite: false,
    },
    movement: {
        predicate: 'go', agent: 'speaker', argument: 'station', modal: 'want',
        negative: false, time: 'tomorrow', question: false, polite: false,
    },
    possession: {
        predicate: 'have', agent: 'addressee', argument: 'time', modal: '',
        negative: false, time: '', question: true, polite: false,
    },
};
function setOptions(select, items, selected) {
    select.replaceChildren(...items.map(([value, label]) => option(value, label, value === selected)));
}
export function initializeWorkbench() {
    const state = { ...DEFAULT_SELECTION };
    const predicate = required('#predicate');
    const agent = required('#agent');
    const argument = required('#argument');
    const modal = required('#modal');
    const time = required('#time');
    const negative = required('#negative');
    const question = required('#question');
    const polite = required('#polite');
    function availableArguments() {
        const values = PREDICATES[state.predicate].allowedArguments;
        return values.filter((value) => state.predicate !== 'help' || value !== state.agent);
    }
    function normalizeSelection() {
        const frame = PREDICATES[state.predicate];
        const allowed = availableArguments();
        if (!allowed.includes(state.argument)) {
            const first = allowed[0];
            if (!first)
                throw new Error(`No arguments available for ${state.predicate}`);
            state.argument = first;
        }
        if (state.modal && !frame.allowedModalities.includes(state.modal))
            state.modal = '';
        if (!state.question)
            state.polite = false;
    }
    function renderForm() {
        normalizeSelection();
        const frame = PREDICATES[state.predicate];
        setOptions(predicate, Object.entries(PREDICATES).map(([id, info]) => [
            id,
            `${id.toUpperCase()} — ${info.description}`,
        ]), state.predicate);
        setOptions(agent, Object.entries(PARTICIPANTS), state.agent);
        required('#argument-label').textContent =
            frame.argumentRole.charAt(0).toUpperCase() + frame.argumentRole.slice(1);
        setOptions(argument, availableArguments().map((value) => [value, CONCEPTS[value]]), state.argument);
        setOptions(modal, [
            ['', 'No modal'],
            ...frame.allowedModalities.map((value) => [
                value, `${value.toUpperCase()}(event)`,
            ]),
        ], state.modal);
        negative.checked = state.negative;
        time.value = state.time;
        question.checked = state.question;
        polite.checked = state.polite;
        polite.disabled = !state.question;
        required('#question-help').textContent = state.polite
            ? 'PLEASE wraps ASK; disabling ASK removes PLEASE.'
            : 'Questions change grammar or punctuation in each language.';
    }
    function renderCompilation() {
        const status = required('#status');
        try {
            const tree = makeTree(state);
            required('#ast-view').textContent = notation(tree);
            required('#ast-json').textContent = JSON.stringify(tree, null, 2);
            required('#output-grid').innerHTML = languages.map((language) => `
        <article class="output-card">
          <div class="output-top">
            <span>${escapeHtml(language.profile.name)}</span>
            <code>${language.profile.code}</code>
          </div>
          <p lang="${language.profile.code}">${escapeHtml(language.realize(tree))}</p>
          <div class="output-foot">${escapeHtml(language.profile.features[0] ?? '')}</div>
        </article>
      `).join('');
            status.className = 'status success';
            status.textContent = 'Well-typed · supported by all three implementations';
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            status.className = 'status error';
            status.textContent = message;
            required('#ast-view').textContent = 'Invalid expression';
            required('#ast-json').textContent = message;
            required('#output-grid').replaceChildren();
        }
    }
    function update() {
        renderForm();
        renderCompilation();
    }
    predicate.addEventListener('change', () => {
        state.predicate = predicate.value;
        update();
    });
    agent.addEventListener('change', () => {
        state.agent = agent.value;
        update();
    });
    argument.addEventListener('change', () => {
        state.argument = argument.value;
        update();
    });
    modal.addEventListener('change', () => {
        state.modal = modal.value;
        update();
    });
    time.addEventListener('change', () => {
        state.time = time.value;
        update();
    });
    negative.addEventListener('change', () => {
        state.negative = negative.checked;
        update();
    });
    question.addEventListener('change', () => {
        state.question = question.checked;
        update();
    });
    polite.addEventListener('change', () => {
        state.polite = polite.checked;
        update();
    });
    document.querySelectorAll('.program').forEach((button) => {
        button.addEventListener('click', () => {
            const key = button.dataset['program'];
            const preset = key ? PRESETS[key] : undefined;
            if (!preset)
                throw new Error(`Unknown tree preset: ${key}`);
            Object.assign(state, preset);
            update();
            required('#workbench').scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('.program').forEach((element) => {
                element.classList.toggle('active', element === button);
            });
        });
    });
    required('#copy-ast').addEventListener('click', async () => {
        const button = required('#copy-ast');
        const expression = required('#ast-view').textContent ?? '';
        try {
            await navigator.clipboard.writeText(expression);
            button.textContent = 'Copied';
        }
        catch {
            button.textContent = 'Copy unavailable';
        }
    });
    update();
}
