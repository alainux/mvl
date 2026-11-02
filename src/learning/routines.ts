import type { LanguageProfile } from '../core/model.js';
import type { RoutineId } from './types.js';

/**
 * Social formulas are stored as complete chunks on purpose.
 * Greetings and conventional politeness are not safely derivable from the
 * small productive event grammar. Each locale supplies its own established form.
 */
export const ENGLISH_CONVENTIONS: Readonly<Record<RoutineId, string>> = {
  hello: 'Hello.',
  good_morning: 'Good morning.',
  goodbye: 'Goodbye.',
  thank_you: 'Thank you.',
  you_are_welcome: 'You are welcome.',
  excuse_me: 'Excuse me.',
  yes: 'Yes.',
  no: 'No.',
  slowly: 'Please speak slowly.',
  learning: 'I am learning this language.',
};

export const ROUTINES: Readonly<Record<LanguageProfile['code'], Readonly<Record<RoutineId, string>>>> = {
  de: {
    hello: 'Hallo.',
    good_morning: 'Guten Morgen.',
    goodbye: 'Auf Wiedersehen.',
    thank_you: 'Danke.',
    you_are_welcome: 'Gern geschehen.',
    excuse_me: 'Entschuldigung.',
    yes: 'Ja.',
    no: 'Nein.',
    slowly: 'Sprechen Sie bitte langsam.',
    learning: 'Ich lerne Deutsch.',
  },
  fr: {
    hello: 'Bonjour.',
    good_morning: 'Bonjour.',
    goodbye: 'Au revoir.',
    thank_you: 'Merci.',
    you_are_welcome: 'Je vous en prie.',
    excuse_me: 'Excusez-moi.',
    yes: 'Oui.',
    no: 'Non.',
    slowly: 'Parlez lentement, s’il vous plaît.',
    learning: 'J’apprends le français.',
  },
  es: {
    hello: 'Hola.',
    good_morning: 'Buenos días.',
    goodbye: 'Adiós.',
    thank_you: 'Gracias.',
    you_are_welcome: 'De nada.',
    excuse_me: 'Disculpe.',
    yes: 'Sí.',
    no: 'No.',
    slowly: 'Hable más despacio, por favor.',
    learning: 'Estoy aprendiendo español.',
  },
};
