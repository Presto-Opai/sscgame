// save.js — LocalStorage persistence for Codex Descending

const SaveSystem = (() => {
    const PREFIX = 'codex_descending_';

    function save(key, data) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Save failed:', e);
            return false;
        }
    }

    function load(key) {
        try {
            const data = localStorage.getItem(PREFIX + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Load failed:', e);
            return null;
        }
    }

    function remove(key) {
        try {
            localStorage.removeItem(PREFIX + key);
        } catch (e) {
            console.warn('Remove failed:', e);
        }
    }

    function clearAll() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(PREFIX)) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            console.warn('Clear failed:', e);
        }
    }

    function hasSave(key) {
        return localStorage.getItem(PREFIX + key) !== null;
    }

    function getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(PREFIX)) {
                keys.push(k.substring(PREFIX.length));
            }
        }
        return keys;
    }

    return { save, load, remove, clearAll, hasSave, getAllKeys };
})();
