import type { LessonDefinition } from './types.js';

/**
 * One curriculum, independent of target language.
 *
 * A paradigm is a program that fills a semantic slot. Target sentences and
 * their English prompts are produced by the same abstract syntax tree.
 * No translated sentence is stored in this file.
 */
export const CURRICULUM: readonly LessonDefinition[] = [
  {
    id: 'first-words',
    title: 'First words',
    goal: 'Start and end a simple interaction',
    introduction: 'A few social expressions are conventional, not assembled by grammar. Learn these short forms as complete units.',
    blocks: [
      { kind: 'conventions', ids: ['hello', 'good_morning', 'excuse_me', 'thank_you', 'you_are_welcome', 'goodbye'] },
    ],
  },
  {
    id: 'needs',
    title: 'Needs and possession',
    goal: 'Say what you need or already have',
    introduction: 'A verb plus an interchangeable noun phrase gives you a whole family of useful statements.',
    blocks: [
      { kind: 'paradigm', predicate: 'need', agent: 'speaker', arguments: ['help', 'water', 'ticket', 'coffee'] },
      { kind: 'paradigm', predicate: 'have', agent: 'speaker', arguments: ['time', 'ticket'] },
    ],
  },
  {
    id: 'preferences',
    title: 'What you would like',
    goal: 'Ask for something politely',
    introduction: 'One courteous construction works with many objects. Substitute the thing you want instead of memorizing an order.',
    blocks: [
      { kind: 'paradigm', predicate: 'would_like', agent: 'speaker', arguments: ['coffee', 'water', 'ticket'] },
      { kind: 'paradigm', predicate: 'would_like', agent: 'addressee', arguments: ['coffee', 'water'], options: { question: true } },
    ],
  },
  {
    id: 'questions',
    title: 'Yes/no questions',
    goal: 'Ask a direct question',
    introduction: 'A question changes the form of a whole clause. The same mechanism works with several verbs.',
    blocks: [
      { kind: 'paradigm', predicate: 'have', agent: 'addressee', arguments: ['time', 'ticket'], options: { question: true } },
      { kind: 'paradigm', predicate: 'understand', agent: 'addressee', arguments: ['this'], options: { question: true } },
      { kind: 'paradigm', predicate: 'speak', agent: 'addressee', arguments: ['english', 'german'], options: { question: true } },
    ],
  },
  {
    id: 'help',
    title: 'Ask for help',
    goal: 'Request and offer assistance',
    introduction: 'A question, a modal verb and an action can be combined. Change the recipient or action to make a new request.',
    blocks: [
      { kind: 'paradigm', predicate: 'help', agent: 'addressee', arguments: ['speaker'], options: { modal: 'can', question: true } },
      { kind: 'paradigm', predicate: 'help', agent: 'addressee', arguments: ['speaker'], options: { modal: 'can', question: true, polite: true } },
      { kind: 'paradigm', predicate: 'help', agent: 'speaker', arguments: ['addressee'], options: { modal: 'can' } },
      { kind: 'paradigm', predicate: 'repeat', agent: 'addressee', arguments: ['this'], options: { modal: 'can', question: true, polite: true } },
    ],
  },
  {
    id: 'repair',
    title: 'When you do not understand',
    goal: 'Keep a conversation going',
    introduction: 'Say what you cannot understand and ask for clarification instead of trying to guess.',
    blocks: [
      { kind: 'paradigm', predicate: 'understand', agent: 'speaker', arguments: ['this'], options: { negative: true } },
      { kind: 'paradigm', predicate: 'speak', agent: 'speaker', arguments: ['german', 'french', 'spanish'], options: { negative: true } },
      { kind: 'paradigm', predicate: 'speak', agent: 'addressee', arguments: ['english'], options: { question: true } },
      { kind: 'conventions', ids: ['slowly', 'learning'] },
    ],
  },
  {
    id: 'places',
    title: 'Places and directions',
    goal: 'Find a place and say where you are going',
    introduction: 'The place is a slot. Its preposition and article are handled by the language, not by you inventing a new sentence.',
    blocks: [
      { kind: 'where', places: ['station', 'bathroom', 'hotel'] },
      { kind: 'paradigm', predicate: 'go', agent: 'speaker', arguments: ['station', 'hotel', 'bathroom'] },
      { kind: 'paradigm', predicate: 'go', agent: 'speaker', arguments: ['home'], options: { modal: 'want' } },
    ],
  },
  {
    id: 'shopping',
    title: 'Buying and paying',
    goal: 'Ask a price and pay for something',
    introduction: 'Combine price questions, purchasing and payment methods. Only the useful noun or payment method changes.',
    blocks: [
      { kind: 'price', things: ['ticket', 'coffee'] },
      { kind: 'paradigm', predicate: 'buy', agent: 'speaker', arguments: ['ticket', 'coffee', 'water'], options: { modal: 'want' } },
      { kind: 'paradigm', predicate: 'pay', agent: 'speaker', arguments: ['card', 'cash'], options: { modal: 'can', question: true } },
    ],
  },
  {
    id: 'time',
    title: 'Today and tomorrow',
    goal: 'Situate a simple statement in time',
    introduction: 'Adding a time expression makes ordinary statements useful for near-future plans, without learning new tenses first.',
    blocks: [
      { kind: 'paradigm', predicate: 'have', agent: 'speaker', arguments: ['time'], options: { time: 'today' } },
      { kind: 'paradigm', predicate: 'go', agent: 'speaker', arguments: ['hotel', 'station'], options: { time: 'tomorrow' } },
      { kind: 'paradigm', predicate: 'help', agent: 'addressee', arguments: ['speaker'], options: { modal: 'can', question: true, time: 'tomorrow' } },
      { kind: 'paradigm', predicate: 'buy', agent: 'speaker', arguments: ['ticket'], options: { modal: 'want', time: 'today' } },
    ],
  },
  {
    id: 'negation',
    title: 'Say no and set limits',
    goal: 'Turn a positive sentence into a negative one',
    introduction: 'Negation is an operator: it changes the meaning of a clause, while each language decides where its negative words go.',
    blocks: [
      { kind: 'paradigm', predicate: 'have', agent: 'speaker', arguments: ['ticket', 'time'], options: { negative: true } },
      { kind: 'paradigm', predicate: 'understand', agent: 'speaker', arguments: ['this'], options: { negative: true } },
      { kind: 'paradigm', predicate: 'go', agent: 'speaker', arguments: ['station'], options: { modal: 'can', negative: true, time: 'today' } },
      { kind: 'paradigm', predicate: 'speak', agent: 'speaker', arguments: ['spanish'], options: { negative: true } },
    ],
  },
  {
    id: 'combine',
    title: 'Put the blocks together',
    goal: 'Handle a short everyday interaction',
    introduction: 'Put a greeting, a question, a need and a request into separate short sentences. Complexity is optional.',
    blocks: [
      { kind: 'conventions', ids: ['excuse_me'] },
      { kind: 'where', places: ['station'] },
      { kind: 'paradigm', predicate: 'need', agent: 'speaker', arguments: ['ticket'] },
      { kind: 'price', things: ['ticket'] },
      { kind: 'paradigm', predicate: 'pay', agent: 'speaker', arguments: ['card'], options: { modal: 'can', question: true } },
      { kind: 'conventions', ids: ['thank_you'] },
    ],
  },
];
