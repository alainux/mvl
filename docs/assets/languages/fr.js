import { analyze } from '../core/algebra.js';
import { capitalize, selectForm, timeWord, words } from './shared.js';
/**
 * French: formal vous. Keep subject elision, object clitics, and ne…pas in
 * dedicated functions: they are syntax rules, not translated phrase entries.
 */
const FINITE = {
    need: ['ai', 'avez'],
    have: ['ai', 'avez'],
    understand: ['comprends', 'comprenez'],
    help: ['aide', 'aidez'],
    go: ['vais', 'allez'],
    buy: ['achète', 'achetez'],
    can: ['peux', 'pouvez'],
    want: ['veux', 'voulez'],
};
const TIMES = {
    today: 'aujourd’hui',
    tomorrow: 'demain',
};
function startsWithVowel(text) {
    return /^[aeiouhàâéèêîôùû]/i.test(text);
}
function subject(analysis, verbGroup) {
    if (analysis.event.agent === 'addressee')
        return words('vous', verbGroup);
    // je contracts only when the following word starts with a vowel/silent h.
    // In particular: j’ai, but je n’ai and je ne comprends.
    return startsWithVowel(verbGroup)
        ? `j’${verbGroup}`
        : words('je', verbGroup);
}
function negatedVerb(verbGroup) {
    const ne = startsWithVowel(verbGroup) ? 'n’' : 'ne ';
    return `${ne}${verbGroup} pas`;
}
function helpClitic(analysis) {
    if (analysis.event.predicate !== 'help')
        return '';
    return analysis.event.recipient === 'speaker' ? 'm’' : 'vous ';
}
function complement(analysis) {
    const { event, modality, negative } = analysis;
    switch (event.predicate) {
        case 'need':
            return event.theme === 'help' ? 'besoin d’aide' : 'besoin d’un billet';
        case 'have':
            if (event.theme === 'time')
                return 'le temps';
            return negative ? 'de billet' : 'un billet';
        case 'understand':
            return modality ? 'comprendre ça' : 'ça';
        case 'help':
            // With a modal, the object clitic is attached to the infinitive.
            return modality ? `${helpClitic(analysis)}aider` : '';
        case 'go': {
            const destination = event.destination === 'station'
                ? 'à la gare'
                : (event.agent === 'speaker' ? 'chez moi' : 'chez vous');
            return modality ? words('aller', destination) : destination;
        }
        case 'buy': {
            const article = negative ? 'de billet' : 'un billet';
            return modality ? words('acheter', article) : article;
        }
    }
}
function realize(expression) {
    const analysis = analyze(expression);
    const { event, modality, negative } = analysis;
    const finite = selectForm(FINITE[modality ?? event.predicate], event.agent);
    const clitic = event.predicate === 'help' && !modality ? helpClitic(analysis) : '';
    const verbGroup = `${clitic}${finite}`;
    const conjugated = negative ? negatedVerb(verbGroup) : verbGroup;
    const mainClause = subject(analysis, words(conjugated, complement(analysis)));
    let sentence = words(mainClause, timeWord(analysis.time, TIMES));
    if (analysis.question) {
        // est-ce que avoids inversion and supports the same core word order.
        sentence = `Est-ce que ${sentence}`;
    }
    else {
        sentence = capitalize(sentence);
    }
    if (analysis.polite)
        sentence += ', s’il vous plaît';
    return sentence + (analysis.question ? ' ?' : '.');
}
export const french = {
    profile: {
        code: 'fr',
        name: 'French',
        variety: 'Standard French · formal vous',
        features: [
            'Subject + finite verb, with est-ce que questions',
            'Negative finite verb uses ne … pas (including elision)',
            'Object clitics precede their finite verb or attach to infinitives',
            'The concept NEED is expressed with avoir besoin de',
        ],
    },
    realize,
};
