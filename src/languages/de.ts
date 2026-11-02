import type { Clause, Description, Event, Expression, LanguageAdapter, Participant, Presence, Quantity, Time } from '../core/model.js';
import type { PredicateId, SemanticArgument } from '../core/vocabulary.js';
import { bare, finish, form, timeWord, words, type Forms } from './shared.js';

type Gender = 'm' | 'f' | 'n';
type Case = 'nom' | 'acc';

interface Noun {
  readonly singular: string;
  readonly plural: string;
  readonly gender: Gender;
  readonly countable: boolean;
  readonly accusative?: string;
}

/** Noun facts, not sentence translations. Inflection is handled separately. */
const NOUNS: Readonly<Record<string, Noun>> = {
  help: { singular: 'Hilfe', plural: 'Hilfen', gender: 'f', countable: false },
  ticket: { singular: 'Ticket', plural: 'Tickets', gender: 'n', countable: true },
  coffee: { singular: 'Kaffee', plural: 'Kaffees', gender: 'm', countable: true },
  water: { singular: 'Wasser', plural: 'Wasser', gender: 'n', countable: false },
  time: { singular: 'Zeit', plural: 'Zeiten', gender: 'f', countable: false },
  appointment: { singular: 'Termin', plural: 'Termine', gender: 'm', countable: true },
  question: { singular: 'Frage', plural: 'Fragen', gender: 'f', countable: true },
  problem: { singular: 'Problem', plural: 'Probleme', gender: 'n', countable: true },
  message: { singular: 'Nachricht', plural: 'Nachrichten', gender: 'f', countable: true },
  food: { singular: 'Essen', plural: 'Essen', gender: 'n', countable: false },
  money: { singular: 'Geld', plural: 'Gelder', gender: 'n', countable: false },
  phone: { singular: 'Handy', plural: 'Handys', gender: 'n', countable: true },
  book: { singular: 'Buch', plural: 'Bücher', gender: 'n', countable: true },
  medicine: { singular: 'Medizin', plural: 'Medizinen', gender: 'f', countable: false },
  train: { singular: 'Zug', plural: 'Züge', gender: 'm', countable: true },
  bus: { singular: 'Bus', plural: 'Busse', gender: 'm', countable: true },
  room: { singular: 'Zimmer', plural: 'Zimmer', gender: 'n', countable: true },
  address: { singular: 'Adresse', plural: 'Adressen', gender: 'f', countable: true },
  information: { singular: 'Informationen', plural: 'Informationen', gender: 'f', countable: false },
  card: { singular:'Karte', plural:'Karten', gender:'f', countable:true },
  // Reusable noun lexemes. Articles and inflection are computed at runtime.
  bag: { singular: 'Tasche', plural: 'Taschen', gender: 'f', countable: true },
  keys: { singular: 'Schlüssel', plural: 'Schlüssel', gender: 'm', countable: false },
  passport: { singular: 'Reisepass', plural: 'Reisepässe', gender: 'm', countable: true },
  wallet: { singular: 'Geldbörse', plural: 'Geldbörsen', gender: 'f', countable: true },
  bread: { singular: 'Brot', plural: 'Brote', gender: 'n', countable: false },
  milk: { singular: 'Milch', plural: 'Milch', gender: 'f', countable: false },
  music: { singular: 'Musik', plural: 'Musik', gender: 'f', countable: false },
  bill: { singular: 'Rechnung', plural: 'Rechnungen', gender: 'f', countable: true },
  receipt: { singular: 'Quittung', plural: 'Quittungen', gender: 'f', countable: true },
  job: { singular: 'Job', plural: 'Jobs', gender: 'm', countable: true },
  meeting: { singular: 'Besprechung', plural: 'Besprechungen', gender: 'f', countable: true },
  email: { singular: 'E-Mail', plural: 'E-Mails', gender: 'f', countable: true },
  computer: { singular: 'Computer', plural: 'Computer', gender: 'm', countable: true },
  internet: { singular: 'Internet', plural: 'Internet', gender: 'n', countable: false },
  document: { singular: 'Dokument', plural: 'Dokumente', gender: 'n', countable: true },
  form: { singular: 'Formular', plural: 'Formulare', gender: 'n', countable: true },
  family: { singular: 'Familie', plural: 'Familien', gender: 'f', countable: true },
  friend: { singular: 'Freund', plural: 'Freunde', gender: 'm', countable: true },
  apartment: { singular: 'Wohnung', plural: 'Wohnungen', gender: 'f', countable: true },
  key: { singular: 'Schlüssel', plural: 'Schlüssel', gender: 'm', countable: true },
  door: { singular: 'Tür', plural: 'Türen', gender: 'f', countable: true },
  window: { singular: 'Fenster', plural: 'Fenster', gender: 'n', countable: true },
  doctor: { singular: 'Arzt', plural: 'Ärzte', gender: 'm', countable: true },
  shop: { singular: 'Geschäft', plural: 'Geschäfte', gender: 'n', countable: true },
  weather: { singular: 'Wetter', plural: 'Wetter', gender: 'n', countable: false },
  table: { singular: 'Tisch', plural: 'Tische', gender: 'm', countable: true },
  reservation: { singular: 'Reservierung', plural: 'Reservierungen', gender: 'f', countable: true },
  trip: { singular: 'Reise', plural: 'Reisen', gender: 'f', countable: true },
  colleague: { singular: 'Kollege', accusative: 'Kollegen', plural: 'Kollegen', gender: 'm', countable: true },
  pharmacy: { singular: 'Apotheke', plural: 'Apotheken', gender: 'f', countable: true },
  bank: { singular: 'Bank', plural: 'Banken', gender: 'f', countable: true },
  hotel: { singular: 'Hotel', plural: 'Hotels', gender: 'n', countable: true },
  restaurant: { singular: 'Restaurant', plural: 'Restaurants', gender: 'n', countable: true },
  bus_stop: { singular: 'Bushaltestelle', plural: 'Bushaltestellen', gender: 'f', countable: true },
  cafe: { singular: 'Café', plural: 'Cafés', gender: 'n', countable: true },
  library: { singular: 'Bibliothek', plural: 'Bibliotheken', gender: 'f', countable: true },
  park: { singular: 'Park', plural: 'Parks', gender: 'm', countable: true },
};

const INDEFINITE: Readonly<Record<Case, Record<Gender, string>>> = {
  nom: { m: 'ein', f: 'eine', n: 'ein' },
  acc: { m: 'einen', f: 'eine', n: 'ein' },
};
const NEGATIVE: Readonly<Record<Case, Record<Gender, string>>> = {
  nom: { m: 'kein', f: 'keine', n: 'kein' },
  acc: { m: 'keinen', f: 'keine', n: 'kein' },
};

function noun(id: SemanticArgument, grammaticalCase: Case, quantity: Quantity, negative: boolean): string {
  const entry = NOUNS[id];
  if (!entry) throw new TypeError(`No German noun: ${id}`);
  if (quantity === 2) return words(negative ? 'nicht' : '', 'zwei', entry.plural);
  if (negative) return words(NEGATIVE[grammaticalCase][entry.gender], grammaticalCase === 'acc' ? entry.accusative ?? entry.singular : entry.singular);
  return entry.countable
    ? words(INDEFINITE[grammaticalCase][entry.gender], grammaticalCase === 'acc' ? entry.accusative ?? entry.singular : entry.singular)
    : entry.singular;
}

interface Verb {
  readonly present: Forms;
  readonly infinitive: string;
  readonly participle: string;
  readonly auxiliary: 'haben' | 'sein';
  readonly particle?: string;
  readonly past?: Forms;
}

const VERBS: Readonly<Record<PredicateId, Verb>> = {
  need: { present: ['brauche','brauchen','brauchen','braucht'], infinitive:'brauchen', participle:'gebraucht', auxiliary:'haben', past: ['brauchte','brauchten','brauchten','brauchte'] },
  have: { present: ['habe','haben','haben','hat'], infinitive:'haben', participle:'gehabt', auxiliary:'haben', past: ['hatte','hatten','hatten','hatte'] },
  would_like: { present: ['möchte','möchten','möchten','möchte'], infinitive:'möchten', participle:'gewollt', auxiliary:'haben', past: ['wollte','wollten','wollten','wollte'] },
  understand: { present: ['verstehe','verstehen','verstehen','versteht'], infinitive:'verstehen', participle:'verstanden', auxiliary:'haben' },
  help: { present: ['helfe','helfen','helfen','hilft'], infinitive:'helfen', participle:'geholfen', auxiliary:'haben' },
  go: { present: ['gehe','gehen','gehen','geht'], infinitive:'gehen', participle:'gegangen', auxiliary:'sein' },
  come: { present: ['komme','kommen','kommen','kommt'], infinitive:'kommen', participle:'gekommen', auxiliary:'sein' },
  buy: { present: ['kaufe','kaufen','kaufen','kauft'], infinitive:'kaufen', participle:'gekauft', auxiliary:'haben' },
  speak: { present: ['spreche','sprechen','sprechen','spricht'], infinitive:'sprechen', participle:'gesprochen', auxiliary:'haben' },
  repeat: { present: ['wiederhole','wiederholen','wiederholen','wiederholt'], infinitive:'wiederholen', participle:'wiederholt', auxiliary:'haben' },
  pay: { present: ['bezahle','bezahlen','bezahlen','bezahlt'], infinitive:'bezahlen', participle:'bezahlt', auxiliary:'haben' },
  drink: { present: ['trinke','trinken','trinken','trinkt'], infinitive:'trinken', participle:'getrunken', auxiliary:'haben' },
  eat: { present: ['esse','essen','essen','isst'], infinitive:'essen', participle:'gegessen', auxiliary:'haben' },
  take: { present: ['nehme','nehmen','nehmen','nimmt'], infinitive:'nehmen', participle:'genommen', auxiliary:'haben' },
  work: { present: ['arbeite','arbeiten','arbeiten','arbeitet'], infinitive:'arbeiten', participle:'gearbeitet', auxiliary:'haben' },
  live: { present: ['wohne','wohnen','wohnen','wohnt'], infinitive:'wohnen', participle:'gewohnt', auxiliary:'haben' },
  be: { present: ['bin','sind','sind','ist'], infinitive:'sein', participle:'gewesen', auxiliary:'sein', past: ['war','waren','waren','war'] },
  wait: { present: ['warte','warten','warten','wartet'], infinitive:'warten', participle:'gewartet', auxiliary:'haben' },
  call: { present: ['rufe','rufen','rufen','ruft'], infinitive:'anrufen', participle:'angerufen', auxiliary:'haben', particle:'an' },
  find: { present: ['finde','finden','finden','findet'], infinitive:'finden', participle:'gefunden', auxiliary:'haben' },
  send: { present: ['sende','senden','senden','sendet'], infinitive:'senden', participle:'gesendet', auxiliary:'haben' },
  stay: { present: ['bleibe','bleiben','bleiben','bleibt'], infinitive:'bleiben', participle:'geblieben', auxiliary:'sein' },
  study: { present: ['lerne','lernen','lernen','lernt'], infinitive:'lernen', participle:'gelernt', auxiliary:'haben' },
  arrive: { present: ['komme','kommen','kommen','kommt'], infinitive:'ankommen', participle:'angekommen', auxiliary:'sein', particle:'an' },
  // Conjugation metadata is independent from lesson authoring.
  look_for: { present: ['suche', 'suchen', 'suchen', 'sucht'], infinitive: 'suchen', participle: 'gesucht', auxiliary: 'haben' },
  lose: { present: ['verliere', 'verlieren', 'verlieren', 'verliert'], infinitive: 'verlieren', participle: 'verloren', auxiliary: 'haben' },
  read: { present: ['lese', 'lesen', 'lesen', 'liest'], infinitive: 'lesen', participle: 'gelesen', auxiliary: 'haben' },
  write: { present: ['schreibe', 'schreiben', 'schreiben', 'schreibt'], infinitive: 'schreiben', participle: 'geschrieben', auxiliary: 'haben' },
  use: { present: ['benutze', 'benutzen', 'benutzen', 'benutzt'], infinitive: 'benutzen', participle: 'benutzt', auxiliary: 'haben' },
  open: { present: ['öffne', 'öffnen', 'öffnen', 'öffnet'], infinitive: 'öffnen', participle: 'geöffnet', auxiliary: 'haben' },
  close: { present: ['schließe', 'schließen', 'schließen', 'schließt'], infinitive: 'schließen', participle: 'geschlossen', auxiliary: 'haben' },
  fill_out: { present: ['fülle', 'füllen', 'füllen', 'füllt'], infinitive: 'ausfüllen', participle: 'ausgefüllt', auxiliary: 'haben', particle: 'aus' },
  sign: { present: ['unterschreibe', 'unterschreiben', 'unterschreiben', 'unterschreibt'], infinitive: 'unterschreiben', participle: 'unterschrieben', auxiliary: 'haben' },
  reserve: { present: ['reserviere', 'reservieren', 'reservieren', 'reserviert'], infinitive: 'reservieren', participle: 'reserviert', auxiliary: 'haben' },
  cancel: { present: ['sage', 'sagen', 'sagen', 'sagt'], infinitive: 'absagen', participle: 'abgesagt', auxiliary: 'haben', particle: 'ab' },
  meet: { present: ['treffe', 'treffen', 'treffen', 'trifft'], infinitive: 'treffen', participle: 'getroffen', auxiliary: 'haben' },
  cook: { present: ['koche', 'kochen', 'kochen', 'kocht'], infinitive: 'kochen', participle: 'gekocht', auxiliary: 'haben' },
  sleep: { present: ['schlafe', 'schlafen', 'schlafen', 'schläft'], infinitive: 'schlafen', participle: 'geschlafen', auxiliary: 'haben' },
  leave: { present: ['gehe', 'gehen', 'gehen', 'geht'], infinitive: 'weggehen', participle: 'weggegangen', auxiliary: 'sein', particle: 'weg' },
  return: { present: ['komme', 'kommen', 'kommen', 'kommt'], infinitive: 'zurückkommen', participle: 'zurückgekommen', auxiliary: 'sein', particle: 'zurück' },
  like: { present: ['mag', 'mögen', 'mögen', 'mag'], infinitive: 'mögen', participle: 'gemocht', auxiliary: 'haben', past: ['mochte', 'mochten', 'mochten', 'mochte'] },
  wait_for: { present: ['warte', 'warten', 'warten', 'wartet'], infinitive: 'warten', participle: 'gewartet', auxiliary: 'haben' },
};

const MODALS: Readonly<Record<'can' | 'want' | 'must', { present: Forms; past: Forms }>> = {
  can: { present: ['kann','können','können','kann'], past: ['konnte','konnten','konnten','konnte'] },
  want: { present: ['will','wollen','wollen','will'], past: ['wollte','wollten','wollten','wollte'] },
  must: { present: ['muss','müssen','müssen','muss'], past: ['musste','mussten','mussten','musste'] },
};

const TIMES: Readonly<Record<Time, string>> = {
  now:'jetzt', today:'heute', yesterday:'gestern', last_week:'letzte Woche',
  tomorrow:'morgen', next_week:'nächste Woche', soon:'bald',
  this_week: 'diese Woche', last_month: 'letzten Monat', next_month: 'nächsten Monat', tonight: 'heute Abend',
};
const FREQUENCIES = {
  every_day: 'jeden Tag', every_week: 'jede Woche',
  often: 'oft', sometimes: 'manchmal',
} as const;

const LANGUAGES = { german:'Deutsch', french:'Französisch', spanish:'Spanisch', english:'Englisch' } as const;
const STATES = { sick:'krank', tired:'müde', busy:'beschäftigt', ready:'bereit', late:'spät dran' } as const;
const DESTINATIONS = {
  home:'nach Hause', station:'zum Bahnhof', hotel:'zum Hotel', office:'ins Büro',
  hospital:'ins Krankenhaus', restaurant:'ins Restaurant', supermarket:'zum Supermarkt',
  pharmacy:'zur Apotheke', airport:'zum Flughafen',
  bank:'zur Bank', school:'zur Schule', park:'in den Park', library:'zur Bibliothek', post_office:'zur Post', city_center:'ins Stadtzentrum', cafe:'ins Café', bus_stop:'zur Bushaltestelle',
} as const;
const RESIDENCES = { here:'hier', berlin:'in Berlin', paris:'in Paris', madrid:'in Madrid' } as const;
const STAYING = { home:'zu Hause', hotel:'im Hotel', hospital:'im Krankenhaus', office:'im Büro',
  apartment:'in der Wohnung',
} as const;
const LOCATIONS = {
  station:'der Bahnhof', hotel:'das Hotel', office:'das Büro',
  hospital:'das Krankenhaus', restaurant:'das Restaurant', supermarket:'der Supermarkt',
  pharmacy:'die Apotheke', airport:'der Flughafen',
  bank:'die Bank', school:'die Schule', park:'der Park', library:'die Bibliothek', post_office:'die Post', city_center:'das Stadtzentrum', cafe:'das Café', bus_stop:'die Bushaltestelle',
} as const;

const SUBJECTS: Readonly<Record<Participant,string>> = {
  speaker:'ich', addressee:'Sie', we:'wir', other:'er',
};
const OBJECTS: Readonly<Record<'speaker' | 'addressee' | 'we' | 'other', string>> = {
  speaker:'mich', addressee:'Sie', we:'uns', other:'ihn',
};
const DATIVES: Readonly<typeof OBJECTS> = {
  speaker:'mir', addressee:'Ihnen', we:'uns', other:'ihm',
};

function complement(action: Event, negativeNoun: boolean): string {
  const { argument, predicate, quantity } = action;
  switch (predicate) {
    case 'need': case 'have': case 'would_like': case 'buy':
    case 'drink': case 'eat': case 'take': case 'find': case 'send':
    case 'look_for': case 'lose': case 'read': case 'write': case 'use':
    case 'open': case 'close': case 'fill_out': case 'sign':
    case 'reserve': case 'cancel': case 'meet': case 'like':
      if (predicate === 'use' && argument === 'internet') return 'das Internet';
      if (predicate === 'would_like' && argument === 'bill') return 'die Rechnung';
      if (predicate === 'like' && argument === 'coffee') return negativeNoun ? 'keinen Kaffee' : 'Kaffee';
      return noun(argument, 'acc', quantity, negativeNoun);
    case 'understand': case 'repeat':
      return argument === 'this' ? 'das' : noun(argument, 'acc', quantity, negativeNoun);
    case 'help': return DATIVES[argument];
    case 'call': return OBJECTS[argument];
    case 'go': return DESTINATIONS[argument];
    case 'stay': return STAYING[argument];
    case 'live': return RESIDENCES[argument];
    case 'be': return STATES[argument];
    case 'speak': case 'study': return words(negativeNoun ? 'kein' : '', LANGUAGES[argument]);
    case 'pay': return argument === 'card' ? 'mit Karte' : 'bar';
    case 'wait_for': return `auf ${noun(argument, 'acc', quantity, false)}`;
    case 'come': case 'work': case 'wait': case 'arrive':
    case 'cook': case 'sleep': case 'leave': case 'return': return '';
  }
}

function realizeClause(value: Clause): string {
  const { event: action, negative, modality, tense, question, polite } = value;
  const person = action.agent;
  const verb: Verb = action.predicate === 'meet' && action.argument === 'doctor'
    ? { present: ['sehe', 'sehen', 'sehen', 'sieht'], infinitive: 'sehen', participle: 'gesehen', auxiliary: 'haben' }
    : VERBS[action.predicate];
  const subject = SUBJECTS[person];
  const nominalNegation = ['need','have','would_like','buy','drink','eat','take','find','send','speak','study',
    'look_for','lose','read','write','use','open','close','fill_out','sign',
    'reserve','cancel','meet','like'].includes(action.predicate);
  const complementText = complement(action, negative && nominalNegation);
  const negativeWord = negative && !nominalNegation ? 'nicht' : '';
  const temporal = timeWord(value.time ?? (tense === 'future' ? 'soon' : null), TIMES);
  const frequency = value.frequency ? FREQUENCIES[value.frequency] : '';
  const pronounLike = action.predicate === 'help' || action.predicate === 'call' || action.predicate === 'understand';
  const middle = pronounLike
    ? words(complementText, temporal, frequency, negativeWord)
    : words(temporal, frequency, negativeWord, complementText);

  let finite: string;
  let tail: string;
  if (modality) {
    finite = form(MODALS[modality][tense === 'past' ? 'past' : 'present'], person);
    tail = words(middle, polite ? 'bitte' : '', verb.infinitive);
  } else if (tense === 'past' && !verb.past) {
    const auxiliaries: Forms = verb.auxiliary === 'sein'
      ? ['bin','sind','sind','ist']
      : ['habe','haben','haben','hat'];
    finite = form(auxiliaries, person);
    tail = words(middle, polite ? 'bitte' : '', verb.participle);
  } else {
    finite = form(tense === 'past' ? (verb.past ?? verb.present) : verb.present, person);
    tail = words(middle, polite ? 'bitte' : '', verb.particle ?? '');
  }
  const result = question ? words(finite, subject, tail) : words(subject, finite, tail);
  return finish(result, question);
}


const QUALITIES = {
  good: 'gut', bad: 'schlecht', big: 'groß', small: 'klein',
  expensive: 'teuer', cheap: 'günstig', clean: 'sauber',
  open: 'offen', closed: 'geschlossen', available: 'verfügbar',
  interesting: 'interessant', important: 'wichtig', ready: 'fertig',
} as const;
const DEFINITES = { m: 'der', f: 'die', n: 'das' } as const;
const PRESENCE_PLACES = {
  here: 'hier', station: 'am Bahnhof', hotel: 'im Hotel',
  airport: 'am Flughafen', city_center: 'im Stadtzentrum',
} as const;

function definiteNoun(id: string): string {
  const entry = NOUNS[id];
  if (!entry) throw new TypeError(`Missing German noun: ${id}`);
  return words(DEFINITES[entry.gender], entry.singular);
}

function realizeDescription(value: Description): string {
  const copula = value.tense === 'past' ? 'war' : 'ist';
  const text = words(definiteNoun(value.thing), copula,
    value.negative ? 'nicht' : '', QUALITIES[value.quality]);
  if (value.question) {
    return finish(words(copula, definiteNoun(value.thing),
      value.negative ? 'nicht' : '', QUALITIES[value.quality]), true);
  }
  return finish(text, false);
}

function realizePresence(value: Presence): string {
  // 'geben' in the impersonal existence construction governs accusative.
  const item = noun(value.thing, 'acc', 1, value.negative);
  const location = value.place === null ? '' : PRESENCE_PLACES[value.place];
  if (value.question) return finish(words('gibt es', location, item), true);
  return finish(words(location || 'es', location ? 'gibt es' : 'gibt', item), false);
}

function realize(expression: Expression): string {
  switch (expression.kind) {
    case 'describe': return realizeDescription(expression);
    case 'presence': return realizePresence(expression);
    case 'ask_object': {
      const verb = VERBS[expression.predicate];
      const subject = SUBJECTS[expression.agent];
      return finish(words('was', form(verb.present, expression.agent), subject), true);
    }
    case 'route': {
      const place = DESTINATIONS[expression.place];
      return finish(words('wie komme ich', place), true);
    }
    case 'sequence': return expression.steps.map(realizeClause).join(' ');
    case 'where': return `Wo ist ${LOCATIONS[expression.place]}?`;
    case 'price': return `Wie viel kostet ${noun(expression.thing,'nom',1,false)}?`;
    case 'clause': return realizeClause(expression);
    case 'ask_when': {
      const interrogative = realizeClause({ ...expression.value, question: true });
      return `Wann ${bare(interrogative).replace(/^./u, (c) => c.toLocaleLowerCase())}?`;
    }
    case 'link': {
      const linker = { and:'und', but:'aber', because:'denn' }[expression.connection];
      return `${bare(realizeClause(expression.first))}, ${linker} ${bare(realizeClause(expression.second)).replace(/^./u, (c) => c.toLocaleLowerCase())}.`;
    }
  }
}

export const german: LanguageAdapter = {
  profile: {
    code:'de', name:'German', variety:'Standard German · formal Sie · minimal production grammar',
    features: [
      'Statements: subject + finite verb + rest; yes/no questions begin with the finite verb.',
      'Completed past events: haben/sein + participle. Simple states often use war/hatte.',
      'Future plans: present tense + morgen/nächste Woche/bald; no future conjugation required.',
      'With können/wollen/müssen, the second verb stays in the infinitive at the end.',
      'For simple reasons use denn, which preserves ordinary main-clause word order.',
    ],
  },
  realize,
};
