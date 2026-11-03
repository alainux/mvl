import { addQuestTile, beginQuest, checkQuest, clearQuestTiles, nextQuestRound, questHint, questRounds, removeQuestTile, } from './quest-model.js';
import { recordQuestVictory } from './state.js';
export function mountQuest(guide, lesson, current, update, signal) {
    const root = document.querySelector('#quest');
    if (!root)
        return;
    const rounds = questRounds(guide, lesson);
    const round = rounds[current.round];
    const code = guide.language.code;
    function change(next) {
        if (next === current)
            return;
        if (next.phase === 'victory' && current.phase !== 'victory') {
            recordQuestVictory(code, lesson.id, (next.misses === 0 && next.hints === 0 ? 3 :
                next.misses <= 1 && next.hints <= 2 ? 2 : 1), next.score);
        }
        update(next);
    }
    function playTile(id) {
        if (!round)
            return;
        change(addQuestTile(current, round, id));
    }
    function check() {
        if (!round || current.selected.length !== round.expected.length)
            return;
        change(checkQuest(current, round));
    }
    function advance() {
        if (current.phase !== 'won')
            return;
        change(nextQuestRound(current, rounds.length));
    }
    root.querySelectorAll('[data-quest-tile]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = Number(button.dataset['questTile']);
            if (Number.isInteger(id))
                playTile(id);
        });
    });
    root.querySelectorAll('[data-quest-remove]').forEach((button) => {
        button.addEventListener('click', () => {
            const index = Number(button.dataset['questRemove']);
            if (Number.isInteger(index))
                change(removeQuestTile(current, index));
        });
    });
    root.querySelector('#quest-clear')?.addEventListener('click', () => change(clearQuestTiles(current)));
    root.querySelector('#quest-undo')?.addEventListener('click', () => change(removeQuestTile(current, current.selected.length - 1)));
    root.querySelector('#quest-check')?.addEventListener('click', check);
    root.querySelector('#quest-hint')?.addEventListener('click', () => {
        if (round)
            change(questHint(current, round));
    });
    root.querySelector('#quest-next')?.addEventListener('click', advance);
    root.querySelector('#quest-restart')?.addEventListener('click', () => change(beginQuest(code + ':' + lesson.id)));
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.defaultPrevented)
            return;
        const focus = document.activeElement;
        if (focus instanceof HTMLInputElement || focus instanceof HTMLTextAreaElement ||
            focus instanceof HTMLSelectElement || (focus instanceof HTMLElement && focus.isContentEditable))
            return;
        if (current.phase === 'won' && event.key === 'Enter') {
            event.preventDefault();
            advance();
            return;
        }
        if (current.phase !== 'play' || !round)
            return;
        if (/^[1-9]$/.test(event.key)) {
            const available = round.tiles.filter((tile) => !current.selected.includes(tile.id));
            const tile = available[Number(event.key) - 1];
            if (tile) {
                event.preventDefault();
                playTile(tile.id);
            }
        }
        else if (event.key === 'Backspace') {
            event.preventDefault();
            change(removeQuestTile(current, current.selected.length - 1));
        }
        else if (event.key === 'Enter' && current.selected.length === round.expected.length) {
            event.preventDefault();
            check();
        }
    }, { signal });
}
