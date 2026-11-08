/**
 * Learner-facing sentence blocks in exactly the target language's word order.
 *
 * The grammar engine creates the sentence. This adapter only assigns editable
 * semantic roles to those *already realized* words. It never reorders the
 * output or pretends semantic AST fields are spoken words.
 */
import type { Expression, LanguageProfile } from '../core/model.js';
import type { GeneratedExample } from '../learning/types.js';
import type { StudioSlot } from './studio-model.js';
import { CONCEPTS } from '../core/vocabulary.js';
import { actionCue, questRecipe } from './quest-recipe.js';

type Code = LanguageProfile['code'];
export type SurfaceSlot = StudioSlot | 'power' | null;
export interface BuilderWord {
  readonly text: string;
  readonly cue: string;
  readonly slot: SurfaceSlot;
  readonly tag: string;
}

const TIME_CUES = new Set([
  'PAST', 'FUTURE', 'YESTERDAY', 'TODAY', 'TOMORROW', 'NOW', 'SOON',
  'TONIGHT', 'LAST', 'NEXT', 'WEEK', 'MONTH', 'DAY', 'NIGHT', 'EVENING',
  'MORNING', 'LATER', 'AGO', 'COMING',
]);
const POWER_CUES = new Set([
  'NOT', 'CAN', 'MUST', 'WANT', 'PLEASE', 'QUESTION',
  'EVERY', 'EACH', 'OFTEN', 'SOMETIMES', 'IF',
]);
const SUBJECT_CUE: Readonly<Record<string, string>> = {
  speaker: 'I', addressee: 'YOU', we: 'WE', other: 'HE',
};
const CONNECTORS: Readonly<Record<Code, Readonly<Record<string, string>>>> = {
  de: { and: 'und', but: 'aber', because: 'denn' },
  fr: { and: 'et', but: 'mais', because: 'parce que' },
  es: { and: 'y', but: 'pero', because: 'porque' },
};

function tokensOf(sentence: string): readonly string[] {
  return sentence.trim().split(/\s+/u).filter(Boolean);
}

function label(slot: SurfaceSlot, cue: string): string {
  if (!slot) return 'PUNCTUATION';
  if (slot === 'power') return cue === 'NOT' ? 'NOT' : 'POWER';
  if (slot === 'tense') return cue.includes('PAST') || cue.includes('FUTURE') ? 'TENSE' : 'WHEN';
  if (slot === 'argument' || slot === 'presenceThing' || slot === 'descriptionThing') {
    return ['A', 'THE', 'SOME', 'OF A', 'TO THE', 'OF THE', 'IN THE'].includes(cue)
      ? 'ARTICLE' : 'OBJECT';
  }
  return ({
    agent: 'WHO', predicate: 'VERB', connection: 'CONNECTOR',
    quality: 'QUALITY', descriptionTense: 'WHEN', presencePlace: 'WHERE',
    objectPredicate: 'VERB', objectAgent: 'WHO', wherePlace: 'PLACE',
    priceThing: 'THING', routePlace: 'PLACE',
  } as Partial<Record<StudioSlot, string>>)[slot] ?? 'WORD';
}

function clauseSlot(cue: string, expression: Extract<Expression, {kind: 'clause'}>, subjectFound: boolean): SurfaceSlot {
  if (cue === 'QUESTION MARK') return null;
  const action = actionCue(expression.event.predicate);
  if (cue === action || cue.endsWith(' + ' + action)) return 'predicate';
  // A semantic noun such as "QUESTION" is an object, not a question operator.
  if (expression.event.argument !== 'none' &&
      cue === String(CONCEPTS[expression.event.argument]).toUpperCase()) return 'argument';
  if (cue === 'I + PAST' || cue === 'PAST' || cue === 'FUTURE' ||
      cue === 'GOING TO' || cue === 'I + FUTURE' || TIME_CUES.has(cue)) return 'tense';
  if (POWER_CUES.has(cue) || cue === 'NOT HAVE') return 'power';
  if (cue === SUBJECT_CUE[expression.event.agent] && !subjectFound) return 'agent';
  // The remaining words are the noun phrase, destination, verb complement,
  // article or pronoun. All edit the same validated grammar argument socket.
  if (expression.event.argument !== 'none') return 'argument';
  return 'predicate';
}

function compositeSlots(words: readonly string[], expression: Expression, code: Code): readonly SurfaceSlot[] | null {
  if (expression.kind === 'link') {
    const connector = CONNECTORS[code][expression.connection] ?? '';
    const sep = ', ' + connector + ' ';
    const sentence = words.join(' ');
    const at = sentence.indexOf(sep);
    if (at >= 0) {
      const before = tokensOf(sentence.slice(0, at)).length;
      const between = tokensOf(connector).length;
      return words.map((_, i) => i < before ? 'clause0' :
        i < before + between ? 'connection' : 'clause1');
    }
  }
  if (expression.kind === 'sequence') {
    let part = 0;
    return words.map((word, i) => {
      if (i && /[.!?]$/u.test(words[i - 1] ?? '')) part += 1;
      return ('clause' + Math.min(part, 3)) as StudioSlot;
    });
  }
  return null;
}

/** Each block.text is literally the corresponding target-language word. */
export function builderSurfaceWords(sentence: string, expression: Expression, code: Code): readonly BuilderWord[] {
  const words = tokensOf(sentence);
  const example: GeneratedExample = {
    id: 'builder-preview', english: '', target: sentence,
    source: { kind: 'expression', expression }, provenance: 'composed',
  };
  const cues = questRecipe(example, code);
  const composite = compositeSlots(words, expression, code);
  let subjectFound = false;
  const clause = expression.kind === 'ask_when' ? expression.value :
    expression.kind === 'clause' ? expression : null;
  return words.map((word, i) => {
    const cue = cues[i] ?? '';
    let slot: SurfaceSlot = null;
    if (composite) slot = composite[i] ?? null;
    else if (clause) {
      slot = clauseSlot(cue, clause, subjectFound);
      if (slot === 'agent') subjectFound = true;
    } else {
      switch (expression.kind) {
        case 'where': slot = 'wherePlace'; break;
        case 'route': slot = 'routePlace'; break;
        case 'price': slot = 'priceThing'; break;
        case 'ask_object': slot = cue === 'YOU' || cue === 'I' ? 'objectAgent' : 'objectPredicate'; break;
        case 'describe':
          slot = POWER_CUES.has(cue) ? 'power' :
            cue === expression.quality.toUpperCase() ? 'quality' :
            TIME_CUES.has(cue) ? 'descriptionTense' : 'descriptionThing';
          break;
        case 'presence':
          slot = POWER_CUES.has(cue) ? 'power' :
            cue === String(CONCEPTS[expression.place ?? 'here']).toUpperCase() ? 'presencePlace' :
            'presenceThing';
          break;
        default: slot = 'predicate';
      }
    }
    if (cue === 'QUESTION MARK') slot = null;
    return { text: word, cue, slot, tag: label(slot, cue) };
  });
}
