/* ======================================
   CODEX DESCENDING - Game Engine
   Core loop, screen management, input,
   and shared rendering utilities
   ====================================== */

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentScreen = 'title';
        this.currentLevel = null;
        this.paused = false;
        this.lastTime = 0;
        this.protagonist = null;

        // Input state
        this.mouse = { x: 0, y: 0, down: false, clicked: false, rightClicked: false };
        this.keys = {};

        // Level registry
        this.levels = {};

        // Message queue
        this.messageQueue = [];
        this.messageShowing = false;
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.setupInput();
        this.setupMenus();

        // Check for save
        if (SaveManager.hasSave()) {
            document.getElementById('btn-continue').style.display = 'block';
        }

        // Register levels
        if (typeof Level01Moloch !== 'undefined') {
            this.levels[1] = Level01Moloch;
        }
        if (typeof Level02Outgroup !== 'undefined') {
            this.levels[2] = Level02Outgroup;
        }
        if (typeof Level03Toxoplasma !== 'undefined') {
            this.levels[3] = Level03Toxoplasma;
        }
        if (typeof Level04ControlGroup !== 'undefined') {
            this.levels[4] = Level04ControlGroup;
        }
        if (typeof Level05Commensurable !== 'undefined') {
            this.levels[5] = Level05Commensurable;
        }
        if (typeof Level06Talents !== 'undefined') {
            this.levels[6] = Level06Talents;
        }
        if (typeof Level07SecretSuccess !== 'undefined') {
            this.levels[7] = Level07SecretSuccess;
        }

        this.protagonist = new Protagonist();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // ---- Screen Management ----

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
        this.currentScreen = screenId;
    }

    setupMenus() {
        // Title screen
        document.getElementById('btn-play').addEventListener('click', () => {
            this.showScreen('level-select');
        });

        document.getElementById('btn-continue').addEventListener('click', () => {
            this.showScreen('level-select');
        });

        document.getElementById('btn-back-title').addEventListener('click', () => {
            this.showScreen('title-screen');
        });

        // Level cards
        document.querySelectorAll('.level-card.unlocked').forEach(card => {
            card.addEventListener('click', () => {
                const levelNum = parseInt(card.dataset.level);
                this.startLevel(levelNum);
            });
        });

        // Pause
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('btn-quit-level').addEventListener('click', () => {
            this.quitLevel();
        });

        // Message dismiss
        document.getElementById('message-dismiss').addEventListener('click', () => {
            this.dismissMessage();
        });

        // End screen
        document.getElementById('btn-end-menu').addEventListener('click', () => {
            this.quitLevel();
        });
    }

    // ---- Input ----

    setupInput() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.mouse.clicked = true;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.mouse.rightClicked = true;
        });

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape' && this.currentScreen === 'game-screen') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    clearInputFlags() {
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
    }

    // ---- Level Management ----

    startLevel(levelNum) {
        const LevelClass = this.levels[levelNum];
        if (!LevelClass) return;

        this.currentLevelNum = levelNum;

        // Hide all level-specific UI before starting
        this.hideAllLevelUI();

        this.showScreen('game-screen');
        this.currentLevel = new LevelClass(this);
        this.currentLevel.init();
        this.paused = false;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    quitLevel() {
        if (this.currentLevel && this.currentLevel.cleanup) {
            this.currentLevel.cleanup();
        }
        this.currentLevel = null;
        this.currentLevelNum = null;
        this.paused = false;
        document.getElementById('pause-overlay').style.display = 'none';
        document.getElementById('end-overlay').style.display = 'none';
        document.getElementById('message-overlay').style.display = 'none';
        this.hideAllLevelUI();
        this.showScreen('level-select');
    }

    hideAllLevelUI() {
        // Level 1 UI
        const l1Elements = ['ginsberg-overlay', 'dream-time-indicator', 'action-panel',
                            'coordination-panel', 'build-panel', 'top-bar'];
        for (const id of l1Elements) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
        // Level 2 UI
        const l2Elements = ['dinner-ui', 'speech-panel', 'guest-info-panel',
                            'tolerance-display', 'mirror-overlay', 'bodhidharma-overlay'];
        for (const id of l2Elements) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
        // Level 3 UI
        const l3Elements = ['network-ui', 'case-panel', 'infection-stats',
                            'chain-letter-overlay'];
        for (const id of l3Elements) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
        // Level 4 UI
        const l4Elements = ['lab-ui', 'study-panel', 'results-panel',
                            'reform-panel', 'funnel-overlay', 'bem-overlay'];
        for (const id of l4Elements) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
        // Level 5 UI
        const l5Elements = ['life-ui', 'causes-panel', 'demand-scroll',
                            'qaly-display', 'pledge-panel'];
        for (const id of l5Elements) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
        // Level 6 UI
        const l6Elements = ['talent-ui', 'task-panel', 'npc-panel',
                            'comparison-overlay', 'bargain-overlay'];
        for (const id of l6Elements) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
        // Level 7 UI
        const l7Elements = ['survival-ui', 'scenario-panel', 'tradition-panel',
                            'explorer-overlay'];
        for (const id of l7Elements) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
    }

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-overlay').style.display = this.paused ? 'flex' : 'none';
        if (!this.paused) {
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
        }
    }

    // ---- Game Loop ----

    gameLoop(timestamp) {
        if (this.paused || !this.currentLevel) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap at 100ms
        this.lastTime = timestamp;

        // Update
        this.currentLevel.update(dt);
        this.protagonist.update(dt);

        // Render
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentLevel.draw(this.ctx);

        // Clear per-frame input flags
        this.clearInputFlags();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // ---- Messages ----

    showMessage(text, callback) {
        this.messageQueue.push({ text, callback });
        if (!this.messageShowing) this.displayNextMessage();
    }

    displayNextMessage() {
        if (this.messageQueue.length === 0) {
            this.messageShowing = false;
            document.getElementById('message-overlay').style.display = 'none';
            return;
        }
        this.messageShowing = true;
        const msg = this.messageQueue[0];
        document.getElementById('message-text').innerHTML = msg.text;
        document.getElementById('message-overlay').style.display = 'flex';
    }

    dismissMessage() {
        const msg = this.messageQueue.shift();
        if (msg && msg.callback) msg.callback();
        this.displayNextMessage();
    }

    // ---- Ginsberg Flash ----

    showGinsberg(text) {
        const el = document.getElementById('ginsberg-overlay');
        const textEl = document.getElementById('ginsberg-text');
        textEl.textContent = text;
        el.style.display = 'flex';
        // Reset animation
        textEl.style.animation = 'none';
        void textEl.offsetHeight;
        textEl.style.animation = 'ginsbergFlash 3s ease-out forwards';
        setTimeout(() => { el.style.display = 'none'; }, 3200);
    }

    // ---- End Level ----

    endLevel(title, text, insight, isHidden) {
        document.getElementById('end-title').textContent = title;
        document.getElementById('end-text').innerHTML = text;
        if (insight) {
            document.getElementById('insight-unlock').style.display = 'block';
            document.getElementById('insight-quote').textContent = insight;
            SaveManager.completeLevel(this.currentLevelNum || 1, insight, isHidden);
        } else {
            document.getElementById('insight-unlock').style.display = 'none';
        }
        this.protagonist.persist();
        document.getElementById('end-overlay').style.display = 'flex';
    }

    // ---- UI Helpers ----

    updateHumanityBar(value) {
        document.getElementById('humanity-fill').style.width = value + '%';
    }

    updateMolochBar(value) {
        document.getElementById('moloch-fill').style.width = value + '%';
    }

    updateResources(food, culture, knowledge, population) {
        document.getElementById('res-food').textContent = 'Food: ' + Math.floor(food);
        document.getElementById('res-culture').textContent = 'Culture: ' + Math.floor(culture);
        document.getElementById('res-knowledge').textContent = 'Knowledge: ' + Math.floor(knowledge);
        document.getElementById('res-population').textContent = 'Pop: ' + Math.floor(population);
    }
}
