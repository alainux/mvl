/**
 * Expected written forms for high-value everyday meanings.
 *
 * This is a TEST-ONLY golden corpus, not a phrasebook or a source of generated
 * lesson text. The production system must compose each sentence from its AST.
 *
 * Review status: editorial seed, NOT native-speaker certified. Reviewers can
 * suggest regional alternatives or flag unnatural combinations in PRs.
 */
import {
  DEFAULT_SELECTION, makeTree, event, clause, askWhen, link, sequence,
  describe, presence, askObject, where, price, howToGet,
} from '../../docs/assets/core/algebra.js';

const action = (predicate, argument, options = {}) => makeTree({
  ...DEFAULT_SELECTION,
  agent: 'speaker', modal: '', question: false, polite: false,
  predicate, argument, ...options,
});

const statement = (predicate, agent, argument, negative = false) => ({
  ...clause(event(predicate, agent, argument)), negative,
});

export const linguisticCases = [
  {
    id: 'need-help', meaning: action('need', 'help'),
    expected: { en: 'I need help.', de: 'Ich brauche Hilfe.', fr: 'J’ai besoin d’aide.', es: 'Necesito ayuda.' },
  },
  {
    id: 'need-ticket', meaning: action('need', 'ticket'),
    expected: { en: 'I need a ticket.', de: 'Ich brauche ein Ticket.', fr: 'J’ai besoin d’un billet.', es: 'Necesito un billete.' },
  },
  {
    id: 'need-help-negative', meaning: action('need', 'help', { negative: true }),
    expected: { en: 'I do not need help.', de: 'Ich brauche keine Hilfe.', fr: 'Je n’ai pas besoin d’aide.', es: 'No necesito ayuda.' },
  },
  {
    id: 'have-money', meaning: action('have', 'money'),
    expected: { en: 'I have money.', de: 'Ich habe Geld.', fr: 'J’ai de l’argent.', es: 'Tengo dinero.' },
  },
  {
    id: 'have-no-money', meaning: action('have', 'money', { negative: true }),
    expected: { en: 'I do not have money.', de: 'Ich habe kein Geld.', fr: 'Je n’ai pas d’argent.', es: 'No tengo dinero.' },
  },
  {
    id: 'buy-past', meaning: action('buy', 'ticket', { tense: 'past', time: 'yesterday' }),
    expected: { en: 'I bought a ticket yesterday.', de: 'Ich habe gestern ein Ticket gekauft.', fr: 'J’ai acheté un billet hier.', es: 'Compré un billete ayer.' },
  },
  {
    id: 'buy-future', meaning: action('buy', 'ticket', { tense: 'future', time: 'tomorrow' }),
    expected: { en: 'I will buy a ticket tomorrow.', de: 'Ich kaufe morgen ein Ticket.', fr: 'Je vais acheter un billet demain.', es: 'Voy a comprar un billete mañana.' },
  },
  {
    id: 'buy-two-tickets', meaning: action('buy', 'ticket', { quantity: 2 }),
    expected: { en: 'I buy two tickets.', de: 'Ich kaufe zwei Tickets.', fr: 'J’achète deux billets.', es: 'Compro dos billetes.' },
  },
  {
    id: 'not-use-internet', meaning: action('use', 'internet', { negative: true }),
    expected: { en: 'I do not use the internet.', de: 'Ich benutze das Internet nicht.', fr: 'Je n’utilise pas Internet.', es: 'No uso internet.' },
  },
  {
    id: 'ask-for-bill', meaning: action('would_like', 'bill'),
    expected: { en: 'I would like a bill.', de: 'Ich möchte die Rechnung.', fr: 'Je voudrais l’addition.', es: 'Quisiera la cuenta.' },
  },
  {
    id: 'negative-bill', meaning: action('would_like', 'bill', { negative: true }),
    expected: { en: 'I would not like a bill.', de: 'Ich möchte keine Rechnung.', fr: 'Je ne voudrais pas l’addition.', es: 'No quisiera la cuenta.' },
  },
  {
    id: 'cannot-come', meaning: action('come', 'none', { modal: 'can', negative: true }),
    expected: { en: 'I cannot come.', de: 'Ich kann nicht kommen.', fr: 'Je ne peux pas venir.', es: 'No puedo venir.' },
  },
  {
    id: 'no-obligation', meaning: action('work', 'none', { modal: 'must', negative: true }),
    expected: { en: 'I do not have to work.', de: 'Ich muss nicht arbeiten.', fr: 'Je n’ai pas besoin de travailler.', es: 'No tengo que trabajar.' },
  },
  {
    id: 'work-past', meaning: action('work', 'none', { tense: 'past', time: 'last_week' }),
    expected: { en: 'I worked last week.', de: 'Ich habe letzte Woche gearbeitet.', fr: 'J’ai travaillé la semaine dernière.', es: 'Trabajé la semana pasada.' },
  },
  {
    id: 'go-home-past', meaning: action('go', 'home', { tense: 'past', time: 'yesterday' }),
    expected: { en: 'I went home yesterday.', de: 'Ich bin gestern nach Hause gegangen.', fr: 'Je suis allé chez moi hier.', es: 'Fui a casa ayer.' },
  },
  {
    id: 'where-pharmacy', meaning: where('pharmacy'),
    expected: { en: 'Where is the pharmacy?', de: 'Wo ist die Apotheke?', fr: 'Où est la pharmacie ?', es: '¿Dónde está la farmacia?' },
  },
  {
    id: 'ticket-price', meaning: price('ticket'),
    expected: { en: 'How much does a ticket cost?', de: 'Wie viel kostet ein Ticket?', fr: 'Combien coûte un billet ?', es: '¿Cuánto cuesta un billete?' },
  },
  {
    id: 'route-station', meaning: howToGet('station'),
    expected: { en: 'How do I get to the station?', de: 'Wie komme ich zum Bahnhof?', fr: 'Comment est-ce que je vais à la gare ?', es: '¿Cómo llego a la estación?' },
  },
  {
    id: 'pharmacy-available-question', meaning: presence('pharmacy', 'here', { question: true }),
    expected: { en: 'Is there a pharmacy here?', de: 'Gibt es hier eine Apotheke?', fr: 'Est-ce qu’il y a une pharmacie ici ?', es: '¿Hay una farmacia aquí?' },
  },
  {
    id: 'no-pharmacy', meaning: presence('pharmacy', 'here', { negative: true }),
    expected: { en: 'There is no pharmacy here.', de: 'Hier gibt es keine Apotheke.', fr: 'Il n’y a pas de pharmacie ici.', es: 'No hay farmacia aquí.' },
  },
  {
    id: 'room-small', meaning: describe('room', 'small'),
    expected: { en: 'The room is small.', de: 'Das Zimmer ist klein.', fr: 'La chambre est petite.', es: 'La habitación es pequeña.' },
  },
  {
    id: 'room-not-small', meaning: describe('room', 'small', { negative: true }),
    expected: { en: 'The room is not small.', de: 'Das Zimmer ist nicht klein.', fr: 'La chambre n’est pas petite.', es: 'La habitación no es pequeña.' },
  },
  {
    id: 'like-coffee', meaning: action('like', 'coffee'),
    expected: { en: 'I like coffee.', de: 'Ich mag Kaffee.', fr: 'J’aime le café.', es: 'Me gusta el café.' },
  },
  {
    id: 'not-like-coffee', meaning: action('like', 'coffee', { negative: true }),
    expected: { en: 'I do not like coffee.', de: 'Ich mag keinen Kaffee.', fr: 'Je n’aime pas le café.', es: 'No me gusta el café.' },
  },
  {
    id: 'what-do-you-need', meaning: askObject('need', 'addressee'),
    expected: { en: 'What do you need?', de: 'Was brauchen Sie?', fr: 'De quoi est-ce que vous avez besoin ?', es: '¿Qué necesita usted?' },
  },
  {
    id: 'when-return', meaning: askWhen(clause(event('return', 'addressee', 'none'))),
    expected: { en: 'When do you come back?', de: 'Wann kommen Sie zurück?', fr: 'Quand est-ce que vous revenez ?', es: '¿Cuándo vuelve usted?' },
  },
  {
    id: 'look-for-two-jobs', meaning: action('look_for', 'job', { quantity: 2 }),
    expected: { en: 'I look for two jobs.', de: 'Ich suche zwei Jobs.', fr: 'Je cherche deux emplois.', es: 'Busco dos trabajos.' },
  },
  {
    id: 'he-has-ticket', meaning: action('have', 'ticket', { agent: 'other' }),
    expected: { en: 'He has a ticket.', de: 'Er hat ein Ticket.', fr: 'Il a un billet.', es: 'Él tiene un billete.' },
  },
  {
    id: 'he-does-not-need-help', meaning: action('need', 'help', { agent: 'other', negative: true }),
    expected: { en: 'He does not need help.', de: 'Er braucht keine Hilfe.', fr: 'Il n’a pas besoin d’aide.', es: 'Él no necesita ayuda.' },
  },
  {
    id: 'we-cooked', meaning: action('cook', 'none', { agent: 'we', tense: 'past' }),
    expected: { en: 'We cooked.', de: 'Wir haben gekocht.', fr: 'Nous avons cuisiné.', es: 'Nosotros cocinamos.' },
  },
  {
    id: 'formal-help-request', meaning: action('help', 'speaker', { agent: 'addressee', modal: 'can', question: true, polite: true }),
    expected: { en: 'Can you help me, please?', de: 'Können Sie mir bitte helfen?', fr: 'Est-ce que vous pouvez m’aider, s’il vous plaît ?', es: '¿Usted puede ayudarme, por favor?' },
  },
  {
    id: 'two-clauses-with-but', meaning: link(statement('need', 'speaker', 'ticket'), 'but', statement('have', 'speaker', 'money', true)),
    expected: { en: 'I need a ticket, but I do not have money.', de: 'Ich brauche ein Ticket, aber ich habe kein Geld.', fr: 'J’ai besoin d’un billet, mais je n’ai pas d’argent.', es: 'Necesito un billete, pero no tengo dinero.' },
  },
  {
    id: 'two-step-story', meaning: sequence({ ...statement('work', 'speaker', 'none'), tense: 'past', time: 'yesterday' }, statement('be', 'speaker', 'tired')),
    expected: { en: 'I worked yesterday. I am tired.', de: 'Ich habe gestern gearbeitet. Ich bin müde.', fr: 'J’ai travaillé hier. Je suis fatigué.', es: 'Trabajé ayer. Estoy cansado.' },
  },
];
