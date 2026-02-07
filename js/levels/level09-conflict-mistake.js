/* ======================================
   LEVEL 9: CONFLICT VS. MISTAKE

   Dual-Mode Strategy Game

   Mistake theorists think political
   opponents are wrong. Conflict theorists
   think political opponents are evil.
   These are fundamentally different
   worldviews.
   ====================================== */

class Level09ConflictMistake {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Mode ----
        this.currentMode = null; // 'mistake' or 'conflict' — chosen per scenario
        this.modeHistory = [];

        // ---- Scenarios ----
        this.scenarios = this.buildScenarios();
        this.currentScenario = null;
        this.scenarioIndex = 0;
        this.awaitingMode = false;
        this.awaitingAction = false;
        this.scenarioTimer = 0;

        // ---- Scores ----
        this.mistakeScore = 0;   // good outcomes from mistake framing
        this.conflictScore = 0;  // good outcomes from conflict framing
        this.mistakeFails = 0;   // times mistake framing got exploited
        this.conflictFails = 0;  // times conflict framing blocked cooperation
        this.correctFrames = 0;  // times you picked the right frame
        this.wrongFrames = 0;

        // ---- Faction Power (conflict mode resource) ----
        this.factionPower = 50;

        // ---- Research / Evidence (mistake mode resource) ----
        this.evidence = 50;

        // ---- Public Trust ----
        this.publicTrust = 60;

        // ---- Stakeholders ----
        this.stakeholders = [
            { name: 'The Reformers', alignment: 'progressive', power: 40, trust: 50 },
            { name: 'The Establishment', alignment: 'conservative', power: 60, trust: 40 },
            { name: 'The Populists', alignment: 'populist', power: 30, trust: 30 },
            { name: 'The Technocrats', alignment: 'technocrat', power: 50, trust: 60 }
        ];

        // ---- Visual ----
        this.particles = [];
        this.modeFlashTimer = 0;
        this.modeFlashColor = null;

        // ---- Event log ----
        this.eventLog = [];

        // ---- Show UI ----
        document.getElementById('conflict-ui').style.display = 'block';
        document.getElementById('policy-panel').style.display = 'block';
        document.getElementById('stakeholder-panel').style.display = 'block';
        document.getElementById('mode-select-overlay').style.display = 'none';
        document.getElementById('action-select-overlay').style.display = 'none';

        this.updateUI();

        this.engine.showMessage(
            '<strong>LEVEL 9: CONFLICT VS. MISTAKE</strong><br><br>' +
            'You face political scenarios. For each one, you must choose a <em>frame</em>:<br><br>' +
            '<strong>MISTAKE THEORY</strong>: Your opponents are smart people with wrong ideas. ' +
            'Politics is a puzzle. Research, debate, persuade, compromise.<br><br>' +
            '<strong>CONFLICT THEORY</strong>: Your opponents are self-interested actors. ' +
            'Politics is war. Build coalitions, accumulate power, defeat enemies.<br><br>' +
            'The trap: use the wrong frame, and you either get exploited or block cooperation.<br><br>' +
            '<em>The challenge is knowing which frame applies to which situation.</em>',
            () => { this.presentNextScenario(); }
        );
    }

    // ---- Scenarios ----

    buildScenarios() {
        return [
            {
                id: 'healthcare',
                title: 'THE HEALTHCARE DEBATE',
                desc: 'Universal healthcare is on the table. Insurance companies lobby hard against it. ' +
                    'Economists disagree on costs. Citizens are confused.',
                trueNature: 'conflict', // insurance companies have genuine conflicting interests
                mistakeActions: [
                    { label: 'Commission an independent cost-benefit study', effect: 'research',
                      outcome: 'The study is thorough but insurance lobbyists fund counter-studies. Truth drowns in noise.',
                      success: false, evidence: 10, trust: 5, power: -5 },
                    { label: 'Host a public debate between experts', effect: 'debate',
                      outcome: 'The debate goes well but policy doesn\'t change. The obstacles aren\'t informational — they\'re structural.',
                      success: false, evidence: 15, trust: 8, power: -3 },
                    { label: 'Publish evidence that universal care saves money long-term', effect: 'evidence',
                      outcome: 'The evidence is correct and ignored. The opposition doesn\'t disagree about facts — they disagree about who pays.',
                      success: false, evidence: 20, trust: 5, power: -8 }
                ],
                conflictActions: [
                    { label: 'Build a coalition of patient advocacy groups', effect: 'coalition',
                      outcome: 'The coalition pressures legislators. Insurance companies push back but the numbers shift.',
                      success: true, evidence: 0, trust: -5, power: 15 },
                    { label: 'Name and shame politicians taking insurance money', effect: 'attack',
                      outcome: 'Dirty but effective. Several politicians flip their votes.',
                      success: true, evidence: -5, trust: -10, power: 20 },
                    { label: 'Organize strikes and protests at insurance HQs', effect: 'pressure',
                      outcome: 'The pressure works. A compromise bill passes — not perfect, but real.',
                      success: true, evidence: 0, trust: -3, power: 12 }
                ]
            },
            {
                id: 'zoning',
                title: 'THE ZONING REFORM',
                desc: 'Housing costs are insane. Economists agree: upzone residential areas, build more housing. ' +
                    'But homeowners resist. NIMBYs vs. YIMBYs.',
                trueNature: 'mixed', // partly genuine disagreement, partly conflict of interest
                mistakeActions: [
                    { label: 'Present data showing density improves neighborhoods', effect: 'evidence',
                      outcome: 'Some homeowners are genuinely persuaded. Others aren\'t — their property values are at stake.',
                      success: true, evidence: 15, trust: 10, power: 0 },
                    { label: 'Organize town halls with economists and residents', effect: 'debate',
                      outcome: 'Productive conversation! Some compromises emerge. Partial win — the mistake frame works here.',
                      success: true, evidence: 10, trust: 15, power: 0 },
                    { label: 'Propose a pilot project in one neighborhood first', effect: 'research',
                      outcome: 'The pilot succeeds. Hard to argue with results. This was genuinely a mistake to solve with evidence.',
                      success: true, evidence: 20, trust: 12, power: 5 }
                ],
                conflictActions: [
                    { label: 'Override NIMBYs with state-level legislation', effect: 'power',
                      outcome: 'Effective but breeds resentment. Some NIMBYs had legitimate concerns about infrastructure.',
                      success: true, evidence: -5, trust: -15, power: 18 },
                    { label: 'Label all opponents as selfish homeowners', effect: 'attack',
                      outcome: 'Alienates potential allies. Some opponents were genuinely worried about schools and traffic.',
                      success: false, evidence: -10, trust: -20, power: 10 },
                    { label: 'Fund pro-development candidates in local elections', effect: 'coalition',
                      outcome: 'You win the council. But the top-down approach misses nuances only locals know.',
                      success: true, evidence: -5, trust: -10, power: 15 }
                ]
            },
            {
                id: 'meritocracy',
                title: 'THE MERITOCRACY DEBATE',
                desc: 'Are unequal outcomes due to unequal effort (merit) or unequal starting conditions (privilege)? ' +
                    'This debate has raged for decades.',
                trueNature: 'both', // genuinely both — the frame itself is the question
                mistakeActions: [
                    { label: 'Fund longitudinal studies tracking outcomes by background', effect: 'research',
                      outcome: 'The data shows both factors matter. Merit AND privilege shape outcomes. The truth is complex.',
                      success: true, evidence: 20, trust: 10, power: 0 },
                    { label: 'Facilitate dialogue between "bootstraps" and "privilege" camps', effect: 'debate',
                      outcome: 'Surprisingly productive. Both sides acknowledge partial truths. Rare moment of genuine understanding.',
                      success: true, evidence: 10, trust: 15, power: 5 },
                    { label: 'Propose policies that address both: opportunity AND effort', effect: 'compromise',
                      outcome: 'A nuanced policy framework. Not satisfying to purists, but actually correct.',
                      success: true, evidence: 15, trust: 12, power: 3 }
                ],
                conflictActions: [
                    { label: 'Declare meritocracy a myth to mobilize your base', effect: 'attack',
                      outcome: 'Energizes supporters but alienates moderates. And the claim isn\'t fully true — merit does matter some.',
                      success: false, evidence: -15, trust: -12, power: 12 },
                    { label: 'Frame all criticism of meritocracy as "envy"', effect: 'dismiss',
                      outcome: 'Shuts down legitimate grievances. Privilege IS real, even if merit also matters.',
                      success: false, evidence: -10, trust: -15, power: 8 },
                    { label: 'Build a class-based coalition across racial lines', effect: 'coalition',
                      outcome: 'Powerful coalition, but the conflict frame misses that some disagreement is genuine confusion, not bad faith.',
                      success: true, evidence: -5, trust: -5, power: 18 }
                ]
            },
            {
                id: 'education',
                title: 'EDUCATION REFORM',
                desc: 'Test scores are stagnant. Teachers unions resist merit pay. Parents demand school choice. ' +
                    'Everyone claims to want "what\'s best for kids."',
                trueNature: 'mistake', // mostly genuine disagreement about pedagogy
                mistakeActions: [
                    { label: 'Run randomized controlled trials on teaching methods', effect: 'research',
                      outcome: 'The evidence is clear: some methods work better. When presented honestly, most stakeholders shift.',
                      success: true, evidence: 25, trust: 15, power: 5 },
                    { label: 'Bring teachers, parents, and administrators to design solutions together', effect: 'collaborate',
                      outcome: 'Breakthrough! When people aren\'t treated as enemies, they find creative compromises.',
                      success: true, evidence: 10, trust: 20, power: 3 },
                    { label: 'Acknowledge unions have legitimate concerns alongside reform needs', effect: 'empathy',
                      outcome: 'Teachers feel heard. They\'re more open to change. This WAS a mistake problem, not a conflict problem.',
                      success: true, evidence: 8, trust: 18, power: 0 }
                ],
                conflictActions: [
                    { label: 'Break the teachers union — they\'re blocking progress', effect: 'attack',
                      outcome: 'You damage the union but lose experienced teachers. They weren\'t the enemy — they had real concerns.',
                      success: false, evidence: -10, trust: -20, power: 15 },
                    { label: 'Defund public schools to force competition', effect: 'power',
                      outcome: 'Creates winners and losers. The poorest kids lose most. This wasn\'t a war — it was a coordination problem.',
                      success: false, evidence: -15, trust: -18, power: 12 },
                    { label: 'Elect a school board that will fire non-performing principals', effect: 'coalition',
                      outcome: 'Disruption without understanding. Many "non-performing" principals had unsupported students, not bad leadership.',
                      success: false, evidence: -8, trust: -12, power: 10 }
                ]
            },
            {
                id: 'climate',
                title: 'THE CLIMATE ENDGAME',
                desc: 'Climate change is accelerating. Fossil fuel companies fund denial. Developing nations want industrialization. ' +
                    'Time is running out.',
                trueNature: 'conflict', // fossil fuel companies have genuine conflicting interests
                mistakeActions: [
                    { label: 'Publish more climate science — surely the data will convince them', effect: 'evidence',
                      outcome: 'The science has been clear for 30 years. The obstruction isn\'t about information — it\'s about profits.',
                      success: false, evidence: 15, trust: 5, power: -5 },
                    { label: 'Debate climate skeptics publicly to expose their errors', effect: 'debate',
                      outcome: 'You "win" every debate. Nothing changes. The opposition doesn\'t believe their own arguments — they\'re buying time.',
                      success: false, evidence: 10, trust: 3, power: -8 },
                    { label: 'Propose market-based solutions that benefit everyone', effect: 'compromise',
                      outcome: 'Carbon tax proposal is good policy but gets gutted by lobbying. You can\'t compromise with someone whose goal is delay.',
                      success: false, evidence: 12, trust: 8, power: -3 }
                ],
                conflictActions: [
                    { label: 'Divest from fossil fuels and pressure pension funds to follow', effect: 'pressure',
                      outcome: 'Economic pressure works where arguments didn\'t. Money talks.',
                      success: true, evidence: 0, trust: -5, power: 18 },
                    { label: 'Sue fossil fuel companies for climate damages', effect: 'attack',
                      outcome: 'Legal action forces disclosure. Internal documents show they KNEW. This was always a conflict, not a mistake.',
                      success: true, evidence: 20, trust: 5, power: 15 },
                    { label: 'Elect climate hawks and pass legislation over objections', effect: 'coalition',
                      outcome: 'Political power achieves what persuasion couldn\'t. The bill passes. Not perfect, but real.',
                      success: true, evidence: 5, trust: -8, power: 20 }
                ]
            }
        ];
    }

    // ---- Flow ----

    presentNextScenario() {
        if (this.scenarioIndex >= this.scenarios.length) {
            this.endGame();
            return;
        }

        this.currentScenario = this.scenarios[this.scenarioIndex];
        this.scenarioIndex++;
        this.awaitingMode = true;

        // Update policy panel
        document.getElementById('policy-title').textContent = this.currentScenario.title;
        document.getElementById('policy-desc').textContent = this.currentScenario.desc;

        // Show mode selection
        this.showModeSelect();
    }

    showModeSelect() {
        const overlay = document.getElementById('mode-select-overlay');
        overlay.style.display = 'flex';

        document.getElementById('mode-scenario-title').textContent = this.currentScenario.title;
        document.getElementById('mode-scenario-desc').textContent = this.currentScenario.desc;

        document.getElementById('btn-mode-mistake').onclick = () => {
            this.selectMode('mistake');
        };
        document.getElementById('btn-mode-conflict').onclick = () => {
            this.selectMode('conflict');
        };
    }

    selectMode(mode) {
        this.currentMode = mode;
        this.awaitingMode = false;
        this.modeHistory.push(mode);
        document.getElementById('mode-select-overlay').style.display = 'none';

        this.modeFlashColor = mode === 'mistake' ? '#60c0e0' : '#e06060';
        this.modeFlashTimer = 0.5;

        this.addToLog(`Frame chosen: ${mode.toUpperCase()} THEORY`);

        // Show actions
        this.showActions();
    }

    showActions() {
        const scenario = this.currentScenario;
        const actions = this.currentMode === 'mistake' ? scenario.mistakeActions : scenario.conflictActions;

        const overlay = document.getElementById('action-select-overlay');
        overlay.style.display = 'flex';

        const title = document.getElementById('action-select-title');
        title.textContent = this.currentMode === 'mistake' ?
            'MISTAKE THEORY — Choose Your Approach' :
            'CONFLICT THEORY — Choose Your Strategy';
        title.style.color = this.currentMode === 'mistake' ? '#60c0e0' : '#e06060';

        const btns = document.getElementById('action-select-buttons');
        btns.innerHTML = '';

        for (const action of actions) {
            const btn = document.createElement('button');
            btn.className = `policy-action-btn action-${this.currentMode}`;
            btn.textContent = action.label;
            btn.addEventListener('click', () => this.executeAction(action));
            btns.appendChild(btn);
        }
    }

    executeAction(action) {
        document.getElementById('action-select-overlay').style.display = 'none';
        this.awaitingAction = false;

        const scenario = this.currentScenario;
        const nature = scenario.trueNature;

        // Determine if the frame was correct
        let frameCorrect;
        if (nature === 'both' || nature === 'mixed') {
            frameCorrect = true; // both frames have some validity
        } else {
            frameCorrect = (this.currentMode === nature);
        }

        // Apply effects
        this.evidence = Math.max(0, Math.min(100, this.evidence + action.evidence));
        this.publicTrust = Math.max(0, Math.min(100, this.publicTrust + action.trust));
        this.factionPower = Math.max(0, Math.min(100, this.factionPower + action.power));

        if (action.success) {
            if (frameCorrect) {
                this.correctFrames++;
                this.spawnFloatingText('Correct frame!', '#4aaf5a');
            } else {
                // Success despite wrong frame
                this.spawnFloatingText('It worked, but...', '#c0a030');
            }
            if (this.currentMode === 'mistake') this.mistakeScore++;
            else this.conflictScore++;
        } else {
            if (!frameCorrect) {
                this.wrongFrames++;
                if (this.currentMode === 'mistake') {
                    this.mistakeFails++;
                    this.spawnFloatingText('Exploited!', '#d44040');
                } else {
                    this.conflictFails++;
                    this.spawnFloatingText('Cooperation blocked!', '#d44040');
                }
            } else {
                this.spawnFloatingText('Didn\'t work.', '#c0a030');
            }
        }

        // Show outcome
        let outcomeExtra = '';
        if (!frameCorrect && !action.success) {
            if (this.currentMode === 'mistake') {
                outcomeExtra = '<br><br><em>THE TRAP: You treated a genuine conflict as a mistake. ' +
                    'Your good-faith approach was exploited by actors with conflicting interests.</em>';
            } else {
                outcomeExtra = '<br><br><em>THE TRAP: You treated a genuine disagreement as a conflict. ' +
                    'Your adversarial approach prevented cooperation that would have benefited everyone.</em>';
            }
        } else if (frameCorrect && action.success) {
            outcomeExtra = '<br><br><em>The frame fit the situation.</em>';
        }

        // Nature reveal
        let natureReveal = '';
        if (nature === 'conflict') {
            natureReveal = '<br><small>True nature: CONFLICT — genuine opposing interests at play.</small>';
        } else if (nature === 'mistake') {
            natureReveal = '<br><small>True nature: MISTAKE — genuine disagreement, not bad faith.</small>';
        } else if (nature === 'both') {
            natureReveal = '<br><small>True nature: BOTH — merit and privilege are real. The frame IS the question.</small>';
        } else {
            natureReveal = '<br><small>True nature: MIXED — some conflict, some genuine disagreement.</small>';
        }

        this.addToLog(`Action: ${action.label}`);
        this.addToLog(`Result: ${action.success ? 'SUCCESS' : 'FAILED'} | Frame: ${frameCorrect ? 'CORRECT' : 'WRONG'}`);

        this.engine.showMessage(
            `<strong>${scenario.title} — OUTCOME</strong><br><br>` +
            action.outcome + outcomeExtra + natureReveal,
            () => {
                this.updateUI();
                setTimeout(() => this.presentNextScenario(), 1000);
            }
        );
    }

    // ---- End Game ----

    endGame() {
        this.gameOver = true;

        const total = this.scenarios.length;
        const mistakeUses = this.modeHistory.filter(m => m === 'mistake').length;
        const conflictUses = this.modeHistory.filter(m => m === 'conflict').length;

        let title, text, insight;

        if (this.correctFrames >= 4) {
            // Synthesis — correctly identified most frames
            title = 'THE SYNTHESIST';
            text = `You correctly framed ${this.correctFrames} out of ${total} scenarios.<br><br>` +
                `Mistake uses: ${mistakeUses}. Conflict uses: ${conflictUses}.<br>` +
                `Evidence: ${Math.round(this.evidence)}. Power: ${Math.round(this.factionPower)}. Trust: ${Math.round(this.publicTrust)}.<br><br>` +
                `You understood the core insight: <em>some situations are genuinely mistakes</em> ' +
                '(where cooperation helps everyone) <em>and some are genuinely conflicts</em> ' +
                '(where interests truly oppose). The wisdom is knowing which is which.<br><br>' +
                '<em>Both frames are partial. Neither is wrong. The error is applying one universally.</em>';
            insight = '"The mistake theorist and the conflict theorist are both right — about different things. Wisdom is knowing which frame fits."';
            this.elua.adjustHumanity(15);
        } else if (mistakeUses >= 4 && this.mistakeFails >= 2) {
            // Naive mistake theorist
            title = 'THE NAIVE RATIONALIST';
            text = `You chose Mistake Theory ${mistakeUses} times and got exploited ${this.mistakeFails} times.<br><br>` +
                `Evidence: ${Math.round(this.evidence)}. Trust: ${Math.round(this.publicTrust)}. Power: ${Math.round(this.factionPower)}.<br><br>` +
                `You treated every problem as a puzzle to be solved with evidence and debate. ` +
                `But some opponents weren\'t confused — they were adversaries.<br><br>` +
                `Insurance lobbyists didn\'t need more data. Fossil fuel executives didn\'t need more studies. ` +
                `They needed to be defeated.<br><br>` +
                `<em>"Mistake theorists think their opponents are smart people with wrong ideas." ' +
                'Sometimes that\'s true. Sometimes they\'re just protecting their interests.</em>';
            insight = '"If you\'re a mistake theorist in a conflict situation, you get exploited. Good faith requires a partner."';
            this.elua.adjustHumanity(5);
        } else if (conflictUses >= 4 && this.conflictFails >= 2) {
            // Paranoid conflict theorist
            title = 'THE WARRIOR';
            text = `You chose Conflict Theory ${conflictUses} times and blocked cooperation ${this.conflictFails} times.<br><br>` +
                `Power: ${Math.round(this.factionPower)}. Trust: ${Math.round(this.publicTrust)}. Evidence: ${Math.round(this.evidence)}.<br><br>` +
                `You treated every problem as a war. Build power. Defeat enemies. Win.<br><br>` +
                `But some of your "enemies" weren\'t enemies at all — they were confused allies, ` +
                `people who would have cooperated if you hadn\'t attacked them first.<br><br>` +
                `<em>"Conflict theorists think their opponents are bad people with selfish interests." ' +
                'Sometimes. But sometimes they\'re just people who disagree.</em>';
            insight = '"If you\'re a conflict theorist in a mistake situation, you prevent cooperation. Not every disagreement is a war."';
            this.elua.adjustHumanity(3);
        } else {
            // Mixed
            title = 'THE PRAGMATIST';
            text = `Correct frames: ${this.correctFrames}/${total}. ` +
                `Mistake uses: ${mistakeUses}. Conflict uses: ${conflictUses}.<br><br>` +
                `Evidence: ${Math.round(this.evidence)}. Power: ${Math.round(this.factionPower)}. Trust: ${Math.round(this.publicTrust)}.<br><br>` +
                `You tried both frames. Sometimes it worked, sometimes it didn\'t. ` +
                `The world is messy and frameworks don\'t always map cleanly onto reality.<br><br>` +
                `<em>Most real political problems have elements of both mistake and conflict. ` +
                `The question is proportion, not category.</em>`;
            insight = '"Mistake theory and conflict theory aren\'t just analytical tools — they\'re self-fulfilling prophecies."';
            this.elua.adjustHumanity(8);
        }

        this.engine.endLevel(title, text, insight, false);
    }

    // ---- Helpers ----

    addToLog(text) {
        this.eventLog.push({ text, time: this.time });
        if (this.eventLog.length > 20) this.eventLog.shift();

        const logEl = document.getElementById('event-log-content');
        if (logEl) {
            const entry = document.createElement('div');
            entry.className = 'event-entry';
            entry.textContent = text;
            logEl.appendChild(entry);
            logEl.scrollTop = logEl.scrollHeight;
        }
    }

    spawnFloatingText(text, color) {
        this.particles.push({
            type: 'text',
            x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: this.canvas.height / 2 - 40,
            text, color, life: 2.5, maxLife: 2.5, vy: -35
        });
    }

    // ---- Update ----

    update(dt) {
        if (this.gameOver) return;
        this.time += dt;

        if (this.modeFlashTimer > 0) this.modeFlashTimer -= dt;

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            p.y += p.vy * dt;
        }

        this.updateUI();
    }

    // ---- Draw ----

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background — split screen hint
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, '#0a1520');    // cool blue (mistake)
        grad.addColorStop(0.5, '#0e0a1a');  // neutral
        grad.addColorStop(1, '#1a0a0a');    // warm red (conflict)
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Mode indicators
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.font = 'bold 80px Cinzel, serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#60c0e0';
        ctx.fillText('MISTAKE', 30, h / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e06060';
        ctx.fillText('CONFLICT', w - 30, h / 2);
        ctx.restore();

        // Draw scenario visualization
        if (this.currentScenario) {
            this.drawScenarioVis(ctx, w, h);
        }

        // Draw stakeholders as nodes
        this.drawStakeholders(ctx, w, h);

        // Draw resource meters visually
        this.drawResourceArcs(ctx, w, h);

        // Mode flash
        if (this.modeFlashTimer > 0 && this.modeFlashColor) {
            ctx.fillStyle = this.modeFlashColor;
            ctx.globalAlpha = this.modeFlashTimer * 0.2;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }

        // Draw Elua in center
        this.elua.setPosition(w / 2, h / 2 + 50);
        this.elua.draw(ctx);

        // Particles
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 15px Inter, sans-serif';
            ctx.fillStyle = p.color;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        }

        // Scenario counter
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#8a8a9a';
        ctx.textAlign = 'center';
        ctx.fillText(`Scenario ${Math.min(this.scenarioIndex, this.scenarios.length)} / ${this.scenarios.length}`, w / 2, h - 15);

        // Frame history at top
        this.drawFrameHistory(ctx, w);
    }

    drawScenarioVis(ctx, w, h) {
        // Central scenario indicator
        const cx = w / 2;
        const cy = h / 2 - 40;

        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = this.currentMode === 'mistake' ? '#60c0e0' :
                          this.currentMode === 'conflict' ? '#e06060' : '#8a8a9a';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Scenario name
        ctx.font = '11px Cinzel, serif';
        ctx.fillStyle = '#c0c0cc';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6;
        ctx.fillText(this.currentScenario.title, cx, cy - 90);
        ctx.globalAlpha = 1;
    }

    drawStakeholders(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2 - 40;
        const radius = 150;

        for (let i = 0; i < this.stakeholders.length; i++) {
            const s = this.stakeholders[i];
            const angle = (i / this.stakeholders.length) * Math.PI * 2 - Math.PI / 2;
            const sx = cx + Math.cos(angle) * radius;
            const sy = cy + Math.sin(angle) * radius;

            // Power ring
            const powerPct = s.power / 100;
            ctx.save();
            ctx.globalAlpha = 0.3 + powerPct * 0.4;
            ctx.strokeStyle = s.trust > 40 ? '#4aaf5a' : '#d44040';
            ctx.lineWidth = 2 + powerPct * 3;
            ctx.beginPath();
            ctx.arc(sx, sy, 18, 0, Math.PI * 2);
            ctx.stroke();

            // Body
            ctx.fillStyle = s.trust > 40 ? 'rgba(74, 175, 90, 0.5)' : 'rgba(212, 64, 64, 0.4)';
            ctx.beginPath();
            ctx.arc(sx, sy, 12, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.globalAlpha = 0.7;
            ctx.font = '9px Inter, sans-serif';
            ctx.fillStyle = '#c0c0cc';
            ctx.textAlign = 'center';
            ctx.fillText(s.name, sx, sy + 28);
            ctx.restore();
        }
    }

    drawResourceArcs(ctx, w, h) {
        // Three arc meters at bottom corners
        const metrics = [
            { label: 'Evidence', value: this.evidence, color: '#60c0e0', x: 80 },
            { label: 'Power', value: this.factionPower, color: '#e06060', x: w - 80 },
            { label: 'Trust', value: this.publicTrust, color: '#4aaf5a', x: w / 2 }
        ];

        for (const m of metrics) {
            const y = h - 60;
            const pct = m.value / 100;

            ctx.save();
            // Track
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(m.x, y, 25, Math.PI * 0.8, Math.PI * 2.2);
            ctx.stroke();

            // Fill
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 5;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(m.x, y, 25, Math.PI * 0.8, Math.PI * 0.8 + pct * Math.PI * 1.4);
            ctx.stroke();

            // Label
            ctx.globalAlpha = 0.6;
            ctx.font = '9px Inter, sans-serif';
            ctx.fillStyle = m.color;
            ctx.textAlign = 'center';
            ctx.fillText(m.label, m.x, y + 40);
            ctx.fillText(Math.round(m.value), m.x, y + 5);
            ctx.restore();
        }
    }

    drawFrameHistory(ctx, w) {
        if (this.modeHistory.length === 0) return;
        const startX = w / 2 - (this.modeHistory.length * 20) / 2;
        const y = 50;

        for (let i = 0; i < this.modeHistory.length; i++) {
            const mode = this.modeHistory[i];
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = mode === 'mistake' ? '#60c0e0' : '#e06060';
            ctx.beginPath();
            ctx.arc(startX + i * 20, y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '7px Inter, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(mode === 'mistake' ? 'M' : 'C', startX + i * 20, y + 3);
            ctx.restore();
        }
    }

    // ---- UI ----

    updateUI() {
        const evidenceFill = document.getElementById('conflict-evidence-fill');
        if (evidenceFill) evidenceFill.style.width = this.evidence + '%';

        const powerFill = document.getElementById('conflict-power-fill');
        if (powerFill) powerFill.style.width = this.factionPower + '%';

        const trustFill = document.getElementById('conflict-trust-fill');
        if (trustFill) trustFill.style.width = this.publicTrust + '%';

        const evidenceVal = document.getElementById('conflict-evidence-val');
        if (evidenceVal) evidenceVal.textContent = Math.round(this.evidence);

        const powerVal = document.getElementById('conflict-power-val');
        if (powerVal) powerVal.textContent = Math.round(this.factionPower);

        const trustVal = document.getElementById('conflict-trust-val');
        if (trustVal) trustVal.textContent = Math.round(this.publicTrust);

        const scoreEl = document.getElementById('conflict-score');
        if (scoreEl) scoreEl.textContent = `Correct: ${this.correctFrames} | Wrong: ${this.wrongFrames}`;

        const humFill = document.getElementById('humanity-fill-l9');
        if (humFill) humFill.style.width = this.elua.humanity + '%';
    }

    cleanup() {
        document.getElementById('conflict-ui').style.display = 'none';
        document.getElementById('policy-panel').style.display = 'none';
        document.getElementById('stakeholder-panel').style.display = 'none';
        document.getElementById('mode-select-overlay').style.display = 'none';
        document.getElementById('action-select-overlay').style.display = 'none';
    }
}
