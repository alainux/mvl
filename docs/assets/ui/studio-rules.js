const GUIDANCE = {
    de: {
        basic: 'In a normal statement, the conjugated verb stays in second position. German changes its endings and the noun forms for you.',
        past: 'For most everyday completed actions, use haben or sein plus a past participle. The participle usually goes at the end.',
        future: 'For a planned future action, use the present verb with a future time word such as morgen. No extra future tense is needed.',
        modal: 'A modal verb such as kann or muss takes the second position. The other verb moves to the end in its infinitive form.',
        negative: 'German uses nicht for many actions and kein for certain noun phrases. The grammar engine chooses the construction.',
        question: 'In a yes/no question, the conjugated verb normally comes first. Bitte makes appropriate requests more polite.',
        frequency: 'Use a common time expression such as jeden Tag to describe a recurring activity without a special tense.',
        reason: 'Keep the explanation simple: add a short second statement. You can communicate why without mastering long subordinate clauses.',
        description: 'Use sein (to be) plus an adjective. Unlike attributive adjectives, a predicate adjective does not get a gender ending.',
        presence: 'Use es gibt with an accusative noun phrase to talk about things that exist or are available.',
        open: 'A question word can stand in for the missing object. Learn the question pattern as a reusable construction.',
        route: 'A short question with wie and kommen is enough to ask how to reach a destination.',
        where: 'Wo ist ...? is a simple location question with a reusable noun slot.',
        price: 'Wie viel kostet ...? combines a question word, kostet and the priced item.',
    },
    fr: {
        basic: 'French keeps subject and verb close together. The grammar chooses the correct verb form and noun phrase.',
        past: 'Use the passé composé: a form of avoir or être followed by the past participle.',
        future: 'For everyday plans, use aller + infinitive. It is an accessible alternative to learning the full future conjugation now.',
        modal: 'Use pouvoir, vouloir, or devoir followed by the main verb in the infinitive.',
        negative: 'French typically places ne and pas around the conjugated verb. Apostrophes appear where required.',
        question: 'A clear, reusable way to ask a question is est-ce que followed by a statement.',
        frequency: 'Add a frequency expression such as tous les jours to describe a repeated activity.',
        reason: 'A short second clause introduced by parce que can express a cause using familiar simple forms.',
        description: 'A statement with être describes a quality. Some French adjectives must agree in gender and number.',
        presence: 'Il y a is a productive construction for saying that something exists or is available.',
        open: 'Use a question word to ask for the missing thing rather than memorizing each full question.',
        route: 'Use comment with aller to ask how to get to a place.',
        where: 'Où est ... ? asks where a singular place is located.',
        price: 'Combien coûte ... ? asks how much one item costs.',
    },
    es: {
        basic: 'Spanish marks person on the verb; subject pronouns may be optional in real speech. This beginner system includes them for clarity.',
        past: 'Use the preterite to talk about a completed past action. It is a compact, useful way to report what happened.',
        future: 'Use ir a + infinitive for plans. This avoids learning the full future endings at first.',
        modal: 'Use poder, querer, or tener que plus an infinitive to express ability, intention, and obligation.',
        negative: 'Spanish normally puts no directly before the conjugated verb.',
        question: 'A yes/no question often has the same basic word order as a statement, with question intonation and ¿…?.',
        frequency: 'Use a time expression such as todos los días with the simple present to express a routine.',
        reason: 'Join two simple statements with porque to explain a reason.',
        description: 'Use ser or estar with an adjective; which one is right depends on the kind of quality being described.',
        presence: 'Hay expresses existence or availability and works with many nouns.',
        open: 'An open question asks about a missing object by using a question word.',
        route: 'Use cómo and llegar for a simple directions question.',
        where: '¿Dónde está ...? is a reusable question for finding a place.',
        price: '¿Cuánto cuesta ...? asks the price of an item.',
    },
};
export function ruleFor(state, code, selected) {
    const source = GUIDANCE[code];
    if (state.pattern === 'description')
        return source.description;
    if (state.pattern === 'presence')
        return source.presence;
    if (state.pattern === 'ask-object')
        return source.open;
    if (state.pattern === 'route')
        return source.route;
    if (state.pattern === 'where')
        return source.where;
    if (state.pattern === 'price')
        return source.price;
    if (selected === 'tense')
        return source[state.action.tense === 'present' ? 'basic' : state.action.tense];
    if (selected === 'modal' && state.action.modal)
        return source.modal;
    if (selected === 'negative' && state.action.negative)
        return source.negative;
    if (selected === 'question' || selected === 'polite')
        return source.question;
    if (selected === 'reason' && state.action.reason !== 'none')
        return source.reason;
    if (selected === 'frequency' && state.action.frequency)
        return source.frequency;
    if (state.action.tense !== 'present')
        return source[state.action.tense] ?? source.basic;
    if (state.action.modal)
        return source.modal;
    return source.basic;
}
