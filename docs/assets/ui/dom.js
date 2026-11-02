/** Minimal DOM utilities. Missing required elements are developer errors. */
export function required(selector) {
    const element = document.querySelector(selector);
    if (!element)
        throw new Error(`Required DOM element not found: ${selector}`);
    return element;
}
/** Escape even static data, so future user-supplied vocabularies remain safe. */
export function escapeHtml(value) {
    const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}
export function option(value, label, selected) {
    const element = document.createElement('option');
    element.value = value;
    element.textContent = label;
    element.selected = selected;
    return element;
}
