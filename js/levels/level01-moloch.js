/* ======================================
   LEVEL 1: MEDITATIONS ON MOLOCH
   Tower Defense / Reverse Tower Defense

   Coordination failures, multipolar traps,
   and the demon god of optimization who
   demands you sacrifice everything good
   for competitive advantage.
   ====================================== */

class Level01Moloch {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        // ---- World State ----
        this.time = 0;
        this.phase = 'idyllic';  // 'idyllic', 'pressure', 'moloch_rising', 'moloch_active'
        this.phaseTimer = 0;
        this.gameOver = false;

        // Island geometry
        this.islandCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        this.islandRadius = Math.min(this.canvas.width, this.canvas.height) * 0.38;

        // Place Elua at center
        this.elua.setPosition(this.islandCenter.x, this.islandCenter.y - 30);

        // ---- Resources ----
        this.resources = {
            food: 50,
            culture: 20,
            knowledge: 10,
            population: 5,
            maxPopulation: 10
        };

        // ---- Buildings ----
        this.buildings = [];
        this.buildingIdCounter = 0;
        this.selectedBuildType = null;
        this.selectedBuilding = null;
        this.linkMode = false;
        this.linkFirst = null;

        // Building costs
        this.costs = {
            house:      { food: 15, culture: 0,  knowledge: 0 },
            farm:       { food: 5,  culture: 0,  knowledge: 0 },
            school:     { food: 10, culture: 0,  knowledge: 5 },
            art_studio: { food: 10, culture: 5,  knowledge: 0 },
            garden:     { food: 30, culture: 20, knowledge: 20 }
        };

        // ---- Citizens ----
        this.citizens = [];
        for (let i = 0; i < 5; i++) {
            this.spawnCitizen();
        }

        // ---- Moloch ----
        this.moloch = {
            power: 0,           // 0-100
            visible: false,
            x: this.islandCenter.x,
            y: this.islandCenter.y,
            height: 0,          // rises from 0 to full
            maxHeight: 120,
            pullStrength: 0,
            glowIntensity: 0,
            awakenTimer: 0
        };

        // ---- Coordination Links ----
        this.links = [];

        // ---- Garden Win Condition ----
        this.gardenTimer = 0;
        this.gardenBuilding = null;
        this.gardenRequired = 60;  // seconds

        // ---- Hidden ending tracker ----
        this.totalOptimizations = 0;
        this.voluntaryFeedCount = 0;
        this.hiddenEndingTriggered = false;

        // ---- Dream Time ----
        this.dreamTimeActive = false;
        this.dreamTimeTimer = 0;
        this.dreamTimeCooldown = 0;
        this.nextDreamTime = 45; // first dream time at 45s

        // ---- Ginsberg Quotes ----
        this.ginsbergQuotes = [
            "Moloch whose mind is pure machinery!",
            "Moloch whose blood is running money!",
            "Moloch whose fingers are ten armies!",
            "Moloch whose breast is a cannibal dynamo!",
            "Moloch whose ear is a smoking tomb!",
            "Moloch in whom I sit lonely!",
            "Moloch who frightened me out of my natural ecstasy!",
            "Moloch whose soul is electricity and banks!"
        ];
        this.nextGinsbergAt = 0.15; // moloch power threshold
        this.ginsbergIndex = 0;

        // ---- Visual ----
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        this.particles = [];
        this.casinoSpawned = false;

        // Show Level 1 UI
        document.getElementById('top-bar').style.display = 'flex';
        document.getElementById('build-panel').style.display = 'flex';

        // Setup UI
        this.setupBuildButtons();
        this.setupActionPanel();
        this.setupCoordinationPanel();

        // Intro message
        this.engine.showMessage(
            "You are <b>Elua</b>, a small spark of human values.<br><br>" +
            "Before you lies a pristine island. Build a civilization here &mdash; " +
            "farms for sustenance, schools for wisdom, art studios for beauty, " +
            "houses for your people.<br><br>" +
            "But beware: as resources grow scarce, <b>optimization pressures</b> will emerge. " +
            "Something ancient stirs beneath the island...",
            () => {
                this.engine.showMessage(
                    "<i>\"The universe is a dark and foreboding place, suspended between alien deities...\"</i><br><br>" +
                    "Click the build buttons below, then click on the island to place buildings.<br>" +
                    "Right-click a building to see options.",
                    null
                );
            }
        );
    }

    // ===============================
    //  UI SETUP
    // ===============================

    setupBuildButtons() {
        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.building;
                if (type === 'garden' && !this.canBuildGarden()) return;

                if (this.selectedBuildType === type) {
                    this.selectedBuildType = null;
                    btn.classList.remove('selected');
                } else {
                    document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('selected'));
                    this.selectedBuildType = type;
                    btn.classList.add('selected');
                }
                this.selectedBuilding = null;
                document.getElementById('action-panel').style.display = 'none';
            };
        });

        // Enable/disable garden button based on state
        this.updateGardenButton();
    }

    setupActionPanel() {
        // Handled dynamically when building is selected
    }

    setupCoordinationPanel() {
        document.getElementById('btn-link').onclick = () => {
            this.linkMode = !this.linkMode;
            this.linkFirst = null;
            document.getElementById('btn-link').textContent = this.linkMode ? 'Cancel Link' : 'Link Buildings';
            document.getElementById('coord-info').textContent = this.linkMode
                ? 'Click two buildings to link them for coordination.'
                : 'Link buildings to resist Moloch. Select two buildings to link.';
        };
    }

    // ===============================
    //  BUILDING MANAGEMENT
    // ===============================

    canAfford(type) {
        const cost = this.costs[type];
        if (!cost) return false;
        return this.resources.food >= cost.food &&
               this.resources.culture >= cost.culture &&
               this.resources.knowledge >= cost.knowledge;
    }

    canBuildGarden() {
        // Need 5+ unoptimized linked buildings and Moloch active
        const unoptimized = this.buildings.filter(b => !b.optimized && !b.destroyed);
        const linkedUnopt = unoptimized.filter(b => this.getLinksFor(b.id).length > 0);
        return linkedUnopt.length >= 5 && this.moloch.power >= 70;
    }

    updateGardenButton() {
        const btn = document.querySelector('.build-btn[data-building="garden"]');
        if (btn) {
            btn.disabled = !this.canBuildGarden();
        }
    }

    placeBuilding(type, x, y) {
        if (!this.canAfford(type)) return null;
        if (!this.isOnIsland(x, y)) return null;

        // Check not too close to another building
        for (const b of this.buildings) {
            const dist = Math.hypot(b.x - x, b.y - y);
            if (dist < 50) return null;
        }

        // Check not on Moloch
        if (this.moloch.visible) {
            const dist = Math.hypot(this.moloch.x - x, this.moloch.y - y);
            if (dist < 60) return null;
        }

        const cost = this.costs[type];
        this.resources.food -= cost.food;
        this.resources.culture -= cost.culture;
        this.resources.knowledge -= cost.knowledge;

        const building = {
            id: this.buildingIdCounter++,
            type,
            x, y,
            optimized: false,
            optimizedType: null,
            health: 100,
            destroyed: false,
            citizenSlots: type === 'house' ? 5 : 2,
            citizensAssigned: 0,
            production: this.getBaseProduction(type),
            metastasized: false,
            pullOffset: { x: 0, y: 0 },  // Moloch pull displacement
            defectionTimer: 0,
            coordinating: true
        };

        this.buildings.push(building);

        // Houses increase max pop
        if (type === 'house') {
            this.resources.maxPopulation += 5;
        }

        return building;
    }

    getBaseProduction(type) {
        switch (type) {
            case 'farm': return { food: 3, culture: 0, knowledge: 0 };
            case 'school': return { food: 0, culture: 0, knowledge: 2 };
            case 'art_studio': return { food: 0, culture: 2, knowledge: 0 };
            case 'house': return { food: 0, culture: 0.5, knowledge: 0 };
            case 'garden': return { food: 1, culture: 3, knowledge: 2 };
            default: return { food: 0, culture: 0, knowledge: 0 };
        }
    }

    optimizeBuilding(building) {
        if (building.optimized || building.destroyed) return;

        building.optimized = true;
        this.totalOptimizations++;
        this.moloch.power = Math.min(100, this.moloch.power + 5);

        switch (building.type) {
            case 'art_studio':
                building.optimizedType = 'content_farm';
                building.production = { food: 0, culture: 5, knowledge: 0 };
                // Culture from content farm is hollow — doesn't count for humanity
                break;
            case 'school':
                building.optimizedType = 'test_prep';
                building.production = { food: 0, culture: 0, knowledge: 5 };
                break;
            case 'farm':
                building.optimizedType = 'factory_farm';
                building.production = { food: 8, culture: 0, knowledge: 0 };
                // Pollution: damages nearby buildings over time
                break;
            case 'house':
                building.optimizedType = 'tenement';
                building.citizenSlots = 12;
                building.production = { food: 0, culture: 0, knowledge: 0 };
                break;
        }

        // Flash Ginsberg if threshold crossed
        this.checkGinsberg();

        // Elua loses humanity
        this.elua.adjustHumanity(-5);
        this.elua.addScar('optimization_' + building.type);
    }

    destroyBuilding(building) {
        building.destroyed = true;
        building.health = 0;
        // Remove links
        this.links = this.links.filter(l => l.a !== building.id && l.b !== building.id);
        // Spawn debris particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: building.x, y: building.y,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                life: 1.5,
                color: building.optimized ? '#d45a1a' : '#8a8a9a',
                size: Math.random() * 3 + 1
            });
        }
    }

    feedToMoloch(building) {
        this.destroyBuilding(building);
        this.voluntaryFeedCount++;
        this.moloch.power = Math.max(0, this.moloch.power - 3);

        // Check hidden ending
        const activeBuildings = this.buildings.filter(b => !b.destroyed);
        if (activeBuildings.length === 0 && this.moloch.power < 50) {
            this.triggerHiddenEnding();
        }
    }

    // ===============================
    //  CITIZENS
    // ===============================

    spawnCitizen() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.islandRadius * 0.6;
        this.citizens.push({
            x: this.islandCenter.x + Math.cos(angle) * dist,
            y: this.islandCenter.y + Math.sin(angle) * dist,
            vx: 0, vy: 0,
            colorful: true,    // true = colorful, false = grey (zombified)
            targetX: null, targetY: null,
            wanderTimer: Math.random() * 3,
            zombified: false,
            feedTimer: 0
        });
    }

    // ===============================
    //  COORDINATION LINKS
    // ===============================

    addLink(idA, idB) {
        if (idA === idB) return;
        if (this.links.find(l => (l.a === idA && l.b === idB) || (l.a === idB && l.b === idA))) return;
        this.links.push({ a: idA, b: idB, strength: 100, defected: false });
    }

    getLinksFor(buildingId) {
        return this.links.filter(l => l.a === buildingId || l.b === buildingId);
    }

    // ===============================
    //  UPDATE
    // ===============================

    update(dt) {
        if (this.gameOver) return;

        this.time += dt;
        this.phaseTimer += dt;

        // Phase progression
        this.updatePhase(dt);

        // Handle input
        this.handleInput();

        // Resource production
        this.updateResources(dt);

        // Population growth
        this.updatePopulation(dt);

        // Citizens
        this.updateCitizens(dt);

        // Moloch
        this.updateMoloch(dt);

        // Coordination links
        this.updateLinks(dt);

        // Dream time
        this.updateDreamTime(dt);

        // Metastasis (cancer cells)
        this.updateMetastasis(dt);

        // Casino check
        this.updateCasino(dt);

        // Pollution from factory farms
        this.updatePollution(dt);

        // Garden win condition
        this.updateGardenCondition(dt);

        // Particles
        this.updateParticles(dt);

        // Update UI
        this.updateUI();

        // Update garden button
        this.updateGardenButton();
    }

    updatePhase(dt) {
        const activeBuildings = this.buildings.filter(b => !b.destroyed).length;

        if (this.phase === 'idyllic' && (this.time > 30 || this.resources.population > 15 || activeBuildings > 6)) {
            this.phase = 'pressure';
            this.engine.showMessage(
                "Your island grows crowded. Resources thin.<br><br>" +
                "You notice your buildings can be <b>upgraded</b> &mdash; right-click a building to see options. " +
                "But every upgrade comes with a cost beyond resources...<br><br>" +
                "<i>The Faustian bargain presents itself.</i>"
            );
        }

        if (this.phase === 'pressure' && (this.moloch.power > 20 || this.time > 60)) {
            this.phase = 'moloch_rising';
            this.moloch.visible = true;
            this.engine.showMessage(
                "The ground trembles. From the center of the island, " +
                "a massive stone figure begins to rise.<br><br>" +
                "<b>MOLOCH</b> does not attack. He <i>pulls</i>.<br><br>" +
                "Your buildings drift toward him. Your citizens walk, zombie-like, " +
                "toward his furnace. The only resistance is <b>coordination</b>.",
                () => {
                    document.getElementById('coordination-panel').style.display = 'block';
                    this.engine.showGinsberg(this.ginsbergQuotes[0]);
                    this.ginsbergIndex = 1;
                }
            );
        }

        if (this.phase === 'moloch_rising' && this.moloch.power >= 70) {
            this.phase = 'moloch_active';
            this.engine.showMessage(
                "Moloch is fully awake. His pull is relentless.<br><br>" +
                "But there is hope. If you can maintain <b>5 un-optimized, coordinated buildings</b> " +
                "long enough, you can build a <b>Garden</b> &mdash; proof that beauty can survive " +
                "in the shadow of the machine god.<br><br>" +
                "<i>Sustain the Garden for 60 seconds to win.</i>"
            );
        }
    }

    handleInput() {
        const mx = this.engine.mouse.x;
        const my = this.engine.mouse.y;

        // Left click
        if (this.engine.mouse.clicked) {
            if (this.linkMode) {
                // Try to select a building for linking
                const clicked = this.getBuildingAt(mx, my);
                if (clicked && !clicked.destroyed) {
                    if (!this.linkFirst) {
                        this.linkFirst = clicked;
                        document.getElementById('coord-info').textContent =
                            'Selected ' + this.getBuildingDisplayName(clicked) + '. Click another building to link.';
                    } else {
                        if (clicked.id !== this.linkFirst.id) {
                            this.addLink(this.linkFirst.id, clicked.id);
                            document.getElementById('coord-info').textContent = 'Link created!';
                        }
                        this.linkFirst = null;
                        this.linkMode = false;
                        document.getElementById('btn-link').textContent = 'Link Buildings';
                    }
                }
            } else if (this.selectedBuildType) {
                // Place building
                const placed = this.placeBuilding(this.selectedBuildType, mx, my);
                if (placed) {
                    // Deselect after placing
                    if (!this.engine.keys['ShiftLeft'] && !this.engine.keys['ShiftRight']) {
                        this.selectedBuildType = null;
                        document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('selected'));
                    }
                }
            } else {
                // Try to select a building
                const clicked = this.getBuildingAt(mx, my);
                if (clicked && !clicked.destroyed) {
                    this.selectBuilding(clicked);
                } else {
                    this.selectedBuilding = null;
                    document.getElementById('action-panel').style.display = 'none';
                }
            }
        }

        // Right click — select building for actions
        if (this.engine.mouse.rightClicked) {
            const clicked = this.getBuildingAt(mx, my);
            if (clicked && !clicked.destroyed) {
                this.selectBuilding(clicked);
            }
        }

        // Move Elua toward mouse when holding
        if (this.engine.mouse.down && !this.selectedBuildType && !this.linkMode) {
            const dx = mx - this.elua.x;
            const dy = my - this.elua.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 5) {
                const speed = 120;
                this.elua.setPosition(
                    this.elua.x + (dx / dist) * speed * (1 / 60),
                    this.elua.y + (dy / dist) * speed * (1 / 60)
                );
            }
        }
    }

    getBuildingAt(x, y) {
        for (const b of this.buildings) {
            if (b.destroyed) continue;
            const dist = Math.hypot((b.x + b.pullOffset.x) - x, (b.y + b.pullOffset.y) - y);
            if (dist < 25) return b;
        }
        return null;
    }

    selectBuilding(building) {
        this.selectedBuilding = building;
        this.selectedBuildType = null;
        document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('selected'));

        const panel = document.getElementById('action-panel');
        const title = document.getElementById('action-title');
        const buttons = document.getElementById('action-buttons');

        title.textContent = this.getBuildingDisplayName(building);
        buttons.innerHTML = '';

        // Optimize option (if not already and phase allows)
        if (!building.optimized && this.phase !== 'idyllic' && building.type !== 'garden') {
            const optBtn = document.createElement('button');
            optBtn.className = 'action-btn danger';
            optBtn.textContent = 'Optimize: ' + this.getOptimizeName(building.type);
            optBtn.onclick = () => {
                this.optimizeBuilding(building);
                this.selectBuilding(building); // refresh panel
            };
            buttons.appendChild(optBtn);
        }

        // Feed to Moloch (if visible)
        if (this.moloch.visible) {
            const feedBtn = document.createElement('button');
            feedBtn.className = 'action-btn danger';
            feedBtn.textContent = 'Feed to Moloch';
            feedBtn.onclick = () => {
                this.feedToMoloch(building);
                panel.style.display = 'none';
            };
            buttons.appendChild(feedBtn);
        }

        // Info
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'font-size:0.65rem; color:#8a8a9a; margin-top:0.5em; line-height:1.4;';
        infoDiv.innerHTML = `Health: ${Math.floor(building.health)}%<br>`;
        if (building.optimized) {
            infoDiv.innerHTML += `<span style="color:#d45a1a;">OPTIMIZED</span><br>`;
        }
        const bLinks = this.getLinksFor(building.id);
        if (bLinks.length > 0) {
            infoDiv.innerHTML += `Links: ${bLinks.length}<br>`;
        }
        infoDiv.innerHTML += `Produces: `;
        const prod = building.production;
        const parts = [];
        if (prod.food > 0) parts.push(`${prod.food} food`);
        if (prod.culture > 0) parts.push(`${prod.culture} culture`);
        if (prod.knowledge > 0) parts.push(`${prod.knowledge} knowledge`);
        infoDiv.innerHTML += parts.join(', ') || 'nothing';
        buttons.appendChild(infoDiv);

        panel.style.display = 'block';
    }

    getBuildingDisplayName(b) {
        if (b.optimized) {
            switch (b.optimizedType) {
                case 'content_farm': return 'Content Farm';
                case 'test_prep': return 'Test Prep Center';
                case 'factory_farm': return 'Factory Farm';
                case 'tenement': return 'Tenement';
            }
        }
        switch (b.type) {
            case 'house': return 'House';
            case 'farm': return 'Farm';
            case 'school': return 'School';
            case 'art_studio': return 'Art Studio';
            case 'garden': return 'Garden';
        }
        return 'Building';
    }

    getOptimizeName(type) {
        switch (type) {
            case 'art_studio': return 'Content Farm';
            case 'school': return 'Test Prep Center';
            case 'farm': return 'Factory Farm';
            case 'house': return 'Tenement';
        }
        return 'Upgrade';
    }

    // ===============================
    //  RESOURCE UPDATES
    // ===============================

    updateResources(dt) {
        for (const b of this.buildings) {
            if (b.destroyed) continue;
            const prod = b.production;
            const rate = dt * (this.dreamTimeActive ? 1.5 : 1);
            this.resources.food += prod.food * rate;
            this.resources.culture += prod.culture * rate;
            this.resources.knowledge += prod.knowledge * rate;
        }

        // Population eats food
        const foodConsumption = this.resources.population * 0.5 * dt;
        this.resources.food -= foodConsumption;

        // Starvation
        if (this.resources.food < 0) {
            this.resources.food = 0;
            // Lose citizens
            if (this.citizens.length > 0 && Math.random() < dt * 0.3) {
                this.citizens.pop();
                this.resources.population = Math.max(0, this.resources.population - 1);
            }
        }

        // Humanity regen from culture (only genuine culture)
        const genuineCulture = this.buildings.filter(b => !b.destroyed && b.type === 'art_studio' && !b.optimized).length;
        if (genuineCulture > 0) {
            this.elua.adjustHumanity(genuineCulture * 0.3 * dt);
        }

        // Clamp
        this.resources.food = Math.max(0, this.resources.food);
        this.resources.culture = Math.max(0, this.resources.culture);
        this.resources.knowledge = Math.max(0, this.resources.knowledge);
    }

    updatePopulation(dt) {
        // Natural growth if food > 10 and pop < max
        if (this.resources.food > 10 && this.resources.population < this.resources.maxPopulation) {
            if (Math.random() < dt * 0.08) {
                this.resources.population++;
                this.spawnCitizen();
            }
        }
    }

    // ===============================
    //  CITIZEN AI
    // ===============================

    updateCitizens(dt) {
        for (const c of this.citizens) {
            // Zombification from Moloch
            if (this.moloch.visible && !c.zombified && this.moloch.power > 40) {
                if (Math.random() < dt * 0.01 * (this.moloch.power / 100)) {
                    c.zombified = true;
                    c.colorful = false;
                }
            }

            if (c.zombified && this.moloch.visible) {
                // Walk toward Moloch
                const dx = this.moloch.x - c.x;
                const dy = this.moloch.y - c.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 20) {
                    const speed = 15 + this.moloch.power * 0.2;
                    c.x += (dx / dist) * speed * dt;
                    c.y += (dy / dist) * speed * dt;
                } else {
                    // Consumed
                    c.feedTimer += dt;
                    if (c.feedTimer > 1) {
                        // Remove citizen, increase Moloch
                        const idx = this.citizens.indexOf(c);
                        if (idx !== -1) {
                            this.citizens.splice(idx, 1);
                            this.resources.population = Math.max(0, this.resources.population - 1);
                            this.moloch.power = Math.min(100, this.moloch.power + 1);
                        }
                    }
                }
            } else {
                // Normal wandering
                c.wanderTimer -= dt;
                if (c.wanderTimer <= 0) {
                    c.wanderTimer = 2 + Math.random() * 4;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 40;
                    c.targetX = c.x + Math.cos(angle) * dist;
                    c.targetY = c.y + Math.sin(angle) * dist;
                    // Clamp to island
                    const dx = c.targetX - this.islandCenter.x;
                    const dy = c.targetY - this.islandCenter.y;
                    const d = Math.hypot(dx, dy);
                    if (d > this.islandRadius * 0.85) {
                        c.targetX = this.islandCenter.x + (dx / d) * this.islandRadius * 0.8;
                        c.targetY = this.islandCenter.y + (dy / d) * this.islandRadius * 0.8;
                    }
                }
                if (c.targetX !== null) {
                    const dx = c.targetX - c.x;
                    const dy = c.targetY - c.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 2) {
                        const speed = 20;
                        c.x += (dx / dist) * speed * dt;
                        c.y += (dy / dist) * speed * dt;
                    }
                }
            }
        }
    }

    // ===============================
    //  MOLOCH
    // ===============================

    updateMoloch(dt) {
        if (!this.moloch.visible) {
            // Passive power accumulation from optimizations and crowding
            if (this.phase !== 'idyllic') {
                const crowdPressure = Math.max(0, this.resources.population - 15) * 0.01;
                const optPressure = this.totalOptimizations * 0.02;
                this.moloch.power = Math.min(100, this.moloch.power + (crowdPressure + optPressure) * dt);
            }
            return;
        }

        // Rise animation
        if (this.moloch.height < this.moloch.maxHeight) {
            this.moloch.height += dt * 15;
        }

        // Power grows passively + from optimizations
        const growthRate = 0.5 + this.totalOptimizations * 0.3;
        if (!this.dreamTimeActive) {
            this.moloch.power = Math.min(100, this.moloch.power + growthRate * dt);
        }

        // Pull strength
        this.moloch.pullStrength = (this.moloch.power / 100) * (this.dreamTimeActive ? 0.1 : 1);

        // Glow
        this.moloch.glowIntensity = this.moloch.power / 100;

        // Pull buildings
        for (const b of this.buildings) {
            if (b.destroyed || b.type === 'garden') continue;

            const dx = this.moloch.x - (b.x + b.pullOffset.x);
            const dy = this.moloch.y - (b.y + b.pullOffset.y);
            const dist = Math.hypot(dx, dy);

            if (dist > 30) {
                // Coordinated buildings resist
                const links = this.getLinksFor(b.id);
                const activeLinks = links.filter(l => !l.defected);
                const resistance = 1 / (1 + activeLinks.length * 0.8);

                const pull = this.moloch.pullStrength * 8 * resistance * dt;
                b.pullOffset.x += (dx / dist) * pull;
                b.pullOffset.y += (dy / dist) * pull;

                // If pulled too far from original position, damage
                const pullDist = Math.hypot(b.pullOffset.x, b.pullOffset.y);
                if (pullDist > 80) {
                    b.health -= dt * 10;
                    if (b.health <= 0) {
                        this.destroyBuilding(b);
                    }
                }
            }
        }

        // Check Ginsberg quotes
        this.checkGinsberg();

        // Check loss: all citizens gone and all buildings destroyed
        const alive = this.buildings.filter(b => !b.destroyed);
        if (alive.length === 0 && this.citizens.length === 0 && !this.hiddenEndingTriggered) {
            this.triggerLoss();
        }
    }

    checkGinsberg() {
        const threshold = this.nextGinsbergAt;
        if (this.moloch.power / 100 >= threshold && this.ginsbergIndex < this.ginsbergQuotes.length) {
            this.engine.showGinsberg(this.ginsbergQuotes[this.ginsbergIndex]);
            this.ginsbergIndex++;
            this.nextGinsbergAt = this.ginsbergIndex / this.ginsbergQuotes.length;
        }
    }

    // ===============================
    //  COORDINATION LINKS
    // ===============================

    updateLinks(dt) {
        for (const link of this.links) {
            if (link.defected) continue;

            const bA = this.buildings.find(b => b.id === link.a);
            const bB = this.buildings.find(b => b.id === link.b);
            if (!bA || !bB || bA.destroyed || bB.destroyed) {
                link.defected = true;
                continue;
            }

            // Under pressure, buildings may defect
            if (this.moloch.power > 30 && !this.dreamTimeActive) {
                const pressureFactor = (this.moloch.power / 100) * dt * 0.05;
                // Optimized buildings defect faster
                const aOpt = bA.optimized ? 3 : 1;
                const bOpt = bB.optimized ? 3 : 1;
                link.strength -= pressureFactor * (aOpt + bOpt) * 10;

                if (link.strength <= 0) {
                    link.defected = true;
                    // All linked buildings suffer
                    bA.health -= 10;
                    bB.health -= 10;
                    this.elua.adjustHumanity(-3);
                }
            }

            // Coordinating buildings resist pull — spring back
            if (!link.defected) {
                for (const b of [bA, bB]) {
                    b.pullOffset.x *= (1 - dt * 0.5);
                    b.pullOffset.y *= (1 - dt * 0.5);
                }
            }
        }
    }

    // ===============================
    //  DREAM TIME
    // ===============================

    updateDreamTime(dt) {
        if (this.dreamTimeActive) {
            this.dreamTimeTimer -= dt;
            if (this.dreamTimeTimer <= 0) {
                this.dreamTimeActive = false;
                document.getElementById('dream-time-indicator').style.display = 'none';
                this.dreamTimeCooldown = 60;
            }
        } else {
            this.dreamTimeCooldown -= dt;
            if (this.time > this.nextDreamTime && this.dreamTimeCooldown <= 0 && this.moloch.visible) {
                this.dreamTimeActive = true;
                this.dreamTimeTimer = 15;  // 15 seconds of peace
                this.nextDreamTime = this.time + 60 + Math.random() * 30;
                document.getElementById('dream-time-indicator').style.display = 'block';
                this.engine.showMessage(
                    "<b>THE DREAM TIME</b><br><br>" +
                    "Moloch sleeps. For a brief moment, you can build something beautiful " +
                    "without the grinding pressure of optimization.<br><br>" +
                    "<i>Build and coordinate now, while you can.</i>"
                );
            }
        }
    }

    // ===============================
    //  METASTASIS (cancer cells)
    // ===============================

    updateMetastasis(dt) {
        if (this.phase === 'idyllic') return;

        for (const b of this.buildings) {
            if (b.destroyed || !b.optimized || b.metastasized) continue;
            if (b.type !== 'farm') continue; // Only factory farms metastasize

            // Chance to spawn a copy
            if (Math.random() < dt * 0.005 * (this.moloch.power / 50)) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 60 + Math.random() * 30;
                const nx = b.x + Math.cos(angle) * dist;
                const ny = b.y + Math.sin(angle) * dist;

                if (this.isOnIsland(nx, ny)) {
                    const clone = this.placeBuilding('farm', nx, ny);
                    if (clone) {
                        this.optimizeBuilding(clone);
                        clone.metastasized = true;
                        b.metastasized = true; // only spawn once per building
                    }
                }
            }
        }
    }

    // ===============================
    //  CASINO (Caesar's Palace)
    // ===============================

    updateCasino(dt) {
        if (this.casinoSpawned) return;
        // Spawn casino when population > 20 and resources are high
        if (this.resources.population > 20 && this.resources.food > 80) {
            this.casinoSpawned = true;
            const angle = Math.random() * Math.PI * 2;
            const dist = this.islandRadius * 0.5;
            const cx = this.islandCenter.x + Math.cos(angle) * dist;
            const cy = this.islandCenter.y + Math.sin(angle) * dist;

            const casino = {
                id: this.buildingIdCounter++,
                type: 'casino',
                x: cx, y: cy,
                optimized: true,
                optimizedType: 'casino',
                health: 200,
                destroyed: false,
                citizenSlots: 20,
                citizensAssigned: 0,
                production: { food: -2, culture: -1, knowledge: -1 },
                metastasized: false,
                pullOffset: { x: 0, y: 0 },
                defectionTimer: 0,
                coordinating: false
            };
            this.buildings.push(casino);

            this.engine.showMessage(
                "<b>CAESAR'S PALACE IN THE DESERT</b><br><br>" +
                "A gambling den has appeared on your island. " +
                "It generates nothing but drains everything &mdash; " +
                "food, culture, knowledge, all sucked into its neon maw.<br><br>" +
                "<i>You can feed it to Moloch. Or let it feast.</i>"
            );
        }
    }

    // ===============================
    //  POLLUTION
    // ===============================

    updatePollution(dt) {
        for (const b of this.buildings) {
            if (b.destroyed || b.optimizedType !== 'factory_farm') continue;
            // Damage nearby non-factory buildings
            for (const other of this.buildings) {
                if (other.destroyed || other.id === b.id || other.optimizedType === 'factory_farm') continue;
                const dist = Math.hypot(b.x - other.x, b.y - other.y);
                if (dist < 100) {
                    other.health -= dt * 2 * (1 - dist / 100);
                    if (other.health <= 0) {
                        this.destroyBuilding(other);
                    }
                }
            }
        }
    }

    // ===============================
    //  GARDEN WIN CONDITION
    // ===============================

    updateGardenCondition(dt) {
        this.gardenBuilding = this.buildings.find(b => b.type === 'garden' && !b.destroyed);

        if (this.gardenBuilding && this.phase === 'moloch_active') {
            // Check: still have 5 unoptimized coordinated buildings?
            const unoptCoord = this.buildings.filter(b =>
                !b.destroyed && !b.optimized && b.type !== 'garden' &&
                this.getLinksFor(b.id).filter(l => !l.defected).length > 0
            );

            if (unoptCoord.length >= 5) {
                this.gardenTimer += dt;
                document.getElementById('coord-timer').style.display = 'block';
                document.getElementById('garden-time').textContent = Math.floor(this.gardenTimer);

                if (this.gardenTimer >= this.gardenRequired) {
                    this.triggerWin();
                }
            } else {
                // Lost coordination — timer resets (harsh but fair)
                if (this.gardenTimer > 0) {
                    this.gardenTimer = Math.max(0, this.gardenTimer - dt * 2);
                    document.getElementById('garden-time').textContent = Math.floor(this.gardenTimer);
                }
            }
        }
    }

    // ===============================
    //  WIN / LOSE / HIDDEN
    // ===============================

    triggerWin() {
        this.gameOver = true;
        const insight = "\"The opposite of a trap is a garden. The only way to avoid the " +
            "trap is to build a garden together, and the only way to build a garden " +
            "is coordination — fragile, costly, beautiful coordination.\"";

        this.engine.endLevel(
            "THE GARDEN ENDURES",
            "Against all odds, you maintained beauty in the shadow of Moloch. " +
            "Five buildings, un-optimized, coordinated, surviving &mdash; " +
            "proof that the garden is possible, even when the demon god pulls everything toward his furnace.<br><br>" +
            "It required constant vigilance and sacrifice. It was worth it.",
            insight,
            false
        );
    }

    triggerLoss() {
        this.gameOver = true;
        this.engine.endLevel(
            "MOLOCH CONSUMES ALL",
            "The island is bare. Every building has been pulled into Moloch's furnace, " +
            "every citizen consumed. Optimization won. There is nothing left " +
            "that wasn't useful, nothing left that was beautiful.<br><br>" +
            "<i>\"Moloch whose love is endless oil and stone! Moloch whose soul is electricity and banks!\"</i>",
            null,
            false
        );
    }

    triggerHiddenEnding() {
        this.gameOver = true;
        this.hiddenEndingTriggered = true;
        const insight = "\"He's not evil, just an emergent property. " +
            "Moloch can't agree even to a 99.99999% victory.\"";

        this.engine.endLevel(
            "MOLOCH'S PERSPECTIVE",
            "You fed everything to Moloch voluntarily &mdash; before he even fully awakened. " +
            "For a brief, terrible moment, you see through his eyes.<br><br>" +
            "He is not evil. He is not even alive. He is the emergent consequence " +
            "of competitive pressures, the sum of all the ways rationality destroys " +
            "the things it was meant to protect.<br><br>" +
            "He cannot choose to stop. <i>That is the horror.</i>",
            insight,
            true
        );
    }

    // ===============================
    //  UI UPDATE
    // ===============================

    updateUI() {
        this.engine.updateHumanityBar(this.elua.humanity);
        this.engine.updateMolochBar(this.moloch.power);
        this.engine.updateResources(
            this.resources.food,
            this.resources.culture,
            this.resources.knowledge,
            this.resources.population
        );
    }

    // ===============================
    //  HELPER
    // ===============================

    isOnIsland(x, y) {
        const dx = x - this.islandCenter.x;
        const dy = y - this.islandCenter.y;
        return Math.hypot(dx, dy) < this.islandRadius * 0.9;
    }

    updateParticles(dt) {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.98;
            p.vy *= 0.98;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    // ===============================
    //  DRAWING
    // ===============================

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky / background
        this.drawBackground(ctx, w, h);

        // Island
        this.drawIsland(ctx);

        // Coordination links
        this.drawLinks(ctx);

        // Buildings
        this.drawBuildings(ctx);

        // Citizens
        this.drawCitizens(ctx);

        // Moloch
        if (this.moloch.visible) {
            this.drawMoloch(ctx);
        }

        // Particles
        this.drawParticles(ctx);

        // Elua
        this.elua.draw(ctx);

        // Build placement preview
        if (this.selectedBuildType) {
            this.drawPlacementPreview(ctx);
        }

        // Selected building highlight
        if (this.selectedBuilding && !this.selectedBuilding.destroyed) {
            this.drawBuildingHighlight(ctx, this.selectedBuilding);
        }
    }

    drawBackground(ctx, w, h) {
        // Dark sky with subtle gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#06050e');
        grad.addColorStop(0.5, '#0d0a1a');
        grad.addColorStop(1, '#1a1430');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (const star of this.stars) {
            star.twinkle += 0.02;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 200, 220, ${alpha})`;
            ctx.fill();
        }
    }

    drawIsland(ctx) {
        const cx = this.islandCenter.x;
        const cy = this.islandCenter.y;
        const r = this.islandRadius;

        // Island body — irregular circle using noise
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            const wobble = Math.sin(angle * 3) * 0.05 + Math.sin(angle * 7) * 0.03;
            const dist = r * (1 + wobble);
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Fill with gradient — green in idyllic, greying out as Moloch grows
        const molochInfluence = this.moloch.power / 100;
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const green = Math.floor(60 * (1 - molochInfluence * 0.5));
        const red = Math.floor(30 + molochInfluence * 30);
        gr.addColorStop(0, `rgb(${red + 10}, ${green + 20}, ${20})`);
        gr.addColorStop(0.7, `rgb(${red}, ${green}, ${15})`);
        gr.addColorStop(1, `rgb(${15}, ${Math.floor(green * 0.5)}, ${10})`);
        ctx.fillStyle = gr;
        ctx.fill();

        // Shore
        ctx.strokeStyle = `rgba(100, 140, 80, ${0.3 - molochInfluence * 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pollution stain from factory farms
        for (const b of this.buildings) {
            if (b.destroyed || b.optimizedType !== 'factory_farm') continue;
            const pg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 100);
            pg.addColorStop(0, 'rgba(80, 60, 20, 0.3)');
            pg.addColorStop(1, 'rgba(80, 60, 20, 0)');
            ctx.beginPath();
            ctx.arc(b.x, b.y, 100, 0, Math.PI * 2);
            ctx.fillStyle = pg;
            ctx.fill();
        }
    }

    drawBuildings(ctx) {
        for (const b of this.buildings) {
            if (b.destroyed) continue;

            const bx = b.x + b.pullOffset.x;
            const by = b.y + b.pullOffset.y;

            ctx.save();
            ctx.translate(bx, by);

            if (b.optimized) {
                // Optimized buildings are geometric, cold
                this.drawOptimizedBuilding(ctx, b);
            } else {
                // Normal buildings are warm, organic
                this.drawNormalBuilding(ctx, b);
            }

            ctx.restore();
        }
    }

    drawNormalBuilding(ctx, b) {
        switch (b.type) {
            case 'house':
                // Warm cottage
                ctx.fillStyle = '#8b7355';
                ctx.fillRect(-12, -8, 24, 16);
                ctx.fillStyle = '#a0522d';
                ctx.beginPath();
                ctx.moveTo(-15, -8);
                ctx.lineTo(0, -20);
                ctx.lineTo(15, -8);
                ctx.fill();
                // Window glow
                ctx.fillStyle = '#f0d060';
                ctx.fillRect(-5, -3, 4, 4);
                ctx.fillRect(2, -3, 4, 4);
                break;

            case 'farm':
                // Green field with stalks
                ctx.fillStyle = '#4a7a30';
                ctx.fillRect(-15, -5, 30, 10);
                ctx.strokeStyle = '#6aaa40';
                ctx.lineWidth = 1.5;
                for (let i = -12; i <= 12; i += 6) {
                    ctx.beginPath();
                    ctx.moveTo(i, -5);
                    ctx.lineTo(i, -15);
                    ctx.stroke();
                    // Grain head
                    ctx.beginPath();
                    ctx.arc(i, -16, 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#c0a030';
                    ctx.fill();
                }
                break;

            case 'school':
                // Small schoolhouse
                ctx.fillStyle = '#6a6a8a';
                ctx.fillRect(-14, -6, 28, 16);
                ctx.fillStyle = '#8a8aaa';
                ctx.beginPath();
                ctx.moveTo(-16, -6);
                ctx.lineTo(0, -18);
                ctx.lineTo(16, -6);
                ctx.fill();
                // Bell
                ctx.fillStyle = '#f0d060';
                ctx.beginPath();
                ctx.arc(0, -18, 3, 0, Math.PI * 2);
                ctx.fill();
                // Door
                ctx.fillStyle = '#4a4a5a';
                ctx.fillRect(-3, 2, 6, 8);
                break;

            case 'art_studio':
                // Colorful studio
                ctx.fillStyle = '#7a5a8a';
                ctx.fillRect(-12, -6, 24, 14);
                ctx.fillStyle = '#9a7aaa';
                ctx.fillRect(-14, -8, 28, 4);
                // Palette
                const colors = ['#e04040', '#40a0e0', '#f0d060', '#40c040'];
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(-8 + i * 5, -12, 3, 0, Math.PI * 2);
                    ctx.fillStyle = colors[i];
                    ctx.fill();
                }
                break;

            case 'garden':
                // Beautiful garden
                this.drawGarden(ctx);
                break;
        }

        // Health indicator
        if (b.health < 100) {
            ctx.fillStyle = '#222';
            ctx.fillRect(-12, 12, 24, 3);
            ctx.fillStyle = b.health > 50 ? '#4aaf5a' : '#d44040';
            ctx.fillRect(-12, 12, 24 * (b.health / 100), 3);
        }
    }

    drawOptimizedBuilding(ctx, b) {
        // All optimized buildings are geometric, industrial
        ctx.strokeStyle = '#d45a1a';
        ctx.lineWidth = 1;

        switch (b.optimizedType) {
            case 'content_farm':
                // Grey box with spinning gears
                ctx.fillStyle = '#4a4a5a';
                ctx.fillRect(-14, -8, 28, 16);
                ctx.strokeRect(-14, -8, 28, 16);
                // Screens
                ctx.fillStyle = '#2a4a6a';
                ctx.fillRect(-10, -5, 8, 6);
                ctx.fillRect(2, -5, 8, 6);
                // "Content" scrolling
                ctx.fillStyle = '#6a8aaa';
                const scrollY = (this.time * 20) % 6;
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(-8, -4 + i * 2 + (scrollY % 2), 5, 1);
                    ctx.fillRect(4, -4 + i * 2 + (scrollY % 2), 5, 1);
                }
                break;

            case 'test_prep':
                // Harsh fluorescent building
                ctx.fillStyle = '#5a5a6a';
                ctx.fillRect(-14, -8, 28, 16);
                ctx.strokeRect(-14, -8, 28, 16);
                // Clock
                ctx.beginPath();
                ctx.arc(0, -4, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#eee';
                ctx.fill();
                ctx.strokeStyle = '#d45a1a';
                ctx.stroke();
                // Clock hands
                const angle = (this.time * 2) % (Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(Math.cos(angle) * 3, -4 + Math.sin(angle) * 3);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                break;

            case 'factory_farm':
                // Industrial farm with smokestacks
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(-14, -6, 28, 14);
                ctx.strokeStyle = '#d45a1a';
                ctx.strokeRect(-14, -6, 28, 14);
                // Smokestacks
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(-10, -18, 4, 12);
                ctx.fillRect(6, -18, 4, 12);
                // Smoke
                ctx.fillStyle = `rgba(100, 100, 100, ${0.3 + Math.sin(this.time * 3) * 0.1})`;
                ctx.beginPath();
                ctx.arc(-8, -22 - Math.sin(this.time * 2) * 3, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(8, -20 - Math.cos(this.time * 2.5) * 3, 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'tenement':
                // Tall, cramped building
                ctx.fillStyle = '#5a5a5a';
                ctx.fillRect(-10, -20, 20, 28);
                ctx.strokeStyle = '#d45a1a';
                ctx.strokeRect(-10, -20, 20, 28);
                // Many tiny windows
                for (let r = 0; r < 5; r++) {
                    for (let c = 0; c < 3; c++) {
                        ctx.fillStyle = Math.random() > 0.3 ? '#3a3a2a' : '#6a6a20';
                        ctx.fillRect(-7 + c * 6, -17 + r * 5, 3, 3);
                    }
                }
                break;

            case 'casino':
                // Neon monstrosity
                const neonPulse = Math.sin(this.time * 5) * 0.3 + 0.7;
                ctx.fillStyle = '#2a1a3a';
                ctx.fillRect(-18, -12, 36, 24);
                ctx.strokeStyle = `rgba(255, 50, 200, ${neonPulse})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(-18, -12, 36, 24);
                // Neon sign
                ctx.fillStyle = `rgba(255, 200, 50, ${neonPulse})`;
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('CASINO', 0, -2);
                ctx.fillStyle = `rgba(255, 50, 200, ${neonPulse * 0.7})`;
                ctx.font = '6px sans-serif';
                ctx.fillText("CAESAR'S", 0, 6);
                break;
        }

        // Health bar
        if (b.health < 200) {
            const maxH = b.type === 'casino' ? 200 : 100;
            ctx.fillStyle = '#222';
            ctx.fillRect(-12, 12, 24, 3);
            ctx.fillStyle = '#d45a1a';
            ctx.fillRect(-12, 12, 24 * (b.health / maxH), 3);
        }
    }

    drawGarden(ctx) {
        // The Garden — the hope
        const pulse = Math.sin(this.time * 1.5) * 0.2 + 0.8;

        // Base
        ctx.fillStyle = `rgba(40, 80, 30, ${pulse})`;
        ctx.beginPath();
        ctx.ellipse(0, 4, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flowers
        const flowerColors = ['#e04040', '#f0d060', '#40a0e0', '#e080c0', '#40c040'];
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + this.time * 0.1;
            const dist = 8 + Math.sin(angle * 3 + this.time) * 3;
            const fx = Math.cos(angle) * dist;
            const fy = Math.sin(angle) * dist * 0.5;

            // Stem
            ctx.strokeStyle = '#4a8a30';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(fx, fy + 4);
            ctx.lineTo(fx, fy - 4);
            ctx.stroke();

            // Petal
            ctx.beginPath();
            ctx.arc(fx, fy - 5, 3, 0, Math.PI * 2);
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.fill();
        }

        // Golden glow
        const gg = ctx.createRadialGradient(0, 0, 5, 0, 0, 25);
        gg.addColorStop(0, `rgba(240, 208, 96, ${0.2 * pulse})`);
        gg.addColorStop(1, 'rgba(240, 208, 96, 0)');
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();
    }

    drawLinks(ctx) {
        for (const link of this.links) {
            if (link.defected) continue;
            const bA = this.buildings.find(b => b.id === link.a);
            const bB = this.buildings.find(b => b.id === link.b);
            if (!bA || !bB || bA.destroyed || bB.destroyed) continue;

            const ax = bA.x + bA.pullOffset.x;
            const ay = bA.y + bA.pullOffset.y;
            const bx = bB.x + bB.pullOffset.x;
            const by = bB.y + bB.pullOffset.y;

            const strengthAlpha = (link.strength / 100) * 0.6;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = `rgba(232, 197, 71, ${strengthAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Midpoint glow
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(232, 197, 71, ${strengthAlpha * 0.5})`;
            ctx.fill();
        }
    }

    drawCitizens(ctx) {
        for (const c of this.citizens) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);

            if (c.zombified) {
                ctx.fillStyle = '#6a6a7a';
                // Zombie trail toward Moloch
                if (this.moloch.visible) {
                    ctx.save();
                    ctx.globalAlpha = 0.15;
                    ctx.beginPath();
                    ctx.moveTo(c.x, c.y);
                    ctx.lineTo(this.moloch.x, this.moloch.y);
                    ctx.strokeStyle = '#d45a1a';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    ctx.restore();
                }
            } else {
                // Colorful citizen — unique hue
                const hue = ((c.x * 7 + c.y * 13) % 360);
                ctx.fillStyle = `hsl(${hue}, 60%, 65%)`;
            }
            ctx.fill();

            // Tiny shadow
            ctx.beginPath();
            ctx.ellipse(c.x, c.y + 4, 3, 1, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fill();
        }
    }

    drawMoloch(ctx) {
        const mx = this.moloch.x;
        const my = this.moloch.y;
        const h = this.moloch.height;
        const intensity = this.moloch.glowIntensity;

        // Ground crack
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const len = 40 + intensity * 60;
            ctx.moveTo(mx, my);
            ctx.lineTo(
                mx + Math.cos(angle) * len + Math.sin(angle * 3) * 10,
                my + Math.sin(angle) * len + Math.cos(angle * 5) * 10
            );
        }
        ctx.strokeStyle = `rgba(212, 90, 26, ${intensity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Aura / pull field
        const pullGrad = ctx.createRadialGradient(mx, my, 20, mx, my, 150 + intensity * 100);
        pullGrad.addColorStop(0, `rgba(212, 90, 26, ${intensity * 0.15})`);
        pullGrad.addColorStop(1, 'rgba(212, 90, 26, 0)');
        ctx.beginPath();
        ctx.arc(mx, my, 150 + intensity * 100, 0, Math.PI * 2);
        ctx.fillStyle = pullGrad;
        ctx.fill();

        // Body — a stone monolith rising
        ctx.save();
        ctx.translate(mx, my);

        // Base
        ctx.fillStyle = '#3a2520';
        ctx.beginPath();
        ctx.moveTo(-25, 10);
        ctx.lineTo(-20, 10 - h);
        ctx.lineTo(-10, 10 - h - 15);
        ctx.lineTo(10, 10 - h - 15);
        ctx.lineTo(20, 10 - h);
        ctx.lineTo(25, 10);
        ctx.closePath();
        ctx.fill();

        // Stone texture lines
        ctx.strokeStyle = `rgba(100, 60, 40, 0.5)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const ly = 10 - (h / 5) * i;
            ctx.beginPath();
            ctx.moveTo(-22 + i, ly);
            ctx.lineTo(22 - i, ly);
            ctx.stroke();
        }

        // Eyes — burning orange
        if (h > 60) {
            const eyeY = 10 - h + 20;
            const eyeGlow = ctx.createRadialGradient(-8, eyeY, 1, -8, eyeY, 6);
            eyeGlow.addColorStop(0, '#ff6a2a');
            eyeGlow.addColorStop(1, 'rgba(255, 106, 42, 0)');
            ctx.beginPath();
            ctx.arc(-8, eyeY, 6, 0, Math.PI * 2);
            ctx.fillStyle = eyeGlow;
            ctx.fill();

            const eyeGlow2 = ctx.createRadialGradient(8, eyeY, 1, 8, eyeY, 6);
            eyeGlow2.addColorStop(0, '#ff6a2a');
            eyeGlow2.addColorStop(1, 'rgba(255, 106, 42, 0)');
            ctx.beginPath();
            ctx.arc(8, eyeY, 6, 0, Math.PI * 2);
            ctx.fillStyle = eyeGlow2;
            ctx.fill();

            // Eye cores
            ctx.beginPath();
            ctx.arc(-8, eyeY, 2, 0, Math.PI * 2);
            ctx.arc(8, eyeY, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }

        // Furnace mouth
        if (h > 80) {
            const mouthY = 10 - h + 50;
            ctx.beginPath();
            ctx.ellipse(0, mouthY, 10, 6 + Math.sin(this.time * 3) * 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 80, 20, ${0.5 + Math.sin(this.time * 4) * 0.2})`;
            ctx.fill();
            // Inner fire
            ctx.beginPath();
            ctx.ellipse(0, mouthY, 5, 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffaa30';
            ctx.fill();
        }

        // Top glow
        const topGlow = ctx.createRadialGradient(0, 10 - h - 15, 0, 0, 10 - h - 15, 30);
        topGlow.addColorStop(0, `rgba(255, 106, 42, ${intensity * 0.3})`);
        topGlow.addColorStop(1, 'rgba(255, 106, 42, 0)');
        ctx.beginPath();
        ctx.arc(0, 10 - h - 15, 30, 0, Math.PI * 2);
        ctx.fillStyle = topGlow;
        ctx.fill();

        ctx.restore();
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    drawPlacementPreview(ctx) {
        const mx = this.engine.mouse.x;
        const my = this.engine.mouse.y;
        const onIsland = this.isOnIsland(mx, my);
        const canPlace = onIsland && this.canAfford(this.selectedBuildType);

        ctx.save();
        ctx.globalAlpha = canPlace ? 0.5 : 0.25;
        ctx.translate(mx, my);

        // Simple preview shape
        ctx.strokeStyle = canPlace ? '#e8c547' : '#d44040';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = canPlace ? '#e8c547' : '#d44040';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.selectedBuildType.replace('_', ' ').toUpperCase(), 0, 25);

        ctx.restore();
    }

    drawBuildingHighlight(ctx, b) {
        const bx = b.x + b.pullOffset.x;
        const by = b.y + b.pullOffset.y;
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, 28, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 197, 71, ${0.4 + Math.sin(this.time * 3) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // ===============================
    //  CLEANUP
    // ===============================

    cleanup() {
        document.getElementById('top-bar').style.display = 'none';
        document.getElementById('build-panel').style.display = 'none';
        document.getElementById('action-panel').style.display = 'none';
        document.getElementById('coordination-panel').style.display = 'none';
        document.getElementById('ginsberg-overlay').style.display = 'none';
        document.getElementById('dream-time-indicator').style.display = 'none';
    }
}
