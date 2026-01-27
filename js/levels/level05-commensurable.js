// Level 05 — NOBODY IS PERFECT, EVERYTHING IS COMMENSURABLE
// Resource Management / Moral Accounting Game
// "You don't have to be a saint to help."
//
// Manage time, money, energy, willpower. Demands scroll past.
// Trying to do everything = paralysis. The 10% pledge = sustainability.

const Level05Commensurable = (() => {
    let canvas, ctx;
    let W, H;

    // --- STATE ---
    let resources = { time: 100, money: 80, energy: 100, willpower: 80 };
    const MAX_RESOURCES = { time: 100, money: 100, energy: 100, willpower: 100 };
    let qalyScore = 0;
    let burnoutLevel = 0; // 0-100
    let phase = 'playing'; // 'playing', 'pledge', 'result'
    let demands = []; // scrolling demands
    let activePledge = null; // { resource, percent, cause }
    let dayNumber = 0;
    const MAX_DAYS = 30;
    let dayTimer = 0;
    const DAY_LENGTH = 4; // seconds per day
    let selfCareActions = 0;
    let demandsFulfilled = 0;
    let demandsIgnored = 0;
    let paralyzed = false;
    let paralyzeTimer = 0;
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let thirdServant = false; // buried talent reference
    let sustainableGood = 0;
    let totalGoodAttempted = 0;
    let pledgeDaysTaken = 0;
    let netflixQALY = 0; // tracking "wasted" time
    let demandQueue = [];
    let scrollY = 0;

    // Demand templates
    const DEMAND_TEMPLATES = [
        { text: 'Reblog this or you don\'t care about Yemen', resource: 'time', cost: 10, good: 2, urgency: 'high' },
        { text: 'If you have time for Netflix, you have time to fight climate change', resource: 'energy', cost: 20, good: 5, urgency: 'guilt' },
        { text: 'Donate to the earthquake relief fund NOW', resource: 'money', cost: 25, good: 8, urgency: 'high' },
        { text: 'Attend the protest this weekend', resource: 'time', cost: 15, good: 3, urgency: 'medium' },
        { text: 'Sign this petition (and share it)', resource: 'willpower', cost: 5, good: 1, urgency: 'low' },
        { text: 'Your silence is complicity', resource: 'willpower', cost: 15, good: 0, urgency: 'guilt' },
        { text: 'Educate yourself on this issue', resource: 'time', cost: 12, good: 2, urgency: 'medium' },
        { text: 'If you can reblog fandom stuff, you can reblog Pakistan', resource: 'energy', cost: 10, good: 2, urgency: 'guilt' },
        { text: 'Call your representatives about gun reform', resource: 'willpower', cost: 10, good: 4, urgency: 'medium' },
        { text: 'Volunteer at the food bank', resource: 'time', cost: 20, good: 7, urgency: 'medium' },
        { text: 'Buy only ethical products', resource: 'money', cost: 30, good: 3, urgency: 'low' },
        { text: 'Check your privilege', resource: 'willpower', cost: 8, good: 0, urgency: 'guilt' },
        { text: 'Donate 50% of your income like Peter Singer says', resource: 'money', cost: 50, good: 20, urgency: 'extreme' },
        { text: 'Go vegan for the environment', resource: 'willpower', cost: 25, good: 6, urgency: 'medium' },
        { text: 'Foster a rescue animal', resource: 'time', cost: 30, good: 5, urgency: 'low' },
        { text: 'Read this 10,000 word thread on why you\'re wrong', resource: 'energy', cost: 15, good: 1, urgency: 'guilt' },
    ];

    // Self-care actions
    const SELF_CARE = [
        { name: 'Rest', resource: 'energy', restore: 15, qalyCost: 0 },
        { name: 'Watch Netflix', resource: 'willpower', restore: 10, qalyCost: 0, netflix: true },
        { name: 'See a friend', resource: 'willpower', restore: 12, qalyCost: 0 },
        { name: 'Take a walk', resource: 'energy', restore: 10, qalyCost: 0 },
        { name: 'Earn money', resource: 'money', restore: 20, qalyCost: 0, costsTime: 15 },
    ];

    // Pledge options
    const PLEDGE_OPTIONS = [
        { resource: 'money', percent: 10, cause: 'GiveDirectly', qalyPerDay: 3 },
        { resource: 'time', percent: 10, cause: 'Local volunteering', qalyPerDay: 2 },
        { resource: 'energy', percent: 10, cause: 'Consistent advocacy', qalyPerDay: 2.5 },
    ];

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
    }

    function resetState() {
        resources = { time: 100, money: 80, energy: 100, willpower: 80 };
        qalyScore = 0;
        burnoutLevel = 0;
        phase = 'playing';
        demands = [];
        activePledge = null;
        dayNumber = 0;
        dayTimer = 0;
        selfCareActions = 0;
        demandsFulfilled = 0;
        demandsIgnored = 0;
        paralyzed = false;
        paralyzeTimer = 0;
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        thirdServant = false;
        sustainableGood = 0;
        totalGoodAttempted = 0;
        pledgeDaysTaken = 0;
        netflixQALY = 0;
        demandQueue = [];
        scrollY = 0;
        generateDemands();
    }

    function generateDemands() {
        demandQueue = [];
        for (let i = 0; i < 50; i++) {
            const template = DEMAND_TEMPLATES[Math.floor(Math.random() * DEMAND_TEMPLATES.length)];
            demandQueue.push({ ...template, id: i, fulfilled: false, expired: false, y: 0, alpha: 1 });
        }
    }

    function onResize(w, h) { W = w; H = h; }

    // --- UPDATE ---
    function update(dt, input) {
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 2) showTutorial = false;
            }
            return;
        }

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insight = qalyScore > 30 ?
                    "You are allowed to not be perfect. 10% forever beats 100% once." :
                    "Perfectionism is the enemy of good. The third servant buried his talent.";
                showInsightPopup(5, insight, () => returnToMenu());
            }
            return;
        }

        // Day progression
        dayTimer += dt;
        if (dayTimer >= DAY_LENGTH) {
            dayTimer = 0;
            dayNumber++;
            advanceDay();
            if (dayNumber >= MAX_DAYS) {
                phase = 'result';
                finalizeResult();
                return;
            }
        }

        // Paralysis
        if (paralyzed) {
            paralyzeTimer -= dt;
            if (paralyzeTimer <= 0) {
                paralyzed = false;
            }
            return; // Can't act while paralyzed
        }

        // Scroll demands
        scrollY += dt * 20;

        // Manage visible demands
        if (demands.length < 4 && demandQueue.length > 0) {
            const next = demandQueue.shift();
            next.y = H + 20;
            demands.push(next);
        }

        for (const d of demands) {
            d.y -= dt * 18;
            if (d.y < -60) d.expired = true;
        }
        const expiredBefore = demands.filter(d => d.expired && !d.fulfilled).length;
        demands = demands.filter(d => !d.expired || d.fulfilled);
        demandsIgnored += expiredBefore;

        // Burnout
        const anyLow = Object.values(resources).some(v => v < 15);
        if (anyLow) {
            burnoutLevel = Math.min(100, burnoutLevel + dt * 5);
        } else {
            burnoutLevel = Math.max(0, burnoutLevel - dt * 2);
        }

        // Paralysis check
        if (burnoutLevel >= 80) {
            paralyzed = true;
            paralyzeTimer = 3;
            addMessage('PARALYSIS — Too depleted to act!', W / 2, H / 2, '#cc3030');
        }

        // Resource natural drain
        resources.time = Math.max(0, resources.time - dt * 1.5);
        resources.energy = Math.max(0, resources.energy - dt * 1.0);
        resources.willpower = Math.max(0, resources.willpower - dt * 0.8);

        // Pledge passive good
        if (activePledge) {
            const dailyGood = activePledge.qalyPerDay * dt / DAY_LENGTH;
            sustainableGood += dailyGood;
            qalyScore += dailyGood;
            // Pledge costs
            const dailyCost = MAX_RESOURCES[activePledge.resource] * (activePledge.percent / 100) * dt / DAY_LENGTH;
            resources[activePledge.resource] = Math.max(0, resources[activePledge.resource] - dailyCost * 0.3);
        }

        // Resource recovery (daily baseline)
        resources.time = Math.min(MAX_RESOURCES.time, resources.time + dt * 0.5);
        resources.money = Math.min(MAX_RESOURCES.money, resources.money + dt * 0.3);

        // Messages
        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 12; return m.alpha > 0; });

        handleInput(input);
    }

    function advanceDay() {
        // Daily resource restoration
        resources.energy = Math.min(MAX_RESOURCES.energy, resources.energy + 15);
        resources.willpower = Math.min(MAX_RESOURCES.willpower, resources.willpower + 8);
        resources.time = Math.min(MAX_RESOURCES.time, resources.time + 10);
        resources.money = Math.min(MAX_RESOURCES.money, resources.money + 5);

        if (activePledge) {
            pledgeDaysTaken++;
        }

        // Third servant check: if you've done nothing at all
        if (dayNumber > 10 && demandsFulfilled === 0 && !activePledge && selfCareActions === 0) {
            thirdServant = true;
            addMessage('You buried your talent in the ground...', W / 2, H * 0.3, '#cc8a60');
        }
    }

    function finalizeResult() {
        const insight = qalyScore > 30 ?
            "You are allowed to not be perfect. 10% forever beats 100% once." :
            "Perfectionism is the enemy of good. The third servant buried his talent.";
        Protagonist.addInsight(5, insight);
        Protagonist.completeLevel(5, activePledge ? 'pledge' : 'freestyle');
        if (activePledge) Protagonist.recordConnection();
        else Protagonist.recordOptimization();
        Protagonist.save();
    }

    function handleInput(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        if (phase === 'pledge') {
            handlePledgeClick(mx, my);
            return;
        }

        // Click on demand to fulfill
        for (const d of demands) {
            const dx = W * 0.05;
            const dw = W * 0.5;
            if (mx >= dx && mx <= dx + dw && my >= d.y - 20 && my <= d.y + 20) {
                if (resources[d.resource] >= d.cost) {
                    resources[d.resource] -= d.cost;
                    qalyScore += d.good;
                    totalGoodAttempted += d.good;
                    demandsFulfilled++;
                    d.fulfilled = true;
                    d.expired = true;
                    addMessage(`+${d.good} QALY`, mx, my - 20, '#40b060');
                    if (d.urgency === 'guilt') {
                        addMessage('(guilt-driven)', mx, my, '#cc8a60');
                    }
                } else {
                    addMessage(`Not enough ${d.resource}!`, mx, my - 20, '#cc3030');
                }
                return;
            }
        }

        // Self-care buttons (right panel)
        const panelX = W * 0.62;
        const careY = 200;
        for (let i = 0; i < SELF_CARE.length; i++) {
            const by = careY + i * 42;
            if (mx >= panelX && mx <= W - 10 && my >= by && my <= by + 35) {
                const care = SELF_CARE[i];
                if (care.costsTime && resources.time < care.costsTime) {
                    addMessage('Not enough time!', mx, my, '#cc3030');
                    return;
                }
                resources[care.resource] = Math.min(MAX_RESOURCES[care.resource], resources[care.resource] + care.restore);
                if (care.costsTime) resources.time -= care.costsTime;
                if (care.netflix) netflixQALY += 0.5;
                selfCareActions++;
                burnoutLevel = Math.max(0, burnoutLevel - 5);
                addMessage(`+${care.restore} ${care.resource}`, mx, my - 20, '#4488cc');
                return;
            }
        }

        // Pledge button
        const pledgeBtnY = careY + SELF_CARE.length * 42 + 20;
        if (mx >= panelX && mx <= W - 10 && my >= pledgeBtnY && my <= pledgeBtnY + 40) {
            phase = 'pledge';
            return;
        }

        // Commensurability toggle — convert everything to QALYs display
        // (always shown, just a visual reference)
    }

    function handlePledgeClick(mx, my) {
        const startY = H * 0.3;
        for (let i = 0; i < PLEDGE_OPTIONS.length; i++) {
            const by = startY + i * 70;
            if (mx >= W * 0.2 && mx <= W * 0.8 && my >= by && my <= by + 60) {
                activePledge = PLEDGE_OPTIONS[i];
                phase = 'playing';
                addMessage(`Pledged 10% of ${activePledge.resource} to ${activePledge.cause}!`, W / 2, H * 0.2, '#40b060');
                return;
            }
        }
        // Back
        if (my > H - 60) { phase = 'playing'; }
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 1.8, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        ctx.fillStyle = '#0e0a16';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }
        if (phase === 'pledge') { renderPledgeScreen(ctx); return; }

        renderResourceBars(ctx);
        renderDemands(ctx);
        renderRightPanel(ctx);
        renderBurnout(ctx);
        renderDayCounter(ctx);
        renderMessages(ctx);
        renderParalysis(ctx);
    }

    function renderResourceBars(ctx) {
        const barX = W * 0.55;
        const barW = W * 0.38;
        let y = 60;

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText('YOUR LIFE', barX + 5, y - 5);

        const bars = [
            { name: 'Time', key: 'time', color: '#4488cc' },
            { name: 'Money', key: 'money', color: '#cc9030' },
            { name: 'Energy', key: 'energy', color: '#40b060' },
            { name: 'Willpower', key: 'willpower', color: '#9060d0' },
        ];

        for (const bar of bars) {
            ctx.font = '11px sans-serif';
            ctx.fillStyle = bar.color;
            ctx.textAlign = 'left';
            ctx.fillText(`${bar.name}: ${Math.floor(resources[bar.key])}`, barX + 5, y + 12);
            Engine.drawBar(ctx, barX + 90, y + 4, barW - 95, 12, resources[bar.key], MAX_RESOURCES[bar.key], bar.color, '#1a1428');
            y += 26;
        }

        // QALY score
        y += 5;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText(`Total Good (QALYs): ${qalyScore.toFixed(1)}`, barX + 5, y + 12);

        // Commensurability note
        y += 20;
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Everything converts to QALY-equivalents.', barX + 5, y + 12);
        ctx.fillText('Your Netflix, your donations, your emotional labor —', barX + 5, y + 24);
        ctx.fillText('all on one scale. Liberating? Or horrifying?', barX + 5, y + 36);
    }

    function renderDemands(ctx) {
        const dx = W * 0.03;
        const dw = W * 0.52;

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText('THE DEMANDS', dx + 5, 55);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('(click to fulfill — or let them scroll past)', dx + 5, 68);

        // Clip region for demands
        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, 75, dw, H - 100);
        ctx.clip();

        for (const d of demands) {
            if (d.fulfilled) continue;
            const alpha = Math.min(1, Math.max(0.2, (d.y - 40) / 100));
            ctx.globalAlpha = alpha;

            const urgColors = {
                high: '#cc3030', guilt: '#cc8a20', medium: '#4488cc', low: '#40b060', extreme: '#ff2020'
            };
            const bgColor = d.urgency === 'guilt' ? '#1a1418' : '#141420';

            ctx.fillStyle = bgColor;
            ctx.fillRect(dx, d.y - 18, dw, 36);
            ctx.strokeStyle = urgColors[d.urgency] || '#3d3060';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx, d.y - 18, dw, 36);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            const maxTextW = dw - 120;
            ctx.fillText(d.text, dx + 8, d.y - 1, maxTextW);

            ctx.font = '10px sans-serif';
            ctx.fillStyle = urgColors[d.urgency] || '#a090c0';
            ctx.textAlign = 'right';
            ctx.fillText(`-${d.cost} ${d.resource} | +${d.good} QALY`, dx + dw - 8, d.y - 2);

            // Urgency tag
            ctx.font = '8px sans-serif';
            ctx.fillStyle = urgColors[d.urgency] || '#6a5890';
            ctx.textAlign = 'left';
            ctx.fillText(`[${d.urgency.toUpperCase()}]`, dx + 8, d.y + 12);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function renderRightPanel(ctx) {
        const panelX = W * 0.62;
        const careY = 200;

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText('SELF-CARE', panelX + 5, careY - 10);

        for (let i = 0; i < SELF_CARE.length; i++) {
            const care = SELF_CARE[i];
            const by = careY + i * 42;

            ctx.fillStyle = '#141420';
            ctx.fillRect(panelX, by, W - panelX - 10, 35);
            ctx.strokeStyle = '#3d3060';
            ctx.lineWidth = 1;
            ctx.strokeRect(panelX, by, W - panelX - 10, 35);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(care.name, panelX + 8, by + 14);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText(`+${care.restore} ${care.resource}${care.costsTime ? ` (-${care.costsTime} time)` : ''}`, panelX + 8, by + 28);
        }

        // Pledge button
        const pledgeBtnY = careY + SELF_CARE.length * 42 + 20;
        ctx.fillStyle = activePledge ? '#1a2a1a' : '#141420';
        ctx.fillRect(panelX, pledgeBtnY, W - panelX - 10, 40);
        ctx.strokeStyle = activePledge ? '#40b060' : '#cc9030';
        ctx.lineWidth = activePledge ? 2 : 1;
        ctx.strokeRect(panelX, pledgeBtnY, W - panelX - 10, 40);
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = activePledge ? '#40b060' : '#cc9030';
        ctx.textAlign = 'left';
        if (activePledge) {
            ctx.fillText(`\u2713 Pledged 10% ${activePledge.resource}`, panelX + 8, pledgeBtnY + 16);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#40b060';
            ctx.fillText(`to ${activePledge.cause} (+${activePledge.qalyPerDay}/day)`, panelX + 8, pledgeBtnY + 30);
        } else {
            ctx.fillText('THE 10% PLEDGE', panelX + 8, pledgeBtnY + 16);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#cc9030';
            ctx.fillText('Sustainable giving. Click to choose.', panelX + 8, pledgeBtnY + 30);
        }

        // Stats
        const statsY = pledgeBtnY + 60;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'left';
        ctx.fillText(`Demands fulfilled: ${demandsFulfilled}`, panelX + 5, statsY);
        ctx.fillText(`Demands ignored: ${demandsIgnored}`, panelX + 5, statsY + 14);
        ctx.fillText(`Self-care actions: ${selfCareActions}`, panelX + 5, statsY + 28);
        if (activePledge) {
            ctx.fillStyle = '#40b060';
            ctx.fillText(`Sustainable good: ${sustainableGood.toFixed(1)} QALYs`, panelX + 5, statsY + 42);
        }
    }

    function renderBurnout(ctx) {
        if (burnoutLevel > 20) {
            const alpha = burnoutLevel / 200;
            ctx.fillStyle = `rgba(100, 30, 30, ${alpha})`;
            ctx.fillRect(0, 0, W, H);
        }
        if (burnoutLevel > 50) {
            ctx.font = 'italic 14px serif';
            ctx.fillStyle = `rgba(204, 48, 48, ${burnoutLevel / 100})`;
            ctx.textAlign = 'center';
            ctx.fillText('Burnout approaching...', W / 2, H - 30);
        }
    }

    function renderParalysis(ctx) {
        if (!paralyzed) return;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#cc3030';
        ctx.textAlign = 'center';
        ctx.fillText('PARALYSIS', W / 2, H / 2 - 20);
        ctx.font = '14px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('Trying to respond to everything depleted you to zero.', W / 2, H / 2 + 10);
        ctx.fillText('You accomplish nothing.', W / 2, H / 2 + 30);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Recovering... (${Math.ceil(paralyzeTimer)}s)`, W / 2, H / 2 + 60);
    }

    function renderDayCounter(ctx) {
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'center';
        ctx.fillText(`Day ${dayNumber + 1} / ${MAX_DAYS}`, W * 0.3, H - 15);

        // Day progress bar
        Engine.drawBar(ctx, W * 0.1, H - 10, W * 0.4, 4, dayTimer, DAY_LENGTH, '#4488cc', '#1a1428');
    }

    function renderMessages(ctx) {
        for (const m of messages) {
            ctx.font = 'bold 13px sans-serif';
            ctx.globalAlpha = Math.max(0, m.alpha);
            ctx.fillStyle = m.color;
            ctx.textAlign = 'center';
            ctx.fillText(m.text, m.x, m.y);
            ctx.globalAlpha = 1;
        }
    }

    function renderPledgeScreen(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 22, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#cc9030';
        ctx.textAlign = 'center';
        ctx.fillText('THE 10% PLEDGE', cx, H * 0.15);

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('Commit 10% of one resource to a cause.', cx, H * 0.22);
        ctx.fillText('Sustainable. Consistent. Not perfect — just enough.', cx, H * 0.27);

        const startY = H * 0.3;
        for (let i = 0; i < PLEDGE_OPTIONS.length; i++) {
            const p = PLEDGE_OPTIONS[i];
            const by = startY + i * 70;

            ctx.fillStyle = '#141420';
            ctx.fillRect(W * 0.2, by, W * 0.6, 60);
            ctx.strokeStyle = '#cc9030';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.2, by, W * 0.6, 60);

            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(`10% of ${p.resource} to ${p.cause}`, W * 0.23, by + 22);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#40b060';
            ctx.fillText(`+${p.qalyPerDay} QALYs per day, sustainably`, W * 0.23, by + 42);
        }

        // The 10% visual demonstration
        ctx.font = 'italic 12px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.textAlign = 'center';
        ctx.fillText('Giving 10% forever beats giving 100% once and burning out.', cx, H * 0.75);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to go back', cx, H - 40);
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 22, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.08;

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('YOUR LIFE', cx, y);
        y += 40;

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText(`Days lived: ${dayNumber}`, cx, y); y += 22;
        ctx.fillText(`Demands fulfilled: ${demandsFulfilled}`, cx, y); y += 22;
        ctx.fillText(`Demands ignored: ${demandsIgnored}`, cx, y); y += 22;
        ctx.fillText(`Self-care actions: ${selfCareActions}`, cx, y); y += 22;
        ctx.fillText(`Times paralyzed: ${paralyzed ? 1 : 0}+`, cx, y); y += 30;

        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText(`Total Good (QALYs): ${qalyScore.toFixed(1)}`, cx, y); y += 22;

        if (activePledge) {
            ctx.fillStyle = '#40b060';
            ctx.fillText(`Sustainable Good from Pledge: ${sustainableGood.toFixed(1)}`, cx, y); y += 22;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#40b060';
            ctx.fillText(`(${pledgeDaysTaken} days of consistent giving)`, cx, y); y += 30;

            ctx.font = 'italic 16px serif';
            ctx.fillStyle = '#ffd764';
            ctx.fillText('"Giving 10% forever beats giving 100% once."', cx, y); y += 35;
        } else {
            y += 20;
        }

        // The relief
        ctx.font = 'bold 16px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('THE MESSAGE', cx, y); y += 25;

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('You are allowed to not be perfect.', cx, y); y += 22;
        ctx.fillText('The game explicitly tells you: it\'s okay.', cx, y); y += 22;
        ctx.fillText('Nobody is perfect. Everything is commensurable.', cx, y); y += 22;
        ctx.fillText('And 10% is enough.', cx, y); y += 30;

        if (thirdServant) {
            ctx.font = 'italic 12px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText('(The third servant buried his talent in the ground', cx, y);
            ctx.fillText('because perfect was impossible.)', cx, y + 16);
            y += 40;
        }

        if (netflixQALY > 2) {
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText(`Netflix time in QALY-equivalents: ${netflixQALY.toFixed(1)} (is nothing sacred?)`, cx, y);
            y += 20;
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, H - 30);
    }

    function renderTutorial(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 22, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'NOBODY IS PERFECT, EVERYTHING IS COMMENSURABLE',
                text: 'You have a life.\nTime, money, energy, willpower — all finite.\n\nDemands scroll past, each one technically correct:\n"If you have time for Netflix,\nyou have time to fight climate change."'
            },
            {
                title: 'THE PARALYSIS',
                text: 'Trying to respond to everything\ndepletes you to zero. You accomplish nothing.\n\nBurnout is real. Paralysis is real.\nPerfectionism is the enemy of good.'
            },
            {
                title: 'THE 10% SOLUTION',
                text: 'Take a pledge — commit 10% of one resource\nto a cause. Sustainable. Consistent.\n\nOr try to answer every demand.\nSee what happens.\n\nClick to begin.'
            }
        ];
        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#cc9030';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, cx, cy - 110);
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        step.text.split('\n').forEach((line, i) => {
            ctx.fillText(line, cx, cy - 40 + i * 22);
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
