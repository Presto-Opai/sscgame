/* ======================================
   LEVEL 7: BOOK REVIEW — THE SECRET OF
   OUR SUCCESS

   Survival / Mystery Game

   Culture, not individual intelligence, is
   humanity's superpower. Reason is dangerous.
   Traditions encode wisdom we can't
   consciously access.
   ====================================== */

class Level07SecretSuccess {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Environment (randomly chosen) ----
        this.environments = [
            { id: 'arctic', name: 'The Arctic', color: '#a0d0e8', bgTop: '#1a2a3a', bgBot: '#0a1520',
              desc: 'Vast frozen tundra. The locals wear strange layered clothing and eat raw seal fat.' },
            { id: 'jungle', name: 'The Jungle', color: '#40a060', bgTop: '#0a2010', bgBot: '#051008',
              desc: 'Dense tropical forest. The locals process their staple crop through an elaborate ritual.' },
            { id: 'alabama', name: 'Alabama', color: '#c08040', bgTop: '#2a1a0a', bgBot: '#150d05',
              desc: 'Rural American South. The locals follow customs that seem arbitrary and outdated.' }
        ];
        this.env = this.environments[Math.floor(Math.random() * this.environments.length)];

        // ---- Player State ----
        this.health = 100;
        this.hunger = 0;       // 0 = full, 100 = starving
        this.warmth = 100;     // only matters in arctic
        this.intelligence = 95; // high — you're a smart rationalist
        this.culturalKnowledge = 0;
        this.humility = 0;
        this.daysSurvived = 0;
        this.maxDays = 40;
        this.dayTimer = 0;
        this.dayDuration = 5; // seconds per day

        // ---- Poison/Toxin Tracking ----
        this.toxinLevel = 0;      // accumulates from unprocessed food
        this.toxinSymptoms = 0;   // 0=none, 1=vague, 2=serious, 3=death
        this.teratogenExposed = false;

        // ---- Traditions ----
        this.traditions = this.buildTraditions();
        this.adoptedTraditions = {};
        this.rejectedTraditions = {};
        this.discoveredTruth = {};

        // ---- Scenarios (queue) ----
        this.scenarios = this.buildScenarios();
        this.currentScenario = null;
        this.scenarioIndex = 0;
        this.scenarioTimer = 0;
        this.scenarioInterval = 6;
        this.awaitingChoice = false;

        // ---- Locals ----
        this.localTrust = 30; // how much locals trust you
        this.localInteractions = 0;

        // ---- Epistemic Hell ----
        this.epistemicHellRevealed = false;

        // ---- Explorer Death Count (historical references) ----
        this.explorerDeaths = [
            'Burke and Wills starved surrounded by food the locals ate daily.',
            'Franklin\'s crew died of lead poisoning and scurvy — the Inuit thrived nearby.',
            'European settlers in Virginia starved while Powhatan fed their families.',
            'Dozens of polar expeditions failed where the Inuit lived comfortably for millennia.'
        ];
        this.deathQuoteIndex = 0;

        // ---- Reason vs Tradition Score ----
        this.reasonChoices = 0;
        this.traditionChoices = 0;
        this.synthesisChoices = 0;

        // ---- Visual ----
        this.particles = [];
        this.localNPCs = [];
        this.spawnLocals();
        this.weatherEffect = [];

        // ---- Show UI ----
        document.getElementById('survival-ui').style.display = 'block';
        document.getElementById('scenario-panel').style.display = 'block';
        document.getElementById('tradition-panel').style.display = 'block';
        document.getElementById('explorer-overlay').style.display = 'none';

        this.updateUI();

        this.engine.showMessage(
            `<strong>LEVEL 7: THE SECRET OF OUR SUCCESS</strong><br><br>` +
            `You are stranded in <em>${this.env.name}</em>.<br><br>` +
            `${this.env.desc}<br><br>` +
            `You are intelligent. You have reason. You can figure this out yourself.<br><br>` +
            `...Can\'t you?<br><br>` +
            `<em>"Culture, not individual intelligence, is humanity\'s superpower."</em>`
        );
    }

    // ---- Data ----

    buildTraditions() {
        const shared = [
            {
                id: 'food_processing', name: 'The Food Processing Ritual',
                visible: 'Locals soak, ferment, and sun-dry their staple crop for days. Wasteful and slow.',
                truth: 'Removes cyanogenic glycosides. Skipping any step leads to chronic cyanide poisoning.',
                false_explanation: '"The spirits demand we prepare it this way, or the crop will curse us."',
                benefit: 'health', magnitude: 30,
                danger_if_skipped: 'toxin', toxin_amount: 8
            },
            {
                id: 'hunting_ritual', name: 'The Bone-Reading Hunt',
                visible: 'Hunters read cracks in heated caribou bones to decide where to hunt. Obviously random.',
                truth: 'Randomization prevents caribou from learning hunter patterns. Logical hunting is predictable.',
                false_explanation: '"The bones speak the caribou\'s future path."',
                benefit: 'food', magnitude: 25,
                danger_if_skipped: 'hunger', hunger_amount: 15
            },
            {
                id: 'fish_taboo', name: 'The Shark-Skin Taboo',
                visible: 'Pregnant women avoid certain fish because "the baby will have shark skin." Superstitious nonsense.',
                truth: 'These fish contain mercury and teratogens. The false belief protects pregnancies.',
                false_explanation: '"Eating shark-touched fish gives babies rough skin like a shark."',
                benefit: 'cultural', magnitude: 20,
                danger_if_skipped: 'teratogen'
            },
            {
                id: 'clothing_layers', name: 'The Layering Custom',
                visible: 'Locals insist on specific layering order and materials. Seems like mere tradition.',
                truth: 'Vapor wicking, insulation gradients, wind resistance — evolved over generations of trial and death.',
                false_explanation: '"Our ancestors wore it this way. To change is disrespectful."',
                benefit: 'warmth', magnitude: 35,
                danger_if_skipped: 'cold', cold_amount: 20
            },
            {
                id: 'cooking_herbs', name: 'The Herb Mixture',
                visible: 'Locals add a specific blend of herbs to every meal. Tastes odd. Seems ceremonial.',
                truth: 'Contains antiparasitics and essential vitamins missing from the base diet.',
                false_explanation: '"The herb-spirit blesses the food and keeps evil away."',
                benefit: 'health', magnitude: 20,
                danger_if_skipped: 'health', health_loss: 5
            }
        ];
        return shared;
    }

    buildScenarios() {
        return [
            {
                id: 'manioc',
                title: 'THE MANIOC PROBLEM',
                text: 'You find the locals\' staple crop — manioc root. They process it through a ' +
                    'complicated multi-day ritual: soaking, scraping, fermenting, drying. You\'re hungry NOW.',
                choices: [
                    { label: 'Skip the ritual — just eat it. You\'re starving.', type: 'reason',
                      effect: () => { this.hunger -= 30; this.toxinLevel += 15; this.reasonChoices++;
                          this.spawnFloatingText('Fed! But...', '#c0a030'); }},
                    { label: 'Follow the full ritual, even though it takes days.', type: 'tradition',
                      effect: () => { this.hunger -= 20; this.culturalKnowledge += 10; this.traditionChoices++;
                          this.localTrust += 10; this.adoptedTraditions['food_processing'] = true;
                          this.spawnFloatingText('Slow but safe.', '#4aaf5a'); }},
                    { label: 'Ask the locals WHY they do each step, then follow.', type: 'synthesis',
                      effect: () => { this.hunger -= 20; this.culturalKnowledge += 15; this.synthesisChoices++;
                          this.localTrust += 5; this.adoptedTraditions['food_processing'] = true;
                          this.spawnFloatingText('Learning...', '#60c0e0');
                          this.engine.showMessage('"The spirits demand it," they say. The explanation is wrong. The practice is right.'); }}
                ]
            },
            {
                id: 'caribou',
                title: 'THE CARIBOU BONES',
                text: 'Hunting party time. The elder heats a caribou scapula and reads the cracks to ' +
                    'determine where to hunt. You KNOW the caribou were at the eastern river yesterday.',
                choices: [
                    { label: 'Ignore the bones. Go to the eastern river — that\'s where the caribou ARE.', type: 'reason',
                      effect: () => {
                          // 60% chance of failure — caribou learned to avoid the predictable spot
                          if (Math.random() < 0.6) {
                              this.hunger += 10; this.reasonChoices++;
                              this.spawnFloatingText('No caribou. They moved.', '#d44040');
                              this.engine.showMessage('The caribou weren\'t there. They\'ve learned to avoid places where they were spotted.');
                          } else {
                              this.hunger -= 25; this.reasonChoices++;
                              this.spawnFloatingText('Lucky catch!', '#4aaf5a');
                          }
                      }},
                    { label: 'Follow the bones. The cracks point northwest.', type: 'tradition',
                      effect: () => {
                          // 75% success — randomization works
                          if (Math.random() < 0.75) {
                              this.hunger -= 25; this.traditionChoices++; this.localTrust += 8;
                              this.adoptedTraditions['hunting_ritual'] = true;
                              this.spawnFloatingText('The bones were right!', '#4aaf5a');
                          } else {
                              this.hunger += 5; this.traditionChoices++;
                              this.spawnFloatingText('Unlucky hunt.', '#c0a030');
                          }
                      }},
                    { label: 'Suggest randomizing hunt locations — the bones are a randomizer.', type: 'synthesis',
                      effect: () => {
                          this.hunger -= 20; this.synthesisChoices++; this.culturalKnowledge += 10;
                          this.localTrust += 3;
                          this.spawnFloatingText('Insight gained.', '#60c0e0');
                          this.engine.showMessage(
                              'You realize: the bone-reading IS a randomization algorithm. ' +
                              'It works precisely BECAUSE it\'s random — the caribou can\'t predict it.<br><br>' +
                              'The locals\' "superstition" is game-theoretically optimal.'
                          );
                      }}
                ]
            },
            {
                id: 'shark_taboo',
                title: 'THE SHARK-SKIN TABOO',
                text: 'A pregnant local woman refuses the fish you caught. "The baby will get shark skin," ' +
                    'she says. The fish is perfectly good. This is obviously superstitious.',
                choices: [
                    { label: 'Insist the fish is safe. Explain there\'s no mechanism for "shark skin."', type: 'reason',
                      effect: () => { this.reasonChoices++; this.localTrust -= 15;
                          this.teratogenExposed = true; this.rejectedTraditions['fish_taboo'] = true;
                          this.spawnFloatingText('Trust lost.', '#d44040');
                          this.engine.showMessage(
                              'The locals are horrified. You\'ve challenged a deep taboo.<br><br>' +
                              'You\'re right that "shark skin" isn\'t a real mechanism. ' +
                              'But the fish contains methylmercury — a teratogen. The false belief protects a true outcome.'
                          ); }},
                    { label: 'Respect the taboo. Don\'t question it.', type: 'tradition',
                      effect: () => { this.traditionChoices++; this.localTrust += 10;
                          this.culturalKnowledge += 8; this.adoptedTraditions['fish_taboo'] = true;
                          this.spawnFloatingText('Taboo respected.', '#4aaf5a'); }},
                    { label: 'Accept the taboo, but quietly wonder what the real reason might be.', type: 'synthesis',
                      effect: () => { this.synthesisChoices++; this.culturalKnowledge += 15;
                          this.localTrust += 5; this.adoptedTraditions['fish_taboo'] = true;
                          this.discoveredTruth['fish_taboo'] = true;
                          this.spawnFloatingText('Wisdom grows.', '#60c0e0');
                          this.engine.showMessage(
                              'You follow the taboo while investigating quietly. ' +
                              'Weeks later, you notice: every pregnant woman who followed the taboo had healthy babies. ' +
                              'Every one who didn\'t... didn\'t.<br><br>' +
                              'The explanation was false. The practice was right.'
                          ); }}
                ]
            },
            {
                id: 'clothing',
                title: 'THE EXPLORER\'S HUBRIS',
                text: 'It\'s getting cold. The locals wear bizarre layered clothing — fur inside, then woven grass, ' +
                    'then an outer shell of treated hide. Your modern synthetic jacket seems obviously superior.',
                choices: [
                    { label: 'Wear your own clothes. Modern technology beats tradition.', type: 'reason',
                      effect: () => { this.reasonChoices++;
                          this.warmth -= 15;
                          this.spawnFloatingText('Getting cold...', '#a0d0e8');
                          this.engine.showMessage(
                              'Your synthetic jacket traps moisture. The wind cuts through at the seams. ' +
                              'The locals\' layering system — vapor-wicking inner, insulating middle, wind-proof outer — ' +
                              'was evolved over generations of actual deaths in this exact climate.'
                          ); }},
                    { label: 'Wear what the locals wear, exactly as they wear it.', type: 'tradition',
                      effect: () => { this.traditionChoices++; this.localTrust += 8;
                          this.warmth += 15; this.adoptedTraditions['clothing_layers'] = true;
                          this.spawnFloatingText('Warm!', '#4aaf5a'); }},
                    { label: 'Wear the local layers but try to understand the engineering.', type: 'synthesis',
                      effect: () => { this.synthesisChoices++; this.culturalKnowledge += 12;
                          this.warmth += 10; this.adoptedTraditions['clothing_layers'] = true;
                          this.spawnFloatingText('Understanding grows.', '#60c0e0');
                          this.engine.showMessage(
                              'You analyze the layering: the inner fur wicks moisture away from skin. ' +
                              'The middle layer traps air for insulation. The outer shell blocks wind.<br><br>' +
                              'This is better than your modern jacket — evolved through centuries of natural selection ' +
                              'where "failure" meant death.'
                          ); }}
                ]
            },
            {
                id: 'herbs',
                title: 'THE BLESSING HERBS',
                text: 'Every meal, the elder sprinkles a specific herb mixture and chants over it. ' +
                    '"To keep the evil spirits away," they explain. You\'re a rationalist. There are no evil spirits.',
                choices: [
                    { label: 'Eat without the herbs. You don\'t need superstitious blessings.', type: 'reason',
                      effect: () => { this.reasonChoices++;
                          this.health -= 8;
                          this.spawnFloatingText('Feeling off...', '#c0a030');
                          // Delayed effect
                          setTimeout(() => {
                              if (!this.gameOver) {
                                  this.engine.showMessage(
                                      'Weeks pass. You develop vitamin deficiencies and parasitic symptoms. ' +
                                      'Those herbs contained antiparasitics and essential micronutrients.<br><br>' +
                                      'The "evil spirits" were parasites. The "blessing" was medicine.'
                                  );
                              }
                          }, 8000);
                      }},
                    { label: 'Eat with the herbs. When in Rome.', type: 'tradition',
                      effect: () => { this.traditionChoices++; this.localTrust += 5;
                          this.health += 5; this.adoptedTraditions['cooking_herbs'] = true;
                          this.spawnFloatingText('Herbs taken.', '#4aaf5a'); }},
                    { label: 'Eat the herbs and try to identify each one botanically.', type: 'synthesis',
                      effect: () => { this.synthesisChoices++; this.culturalKnowledge += 10;
                          this.health += 5; this.adoptedTraditions['cooking_herbs'] = true;
                          this.discoveredTruth['cooking_herbs'] = true;
                          this.spawnFloatingText('Cataloguing...', '#60c0e0');
                          this.engine.showMessage(
                              'You identify: artemisia (antiparasitic), a local citrus (vitamin C), ' +
                              'and a mineral-rich bark (iron and zinc).<br><br>' +
                              'The "spiritual blessing" was a carefully evolved nutritional supplement.'
                          ); }}
                ]
            },
            {
                id: 'epistemic_hell',
                title: 'EPISTEMIC HELL',
                text: 'You\'ve been here long enough to notice a pattern: every local practice that works ' +
                    'is justified by an explanation that\'s WRONG. The beliefs are false. The practices are true. ' +
                    'You are in Epistemic Hell.',
                choices: [
                    { label: 'This is intolerable. Reason MUST prevail. Teach them the real explanations.', type: 'reason',
                      effect: () => { this.reasonChoices++; this.localTrust -= 20;
                          this.spawnFloatingText('They\'re not listening.', '#d44040');
                          this.engine.showMessage(
                              'You explain cyanide chemistry. They nod politely and ignore you.<br><br>' +
                              'You explain game theory. They smile and go back to their bones.<br><br>' +
                              'Your explanations are correct. But their traditions already solved these problems ' +
                              'without needing the explanations. Reason as the villain.'
                          ); }},
                    { label: 'Accept it. Follow the traditions, even when the reasons are wrong.', type: 'tradition',
                      effect: () => { this.traditionChoices++; this.localTrust += 15;
                          this.culturalKnowledge += 20; this.humility += 20;
                          this.spawnFloatingText('Humility.', '#4aaf5a');
                          this.engine.showMessage(
                              '"Why have we always done this?" is often a better epistemology than ' +
                              '"what makes sense to me right now?"<br><br>' +
                              'You swallow your pride and follow.<br><br>' +
                              '<em>Survive but never fully understand.</em>'
                          ); }},
                    { label: 'Hold both truths: the practices work AND the explanations are wrong.', type: 'synthesis',
                      effect: () => { this.synthesisChoices++; this.culturalKnowledge += 25;
                          this.humility += 15; this.localTrust += 8;
                          this.epistemicHellRevealed = true;
                          this.spawnFloatingText('Synthesis.', '#f0d060');
                          this.engine.showMessage(
                              '<strong>EPISTEMIC HELL — THE SYNTHESIS</strong><br><br>' +
                              'You can hold two truths simultaneously:<br>' +
                              '1. The explanations are wrong (no spirits, no shark-skin curse).<br>' +
                              '2. The practices are right (evolved over generations of natural selection).<br><br>' +
                              'Culture is an evolutionary algorithm. It encodes wisdom that no individual, ' +
                              'no matter how smart, could derive from first principles.<br><br>' +
                              '<em>Reason and tradition aren\'t enemies. They\'re different resolution levels of the same process.</em>'
                          ); }}
                ]
            }
        ];
    }

    spawnLocals() {
        for (let i = 0; i < 6; i++) {
            this.localNPCs.push({
                x: 200 + Math.random() * (this.canvas.width - 400),
                y: 250 + Math.random() * (this.canvas.height - 400),
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                size: 12 + Math.random() * 4,
                trustGlow: 0
            });
        }
    }

    // ---- Update ----

    update(dt) {
        if (this.gameOver) return;
        this.time += dt;

        // Day cycle
        this.dayTimer += dt;
        if (this.dayTimer >= this.dayDuration) {
            this.dayTimer -= this.dayDuration;
            this.processDay();
        }

        // Toxin effects
        if (this.toxinLevel > 0) {
            if (this.toxinLevel >= 30 && this.toxinSymptoms < 1) {
                this.toxinSymptoms = 1;
                this.spawnFloatingText('Feeling dizzy...', '#c0a030');
            }
            if (this.toxinLevel >= 60 && this.toxinSymptoms < 2) {
                this.toxinSymptoms = 2;
                this.spawnFloatingText('Numbness in hands...', '#d07040');
                this.engine.showMessage(
                    'Your fingers are tingling. Your vision blurs occasionally. ' +
                    'The locals who eat the same crop — processed the traditional way — are fine.<br><br>' +
                    'Short-term: you were fine. Medium-term: vague symptoms. Long-term...'
                );
            }
            if (this.toxinLevel >= 90) {
                this.toxinSymptoms = 3;
                this.health -= 50;
                this.engine.showMessage(
                    '<strong>CYANIDE POISONING</strong><br><br>' +
                    'The manioc you ate without processing contained cyanogenic glycosides. ' +
                    'The locals\' "pointless ritual" was removing poison.<br><br>' +
                    '<em>Short term: you\'re fine. Medium term: symptoms. Long term: death.</em>'
                );
            }
        }

        // Scenario presentation
        if (!this.awaitingChoice && !this.currentScenario) {
            this.scenarioTimer += dt;
            if (this.scenarioTimer >= this.scenarioInterval && this.scenarioIndex < this.scenarios.length) {
                this.scenarioTimer = 0;
                this.presentScenario(this.scenarios[this.scenarioIndex]);
            }
        }

        // Hunger and health drain
        if (this.hunger > 80) this.health -= dt * 3;
        if (this.warmth < 20 && this.env.id === 'arctic') this.health -= dt * 4;

        // Death check
        if (this.health <= 0 && !this.gameOver) {
            this.health = 0;
            this.endGame('death');
            return;
        }

        // Win check
        if (this.daysSurvived >= this.maxDays && !this.gameOver) {
            this.endGame('survive');
            return;
        }

        // Update local NPCs
        for (const npc of this.localNPCs) {
            npc.x += npc.vx * dt;
            npc.y += npc.vy * dt;
            // Bounce
            if (npc.x < 50 || npc.x > this.canvas.width - 50) npc.vx *= -1;
            if (npc.y < 100 || npc.y > this.canvas.height - 100) npc.vy *= -1;
            npc.trustGlow = this.localTrust / 100;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            p.y += p.vy * dt;
            if (p.vx) p.x += p.vx * dt;
        }

        // Weather
        if (this.env.id === 'arctic' && Math.random() < dt * 3) {
            this.weatherEffect.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                vy: 60 + Math.random() * 40,
                vx: -20 + Math.random() * 10,
                life: 3
            });
        }
        for (let i = this.weatherEffect.length - 1; i >= 0; i--) {
            const w = this.weatherEffect[i];
            w.x += (w.vx || 0) * dt;
            w.y += w.vy * dt;
            w.life -= dt;
            if (w.life <= 0 || w.y > this.canvas.height) this.weatherEffect.splice(i, 1);
        }

        this.updateUI();
    }

    processDay() {
        this.daysSurvived++;

        // Daily hunger increase
        this.hunger = Math.min(100, this.hunger + 8);

        // Warmth decay in arctic
        if (this.env.id === 'arctic') {
            this.warmth = Math.max(0, this.warmth - 5);
            if (this.adoptedTraditions['clothing_layers']) this.warmth = Math.min(100, this.warmth + 8);
        }

        // Herb benefits
        if (this.adoptedTraditions['cooking_herbs']) {
            this.health = Math.min(100, this.health + 2);
        }

        // Hunting tradition
        if (this.adoptedTraditions['hunting_ritual']) {
            this.hunger = Math.max(0, this.hunger - 6);
        }

        // Toxin accumulation if eating unprocessed food
        if (this.toxinLevel > 0 && !this.adoptedTraditions['food_processing']) {
            this.toxinLevel += 3;
        }

        // Health regen if above survival threshold
        if (this.hunger < 50 && this.health < 100) {
            this.health = Math.min(100, this.health + 1);
        }

        // Explorer death quote at certain days
        if (this.daysSurvived % 10 === 0 && this.deathQuoteIndex < this.explorerDeaths.length) {
            this.engine.showMessage(
                '<em>"' + this.explorerDeaths[this.deathQuoteIndex] + '"</em><br><br>' +
                '<small>— Historical record</small>'
            );
            this.deathQuoteIndex++;
        }
    }

    presentScenario(scenario) {
        this.currentScenario = scenario;
        this.awaitingChoice = true;
        this.scenarioIndex++;

        const panel = document.getElementById('scenario-choices');
        panel.innerHTML = '';

        for (const choice of scenario.choices) {
            const btn = document.createElement('button');
            btn.className = 'scenario-btn scenario-' + choice.type;
            btn.textContent = choice.label;
            btn.addEventListener('click', () => {
                if (!this.awaitingChoice) return;
                this.awaitingChoice = false;
                choice.effect();
                this.currentScenario = null;
                this.updateScenarioPanel();
                this.updateUI();
            });
            panel.appendChild(btn);
        }

        document.getElementById('scenario-title').textContent = scenario.title;
        document.getElementById('scenario-text').textContent = scenario.text;
        this.updateScenarioPanel();
    }

    updateScenarioPanel() {
        const titleEl = document.getElementById('scenario-title');
        const textEl = document.getElementById('scenario-text');
        const choicesEl = document.getElementById('scenario-choices');

        if (this.currentScenario) {
            titleEl.textContent = this.currentScenario.title;
            textEl.textContent = this.currentScenario.text;
        } else {
            titleEl.textContent = 'WAITING...';
            textEl.textContent = this.scenarioIndex >= this.scenarios.length ?
                'All scenarios encountered. Survive to the end.' :
                'Observing the locals...';
            choicesEl.innerHTML = '';
        }
    }

    // ---- End ----

    endGame(type) {
        this.gameOver = true;
        const adopted = Object.keys(this.adoptedTraditions).length;
        const rejected = Object.keys(this.rejectedTraditions).length;
        const truths = Object.keys(this.discoveredTruth).length;

        let title, text, insight;

        if (type === 'death') {
            title = 'THE EXPLORER\'S FATE';
            text = `You survived ${this.daysSurvived} days in ${this.env.name}.<br><br>` +
                `Traditions adopted: ${adopted}. Rejected: ${rejected}.<br>` +
                `Reason choices: ${this.reasonChoices}. Tradition choices: ${this.traditionChoices}. Synthesis: ${this.synthesisChoices}.<br><br>` +
                `You were smart. You were rational. You were dead.<br><br>` +
                `<em>"${this.explorerDeaths[0]}"</em><br><br>` +
                'Individual intelligence is not enough. Culture is humanity\'s superpower.';
            insight = '"Reason is the villain" — your intelligence actively hurt you when it overrode millennia of cultural evolution.';
            this.elua.adjustHumanity(-10);
        } else if (this.synthesisChoices >= 3) {
            // Hard mode: synthesis of reason and tradition
            title = 'THE SYNTHESIS';
            text = `You survived all ${this.maxDays} days in ${this.env.name}.<br><br>` +
                `Traditions adopted: ${adopted}. Truths discovered: ${truths}.<br>` +
                `Reason: ${this.reasonChoices}. Tradition: ${this.traditionChoices}. Synthesis: ${this.synthesisChoices}.<br><br>` +
                `You found the narrow path: follow the traditions AND understand why they work. ` +
                `The explanations are wrong, but the practices encode genuine wisdom.<br><br>` +
                `Culture is an evolutionary algorithm running on whole populations over centuries. ` +
                `No individual mind can replicate that — but a mind CAN learn to trust the output ` +
                `while investigating the mechanism.<br><br>` +
                '<em>The synthesis: humility about your limits, curiosity about the truth.</em>';
            insight = '"Culture is an evolutionary algorithm. Individual reason is a debugger — useful, but don\'t delete the codebase."';
            this.elua.adjustHumanity(15);
        } else if (this.traditionChoices > this.reasonChoices) {
            // Tradition path: survive but never understand
            title = 'THE CONVERT';
            text = `You survived all ${this.maxDays} days in ${this.env.name}.<br><br>` +
                `Traditions adopted: ${adopted}. Local trust: ${Math.round(this.localTrust)}%.<br>` +
                `Reason: ${this.reasonChoices}. Tradition: ${this.traditionChoices}.<br><br>` +
                `You followed the locals. You survived. You never fully understood why the traditions worked, ` +
                `but you learned to trust them.<br><br>` +
                '<em>"Why have we always done this?" turns out to be a surprisingly good epistemology.</em>';
            insight = '"Traditions encode wisdom we can\'t consciously access. Trust the algorithm even when you can\'t read the source code."';
            this.elua.adjustHumanity(10);
        } else {
            // Reason-heavy: survived but damaged
            title = 'THE STUBBORN RATIONALIST';
            text = `You survived ${this.daysSurvived} days in ${this.env.name}, battered but alive.<br><br>` +
                `Traditions adopted: ${adopted}. Rejected: ${rejected}.<br>` +
                `Reason: ${this.reasonChoices}. Tradition: ${this.traditionChoices}.<br><br>` +
                `Your intelligence got you through — barely. But every time you overrode tradition with reason, ` +
                `you paid a price you didn't expect.<br><br>` +
                '<em>Reason is powerful. But it\'s not enough.</em>';
            insight = '"The secret of our success is not individual intelligence — it\'s cumulative cultural evolution."';
            this.elua.adjustHumanity(3);
        }

        this.engine.endLevel(title, text, insight, false);
    }

    // ---- Visuals ----

    spawnFloatingText(text, color) {
        this.particles.push({
            type: 'text', x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: this.canvas.height / 2 - 30,
            text, color, life: 2.5, maxLife: 2.5, vy: -35
        });
    }

    // ---- Draw ----

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, this.env.bgTop);
        grad.addColorStop(1, this.env.bgBot);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Environment-specific ground
        this.drawEnvironment(ctx, w, h);

        // Weather (snow, rain, etc.)
        this.drawWeather(ctx);

        // Draw local NPCs
        this.drawLocals(ctx);

        // Draw Elua
        this.elua.setPosition(w / 2, h / 2 + 30);
        this.elua.draw(ctx);

        // Day/night cycle overlay
        const dayProgress = this.dayTimer / this.dayDuration;
        const nightAlpha = dayProgress > 0.7 ? (dayProgress - 0.7) / 0.3 * 0.3 : dayProgress < 0.2 ? (0.2 - dayProgress) / 0.2 * 0.3 : 0;
        if (nightAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 20, ${nightAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Draw tradition markers
        this.drawTraditionMarkers(ctx, w, h);

        // Draw toxin warning
        if (this.toxinLevel > 20) {
            ctx.save();
            ctx.globalAlpha = Math.min(0.5, this.toxinLevel / 100);
            ctx.fillStyle = '#400a20';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

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

        // Day counter
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#8a8a9a';
        ctx.textAlign = 'center';
        ctx.fillText(`Day ${this.daysSurvived} / ${this.maxDays} — ${this.env.name}`, w / 2, h - 15);

        // Humility indicator
        if (this.humility > 0) {
            ctx.font = '11px Caveat, cursive';
            ctx.fillStyle = `rgba(240, 208, 96, ${Math.min(0.8, this.humility / 50)})`;
            ctx.textAlign = 'right';
            ctx.fillText(`Humility: ${Math.round(this.humility)}`, w - 20, h - 15);
        }
    }

    drawEnvironment(ctx, w, h) {
        // Ground plane
        const groundY = h * 0.65;
        ctx.fillStyle = this.env.id === 'arctic' ? '#c8d8e8' :
                        this.env.id === 'jungle' ? '#1a3020' : '#6a5030';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, groundY, w, h - groundY);
        ctx.globalAlpha = 1;

        // Environment details
        if (this.env.id === 'arctic') {
            // Snow drifts
            ctx.fillStyle = 'rgba(200, 220, 240, 0.15)';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.ellipse(w * (0.1 + i * 0.2), groundY + 20, 80 + i * 10, 15, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.env.id === 'jungle') {
            // Trees
            ctx.fillStyle = 'rgba(30, 80, 40, 0.4)';
            for (let i = 0; i < 8; i++) {
                const tx = 50 + i * (w / 8);
                ctx.beginPath();
                ctx.moveTo(tx, groundY - 60);
                ctx.lineTo(tx - 25, groundY);
                ctx.lineTo(tx + 25, groundY);
                ctx.fill();
            }
        } else {
            // Alabama: houses/fields
            ctx.strokeStyle = 'rgba(150, 120, 80, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const bx = 100 + i * (w / 4);
                ctx.strokeRect(bx, groundY - 30, 40, 30);
                ctx.beginPath();
                ctx.moveTo(bx - 5, groundY - 30);
                ctx.lineTo(bx + 20, groundY - 50);
                ctx.lineTo(bx + 45, groundY - 30);
                ctx.stroke();
            }
        }
    }

    drawWeather(ctx) {
        if (this.env.id === 'arctic') {
            ctx.fillStyle = '#e0e8f0';
            for (const w of this.weatherEffect) {
                ctx.globalAlpha = w.life / 3 * 0.6;
                ctx.beginPath();
                ctx.arc(w.x, w.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }

    drawLocals(ctx) {
        for (const npc of this.localNPCs) {
            ctx.save();
            // Trust glow
            if (npc.trustGlow > 0.3) {
                ctx.globalAlpha = (npc.trustGlow - 0.3) * 0.5;
                ctx.fillStyle = this.env.color;
                ctx.beginPath();
                ctx.arc(npc.x, npc.y, npc.size + 8, 0, Math.PI * 2);
                ctx.fill();
            }
            // Body
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = this.env.color;
            ctx.beginPath();
            ctx.arc(npc.x, npc.y - npc.size * 0.6, npc.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(npc.x - npc.size * 0.25, npc.y - npc.size * 0.2, npc.size * 0.5, npc.size * 0.7);
            ctx.restore();
        }
    }

    drawTraditionMarkers(ctx, w, h) {
        const adopted = Object.keys(this.adoptedTraditions);
        if (adopted.length === 0) return;

        const startX = 60;
        const y = h - 55;

        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'left';

        for (let i = 0; i < adopted.length; i++) {
            const tradition = this.traditions.find(t => t.id === adopted[i]);
            if (!tradition) continue;

            const x = startX + i * 110;
            ctx.fillStyle = 'rgba(74, 175, 90, 0.3)';
            ctx.fillRect(x, y, 100, 18);
            ctx.fillStyle = '#4aaf5a';
            ctx.fillText(tradition.name.substring(0, 15), x + 4, y + 12);

            // Check mark if truth discovered
            if (this.discoveredTruth[adopted[i]]) {
                ctx.fillStyle = '#f0d060';
                ctx.fillText('\u2713', x + 88, y + 12);
            }
        }
    }

    // ---- UI ----

    updateUI() {
        const healthFill = document.getElementById('survival-health-fill');
        if (healthFill) healthFill.style.width = this.health + '%';

        const hungerFill = document.getElementById('survival-hunger-fill');
        if (hungerFill) hungerFill.style.width = this.hunger + '%';

        const warmthFill = document.getElementById('survival-warmth-fill');
        if (warmthFill) {
            warmthFill.style.width = this.warmth + '%';
            warmthFill.parentElement.parentElement.style.display =
                this.env.id === 'arctic' ? 'flex' : 'none';
        }

        const trustFill = document.getElementById('survival-trust-fill');
        if (trustFill) trustFill.style.width = Math.min(100, this.localTrust) + '%';

        const dayEl = document.getElementById('survival-day');
        if (dayEl) dayEl.textContent = `Day ${this.daysSurvived} / ${this.maxDays}`;

        const cultureEl = document.getElementById('survival-culture');
        if (cultureEl) cultureEl.textContent = Math.round(this.culturalKnowledge);

        const humFill = document.getElementById('humanity-fill-l7');
        if (humFill) humFill.style.width = this.elua.humanity + '%';
    }

    cleanup() {
        document.getElementById('survival-ui').style.display = 'none';
        document.getElementById('scenario-panel').style.display = 'none';
        document.getElementById('tradition-panel').style.display = 'none';
        document.getElementById('explorer-overlay').style.display = 'none';
    }
}
