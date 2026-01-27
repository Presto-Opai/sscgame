// engine.js — Core game engine for Codex Descending
// Provides: game loop, input handling, audio stubs, canvas utilities, and level management

const Engine = (() => {
    let canvas, ctx;
    let currentLevel = null;
    let running = false;
    let lastTime = 0;
    let animFrameId = null;

    // Input state
    const keys = {};
    const mouse = { x: 0, y: 0, down: false, clicked: false, rightClicked: false };

    // Audio context (lazy init)
    let audioCtx = null;

    function init(canvasId) {
        canvas = document.getElementById(canvasId);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = canvasId || 'gameCanvas';
            document.getElementById('game-container').appendChild(canvas);
        }
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        setupInput();
        return { canvas, ctx };
    }

    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (currentLevel && currentLevel.onResize) {
            currentLevel.onResize(canvas.width, canvas.height);
        }
    }

    function setupInput() {
        window.addEventListener('keydown', e => {
            keys[e.code] = true;
            if (currentLevel && currentLevel.onKeyDown) currentLevel.onKeyDown(e.code, e);
        });
        window.addEventListener('keyup', e => {
            keys[e.code] = false;
            if (currentLevel && currentLevel.onKeyUp) currentLevel.onKeyUp(e.code, e);
        });
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mousedown', e => {
            mouse.down = true;
            mouse.clicked = true;
            if (e.button === 2) mouse.rightClicked = true;
            if (currentLevel && currentLevel.onMouseDown) currentLevel.onMouseDown(mouse.x, mouse.y, e.button);
        });
        canvas.addEventListener('mouseup', e => {
            mouse.down = false;
            if (currentLevel && currentLevel.onMouseUp) currentLevel.onMouseUp(mouse.x, mouse.y, e.button);
        });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        // Touch support
        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            mouse.x = touch.clientX - rect.left;
            mouse.y = touch.clientY - rect.top;
            mouse.down = true;
            mouse.clicked = true;
            if (currentLevel && currentLevel.onMouseDown) currentLevel.onMouseDown(mouse.x, mouse.y, 0);
        });
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            mouse.x = touch.clientX - rect.left;
            mouse.y = touch.clientY - rect.top;
        });
        canvas.addEventListener('touchend', e => {
            mouse.down = false;
            if (currentLevel && currentLevel.onMouseUp) currentLevel.onMouseUp(mouse.x, mouse.y, 0);
        });
    }

    function gameLoop(timestamp) {
        if (!running) return;
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap delta at 100ms
        lastTime = timestamp;

        // Clear clicked state after one frame
        const clicked = mouse.clicked;
        const rightClicked = mouse.rightClicked;

        if (currentLevel) {
            currentLevel.update(dt, { keys, mouse: { ...mouse, clicked, rightClicked } });
            currentLevel.render(ctx, canvas);
        }

        mouse.clicked = false;
        mouse.rightClicked = false;

        animFrameId = requestAnimationFrame(gameLoop);
    }

    function startLevel(level) {
        if (currentLevel && currentLevel.cleanup) {
            currentLevel.cleanup();
        }
        currentLevel = level;
        if (currentLevel.init) {
            currentLevel.init(canvas, ctx);
        }
        if (!running) {
            running = true;
            lastTime = performance.now();
            animFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function stopLevel() {
        if (currentLevel && currentLevel.cleanup) {
            currentLevel.cleanup();
        }
        currentLevel = null;
        running = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    // --- Audio Utilities ---
    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playTone(freq, duration, type = 'sine', volume = 0.15) {
        const ac = getAudioContext();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + duration);
    }

    function playNoise(duration, volume = 0.08) {
        const ac = getAudioContext();
        const bufferSize = ac.sampleRate * duration;
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ac.createBufferSource();
        source.buffer = buffer;
        const gain = ac.createGain();
        gain.gain.setValueAtTime(volume, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
        source.connect(gain);
        gain.connect(ac.destination);
        source.start();
    }

    // --- Drawing Utilities ---
    function drawText(ctx, text, x, y, opts = {}) {
        const {
            font = '16px sans-serif',
            color = '#ffffff',
            align = 'left',
            baseline = 'top',
            maxWidth = undefined,
            shadow = false
        } = opts;
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        if (shadow) {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillText(text, x + 2, y + 2, maxWidth);
            ctx.restore();
            ctx.fillStyle = color;
        }
        ctx.fillText(text, x, y, maxWidth);
    }

    function drawBar(ctx, x, y, w, h, value, maxValue, fg, bg = '#333') {
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);
        const ratio = Math.max(0, Math.min(1, value / maxValue));
        ctx.fillStyle = fg;
        ctx.fillRect(x, y, w * ratio, h);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }

    function drawButton(ctx, x, y, w, h, text, mouseState, opts = {}) {
        const {
            font = 'bold 16px sans-serif',
            color = '#ddd',
            bg = '#444',
            hoverBg = '#666',
            border = '#888'
        } = opts;
        const hover = mouseState &&
            mouseState.x >= x && mouseState.x <= x + w &&
            mouseState.y >= y && mouseState.y <= y + h;
        ctx.fillStyle = hover ? hoverBg : bg;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
        return hover;
    }

    function isButtonClicked(x, y, w, h, mouseState) {
        return mouseState.clicked &&
            mouseState.x >= x && mouseState.x <= x + w &&
            mouseState.y >= y && mouseState.y <= y + h;
    }

    function wrapText(ctx, text, maxWidth, font) {
        ctx.font = font || ctx.font;
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // Easing functions
    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    return {
        init,
        startLevel,
        stopLevel,
        getCanvas: () => canvas,
        getCtx: () => ctx,
        playTone,
        playNoise,
        getAudioContext,
        drawText,
        drawBar,
        drawButton,
        isButtonClicked,
        wrapText,
        easeInOut,
        lerp
    };
})();
