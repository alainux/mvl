import { realizeEnglish } from '../languages/en.js';
import { languages } from '../languages/index.js';
import { CURRICULUM } from './curriculum.js';
import { expandBlock } from './expand.js';
import { NOTES } from './notes.js';
import { EXTENSION_NOTES } from './notes-everyday.js';
import { ENGLISH_CONVENTIONS, ROUTINES } from './routines.js';
function realize(source, code) {
    if (source.kind === 'convention')
        return ROUTINES[code][source.routine];
    const adapter = languages.find((language) => language.profile.code === code);
    if (!adapter)
        throw new TypeError(`Unknown language implementation: ${code}`);
    return adapter.realize(source.expression);
}
function gloss(source) {
    return source.kind === 'convention'
        ? ENGLISH_CONVENTIONS[source.routine]
        : realizeEnglish(source.expression);
}
/**
 * Compile the learner's language guide from the shared typed curriculum.
 *
 * There is no pre-translated phrase table for productive examples. A single
 * semantic AST is linearized independently into English and the target language.
 * Conventional greetings are isolated, explicitly labeled exceptions.
 */
export function compileGuide(code) {
    const language = languages.find((entry) => entry.profile.code === code);
    if (!language)
        throw new TypeError(`Unknown language implementation: ${code}`);
    return {
        language: language.profile,
        lessons: CURRICULUM.map((lesson) => {
            const sources = lesson.blocks.flatMap(expandBlock);
            const notes = NOTES[code][lesson.id] ?? EXTENSION_NOTES[code][lesson.id];
            if (!notes)
                throw new TypeError(`No teaching notes for ${code}/${lesson.id}`);
            const examples = sources.map((source, index) => ({
                id: `${lesson.id}-${index + 1}`,
                english: gloss(source),
                target: realize(source, code),
                source,
                provenance: source.kind === 'convention' ? 'conventional' : 'composed',
            }));
            return {
                id: lesson.id,
                stage: lesson.stage,
                title: lesson.title,
                goal: lesson.goal,
                introduction: lesson.introduction,
                notes,
                examples,
            };
        }),
    };
}
export const INSTALLED_LANGUAGES = ['de', 'fr', 'es'];
