import { analyze } from '../core/algebra.js';
import { punctuate, selectForm, timeWord, words } from './shared.js';
/** Spanish: formal usted; first-person subject is normally omitted. */
const FINITE = {
    need: ['necesito', 'necesita'],
    have: ['tengo', 'tiene'],
    understand: ['entiendo', 'entiende'],
    help: ['ayudo', 'ayuda'],
    go: ['voy', 'va'],
    buy: ['compro', 'compra'],
    can: ['puedo', 'puede'],
    want: ['quiero', 'quiere'],
};
const TIMES = {
    today: 'hoy',
    tomorrow: 'mañana',
};
function object(analysis) {
    const { event, modality } = analysis;
    switch (event.predicate) {
        case 'need':
            return event.theme === 'help' ? 'ayuda' : 'un billete';
        case 'have':
            return event.theme === 'time' ? 'tiempo' : 'un billete';
        case 'understand':
            return modality ? 'entender esto' : 'esto';
        case 'go':
            return words(modality ? 'ir' : '', event.destination === 'home' ? 'a casa' : 'a la estación');
        case 'buy':
            return words(modality ? 'comprar' : '', 'un billete');
        case 'help':
            // Spanish enclitics attach to infinitives; finite verbs take proclitics.
            return modality
                ? `ayudar${event.recipient === 'speaker' ? 'me' : 'le'}`
                : '';
    }
}
function realize(expression) {
    const analysis = analyze(expression);
    const { event, modality, negative, polite } = analysis;
    const subject = event.agent === 'speaker' ? '' : 'Usted';
    const finite = selectForm(FINITE[modality ?? event.predicate], event.agent);
    const clitic = event.predicate === 'help' && !modality
        ? (event.recipient === 'speaker' ? 'me' : 'le')
        : '';
    let sentence = words(subject, negative ? 'no' : '', clitic, finite, object(analysis), timeWord(analysis.time, TIMES));
    if (polite)
        sentence += ', por favor';
    return punctuate(sentence, analysis, true);
}
export const spanish = {
    profile: {
        code: 'es',
        name: 'Spanish',
        variety: 'European Spanish · formal usted',
        features: [
            'Subject pronouns may be omitted (pro-drop)',
            'Formal usted uses third-person singular verb agreement',
            'Questions use inverted opening punctuation',
            'Negation precedes the finite verb; clitic placement depends on finiteness',
        ],
    },
    realize,
};
