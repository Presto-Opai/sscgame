/* ======================================
   CODEX DESCENDING - Save System
   LocalStorage persistence for game state
   ====================================== */

const SaveManager = {
    STORAGE_KEY: 'codex_descending_save',

    getDefault() {
        return {
            version: 1,
            levelsCompleted: [],
            insights: [],
            elua: {
                humanity: 100,
                scars: [],
                transformation: 'bright' // 'bright', 'crystalline', 'scarred'
            },
            levelData: {},
            hiddenEndings: []
        };
    },

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return this.getDefault();
            const data = JSON.parse(raw);
            // Merge with defaults so new fields are always present
            return { ...this.getDefault(), ...data };
        } catch (e) {
            console.warn('Save data corrupted, resetting:', e);
            return this.getDefault();
        }
    },

    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    },

    completeLevel(levelNum, insight, hiddenEnding) {
        const data = this.load();
        if (!data.levelsCompleted.includes(levelNum)) {
            data.levelsCompleted.push(levelNum);
        }
        if (insight && !data.insights.find(i => i.level === levelNum)) {
            data.insights.push({ level: levelNum, text: insight });
        }
        if (hiddenEnding && !data.hiddenEndings.includes(levelNum)) {
            data.hiddenEndings.push(levelNum);
        }
        this.save(data);
        return data;
    },

    updateElua(eluaState) {
        const data = this.load();
        data.elua = { ...data.elua, ...eluaState };
        this.save(data);
    },

    hasSave() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
