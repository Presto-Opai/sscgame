/* ======================================
   LEVEL 6: THE PARABLE OF THE TALENTS

   RPG with Hidden Stats

   Ability is largely innate. You shouldn't
   beat yourself up for lacking talent,
   but you also shouldn't take credit for
   having it. It's genetic luck.
   ====================================== */

class Level06Talents {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Hidden Stats (player never sees exact numbers) ----
        // Two skill domains — one strong, one weak
        this.strongDomain = Math.random() < 0.5 ? 'verbal' : 'quantitative';
        this.weakDomain = this.strongDomain === 'verbal' ? 'quantitative' : 'verbal';

        this.stats = {
            verbal: {
                talent: this.strongDomain === 'verbal' ? 75 + Math.random() * 20 : 20 + Math.random() * 25,
                effort: 0,
                label: 'Verbal / Creative',
                color: '#7aafff',
                icon: '\u270E', // pencil
                tasks: []
            },
            quantitative: {
                talent: this.strongDomain === 'quantitative' ? 75 + Math.random() * 20 : 20 + Math.random() * 25,
                effort: 0,
                label: 'Quantitative / Analytical',
                color: '#60c0a0',
                icon: '\u2211', // sigma
                tasks: []
            }
        };

        // ---- Current Phase ----
        this.phase = 'school'; // school -> career -> reflection
        this.phaseIndex = 0;
        this.phaseTimer = 0;

        // ---- School Phases ----
        this.schoolYears = [
            { name: 'English Class', domain: 'verbal', desc: 'Write an essay about your summer.' },
            { name: 'Math Class', domain: 'quantitative', desc: 'Solve these calculus problems.' },
            { name: 'Creative Writing', domain: 'verbal', desc: 'Compose a short story for the contest.' },
            { name: 'Physics Exam', domain: 'quantitative', desc: 'Derive the equations of motion.' },
            { name: 'Literature Analysis', domain: 'verbal', desc: 'Analyze the themes in Hamlet.' },
            { name: 'Statistics Course', domain: 'quantitative', desc: 'Calculate confidence intervals.' },
        ];

        // ---- Task Results ----
        this.taskResults = [];
        this.currentTask = null;
        this.taskInProgress = false;
        this.taskProgress = 0;
        this.grindTime = 0;

        // ---- NPCs (The Ramanujan Problem) ----
        this.npcs = [
            { name: 'Maya', talent: 'extraordinary math', background: 'single parent, underfunded school',
              line: '"Numbers just... make sense to me. I don\'t know why."', appeared: false },
            { name: 'The Brother', talent: 'musical genius', background: 'same parents, same house',
              line: '"We grew up in the same family. Same genes, mostly. Different outcomes."', appeared: false },
            { name: 'James', talent: 'IQ 70, works construction', background: 'donates 5% to charity',
              line: '"I can\'t do what you do. But I can do what I can do."', appeared: false },
            { name: 'Professor Chen', talent: 'brilliant researcher', background: 'every advantage, wealthy family',
              line: '"People praise my work ethic. But honestly? This is easy for me."', appeared: false },
            { name: 'Srinivasa', talent: 'mathematical intuition', background: 'self-taught, impoverished',
              line: '"The theorems come to me in dreams. I didn\'t earn this."', appeared: false }
        ];
        this.npcTimer = 0;
        this.npcInterval = 25;
        this.npcIndex = 0;
        this.activeNPC = null;
        this.npcDisplayTimer = 0;

        // ---- The Bargain ----
        this.bargainOffered = false;
        this.bargainAccepted = false;
        this.bargainDeclined = false;

        // ---- Comparison Trap ----
        this.comparisons = 0;
        this.comparisonTrapActive = false;
        this.comparisonNPCIndex = 0;

        // ---- Career Phase ----
        this.careerChoices = [];
        this.careerChosen = null;
        this.careerProgress = 0;

        // ---- Praise/Criticism Tracking ----
        this.praisedForStrong = 0;
        this.criticizedForWeak = 0;

        // ---- Visual ----
        this.particles = [];
        this.bgGradientOffset = 0;

        // ---- Score ----
        this.strongResults = [];
        this.weakResults = [];
        this.totalEffortStrong = 0;
        this.totalEffortWeak = 0;

        // ---- SAT Opening ----
        this.satRevealed = false;

        // ---- Show UI ----
        document.getElementById('talent-ui').style.display = 'block';
        document.getElementById('task-panel').style.display = 'block';
        document.getElementById('npc-panel').style.display = 'none';
        document.getElementById('comparison-overlay').style.display = 'none';
        document.getElementById('bargain-overlay').style.display = 'none';

        this.updateUI();
        this.startSchool();

        this.engine.showMessage(
            '<strong>LEVEL 6: THE PARABLE OF THE TALENTS</strong><br><br>' +
            'You are a student. You have hidden abilities you can\'t directly see — ' +
            'you only know how things <em>feel</em>.<br><br>' +
            'Some tasks will feel effortless. Others will feel like agony. ' +
            'That difference is mostly innate.<br><br>' +
            'You can grind, study, push through. But natural talent sets the ceiling.<br><br>' +
            '<em>"Perfect SAT Verbal. C- in Calculus."</em>'
        );
    }

    // ---- School ----

    startSchool() {
        this.phase = 'school';
        this.phaseIndex = 0;
        this.presentTask(this.schoolYears[0]);
    }

    presentTask(taskDef) {
        this.currentTask = {
            name: taskDef.name,
            domain: taskDef.domain,
            desc: taskDef.desc,
            progress: 0,
            grindApplied: 0,
            maxGrind: 100,
            completed: false,
            score: null
        };
        this.taskInProgress = false;
        this.taskProgress = 0;
        this.grindTime = 0;
        this.updateTaskPanel();
    }

    attemptTask() {
        if (!this.currentTask || this.currentTask.completed || this.gameOver) return;
        this.taskInProgress = true;
        this.taskProgress = 0;
    }

    grindTask() {
        if (!this.currentTask || this.currentTask.completed || this.gameOver) return;
        if (this.currentTask.grindApplied >= this.currentTask.maxGrind) {
            this.spawnFloatingText('Already studied max!', '#c0a030');
            return;
        }
        this.currentTask.grindApplied += 20;
        this.stats[this.currentTask.domain].effort += 20;
        if (this.currentTask.domain === this.strongDomain) {
            this.totalEffortStrong += 20;
        } else {
            this.totalEffortWeak += 20;
        }
        this.spawnFloatingText('+Study', '#60c0e0');
        this.updateTaskPanel();
    }

    completeTask() {
        const task = this.currentTask;
        const stat = this.stats[task.domain];

        // Score = talent * (0.7 to 1.0 random) + grind * 0.15
        const talentContribution = stat.talent * (0.7 + Math.random() * 0.3);
        const grindContribution = task.grindApplied * 0.15;
        const rawScore = talentContribution + grindContribution;

        // Normalize to letter grade
        let grade, feel;
        if (rawScore >= 85) { grade = 'A'; feel = 'Effortless. Almost boring.'; }
        else if (rawScore >= 75) { grade = 'B+'; feel = 'Came naturally. Minimal effort needed.'; }
        else if (rawScore >= 65) { grade = 'B'; feel = 'Decent. Required some focus.'; }
        else if (rawScore >= 55) { grade = 'C+'; feel = 'Hard. Every step was a struggle.'; }
        else if (rawScore >= 40) { grade = 'C'; feel = 'Agonizing. Hours of work for mediocre results.'; }
        else if (rawScore >= 25) { grade = 'C-'; feel = 'Barely passed. The material just doesn\'t click.'; }
        else { grade = 'D'; feel = 'Failed. You stared at the page for hours and nothing happened.'; }

        task.score = grade;
        task.feel = feel;
        task.completed = true;

        const isStrong = task.domain === this.strongDomain;
        const result = { name: task.name, domain: task.domain, grade, feel, grind: task.grindApplied };
        this.taskResults.push(result);
        if (isStrong) this.strongResults.push(result);
        else this.weakResults.push(result);

        // Praise/criticism
        if (isStrong && (grade === 'A' || grade === 'B+')) {
            this.praisedForStrong++;
            this.spawnFloatingText('"You\'re so talented!"', '#7aafff');
            setTimeout(() => this.spawnFloatingText('(feels unearned)', '#8a8a9a'), 800);
        } else if (!isStrong && (grade === 'C' || grade === 'C-' || grade === 'D')) {
            this.criticizedForWeak++;
            this.spawnFloatingText('"You need to try harder."', '#d44040');
            setTimeout(() => this.spawnFloatingText('(feels unfair)', '#8a8a9a'), 800);
        }

        // SAT reveal after 2 tasks
        if (this.taskResults.length === 2 && !this.satRevealed) {
            this.satRevealed = true;
            const strongName = this.strongDomain === 'verbal' ? 'Verbal' : 'Quantitative';
            const weakName = this.weakDomain === 'verbal' ? 'Verbal' : 'Quantitative';
            this.engine.showMessage(
                `<strong>SAT RESULTS</strong><br><br>` +
                `${strongName}: Perfect score. Top 0.1%.<br>` +
                `${weakName}: Bottom quartile.<br><br>` +
                `<em>"How can the same person be so brilliant at one thing and so mediocre at another?"</em><br><br>` +
                `The answer: talent isn't general. It's specific, and it's largely innate.`
            );
        }

        this.updateTaskPanel();
        this.advancePhase();
    }

    advancePhase() {
        this.phaseIndex++;

        if (this.phase === 'school') {
            if (this.phaseIndex < this.schoolYears.length) {
                setTimeout(() => this.presentTask(this.schoolYears[this.phaseIndex]), 1500);
            } else {
                // Offer the Bargain
                setTimeout(() => this.offerBargain(), 2000);
            }
        } else if (this.phase === 'career') {
            if (this.careerProgress < 3) {
                setTimeout(() => this.presentCareerTask(), 1500);
            } else {
                setTimeout(() => this.enterReflection(), 2000);
            }
        }
    }

    // ---- The Bargain ----

    offerBargain() {
        this.bargainOffered = true;
        document.getElementById('bargain-overlay').style.display = 'flex';

        const weakLabel = this.stats[this.weakDomain].label;
        const strongLabel = this.stats[this.strongDomain].label;

        document.getElementById('bargain-text').innerHTML =
            `<strong>THE BARGAIN</strong><br><br>` +
            `You can spend the next phase grinding ${weakLabel}.<br>` +
            `Hours of painful work might equal minutes of natural improvement in ${strongLabel}.<br><br>` +
            `Or you can lean into your strength and build a career around what comes naturally.<br><br>` +
            `<em>Is it worth grinding in your weak area?</em>`;

        document.getElementById('btn-bargain-grind').onclick = () => {
            this.bargainAccepted = true;
            document.getElementById('bargain-overlay').style.display = 'none';
            this.startCareer('weak');
        };
        document.getElementById('btn-bargain-strength').onclick = () => {
            this.bargainDeclined = true;
            document.getElementById('bargain-overlay').style.display = 'none';
            this.startCareer('strong');
        };
    }

    // ---- Career ----

    startCareer(path) {
        this.phase = 'career';
        this.phaseIndex = 0;
        this.careerProgress = 0;
        this.careerChosen = path;

        const domain = path === 'strong' ? this.strongDomain : this.weakDomain;
        const careers = {
            verbal: [
                { name: 'Write a Novel', domain: 'verbal', desc: 'Pour your ideas onto the page.' },
                { name: 'Edit a Magazine', domain: 'verbal', desc: 'Shape others\' words into clarity.' },
                { name: 'Give a TED Talk', domain: 'verbal', desc: 'Communicate a complex idea simply.' }
            ],
            quantitative: [
                { name: 'Build a Model', domain: 'quantitative', desc: 'Predict market behavior with equations.' },
                { name: 'Analyze Data', domain: 'quantitative', desc: 'Find the signal in terabytes of noise.' },
                { name: 'Design an Algorithm', domain: 'quantitative', desc: 'Solve an NP-hard problem approximately.' }
            ]
        };

        this.careerChoices = careers[domain];
        this.presentCareerTask();
    }

    presentCareerTask() {
        if (this.careerProgress >= this.careerChoices.length) {
            this.enterReflection();
            return;
        }
        this.presentTask(this.careerChoices[this.careerProgress]);
        this.careerProgress++;
    }

    // ---- Reflection / End ----

    enterReflection() {
        this.phase = 'reflection';

        // Show comparison trap
        this.comparisonTrapActive = true;
        document.getElementById('comparison-overlay').style.display = 'flex';

        const betterNPC = this.npcs[Math.floor(Math.random() * this.npcs.length)];
        document.getElementById('comparison-text').innerHTML =
            `<strong>THE COMPARISON TRAP</strong><br><br>` +
            `You meet ${betterNPC.name}. ${betterNPC.talent}. ${betterNPC.background}.<br><br>` +
            `${betterNPC.line}<br><br>` +
            `No matter how good you are, someone is better. ` +
            `No matter how hard you work, someone does it effortlessly.<br><br>` +
            `<em>"Any system where only one person can feel good about themselves is a bad system."</em>`;

        document.getElementById('btn-comparison-accept').onclick = () => {
            document.getElementById('comparison-overlay').style.display = 'none';
            this.comparisonTrapActive = false;
            this.endGame();
        };
    }

    endGame() {
        this.gameOver = true;

        const strongGrades = this.strongResults.map(r => r.grade);
        const weakGrades = this.weakResults.map(r => r.grade);
        const strongLabel = this.stats[this.strongDomain].label;
        const weakLabel = this.stats[this.weakDomain].label;

        let title, text, insight;

        if (this.bargainAccepted) {
            // Chose to grind weak area
            const weakImproved = weakGrades.some(g => g === 'B' || g === 'B+' || g === 'A');
            if (weakImproved) {
                title = 'THE GRINDER\'S REWARD';
                text = `You ground through ${weakLabel} and saw some improvement.<br><br>` +
                    `Strong domain (${strongLabel}): ${strongGrades.join(', ')}<br>` +
                    `Weak domain (${weakLabel}): ${weakGrades.join(', ')}<br><br>` +
                    `Hours of work produced what natural talent gives others in minutes. ` +
                    `But you proved something to yourself.<br><br>` +
                    `<em>Was it worth it? That depends on what you value.</em>`;
                insight = '"You can\'t choose your talents, but you can choose your effort. Both matter, and neither is the whole story."';
                this.elua.adjustHumanity(8);
            } else {
                title = 'THE HARD TRUTH';
                text = `You spent your career grinding ${weakLabel}.<br><br>` +
                    `Strong domain (${strongLabel}): ${strongGrades.join(', ')}<br>` +
                    `Weak domain (${weakLabel}): ${weakGrades.join(', ')}<br><br>` +
                    `The improvement was marginal. The effort was enormous. ` +
                    `Meanwhile, your natural strength went underutilized.<br><br>` +
                    `This isn't a moral failing. It's just how brains work.<br><br>` +
                    `<em>"Talent is real. It's unfair. And it's not your fault."</em>`;
                insight = '"Don\'t beat yourself up for lacking talent. Don\'t take credit for having it."';
                this.elua.adjustHumanity(5);
            }
        } else {
            // Chose to lean into strength
            const strongExcelled = strongGrades.filter(g => g === 'A' || g === 'B+').length >= 2;
            if (strongExcelled) {
                title = 'COMPARATIVE ADVANTAGE';
                text = `You leaned into ${strongLabel} and excelled.<br><br>` +
                    `Strong domain: ${strongGrades.join(', ')}<br>` +
                    `School weak domain: ${weakGrades.join(', ')}<br><br>` +
                    `The world praised you for what came easy. ` +
                    `You know you don't deserve the praise — it's just how your brain is wired.<br><br>` +
                    `But you used what you had. That's not nothing.<br><br>` +
                    `<em>"Find your comparative advantage and use it."</em>`;
                insight = '"The parable of the talents isn\'t about ability. It\'s about what you do with what you\'re given."';
                this.elua.adjustHumanity(12);
            } else {
                title = 'THE HONEST PATH';
                text = `You followed your strength in ${strongLabel}, with mixed results.<br><br>` +
                    `Strong domain: ${strongGrades.join(', ')}<br>` +
                    `School weak domain: ${weakGrades.join(', ')}<br><br>` +
                    `Even natural talent doesn't guarantee success. ` +
                    `But you didn't waste your life fighting your own brain.<br><br>` +
                    `<em>Sometimes the wisest thing is accepting who you are.</em>`;
                insight = '"Ability is largely innate — and that\'s terrifying and liberating in equal measure."';
                this.elua.adjustHumanity(8);
            }
        }

        // Add praise/criticism summary
        text += `<br><br><small>Praised for talent: ${this.praisedForStrong}x | Criticized for weakness: ${this.criticizedForWeak}x</small>`;

        this.engine.endLevel(title, text, insight, false);
    }

    // ---- Visuals ----

    spawnFloatingText(text, color) {
        this.particles.push({
            type: 'text',
            x: this.canvas.width / 2 + (Math.random() - 0.5) * 300,
            y: this.canvas.height / 2 - 50 + (Math.random() - 0.5) * 50,
            text: text,
            color: color,
            life: 2.5,
            maxLife: 2.5,
            vy: -35
        });
    }

    // ---- Update ----

    update(dt) {
        if (this.gameOver) return;
        this.time += dt;

        // Task progress (simulates "doing" the task)
        if (this.taskInProgress && this.currentTask && !this.currentTask.completed) {
            const stat = this.stats[this.currentTask.domain];
            // Speed based on talent — strong domain tasks fill fast, weak ones crawl
            const speed = (stat.talent / 100) * 40 + 10 + (this.currentTask.grindApplied * 0.08);
            this.taskProgress += speed * dt;
            if (this.taskProgress >= 100) {
                this.taskProgress = 100;
                this.taskInProgress = false;
                this.completeTask();
            }
        }

        // NPC appearances
        this.npcTimer += dt;
        if (this.npcTimer >= this.npcInterval && this.npcIndex < this.npcs.length) {
            this.npcTimer = 0;
            this.showNPC(this.npcs[this.npcIndex]);
            this.npcIndex++;
        }

        // NPC display timer
        if (this.activeNPC) {
            this.npcDisplayTimer -= dt;
            if (this.npcDisplayTimer <= 0) {
                this.activeNPC = null;
                document.getElementById('npc-panel').style.display = 'none';
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            p.y += p.vy * dt;
        }

        // BG gradient drift
        this.bgGradientOffset += dt * 5;

        this.updateUI();
    }

    showNPC(npc) {
        npc.appeared = true;
        this.activeNPC = npc;
        this.npcDisplayTimer = 8;
        document.getElementById('npc-panel').style.display = 'block';
        document.getElementById('npc-content').innerHTML =
            `<div class="npc-name">${npc.name}</div>` +
            `<div class="npc-talent">${npc.talent}</div>` +
            `<div class="npc-bg">${npc.background}</div>` +
            `<div class="npc-line">${npc.line}</div>`;
    }

    updateTaskPanel() {
        const panel = document.getElementById('task-content');
        if (!this.currentTask) {
            panel.innerHTML = '<p class="task-waiting">Preparing next task...</p>';
            return;
        }

        const task = this.currentTask;
        const domainStat = this.stats[task.domain];
        const isStrong = task.domain === this.strongDomain;

        let html = `<div class="task-header">` +
            `<span class="task-name">${task.name}</span>` +
            `<span class="task-domain" style="color: ${domainStat.color}">${domainStat.icon} ${domainStat.label}</span>` +
            `</div>` +
            `<p class="task-desc">${task.desc}</p>`;

        if (task.completed) {
            html += `<div class="task-result">` +
                `<span class="task-grade grade-${task.score.replace('+', 'p').replace('-', 'm')}">${task.score}</span>` +
                `<span class="task-feel">${task.feel}</span>` +
                `</div>`;
        } else {
            // Progress bar
            html += `<div class="task-progress-bar">` +
                `<div class="task-progress-fill" style="width: ${this.taskProgress}%; background: ${domainStat.color}"></div>` +
                `</div>`;

            // Feeling indicator (before completion)
            if (this.taskInProgress) {
                const feeling = isStrong ? 'Flowing naturally...' : 'Every step is a struggle...';
                html += `<p class="task-feeling" style="color: ${isStrong ? '#7aafff' : '#d4a040'}">${feeling}</p>`;
            }

            // Grind meter
            html += `<div class="task-grind">Study time: ${task.grindApplied} / ${task.maxGrind}</div>`;

            // Buttons
            html += `<div class="task-buttons">`;
            if (!this.taskInProgress) {
                html += `<button class="task-btn" id="btn-attempt">Attempt Task</button>`;
                html += `<button class="task-btn task-btn-grind" id="btn-grind">Study More (+20)</button>`;
            }
            html += `</div>`;
        }

        panel.innerHTML = html;

        // Rebind buttons
        const attemptBtn = document.getElementById('btn-attempt');
        if (attemptBtn) attemptBtn.addEventListener('click', () => this.attemptTask());
        const grindBtn = document.getElementById('btn-grind');
        if (grindBtn) grindBtn.addEventListener('click', () => this.grindTask());
    }

    updateUI() {
        // Phase display
        const phaseEl = document.getElementById('talent-phase');
        if (phaseEl) {
            const labels = { school: 'SCHOOL', career: 'CAREER', reflection: 'REFLECTION' };
            phaseEl.textContent = labels[this.phase] || '';
        }

        // Feeling meters (not exact stats — just vibes)
        for (const [key, stat] of Object.entries(this.stats)) {
            const feelEl = document.getElementById(`feel-${key}`);
            if (feelEl) {
                // Show feeling, not numbers
                const isStrong = key === this.strongDomain;
                feelEl.textContent = isStrong ? 'Flows naturally' : 'Requires effort';
                feelEl.style.color = isStrong ? stat.color : '#c0a030';
            }
        }

        // Task count
        const taskCountEl = document.getElementById('tasks-completed');
        if (taskCountEl) taskCountEl.textContent = this.taskResults.length;

        // Humanity
        const humFill = document.getElementById('humanity-fill-l6');
        if (humFill) humFill.style.width = this.elua.humanity + '%';
    }

    // ---- Draw ----

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background — warm academic tones
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0e0a1e');
        grad.addColorStop(0.3, '#14102a');
        grad.addColorStop(0.7, '#1a1430');
        grad.addColorStop(1, '#0e0a1e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Subtle domain split — left side vs right side colored
        const strongColor = this.stats[this.strongDomain].color;
        const weakColor = this.stats[this.weakDomain].color;

        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = strongColor;
        ctx.fillRect(0, 0, w / 2, h);
        ctx.fillStyle = weakColor;
        ctx.fillRect(w / 2, 0, w / 2, h);
        ctx.restore();

        // Draw skill tree visualization
        this.drawSkillTrees(ctx, w, h);

        // Draw task results history
        this.drawResultsHistory(ctx, w, h);

        // Draw active NPC on canvas
        if (this.activeNPC) {
            this.drawNPC(ctx, w, h);
        }

        // Draw Elua
        this.elua.setPosition(w / 2, h / 2);
        this.elua.draw(ctx);

        // Task progress arc around Elua
        if (this.taskInProgress && this.currentTask) {
            const progress = this.taskProgress / 100;
            const isStrong = this.currentTask.domain === this.strongDomain;
            ctx.save();
            ctx.strokeStyle = isStrong ? strongColor : weakColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 50, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Particles
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = '15px Inter, sans-serif';
            ctx.fillStyle = p.color;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        }

        // Phase label
        ctx.font = '11px Cinzel, serif';
        ctx.fillStyle = '#8a8a9a';
        ctx.textAlign = 'center';
        ctx.fillText(this.phase.toUpperCase() + ' PHASE', w / 2, h - 15);
    }

    drawSkillTrees(ctx, w, h) {
        // Two branching trees, one on each side
        const domains = ['verbal', 'quantitative'];
        const sides = [w * 0.2, w * 0.8];

        for (let d = 0; d < 2; d++) {
            const stat = this.stats[domains[d]];
            const isStrong = domains[d] === this.strongDomain;
            const cx = sides[d];
            const baseY = h * 0.7;

            // Tree trunk
            ctx.strokeStyle = stat.color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = isStrong ? 4 : 2;
            ctx.beginPath();
            ctx.moveTo(cx, baseY);
            ctx.lineTo(cx, baseY - (isStrong ? 200 : 100));
            ctx.stroke();

            // Branches (proportional to talent)
            const branches = isStrong ? 5 : 2;
            for (let b = 0; b < branches; b++) {
                const y = baseY - 40 - b * (isStrong ? 35 : 40);
                const spread = (isStrong ? 50 : 25) * (1 - b / branches);
                const dir = b % 2 === 0 ? 1 : -1;

                ctx.globalAlpha = 0.2;
                ctx.lineWidth = isStrong ? 2 : 1;
                ctx.beginPath();
                ctx.moveTo(cx, y);
                ctx.lineTo(cx + dir * spread, y - 20);
                ctx.stroke();

                // Leaves/nodes
                if (isStrong) {
                    ctx.globalAlpha = 0.4;
                    ctx.fillStyle = stat.color;
                    ctx.beginPath();
                    ctx.arc(cx + dir * spread, y - 20, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Label
            ctx.globalAlpha = 0.6;
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'center';
            ctx.fillText(stat.label, cx, baseY + 20);
            ctx.fillText(isStrong ? '(Natural)' : '(Struggle)', cx, baseY + 35);
            ctx.globalAlpha = 1;
        }
    }

    drawResultsHistory(ctx, w, h) {
        if (this.taskResults.length === 0) return;

        const startX = w / 2 - (this.taskResults.length * 35) / 2;
        const baseY = h * 0.15;

        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';

        for (let i = 0; i < this.taskResults.length; i++) {
            const r = this.taskResults[i];
            const x = startX + i * 35;
            const isStrong = r.domain === this.strongDomain;
            const color = this.stats[r.domain].color;

            // Grade circle
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, baseY, 12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = 0.9;
            ctx.fillStyle = color;
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText(r.grade, x, baseY + 4);

            // Domain indicator dot
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = isStrong ? '#4aaf5a' : '#d4a040';
            ctx.beginPath();
            ctx.arc(x, baseY + 18, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawNPC(ctx, w, h) {
        const npc = this.activeNPC;
        if (!npc) return;

        const alpha = Math.min(1, this.npcDisplayTimer / 2);
        ctx.save();
        ctx.globalAlpha = alpha * 0.8;

        // NPC silhouette
        const nx = w * 0.15;
        const ny = h * 0.45;

        ctx.fillStyle = '#4a3d6e';
        ctx.beginPath();
        ctx.arc(nx, ny - 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(nx - 8, ny - 5, 16, 30);

        // Speech bubble
        ctx.fillStyle = 'rgba(26, 20, 48, 0.9)';
        ctx.strokeStyle = '#7b6ba8';
        ctx.lineWidth = 1;
        const bubbleX = nx + 25;
        const bubbleY = ny - 40;
        ctx.fillRect(bubbleX, bubbleY, 200, 40);
        ctx.strokeRect(bubbleX, bubbleY, 200, 40);

        ctx.font = '11px Caveat, cursive';
        ctx.fillStyle = '#c0c0cc';
        ctx.textAlign = 'left';
        // Truncate long lines
        const line = npc.line.length > 45 ? npc.line.substring(0, 45) + '...' : npc.line;
        ctx.fillText(line, bubbleX + 8, bubbleY + 15);
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText(`— ${npc.name}`, bubbleX + 8, bubbleY + 30);

        ctx.restore();
    }

    cleanup() {
        document.getElementById('talent-ui').style.display = 'none';
        document.getElementById('task-panel').style.display = 'none';
        document.getElementById('npc-panel').style.display = 'none';
        document.getElementById('comparison-overlay').style.display = 'none';
        document.getElementById('bargain-overlay').style.display = 'none';
    }
}
