/** Minimal DOM utilities. Missing required elements are developer errors. */
export function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required DOM element not found: ${selector}`);
  return element;
}

/** Escape even static data, so future user-supplied vocabularies remain safe. */
export function escapeHtml(value: string): string {
  const entities: Readonly<Record<string, string>> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

export function option(value: string, label: string, selected: boolean): HTMLOptionElement {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = label;
  element.selected = selected;
  return element;
}
