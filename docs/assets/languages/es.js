import { bare, finish, form, timeWord, words } from './shared.js';
const NOUNS = {
    help: { singular: 'ayuda', plural: 'ayudas', gender: 'f', countable: false },
    ticket: { singular: 'billete', plural: 'billetes', gender: 'm', countable: true },
    coffee: { singular: 'café', plural: 'cafés', gender: 'm', countable: true },
    water: { singular: 'agua', plural: 'aguas', gender: 'f', countable: false },
    time: { singular: 'tiempo', plural: 'tiempos', gender: 'm', countable: false },
    appointment: { singular: 'cita', plural: 'citas', gender: 'f', countable: true },
    question: { singular: 'pregunta', plural: 'preguntas', gender: 'f', countable: true },
    problem: { singular: 'problema', plural: 'problemas', gender: 'm', countable: true },
    message: { singular: 'mensaje', plural: 'mensajes', gender: 'm', countable: true },
    food: { singular: 'comida', plural: 'comidas', gender: 'f', countable: false },
    money: { singular: 'dinero', plural: 'dineros', gender: 'm', countable: false },
    phone: { singular: 'teléfono', plural: 'teléfonos', gender: 'm', countable: true },
    book: { singular: 'libro', plural: 'libros', gender: 'm', countable: true },
    medicine: { singular: 'medicina', plural: 'medicinas', gender: 'f', countable: false },
    train: { singular: 'tren', plural: 'trenes', gender: 'm', countable: true },
    bus: { singular: 'autobús', plural: 'autobuses', gender: 'm', countable: true },
    room: { singular: 'habitación', plural: 'habitaciones', gender: 'f', countable: true },
    address: { singular: 'dirección', plural: 'direcciones', gender: 'f', countable: true },
    information: { singular: 'información', plural: 'informaciones', gender: 'f', countable: false },
    card: { singular: 'tarjeta', plural: 'tarjetas', gender: 'f', countable: true },
    // Reusable noun lexemes. Articles and inflection are computed at runtime.
    bag: { singular: 'bolsa', plural: 'bolsas', gender: 'f', countable: true },
    keys: { singular: 'llaves', plural: 'llaves', gender: 'f', countable: false },
    passport: { singular: 'pasaporte', plural: 'pasaportes', gender: 'm', countable: true },
    wallet: { singular: 'cartera', plural: 'carteras', gender: 'f', countable: true },
    bread: { singular: 'pan', plural: 'panes', gender: 'm', countable: false },
    milk: { singular: 'leche', plural: 'leches', gender: 'f', countable: false },
    music: { singular: 'música', plural: 'músicas', gender: 'f', countable: false },
    bill: { singular: 'cuenta', plural: 'cuentas', gender: 'f', countable: true },
    receipt: { singular: 'recibo', plural: 'recibos', gender: 'm', countable: true },
    job: { singular: 'trabajo', plural: 'trabajos', gender: 'm', countable: true },
    meeting: { singular: 'reunión', plural: 'reuniones', gender: 'f', countable: true },
    email: { singular: 'correo', plural: 'correos', gender: 'm', countable: true },
    computer: { singular: 'ordenador', plural: 'ordenadores', gender: 'm', countable: true },
    internet: { singular: 'internet', plural: 'internet', gender: 'm', countable: false },
    document: { singular: 'documento', plural: 'documentos', gender: 'm', countable: true },
    form: { singular: 'formulario', plural: 'formularios', gender: 'm', countable: true },
    family: { singular: 'familia', plural: 'familias', gender: 'f', countable: true },
    friend: { singular: 'amigo', plural: 'amigos', gender: 'm', countable: true },
    apartment: { singular: 'piso', plural: 'pisos', gender: 'm', countable: true },
    key: { singular: 'llave', plural: 'llaves', gender: 'f', countable: true },
    door: { singular: 'puerta', plural: 'puertas', gender: 'f', countable: true },
    window: { singular: 'ventana', plural: 'ventanas', gender: 'f', countable: true },
    doctor: { singular: 'médico', plural: 'médicos', gender: 'm', countable: true },
    shop: { singular: 'tienda', plural: 'tiendas', gender: 'f', countable: true },
    weather: { singular: 'tiempo', plural: 'tiempos', gender: 'm', countable: false },
    table: { singular: 'mesa', plural: 'mesas', gender: 'f', countable: true },
    reservation: { singular: 'reserva', plural: 'reservas', gender: 'f', countable: true },
    trip: { singular: 'viaje', plural: 'viajes', gender: 'm', countable: true },
    colleague: { singular: 'compañero', plural: 'compañeros', gender: 'm', countable: true },
    pharmacy: { singular: 'farmacia', plural: 'farmacias', gender: 'f', countable: true },
    bank: { singular: 'banco', plural: 'bancos', gender: 'm', countable: true },
    hotel: { singular: 'hotel', plural: 'hoteles', gender: 'm', countable: true },
    restaurant: { singular: 'restaurante', plural: 'restaurantes', gender: 'm', countable: true },
    bus_stop: { singular: 'parada de autobús', plural: 'paradas de autobús', gender: 'f', countable: true },
    cafe: { singular: 'cafetería', plural: 'cafeterías', gender: 'f', countable: true },
    library: { singular: 'biblioteca', plural: 'bibliotecas', gender: 'f', countable: true },
    park: { singular: 'parque', plural: 'parques', gender: 'm', countable: true },
};
function noun(id, quantity, negative) {
    const entry = NOUNS[id];
    if (!entry)
        throw new TypeError(`No Spanish noun: ${id}`);
    if (quantity === 2)
        return words('dos', entry.plural);
    if (negative)
        return entry.singular;
    return entry.countable
        ? words(entry.gender === 'm' ? 'un' : 'una', entry.singular)
        : entry.singular;
}
/** Small explicit irregular tables prevent fictitious regularized past forms. */
const VERBS = {
    need: { present: ['necesito', 'necesita', 'necesitamos', 'necesita'], past: ['necesité', 'necesitó', 'necesitamos', 'necesitó'], infinitive: 'necesitar' },
    have: { present: ['tengo', 'tiene', 'tenemos', 'tiene'], past: ['tenía', 'tenía', 'teníamos', 'tenía'], infinitive: 'tener' },
    would_like: { present: ['quisiera', 'quisiera', 'quisiéramos', 'quisiera'], past: ['quería', 'quería', 'queríamos', 'quería'], infinitive: 'querer' },
    understand: { present: ['entiendo', 'entiende', 'entendemos', 'entiende'], past: ['entendí', 'entendió', 'entendimos', 'entendió'], infinitive: 'entender' },
    help: { present: ['ayudo', 'ayuda', 'ayudamos', 'ayuda'], past: ['ayudé', 'ayudó', 'ayudamos', 'ayudó'], infinitive: 'ayudar' },
    go: { present: ['voy', 'va', 'vamos', 'va'], past: ['fui', 'fue', 'fuimos', 'fue'], infinitive: 'ir' },
    come: { present: ['vengo', 'viene', 'venimos', 'viene'], past: ['vine', 'vino', 'vinimos', 'vino'], infinitive: 'venir' },
    buy: { present: ['compro', 'compra', 'compramos', 'compra'], past: ['compré', 'compró', 'compramos', 'compró'], infinitive: 'comprar' },
    speak: { present: ['hablo', 'habla', 'hablamos', 'habla'], past: ['hablé', 'habló', 'hablamos', 'habló'], infinitive: 'hablar' },
    repeat: { present: ['repito', 'repite', 'repetimos', 'repite'], past: ['repetí', 'repitió', 'repetimos', 'repitió'], infinitive: 'repetir' },
    pay: { present: ['pago', 'paga', 'pagamos', 'paga'], past: ['pagué', 'pagó', 'pagamos', 'pagó'], infinitive: 'pagar' },
    drink: { present: ['bebo', 'bebe', 'bebemos', 'bebe'], past: ['bebí', 'bebió', 'bebimos', 'bebió'], infinitive: 'beber' },
    eat: { present: ['como', 'come', 'comemos', 'come'], past: ['comí', 'comió', 'comimos', 'comió'], infinitive: 'comer' },
    take: { present: ['tomo', 'toma', 'tomamos', 'toma'], past: ['tomé', 'tomó', 'tomamos', 'tomó'], infinitive: 'tomar' },
    work: { present: ['trabajo', 'trabaja', 'trabajamos', 'trabaja'], past: ['trabajé', 'trabajó', 'trabajamos', 'trabajó'], infinitive: 'trabajar' },
    live: { present: ['vivo', 'vive', 'vivimos', 'vive'], past: ['vivía', 'vivía', 'vivíamos', 'vivía'], infinitive: 'vivir' },
    be: { present: ['estoy', 'está', 'estamos', 'está'], past: ['estaba', 'estaba', 'estábamos', 'estaba'], infinitive: 'estar' },
    wait: { present: ['espero', 'espera', 'esperamos', 'espera'], past: ['esperé', 'esperó', 'esperamos', 'esperó'], infinitive: 'esperar' },
    call: { present: ['llamo', 'llama', 'llamamos', 'llama'], past: ['llamé', 'llamó', 'llamamos', 'llamó'], infinitive: 'llamar' },
    find: { present: ['encuentro', 'encuentra', 'encontramos', 'encuentra'], past: ['encontré', 'encontró', 'encontramos', 'encontró'], infinitive: 'encontrar' },
    send: { present: ['envío', 'envía', 'enviamos', 'envía'], past: ['envié', 'envió', 'enviamos', 'envió'], infinitive: 'enviar' },
    stay: { present: ['me quedo', 'se queda', 'nos quedamos', 'se queda'], past: ['me quedé', 'se quedó', 'nos quedamos', 'se quedó'], infinitive: 'quedar' },
    study: { present: ['estudio', 'estudia', 'estudiamos', 'estudia'], past: ['estudié', 'estudió', 'estudiamos', 'estudió'], infinitive: 'estudiar' },
    arrive: { present: ['llego', 'llega', 'llegamos', 'llega'], past: ['llegué', 'llegó', 'llegamos', 'llegó'], infinitive: 'llegar' },
    // Conjugation metadata is independent from lesson authoring.
    look_for: { present: ['busco', 'busca', 'buscamos', 'busca'], past: ['busqué', 'buscó', 'buscamos', 'buscó'], infinitive: 'buscar' },
    lose: { present: ['pierdo', 'pierde', 'perdemos', 'pierde'], past: ['perdí', 'perdió', 'perdimos', 'perdió'], infinitive: 'perder' },
    read: { present: ['leo', 'lee', 'leemos', 'lee'], past: ['leí', 'leyó', 'leímos', 'leyó'], infinitive: 'leer' },
    write: { present: ['escribo', 'escribe', 'escribimos', 'escribe'], past: ['escribí', 'escribió', 'escribimos', 'escribió'], infinitive: 'escribir' },
    use: { present: ['uso', 'usa', 'usamos', 'usa'], past: ['usé', 'usó', 'usamos', 'usó'], infinitive: 'usar' },
    open: { present: ['abro', 'abre', 'abrimos', 'abre'], past: ['abrí', 'abrió', 'abrimos', 'abrió'], infinitive: 'abrir' },
    close: { present: ['cierro', 'cierra', 'cerramos', 'cierra'], past: ['cerré', 'cerró', 'cerramos', 'cerró'], infinitive: 'cerrar' },
    fill_out: { present: ['relleno', 'rellena', 'rellenamos', 'rellena'], past: ['rellené', 'rellenó', 'rellenamos', 'rellenó'], infinitive: 'rellenar' },
    sign: { present: ['firmo', 'firma', 'firmamos', 'firma'], past: ['firmé', 'firmó', 'firmamos', 'firmó'], infinitive: 'firmar' },
    reserve: { present: ['reservo', 'reserva', 'reservamos', 'reserva'], past: ['reservé', 'reservó', 'reservamos', 'reservó'], infinitive: 'reservar' },
    cancel: { present: ['cancelo', 'cancela', 'cancelamos', 'cancela'], past: ['cancelé', 'canceló', 'cancelamos', 'canceló'], infinitive: 'cancelar' },
    meet: { present: ['quedo', 'queda', 'quedamos', 'queda'], past: ['quedé', 'quedó', 'quedamos', 'quedó'], infinitive: 'quedar' },
    cook: { present: ['cocino', 'cocina', 'cocinamos', 'cocina'], past: ['cociné', 'cocinó', 'cocinamos', 'cocinó'], infinitive: 'cocinar' },
    sleep: { present: ['duermo', 'duerme', 'dormimos', 'duerme'], past: ['dormí', 'durmió', 'dormimos', 'durmió'], infinitive: 'dormir' },
    leave: { present: ['salgo', 'sale', 'salimos', 'sale'], past: ['salí', 'salió', 'salimos', 'salió'], infinitive: 'salir' },
    return: { present: ['vuelvo', 'vuelve', 'volvemos', 'vuelve'], past: ['volví', 'volvió', 'volvimos', 'volvió'], infinitive: 'volver' },
    like: { present: ['gusta', 'gusta', 'gusta', 'gusta'], past: ['gustó', 'gustó', 'gustó', 'gustó'], infinitive: 'gustar' },
    wait_for: { present: ['espero', 'espera', 'esperamos', 'espera'], past: ['esperé', 'esperó', 'esperamos', 'esperó'], infinitive: 'esperar' },
};
const MODALS = {
    can: { present: ['puedo', 'puede', 'podemos', 'puede'], past: ['pude', 'pudo', 'pudimos', 'pudo'], infinitive: '' },
    want: { present: ['quiero', 'quiere', 'queremos', 'quiere'], past: ['quise', 'quiso', 'quisimos', 'quiso'], infinitive: '' },
    must: { present: ['tengo que', 'tiene que', 'tenemos que', 'tiene que'], past: ['tuve que', 'tuvo que', 'tuvimos que', 'tuvo que'], infinitive: '' },
};
const FUTURE = ['voy a', 'va a', 'vamos a', 'va a'];
const TIMES = {
    now: 'ahora', today: 'hoy', yesterday: 'ayer', last_week: 'la semana pasada',
    tomorrow: 'mañana', next_week: 'la próxima semana', soon: 'pronto',
    this_week: 'esta semana', last_month: 'el mes pasado', next_month: 'el mes que viene', tonight: 'esta noche',
};
const LANGUAGES = { german: 'alemán', french: 'francés', spanish: 'español', english: 'inglés' };
const STATES = { sick: 'enfermo', tired: 'cansado', busy: 'ocupado', ready: 'listo', late: 'tarde' };
const DESTINATIONS = {
    home: 'a casa', station: 'a la estación', hotel: 'al hotel', office: 'a la oficina',
    hospital: 'al hospital', restaurant: 'al restaurante', supermarket: 'al supermercado',
    pharmacy: 'a la farmacia', airport: 'al aeropuerto',
    bank: 'al banco', school: 'a la escuela', park: 'al parque', library: 'a la biblioteca', post_office: 'a correos', city_center: 'al centro', cafe: 'a la cafetería', bus_stop: 'a la parada de autobús',
};
const RESIDENCES = { here: 'aquí', berlin: 'en Berlín', paris: 'en París', madrid: 'en Madrid' };
const STAYING = { home: 'en casa', hotel: 'en el hotel', hospital: 'en el hospital', office: 'en la oficina',
    apartment: 'en el piso',
};
const LOCATIONS = {
    station: 'la estación', hotel: 'el hotel', office: 'la oficina', hospital: 'el hospital',
    restaurant: 'el restaurante', supermarket: 'el supermercado', pharmacy: 'la farmacia',
    airport: 'el aeropuerto',
    bank: 'el banco', school: 'la escuela', park: 'el parque', library: 'la biblioteca', post_office: 'la oficina de correos', city_center: 'el centro', cafe: 'la cafetería', bus_stop: 'la parada de autobús',
};
const FREQUENCIES = {
    every_day: 'todos los días', every_week: 'cada semana',
    often: 'a menudo', sometimes: 'a veces',
};
const DEFINITES = {
    coffee: 'el café', bread: 'el pan', music: 'la música', food: 'la comida',
};
const GUSTAR_PRONOUNS = {
    speaker: 'me', addressee: 'le', we: 'nos', other: 'le',
};
const SUBJECTS = {
    speaker: '', addressee: 'usted', we: 'nosotros', other: 'él',
};
const PRONOUNS = {
    speaker: 'me', addressee: 'le', we: 'nos', other: 'lo',
};
function infinitiveWithObject(action) {
    if (action.predicate === 'stay') {
        const suffix = {
            speaker: 'me', addressee: 'se', we: 'nos', other: 'se',
        };
        return `quedar${suffix[action.agent]}`;
    }
    const inf = action.predicate === 'meet' && action.argument === 'doctor'
        ? 'ver'
        : VERBS[action.predicate].infinitive;
    return action.predicate === 'help' || action.predicate === 'call'
        ? `${inf}${PRONOUNS[action.argument]}`
        : inf;
}
function complement(action, negative) {
    const { predicate, argument, quantity, agent } = action;
    switch (predicate) {
        case 'need':
        case 'have':
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
            // Eating already implies food in this minimal predicate frame.
            if (predicate === 'eat' && argument === 'food')
                return '';
            if (predicate === 'use' && argument === 'internet')
                return 'internet';
            if (predicate === 'would_like' && argument === 'bill' && quantity === 1)
                return 'la cuenta';
            if (predicate === 'look_for' && argument === 'job' && quantity === 1)
                return 'trabajo';
            return noun(argument, quantity, negative);
        case 'understand':
        case 'repeat':
            return argument === 'this' ? 'esto' : noun(argument, quantity, negative);
        case 'help':
        case 'call': return '';
        case 'go': return DESTINATIONS[argument];
        case 'stay': return STAYING[argument];
        case 'live': return RESIDENCES[argument];
        case 'be': return agent === 'we' ? STATES[argument].replace(/o$/u, 'os') : STATES[argument];
        case 'speak':
        case 'study': return LANGUAGES[argument];
        case 'pay': return argument === 'card' ? 'con tarjeta' : 'en efectivo';
        case 'meet': return argument === 'doctor'
            ? `a ${noun(argument, quantity, false)}`
            : `con ${noun(argument, quantity, false)}`;
        case 'wait_for': return ['friend', 'doctor'].includes(argument)
            ? `a ${noun(argument, quantity, false)}`
            : noun(argument, quantity, false);
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
    const { event: action, modality, tense, negative } = value;
    const doctorVisit = action.predicate === 'meet' && action.argument === 'doctor';
    const meetingVerb = doctorVisit
        ? { present: ['veo', 've', 'vemos', 've'], past: ['vi', 'vio', 'vimos', 'vio'], infinitive: 'ver' }
        : VERBS[action.predicate];
    const person = action.agent;
    const pronoun = action.predicate === 'help' || action.predicate === 'call'
        ? PRONOUNS[action.argument]
        : '';
    const time = timeWord(value.time ?? (tense === 'future' ? 'soon' : null), TIMES);
    const frequency = value.frequency ? FREQUENCIES[value.frequency] : '';
    const object = complement(action, negative && ['need', 'have', 'buy', 'find'].includes(action.predicate));
    const subject = SUBJECTS[person];
    let predicateText;
    if (action.predicate === 'like' && !modality) {
        const statement = words(negative ? 'no' : '', GUSTAR_PRONOUNS[person], 'gusta', complement(action, false), time);
        const result = finish(statement, value.question, true).replace(/[.!?]$/u, '');
        return `${result}${value.polite ? ', por favor' : ''}${value.question ? '?' : '.'}`;
    }
    // Spanish communicates “running late” with llegar tarde, not estar
    // retrasado. This is a construction choice, not a saved translated phrase.
    if (action.predicate === 'be' && action.argument === 'late' && !modality) {
        const arrival = tense === 'future'
            ? words(form(FUTURE, person), 'llegar')
            : form(tense === 'past' ? VERBS.arrive.past : VERBS.arrive.present, person);
        const statement = words(subject, negative ? 'no' : '', arrival, 'tarde', time);
        return `${finish(statement, value.question, true).replace(/[.!?]$/u, '')}${value.polite ? ', por favor' : ''}${value.question ? '?' : '.'}`;
    }
    if (modality) {
        const verb = MODALS[modality];
        const finite = form(tense === 'past' ? verb.past : verb.present, person);
        predicateText = words(finite, infinitiveWithObject(action), object);
    }
    else if (tense === 'future') {
        // A polite request for a future time keeps 'quisiera' with a time word.
        // 'Voy a querer...' describes a future desire instead of a simple request.
        predicateText = action.predicate === 'would_like'
            ? words(form(meetingVerb.present, person), object)
            : words(form(FUTURE, person), infinitiveWithObject(action), object);
    }
    else {
        const finite = form(tense === 'past' ? meetingVerb.past : meetingVerb.present, person);
        const clitic = pronoun ? `${pronoun} ` : '';
        predicateText = words(clitic.trim(), finite, object);
    }
    const result = words(subject, negative ? 'no' : '', predicateText, time, frequency);
    return `${finish(result, value.question, true).replace(/[.!?]$/u, '')}${value.polite ? ', por favor' : ''}${value.question ? '?' : '.'}`;
}
const QUALITIES = {
    good: ['bueno', 'buena'], bad: ['malo', 'mala'],
    big: ['grande', 'grande'], small: ['pequeño', 'pequeña'],
    expensive: ['caro', 'cara'], cheap: ['barato', 'barata'],
    clean: ['limpio', 'limpia'], open: ['abierto', 'abierta'],
    closed: ['cerrado', 'cerrada'], available: ['disponible', 'disponible'],
    interesting: ['interesante', 'interesante'],
    important: ['importante', 'importante'], ready: ['listo', 'lista'],
};
const PRESENCE_PLACES = {
    here: 'aquí', station: 'en la estación', hotel: 'en el hotel',
    airport: 'en el aeropuerto', city_center: 'en el centro',
};
const TEMPORARY_QUALITIES = new Set(['clean', 'open', 'closed', 'available', 'ready']);
function definiteNoun(id) {
    const entry = NOUNS[id];
    if (!entry)
        throw new TypeError(`Missing Spanish noun: ${id}`);
    return words(entry.gender === 'm' ? 'el' : 'la', entry.singular);
}
function realizeDescription(value) {
    if (value.thing === 'weather') {
        const phrase = value.quality === 'good' ? 'buen tiempo' : 'mal tiempo';
        const verb = value.tense === 'past' ? 'hacía' : 'hace';
        const statement = words(value.negative ? 'no' : '', verb, phrase);
        return finish(statement, value.question, true);
    }
    const entry = NOUNS[value.thing];
    if (!entry)
        throw new TypeError(`Missing Spanish description noun: ${value.thing}`);
    const temp = TEMPORARY_QUALITIES.has(value.quality);
    const copula = temp
        ? value.tense === 'past' ? 'estaba' : 'está'
        : value.tense === 'past' ? 'era' : 'es';
    const quality = QUALITIES[value.quality][entry.gender === 'f' ? 1 : 0];
    return finish(words(definiteNoun(value.thing), value.negative ? 'no' : '', copula, quality), value.question, true);
}
function realizePresence(value) {
    const entry = NOUNS[value.thing];
    if (!entry)
        throw new TypeError(`Missing Spanish presence noun: ${value.thing}`);
    const item = value.negative ? entry.singular : noun(value.thing, 1, false);
    const location = value.place === null ? '' : PRESENCE_PLACES[value.place];
    return finish(words(value.negative ? 'no' : '', 'hay', item, location), value.question, true);
}
function realize(expression) {
    switch (expression.kind) {
        case 'describe': return realizeDescription(expression);
        case 'presence': return realizePresence(expression);
        case 'ask_object': {
            const predicate = VERBS[expression.predicate];
            return finish(words('qué', form(predicate.present, expression.agent), SUBJECTS[expression.agent]), true, true);
        }
        case 'route': return `¿Cómo llego ${DESTINATIONS[expression.place]}?`;
        case 'sequence': return expression.steps.map(realizeClause).join(' ');
        case 'where': return `¿Dónde está ${LOCATIONS[expression.place]}?`;
        case 'price': return `¿Cuánto cuesta ${noun(expression.thing, 1, false)}?`;
        case 'clause': return realizeClause(expression);
        case 'ask_when': {
            const statement = bare(realizeClause(expression.value)).replace(/^./u, (c) => c.toLocaleLowerCase());
            if (statement.startsWith('usted ')) {
                const remaining = statement.slice('usted '.length).split(' ');
                const verb = remaining.shift() ?? '';
                return `¿Cuándo ${words(verb, 'usted', ...remaining)}?`;
            }
            return `¿Cuándo ${statement}?`;
        }
        case 'link': {
            const linker = { and: 'y', but: 'pero', because: 'porque' }[expression.connection];
            const second = bare(realizeClause(expression.second)).replace(/^./u, (c) => c.toLocaleLowerCase());
            return `${bare(realizeClause(expression.first))}, ${linker} ${second}.`;
        }
    }
}
export const spanish = {
    profile: {
        code: 'es', name: 'Spanish', variety: 'Standard Spanish · formal usted · minimal production grammar',
        features: [
            'The verb identifies the speaker; formal usted can be used explicitly for clarity.',
            'Use pretérito indefinido for completed past events; simple ongoing states use imperfecto.',
            'Use ir a + infinitive to discuss near-future plans.',
            'Put no before the conjugated verb to negate a statement.',
            'A small set of irregular past forms is worth learning as complete verb paradigms.',
        ],
    },
    realize,
};
