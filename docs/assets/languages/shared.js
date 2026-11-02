export function personIndex(participant) {
    return participant === 'speaker' ? 0 : 1;
}
/** Morphological paradigms in this prototype have two supported persons. */
export function selectForm(forms, participant) {
    return forms[personIndex(participant)];
}
export function capitalize(text) {
    return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
export function punctuate(text, analysis, inverted = false) {
    if (analysis.question) {
        return `${inverted ? '¿' : ''}${capitalize(text)}?`;
    }
    return `${capitalize(text)}.`;
}
export function timeWord(time, words) {
    return time === null ? '' : words[time];
}
/** Avoid accidental duplicate spaces in inflection and constituent assembly. */
export function words(...parts) {
    return parts.filter((part) => part.length > 0).join(' ');
}
