import { CONCEPTS, PREDICATES } from '../core/vocabulary.js';
import { generatePractice } from '../learning/practice.js';
export function nextLevelIndex(guide, completed) {
    const first = guide.lessons.findIndex((lesson) => !completed.has(lesson.id));
    return first === -1 ? guide.lessons.length - 1 : first;
}
export function levelUnlocked(guide, completed, index) {
    return index >= 0 && index < guide.lessons.length && index <= nextLevelIndex(guide, completed);
}
export function meaningBlocks(example) {
    if (example.source.kind === 'convention')
        return ['EVERYDAY EXPRESSION'];
    const expression = example.source.expression;
    if (expression.kind === 'link')
        return ['STATEMENT 1', expression.connection.toUpperCase(), 'STATEMENT 2'];
    if (expression.kind === 'sequence')
        return expression.steps.map((_, i) => 'STEP ' + (i + 1));
    if (expression.kind === 'where')
        return ['WHERE?', String(CONCEPTS[expression.place]).toUpperCase()];
    if (expression.kind === 'route')
        return ['HOW TO GET?', String(CONCEPTS[expression.place]).toUpperCase()];
    if (expression.kind === 'price')
        return ['PRICE?', String(CONCEPTS[expression.thing]).toUpperCase()];
    if (expression.kind === 'presence')
        return ['EXISTS?', String(CONCEPTS[expression.thing]).toUpperCase()];
    if (expression.kind === 'describe')
        return [String(CONCEPTS[expression.thing]).toUpperCase(), expression.quality.toUpperCase()];
    if (expression.kind === 'ask_object')
        return ['ASK WHAT?', PREDICATES[expression.predicate].description.toUpperCase()];
    const clause = expression.kind === 'ask_when' ? expression.value : expression;
    const agent = { speaker: 'I', addressee: 'YOU', we: 'WE', other: 'HE' }[clause.event.agent];
    const words = [agent, PREDICATES[clause.event.predicate].description.toUpperCase()];
    if (clause.event.argument !== 'none')
        words.push(String(CONCEPTS[clause.event.argument]).toUpperCase());
    if (clause.tense !== 'present')
        words.push(clause.tense.toUpperCase());
    if (clause.time)
        words.push(clause.time.replaceAll('_', ' ').toUpperCase());
    if (clause.modality)
        words.push(clause.modality.toUpperCase());
    if (clause.negative)
        words.push('NOT');
    if (clause.question || expression.kind === 'ask_when')
        words.push('QUESTION');
    return words.slice(0, 7);
}
function distinctExamples(examples) {
    const seen = new Set();
    const result = [];
    for (const example of examples) {
        const key = example.english.trim().toLocaleLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        result.push(example);
    }
    return result;
}
export function memoryExamples(lesson) {
    return distinctExamples(lesson.examples).slice(0, 8);
}
export function drillQuestions(guide, lesson) {
    const code = guide.language.code;
    const candidates = distinctExamples([
        ...generatePractice(lesson, code, 8), ...lesson.examples,
    ]).slice(0, 8);
    const currentIndex = guide.lessons.findIndex((entry) => entry.id === lesson.id);
    const all = distinctExamples([
        ...lesson.examples,
        ...guide.lessons.slice(0, currentIndex + 1).flatMap((entry) => entry.examples),
    ]);
    return candidates.map((example, index) => {
        const distractors = [];
        const chosen = new Set([example.target]);
        const cue = example.english.trim().toLocaleLowerCase();
        // Deterministic rotation avoids the correct answer always appearing first.
        const ordered = [...all.slice(index + 1), ...all.slice(0, index + 1)];
        for (const alternate of ordered) {
            if (alternate.english.trim().toLocaleLowerCase() === cue || chosen.has(alternate.target))
                continue;
            distractors.push(alternate.target);
            chosen.add(alternate.target);
            if (distractors.length === 3)
                break;
        }
        const options = [...distractors];
        options.splice((index * 3 + currentIndex + 1) % (options.length + 1), 0, example.target);
        return {
            id: lesson.id + ':' + example.id,
            english: example.english,
            target: example.target,
            options,
            example,
        };
    });
}
