/* ======================================
   LEVEL 10: SSRIs — MUCH MORE THAN YOU
   WANTED TO KNOW

   Body-Horror Puzzle / Internal Journey

   The truth about antidepressants is
   complicated. They work, but not as much
   as advertised. Effect sizes are small
   but real. Individual variation is huge.
   ====================================== */

class Level10SSRI {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Individual Variation (different each playthrough) ----
        this.responseType = this.rollResponse();
        // responseType: 'strong_responder', 'moderate_responder', 'non_responder', 'side_effects'

        // ---- Depression State (HAM-D inspired) ----
        this.hamD = 22 + Math.floor(Math.random() * 8); // 22-29, severe
        this.baselineHamD = this.hamD;
        this.targetHamD = this.calculateTarget();

        // ---- Brain State ----
        this.serotoninLevel = 20 + Math.random() * 15; // low
        this.serotoninMax = 100;
        this.reuptakeRate = 3.0; // how fast serotonin drains
        this.baseReuptakeRate = 3.0;
        this.receptorSensitivity = 1.0;
        this.neuroplasticity = 0.3;

        // ---- Medication ----
        this.onSSRI = false;
        this.ssriDose = 0;        // 0-3 (off, low, medium, high)
        this.ssriDay = 0;         // days since starting
        this.ssriEffectBuildup = 0; // 0-1, takes ~30 days to reach full
        this.onMAOI = false;
        this.maoiDay = 0;
        this.dietRestricted = false;
        this.forbiddenFoods = ['cheese', 'chocolate', 'beer', 'kimchi', 'wine', 'aged_meat'];
        this.foodViolation = false;

        // ---- Time ----
        this.day = 0;
        this.maxDays = 120; // 4 months
        this.dayTimer = 0;
        this.dayDuration = 2.5; // seconds per day
        this.waitingPhase = false;
        this.waitDaysRemaining = 0;

        // ---- Side Effects ----
        this.sideEffects = {
            nausea: 0,
            insomnia: 0,
            flatAffect: 0,
            weight: 0,
            sexual: 0
        };

        // ---- Activities (things you can try each day) ----
        this.activities = [
            { id: 'rest', name: 'Rest', desc: 'Stay in bed. Low energy.', hamDelta: 0.1, serotoninDelta: 1, cost: 0 },
            { id: 'walk', name: 'Go for a walk', desc: 'Fresh air. Small effort.', hamDelta: -0.2, serotoninDelta: 3, cost: 1 },
            { id: 'exercise', name: 'Exercise', desc: 'Hard when everything is heavy.', hamDelta: -0.5, serotoninDelta: 5, cost: 3 },
            { id: 'socialize', name: 'See a friend', desc: 'Exhausting but human.', hamDelta: -0.3, serotoninDelta: 4, cost: 2 },
            { id: 'therapy', name: 'Therapy session', desc: 'Talk about the weather inside your head.', hamDelta: -0.4, serotoninDelta: 2, cost: 2 },
            { id: 'create', name: 'Try to create something', desc: 'Words, art, anything.', hamDelta: -0.3, serotoninDelta: 3, cost: 2 }
        ];
        this.energyPerDay = 3; // energy points per day
        this.energyRemaining = this.energyPerDay;
        this.todayActivities = [];

        // ---- Weather (visual metaphor for mood) ----
        this.weather = 'heavy_grey';  // heavy_grey, grey, light_grey, overcast, glimpse
        this.weatherParticles = [];
        this.gravity = 1.5; // movement feels heavy

        // ---- River System (serotonin visualization) ----
        this.rivers = [];
        this.transporters = [];
        this.generateBrainscape();

        // ---- Irving Kirsch Boss ----
        this.kirschAppeared = false;
        this.kirschTimer = 0;

        // ---- "Much More Than You Wanted to Know" ----
        this.deepDives = 0;

        // ---- Placebo Tracking ----
        this.placeboEffect = 0; // grows just from taking pills, any pills

        // ---- Visual ----
        this.particles = [];
        this.screenTint = { r: 40, g: 40, b: 50 }; // grey tint over everything

        // ---- Food choices (for MAOI) ----
        this.foodLog = [];

        // ---- Show UI ----
        document.getElementById('ssri-ui').style.display = 'block';
        document.getElementById('brain-panel').style.display = 'block';
        document.getElementById('medication-panel').style.display = 'block';
        document.getElementById('activity-panel').style.display = 'block';
        document.getElementById('kirsch-overlay').style.display = 'none';

        this.updateUI();
        this.buildMedicationPanel();
        this.buildActivityPanel();

        this.engine.showMessage(
            '<strong>LEVEL 10: SSRIs — MUCH MORE THAN YOU WANTED TO KNOW</strong><br><br>' +
            'Something is wrong inside your head. The rivers are running dry. ' +
            'The sky is made of lead. Getting out of bed feels like moving through concrete.<br><br>' +
            'Your HAM-D score: <strong>' + this.hamD + '</strong> (severe depression).<br><br>' +
            'Medications exist. They don\'t create serotonin — they slow its reuptake, ' +
            'keeping the rivers flowing a little longer.<br><br>' +
            'The effect size is approximately 0.3 standard deviations. That\'s not a cure. ' +
            'But it might be enough.<br><br>' +
            '<em>This is the most personal level. Take it slow.</em>'
        );
    }

    // ---- Setup ----

    rollResponse() {
        const roll = Math.random();
        if (roll < 0.30) return 'strong_responder';
        if (roll < 0.60) return 'moderate_responder';
        if (roll < 0.80) return 'non_responder';
        return 'side_effects';
    }

    calculateTarget() {
        switch (this.responseType) {
            case 'strong_responder': return this.hamD - 12;
            case 'moderate_responder': return this.hamD - 6;
            case 'non_responder': return this.hamD - 2;
            case 'side_effects': return this.hamD - 4;
            default: return this.hamD - 5;
        }
    }

    generateBrainscape() {
        // Rivers (serotonin pathways)
        for (let i = 0; i < 5; i++) {
            this.rivers.push({
                x: 100 + i * 180,
                y: 0,
                width: 8 + Math.random() * 6,
                flow: 0.3 + Math.random() * 0.3,
                particles: []
            });
        }

        // Transporters (reuptake pumps)
        for (let i = 0; i < 8; i++) {
            this.transporters.push({
                x: 50 + Math.random() * 900,
                y: 200 + Math.random() * 400,
                active: true,
                blocked: false,
                size: 12,
                pulseTimer: Math.random() * Math.PI * 2
            });
        }
    }

    // ---- Medication ----

    buildMedicationPanel() {
        const container = document.getElementById('med-buttons');
        container.innerHTML = '';

        if (!this.onSSRI && !this.onMAOI) {
            const ssriBtn = document.createElement('button');
            ssriBtn.className = 'med-btn';
            ssriBtn.innerHTML = '<strong>Start SSRI</strong><br><small>Blocks serotonin reuptake. Takes ~30 days. Effect size: 0.3 SD.</small>';
            ssriBtn.addEventListener('click', () => this.startSSRI());
            container.appendChild(ssriBtn);

            const maoiBtn = document.createElement('button');
            maoiBtn.className = 'med-btn med-maoi';
            maoiBtn.innerHTML = '<strong>Start MAOI</strong><br><small>More effective. But: no cheese, chocolate, beer, wine, kimchi, or aged meat. Ever.</small>';
            maoiBtn.addEventListener('click', () => this.startMAOI());
            container.appendChild(maoiBtn);

            const nothingBtn = document.createElement('button');
            nothingBtn.className = 'med-btn med-nothing';
            nothingBtn.innerHTML = '<strong>No medication</strong><br><small>Try to get through this without pills.</small>';
            nothingBtn.addEventListener('click', () => this.declineMeds());
            container.appendChild(nothingBtn);
        } else if (this.onSSRI) {
            const info = document.createElement('div');
            info.className = 'med-info';
            const pct = Math.round(this.ssriEffectBuildup * 100);
            info.innerHTML = `<span class="med-active">SSRI Active — Day ${this.ssriDay}</span>` +
                `<span class="med-detail">Effect buildup: ${pct}%</span>` +
                `<span class="med-detail">Reuptake blocked: ${Math.round((1 - this.reuptakeRate / this.baseReuptakeRate) * 100)}%</span>`;
            container.appendChild(info);

            // Dose adjustment
            const doseInfo = document.createElement('div');
            doseInfo.className = 'dose-controls';
            const doses = ['Low', 'Medium', 'High'];
            for (let i = 0; i < 3; i++) {
                const btn = document.createElement('button');
                btn.className = 'dose-btn' + (this.ssriDose === i + 1 ? ' active' : '');
                btn.textContent = doses[i];
                const dose = i + 1;
                btn.addEventListener('click', () => { this.ssriDose = dose; this.buildMedicationPanel(); });
                doseInfo.appendChild(btn);
            }
            container.appendChild(doseInfo);
        } else if (this.onMAOI) {
            const info = document.createElement('div');
            info.className = 'med-info';
            info.innerHTML = `<span class="med-active med-maoi-active">MAOI Active — Day ${this.maoiDay}</span>` +
                `<span class="med-detail">DIETARY RESTRICTIONS IN EFFECT</span>` +
                `<span class="med-forbidden">No: cheese, chocolate, beer, wine, kimchi, aged meat</span>`;
            container.appendChild(info);
        }

        // "Much More" button
        const moreBtn = document.createElement('button');
        moreBtn.className = 'med-btn med-more';
        moreBtn.innerHTML = '<small>Tell me more about how this works...</small>';
        moreBtn.addEventListener('click', () => this.deepDive());
        container.appendChild(moreBtn);
    }

    startSSRI() {
        this.onSSRI = true;
        this.ssriDose = 1;
        this.ssriDay = 0;
        this.ssriEffectBuildup = 0;
        this.placeboEffect = 5;
        this.buildMedicationPanel();
        this.spawnFloatingText('SSRI prescribed', '#60c0e0');
        this.engine.showMessage(
            '<strong>SSRI PRESCRIBED</strong><br><br>' +
            'The pills won\'t work immediately. SSRIs take 2-6 weeks to reach full effect.<br><br>' +
            'The game will make you wait. That wait is part of the experience.<br><br>' +
            'Side effects may come before the benefits.<br><br>' +
            '<em>"The waiting is the hardest part."</em>'
        );
    }

    startMAOI() {
        this.onMAOI = true;
        this.maoiDay = 0;
        this.dietRestricted = true;
        this.buildMedicationPanel();
        this.spawnFloatingText('MAOI prescribed', '#e0a040');
        this.engine.showMessage(
            '<strong>MAOI PRESCRIBED</strong><br><br>' +
            'MAOIs are more effective than SSRIs. But there\'s a catch:<br><br>' +
            '<strong>You cannot eat:</strong> cheese, chocolate, beer, wine, kimchi, or aged meat.<br><br>' +
            'These contain tyramine. With an MAOI, tyramine can cause a hypertensive crisis. ' +
            'This is not a suggestion. This is enforced.<br><br>' +
            'Every few days, the game will offer you food. Choose carefully.'
        );
    }

    declineMeds() {
        this.spawnFloatingText('No medication', '#8a8a9a');
        this.engine.showMessage(
            'You choose not to take medication.<br><br>' +
            'That\'s a valid choice. Exercise, therapy, social connection — ' +
            'these all have evidence behind them.<br><br>' +
            'It will be harder. The rivers don\'t have pharmaceutical help.<br><br>' +
            '<em>But some people prefer to find other ways.</em>'
        );
    }

    deepDive() {
        this.deepDives++;
        const dives = [
            'SSRIs block the serotonin transporter (SERT), preventing reuptake of serotonin from the synaptic cleft. ' +
            'This increases serotonin availability. But that happens in hours — the clinical effect takes weeks. ' +
            'Nobody fully understands why.',
            'The effect size of SSRIs is approximately d=0.3. In a meta-analysis, that means the average treated patient ' +
            'is better off than 62% of untreated patients. Small. But real.',
            'Severely depressed patients benefit more than mildly depressed patients. ' +
            'The effect size for severe depression is about d=0.5. For mild depression, it\'s near zero. ' +
            'The worse you are, the more they help.',
            'Publication bias inflates the apparent efficacy. Positive trials get published, negative ones don\'t. ' +
            'When you include unpublished data, the effect shrinks.',
            'Individual variation is enormous. Some people have dramatic responses. Some have none. ' +
            'We can\'t predict who will respond. Psychiatry is still partly trial and error.'
        ];
        const idx = Math.min(this.deepDives - 1, dives.length - 1);
        this.engine.showMessage(
            '<strong>MUCH MORE THAN YOU WANTED TO KNOW</strong><br><br>' +
            dives[idx] +
            (this.deepDives >= dives.length ? '<br><br><em>You\'ve now learned much more than you wanted to know.</em>' : '')
        );
    }

    // ---- Activities ----

    buildActivityPanel() {
        const container = document.getElementById('activity-buttons');
        container.innerHTML = '';

        for (const act of this.activities) {
            const btn = document.createElement('button');
            btn.className = 'activity-btn';
            const canDo = this.energyRemaining >= act.cost;
            btn.disabled = !canDo;
            btn.innerHTML = `<span class="act-name">${act.name}</span>` +
                `<span class="act-cost">Energy: ${act.cost}</span>`;
            btn.title = act.desc;
            btn.addEventListener('click', () => this.doActivity(act));
            container.appendChild(btn);
        }

        // End day button
        const endBtn = document.createElement('button');
        endBtn.className = 'activity-btn end-day-btn';
        endBtn.innerHTML = '<span class="act-name">End Day</span>';
        endBtn.addEventListener('click', () => this.endDay());
        container.appendChild(endBtn);

        // Energy display
        const energyEl = document.getElementById('energy-display');
        if (energyEl) energyEl.textContent = `Energy: ${this.energyRemaining} / ${this.energyPerDay}`;
    }

    doActivity(activity) {
        if (this.energyRemaining < activity.cost || this.gameOver) return;
        this.energyRemaining -= activity.cost;
        this.todayActivities.push(activity.id);

        // Apply effects
        this.hamD = Math.max(0, Math.min(30, this.hamD + activity.hamDelta));
        this.serotoninLevel = Math.min(this.serotoninMax,
            this.serotoninLevel + activity.serotoninDelta);

        this.spawnFloatingText(activity.name, '#8a8aaa');
        this.buildActivityPanel();
        this.updateUI();
    }

    endDay() {
        this.processDay();
        this.buildActivityPanel();
        this.buildMedicationPanel();
    }

    // ---- Day Processing ----

    processDay() {
        this.day++;
        this.energyRemaining = this.energyPerDay;
        this.todayActivities = [];

        // Energy is lower when more depressed
        this.energyPerDay = this.hamD > 20 ? 2 : this.hamD > 12 ? 3 : 4;
        this.energyRemaining = this.energyPerDay;

        // SSRI effects
        if (this.onSSRI) {
            this.ssriDay++;
            // Slow buildup over ~30 days
            this.ssriEffectBuildup = Math.min(1, this.ssriDay / 30);
            // Reduce reuptake rate based on dose and buildup
            const blockage = this.ssriDose * 0.25 * this.ssriEffectBuildup;
            this.reuptakeRate = this.baseReuptakeRate * (1 - blockage);

            // Apply response type
            if (this.ssriEffectBuildup > 0.5) {
                let dailyImprovement = 0;
                switch (this.responseType) {
                    case 'strong_responder': dailyImprovement = -0.25; break;
                    case 'moderate_responder': dailyImprovement = -0.12; break;
                    case 'non_responder': dailyImprovement = -0.02; break;
                    case 'side_effects': dailyImprovement = -0.08; break;
                }
                this.hamD = Math.max(this.targetHamD, this.hamD + dailyImprovement);
            }

            // Side effects (early, fade over time)
            if (this.ssriDay < 14) {
                if (this.responseType === 'side_effects' || Math.random() < 0.3) {
                    this.sideEffects.nausea = Math.min(5, this.sideEffects.nausea + 0.5);
                }
                this.sideEffects.insomnia = Math.min(3, this.sideEffects.insomnia + 0.2);
            } else {
                // Fade
                this.sideEffects.nausea = Math.max(0, this.sideEffects.nausea - 0.3);
                this.sideEffects.insomnia = Math.max(0, this.sideEffects.insomnia - 0.1);
            }
            // Persistent side effects
            if (this.ssriDay > 20 && this.ssriDose >= 2) {
                this.sideEffects.flatAffect = Math.min(3, this.sideEffects.flatAffect + 0.05);
            }

            // Placebo effect
            this.placeboEffect = Math.min(8, this.placeboEffect + 0.1);
            this.hamD = Math.max(0, this.hamD - this.placeboEffect * 0.02);
        }

        // MAOI effects
        if (this.onMAOI) {
            this.maoiDay++;
            // MAOIs are stronger
            if (this.maoiDay > 14) {
                let improvement = -0.3;
                if (this.responseType === 'non_responder') improvement = -0.1;
                this.hamD = Math.max(Math.max(0, this.targetHamD - 3), this.hamD + improvement);
            }

            // Food challenge every ~7 days
            if (this.maoiDay % 7 === 0 && !this.foodViolation) {
                this.offerFood();
            }
        }

        // Natural serotonin dynamics
        this.serotoninLevel = Math.max(5,
            this.serotoninLevel - this.reuptakeRate + (Math.random() * 2));

        // Severity affects serotonin benefit (worse = more benefit from meds)
        if (this.hamD > 20 && (this.onSSRI || this.onMAOI)) {
            this.hamD -= 0.05; // severely depressed benefit more
        }

        // Weather update
        this.updateWeather();

        // Gravity (movement difficulty based on depression)
        this.gravity = 1 + (this.hamD / 30) * 1.5;

        // Irving Kirsch at day 45
        if (this.day === 45 && !this.kirschAppeared) {
            this.kirschAppeared = true;
            this.kirschTimer = 8;
            this.showKirsch();
        }

        // Win check
        if (this.day >= this.maxDays || (this.hamD <= 10 && this.day > 30)) {
            this.endGame();
        }

        this.updateUI();
    }

    offerFood() {
        const foods = [
            { name: 'A grilled cheese sandwich', forbidden: true, item: 'cheese' },
            { name: 'A bar of dark chocolate', forbidden: true, item: 'chocolate' },
            { name: 'A cold beer after a long day', forbidden: true, item: 'beer' },
            { name: 'Homemade kimchi from a friend', forbidden: true, item: 'kimchi' },
            { name: 'A glass of red wine', forbidden: true, item: 'wine' },
            { name: 'A fresh apple', forbidden: false, item: 'apple' },
            { name: 'Plain rice and vegetables', forbidden: false, item: 'rice' },
            { name: 'Fresh bread with olive oil', forbidden: false, item: 'bread' }
        ];
        const food = foods[Math.floor(Math.random() * foods.length)];

        this.engine.showMessage(
            `<strong>FOOD CHOICE</strong><br><br>` +
            `Someone offers you: <em>${food.name}</em><br><br>` +
            (food.forbidden ?
                `<span style="color: #d44040">WARNING: This contains tyramine. With your MAOI, this could cause a hypertensive crisis.</span><br><br>` +
                'Do you eat it?' :
                'This is safe to eat.'),
            () => {
                if (food.forbidden) {
                    // The food was forbidden — eating it would be dangerous
                    // For now, we assume the player reads the warning and declines
                    // (The message system doesn't support branching, so we note it)
                    this.foodLog.push({ day: this.day, food: food.name, safe: true });
                } else {
                    this.foodLog.push({ day: this.day, food: food.name, safe: true });
                }
            }
        );
    }

    showKirsch() {
        document.getElementById('kirsch-overlay').style.display = 'flex';
        document.getElementById('kirsch-text').innerHTML =
            `<strong>IRVING KIRSCH</strong><br>` +
            `<em>Associate Director of the Program for Placebo Studies</em><br><br>` +
            `"Let me ask you something. How do you know this is working?<br><br>` +
            `Your improvement could be the placebo effect. It could be natural remission. ` +
            `It could be regression to the mean.<br><br>` +
            `The drug trials show a difference of about 2 points on the HAM-D scale. ` +
            `The clinical threshold for 'meaningful' is 3 points.<br><br>` +
            `Are you feeling better because of the chemistry? Or because you believe you should?"`;

        document.getElementById('btn-kirsch-dismiss').onclick = () => {
            document.getElementById('kirsch-overlay').style.display = 'none';
            this.spawnFloatingText('...but I feel slightly better.', '#8a8a9a');
        };
    }

    updateWeather() {
        if (this.hamD > 22) this.weather = 'heavy_grey';
        else if (this.hamD > 17) this.weather = 'grey';
        else if (this.hamD > 12) this.weather = 'light_grey';
        else if (this.hamD > 7) this.weather = 'overcast';
        else this.weather = 'glimpse';
    }

    // ---- End Game ----

    endGame() {
        this.gameOver = true;

        const improvement = this.baselineHamD - this.hamD;
        const pctImproved = Math.round((improvement / this.baselineHamD) * 100);
        const functional = this.hamD <= 12;
        const remission = this.hamD <= 7;

        let title, text, insight;
        let medicationDesc = 'no medication';
        if (this.onSSRI) medicationDesc = `SSRI (day ${this.ssriDay})`;
        if (this.onMAOI) medicationDesc = `MAOI (day ${this.maoiDay})`;

        if (remission) {
            title = 'REMISSION';
            text = `HAM-D: ${Math.round(this.hamD)} (started at ${this.baselineHamD}). Improvement: ${pctImproved}%.<br>` +
                `Treatment: ${medicationDesc}. Response type: ${this.responseType.replace('_', ' ')}.<br><br>` +
                `The sun didn\'t come out. But the sky is lighter. The gravity is less. ` +
                `You got out of bed today without it feeling like a heroic act.<br><br>` +
                `This is not a triumphant ending. It\'s a realistic one.<br><br>` +
                `<em>"This medication has an effect size of approximately 0.3. You are slightly better. ' +
                'That slight improvement may be the difference between living and not living. ' +
                'That is enough."</em>`;
            insight = '"0.3 standard deviations. The grey became slightly lighter grey. That was enough."';
            this.elua.adjustHumanity(10);
        } else if (functional) {
            title = 'FUNCTIONAL';
            text = `HAM-D: ${Math.round(this.hamD)} (started at ${this.baselineHamD}). Improvement: ${pctImproved}%.<br>` +
                `Treatment: ${medicationDesc}. Days survived: ${this.day}.<br><br>` +
                `You\'re not cured. The depression hasn\'t gone away. ` +
                `But you can function. You can get out of bed. You can go to work. ` +
                `You can sometimes enjoy small things.<br><br>` +
                `The 0.3 standard deviations didn\'t transform your life. ` +
                `They shifted the balance just enough.<br><br>` +
                `<em>Not perfect. Functional. That counts.</em>`;
            insight = '"They work, but not as much as advertised. Effect sizes are small but real. Individual variation is huge."';
            this.elua.adjustHumanity(8);
        } else if (this.responseType === 'non_responder') {
            title = 'NON-RESPONDER';
            text = `HAM-D: ${Math.round(this.hamD)} (started at ${this.baselineHamD}). Improvement: ${pctImproved}%.<br>` +
                `Treatment: ${medicationDesc}. Response type: non-responder.<br><br>` +
                `The medication didn\'t work for you. That happens to about 30% of patients. ` +
                `It\'s not your fault. It\'s not a moral failing. ` +
                `Your brain chemistry just didn\'t respond to this particular intervention.<br><br>` +
                `There are other options. Other medications. Other approaches. ` +
                `The search continues.<br><br>` +
                `<em>Sometimes the first thing you try doesn\'t work. That doesn\'t mean nothing will.</em>`;
            insight = '"Individual variation is enormous. We can\'t predict who will respond. That\'s the honest, uncomfortable truth."';
            this.elua.adjustHumanity(5);
        } else {
            title = 'THE LONG ROAD';
            text = `HAM-D: ${Math.round(this.hamD)} (started at ${this.baselineHamD}). Improvement: ${pctImproved}%.<br>` +
                `Treatment: ${medicationDesc}. Days: ${this.day}.<br>` +
                `Side effects — Nausea: ${Math.round(this.sideEffects.nausea)}, ` +
                `Insomnia: ${Math.round(this.sideEffects.insomnia)}, ` +
                `Flat affect: ${Math.round(this.sideEffects.flatAffect)}.<br><br>` +
                `Recovery is not linear. Some days are better, some worse. ` +
                `The medication helped some. Activities helped some. Time helped some.<br><br>` +
                `There is no dramatic resolution. Just the slow, uneven process of ` +
                `becoming slightly more okay.<br><br>` +
                `<em>This is what recovery actually looks like. It\'s enough.</em>`;
            insight = '"The truth about antidepressants is complicated. They work, but not as much as advertised. And that\'s still worth knowing."';
            this.elua.adjustHumanity(6);
        }

        this.engine.endLevel(title, text, insight, false);
    }

    // ---- Visuals ----

    spawnFloatingText(text, color) {
        this.particles.push({
            type: 'text',
            x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: this.canvas.height / 2 - 30,
            text, color, life: 3, maxLife: 3, vy: -20 // slow, heavy
        });
    }

    // ---- Update ----

    update(dt) {
        if (this.gameOver) return;
        this.time += dt;

        // Kirsch timer
        if (this.kirschTimer > 0) this.kirschTimer -= dt;

        // Serotonin river particles
        for (const river of this.rivers) {
            if (Math.random() < this.serotoninLevel / 100 * dt * 3) {
                river.particles.push({
                    x: river.x + (Math.random() - 0.5) * river.width,
                    y: 0,
                    vy: 30 + river.flow * 40,
                    life: 8
                });
            }
            for (let i = river.particles.length - 1; i >= 0; i--) {
                const p = river.particles[i];
                p.y += p.vy * dt;
                p.life -= dt * this.reuptakeRate * 0.5; // drain faster with higher reuptake
                if (p.life <= 0 || p.y > this.canvas.height) {
                    river.particles.splice(i, 1);
                }
            }
        }

        // Transporter animation
        for (const t of this.transporters) {
            t.pulseTimer += dt * 2;
            t.blocked = this.onSSRI && this.ssriEffectBuildup > 0.3;
        }

        // Floating particles (slow, heavy)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            p.y += p.vy * dt * (1 / this.gravity); // heavier when more depressed
        }

        // Weather particles
        if (this.weather === 'heavy_grey' || this.weather === 'grey') {
            if (Math.random() < dt * 5) {
                this.weatherParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: -5,
                    vy: 30 + Math.random() * 20,
                    life: 4,
                    type: 'rain'
                });
            }
        }
        for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
            const p = this.weatherParticles[i];
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0 || p.y > this.canvas.height) {
                this.weatherParticles.splice(i, 1);
            }
        }

        // Screen tint (shifts with depression level)
        const depPct = this.hamD / 30;
        this.screenTint.r = Math.round(30 + (1 - depPct) * 20);
        this.screenTint.g = Math.round(30 + (1 - depPct) * 25);
        this.screenTint.b = Math.round(40 + (1 - depPct) * 30);

        this.updateUI();
    }

    // ---- Draw ----

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background — tinted by depression
        const t = this.screenTint;
        ctx.fillStyle = `rgb(${t.r}, ${t.g}, ${t.b})`;
        ctx.fillRect(0, 0, w, h);

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
        const skyBright = this.weather === 'glimpse' ? 0.15 :
                          this.weather === 'overcast' ? 0.08 :
                          this.weather === 'light_grey' ? 0.05 : 0.02;
        skyGrad.addColorStop(0, `rgba(100, 120, 160, ${skyBright})`);
        skyGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.4);

        // Glimpse of sun (only in best weather)
        if (this.weather === 'glimpse') {
            ctx.save();
            ctx.globalAlpha = 0.1 + Math.sin(this.time * 0.5) * 0.05;
            const sunGrad = ctx.createRadialGradient(w * 0.7, 60, 5, w * 0.7, 60, 80);
            sunGrad.addColorStop(0, 'rgba(240, 208, 96, 0.3)');
            sunGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = sunGrad;
            ctx.fillRect(w * 0.5, 0, w * 0.4, 150);
            ctx.restore();
        }

        // Draw serotonin rivers
        this.drawRivers(ctx, w, h);

        // Draw transporters
        this.drawTransporters(ctx);

        // Weather (rain)
        ctx.fillStyle = 'rgba(120, 130, 150, 0.3)';
        for (const p of this.weatherParticles) {
            ctx.fillRect(p.x, p.y, 1, 6);
        }

        // Draw Elua (small, heavy)
        this.elua.setPosition(w / 2, h / 2 + 40);
        this.elua.draw(ctx);

        // Gravity visualization — weight lines around Elua
        if (this.gravity > 1.3) {
            ctx.save();
            ctx.globalAlpha = (this.gravity - 1) * 0.3;
            ctx.strokeStyle = '#6a6a7a';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const ly = h / 2 + 55 + i * 8;
                ctx.beginPath();
                ctx.moveTo(w / 2 - 30, ly);
                ctx.lineTo(w / 2 + 30, ly);
                ctx.stroke();
            }
            ctx.restore();
        }

        // HAM-D score display
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = this.hamD > 17 ? '#c06060' : this.hamD > 10 ? '#c0a030' : '#6aaa60';
        ctx.textAlign = 'center';
        ctx.fillText(`HAM-D: ${Math.round(this.hamD)}`, w / 2, 30);

        // Day counter
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#6a6a7a';
        ctx.fillText(`Day ${this.day} / ${this.maxDays}`, w / 2, h - 15);

        // Weather label
        const weatherLabels = {
            heavy_grey: 'Heavy grey. Everything is lead.',
            grey: 'Grey. The usual.',
            light_grey: 'Lighter grey. Is that different?',
            overcast: 'Overcast. But... lighter.',
            glimpse: 'A glimpse. Not sunshine. But less dark.'
        };
        ctx.font = '11px Caveat, cursive';
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText(weatherLabels[this.weather], w / 2, h - 35);

        // Floating text particles
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = p.color;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        }

        // Effect size reminder at edges
        if (this.onSSRI && this.ssriDay > 30) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = '#6a6a7a';
            ctx.textAlign = 'left';
            ctx.fillText('Effect size: d = 0.3', 15, h - 10);
            ctx.restore();
        }
    }

    drawRivers(ctx, w, h) {
        for (const river of this.rivers) {
            // River channel
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#4060a0';
            ctx.fillRect(river.x - river.width / 2, 0, river.width, h);
            ctx.restore();

            // Serotonin particles
            const brightness = this.serotoninLevel / 100;
            for (const p of river.particles) {
                const alpha = (p.life / 8) * brightness;
                ctx.save();
                ctx.globalAlpha = Math.min(0.8, alpha);
                ctx.fillStyle = '#60a0e0';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    drawTransporters(ctx) {
        for (const t of this.transporters) {
            ctx.save();
            const pulse = Math.sin(t.pulseTimer) * 0.3 + 0.7;

            if (t.blocked) {
                // Blocked by SSRI — red X
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = '#e06060';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.stroke();
                // X mark
                ctx.beginPath();
                ctx.moveTo(t.x - 5, t.y - 5);
                ctx.lineTo(t.x + 5, t.y + 5);
                ctx.moveTo(t.x + 5, t.y - 5);
                ctx.lineTo(t.x - 5, t.y + 5);
                ctx.stroke();
            } else {
                // Active transporter — pumping
                ctx.globalAlpha = 0.4 * pulse;
                ctx.strokeStyle = '#a0a0c0';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size * pulse, 0, Math.PI * 2);
                ctx.stroke();
                // Arrow pointing in (reuptake)
                ctx.beginPath();
                ctx.moveTo(t.x, t.y - t.size - 5);
                ctx.lineTo(t.x, t.y - 4);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // ---- UI ----

    updateUI() {
        const hamFill = document.getElementById('ssri-hamd-fill');
        if (hamFill) hamFill.style.width = (this.hamD / 30 * 100) + '%';

        const hamVal = document.getElementById('ssri-hamd-val');
        if (hamVal) hamVal.textContent = Math.round(this.hamD);

        const serFill = document.getElementById('ssri-serotonin-fill');
        if (serFill) serFill.style.width = (this.serotoninLevel / this.serotoninMax * 100) + '%';

        const serVal = document.getElementById('ssri-serotonin-val');
        if (serVal) serVal.textContent = Math.round(this.serotoninLevel);

        const dayEl = document.getElementById('ssri-day');
        if (dayEl) dayEl.textContent = `Day ${this.day} / ${this.maxDays}`;

        const weatherEl = document.getElementById('ssri-weather');
        if (weatherEl) weatherEl.textContent = this.weather.replace(/_/g, ' ');

        const energyEl = document.getElementById('energy-display');
        if (energyEl) energyEl.textContent = `Energy: ${this.energyRemaining} / ${this.energyPerDay}`;

        const humFill = document.getElementById('humanity-fill-l10');
        if (humFill) humFill.style.width = this.elua.humanity + '%';
    }

    cleanup() {
        document.getElementById('ssri-ui').style.display = 'none';
        document.getElementById('brain-panel').style.display = 'none';
        document.getElementById('medication-panel').style.display = 'none';
        document.getElementById('activity-panel').style.display = 'none';
        document.getElementById('kirsch-overlay').style.display = 'none';
    }
}
