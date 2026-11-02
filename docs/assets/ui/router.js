import { CURRICULUM } from '../learning/curriculum.js';
import { getLanguage } from './state.js';
function isLanguageCode(value) {
    return value === 'de' || value === 'fr' || value === 'es';
}
function isLessonId(value) {
    return CURRICULUM.some((lesson) => lesson.id === value);
}
/** Hash URLs work directly on GitHub Pages: no server-side rewrite required. */
export function currentRoute() {
    const [first, second, third] = location.hash.replace(/^#\/?/, '').split('/');
    if (!first || first === 'home')
        return { page: 'home' };
    if (first === 'framework')
        return { page: 'framework' };
    if (isLanguageCode(first)) {
        if (second === 'lesson' && isLessonId(third)) {
            return { page: 'lesson', code: first, lesson: third };
        }
        if (second === 'builder' || second === 'practice' || second === 'reference') {
            return { page: second, code: first };
        }
        return { page: 'start', code: first };
    }
    return { page: 'start', code: getLanguage() };
}
export function href(code, page) {
    return `#${code}/${page}`;
}
