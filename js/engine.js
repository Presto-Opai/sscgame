/**
 * CODEX DESCENDING — Core Engine
 *
 * Handles: game loop, input, screen management, audio context, transitions.
 * Each level plugs into this as a module with init/update/render/cleanup.
 */

const Engine = (() => {
  // Canvas and context
  let canvas, ctx;
  const WIDTH = 960;
  const HEIGHT = 640;

  // Game state
  let gameState = null; // from SaveSystem
  let currentScreen = 'title'; // title, levelSelect, levelPreview, playing
  let currentLevel = null;
  let previewLevelIndex = -1;

  // Timing
  let lastTime = 0;
  let deltaTime = 0;
  let running = false;

  // Input
  const keys = {};
  const mouse = { x: 0, y: 0, down: false, clicked: false };

  // Particles for title screen
  let titleParticles = [];
  const PARTICLE_COUNT = 60;

  // Transition
  let transitioning = false;
  let transitionAlpha = 0;
  let transitionCallback = null;
  let transitionText = '';

  // Audio
  let audioCtx = null;
  let audioInitialized = false;

  // Level data (metadata for UI)
  const LEVELS = [
    {
      index: 0,
      number: 'I',
      title: 'Meditations on Moloch',
      shortTitle: 'Moloch',
      genre: 'Tower Defense / Civilization Sim',
      color: '#e05020',
      essay: 'Coordination failures, multipolar traps, and the demon god who demands you sacrifice everything good for competitive advantage.',
      description: 'Build a civilization on a pristine island while Moloch — the emergent god of optimization — rises from your own creations. Every upgrade is a Faustian bargain. Every coordination attempt risks betrayal.',
      quote: '"Moloch whose mind is pure machinery! Moloch whose blood is running money!"',
    },
    {
      index: 1,
      number: 'II',
      title: 'I Can Tolerate Anything Except the Outgroup',
      shortTitle: 'Outgroup',
      genre: 'Social Puzzle / Empathy Sim',
      color: '#7070d0',
      essay: 'We hate our near enemies, not our far enemies. The Blue Tribe and Red Tribe despise each other more than either despises distant foreigners.',
      description: 'Host a dinner party. Seat your guests to maximize real tolerance — not the easy kind between people who are nothing alike, but the hard kind between people who are almost the same.',
      quote: '"In a war, the weights attached to tribal identities increase dramatically."',
    },
    {
      index: 2,
      number: 'III',
      title: 'The Toxoplasma of Rage',
      shortTitle: 'Toxoplasma',
      genre: 'Infection / Network Propagation',
      color: '#d04040',
      essay: 'Controversial cases spread further than clear-cut cases. The most memetically virulent position splits people 50/50.',
      description: 'You are a memetic organism. Spread through a social network by choosing which cases to champion. The cruel lesson: the worst representatives for your cause are the ones that spread furthest.',
      quote: '"The toxoplasma of rage — ideas that spread not because they\'re true, but because they make people angry."',
    },
    {
      index: 3,
      number: 'IV',
      title: 'The Control Group Is Out of Control',
      shortTitle: 'Control Group',
      genre: 'Lab Management / Stats Puzzle',
      color: '#40a060',
      essay: 'If parapsychology\'s rigorous studies consistently find positive results for things that don\'t exist, what does that say about all science?',
      description: 'Run a research lab. Design experiments, publish results, chase prestige. The statistical traps are real and the game lets you fall into every one. At the end, learn whether your phenomenon was real — and why it doesn\'t matter.',
      quote: '"Parapsychology is the control group for science."',
    },
    {
      index: 4,
      number: 'V',
      title: 'Nobody Is Perfect, Everything Is Commensurable',
      shortTitle: 'Commensurable',
      genre: 'Resource Management / Life Sim',
      color: '#d0a030',
      essay: 'You don\'t have to be a saint. The 10% pledge is achievable. Perfectionism is the enemy of good.',
      description: 'Navigate your life as a timeline of finite resources — time, money, energy, willpower, joy. A feed of moral demands scrolls endlessly. Trying to answer them all destroys you. Find the sustainable path.',
      quote: '"The Third Servant buried his talent in the ground because perfect was impossible."',
    },
    {
      index: 5,
      number: 'VI',
      title: 'The Parable of the Talents',
      shortTitle: 'Talents',
      genre: 'RPG with Hidden Stats',
      color: '#c07030',
      essay: 'Ability is largely innate. You shouldn\'t beat yourself up for lacking talent, nor take credit for having it.',
      description: 'Roll a character whose stats you can\'t see — only feel. Two skill trees: one where everything flows, one where everything hurts. Grind if you want. The math is cruel but the lesson is kind.',
      quote: '"If you have a five-talent-level of some ability, and you try really hard, then you can function at a six-talent level."',
    },
    {
      index: 6,
      number: 'VII',
      title: 'The Secret of Our Success',
      shortTitle: 'Secret Success',
      genre: 'Survival / Mystery',
      color: '#309050',
      essay: 'Culture, not individual intelligence, is humanity\'s superpower. Traditions encode wisdom we can\'t consciously access.',
      description: 'You\'re a brilliant rationalist stranded in the wilderness. Locals perform strange rituals. Skip their superstitious food processing? Short-term: fine. Long-term: cyanide poisoning. Reason is the villain here.',
      quote: '"European explorers with far greater intelligence than any single indigenous person routinely starved in environments where locals thrived."',
    },
    {
      index: 7,
      number: 'VIII',
      title: 'All in All, Another Brick in the Motte',
      shortTitle: 'Motte & Bailey',
      genre: 'Debate Strategy / Castle Defense',
      color: '#808080',
      essay: 'The motte-and-bailey fallacy: make bold claims, retreat to defensible claims when challenged, then advance again.',
      description: 'Build a motte-and-bailey castle of rhetoric. Plant bold claims in the bailey, keep safe ones in the motte. When opponents attack, choose: defend honestly, retreat strategically, or concede with integrity.',
      quote: '"The motte is a statement like \'there are differences between men and women.\' The bailey is \'therefore, women should not be allowed to vote.\'"',
    },
    {
      index: 8,
      number: 'IX',
      title: 'Conflict vs. Mistake',
      shortTitle: 'Conflict vs. Mistake',
      genre: 'Dual-Mode Political Strategy',
      color: '#5060c0',
      essay: 'Mistake theorists think opponents are wrong. Conflict theorists think opponents are evil. These are fundamentally different worldviews.',
      description: 'Play the same political crisis twice: once as a puzzle to solve (Mistake Mode), once as a war to win (Conflict Mode). The trap: using the wrong mode in the wrong situation.',
      quote: '"Mistake theorists treat politics as science. Conflict theorists treat politics as war."',
    },
    {
      index: 9,
      number: 'X',
      title: 'SSRIs: Much More Than You Wanted to Know',
      shortTitle: 'SSRIs',
      genre: 'Internal Landscape Puzzle',
      color: '#6080b0',
      essay: 'The truth about antidepressants is complicated. They work, but not as much as advertised. Effect sizes are small but real.',
      description: 'Navigate the landscape of your own brain. Movement is heavy. Colors are muted. SSRIs don\'t create serotonin — they block reuptake. The improvement is 0.3 standard deviations. That may be enough.',
      quote: '"This medication has an effect size of approximately 0.3. You are slightly better. That slight improvement may be the difference between living and not living. That is enough."',
    },
  ];

  // ---- INITIALIZATION ----

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    gameState = SaveSystem.load();

    // Input listeners
    window.addEventListener('keydown', (e) => { keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
      mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
    });

    canvas.addEventListener('mousedown', () => { mouse.down = true; });
    canvas.addEventListener('mouseup', () => { mouse.down = false; mouse.clicked = true; });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouse.x = (touch.clientX - rect.left) * (WIDTH / rect.width);
      mouse.y = (touch.clientY - rect.top) * (HEIGHT / rect.height);
      mouse.down = true;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      mouse.down = false;
      mouse.clicked = true;
    }, { passive: false });

    // Initialize title particles
    initTitleParticles();

    // Initialize Elua for title screen
    Protagonist.init(WIDTH / 2, HEIGHT / 2 - 30, gameState.scars);

    // Wire up UI
    wireUI();

    // Show title screen
    showScreen('title');

    // Start loop
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  // ---- GAME LOOP ----

  function loop(timestamp) {
    if (!running) return;

    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = timestamp;

    update(deltaTime);
    render();

    mouse.clicked = false;
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Update title particles
    if (currentScreen === 'title' || currentScreen === 'levelSelect') {
      updateTitleParticles(dt);
    }

    // Update Elua on title
    if (currentScreen === 'title') {
      // Elua floats gently on title screen
      const t = performance.now() / 1000;
      Protagonist.setPosition(
        WIDTH / 2 + Math.sin(t * 0.3) * 8,
        HEIGHT / 2 - 50 + Math.cos(t * 0.5) * 5
      );
      Protagonist.update(dt);
    }

    // Update transition
    if (transitioning) {
      // handled by CSS, but we track state
    }

    // Update current level
    if (currentScreen === 'playing' && currentLevel) {
      currentLevel.update(dt);
    }
  }

  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (currentScreen === 'title') {
      renderTitleCanvas();
    } else if (currentScreen === 'levelSelect') {
      renderLevelSelectCanvas();
    } else if (currentScreen === 'levelPreview') {
      renderLevelPreviewCanvas();
    } else if (currentScreen === 'playing' && currentLevel) {
      currentLevel.render(ctx);
    }
  }

  // ---- TITLE SCREEN RENDERING ----

  function initTitleParticles() {
    titleParticles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      titleParticles.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        color: Math.random() > 0.85 ? '#f0c040' : '#4a4a5e',
      });
    }
  }

  function updateTitleParticles(dt) {
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    for (const p of titleParticles) {
      // Gentle drift toward center with noise
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      p.vx += (dx / dist) * 0.5 * dt;
      p.vy += (dy / dist) * 0.5 * dt;

      // Random drift
      p.vx += (Math.random() - 0.5) * 2 * dt;
      p.vy += (Math.random() - 0.5) * 2 * dt;

      // Damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < 0) p.x = WIDTH;
      if (p.x > WIDTH) p.x = 0;
      if (p.y < 0) p.y = HEIGHT;
      if (p.y > HEIGHT) p.y = 0;
    }
  }

  function renderTitleCanvas() {
    // Background gradient
    const bg = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, 400);
    bg.addColorStop(0, '#1a1a2e');
    bg.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Particles
    for (const p of titleParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Elua on title screen
    Protagonist.render(ctx);

    // Faint connecting lines between close gold particles
    ctx.save();
    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 0.5;
    const golds = titleParticles.filter(p => p.color === '#f0c040');
    for (let i = 0; i < golds.length; i++) {
      for (let j = i + 1; j < golds.length; j++) {
        const dx = golds[i].x - golds[j].x;
        const dy = golds[i].y - golds[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 80) {
          ctx.globalAlpha = (1 - d / 80) * 0.15;
          ctx.beginPath();
          ctx.moveTo(golds[i].x, golds[i].y);
          ctx.lineTo(golds[j].x, golds[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function renderLevelSelectCanvas() {
    // Darker background for level select
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle particles
    for (const p of titleParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.3;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function renderLevelPreviewCanvas() {
    // Level-themed background
    const level = LEVELS[previewLevelIndex];
    if (!level) return;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Colored vignette
    const vig = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, 500);
    vig.addColorStop(0, level.color + '15');
    vig.addColorStop(1, '#0a0a0f00');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle particles in level color
    for (const p of titleParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.4;
      ctx.fillStyle = p.color === '#f0c040' ? level.color : '#2a2a3d';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---- SCREEN MANAGEMENT ----

  function showScreen(name) {
    currentScreen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    const screenEl = document.getElementById(name + '-screen');
    if (screenEl) {
      screenEl.classList.add('active');
    }

    // Update level select cards if showing that screen
    if (name === 'levelSelect') {
      updateLevelCards();
    }
  }

  function updateLevelCards() {
    const cards = document.querySelectorAll('.level-card');
    cards.forEach((card, i) => {
      const completed = gameState.levelsCompleted[i];
      const unlocked = gameState.levelsUnlocked[i];

      card.classList.toggle('locked', !unlocked);

      const statusEl = card.querySelector('.level-status');
      if (statusEl) {
        if (completed) {
          statusEl.textContent = 'COMPLETED';
        } else if (unlocked) {
          statusEl.textContent = 'AVAILABLE';
        } else {
          statusEl.textContent = 'LOCKED';
        }
      }
    });
  }

  function showLevelPreview(index) {
    previewLevelIndex = index;
    const level = LEVELS[index];
    if (!level) return;

    document.getElementById('preview-number').textContent = 'LEVEL ' + level.number;
    document.getElementById('preview-title').textContent = level.title;
    document.getElementById('preview-title').style.setProperty('--preview-accent', level.color);
    document.getElementById('preview-essay').textContent = level.essay;
    document.getElementById('preview-genre').textContent = level.genre;
    document.getElementById('preview-genre').style.borderColor = level.color;
    document.getElementById('preview-genre').style.color = level.color;
    document.getElementById('preview-description').textContent = level.description;
    document.getElementById('preview-quote').textContent = level.quote;

    const statusEl = document.getElementById('preview-play-btn');
    statusEl.textContent = 'COMING SOON — IN DEVELOPMENT';
    statusEl.classList.remove('playable');

    showScreen('levelPreview');
  }

  // ---- UI WIRING ----

  function wireUI() {
    // Title screen — click anywhere
    document.getElementById('title-screen').addEventListener('click', () => {
      initAudio();
      showScreen('levelSelect');
    });

    // Level cards
    document.querySelectorAll('.level-card').forEach((card, i) => {
      card.addEventListener('click', () => {
        if (!gameState.levelsUnlocked[i]) return;
        showLevelPreview(i);
      });
    });

    // Back button from preview
    document.getElementById('preview-back-btn').addEventListener('click', () => {
      showScreen('levelSelect');
    });

    // Keyboard: Escape goes back
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (currentScreen === 'levelPreview') {
          showScreen('levelSelect');
        } else if (currentScreen === 'levelSelect') {
          showScreen('title');
        }
      }
    });

    // Dev: unlock all levels with Ctrl+Shift+U
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyU') {
        e.preventDefault();
        gameState.levelsUnlocked = gameState.levelsUnlocked.map(() => true);
        SaveSystem.save(gameState);
        updateLevelCards();
        console.log('All levels unlocked.');
      }
    });
  }

  // ---- AUDIO ----

  function initAudio() {
    if (audioInitialized) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioInitialized = true;

      // Play Elua's signature motif: C5-E5-G5-C6 (soft bells)
      playEluaMotif();
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }

  function playEluaMotif() {
    if (!audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = audioCtx.currentTime;

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.25 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.9);
    });
  }

  // ---- PUBLIC API ----

  return {
    init,
    LEVELS,
    WIDTH,
    HEIGHT,
    getState: () => gameState,
    getCanvas: () => canvas,
    getCtx: () => ctx,
    getMouse: () => mouse,
    getKeys: () => keys,
  };
})();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', Engine.init);
