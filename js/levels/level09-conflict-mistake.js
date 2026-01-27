// Level 09 — CONFLICT VS. MISTAKE
// Dual-Mode Strategy Game
// "Mistake theorists think opponents are wrong.
//  Conflict theorists think opponents are evil."
//
// Play the same political scenario in two modes.
// The trap: wrong frame for the situation = disaster.

const Level09ConflictMistake = (() => {
    let canvas, ctx;
    let W, H;

    // --- SCENARIOS ---
    const SCENARIOS = [
        {
            name: 'Healthcare Reform',
            desc: 'The nation debates universal healthcare. Millions lack coverage. Costs are rising.',
            nature: 'mixed', // 'mistake', 'conflict', or 'mixed'
            stakeholders: [
                { name: 'Insurance Industry', interest: 'profit', power: 80, persuadable: 10 },
                { name: 'Doctors\' Association', interest: 'autonomy', power: 50, persuadable: 60 },
                { name: 'Patient Advocates', interest: 'access', power: 30, persuadable: 80 },
                { name: 'Taxpayers', interest: 'costs', power: 60, persuadable: 50 },
                { name: 'Pharmaceutical Companies', interest: 'profit', power: 70, persuadable: 15 }
            ],
            mistakeOptimal: 'Research shows single-payer saves 15%. Present the data; doctors and patients agree. But insurance industry blocks it regardless.',
            conflictOptimal: 'Build coalition of patients and doctors. Pressure politicians. Defeat insurance lobby. But you alienate moderate taxpayers.',
            bestOutcome: 'Public option with industry compromise. Research persuades persuadable stakeholders while political pressure constrains the rest.'
        },
        {
            name: 'Criminal Justice Reform',
            desc: 'Mass incarceration. Racial disparities. Recidivism. Private prisons lobbying against reform.',
            nature: 'conflict',
            stakeholders: [
                { name: 'Private Prison Industry', interest: 'profit', power: 70, persuadable: 5 },
                { name: 'Police Unions', interest: 'power', power: 60, persuadable: 20 },
                { name: 'Reform Advocates', interest: 'justice', power: 40, persuadable: 90 },
                { name: 'Politicians', interest: 'reelection', power: 80, persuadable: 40 },
                { name: 'Affected Communities', interest: 'freedom', power: 20, persuadable: 85 }
            ],
            mistakeOptimal: 'Present recidivism data and cost savings. Some politicians listen. But private prisons spend $millions lobbying.',
            conflictOptimal: 'Organize affected communities. Pressure politicians directly. Defund private prisons. Real change happens.',
            bestOutcome: 'Conflict frame works better here. The prison industry will not be persuaded by data; they need to be politically defeated.'
        },
        {
            name: 'Climate Policy',
            desc: 'Scientific consensus is clear. Emissions must be cut. Fossil fuel industry resists.',
            nature: 'mixed',
            stakeholders: [
                { name: 'Fossil Fuel Industry', interest: 'profit', power: 90, persuadable: 5 },
                { name: 'Scientists', interest: 'truth', power: 30, persuadable: 95 },
                { name: 'Green Tech Startups', interest: 'market', power: 40, persuadable: 80 },
                { name: 'Workers in Coal Country', interest: 'livelihoods', power: 30, persuadable: 50 },
                { name: 'General Public', interest: 'future', power: 50, persuadable: 60 }
            ],
            mistakeOptimal: 'Data and education shift public opinion. Carbon tax gains support. But fossil fuel lobby prevents implementation.',
            conflictOptimal: 'Political warfare against fossil fuels. Green New Deal. Win some, but alienate coal workers and moderates.',
            bestOutcome: 'Carbon tax with worker retraining. Persuade the persuadable, politically defeat the unpersuadable.'
        }
    ];

    // --- STATE ---
    let currentScenario = null;
    let mode = null; // 'mistake' or 'conflict'
    let phase = 'choose_scenario'; // 'choose_scenario', 'choose_mode', 'playing', 'round_result', 'switch', 'compare', 'result'
    let round = 0;
    const MAX_ROUNDS = 4;
    let actions = [];
    let mistakeResults = { score: 0, actions: [], goodOutcome: 0, exploitation: 0 };
    let conflictResults = { score: 0, actions: [], goodOutcome: 0, prevented: 0 };
    let currentResult = null;
    let stakeholderStates = [];
    let playedBothModes = false;
    let firstMode = null;
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;

    // Action templates for each mode
    const MISTAKE_ACTIONS = [
        { name: 'Publish Research', desc: 'Present evidence-based analysis', persuasion: 20, power: 0, cost: 'time' },
        { name: 'Host Town Hall', desc: 'Open debate, address concerns with data', persuasion: 15, power: 0, cost: 'energy' },
        { name: 'Write Op-Ed', desc: 'Reasoned public argument in newspaper', persuasion: 12, power: 0, cost: 'time' },
        { name: 'Expert Panel', desc: 'Convene experts to find optimal policy', persuasion: 25, power: 0, cost: 'prestige' },
        { name: 'Compromise Proposal', desc: 'Find middle ground that satisfies most', persuasion: 18, power: 5, cost: 'idealism' },
        { name: 'Bipartisan Meeting', desc: 'Invite all sides to the table', persuasion: 15, power: 0, cost: 'energy' },
    ];

    const CONFLICT_ACTIONS = [
        { name: 'Organize Protest', desc: 'Mass demonstration of political force', persuasion: 0, power: 20, cost: 'energy' },
        { name: 'Build Coalition', desc: 'Unite allied factions for power', persuasion: 5, power: 25, cost: 'time' },
        { name: 'Media Campaign', desc: 'Frame the narrative, name the enemy', persuasion: 5, power: 15, cost: 'money' },
        { name: 'Lobby Politicians', desc: 'Apply direct political pressure', persuasion: 0, power: 20, cost: 'money' },
        { name: 'Boycott', desc: 'Economic pressure on opponents', persuasion: 0, power: 18, cost: 'sacrifice' },
        { name: 'Run for Office', desc: 'Take power directly', persuasion: 5, power: 30, cost: 'everything' },
    ];

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
    }

    function resetState() {
        currentScenario = null;
        mode = null;
        phase = 'choose_scenario';
        round = 0;
        actions = [];
        mistakeResults = { score: 0, actions: [], goodOutcome: 0, exploitation: 0 };
        conflictResults = { score: 0, actions: [], goodOutcome: 0, prevented: 0 };
        currentResult = null;
        stakeholderStates = [];
        playedBothModes = false;
        firstMode = null;
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
    }

    function onResize(w, h) { W = w; H = h; }

    function setupStakeholders() {
        stakeholderStates = currentScenario.stakeholders.map(s => ({
            ...s,
            persuaded: 0,    // 0-100
            pressured: 0,    // 0-100
            aligned: false,
            defeated: false
        }));
    }

    // --- UPDATE ---
    function update(dt, input) {
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 2) showTutorial = false;
            }
            return;
        }

        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 12; return m.alpha > 0; });

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insight = "Both frames are partial. Mistake theory for solvable problems, conflict theory for zero-sum ones. Wisdom is knowing which is which.";
                showInsightPopup(9, insight, () => returnToMenu());
            }
            return;
        }

        handleInput(input);
    }

    function handleInput(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        if (phase === 'choose_scenario') handleScenarioChoice(mx, my);
        else if (phase === 'choose_mode') handleModeChoice(mx, my);
        else if (phase === 'playing') handlePlayingClick(mx, my);
        else if (phase === 'round_result') handleRoundResult(mx, my);
        else if (phase === 'switch') handleSwitch(mx, my);
        else if (phase === 'compare') handleCompare(mx, my);
    }

    function handleScenarioChoice(mx, my) {
        const startY = 130;
        for (let i = 0; i < SCENARIOS.length; i++) {
            const by = startY + i * 90;
            if (mx >= W * 0.1 && mx <= W * 0.9 && my >= by && my <= by + 80) {
                currentScenario = SCENARIOS[i];
                setupStakeholders();
                phase = 'choose_mode';
                return;
            }
        }
    }

    function handleModeChoice(mx, my) {
        const btnY = H * 0.45;
        // Mistake mode
        if (mx >= W * 0.05 && mx <= W * 0.47 && my >= btnY && my <= btnY + 120) {
            mode = 'mistake';
            if (!firstMode) firstMode = 'mistake';
            phase = 'playing';
            round = 0;
            actions = [];
            return;
        }
        // Conflict mode
        if (mx >= W * 0.53 && mx <= W * 0.95 && my >= btnY && my <= btnY + 120) {
            mode = 'conflict';
            if (!firstMode) firstMode = 'conflict';
            phase = 'playing';
            round = 0;
            actions = [];
            return;
        }
    }

    function handlePlayingClick(mx, my) {
        const actionList = mode === 'mistake' ? MISTAKE_ACTIONS : CONFLICT_ACTIONS;
        const startY = 200;
        for (let i = 0; i < actionList.length; i++) {
            const by = startY + i * 52;
            if (mx >= W * 0.1 && mx <= W * 0.9 && my >= by && my <= by + 45) {
                const action = actionList[i];
                executeAction(action);
                round++;
                if (round >= MAX_ROUNDS) {
                    evaluateRound();
                    phase = 'round_result';
                } else {
                    addMessage(`${action.name}!`, W / 2, by, mode === 'mistake' ? '#4488cc' : '#cc3030');
                }
                return;
            }
        }
    }

    function executeAction(action) {
        actions.push(action);

        for (const s of stakeholderStates) {
            if (action.persuasion > 0) {
                const effectiveness = action.persuasion * (s.persuadable / 100);
                s.persuaded = Math.min(100, s.persuaded + effectiveness);
            }
            if (action.power > 0) {
                const pressure = action.power * (100 - s.power) / 100;
                s.pressured = Math.min(100, s.pressured + pressure);
            }
        }
    }

    function evaluateRound() {
        let totalGood = 0;
        let exploitation = 0;
        let prevented = 0;

        for (const s of stakeholderStates) {
            const persuaded = s.persuaded > 50;
            const pressured = s.pressured > 50;
            const goodInterest = ['access', 'justice', 'truth', 'future', 'freedom'].includes(s.interest);
            const badInterest = ['profit', 'power'].includes(s.interest);

            if (mode === 'mistake') {
                if (persuaded && goodInterest) totalGood += 10;
                if (persuaded && !badInterest) totalGood += 5;
                // The trap: persuasion doesn't work on profit-motivated actors
                if (!persuaded && badInterest && s.persuadable < 20) {
                    exploitation += 10; // they exploit your good faith
                }
            } else {
                if (pressured && badInterest) {
                    totalGood += 8;
                    prevented += 5;
                }
                if (pressured && goodInterest) totalGood += 3; // blunt instrument
                // The trap: conflict approach in cooperative situations prevents solutions
                if (!persuaded && s.persuadable > 60 && !badInterest) {
                    prevented += 5; // you prevented cooperation
                }
            }
        }

        if (mode === 'mistake') {
            mistakeResults.score = totalGood;
            mistakeResults.goodOutcome = totalGood;
            mistakeResults.exploitation = exploitation;
            mistakeResults.actions = [...actions];
        } else {
            conflictResults.score = totalGood;
            conflictResults.goodOutcome = totalGood;
            conflictResults.prevented = prevented;
            conflictResults.actions = [...actions];
        }

        currentResult = { totalGood, exploitation, prevented };
    }

    function handleRoundResult(mx, my) {
        if (!playedBothModes) {
            playedBothModes = true;
            phase = 'switch';
        } else {
            phase = 'compare';
        }
    }

    function handleSwitch(mx, my) {
        // Switch to the other mode
        mode = mode === 'mistake' ? 'conflict' : 'mistake';
        setupStakeholders(); // reset stakeholders
        round = 0;
        actions = [];
        phase = 'playing';
    }

    function handleCompare(mx, my) {
        phase = 'result';
        finalizeResult();
    }

    function finalizeResult() {
        Protagonist.addInsight(9, "Both frames are partial. Mistake theory for solvable problems, conflict theory for zero-sum ones. Wisdom is knowing which is which.");
        Protagonist.completeLevel(9, 'synthesis');
        Protagonist.recordConnection();
        Protagonist.save();
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 1.5, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        ctx.fillStyle = '#0e0a14';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }

        if (phase === 'choose_scenario') renderScenarioSelect(ctx);
        else if (phase === 'choose_mode') renderModeSelect(ctx);
        else if (phase === 'playing') renderPlaying(ctx);
        else if (phase === 'round_result') renderRoundResult(ctx);
        else if (phase === 'switch') renderSwitch(ctx);
        else if (phase === 'compare') renderCompare(ctx);

        renderMessages(ctx);
    }

    function renderScenarioSelect(ctx) {
        const cx = W / 2;
        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('CHOOSE THE POLITICAL SCENARIO', cx, 80);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('You will play the same scenario in two different modes.', cx, 105);

        const startY = 130;
        for (let i = 0; i < SCENARIOS.length; i++) {
            const s = SCENARIOS[i];
            const by = startY + i * 90;

            ctx.fillStyle = '#141420';
            ctx.fillRect(W * 0.1, by, W * 0.8, 80);
            ctx.strokeStyle = '#3d3060';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.1, by, W * 0.8, 80);

            ctx.font = 'bold 16px serif';
            ctx.fillStyle = '#ffd764';
            ctx.textAlign = 'left';
            ctx.fillText(s.name, W * 0.13, by + 24);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            const descLines = Engine.wrapText(ctx, s.desc, W * 0.72, '12px sans-serif');
            let dy = by + 42;
            for (const line of descLines) {
                ctx.fillText(line, W * 0.13, dy); dy += 16;
            }
        }
    }

    function renderModeSelect(ctx) {
        const cx = W / 2;
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText(currentScenario.name, cx, 70);

        ctx.font = '14px serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('How do you see politics?', cx, 100);

        const btnY = H * 0.2;
        const btnH = 200;

        // Mistake mode
        ctx.fillStyle = '#141a24';
        ctx.fillRect(W * 0.05, btnY, W * 0.42, btnH);
        ctx.strokeStyle = '#4488cc';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.05, btnY, W * 0.42, btnH);

        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#4488cc';
        ctx.textAlign = 'center';
        ctx.fillText('MISTAKE THEORY', W * 0.26, btnY + 30);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        const mistakeText = [
            'Politics is a puzzle.',
            'Opponents are misguided.',
            'Solution: find truth, persuade.',
            'Tools: research, debate, compromise.',
            '',
            '"They\'re smart people',
            'with wrong ideas."'
        ];
        let my = btnY + 55;
        for (const line of mistakeText) {
            ctx.fillText(line, W * 0.26, my); my += 18;
        }

        // Conflict mode
        ctx.fillStyle = '#1a1420';
        ctx.fillRect(W * 0.53, btnY, W * 0.42, btnH);
        ctx.strokeStyle = '#cc3030';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.53, btnY, W * 0.42, btnH);

        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#cc3030';
        ctx.textAlign = 'center';
        ctx.fillText('CONFLICT THEORY', W * 0.74, btnY + 30);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        const conflictText = [
            'Politics is war.',
            'Opponents serve different interests.',
            'Solution: accumulate power, win.',
            'Tools: organize, pressure, defeat.',
            '',
            '"They\'re bad people',
            'with selfish interests."'
        ];
        let cy = btnY + 55;
        for (const line of conflictText) {
            ctx.fillText(line, W * 0.74, cy); cy += 18;
        }

        // Stakeholder preview
        const stY = btnY + btnH + 20;
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'left';
        ctx.fillText('Stakeholders:', W * 0.05, stY);
        let sx = W * 0.05;
        for (const s of currentScenario.stakeholders) {
            ctx.fillStyle = s.persuadable > 50 ? '#4488cc' : s.power > 60 ? '#cc3030' : '#aa8844';
            ctx.fillText(`${s.name} (Power:${s.power}, Persuadable:${s.persuadable}%)`, sx, stY + 18);
            sx = sx === W * 0.05 ? W * 0.5 : W * 0.05;
            if (sx === W * 0.05) stY;
        }
    }

    function renderPlaying(ctx) {
        const cx = W / 2;
        const modeColor = mode === 'mistake' ? '#4488cc' : '#cc3030';
        const modeName = mode === 'mistake' ? 'MISTAKE MODE' : 'CONFLICT MODE';

        ctx.font = 'bold 16px serif';
        ctx.fillStyle = modeColor;
        ctx.textAlign = 'center';
        ctx.fillText(`${modeName} — ${currentScenario.name}`, cx, 70);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText(`Round ${round + 1}/${MAX_ROUNDS} — Choose an action`, cx, 92);

        // Stakeholder status
        let sy = 110;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        for (const s of stakeholderStates) {
            const persuadeBar = s.persuaded / 100;
            const pressureBar = s.pressured / 100;

            ctx.fillStyle = '#e8e0f0';
            ctx.fillText(s.name, W * 0.05, sy);

            // Persuasion bar
            Engine.drawBar(ctx, W * 0.3, sy - 6, 80, 8, s.persuaded, 100, '#4488cc', '#1a1a28');
            ctx.fillStyle = '#4488cc';
            ctx.fillText(`P:${Math.floor(s.persuaded)}`, W * 0.3 + 85, sy);

            // Pressure bar
            Engine.drawBar(ctx, W * 0.55, sy - 6, 80, 8, s.pressured, 100, '#cc3030', '#1a1a28');
            ctx.fillStyle = '#cc3030';
            ctx.fillText(`F:${Math.floor(s.pressured)}`, W * 0.55 + 85, sy);

            ctx.fillStyle = '#6a5890';
            ctx.textAlign = 'right';
            ctx.fillText(`[${s.interest}]`, W * 0.95, sy);
            ctx.textAlign = 'left';

            sy += 16;
        }

        // Actions
        const actionList = mode === 'mistake' ? MISTAKE_ACTIONS : CONFLICT_ACTIONS;
        const startY = 200;
        for (let i = 0; i < actionList.length; i++) {
            const a = actionList[i];
            const by = startY + i * 52;

            ctx.fillStyle = '#141420';
            ctx.fillRect(W * 0.1, by, W * 0.8, 45);
            ctx.strokeStyle = modeColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.1, by, W * 0.8, 45);

            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(a.name, W * 0.13, by + 16);

            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#8088a0';
            ctx.fillText(a.desc, W * 0.13, by + 32);

            ctx.textAlign = 'right';
            ctx.fillStyle = modeColor;
            if (a.persuasion > 0) ctx.fillText(`Persuade: +${a.persuasion}`, W * 0.88, by + 16);
            if (a.power > 0) ctx.fillText(`Power: +${a.power}`, W * 0.88, by + 16);
            ctx.fillStyle = '#6a5890';
            ctx.fillText(`Cost: ${a.cost}`, W * 0.88, by + 32);
        }

        // Mode reminder
        ctx.font = 'italic 11px serif';
        ctx.fillStyle = modeColor;
        ctx.textAlign = 'center';
        if (mode === 'mistake') {
            ctx.fillText('"Opponents are smart people with wrong ideas. Persuade them."', cx, H - 130);
        } else {
            ctx.fillText('"Opponents are bad people with selfish interests. Defeat them."', cx, H - 130);
        }
    }

    function renderRoundResult(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 20, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        const modeColor = mode === 'mistake' ? '#4488cc' : '#cc3030';
        let y = H * 0.1;

        ctx.font = 'bold 20px serif';
        ctx.fillStyle = modeColor;
        ctx.textAlign = 'center';
        ctx.fillText(`${mode === 'mistake' ? 'MISTAKE' : 'CONFLICT'} MODE RESULTS`, cx, y); y += 35;

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText(`Good outcomes: ${currentResult.totalGood}`, cx, y); y += 22;

        if (mode === 'mistake' && currentResult.exploitation > 0) {
            ctx.fillStyle = '#cc3030';
            ctx.fillText(`Exploitation by bad-faith actors: ${currentResult.exploitation}`, cx, y); y += 22;
            ctx.font = 'italic 12px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText('You tried to persuade people who were never going to listen.', cx, y); y += 18;
            ctx.fillText('They used your good faith against you.', cx, y); y += 25;
        }

        if (mode === 'conflict' && currentResult.prevented > 0) {
            ctx.fillStyle = '#cc9030';
            ctx.fillText(`Cooperation prevented: ${currentResult.prevented}`, cx, y); y += 22;
            ctx.font = 'italic 12px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText('You treated persuadable allies as enemies.', cx, y); y += 18;
            ctx.fillText('They would have helped, if you\'d talked to them.', cx, y); y += 25;
        }

        // Stakeholder outcomes
        y += 10;
        ctx.font = '11px sans-serif';
        for (const s of stakeholderStates) {
            const persuaded = s.persuaded > 50;
            const pressured = s.pressured > 50;
            ctx.fillStyle = persuaded ? '#4488cc' : pressured ? '#cc3030' : '#6a5890';
            ctx.textAlign = 'left';
            const status = persuaded ? 'Persuaded' : pressured ? 'Pressured' : 'Unmoved';
            ctx.fillText(`${s.name}: ${status} (${s.interest})`, W * 0.2, y);
            y += 16;
        }

        y += 20;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'center';
        ctx.fillText(playedBothModes ? 'Click to compare modes' : 'Click to try the other mode', cx, y);
    }

    function renderSwitch(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 20, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;

        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('NOW TRY THE OTHER LENS', cx, H * 0.25);

        const otherMode = mode === 'mistake' ? 'CONFLICT' : 'MISTAKE';
        const otherColor = mode === 'mistake' ? '#cc3030' : '#4488cc';

        ctx.font = '16px serif';
        ctx.fillStyle = otherColor;
        ctx.fillText(`Switch to ${otherMode} THEORY`, cx, H * 0.35);

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('Same scenario. Same stakeholders.', cx, H * 0.45);
        ctx.fillText('Completely different game.', cx, H * 0.5);

        if (mode === 'mistake') {
            ctx.fillText('"This time, opponents are evil, not wrong."', cx, H * 0.58);
        } else {
            ctx.fillText('"This time, opponents are wrong, not evil."', cx, H * 0.58);
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to begin', cx, H * 0.75);
    }

    function renderCompare(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 20, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.06;

        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('THE CROSSOVER', cx, y); y += 35;

        // Side by side comparison
        ctx.font = 'bold 14px sans-serif';

        // Mistake results
        ctx.fillStyle = '#4488cc';
        ctx.textAlign = 'center';
        ctx.fillText('MISTAKE MODE', W * 0.25, y);
        ctx.fillStyle = '#cc3030';
        ctx.fillText('CONFLICT MODE', W * 0.75, y);
        y += 25;

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.textAlign = 'center';
        ctx.fillText(`Good: ${mistakeResults.goodOutcome}`, W * 0.25, y);
        ctx.fillText(`Good: ${conflictResults.goodOutcome}`, W * 0.75, y);
        y += 20;

        ctx.fillStyle = '#cc3030';
        ctx.fillText(`Exploited: ${mistakeResults.exploitation}`, W * 0.25, y);
        ctx.fillStyle = '#cc9030';
        ctx.fillText(`Prevented: ${conflictResults.prevented}`, W * 0.75, y);
        y += 30;

        // The analysis
        ctx.font = 'bold 14px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.textAlign = 'center';
        ctx.fillText('THE TRAP', cx, y); y += 22;

        ctx.font = '12px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('If you\'re a mistake theorist in a conflict situation:', cx, y); y += 18;
        ctx.fillStyle = '#cc3030';
        ctx.fillText('you get exploited.', cx, y); y += 25;

        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('If you\'re a conflict theorist in a mistake situation:', cx, y); y += 18;
        ctx.fillStyle = '#cc9030';
        ctx.fillText('you prevent cooperation.', cx, y); y += 30;

        // Scenario nature
        ctx.font = 'bold 13px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText(`This scenario (${currentScenario.name}) was: ${currentScenario.nature.toUpperCase()}`, cx, y); y += 22;

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        const bestLines = Engine.wrapText(ctx, `Best approach: ${currentScenario.bestOutcome}`, W * 0.7, '12px sans-serif');
        for (const line of bestLines) {
            ctx.fillText(line, cx, y); y += 16;
        }

        y += 20;
        ctx.font = 'italic 14px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText('"Both frames are partial. Wisdom is knowing which is which."', cx, y);

        y += 30;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, y);
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 20, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.15;

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('CONFLICT VS. MISTAKE', cx, y); y += 35;

        ctx.font = '16px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('Some situations are genuinely mistakes.', cx, y); y += 24;
        ctx.fillText('Everyone benefits from coordination.', cx, y); y += 24;
        ctx.fillText('Some situations are genuinely conflicts.', cx, y); y += 24;
        ctx.fillText('Zero-sum. Someone must lose.', cx, y); y += 35;

        ctx.font = 'bold 16px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText('The challenge is knowing which is which.', cx, y); y += 35;

        ctx.font = 'italic 14px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('Or: realize that both frames are partial,', cx, y); y += 22;
        ctx.fillText('and find a synthesis.', cx, y); y += 40;

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, y);
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

    function renderTutorial(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 20, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'CONFLICT VS. MISTAKE',
                text: 'Mistake theorists think political opponents are WRONG.\nConflict theorists think political opponents are EVIL.\n\nThese are fundamentally different worldviews.\nThey lead to completely different strategies.'
            },
            {
                title: 'THE DUAL GAME',
                text: 'You will play the SAME political scenario\nin BOTH modes.\n\nMistake Mode: Research, debate, compromise.\nConflict Mode: Organize, pressure, defeat.\n\nSame stakeholders. Same problem.\nCompletely different game.'
            },
            {
                title: 'THE TRAP',
                text: 'Mistake theory in a conflict situation = exploited.\nConflict theory in a mistake situation = prevents cooperation.\n\nThe challenge: knowing which frame fits.\n\nClick to begin.'
            }
        ];
        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd764';
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
