/** Interactions for the sentence forge. All rules live in quest-model.ts. */
import type { GeneratedGuide, GeneratedLesson } from '../learning/types.js';
import {
  addQuestTile, beginQuest, checkQuest, clearQuestTiles, nextQuestRound, questHint,
  questRounds, removeQuestTile, type QuestSession,
} from './quest-model.js';
import { recordQuestVictory } from './state.js';

export function mountQuest(
  guide: GeneratedGuide,
  lesson: GeneratedLesson,
  current: QuestSession,
  update: (state: QuestSession) => void,
  signal: AbortSignal,
): void {
  const root = document.querySelector<HTMLElement>('#quest');
  if (!root) return;
  const rounds = questRounds(guide, lesson);
  const round = rounds[current.round];
  const code = guide.language.code;

  function change(next: QuestSession): void {
    if (next === current) return;
    if (next.phase === 'victory' && current.phase !== 'victory') {
      recordQuestVictory(code, lesson.id, (
        next.misses === 0 && next.hints === 0 ? 3 :
        next.misses <= 1 && next.hints <= 2 ? 2 : 1
      ), next.score);
    }
    update(next);
  }
  function playTile(id: number): void {
    if (!round) return;
    change(addQuestTile(current, round, id));
  }
  function check(): void {
    if (!round || current.selected.length !== round.expected.length) return;
    change(checkQuest(current, round));
  }
  function advance(): void {
    if (current.phase !== 'won') return;
    change(nextQuestRound(current, rounds.length));
  }

  root.querySelectorAll<HTMLButtonElement>('[data-quest-tile]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset['questTile']);
      if (Number.isInteger(id)) playTile(id);
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-quest-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset['questRemove']);
      if (Number.isInteger(index)) change(removeQuestTile(current, index));
    });
  });
  root.querySelector<HTMLButtonElement>('#quest-clear')?.addEventListener('click', () => change(clearQuestTiles(current)));
  root.querySelector<HTMLButtonElement>('#quest-undo')?.addEventListener('click', () =>
    change(removeQuestTile(current, current.selected.length - 1)));
  root.querySelector<HTMLButtonElement>('#quest-check')?.addEventListener('click', check);
  root.querySelector<HTMLButtonElement>('#quest-hint')?.addEventListener('click', () => {
    if (round) change(questHint(current, round));
  });
  root.querySelector<HTMLButtonElement>('#quest-next')?.addEventListener('click', advance);
  root.querySelector<HTMLButtonElement>('#quest-restart')?.addEventListener('click', () =>
    change(beginQuest(code + ':' + lesson.id)));

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.defaultPrevented) return;
    const focus = document.activeElement;
    if (focus instanceof HTMLInputElement || focus instanceof HTMLTextAreaElement ||
      focus instanceof HTMLSelectElement || (focus instanceof HTMLElement && focus.isContentEditable)) return;
    if (current.phase === 'won' && event.key === 'Enter') {
      event.preventDefault(); advance(); return;
    }
    if (current.phase !== 'play' || !round) return;
    if (/^[1-9]$/.test(event.key)) {
      const available = round.tiles.filter((tile) => !current.selected.includes(tile.id));
      const tile = available[Number(event.key) - 1];
      if (tile) { event.preventDefault(); playTile(tile.id); }
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      change(removeQuestTile(current, current.selected.length - 1));
    } else if (event.key === 'Enter' && current.selected.length === round.expected.length) {
      event.preventDefault(); check();
    }
  }, { signal });
}
