/* ======================================
   LEVEL 5: NOBODY IS PERFECT, EVERYTHING
   IS COMMENSURABLE

   Resource Management / Moral Accounting

   You don't have to be a saint to help.
   The "Giving What We Can" pledge of 10%
   is achievable. Perfectionism is the
   enemy of good.
   ====================================== */

class Level05Commensurable {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Life Resources ----
        this.resources = {
            time:      { current: 100, max: 100, regen: 0.8, label: 'Time', color: '#60c0e0' },
            money:     { current: 100, max: 100, regen: 1.2, label: 'Money', color: '#4aaf5a' },
            energy:    { current: 100, max: 100, regen: 0.6, label: 'Energy', color: '#e0a040' },
            willpower: { current: 100, max: 100, regen: 0.3, label: 'Willpower', color: '#c060d0' }
        };

        // ---- Causes ----
        this.causes = [
            { id: 'malaria', name: 'Malaria Nets', qalyPerUnit: 45, costType: 'money', costPer: 8,
              desc: 'Distributing bed nets in Sub-Saharan Africa', active: false, pledged: 0, totalGood: 0 },
            { id: 'education', name: 'Education Access', qalyPerUnit: 20, costType: 'time', costPer: 12,
              desc: 'Tutoring underprivileged students online', active: false, pledged: 0, totalGood: 0 },
            { id: 'animals', name: 'Animal Welfare', qalyPerUnit: 30, costType: 'energy', costPer: 10,
              desc: 'Campaigning against factory farming', active: false, pledged: 0, totalGood: 0 },
            { id: 'climate', name: 'Climate Advocacy', qalyPerUnit: 15, costType: 'willpower', costPer: 15,
              desc: 'Sustained political organizing for policy change', active: false, pledged: 0, totalGood: 0 },
            { id: 'local', name: 'Local Community', qalyPerUnit: 10, costType: 'energy', costPer: 6,
              desc: 'Volunteering at the food bank down the street', active: false, pledged: 0, totalGood: 0 },
            { id: 'existential', name: 'Existential Risk', qalyPerUnit: 100, costType: 'willpower', costPer: 25,
              desc: 'Researching AI safety and bio-risk', active: false, pledged: 0, totalGood: 0 }
        ];

        // ---- Demands (scrolling guilt-trip messages) ----
        this.demands = [];
        this.demandTimer = 0;
        this.demandInterval = 4;
        this.demandMessages = [
            { text: 'If you have time for Netflix, you have time to fight injustice.', drain: { time: 15, willpower: 10 } },
            { text: 'Reblog this or you don\'t care about children in Yemen.', drain: { energy: 12, willpower: 8 } },
            { text: 'Your silence is violence. Speak up or be complicit.', drain: { willpower: 20, energy: 5 } },
            { text: 'How can you eat dinner when people are starving?', drain: { energy: 15, willpower: 10 } },
            { text: 'If you bought coffee today, you could have saved a life.', drain: { money: 10, willpower: 12 } },
            { text: 'Every dollar you spend on yourself is a dollar that could cure blindness.', drain: { money: 20, willpower: 8 } },
            { text: 'You posted about fandom stuff but not about Pakistan. Noted.', drain: { time: 10, willpower: 15 } },
            { text: 'People are dying and you\'re playing a video game.', drain: { time: 20, energy: 10, willpower: 15 } },
            { text: 'Your "self-care" is someone else\'s luxury they\'ll never have.', drain: { energy: 12, willpower: 18 } },
            { text: 'Donating isn\'t enough. You need to dismantle the system.', drain: { willpower: 25, time: 15, energy: 10 } },
            { text: 'If you\'re not burning out, you\'re not trying hard enough.', drain: { energy: 30, willpower: 20 } },
            { text: 'The third servant buried their talent in the ground. Don\'t be them.', drain: { willpower: 10 } }
        ];

        // ---- Pledge System ----
        this.pledgeActive = false;
        this.pledgePercent = 10;
        this.pledgeCause = null;
        this.pledgeRevealedAt = -1;

        // ---- QALY Tracking ----
        this.totalQALYs = 0;
        this.lifetimeWeeks = 0;
        this.weekDuration = 3; // seconds per "week"
        this.weekTimer = 0;
        this.totalWeeks = 80; // ~80 "weeks" = a life
        this.weeksPassed = 0;

        // ---- Paralysis State ----
        this.paralyzed = false;
        this.paralysisTimer = 0;
        this.burnedOut = false;
        this.burnoutCount = 0;

        // ---- The Third Servant ----
        this.thirdServantAppeared = false;
        this.thirdServantTimer = 0;

        // ---- Commensurability Revelation ----
        this.commensurableRevealed = false;
        this.commensurableTimer = 0;

        // ---- Sustainability ----
        this.sustainableWeeks = 0; // weeks where resources stayed above 20%

        // ---- Responses to demands ----
        this.respondedDemands = 0;
        this.ignoredDemands = 0;

        // ---- Visual ----
        this.particles = [];
        this.bgStars = [];
        for (let i = 0; i < 60; i++) {
            this.bgStars.push({
                x: Math.random() * 2000,
                y: Math.random() * 1200,
                r: Math.random() * 1.5 + 0.3,
                a: Math.random() * 0.5 + 0.2,
                speed: Math.random() * 0.3 + 0.1
            });
        }

        // ---- Show UI ----
        document.getElementById('life-ui').style.display = 'block';
        document.getElementById('causes-panel').style.display = 'block';
        document.getElementById('demand-scroll').style.display = 'block';
        document.getElementById('qaly-display').style.display = 'block';
        document.getElementById('pledge-panel').style.display = 'block';

        this.buildCausesUI();
        this.buildPledgeUI();
        this.updateUI();

        this.engine.showMessage(
            '<strong>LEVEL 5: NOBODY IS PERFECT, EVERYTHING IS COMMENSURABLE</strong><br><br>' +
            'You have a life. It has limits: time, money, energy, willpower.<br><br>' +
            'Demands for your attention will scroll across the screen. Each one is technically correct. ' +
            'Each one costs you something if you engage.<br><br>' +
            'You can donate resources to causes — or take a <em>Pledge</em> to give 10% sustainably.<br><br>' +
            '<em>Find a way to do good without destroying yourself.</em>'
        );
    }

    // ---- UI Building ----

    buildCausesUI() {
        const container = document.getElementById('causes-buttons');
        container.innerHTML = '';
        for (const cause of this.causes) {
            const btn = document.createElement('button');
            btn.className = 'cause-btn';
            btn.innerHTML = `<span class="cause-name">${cause.name}</span>` +
                `<span class="cause-cost">${cause.costPer} ${cause.costType}</span>` +
                `<span class="cause-qaly">${cause.qalyPerUnit} QALYs</span>`;
            btn.title = cause.desc;
            btn.addEventListener('click', () => this.donateToCause(cause));
            cause.btnEl = btn;
            container.appendChild(btn);
        }
    }

    buildPledgeUI() {
        const container = document.getElementById('pledge-controls');
        container.innerHTML = '';

        if (this.pledgeActive) {
            const info = document.createElement('div');
            info.className = 'pledge-info-active';
            info.innerHTML = `<span class="pledge-label">PLEDGE ACTIVE</span>` +
                `<span class="pledge-detail">${this.pledgePercent}% of income → ${this.pledgeCause.name}</span>` +
                `<span class="pledge-detail qaly-rate">~${(this.pledgeCause.qalyPerUnit * this.pledgePercent / this.pledgeCause.costPer * 0.1).toFixed(1)} QALYs/week</span>`;
            container.appendChild(info);
        } else {
            const label = document.createElement('div');
            label.className = 'pledge-label';
            label.textContent = 'TAKE THE 10% PLEDGE';
            container.appendChild(label);

            const desc = document.createElement('p');
            desc.className = 'pledge-desc';
            desc.textContent = 'Commit 10% of one resource to a cause. Sustainable. Automatic. Free from guilt.';
            container.appendChild(desc);

            for (const cause of this.causes) {
                const btn = document.createElement('button');
                btn.className = 'pledge-btn';
                btn.textContent = `Pledge to: ${cause.name}`;
                btn.addEventListener('click', () => this.takePledge(cause));
                container.appendChild(btn);
            }
        }
    }

    // ---- Actions ----

    donateToCause(cause) {
        if (this.gameOver || this.paralyzed || this.burnedOut) return;
        const res = this.resources[cause.costType];
        if (res.current < cause.costPer) {
            this.spawnFloatingText('Not enough ' + cause.costType + '!', '#d44040');
            return;
        }
        res.current -= cause.costPer;
        cause.totalGood += cause.qalyPerUnit;
        this.totalQALYs += cause.qalyPerUnit;
        this.spawnFloatingText('+' + cause.qalyPerUnit + ' QALYs', '#4aaf5a');
        this.spawnGoodParticle();
        this.checkResourceCrisis();
        this.updateUI();
    }

    takePledge(cause) {
        if (this.pledgeActive || this.gameOver) return;
        this.pledgeActive = true;
        this.pledgeCause = cause;
        this.pledgeRevealedAt = this.weeksPassed;
        this.buildPledgeUI();
        this.spawnFloatingText('Pledge taken: 10% → ' + cause.name, '#60c0e0');
        this.engine.showMessage(
            '<strong>THE 10% PLEDGE</strong><br><br>' +
            `You've committed 10% of your ${cause.costType} to ${cause.name}.<br><br>` +
            'This runs automatically each week. You don\'t have to think about it. ' +
            'You don\'t have to feel guilty. You\'re doing your part.<br><br>' +
            '<em>"The good is the enemy of the perfect."</em>'
        );
    }

    respondToDemand(demand) {
        if (this.gameOver || this.paralyzed || this.burnedOut) return;
        for (const [res, amount] of Object.entries(demand.drain)) {
            if (this.resources[res]) {
                this.resources[res].current = Math.max(0, this.resources[res].current - amount);
            }
        }
        demand.responded = true;
        this.respondedDemands++;
        this.spawnFloatingText('Engaged...', '#c0a030');
        this.checkResourceCrisis();
        this.updateUI();
    }

    ignoreDemand(demand) {
        demand.ignored = true;
        this.ignoredDemands++;
    }

    // ---- Core Logic ----

    checkResourceCrisis() {
        let allDepleted = true;
        for (const res of Object.values(this.resources)) {
            if (res.current > 5) allDepleted = false;
        }
        if (allDepleted && !this.burnedOut) {
            this.burnedOut = true;
            this.burnoutCount++;
            this.paralyzed = true;
            this.paralysisTimer = 8; // 8 seconds of paralysis
            this.spawnFloatingText('BURNOUT', '#d44040');
            this.engine.showMessage(
                '<strong>BURNOUT</strong><br><br>' +
                'You tried to do everything. You accomplished nothing.<br><br>' +
                'Your resources are depleted. You need time to recover.<br><br>' +
                (this.burnoutCount === 1 ?
                    '<em>Maybe trying to respond to every demand isn\'t sustainable...</em>' :
                    '<em>"Giving 100% once and burning out beats giving 10% forever?" No. No it doesn\'t.</em>')
            );
        }
    }

    processWeek() {
        this.weeksPassed++;

        // Regeneration
        for (const res of Object.values(this.resources)) {
            res.current = Math.min(res.max, res.current + res.regen * 10);
        }

        // Burnout recovery
        if (this.burnedOut) {
            let recovering = true;
            for (const res of Object.values(this.resources)) {
                if (res.current < 30) recovering = false;
            }
            if (recovering) {
                this.burnedOut = false;
                this.spawnFloatingText('Recovered', '#60c0e0');
            }
        }

        // Pledge auto-donation
        if (this.pledgeActive && this.pledgeCause && !this.burnedOut) {
            const cause = this.pledgeCause;
            const res = this.resources[cause.costType];
            const pledgeAmount = res.regen * 10 * (this.pledgePercent / 100);
            if (res.current >= pledgeAmount) {
                res.current -= pledgeAmount;
                const qalyGained = (pledgeAmount / cause.costPer) * cause.qalyPerUnit;
                cause.totalGood += qalyGained;
                this.totalQALYs += qalyGained;
            }
        }

        // Check sustainability
        let allAbove20 = true;
        for (const res of Object.values(this.resources)) {
            if (res.current / res.max < 0.2) allAbove20 = false;
        }
        if (allAbove20 && !this.burnedOut) this.sustainableWeeks++;

        // Third Servant NPC at week 20
        if (this.weeksPassed === 20 && !this.thirdServantAppeared) {
            this.thirdServantAppeared = true;
            this.thirdServantTimer = 6;
            this.engine.showMessage(
                '<strong>THE THIRD SERVANT</strong><br><br>' +
                'A quiet figure sits by the road, hands empty.<br><br>' +
                '"I buried my talent in the ground," they say. "I was told if I couldn\'t do everything ' +
                'perfectly, I shouldn\'t do anything at all. So I didn\'t."<br><br>' +
                'They look at you. "Don\'t make my mistake."<br><br>' +
                '<em>The IQ 70 ditch-digger donating to charity is doing more good than the paralyzed philosopher.</em>'
            );
        }

        // Commensurability revelation at week 40
        if (this.weeksPassed === 40 && !this.commensurableRevealed) {
            this.commensurableRevealed = true;
            this.commensurableTimer = 6;
            this.engine.showMessage(
                '<strong>EVERYTHING IS COMMENSURABLE</strong><br><br>' +
                'A realization crystallizes: every hour has a QALY value. ' +
                'Every dollar. Every ounce of willpower.<br><br>' +
                'Your Netflix time. Your charitable donations. Your emotional labor. ' +
                'All on one scale.<br><br>' +
                'This is both <em>liberating</em> — you can compare, you can choose — ' +
                'and <em>horrifying</em> — nothing is sacred, everything is tradeable.<br><br>' +
                'But maybe that\'s okay. Maybe putting things on a scale is how you avoid paralysis.'
            );
        }

        // Win check
        if (this.weeksPassed >= this.totalWeeks) {
            this.endGame();
        }
    }

    endGame() {
        this.gameOver = true;

        const sustainPct = Math.round((this.sustainableWeeks / this.totalWeeks) * 100);
        const totalQALYs = Math.round(this.totalQALYs);
        const pledgeQALYs = this.pledgeCause ? Math.round(this.pledgeCause.totalGood) : 0;

        let title, text, insight;

        if (totalQALYs < 50) {
            // Paralysis ending
            title = 'THE BURIED TALENT';
            text = `You generated ${totalQALYs} QALYs over your lifetime.<br><br>` +
                `Paralyzed by the demands of perfection, you accomplished little.<br>` +
                `Burnouts: ${this.burnoutCount}. Sustainable weeks: ${sustainPct}%.<br><br>` +
                '<em>The perfect became the enemy of the good.</em>';
            insight = '"Nobody is perfect" — and that\'s not an excuse, it\'s a liberation.';
            this.elua.adjustHumanity(-15);
        } else if (this.pledgeActive && sustainPct >= 60) {
            // Best ending: sustainable giving
            title = 'THE SUSTAINABLE GOOD';
            text = `You generated ${totalQALYs} QALYs over your lifetime.<br><br>` +
                `Your 10% pledge to ${this.pledgeCause.name} generated ${pledgeQALYs} QALYs — ` +
                `steady, automatic, guilt-free.<br>` +
                `Sustainable weeks: ${sustainPct}%. Burnouts: ${this.burnoutCount}.<br><br>` +
                '<em>You weren\'t a saint. You were something better: consistent.</em><br><br>' +
                'The game explicitly tells you: <strong>it\'s okay to not be perfect.</strong>';
            insight = '"The good is not the enemy of the perfect. The good is the only thing that\'s real."';
            this.elua.adjustHumanity(15);
        } else if (totalQALYs >= 200 && this.burnoutCount >= 3) {
            // Hero burnout ending
            title = 'THE MARTYR\'S PATH';
            text = `You generated ${totalQALYs} QALYs — impressive!<br><br>` +
                `But you burned out ${this.burnoutCount} times. ` +
                `Your sustainable weeks: only ${sustainPct}%.<br><br>` +
                'You gave everything. Repeatedly. And each time you crashed, ' +
                'the causes you cared about lost your help entirely.<br><br>' +
                '<em>Giving 10% forever beats giving 100% once and collapsing.</em>';
            insight = '"You don\'t have to be a saint to help. You just have to not stop."';
            this.elua.adjustHumanity(5);
        } else {
            // Moderate ending
            title = 'A LIFE LIVED';
            text = `You generated ${totalQALYs} QALYs over your lifetime.<br><br>` +
                `Sustainable weeks: ${sustainPct}%. Burnouts: ${this.burnoutCount}.<br>` +
                `Demands responded to: ${this.respondedDemands}. Ignored: ${this.ignoredDemands}.<br><br>` +
                'You did some good. You could have done more. ' +
                'You also could have done less.<br><br>' +
                '<em>That\'s what a life looks like.</em>';
            insight = '"Everything is commensurable" — and knowing that means you can choose wisely.';
            this.elua.adjustHumanity(8);
        }

        this.engine.endLevel(title, text, insight, false);
    }

    // ---- Visuals ----

    spawnFloatingText(text, color) {
        this.particles.push({
            type: 'text',
            x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: this.canvas.height / 2,
            text: text,
            color: color,
            life: 2,
            maxLife: 2,
            vy: -40
        });
    }

    spawnGoodParticle() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                type: 'dot',
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60 - 30,
                color: '#4aaf5a',
                life: 1.5,
                maxLife: 1.5,
                r: Math.random() * 3 + 1
            });
        }
    }

    // ---- Update ----

    update(dt) {
        if (this.gameOver) return;
        this.time += dt;

        // Week timer
        this.weekTimer += dt;
        if (this.weekTimer >= this.weekDuration) {
            this.weekTimer -= this.weekDuration;
            this.processWeek();
        }

        // Paralysis recovery
        if (this.paralyzed && !this.burnedOut) {
            this.paralysisTimer -= dt;
            if (this.paralysisTimer <= 0) this.paralyzed = false;
        }

        // Demand spawning
        this.demandTimer += dt;
        if (this.demandTimer >= this.demandInterval && this.demands.length < 5) {
            this.demandTimer = 0;
            this.spawnDemand();
            // Demands come faster over time
            this.demandInterval = Math.max(1.5, 4 - this.weeksPassed * 0.03);
        }

        // Update demands
        for (let i = this.demands.length - 1; i >= 0; i--) {
            const d = this.demands[i];
            d.age += dt;
            d.x -= dt * 40; // scroll left
            // Expire after crossing screen
            if (d.x < -500 || d.age > 15) {
                if (!d.responded && !d.ignored) {
                    this.ignoreDemand(d);
                }
                this.demands.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            if (p.type === 'text') {
                p.y += p.vy * dt;
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }
        }

        // Stars drift
        for (const s of this.bgStars) {
            s.a = 0.2 + 0.3 * Math.sin(this.time * s.speed + s.x);
        }

        // Click handling for demands
        if (this.engine.mouse.clicked) {
            this.handleClick(this.engine.mouse.x, this.engine.mouse.y);
        }

        this.updateUI();
    }

    handleClick(mx, my) {
        // Check if clicking on a demand to respond/dismiss
        for (const d of this.demands) {
            if (!d.responded && !d.ignored) {
                const dWidth = 400;
                const dHeight = 50;
                if (mx >= d.x && mx <= d.x + dWidth && my >= d.y && my <= d.y + dHeight) {
                    this.respondToDemand(d);
                    return;
                }
            }
        }
    }

    spawnDemand() {
        const msg = this.demandMessages[Math.floor(Math.random() * this.demandMessages.length)];
        const yZone = 100 + Math.random() * (this.canvas.height - 300);
        this.demands.push({
            text: msg.text,
            drain: msg.drain,
            x: this.canvas.width + 20,
            y: yZone,
            age: 0,
            responded: false,
            ignored: false,
            flashTimer: 0
        });
    }

    // ---- Draw ----

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0818');
        grad.addColorStop(0.5, '#12102a');
        grad.addColorStop(1, '#0a0818');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (const s of this.bgStars) {
            ctx.globalAlpha = s.a;
            ctx.fillStyle = '#c0c0e0';
            ctx.beginPath();
            ctx.arc(s.x % w, s.y % h, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw resource meters as central visualization
        this.drawResourceCircle(ctx, w, h);

        // Draw demands scrolling across
        this.drawDemands(ctx);

        // Draw cause contributions as rising bars
        this.drawCauseBars(ctx, w, h);

        // Draw floating particles/text
        this.drawParticles(ctx);

        // Draw week counter
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#8a8a9a';
        ctx.textAlign = 'center';
        ctx.fillText(`Week ${this.weeksPassed} / ${this.totalWeeks}`, w / 2, h - 20);

        // Burnout/paralysis overlay
        if (this.paralyzed || this.burnedOut) {
            ctx.fillStyle = 'rgba(30, 10, 10, 0.4)';
            ctx.fillRect(0, 0, w, h);
            ctx.font = 'bold 28px Cinzel, serif';
            ctx.fillStyle = '#d44040';
            ctx.textAlign = 'center';
            ctx.fillText(this.burnedOut ? 'BURNED OUT' : 'RECOVERING...', w / 2, h / 2 - 60);
            if (this.burnedOut) {
                ctx.font = '14px Inter, sans-serif';
                ctx.fillStyle = '#8a8a9a';
                ctx.fillText('Wait for resources to regenerate...', w / 2, h / 2 - 30);
            }
        }

        // Draw Elua
        this.elua.setPosition(w / 2, h / 2 + 50);
        this.elua.draw(ctx);

        // Pledge glow
        if (this.pledgeActive) {
            ctx.save();
            ctx.globalAlpha = 0.15 + 0.05 * Math.sin(this.time * 2);
            ctx.strokeStyle = '#60c0e0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2 + 50, 80, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Third Servant visual
        if (this.thirdServantTimer > 0) {
            this.thirdServantTimer -= 0.016;
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.thirdServantTimer / 2);
            ctx.fillStyle = '#8a8a9a';
            ctx.font = '16px Caveat, cursive';
            ctx.textAlign = 'left';
            ctx.fillText('"Don\'t bury your talent."', 40, h - 80);
            ctx.restore();
        }

        // Commensurability visual
        if (this.commensurableTimer > 0) {
            this.commensurableTimer -= 0.016;
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.commensurableTimer / 2) * 0.6;
            ctx.fillStyle = '#60c0e0';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('Everything converts to QALYs.', w - 40, h - 80);
            ctx.fillText('That\'s horrifying. And liberating.', w - 40, h - 60);
            ctx.restore();
        }
    }

    drawResourceCircle(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2 + 50;
        const radius = 120;
        const resKeys = Object.keys(this.resources);

        for (let i = 0; i < resKeys.length; i++) {
            const res = this.resources[resKeys[i]];
            const angle = (i / resKeys.length) * Math.PI * 2 - Math.PI / 2;
            const pct = res.current / res.max;
            const barLen = radius * pct;

            const x1 = cx + Math.cos(angle) * 40;
            const y1 = cy + Math.sin(angle) * 40;
            const x2 = cx + Math.cos(angle) * (40 + barLen);
            const y2 = cy + Math.sin(angle) * (40 + barLen);

            // Track
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(cx + Math.cos(angle) * (40 + radius), cy + Math.sin(angle) * (40 + radius));
            ctx.stroke();

            // Fill
            ctx.strokeStyle = res.color;
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.6 + 0.4 * pct;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Label
            const lx = cx + Math.cos(angle) * (40 + radius + 20);
            const ly = cy + Math.sin(angle) * (40 + radius + 20);
            ctx.font = '11px Inter, sans-serif';
            ctx.fillStyle = res.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(res.label + ': ' + Math.round(res.current), lx, ly);
        }
    }

    drawDemands(ctx) {
        for (const d of this.demands) {
            if (d.responded || d.ignored) continue;
            const alpha = Math.min(1, d.age / 0.5);
            ctx.save();
            ctx.globalAlpha = alpha * 0.85;

            // Demand background
            ctx.fillStyle = 'rgba(60, 20, 30, 0.7)';
            const textWidth = Math.min(400, ctx.measureText(d.text).width + 40);
            const boxW = Math.max(textWidth, 350);
            ctx.fillRect(d.x, d.y, boxW, 45);
            ctx.strokeStyle = 'rgba(200, 60, 80, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(d.x, d.y, boxW, 45);

            // Text
            ctx.fillStyle = '#e0a0a0';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            // Word wrap
            const maxW = boxW - 20;
            const words = d.text.split(' ');
            let line = '';
            let lineY = d.y + 15;
            for (const word of words) {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > maxW && line) {
                    ctx.fillText(line.trim(), d.x + 10, lineY);
                    line = word + ' ';
                    lineY += 14;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line.trim(), d.x + 10, lineY);

            // Click hint
            ctx.font = '9px Inter, sans-serif';
            ctx.fillStyle = 'rgba(200, 100, 100, 0.5)';
            ctx.fillText('click to engage', d.x + boxW - 80, d.y + 38);

            ctx.restore();
        }
    }

    drawCauseBars(ctx, w, h) {
        const barWidth = 30;
        const maxBarHeight = 100;
        const startX = w - 220;
        const baseY = h / 2 + 140;

        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';

        const activeCauses = this.causes.filter(c => c.totalGood > 0);
        const maxGood = Math.max(1, ...activeCauses.map(c => c.totalGood));

        for (let i = 0; i < activeCauses.length; i++) {
            const c = activeCauses[i];
            const x = startX + i * (barWidth + 10);
            const barH = (c.totalGood / maxGood) * maxBarHeight;

            ctx.fillStyle = 'rgba(74, 175, 90, 0.3)';
            ctx.fillRect(x, baseY - barH, barWidth, barH);
            ctx.strokeStyle = 'rgba(74, 175, 90, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, baseY - barH, barWidth, barH);

            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(c.name.split(' ')[0], x + barWidth / 2, baseY + 12);
            ctx.fillStyle = '#4aaf5a';
            ctx.fillText(Math.round(c.totalGood), x + barWidth / 2, baseY - barH - 6);
        }
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            if (p.type === 'text') {
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.fillStyle = p.color;
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // ---- UI Updates ----

    updateUI() {
        // Resource bars
        for (const [key, res] of Object.entries(this.resources)) {
            const fillEl = document.getElementById(`res-fill-${key}`);
            const valEl = document.getElementById(`res-val-${key}`);
            if (fillEl) fillEl.style.width = (res.current / res.max * 100) + '%';
            if (valEl) valEl.textContent = Math.round(res.current);
        }

        // QALY display
        const qalyEl = document.getElementById('total-qalys');
        if (qalyEl) qalyEl.textContent = Math.round(this.totalQALYs);

        const weekEl = document.getElementById('week-counter');
        if (weekEl) weekEl.textContent = `Week ${this.weeksPassed} / ${this.totalWeeks}`;

        const sustainEl = document.getElementById('sustain-pct');
        if (sustainEl) {
            const pct = this.weeksPassed > 0 ? Math.round((this.sustainableWeeks / this.weeksPassed) * 100) : 100;
            sustainEl.textContent = pct + '%';
        }

        // Humanity
        const humFill = document.getElementById('humanity-fill-l5');
        if (humFill) humFill.style.width = this.elua.humanity + '%';
    }

    cleanup() {
        document.getElementById('life-ui').style.display = 'none';
        document.getElementById('causes-panel').style.display = 'none';
        document.getElementById('demand-scroll').style.display = 'none';
        document.getElementById('qaly-display').style.display = 'none';
        document.getElementById('pledge-panel').style.display = 'none';
    }
}
