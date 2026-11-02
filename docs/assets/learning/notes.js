/**
 * Explanations remain local to each language: similar communicative goals do
 * not imply identical grammatical mechanics. All are deliberately scoped to
 * the small set of constructions actually supported by the realizers.
 */
export const NOTES = {
    de: {
        'first-words': {
            recipe: 'Hallo. / Danke. / Entschuldigung.',
            explanation: 'Learn these as complete expressions. You do not need to understand endings before using them.',
            detail: 'Use Sie with strangers, staff, and people you do not know well. The guide uses formal address so its requests work in ordinary public situations.',
            caution: '“Bitte” is versatile: it can mean please, here you go, or a response to thanks. Context decides.',
        },
        needs: {
            recipe: 'Ich brauche + noun phrase. / Ich habe + noun phrase.',
            explanation: 'For “I need” use ich brauche. For “I have” use ich habe. The verb stays in the second position in simple statements.',
            detail: 'Learn ein Ticket, einen Kaffee, Wasser, and Hilfe as ready-to-use units. German articles change with the role of a noun in the sentence.',
            caution: 'Do not attach ein to every noun: Wasser and Hilfe normally have no indefinite article in these examples.',
        },
        preferences: {
            recipe: 'Ich möchte + noun phrase.',
            explanation: 'Ich möchte is a courteous way to say what you would like. It works well in shops, cafés, and at counters.',
            detail: 'The article is part of the noun phrase: einen Kaffee, ein Ticket, but simply Wasser. For a question to the listener, the verb comes first: Möchten Sie …?',
            caution: 'Ich will expresses “I want” more directly and can sound demanding as an order. Prefer ich möchte when asking for a product.',
        },
        questions: {
            recipe: 'Finite verb + Sie + rest + ?',
            explanation: 'For yes/no questions, put the conjugated verb first: Haben Sie …? Sprechen Sie …? The statement equivalent starts with the subject.',
            detail: 'Sie is the formal “you.” Its verb forms usually match the infinitive: haben, sprechen, verstehen.',
            caution: 'A question does not need a separate “do” helper in German.',
        },
        help: {
            recipe: 'Können Sie + object + bitte + infinitive?',
            explanation: 'Können Sie is a productive and courteous question starter. The action verb stays in its infinitive form at the end.',
            detail: 'Helfen requires a dative recipient: mir for “me,” Ihnen for formal “you.” This is why “help me” is mir helfen.',
            caution: 'Bitte is optional, but useful. Keep the infinitive at the end: Können Sie mir helfen?',
        },
        repair: {
            recipe: 'Ich verstehe das nicht. / Sprechen Sie bitte langsam.',
            explanation: 'Nicht is the common negative word for a verb phrase. Say plainly when you do not understand rather than guessing.',
            detail: 'The short request Sprechen Sie bitte langsam is a conventional polite imperative. Memorize it whole for now.',
            caution: 'German has two major negation strategies: nicht and kein. The negation lesson compares them.',
        },
        places: {
            recipe: 'Wo ist + place? / Ich gehe + destination.',
            explanation: 'Wo ist asks where something is. The destination expression after gehen changes depending on the place.',
            detail: 'Memorize the chunks zum Bahnhof, zum Hotel, zur Toilette, and nach Hause. Prepositions and articles are combined in these forms.',
            caution: 'Do not say “zu Hause” for motion. Nach Hause means going home; zu Hause means being at home.',
        },
        shopping: {
            recipe: 'Wie viel kostet + noun? / Kann ich mit Karte bezahlen?',
            explanation: 'Use Wie viel kostet …? to ask a price. For permission to pay, Kann ich … bezahlen? follows the same modal pattern as the help requests.',
            detail: 'Mit Karte means by card; bar means in cash. You can substitute a different noun phrase after kostet.',
            caution: 'Kaffee is masculine, so the examples use einen Kaffee as the object but ein Kaffee as the subject of kostet.',
        },
        time: {
            recipe: 'Ich + verb + heute/morgen + rest.',
            explanation: 'Heute means today; morgen means tomorrow. The finite verb remains second in statements, even when you add a time expression.',
            detail: 'Present-tense German can express a scheduled near-future action when tomorrow makes the timing clear.',
            caution: 'Morgen can also mean morning as a noun. Here it is the lowercase adverb “tomorrow.”',
        },
        negation: {
            recipe: 'nicht + action / kein + noun phrase',
            explanation: 'German distinguishes negating an action from saying you have or need none of something. Nicht typically negates actions; kein often negates indefinite noun phrases.',
            detail: 'Compare Ich verstehe das nicht with Ich habe kein Ticket. In a modal construction, nicht commonly appears before the destination or final infinitive.',
            caution: 'Kein changes like an article: kein Ticket, keine Zeit, keinen Kaffee. Learn each useful chunk rather than a full chart first.',
        },
        combine: {
            recipe: 'Entschuldigung. → Wo ist …? → Ich brauche … → Danke.',
            explanation: 'Short sentences are enough. Start politely, ask one thing at a time, and check important details.',
            detail: 'You can reuse the same few patterns across a station, hotel, supermarket, or café. These examples share predictable grammar.',
            caution: 'Understanding a short answer from a native speaker may require more vocabulary than producing the question.',
        },
    },
    fr: {
        'first-words': {
            recipe: 'Bonjour. / Merci. / Excusez-moi.',
            explanation: 'Treat greetings and politeness formulas as ready-made expressions. They do not require verb conjugation study to be useful.',
            detail: 'Bonjour works for a general daytime hello and good morning. This guide uses vous with people you do not know.',
            caution: 'French social conventions often favor a greeting before asking a question in a shop or office.',
        },
        needs: {
            recipe: 'J’ai besoin de + noun. / J’ai + noun.',
            explanation: 'French expresses “need” with the construction avoir besoin de: literally, “have need of.” J’ai is the “I have” form.',
            detail: 'De changes form before vowels: d’eau, d’aide. Learn j’ai besoin d’eau and j’ai besoin d’un billet as complete examples.',
            caution: 'Never translate English “I need” word for word as a simple invented verb conjugation.',
        },
        preferences: {
            recipe: 'Je voudrais + noun phrase.',
            explanation: 'Je voudrais is a polite, practical way to order or request something. It is softer than je veux.',
            detail: 'For example, un café and un billet take un, while water is de l’eau. A formal question to another person starts Est-ce que vous voudriez … ?',
            caution: 'Je veux can sound overly forceful when ordering. Learn je voudrais as a complete reusable pattern.',
        },
        questions: {
            recipe: 'Est-ce que + statement + ?',
            explanation: 'Put est-ce que before a statement to turn it into a yes/no question. The original subject–verb order stays the same.',
            detail: 'Est-ce que vous avez le temps ? is predictable and understandable. Spoken French also uses rising intonation, but this guide teaches one written form.',
            caution: 'Formal written French adds a space before ? and other high punctuation; the examples follow that convention.',
        },
        help: {
            recipe: 'Est-ce que vous pouvez + infinitive, s’il vous plaît ?',
            explanation: 'Vous pouvez means “you can.” Add an infinitive such as aider or répéter. Add s’il vous plaît for a courteous request.',
            detail: 'French object pronouns attach to the verb phrase: vous pouvez m’aider, and vous m’aidez without a modal. The word order differs from German.',
            caution: 'The pronoun goes before the infinitive in m’aider; it is not a separate noun after aider.',
        },
        repair: {
            recipe: 'Je ne comprends pas. / Parlez lentement, s’il vous plaît.',
            explanation: 'Formal negation surrounds the finite verb with ne … pas. The polite imperative is easier to memorize as a fixed chunk.',
            detail: 'Before a vowel, ne contracts to n’: je n’ai pas. Je becomes j’ before a vowel, but not before ne.',
            caution: 'In conversation some speakers omit ne. This guide uses complete standard written forms for consistency.',
        },
        places: {
            recipe: 'Où est + place ? / Je vais + destination.',
            explanation: 'Où est asks where something is. French destinations use different prepositions and articles.',
            detail: 'Learn à la gare, à l’hôtel, aux toilettes and chez moi as chunks. The bathroom question is plural: Où sont les toilettes ?',
            caution: 'Do not use où est with toilettes: the standard form uses the plural verb sont.',
        },
        shopping: {
            recipe: 'Combien coûte + noun ? / Je peux payer par carte ?',
            explanation: 'Combien coûte asks a price. Payer par carte is the common construction for paying by card.',
            detail: 'You can ask Est-ce que je peux payer par carte ? and respond je paie en espèces. These use the same can + infinitive pattern.',
            caution: 'Café and billet take un as singular count nouns; water normally uses de l’eau.',
        },
        time: {
            recipe: 'Subject + verb + rest + aujourd’hui/demain.',
            explanation: 'Aujourd’hui means today, demain means tomorrow. In these simple clauses, the time expression typically appears at the end.',
            detail: 'The near future can often be conveyed by the present tense plus demain. This is a restricted learning recipe, not a complete tense system.',
            caution: 'The apostrophe in aujourd’hui is part of the spelling.',
        },
        negation: {
            recipe: 'Subject + ne/n’ + verb + pas + rest.',
            explanation: 'To make a sentence negative, wrap the finite verb in ne … pas. With a vowel sound the first part becomes n’.',
            detail: 'Compare j’ai un billet with je n’ai pas de billet. French often changes un to de after negated avoir.',
            caution: 'A negative modal puts pas after the modal: je ne peux pas aller, not after aller.',
        },
        combine: {
            recipe: 'Excusez-moi. → Où est … ? → J’ai besoin de … → Merci.',
            explanation: 'Build an interaction from short, complete requests. Make one request at a time rather than joining everything into one sentence.',
            detail: 'Start with bonjour in shops, use vous and s’il vous plaît for formal courtesy, and keep your question structure consistent.',
            caution: 'Real conversations include replies and informal variants beyond this intentionally small production subset.',
        },
    },
    es: {
        'first-words': {
            recipe: 'Hola. / Gracias. / Disculpe.',
            explanation: 'These are social expressions to remember as whole units. They are useful before you learn any verb endings.',
            detail: 'This guide chooses formal usted for requests to strangers. Spanish-speaking regions differ in how often formal address is expected.',
            caution: 'Use gracias for thanks and de nada as a conventional reply; there is no need to translate them word by word.',
        },
        needs: {
            recipe: 'Necesito + object. / Tengo + object.',
            explanation: 'Necesito means I need; tengo means I have. Spanish often omits yo because the verb ending already identifies the speaker.',
            detail: 'Learn un billete, un café, agua, and ayuda. Direct objects do not normally require a German-style case ending.',
            caution: 'Do not add yo before every verb. It is optional for emphasis but usually unnecessary here.',
        },
        preferences: {
            recipe: 'Quisiera + noun phrase.',
            explanation: 'Quisiera is a polite conventional form for “I would like.” It is well suited to everyday requests.',
            detail: 'A café is un café; water is agua. The formal question ¿Quisiera un café? is an offer to the listener.',
            caution: 'Quiero is valid “I want,” but quisiera sounds less abrupt in service situations.',
        },
        questions: {
            recipe: '¿ + statement + ?',
            explanation: 'Spanish often forms a yes/no question without adding a helper word. In writing, the opening ¿ marks the question.',
            detail: 'With usted the finite verb is third-person singular: ¿Tiene tiempo? The speaker’s own verb forms end differently: tengo, necesito.',
            caution: 'Spanish subject pronouns are often omitted; including usted can add emphasis, but is not always required.',
        },
        help: {
            recipe: '¿Puede + infinitive + (object), por favor?',
            explanation: 'Puede means formal “you can.” A second verb follows in the infinitive: ayudarme, repetirme or repetir esto.',
            detail: 'In ayudarme the object me is attached to the infinitive. With a simple finite verb it goes before: me ayuda.',
            caution: '¿Usted puede ayudarme? is correct, but many speakers would naturally omit usted.',
        },
        repair: {
            recipe: 'No + verb + rest. / Hable más despacio, por favor.',
            explanation: 'Negation is direct: put no before the verb. Memorize the slower-speech request as a polite fixed expression.',
            detail: 'No entiendo esto and no hablo español apply the same negative rule to different predicates.',
            caution: 'No usually stays immediately before the verb (or an attached pronoun group).',
        },
        places: {
            recipe: '¿Dónde está + place? / Voy a + destination.',
            explanation: '¿Dónde está …? asks for a location. Voy a … says where you are going.',
            detail: 'Learn la estación, el hotel, el baño and a casa as complete chunks. Al combines a + el.',
            caution: 'The article changes by noun: la estación, but el hotel and el baño.',
        },
        shopping: {
            recipe: '¿Cuánto cuesta + noun? / ¿Puedo pagar con tarjeta?',
            explanation: '¿Cuánto cuesta …? asks for a price. Puedo pagar asks whether you can pay in a particular way.',
            detail: 'Con tarjeta is by card; en efectivo is in cash. After puedo, use the infinitive pagar.',
            caution: 'Use cuesta for a single item. Plural prices would require cuestan and are outside this starter pattern.',
        },
        time: {
            recipe: 'Verb + rest + hoy/mañana.',
            explanation: 'Hoy means today and mañana means tomorrow. You can place these at the end of a short present-tense clause.',
            detail: 'Present tense plus mañana is frequently enough for a clear near-future plan in the restricted contexts taught here.',
            caution: 'Mañana can also refer to morning; the surrounding words determine the meaning.',
        },
        negation: {
            recipe: 'No + conjugated verb + rest.',
            explanation: 'No goes immediately before the conjugated verb. The rest of the sentence can usually stay as it was.',
            detail: 'Compare tengo un billete with no tengo un billete, and puedo ir with no puedo ir.',
            caution: 'Do not put no after the finite verb as in English “do not.”',
        },
        combine: {
            recipe: 'Disculpe. → ¿Dónde está …? → Necesito … → Gracias.',
            explanation: 'Build a practical interaction from small complete sentences: greet, ask, clarify, and thank the other person.',
            detail: 'Spanish lets you omit many subject pronouns, so even longer exchanges can remain quite compact.',
            caution: 'There are major regional varieties of Spanish; this guide chooses one consistent European reference variety.',
        },
    },
};
