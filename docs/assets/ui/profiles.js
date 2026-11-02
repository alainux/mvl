import { CAPABILITIES, deriveProfile } from '../core/profile.js';
import { OPERATORS } from '../core/vocabulary.js';
import { escapeHtml, required } from './dom.js';
const DEFAULT_GOALS = ['assert', 'deny', 'ask', 'ability', 'request'];
/** Manages the profile planner without touching the expression workbench. */
export function initializeProfilePlanner() {
    const goals = new Set(DEFAULT_GOALS);
    const container = required('#capability-options');
    const checkboxes = Object.entries(CAPABILITIES).map(([id, capability]) => {
        const label = document.createElement('label');
        label.className = 'capability';
        label.innerHTML = `
      <input type="checkbox" data-goal="${escapeHtml(id)}">
      <span>
        <strong>${escapeHtml(capability.title)}</strong>
        <small>${escapeHtml(capability.description)}</small>
      </span>
    `;
        const checkbox = label.querySelector('input');
        if (!checkbox)
            throw new Error('Capability input is missing');
        const capabilityId = id;
        checkbox.checked = goals.has(capabilityId);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                goals.add(capabilityId);
            }
            else if (goals.size > 1) {
                goals.delete(capabilityId);
            }
            else {
                // A profile without any goals is intentionally undefined.
                checkbox.checked = true;
            }
            updateSummary();
        });
        return label;
    });
    container.replaceChildren(...checkboxes);
    function updateSummary() {
        const derived = deriveProfile([...goals]);
        required('#profile-count').textContent = `${derived.operators.length} / ${OPERATORS.length}`;
        required('#profile-goals').textContent =
            `${derived.goals.length} capabilities · ${derived.omitted.length} operators excluded`;
        required('#profile-ops').innerHTML = OPERATORS.map(({ id }) => {
            const selected = derived.operators.includes(id);
            return `<span class="operator-chip ${selected ? 'included' : 'excluded'}">${id}</span>`;
        }).join('');
    }
    updateSummary();
}
