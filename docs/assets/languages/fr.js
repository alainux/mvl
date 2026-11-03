import { bare, capitalize, form, timeWord, words } from './shared.js';
/** Lexemes and their morphology; never preassembled example sentences. */
const NOUNS = {
    help: { singular: 'aide', plural: 'aides', gender: 'f', countable: false },
    ticket: { singular: 'billet', plural: 'billets', gender: 'm', countable: true },
    coffee: { singular: 'café', plural: 'cafés', gender: 'm', countable: true },
    water: { singular: 'eau', plural: 'eaux', gender: 'f', countable: false },
    time: { singular: 'temps', plural: 'temps', gender: 'm', countable: false },
    appointment: { singular: 'rendez-vous', plural: 'rendez-vous', gender: 'm', countable: true },
    question: { singular: 'question', plural: 'questions', gender: 'f', countable: true },
    problem: { singular: 'problème', plural: 'problèmes', gender: 'm', countable: true },
    message: { singular: 'message', plural: 'messages', gender: 'm', countable: true },
    food: { singular: 'nourriture', plural: 'nourritures', gender: 'f', countable: false },
    money: { singular: 'argent', plural: 'argents', gender: 'm', countable: false },
    phone: { singular: 'téléphone', plural: 'téléphones', gender: 'm', countable: true },
    book: { singular: 'livre', plural: 'livres', gender: 'm', countable: true },
    medicine: { singular: 'médicament', plural: 'médicaments', gender: 'm', countable: true },
    train: { singular: 'train', plural: 'trains', gender: 'm', countable: true },
    bus: { singular: 'bus', plural: 'bus', gender: 'm', countable: true },
    room: { singular: 'chambre', plural: 'chambres', gender: 'f', countable: true },
    address: { singular: 'adresse', plural: 'adresses', gender: 'f', countable: true },
    information: { singular: 'information', plural: 'informations', gender: 'f', countable: true },
    card: { singular: 'carte', plural: 'cartes', gender: 'f', countable: true },
    // Reusable noun lexemes. Articles and inflection are computed at runtime.
    bag: { singular: 'sac', plural: 'sacs', gender: 'm', countable: true },
    keys: { singular: 'clés', plural: 'clés', gender: 'f', countable: false },
    passport: { singular: 'passeport', plural: 'passeports', gender: 'm', countable: true },
    wallet: { singular: 'portefeuille', plural: 'portefeuilles', gender: 'm', countable: true },
    bread: { singular: 'pain', plural: 'pains', gender: 'm', countable: false },
    milk: { singular: 'lait', plural: 'laits', gender: 'm', countable: false },
    music: { singular: 'musique', plural: 'musiques', gender: 'f', countable: false },
    bill: { singular: 'addition', plural: 'additions', gender: 'f', countable: true },
    receipt: { singular: 'reçu', plural: 'reçus', gender: 'm', countable: true },
    job: { singular: 'emploi', plural: 'emplois', gender: 'm', countable: true },
    meeting: { singular: 'réunion', plural: 'réunions', gender: 'f', countable: true },
    email: { singular: 'courriel', plural: 'courriels', gender: 'm', countable: true },
    computer: { singular: 'ordinateur', plural: 'ordinateurs', gender: 'm', countable: true },
    internet: { singular: 'Internet', plural: 'Internet', gender: 'm', countable: false },
    document: { singular: 'document', plural: 'documents', gender: 'm', countable: true },
    form: { singular: 'formulaire', plural: 'formulaires', gender: 'm', countable: true },
    family: { singular: 'famille', plural: 'familles', gender: 'f', countable: true },
    friend: { singular: 'ami', plural: 'amis', gender: 'm', countable: true },
    apartment: { singular: 'appartement', plural: 'appartements', gender: 'm', countable: true },
    key: { singular: 'clé', plural: 'clés', gender: 'f', countable: true },
    door: { singular: 'porte', plural: 'portes', gender: 'f', countable: true },
    window: { singular: 'fenêtre', plural: 'fenêtres', gender: 'f', countable: true },
    doctor: { singular: 'médecin', plural: 'médecins', gender: 'm', countable: true },
    shop: { singular: 'magasin', plural: 'magasins', gender: 'm', countable: true },
    weather: { singular: 'temps', plural: 'temps', gender: 'm', countable: false },
    table: { singular: 'table', plural: 'tables', gender: 'f', countable: true },
    reservation: { singular: 'réservation', plural: 'réservations', gender: 'f', countable: true },
    trip: { singular: 'voyage', plural: 'voyages', gender: 'm', countable: true },
    colleague: { singular: 'collègue', plural: 'collègues', gender: 'm', countable: true },
    pharmacy: { singular: 'pharmacie', plural: 'pharmacies', gender: 'f', countable: true },
    bank: { singular: 'banque', plural: 'banques', gender: 'f', countable: true },
    hotel: { singular: 'hôtel', plural: 'hôtels', gender: 'm', countable: true },
    restaurant: { singular: 'restaurant', plural: 'restaurants', gender: 'm', countable: true },
    bus_stop: { singular: 'arrêt de bus', plural: 'arrêts de bus', gender: 'm', countable: true },
    cafe: { singular: 'café', plural: 'cafés', gender: 'm', countable: true },
    library: { singular: 'bibliothèque', plural: 'bibliothèques', gender: 'f', countable: true },
    park: { singular: 'parc', plural: 'parcs', gender: 'm', countable: true },
};
function vowel(word) {
    return /^[aeiouhàâäéèêëîïôöùûüœ]/iu.test(word);
}
function elide(preposition, noun) {
    return vowel(noun) ? `${preposition}’${noun}` : `${preposition === 'd' ? 'de' : preposition} ${noun}`;
}
function noun(id, amount, negative) {
    if (id === 'information')
        return negative ? 'd’informations' : 'des informations';
    const entry = NOUNS[id];
    if (!entry)
        throw new TypeError(`No French noun: ${id}`);
    if (amount === 2)
        return words('deux', entry.plural);
    if (negative)
        return elide('d', entry.singular); // after pas, indefinite articles disappear
    if (entry.countable)
        return words(entry.gender === 'm' ? 'un' : 'une', entry.singular);
    if (entry.singular === 'temps')
        return 'du temps';
    return vowel(entry.singular)
        ? `de l’${entry.singular}`
        : words(entry.gender === 'm' ? 'du' : 'de la', entry.singular);
}
/** Needing something is avoir besoin de + NP, regardless of negation. */
function needComplement(id, amount) {
    if (id === 'information')
        return 'besoin d’informations';
    const entry = NOUNS[id];
    if (!entry)
        throw new TypeError(`No French noun: ${id}`);
    if (amount === 2)
        return `besoin de deux ${entry.plural}`;
    if (entry.countable)
        return `besoin d’${entry.gender === 'm' ? 'un' : 'une'} ${entry.singular}`;
    return `besoin ${elide('d', entry.singular)}`;
}
const VERBS = {
    need: { present: ['ai', 'avez', 'avons', 'a'], infinitive: 'avoir', participle: 'eu', auxiliary: 'avoir', past: ['avais', 'aviez', 'avions', 'avait'] },
    have: { present: ['ai', 'avez', 'avons', 'a'], infinitive: 'avoir', participle: 'eu', auxiliary: 'avoir', past: ['avais', 'aviez', 'avions', 'avait'] },
    would_like: { present: ['voudrais', 'voudriez', 'voudrions', 'voudrait'], infinitive: 'vouloir', participle: 'voulu', auxiliary: 'avoir', past: ['voulais', 'vouliez', 'voulions', 'voulait'] },
    understand: { present: ['comprends', 'comprenez', 'comprenons', 'comprend'], infinitive: 'comprendre', participle: 'compris', auxiliary: 'avoir' },
    help: { present: ['aide', 'aidez', 'aidons', 'aide'], infinitive: 'aider', participle: 'aidé', auxiliary: 'avoir' },
    go: { present: ['vais', 'allez', 'allons', 'va'], infinitive: 'aller', participle: 'allé', auxiliary: 'être' },
    come: { present: ['viens', 'venez', 'venons', 'vient'], infinitive: 'venir', participle: 'venu', auxiliary: 'être' },
    buy: { present: ['achète', 'achetez', 'achetons', 'achète'], infinitive: 'acheter', participle: 'acheté', auxiliary: 'avoir' },
    speak: { present: ['parle', 'parlez', 'parlons', 'parle'], infinitive: 'parler', participle: 'parlé', auxiliary: 'avoir' },
    repeat: { present: ['répète', 'répétez', 'répétons', 'répète'], infinitive: 'répéter', participle: 'répété', auxiliary: 'avoir' },
    pay: { present: ['paie', 'payez', 'payons', 'paie'], infinitive: 'payer', participle: 'payé', auxiliary: 'avoir' },
    drink: { present: ['bois', 'buvez', 'buvons', 'boit'], infinitive: 'boire', participle: 'bu', auxiliary: 'avoir' },
    eat: { present: ['mange', 'mangez', 'mangeons', 'mange'], infinitive: 'manger', participle: 'mangé', auxiliary: 'avoir' },
    take: { present: ['prends', 'prenez', 'prenons', 'prend'], infinitive: 'prendre', participle: 'pris', auxiliary: 'avoir' },
    work: { present: ['travaille', 'travaillez', 'travaillons', 'travaille'], infinitive: 'travailler', participle: 'travaillé', auxiliary: 'avoir' },
    live: { present: ['habite', 'habitez', 'habitons', 'habite'], infinitive: 'habiter', participle: 'habité', auxiliary: 'avoir' },
    be: { present: ['suis', 'êtes', 'sommes', 'est'], infinitive: 'être', participle: 'été', auxiliary: 'avoir', past: ['étais', 'étiez', 'étions', 'était'] },
    wait: { present: ['attends', 'attendez', 'attendons', 'attend'], infinitive: 'attendre', participle: 'attendu', auxiliary: 'avoir' },
    call: { present: ['appelle', 'appelez', 'appelons', 'appelle'], infinitive: 'appeler', participle: 'appelé', auxiliary: 'avoir' },
    find: { present: ['trouve', 'trouvez', 'trouvons', 'trouve'], infinitive: 'trouver', participle: 'trouvé', auxiliary: 'avoir' },
    send: { present: ['envoie', 'envoyez', 'envoyons', 'envoie'], infinitive: 'envoyer', participle: 'envoyé', auxiliary: 'avoir' },
    stay: { present: ['reste', 'restez', 'restons', 'reste'], infinitive: 'rester', participle: 'resté', auxiliary: 'être' },
    study: { present: ['apprends', 'apprenez', 'apprenons', 'apprend'], infinitive: 'apprendre', participle: 'appris', auxiliary: 'avoir' },
    arrive: { present: ['arrive', 'arrivez', 'arrivons', 'arrive'], infinitive: 'arriver', participle: 'arrivé', auxiliary: 'être' },
    // Conjugation metadata is independent from lesson authoring.
    look_for: { present: ['cherche', 'cherchez', 'cherchons', 'cherche'], infinitive: 'chercher', participle: 'cherché', auxiliary: 'avoir' },
    lose: { present: ['perds', 'perdez', 'perdons', 'perd'], infinitive: 'perdre', participle: 'perdu', auxiliary: 'avoir' },
    read: { present: ['lis', 'lisez', 'lisons', 'lit'], infinitive: 'lire', participle: 'lu', auxiliary: 'avoir' },
    write: { present: ['écris', 'écrivez', 'écrivons', 'écrit'], infinitive: 'écrire', participle: 'écrit', auxiliary: 'avoir' },
    use: { present: ['utilise', 'utilisez', 'utilisons', 'utilise'], infinitive: 'utiliser', participle: 'utilisé', auxiliary: 'avoir' },
    open: { present: ['ouvre', 'ouvrez', 'ouvrons', 'ouvre'], infinitive: 'ouvrir', participle: 'ouvert', auxiliary: 'avoir' },
    close: { present: ['ferme', 'fermez', 'fermons', 'ferme'], infinitive: 'fermer', participle: 'fermé', auxiliary: 'avoir' },
    fill_out: { present: ['remplis', 'remplissez', 'remplissons', 'remplit'], infinitive: 'remplir', participle: 'rempli', auxiliary: 'avoir' },
    sign: { present: ['signe', 'signez', 'signons', 'signe'], infinitive: 'signer', participle: 'signé', auxiliary: 'avoir' },
    reserve: { present: ['réserve', 'réservez', 'réservons', 'réserve'], infinitive: 'réserver', participle: 'réservé', auxiliary: 'avoir' },
    cancel: { present: ['annule', 'annulez', 'annulons', 'annule'], infinitive: 'annuler', participle: 'annulé', auxiliary: 'avoir' },
    meet: { present: ['retrouve', 'retrouvez', 'retrouvons', 'retrouve'], infinitive: 'retrouver', participle: 'retrouvé', auxiliary: 'avoir' },
    cook: { present: ['cuisine', 'cuisinez', 'cuisinons', 'cuisine'], infinitive: 'cuisiner', participle: 'cuisiné', auxiliary: 'avoir' },
    sleep: { present: ['dors', 'dormez', 'dormons', 'dort'], infinitive: 'dormir', participle: 'dormi', auxiliary: 'avoir' },
    leave: { present: ['pars', 'partez', 'partons', 'part'], infinitive: 'partir', participle: 'parti', auxiliary: 'être' },
    return: { present: ['reviens', 'revenez', 'revenons', 'revient'], infinitive: 'revenir', participle: 'revenu', auxiliary: 'être' },
    like: { present: ['aime', 'aimez', 'aimons', 'aime'], infinitive: 'aimer', participle: 'aimé', auxiliary: 'avoir' },
    wait_for: { present: ['attends', 'attendez', 'attendons', 'attend'], infinitive: 'attendre', participle: 'attendu', auxiliary: 'avoir' },
};
const MODALS = {
    can: { present: ['peux', 'pouvez', 'pouvons', 'peut'], participle: 'pu' },
    want: { present: ['veux', 'voulez', 'voulons', 'veut'], participle: 'voulu' },
    must: { present: ['dois', 'devez', 'devons', 'doit'], participle: 'dû' },
};
const HAVE = ['ai', 'avez', 'avons', 'a'];
const BE = ['suis', 'êtes', 'sommes', 'est'];
const ALLER = ['vais', 'allez', 'allons', 'va'];
const TIMES = {
    now: 'maintenant', today: 'aujourd’hui', yesterday: 'hier', last_week: 'la semaine dernière',
    tomorrow: 'demain', next_week: 'la semaine prochaine', soon: 'bientôt',
    this_week: 'cette semaine', last_month: 'le mois dernier', next_month: 'le mois prochain', tonight: 'ce soir',
};
const FREQUENCIES = {
    every_day: 'tous les jours', every_week: 'chaque semaine',
    often: 'souvent', sometimes: 'parfois',
};
const DEFINITES = {
    coffee: 'le café', bread: 'le pain', music: 'la musique', food: 'la nourriture',
};
const SUBJECTS = {
    speaker: 'je', addressee: 'vous', we: 'nous', other: 'il',
};
const OBJECTS = {
    speaker: 'm’', addressee: 'vous', we: 'nous', other: 'l’',
};
const LANGUAGES = { german: 'allemand', french: 'français', spanish: 'espagnol', english: 'anglais' };
const STATES = { sick: 'malade', tired: 'fatigué', busy: 'occupé', ready: 'prêt', late: 'en retard' };
const DESTINATIONS = {
    home: 'chez moi', station: 'à la gare', hotel: 'à l’hôtel', office: 'au bureau',
    hospital: 'à l’hôpital', restaurant: 'au restaurant', supermarket: 'au supermarché',
    pharmacy: 'à la pharmacie', airport: 'à l’aéroport',
    bank: 'à la banque', school: 'à l’école', park: 'au parc', library: 'à la bibliothèque', post_office: 'à la poste', city_center: 'au centre-ville', cafe: 'au café', bus_stop: 'à l’arrêt de bus',
};
const RESIDENCES = { here: 'ici', berlin: 'à Berlin', paris: 'à Paris', madrid: 'à Madrid' };
const STAYING = { home: 'chez moi', hotel: 'à l’hôtel', hospital: 'à l’hôpital', office: 'au bureau',
    apartment: 'dans l’appartement',
};
const LOCATIONS = {
    station: 'la gare', hotel: 'l’hôtel', office: 'le bureau', hospital: 'l’hôpital',
    restaurant: 'le restaurant', supermarket: 'le supermarché',
    pharmacy: 'la pharmacie', airport: 'l’aéroport',
    bank: 'la banque', school: 'l’école', park: 'le parc', library: 'la bibliothèque', post_office: 'la poste', city_center: 'le centre-ville', cafe: 'le café', bus_stop: 'l’arrêt de bus',
};
/** Clitics and subject elision are implemented once for every verb. */
function clitic(value) {
    return OBJECTS[value];
}
function attachClitic(pronoun, word) {
    return pronoun.endsWith('’') ? `${pronoun}${word}` : words(pronoun, word);
}
function finiteGroup(person, finite, negative, prefix = '') {
    const verbGroup = prefix ? attachClitic(prefix, finite) : finite;
    const withNegation = negative
        ? `${vowel(verbGroup) ? 'n’' : 'ne '}${verbGroup} pas`
        : verbGroup;
    const subject = SUBJECTS[person];
    return subject === 'je' && vowel(withNegation)
        ? `j’${withNegation}`
        : words(subject, withNegation);
}
function complement(action, negativeNoun) {
    const { argument, predicate, quantity, agent } = action;
    switch (predicate) {
        case 'need': return needComplement(argument, quantity);
        case 'have':
            if (argument === 'time')
                return negativeNoun ? 'le temps' : 'du temps';
            return noun(argument, quantity, negativeNoun);
        case 'would_like':
        case 'buy':
        case 'drink':
        case 'eat':
        case 'take':
        case 'find':
        case 'send':
        case 'look_for':
        case 'lose':
        case 'read':
        case 'write':
        case 'use':
        case 'open':
        case 'close':
        case 'fill_out':
        case 'sign':
        case 'reserve':
        case 'cancel':
        case 'meet':
            // Eating already implies food in this minimal predicate frame.
            if (predicate === 'eat' && argument === 'food')
                return '';
            if (predicate === 'use' && argument === 'internet')
                return 'Internet';
            if (predicate === 'would_like' && argument === 'bill' && quantity === 1)
                return 'l’addition';
            return noun(argument, quantity, negativeNoun);
        case 'understand':
        case 'repeat':
            if (argument === 'information')
                return 'les informations';
            return argument === 'this' ? 'ça' : noun(argument, quantity, negativeNoun);
        case 'help':
        case 'call': return '';
        case 'go': return argument === 'home' && agent === 'addressee' ? 'chez vous' : DESTINATIONS[argument];
        case 'stay': return argument === 'home' && agent === 'addressee' ? 'chez vous' : STAYING[argument];
        case 'live': return RESIDENCES[argument];
        case 'be': return agent === 'we' && argument !== 'late' ? `${STATES[argument]}s` : STATES[argument];
        case 'speak': return LANGUAGES[argument];
        case 'study': return vowel(LANGUAGES[argument])
            ? `l’${LANGUAGES[argument]}`
            : words('le', LANGUAGES[argument]);
        case 'pay': return argument === 'card' ? 'par carte' : 'en espèces';
        case 'wait_for': return noun(argument, quantity, false);
        case 'like': return DEFINITES[argument];
        case 'come':
        case 'work':
        case 'wait':
        case 'arrive':
        case 'cook':
        case 'sleep':
        case 'leave':
        case 'return': return '';
    }
}
function realizeClause(value) {
    const { event: action, tense, modality, negative } = value;
    // Seeing a doctor uses voir, not the social-meeting verb retrouver.
    const verb = action.predicate === 'meet' && action.argument === 'doctor'
        ? { present: ['vois', 'voyez', 'voyons', 'voit'], infinitive: 'voir', participle: 'vu', auxiliary: 'avoir' }
        : VERBS[action.predicate];
    const person = action.agent;
    const temporal = timeWord(value.time ?? (tense === 'future' ? 'soon' : null), TIMES);
    const frequency = value.frequency ? FREQUENCIES[value.frequency] : '';
    const pronoun = action.predicate === 'help' || action.predicate === 'call'
        ? clitic(action.argument)
        : '';
    const nominalNegation = !modality && negative && ['have', 'would_like', 'buy', 'drink', 'eat', 'take', 'find', 'send',
        'look_for', 'lose', 'read', 'write', 'use', 'open', 'close',
        'fill_out', 'sign', 'reserve', 'cancel', 'meet'].includes(action.predicate);
    const object = complement(action, nominalNegation);
    let text;
    if (modality === 'must' && negative) {
        // Ne pas devoir often conveys prohibition. Lack of obligation is better
        // expressed with ne pas avoir besoin de + infinitive.
        const infinitive = pronoun ? attachClitic(pronoun, verb.infinitive) : verb.infinitive;
        const actionPhrase = elide('d', infinitive);
        const finite = finiteGroup(person, form(HAVE, person), true);
        text = words(finite, tense === 'past' ? 'eu' : '', 'besoin', actionPhrase, object, temporal);
    }
    else if (modality) {
        const m = MODALS[modality];
        const finite = tense === 'past'
            ? form(HAVE, person)
            : form(m.present, person);
        const first = finiteGroup(person, finite, negative);
        // Modal conjugation has a finite helper, followed by the main infinitive.
        // For past modals the finite helper is avoir + the modal participle.
        const action = pronoun ? attachClitic(pronoun, verb.infinitive) : verb.infinitive;
        text = words(first, tense === 'past' ? m.participle : '', action, object, temporal);
    }
    else if (tense === 'future') {
        if (action.predicate === 'would_like') {
            // A request for tomorrow remains a polite request: 'Je voudrais ...
            // demain' is simpler and more idiomatic than 'Je vais vouloir ...'.
            text = words(finiteGroup(person, form(verb.present, person), negative), object, temporal);
        }
        else {
            const inf = pronoun ? attachClitic(pronoun, verb.infinitive) : verb.infinitive;
            text = words(finiteGroup(person, form(ALLER, person), negative), inf, object, temporal);
        }
    }
    else if (tense === 'past' && !verb.past) {
        const aux = verb.auxiliary === 'être' ? BE : HAVE;
        const finite = finiteGroup(person, form(aux, person), negative, pronoun);
        const participle = verb.auxiliary === 'être' && person === 'we' ? `${verb.participle}s` : verb.participle;
        text = words(finite, participle, object, temporal);
    }
    else {
        const forms = tense === 'past' ? (verb.past ?? verb.present) : verb.present;
        const beforeObject = value.frequency === 'often' || value.frequency === 'sometimes' ? frequency : '';
        const afterObject = value.frequency === 'every_day' || value.frequency === 'every_week' ? frequency : '';
        text = words(finiteGroup(person, form(forms, person), negative, pronoun), beforeObject, object, afterObject, temporal);
    }
    if (value.question) {
        text = `est-ce que ${text}`;
    }
    if (value.polite)
        text += ', s’il vous plaît';
    return `${capitalize(text)}${value.question ? ' ?' : '.'}`;
}
const QUALITIES = {
    good: ['bon', 'bonne'], bad: ['mauvais', 'mauvaise'],
    big: ['grand', 'grande'], small: ['petit', 'petite'],
    expensive: ['cher', 'chère'], cheap: ['bon marché', 'bon marché'],
    clean: ['propre', 'propre'], open: ['ouvert', 'ouverte'],
    closed: ['fermé', 'fermée'], available: ['disponible', 'disponible'],
    interesting: ['intéressant', 'intéressante'],
    important: ['important', 'importante'], ready: ['prêt', 'prête'],
};
const PRESENCE_PLACES = {
    here: 'ici', station: 'à la gare', hotel: 'à l’hôtel',
    airport: 'à l’aéroport', city_center: 'au centre-ville',
};
function definiteNoun(id) {
    const entry = NOUNS[id];
    if (!entry)
        throw new TypeError(`Missing French noun: ${id}`);
    const article = vowel(entry.singular) ? 'l’' : entry.gender === 'm' ? 'le ' : 'la ';
    return `${article}${entry.singular}`;
}
function realizeDescription(value) {
    if (value.thing === 'weather') {
        const weather = value.quality === 'good' ? 'beau' : 'mauvais';
        const finite = value.tense === 'past' ? 'faisait' : 'fait';
        const group = words('il', value.negative ? 'ne' : '', finite, value.negative ? 'pas' : '', weather);
        return value.question ? `Est-ce qu’${group} ?` : `${capitalize(group)}.`;
    }
    const entry = NOUNS[value.thing];
    if (!entry)
        throw new TypeError(`Missing French description noun: ${value.thing}`);
    const quality = QUALITIES[value.quality][entry.gender === 'f' ? 1 : 0];
    const copula = value.tense === 'past' ? 'était' : 'est';
    const phrase = words(definiteNoun(value.thing), value.negative ? (copula === 'est' ? 'n’est pas' : 'n’était pas') : copula, quality);
    return value.question ? `Est-ce que ${phrase} ?` : `${capitalize(phrase)}.`;
}
function realizePresence(value) {
    const entry = NOUNS[value.thing];
    if (!entry)
        throw new TypeError(`Missing French presence noun: ${value.thing}`);
    const item = value.negative ? elide('d', entry.singular) : noun(value.thing, 1, false);
    const location = value.place === null ? '' : PRESENCE_PLACES[value.place];
    const text = words(value.negative ? 'il n’y a pas' : 'il y a', item, location);
    return value.question ? `Est-ce qu’${text} ?` : `${capitalize(text)}.`;
}
function questionSubject(person, finite) {
    const subject = SUBJECTS[person];
    return subject === 'je' && vowel(finite) ? `j’${finite}` : words(subject, finite);
}
function realize(expression) {
    switch (expression.kind) {
        case 'describe': return realizeDescription(expression);
        case 'presence': return realizePresence(expression);
        case 'ask_object': {
            const verb = VERBS[expression.predicate];
            const finite = questionSubject(expression.agent, form(verb.present, expression.agent));
            const body = expression.predicate === 'need'
                ? `De quoi est-ce que ${finite} besoin`
                : `Qu’est-ce que ${finite}`;
            return `${body} ?`;
        }
        case 'route': return `Comment est-ce que je vais ${DESTINATIONS[expression.place]} ?`;
        case 'sequence': return expression.steps.map(realizeClause).join(' ');
        case 'where': return `Où est ${LOCATIONS[expression.place]} ?`;
        case 'price': return `Combien coûte ${noun(expression.thing, 1, false)} ?`;
        case 'clause': return realizeClause(expression);
        case 'ask_when': {
            const statement = bare(realizeClause(expression.value)).replace(/^./u, (c) => c.toLocaleLowerCase());
            return `Quand est-ce que ${statement} ?`;
        }
        case 'link': {
            const linker = { and: 'et', but: 'mais', because: 'parce que' }[expression.connection];
            const second = bare(realizeClause(expression.second)).replace(/^./u, (c) => c.toLocaleLowerCase());
            return `${bare(realizeClause(expression.first))}, ${linker} ${second}.`;
        }
    }
}
export const french = {
    profile: {
        code: 'fr', name: 'French', variety: 'Standard French · formal vous · minimal production grammar',
        features: [
            'A regular statement keeps subject + verb + complement; use est-ce que to ask questions.',
            'Use passé composé (auxiliary + participle) for past events; short states use imparfait.',
            'Use aller + infinitive for a near-future plan.',
            'Use ne/n’ ... pas around the finite verb group for negative statements.',
            'The printed masculine adjective and movement participles change agreement for a feminine speaker.',
        ],
    },
    realize,
};
