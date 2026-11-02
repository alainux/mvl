import { analyze } from '../core/algebra.js';
import { punctuate, selectForm, timeWord, words } from './shared.js';
/** Standard European Spanish, using formal usted for the addressee. */
const FINITE = {
    need: ['necesito', 'necesita'],
    have: ['tengo', 'tiene'],
    understand: ['entiendo', 'entiende'],
    help: ['ayudo', 'ayuda'],
    go: ['voy', 'va'],
    buy: ['compro', 'compra'],
    speak: ['hablo', 'habla'],
    repeat: ['repito', 'repite'],
    would_like: ['quisiera', 'quisiera'],
    pay: ['pago', 'paga'],
    can: ['puedo', 'puede'],
    want: ['quiero', 'quiere'],
};
const INFINITIVE = {
    need: 'necesitar', have: 'tener', understand: 'entender',
    help: 'ayudar', go: 'ir', buy: 'comprar', speak: 'hablar',
    repeat: 'repetir', would_like: 'querer', pay: 'pagar',
};
const TIMES = {
    today: 'hoy', tomorrow: 'mañana',
};
const LANGUAGES = {
    german: 'alemán', french: 'francés', spanish: 'español', english: 'inglés',
};
const NOUNS = {
    help: { word: 'ayuda', article: '' },
    ticket: { word: 'billete', article: 'un' },
    coffee: { word: 'café', article: 'un' },
    water: { word: 'agua', article: '' },
    time: { word: 'tiempo', article: '' },
};
function nounPhrase(noun) {
    const entry = NOUNS[noun];
    return words(entry.article, entry.word);
}
const PLACES = {
    home: { destination: 'a casa', location: '' },
    station: { destination: 'a la estación', location: 'la estación' },
    bathroom: { destination: 'al baño', location: 'el baño' },
    hotel: { destination: 'al hotel', location: 'el hotel' },
};
/** Recipient clitics precede finite verbs but attach to infinitives. */
function recipient(analysis) {
    if (analysis.event.predicate !== 'help')
        return '';
    return analysis.event.recipient === 'speaker' ? 'me' : 'le';
}
function complement(analysis) {
    const { event, modality } = analysis;
    switch (event.predicate) {
        case 'need':
        case 'buy':
        case 'would_like':
            return words(modality ? INFINITIVE[event.predicate] : '', nounPhrase(event.theme));
        case 'have':
            return nounPhrase(event.theme);
        case 'understand':
        case 'repeat':
            return words(modality ? INFINITIVE[event.predicate] : '', 'esto');
        case 'go':
            return words(modality ? 'ir' : '', PLACES[event.destination].destination);
        case 'help':
            return modality ? `${INFINITIVE.help}${recipient(analysis)}` : '';
        case 'speak':
            return LANGUAGES[event.theme];
        case 'pay':
            return words(modality ? 'pagar' : '', event.theme === 'card' ? 'con tarjeta' : 'en efectivo');
    }
}
function realize(expression) {
    if (expression.kind === 'where') {
        return `¿Dónde está ${PLACES[expression.place].location}?`;
    }
    if (expression.kind === 'price') {
        return `¿Cuánto cuesta ${nounPhrase(expression.thing)}?`;
    }
    const analysis = analyze(expression);
    const { event, modality, negative } = analysis;
    // Spanish can omit the subject because the finite form identifies the person.
    // This guide still teaches formal usted conjugations for the addressee.
    const finite = selectForm(FINITE[modality ?? event.predicate], event.agent);
    const clitic = event.predicate === 'help' && !modality ? recipient(analysis) : '';
    let sentence = words(negative ? 'no' : '', clitic, finite, complement(analysis), timeWord(analysis.time, TIMES));
    if (analysis.polite)
        sentence += ', por favor';
    return punctuate(sentence, analysis, true);
}
export const spanish = {
    profile: {
        code: 'es',
        name: 'Spanish',
        variety: 'European Spanish · formal usted',
        features: [
            'Subject pronouns are often omitted because the verb identifies the person.',
            'Formal usted takes third-person singular verb endings.',
            'Negate a clause with no immediately before its finite verb group.',
            'Written questions start with ¿ and end with ?.',
            'Poder and querer take an infinitive to express ability and desire.',
        ],
    },
    realize,
};
