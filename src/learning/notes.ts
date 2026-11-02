import type { LanguageProfile } from '../core/model.js';
import type { LessonId, LessonNotes } from './types.js';

/**
 * Grammatical explanations are authored; sentence examples are not.
 *
 * Each implementation teaches its smallest reliable way to express the
 * shared communication goal. This is intentionally NOT a full grammar.
 */
export const NOTES: Readonly<
  Record<LanguageProfile['code'], Readonly<Partial<Record<LessonId, LessonNotes>>>>
> = {
  de: {
    'first-words': {
      recipe: 'Polite formula → short statement → question.',
      explanation: 'Learn greetings and thanks as conventional units. Make new statements with subject + conjugated verb + rest.',
      detail: 'Sie is the formal you, suitable for a shop, workplace or unfamiliar person. Sie usually takes the same verb form as wir: Sie haben, wir haben.',
      caution: 'The guide focuses on production, not understanding every reply. Ask for slower speech when needed.',
    },
    identity: {
      recipe: 'ich / Sie / wir / er + verb + complement',
      explanation: 'The subject identifies who performs an action. In a normal statement the conjugated verb comes second.',
      detail: 'A small set of high-frequency forms goes a long way: ich bin, Sie sind, wir sind, er ist; ich wohne, Sie wohnen. Learn adjectives such as müde and bereit without adjective endings after sein.',
      caution: 'The ordinary word order is subject + finite verb + rest. When a time word comes first, the finite verb still comes second.',
    },
    needs: {
      recipe: 'Ich brauche / habe / möchte + noun phrase',
      explanation: 'A reusable verb takes many interchangeable objects. Memorize noun gender as part of each noun, not a separate article chart.',
      detail: 'German changes the article of many masculine objects: ein Termin → einen Termin, ein Kaffee → einen Kaffee. Neuter ein Ticket and feminine eine Frage are unchanged in the accusative. Two objects use zwei + plural.',
      caution: 'Do not add ein to mass nouns such as Wasser, Geld or Zeit in these constructions.',
    },
    questions: {
      recipe: 'Finite verb + subject + rest + ?',
      explanation: 'Make a yes/no question by moving the finite verb to the front. This rule also works with the past auxiliary and modal verbs.',
      detail: 'Wo ist …? asks for a location; Wie viel kostet …? asks for a price. These two question families are useful enough to learn separately.',
      caution: 'There is no equivalent of English do in ordinary German yes/no questions.',
    },
    negation: {
      recipe: 'nicht (action/state) / kein + noun',
      explanation: 'Use nicht for a verb or state. Use forms of kein when saying that you do not have, need or buy an indefinite thing.',
      detail: 'Examples of the noun pattern: kein Ticket, keine Zeit, keinen Termin. These follow the same gender and case distinctions as ein. Nicht often stands before the last infinitive or after an adjective.',
      caution: 'Nicht and kein are not interchangeable. Learn the highest-frequency noun chunks first.',
    },
    places: {
      recipe: 'Wo ist …? / Ich gehe + direction / Ich bleibe + location.',
      explanation: 'Movement and position are different roles; learn the destination phrase as a reusable unit.',
      detail: 'Use nach Hause when going home, but zu Hause when staying at home. Typical destinations include zum Bahnhof, zur Apotheke, ins Büro and ins Krankenhaus.',
      caution: 'German prepositions choose cases. Our profile packages common places with their prepositions to postpone that bigger system.',
    },
    routines: {
      recipe: 'Subject + present-tense verb + object.',
      explanation: 'The present tense covers everyday routines: work, learn, eat, drink, take transport and speak a language.',
      detail: 'An infinitive usually ends in -en. With ich, the present often ends in -e; with Sie/wir, it resembles the infinitive. Frequent verbs such as essen, nehmen and sprechen are irregular for er.',
      caution: 'Do not expect every verb to conjugate regularly. Memorize the few common irregular verbs the guide actually uses.',
    },
    ability: {
      recipe: 'Ich kann + ... + infinitive. / Können Sie ... ?',
      explanation: 'The modal können is conjugated; the main verb stays at the end in the infinitive. Add bitte to make a request courteous.',
      detail: 'A reliable request is Können Sie mir bitte helfen? Here mir is dative because helfen selects a dative recipient. The same skeleton works with kommen, warten, bezahlen and anrufen.',
      caution: 'Do not conjugate both verbs. After können, use helfen rather than helfe.',
    },
    obligation: {
      recipe: 'Ich will / muss + ... + infinitive.',
      explanation: 'Wollen expresses intention; müssen expresses obligation. They share the same final-infinitive structure as können.',
      detail: 'Short independent statements are enough: Ich muss heute arbeiten. Ich will morgen zum Bahnhof gehen. When asking a stranger for an item, ich möchte is softer than ich will.',
      caution: 'Negated müssen does not necessarily mean must not. Ich muss nicht often means do not have to.',
    },
    'present-time': {
      recipe: 'Subject + finite verb + heute/jetzt + rest.',
      explanation: 'Time is added to a sentence without changing its basic grammatical structure.',
      detail: 'Heute is today and jetzt is now. In a simple main clause the finite verb stays second regardless of whether the time expression appears early or late.',
      caution: 'German morgen (tomorrow) is lowercase. Morgen (morning) is a noun.',
    },
    past: {
      recipe: 'Ich habe + ... + Partizip II. / Ich hatte ... / Ich war ...',
      explanation: 'For completed spoken events, Perfekt is the high-utility past: a present form of haben/sein plus the past participle at the end.',
      detail: 'Regular verbs often have ge-...-t: gekauft, gearbeitet. Others must be memorized: getrunken, gegessen, genommen. For past states, war and hatte are short and natural.',
      caution: 'Not every participle uses ge-. Many verbs with inseparable prefixes use forms such as verstanden or bezahlt.',
    },
    'past-movement': {
      recipe: 'Ich bin + ... + gegangen/gekommen/angekommen.',
      explanation: 'Many movement and change-of-location verbs use sein rather than haben in the Perfekt.',
      detail: 'Ich bin gestern zum Bahnhof gegangen. The finite auxiliary comes second; the participle ends the clause. Past telephone calls use haben: Ich habe Sie angerufen.',
      caution: 'Do not translate English have mechanically. In this system, movement selects sein but ordinary actions select haben.',
    },
    future: {
      recipe: 'Present tense + morgen / nächste Woche / bald.',
      explanation: 'Everyday German frequently expresses a planned future with the present tense and an unambiguous time expression.',
      detail: 'Ich gehe morgen ins Büro and Wir arbeiten nächste Woche are complete, normal future-oriented sentences. You can postpone the werden + infinitive future form.',
      caution: 'Without a time marker, present tense may not communicate future meaning. The compiler supplies bald when none is given.',
    },
    plans: {
      recipe: 'Today: present → Yesterday: Perfekt → Tomorrow: present + time.',
      explanation: 'Keep the event and its object fixed and change only the temporal operator. This is the core of a usable narrative system.',
      detail: 'Notice which verbs select habe and which select bin. Compare these patterns as grammar, not three unrelated phrases.',
      caution: 'Full German past narrative style involves additional forms, but you do not need them for basic past conversations.',
    },
    people: {
      recipe: 'Subject + verb + recipient (mir / Ihnen / uns / ihm).',
      explanation: 'The person performing an action and the person receiving it are separate semantic slots.',
      detail: 'Helfen requires the dative: mir, Ihnen, uns, ihm. Anrufen takes an accusative object: mich, Sie, uns, ihn; it is separable in the present (ich rufe Sie an), but zusammen in the infinitive (anrufen).',
      caution: 'Learn the case required by the verb, not just a translated pronoun.',
    },
    shopping: {
      recipe: 'Ich möchte … / Ich brauche zwei … / Wie viel kostet …?',
      explanation: 'Reuse nouns, quantities and the same two question patterns across different goods and services.',
      detail: 'Zwei + plural avoids indefinite article endings. With card is mit Karte, cash is bar. Prices use a nominative subject: ein Ticket kostet, not einen Ticket kostet.',
      caution: 'One coffee is einen Kaffee as an object, but ein Kaffee as the subject of kostet.',
    },
    problems: {
      recipe: 'Ich bin krank. Ich kann heute nicht kommen.',
      explanation: 'Two short correct statements communicate a problem. Avoid subordinate clauses until you actually need them.',
      detail: 'A state uses sein + adjective; an inability uses können + nicht + infinitive. You can attach a reason to connect them without changing the construction.',
      caution: 'A short message can be perfectly appropriate even without complex grammar or stylistic variety.',
    },
    reasons: {
      recipe: 'Independent clause + denn + independent clause.',
      explanation: 'For a straightforward reason, denn is the simple option: both clauses retain ordinary main-clause word order.',
      detail: 'Ich kann nicht kommen, denn ich bin krank. Unlike weil, denn does not send the conjugated verb to the end of the reason clause.',
      caution: 'Denn is slightly more formal than conversational weil, but it stays understandable and grammatically simple.',
    },
    'small-story': {
      recipe: 'Gestern … . Heute … . Morgen … .',
      explanation: 'Three short independent sentences can report a past event, explain today, and set up tomorrow.',
      detail: 'Use Perfekt for yesterday’s action, present for today, and present with a future marker for tomorrow. The same verb-and-object blocks are reused.',
      caution: 'This is a production strategy, not a claim that authentic German never uses longer sentences.',
    },
    combine: {
      recipe: 'Who? + What? + When? + Not? + Can/Must? + Reason?',
      explanation: 'Choose a small number of independent building blocks. The grammar adapts them into a correct, direct sentence.',
      detail: 'For longer messages, prefer two or three short sentences to a complex subordinate construction. You can state a need, give a time and ask a question with no new grammar.',
      caution: 'The manual teaches a deliberate expressive subset, not every natural alternative or full A2 reception and listening.',
    },
  },
  fr: {
    'first-words': {
      recipe: 'Bonjour. / Merci. / Excusez-moi.',
      explanation: 'Memorize basic social conventions, but build productive sentences from subjects, verbs and complements.',
      detail: 'Vous is the formal you. Our production subset uses it consistently for polite communication, even with one person.',
      caution: 'Some social formulas do not have a fully productive derivation. That is a documented exception, not the main learning method.',
    },
    identity: {
      recipe: 'Je / vous / nous / il + verb + complement.',
      explanation: 'French statements usually keep the subject explicitly before a conjugated verb.',
      detail: 'The core être forms are je suis, vous êtes, nous sommes, il est. French adjectives may agree in gender and number. The default model prints masculine forms for je and singular formal vous.',
      caution: 'A feminine speaker normally adds -e to adjectives such as fatigué → fatiguée. Do not treat one default form as universal.',
    },
    needs: {
      recipe: 'J’ai besoin de ... / J’ai ... / Je voudrais ...',
      explanation: 'Needing something uses avoir besoin de. Wanting something politely uses je voudrais.',
      detail: 'For count nouns, un/une depends on grammatical gender: un billet, une chambre. For mass nouns, French often uses du/de la/de l’, such as de l’eau. Deux + plural removes the article.',
      caution: 'The de in avoir besoin de changes with the following sound: besoin d’un billet, besoin d’eau.',
    },
    questions: {
      recipe: 'Est-ce que + ordinary statement + ?',
      explanation: 'Instead of learning several inversion patterns, turn a statement into a question with est-ce que.',
      detail: 'Où est ... ? asks for a place, and Combien coûte ... ? asks for price. These question forms can be reused with many nouns.',
      caution: 'In ordinary writing a space normally precedes the French question mark.',
    },
    negation: {
      recipe: 'ne/n’ + finite verb + pas',
      explanation: 'Written French negation surrounds the finite verb group. The same rule works with present, past auxiliaries and future helpers.',
      detail: 'Use n’ before a vowel: je n’ai pas, but je ne comprends pas. In a simple negative possession, un billet becomes de billet.',
      caution: 'Spoken French often drops ne, but the guide retains it for predictable standard written forms.',
    },
    places: {
      recipe: 'Où est ... ? / Je vais ... / Je reste ...',
      explanation: 'A destination is a distinct semantic slot; its article and preposition are handled by the language.',
      detail: 'Common destinations are à la gare, à l’hôpital, au bureau and chez moi. For staying, use a location rather than a direction.',
      caution: 'Do not translate English to as a single fixed French preposition.',
    },
    routines: {
      recipe: 'Je / vous / nous + present verb + object.',
      explanation: 'Present tense handles routine actions. The realizer applies the correct conjugated form to the shared event.',
      detail: 'French uses different forms for je, vous, nous and il. A compact first pass memorizes high-frequency forms like je travaille, vous travaillez, nous travaillons.',
      caution: 'French present-tense spelling and pronunciation do not always correspond one-to-one.',
    },
    ability: {
      recipe: 'Je peux + infinitive. / Est-ce que vous pouvez ... ?',
      explanation: 'Pouvoir expresses ability or permission. The next action remains an infinitive.',
      detail: 'For help, French uses object pronouns: pouvez-vous m’aider becomes est-ce que vous pouvez m’aider in our no-inversion profile.',
      caution: 'With modal verbs the object pronoun goes just before the infinitive: je peux vous aider.',
    },
    obligation: {
      recipe: 'Je veux / je dois + infinitive.',
      explanation: 'Vouloir expresses desire and devoir expresses an obligation. Both accept an infinitive action.',
      detail: 'Je dois travailler and je veux aller both reuse the same finite-plus-infinitive structure.',
      caution: 'Je voudrais is normally more courteous than je veux when asking for a product or service.',
    },
    'present-time': {
      recipe: 'Subject + finite verb + ... + aujourd’hui/maintenant.',
      explanation: 'Time adverbs locate a familiar event without requiring another tense.',
      detail: 'Aujourd’hui means today, maintenant means now. The simple guide places these toward the end of the clause.',
      caution: 'Other placements are possible in authentic French; our placement is intentionally predictable.',
    },
    past: {
      recipe: 'J’ai + past participle. / J’avais ... / J’étais ...',
      explanation: 'Use passé composé to report a completed action: an auxiliary plus a past participle. Common past states use the imparfait.',
      detail: 'J’ai acheté, j’ai travaillé and j’ai compris use avoir. Past possession uses j’avais and past states use j’étais; these are short high-utility imperfect forms.',
      caution: 'Passé composé and imparfait express different perspectives. This guide teaches a narrow completed-event versus background-state distinction.',
    },
    'past-movement': {
      recipe: 'Je suis + allé/venu/arrivé/resté.',
      explanation: 'Common movement and change-of-state verbs use être in the passé composé.',
      detail: 'Je suis allé à la gare, but j’ai appelé. With être, the past participle usually agrees with the subject.',
      caution: 'A feminine speaker says allée, venue, arrivée or restée. The generated default masculine form is a starting convention.',
    },
    future: {
      recipe: 'Je vais / vous allez / nous allons + infinitive.',
      explanation: 'The futur proche is a simple, natural way to describe an imminent plan. It avoids the full future-tense endings.',
      detail: 'Use aller in the present plus an infinitive: je vais travailler demain, nous allons acheter ... demain.',
      caution: 'A modal such as pouvoir can stay in the present with a future time word. This keeps the minimal pattern small.',
    },
    plans: {
      recipe: 'Présent → passé composé → aller + infinitive.',
      explanation: 'An event can be viewed as current, completed, or planned by changing one temporal operator.',
      detail: 'Compare a conjugated present verb, an auxiliary plus participle, and futur proche. These mechanisms are shared by many verbs.',
      caution: 'For ongoing states, French often uses the imparfait instead of passé composé.',
    },
    people: {
      recipe: 'Subject + object pronoun + finite verb.',
      explanation: 'French object pronouns normally appear before the finite verb, but before an infinitive after a modal or near-future auxiliary.',
      detail: 'Je vous aide, je vous ai aidé, je vais vous aider and je peux vous aider all express the same recipient with a different verb group.',
      caution: 'The person receiving help is not automatically a noun after the verb; clitic placement is part of the construction.',
    },
    shopping: {
      recipe: 'Je voudrais ... / deux + plural / Combien coûte ... ?',
      explanation: 'Reuse the same small family of nouns, questions and quantities to make many transactions.',
      detail: 'One book is un livre; two books is deux livres. To pay by card, use par carte; for cash, en espèces.',
      caution: 'The number changes noun morphology and eliminates the singular indefinite article.',
    },
    problems: {
      recipe: 'Je suis malade. Je ne peux pas venir.',
      explanation: 'Short statements about a state and an inability are enough to explain a practical problem.',
      detail: 'Negate pouvoir with ne ... pas around the finite modal: je ne peux pas travailler. State words may need gender agreement.',
      caution: 'Avoid translating a German weil construction word for word. Start with independent clauses.',
    },
    reasons: {
      recipe: 'Independent clause + parce que + reason.',
      explanation: 'The reason can remain a simple subject–verb clause after parce que.',
      detail: 'A short cause is sufficient to explain a change of plan. Unlike German, French has no verb-final restructuring here.',
      caution: 'Parce que becomes parce qu’ before a vowel: this mini-profile avoids that edge by using simple state reasons.',
    },
    'small-story': {
      recipe: 'Hier ... . Aujourd’hui ... . Demain ... .',
      explanation: 'Report a past activity, describe the current situation, and say what you will do next.',
      detail: 'Completed event: passé composé. Present situation: présent. Plan: aller + infinitive. Three compact clauses form a useful narrative.',
      caution: 'These examples are productive writing models, not an exhaustive treatment of aspect and narration.',
    },
    combine: {
      recipe: 'Who? + verb + object + time + negation + reason.',
      explanation: 'Choose from a limited inventory of meaningful operators. Each operator changes a rule, not a memorized translated phrase.',
      detail: 'One core can describe an obligation, a recent purchase, a future call or a reason for being unable to come.',
      caution: 'Real conversation also requires understanding varied replies; learning only production is not a full CEFR A2 course.',
    },
  },
  es: {
    'first-words': {
      recipe: 'Hola. / Gracias. / Disculpe.',
      explanation: 'Memorize a few conventional expressions. Build the rest from verbs, roles and a small shared set of operators.',
      detail: 'We use formal usted for address to strangers. Its verb endings are the same as third-person singular.',
      caution: 'This is one standard variety; Spanish-speaking regions have different everyday vocabulary and address norms.',
    },
    identity: {
      recipe: '(Yo) estoy / usted está / nosotros estamos / él está.',
      explanation: 'For temporary states and conditions use estar. Spanish can omit the subject because the conjugation often identifies it.',
      detail: 'This minimal model uses masculine adjective forms for the speaker: cansado, ocupado, listo. A feminine speaker generally uses cansada, ocupada, lista.',
      caution: 'Ser and estar have distinct uses. For simple current conditions the guide chooses estar.',
    },
    needs: {
      recipe: 'Necesito ... / Tengo ... / Quisiera ...',
      explanation: 'These are three reusable constructions for need, possession and polite preference.',
      detail: 'Countable nouns take un/una according to gender: un billete, una cita. Two uses dos + plural, without an indefinite article.',
      caution: 'Mass nouns such as agua, ayuda and dinero usually appear without un/una here.',
    },
    questions: {
      recipe: '¿ + statement with question intonation + ?',
      explanation: 'In many simple questions, Spanish can keep ordinary word order and change punctuation and intonation.',
      detail: 'Use ¿Dónde está ...? for locations and ¿Cuánto cuesta ...? for a price. Formal usted may appear explicitly to remove ambiguity.',
      caution: 'Both an opening ¿ and closing ? are required in written Spanish questions.',
    },
    negation: {
      recipe: 'no + conjugated verb',
      explanation: 'Put no immediately before the finite verb. This works in present, past and future constructions.',
      detail: 'No tengo tiempo and no entiendo esto are simple predictable models. For negative possession, the indefinite article can often be omitted.',
      caution: 'Negation of quantities needs context: no tengo dos billetes means you do not have two, not necessarily none.',
    },
    places: {
      recipe: '¿Dónde está ...? / Voy a ... / Me quedo en ...',
      explanation: 'Motion and location have different prepositions: a for going, en for staying.',
      detail: 'Ir a la estación, ir al hotel, quedarse en casa. Al combines a + el, but not a + la.',
      caution: 'Do not use en where a destination requires a. The role of the place matters.',
    },
    routines: {
      recipe: 'Subject (optional) + present verb + object.',
      explanation: 'The verb conjugation often makes a subject pronoun unnecessary. Common routines use the present.',
      detail: 'Trabajo, estudio, bebo, como. With formal usted, use the third-person form: trabaja, estudia, bebe, come.',
      caution: 'Spanish verb endings vary among -ar, -er, -ir and some high-frequency irregular verbs.',
    },
    ability: {
      recipe: 'Puedo + infinitive. / ¿Puede usted ... ?',
      explanation: 'Poder expresses ability and permission. The second verb stays in its infinitive.',
      detail: 'In ayudarme, the object pronoun is attached to the infinitive. In a simple finite verb it appears before the verb.',
      caution: 'If you attach an object pronoun to an infinitive, do not also place the same pronoun in front of that infinitive.',
    },
    obligation: {
      recipe: 'Quiero + infinitive. / Tengo que + infinitive.',
      explanation: 'Querer describes desire. Tener que describes an obligation; both are productive with other action verbs.',
      detail: 'Quiero ir, tengo que trabajar. These avoid a large collection of separate purpose-specific expressions.',
      caution: 'For polite requests for an item, quisiera is softer than quiero.',
    },
    'present-time': {
      recipe: 'Present statement + hoy / ahora.',
      explanation: 'Hoy and ahora locate an action in time without changing the verb form.',
      detail: 'For a first learning profile, placing time at the end produces correct, readable sentences.',
      caution: 'Spanish allows flexible word order; the guide deliberately chooses one stable pattern.',
    },
    past: {
      recipe: 'Past verb form + ayer / la semana pasada.',
      explanation: 'Use pretérito indefinido for completed events. Common background states are represented with imperfecto.',
      detail: 'Compré, trabajé, bebí and comí follow a few frequent past patterns. Irregular forms include fui, tuve, vine. For possession and states: tenía, estaba.',
      caution: 'Regional varieties use pretérito perfecto and indefinido with different preferences. This guide selects one clear completed-event model.',
    },
    'past-movement': {
      recipe: 'Fui / vine / llegué + time and place.',
      explanation: 'You can report a journey with one past finite verb. Spanish does not need a perfect auxiliary for the chosen completed-event pattern.',
      detail: 'Fui a la estación, vine ayer and llegué ayer. These irregular or spelling-changing forms are small, valuable exceptions to memorize.',
      caution: 'Fui is the past of both ir and ser, but the destination makes the meaning clear here.',
    },
    future: {
      recipe: 'Voy a / va a / vamos a + infinitive.',
      explanation: 'Ir a + infinitive is a very common near-future construction that works with many action verbs.',
      detail: 'Voy a trabajar mañana, vamos a comprar un billete. You do not need the synthetic future conjugations to start planning.',
      caution: 'The present tense with a future time word is also possible in Spanish; this profile consistently uses ir a.',
    },
    plans: {
      recipe: 'Present → past finite verb → ir a + infinitive.',
      explanation: 'Keep the action and object fixed while the tense operator changes the grammar.',
      detail: 'This is why a core meaning representation is useful: only tense changes, while each language supplies its own rule.',
      caution: 'Habitual or ongoing past would typically require imperfecto; that is outside most of this starter timeline.',
    },
    people: {
      recipe: 'Object pronoun + finite verb / infinitive + object pronoun.',
      explanation: 'A recipient is a semantic role; Spanish expresses that role with an object pronoun.',
      detail: 'Le ayudo, le ayudé and voy a ayudarle follow the same person relation but different placement rules.',
      caution: 'Regional preferences for direct-object le/lo and formal address vary. The examples use a small polite profile.',
    },
    shopping: {
      recipe: 'Quisiera ... / dos + plural / ¿Cuánto cuesta ... ?',
      explanation: 'Quantities, nouns and questions form an extensible transaction system.',
      detail: 'Un billete → dos billetes. With card is con tarjeta; paying cash is en efectivo.',
      caution: 'Quantity changes plural morphology and should not be memorized as a separate whole sentence.',
    },
    problems: {
      recipe: 'Estoy enfermo. No puedo venir.',
      explanation: 'An everyday problem can be communicated with one state sentence and one inability sentence.',
      detail: 'Estar + adjective reports a current condition. No + puedo + infinitive says you cannot do something.',
      caution: 'A feminine speaker should use enferma or cansada. The current generator defaults to masculine singular.',
    },
    reasons: {
      recipe: 'Independent clause + porque + reason.',
      explanation: 'Spanish reasons use porque followed by ordinary subject–verb word order.',
      detail: 'Use a simple reason such as being busy, sick or lacking time. You do not need a special subjunctive construction for these statements.',
      caution: 'Porque (because) and por qué (why?) are different expressions.',
    },
    'small-story': {
      recipe: 'Ayer ... . Hoy ... . Mañana ... .',
      explanation: 'Use one short past statement, one present situation and one near-future plan to communicate a sequence.',
      detail: 'Pretérito indefinido handles completed events; present covers now; ir a + infinitive handles next steps.',
      caution: 'Richer narration later needs aspect, imperfect past and more connectives.',
    },
    combine: {
      recipe: 'Who? + action + object + tense + no + reason.',
      explanation: 'The same limited grammatical system supports explanations, requests, reports, and plans.',
      detail: 'Think of the parts as composable units rather than a phrase list: event + person + time + polarity + modality + optional cause.',
      caution: 'This is a productive subset aimed at useful communication, not a substitute for real listening, reading or full A2 assessment.',
    },
  },
};
