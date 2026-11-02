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
