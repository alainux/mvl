/** Browser bootstrap: keep UI wiring independent from semantic machinery. */
import { initializeProfilePlanner } from './ui/profiles.js';
import { renderReference } from './ui/reference.js';
import { initializeWorkbench } from './ui/workbench.js';
import { required } from './ui/dom.js';

renderReference();
initializeProfilePlanner();
initializeWorkbench();

document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 850px)').matches) {
      required<HTMLInputElement>('#mobile-nav').checked = false;
    }
  });
});
