import { analyze } from '../core/algebra.js';
import type {
  Analysis,
  Expression,
  LanguageAdapter,
  Modality,
  PredicateId,
  Time,
} from '../core/model.js';
import { capitalize, selectForm, timeWord, words } from './shared.js';

/** French uses formal vous and a single productive yes/no question pattern. */
const FINITE: Readonly<Record<PredicateId | Modality, readonly [string, string]>> = {
  need: ['ai', 'avez'],
  have: ['ai', 'avez'],
  understand: ['comprends', 'comprenez'],
  help: ['aide', 'aidez'],
  go: ['vais', 'allez'],
  buy: ['achète', 'achetez'],
  speak: ['parle', 'parlez'],
  repeat: ['répète', 'répétez'],
  would_like: ['voudrais', 'voudriez'],
  pay: ['paie', 'payez'],
  can: ['peux', 'pouvez'],
  want: ['veux', 'voulez'],
};

const TIMES: Readonly<Record<Time, string>> = {
  today: 'aujourd’hui',
  tomorrow: 'demain',
};

const LANGUAGES = {
  german: 'allemand',
  french: 'français',
  spanish: 'espagnol',
  english: 'anglais',
} as const;

type Item = 'help' | 'ticket' | 'coffee' | 'water';
interface FrenchNoun {
  readonly singular: string;
  readonly countable: boolean;
  readonly gender: 'masculine' | 'feminine';
}

const NOUNS: Readonly<Record<Item, FrenchNoun>> = {
  help: { singular: 'aide', gender: 'feminine', countable: false },
  ticket: { singular: 'billet', gender: 'masculine', countable: true },
  coffee: { singular: 'café', gender: 'masculine', countable: true },
  water: { singular: 'eau', gender: 'feminine', countable: false },
};

function startsWithVowel(word: string): boolean {
  return /^[aeiouhàâéèêîôùû]/i.test(word);
}

/**
 * Definite, partitive, and negative objects depend on the noun, not the
 * surrounding phrase. The starter covers singular nouns only.
 */
function nounPhrase(id: Item, negative = false): string {
  const noun = NOUNS[id];
  if (negative) {
    return startsWithVowel(noun.singular)
      ? `d’${noun.singular}`
      : `de ${noun.singular}`;
  }
  if (noun.countable) {
    return words(noun.gender === 'masculine' ? 'un' : 'une', noun.singular);
  }
  if (startsWithVowel(noun.singular)) return `de l’${noun.singular}`;
  return words(noun.gender === 'masculine' ? 'du' : 'de la', noun.singular);
}

/** avoir besoin de + noun, with the required de/d’ elision. */
function requiredNoun(id: Item): string {
  const noun = NOUNS[id];
  if (!noun.countable) return `besoin ${nounPhrase(id, true)}`;
  const article = noun.gender === 'masculine' ? 'un' : 'une';
  return `besoin d’${article} ${noun.singular}`;
}

const DESTINATIONS = {
  home: { speaker: 'chez moi', addressee: 'chez vous' },
  station: { speaker: 'à la gare', addressee: 'à la gare' },
  bathroom: { speaker: 'aux toilettes', addressee: 'aux toilettes' },
  hotel: { speaker: 'à l’hôtel', addressee: 'à l’hôtel' },
} as const;

const LOCATIONS = {
  station: { noun: 'la gare', plural: false },
  bathroom: { noun: 'les toilettes', plural: true },
  hotel: { noun: 'l’hôtel', plural: false },
} as const;

function subject(analysis: Analysis, finiteGroup: string): string {
  if (analysis.event.agent === 'addressee') return words('vous', finiteGroup);
  // je elides before j'ai, but not before je n'ai.
  return startsWithVowel(finiteGroup) ? `j’${finiteGroup}` : words('je', finiteGroup);
}

function negateFinite(finiteGroup: string): string {
  const prefix = startsWithVowel(finiteGroup) ? 'n’' : 'ne ';
  return `${prefix}${finiteGroup} pas`;
}

function recipientClitic(analysis: Analysis): string {
  if (analysis.event.predicate !== 'help') return '';
  return analysis.event.recipient === 'speaker' ? 'm’' : 'vous ';
}

function complement(analysis: Analysis): string {
  const { event, modality, negative } = analysis;

  switch (event.predicate) {
    case 'need':
      return requiredNoun(event.theme);
    case 'have':
      return event.theme === 'time' ? 'le temps' : nounPhrase('ticket', negative);
    case 'understand':
      return modality ? 'comprendre ça' : 'ça';
    case 'repeat':
      return modality ? 'répéter ça' : 'ça';
    case 'help':
      // Pronoun appears before the infinitive with a modal, before finite otherwise.
      return modality ? `${recipientClitic(analysis)}aider` : '';
    case 'go':
      return words(modality ? 'aller' : '', DESTINATIONS[event.destination][event.agent]);
    case 'buy':
      return words(modality ? 'acheter' : '', nounPhrase(event.theme, negative));
    case 'would_like':
      return nounPhrase(event.theme, negative);
    case 'speak':
      return LANGUAGES[event.theme];
    case 'pay':
      return words(
        modality ? 'payer' : '',
        event.theme === 'card' ? 'par carte' : 'en espèces',
      );
  }
}

function realize(expression: Expression): string {
  if (expression.kind === 'where') {
    const place = LOCATIONS[expression.place];
    return `Où ${place.plural ? 'sont' : 'est'} ${place.noun} ?`;
  }
  if (expression.kind === 'price') {
    return `Combien coûte ${nounPhrase(expression.thing)} ?`;
  }

  const analysis = analyze(expression);
  const { event, modality, negative } = analysis;
  const finite = selectForm(FINITE[modality ?? event.predicate], event.agent);
  const prefix = event.predicate === 'help' && !modality ? recipientClitic(analysis) : '';
  const finiteGroup = negative ? negateFinite(`${prefix}${finite}`) : `${prefix}${finite}`;
  const clause = subject(analysis, words(finiteGroup, complement(analysis)));
  let sentence = words(clause, timeWord(analysis.time, TIMES));

  // est-ce que preserves ordinary word order, avoiding verb inversion at A1.
  sentence = analysis.question ? `Est-ce que ${sentence}` : capitalize(sentence);
  if (analysis.polite) sentence += ', s’il vous plaît';
  return sentence + (analysis.question ? ' ?' : '.');
}

export const french: LanguageAdapter = {
  profile: {
    code: 'fr',
    name: 'French',
    variety: 'Standard French · formal vous',
    features: [
      'Simple statements use subject + verb + complement.',
      'Prefix a statement with est-ce que for a predictable yes/no question.',
      'Written negation uses ne/n’ before the verb and pas after it.',
      'Je contracts to j’ before a vowel: j’ai, but je n’ai.',
      'Needing something uses avoir besoin de, not a direct cognate of need.',
    ],
  },
  realize,
};
