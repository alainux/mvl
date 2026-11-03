/** Compare the written word, not an entire sentence. Preserve diacritics
 * (u/ü and n/ñ are different letters), but forgive case and stray punctuation. */
export function normalizeClozeAnswer(input) {
    return input.normalize('NFC').trim().toLocaleLowerCase()
        .replace(/^[\s"'“”„«»¿¡.,!?;:()[\]{}]+|[\s"'“”„«»¿¡.,!?;:()[\]{}]+$/gu, '');
}
export function matchesCloze(input, word) {
    return normalizeClozeAnswer(input) === normalizeClozeAnswer(word);
}
/** Hide a meaningful word rather than a random punctuation mark or article.
 * The chosen word is deterministic so the prompt and validator always agree. */
export function clozeFor(sentence, index, code) {
    const articles = new Set([
        'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'der', 'die', 'das', 'den', 'dem',
        'ein', 'eine', 'einen', 'einem', 'und', 'aber', 'nicht',
        'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'les', 'des', 'une', 'est',
        'yo', 'tú', 'él', 'ella', 'ellos', 'ellas', 'los', 'las', 'una', 'uno', 'soy',
    ]);
    const words = [...sentence.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}’'\-]*/gu)]
        .map((match) => ({
        word: match[0],
        start: match.index,
        length: Array.from(match[0]).length,
    }));
    if (!words.length)
        throw new Error('Cloze exercise needs a sentence with words');
    const candidates = words.filter(({ word, length }) => length >= 3 && !articles.has(word.toLocaleLowerCase()));
    const useful = candidates.length ? candidates : words.filter(({ length }) => length >= 2);
    const pool = useful.length ? useful : words;
    // Rotate the omitted word across the deck to exercise multiple grammatical roles.
    const chosen = pool[(index * 3 + (code === 'fr' ? 1 : code === 'es' ? 2 : 0)) % pool.length];
    return {
        before: sentence.slice(0, chosen.start),
        word: chosen.word,
        after: sentence.slice(chosen.start + chosen.word.length),
        length: chosen.length,
    };
}
/** Progressive optional hints never supply a different inflection. */
export function clozeHint(cloze, level) {
    const chars = Array.from(cloze.word);
    if (level === 1)
        return `${cloze.length} letters · starts with “${chars[0]}”`;
    const revealed = Math.max(1, Math.min(chars.length - 1, Math.ceil(chars.length / 2)));
    return chars.map((char, i) => i < revealed ? char : '·').join(' ');
}
