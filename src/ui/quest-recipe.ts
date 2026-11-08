/**
 * One meaning cue per actual word tile in the Sentence Forge.
 * Unlike lesson-level meaning blocks, these follow surface-language word order.
 * Never expose the target-language word itself as a clue.
 */
import type { Expression, LanguageProfile } from '../core/model.js';
import type { GeneratedExample } from '../learning/types.js';
import { CONCEPTS, PREDICATES } from '../core/vocabulary.js';

const LEX: Readonly<Record<LanguageProfile['code'], Readonly<Record<string, string>>>> = {
  de: {
    ich:'I', sie:'YOU', wir:'WE', er:'HE', ihnen:'YOU', mich:'ME', uns:'US',
    es:'IT', wo:'WHERE?', was:'WHAT?', wann:'WHEN?', wie:'HOW', viel:'MUCH',
    kostet:'COSTS', gibt:'IS THERE', ist:'IS', bin:'AM', sind:'ARE',
    war:'WAS', waren:'WERE', der:'THE', die:'THE', das:'THE', den:'THE',
    dem:'THE', des:'THE', ein:'A', eine:'A', einen:'A', einem:'A',
    einer:'A', kein:'NOT', keine:'NOT', keinen:'NOT', keinem:'NOT',
    keiner:'NOT', nicht:'NOT', zwei:'TWO', in:'IN', im:'IN THE',
    ins:'INTO THE', nach:'TO', zu:'TO', zum:'TO THE', zur:'TO THE',
    auf:'ON', für:'FOR', mit:'WITH', bei:'AT', am:'AT THE',
    vom:'FROM THE', von:'FROM', aber:'BUT', und:'AND', denn:'BECAUSE',
    bitte:'PLEASE', heute:'TODAY', gestern:'YESTERDAY', morgen:'TOMORROW',
    bald:'SOON', jetzt:'NOW', hier:'HERE', dort:'THERE', letzte:'LAST',
    letzten:'LAST', nächste:'NEXT', nächsten:'NEXT', woche:'WEEK',
    monat:'MONTH', oft:'OFT', manchmal:'SOMETIMES', jeden:'EVERY',
    jede:'EVERY', tag:'DAY', abend:'EVENING', kann:'CAN', können:'CAN',
    muss:'MUST', müssen:'MUST', will:'WANT', wollen:'WANT', zurück:'BACK',
    weg:'AWAY', an:'VERB PARTICLE', ab:'VERB PARTICLE', aus:'VERB PARTICLE',
    spät:'LATE', dran:'RUNNING LATE', bahnhof:'STATION', hotel:'HOTEL',
    flughafen:'AIRPORT', stadtzentrum:'CITY CENTER',
  },
  fr: {
    je:'I', vous:'YOU', nous:'WE', il:'HE', 'j’ai':'I HAVE',
    'n’ai':'NOT HAVE', 'est-ce':'QUESTION', 'qu’est-ce':'WHAT?',
    que:'THAT', 'qu’il':'THAT', où:'WHERE?', quand:'WHEN?',
    comment:'HOW', combien:'HOW MUCH', quoi:'WHAT?', coûte:'COSTS',
    est:'IS', suis:'AM', êtes:'ARE', sommes:'ARE', ai:'HAVE',
    avez:'HAVE', ont:'HAVE', un:'A', une:'A', des:'SOME',
    de:'OF', 'd’un':'OF A', 'd’une':'OF A', du:'SOME',
    le:'THE', la:'THE', les:'THE', 'l’hôtel':'THE HOTEL',
    'l’hôpital':'THE HOSPITAL', à:'TO', au:'TO THE', aux:'TO THE',
    en:'IN', dans:'IN', pour:'FOR', avec:'WITH', sur:'ON',
    parce:'BECAUSE', mais:'BUT', et:'AND', ne:'NOT', pas:'NOT',
    plus:'ANYMORE', 's’il':'IF', plaît:'PLEASE', y:'THERE', a:'IS',
    'aujourd’hui':'TODAY', hier:'YESTERDAY', demain:'TOMORROW',
    bientôt:'SOON', ici:'HERE', là:'THERE', ce:'THIS', cette:'THIS',
    dernier:'LAST', dernière:'LAST', prochain:'NEXT', prochaine:'NEXT',
    semaine:'WEEK', mois:'MONTH', soir:'EVENING', deux:'TWO',
    vais:'GOING TO', allons:'GOING TO', va:'GOING TO',
    peux:'CAN', pouvez:'CAN', dois:'MUST', voulez:'WANT',
    voudrais:'WOULD LIKE', besoin:'NEED', chez:'AT', par:'BY', souvent:'OFTEN',
    maintenant:'NOW', chaque:'EACH', parfois:'SOMETIMES', tous:'EVERY',
    jours:'DAYS', 'l’allemand':'GERMAN', 'l’espagnol':'SPANISH',
    bon:'GOOD', marché:'VALUE', gare:'STATION', hôtel:'HOTEL',
    café:'COFFEE', magasin:'SHOP', restaurant:'RESTAURANT',
    'l’arrêt':'STOP', 'd’arrêt':'A STOP', bus:'BUS', 'n’y':'NOT', était:'WAS',
  },
  es: {
    yo:'I', usted:'YOU', nosotros:'WE', él:'HE', me:'ME', le:'TO THEM',
    nos:'US', dónde:'WHERE?', cuándo:'WHEN?', qué:'WHAT?',
    cómo:'HOW', cuánto:'HOW MUCH', cuesta:'COSTS', es:'IS',
    está:'IS', estoy:'AM', estamos:'ARE', fue:'WAS', son:'ARE',
    hay:'IS THERE', el:'THE', la:'THE', los:'THE', las:'THE',
    un:'A', una:'A', unos:'SOME', unas:'SOME', al:'TO THE',
    del:'OF THE', en:'IN', a:'TO', de:'OF', con:'WITH',
    por:'BY', para:'FOR', porque:'BECAUSE', pero:'BUT', y:'AND',
    que:'THAT', no:'NOT', tampoco:'NOT EITHER', dos:'TWO',
    hoy:'TODAY', ayer:'YESTERDAY', mañana:'TOMORROW', pronto:'SOON',
    aquí:'HERE', allí:'THERE', esta:'THIS', este:'THIS',
    última:'LAST', pasada:'LAST', próxima:'NEXT', semana:'WEEK',
    mes:'MONTH', noche:'NIGHT', puedo:'CAN', puede:'CAN',
    podemos:'CAN', quiero:'WANT', quiere:'WANT', debo:'MUST',
    tengo:'HAVE', tenemos:'HAVE', voy:'GOING TO', vamos:'GOING TO',
    va:'GOING TO', ahora:'NOW', menudo:'OFTEN', veces:'TIMES',
    todos:'EVERY', días:'DAYS', cada:'EACH', libro:'BOOK', correo:'EMAIL',
    alemán:'GERMAN', español:'SPANISH', habitación:'ROOM',
    estación:'STATION', hotel:'HOTEL', cafetería:'CAFÉ',
    tienda:'SHOP', restaurante:'RESTAURANT', parada:'STOP',
    autobús:'BUS', oficina:'OFFICE', correos:'MAIL',
    documento:'DOCUMENT', favor:'PLEASE', pasado:'LAST',
    amigo:'FRIEND', médico:'DOCTOR', reunión:'MEETING', viene:'COMING',
  },
};
const CONJ: Readonly<Record<LanguageProfile['code'], Readonly<Record<'and' | 'but' | 'because', string>>>> = {
  de: { and:'und', but:'aber', because:'denn' },
  fr: { and:'et', but:'mais', because:'parce que' },
  es: { and:'y', but:'pero', because:'porque' },
};
/**
 * Show only the verb; argument slots belong to the underlying grammar model.
 * For example, "Drink something" is simply "DRINK" in the word-aligned game.
 */
export function actionCue(predicate: keyof typeof PREDICATES): string {
  return PREDICATES[predicate].description
    .replace(/ (?:something|someone|somewhere|a language|a form|in a place|at a place|in a state|in a way)$/u, '')
    .toUpperCase();
}

function tokenize(text: string): string[] { return text.trim().split(/\s+/u).filter(Boolean); }
function normalize(word: string, code: LanguageProfile['code']): string {
  return word.replace(/^[¿¡]/u, '').replace(/[.!?,;:]+$/u, '').toLocaleLowerCase(code);
}
function gloss(word: string, code: LanguageProfile['code']): string | null {
  return word === '?' ? 'QUESTION MARK' : LEX[code][normalize(word, code)] ?? null;
}
function build(expr: Expression, sentence: string, code: LanguageProfile['code']): string[] {
  if (expr.kind === 'link') {
    const connector = CONJ[code][expr.connection], marker = ', ' + connector + ' ';
    const i = sentence.indexOf(marker);
    if (i >= 0) return [
      ...build(expr.first, sentence.slice(0, i), code),
      ...tokenize(connector).map((w) => gloss(w, code) ?? 'CONNECTOR'),
      ...build(expr.second, sentence.slice(i + marker.length), code),
    ];
  }
  if (expr.kind === 'sequence') {
    const steps = sentence.trim().split(/(?<=\.)\s+/u);
    if (steps.length === expr.steps.length)
      return expr.steps.flatMap((step, i) => build(step, steps[i] ?? '', code));
  }
  if (expr.kind === 'ask_when') return build({ ...expr.value, question:true }, sentence, code);
  const words = tokenize(sentence);
  const cues: (string | null)[] = words.map((w) => gloss(w, code));
  const set = (i: number, value: string): void => {
    if (i >= 0 && i < words.length && normalize(words[i] ?? '', code) !== '') cues[i] = value;
  };
  const first = () => cues.findIndex((c, i) => !c && normalize(words[i] ?? '', code) !== '');
  const last = () => {
    for (let i = cues.length - 1; i >= 0; i--)
      if (!cues[i] && normalize(words[i] ?? '', code) !== '') return i;
    return -1;
  };
  const putLast = (value: string): void => { const i = last(); if (i >= 0) set(i, value); };

  switch (expr.kind) {
    case 'where': putLast(String(CONCEPTS[expr.place]).toUpperCase()); break;
    case 'route':
      putLast(String(CONCEPTS[expr.place]).toUpperCase());
      if (code === 'de' || code === 'es') set(1, 'GET');
      else set(4, 'GET');
      break;
    case 'price': putLast(String(CONCEPTS[expr.thing]).toUpperCase()); break;
    case 'presence': {
      // Name the location before the object: "a café at the station"
      // and "a room in the hotel" must not swap their meaning cues.
      if (expr.place && expr.place !== 'here') {
        const preps = code === 'de' ? ['am','im','in','bei'] :
          code === 'fr' ? ['à','au','dans'] : ['en'];
        const start = words.findIndex((word) => preps.includes(normalize(word, code)));
        if (start >= 0) {
          const i = cues.findIndex((value, j) => j > start && !value &&
            normalize(words[j] ?? '', code) !== '');
          if (i >= 0) set(i, String(CONCEPTS[expr.place]).toUpperCase());
        }
      }
      putLast(String(CONCEPTS[expr.thing]).toUpperCase());
      if (code === 'de' && normalize(words[1] ?? '', code) === 'es') set(1, 'THERE');
      if (code === 'fr' && normalize(words[0] ?? '', code) === 'il') set(0, 'THERE');
      break;
    }
    case 'describe': {
      putLast(expr.quality.toUpperCase());
      const i = first();
      if (i >= 0) set(i, String(CONCEPTS[expr.thing]).toUpperCase());
      break;
    }
    case 'ask_object': {
      const i = first();
      if (i >= 0) set(i, actionCue(expr.predicate));
      break;
    }
    case 'clause': {
      const action = actionCue(expr.event.predicate);
      if (code === 'de') {
        const when = normalize(words[0] ?? '', code) === 'wann';
        const vi = when ? 1 : expr.question ? 0 : 1;
        const surface = normalize(words[vi] ?? '', code);
        const perfect = expr.tense === 'past' && !expr.modality &&
          /^(habe|haben|hat|bin|sind|ist)$/u.test(surface);
        set(vi, expr.modality ? expr.modality.toUpperCase() : perfect ? 'PAST' : action);
        if ((perfect || expr.modality) && words.length > 2) set(words.length - 1, action);
      } else if (code === 'fr') {
        const head = normalize(words[0] ?? '', code);
        let vi = 1;
        if (head === 'est-ce') vi = 3;
        else if (head === 'quand' && normalize(words[1] ?? '', code) === 'est-ce') vi = 4;
        else if (head.startsWith('j’') || head.startsWith('n’')) vi = 0;
        else if (normalize(words[1] ?? '', code) === 'ne') vi = 2;
        if (head === 'j’ai' && expr.tense === 'past') set(0, 'I + PAST');
        else if (head.startsWith('j’') && vi === 0) set(0, 'I + ' + action);
        else if (expr.modality) set(vi, expr.modality.toUpperCase());
        else if (expr.tense !== 'present') set(vi, expr.tense.toUpperCase());
        else set(vi, action);
        if (expr.modality || expr.tense !== 'present') {
          const i = cues.findIndex((v, j) => j > vi && !v && normalize(words[j] ?? '', code) !== '');
          if (i >= 0) set(i, action);
        }
      } else {
        const head = normalize(words[0] ?? '', code);
        const vi = ['cuándo','usted','nosotros','no'].includes(head) ? 1 : 0;
        if (head === 'me' && expr.event.predicate === 'stay' && !expr.modality) set(1, action);
        else if (expr.event.predicate === 'like' && !expr.modality) {
          const i = words.findIndex((w) => normalize(w, code) === 'gusta');
          if (i >= 0) set(i, action);
        } else if (expr.tense === 'future') set(vi, 'FUTURE');
        else if (expr.modality) set(vi, expr.modality.toUpperCase());
        else set(vi, action);
        if (expr.modality || expr.tense === 'future') {
          const i = cues.findIndex((v, j) => j > vi && !v && normalize(words[j] ?? '', code) !== '');
          if (i >= 0) set(i, action);
        }
      }
      if (expr.event.argument !== 'none') {
        const argument = String(CONCEPTS[expr.event.argument]).toUpperCase();
        if (expr.event.argument === 'this') {
          const i = words.findIndex((w) => ['das','esto'].includes(normalize(w, code)));
          if (i >= 0) set(i, 'THIS');
          else putLast(argument);
        } else putLast(argument);
      }
      break;
    }
    case 'link': case 'sequence': break;
  }
  return cues.map((c) => c ?? 'DETAIL');
}
/** One visible English cue for every actual target-language word tile. */
export function questRecipe(example: GeneratedExample, code: LanguageProfile['code']): readonly string[] {
  const tokens = tokenize(example.target);
  if (example.source.kind === 'convention') {
    const en = tokenize(example.english.replace(/[.!?,]/gu, '')).map((w) => w.toUpperCase());
    if (en.length >= tokens.length) {
      const offset = en.length - tokens.length;
      return tokens.map((_, i) => i === 0 ? en.slice(0, offset + 1).join(' ') : en[i + offset] ?? 'EXPRESSION');
    }
    return tokens.map((_, i) => en[i] ?? 'EXPRESSION');
  }
  const clues = build(example.source.expression, example.target, code);
  // Even unprecedented combinations from the grammar generator must fit exactly.
  return tokens.map((_, i) => clues[i] ?? 'DETAIL');
}
