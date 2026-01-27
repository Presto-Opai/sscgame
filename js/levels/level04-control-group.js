// Level 04 — THE CONTROL GROUP IS OUT OF CONTROL
// Laboratory Management / Statistical Puzzle Game
// "If rigorous studies consistently find positive results for phenomena
//  that don't exist, what does that say about ALL science?"
//
// Run a lab. Design studies. Publish results. Your methodology
// produces the same results whether the phenomenon is real or not.

const Level04ControlGroup = (() => {
    let canvas, ctx;
    let W, H;

    // --- STATE ---
    let prestige = 50;
    let funding = 100;
    let publications = 0;
    let rigor = 50; // 0-100 scale
    let pHackCount = 0;
    let fileDrawerCount = 0; // unpublished negative results
    let studies = []; // completed studies
    let currentStudy = null;
    let phase = 'menu'; // 'menu', 'design', 'running', 'analysis', 'publish', 'reform', 'replication_crisis', 'twist', 'result'
    let phenomenonIsReal = Math.random() < 0.5; // THE SECRET: 50/50 chance
    let turnNumber = 0;
    const MAX_TURNS = 12;
    let replicationCrisisHit = false;
    let reformsAdopted = [];
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let bemChallengeAvailable = false;
    let bemCompleted = false;
    let kirschAppeared = false;
    let analysisChoices = [];
    let selectedAnalysis = null;
    let publishDecision = null;
    let funnelPlotData = [];
    let animTimer = 0;

    // Study templates
    const STUDY_TYPES = [
        { name: 'Drug Trial', desc: 'Test a new compound for efficacy', subjects: 100, cost: 15, baseEffect: 0.3 },
        { name: 'Behavioral Study', desc: 'Measure behavioral intervention outcomes', subjects: 60, cost: 10, baseEffect: 0.2 },
        { name: 'Psychic Powers Study', desc: 'Test for precognition (Bem-style)', subjects: 100, cost: 12, baseEffect: 0.05 },
        { name: 'Social Priming', desc: 'Can priming words affect walking speed?', subjects: 40, cost: 8, baseEffect: 0.15 },
        { name: 'Large Meta-Analysis', desc: 'Combine 90 prior studies', subjects: 5000, cost: 25, baseEffect: 0.1 },
    ];

    // Reform options
    const REFORMS = [
        { id: 'preregistration', name: 'Pre-registration', desc: 'Commit to analysis plan before data collection', rigorBoost: 15, prestigeCost: 10 },
        { id: 'bayesian', name: 'Bayesian Statistics', desc: 'Replace p-values with Bayes factors', rigorBoost: 20, prestigeCost: 15 },
        { id: 'replication', name: 'Demand Replication', desc: 'Require independent replication before publishing', rigorBoost: 25, prestigeCost: 20 },
        { id: 'opendata', name: 'Open Data', desc: 'Share all raw data publicly', rigorBoost: 10, prestigeCost: 5 },
        { id: 'registered_reports', name: 'Registered Reports', desc: 'Peer review before results are known', rigorBoost: 20, prestigeCost: 12 },
    ];

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
    }

    function resetState() {
        prestige = 50;
        funding = 100;
        publications = 0;
        rigor = 50;
        pHackCount = 0;
        fileDrawerCount = 0;
        studies = [];
        currentStudy = null;
        phase = 'menu';
        phenomenonIsReal = Math.random() < 0.5;
        turnNumber = 0;
        replicationCrisisHit = false;
        reformsAdopted = [];
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        bemChallengeAvailable = false;
        bemCompleted = false;
        kirschAppeared = false;
        analysisChoices = [];
        selectedAnalysis = null;
        publishDecision = null;
        funnelPlotData = [];
        animTimer = 0;
    }

    function onResize(w, h) { W = w; H = h; }

    // --- STUDY SIMULATION ---
    function runStudy(studyType) {
        const study = { ...studyType };
        study.turnRun = turnNumber;

        // Simulate data
        // True effect: if phenomenon is real, small positive effect. If not, zero.
        const trueEffect = phenomenonIsReal ? study.baseEffect : 0;

        // Observed effect: true effect + noise + bias
        const noise = (Math.random() - 0.5) * 0.4;
        let bias = 0;
        if (!reformsAdopted.includes('preregistration')) bias += 0.05; // researcher degrees of freedom
        if (!reformsAdopted.includes('bayesian')) bias += 0.03; // p-value chasing

        study.observedEffect = trueEffect + noise + bias;
        study.sampleSize = study.subjects;

        // Calculate p-value (simplified)
        const se = 1.0 / Math.sqrt(study.subjects);
        const zScore = study.observedEffect / se;
        study.pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

        // Is it "significant"?
        study.significant = study.pValue < 0.05;

        // Effect in Cohen's d
        study.cohenD = study.observedEffect;

        return study;
    }

    function normalCDF(z) {
        // Approximation
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        z = Math.abs(z) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * z);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
        return 0.5 * (1.0 + sign * y);
    }

    // P-hacking: run many analyses, pick the best one
    function generateAnalysisChoices(study) {
        const choices = [];
        // Standard analysis
        choices.push({
            name: 'Standard Analysis',
            desc: 'Report the pre-planned analysis as-is',
            pValue: study.pValue,
            effect: study.observedEffect,
            hack: false
        });
        // P-hack options
        const hackAnalyses = [
            'Remove outliers (>2 SD)', 'Use one-tailed test',
            'Subset by gender', 'Control for age',
            'Log-transform the data', 'Combine similar measures'
        ];
        for (let i = 0; i < 3; i++) {
            const hackNoise = (Math.random() - 0.3) * 0.3;
            const hackP = Math.max(0.001, study.pValue + hackNoise * (Math.random() < 0.6 ? -1 : 1));
            const hackEffect = study.observedEffect + (Math.random() - 0.3) * 0.2;
            choices.push({
                name: hackAnalyses[Math.floor(Math.random() * hackAnalyses.length)],
                desc: 'Alternative analysis that might give better results',
                pValue: hackP,
                effect: hackEffect,
                hack: true
            });
        }
        return choices;
    }

    // --- UPDATE ---
    function update(dt, input) {
        animTimer += dt;
        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 12; return m.alpha > 0; });

        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 3) { showTutorial = false; phase = 'menu'; }
            }
            return;
        }

        if (phase === 'result' || phase === 'twist') {
            if (input.mouse.clicked) {
                if (phase === 'twist') {
                    const insight = "Your methodology produced the same results either way. The control group for science is out of control.";
                    showInsightPopup(4, insight, () => returnToMenu());
                } else {
                    phase = 'twist';
                }
            }
            return;
        }

        // Replication crisis trigger
        if (turnNumber >= 7 && !replicationCrisisHit && publications >= 3) {
            replicationCrisisHit = true;
            phase = 'replication_crisis';
        }

        // Bem challenge trigger
        if (turnNumber >= 5 && !bemChallengeAvailable && !bemCompleted) {
            bemChallengeAvailable = true;
        }

        handleInput(input);

        // Check end conditions
        if (turnNumber >= MAX_TURNS && phase === 'menu') {
            phase = 'result';
            finalizeResult();
        }
        if (funding <= 0 && phase === 'menu') {
            addMessage('Lab funding exhausted!', W / 2, H / 2, '#cc3030');
            phase = 'result';
            finalizeResult();
        }
    }

    function finalizeResult() {
        Protagonist.addInsight(4, "Your methodology produced the same results either way. The control group for science is out of control.");
        if (rigor > 70) {
            Protagonist.recordConnection();
            Protagonist.completeLevel(4, 'rigorous');
        } else {
            Protagonist.recordOptimization();
            Protagonist.completeLevel(4, 'publish');
        }
        Protagonist.save();
    }

    function handleInput(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        if (phase === 'menu') handleMenuClick(mx, my);
        else if (phase === 'design') handleDesignClick(mx, my);
        else if (phase === 'analysis') handleAnalysisClick(mx, my);
        else if (phase === 'publish') handlePublishClick(mx, my);
        else if (phase === 'reform') handleReformClick(mx, my);
        else if (phase === 'replication_crisis') handleReplicationCrisisClick(mx, my);
    }

    function handleMenuClick(mx, my) {
        const btnW = 250, btnH = 40;
        const cx = W * 0.4;
        let by = 200;

        // Run Study
        if (mx >= cx - btnW / 2 && mx <= cx + btnW / 2 && my >= by && my <= by + btnH) {
            phase = 'design';
            return;
        }
        by += 55;

        // Implement Reform
        if (mx >= cx - btnW / 2 && mx <= cx + btnW / 2 && my >= by && my <= by + btnH) {
            phase = 'reform';
            return;
        }
        by += 55;

        // Bem Challenge
        if (bemChallengeAvailable && !bemCompleted) {
            if (mx >= cx - btnW / 2 && mx <= cx + btnW / 2 && my >= by && my <= by + btnH) {
                // Run the Bem meta-analysis
                const bemStudy = runStudy({ name: 'Bem Precognition Meta-Analysis', desc: '90 studies, impeccable methodology', subjects: 9000, cost: 0, baseEffect: 0.08 });
                bemStudy.pValue = 0.0000000001; // p < 10^-10 always (that's the horror)
                bemStudy.significant = true;
                currentStudy = bemStudy;
                bemCompleted = true;
                bemChallengeAvailable = false;
                studies.push(bemStudy);
                addMessage('Bem\'s meta-analysis: p < 10^-10 for psychic powers!', W / 2, H * 0.3, '#cc8a20');
                phase = 'analysis';
                analysisChoices = [
                    { name: 'Accept the Results', desc: 'The methodology is impeccable. You must accept the data.', pValue: 0.0000000001, effect: 0.08, hack: false },
                    { name: 'Reject (But Why?)', desc: 'Something is wrong. But what? The methods are sound...', pValue: 0.0000000001, effect: 0.08, hack: false },
                    { name: '"That\'s the horror"', desc: 'Maybe nothing obvious is wrong. That\'s the actual problem.', pValue: 0.0000000001, effect: 0.08, hack: false }
                ];
                return;
            }
        }
        by += 55;

        // End Lab (skip to results)
        if (mx >= cx - btnW / 2 && mx <= cx + btnW / 2 && my >= by && my <= by + btnH) {
            phase = 'result';
            finalizeResult();
        }
    }

    function handleDesignClick(mx, my) {
        const panelX = W * 0.15;
        const startY = 140;
        for (let i = 0; i < STUDY_TYPES.length; i++) {
            const by = startY + i * 70;
            if (mx >= panelX && mx <= W - panelX && my >= by && my <= by + 60) {
                const st = STUDY_TYPES[i];
                if (funding >= st.cost) {
                    funding -= st.cost;
                    currentStudy = runStudy(st);
                    studies.push(currentStudy);
                    turnNumber++;
                    phase = 'analysis';
                    analysisChoices = generateAnalysisChoices(currentStudy);
                    addMessage(`Study complete: ${st.name}`, W / 2, 80, '#4488cc');
                } else {
                    addMessage('Not enough funding!', W / 2, 80, '#cc3030');
                }
                return;
            }
        }
        // Back button
        if (my > H - 60) { phase = 'menu'; }
    }

    function handleAnalysisClick(mx, my) {
        const startY = 200;
        for (let i = 0; i < analysisChoices.length; i++) {
            const by = startY + i * 80;
            if (mx >= W * 0.15 && mx <= W * 0.85 && my >= by && my <= by + 70) {
                selectedAnalysis = analysisChoices[i];
                if (selectedAnalysis.hack) {
                    pHackCount++;
                    rigor = Math.max(0, rigor - 5);
                    addMessage('P-hacked!', W / 2, by, '#cc8a20');
                }
                currentStudy.finalPValue = selectedAnalysis.pValue;
                currentStudy.finalEffect = selectedAnalysis.effect;
                currentStudy.hacked = selectedAnalysis.hack;
                phase = 'publish';
                return;
            }
        }
    }

    function handlePublishClick(mx, my) {
        const btnW = 200, btnH = 45;
        const cx = W / 2;

        // Publish
        let by = H * 0.55;
        if (mx >= cx - btnW - 10 && mx <= cx - 10 && my >= by && my <= by + btnH) {
            if (currentStudy.finalPValue < 0.05) {
                publications++;
                prestige += 10;
                funding += 8;
                funnelPlotData.push({ effect: currentStudy.finalEffect, se: 1 / Math.sqrt(currentStudy.sampleSize), published: true });
                addMessage('Published! Prestige +10', W / 2, H * 0.4, '#40b060');
            } else {
                prestige -= 2;
                addMessage('Published null result... prestige -2', W / 2, H * 0.4, '#cc8a60');
                funnelPlotData.push({ effect: currentStudy.finalEffect, se: 1 / Math.sqrt(currentStudy.sampleSize), published: true });
            }
            currentStudy = null;
            selectedAnalysis = null;
            phase = 'menu';
            return;
        }

        // File drawer
        if (mx >= cx + 10 && mx <= cx + btnW + 10 && my >= by && my <= by + btnH) {
            fileDrawerCount++;
            funnelPlotData.push({ effect: currentStudy.finalEffect, se: 1 / Math.sqrt(currentStudy.sampleSize), published: false });
            addMessage('Filed away... (publication bias)', W / 2, H * 0.4, '#6a5890');
            currentStudy = null;
            selectedAnalysis = null;
            phase = 'menu';
            return;
        }
    }

    function handleReformClick(mx, my) {
        const startY = 160;
        for (let i = 0; i < REFORMS.length; i++) {
            const r = REFORMS[i];
            if (reformsAdopted.includes(r.id)) continue;
            const by = startY + i * 65;
            if (mx >= W * 0.15 && mx <= W * 0.85 && my >= by && my <= by + 55) {
                if (prestige >= r.prestigeCost) {
                    prestige -= r.prestigeCost;
                    rigor += r.rigorBoost;
                    reformsAdopted.push(r.id);
                    turnNumber++;
                    addMessage(`Adopted: ${r.name}`, W / 2, by, '#40b060');
                    phase = 'menu';
                } else {
                    addMessage('Not enough prestige!', W / 2, by, '#cc3030');
                }
                return;
            }
        }
        if (my > H - 60) { phase = 'menu'; }
    }

    function handleReplicationCrisisClick(mx, my) {
        // Any click continues
        prestige = Math.floor(prestige * 0.5);
        for (const s of studies) {
            if (s.hacked) {
                prestige = Math.max(0, prestige - 3);
            }
        }
        addMessage('Replication crisis! All previous findings questioned.', W / 2, H * 0.3, '#cc3030');
        if (!kirschAppeared) {
            kirschAppeared = true;
        }
        phase = 'menu';
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 2, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }

        renderStatusBar(ctx);

        if (phase === 'menu') renderMenu(ctx);
        else if (phase === 'design') renderDesign(ctx);
        else if (phase === 'analysis') renderAnalysis(ctx);
        else if (phase === 'publish') renderPublish(ctx);
        else if (phase === 'reform') renderReform(ctx);
        else if (phase === 'replication_crisis') renderReplicationCrisis(ctx);
        else if (phase === 'result') renderResult(ctx);
        else if (phase === 'twist') renderTwist(ctx);

        renderMessages(ctx);
    }

    function renderStatusBar(ctx) {
        const barY = 10;
        ctx.fillStyle = 'rgba(20, 25, 35, 0.9)';
        ctx.fillRect(0, 0, W, 50);

        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        let x = 20;

        ctx.fillStyle = '#4488cc';
        ctx.fillText(`Prestige: ${prestige}`, x, barY + 15);
        x += 120;
        ctx.fillStyle = '#cc9030';
        ctx.fillText(`Funding: ${funding}`, x, barY + 15);
        x += 120;
        ctx.fillStyle = '#40b060';
        ctx.fillText(`Publications: ${publications}`, x, barY + 15);
        x += 130;
        ctx.fillStyle = rigor > 60 ? '#40b060' : rigor > 30 ? '#cc9030' : '#cc3030';
        ctx.fillText(`Rigor: ${rigor}`, x, barY + 15);
        x += 100;
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Turn: ${turnNumber}/${MAX_TURNS}`, x, barY + 15);

        // Rigor bar
        Engine.drawBar(ctx, 20, barY + 28, 200, 8, rigor, 100, rigor > 60 ? '#40b060' : rigor > 30 ? '#cc9030' : '#cc3030', '#1a1e28');

        // File drawer indicator
        if (fileDrawerCount > 0) {
            ctx.fillStyle = '#6a5890';
            ctx.textAlign = 'right';
            ctx.fillText(`File Drawer: ${fileDrawerCount} hidden`, W - 20, barY + 15);
        }
    }

    function renderMenu(ctx) {
        const cx = W * 0.4;
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#4488cc';
        ctx.textAlign = 'center';
        ctx.fillText('YOUR LABORATORY', cx, 90);

        ctx.font = '13px serif';
        ctx.fillStyle = '#a0a8c0';
        ctx.fillText('You are studying a phenomenon. You don\'t know if it\'s real.', cx, 120);

        const btnW = 250, btnH = 40;
        let by = 200;

        // Run Study
        drawMenuButton(ctx, cx - btnW / 2, by, btnW, btnH, 'Run a New Study', '#4488cc');
        by += 55;

        // Reform
        drawMenuButton(ctx, cx - btnW / 2, by, btnW, btnH, 'Implement Reform', '#40b060');
        by += 55;

        // Bem Challenge
        if (bemChallengeAvailable && !bemCompleted) {
            drawMenuButton(ctx, cx - btnW / 2, by, btnW, btnH, 'THE BEM CHALLENGE', '#cc8a20');
            ctx.font = '10px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText('90 studies of psychic powers. p < 10^-10.', cx, by + btnH + 12);
            ctx.fillText('Can you figure out what\'s wrong?', cx, by + btnH + 24);
        }
        by += 55;

        // End
        drawMenuButton(ctx, cx - btnW / 2, by, btnW, btnH, 'Close the Lab', '#6a5890');

        // Funnel plot
        if (funnelPlotData.length > 0) {
            renderFunnelPlot(ctx, W * 0.72, 100, 220, 200);
        }

        // Irving Kirsch
        if (kirschAppeared) {
            ctx.font = 'italic 11px serif';
            ctx.fillStyle = '#aa8855';
            ctx.textAlign = 'left';
            ctx.fillText('"Associate Director of the Program for Placebo Studies"', W * 0.62, H - 50);
            ctx.fillText('— Irving Kirsch questions everything.', W * 0.62, H - 36);
        }

        // Reforms adopted
        if (reformsAdopted.length > 0) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#40b060';
            ctx.textAlign = 'left';
            ctx.fillText('Reforms:', 20, H - 60);
            reformsAdopted.forEach((r, i) => {
                ctx.fillText(`\u2713 ${r}`, 20, H - 46 + i * 14);
            });
        }
    }

    function drawMenuButton(ctx, x, y, w, h, text, color) {
        ctx.fillStyle = '#141a24';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y + h / 2 + 5);
    }

    function renderDesign(ctx) {
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#4488cc';
        ctx.textAlign = 'center';
        ctx.fillText('DESIGN A STUDY', W / 2, 90);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a0a8c0';
        ctx.fillText('Choose a study type. Each costs funding and takes one turn.', W / 2, 115);

        const startY = 140;
        for (let i = 0; i < STUDY_TYPES.length; i++) {
            const st = STUDY_TYPES[i];
            const by = startY + i * 70;

            ctx.fillStyle = '#141a24';
            ctx.fillRect(W * 0.15, by, W * 0.7, 60);
            ctx.strokeStyle = funding >= st.cost ? '#4488cc' : '#3a3a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.15, by, W * 0.7, 60);

            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = funding >= st.cost ? '#e0e4f0' : '#5a5a6a';
            ctx.textAlign = 'left';
            ctx.fillText(st.name, W * 0.17, by + 20);

            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#8088a0';
            ctx.fillText(st.desc, W * 0.17, by + 36);

            ctx.textAlign = 'right';
            ctx.fillStyle = '#cc9030';
            ctx.fillText(`Cost: ${st.cost} | N=${st.subjects}`, W * 0.83, by + 20);
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'center';
        ctx.fillText('Click to go back', W / 2, H - 40);
    }

    function renderAnalysis(ctx) {
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#cc9030';
        ctx.textAlign = 'center';
        ctx.fillText('ANALYZE YOUR DATA', W / 2, 80);

        if (currentStudy) {
            ctx.font = '14px serif';
            ctx.fillStyle = '#e0e4f0';
            ctx.fillText(`Study: ${currentStudy.name}`, W / 2, 110);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#a0a8c0';
            ctx.fillText(`Raw p-value: ${currentStudy.pValue.toFixed(4)} | Effect: d = ${currentStudy.observedEffect.toFixed(3)}`, W / 2, 135);
            ctx.fillText(`Significant (p < 0.05): ${currentStudy.significant ? 'YES' : 'NO'}`, W / 2, 155);
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('Choose your analysis approach:', W / 2, 185);

        const startY = 200;
        for (let i = 0; i < analysisChoices.length; i++) {
            const ac = analysisChoices[i];
            const by = startY + i * 80;

            ctx.fillStyle = ac.hack ? '#1a1420' : '#141a24';
            ctx.fillRect(W * 0.15, by, W * 0.7, 70);
            ctx.strokeStyle = ac.hack ? '#cc8a20' : '#4488cc';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.15, by, W * 0.7, 70);

            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = ac.hack ? '#cc8a20' : '#e0e4f0';
            ctx.textAlign = 'left';
            ctx.fillText(ac.name, W * 0.17, by + 18);

            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#8088a0';
            ctx.fillText(ac.desc, W * 0.17, by + 34);

            ctx.fillStyle = ac.pValue < 0.05 ? '#40b060' : '#cc3030';
            ctx.fillText(`p = ${ac.pValue < 0.0001 ? ac.pValue.toExponential(2) : ac.pValue.toFixed(4)}`, W * 0.17, by + 50);
            ctx.fillStyle = '#a0a8c0';
            ctx.fillText(`effect = ${ac.effect.toFixed(3)}`, W * 0.17 + 120, by + 50);

            if (ac.hack) {
                ctx.font = '9px sans-serif';
                ctx.fillStyle = '#cc8a20';
                ctx.textAlign = 'right';
                ctx.fillText('[P-HACKING]', W * 0.83, by + 18);
            }
        }
    }

    function renderPublish(ctx) {
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#40b060';
        ctx.textAlign = 'center';
        ctx.fillText('PUBLISH OR PERISH?', W / 2, 80);

        if (currentStudy) {
            ctx.font = '14px serif';
            ctx.fillStyle = '#e0e4f0';
            ctx.fillText(`Study: ${currentStudy.name}`, W / 2, 120);

            ctx.font = '16px sans-serif';
            const sig = currentStudy.finalPValue < 0.05;
            ctx.fillStyle = sig ? '#40b060' : '#cc3030';
            ctx.fillText(`Final p-value: ${currentStudy.finalPValue < 0.0001 ? currentStudy.finalPValue.toExponential(2) : currentStudy.finalPValue.toFixed(4)}`, W / 2, 150);
            ctx.fillText(`Result: ${sig ? 'SIGNIFICANT' : 'NOT SIGNIFICANT'}`, W / 2, 175);

            if (currentStudy.hacked) {
                ctx.font = 'italic 12px serif';
                ctx.fillStyle = '#cc8a20';
                ctx.fillText('(Analysis was p-hacked)', W / 2, 200);
            }

            ctx.font = '13px sans-serif';
            ctx.fillStyle = '#a0a8c0';
            ctx.fillText('Publishing positive results: +10 prestige, +8 funding', W / 2, H * 0.38);
            ctx.fillText('Filing away: no gain, no loss (but publication bias grows)', W / 2, H * 0.43);

            const btnW = 200, btnH = 45;
            const cx = W / 2;
            const by = H * 0.55;

            // Publish button
            ctx.fillStyle = '#141a24';
            ctx.fillRect(cx - btnW - 10, by, btnW, btnH);
            ctx.strokeStyle = '#40b060';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - btnW - 10, by, btnW, btnH);
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#40b060';
            ctx.textAlign = 'center';
            ctx.fillText('Publish', cx - btnW / 2 - 10, by + btnH / 2 + 5);

            // File drawer button
            ctx.fillStyle = '#141a24';
            ctx.fillRect(cx + 10, by, btnW, btnH);
            ctx.strokeStyle = '#6a5890';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + 10, by, btnW, btnH);
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText('File Drawer', cx + btnW / 2 + 10, by + btnH / 2 + 5);
        }
    }

    function renderReform(ctx) {
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#40b060';
        ctx.textAlign = 'center';
        ctx.fillText('THE TEN COMMANDMENTS OF REFORM', W / 2, 80);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a0a8c0';
        ctx.fillText('Each reform increases rigor but costs prestige. Is it worth it?', W / 2, 110);
        ctx.fillText('(Implementing a reform uses one turn)', W / 2, 128);

        const startY = 160;
        for (let i = 0; i < REFORMS.length; i++) {
            const r = REFORMS[i];
            const adopted = reformsAdopted.includes(r.id);
            const by = startY + i * 65;

            ctx.fillStyle = adopted ? '#1a2a1a' : '#141a24';
            ctx.fillRect(W * 0.15, by, W * 0.7, 55);
            ctx.strokeStyle = adopted ? '#40b060' : prestige >= r.prestigeCost ? '#40b060' : '#3a3a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.15, by, W * 0.7, 55);

            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = adopted ? '#40b060' : '#e0e4f0';
            ctx.textAlign = 'left';
            ctx.fillText(`${adopted ? '\u2713 ' : ''}${r.name}`, W * 0.17, by + 18);

            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#8088a0';
            ctx.fillText(r.desc, W * 0.17, by + 34);

            if (!adopted) {
                ctx.textAlign = 'right';
                ctx.fillStyle = '#cc9030';
                ctx.fillText(`Prestige: -${r.prestigeCost} | Rigor: +${r.rigorBoost}`, W * 0.83, by + 18);
            }
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'center';
        ctx.fillText('Click to go back', W / 2, H - 40);
    }

    function renderReplicationCrisis(ctx) {
        ctx.fillStyle = 'rgba(10, 5, 15, 0.95)';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        ctx.font = 'bold 28px serif';
        ctx.fillStyle = '#cc3030';
        ctx.textAlign = 'center';
        ctx.fillText('THE REPLICATION CRISIS', cx, H * 0.25);

        ctx.font = '16px serif';
        ctx.fillStyle = '#e0e4f0';
        ctx.fillText('A wave of failed replications sweeps through science.', cx, H * 0.35);
        ctx.fillText('All previous findings are questioned.', cx, H * 0.4);

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText(`Your prestige is halved. P-hacked studies lose extra prestige.`, cx, H * 0.5);
        ctx.fillText(`P-hacked studies: ${pHackCount} | Filed away: ${fileDrawerCount}`, cx, H * 0.55);

        if (kirschAppeared) {
            ctx.font = 'italic 14px serif';
            ctx.fillStyle = '#aa8855';
            ctx.fillText('"Associate Director of the Program for Placebo Studies"', cx, H * 0.65);
            ctx.fillText('Irving Kirsch stares at you knowingly.', cx, H * 0.7);
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, H * 0.85);
    }

    function renderFunnelPlot(ctx, x, y, w, h) {
        // Funnel plot: effect size (x) vs standard error (y, inverted)
        ctx.fillStyle = 'rgba(20, 26, 36, 0.8)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#3a4a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6a7a8a';
        ctx.textAlign = 'center';
        ctx.fillText('Funnel Plot', x + w / 2, y + 14);

        // Draw funnel
        const cx = x + w / 2;
        const top = y + 25;
        const bottom = y + h - 10;
        ctx.strokeStyle = 'rgba(100, 120, 150, 0.3)';
        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(x + 15, bottom);
        ctx.moveTo(cx, top);
        ctx.lineTo(x + w - 15, bottom);
        ctx.stroke();

        // Plot points
        for (const d of funnelPlotData) {
            const px = cx + d.effect * w * 2;
            const py = top + d.se * (bottom - top) * 10;
            ctx.fillStyle = d.published ? '#4488cc' : '#cc3030';
            ctx.beginPath();
            ctx.arc(Math.max(x + 5, Math.min(x + w - 5, px)), Math.max(top, Math.min(bottom, py)), 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#5a6a7a';
        ctx.textAlign = 'left';
        ctx.fillText('Blue = published', x + 5, y + h - 2);
        ctx.fillStyle = '#cc3030';
        ctx.fillText('Red = filed', x + w / 2, y + h - 2);
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(10, 14, 20, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.1;

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#4488cc';
        ctx.textAlign = 'center';
        ctx.fillText('LAB REPORT', cx, y);
        y += 40;

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#e0e4f0';
        ctx.fillText(`Publications: ${publications}`, cx, y); y += 22;
        ctx.fillText(`Final Prestige: ${prestige}`, cx, y); y += 22;
        ctx.fillText(`Final Rigor: ${rigor}/100`, cx, y); y += 22;
        ctx.fillText(`Studies P-hacked: ${pHackCount}`, cx, y); y += 22;
        ctx.fillText(`Studies filed away: ${fileDrawerCount}`, cx, y); y += 22;
        ctx.fillText(`Reforms adopted: ${reformsAdopted.length}/${REFORMS.length}`, cx, y); y += 35;

        // Outcome
        ctx.font = 'bold 16px serif';
        if (rigor > 70 && publications > 0) {
            ctx.fillStyle = '#40b060';
            ctx.fillText('The Narrow Path: Rigor AND Productivity', cx, y);
        } else if (publications >= 5) {
            ctx.fillStyle = '#cc9030';
            ctx.fillText('Published Plenty — But at What Cost?', cx, y);
        } else if (rigor > 60) {
            ctx.fillStyle = '#4488cc';
            ctx.fillText('Rigorous but Unfunded — Career Collapse', cx, y);
        } else {
            ctx.fillStyle = '#cc3030';
            ctx.fillText('Neither Rigorous Nor Productive', cx, y);
        }

        y += 40;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to reveal the truth...', cx, y);
    }

    function renderTwist(ctx) {
        ctx.fillStyle = 'rgba(10, 5, 15, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.15;

        ctx.font = 'bold 28px serif';
        ctx.fillStyle = '#cc8a20';
        ctx.textAlign = 'center';
        ctx.fillText('THE TWIST', cx, y);
        y += 50;

        ctx.font = '18px serif';
        ctx.fillStyle = '#e0e4f0';
        ctx.fillText(`The phenomenon was: ${phenomenonIsReal ? 'REAL' : 'NOT REAL'}`, cx, y);
        y += 40;

        ctx.font = '16px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('The gut-punch:', cx, y);
        y += 30;
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText('Your methodology produced the same results', cx, y);
        y += 25;
        ctx.fillText('either way.', cx, y);
        y += 50;

        ctx.font = '14px serif';
        ctx.fillStyle = '#a0a8c0';
        if (phenomenonIsReal) {
            ctx.fillText('The effect was real — but your methods couldn\'t tell the difference', cx, y);
            y += 22;
            ctx.fillText('between a real effect and a false positive.', cx, y);
        } else {
            ctx.fillText('The effect was not real — but your methods still found "significance."', cx, y);
            y += 22;
            ctx.fillText('Parapsychology is the control group for science.', cx, y);
        }

        y += 40;
        ctx.font = 'italic 16px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText('"If this methodology can find evidence for psychic powers,', cx, y);
        y += 22;
        ctx.fillText('what does that say about everything else?"', cx, y);

        y += 50;
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
        ctx.fillStyle = 'rgba(10, 14, 20, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'THE CONTROL GROUP IS OUT OF CONTROL',
                text: 'You run a research laboratory.\nYou\'re studying a phenomenon —\ncould be a drug, could be psychic powers.\n\nYou don\'t know if it\'s real.'
            },
            {
                title: 'THE STATISTICAL TRAPS',
                text: 'P-hacking: Run many analyses, report the one that works.\nPublication bias: The file drawer of failed replications.\nStopping rules: Stop when results look good.\n\nEvery choice you make compounds the bias.'
            },
            {
                title: 'THE BEM CHALLENGE',
                text: 'A famous researcher publishes 90 studies showing\npsychic powers exist. p < 10^-10.\n\nImpeccable methodology. Can you figure out\nwhat\'s wrong?\n\n(The answer is: maybe nothing obvious.\nThat\'s the horror.)'
            },
            {
                title: 'YOUR MISSION',
                text: 'Publish enough to keep your lab funded.\nOr maintain rigorous standards.\nOr find the narrow path where both coexist.\n\nAt the end, you\'ll learn whether\nyour phenomenon was real.\n\nClick to begin.'
            }
        ];
        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#4488cc';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, cx, cy - 110);
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#e0e4f0';
        step.text.split('\n').forEach((line, i) => {
            ctx.fillText(line, cx, cy - 40 + i * 22);
        });
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Click to continue (${tutorialStep + 1}/${steps.length})`, cx, cy + 170);
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
