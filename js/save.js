/**
 * CODEX DESCENDING — Save System
 * LocalStorage persistence with version migration.
 */

const SaveSystem = (() => {
  const STORAGE_KEY = 'codexDescending';
  const CURRENT_VERSION = 1;

  const DEFAULT_STATE = {
    version: CURRENT_VERSION,
    currentLevel: 0,
    humanity: 100,
    insights: [null, null, null, null, null, null, null, null, null, null],
    scars: [],
    levelsCompleted: [false, false, false, false, false, false, false, false, false, false],
    levelsUnlocked: [true, false, false, false, false, false, false, false, false, false],
    levelBestScores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hiddenEndingsFound: [],
    totalPlaytime: 0,
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.7,
    },
  };

  function getDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();

      const data = JSON.parse(raw);

      // Version migration
      if (!data.version || data.version < CURRENT_VERSION) {
        return migrate(data);
      }

      return data;
    } catch (e) {
      console.warn('Save data corrupted, resetting:', e);
      return getDefaultState();
    }
  }

  function save(state) {
    try {
      state.version = CURRENT_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Failed to save:', e);
      return false;
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return getDefaultState();
  }

  function migrate(data) {
    // Future migrations go here
    // if (data.version < 2) { ... }
    const fresh = getDefaultState();
    // Preserve any valid fields from old data
    for (const key of Object.keys(fresh)) {
      if (key !== 'version' && data[key] !== undefined) {
        fresh[key] = data[key];
      }
    }
    fresh.version = CURRENT_VERSION;
    save(fresh);
    return fresh;
  }

  function completeLevel(state, levelIndex, score, insight) {
    state.levelsCompleted[levelIndex] = true;
    if (score > state.levelBestScores[levelIndex]) {
      state.levelBestScores[levelIndex] = score;
    }
    if (insight) {
      state.insights[levelIndex] = insight;
    }
    // Unlock next level
    if (levelIndex + 1 < 10) {
      state.levelsUnlocked[levelIndex + 1] = true;
    }
    save(state);
    return state;
  }

  return {
    load,
    save,
    reset,
    completeLevel,
    getDefaultState,
  };
})();
