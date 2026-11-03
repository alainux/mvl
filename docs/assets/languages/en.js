import { bare, capitalize, timeWord, words } from './shared.js';
/** English prompts are generated from meaning; never authored translations. */
const ROOTS = {
    need: { base: 'need', past: 'needed' }, have: { base: 'have', past: 'had' },
    would_like: { base: 'would like', past: 'wanted' }, understand: { base: 'understand', past: 'understood' },
    help: { base: 'help', past: 'helped' }, go: { base: 'go', past: 'went' },
    come: { base: 'come', past: 'came' }, buy: { base: 'buy', past: 'bought' },
    speak: { base: 'speak', past: 'spoke' }, repeat: { base: 'repeat', past: 'repeated' },
    pay: { base: 'pay', past: 'paid' }, drink: { base: 'drink', past: 'drank' },
    eat: { base: 'eat', past: 'ate' }, take: { base: 'take', past: 'took' },
    work: { base: 'work', past: 'worked' }, live: { base: 'live', past: 'lived' },
    be: { base: 'be', past: 'was' }, wait: { base: 'wait', past: 'waited' },
    call: { base: 'call', past: 'called' }, find: { base: 'find', past: 'found' },
    send: { base: 'send', past: 'sent' }, stay: { base: 'stay', past: 'stayed' },
    study: { base: 'study', past: 'studied' }, arrive: { base: 'arrive', past: 'arrived' },
    // Each predicate has a lemma and a known past form.
    look_for: { base: 'look for', past: 'looked for' },
    lose: { base: 'lose', past: 'lost' },
    read: { base: 'read', past: 'read' },
    write: { base: 'write', past: 'wrote' },
    use: { base: 'use', past: 'used' },
    open: { base: 'open', past: 'opened' },
    close: { base: 'close', past: 'closed' },
    fill_out: { base: 'fill out', past: 'filled out' },
    sign: { base: 'sign', past: 'signed' },
    reserve: { base: 'reserve', past: 'reserved' },
    cancel: { base: 'cancel', past: 'cancelled' },
    meet: { base: 'meet', past: 'met' },
    cook: { base: 'cook', past: 'cooked' },
    sleep: { base: 'sleep', past: 'slept' },
    leave: { base: 'leave', past: 'left' },
    return: { base: 'come back', past: 'came back' },
    like: { base: 'like', past: 'liked' },
    wait_for: { base: 'wait for', past: 'waited for' },
};
const NOUNS = {
    help: ['help', 'help', false], ticket: ['a ticket', 'two tickets', true],
    coffee: ['a coffee', 'two coffees', true], water: ['water', 'water', false],
    time: ['time', 'time', false], appointment: ['an appointment', 'two appointments', true],
    question: ['a question', 'two questions', true], problem: ['a problem', 'two problems', true],
    message: ['a message', 'two messages', true], food: ['food', 'food', false],
    money: ['money', 'money', false], phone: ['a phone', 'two phones', true],
    book: ['a book', 'two books', true], medicine: ['medicine', 'medicine', false],
    train: ['a train', 'two trains', true], bus: ['a bus', 'two buses', true],
    room: ['a room', 'two rooms', true], address: ['an address', 'two addresses', true],
    information: ['information', 'information', false],
    card: ['a card', 'two cards', true],
    // Reusable lexical entries for work, home, purchases and lost property.
    bag: ['a bag', 'two bags', true],
    keys: ['keys', 'keys', false],
    passport: ['a passport', 'two passports', true],
    wallet: ['a wallet', 'two wallets', true],
    bread: ['bread', 'bread', false],
    milk: ['milk', 'milk', false],
    music: ['music', 'music', false],
    bill: ['a bill', 'two bills', true],
    receipt: ['a receipt', 'two receipts', true],
    job: ['a job', 'two jobs', true],
    meeting: ['a meeting', 'two meetings', true],
    email: ['an email', 'two emails', true],
    computer: ['a computer', 'two computers', true],
    internet: ['the internet', 'the internet', false],
    document: ['a document', 'two documents', true],
    form: ['a form', 'two forms', true],
    family: ['a family', 'two families', true],
    friend: ['a friend', 'two friends', true],
    apartment: ['an apartment', 'two apartments', true],
    key: ['a key', 'two keys', true],
    door: ['a door', 'two doors', true],
    window: ['a window', 'two windows', true],
    doctor: ['a doctor', 'two doctors', true],
    shop: ['a shop', 'two shops', true],
    weather: ['the weather', 'the weather', false],
    table: ['a table', 'two tables', true],
    reservation: ['a reservation', 'two reservations', true],
    trip: ['a trip', 'two trips', true],
    colleague: ['a colleague', 'two colleagues', true],
    pharmacy: ['a pharmacy', 'two pharmacies', true],
    bank: ['a bank', 'two banks', true],
    hotel: ['a hotel', 'two hotels', true],
    restaurant: ['a restaurant', 'two restaurants', true],
    bus_stop: ['a bus stop', 'two bus stops', true],
    cafe: ['a café', 'two cafés', true],
    library: ['a library', 'two libraries', true],
    park: ['a park', 'two parks', true],
};
const PEOPLE = {
    speaker: ['I', 'me'], addressee: ['you', 'you'], we: ['we', 'us'], other: ['he', 'him'],
};
const PLACES = {
    home: 'home', station: 'to the station', hotel: 'to the hotel', office: 'to the office',
    hospital: 'to the hospital', restaurant: 'to the restaurant',
    supermarket: 'to the supermarket', pharmacy: 'to the pharmacy', airport: 'to the airport',
    bank: 'to the bank', school: 'to the school', park: 'to the park', library: 'to the library', post_office: 'to the post office', city_center: 'to the city centre', cafe: 'to the café', bus_stop: 'to the bus stop',
};
const STAY = { home: 'at home', hotel: 'at the hotel', hospital: 'in the hospital', office: 'at the office',
    apartment: 'in the apartment',
};
const RESIDENCES = { here: 'here', berlin: 'in Berlin', paris: 'in Paris', madrid: 'in Madrid' };
const STATES = { sick: 'sick', tired: 'tired', busy: 'busy', ready: 'ready', late: 'late' };
const LANGUAGES = { german: 'German', french: 'French', spanish: 'Spanish', english: 'English' };
const FREQUENCIES = {
    every_day: 'every day', every_week: 'every week',
    often: 'often', sometimes: 'sometimes',
};
const TIMES = {
    now: 'now', today: 'today', yesterday: 'yesterday', last_week: 'last week',
    tomorrow: 'tomorrow', next_week: 'next week', soon: 'soon',
    this_week: 'this week', last_month: 'last month', next_month: 'next month', tonight: 'tonight',
};
function complement(action) {
    const { argument, predicate, quantity } = action;
    switch (predicate) {
        case 'need':
        case 'have':
        case 'would_like':
        case 'understand':
        case 'buy':
        case 'repeat':
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
        case 'like':
        case 'wait_for': {
            // Eating already implies food in this minimal predicate frame.
            if (predicate === 'eat' && argument === 'food')
                return '';
            if (argument === 'this')
                return 'this';
            if (predicate === 'like' && argument === 'coffee')
                return 'coffee';
            if (predicate === 'understand' && argument === 'information')
                return 'the information';
            const noun = NOUNS[argument];
            if (!noun)
                throw new TypeError(`No English noun: ${argument}`);
            return noun[quantity === 2 ? 1 : 0];
        }
        case 'help':
        case 'call': return PEOPLE[argument][1];
        case 'go': return PLACES[argument];
        case 'stay': return STAY[argument];
        case 'live': return RESIDENCES[argument];
        case 'be': return STATES[argument];
        case 'speak':
        case 'study': return LANGUAGES[argument];
        case 'pay': return argument === 'card' ? 'by card' : 'in cash';
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
/** Apply simple-present third-person inflection to the *head* of a verb phrase. */
function thirdPersonPresent(phrase) {
    const [head, ...rest] = phrase.split(' ');
    if (!head)
        return phrase;
    const finite = head === 'have' ? 'has'
        : /[^aeiou]y$/u.test(head) ? `${head.slice(0, -1)}ies`
            : /(?:s|sh|ch|x|z|o)$/u.test(head) ? `${head}es`
                : `${head}s`;
    return [finite, ...rest].join(' ');
}
function realizeClause(value) {
    const { event: action, tense, modality, negative, question } = value;
    const person = PEOPLE[action.agent][0];
    const main = ROOTS[action.predicate];
    const object = complement(action);
    const time = timeWord(value.time ?? (tense === 'future' ? 'soon' : null), TIMES);
    let result;
    if (modality) {
        const base = words(main.base, object);
        if (tense === 'past') {
            const finite = { can: 'could', want: 'wanted to', must: 'had to' }[modality];
            result = question
                ? words('Did', person, negative ? 'not' : '', modality === 'can' ? 'manage to' : modality === 'want' ? 'want to' : 'have to', base)
                : words(person, negative
                    ? modality === 'can' ? 'could not' : modality === 'want' ? 'did not want to' : 'did not have to'
                    : finite, base);
        }
        else {
            const isThird = action.agent === 'other';
            const finite = modality === 'can' ? 'can'
                : modality === 'want' ? (isThird ? 'wants to' : 'want to')
                    : (isThird ? 'has to' : 'have to');
            const auxiliary = isThird ? 'Does' : 'Do';
            const negativeAuxiliary = isThird ? 'does not' : 'do not';
            result = question
                ? words(modality === 'can' ? 'Can' : auxiliary, person, negative ? 'not' : '', modality === 'want' ? 'want to' : modality === 'must' ? 'have to' : '', base)
                : words(person, negative
                    ? modality === 'can' ? 'cannot' : modality === 'want' ? `${negativeAuxiliary} want to` : `${negativeAuxiliary} have to`
                    : finite, base);
        }
    }
    else if (action.predicate === 'be') {
        const be = tense === 'past' ? (action.agent === 'we' || action.agent === 'addressee' ? 'were' : 'was')
            : tense === 'future' ? 'will be'
                : action.agent === 'speaker' ? 'am' : action.agent === 'we' ? 'are' : action.agent === 'addressee' ? 'are' : 'is';
        result = tense === 'future'
            ? question ? words('Will', person, negative ? 'not' : '', 'be', object)
                : words(person, negative ? 'will not be' : 'will be', object)
            : question ? words(be, person, negative ? 'not' : '', object)
                : words(person, be, negative ? 'not' : '', object);
    }
    else if (action.predicate === 'would_like' && tense === 'present') {
        result = question
            ? words('Would', person, negative ? 'not' : '', 'like', object)
            : words(person, negative ? 'would not like' : 'would like', object);
    }
    else if (tense === 'future') {
        result = question
            ? words('Will', person, negative ? 'not' : '', main.base, object)
            : words(person, negative ? 'will not' : 'will', main.base, object);
    }
    else if (tense === 'past') {
        result = question
            ? words('Did', person, negative ? 'not' : '', main.base, object)
            : words(person, negative ? 'did not' : '', negative ? main.base : main.past, object);
    }
    else {
        const verb = action.agent === 'other' ? thirdPersonPresent(main.base) : main.base;
        result = question
            ? words(action.agent === 'other' ? 'Does' : 'Do', person, negative ? 'not' : '', main.base, object)
            : words(person, negative ? (action.agent === 'other' ? 'does not' : 'do not') : '', negative ? main.base : verb, object);
    }
    const frequency = value.frequency ? FREQUENCIES[value.frequency] : '';
    const sentence = words(result, time, frequency) + (value.polite ? ', please' : '');
    return `${capitalize(sentence)}${question ? '?' : '.'}`;
}
const QUALITIES = {
    good: 'good', bad: 'bad', big: 'big', small: 'small', expensive: 'expensive',
    cheap: 'inexpensive', clean: 'clean', open: 'open', closed: 'closed',
    available: 'available', interesting: 'interesting', important: 'important', ready: 'ready',
};
const PRESENCE_PLACES = {
    here: 'here', station: 'at the station', hotel: 'at the hotel',
    airport: 'at the airport', city_center: 'in the city centre',
};
function definiteNoun(id) {
    const noun = NOUNS[id];
    if (!noun)
        throw new TypeError(`Unknown English noun: ${id}`);
    return `the ${noun[0].replace(/^(a|an|the) /u, '')}`;
}
function realizeDescription(value) {
    const subject = definiteNoun(value.thing);
    const be = value.tense === 'past' ? 'was' : 'is';
    const adjective = QUALITIES[value.quality];
    return value.question
        ? `${capitalize(be)} ${subject} ${value.negative ? 'not ' : ''}${adjective}?`
        : `${capitalize(subject)} ${be} ${value.negative ? 'not ' : ''}${adjective}.`;
}
function realizePresence(value) {
    const item = NOUNS[value.thing]?.[0];
    if (!item)
        throw new TypeError(`Missing English presence noun: ${value.thing}`);
    const place = value.place === null ? '' : PRESENCE_PLACES[value.place];
    const group = words(item, place);
    if (value.question) {
        return value.negative
            ? `Is there no ${item.replace(/^(a|an) /u, '')}${place ? ` ${place}` : ''}?`
            : `Is there ${group}?`;
    }
    return `There ${value.negative ? 'is no' : 'is'} ${value.negative ? item.replace(/^(a|an) /u, '') : item}${place ? ` ${place}` : ''}.`;
}
/** Prompts and target sentences always arise from the exact same AST. */
export function realizeEnglish(expression) {
    switch (expression.kind) {
        case 'describe': return realizeDescription(expression);
        case 'presence': return realizePresence(expression);
        case 'ask_object': {
            const subject = PEOPLE[expression.agent][0];
            const action = ROOTS[expression.predicate].base;
            return expression.predicate === 'would_like'
                ? `What would ${subject} like?`
                : `What do ${subject} ${action}?`;
        }
        case 'route': {
            const location = PLACES[expression.place];
            return `How do I get ${location.replace(/^to /u, 'to ')}?`;
        }
        case 'sequence': return expression.steps.map(realizeClause).join(' ');
        case 'where': return `Where is ${PLACES[expression.place].replace(/^to /u, '')}?`;
        case 'price': return `How much does ${NOUNS[expression.thing]?.[0] ?? expression.thing} cost?`;
        case 'clause': return realizeClause(expression);
        case 'ask_when': {
            const question = bare(realizeClause({ ...expression.value, question: true }));
            return `When ${question.replace(/^./u, (c) => c.toLowerCase())}?`;
        }
        case 'link': {
            const second = bare(realizeClause(expression.second));
            // English I is always capitalized, even in a subordinate clause.
            const embedded = second.startsWith('I ') ? second : second.replace(/^./u, (c) => c.toLowerCase());
            return `${bare(realizeClause(expression.first))}, ${expression.connection} ${embedded}.`;
        }
    }
}
