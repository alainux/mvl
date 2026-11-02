import { askObject, DEFAULT_SELECTION, describe, howToGet, makeTree, notation, presence, } from '../core/algebra.js';
import { CONCEPTS, COUNTABLE_THINGS, DESCRIPTION_QUALITIES, LOCATABLE_PLACES, OBJECT_QUESTION_PREDICATES, PREDICATES, PRESENCE_THINGS, } from '../core/vocabulary.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
import { option, required } from './dom.js';
const SUBJECTS = [
    ['speaker', 'I'], ['addressee', 'You (formal)'], ['we', 'We'], ['other', 'He'],
];
const TIMES = [
    ['', 'Unspecified'], ['today', 'Today'], ['now', 'Now'], ['this_week', 'This week'],
    ['yesterday', 'Yesterday'], ['last_week', 'Last week'], ['last_month', 'Last month'],
    ['tomorrow', 'Tomorrow'], ['next_week', 'Next week'],
    ['next_month', 'Next month'], ['soon', 'Soon'], ['tonight', 'Tonight'],
];
const TIMES_BY_TENSE = {
    present: ['', 'today', 'now', 'this_week'],
    past: ['', 'yesterday', 'last_week', 'last_month'],
    future: ['', 'tomorrow', 'next_week', 'next_month', 'soon', 'tonight'],
};
const FREQUENCIES = [
    ['', 'No frequency'], ['every_day', 'Every day'],
    ['every_week', 'Every week'], ['often', 'Often'], ['sometimes', 'Sometimes'],
];
const MODALS = {
    can: 'Can / be allowed to', want: 'Want to', must: 'Must / have to',
};
const HABITUAL_ACTIONS = new Set([
    'work', 'study', 'read', 'write', 'cook', 'sleep', 'take',
    'drink', 'eat', 'wait', 'use', 'meet', 'go', 'speak',
]);
function select(id) {
    return required(`#${id}`);
}
function fill(element, values, current) {
    element.replaceChildren(...values.map(([value, label]) => option(value, label, value === current)));
}
function labelFor(value) {
    return CONCEPTS[value] ?? value.replaceAll('_', ' ');
}
/** Binds five independently typed constructors to a single live learning surface. */
export function initializeBuilder(code) {
    const selection = { ...DEFAULT_SELECTION };
    let mode = 'action';
    let describedThing = 'room';
    let quality = 'big';
    let descriptionTense = 'present';
    let presenceThing = 'pharmacy';
    let presencePlace = 'here';
    let objectPredicate = 'need';
    let objectAgent = 'addressee';
    let routePlace = 'station';
    const negative = required('#builder-negative');
    const question = required('#builder-question');
    const polite = required('#builder-polite');
    const output = required('#builder-output');
    const translation = required('#builder-english');
    const construction = required('#builder-tree');
    const validation = required('#builder-validation');
    const copy = required('#builder-copy');
    fill(select('builder-mode'), [
        ['action', 'Perform an action, including past / future'],
        ['describe', 'Describe a person or thing'],
        ['presence', 'Is there something nearby?'],
        ['ask-object', 'Ask what someone needs, has or wants'],
        ['route', 'Ask how to reach a place'],
    ], mode);
    fill(select('builder-description-thing'), Object.keys(DESCRIPTION_QUALITIES).map((id) => [id, labelFor(id)]), describedThing);
    fill(select('builder-description-tense'), [['present', 'Present'], ['past', 'Past']], descriptionTense);
    fill(select('builder-presence-thing'), PRESENCE_THINGS.map((id) => [id, labelFor(id)]), presenceThing);
    fill(select('builder-presence-place'), [
        ['', 'Somewhere (unspecified)'], ['here', 'Here'],
        ['station', 'At the station'], ['hotel', 'At the hotel'],
        ['airport', 'At the airport'], ['city_center', 'In the city centre'],
    ], presencePlace ?? '');
    fill(select('builder-object-predicate'), OBJECT_QUESTION_PREDICATES.map((id) => [id, PREDICATES[id].description]), objectPredicate);
    fill(select('builder-object-agent'), [['addressee', 'You (formal)'], ['speaker', 'I']], objectAgent);
    fill(select('builder-route-place'), LOCATABLE_PLACES.map((id) => [id, labelFor(id)]), routePlace);
    function updateEventControls() {
        const frame = PREDICATES[selection.predicate];
        const argumentsForPredicate = frame.allowedArguments
            .filter((candidate) => !(['help', 'call'].includes(selection.predicate)
            && candidate === selection.agent));
        if (!argumentsForPredicate.includes(selection.argument)) {
            selection.argument = argumentsForPredicate[0] ?? selection.argument;
        }
        const modalities = frame.allowedModalities;
        if (selection.modal && !modalities.includes(selection.modal))
            selection.modal = '';
        if (selection.predicate === 'like' && selection.tense !== 'present')
            selection.tense = 'present';
        if (!TIMES_BY_TENSE[selection.tense].includes(selection.time))
            selection.time = '';
        if (!selection.question)
            selection.polite = false;
        if (selection.question)
            selection.reason = 'none';
        const canCount = COUNTABLE_THINGS.includes(selection.argument);
        if (!canCount)
            selection.quantity = 1;
        if (!HABITUAL_ACTIONS.has(selection.predicate) || selection.tense !== 'present') {
            selection.frequency = '';
        }
        if (selection.frequency)
            selection.time = '';
        if (selection.time)
            selection.frequency = '';
        fill(select('builder-predicate'), Object.entries(PREDICATES).map(([id, frame]) => [id, frame.description]), selection.predicate);
        fill(select('builder-agent'), SUBJECTS, selection.agent);
        fill(select('builder-argument'), argumentsForPredicate.map((id) => [id, labelFor(id)]), selection.argument);
        fill(select('builder-modal'), [
            ['', 'No modal'], ...modalities.map((id) => [id, MODALS[id]]),
        ], selection.modal);
        fill(select('builder-tense'), (selection.predicate === 'like'
            ? [['present', 'Present']]
            : [['present', 'Present'], ['past', 'Completed past'], ['future', 'Future plan']]), selection.tense);
        fill(select('builder-time'), TIMES.filter(([id]) => TIMES_BY_TENSE[selection.tense].includes(id)
            && (!selection.frequency || !id)), selection.time);
        fill(select('builder-frequency'), HABITUAL_ACTIONS.has(selection.predicate) && selection.tense === 'present' && !selection.time
            ? FREQUENCIES
            : [['', 'Not available for this event']], selection.frequency);
        fill(select('builder-quantity'), canCount ? [['1', 'One'], ['2', 'Two']] : [['1', 'One / uncountable']], String(selection.quantity));
        fill(select('builder-reason'), [
            ['none', 'No reason'], ['sick', 'Because I am sick'],
            ['busy', 'Because I am busy'], ['no_time', 'Because I have no time'],
        ], selection.reason);
        select('builder-reason').disabled = selection.question;
    }
    function updatePresentation() {
        updateEventControls();
        const sections = {
            action: 'builder-action-fields', describe: 'builder-description-fields',
            presence: 'builder-presence-fields', 'ask-object': 'builder-object-fields',
            route: 'builder-route-fields',
        };
        for (const [sectionMode, id] of Object.entries(sections)) {
            required(`#${id}`).hidden = mode !== sectionMode;
        }
        const qualities = DESCRIPTION_QUALITIES[describedThing];
        if (!qualities.includes(quality))
            quality = qualities[0] ?? quality;
        fill(select('builder-description-quality'), qualities.map((id) => [id, labelFor(id)]), quality);
        fill(select('builder-mode'), [
            ['action', 'Perform an action, including past / future'],
            ['describe', 'Describe a person or thing'],
            ['presence', 'Is there something nearby?'],
            ['ask-object', 'Ask what someone needs, has or wants'],
            ['route', 'Ask how to reach a place'],
        ], mode);
        required('#builder-negative-field').hidden = mode === 'ask-object' || mode === 'route';
        required('#builder-question-field').hidden = mode === 'ask-object' || mode === 'route';
        required('#builder-polite-field').hidden = mode !== 'action';
        negative.checked = selection.negative;
        question.checked = selection.question;
        polite.checked = selection.polite;
        polite.disabled = !selection.question;
    }
    function meaning() {
        switch (mode) {
            case 'action': return makeTree(selection);
            case 'describe': return describe(describedThing, quality, {
                tense: descriptionTense, negative: selection.negative, question: selection.question,
            });
            case 'presence': return presence(presenceThing, presencePlace, {
                negative: selection.negative, question: selection.question,
            });
            case 'ask-object': return askObject(objectPredicate, objectAgent);
            case 'route': return howToGet(routePlace);
        }
    }
    function regenerate() {
        updatePresentation();
        try {
            const expression = meaning();
            output.textContent = linearize(expression, code);
            output.lang = code;
            translation.textContent = realizeEnglish(expression);
            construction.textContent = notation(expression);
            validation.textContent = 'Generated from grammar and meaning blocks.';
            validation.className = 'builder-validation is-valid';
            copy.disabled = false;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            output.textContent = 'This combination is not supported.';
            translation.textContent = '';
            construction.textContent = message;
            validation.textContent = message;
            validation.className = 'builder-validation is-invalid';
            copy.disabled = true;
        }
    }
    select('builder-mode').addEventListener('change', (event) => {
        mode = event.target.value;
        regenerate();
    });
    select('builder-predicate').addEventListener('change', (event) => {
        selection.predicate = event.target.value;
        regenerate();
    });
    select('builder-agent').addEventListener('change', (event) => {
        selection.agent = event.target.value;
        regenerate();
    });
    select('builder-argument').addEventListener('change', (event) => {
        selection.argument = event.target.value;
        regenerate();
    });
    select('builder-modal').addEventListener('change', (event) => {
        selection.modal = event.target.value;
        regenerate();
    });
    select('builder-tense').addEventListener('change', (event) => {
        selection.tense = event.target.value;
        regenerate();
    });
    select('builder-time').addEventListener('change', (event) => {
        selection.time = event.target.value;
        if (selection.time)
            selection.frequency = '';
        regenerate();
    });
    select('builder-frequency').addEventListener('change', (event) => {
        selection.frequency = event.target.value;
        if (selection.frequency)
            selection.time = '';
        regenerate();
    });
    select('builder-quantity').addEventListener('change', (event) => {
        selection.quantity = Number(event.target.value);
        regenerate();
    });
    select('builder-reason').addEventListener('change', (event) => {
        selection.reason = event.target.value;
        regenerate();
    });
    select('builder-description-thing').addEventListener('change', (event) => {
        describedThing = event.target.value;
        regenerate();
    });
    select('builder-description-quality').addEventListener('change', (event) => {
        quality = event.target.value;
        regenerate();
    });
    select('builder-description-tense').addEventListener('change', (event) => {
        descriptionTense = event.target.value;
        regenerate();
    });
    select('builder-presence-thing').addEventListener('change', (event) => {
        presenceThing = event.target.value;
        regenerate();
    });
    select('builder-presence-place').addEventListener('change', (event) => {
        const value = event.target.value;
        presencePlace = value ? value : null;
        regenerate();
    });
    select('builder-object-predicate').addEventListener('change', (event) => {
        objectPredicate = event.target.value;
        regenerate();
    });
    select('builder-object-agent').addEventListener('change', (event) => {
        objectAgent = event.target.value;
        regenerate();
    });
    select('builder-route-place').addEventListener('change', (event) => {
        routePlace = event.target.value;
        regenerate();
    });
    negative.addEventListener('change', () => { selection.negative = negative.checked; regenerate(); });
    question.addEventListener('change', () => { selection.question = question.checked; regenerate(); });
    polite.addEventListener('change', () => { selection.polite = polite.checked; regenerate(); });
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
