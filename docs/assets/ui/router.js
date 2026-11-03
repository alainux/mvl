import { CURRICULUM } from '../learning/curriculum.js';
import { getLanguage } from './state.js';
function isLanguageCode(value) {
    return value === 'de' || value === 'fr' || value === 'es';
}
function isLessonId(value) {
    return CURRICULUM.some((lesson) => lesson.id === value);
}
/** The landing page is the level map. Legacy routes remain shareable. */
export function currentRoute() {
    const [first, second, third] = location.hash.replace(/^#\/?/, '').split('/');
    if (!first)
        return { page: 'play', code: getLanguage(), lesson: null };
    if (first === 'home')
        return { page: 'home' };
    if (first === 'framework')
        return { page: 'framework' };
    if (isLanguageCode(first)) {
        if (second === 'lesson' && isLessonId(third))
            return { page: 'lesson', code: first, lesson: third };
        if (second === 'practice' || second === 'cards' || second === 'play')
            return { page: second, code: first, lesson: isLessonId(third) ? third : null };
        if (second === 'builder' || second === 'reference')
            return { page: second, code: first };
        return { page: 'start', code: first };
    }
    return { page: 'start', code: getLanguage() };
}
export function href(code, page) {
    return '#' + code + '/' + page;
}
