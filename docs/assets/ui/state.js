/** Local browser state. The guide works without accounts, cookies, or a backend. */
function read(key) {
    try {
        return localStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function write(key, value) {
    try {
        localStorage.setItem(key, value);
    }
    catch {
        // Browsers may disable local storage. The guide remains usable without it.
    }
}
export function getLanguage() {
    const code = read('mvl:language');
    return code === 'fr' || code === 'es' ? code : 'de';
}
export function rememberLanguage(code) {
    write('mvl:language', code);
}
export function completedLessons(code) {
    try {
        const value = JSON.parse(read(`mvl:completed:${code}`) ?? '[]');
        return new Set(Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []);
    }
    catch {
        return new Set();
    }
}
export function setLessonCompleted(code, id, completed) {
    const current = completedLessons(code);
    if (completed)
        current.add(id);
    else
        current.delete(id);
    write(`mvl:completed:${code}`, JSON.stringify([...current]));
}
export function readNote(code, id) {
    return read(`mvl:note:${code}:${id}`) ?? '';
}
export function saveNote(code, id, value) {
    write(`mvl:note:${code}:${id}`, value);
}
export function getTheme() {
    return read('mvl:theme') === 'dark' ? 'dark' : 'light';
}
export function setTheme(theme) {
    write('mvl:theme', theme);
}
const EMPTY_STATS = { xp: 0, correct: 0, bestStreak: 0 };
export function gameStats(code) {
    try {
        const value = JSON.parse(read('mvl:game:stats:' + code) ?? 'null');
        if (value && typeof value === 'object') {
            const data = value;
            return {
                xp: typeof data['xp'] === 'number' && Number.isFinite(data['xp']) ? Math.max(0, data['xp']) : 0,
                correct: typeof data['correct'] === 'number' && Number.isFinite(data['correct']) ? Math.max(0, data['correct']) : 0,
                bestStreak: typeof data['bestStreak'] === 'number' && Number.isFinite(data['bestStreak']) ? Math.max(0, data['bestStreak']) : 0,
            };
        }
    }
    catch { /* Corrupted local data starts a fresh game. */ }
    return EMPTY_STATS;
}
export function awardXP(code, points, correct = false, streak = 0) {
    const previous = gameStats(code);
    const next = {
        xp: previous.xp + Math.max(0, Math.round(points)),
        correct: previous.correct + (correct ? 1 : 0),
        bestStreak: Math.max(previous.bestStreak, streak),
    };
    write('mvl:game:stats:' + code, JSON.stringify(next));
    return next;
}
export function cardRecalls(code) {
    try {
        const value = JSON.parse(read('mvl:game:cards:' + code) ?? '{}');
        if (!value || typeof value !== 'object' || Array.isArray(value))
            return {};
        const result = {};
        for (const [key, entry] of Object.entries(value)) {
            if (!entry || typeof entry !== 'object')
                continue;
            const data = entry;
            if (typeof data['strength'] === 'number' && typeof data['due'] === 'number')
                result[key] = { strength: Math.min(5, Math.max(0, data['strength'])), due: data['due'] };
        }
        return result;
    }
    catch {
        return {};
    }
}
export function recordCard(code, key, remembered, now = Date.now()) {
    const all = { ...cardRecalls(code) };
    const strength = remembered ? Math.min(5, (all[key]?.strength ?? 0) + 1) : 0;
    const intervals = [0, 10 * 60_000, 24 * 60 * 60_000, 3 * 24 * 60 * 60_000,
        7 * 24 * 60 * 60_000, 14 * 24 * 60 * 60_000];
    const recall = { strength, due: now + (intervals[strength] ?? 0) };
    all[key] = recall;
    write('mvl:game:cards:' + code, JSON.stringify(all));
    return recall;
}
export function dueCardCount(code, ids, now = Date.now()) {
    const recalls = cardRecalls(code);
    return ids.filter((id) => !recalls[id] || recalls[id].due <= now).length;
}
