export const STACK_WIDTH = 10;
export const STACK_HEIGHT = 16;
export const STACK_LANES = ['agent', 'predicate', 'argument', 'tense', 'power'];
export const STACK_SHAPES = [
    [[0, 0], [1, 0], [2, 0], [3, 0]], // I
    [[0, 0], [1, 0], [0, 1], [1, 1]], // O
    [[1, 0], [0, 1], [1, 1], [2, 1]], // T
    [[0, 0], [0, 1], [1, 1], [2, 1]], // L
    [[2, 0], [0, 1], [1, 1], [2, 1]], // J
    [[0, 0], [1, 0], [1, 1], [2, 1]], // S
    [[1, 0], [2, 0], [0, 1], [1, 1]], // Z
];
export function emptyStack() {
    return Array.from({ length: STACK_HEIGHT }, () => Array(STACK_WIDTH).fill(null));
}
export function rotateStackShape(shape) {
    const rotated = shape.map(([x, y]) => [-y, x]);
    const minX = Math.min(...rotated.map(([x]) => x));
    const minY = Math.min(...rotated.map(([, y]) => y));
    return rotated.map(([x, y]) => [x - minX, y - minY]);
}
export function stackFits(board, shape, x, y) {
    return shape.every(([dx, dy]) => {
        const col = x + dx;
        const row = y + dy;
        return col >= 0 && col < STACK_WIDTH && row < STACK_HEIGHT &&
            (row < 0 || board[row]?.[col] === null);
    });
}
export function stackDropY(board, shape, x, y) {
    let destination = y;
    while (stackFits(board, shape, x, destination + 1))
        destination += 1;
    return destination;
}
export function stackLock(board, shape, x, y, lane) {
    if (!stackFits(board, shape, x, y) || shape.some(([, dy]) => y + dy < 0))
        throw new Error('Cannot lock a shape outside the stack board');
    const charged = shape.some(([dx]) => Math.floor((x + dx) / 2) === STACK_LANES.indexOf(lane));
    const next = board.map((row) => [...row]);
    for (const [dx, dy] of shape)
        next[y + dy][x + dx] = { lane, charged };
    const remaining = next.filter((row) => row.some((cell) => cell === null));
    const lines = STACK_HEIGHT - remaining.length;
    const cleared = Array.from({ length: lines }, () => Array(STACK_WIDTH).fill(null));
    return { board: [...cleared, ...remaining], charged, lines };
}
const NAME = {
    agent: 'WHO', predicate: 'ACTION', argument: 'THING', tense: 'WHEN', power: 'POWER',
};
function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
/** Mount once; all timers and global keyboard handlers are scoped to signal. */
export function mountSentenceStack(root, callbacks, signal) {
    let board = emptyStack();
    let falling = null;
    let next = null;
    let bag = [];
    let phase = 'ready';
    let visible = true;
    let score = 0;
    let cleared = 0;
    let combo = 0;
    let chargedPieces = 0;
    let best = 0;
    let lastFall = Date.now();
    let message = 'Match the falling shape to its grammar lane. Clear rows to score.';
    let sentence = callbacks.initialSentence();
    try {
        best = Math.max(0, Number(localStorage.getItem(callbacks.storageKey)) || 0);
    }
    catch { /* Storage is optional. */ }
    root.innerHTML = '<div class="stack-cabinet">' +
        '<div class="stack-topline"><span class="stack-live"><i></i> SENTENCE STACK / ARCADE</span>' +
        '<span class="stack-tophelp">ARROWS MOVE · UP ROTATES · SPACE DROPS</span></div>' +
        '<div class="stack-game-layout">' +
        '<div class="stack-screen"><div class="stack-screen-head"><span>GRAMMAR GRID</span><span id="stack-level">LVL 01</span></div>' +
        '<div class="stack-grid" id="stack-grid" role="img" aria-label="Falling block grid with five grammar lanes"></div>' +
        '<div class="stack-lanes" id="stack-lanes"></div>' +
        '<div class="stack-overlay" id="stack-overlay"><strong>DROP INTO LANGUAGE</strong><p>Each shape changes your sentence when it hits its matching lane.</p>' +
        '<button type="button" class="stack-start" data-stack-action="start">START STACK <span>▶</span></button></div></div>' +
        '<div class="stack-side">' +
        '<div class="stack-scoreboard"><div><small>SCORE</small><strong id="stack-score">00000</strong></div>' +
        '<div><small>BEST</small><strong id="stack-best">00000</strong></div></div>' +
        '<div class="stack-metrics"><span><small>LINES</small><b id="stack-lines">0</b></span>' +
        '<span><small>COMBO</small><b id="stack-combo">×0</b></span>' +
        '<span><small>LOCKED</small><b id="stack-locked">0</b></span></div>' +
        '<div class="stack-next-panel"><span class="stack-side-label">UP NEXT</span><div class="stack-next-shape" id="stack-next"></div>' +
        '<strong id="stack-next-name">READY</strong></div>' +
        '<div class="stack-piece-panel"><small>FALLING MEANING</small><strong id="stack-piece-label">—</strong>' +
        '<span id="stack-piece-target">AIM FOR A MATCHING LANE</span></div>' +
        '<div class="stack-sentence"><span class="stack-side-label">LIVE SENTENCE <i>●</i></span>' +
        '<strong id="stack-sentence" aria-live="polite"></strong>' +
        '<small id="stack-meaning"></small></div>' +
        '<p class="stack-message" id="stack-message" role="status" aria-live="polite"></p>' +
        '</div></div>' +
        '<div class="stack-footer"><div class="stack-touch-controls" aria-label="Stack controls">' +
        '<button type="button" data-stack-action="left" aria-label="Move left">←</button>' +
        '<button type="button" data-stack-action="rotate" aria-label="Rotate">↻</button>' +
        '<button type="button" data-stack-action="right" aria-label="Move right">→</button>' +
        '<button type="button" data-stack-action="down" aria-label="Soft drop">↓</button>' +
        '<button type="button" class="stack-drop" data-stack-action="drop">DROP <span>⤓</span></button>' +
        '</div><button type="button" class="stack-pause" id="stack-pause" data-stack-action="pause">PAUSE Ⅱ</button></div>' +
        '</div>';
    const grid = root.querySelector('#stack-grid');
    const overlay = root.querySelector('#stack-overlay');
    const nextGrid = root.querySelector('#stack-next');
    const pieceLabel = root.querySelector('#stack-piece-label');
    const pieceTarget = root.querySelector('#stack-piece-target');
    const messageNode = root.querySelector('#stack-message');
    const sentenceNode = root.querySelector('#stack-sentence');
    const meaningNode = root.querySelector('#stack-meaning');
    const pauseButton = root.querySelector('#stack-pause');
    root.querySelector('#stack-lanes').innerHTML =
        STACK_LANES.map((lane, i) => '<span class="stack-lane is-' + lane + '" data-lane="' + i + '">' + NAME[lane] + '</span>').join('');
    function randomFalling() {
        if (!bag.length)
            bag = shuffle(STACK_LANES);
        const lane = bag.pop();
        const shape = STACK_SHAPES[Math.floor(Math.random() * STACK_SHAPES.length)];
        return { piece: callbacks.makePiece(lane), shape, x: 3, y: 0 };
    }
    function draw() {
        const overlayCells = new Map();
        if (falling && phase !== 'over') {
            const ghostY = stackDropY(board, falling.shape, falling.x, falling.y);
            for (const [dx, dy] of falling.shape) {
                overlayCells.set((ghostY + dy) + ':' + (falling.x + dx), 'is-ghost is-' + falling.piece.lane);
            }
            for (const [dx, dy] of falling.shape) {
                overlayCells.set((falling.y + dy) + ':' + (falling.x + dx), 'is-falling is-' + falling.piece.lane);
            }
        }
        let cells = '';
        for (let row = 0; row < STACK_HEIGHT; row++) {
            for (let col = 0; col < STACK_WIDTH; col++) {
                const settled = board[row]?.[col];
                const style = settled ? 'is-locked is-' + settled.lane + (settled.charged ? '' : ' is-miss')
                    : overlayCells.get(row + ':' + col) ?? '';
                cells += '<span class="stack-cell ' + style + (col % 2 === 0 ? ' is-lane-start' : '') + '"></span>';
            }
        }
        grid.innerHTML = cells;
        grid.dataset['phase'] = phase;
        root.querySelector('#stack-score').textContent = String(score).padStart(5, '0');
        root.querySelector('#stack-best').textContent = String(best).padStart(5, '0');
        root.querySelector('#stack-lines').textContent = String(cleared);
        root.querySelector('#stack-combo').textContent = '×' + combo;
        root.querySelector('#stack-locked').textContent = String(chargedPieces);
        root.querySelector('#stack-level').textContent = 'LVL ' + String(Math.floor(cleared / 3) + 1).padStart(2, '0');
        pieceLabel.textContent = falling?.piece.label ?? '—';
        pieceTarget.textContent = falling ? 'AIM FOR ' + NAME[falling.piece.lane] + ' · ' + falling.piece.detail : 'AIM FOR A MATCHING LANE';
        nextGrid.innerHTML = next ? next.shape.map(([x, y]) => '<span class="stack-preview-cell is-' + next.piece.lane + '" style="grid-column:' + (x + 1) + ';grid-row:' + (y + 1) + '"></span>').join('') : '';
        root.querySelector('#stack-next-name').textContent = next ? NAME[next.piece.lane] : 'READY';
        sentenceNode.textContent = sentence.sentence;
        meaningNode.textContent = sentence.meaning;
        messageNode.textContent = message;
        overlay.hidden = phase === 'running';
        overlay.classList.toggle('is-paused', phase === 'paused');
        overlay.classList.toggle('is-over', phase === 'over');
        if (phase === 'ready') {
            overlay.innerHTML = '<strong>DROP INTO LANGUAGE</strong><p>Steer real grammar blocks. Complete rows. Build new sentences.</p>' +
                '<button type="button" class="stack-start" data-stack-action="start">START STACK <span>▶</span></button>';
        }
        else if (phase === 'paused') {
            overlay.innerHTML = '<strong>PAUSED</strong><p>Your stack is safe.</p>' +
                '<button type="button" class="stack-start" data-stack-action="pause">RESUME <span>▶</span></button>';
        }
        else if (phase === 'over') {
            overlay.innerHTML = '<strong>STACK OVER</strong><p>' + score + ' points · ' + cleared + ' lines. Ready for a rematch?</p>' +
                '<button type="button" class="stack-start" data-stack-action="start">PLAY AGAIN ↻</button>';
        }
        pauseButton.textContent = phase === 'paused' ? 'RESUME ▶' : 'PAUSE Ⅱ';
        pauseButton.disabled = phase === 'ready' || phase === 'over';
    }
    function recordBest() {
        if (score <= best)
            return;
        best = score;
        try {
            localStorage.setItem(callbacks.storageKey, String(best));
        }
        catch { /* High score is still visible for this run. */ }
    }
    function spawn() {
        falling = next ?? randomFalling();
        next = randomFalling();
        if (!stackFits(board, falling.shape, falling.x, falling.y)) {
            phase = 'over';
            message = 'The grid filled up. Clear more rows next time.';
            recordBest();
        }
    }
    function start() {
        board = emptyStack();
        bag = [];
        falling = null;
        next = null;
        score = cleared = combo = chargedPieces = 0;
        sentence = callbacks.initialSentence();
        message = 'Use ← → to move, ↑ to rotate, Space to drop.';
        phase = 'running';
        spawn();
        lastFall = Date.now();
        draw();
    }
    function lock() {
        if (!falling || phase !== 'running')
            return;
        const landed = stackLock(board, falling.shape, falling.x, falling.y, falling.piece.lane);
        board = landed.board;
        if (landed.charged) {
            chargedPieces++;
            sentence = callbacks.onCharge(falling.piece);
            score += 25;
            message = '✓ ' + falling.piece.label + ' locked into ' + NAME[falling.piece.lane] + '. Sentence upgraded!';
        }
        else {
            combo = 0;
            message = 'MISS! ' + falling.piece.label + ' belongs in ' + NAME[falling.piece.lane] + '.';
        }
        if (landed.lines) {
            cleared += landed.lines;
            combo += 1;
            score += [0, 100, 300, 500, 800][Math.min(4, landed.lines)] * (Math.floor(cleared / 3) + 1) * combo;
            callbacks.onClear?.(landed.lines);
            message = '✦ ' + landed.lines + (landed.lines === 1 ? ' LINE' : ' LINES') + ' CLEARED · COMBO ×' + combo + '!';
        }
        recordBest();
        spawn();
        draw();
    }
    function down() {
        if (!falling || phase !== 'running')
            return;
        if (stackFits(board, falling.shape, falling.x, falling.y + 1))
            falling.y += 1;
        else {
            lock();
            return;
        }
        draw();
    }
    function move(direction) {
        if (!falling || phase !== 'running')
            return;
        if (stackFits(board, falling.shape, falling.x + direction, falling.y))
            falling.x += direction;
        draw();
    }
    function rotate() {
        if (!falling || phase !== 'running')
            return;
        const rotated = rotateStackShape(falling.shape);
        for (const kick of [0, -1, 1, -2, 2]) {
            if (stackFits(board, rotated, falling.x + kick, falling.y)) {
                falling.shape = rotated;
                falling.x += kick;
                break;
            }
        }
        draw();
    }
    function hardDrop() {
        if (!falling || phase !== 'running')
            return;
        const destination = stackDropY(board, falling.shape, falling.x, falling.y);
        score += Math.max(0, destination - falling.y) * 2;
        falling.y = destination;
        lock();
    }
    function action(value) {
        if (value === 'start') {
            start();
            return;
        }
        if (value === 'pause') {
            if (phase === 'running')
                phase = 'paused';
            else if (phase === 'paused') {
                phase = 'running';
                lastFall = Date.now();
            }
            draw();
            return;
        }
        if (phase !== 'running')
            return;
        if (value === 'left')
            move(-1);
        else if (value === 'right')
            move(1);
        else if (value === 'rotate')
            rotate();
        else if (value === 'down') {
            score += 1;
            down();
        }
        else if (value === 'drop')
            hardDrop();
    }
    root.addEventListener('click', (event) => {
        const trigger = event.target instanceof Element ? event.target.closest('[data-stack-action]') : null;
        if (trigger && root.contains(trigger))
            action(trigger.dataset['stackAction'] ?? '');
    }, { signal });
    document.addEventListener('keydown', (event) => {
        if (phase !== 'running' || !visible || event.altKey || event.metaKey || event.ctrlKey ||
            event.repeat || event.defaultPrevented)
            return;
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement || (event.target instanceof HTMLElement && event.target.isContentEditable))
            return;
        const mapped = {
            ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
            ArrowUp: 'rotate', w: 'rotate', W: 'rotate', ArrowDown: 'down', s: 'down', S: 'down',
            ' ': 'drop',
        };
        const command = mapped[event.key];
        if (command) {
            event.preventDefault();
            action(command);
        }
        if (event.key === 'p' || event.key === 'P')
            action('pause');
    }, { signal });
    let touchX = 0;
    let touchY = 0;
    grid.addEventListener('touchstart', (event) => {
        touchX = event.changedTouches[0]?.clientX ?? 0;
        touchY = event.changedTouches[0]?.clientY ?? 0;
    }, { passive: true, signal });
    grid.addEventListener('touchend', (event) => {
        if (phase !== 'running')
            return;
        const deltaX = (event.changedTouches[0]?.clientX ?? touchX) - touchX;
        const deltaY = (event.changedTouches[0]?.clientY ?? touchY) - touchY;
        if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY))
            action(deltaX > 0 ? 'right' : 'left');
        else if (deltaY > 35)
            action('drop');
        else if (deltaY < -28)
            action('rotate');
    }, { passive: true, signal });
    const observer = typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => {
            visible = entries[0]?.isIntersecting ?? true;
            if (!visible && phase === 'running') {
                phase = 'paused';
                draw();
            }
        }, { threshold: .2 }) : null;
    observer?.observe(root);
    signal.addEventListener('abort', () => observer?.disconnect(), { once: true });
    const timer = setInterval(() => {
        if (phase !== 'running' || !visible || document.hidden)
            return;
        const speed = Math.max(170, 900 - Math.floor(cleared / 3) * 90);
        if (Date.now() - lastFall >= speed) {
            lastFall = Date.now();
            down();
        }
    }, 55);
    signal.addEventListener('abort', () => clearInterval(timer), { once: true });
    draw();
}
