/**
 * Language-neutral vocabulary and predicate frames.
 *
 * This file contains meaning identifiers, never translated sentences.
 * Each predicate declares the semantic argument slots it accepts. The
 * language implementations supply surface forms, case and word order.
 */
export const CONCEPTS = {
  help: 'help', ticket: 'ticket', coffee: 'coffee', water: 'water',
  time: 'time', appointment: 'appointment', question: 'question',
  problem: 'problem', message: 'message', food: 'food', money: 'money',
  phone: 'phone', book: 'book', medicine: 'medicine', train: 'train',
  bus: 'bus', room: 'room', address: 'address', information: 'information',
  this: 'this', card: 'card', cash: 'cash',
  home: 'home', station: 'station', hotel: 'hotel', office: 'office',
  hospital: 'hospital', restaurant: 'restaurant', supermarket: 'supermarket',
  pharmacy: 'pharmacy', airport: 'airport',
  here: 'here', berlin: 'Berlin', paris: 'Paris', madrid: 'Madrid',
  german: 'German', french: 'French', spanish: 'Spanish', english: 'English',
  sick: 'sick', tired: 'tired', busy: 'busy', ready: 'ready', late: 'late',
  // Everyday domains are reusable lexemes, never stored sentence translations.
  bag: 'bag', keys: 'keys', passport: 'passport', wallet: 'wallet',
  bread: 'bread', milk: 'milk', music: 'music', bill: 'bill',
  receipt: 'receipt', job: 'job', meeting: 'meeting', email: 'email',
  computer: 'computer', internet: 'internet', document: 'document',
  form: 'form', family: 'family', friend: 'friend', apartment: 'apartment',
  key: 'key', door: 'door', window: 'window', doctor: 'doctor',
  shop: 'shop', weather: 'weather', table: 'table', reservation: 'reservation',
  trip: 'trip', colleague: 'colleague',
  bank: 'bank', school: 'school', park: 'park', library: 'library',
  post_office: 'post office', city_center: 'city centre', cafe: 'café',
  bus_stop: 'bus stop',
  speaker: 'me', addressee: 'you', we: 'us', other: 'him', none: '(no object)',
} as const;

/** Countability is an invariant of the semantic concept in this mini profile. */
export const COUNTABLE_THINGS = [
  'ticket', 'coffee', 'appointment', 'question', 'problem', 'message',
  'phone', 'book', 'train', 'bus', 'room', 'bag', 'passport', 'wallet',
  'bill', 'receipt', 'job', 'meeting', 'email', 'computer', 'document',
  'form', 'friend', 'apartment', 'key', 'door', 'window', 'doctor',
  'table', 'reservation', 'trip', 'colleague',
] as const;

export const PREDICATES = {
  need: {
    description: 'Need something',
    argumentRole: 'thing',
    allowedArguments: ['help', 'ticket', 'coffee', 'water', 'time', 'appointment', 'medicine', 'information', 'money', 'doctor', 'document', 'job', 'passport', 'apartment', 'computer'],
    allowedModalities: [],
  },
  have: {
    description: 'Have something',
    argumentRole: 'thing',
    allowedArguments: ['time', 'ticket', 'appointment', 'question', 'problem', 'phone', 'money', 'information', 'book', 'bag', 'keys', 'passport', 'reservation', 'job', 'computer', 'email', 'apartment', 'meeting'],
    allowedModalities: [],
  },
  would_like: {
    description: 'Would like something',
    argumentRole: 'thing',
    allowedArguments: ['coffee', 'water', 'ticket', 'food', 'room', 'information', 'appointment', 'bread', 'milk', 'bill', 'receipt', 'job', 'apartment'],
    allowedModalities: [],
  },
  understand: {
    description: 'Understand something',
    argumentRole: 'thing',
    allowedArguments: ['this', 'question', 'information'],
    allowedModalities: ['can'],
  },
  help: {
    description: 'Help someone',
    argumentRole: 'person',
    allowedArguments: ['speaker', 'addressee', 'we', 'other'],
    allowedModalities: ['can', 'want', 'must'],
  },
  go: {
    description: 'Go somewhere',
    argumentRole: 'destination',
    allowedArguments: ['home', 'station', 'hotel', 'office', 'hospital', 'restaurant', 'supermarket', 'pharmacy', 'airport', 'bank', 'school', 'park', 'library', 'post_office', 'city_center', 'cafe', 'bus_stop'],
    allowedModalities: ['can', 'want', 'must'],
  },
  come: {
    description: 'Come', argumentRole: 'none', allowedArguments: ['none'],
    allowedModalities: ['can', 'want', 'must'],
  },
  buy: {
    description: 'Buy something', argumentRole: 'thing',
    allowedArguments: ['ticket', 'coffee', 'water', 'food', 'medicine', 'book', 'phone', 'bread', 'milk', 'computer', 'bag', 'key'],
    allowedModalities: ['can', 'want', 'must'],
  },
  speak: {
    description: 'Speak a language', argumentRole: 'language',
    allowedArguments: ['german', 'french', 'spanish', 'english'],
    allowedModalities: ['can', 'want', 'must'],
  },
  repeat: {
    description: 'Repeat something', argumentRole: 'thing',
    allowedArguments: ['this', 'question', 'information'],
    allowedModalities: ['can', 'want'],
  },
  pay: {
    description: 'Pay in a way', argumentRole: 'method',
    allowedArguments: ['card', 'cash'],
    allowedModalities: ['can', 'want', 'must'],
  },
  drink: {
    description: 'Drink something', argumentRole: 'thing',
    allowedArguments: ['coffee', 'water'],
    allowedModalities: ['can', 'want', 'must'],
  },
  eat: {
    description: 'Eat something', argumentRole: 'thing',
    allowedArguments: ['food'],
    allowedModalities: ['can', 'want', 'must'],
  },
  take: {
    description: 'Take something', argumentRole: 'thing',
    allowedArguments: ['train', 'bus', 'ticket', 'medicine', 'book', 'passport', 'keys', 'bag'],
    allowedModalities: ['can', 'want', 'must'],
  },
  work: {
    description: 'Work', argumentRole: 'none', allowedArguments: ['none'],
    allowedModalities: ['can', 'want', 'must'],
  },
  live: {
    description: 'Live in a place', argumentRole: 'residence',
    allowedArguments: ['here', 'berlin', 'paris', 'madrid'],
    allowedModalities: ['want'],
  },
  be: {
    description: 'Be in a state', argumentRole: 'quality',
    allowedArguments: ['sick', 'tired', 'busy', 'ready', 'late'],
    allowedModalities: [],
  },
  wait: {
    description: 'Wait', argumentRole: 'none', allowedArguments: ['none'],
    allowedModalities: ['can', 'want', 'must'],
  },
  call: {
    description: 'Call someone', argumentRole: 'person',
    allowedArguments: ['speaker', 'addressee', 'we', 'other'],
    allowedModalities: ['can', 'want', 'must'],
  },
  find: {
    description: 'Find something', argumentRole: 'thing',
    allowedArguments: ['ticket', 'phone', 'book', 'address', 'information', 'medicine', 'job', 'apartment', 'keys', 'passport', 'doctor', 'bank'],
    allowedModalities: ['can', 'want', 'must'],
  },
  send: {
    description: 'Send something', argumentRole: 'thing',
    allowedArguments: ['message', 'information', 'email', 'document'],
    allowedModalities: ['can', 'want', 'must'],
  },
  stay: {
    description: 'Stay at a place', argumentRole: 'destination',
    allowedArguments: ['home', 'hotel', 'hospital', 'office', 'apartment'],
    allowedModalities: ['can', 'want', 'must'],
  },
  study: {
    description: 'Learn a language', argumentRole: 'language',
    allowedArguments: ['german', 'french', 'spanish', 'english'],
    allowedModalities: ['can', 'want', 'must'],
  },
  arrive: {
    description: 'Arrive', argumentRole: 'none', allowedArguments: ['none'],
    allowedModalities: ['can', 'want', 'must'],
  },
  // Additional productive frames for work, housing, everyday services and social life.
  look_for: {
    description: 'Look for something', argumentRole: 'thing',
    allowedArguments: ['job','apartment','passport','keys','bag','document','phone','doctor'],
    allowedModalities: ['can','want','must'],
  },
  lose: {
    description: 'Lose something', argumentRole: 'thing',
    allowedArguments: ['keys','wallet','passport','phone','bag','ticket'],
    allowedModalities: ['can'],
  },
  read: {
    description: 'Read something', argumentRole: 'thing',
    allowedArguments: ['book','email','message','document'],
    allowedModalities: ['can','want','must'],
  },
  write: {
    description: 'Write something', argumentRole: 'thing',
    allowedArguments: ['email','message','document'],
    allowedModalities: ['can','want','must'],
  },
  use: {
    description: 'Use something', argumentRole: 'thing',
    allowedArguments: ['computer','phone','internet','card'],
    allowedModalities: ['can','want','must'],
  },
  open: {
    description: 'Open something', argumentRole: 'thing',
    allowedArguments: ['door','window'],
    allowedModalities: ['can','want','must'],
  },
  close: {
    description: 'Close something', argumentRole: 'thing',
    allowedArguments: ['door','window'],
    allowedModalities: ['can','want','must'],
  },
  fill_out: {
    description: 'Fill out a form', argumentRole: 'thing',
    allowedArguments: ['form'],
    allowedModalities: ['can','want','must'],
  },
  sign: {
    description: 'Sign something', argumentRole: 'thing',
    allowedArguments: ['document','form'],
    allowedModalities: ['can','want','must'],
  },
  reserve: {
    description: 'Reserve something', argumentRole: 'thing',
    allowedArguments: ['room','table'],
    allowedModalities: ['can','want','must'],
  },
  cancel: {
    description: 'Cancel something', argumentRole: 'thing',
    allowedArguments: ['appointment','meeting','reservation'],
    allowedModalities: ['can','want','must'],
  },
  meet: {
    description: 'Meet someone', argumentRole: 'thing',
    allowedArguments: ['friend','doctor','colleague'],
    allowedModalities: ['can','want','must'],
  },
  cook: {
    description: 'Cook', argumentRole: 'none',
    allowedArguments: ['none'],
    allowedModalities: ['can','want','must'],
  },
  sleep: {
    description: 'Sleep', argumentRole: 'none',
    allowedArguments: ['none'],
    allowedModalities: ['can','want','must'],
  },
  leave: {
    description: 'Leave', argumentRole: 'none',
    allowedArguments: ['none'],
    allowedModalities: ['can','want','must'],
  },
  return: {
    description: 'Come back', argumentRole: 'none',
    allowedArguments: ['none'],
    allowedModalities: ['can','want','must'],
  },
  like: {
    description: 'Like something', argumentRole: 'thing',
    allowedArguments: ['coffee','bread','music','food'],
    allowedModalities: [],
  },
  wait_for: {
    description: 'Wait for something', argumentRole: 'thing',
    allowedArguments: ['bus','train','doctor','friend'],
    allowedModalities: ['can','want','must'],
  },

} as const;

export type PredicateId = keyof typeof PREDICATES;
export type SemanticArgument = keyof typeof CONCEPTS;

/** Semantically meaningful adjective combinations, not arbitrary adjective swaps. */
export const DESCRIPTION_QUALITIES = {
  room: ['big', 'small', 'expensive', 'cheap', 'clean'],
  apartment: ['big', 'small', 'expensive', 'cheap', 'clean'],
  hotel: ['good', 'bad', 'expensive', 'cheap', 'open', 'closed'],
  restaurant: ['good', 'bad', 'expensive', 'cheap', 'open', 'closed'],
  shop: ['open', 'closed', 'expensive', 'cheap'],
  ticket: ['expensive', 'cheap', 'available'],
  book: ['good', 'bad', 'interesting'],
  document: ['important', 'ready'],
  weather: ['good', 'bad'],
  computer: ['good', 'bad', 'expensive', 'cheap'],
  office: ['big', 'small', 'open', 'closed'],
} as const;

export const LOCATABLE_PLACES = [
  'station', 'hotel', 'office', 'hospital', 'restaurant', 'supermarket',
  'pharmacy', 'airport', 'bank', 'school', 'park', 'library',
  'post_office', 'city_center', 'cafe', 'bus_stop',
] as const;

export const PRESENCE_THINGS = [
  'pharmacy', 'bank', 'hotel', 'doctor', 'room', 'apartment',
  'restaurant', 'shop', 'bus_stop', 'cafe', 'library', 'park',
] as const;

export const OBJECT_QUESTION_PREDICATES = [
  'need', 'have', 'would_like', 'buy', 'find', 'look_for',
] as const;

export const OPERATORS = [
  { id: 'EVENT', signature: 'Predicate × Person × Argument → Event', description: 'Describe an action or state.' },
  { id: 'PAST', signature: 'Event → Past', description: 'Report completed events.' },
  { id: 'FUTURE', signature: 'Event → Future', description: 'Describe a planned or expected event.' },
  { id: 'CAN', signature: 'Event → Ability', description: 'Say what is possible.' },
  { id: 'WANT', signature: 'Event → Intention', description: 'Describe what someone wants to do.' },
  { id: 'MUST', signature: 'Event → Obligation', description: 'Explain an obligation.' },
  { id: 'NOT', signature: 'Clause → Clause', description: 'Negate a proposition.' },
  { id: 'WHEN', signature: 'Clause × Time → Clause', description: 'Place an event in time.' },
  { id: 'ASK', signature: 'Clause → Question', description: 'Ask for confirmation.' },
  { id: 'PLEASE', signature: 'Question → Request', description: 'Make a request polite.' },
  { id: 'LINK', signature: 'Clause × Clause → Discourse', description: 'Explain, contrast or add a thought.' },
  { id: 'WHERE', signature: 'Place → Question', description: 'Ask a location.' },
  { id: 'PRICE', signature: 'Thing → Question', description: 'Ask a price.' },
  { id: 'FREQUENCY', signature: 'Clause × Recurrence → Clause', description: 'Describe a habit.' },
  { id: 'DESCRIBE', signature: 'Thing × Quality → Proposition', description: 'Describe a thing.' },
  { id: 'EXISTS', signature: 'Thing × Place → Proposition', description: 'Say what is available nearby.' },
  { id: 'ASK_OBJECT', signature: 'Predicate × Person → Question', description: 'Ask an open question.' },
  { id: 'HOW_TO_GET', signature: 'Destination → Question', description: 'Ask how to reach somewhere.' },
  { id: 'SEQUENCE', signature: 'Clause[] → Discourse', description: 'Tell a short ordered story.' },
] as const;

export type OperatorId = (typeof OPERATORS)[number]['id'];
