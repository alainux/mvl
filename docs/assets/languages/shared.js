export const PERSON = {
    speaker: 0,
    addressee: 1,
    we: 2,
    other: 3,
};
export function form(forms, person) {
    return forms[PERSON[person]];
}
export function words(...parts) {
    return parts.filter(Boolean).join(' ');
}
export function capitalize(value) {
    return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
export function finish(text, question, inverted = false) {
    return `${inverted && question ? '¿' : ''}${capitalize(text)}${question ? '?' : '.'}`;
}
export function timeWord(time, map) {
    return time === null ? '' : map[time];
}
/** Remove end punctuation before joining two independently realized clauses. */
export function bare(sentence) {
    return sentence.replace(/[.!?]$/u, '').replace(/^¿/u, '');
}
