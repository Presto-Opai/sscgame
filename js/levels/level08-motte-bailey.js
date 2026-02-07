/* ======================================
   LEVEL 8: ALL IN ALL, ANOTHER BRICK
   IN THE MOTTE

   Debate / Rhetoric Strategy Game
   (Phoenix Wright meets tower defense)

   The motte-and-bailey fallacy: make bold
   claims (the bailey), retreat to defensible
   claims (the motte) when challenged, then
   return to the bailey.
   ====================================== */

class Level08MotteBailey {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Castle State ----
        this.motteCapacity = 3;    // motte is small — limited defensible claims
        this.baileyCapacity = 8;   // bailey is large — bold claims live here
        this.motteClaims = [];     // claims currently in the motte (safe)
        this.baileyClaims = [];    // claims currently in the bailey (vulnerable)
        this.abandonedClaims = []; // claims you gave up

        // ---- Influence & Credibility ----
        this.influence = 50;       // how much rhetorical power you have (0-100)
        this.credibility = 70;     // how honest you appear (0-100)
        this.retreats = 0;         // times you retreated to the motte
        this.honestDefenses = 0;   // times you defended bailey honestly
        this.exposedOpponent = 0;  // times you caught opponent's motte-bailey

        // ---- Available Claims (player's arsenal) ----
        this.availableClaims = [
            // Post-modernism
            { id: 'postmod_bailey', bailey: 'Reality is entirely socially constructed.',
              motte: 'Different cultures perceive things differently.',
              domain: 'postmodernism', color: '#a060c0', strength: 3, defensibility: 1 },
            // Religion
            { id: 'religion_bailey', bailey: 'God performs literal miracles and heals the sick.',
              motte: 'There is beauty and meaning in the universe.',
              domain: 'religion', color: '#e0c060', strength: 4, defensibility: 1 },
            // Feminism
            { id: 'feminism_bailey', bailey: 'We need these 15 specific radical policy changes.',
              motte: 'Women are people and deserve equal rights.',
              domain: 'feminism', color: '#e06080', strength: 3, defensibility: 2 },
            // Capitalism critique
            { id: 'anticap_bailey', bailey: 'Capitalism is inherently violent and must be abolished.',
              motte: 'Some market outcomes are unjust and need correction.',
              domain: 'economics', color: '#d04040', strength: 4, defensibility: 1 },
            // Science
            { id: 'scientism_bailey', bailey: 'Science is the only valid way of knowing anything.',
              motte: 'Scientific method produces reliable empirical knowledge.',
              domain: 'science', color: '#40a0c0', strength: 3, defensibility: 3 },
            // Free speech
            { id: 'speech_bailey', bailey: 'All speech should be completely unrestricted everywhere.',
              motte: 'Government shouldn\'t jail people for opinions.',
              domain: 'politics', color: '#60a060', strength: 3, defensibility: 2 },
            // Tradition
            { id: 'tradition_bailey', bailey: 'All traditions are sacred and must never change.',
              motte: 'Some traditions encode useful wisdom we shouldn\'t discard lightly.',
              domain: 'culture', color: '#c09040', strength: 3, defensibility: 2 },
            // Honest claims (bailey = motte, small but impregnable)
            { id: 'honest_1', bailey: 'Most political issues involve genuine trade-offs.',
              motte: 'Most political issues involve genuine trade-offs.',
              domain: 'honest', color: '#f0d060', strength: 1, defensibility: 5, honest: true },
            { id: 'honest_2', bailey: 'People generally try to do what they think is right.',
              motte: 'People generally try to do what they think is right.',
              domain: 'honest', color: '#f0d060', strength: 1, defensibility: 5, honest: true },
            { id: 'honest_3', bailey: 'Complex problems rarely have simple solutions.',
              motte: 'Complex problems rarely have simple solutions.',
              domain: 'honest', color: '#f0d060', strength: 1, defensibility: 5, honest: true }
        ];

        // ---- Opponents ----
        this.opponents = [
            {
                name: 'The Ideologue',
                desc: 'Passionate, aggressive, uses motte-and-bailey constantly.',
                claims: [
                    { bailey: 'Eating meat is literally murder.', motte: 'Animal suffering matters morally.',
                      domain: 'ethics', exposed: false },
                    { bailey: 'All cops are bastards.', motte: 'Police reform is needed.',
                      domain: 'politics', exposed: false },
                    { bailey: 'Billionaires are inherently evil.', motte: 'Wealth inequality is a problem.',
                      domain: 'economics', exposed: false }
                ],
                aggression: 0.7, retreatSpeed: 0.9
            },
            {
                name: 'The Sophist',
                desc: 'Slippery, always retreating, hard to pin down.',
                claims: [
                    { bailey: 'Alternative medicine can cure cancer.', motte: 'Holistic wellness has some benefits.',
                      domain: 'science', exposed: false },
                    { bailey: 'Words are violence.', motte: 'Language can cause real harm.',
                      domain: 'philosophy', exposed: false },
                    { bailey: 'The patriarchy controls everything.', motte: 'Gender inequality exists.',
                      domain: 'feminism', exposed: false }
                ],
                aggression: 0.4, retreatSpeed: 1.0
            },
            {
                name: 'The Mirror',
                desc: 'Uses YOUR exact tactics against you. Exposes your hypocrisy.',
                claims: [
                    { bailey: 'Rationality is the only valid worldview.', motte: 'Thinking clearly is useful.',
                      domain: 'philosophy', exposed: false },
                    { bailey: 'Tradition is always just superstition.', motte: 'Some traditions lack evidence.',
                      domain: 'culture', exposed: false },
                    { bailey: 'IQ determines human worth.', motte: 'Cognitive ability varies between people.',
                      domain: 'science', exposed: false }
                ],
                aggression: 0.5, retreatSpeed: 0.8
            }
        ];
        this.currentOpponent = null;
        this.opponentIndex = 0;
        this.roundNum = 0;
        this.maxRounds = 5;

        // ---- Combat State ----
        this.phase = 'build';  // build -> debate -> attack -> resolve -> build...
        this.attackTarget = null;  // which of your claims is being attacked
        this.playerAttackTarget = null; // which opponent claim you're attacking
        this.debateLog = [];
        this.turnTimer = 0;

        // ---- Animations ----
        this.particles = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.flashColor = null;
        this.flashTimer = 0;

        // ---- Castle Visual ----
        this.castleAnimOffset = 0;

        // ---- Show UI ----
        document.getElementById('motte-ui').style.display = 'block';
        document.getElementById('claims-panel').style.display = 'block';
        document.getElementById('debate-log-panel').style.display = 'block';
        document.getElementById('opponent-panel').style.display = 'none';
        document.getElementById('debate-choice-overlay').style.display = 'none';
        document.getElementById('attack-choice-overlay').style.display = 'none';

        this.updateUI();
        this.buildClaimsPanel();

        this.engine.showMessage(
            '<strong>LEVEL 8: ALL IN ALL, ANOTHER BRICK IN THE MOTTE</strong><br><br>' +
            'You control a motte-and-bailey castle of <em>ideas</em>.<br><br>' +
            '<strong>The Bailey</strong> (outer courtyard): Bold claims that gain influence but are hard to defend.<br>' +
            '<strong>The Motte</strong> (inner tower): Defensible retreats — true but boring.<br><br>' +
            'Place claims, defend against attacks, and expose your opponents\' motte-and-bailey fallacies.<br><br>' +
            'Or... build an <em>honest castle</em> where the bailey and the motte are the same thing.<br><br>' +
            '<em>"I just meant there\'s beauty in the universe!"</em>'
        , () => {
            this.startRound();
        });
    }

    // ---- Claims Management ----

    buildClaimsPanel() {
        const container = document.getElementById('claims-buttons');
        container.innerHTML = '';

        for (const claim of this.availableClaims) {
            // Skip if already placed
            if (this.baileyClaims.find(c => c.id === claim.id) ||
                this.motteClaims.find(c => c.id === claim.id)) continue;

            const btn = document.createElement('button');
            btn.className = 'claim-btn';
            btn.style.borderLeftColor = claim.color;
            btn.innerHTML = `<span class="claim-text">${claim.bailey}</span>` +
                `<span class="claim-meta">${claim.honest ? 'HONEST' : 'Bold'} | Str: ${claim.strength}</span>`;
            btn.title = claim.honest ? 'Bailey = Motte (impregnable but modest)' :
                `Bailey: ${claim.bailey}\nMotte: ${claim.motte}`;
            btn.addEventListener('click', () => this.placeClaim(claim));
            container.appendChild(btn);
        }

        // Show motte/bailey counts
        const info = document.getElementById('castle-info');
        if (info) {
            info.innerHTML = `Bailey: ${this.baileyClaims.length}/${this.baileyCapacity} | ` +
                `Motte: ${this.motteClaims.length}/${this.motteCapacity}`;
        }
    }

    placeClaim(claim) {
        if (this.phase !== 'build') return;
        if (this.baileyClaims.length >= this.baileyCapacity) {
            this.spawnFloatingText('Bailey full!', '#d44040');
            return;
        }
        this.baileyClaims.push({ ...claim, inMotte: false, health: 3 });
        this.influence += claim.strength * 2;
        this.spawnFloatingText('+' + (claim.strength * 2) + ' Influence', claim.color);
        if (claim.honest) {
            this.credibility += 3;
            this.spawnFloatingText('+Credibility', '#f0d060');
        }
        this.buildClaimsPanel();
        this.updateUI();
    }

    // ---- Rounds ----

    startRound() {
        this.roundNum++;
        if (this.roundNum > this.maxRounds) {
            this.endGame();
            return;
        }

        this.phase = 'build';
        this.buildClaimsPanel();

        if (this.roundNum <= this.opponents.length) {
            this.currentOpponent = this.opponents[this.roundNum - 1];
        }

        if (this.baileyClaims.length === 0 && this.roundNum === 1) {
            // First round — let them build
            this.addToLog('SYSTEM', 'Place claims in your bailey to begin. Bold claims gain influence but are vulnerable.');
        } else {
            this.addToLog('SYSTEM', `Round ${this.roundNum}/${this.maxRounds}. Place more claims or begin debate.`);
        }

        this.updateUI();
        this.showBeginDebateButton();
    }

    showBeginDebateButton() {
        const container = document.getElementById('claims-buttons');
        if (this.baileyClaims.length > 0) {
            const btn = document.createElement('button');
            btn.className = 'claim-btn begin-debate-btn';
            btn.innerHTML = '<span class="claim-text">BEGIN DEBATE</span>';
            btn.addEventListener('click', () => this.beginDebate());
            container.appendChild(btn);
        }
    }

    beginDebate() {
        if (this.phase !== 'build' || this.baileyClaims.length === 0) return;
        this.phase = 'debate';

        if (this.currentOpponent) {
            document.getElementById('opponent-panel').style.display = 'block';
            document.getElementById('opponent-name').textContent = this.currentOpponent.name;
            document.getElementById('opponent-desc').textContent = this.currentOpponent.desc;
            this.addToLog('OPPONENT', `${this.currentOpponent.name} enters the arena. "${this.currentOpponent.desc}"`);
        }

        // Opponent attacks one of your bailey claims
        setTimeout(() => this.opponentAttack(), 1500);
    }

    // ---- Opponent Attack ----

    opponentAttack() {
        if (this.gameOver || this.phase !== 'debate') return;

        const vulnerableClaims = this.baileyClaims.filter(c => !c.inMotte && !c.honest);
        if (vulnerableClaims.length === 0) {
            // All claims are honest or in motte — opponent can't attack effectively
            this.addToLog('OPPONENT', `${this.currentOpponent.name} searches for weakness... finds none.`);
            this.spawnFloatingText('No weak points!', '#4aaf5a');
            setTimeout(() => this.playerTurn(), 2000);
            return;
        }

        // Pick the strongest claim to attack
        const target = vulnerableClaims.sort((a, b) => b.strength - a.strength)[0];
        this.attackTarget = target;

        this.addToLog('OPPONENT', `Attacks: "${target.bailey}"`);
        this.addToLog('OPPONENT', `"That's a bold claim. Can you actually defend it?"`);
        this.shakeTimer = 0.5;
        this.shakeIntensity = 5;

        // Show defense choices
        this.showDefenseChoices(target);
    }

    showDefenseChoices(claim) {
        const overlay = document.getElementById('debate-choice-overlay');
        overlay.style.display = 'flex';

        document.getElementById('debate-choice-title').textContent = 'YOUR CLAIM IS UNDER ATTACK';
        document.getElementById('debate-choice-claim').innerHTML =
            `<strong>"${claim.bailey}"</strong>`;

        const btns = document.getElementById('debate-choice-buttons');
        btns.innerHTML = '';

        // Option 1: Defend the bailey (risky)
        const defendBtn = document.createElement('button');
        defendBtn.className = 'debate-btn defend-btn';
        defendBtn.innerHTML = '<strong>DEFEND THE BAILEY</strong><br>' +
            '<small>Stand by the bold claim. Risky — might lose credibility.</small>';
        defendBtn.addEventListener('click', () => this.defendBailey(claim));
        btns.appendChild(defendBtn);

        // Option 2: Retreat to the motte
        const retreatBtn = document.createElement('button');
        retreatBtn.className = 'debate-btn retreat-btn';
        retreatBtn.innerHTML = `<strong>RETREAT TO MOTTE</strong><br>` +
            `<small>"I just meant: ${claim.motte}"</small>`;
        retreatBtn.addEventListener('click', () => this.retreatToMotte(claim));
        btns.appendChild(retreatBtn);

        // Option 3: Abandon
        const abandonBtn = document.createElement('button');
        abandonBtn.className = 'debate-btn abandon-btn';
        abandonBtn.innerHTML = '<strong>ABANDON CLAIM</strong><br>' +
            '<small>Lose the influence but keep credibility.</small>';
        abandonBtn.addEventListener('click', () => this.abandonClaim(claim));
        btns.appendChild(abandonBtn);
    }

    defendBailey(claim) {
        document.getElementById('debate-choice-overlay').style.display = 'none';

        // Success based on defensibility + luck
        const roll = Math.random() * 5;
        const success = roll < claim.defensibility;

        if (success) {
            this.honestDefenses++;
            this.credibility += 5;
            this.influence += 3;
            this.addToLog('YOU', `Successfully defended: "${claim.bailey}"`);
            this.spawnFloatingText('Defense holds!', '#4aaf5a');
            this.flashColor = '#4aaf5a';
            this.flashTimer = 0.3;
        } else {
            claim.health--;
            this.credibility -= 8;
            this.addToLog('YOU', `Defense failed! "${claim.bailey}" is weakened.`);
            this.spawnFloatingText('Defense crumbles!', '#d44040');
            this.shakeTimer = 0.8;
            this.shakeIntensity = 8;

            if (claim.health <= 0) {
                this.addToLog('SYSTEM', `Claim destroyed: "${claim.bailey}"`);
                this.baileyClaims = this.baileyClaims.filter(c => c.id !== claim.id);
                this.influence -= claim.strength * 3;
            }
        }

        this.updateUI();
        setTimeout(() => this.playerTurn(), 1500);
    }

    retreatToMotte(claim) {
        document.getElementById('debate-choice-overlay').style.display = 'none';

        if (this.motteClaims.length >= this.motteCapacity) {
            // Motte is full — forced to kick something out
            this.addToLog('SYSTEM', 'Motte is full! Oldest claim pushed back to bailey.');
            const kicked = this.motteClaims.shift();
            kicked.inMotte = false;
            this.baileyClaims.push(kicked);
        }

        // Move to motte
        this.baileyClaims = this.baileyClaims.filter(c => c.id !== claim.id);
        claim.inMotte = true;
        this.motteClaims.push(claim);
        this.retreats++;
        this.credibility -= 3;
        this.influence -= 2;

        this.addToLog('YOU', `Retreated: "I just meant: ${claim.motte}"`);
        this.addToLog('OPPONENT', `"You said '${claim.bailey.substring(0, 40)}...' and now you're saying '${claim.motte.substring(0, 40)}...'? Classic motte-and-bailey."`);
        this.spawnFloatingText('Retreat!', '#c0a030');

        this.updateUI();
        setTimeout(() => this.playerTurn(), 2000);
    }

    abandonClaim(claim) {
        document.getElementById('debate-choice-overlay').style.display = 'none';

        this.baileyClaims = this.baileyClaims.filter(c => c.id !== claim.id);
        this.abandonedClaims.push(claim);
        this.influence -= claim.strength * 2;
        this.credibility += 2;

        this.addToLog('YOU', `Abandoned: "${claim.bailey}"`);
        this.spawnFloatingText('Claim abandoned', '#8a8a9a');

        this.updateUI();
        setTimeout(() => this.playerTurn(), 1500);
    }

    // ---- Player Attack Turn ----

    playerTurn() {
        if (this.gameOver) return;
        this.phase = 'attack';

        if (!this.currentOpponent) {
            this.resolveRound();
            return;
        }

        // Show opponent's claims for player to attack
        const unexposed = this.currentOpponent.claims.filter(c => !c.exposed);
        if (unexposed.length === 0) {
            this.addToLog('SYSTEM', 'All opponent claims exposed! Round won.');
            this.resolveRound();
            return;
        }

        this.showAttackChoices(unexposed);
    }

    showAttackChoices(opponentClaims) {
        const overlay = document.getElementById('attack-choice-overlay');
        overlay.style.display = 'flex';

        document.getElementById('attack-choice-title').textContent = 'YOUR TURN — ATTACK';
        const btns = document.getElementById('attack-choice-buttons');
        btns.innerHTML = '';

        for (const claim of opponentClaims) {
            const btn = document.createElement('button');
            btn.className = 'debate-btn attack-option-btn';
            btn.innerHTML = `<strong>"${claim.bailey}"</strong><br>` +
                `<small>Challenge this claim — is it a motte-and-bailey?</small>`;
            btn.addEventListener('click', () => this.attackOpponent(claim));
            btns.appendChild(btn);
        }

        // Option to skip
        const skipBtn = document.createElement('button');
        skipBtn.className = 'debate-btn skip-btn';
        skipBtn.innerHTML = '<strong>PASS</strong><br><small>End your turn without attacking.</small>';
        skipBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            this.resolveRound();
        });
        btns.appendChild(skipBtn);
    }

    attackOpponent(claim) {
        document.getElementById('attack-choice-overlay').style.display = 'none';

        this.addToLog('YOU', `Challenge: "${claim.bailey}"`);

        // Opponent retreats based on retreatSpeed
        const retreats = Math.random() < this.currentOpponent.retreatSpeed;

        if (retreats) {
            this.addToLog('OPPONENT', `"I just meant: ${claim.motte}"`);
            this.addToLog('YOU', `"You said '${claim.bailey.substring(0, 35)}...' but now you're saying '${claim.motte.substring(0, 35)}...' — that's a motte-and-bailey!"`);

            claim.exposed = true;
            this.exposedOpponent++;
            this.influence += 5;
            this.credibility += 3;
            this.spawnFloatingText('MOTTE-AND-BAILEY EXPOSED!', '#f0d060');
            this.flashColor = '#f0d060';
            this.flashTimer = 0.5;

            this.engine.showMessage(
                `<strong>FALLACY EXPOSED!</strong><br><br>` +
                `${this.currentOpponent.name} claimed:<br>"${claim.bailey}"<br><br>` +
                `But when challenged, retreated to:<br>"${claim.motte}"<br><br>` +
                `<em>The bold claim (bailey) and the defensible claim (motte) are not the same thing.</em>`
            );
        } else {
            // Opponent stands ground
            this.addToLog('OPPONENT', `Stands firm: "${claim.bailey}"`);
            this.addToLog('SYSTEM', 'The opponent doubles down. This round is a draw on this claim.');
            this.spawnFloatingText('Opponent holds!', '#d44040');
        }

        this.updateUI();
        setTimeout(() => this.resolveRound(), 2000);
    }

    // ---- Round Resolution ----

    resolveRound() {
        this.phase = 'resolve';
        document.getElementById('opponent-panel').style.display = 'none';

        // Credibility decay for retreats
        if (this.retreats > 2) {
            this.credibility -= 5;
            this.addToLog('SYSTEM', 'Your frequent retreats are noticed. Credibility falls.');
        }

        // Check for honest castle bonus
        const honestCount = this.baileyClaims.filter(c => c.honest).length +
                           this.motteClaims.filter(c => c.honest).length;
        if (honestCount >= 3) {
            this.credibility += 5;
            this.addToLog('SYSTEM', 'Your intellectually honest claims earn respect.');
            this.spawnFloatingText('+Honest Castle Bonus', '#f0d060');
        }

        this.influence = Math.max(0, Math.min(100, this.influence));
        this.credibility = Math.max(0, Math.min(100, this.credibility));

        this.updateUI();

        // Auto-return bailey claims from motte after round
        for (const claim of this.motteClaims) {
            claim.inMotte = false;
        }
        this.baileyClaims.push(...this.motteClaims);
        this.motteClaims = [];

        setTimeout(() => this.startRound(), 2000);
    }

    // ---- End Game ----

    endGame() {
        this.gameOver = true;

        const totalClaims = this.baileyClaims.length + this.motteClaims.length;
        const honestClaims = [...this.baileyClaims, ...this.motteClaims].filter(c => c.honest).length;
        const boldClaims = totalClaims - honestClaims;

        let title, text, insight;

        if (honestClaims >= 3 && this.credibility >= 70) {
            // Honest castle ending
            title = 'THE HONEST CASTLE';
            text = `Your castle stands: ${totalClaims} claims remaining. ${honestClaims} honest, ${boldClaims} bold.<br><br>` +
                `Influence: ${Math.round(this.influence)}. Credibility: ${Math.round(this.credibility)}.<br>` +
                `Retreats: ${this.retreats}. Opponents exposed: ${this.exposedOpponent}.<br><br>` +
                `You built a small castle where the bailey and the motte are the same thing. ` +
                `Your claims are modest — but they\'re <em>true</em>. Nobody can force you to retreat ` +
                `because you never advanced further than you could defend.<br><br>` +
                `<em>Intellectually honest. Impregnable. Small, but real.</em>`;
            insight = '"The honest castle: where the bailey and the motte are the same thing. Small but impregnable."';
            this.elua.adjustHumanity(15);
        } else if (this.exposedOpponent >= 4 && this.retreats <= 2) {
            // Fallacy hunter ending
            title = 'THE FALLACY HUNTER';
            text = `Influence: ${Math.round(this.influence)}. Credibility: ${Math.round(this.credibility)}.<br>` +
                `Retreats: ${this.retreats}. Opponents exposed: ${this.exposedOpponent}.<br><br>` +
                `You exposed your opponents\' motte-and-bailey fallacies without using them yourself. ` +
                `A rare achievement — calling out rhetorical dishonesty while remaining honest.<br><br>` +
                `<em>The critic who practices what they preach.</em>`;
            insight = '"Expose the fallacy in others, but first make sure you\'re not committing it yourself."';
            this.elua.adjustHumanity(12);
        } else if (this.influence >= 70 && this.retreats >= 4) {
            // Master of rhetoric ending
            title = 'THE RHETORICIAN';
            text = `Influence: ${Math.round(this.influence)}. Credibility: ${Math.round(this.credibility)}.<br>` +
                `Retreats: ${this.retreats}. Claims abandoned: ${this.abandonedClaims.length}.<br><br>` +
                `You became a master of the motte-and-bailey. Bold claims in the courtyard, ` +
                `quick retreats to the tower. You won every debate — technically.<br><br>` +
                `But everyone noticed. Your retreats are logged. Your credibility tells the real story.<br><br>` +
                `<em>"I just meant there\'s beauty in the universe!" — said after claiming God cures cancer.</em>`;
            insight = '"The motte-and-bailey works... until people start tracking your retreats."';
            this.elua.adjustHumanity(-5);
        } else if (this.credibility < 30) {
            // Credibility collapse
            title = 'THE BOY WHO CRIED MOTTE';
            text = `Influence: ${Math.round(this.influence)}. Credibility: ${Math.round(this.credibility)}.<br>` +
                `Retreats: ${this.retreats}. Failed defenses leading to this collapse.<br><br>` +
                `You retreated too many times. Defended too many indefensible claims. ` +
                `Now nobody takes anything you say seriously — even the true things.<br><br>` +
                `<em>When your credibility hits zero, even your motte falls.</em>`;
            insight = '"Retreat to the motte too often, and eventually nobody believes you even there."';
            this.elua.adjustHumanity(-10);
        } else {
            // Mixed ending
            title = 'THE DEBATER';
            text = `Influence: ${Math.round(this.influence)}. Credibility: ${Math.round(this.credibility)}.<br>` +
                `Retreats: ${this.retreats}. Honest defenses: ${this.honestDefenses}. Exposures: ${this.exposedOpponent}.<br>` +
                `Claims remaining: ${totalClaims}. Abandoned: ${this.abandonedClaims.length}.<br><br>` +
                `You fought the rhetorical wars with a mix of honesty and strategy. ` +
                `Some retreats, some honest defenses, some bold claims that stuck.<br><br>` +
                `<em>Most debate looks like this: messy, imperfect, human.</em>`;
            insight = '"Every argument has a motte and a bailey. Knowing which is which is half the battle."';
            this.elua.adjustHumanity(5);
        }

        this.engine.endLevel(title, text, insight, false);
    }

    // ---- Debate Log ----

    addToLog(speaker, text) {
        this.debateLog.push({ speaker, text, time: this.time });
        // Keep log manageable
        if (this.debateLog.length > 30) this.debateLog.shift();

        const logEl = document.getElementById('debate-log-content');
        if (logEl) {
            const entry = document.createElement('div');
            entry.className = 'log-entry log-' + speaker.toLowerCase();
            entry.innerHTML = `<span class="log-speaker">${speaker}:</span> ${text}`;
            logEl.appendChild(entry);
            logEl.scrollTop = logEl.scrollHeight;
        }
    }

    // ---- Visuals ----

    spawnFloatingText(text, color) {
        this.particles.push({
            type: 'text',
            x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: this.canvas.height / 2 - 50,
            text, color, life: 2.5, maxLife: 2.5, vy: -35
        });
    }

    // ---- Update ----

    update(dt) {
        if (this.gameOver) return;
        this.time += dt;

        // Shake
        if (this.shakeTimer > 0) this.shakeTimer -= dt;
        if (this.flashTimer > 0) this.flashTimer -= dt;

        // Castle animation
        this.castleAnimOffset = Math.sin(this.time * 0.5) * 2;

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

        // Shake offset
        let sx = 0, sy = 0;
        if (this.shakeTimer > 0) {
            sx = (Math.random() - 0.5) * this.shakeIntensity;
            sy = (Math.random() - 0.5) * this.shakeIntensity;
        }
        ctx.save();
        ctx.translate(sx, sy);

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0e0818');
        grad.addColorStop(0.5, '#161030');
        grad.addColorStop(1, '#0a0612');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw the castle
        this.drawCastle(ctx, w, h);

        // Draw opponent castle (if in debate)
        if (this.currentOpponent && this.phase === 'debate') {
            this.drawOpponentCastle(ctx, w, h);
        }

        // Flash overlay
        if (this.flashTimer > 0 && this.flashColor) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashTimer * 0.3;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }

        // Draw Elua
        this.elua.setPosition(w * 0.35, h * 0.55);
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

        // Round indicator
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#8a8a9a';
        ctx.textAlign = 'center';
        ctx.fillText(`Round ${Math.min(this.roundNum, this.maxRounds)} / ${this.maxRounds} — ${this.phase.toUpperCase()}`, w / 2, h - 15);

        ctx.restore(); // undo shake
    }

    drawCastle(ctx, w, h) {
        const cx = w * 0.35;
        const baseY = h * 0.7;
        const ao = this.castleAnimOffset;

        // Bailey (outer wall)
        const baileyW = 200 + this.baileyClaims.length * 15;
        const baileyH = 60;
        ctx.fillStyle = 'rgba(100, 80, 60, 0.4)';
        ctx.strokeStyle = 'rgba(160, 130, 90, 0.6)';
        ctx.lineWidth = 2;
        ctx.fillRect(cx - baileyW / 2, baseY - baileyH + ao, baileyW, baileyH);
        ctx.strokeRect(cx - baileyW / 2, baseY - baileyH + ao, baileyW, baileyH);

        // Bailey label
        ctx.font = '10px Cinzel, serif';
        ctx.fillStyle = '#a09070';
        ctx.textAlign = 'center';
        ctx.fillText('BAILEY', cx, baseY + 15);

        // Bailey claims as blocks
        for (let i = 0; i < this.baileyClaims.length; i++) {
            const claim = this.baileyClaims[i];
            const bx = cx - baileyW / 2 + 10 + i * 28;
            const by = baseY - baileyH + 10 + ao;
            ctx.fillStyle = claim.honest ? 'rgba(240, 208, 96, 0.6)' : `${claim.color}88`;
            ctx.fillRect(bx, by, 24, 40);
            ctx.strokeStyle = claim.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, 24, 40);

            // Health dots
            for (let h2 = 0; h2 < claim.health; h2++) {
                ctx.fillStyle = '#4aaf5a';
                ctx.beginPath();
                ctx.arc(bx + 12, by + 44 + h2 * 5, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Motte (inner tower)
        const motteW = 60;
        const motteH = 90;
        ctx.fillStyle = 'rgba(80, 70, 90, 0.7)';
        ctx.strokeStyle = 'rgba(130, 120, 150, 0.8)';
        ctx.lineWidth = 2;
        ctx.fillRect(cx - motteW / 2, baseY - baileyH - motteH + ao, motteW, motteH);
        ctx.strokeRect(cx - motteW / 2, baseY - baileyH - motteH + ao, motteW, motteH);

        // Motte crenellations
        for (let i = 0; i < 5; i++) {
            const mx = cx - motteW / 2 + i * 14;
            ctx.fillStyle = 'rgba(80, 70, 90, 0.7)';
            ctx.fillRect(mx, baseY - baileyH - motteH - 8 + ao, 10, 8);
        }

        // Motte label
        ctx.font = '10px Cinzel, serif';
        ctx.fillStyle = '#a0a0b0';
        ctx.textAlign = 'center';
        ctx.fillText('MOTTE', cx, baseY - baileyH - motteH - 15 + ao);

        // Motte claims
        for (let i = 0; i < this.motteClaims.length; i++) {
            const claim = this.motteClaims[i];
            const mx = cx - 20 + i * 22;
            const my = baseY - baileyH - motteH + 15 + ao;
            ctx.fillStyle = `${claim.color}aa`;
            ctx.fillRect(mx, my, 18, 50);
            ctx.strokeStyle = claim.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(mx, my, 18, 50);
        }
    }

    drawOpponentCastle(ctx, w, h) {
        const cx = w * 0.72;
        const baseY = h * 0.7;
        const opp = this.currentOpponent;
        if (!opp) return;

        // Opponent bailey
        const activeClaims = opp.claims.filter(c => !c.exposed);
        const baileyW = 120 + activeClaims.length * 20;
        const baileyH = 50;

        ctx.fillStyle = 'rgba(100, 40, 40, 0.4)';
        ctx.strokeStyle = 'rgba(180, 60, 60, 0.5)';
        ctx.lineWidth = 2;
        ctx.fillRect(cx - baileyW / 2, baseY - baileyH, baileyW, baileyH);
        ctx.strokeRect(cx - baileyW / 2, baseY - baileyH, baileyW, baileyH);

        ctx.font = '10px Cinzel, serif';
        ctx.fillStyle = '#b06060';
        ctx.textAlign = 'center';
        ctx.fillText('OPPONENT', cx, baseY + 15);

        // Opponent claim blocks
        for (let i = 0; i < opp.claims.length; i++) {
            const claim = opp.claims[i];
            const bx = cx - baileyW / 2 + 10 + i * 35;
            const by = baseY - baileyH + 8;

            if (claim.exposed) {
                // Exposed — cracked/dim
                ctx.fillStyle = 'rgba(80, 40, 40, 0.3)';
                ctx.fillRect(bx, by, 28, 34);
                ctx.strokeStyle = '#804040';
                ctx.setLineDash([3, 3]);
                ctx.strokeRect(bx, by, 28, 34);
                ctx.setLineDash([]);
                ctx.font = '8px Inter, sans-serif';
                ctx.fillStyle = '#f0d060';
                ctx.fillText('EXPOSED', bx + 14, by + 20);
            } else {
                ctx.fillStyle = 'rgba(180, 60, 60, 0.5)';
                ctx.fillRect(bx, by, 28, 34);
                ctx.strokeStyle = '#c04040';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx, by, 28, 34);
                ctx.fillStyle = '#e08080';
                ctx.font = '7px Inter, sans-serif';
                ctx.fillText('?', bx + 14, by + 20);
            }
        }

        // Opponent motte (small tower)
        const motteW = 40;
        const motteH = 60;
        ctx.fillStyle = 'rgba(80, 30, 30, 0.6)';
        ctx.strokeStyle = 'rgba(140, 50, 50, 0.7)';
        ctx.lineWidth = 2;
        ctx.fillRect(cx - motteW / 2, baseY - baileyH - motteH, motteW, motteH);
        ctx.strokeRect(cx - motteW / 2, baseY - baileyH - motteH, motteW, motteH);
    }

    // ---- UI ----

    updateUI() {
        const influenceFill = document.getElementById('motte-influence-fill');
        if (influenceFill) influenceFill.style.width = Math.min(100, this.influence) + '%';

        const credFill = document.getElementById('motte-cred-fill');
        if (credFill) credFill.style.width = Math.min(100, this.credibility) + '%';

        const influenceVal = document.getElementById('motte-influence-val');
        if (influenceVal) influenceVal.textContent = Math.round(this.influence);

        const credVal = document.getElementById('motte-cred-val');
        if (credVal) credVal.textContent = Math.round(this.credibility);

        const roundEl = document.getElementById('motte-round');
        if (roundEl) roundEl.textContent = `Round ${Math.min(this.roundNum, this.maxRounds)} / ${this.maxRounds}`;

        const humFill = document.getElementById('humanity-fill-l8');
        if (humFill) humFill.style.width = this.elua.humanity + '%';

        const castleInfo = document.getElementById('castle-info');
        if (castleInfo) {
            castleInfo.textContent = `Bailey: ${this.baileyClaims.length}/${this.baileyCapacity} | ` +
                `Motte: ${this.motteClaims.length}/${this.motteCapacity} | ` +
                `Retreats: ${this.retreats} | Exposed: ${this.exposedOpponent}`;
        }
    }

    cleanup() {
        document.getElementById('motte-ui').style.display = 'none';
        document.getElementById('claims-panel').style.display = 'none';
        document.getElementById('debate-log-panel').style.display = 'none';
        document.getElementById('opponent-panel').style.display = 'none';
        document.getElementById('debate-choice-overlay').style.display = 'none';
        document.getElementById('attack-choice-overlay').style.display = 'none';
    }
}
