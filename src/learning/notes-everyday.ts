import type { LanguageProfile } from '../core/model.js';
import type { LessonId, LessonNotes } from './types.js';

/**
 * Human-authored explanations, not generated translations.
 *
 * A lesson specifies its communicative goal once. Each language contributes
 * only the small grammar rule necessary to express that meaning. All examples
 * and recall questions still come from semantic composition.
 */
interface LanguageRule {
  readonly recipe: string;
  readonly detail: string;
}

interface TeachingRule {
  readonly explanation: string;
  readonly caution: string;
  readonly de: LanguageRule;
  readonly fr: LanguageRule;
  readonly es: LanguageRule;
}

type ExtensionLessonId = Exclude<LessonId,
  | 'first-words' | 'identity' | 'needs' | 'questions' | 'negation'
  | 'places' | 'routines' | 'ability' | 'obligation' | 'present-time'
  | 'past' | 'past-movement' | 'future' | 'plans' | 'people'
  | 'shopping' | 'problems' | 'reasons' | 'small-story' | 'combine'
>;

const RULES: Readonly<Record<ExtensionLessonId, TeachingRule>> = {
  'open-questions': {
    explanation: 'The missing information is one semantic slot. The question word replaces that slot, while the ordinary verb still changes for the speaker.',
    caution: 'Question constructions are not identical across languages. Reuse the target language’s question rule rather than translating English word order.',
    de: { recipe: 'Was + verb + subject? / Wie komme ich + destination?', detail: 'Was brauchen Sie? uses the conjugated verb directly after was. For a route: Wie komme ich zur Bank? The destination keeps its learned preposition.' },
    fr: { recipe: 'Qu’est-ce que + subject + verb? / De quoi ... besoin?', detail: 'Qu’est-ce que works for many object questions. Avoir besoin de needs the special question De quoi est-ce que vous avez besoin ? Route questions can start Comment est-ce que…' },
    es: { recipe: '¿Qué + conjugated verb + subject? / ¿Cómo llego ...?', detail: '¿Qué necesita usted? asks an open object question. ¿Cómo llego al banco? asks for a route. The verb form already indicates who acts.' },
  },
  habits: {
    explanation: 'One frequency block can modify many present-tense events: often, sometimes, every day, every week. It describes habitual activity, not an individual finished action.',
    caution: 'Avoid adding incompatible time operators, such as yesterday and every day, to the same single event.',
    de: { recipe: 'Subject + finite verb + oft / jeden Tag + rest', detail: 'Frequency commonly appears after the finite verb: Ich lese oft ein Buch. With separable verbs, their particle still belongs at the end.' },
    fr: { recipe: 'Subject + verb + souvent / parfois + object', detail: 'Short frequency adverbs like souvent usually follow the conjugated verb: Je lis souvent un livre. Every day is tous les jours.' },
    es: { recipe: 'Conjugated verb + object + a menudo / todos los días', detail: 'A menudo and a veces can follow the completed verb phrase: Leo un libro a menudo. The subject pronoun is usually optional.' },
  },
  preferences: {
    explanation: 'Expressing a preference is a reusable relation between a person and an object. You do not need a different complete sentence for every food or activity.',
    caution: 'Spanish gustar reverses the typical English logic. The item liked controls the verb, while the person is a recipient.',
    de: { recipe: 'Ich mag + noun / Ich mag ... nicht', detail: 'Mögen is irregular: ich mag, Sie mögen. For negating an indefinite thing, use kein in the appropriate form: Ich mag keinen Kaffee.' },
    fr: { recipe: 'J’aime + definite noun / Je n’aime pas + noun', detail: 'With a general preference, use the definite article: J’aime le café; J’aime la musique. Elide je before a vowel: j’aime.' },
    es: { recipe: 'Me gusta + singular thing / ¿Le gusta ...?', detail: 'Use me gusta with a singular thing or an uncountable noun: Me gusta el café. Formal you uses le gusta. Learn plural gustan later.' },
  },
  description: {
    explanation: 'A description joins an identifiable subject with a quality. This unlocks opinions about housing, prices, condition, and availability.',
    caution: 'Learn which qualities belong to which things. An automatic adjective swap is not always a meaningful sentence.',
    de: { recipe: 'Definite noun + ist / war + adjective', detail: 'Predicative adjectives after sein have no ending: Das Zimmer ist groß. Negate the quality with nicht: Das Zimmer ist nicht teuer.' },
    fr: { recipe: 'Definite noun + est / était + agreeing adjective', detail: 'Adjectives often agree in gender with the noun: le magasin est ouvert, la chambre est ouverte. This guide computes those forms.' },
    es: { recipe: 'Definite noun + es / está + agreeing adjective', detail: 'Use ser for stable evaluations, estar for temporary condition: es caro, está abierto. Adjective endings also follow noun gender.' },
  },
  housing: {
    explanation: 'A practical housing conversation uses search, need, description, and availability. They are productive sentence families, not an apartment vocabulary script.',
    caution: 'For detailed leases and legal commitments you will need vocabulary beyond this minimal guide.',
    de: { recipe: 'Ich suche + Wohnung / Die Wohnung ist + quality', detail: 'Suchen takes an accusative object: Ich suche eine Wohnung. In a description, use the nominative definite noun: Die Wohnung ist klein.' },
    fr: { recipe: 'Je cherche + logement / L’appartement est + quality', detail: 'Chercher takes a direct object. Use the feminine adjective for chambre and the masculine one for appartement.' },
    es: { recipe: 'Busco + piso / El piso es + quality', detail: 'Buscar uses a direct object. El piso es pequeño is a lasting description; está limpio describes a current condition.' },
  },
  'services-nearby': {
    explanation: 'Existence and location are different questions. First ask if a service exists; then ask where it is.',
    caution: 'The most natural location prepositions and articles are language-specific. Learn them with their place names.',
    de: { recipe: 'Gibt es hier + noun? / Hier gibt es + noun', detail: 'Es gibt takes an accusative noun: Gibt es hier eine Apotheke? Negative is es gibt keine Apotheke.' },
    fr: { recipe: 'Est-ce qu’il y a + noun? / Il y a + noun', detail: 'The same il y a construction works for nearby services. After negation, un/une usually becomes de: Il n’y a pas de pharmacie.' },
    es: { recipe: '¿Hay + noun? / Hay + noun + aquí', detail: 'Hay does not conjugate for singular/plural in these existential uses: ¿Hay una farmacia aquí? Negative: No hay farmacia.' },
  },
  directions: {
    explanation: 'A location question asks where. A route question asks how to get there. Both can be combined with a statement of where you are going.',
    caution: 'These patterns ask for directions but do not yet teach you to understand every spoken route explanation.',
    de: { recipe: 'Wo ist + place? / Wie komme ich + destination?', detail: 'The destination preposition varies: zur Bank, zum Bahnhof, ins Stadtzentrum. The question Wie komme ich… remains unchanged.' },
    fr: { recipe: 'Où est + place ? / Comment est-ce que je vais + place ?', detail: 'A destination typically uses à with the appropriate contraction: au parc, à la gare, à l’aéroport.' },
    es: { recipe: '¿Dónde está + place? / ¿Cómo llego + destination?', detail: 'A movement destination often uses a: a la estación, al banco, al parque. Al = a + el.' },
  },
  'food-services': {
    explanation: 'The same small grammar covers common food purchases, price checks, paying, and booking a table.',
    caution: 'Words like bill and reservation are normal nouns here; they do not exempt a sentence from ordinary articles and word order.',
    de: { recipe: 'Ich möchte + item / Ich reserviere + item / Wie viel kostet ...?', detail: 'Möchten makes a request softer than wollen. Masculine objects often take einen, but prices use a nominative subject.' },
    fr: { recipe: 'Je voudrais + noun / Je réserve + noun', detail: 'Je voudrais is a polite request. Most countable objects need un or une; the grammar uses the noun’s stored gender.' },
    es: { recipe: 'Quisiera + noun / Reservo + noun', detail: 'Quisiera is a conventional polite verb form for wanting something. Noun gender determines un or una.' },
  },
  'work-and-study': {
    explanation: 'Describe your job, daily routine, email tasks, and future meetings with the same core operators.',
    caution: 'Simple workplace communication is not the same as understanding specialist professional or legal language.',
    de: { recipe: 'Ich suche / habe + noun; Ich arbeite jeden Tag', detail: 'Ich suche einen Job, but ich habe eine Besprechung. Learn each noun with gender, then reuse present, Perfekt and future markers.' },
    fr: { recipe: 'Je cherche / j’ai + noun; Je travaille tous les jours', detail: 'Use un emploi for a job and une réunion for a meeting. Je travaille and j’ai travaillé share the same event with a different tense.' },
    es: { recipe: 'Busco / tengo + noun; Trabajo todos los días', detail: 'Busco trabajo is common for job hunting; tengo una reunión for a meeting. The past changes the verb, not the semantic object.' },
  },
  'digital-life': {
    explanation: 'Use, read, write and send are productive actions. Recombine them with electronic objects and time operators.',
    caution: 'Avoid translating technical terms word for word across countries; each language uses its everyday terms here.',
    de: { recipe: 'Ich benutze / lese / schreibe / sende + object', detail: 'Benutzen and schreiben take direct objects. Ich habe eine E-Mail geschrieben uses the haben + participle past.' },
    fr: { recipe: 'J’utilise / je lis / j’écris / j’envoie + object', detail: 'Common irregular forms include je lis and j’écris. In a future plan, use je vais écrire + object.' },
    es: { recipe: 'Uso / leo / escribo / envío + object', detail: 'Present-tense subjects may be omitted. For plans use voy a enviar + object; for completed events use envié.' },
  },
  forms: {
    explanation: 'Paperwork tasks need few new action frames: fill out, sign, read, and send. Attach time and requests as before.',
    caution: 'A language guide cannot determine which documents a particular office legally requires.',
    de: { recipe: 'Ich fülle das Formular aus / Ich habe ... ausgefüllt', detail: 'Ausfüllen is separable: the particle goes to the end in ordinary present clauses. Its past participle is ausgefüllt.' },
    fr: { recipe: 'Je remplis un formulaire / J’ai signé ...', detail: 'Remplir and signer are direct-object verbs; in the passé composé the past participle follows avoir.' },
    es: { recipe: 'Relleno un formulario / Firmé un documento', detail: 'Use a present verb for a current task and a completed past form for a signed or submitted document.' },
  },
  health: {
    explanation: 'Describe a basic state, request help, and locate medical services using familiar structures.',
    caution: 'The guide does not teach diagnosis, emergency instructions, or how to understand a clinician’s full response.',
    de: { recipe: 'Ich bin krank / Ich brauche + noun / Ich gehe + place', detail: 'Krank is an adjective after bin. Ich brauche einen Arzt uses accusative; zur Apotheke is a destination phrase.' },
    fr: { recipe: 'Je suis malade / J’ai besoin de + noun', detail: 'Use être with malade, and avoir besoin de for needs. The negative of pouvoir is ne peux pas.' },
    es: { recipe: 'Estoy enfermo / Necesito + noun', detail: 'Use estar for your present health state; a person can request un médico or una medicina.' },
  },
  appointments: {
    explanation: 'Appointments are nouns. Cancelling, reserving, and explaining a conflict are ordinary verb operators, not special scripts.',
    caution: 'In many circumstances an earlier or more polite written message is appropriate; short statements are a minimal oral baseline.',
    de: { recipe: 'Ich habe / sage ... ab / Ich kann nicht kommen, denn ...', detail: 'Absagen is separable in the present: Ich sage den Termin ab. Use Perfekt abgesagt for a completed cancellation.' },
    fr: { recipe: 'J’ai / j’annule / je vais réserver + noun', detail: 'Use j’annule for cancellation and je vais réserver for a future reservation. A simple parce que joins a reason.' },
    es: { recipe: 'Tengo / cancelo / voy a reservar + noun', detail: 'The future plan is ir a + infinitive; a past cancellation uses cancelé. Keep a reason short with porque.' },
  },
  'social-life': {
    explanation: 'Meeting, calling, and waiting are built from the same participants and objects as other actions.',
    caution: 'Social register varies by region. This guide consistently uses formal second-person forms for unfamiliar people.',
    de: { recipe: 'Ich treffe + person / Ich warte auf + person', detail: 'Treffen takes accusative. Warten takes auf + accusative: Ich warte auf einen Freund. Past anrufen uses angerufen.' },
    fr: { recipe: 'Je retrouve + person / J’attends + person', detail: 'French attendre takes a direct object without pour. Formal vous works in everyday situations with people you do not know.' },
    es: { recipe: 'Quedo con + person / Espero a + person', detail: 'For arranging to see a friend, quedar con is useful. For waiting for a person, esperar a is common.' },
  },
  'lost-property': {
    explanation: 'Say what happened, what you are looking for, and what you could not find. Reuse the same semantic object in different verbs.',
    caution: 'For an official loss report you may need more precise identity details beyond this minimal inventory.',
    de: { recipe: 'Ich habe + noun + verloren / Ich suche + noun', detail: 'Verloren is the irregular past participle of verlieren. A second sentence can say what you are doing now: Ich suche einen Reisepass.' },
    fr: { recipe: 'J’ai perdu + noun / Je cherche + noun', detail: 'Perdre has past participle perdu. Keep the direct object after the participle; use chercher for the search.' },
    es: { recipe: 'Perdí + noun / Busco + noun', detail: 'Perder has a completed past form perdí for I lost. A separate present sentence describes the search now.' },
  },
  'travel-delays': {
    explanation: 'Use movement, waiting, time, and location. A short description of a delay can be understood without complex syntax.',
    caution: 'Timetables, platform changes and rapid announcements may still be hard to understand; ask for repetition.',
    de: { recipe: 'Ich warte auf den Bus / Ich bin gestern weggegangen', detail: 'Warten auf takes accusative; many movement verbs form Perfekt with sein. A separable prefix rejoins the participle.' },
    fr: { recipe: 'J’attends un bus / Je suis parti hier', detail: 'Movement verbs can take être in passé composé. Partir has parti; with a feminine speaker the participle is partie.' },
    es: { recipe: 'Espero un autobús / Salí ayer', detail: 'Use esperar for waiting and salir for leaving. Past salí and future voy a salir are productive patterns.' },
  },
  'more-past': {
    explanation: 'Once you know one past construction, many new events become possible without new sentence templates.',
    caution: 'Real languages have more than one past tense. MVL teaches a dependable limited contrast, not every narrative nuance.',
    de: { recipe: 'haben/sein + participle; short states: war / hatte', detail: 'Ich habe gelesen, ich habe geschrieben and ich bin zurückgekommen share auxiliary + participle. Movement selects sein.' },
    fr: { recipe: 'avoir/être + participle; states: imparfait', detail: 'J’ai lu, j’ai écrit and je suis revenu share one completed past system. A state such as j’étais fatigué uses imperfect.' },
    es: { recipe: 'Completed past: pretérito; continuing state: imperfecto', detail: 'Leí, escribí and volví refer to completed actions. Tenía and estaba are useful for ongoing past states.' },
  },
  'more-future': {
    explanation: 'Reuse the future operator with different subjects, objects, and time markers to communicate personal plans.',
    caution: 'Plans can change; future meaning in this manual generally assumes an intended event, not a promise or guarantee.',
    de: { recipe: 'Present verb + time in the future', detail: 'Morgen, nächste Woche or nächsten Monat usually makes the present unambiguously future-facing. You can postpone werden.' },
    fr: { recipe: 'aller (present) + infinitive + future time', detail: 'Je vais signer, je vais envoyer, nous allons travailler. The second verb stays in the infinitive.' },
    es: { recipe: 'ir (present) + a + infinitive', detail: 'Voy a enviar, voy a cancelar, vamos a trabajar. Add mañana or el mes que viene to place the plan in time.' },
  },
  stories: {
    explanation: 'Two or three independent sentences are enough to give a sequence: what happened, what is happening, and what you will do.',
    caution: 'A fluent narrative has richer connections, but this deliberately restricted structure is a reliable starting point.',
    de: { recipe: 'Gestern habe/bin ... . Heute ... . Morgen ... .', detail: 'Keep every sentence as a main clause; German finite-verb-second word order remains unchanged across sentences.' },
    fr: { recipe: 'Hier j’ai/je suis ... . Aujourd’hui ... . Demain je vais ... .', detail: 'Completed events use passé composé. For future plans use je vais + infinitive. A story can be several very short sentences.' },
    es: { recipe: 'Ayer + completed past. Hoy + present. Mañana + ir a.', detail: 'Use pretérito for yesterday, present for now, and ir a + infinitive for plans. No subordination is required.' },
  },
  'independent-life': {
    explanation: 'Combine the small rules across new topics without rebuilding the sentence from a phrasebook entry.',
    caution: 'A2-like productive coverage does not guarantee A2 proficiency. You must also practice understanding real speech and written texts.',
    de: { recipe: 'Person + action + object + optional time, NOT, CAN, reason', detail: 'After the core patterns are learned, swapping nouns and verbs is a question of semantic compatibility and a few irregular inflections.' },
    fr: { recipe: 'Subject + verb + object; add time, question, negation', detail: 'Notice which parts are reusable and which depend on French: articles, elision, negation, and compound past auxiliaries.' },
    es: { recipe: 'Conjugated verb + object; add time, modality or reason', detail: 'Spanish often omits subject pronouns. A few irregular past forms and the ser/estar distinction are the main additional costs.' },
  },
};

function compiledNotes(code: LanguageProfile['code']): Partial<Record<LessonId, LessonNotes>> {
  const notes: Partial<Record<LessonId, LessonNotes>> = {};
  for (const id of Object.keys(RULES) as ExtensionLessonId[]) {
    const rule = RULES[id];
    const local = rule[code];
    notes[id] = {
      recipe: local.recipe,
      explanation: rule.explanation,
      detail: local.detail,
      caution: rule.caution,
    };
  }
  return notes;
}

export const EXTENSION_NOTES: Readonly<
  Record<LanguageProfile['code'], Readonly<Partial<Record<LessonId, LessonNotes>>>>
> = {
  de: compiledNotes('de'),
  fr: compiledNotes('fr'),
  es: compiledNotes('es'),
};
