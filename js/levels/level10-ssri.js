// Level 10 — SSRIs: MUCH MORE THAN YOU WANTED TO KNOW
// Body-Horror Puzzle / Internal Journey
// "The truth about antidepressants is complicated. They work, but not
//  as much as advertised. Effect sizes are small but real."
//
// Navigate your own brain. Serotonin rivers, receptor locks.
// SSRIs don't create serotonin — they block reuptake.
// The effect is subtle: 0.3 standard deviations. Grey becomes lighter grey.

const Level10SSRI = (() => {
    let canvas, ctx;
    let W, H;

    // --- STATE ---
    let hamd = 24; // Hamilton Depression Rating Scale (0-52, higher = worse)
    let serotonin = 30; // 0-100 current flow
    let reuptakeRate = 80; // how fast serotonin drains (0-100)
    let receptorSensitivity = 50; // how well receptors respond
    let medication = null; // 'ssri', 'maoi', or null
    let medicationDay = 0;
    let medicationEffectSize = 0; // builds over time
    let individualVariation = 0; // random per playthrough: -0.3 to 0.3
    let phase = 'intro'; // 'intro', 'landscape', 'treatment', 'waiting', 'kirsch', 'stable', 'result'
    let day = 0;
    const MAX_DAYS = 60;
    let dayTimer = 0;
    const DAY_LENGTH = 1.5;
    let skyBrightness = 0.1; // 0 = pitch black, 1 = sunny
    let gravity = 1.5; // > 1 = heavy
    let musicPresent = false;
    let activities = [];
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let sideEffects = [];
    let canGetOutOfBed = false;
    let kirschDefeated = false;
    let deepDive = 0; // "much more than you wanted to know" counter
    let particles = []; // serotonin particles
    let transporters = []; // reuptake transporters
    let receptors = []; // receptor sites

    // MAOI restrictions
    let maioFoods = { cheese: true, chocolate: true, beer: true, kimchi: true };
    let maioViolation = false;

    // Individual variation (each playthrough is different)
    let ssriWorks = false;
    let ssriEffectiveness = 0; // 0-1

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
    }

    function resetState() {
        // Roll individual variation
        individualVariation = (Math.random() - 0.5) * 0.6;
        ssriEffectiveness = 0.3 + individualVariation; // 0.0 to 0.6
        ssriWorks = ssriEffectiveness > 0.15;

        hamd = 20 + Math.floor(Math.random() * 10); // 20-29 (moderate to severe)
        serotonin = 20 + Math.floor(Math.random() * 20);
        reuptakeRate = 70 + Math.floor(Math.random() * 20);
        receptorSensitivity = 40 + Math.floor(Math.random() * 20);
        medication = null;
        medicationDay = 0;
        medicationEffectSize = 0;
        phase = 'intro';
        day = 0;
        dayTimer = 0;
        skyBrightness = 0.05 + (1 - hamd / 52) * 0.3;
        gravity = 1 + hamd / 52;
        musicPresent = false;
        activities = [];
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        sideEffects = [];
        canGetOutOfBed = hamd < 15;
        kirschDefeated = false;
        deepDive = 0;
        maioFoods = { cheese: true, chocolate: true, beer: true, kimchi: true };
        maioViolation = false;

        generateBrainscape();
    }

    function generateBrainscape() {
        particles = [];
        transporters = [];
        receptors = [];

        // Serotonin particles (flowing)
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * W * 0.7,
                y: 200 + Math.random() * (H - 350),
                vx: 0.3 + Math.random() * 0.5,
                vy: (Math.random() - 0.5) * 0.3,
                size: 3 + Math.random() * 3,
                active: Math.random() < serotonin / 100,
                reuptakeTimer: 0
            });
        }

        // Reuptake transporters (blockers when SSRI active)
        for (let i = 0; i < 8; i++) {
            transporters.push({
                x: 100 + (W * 0.6 / 8) * i,
                y: H * 0.7 + (Math.random() - 0.5) * 60,
                blocked: false,
                size: 15
            });
        }

        // Receptors (locks)
        for (let i = 0; i < 5; i++) {
            receptors.push({
                x: W * 0.65 + Math.random() * W * 0.15,
                y: 250 + (H - 400) / 5 * i,
                activated: false,
                sensitivity: receptorSensitivity
            });
        }
    }

    function onResize(w, h) { W = w; H = h; }

    // --- UPDATE ---
    function update(dt, input) {
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 3) { showTutorial = false; phase = 'landscape'; }
            }
            return;
        }

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insight = "This medication has an effect size of approximately 0.3. You are slightly better. That slight improvement may be the difference between living and not living. That is enough.";
                showInsightPopup(10, insight, () => returnToMenu());
            }
            return;
        }

        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 10; return m.alpha > 0; });

        // Day progression
        dayTimer += dt;
        if (dayTimer >= DAY_LENGTH) {
            dayTimer = 0;
            day++;
            advanceDay();
            if (day >= MAX_DAYS) {
                phase = 'result';
                finalizeResult();
                return;
            }
        }

        // Update brain simulation
        updateBrainscape(dt);

        // Update environment based on HAM-D
        skyBrightness = 0.05 + Math.max(0, (1 - hamd / 40)) * 0.5;
        gravity = 1 + (hamd / 52) * 0.8;
        musicPresent = hamd < 12;
        canGetOutOfBed = hamd < 18;

        // Kirsch boss appears when you dig into mechanics
        if (deepDive >= 3 && !kirschDefeated && phase !== 'kirsch') {
            phase = 'kirsch';
        }

        handleInput(input);
    }

    function advanceDay() {
        if (!medication) return;

        medicationDay++;

        if (medication === 'ssri') {
            // SSRIs take ~30 days to fully work
            if (medicationDay < 7) {
                // First week: side effects, no benefit
                if (medicationDay === 1) addSideEffect('Nausea');
                if (medicationDay === 3) addSideEffect('Insomnia');
                if (medicationDay === 5) addSideEffect('Mild headache');
            } else if (medicationDay < 14) {
                // Week 2: maybe slight change
                medicationEffectSize = ssriEffectiveness * 0.2;
            } else if (medicationDay < 30) {
                // Week 2-4: gradual improvement
                medicationEffectSize = ssriEffectiveness * (medicationDay / 30);
                sideEffects = sideEffects.filter(s => Math.random() > 0.3); // side effects fade
            } else {
                // Full effect
                medicationEffectSize = ssriEffectiveness;
            }

            // SSRI mechanism: reduce reuptake rate
            reuptakeRate = Math.max(20, 80 - medicationEffectSize * 60);

            // HAM-D improvement
            const targetHamd = Math.max(5, hamd * (1 - medicationEffectSize * 0.4));
            hamd = hamd + (targetHamd - hamd) * 0.05;
        }

        if (medication === 'maoi') {
            // MAOIs: more effective but dietary restrictions
            if (medicationDay < 5) {
                if (medicationDay === 1) addSideEffect('Dizziness');
            } else {
                medicationEffectSize = Math.min(0.7, medicationDay * 0.03);
                reuptakeRate = Math.max(10, 80 - medicationEffectSize * 80);
                const targetHamd = Math.max(3, hamd * (1 - medicationEffectSize * 0.5));
                hamd = hamd + (targetHamd - hamd) * 0.07;
            }

            // Check MAOI violations
            if (maioViolation) {
                hamd = Math.min(40, hamd + 5);
                addMessage('HYPERTENSIVE CRISIS! Forbidden food detected!', W / 2, H * 0.3, '#cc3030');
                maioViolation = false;
            }
        }

        // Severely depressed benefit most
        if (hamd > 25) {
            hamd -= 0.3; // extra benefit for severe cases
        }

        // Random variation
        hamd += (Math.random() - 0.5) * 1.5;
        hamd = Math.max(0, Math.min(52, hamd));

        // Serotonin flow based on reuptake
        serotonin = Math.min(100, 100 - reuptakeRate + Math.random() * 10);
    }

    function addSideEffect(name) {
        sideEffects.push({ name, day: medicationDay });
        addMessage(`Side effect: ${name}`, W / 2, H * 0.4, '#cc8a60');
    }

    function updateBrainscape(dt) {
        // Move serotonin particles
        for (const p of particles) {
            if (!p.active) {
                // Reuptake: inactive particles flow back
                p.reuptakeTimer += dt * (reuptakeRate / 100);
                if (p.reuptakeTimer > 2) {
                    p.active = Math.random() < serotonin / 100;
                    p.reuptakeTimer = 0;
                }
                p.x -= dt * 20;
                if (p.x < 0) p.x = W * 0.5;
                continue;
            }

            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.vy += (Math.random() - 0.5) * dt * 2;

            // Reuptake (unless blocked)
            for (const t of transporters) {
                if (!t.blocked) {
                    const dx = p.x - t.x, dy = p.y - t.y;
                    if (dx * dx + dy * dy < t.size * t.size * 4) {
                        p.active = false;
                        p.reuptakeTimer = 0;
                    }
                }
            }

            // Activate receptors
            for (const r of receptors) {
                const dx = p.x - r.x, dy = p.y - r.y;
                if (dx * dx + dy * dy < 400) {
                    r.activated = true;
                    setTimeout(() => { r.activated = false; }, 500);
                }
            }

            // Wrap
            if (p.x > W * 0.8) { p.x = 50; p.active = Math.random() < serotonin / 100; }
            if (p.y < 180) p.y = 180;
            if (p.y > H - 160) p.y = H - 160;
        }

        // Update transporters (blocked by SSRI)
        for (const t of transporters) {
            t.blocked = medication === 'ssri' && medicationDay > 2;
        }
    }

    function handleInput(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        if (phase === 'kirsch') {
            handleKirschClick(mx, my);
            return;
        }

        if (phase === 'landscape' || phase === 'treatment' || phase === 'waiting') {
            handleMainClick(mx, my);
        }
    }

    function handleMainClick(mx, my) {
        const panelX = W * 0.72;

        // Treatment choices
        if (mx >= panelX) {
            let btnY = 100;
            const btnH = 38;
            const gap = 8;

            // SSRI button
            if (my >= btnY && my <= btnY + btnH && !medication) {
                medication = 'ssri';
                phase = 'waiting';
                addMessage('Started SSRI. Now... we wait.', W / 2, H * 0.3, '#4488cc');
                return;
            }
            btnY += btnH + gap;

            // MAOI button
            if (my >= btnY && my <= btnY + btnH && !medication) {
                medication = 'maoi';
                phase = 'waiting';
                addMessage('Started MAOI. No cheese. No chocolate. No beer. No kimchi.', W / 2, H * 0.3, '#cc8a20');
                return;
            }
            btnY += btnH + gap;

            // "Much More" button (dig deeper)
            if (my >= btnY && my <= btnY + btnH) {
                deepDive++;
                addMessage('"Much More Than You Wanted To Know"', W / 2, H * 0.2, '#6a5890');
                return;
            }
            btnY += btnH + gap;

            // MAOI food buttons (if MAOI selected)
            if (medication === 'maoi') {
                const foods = [
                    { key: 'cheese', label: 'Eat Cheese', emoji: '\u{1F9C0}' },
                    { key: 'chocolate', label: 'Eat Chocolate', emoji: '\u{1F36B}' },
                    { key: 'beer', label: 'Drink Beer', emoji: '\u{1F37A}' },
                    { key: 'kimchi', label: 'Eat Kimchi', emoji: '\u{1F962}' }
                ];
                btnY += 10;
                for (const food of foods) {
                    if (my >= btnY && my <= btnY + 28) {
                        if (maioFoods[food.key]) {
                            maioFoods[food.key] = false;
                            maioViolation = true;
                            addMessage(`You ate ${food.key}! That's forbidden on MAOIs!`, W / 2, H * 0.4, '#cc3030');
                        }
                        return;
                    }
                    btnY += 32;
                }
            }

            // Activity buttons
            btnY = H * 0.6;
            const activities = [
                { name: 'Try to get out of bed', effect: canGetOutOfBed ? -0.5 : 0 },
                { name: 'Go for a walk', effect: canGetOutOfBed ? -0.3 : 0 },
                { name: 'Talk to someone', effect: -0.2 },
            ];
            for (const act of activities) {
                if (my >= btnY && my <= btnY + 30) {
                    if (!canGetOutOfBed && act.name !== 'Talk to someone') {
                        addMessage('Too heavy. Can\'t move.', W / 2, H * 0.5, '#6a5890');
                    } else {
                        hamd = Math.max(0, hamd + act.effect);
                        addMessage(act.name, W / 2, H * 0.5, '#4488cc');
                    }
                    return;
                }
                btnY += 34;
            }
        }
    }

    function handleKirschClick(mx, my) {
        // Kirsch boss: answer his challenge
        const btnY = H * 0.6;
        // "Accept uncertainty" button
        if (mx >= W * 0.15 && mx <= W * 0.48 && my >= btnY && my <= btnY + 50) {
            kirschDefeated = true;
            phase = medication ? 'waiting' : 'landscape';
            addMessage('You accept the uncertainty. The effect may be small. But it may be real.', W / 2, H * 0.3, '#ffd764');
            return;
        }
        // "Question everything" button
        if (mx >= W * 0.52 && mx <= W * 0.85 && my >= btnY && my <= btnY + 50) {
            kirschDefeated = true;
            deepDive += 2;
            phase = medication ? 'waiting' : 'landscape';
            addMessage('You question everything. Including your questioning.', W / 2, H * 0.3, '#cc8a60');
            return;
        }
    }

    function finalizeResult() {
        Protagonist.addInsight(10, "This medication has an effect size of approximately 0.3. You are slightly better. That slight improvement may be the difference between living and not living. That is enough.");
        Protagonist.completeLevel(10, hamd < 15 ? 'stable' : 'surviving');
        Protagonist.recordConnection();
        Protagonist.save();
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 2, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;

        // Sky based on depression level
        const skyR = Math.floor(40 + skyBrightness * 60);
        const skyG = Math.floor(35 + skyBrightness * 60);
        const skyB = Math.floor(60 + skyBrightness * 40);
        ctx.fillStyle = `rgb(${skyR}, ${skyG}, ${skyB})`;
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }
        if (phase === 'kirsch') { renderKirsch(ctx); return; }

        renderBrainscape(ctx);
        renderWeather(ctx);
        renderPanel(ctx);
        renderHAMD(ctx);
        renderMessages(ctx);
    }

    function renderBrainscape(ctx) {
        // Synapse background
        ctx.fillStyle = `rgba(20, 15, 30, 0.3)`;
        ctx.fillRect(0, 150, W * 0.72, H - 280);

        // Label
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(150, 130, 180, 0.4)';
        ctx.textAlign = 'left';
        ctx.fillText('THE SYNAPSE', 10, 165);

        // Serotonin river (flow indicator)
        ctx.fillStyle = `rgba(100, 160, 255, ${serotonin / 200})`;
        ctx.fillRect(30, H * 0.45, W * 0.6 * (serotonin / 100), 4);

        // Transporters
        for (const t of transporters) {
            if (t.blocked) {
                // Blocked by SSRI
                ctx.fillStyle = 'rgba(200, 60, 60, 0.6)';
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#cc3030';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(t.x - t.size, t.y - t.size);
                ctx.lineTo(t.x + t.size, t.y + t.size);
                ctx.stroke();
                // X mark
            } else {
                // Open transporter (draining serotonin)
                ctx.fillStyle = 'rgba(100, 80, 120, 0.5)';
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(140, 120, 160, 0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Receptors
        for (const r of receptors) {
            ctx.fillStyle = r.activated ? 'rgba(100, 200, 100, 0.7)' : 'rgba(80, 80, 120, 0.5)';
            ctx.fillRect(r.x - 8, r.y - 12, 16, 24);
            ctx.strokeStyle = r.activated ? '#40b060' : '#5a5a8a';
            ctx.lineWidth = 1;
            ctx.strokeRect(r.x - 8, r.y - 12, 16, 24);
            // Keyhole
            ctx.fillStyle = r.activated ? '#60cc60' : '#3a3a5a';
            ctx.beginPath();
            ctx.arc(r.x, r.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Serotonin particles
        for (const p of particles) {
            if (p.active) {
                ctx.fillStyle = `rgba(100, 180, 255, ${0.6 + Math.random() * 0.3})`;
            } else {
                ctx.fillStyle = 'rgba(60, 60, 80, 0.3)';
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Labels
        if (medication === 'ssri' && medicationDay > 2) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = 'rgba(200, 80, 80, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('REUPTAKE BLOCKED', W * 0.35, H * 0.75);
            ctx.fillText('Serotonin flows longer', W * 0.35, H * 0.77);
        }
    }

    function renderWeather(ctx) {
        // Top portion: sky/weather representing mood
        const gradient = ctx.createLinearGradient(0, 0, 0, 150);
        const bright = skyBrightness;
        gradient.addColorStop(0, `rgba(${40 + bright * 100}, ${40 + bright * 100}, ${60 + bright * 80}, 1)`);
        gradient.addColorStop(1, `rgba(${30 + bright * 40}, ${25 + bright * 40}, ${50 + bright * 30}, 0.5)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W * 0.72, 150);

        // Grey clouds
        if (skyBrightness < 0.4) {
            for (let i = 0; i < 5; i++) {
                const cx = (i * W * 0.15 + day * 3) % (W * 0.8);
                ctx.fillStyle = `rgba(60, 55, 70, ${0.5 - skyBrightness})`;
                ctx.beginPath();
                ctx.arc(cx, 40 + i * 15, 30 + i * 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Gravity indicator
        ctx.font = '10px sans-serif';
        ctx.fillStyle = `rgba(200, 200, 220, ${gravity - 1})`;
        ctx.textAlign = 'left';
        ctx.fillText(gravity > 1.3 ? 'Everything feels heavy...' : gravity > 1.1 ? 'A slight heaviness.' : '', 15, 140);

        // Music indicator
        if (musicPresent) {
            ctx.font = '12px serif';
            ctx.fillStyle = 'rgba(255, 215, 100, 0.5)';
            ctx.fillText('\u266B Music returns...', W * 0.5, 135);
        }
    }

    function renderPanel(ctx) {
        const panelX = W * 0.72;
        ctx.fillStyle = 'rgba(20, 16, 30, 0.95)';
        ctx.fillRect(panelX, 0, W - panelX, H);
        ctx.strokeStyle = '#3d3060';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panelX, 0); ctx.lineTo(panelX, H); ctx.stroke();

        let y = 20;
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText(`Day ${day}/${MAX_DAYS}`, panelX + 10, y);
        y += 20;

        // Serotonin flow
        ctx.fillStyle = '#6488cc';
        ctx.fillText(`Serotonin: ${Math.floor(serotonin)}%`, panelX + 10, y);
        Engine.drawBar(ctx, panelX + 10, y + 4, W - panelX - 20, 8, serotonin, 100, '#4488cc', '#1a1a28');
        y += 22;

        // Reuptake rate
        ctx.fillStyle = '#8a6a9a';
        ctx.fillText(`Reuptake: ${Math.floor(reuptakeRate)}%`, panelX + 10, y);
        Engine.drawBar(ctx, panelX + 10, y + 4, W - panelX - 20, 8, reuptakeRate, 100, '#8a5a9a', '#1a1a28');
        y += 28;

        // Treatment
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('TREATMENT', panelX + 10, y);
        y += 16;

        const btnH = 38, gap = 8;
        if (!medication) {
            // SSRI button
            ctx.fillStyle = '#141a24';
            ctx.fillRect(panelX + 5, y, W - panelX - 10, btnH);
            ctx.strokeStyle = '#4488cc';
            ctx.lineWidth = 1;
            ctx.strokeRect(panelX + 5, y, W - panelX - 10, btnH);
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#4488cc';
            ctx.fillText('Start SSRI', panelX + 12, y + 15);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#446688';
            ctx.fillText('Block reuptake. Takes ~30 days.', panelX + 12, y + 28);
            y += btnH + gap;

            // MAOI button
            ctx.fillStyle = '#1a1420';
            ctx.fillRect(panelX + 5, y, W - panelX - 10, btnH);
            ctx.strokeStyle = '#cc8a20';
            ctx.lineWidth = 1;
            ctx.strokeRect(panelX + 5, y, W - panelX - 10, btnH);
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#cc8a20';
            ctx.fillText('Start MAOI', panelX + 12, y + 15);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#aa7830';
            ctx.fillText('More effective. No cheese/choc/beer/kimchi.', panelX + 12, y + 28);
            y += btnH + gap;
        } else {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = medication === 'ssri' ? '#4488cc' : '#cc8a20';
            ctx.fillText(`On ${medication.toUpperCase()} — Day ${medicationDay}`, panelX + 10, y + 12);
            y += 20;
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText(`Effect size: ${(medicationEffectSize * 100).toFixed(0)}% of max`, panelX + 10, y + 12);
            y += 20;

            if (sideEffects.length > 0) {
                ctx.fillStyle = '#cc8a60';
                ctx.fillText('Side effects:', panelX + 10, y + 12);
                y += 14;
                for (const se of sideEffects) {
                    ctx.fillText(`- ${se.name}`, panelX + 14, y + 12);
                    y += 13;
                }
            }
            y += 10;
        }

        // "Much More" button
        ctx.fillStyle = '#141420';
        ctx.fillRect(panelX + 5, y, W - panelX - 10, btnH);
        ctx.strokeStyle = '#6a5890';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 5, y, W - panelX - 10, btnH);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('"Much More Than You', panelX + 12, y + 14);
        ctx.fillText('Wanted To Know"', panelX + 12, y + 26);
        y += btnH + gap;

        // MAOI forbidden foods
        if (medication === 'maoi') {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#cc3030';
            ctx.fillText('FORBIDDEN FOODS:', panelX + 10, y + 5);
            y += 18;
            const foods = [
                { key: 'cheese', label: 'Cheese \u{1F9C0}' },
                { key: 'chocolate', label: 'Chocolate \u{1F36B}' },
                { key: 'beer', label: 'Beer \u{1F37A}' },
                { key: 'kimchi', label: 'Kimchi \u{1F962}' }
            ];
            for (const food of foods) {
                ctx.fillStyle = maioFoods[food.key] ? '#1a1420' : '#2a1a1a';
                ctx.fillRect(panelX + 5, y, W - panelX - 10, 28);
                ctx.strokeStyle = maioFoods[food.key] ? '#cc3030' : '#5a3030';
                ctx.lineWidth = 1;
                ctx.strokeRect(panelX + 5, y, W - panelX - 10, 28);
                ctx.font = '11px sans-serif';
                ctx.fillStyle = maioFoods[food.key] ? '#cc3030' : '#5a3030';
                ctx.fillText(`${maioFoods[food.key] ? '\u2716 ' : '\u2714 '}${food.label}`, panelX + 12, y + 18);
                y += 32;
            }
        }

        // Activities
        y = Math.max(y + 10, H * 0.6);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('DAILY ACTIVITIES', panelX + 10, y);
        y += 14;

        const acts = [
            { name: canGetOutOfBed ? 'Get out of bed' : 'Try to get out of bed...', possible: true },
            { name: 'Go for a walk', possible: canGetOutOfBed },
            { name: 'Talk to someone', possible: true },
        ];
        for (const act of acts) {
            ctx.fillStyle = '#141420';
            ctx.fillRect(panelX + 5, y, W - panelX - 10, 28);
            ctx.strokeStyle = act.possible ? '#3d5060' : '#2a2a3a';
            ctx.lineWidth = 1;
            ctx.strokeRect(panelX + 5, y, W - panelX - 10, 28);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = act.possible ? '#8090a0' : '#4a4a5a';
            ctx.fillText(act.name, panelX + 12, y + 18);
            y += 32;
        }
    }

    function renderHAMD(ctx) {
        // HAM-D score (always visible)
        const barX = 10, barY = H - 50;
        const barW = W * 0.7 - 20;

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText(`HAM-D Depression Scale: ${hamd.toFixed(1)}`, barX, barY - 5);

        // Color-coded bar
        const ratio = hamd / 52;
        const color = ratio > 0.5 ? '#cc3030' : ratio > 0.3 ? '#cc8a30' : ratio > 0.15 ? '#88aa44' : '#40b060';
        Engine.drawBar(ctx, barX, barY + 2, barW, 12, hamd, 52, color, '#1a1a28');

        // Labels
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#6a5890';
        const labels = [
            { pos: 0, text: 'Normal' },
            { pos: 7 / 52, text: 'Mild' },
            { pos: 14 / 52, text: 'Moderate' },
            { pos: 24 / 52, text: 'Severe' },
            { pos: 1, text: 'Very Severe' }
        ];
        for (const l of labels) {
            ctx.fillText(l.text, barX + barW * l.pos, barY + 24);
        }

        // Current marker
        ctx.fillStyle = '#ffd764';
        ctx.fillRect(barX + barW * ratio - 1, barY, 2, 14);

        // Effect size display
        if (medication && medicationDay > 7) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.textAlign = 'left';
            ctx.fillText(`Effect size: ~${(ssriEffectiveness * 0.3 / 0.3).toFixed(1)} SD (${ssriWorks ? 'responding' : 'minimal response'})`, barX, barY + 36);
        }
    }

    function renderKirsch(ctx) {
        ctx.fillStyle = 'rgba(10, 5, 15, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;

        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#aa8855';
        ctx.textAlign = 'center';
        ctx.fillText('IRVING KIRSCH APPEARS', cx, H * 0.15);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('"Associate Director of the Program for Placebo Studies"', cx, H * 0.22);

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        const kirschText = [
            '"Is any of this real?"',
            '',
            '"The effect size of SSRIs is approximately 0.3',
            'standard deviations on the HAM-D scale."',
            '',
            '"That\'s the difference between',
            '\'very severely depressed\' and \'severely depressed.\'"',
            '',
            '"Is that enough? Is that real?"',
            '"Or is it just placebo?"',
        ];
        let y = H * 0.3;
        for (const line of kirschText) {
            ctx.fillText(line, cx, y); y += 22;
        }

        // Response buttons
        const btnY = H * 0.6;
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(W * 0.15, btnY, W * 0.33, 50);
        ctx.strokeStyle = '#40b060';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.15, btnY, W * 0.33, 50);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#40b060';
        ctx.textAlign = 'center';
        ctx.fillText('Accept Uncertainty', W * 0.315, btnY + 20);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#408050';
        ctx.fillText('"Small but real is enough."', W * 0.315, btnY + 38);

        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(W * 0.52, btnY, W * 0.33, 50);
        ctx.strokeStyle = '#9060d0';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.52, btnY, W * 0.33, 50);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#9060d0';
        ctx.textAlign = 'center';
        ctx.fillText('Question Everything', W * 0.685, btnY + 20);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#7050a0';
        ctx.fillText('"Much More Than I Wanted To Know."', W * 0.685, btnY + 38);
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.06;

        // The ending is NOT triumphant. It's realistic.
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = hamd < 10 ? '#88aa55' : hamd < 18 ? '#aa8855' : '#aa6655';
        ctx.textAlign = 'center';

        if (hamd < 10) {
            ctx.fillText('STABLE', cx, y);
        } else if (hamd < 18) {
            ctx.fillText('FUNCTIONAL', cx, y);
        } else {
            ctx.fillText('SURVIVING', cx, y);
        }
        y += 35;

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText(`Final HAM-D Score: ${hamd.toFixed(1)}`, cx, y); y += 22;
        ctx.fillText(`Days: ${day}`, cx, y); y += 22;
        if (medication) {
            ctx.fillText(`Medication: ${medication.toUpperCase()} (Day ${medicationDay})`, cx, y); y += 22;
            ctx.fillText(`Effect Size: ~${(medicationEffectSize).toFixed(2)} (${ssriWorks ? 'responded' : 'minimal'})`, cx, y); y += 22;
        }
        y += 10;

        // The Message
        ctx.font = 'bold 14px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('THE MESSAGE', cx, y); y += 25;

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        const messageLines = [
            'This is not a triumphant ending.',
            'It\'s a realistic one.',
            '',
            'The sun doesn\'t come out.',
            'But you can get out of bed.',
            '',
        ];
        for (const line of messageLines) {
            ctx.fillText(line, cx, y); y += 22;
        }

        ctx.font = 'italic 14px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText('"This medication has an effect size', cx, y); y += 22;
        ctx.fillText('of approximately 0.3."', cx, y); y += 22;
        ctx.fillText('"You are slightly better."', cx, y); y += 22;
        ctx.fillText('"That slight improvement may be the difference', cx, y); y += 22;
        ctx.fillText('between living and not living."', cx, y); y += 22;
        ctx.font = 'bold italic 16px serif';
        ctx.fillText('"That is enough."', cx, y); y += 35;

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, y);
    }

    function renderMessages(ctx) {
        for (const m of messages) {
            ctx.font = '13px sans-serif';
            ctx.globalAlpha = Math.max(0, m.alpha);
            ctx.fillStyle = m.color;
            ctx.textAlign = 'center';
            ctx.fillText(m.text, m.x, m.y);
            ctx.globalAlpha = 1;
        }
    }

    function renderTutorial(ctx) {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'SSRIs — MUCH MORE THAN YOU WANTED TO KNOW',
                text: 'Your brain is a world.\nSerotonin transporters are structures.\nReceptors are locks.\nNeurotransmitters are flowing rivers.\n\nSomething is wrong.\nGrey skies. Heavy gravity. No music.'
            },
            {
                title: 'THE MEDICATION',
                text: 'SSRIs don\'t create serotonin.\nThey block reuptake — the rivers flow longer\nbefore draining.\n\nThey take a month to work.\nThe game makes you wait.\n\nSide effects come first.'
            },
            {
                title: 'THE EFFECT SIZE',
                text: 'When things improve, it\'s subtle.\nNot a transformation.\nAn 0.3 standard deviation improvement.\n\nThe grey doesn\'t become sunshine.\nIt becomes slightly lighter grey.\n\nEach playthrough is different.\nSometimes SSRIs work. Sometimes they don\'t.'
            },
            {
                title: 'YOUR JOURNEY',
                text: 'Navigate 60 days.\nChoose a treatment (or don\'t).\nWatch the serotonin flow.\nFeel the weather change (or not).\n\nThe goal is not perfect.\nThe goal is functional.\n\nClick to begin.'
            }
        ];
        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#6a88aa';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, cx, cy - 120);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#c0c8d8';
        step.text.split('\n').forEach((line, i) => {
            ctx.fillText(line, cx, cy - 50 + i * 22);
        });
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Click to continue (${tutorialStep + 1}/${steps.length})`, cx, cy + 160);
    }

    function cleanup() {}
    function onMouseDown() {}
    function onMouseUp() {}
    function onKeyDown() {}
    function onKeyUp() {}

    return {
        init, update, render, cleanup,
        onResize, onMouseDown, onMouseUp, onKeyDown, onKeyUp
    };
})();
