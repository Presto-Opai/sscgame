/* ======================================
   LEVEL 4: THE CONTROL GROUP IS OUT OF
   CONTROL

   Laboratory Management / Statistical
   Puzzle Game

   Parapsychology is the control group for
   science. If rigorous studies consistently
   find positive results for phenomena that
   don't exist, what does that say about
   ALL science?
   ====================================== */

class Level04ControlGroup {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Lab State ----
        this.prestige = 50;
        this.funding = 100;
        this.rigor = 50;
        this.publications = 0;
        this.studiesRun = 0;
        this.year = 1;
        this.maxYears = 12;

        // ---- The Phenomenon ----
        // Secretly determined: is the phenomenon real?
        this.phenomenonReal = Math.random() < 0.5;
        this.trueEffectSize = this.phenomenonReal ? 0.15 + Math.random() * 0.2 : 0;
        this.playerKnowsReality = false;

        // ---- Studies ----
        this.completedStudies = [];
        this.publishedStudies = [];
        this.drawerStudies = [];  // file drawer — unpublished negatives
        this.currentStudy = null;
        this.studyRunning = false;
        this.studyProgress = 0;

        // Study parameters (player-adjustable)
        this.sampleSize = 30;
        this.numAnalyses = 1;      // more = more p-hacking
        this.stoppingRule = false;  // stop when significant?
        this.selectedOutcome = 0;   // which analysis to report

        // ---- Reforms ----
        this.reforms = {
            preregistration: false,
            bayesian: false,
            replication: false,
            openData: false,
            effectSizeReporting: false
        };

        // ---- Events ----
        this.replicationCrisisHit = false;
        this.bemChallengeShown = false;
        this.kirschAppeared = false;
        this.funnelPlotShown = false;

        // ---- Visuals ----
        this.labObjects = this.generateLabObjects();
        this.particles = [];
        this.flashMessages = [];

        // Place Elua
        this.elua.setPosition(this.canvas.width / 2, this.canvas.height / 2);

        // Show UI
        document.getElementById('lab-ui').style.display = 'block';
        document.getElementById('study-panel').style.display = 'block';
        document.getElementById('results-panel').style.display = 'block';
        document.getElementById('reform-panel').style.display = 'block';

        this.setupStudyControls();
        this.setupReforms();
        this.setupBemDismiss();
        this.updateUI();

        // Intro
        this.engine.showMessage(
            "Welcome to your <b>research laboratory</b>.<br><br>" +
            "You're studying a phenomenon. It could be a new drug, " +
            "a social intervention, or &mdash; for all you know &mdash; <b>psychic powers</b>.<br><br>" +
            "You don't know if it's real. <i>That's the point.</i>",
            () => {
                this.engine.showMessage(
                    "Design studies, run experiments, publish results.<br><br>" +
                    "Your lab needs <b>prestige</b> to survive and <b>funding</b> to operate. " +
                    "Positive results generate prestige. Rigor costs prestige.<br><br>" +
                    "But beware: the statistical tools at your disposal are <i>full of traps</i>.",
                    null
                );
            }
        );
    }

    generateLabObjects() {
        const objs = [];
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        // Desks, equipment, etc.
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            objs.push({
                type: 'desk',
                x: cx + Math.cos(angle) * 150,
                y: cy + Math.sin(angle) * 100,
                width: 40, height: 25
            });
        }
        // Central equipment
        objs.push({ type: 'equipment', x: cx, y: cy, width: 30, height: 30 });
        return objs;
    }

    // ===============================
    //  STUDY CONTROLS
    // ===============================

    setupStudyControls() {
        const panel = document.getElementById('study-controls');
        panel.innerHTML = '';

        // Sample size slider
        const sampleRow = this.createSliderRow('Sample Size', 10, 200, this.sampleSize, (v) => {
            this.sampleSize = v;
        });
        panel.appendChild(sampleRow);

        // Number of analyses
        const analysesRow = this.createSliderRow('Analyses', 1, 20, this.numAnalyses, (v) => {
            this.numAnalyses = v;
        });
        panel.appendChild(analysesRow);

        // Stopping rule toggle
        const stopRow = document.createElement('div');
        stopRow.className = 'study-row';
        stopRow.innerHTML = `<label>Stop when significant</label>`;
        const stopCheck = document.createElement('input');
        stopCheck.type = 'checkbox';
        stopCheck.checked = this.stoppingRule;
        stopCheck.onchange = () => { this.stoppingRule = stopCheck.checked; };
        stopRow.appendChild(stopCheck);
        panel.appendChild(stopRow);

        // Cost display
        const costRow = document.createElement('div');
        costRow.className = 'study-row';
        costRow.style.color = 'var(--grey-cold)';
        costRow.style.marginTop = '0.3em';
        costRow.id = 'study-cost-display';
        costRow.textContent = `Cost: ${this.getStudyCost()} funding`;
        panel.appendChild(costRow);

        // Run button
        const runBtn = document.createElement('button');
        runBtn.className = 'study-action-btn';
        runBtn.textContent = 'RUN STUDY';
        runBtn.id = 'btn-run-study';
        runBtn.onclick = () => this.runStudy();
        panel.appendChild(runBtn);

        // Publish button
        const pubBtn = document.createElement('button');
        pubBtn.className = 'study-action-btn';
        pubBtn.textContent = 'PUBLISH BEST RESULT';
        pubBtn.id = 'btn-publish';
        pubBtn.disabled = true;
        pubBtn.onclick = () => this.publishBestResult();
        panel.appendChild(pubBtn);

        // File drawer button
        const drawerBtn = document.createElement('button');
        drawerBtn.className = 'study-action-btn';
        drawerBtn.style.borderColor = 'var(--purple-dim)';
        drawerBtn.textContent = 'FILE IN DRAWER (hide negative)';
        drawerBtn.id = 'btn-drawer';
        drawerBtn.disabled = true;
        drawerBtn.onclick = () => this.fileInDrawer();
        panel.appendChild(drawerBtn);
    }

    createSliderRow(label, min, max, value, onChange) {
        const row = document.createElement('div');
        row.className = 'study-row';
        row.innerHTML = `<label>${label}</label>`;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        const valSpan = document.createElement('span');
        valSpan.className = 'range-val';
        valSpan.textContent = value;
        slider.oninput = () => {
            valSpan.textContent = slider.value;
            onChange(parseInt(slider.value));
            const costEl = document.getElementById('study-cost-display');
            if (costEl) costEl.textContent = `Cost: ${this.getStudyCost()} funding`;
        };
        row.appendChild(slider);
        row.appendChild(valSpan);
        return row;
    }

    getStudyCost() {
        return Math.floor(5 + this.sampleSize * 0.15 + this.numAnalyses * 0.5);
    }

    // ===============================
    //  REFORMS
    // ===============================

    setupReforms() {
        const panel = document.getElementById('reform-buttons');
        panel.innerHTML = '';

        const reformList = [
            { id: 'preregistration', name: 'Pre-registration', cost: 15,
              desc: 'Declare analyses in advance. Prevents p-hacking.' },
            { id: 'bayesian', name: 'Bayesian Statistics', cost: 20,
              desc: 'Replace p-values with Bayes factors. More honest uncertainty.' },
            { id: 'replication', name: 'Demand Replication', cost: 10,
              desc: 'Require replication before publishing. Slower but surer.' },
            { id: 'openData', name: 'Open Data', cost: 8,
              desc: 'Share all data publicly. Others can check your work.' },
            { id: 'effectSizeReporting', name: 'Report Effect Sizes', cost: 5,
              desc: 'Report effect size, not just significance. Reveals true magnitude.' }
        ];

        for (const reform of reformList) {
            const btn = document.createElement('button');
            btn.className = 'reform-btn';
            btn.innerHTML = `<b>${reform.name}</b> (-${reform.cost} prestige)<br><span style="color:var(--grey-cold);font-size:0.6rem;">${reform.desc}</span>`;
            btn.onclick = () => this.adoptReform(reform, btn);
            if (this.reforms[reform.id]) {
                btn.classList.add('adopted');
                btn.textContent = `\u2713 ${reform.name}`;
            }
            panel.appendChild(btn);
        }
    }

    adoptReform(reform, btn) {
        if (this.reforms[reform.id]) return;
        if (this.prestige < reform.cost) {
            this.addFlashMessage('Not enough prestige!');
            return;
        }

        this.prestige -= reform.cost;
        this.reforms[reform.id] = true;
        this.rigor += 10;
        btn.classList.add('adopted');
        btn.innerHTML = `\u2713 <b>${reform.name}</b>`;
        this.addFlashMessage(`Reform adopted: ${reform.name}`);
        this.updateUI();
    }

    setupBemDismiss() {
        document.getElementById('bem-dismiss').onclick = () => {
            document.getElementById('bem-overlay').style.display = 'none';
        };
    }

    // ===============================
    //  RUNNING STUDIES
    // ===============================

    runStudy() {
        const cost = this.getStudyCost();
        if (this.funding < cost) {
            this.addFlashMessage('Insufficient funding!');
            return;
        }
        if (this.studyRunning) return;

        this.funding -= cost;
        this.studiesRun++;
        this.studyRunning = true;
        this.studyProgress = 0;

        // Generate study results
        const results = [];
        const n = this.sampleSize;

        for (let a = 0; a < this.numAnalyses; a++) {
            // Simulate data
            let effectObserved = this.trueEffectSize;
            // Add noise — smaller n = more noise
            const noise = (Math.random() - 0.5) * (2 / Math.sqrt(n));
            effectObserved += noise;

            // Calculate p-value (simplified)
            const tStat = effectObserved / (1 / Math.sqrt(n));
            // Approximate p-value from t-statistic
            const pValue = Math.max(0.0001, Math.min(1, Math.exp(-0.7 * Math.abs(tStat))));

            results.push({
                analysisIndex: a,
                effectSize: effectObserved,
                pValue,
                significant: pValue < 0.05,
                sampleSize: n
            });

            // Stopping rule: stop if we found significance
            if (this.stoppingRule && pValue < 0.05) break;
        }

        // Pre-registration prevents cherry-picking
        const pHacked = this.numAnalyses > 1 && !this.reforms.preregistration;
        const bestResult = results.reduce((best, r) =>
            r.pValue < best.pValue ? r : best, results[0]);

        this.currentStudy = {
            id: this.studiesRun,
            results,
            bestResult,
            pHacked,
            published: false,
            filed: false,
            replicated: false,
            sampleSize: n,
            numAnalyses: this.numAnalyses,
            usedStoppingRule: this.stoppingRule
        };

        // Animate study running
        const runInterval = setInterval(() => {
            this.studyProgress += 0.02;
            if (this.studyProgress >= 1) {
                clearInterval(runInterval);
                this.studyRunning = false;
                this.completedStudies.push(this.currentStudy);
                this.updateResultsPanel();
                document.getElementById('btn-publish').disabled = false;
                document.getElementById('btn-drawer').disabled = false;

                // Check for Bem challenge (after 6 studies)
                if (this.studiesRun >= 6 && !this.bemChallengeShown) {
                    this.triggerBemChallenge();
                }
            }
        }, 50);

        this.updateUI();
    }

    publishBestResult() {
        if (!this.currentStudy || this.currentStudy.published) return;

        const study = this.currentStudy;
        const result = study.bestResult;
        study.published = true;
        this.publications++;

        // Prestige gain from publication
        let prestigeGain = result.significant ? 15 : 3;
        if (study.pHacked) prestigeGain += 5; // p-hacked results tend to be flashier

        // Reforms modify gains
        if (this.reforms.effectSizeReporting && Math.abs(result.effectSize) < 0.1) {
            prestigeGain -= 5; // Tiny effect size less impressive when reported
        }
        if (this.reforms.bayesian) {
            // Bayesian stats give more honest view
            prestigeGain = Math.floor(prestigeGain * 0.7);
        }
        if (this.reforms.replication) {
            // Need to replicate — run a second time
            const replication = this.simulateReplication(study);
            study.replicated = true;
            if (!replication.significant) {
                prestigeGain = Math.floor(prestigeGain * 0.3);
                this.addFlashMessage('Replication failed! Reduced prestige.');
            } else {
                this.addFlashMessage('Replication successful!');
            }
        }

        this.prestige = Math.min(100, this.prestige + Math.max(0, prestigeGain));
        this.publishedStudies.push({ study, result, pHacked: study.pHacked });

        // Funding from publications
        this.funding += result.significant ? 20 : 5;

        // Track rigor impact
        if (study.pHacked) {
            this.rigor = Math.max(0, this.rigor - 5);
            this.elua.adjustHumanity(-3);
        } else {
            this.rigor = Math.min(100, this.rigor + 2);
        }

        document.getElementById('btn-publish').disabled = true;
        document.getElementById('btn-drawer').disabled = true;

        this.updateResultsPanel();
        this.updateUI();
        this.advanceYear();
    }

    fileInDrawer() {
        if (!this.currentStudy || this.currentStudy.published) return;

        this.currentStudy.filed = true;
        this.drawerStudies.push(this.currentStudy);
        this.addFlashMessage('Study filed in drawer. Nobody will see it.');

        // Filing negatives is a form of publication bias
        if (this.currentStudy.bestResult.significant === false) {
            this.rigor = Math.max(0, this.rigor - 3);
        }

        document.getElementById('btn-publish').disabled = true;
        document.getElementById('btn-drawer').disabled = true;

        this.updateUI();
        this.advanceYear();
    }

    simulateReplication(study) {
        const n = study.sampleSize;
        const effectObserved = this.trueEffectSize + (Math.random() - 0.5) * (2 / Math.sqrt(n));
        const tStat = effectObserved / (1 / Math.sqrt(n));
        const pValue = Math.max(0.0001, Math.min(1, Math.exp(-0.7 * Math.abs(tStat))));
        return { effectSize: effectObserved, pValue, significant: pValue < 0.05 };
    }

    advanceYear() {
        this.year++;

        // Passive funding drain
        this.funding = Math.max(0, this.funding - 8);

        // Prestige decay
        this.prestige = Math.max(0, this.prestige - 2);

        // Replication crisis event (year 7)
        if (this.year === 7 && !this.replicationCrisisHit) {
            this.triggerReplicationCrisis();
        }

        // Irving Kirsch (year 4)
        if (this.year === 4 && !this.kirschAppeared) {
            this.kirschAppeared = true;
            this.engine.showMessage(
                "<b>A VISITOR</b><br><br>" +
                "Irving Kirsch, <i>Associate Director of the Program for Placebo Studies</i>, " +
                "visits your lab.<br><br>" +
                "\"Interesting work,\" he says, examining your data. \"But have you considered " +
                "that the placebo effect alone might explain everything you're seeing?\"<br><br>" +
                "<i>He leaves you with doubt.</i>"
            );
        }

        // Funnel plot (year 9)
        if (this.year === 9 && !this.funnelPlotShown && this.publishedStudies.length > 3) {
            this.showFunnelPlot();
        }

        // Check game over conditions
        if (this.funding <= 0 && this.prestige < 10) {
            this.triggerEnd('defunded');
        } else if (this.year > this.maxYears) {
            this.triggerEnd('complete');
        }

        this.updateUI();
    }

    // ===============================
    //  EVENTS
    // ===============================

    triggerBemChallenge() {
        this.bemChallengeShown = true;

        document.getElementById('bem-title').textContent = 'THE BEM CHALLENGE';
        document.getElementById('bem-text').innerHTML =
            "A famous researcher &mdash; <b>Daryl Bem</b> &mdash; has published a meta-analysis " +
            "of 90 studies demonstrating <i>precognition</i>. Psychic powers.<br><br>" +
            "His methodology is impeccable. His statistics are flawless. " +
            "The combined p-value is less than 10<sup>-10</sup>.<br><br>" +
            "Can you figure out what's wrong?<br><br>" +
            "<i>The answer: maybe nothing obvious. That's the horror.</i><br><br>" +
            "If the standard tools of science can \"prove\" psychic powers exist, " +
            "what does that say about everything else those tools have \"proven\"?";
        document.getElementById('bem-overlay').style.display = 'flex';
    }

    triggerReplicationCrisis() {
        this.replicationCrisisHit = true;

        // Tank value of all previous p-hacked publications
        let tanked = 0;
        for (const pub of this.publishedStudies) {
            if (pub.pHacked) {
                tanked++;
            }
        }

        const prestigeLoss = tanked * 8;
        this.prestige = Math.max(0, this.prestige - prestigeLoss);
        this.funding = Math.max(0, this.funding - tanked * 5);

        this.engine.showMessage(
            "<b>THE REPLICATION CRISIS</b><br><br>" +
            "A wave sweeps through science. Major journals demand replication. " +
            "Failed replications pile up. Careers crumble.<br><br>" +
            `${tanked} of your ${this.publishedStudies.length} publications are flagged as potentially unreliable.` +
            `<br><b>Prestige lost: ${prestigeLoss}</b><br><br>` +
            "<i>The ground shifts beneath every finding you thought was solid.</i>",
            () => {
                if (!this.reforms.preregistration) {
                    this.engine.showMessage(
                        "The Ten Commandments of reform beckon:<br><br>" +
                        "Pre-registration, Bayesian statistics, open data, mandatory replication...<br><br>" +
                        "Each costs prestige. But the alternative is building on sand.",
                        null
                    );
                }
            }
        );
    }

    showFunnelPlot() {
        this.funnelPlotShown = true;
        document.getElementById('funnel-overlay').style.display = 'block';

        const canvas = document.getElementById('funnel-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 300, 250);

        // Draw funnel plot
        ctx.fillStyle = '#1a1430';
        ctx.fillRect(0, 0, 300, 250);

        // Axes
        ctx.strokeStyle = '#4a3d6e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, 210);
        ctx.lineTo(280, 210);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#8a8a9a';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Effect Size', 160, 230);
        ctx.save();
        ctx.translate(15, 120);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Precision', 0, 0);
        ctx.restore();

        // Funnel outline
        ctx.strokeStyle = 'rgba(90, 122, 223, 0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(160, 30);
        ctx.lineTo(80, 200);
        ctx.moveTo(160, 30);
        ctx.lineTo(240, 200);
        ctx.stroke();
        ctx.setLineDash([]);

        // Plot published studies
        for (const pub of this.publishedStudies) {
            const es = pub.result.effectSize;
            const precision = Math.sqrt(pub.study.sampleSize);
            const x = 160 + es * 300;
            const y = 210 - (precision / 15) * 180;

            ctx.beginPath();
            ctx.arc(
                Math.max(45, Math.min(275, x)),
                Math.max(25, Math.min(205, y)),
                3, 0, Math.PI * 2
            );
            ctx.fillStyle = pub.pHacked ? '#e04060' : '#4aaf5a';
            ctx.fill();
        }

        // Plot drawer studies (ghosted)
        for (const study of this.drawerStudies) {
            const es = study.bestResult.effectSize;
            const precision = Math.sqrt(study.sampleSize);
            const x = 160 + es * 300;
            const y = 210 - (precision / 15) * 180;

            ctx.beginPath();
            ctx.arc(
                Math.max(45, Math.min(275, x)),
                Math.max(25, Math.min(205, y)),
                3, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(138, 138, 154, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(138, 138, 154, 0.5)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        const asymmetric = this.drawerStudies.length > 1;
        document.getElementById('funnel-text').textContent = asymmetric
            ? '"Beautifully symmetrical" — except for the studies in your drawer.'
            : 'Your funnel plot. Are the missing studies hiding something?';
    }

    // ===============================
    //  END
    // ===============================

    triggerEnd(reason) {
        this.gameOver = true;

        // THE TWIST: reveal whether phenomenon was real
        let title, text;
        const wasReal = this.phenomenonReal;
        const highRigor = this.rigor >= 60;
        const wellFunded = reason !== 'defunded';

        if (reason === 'defunded') {
            title = "LAB CLOSED";
            text = "Your funding ran out. Your prestige collapsed. " +
                   "The lab closes its doors.<br><br>" +
                   "You maintained your standards, but the system didn't reward rigor.";
        } else if (highRigor && wellFunded) {
            title = "THE NARROW PATH";
            text = "You found it &mdash; the balance between rigor and productivity. " +
                   `${this.publications} publications. ${Math.floor(this.rigor)}% rigor. ` +
                   "Your lab survived AND your science was trustworthy.";
        } else if (wellFunded && !highRigor) {
            title = "PUBLISH OR PERISH";
            text = `You published ${this.publications} papers. Your lab thrived. ` +
                   "But your rigor score tells a different story &mdash; " +
                   `${Math.floor(this.rigor)}% confidence in your own work.`;
        } else {
            title = "THE GRIND";
            text = "You survived. Barely. The science was... science-shaped.";
        }

        // THE GUT PUNCH
        text += `<br><br><b>THE REVEAL:</b> The phenomenon you were studying was ` +
                `<b>${wasReal ? 'REAL' : 'NOT REAL'}</b>. ` +
                `The true effect size was ${wasReal ? this.trueEffectSize.toFixed(3) : '0.000'}.<br><br>`;

        // Check if their methodology would have caught the truth
        const publishedPositives = this.publishedStudies.filter(p => p.result.significant).length;
        const publishedTotal = this.publishedStudies.length;

        if (wasReal && publishedPositives > publishedTotal / 2) {
            text += "Your studies found positive results &mdash; and the phenomenon was real. " +
                    "But would your methodology have found the same results if it <i>wasn't</i> real?<br><br>";
        } else if (!wasReal && publishedPositives > publishedTotal / 2) {
            text += "Your studies found positive results &mdash; but the phenomenon was <b>not real</b>. " +
                    "Every positive finding was a false positive. Every published paper, a mirage.<br><br>";
        } else if (wasReal && publishedPositives <= publishedTotal / 2) {
            text += "Your studies mostly found null results &mdash; but the phenomenon was real. " +
                    "You missed something true because your methods weren't sensitive enough.<br><br>";
        } else {
            text += "Your studies mostly found null results, and the phenomenon wasn't real. " +
                    "You got the right answer. But was it for the right reasons?<br><br>";
        }

        text += "<i>\"Your methodology produced the same results either way. That's the horror.\"</i>";

        const insight = "\"If parapsychology is the control group for science, " +
            "and the control group keeps finding positive results, " +
            "then the entire methodology is suspect. " +
            "The control group is out of control.\"";

        if (highRigor) {
            this.elua.adjustHumanity(10);
        } else {
            this.elua.adjustHumanity(-5);
            this.elua.addScar('bad_science');
        }

        this.engine.endLevel(title, text, insight, false);
    }

    // ===============================
    //  UI
    // ===============================

    updateUI() {
        document.getElementById('prestige-fill').style.width = this.prestige + '%';
        document.getElementById('prestige-value').textContent = Math.floor(this.prestige);
        document.getElementById('funding-display').textContent = 'Funding: ' + Math.floor(this.funding);
        document.getElementById('publications-display').textContent = 'Published: ' + this.publications;
        document.getElementById('rigor-display').textContent = 'Rigor: ' + Math.floor(this.rigor);
        document.getElementById('humanity-fill-l4').style.width = this.elua.humanity + '%';

        const runBtn = document.getElementById('btn-run-study');
        if (runBtn) runBtn.disabled = this.studyRunning || this.funding < this.getStudyCost();
    }

    updateResultsPanel() {
        const content = document.getElementById('results-content');
        let html = `<b style="font-size:0.6rem;letter-spacing:0.1em;color:var(--grey-cold);">YEAR ${this.year} / ${this.maxYears}</b><br>`;

        // Show last few completed studies
        const recent = this.completedStudies.slice(-5).reverse();
        for (const study of recent) {
            const r = study.bestResult;
            const pClass = r.significant ? (study.pHacked ? 'p-hacked' : 'p-sig') : 'p-nonsig';
            const pLabel = study.pHacked ? 'p-hacked' : (r.significant ? 'significant' : 'n.s.');

            html += `<div class="result-card">`;
            html += `Study #${study.id} (n=${study.sampleSize})`;
            if (study.numAnalyses > 1) html += ` [${study.numAnalyses} analyses]`;
            html += `<br>`;
            html += `Effect: ${r.effectSize.toFixed(3)} | `;
            html += `<span class="p-value ${pClass}">p=${r.pValue.toFixed(4)} (${pLabel})</span>`;
            if (study.published) html += `<br><span style="color:#4aaf5a;">PUBLISHED</span>`;
            if (study.filed) html += `<br><span style="color:var(--grey-cold);">FILED IN DRAWER</span>`;
            html += `</div>`;
        }

        if (this.drawerStudies.length > 0) {
            html += `<div style="color:var(--grey-cold);font-size:0.6rem;margin-top:0.3em;">` +
                    `${this.drawerStudies.length} studies in the file drawer</div>`;
        }

        content.innerHTML = html;
    }

    addFlashMessage(text) {
        this.flashMessages.push({ text, timer: 2.5, y: this.canvas.height / 2 - 50 });
    }

    // ===============================
    //  UPDATE
    // ===============================

    update(dt) {
        if (this.gameOver) return;

        this.time += dt;

        // Flash messages
        for (const fm of this.flashMessages) {
            fm.timer -= dt;
            fm.y -= dt * 15;
        }
        this.flashMessages = this.flashMessages.filter(fm => fm.timer > 0);

        // Particles
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // Elua wanders the lab
        this.elua.setPosition(
            this.canvas.width / 2 + Math.sin(this.time * 0.3) * 60,
            this.canvas.height / 2 + Math.cos(this.time * 0.2) * 30
        );
    }

    // ===============================
    //  DRAWING
    // ===============================

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.drawBackground(ctx, w, h);
        this.drawLab(ctx);
        this.drawStudyProgress(ctx);
        this.drawParticles(ctx);
        this.drawFlashMessages(ctx);
        this.elua.draw(ctx);
    }

    drawBackground(ctx, w, h) {
        // Lab interior — sterile blue-white
        const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) * 0.6);
        grad.addColorStop(0, '#141825');
        grad.addColorStop(0.5, '#0e1220');
        grad.addColorStop(1, '#080a14');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Fluorescent light bars
        ctx.fillStyle = 'rgba(180, 200, 220, 0.03)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(w * 0.15, h * (0.2 + i * 0.25), w * 0.7, 3);
        }
    }

    drawLab(ctx) {
        // Desks
        for (const obj of this.labObjects) {
            if (obj.type === 'desk') {
                ctx.fillStyle = '#2a2535';
                ctx.fillRect(obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height);
                ctx.strokeStyle = '#3a3545';
                ctx.lineWidth = 1;
                ctx.strokeRect(obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height);

                // Computer screen glow
                ctx.fillStyle = `rgba(64, 160, 192, ${0.15 + Math.sin(this.time * 2 + obj.x) * 0.05})`;
                ctx.fillRect(obj.x - 6, obj.y - obj.height / 2 + 3, 12, 8);
            } else if (obj.type === 'equipment') {
                // Central research apparatus
                ctx.fillStyle = '#252035';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#40a0c0';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Pulsing center
                const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(64, 160, 192, ${0.3 * pulse})`;
                ctx.fill();

                // Label
                ctx.fillStyle = 'rgba(64, 160, 192, 0.4)';
                ctx.font = '8px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('PHENOMENON', obj.x, obj.y + 30);
                ctx.fillText('(real? not real?)', obj.x, obj.y + 40);
            }
        }

        // File drawer visualization
        const drawerCount = this.drawerStudies.length;
        if (drawerCount > 0) {
            const dx = this.canvas.width - 80;
            const dy = this.canvas.height / 2;
            ctx.fillStyle = '#1a1520';
            ctx.fillRect(dx - 25, dy - 15, 50, 30);
            ctx.strokeStyle = '#3a3040';
            ctx.strokeRect(dx - 25, dy - 15, 50, 30);
            ctx.fillStyle = 'rgba(138, 138, 154, 0.5)';
            ctx.font = '8px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('FILE DRAWER', dx, dy - 3);
            ctx.fillText(`${drawerCount} hidden`, dx, dy + 8);
        }
    }

    drawStudyProgress(ctx) {
        if (!this.studyRunning) return;

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2 - 80;

        // Progress bar
        ctx.fillStyle = 'rgba(13, 10, 26, 0.8)';
        ctx.fillRect(cx - 80, cy - 10, 160, 20);
        ctx.fillStyle = '#40a0c0';
        ctx.fillRect(cx - 78, cy - 8, 156 * this.studyProgress, 16);

        ctx.fillStyle = '#c0c0cc';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Running study...', cx, cy + 25);

        // Data points appearing
        if (Math.random() < 0.3) {
            this.particles.push({
                x: cx + (Math.random() - 0.5) * 100,
                y: cy + 35,
                vx: (Math.random() - 0.5) * 20,
                vy: -10 - Math.random() * 20,
                life: 0.8,
                color: '#40a0c0'
            });
        }
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = p.color || '#40a0c0';
            ctx.globalAlpha = alpha * 0.6;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    drawFlashMessages(ctx) {
        for (const fm of this.flashMessages) {
            const alpha = Math.min(1, fm.timer);
            ctx.fillStyle = `rgba(200, 200, 220, ${alpha})`;
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(fm.text, this.canvas.width / 2, fm.y);
        }
    }

    // ===============================
    //  CLEANUP
    // ===============================

    cleanup() {
        document.getElementById('lab-ui').style.display = 'none';
        document.getElementById('study-panel').style.display = 'none';
        document.getElementById('results-panel').style.display = 'none';
        document.getElementById('reform-panel').style.display = 'none';
        document.getElementById('funnel-overlay').style.display = 'none';
        document.getElementById('bem-overlay').style.display = 'none';
    }
}
