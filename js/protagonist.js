// protagonist.js — Elua's persistent state across all levels
// Named after the god Scott invokes at the end of "Meditations on Moloch"
// The god of flowers, free love, art, science, philosophy, and all soft human things

const Protagonist = (() => {
    const MAX_HUMANITY = 100;

    // Default state
    function createDefault() {
        return {
            humanity: 80,
            maxHumanity: MAX_HUMANITY,
            insights: [],       // Collected essay insights (one per level)
            scars: [],          // Visual changes from compromises
            levelsCompleted: [],
            totalOptimizations: 0,
            totalConnections: 0,
            appearance: 'bright' // 'bright', 'crystalline', 'scarred'
        };
    }

    let state = createDefault();

    function load() {
        const saved = SaveSystem.load('protagonist');
        if (saved) {
            state = { ...createDefault(), ...saved };
        }
        return state;
    }

    function save() {
        updateAppearance();
        SaveSystem.save('protagonist', state);
    }

    function reset() {
        state = createDefault();
        save();
    }

    function getState() {
        return state;
    }

    // Humanity management
    function changeHumanity(amount) {
        state.humanity = Math.max(0, Math.min(state.maxHumanity, state.humanity + amount));
        return state.humanity;
    }

    function getHumanity() {
        return state.humanity;
    }

    // Insight collection
    function addInsight(levelNum, text) {
        const existing = state.insights.find(i => i.level === levelNum);
        if (!existing) {
            state.insights.push({ level: levelNum, text, timestamp: Date.now() });
        }
        return state.insights;
    }

    function hasInsight(levelNum) {
        return state.insights.some(i => i.level === levelNum);
    }

    function getInsights() {
        return [...state.insights];
    }

    // Scars from compromises
    function addScar(description) {
        state.scars.push({ description, timestamp: Date.now() });
    }

    // Level completion
    function completeLevel(levelNum, ending) {
        if (!state.levelsCompleted.includes(levelNum)) {
            state.levelsCompleted.push(levelNum);
        }
        save();
    }

    function isLevelCompleted(levelNum) {
        return state.levelsCompleted.includes(levelNum);
    }

    // Track optimization vs connection choices
    function recordOptimization() {
        state.totalOptimizations++;
    }

    function recordConnection() {
        state.totalConnections++;
    }

    // Visual appearance based on choices
    function updateAppearance() {
        const ratio = state.totalConnections / Math.max(1, state.totalOptimizations + state.totalConnections);
        if (ratio > 0.6 && state.scars.length < 3) {
            state.appearance = 'bright';
        } else if (state.totalOptimizations > state.totalConnections * 2) {
            state.appearance = 'crystalline';
        } else {
            state.appearance = 'scarred';
        }
    }

    function getAppearance() {
        updateAppearance();
        return state.appearance;
    }

    // Draw Elua on canvas
    function drawElua(ctx, x, y, size = 30) {
        const appearance = getAppearance();
        const time = Date.now() / 1000;
        const glow = Math.sin(time * 2) * 0.2 + 0.8;

        ctx.save();

        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, size * 0.2, x, y, size * 1.5);

        if (appearance === 'bright') {
            gradient.addColorStop(0, `rgba(255, 215, 100, ${glow * 0.6})`);
            gradient.addColorStop(0.5, `rgba(255, 180, 50, ${glow * 0.2})`);
            gradient.addColorStop(1, 'rgba(255, 150, 30, 0)');
        } else if (appearance === 'crystalline') {
            gradient.addColorStop(0, `rgba(150, 200, 255, ${glow * 0.6})`);
            gradient.addColorStop(0.5, `rgba(100, 150, 255, ${glow * 0.2})`);
            gradient.addColorStop(1, 'rgba(80, 120, 255, 0)');
        } else {
            gradient.addColorStop(0, `rgba(255, 180, 100, ${glow * 0.5})`);
            gradient.addColorStop(0.5, `rgba(200, 120, 80, ${glow * 0.2})`);
            gradient.addColorStop(1, 'rgba(180, 100, 60, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x - size * 1.5, y - size * 1.5, size * 3, size * 3);

        // Body — luminous androgynous figure
        ctx.fillStyle = appearance === 'bright' ? '#ffd764' :
                        appearance === 'crystalline' ? '#96c8ff' : '#ffb464';

        // Head
        ctx.beginPath();
        ctx.arc(x, y - size * 0.4, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.1);
        ctx.lineTo(x + size * 0.25, y - size * 0.1);
        ctx.lineTo(x + size * 0.15, y + size * 0.5);
        ctx.lineTo(x - size * 0.15, y + size * 0.5);
        ctx.closePath();
        ctx.fill();

        // Light trail
        ctx.strokeStyle = appearance === 'bright' ? 'rgba(255,215,100,0.4)' :
                          appearance === 'crystalline' ? 'rgba(150,200,255,0.4)' : 'rgba(255,180,100,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const tx = x + Math.sin(time * 3 + i) * size * 0.3;
            const ty = y + size * 0.5 + i * size * 0.15;
            if (i === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
        }
        ctx.stroke();

        // Scars (small marks on body)
        if (state.scars.length > 0) {
            ctx.strokeStyle = 'rgba(180,60,60,0.6)';
            ctx.lineWidth = 1;
            for (let i = 0; i < Math.min(state.scars.length, 5); i++) {
                const sx = x - size * 0.1 + i * size * 0.05;
                const sy = y + size * 0.1;
                ctx.beginPath();
                ctx.moveTo(sx, sy - size * 0.05);
                ctx.lineTo(sx + size * 0.05, sy + size * 0.05);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    return {
        load,
        save,
        reset,
        getState,
        changeHumanity,
        getHumanity,
        addInsight,
        hasInsight,
        getInsights,
        addScar,
        completeLevel,
        isLevelCompleted,
        recordOptimization,
        recordConnection,
        getAppearance,
        drawElua,
        MAX_HUMANITY
    };
})();
