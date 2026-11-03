import { askObject, clause, describe, event, howToGet, link, makeTree, notation, presence, price, sequence, where, } from '../core/algebra.js';
import { DESCRIPTION_QUALITIES, LOCATABLE_PLACES, OBJECT_QUESTION_PREDICATES, PREDICATES, PRESENCE_THINGS, } from '../core/vocabulary.js';
import { realizeEnglish } from '../languages/en.js';
import { linearize } from '../languages/index.js';
/**
 * Produce practice by transforming semantic trees, not by retrieving another
 * translation from a phrasebook. Every proposed variant goes through the same
 * language realizers used by the lesson compiler and the interactive builder.
 */
function alternatives(selection) {
    const frame = PREDICATES[selection.predicate];
    const changedArguments = frame.allowedArguments
        .filter((argument) => argument !== selection.argument)
        .filter((argument) => selection.predicate !== 'help' || selection.agent !== argument)
        .map((argument) => ({ ...selection, argument }));
    const temporalAlternatives = selection.frequency
        ? [
            { ...selection, frequency: 'sometimes', time: '' },
            { ...selection, frequency: 'often', time: '' },
            { ...selection, frequency: '', time: 'today' },
        ]
        : [
            { ...selection, time: { present: 'today', past: 'yesterday', future: 'tomorrow' }[selection.tense] },
            { ...selection, tense: 'past', time: 'yesterday', modal: '' },
            { ...selection, tense: 'future', time: 'tomorrow', modal: '' },
        ];
    return [
        ...changedArguments,
        { ...selection, negative: !selection.negative, polite: false },
        ...temporalAlternatives,
        { ...selection, question: !selection.question, polite: false },
    ];
}
/** A single place to reject candidates already shown in the lesson. */
function firstNew(candidates, seen) {
    for (const expression of candidates) {
        if (!seen.has(notation(expression))) {
            return { kind: 'expression', expression };
        }
    }
    return null;
}
function descriptionVariants(source) {
    // Quality alternatives are semantic restrictions on each noun. They are not
    // arbitrary adjectives that might produce nonsensical combinations.
    const qualities = DESCRIPTION_QUALITIES[source.thing];
    return [
        describe(source.thing, source.quality, { ...source, negative: !source.negative }),
        describe(source.thing, source.quality, { ...source, question: !source.question }),
        describe(source.thing, source.quality, {
            ...source,
            tense: source.tense === 'present' ? 'past' : 'present',
        }),
        ...qualities.map((quality) => describe(source.thing, quality, source)),
    ];
}
function sequenceVariants(steps) {
    // Narratives are assembled from several independent clauses. Change a
    // clause's meaning and retain the other events, not a fixed story template.
    const first = steps[0];
    if (!first)
        return [];
    const original = [...steps];
    const negated = { ...first, negative: !first.negative };
    const questioned = { ...first, question: false, polite: false };
    const candidates = [sequence(negated, ...steps.slice(1))];
    for (const argument of PREDICATES[first.event.predicate].allowedArguments) {
        if (argument === first.event.argument)
            continue;
        try {
            const alternate = clause(event(first.event.predicate, first.event.agent, argument));
            const changed = { ...questioned, event: alternate.event };
            candidates.push(sequence(changed, ...original.slice(1)));
        }
        catch {
            // Some semantic substitutions are disallowed by the predicate frame.
        }
    }
    return candidates;
}
function changeSource(source, seen) {
    if (source.kind === 'convention')
        return source;
    // Lesson paradigms retain their original semantic input controls. Running
    // them through makeTree also rechecks tense and modality compatibility.
    if (source.selection) {
        for (const selection of alternatives(source.selection)) {
            try {
                const expression = makeTree(selection);
                if (seen.has(notation(expression)))
                    continue;
                return { kind: 'expression', expression, selection };
            }
            catch {
                // Invalid substitutions are not eligible practice items.
            }
        }
        return source;
    }
    const original = source.expression;
    switch (original.kind) {
        case 'describe':
            return firstNew(descriptionVariants(original), seen) ?? source;
        case 'presence': {
            const candidates = [
                presence(original.thing, original.place, { ...original, question: !original.question }),
                presence(original.thing, original.place, { ...original, negative: !original.negative }),
                ...PRESENCE_THINGS.map((thing) => presence(thing, original.place, original)),
            ];
            return firstNew(candidates, seen) ?? source;
        }
        case 'ask_object': {
            const opposite = original.agent === 'speaker' ? 'addressee' : 'speaker';
            const candidates = [
                askObject(original.predicate, opposite),
                ...OBJECT_QUESTION_PREDICATES.map((predicate) => askObject(predicate, original.agent)),
            ];
            return firstNew(candidates, seen) ?? source;
        }
        case 'route':
            return firstNew(LOCATABLE_PLACES.map(howToGet), seen) ?? source;
        case 'sequence':
            return firstNew(sequenceVariants(original.steps), seen) ?? source;
        case 'link': {
            const causes = ['busy', 'sick', 'tired'].map((quality) => clause(event('be', original.second.event.agent, quality)));
            const candidates = [
                ...causes.map((cause) => link(original.first, original.connection, cause)),
                link({ ...original.first, negative: !original.first.negative }, original.connection, original.second),
            ];
            return firstNew(candidates, seen) ?? source;
        }
        case 'where': {
            const places = LOCATABLE_PLACES;
            return firstNew(places.map(where), seen) ?? source;
        }
        case 'price': {
            const things = ['ticket', 'coffee', 'book', 'room', 'computer', 'bag', 'apartment'];
            return firstNew(things.map(price), seen) ?? source;
        }
        case 'ask_when': {
            const questions = PREDICATES[original.value.event.predicate].allowedArguments
                .filter((argument) => argument !== original.value.event.argument)
                .map((argument) => {
                const replacement = clause(event(original.value.event.predicate, original.value.event.agent, argument));
                return { kind: 'ask_when', value: replacement };
            });
            return firstNew(questions, seen) ?? source;
        }
        case 'clause': {
            const candidate = { ...original, negative: !original.negative };
            return firstNew([candidate], seen) ?? source;
        }
    }
}
function textFor(source, code, original) {
    if (source.kind === 'convention')
        return original;
    return {
        ...original,
        source,
        english: realizeEnglish(source.expression),
        target: linearize(source.expression, code),
        provenance: 'composed',
    };
}
/** Deterministic practice session; same input produces the same practice. */
export function generatePractice(lesson, code, limit = 6) {
    const seen = new Set(lesson.examples.flatMap((example) => example.source.kind === 'expression' ? [notation(example.source.expression)] : []));
    const used = new Set();
    const results = [];
    for (const original of lesson.examples) {
        const variant = changeSource(original.source, seen);
        const exercise = textFor(variant, code, original);
        if (used.has(exercise.target))
            continue;
        used.add(exercise.target);
        results.push({ ...exercise, id: `practice-${original.id}` });
        if (results.length >= limit)
            break;
    }
    return results;
}
/** Comparison checks the displayed model, not every acceptable paraphrase. */
export function matchesModel(answer, target) {
    const normalize = (value) => value
        .normalize('NFC')
        .trim()
        .toLocaleLowerCase()
        .replace(/[’‘ʼ]/gu, "'")
        .replace(/[.!?¿\s]+$/gu, '')
        .replace(/\s+/gu, ' ');
    return normalize(answer) === normalize(target);
}
