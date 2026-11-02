import { CONCEPTS, OPERATORS, PREDICATES } from '../core/vocabulary.js';
import { languages } from '../languages/index.js';
import { escapeHtml, required } from './dom.js';
const TYPES = [
    { name: 'Person', example: 'speaker · addressee', description: 'Participants, not surface pronouns' },
    { name: 'Thing', example: 'help · ticket · time · this', description: 'Concepts independent of grammatical gender' },
    { name: 'Place', example: 'home · station', description: 'Destinations; each language chooses prepositions' },
    { name: 'Event', example: 'predicate + typed slots', description: 'An atomic event with agent and argument' },
    { name: 'Clause', example: 'event + operators', description: 'Modal, polarity, or temporal meaning' },
    { name: 'Question', example: 'ASK(clause)', description: 'An information-seeking speech act' },
];
/** Populate documentation tables from the same definitions used by the compiler. */
export function renderReference() {
    required('#types-grid').innerHTML = TYPES.map((type) => `
    <article class="reference-item">
      <span class="type-icon" aria-hidden="true">T</span>
      <div>
        <strong>${escapeHtml(type.name)}</strong>
        <code>${escapeHtml(type.example)}</code>
        <p>${escapeHtml(type.description)}</p>
      </div>
    </article>
  `).join('');
    required('#operators-list').innerHTML = OPERATORS.map(({ id, signature }) => `
    <div class="operator-row">
      <code>${id}</code>
      <span>${escapeHtml(signature)}</span>
    </div>
  `).join('');
    required('#predicate-table').innerHTML = Object.entries(PREDICATES).map(([id, frame]) => `
    <tr>
      <td><code>${escapeHtml(id.toUpperCase())}</code></td>
      <td>${escapeHtml(frame.description)}</td>
      <td><code>${escapeHtml(frame.argumentRole)}</code></td>
      <td>${frame.allowedArguments.map((argument) => `
        <span class="mini-tag" title="${escapeHtml(CONCEPTS[argument])}">
          ${escapeHtml(argument)}
        </span>
      `).join('')}</td>
    </tr>
  `).join('');
    required('#adapter-cards').innerHTML = languages.map(({ profile }) => `
    <article class="adapter-card">
      <div class="adapter-header">
        <span class="dot" aria-hidden="true"></span>
        <div>
          <h3>${escapeHtml(profile.name)}</h3>
          <span>${escapeHtml(profile.variety)}</span>
        </div>
        <code>${profile.code}</code>
      </div>
      <ul>${profile.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>
      <div class="adapter-bottom">
        <span>6 predicates</span>
        <span>7 operators</span>
        <span>compositional realizer</span>
      </div>
    </article>
  `).join('');
}
