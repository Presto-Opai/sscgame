// coda-finale.js — The Final Confrontation: Elua vs Moloch
// "After Level 10, a brief coda: Elua confronts Moloch one last time,
//  armed with everything learned. The battle isn't won by force.
//  It's won by coordination."

const CodaFinale = (() => {
    let canvas, ctx;
    let W, H;
    let time = 0;

    // Phase management
    let phase = 'arrival';       // arrival -> gathering -> coordination -> resolution -> epilogue
    let phaseTime = 0;
    let phaseTransition = false;
    let transitionAlpha = 0;

    // Elua state
    let eluaX, eluaY;
    let eluaTargetX, eluaTargetY;
    let eluaGlow = 0;

    // Moloch state
    let molochX, molochY;
    let molochSize = 0;
    let molochTargetSize = 200;
    let molochPower = 1.0;
    let molochGlow = 1.0;
    let molochShake = 0;
    let molochFlinching = false;

    // Insights as floating orbs
    let insightOrbs = [];
    let activatedInsights = [];
    let nextOrbIndex = 0;

    // Coalition members (appear when insights are activated)
    let coalition = [];

    // Particles
    let particles = [];
    let gardenParticles = [];

    // Text display
    let displayText = '';
    let displayTextAlpha = 0;
    let displayTextTarget = '';
    let displaySubText = '';
    let displaySubAlpha = 0;

    // Player data
    let playerInsights = [];
    let playerHumanity = 0;
    let playerAppearance = 'bright';
    let insightCount = 0;

    // Stars background
    let stars = [];

    // Click prompt
    let showClickPrompt = false;
    let clickPromptAlpha = 0;

    // Ending
    let ending = 'none'; // 'full', 'partial', 'alone'
    let endingRevealed = false;
    let finalQuoteAlpha = 0;

    // Ginsberg quotes for Moloch
    const GINSBERG = [
        'Moloch whose mind is pure machinery!',
        'Moloch whose blood is running money!',
        'Moloch whose fingers are ten armies!',
        'Moloch whose love is endless oil and stone!',
        'Moloch! Moloch! Robot apartments!',
        'Moloch whose soul is electricity and banks!'
    ];
    let ginsbergIndex = 0;
    let ginsbergAlpha = 0;
    let ginsbergTimer = 0;

    // Insight descriptions for display
    const INSIGHT_LABELS = {
        1: 'Coordination defeats optimization',
        2: 'We hate those closest to us',
        3: 'Outrage spreads faster than truth',
        4: 'Even rigorous methods can deceive',
        5: 'Imperfection is permission to act',
        6: 'Talent is luck, not virtue',
        7: 'Tradition encodes hidden wisdom',
        8: 'Honest claims need no retreat',
        9: 'Not every conflict is a mistake',
        10: 'Small improvements can be enough'
    };

    const COALITION_NAMES = {
        1: 'The Gardener',
        2: 'The Host',
        3: 'The Truthseeker',
        4: 'The Skeptic',
        5: 'The Pledger',
        6: 'The Accepter',
        7: 'The Humble',
        8: 'The Honest',
        9: 'The Synthesizer',
        10: 'The Healer'
    };

    function init(c, context) {
        canvas = c;
        ctx = context;
        W = canvas.width;
        H = canvas.height;
        time = 0;

        // Load player state
        playerInsights = Protagonist.getInsights();
        playerHumanity = Protagonist.getHumanity();
        playerAppearance = Protagonist.getAppearance();
        insightCount = playerInsights.length;

        // Reset state
        phase = 'arrival';
        phaseTime = 0;
        phaseTransition = false;
        transitionAlpha = 0;
        activatedInsights = [];
        coalition = [];
        particles = [];
        gardenParticles = [];
        nextOrbIndex = 0;
        displayText = '';
        displayTextAlpha = 0;
        displayTextTarget = '';
        displaySubText = '';
        displaySubAlpha = 0;
        showClickPrompt = false;
        clickPromptAlpha = 0;
        ending = 'none';
        endingRevealed = false;
        finalQuoteAlpha = 0;
        ginsbergIndex = 0;
        ginsbergAlpha = 0;
        ginsbergTimer = 0;
        molochFlinching = false;
        molochShake = 0;

        // Position Elua at bottom center
        eluaX = W / 2;
        eluaY = H * 0.85;
        eluaTargetX = W / 2;
        eluaTargetY = H * 0.65;
        eluaGlow = 0;

        // Position Moloch at top center
        molochX = W / 2;
        molochY = H * 0.15;
        molochSize = 0;
        molochPower = 1.0;
        molochGlow = 1.0;

        // Generate stars
        stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 2
            });
        }

        // Create insight orbs from collected insights
        insightOrbs = [];
        playerInsights.forEach((insight, i) => {
            const angle = (i / Math.max(1, playerInsights.length)) * Math.PI * 2 - Math.PI / 2;
            const radius = Math.min(W, H) * 0.25;
            insightOrbs.push({
                level: insight.level,
                text: insight.text,
                label: INSIGHT_LABELS[insight.level] || 'Unknown insight',
                x: W / 2 + Math.cos(angle) * radius,
                y: H / 2 + Math.sin(angle) * radius * 0.6,
                baseAngle: angle,
                radius: radius,
                alpha: 0,
                activated: false,
                pulsePhase: Math.random() * Math.PI * 2,
                color: getInsightColor(insight.level)
            });
        });

        // Set initial text
        displayTextTarget = 'The Descent Is Complete.';
        displaySubText = '';

        // Play arrival tone
        try {
            Engine.playTone(220, 2, 'sine', 0.08);
            setTimeout(() => Engine.playTone(330, 2, 'sine', 0.06), 500);
            setTimeout(() => Engine.playTone(165, 3, 'sine', 0.05), 1000);
        } catch(e) {}
    }

    function getInsightColor(level) {
        const colors = {
            1: '#ff8844', 2: '#44aaff', 3: '#ff4466', 4: '#44ff88',
            5: '#ffdd44', 6: '#aa66ff', 7: '#66ffaa', 8: '#ff6644',
            9: '#4488ff', 10: '#88aacc'
        };
        return colors[level] || '#ffffff';
    }

    function update(dt, input) {
        time += dt;
        phaseTime += dt;

        // Update text fade
        if (displayTextTarget && displayTextTarget !== displayText) {
            displayTextAlpha -= dt * 2;
            if (displayTextAlpha <= 0) {
                displayText = displayTextTarget;
                displayTextAlpha = 0;
            }
        } else if (displayText) {
            displayTextAlpha = Math.min(1, displayTextAlpha + dt * 1.5);
        }

        if (displaySubText) {
            displaySubAlpha = Math.min(1, displaySubAlpha + dt);
        }

        // Click prompt pulse
        if (showClickPrompt) {
            clickPromptAlpha = 0.4 + Math.sin(time * 3) * 0.3;
        }

        // Update stars
        stars.forEach(s => {
            s.twinkle += dt * s.speed;
        });

        // Update particles
        updateParticles(dt);

        // Ginsberg quotes
        if (phase !== 'epilogue') {
            ginsbergTimer += dt;
            if (ginsbergTimer > 6) {
                ginsbergTimer = 0;
                ginsbergIndex = (ginsbergIndex + 1) % GINSBERG.length;
                ginsbergAlpha = 1;
            }
            if (ginsbergAlpha > 0) ginsbergAlpha -= dt * 0.3;
        }

        // Phase-specific updates
        switch (phase) {
            case 'arrival':
                updateArrival(dt, input);
                break;
            case 'gathering':
                updateGathering(dt, input);
                break;
            case 'coordination':
                updateCoordination(dt, input);
                break;
            case 'resolution':
                updateResolution(dt, input);
                break;
            case 'epilogue':
                updateEpilogue(dt, input);
                break;
        }

        // Smooth Elua movement
        eluaX += (eluaTargetX - eluaX) * dt * 2;
        eluaY += (eluaTargetY - eluaY) * dt * 2;

        // Smooth Moloch size
        molochSize += (molochTargetSize - molochSize) * dt * 1.5;
    }

    function updateArrival(dt, input) {
        // Moloch grows in
        molochTargetSize = 200;
        eluaGlow = Math.min(1, eluaGlow + dt * 0.5);

        if (phaseTime < 2) {
            // Initial darkness, text fading in
        } else if (phaseTime < 4) {
            displayTextTarget = 'You have descended through ten layers of thought.';
            displaySubText = '';
        } else if (phaseTime < 6) {
            displayTextTarget = 'Now, one final confrontation remains.';
        } else if (phaseTime < 8) {
            displayTextTarget = '';
            // Moloch rumbles
            if (phaseTime > 6.5 && !molochFlinching) {
                try { Engine.playTone(55, 3, 'sawtooth', 0.1); } catch(e) {}
            }
        } else {
            // Transition to gathering
            if (insightCount === 0) {
                // No insights — skip to resolution with 'alone' ending
                setPhase('resolution');
                ending = 'alone';
                displayTextTarget = 'You face Moloch with nothing but yourself.';
            } else {
                setPhase('gathering');
                displayTextTarget = insightCount === 10
                    ? 'You carry the light of every lesson learned.'
                    : `You carry ${insightCount} insight${insightCount !== 1 ? 's' : ''} from your journey.`;
                displaySubText = 'Click each insight to summon its power.';
                showClickPrompt = true;
            }
        }
    }

    function updateGathering(dt, input) {
        // Show insight orbs — player clicks them to activate
        insightOrbs.forEach((orb, i) => {
            if (!orb.activated) {
                // Float gently
                orb.x = W / 2 + Math.cos(orb.baseAngle + time * 0.3) * orb.radius;
                orb.y = H / 2 + Math.sin(orb.baseAngle + time * 0.3) * orb.radius * 0.6;
                orb.alpha = Math.min(1, orb.alpha + dt * 2);
                orb.pulsePhase += dt * 2;

                // Check click
                if (input.mouse.clicked) {
                    const dx = input.mouse.x - orb.x;
                    const dy = input.mouse.y - orb.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 30) {
                        activateInsight(orb, i);
                    }
                }
            } else {
                // Activated: drift toward coalition position
                const ci = activatedInsights.indexOf(i);
                const targetX = W / 2 + (ci - activatedInsights.length / 2) * 50;
                const targetY = H * 0.55;
                orb.x += (targetX - orb.x) * dt * 3;
                orb.y += (targetY - orb.y) * dt * 3;
            }
        });

        // Check if all insights activated
        if (activatedInsights.length === insightOrbs.length && phaseTime > 2) {
            showClickPrompt = false;

            // Determine ending
            if (insightCount >= 8 && playerHumanity >= 50) {
                ending = 'full';
            } else if (insightCount >= 4 || playerHumanity >= 30) {
                ending = 'partial';
            } else {
                ending = 'alone';
            }

            setPhase('coordination');
            displayTextTarget = 'The coalition forms...';
            displaySubText = '';
        }
    }

    function activateInsight(orb, index) {
        if (orb.activated) return;
        orb.activated = true;
        activatedInsights.push(index);

        // Display insight text
        displayTextTarget = INSIGHT_LABELS[orb.level];
        displaySubText = `"${orb.text}"`;
        displaySubAlpha = 0;

        // Spawn coalition member
        const member = {
            name: COALITION_NAMES[orb.level] || 'Ally',
            x: orb.x,
            y: orb.y,
            targetX: W / 2 + (Math.random() - 0.5) * 200,
            targetY: H * 0.6 + (Math.random() - 0.5) * 40,
            alpha: 0,
            color: orb.color,
            size: 15 + Math.random() * 10
        };
        coalition.push(member);

        // Moloch reacts
        molochShake = 0.5;
        molochPower = Math.max(0.3, molochPower - 0.07);

        // Spark particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: orb.x, y: orb.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 1,
                color: orb.color,
                size: 2 + Math.random() * 3
            });
        }

        // Sound
        try {
            const tones = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659];
            Engine.playTone(tones[activatedInsights.length % tones.length], 0.8, 'sine', 0.1);
        } catch(e) {}
    }

    function updateCoordination(dt, input) {
        // Coalition members move into formation
        coalition.forEach((m, i) => {
            m.alpha = Math.min(1, m.alpha + dt * 2);
            // Form a semicircle facing Moloch
            const angle = Math.PI + (i / Math.max(1, coalition.length - 1)) * Math.PI;
            const radius = 80 + coalition.length * 8;
            m.targetX = eluaX + Math.cos(angle) * radius;
            m.targetY = eluaY + Math.sin(angle) * radius * 0.4 - 20;
            m.x += (m.targetX - m.x) * dt * 3;
            m.y += (m.targetY - m.y) * dt * 3;
        });

        // Elua glows brighter with coalition
        eluaGlow = Math.min(2, 0.5 + coalition.length * 0.15);

        if (phaseTime < 3) {
            // Coalition forming
            if (ending === 'full') {
                displayTextTarget = 'Every lesson, every compromise, every hard-won truth...';
            } else if (ending === 'partial') {
                displayTextTarget = 'Not every lesson was learned, but enough...';
            } else {
                displayTextTarget = 'The few insights flicker, struggling to hold...';
            }
        } else if (phaseTime < 5) {
            if (ending === 'full') {
                displayTextTarget = 'They stand together. Not as force — as coordination.';
            } else if (ending === 'partial') {
                displayTextTarget = 'A fragile coalition. Incomplete, but present.';
            } else {
                displayTextTarget = 'Elua faces the darkness, nearly alone.';
            }
        } else {
            setPhase('resolution');
        }
    }

    function updateResolution(dt, input) {
        // Moloch reacts based on ending
        if (ending === 'full') {
            updateFullEnding(dt);
        } else if (ending === 'partial') {
            updatePartialEnding(dt);
        } else {
            updateAloneEnding(dt);
        }

        // Moloch shake decay
        molochShake *= 0.95;
    }

    function updateFullEnding(dt) {
        if (phaseTime < 3) {
            displayTextTarget = 'The coalition holds. Moloch hesitates.';
            molochPower = Math.max(0.1, molochPower - dt * 0.15);
            molochFlinching = true;
            molochShake = 0.3 + Math.sin(time * 10) * 0.2;

            // Coordination beams between coalition members
            if (Math.random() < dt * 5) {
                const a = coalition[Math.floor(Math.random() * coalition.length)];
                const b = coalition[Math.floor(Math.random() * coalition.length)];
                if (a && b && a !== b) {
                    for (let i = 0; i < 5; i++) {
                        const t = i / 4;
                        particles.push({
                            x: a.x + (b.x - a.x) * t,
                            y: a.y + (b.y - a.y) * t,
                            vx: (Math.random() - 0.5) * 20,
                            vy: -Math.random() * 30,
                            life: 0.8,
                            color: '#ffd764',
                            size: 2
                        });
                    }
                }
            }
        } else if (phaseTime < 6) {
            displayTextTarget = 'Not destroyed. Moloch cannot be destroyed.';
            displaySubText = 'He is emergent. He is the space between.';
            displaySubAlpha = Math.min(1, displaySubAlpha + dt);
            molochPower = Math.max(0.05, molochPower - dt * 0.1);
            molochTargetSize = 120;

            // Garden particles bloom from below
            if (Math.random() < dt * 10) {
                gardenParticles.push({
                    x: W * 0.1 + Math.random() * W * 0.8,
                    y: H + 10,
                    vy: -20 - Math.random() * 40,
                    vx: (Math.random() - 0.5) * 10,
                    life: 3 + Math.random() * 2,
                    color: ['#ff9966', '#ffcc66', '#66ff99', '#ff66aa', '#66ccff'][Math.floor(Math.random() * 5)],
                    size: 3 + Math.random() * 4,
                    type: 'flower'
                });
            }
        } else if (phaseTime < 9) {
            displayTextTarget = 'But for one moment — one fleeting, coordinated moment —';
            displaySubText = 'the garden blooms in the shadow of the furnace.';

            // Intense garden bloom
            if (Math.random() < dt * 20) {
                gardenParticles.push({
                    x: W * 0.05 + Math.random() * W * 0.9,
                    y: H + 10,
                    vy: -30 - Math.random() * 50,
                    vx: (Math.random() - 0.5) * 15,
                    life: 4 + Math.random() * 3,
                    color: ['#ff9966', '#ffcc66', '#66ff99', '#ff66aa', '#66ccff', '#ffd764'][Math.floor(Math.random() * 6)],
                    size: 3 + Math.random() * 5,
                    type: 'flower'
                });
            }

            molochTargetSize = 80;
            molochPower = 0.05;
        } else {
            setPhase('epilogue');
        }
    }

    function updatePartialEnding(dt) {
        if (phaseTime < 3) {
            displayTextTarget = 'The coalition wavers. Some links are missing.';
            molochPower = Math.max(0.4, molochPower - dt * 0.1);
            molochShake = 0.1;
        } else if (phaseTime < 6) {
            displayTextTarget = 'Moloch pushes back, but cannot advance.';
            displaySubText = 'The incomplete knowledge holds, barely.';
            displaySubAlpha = Math.min(1, displaySubAlpha + dt);
            molochTargetSize = 160;

            // Some garden particles, sparser
            if (Math.random() < dt * 4) {
                gardenParticles.push({
                    x: W * 0.2 + Math.random() * W * 0.6,
                    y: H + 10,
                    vy: -15 - Math.random() * 25,
                    vx: (Math.random() - 0.5) * 8,
                    life: 2 + Math.random() * 2,
                    color: ['#ffcc66', '#66ff99', '#ff66aa'][Math.floor(Math.random() * 3)],
                    size: 2 + Math.random() * 3,
                    type: 'flower'
                });
            }
        } else if (phaseTime < 9) {
            displayTextTarget = 'Not a victory. Not a defeat.';
            displaySubText = 'A stalemate that buys time for the garden to grow.';
            molochTargetSize = 140;
        } else {
            setPhase('epilogue');
        }
    }

    function updateAloneEnding(dt) {
        if (phaseTime < 3) {
            displayTextTarget = 'Elua stands alone against the machinery.';
            molochPower = Math.max(0.7, molochPower - dt * 0.05);
            molochTargetSize = 220;
        } else if (phaseTime < 6) {
            displayTextTarget = 'Without coordination, there is no defense.';
            displaySubText = 'But Elua does not surrender.';
            displaySubAlpha = Math.min(1, displaySubAlpha + dt);
        } else if (phaseTime < 9) {
            displayTextTarget = 'Even alone, even small, even flickering —';
            displaySubText = 'the spark persists. It has always persisted.';
        } else {
            setPhase('epilogue');
        }
    }

    function updateEpilogue(dt, input) {
        molochShake *= 0.95;

        if (phaseTime < 3) {
            displayTextTarget = '';
            displaySubText = '';
            if (!endingRevealed) {
                endingRevealed = true;
                try {
                    // Final chord
                    Engine.playTone(262, 4, 'sine', 0.08);
                    Engine.playTone(330, 4, 'sine', 0.06);
                    Engine.playTone(392, 4, 'sine', 0.06);
                    if (ending === 'full') {
                        Engine.playTone(523, 4, 'sine', 0.05);
                    }
                } catch(e) {}
            }
        } else {
            // Show final quote
            finalQuoteAlpha = Math.min(1, finalQuoteAlpha + dt * 0.5);
            showClickPrompt = true;

            if (input.mouse.clicked && finalQuoteAlpha > 0.8) {
                // Complete the coda
                Protagonist.completeLevel(11, ending); // Level 11 = coda
                Protagonist.save();
                if (typeof returnToMenu === 'function') {
                    returnToMenu();
                }
            }
        }
    }

    function setPhase(newPhase) {
        phase = newPhase;
        phaseTime = 0;
        displaySubText = '';
        displaySubAlpha = 0;
    }

    function updateParticles(dt) {
        // Regular particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Garden particles
        for (let i = gardenParticles.length - 1; i >= 0; i--) {
            const p = gardenParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy *= 0.98;
            p.vx += (Math.random() - 0.5) * dt * 5;
            p.life -= dt;
            if (p.life <= 0) gardenParticles.splice(i, 1);
        }
    }

    function render(ctx, canvas) {
        W = canvas.width;
        H = canvas.height;

        // Deep void background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#050208');
        bgGrad.addColorStop(0.5, '#0a0515');
        bgGrad.addColorStop(1, '#0d0a1a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        stars.forEach(s => {
            const alpha = 0.3 + Math.sin(s.twinkle) * 0.3;
            ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Garden particles (behind everything)
        renderGardenParticles(ctx);

        // Moloch
        renderMoloch(ctx);

        // Ginsberg quote
        if (ginsbergAlpha > 0 && phase !== 'epilogue') {
            ctx.save();
            ctx.font = 'italic 14px serif';
            ctx.fillStyle = `rgba(232, 88, 32, ${ginsbergAlpha * 0.6})`;
            ctx.textAlign = 'center';
            ctx.fillText(GINSBERG[ginsbergIndex], molochX, molochY + molochSize + 30);
            ctx.restore();
        }

        // Insight orbs
        insightOrbs.forEach(orb => {
            if (orb.alpha > 0) {
                renderInsightOrb(ctx, orb);
            }
        });

        // Coalition members
        coalition.forEach(m => {
            if (m.alpha > 0) {
                renderCoalitionMember(ctx, m);
            }
        });

        // Coordination beams (in coordination/resolution phase)
        if ((phase === 'coordination' || phase === 'resolution') && coalition.length > 1) {
            renderCoordinationBeams(ctx);
        }

        // Regular particles
        particles.forEach(p => {
            const alpha = Math.min(1, p.life);
            ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('##', '#');
            // Handle hex colors
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Elua
        renderElua(ctx);

        // Display text
        renderText(ctx);

        // Epilogue final quote
        if (phase === 'epilogue' && finalQuoteAlpha > 0) {
            renderFinalQuote(ctx);
        }

        // Click prompt
        if (showClickPrompt && phase !== 'epilogue') {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = `rgba(200, 200, 200, ${clickPromptAlpha})`;
            ctx.textAlign = 'center';
            ctx.fillText('click insights to activate them', W / 2, H - 30);
        }
    }

    function renderMoloch(ctx) {
        ctx.save();
        const shakeX = molochShake * (Math.random() - 0.5) * 10;
        const shakeY = molochShake * (Math.random() - 0.5) * 10;
        const mx = molochX + shakeX;
        const my = molochY + shakeY;
        const s = molochSize;

        if (s < 5) { ctx.restore(); return; }

        // Moloch glow
        const gRad = ctx.createRadialGradient(mx, my, s * 0.1, mx, my, s * 1.5);
        gRad.addColorStop(0, `rgba(232, 88, 32, ${molochPower * 0.4})`);
        gRad.addColorStop(0.5, `rgba(180, 50, 20, ${molochPower * 0.15})`);
        gRad.addColorStop(1, 'rgba(100, 30, 10, 0)');
        ctx.fillStyle = gRad;
        ctx.fillRect(mx - s * 2, my - s * 2, s * 4, s * 4);

        // Moloch body — geometric, industrial
        ctx.fillStyle = `rgba(60, 30, 15, ${molochPower})`;
        // Main body — trapezoid
        ctx.beginPath();
        ctx.moveTo(mx - s * 0.5, my - s * 0.6);
        ctx.lineTo(mx + s * 0.5, my - s * 0.6);
        ctx.lineTo(mx + s * 0.7, my + s * 0.5);
        ctx.lineTo(mx - s * 0.7, my + s * 0.5);
        ctx.closePath();
        ctx.fill();

        // Furnace opening
        ctx.fillStyle = `rgba(232, 88, 32, ${molochPower * 0.8})`;
        ctx.beginPath();
        ctx.arc(mx, my, s * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Inner fire
        const fireIntensity = molochPower * (0.5 + Math.sin(time * 5) * 0.3);
        ctx.fillStyle = `rgba(255, 150, 50, ${fireIntensity})`;
        ctx.beginPath();
        ctx.arc(mx, my, s * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes — burning
        const eyeGlow = molochPower * (0.6 + Math.sin(time * 3) * 0.2);
        ctx.fillStyle = `rgba(255, 100, 30, ${eyeGlow})`;
        ctx.beginPath();
        ctx.arc(mx - s * 0.2, my - s * 0.35, s * 0.06, 0, Math.PI * 2);
        ctx.arc(mx + s * 0.2, my - s * 0.35, s * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Geometric lines (gears/machinery)
        ctx.strokeStyle = `rgba(232, 88, 32, ${molochPower * 0.3})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time * 0.5;
            const r1 = s * 0.7;
            const r2 = s * 0.9;
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(angle) * r1, my + Math.sin(angle) * r1);
            ctx.lineTo(mx + Math.cos(angle) * r2, my + Math.sin(angle) * r2);
            ctx.stroke();
        }

        // Crown of gears
        ctx.strokeStyle = `rgba(200, 80, 30, ${molochPower * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI - Math.PI + time * 0.3;
            const r = s * 0.5 + (i % 2 === 0 ? s * 0.1 : 0);
            const px = mx + Math.cos(angle) * r;
            const py = my - s * 0.5 + Math.sin(angle) * r * 0.3;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.restore();
    }

    function renderElua(ctx) {
        // Enhanced Elua with coda-level glow
        ctx.save();

        // Extra glow aura during coda
        if (eluaGlow > 0) {
            const auraRadius = 40 + eluaGlow * 30;
            const aura = ctx.createRadialGradient(eluaX, eluaY, 5, eluaX, eluaY, auraRadius);
            const baseColor = playerAppearance === 'bright' ? '255,215,100' :
                             playerAppearance === 'crystalline' ? '150,200,255' : '255,180,100';
            aura.addColorStop(0, `rgba(${baseColor}, ${eluaGlow * 0.4})`);
            aura.addColorStop(0.5, `rgba(${baseColor}, ${eluaGlow * 0.1})`);
            aura.addColorStop(1, `rgba(${baseColor}, 0)`);
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(eluaX, eluaY, auraRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        Protagonist.drawElua(ctx, eluaX, eluaY, 25 + eluaGlow * 5);
        ctx.restore();
    }

    function renderInsightOrb(ctx, orb) {
        ctx.save();
        const pulse = Math.sin(orb.pulsePhase) * 0.2 + 0.8;
        const size = orb.activated ? 8 : 12;

        // Glow
        const glow = ctx.createRadialGradient(orb.x, orb.y, size * 0.2, orb.x, orb.y, size * 3);
        glow.addColorStop(0, orb.color.replace(')', `, ${orb.alpha * pulse * 0.6})`).replace('rgb', 'rgba'));
        glow.addColorStop(1, 'rgba(0,0,0,0)');

        // Handle hex colors for glow
        ctx.globalAlpha = orb.alpha * pulse;

        // Outer glow circle
        ctx.fillStyle = orb.color;
        ctx.globalAlpha = orb.alpha * pulse * 0.15;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core orb
        ctx.globalAlpha = orb.alpha * pulse;
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.globalAlpha = orb.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Label (only for non-activated orbs)
        if (!orb.activated && orb.alpha > 0.5) {
            ctx.globalAlpha = orb.alpha * 0.8;
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#ddd';
            ctx.textAlign = 'center';
            ctx.fillText(`Level ${orb.level}`, orb.x, orb.y + size + 14);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function renderCoalitionMember(ctx, member) {
        ctx.save();
        ctx.globalAlpha = member.alpha;

        // Small glowing figure
        const s = member.size;

        // Glow
        ctx.fillStyle = member.color;
        ctx.globalAlpha = member.alpha * 0.2;
        ctx.beginPath();
        ctx.arc(member.x, member.y, s * 2, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.globalAlpha = member.alpha * 0.8;
        ctx.fillStyle = member.color;
        // Head
        ctx.beginPath();
        ctx.arc(member.x, member.y - s * 0.4, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.beginPath();
        ctx.moveTo(member.x - s * 0.2, member.y - s * 0.15);
        ctx.lineTo(member.x + s * 0.2, member.y - s * 0.15);
        ctx.lineTo(member.x + s * 0.1, member.y + s * 0.4);
        ctx.lineTo(member.x - s * 0.1, member.y + s * 0.4);
        ctx.closePath();
        ctx.fill();

        // Name label
        ctx.globalAlpha = member.alpha * 0.6;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.textAlign = 'center';
        ctx.fillText(member.name, member.x, member.y + s * 0.6 + 10);

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function renderCoordinationBeams(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#ffd764';
        ctx.lineWidth = 1;

        // Draw lines between coalition members to show coordination
        for (let i = 0; i < coalition.length; i++) {
            for (let j = i + 1; j < coalition.length; j++) {
                const a = coalition[i];
                const b = coalition[j];
                if (a.alpha > 0.5 && b.alpha > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
            // Also connect to Elua
            const m = coalition[i];
            if (m.alpha > 0.5) {
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(eluaX, eluaY);
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function renderGardenParticles(ctx) {
        gardenParticles.forEach(p => {
            ctx.save();
            const alpha = Math.min(1, p.life * 0.5);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;

            if (p.type === 'flower') {
                // Draw small flower shapes
                const s = p.size;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 + time;
                    const px = p.x + Math.cos(angle) * s;
                    const py = p.y + Math.sin(angle) * s;
                    ctx.moveTo(p.x, p.y);
                    ctx.arc(px, py, s * 0.4, 0, Math.PI * 2);
                }
                ctx.fill();

                // Center
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, s * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            ctx.restore();
        });
    }

    function renderText(ctx) {
        if (displayText && displayTextAlpha > 0) {
            ctx.save();
            ctx.font = '22px serif';
            ctx.fillStyle = `rgba(220, 210, 200, ${displayTextAlpha})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Word-wrap the text
            const lines = Engine.wrapText(ctx, displayText, W * 0.7, '22px serif');
            const lineHeight = 30;
            const startY = H * 0.35 - (lines.length * lineHeight) / 2;
            lines.forEach((line, i) => {
                ctx.fillText(line, W / 2, startY + i * lineHeight);
            });

            // Sub text (usually a quote)
            if (displaySubText && displaySubAlpha > 0) {
                ctx.font = 'italic 16px serif';
                ctx.fillStyle = `rgba(180, 170, 160, ${displaySubAlpha * displayTextAlpha})`;
                const subLines = Engine.wrapText(ctx, displaySubText, W * 0.65, 'italic 16px serif');
                subLines.forEach((line, i) => {
                    ctx.fillText(line, W / 2, startY + lines.length * lineHeight + 10 + i * 22);
                });
            }

            ctx.restore();
        }
    }

    function renderFinalQuote(ctx) {
        ctx.save();
        ctx.globalAlpha = finalQuoteAlpha;

        // Dark overlay
        ctx.fillStyle = 'rgba(5, 2, 8, 0.7)';
        ctx.fillRect(0, 0, W, H);

        const centerY = H * 0.4;

        // Ending-specific text
        ctx.font = 'bold 28px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (ending === 'full') {
            ctx.fillText('THE GARDEN BLOOMS', W / 2, centerY - 60);

            ctx.font = 'italic 18px serif';
            ctx.fillStyle = 'rgba(220, 210, 200, 0.9)';
            const quote = '"I am a transhumanist because I do not have enough hubris not to try to kill God."';
            const lines = Engine.wrapText(ctx, quote, W * 0.6, 'italic 18px serif');
            lines.forEach((line, i) => {
                ctx.fillText(line, W / 2, centerY + i * 24);
            });

            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(160, 150, 140, 0.8)';
            ctx.fillText('— Scott Alexander, "Meditations on Moloch"', W / 2, centerY + lines.length * 24 + 20);
        } else if (ending === 'partial') {
            ctx.fillText('THE STALEMATE HOLDS', W / 2, centerY - 60);

            ctx.font = 'italic 18px serif';
            ctx.fillStyle = 'rgba(220, 210, 200, 0.9)';
            const quote = '"Somewhere in this darkness is another god. He is the god of flowers and free love and all soft and fragile things."';
            const lines = Engine.wrapText(ctx, quote, W * 0.6, 'italic 18px serif');
            lines.forEach((line, i) => {
                ctx.fillText(line, W / 2, centerY + i * 24);
            });

            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(160, 150, 140, 0.8)';
            ctx.fillText('There are lessons still unlearned. Return and find them.', W / 2, centerY + lines.length * 24 + 20);
        } else {
            ctx.font = 'bold 24px serif';
            ctx.fillText('ELUA ENDURES', W / 2, centerY - 60);

            ctx.font = 'italic 18px serif';
            ctx.fillStyle = 'rgba(220, 210, 200, 0.9)';
            const quote = '"And the gods who oppose Him tend to find Themselves meeting with a surprising number of unfortunate accidents."';
            const lines = Engine.wrapText(ctx, quote, W * 0.6, 'italic 18px serif');
            lines.forEach((line, i) => {
                ctx.fillText(line, W / 2, centerY + i * 24);
            });

            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(160, 150, 140, 0.8)';
            ctx.fillText('Descend again. Gather insights. Build the coalition.', W / 2, centerY + lines.length * 24 + 20);
        }

        // Click to continue
        if (finalQuoteAlpha > 0.8) {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = `rgba(150, 150, 150, ${0.3 + Math.sin(time * 3) * 0.2})`;
            ctx.fillText('Click to return', W / 2, H * 0.85);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function onResize(w, h) {
        W = w;
        H = h;

        // Reposition elements
        eluaTargetX = W / 2;
        eluaTargetY = H * 0.65;
        molochX = W / 2;
        molochY = H * 0.15;

        // Regenerate stars
        stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 2
            });
        }

        // Reposition insight orbs
        insightOrbs.forEach((orb, i) => {
            orb.radius = Math.min(W, H) * 0.25;
        });
    }

    function onMouseDown(x, y, button) {
        // Handled in update via input.mouse.clicked
    }

    function onMouseUp(x, y, button) {}

    function onKeyDown(code) {
        // Space/Enter as click alternative
        if (code === 'Space' || code === 'Enter') {
            if (phase === 'epilogue' && finalQuoteAlpha > 0.8) {
                Protagonist.completeLevel(11, ending);
                Protagonist.save();
                if (typeof returnToMenu === 'function') {
                    returnToMenu();
                }
            }
        }
    }

    function onKeyUp(code) {}

    function cleanup() {
        particles = [];
        gardenParticles = [];
        coalition = [];
        insightOrbs = [];
    }

    return {
        init,
        update,
        render,
        cleanup,
        onResize,
        onMouseDown,
        onMouseUp,
        onKeyDown,
        onKeyUp
    };
})();
