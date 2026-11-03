/** Human explanations of grammatical *transformations*, not sentence templates. */
import type { LanguageProfile } from '../core/model.js';
import type { StudioSlot, StudioState } from './studio-model.js';

type Code = LanguageProfile['code'];

type GuidanceTopic =
  | 'basic' | 'past' | 'future' | 'modal' | 'negative' | 'question'
  | 'frequency' | 'reason' | 'description' | 'presence' | 'open' | 'route' | 'where' | 'price';

const GUIDANCE: Readonly<Record<Code, Readonly<Record<GuidanceTopic, string>>>> = {
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


const SIMPLE_PAST_DE: Readonly<Record<string, string>> = {
  be: 'war', have: 'hatte', need: 'brauchte', would_like: 'wollte',
};
const IMPERFECT_FR = new Set(['be', 'have', 'need', 'would_like', 'live']);
const IMPERFECT_ES = new Set(['be', 'have', 'would_like', 'live']);

export interface GrammarStep { readonly role: string; readonly explanation: string }

/** A construction blueprint: labels are rules, not guessed annotations on words. */
export function grammarSteps(state: StudioState, code: Code): readonly GrammarStep[] {
  if (state.pattern === 'link')
    return [{ role: 'STATEMENT 1', explanation: 'Independent clause' },
      { role: 'CONNECTOR', explanation: state.connection },
      { role: 'STATEMENT 2', explanation: 'Own subject + verb' }];
  if (state.pattern === 'sequence')
    return state.steps.map((step, index) => ({
      role: 'STEP ' + (index + 1), explanation: step.tense + ' event',
    }));
  if (state.pattern === 'description')
    return [{ role: 'THING', explanation: 'Subject' },
      { role: 'STATE', explanation: state.descriptionTense },
      { role: 'QUALITY', explanation: 'Adjective' }];
  if (state.pattern === 'presence')
    return [{ role: 'EXISTS', explanation: ({ de: 'es gibt', fr: 'il y a', es: 'hay' } as const)[code] },
      { role: 'ITEM', explanation: 'What exists' }, { role: 'WHERE', explanation: 'Location' }];
  if (state.pattern === 'ask-when' || state.pattern === 'ask-object' || state.pattern === 'price' ||
      state.pattern === 'where' || state.pattern === 'route')
    return [{ role: 'QUESTION FRAME', explanation: 'Reusable structure' },
      { role: 'MEANING SLOT', explanation: 'The variable part' }];

  const action = state.action;
  if (code === 'de') {
    const stages: GrammarStep[] = action.question
      ? [{ role: '1 · VERB', explanation: 'Question: finite verb first' },
        { role: '2 · SUBJECT', explanation: 'Who acts' }]
      : [{ role: '1 · SUBJECT', explanation: 'Who acts' },
        { role: '2 · VERB', explanation: 'Conjugated verb' }];
    stages.push({ role: 'MIDDLE', explanation: 'Time + object or place' });
    if (action.modal) stages.push({ role: 'END', explanation: 'Main verb infinitive' });
    else if (action.tense === 'past' && !SIMPLE_PAST_DE[action.predicate])
      stages.push({ role: 'END', explanation: 'Past participle' });
    if (action.reason !== 'none') stages.push({ role: 'DENN', explanation: 'Another main clause' });
    return stages;
  }
  if (code === 'fr') {
    const stages: GrammarStep[] = [];
    if (action.question) stages.push({ role: 'QUESTION', explanation: 'est-ce que' });
    stages.push({ role: 'SUBJECT + VERB', explanation: 'Conjugated together' });
    if (action.tense === 'past' && action.modal)
      stages.push({ role: 'PAST MODAL', explanation: 'Auxiliary + modal participle' });
    if (action.tense === 'past' && !IMPERFECT_FR.has(action.predicate) && !action.modal)
      stages.push({ role: 'PAST', explanation: 'Auxiliary + participle' });
    if (action.tense === 'future' && !action.modal && action.predicate !== 'would_like')
      stages.push({ role: 'FUTURE', explanation: 'aller + infinitive' });
    if (action.negative) stages.push({ role: 'NEGATION', explanation: 'ne … pas' });
    stages.push({ role: 'DETAILS', explanation: 'Object and time' });
    return stages;
  }
  const stages: GrammarStep[] = [{ role: 'FINITE VERB', explanation: 'Shows the person' }];
  if (action.tense === 'past')
    stages.push({ role: 'PAST', explanation: IMPERFECT_ES.has(action.predicate) ? 'Imperfect' : 'Completed event' });
  if (action.tense === 'future' && !action.modal && action.predicate !== 'would_like')
    stages.push({ role: 'FUTURE', explanation: 'ir a + infinitive' });
  if (action.negative) stages.push({ role: 'NO', explanation: 'Before the conjugated verb' });
  if (action.question) stages.push({ role: '¿…?', explanation: 'Question intonation' });
  stages.push({ role: 'DETAILS', explanation: 'Object and time' });
  return stages;
}

export function ruleFor(state: StudioState, code: Code, selected: StudioSlot): string {
  const source = GUIDANCE[code];
  if (state.pattern === 'description') return source.description;
  if (state.pattern === 'presence') return source.presence;
  if (state.pattern === 'ask-object' || state.pattern === 'ask-when') return source.open;
  if (state.pattern === 'route') return source.route;
  if (state.pattern === 'where') return source.where;
  if (state.pattern === 'price') return source.price;
  if (state.pattern === 'link' && selected === 'connection')
    return state.connection === 'because' ? source.reason
      : 'Join two independent statements with ' + state.connection + '. Each keeps its own subject and finite verb.';

  const clauseIndex = selected.startsWith('clause') ? Number(selected.slice(-1)) : 0;
  const a = state.pattern === 'link' ? (clauseIndex === 1 ? state.secondAction : state.action)
    : state.pattern === 'sequence' ? (state.steps[clauseIndex] ?? state.action) : state.action;

  if (selected === 'agent') return ({
    de: 'The subject determines the conjugated verb form. Formal Sie uses plural agreement; ich, wir and er have their own forms.',
    fr: 'The subject and finite verb agree. Je may become j’ before a vowel; formal vous has its own verb form.',
    es: 'The verb ending marks the subject. Spanish often omits the subject pronoun in natural speech.',
  } as const)[code];
  if (selected === 'argument') return code === 'de' && a.predicate === 'help'
    ? 'Helfen takes a dative recipient: mir, Ihnen, uns or ihm.'
    : code === 'de' && a.predicate === 'call'
      ? 'Anrufen takes an accusative recipient: mich, Sie, uns or ihn.'
      : code === 'de' ? 'Nouns and articles adjust to their grammatical role; destinations select a preposition.'
        : 'The object or destination controls the article, pronoun or preposition.';
  if (selected === 'quantity') return ({
    de: 'Zwei replaces the singular article and the countable noun becomes plural.',
    fr: 'Deux takes a plural noun.', es: 'Dos takes a plural noun.',
  } as const)[code];
  if (selected === 'reason' && a.reason !== 'none')
    return code === 'de' ? 'Denn joins a second main clause, with its conjugated verb in second position.'
      : code === 'fr' ? 'Parce que introduces a second explanatory clause.'
        : 'Porque introduces a second explanatory clause.';
  if (selected === 'question' || selected === 'polite') return source.question;
  if (selected === 'negative' && a.negative) return source.negative;
  if (selected === 'frequency' && a.frequency) return source.frequency;
  if (selected === 'modal' && a.modal && a.tense !== 'past') return source.modal;

  if (selected === 'tense' || a.tense !== 'present') {
    if (a.tense === 'future') {
      if (a.predicate === 'would_like' && code !== 'de')
        return code === 'fr'
          ? 'A polite request keeps je voudrais with a future time word such as demain; aller vouloir would change the intention.'
          : 'A polite request keeps quisiera with a future time word such as mañana; ir a querer would change the intention.';
      if (a.modal && code !== 'de')
        return 'The modal keeps its present form alongside a future time word. This construction does not use the normal near-future auxiliary.';
      return source.future;
    }
    if (a.tense === 'past') {
      if (code === 'de' && a.modal)
        return 'A past modal (for example konnte or musste) is conjugated; the main verb stays as an infinitive at the end.';
      if (code === 'de' && SIMPLE_PAST_DE[a.predicate])
        return 'This common verb uses simple past (' + SIMPLE_PAST_DE[a.predicate] + '), not a participle construction here.';
      if (code === 'fr' && IMPERFECT_FR.has(a.predicate))
        return 'This past state uses the imparfait rather than the passé composé.';
      if (code === 'es' && IMPERFECT_ES.has(a.predicate))
        return 'This past state uses the imperfect rather than the completed-event preterite.';
      return source.past;
    }
    if (selected === 'tense' && a.time) return 'The time phrase anchors the event; compare where it appears in the sentence.';
  }
  if (a.modal) return source.modal;
  return source.basic;
}
