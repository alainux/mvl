import { EXTENSION_CURRICULUM } from './curriculum-everyday.js';
import type { LessonDefinition } from './types.js';

/**
 * Shared A2-oriented production syllabus.
 *
 * Each block is a generator over semantic predicates and operators.
 * Describing a pattern here increases what the learner can compose; it does
 * not add a memorized translation to a dictionary.
 *
 * The level is a communicative design target, NOT CEFR certification.
 */
export const CORE_CURRICULUM: readonly LessonDefinition[] = [
  {
    id:'first-words', stage:'foundation', title:'Begin a conversation',
    goal:'Greet someone, be polite, and end an exchange',
    introduction:'Keep a handful of social formulas as complete units. The rest of the manual builds productive sentences.',
    blocks:[
      { kind:'conventions', ids:['hello','good_morning','excuse_me','thank_you','you_are_welcome','goodbye'] },
      { kind:'paradigm', predicate:'have', agent:'speaker', arguments:['question','time'] },
    ],
  },
  {
    id:'identity', stage:'foundation', title:'People and simple states',
    goal:'Say who is doing something and describe a current state',
    introduction:'Change the subject or quality while keeping the same sentence skeleton.',
    blocks:[
      { kind:'paradigm', predicate:'be', agent:'speaker', arguments:['ready','busy','tired'] },
      { kind:'paradigm', predicate:'be', agent:'addressee', arguments:['ready','busy'], options:{question:true} },
      { kind:'paradigm', predicate:'live', agent:'speaker', arguments:['here','berlin','paris','madrid'] },
      { kind:'paradigm', predicate:'work', agent:'we', arguments:['none'] },
    ],
  },
  {
    id:'needs', stage:'foundation', title:'Needs and possessions',
    goal:'Communicate everyday needs and what you have',
    introduction:'Change the object, not the entire sentence. Learn the short noun phrase together with its article.',
    blocks:[
      { kind:'paradigm', predicate:'need', agent:'speaker', arguments:['help','water','appointment','medicine','money'] },
      { kind:'paradigm', predicate:'have', agent:'speaker', arguments:['time','appointment','question','ticket'] },
      { kind:'paradigm', predicate:'would_like', agent:'speaker', arguments:['coffee','water','room'] },
      { kind:'paradigm', predicate:'need', agent:'speaker', arguments:['ticket'], options:{quantity:2} },
    ],
  },
  {
    id:'questions', stage:'foundation', title:'Ask simple questions',
    goal:'Ask for confirmation, locations, and prices',
    introduction:'A question changes sentence structure. It should not require learning a separate phrase for every verb.',
    blocks:[
      { kind:'paradigm', predicate:'have', agent:'addressee', arguments:['time','appointment','question'], options:{question:true} },
      { kind:'paradigm', predicate:'speak', agent:'addressee', arguments:['german','english'], options:{question:true} },
      { kind:'where', places:['station','hospital','office','pharmacy'] },
      { kind:'price', things:['coffee','ticket','book'] },
      { kind:'when-question', predicate:'come', agent:'addressee', argument:'none' },
    ],
  },
  {
    id:'negation', stage:'foundation', title:'Say what is not true',
    goal:'Refuse, correct information, and say what you lack',
    introduction:'Negation is a reusable operator over a clause; noun and verb negation differ between languages.',
    blocks:[
      { kind:'paradigm', predicate:'have', agent:'speaker', arguments:['time','ticket','appointment','money'], options:{negative:true} },
      { kind:'paradigm', predicate:'understand', agent:'speaker', arguments:['this','question'], options:{negative:true} },
      { kind:'paradigm', predicate:'be', agent:'speaker', arguments:['ready','busy'], options:{negative:true} },
    ],
  },
  {
    id:'places', stage:'foundation', title:'Get around',
    goal:'Find destinations and describe movement',
    introduction:'Destinations are semantic slots. A language determines the preposition and article for each place.',
    blocks:[
      { kind:'where', places:['hotel','airport','restaurant','supermarket'] },
      { kind:'paradigm', predicate:'go', agent:'speaker', arguments:['home','station','office','hospital','restaurant'] },
      { kind:'paradigm', predicate:'stay', agent:'speaker', arguments:['home','hotel','office'] },
    ],
  },
  {
    id:'routines', stage:'foundation', title:'Describe ordinary life',
    goal:'Talk about working, eating, drinking, and learning',
    introduction:'Reuse the present tense for common activities and the things that go with them.',
    blocks:[
      { kind:'paradigm', predicate:'work', agent:'speaker', arguments:['none'] },
      { kind:'paradigm', predicate:'work', agent:'addressee', arguments:['none'], options:{question:true} },
      { kind:'paradigm', predicate:'drink', agent:'speaker', arguments:['coffee','water'] },
      { kind:'paradigm', predicate:'eat', agent:'we', arguments:['food'] },
      { kind:'paradigm', predicate:'study', agent:'speaker', arguments:['german','french','spanish'] },
      { kind:'paradigm', predicate:'take', agent:'speaker', arguments:['train','bus'] },
    ],
  },
  {
    id:'ability', stage:'foundation', title:'Can, cannot, and requests',
    goal:'Ask permission, offer help, and describe ability',
    introduction:'Modal verbs attach to an action. The action stays an infinitive in many languages.',
    blocks:[
      { kind:'paradigm', predicate:'help', agent:'addressee', arguments:['speaker','we'], options:{modal:'can',question:true,polite:true} },
      { kind:'paradigm', predicate:'come', agent:'speaker', arguments:['none'], options:{modal:'can',negative:true} },
      { kind:'paradigm', predicate:'pay', agent:'speaker', arguments:['card','cash'], options:{modal:'can',question:true} },
      { kind:'paradigm', predicate:'find', agent:'speaker', arguments:['address','phone'], options:{modal:'can'} },
    ],
  },
  {
    id:'obligation', stage:'foundation', title:'Want and have to',
    goal:'Communicate obligations, desires, and basic plans',
    introduction:'Ability, desire, and obligation differ in meaning but share a reusable modal construction.',
    blocks:[
      { kind:'paradigm', predicate:'go', agent:'speaker', arguments:['hospital','office','station'], options:{modal:'must'} },
      { kind:'paradigm', predicate:'work', agent:'speaker', arguments:['none'], options:{modal:'must'} },
      { kind:'paradigm', predicate:'buy', agent:'speaker', arguments:['ticket','medicine','book'], options:{modal:'want'} },
      { kind:'paradigm', predicate:'wait', agent:'we', arguments:['none'], options:{modal:'must'} },
    ],
  },
  {
    id:'present-time', stage:'time-and-plans', title:'Today and now',
    goal:'Attach simple time information without changing the central event',
    introduction:'Time is an operator on a whole statement. Keep the main sentence shape familiar.',
    blocks:[
      { kind:'paradigm', predicate:'work', agent:'speaker', arguments:['none'], options:{time:'today'} },
      { kind:'paradigm', predicate:'have', agent:'speaker', arguments:['time','appointment'], options:{time:'today'} },
      { kind:'paradigm', predicate:'wait', agent:'we', arguments:['none'], options:{time:'now'} },
      { kind:'paradigm', predicate:'be', agent:'speaker', arguments:['busy'], options:{time:'today'} },
    ],
  },
  {
    id:'past', stage:'time-and-plans', title:'Yesterday: things you did',
    goal:'Describe completed actions and experiences',
    introduction:'A useful language needs a real past. Learn one dependable past construction before chasing every literary form.',
    blocks:[
      { kind:'paradigm', predicate:'buy', agent:'speaker', arguments:['ticket','coffee','book'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'eat', agent:'we', arguments:['food'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'drink', agent:'speaker', arguments:['water'], options:{tense:'past'} },
      { kind:'paradigm', predicate:'work', agent:'speaker', arguments:['none'], options:{tense:'past',time:'last_week'} },
      { kind:'paradigm', predicate:'have', agent:'speaker', arguments:['time','appointment'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'be', agent:'speaker', arguments:['sick','tired'], options:{tense:'past',time:'yesterday'} },
    ],
  },
  {
    id:'past-movement', stage:'time-and-plans', title:'Past journeys and contact',
    goal:'Say where you went, who you called, and when you arrived',
    introduction:'Movement verbs may choose a different auxiliary in the past. The shared meaning stays the same.',
    blocks:[
      { kind:'paradigm', predicate:'go', agent:'speaker', arguments:['home','station','hospital'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'come', agent:'addressee', arguments:['none'], options:{tense:'past',question:true} },
      { kind:'paradigm', predicate:'arrive', agent:'we', arguments:['none'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'stay', agent:'speaker', arguments:['hotel'], options:{tense:'past',time:'last_week'} },
      { kind:'paradigm', predicate:'call', agent:'speaker', arguments:['addressee','other'], options:{tense:'past',time:'yesterday'} },
    ],
  },
  {
    id:'future', stage:'time-and-plans', title:'Tomorrow and next week',
    goal:'Describe upcoming events and near-future plans',
    introduction:'The goal is to express future meaning, not to memorize a full future-tense paradigm.',
    blocks:[
      { kind:'paradigm', predicate:'go', agent:'speaker', arguments:['office','station','hotel'], options:{tense:'future',time:'tomorrow'} },
      { kind:'paradigm', predicate:'work', agent:'we', arguments:['none'], options:{tense:'future',time:'next_week'} },
      { kind:'paradigm', predicate:'send', agent:'speaker', arguments:['message','information'], options:{tense:'future',time:'tomorrow'} },
      { kind:'paradigm', predicate:'come', agent:'addressee', arguments:['none'], options:{tense:'future',question:true} },
    ],
  },
  {
    id:'plans', stage:'time-and-plans', title:'Compare past, now, and future',
    goal:'Reuse the same action across three moments in time',
    introduction:'These are inflection paradigms generated from one event. Notice what changes and what stays fixed.',
    blocks:[
      { kind:'timeline', predicate:'buy', agent:'speaker', arguments:['ticket','book'], tenses:['present','past','future'] },
      { kind:'timeline', predicate:'go', agent:'speaker', arguments:['station','home'], tenses:['present','past','future'] },
      { kind:'timeline', predicate:'work', agent:'we', arguments:['none'], tenses:['present','past','future'] },
    ],
  },
  {
    id:'people', stage:'time-and-plans', title:'Talk to and about people',
    goal:'Mention another person, calls, and requests for help',
    introduction:'The meaning includes both the actor and recipient. The language puts each in the right grammatical form.',
    blocks:[
      { kind:'paradigm', predicate:'help', agent:'speaker', arguments:['addressee','other'] },
      { kind:'paradigm', predicate:'help', agent:'other', arguments:['speaker','addressee'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'call', agent:'speaker', arguments:['addressee','other'], options:{tense:'future',time:'tomorrow'} },
      { kind:'paradigm', predicate:'send', agent:'we', arguments:['message'], options:{tense:'past'} },
    ],
  },
  {
    id:'shopping', stage:'connected-speech', title:'Make everyday transactions',
    goal:'Buy, pay, ask prices, and handle numbers',
    introduction:'Transactions are composed from needs, quantities, questions, and payment methods.',
    blocks:[
      { kind:'price', things:['ticket','coffee','book','room'] },
      { kind:'paradigm', predicate:'would_like', agent:'speaker', arguments:['coffee','ticket','room'] },
      { kind:'paradigm', predicate:'buy', agent:'speaker', arguments:['ticket','book'], options:{quantity:2} },
      { kind:'paradigm', predicate:'pay', agent:'speaker', arguments:['card','cash'], options:{modal:'can',question:true} },
      { kind:'paradigm', predicate:'buy', agent:'speaker', arguments:['ticket'], options:{tense:'past',negative:true,time:'yesterday'} },
    ],
  },
  {
    id:'problems', stage:'connected-speech', title:'Describe problems and limits',
    goal:'Explain illness, lack of time, and things that went wrong',
    introduction:'Build a fact, then add a cause if needed. Use short separate clauses rather than intricate syntax.',
    blocks:[
      { kind:'paradigm', predicate:'be', agent:'speaker', arguments:['sick','tired','late'] },
      { kind:'paradigm', predicate:'have', agent:'speaker', arguments:['problem','appointment'], options:{negative:true} },
      { kind:'paradigm', predicate:'come', agent:'speaker', arguments:['none'], options:{modal:'can',negative:true,time:'today',reason:'sick'} },
      { kind:'paradigm', predicate:'work', agent:'speaker', arguments:['none'], options:{modal:'can',negative:true,reason:'no_time'} },
      { kind:'combine', connection:'but', first:{ predicate:'need', agent:'speaker', argument:'ticket' }, second:{ predicate:'have', agent:'speaker', argument:'money', negative:true } },
    ],
  },
  {
    id:'reasons', stage:'connected-speech', title:'Give a reason without hard grammar',
    goal:'Explain why you cannot do something or need a change',
    introduction:'Use two simple main clauses linked by “because.” German can use denn rather than a weil subordinate clause.',
    blocks:[
      { kind:'paradigm', predicate:'come', agent:'speaker', arguments:['none'], options:{modal:'can',negative:true,reason:'sick'} },
      { kind:'paradigm', predicate:'help', agent:'speaker', arguments:['addressee'], options:{modal:'can',negative:true,reason:'busy'} },
      { kind:'paradigm', predicate:'work', agent:'speaker', arguments:['none'], options:{modal:'can',negative:true,reason:'no_time'} },
      { kind:'combine', connection:'but', first:{ predicate:'need', agent:'speaker', argument:'ticket' }, second:{ predicate:'have', agent:'speaker', argument:'money', negative:true } },
      { kind:'paradigm', predicate:'go', agent:'speaker', arguments:['office'], options:{modal:'can',negative:true,time:'today',reason:'busy'} },
      { kind:'combine', connection:'and', first:{ predicate:'work', agent:'speaker', argument:'none', tense:'past',time:'yesterday' }, second:{ predicate:'go', agent:'speaker', argument:'office',tense:'future',time:'tomorrow' } },
    ],
  },
  {
    id:'small-story', stage:'connected-speech', title:'Tell a small story',
    goal:'Report a past event, a present situation, and a next step',
    introduction:'A short narrative can be three independent simple sentences: yesterday, today, tomorrow.',
    blocks:[
      { kind:'timeline', predicate:'go', agent:'speaker', arguments:['hospital'], tenses:['past','present','future'] },
      { kind:'timeline', predicate:'have', agent:'speaker', arguments:['appointment'], tenses:['past','present','future'] },
      { kind:'timeline', predicate:'work', agent:'speaker', arguments:['none'], tenses:['past','present','future'] },
      { kind:'paradigm', predicate:'be', agent:'speaker', arguments:['sick'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'be', agent:'speaker', arguments:['ready'], options:{time:'today'} },
    ],
  },
  {
    id:'combine', stage:'connected-speech', title:'Your small communication system',
    goal:'Combine the core blocks in work, errands, and personal communication',
    introduction:'Choose a meaning, time, action and possible reason. The same operations produce many new statements.',
    blocks:[
      { kind:'paradigm', predicate:'need', agent:'speaker', arguments:['help','appointment','information'] },
      { kind:'paradigm', predicate:'call', agent:'speaker', arguments:['addressee'], options:{tense:'future',time:'tomorrow'} },
      { kind:'paradigm', predicate:'go', agent:'speaker', arguments:['office'], options:{tense:'past',time:'yesterday'} },
      { kind:'paradigm', predicate:'help', agent:'addressee', arguments:['speaker'], options:{modal:'can',question:true,polite:true} },
      { kind:'paradigm', predicate:'work', agent:'speaker', arguments:['none'], options:{modal:'must',time:'today'} },
      { kind:'paradigm', predicate:'come', agent:'speaker', arguments:['none'], options:{modal:'can',negative:true,reason:'busy'} },
      { kind:'paradigm', predicate:'buy', agent:'we', arguments:['ticket'], options:{tense:'future',time:'tomorrow',quantity:2} },
    ],
  },
];

/** Core patterns precede everyday domains in the learner's manual. */
export const CURRICULUM: readonly LessonDefinition[] = [
  ...CORE_CURRICULUM,
  ...EXTENSION_CURRICULUM,
];
