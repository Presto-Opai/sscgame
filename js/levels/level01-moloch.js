// Level 01 — MEDITATIONS ON MOLOCH
// Tower Defense / Reverse Tower Defense Hybrid
// "Moloch whose mind is pure machinery!"
//
// The player builds on an island while optimization pressures emerge from their own buildings.
// Moloch rises from the center, pulling everything toward optimization.
// Win: sustain a Garden of 5+ un-optimized coordinated buildings for 60s.

const Level01Moloch = (() => {
    let canvas, ctx;
    let W, H;

    // --- CONSTANTS ---
    const GRID_SIZE = 12;
    const TILE_TYPES = {
        EMPTY: 0, WATER: 1, FARM: 2, ART_STUDIO: 3, SCHOOL: 4, HOUSE: 5,
        FACTORY_FARM: 6, CONTENT_FARM: 7, TEST_PREP: 8, CASINO: 9, GARDEN: 10
    };
    const TILE_NAMES = {
        [TILE_TYPES.EMPTY]: 'Empty', [TILE_TYPES.WATER]: 'Water',
        [TILE_TYPES.FARM]: 'Farm', [TILE_TYPES.ART_STUDIO]: 'Art Studio',
        [TILE_TYPES.SCHOOL]: 'School', [TILE_TYPES.HOUSE]: 'House',
        [TILE_TYPES.FACTORY_FARM]: 'Factory Farm', [TILE_TYPES.CONTENT_FARM]: 'Content Farm',
        [TILE_TYPES.TEST_PREP]: 'Test Prep Center', [TILE_TYPES.CASINO]: "Caesar's Palace",
        [TILE_TYPES.GARDEN]: 'Garden'
    };
    const TILE_COLORS = {
        [TILE_TYPES.EMPTY]: '#2a4a2a', [TILE_TYPES.WATER]: '#1a3a6a',
        [TILE_TYPES.FARM]: '#4a8a3a', [TILE_TYPES.ART_STUDIO]: '#8a5ab0',
        [TILE_TYPES.SCHOOL]: '#3a7abc', [TILE_TYPES.HOUSE]: '#aa8a5a',
        [TILE_TYPES.FACTORY_FARM]: '#6a6a3a', [TILE_TYPES.CONTENT_FARM]: '#6a4a6a',
        [TILE_TYPES.TEST_PREP]: '#3a5a6a', [TILE_TYPES.CASINO]: '#cc8a20',
        [TILE_TYPES.GARDEN]: '#60c060'
    };
    const OPTIMIZED = [TILE_TYPES.FACTORY_FARM, TILE_TYPES.CONTENT_FARM, TILE_TYPES.TEST_PREP, TILE_TYPES.CASINO];
    const PURE = [TILE_TYPES.FARM, TILE_TYPES.ART_STUDIO, TILE_TYPES.SCHOOL, TILE_TYPES.HOUSE, TILE_TYPES.GARDEN];

    const BUILD_COSTS = {
        [TILE_TYPES.FARM]: 10, [TILE_TYPES.ART_STUDIO]: 15,
        [TILE_TYPES.SCHOOL]: 15, [TILE_TYPES.HOUSE]: 10, [TILE_TYPES.GARDEN]: 30
    };

    // --- STATE ---
    let grid = [];
    let citizens = [];
    let resources = { food: 50, culture: 10, knowledge: 10, wealth: 30, population: 0 };
    let moloch = { power: 0, maxPower: 100, active: false, risen: false, glow: 0, pullStrength: 0 };
    let phase = 'idyllic'; // 'idyllic', 'pressure', 'moloch_rising', 'moloch_active', 'won', 'hidden_ending', 'lost'
    let phaseTimer = 0;
    let totalTime = 0;
    let gardenTimer = 0; // seconds of sustained garden coordination
    const GARDEN_WIN_TIME = 60;
    let selectedBuild = TILE_TYPES.FARM;
    let coordLinks = []; // {from: {r,c}, to: {r,c}, strength: 0-1}
    let coordMode = false;
    let coordStart = null;
    let messages = []; // floating messages
    let ginsbergQuotes = [
        "Moloch whose mind is pure machinery!",
        "Moloch whose blood is running money!",
        "Moloch whose soul is electricity and banks!",
        "Moloch whose poverty is the specter of genius!",
        "Moloch! Moloch! Robot apartments!",
        "Moloch whose eyes are a thousand blind windows!"
    ];
    let ginsbergTimer = 0;
    let currentGinsberg = '';
    let ginsbergAlpha = 0;
    let dreamTime = false;
    let dreamTimer = 0;
    let hiddenFedCount = 0;
    let showTutorial = true;
    let tutorialStep = 0;
    let tooltipText = '';
    let pollution = []; // {r, c, strength}
    let metastasis = []; // tiles that will clone

    // --- UI layout ---
    let tileSize, gridOffsetX, gridOffsetY;
    let panelX, panelW;
    let hoverTile = null;

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
        computeLayout();
    }

    function resetState() {
        grid = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                grid[r][c] = { type: TILE_TYPES.EMPTY, health: 100, coordinated: false, defecting: false, driftX: 0, driftY: 0 };
            }
        }
        // Water around edges (island shape)
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const dr = r - GRID_SIZE / 2 + 0.5;
                const dc = c - GRID_SIZE / 2 + 0.5;
                const dist = Math.sqrt(dr * dr + dc * dc);
                if (dist > GRID_SIZE / 2 - 0.5) {
                    grid[r][c].type = TILE_TYPES.WATER;
                }
            }
        }

        citizens = [];
        resources = { food: 50, culture: 10, knowledge: 10, wealth: 30, population: 0 };
        moloch = { power: 0, maxPower: 100, active: false, risen: false, glow: 0, pullStrength: 0 };
        phase = 'idyllic';
        phaseTimer = 0;
        totalTime = 0;
        gardenTimer = 0;
        selectedBuild = TILE_TYPES.FARM;
        coordLinks = [];
        coordMode = false;
        coordStart = null;
        messages = [];
        currentGinsberg = '';
        ginsbergAlpha = 0;
        ginsbergTimer = 0;
        dreamTime = false;
        dreamTimer = 0;
        hiddenFedCount = 0;
        showTutorial = true;
        tutorialStep = 0;
        pollution = [];
        metastasis = [];
        tooltipText = '';
    }

    function computeLayout() {
        const maxGrid = Math.min(W * 0.65, H - 100);
        tileSize = Math.floor(maxGrid / GRID_SIZE);
        gridOffsetX = 20;
        gridOffsetY = Math.floor((H - tileSize * GRID_SIZE) / 2);
        panelX = gridOffsetX + tileSize * GRID_SIZE + 20;
        panelW = W - panelX - 10;
    }

    function onResize(w, h) {
        W = w; H = h;
        computeLayout();
    }

    // --- HELPERS ---
    function getTileAt(mx, my) {
        const c = Math.floor((mx - gridOffsetX) / tileSize);
        const r = Math.floor((my - gridOffsetY) / tileSize);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) return { r, c };
        return null;
    }

    function countType(type) {
        let n = 0;
        for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
                if (grid[r][c].type === type) n++;
        return n;
    }

    function countPure() {
        let n = 0;
        for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
                if (PURE.includes(grid[r][c].type)) n++;
        return n;
    }

    function countOptimized() {
        let n = 0;
        for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
                if (OPTIMIZED.includes(grid[r][c].type)) n++;
        return n;
    }

    function countCoordinated() {
        let n = 0;
        for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
                if (grid[r][c].coordinated && PURE.includes(grid[r][c].type)) n++;
        return n;
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 1.5, color });
    }

    function isLandTile(r, c) {
        return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c].type !== TILE_TYPES.WATER;
    }

    // --- UPDATE ---
    function update(dt, input) {
        if (phase === 'won' || phase === 'hidden_ending' || phase === 'lost') {
            updateEndScreen(dt, input);
            return;
        }

        totalTime += dt;
        phaseTimer += dt;

        // Tutorial handling
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 3) showTutorial = false;
            }
            return;
        }

        // Phase transitions
        updatePhase(dt);

        // Resource generation
        updateResources(dt);

        // Moloch mechanics
        updateMoloch(dt);

        // Citizens
        updateCitizens(dt);

        // Coordination check
        updateCoordination(dt);

        // Garden win check
        updateGardenWin(dt);

        // Pollution spread
        updatePollution(dt);

        // Cancer metastasis
        updateMetastasis(dt);

        // Dream Time
        updateDreamTime(dt);

        // Ginsberg quotes
        updateGinsberg(dt);

        // Messages
        messages = messages.filter(m => {
            m.alpha -= dt * 0.5;
            m.y -= dt * 20;
            return m.alpha > 0;
        });

        // Input
        handleInput(input);
    }

    function updatePhase(dt) {
        if (phase === 'idyllic' && (resources.population > 12 || phaseTimer > 45)) {
            phase = 'pressure';
            phaseTimer = 0;
            addMessage('Resources are becoming scarce...', W / 2, H / 2, '#cc8a20');
        }
        if (phase === 'pressure' && (countOptimized() > 0 || phaseTimer > 60)) {
            phase = 'moloch_rising';
            phaseTimer = 0;
            moloch.risen = true;
            addMessage('Something stirs at the center of the island...', W / 2, H / 2, '#e85820');
        }
        if (phase === 'moloch_rising' && (moloch.power > 50 || phaseTimer > 60)) {
            phase = 'moloch_active';
            phaseTimer = 0;
            moloch.active = true;
            addMessage('MOLOCH IS FULLY ACTIVE', W / 2, H / 2, '#ff3030');
        }
    }

    function updateResources(dt) {
        const rate = dt * 0.5;
        let foodProd = 0, cultureProd = 0, knowledgeProd = 0, wealthProd = 0, popGrowth = 0;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const tile = grid[r][c];
                switch (tile.type) {
                    case TILE_TYPES.FARM: foodProd += 3; break;
                    case TILE_TYPES.ART_STUDIO: cultureProd += 2; break;
                    case TILE_TYPES.SCHOOL: knowledgeProd += 2; break;
                    case TILE_TYPES.HOUSE: popGrowth += 1; break;
                    case TILE_TYPES.FACTORY_FARM: foodProd += 8; break;
                    case TILE_TYPES.CONTENT_FARM: wealthProd += 5; break;
                    case TILE_TYPES.TEST_PREP: knowledgeProd += 5; break;
                    case TILE_TYPES.CASINO: wealthProd += 12; foodProd -= 2; cultureProd -= 2; knowledgeProd -= 1; break;
                    case TILE_TYPES.GARDEN: cultureProd += 1; foodProd += 1; break;
                }
            }
        }

        // Population consumes food
        const consumption = resources.population * 0.8;
        foodProd -= consumption;

        resources.food = Math.max(0, resources.food + foodProd * rate);
        resources.culture = Math.max(0, resources.culture + cultureProd * rate);
        resources.knowledge = Math.max(0, resources.knowledge + knowledgeProd * rate);
        resources.wealth = Math.max(0, resources.wealth + wealthProd * rate);

        // Population growth from houses
        if (resources.food > 5 && popGrowth > 0) {
            resources.population += popGrowth * rate * 0.3;
            // Spawn citizen sprites occasionally
            if (Math.random() < dt * 0.2 && citizens.length < 40) {
                spawnCitizen();
            }
        }

        // Starvation
        if (resources.food <= 0 && resources.population > 0) {
            resources.population = Math.max(0, resources.population - dt * 0.5);
        }
    }

    function updateMoloch(dt) {
        if (!moloch.risen) return;

        // Moloch power grows from optimization
        const optCount = countOptimized();
        moloch.power = Math.min(moloch.maxPower, moloch.power + optCount * dt * 0.5);

        // Glow animation
        moloch.glow = 0.3 + (moloch.power / moloch.maxPower) * 0.7;

        // Pull strength
        if (moloch.active) {
            moloch.pullStrength = (moloch.power / moloch.maxPower) * 0.5;

            // Pull buildings toward center
            const cx = GRID_SIZE / 2, cy = GRID_SIZE / 2;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const tile = grid[r][c];
                    if (tile.type !== TILE_TYPES.EMPTY && tile.type !== TILE_TYPES.WATER) {
                        if (!tile.coordinated || tile.defecting) {
                            const dx = cx - c, dy = cy - r;
                            tile.driftX += dx * moloch.pullStrength * dt * 0.02;
                            tile.driftY += dy * moloch.pullStrength * dt * 0.02;
                        } else {
                            // Coordinated buildings resist
                            tile.driftX *= 0.95;
                            tile.driftY *= 0.95;
                        }
                    }
                }
            }

            // Under high pressure, pure buildings auto-defect
            if (moloch.power > 60 && !dreamTime) {
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        const tile = grid[r][c];
                        if (tile.coordinated && PURE.includes(tile.type) && Math.random() < dt * 0.03 * (moloch.power / 100)) {
                            tile.defecting = true;
                            tile.coordinated = false;
                            addMessage('Defection!', gridOffsetX + c * tileSize + tileSize / 2, gridOffsetY + r * tileSize, '#cc3030');
                            // Break links involving this tile
                            coordLinks = coordLinks.filter(l =>
                                !(l.from.r === r && l.from.c === c) && !(l.to.r === r && l.to.c === c));
                        }
                    }
                }
            }

            // Auto-upgrade under extreme pressure
            if (moloch.power > 75 && !dreamTime && Math.random() < dt * 0.015) {
                autoOptimize();
            }
        }

        // Lose condition: Moloch at max + no pure buildings
        if (moloch.power >= moloch.maxPower && countPure() === 0) {
            phase = 'lost';
        }
    }

    function autoOptimize() {
        const candidates = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const tile = grid[r][c];
                if (tile.type === TILE_TYPES.FARM && !tile.coordinated) candidates.push({ r, c, to: TILE_TYPES.FACTORY_FARM });
                if (tile.type === TILE_TYPES.ART_STUDIO && !tile.coordinated) candidates.push({ r, c, to: TILE_TYPES.CONTENT_FARM });
                if (tile.type === TILE_TYPES.SCHOOL && !tile.coordinated) candidates.push({ r, c, to: TILE_TYPES.TEST_PREP });
            }
        }
        if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            grid[pick.r][pick.c].type = pick.to;
            addMessage('Auto-optimized!', gridOffsetX + pick.c * tileSize + tileSize / 2,
                gridOffsetY + pick.r * tileSize, '#e85820');
            Protagonist.recordOptimization();
        }
    }

    function updateCitizens(dt) {
        const cx = gridOffsetX + GRID_SIZE * tileSize / 2;
        const cy = gridOffsetY + GRID_SIZE * tileSize / 2;
        for (const cit of citizens) {
            // Wander
            cit.wanderTimer -= dt;
            if (cit.wanderTimer <= 0) {
                cit.wanderTimer = 1 + Math.random() * 3;
                cit.targetX = cit.homeX + (Math.random() - 0.5) * tileSize * 2;
                cit.targetY = cit.homeY + (Math.random() - 0.5) * tileSize * 2;
            }

            // Move toward target
            const dx = cit.targetX - cit.x;
            const dy = cit.targetY - cit.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 2) {
                cit.x += (dx / dist) * 30 * dt;
                cit.y += (dy / dist) * 30 * dt;
            }

            // Moloch pull (zombie walk)
            if (moloch.active && !dreamTime) {
                const mdx = cx - cit.x;
                const mdy = cy - cit.y;
                const md = Math.sqrt(mdx * mdx + mdy * mdy);
                if (md > 5) {
                    const pull = moloch.pullStrength * 15;
                    cit.x += (mdx / md) * pull * dt;
                    cit.y += (mdy / md) * pull * dt;
                }
                // Grey out citizens
                cit.grey = Math.min(1, cit.grey + dt * 0.05 * (moloch.power / 100));
            }
        }
    }

    function spawnCitizen() {
        // Find a house
        const houses = [];
        for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
                if (grid[r][c].type === TILE_TYPES.HOUSE)
                    houses.push({ r, c });
        if (houses.length === 0) return;
        const h = houses[Math.floor(Math.random() * houses.length)];
        const px = gridOffsetX + h.c * tileSize + tileSize / 2;
        const py = gridOffsetY + h.r * tileSize + tileSize / 2;
        citizens.push({
            x: px, y: py, homeX: px, homeY: py,
            targetX: px, targetY: py,
            wanderTimer: Math.random() * 2,
            color: `hsl(${Math.random() * 360}, 60%, 60%)`,
            grey: 0
        });
    }

    function updateCoordination(dt) {
        // Reset coordination flags
        for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
                grid[r][c].coordinated = false;

        // Coordination links give coordinated status
        for (const link of coordLinks) {
            const tFrom = grid[link.from.r][link.from.c];
            const tTo = grid[link.to.r][link.to.c];
            if (PURE.includes(tFrom.type) && PURE.includes(tTo.type)) {
                tFrom.coordinated = true;
                tTo.coordinated = true;
                link.strength = Math.min(1, link.strength + dt * 0.1);
            } else {
                link.strength = Math.max(0, link.strength - dt * 0.3);
            }
        }
        // Clean dead links
        coordLinks = coordLinks.filter(l => l.strength > 0);
    }

    function updateGardenWin(dt) {
        if (phase !== 'moloch_active') return;
        const gardens = countType(TILE_TYPES.GARDEN);
        const coordPure = countCoordinated();
        if (coordPure >= 5 && gardens > 0) {
            gardenTimer += dt;
            if (gardenTimer >= GARDEN_WIN_TIME) {
                phase = 'won';
                Protagonist.addInsight(1, "The only winning move is to coordinate — not against Moloch, but despite him.");
                Protagonist.recordConnection();
                Protagonist.completeLevel(1, 'garden');
                Protagonist.save();
            }
        } else {
            gardenTimer = Math.max(0, gardenTimer - dt * 0.5);
        }
    }

    function updatePollution(dt) {
        // Factory farms spread pollution
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c].type === TILE_TYPES.FACTORY_FARM) {
                    // Damage adjacent pure buildings
                    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                            const neighbor = grid[nr][nc];
                            if (PURE.includes(neighbor.type)) {
                                neighbor.health -= dt * 5;
                                if (neighbor.health <= 0) {
                                    neighbor.type = TILE_TYPES.EMPTY;
                                    neighbor.health = 100;
                                    addMessage('Pollution destroyed!', gridOffsetX + nc * tileSize + tileSize / 2,
                                        gridOffsetY + nr * tileSize, '#6a6a3a');
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    function updateMetastasis(dt) {
        // Optimized buildings can metastasize (cancer cells reference)
        if (phase !== 'moloch_active' || dreamTime) return;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (OPTIMIZED.includes(grid[r][c].type) && Math.random() < dt * 0.005) {
                    // Try to clone to adjacent empty
                    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    const shuffled = dirs.sort(() => Math.random() - 0.5);
                    for (const [dr, dc] of shuffled) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc].type === TILE_TYPES.EMPTY) {
                            grid[nr][nc].type = grid[r][c].type;
                            grid[nr][nc].health = 100;
                            addMessage('Metastasis!', gridOffsetX + nc * tileSize + tileSize / 2,
                                gridOffsetY + nr * tileSize, '#cc3030');
                            break;
                        }
                    }
                }
            }
        }
    }

    function updateDreamTime(dt) {
        if (phase !== 'moloch_active') return;
        dreamTimer -= dt;
        if (dreamTimer <= 0 && !dreamTime && Math.random() < dt * 0.01) {
            dreamTime = true;
            dreamTimer = 8 + Math.random() * 5; // 8-13s of dream time
            addMessage('THE DREAM TIME — Moloch sleeps...', W / 2, H / 3, '#ffd764');
        }
        if (dreamTime && dreamTimer <= 0) {
            dreamTime = false;
            dreamTimer = 20 + Math.random() * 20; // 20-40s before next dream
            addMessage('Moloch stirs again.', W / 2, H / 3, '#e85820');
        }
    }

    function updateGinsberg(dt) {
        if (!moloch.risen) return;
        ginsbergTimer -= dt;
        if (ginsbergAlpha > 0) {
            ginsbergAlpha -= dt * 0.3;
        }
        if (ginsbergTimer <= 0) {
            currentGinsberg = ginsbergQuotes[Math.floor(Math.random() * ginsbergQuotes.length)];
            ginsbergAlpha = 1.5;
            ginsbergTimer = 8 + Math.random() * 10;
        }
    }

    // --- INPUT ---
    function handleInput(input) {
        // Hover tile
        hoverTile = getTileAt(input.mouse.x, input.mouse.y);

        // Tooltip
        tooltipText = '';
        if (hoverTile) {
            const tile = grid[hoverTile.r][hoverTile.c];
            if (tile.type !== TILE_TYPES.EMPTY && tile.type !== TILE_TYPES.WATER) {
                tooltipText = TILE_NAMES[tile.type];
                if (tile.coordinated) tooltipText += ' [Coordinated]';
                if (tile.defecting) tooltipText += ' [Defecting!]';
                tooltipText += ` (${Math.round(tile.health)}%)`;
            }
        }

        if (!input.mouse.clicked) return;

        // Check build panel clicks
        if (input.mouse.x >= panelX) {
            handlePanelClick(input.mouse.x, input.mouse.y);
            return;
        }

        // Grid clicks
        if (!hoverTile) return;
        const tile = grid[hoverTile.r][hoverTile.c];

        if (coordMode) {
            // Coordination linking
            if (PURE.includes(tile.type)) {
                if (!coordStart) {
                    coordStart = { r: hoverTile.r, c: hoverTile.c };
                    addMessage('Link start', gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                        gridOffsetY + hoverTile.r * tileSize, '#40b060');
                } else {
                    // Create link
                    const already = coordLinks.find(l =>
                        (l.from.r === coordStart.r && l.from.c === coordStart.c && l.to.r === hoverTile.r && l.to.c === hoverTile.c) ||
                        (l.to.r === coordStart.r && l.to.c === coordStart.c && l.from.r === hoverTile.r && l.from.c === hoverTile.c));
                    if (!already && !(coordStart.r === hoverTile.r && coordStart.c === hoverTile.c)) {
                        coordLinks.push({ from: { ...coordStart }, to: { r: hoverTile.r, c: hoverTile.c }, strength: 0.3 });
                        resources.wealth = Math.max(0, resources.wealth - 5);
                        addMessage('Linked!', gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                            gridOffsetY + hoverTile.r * tileSize, '#40b060');
                        Protagonist.recordConnection();
                    }
                    coordStart = null;
                }
            }
            return;
        }

        // Building
        if (tile.type === TILE_TYPES.EMPTY) {
            const cost = BUILD_COSTS[selectedBuild] || 10;
            if (resources.wealth >= cost) {
                tile.type = selectedBuild;
                tile.health = 100;
                tile.defecting = false;
                resources.wealth -= cost;
                addMessage(`-${cost}`, gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                    gridOffsetY + hoverTile.r * tileSize, '#cc9030');
            } else {
                addMessage('Not enough wealth!', gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                    gridOffsetY + hoverTile.r * tileSize, '#cc3030');
            }
        }
        // Right-click: upgrade/optimize (Faustian bargain)
        else if (input.mouse.rightClicked) {
            if (tile.type === TILE_TYPES.FARM) {
                tile.type = TILE_TYPES.FACTORY_FARM;
                moloch.power = Math.min(moloch.maxPower, moloch.power + 5);
                addMessage('Optimized...', gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                    gridOffsetY + hoverTile.r * tileSize, '#e85820');
                Protagonist.recordOptimization();
            } else if (tile.type === TILE_TYPES.ART_STUDIO) {
                tile.type = TILE_TYPES.CONTENT_FARM;
                moloch.power = Math.min(moloch.maxPower, moloch.power + 5);
                addMessage('Optimized...', gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                    gridOffsetY + hoverTile.r * tileSize, '#e85820');
                Protagonist.recordOptimization();
            } else if (tile.type === TILE_TYPES.SCHOOL) {
                tile.type = TILE_TYPES.TEST_PREP;
                moloch.power = Math.min(moloch.maxPower, moloch.power + 5);
                addMessage('Optimized...', gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                    gridOffsetY + hoverTile.r * tileSize, '#e85820');
                Protagonist.recordOptimization();
            }
        }

        // Hidden ending: feed buildings to Moloch (click center when building there)
        if (moloch.risen && !moloch.active) {
            const cr = Math.floor(GRID_SIZE / 2), cc = Math.floor(GRID_SIZE / 2);
            if (hoverTile.r >= cr - 1 && hoverTile.r <= cr && hoverTile.c >= cc - 1 && hoverTile.c <= cc) {
                if (tile.type !== TILE_TYPES.EMPTY && tile.type !== TILE_TYPES.WATER) {
                    tile.type = TILE_TYPES.EMPTY;
                    hiddenFedCount++;
                    moloch.power = Math.min(moloch.maxPower, moloch.power + 3);
                    addMessage('Fed to Moloch...', gridOffsetX + hoverTile.c * tileSize + tileSize / 2,
                        gridOffsetY + hoverTile.r * tileSize, '#e85820');
                    if (hiddenFedCount >= countPure() + countOptimized() + hiddenFedCount && hiddenFedCount >= 5) {
                        phase = 'hidden_ending';
                        Protagonist.addInsight(1, "Moloch can't agree even to a 99.99999% victory.");
                        Protagonist.completeLevel(1, 'hidden');
                        Protagonist.save();
                    }
                }
            }
        }
    }

    function handlePanelClick(mx, my) {
        const btnY = 200;
        const btnH = 34;
        const btnGap = 6;
        const builds = [
            { type: TILE_TYPES.FARM, label: 'Farm (10w)', cost: 10 },
            { type: TILE_TYPES.ART_STUDIO, label: 'Art Studio (15w)', cost: 15 },
            { type: TILE_TYPES.SCHOOL, label: 'School (15w)', cost: 15 },
            { type: TILE_TYPES.HOUSE, label: 'House (10w)', cost: 10 },
        ];

        if (phase === 'moloch_active' || phase === 'pressure') {
            builds.push({ type: TILE_TYPES.GARDEN, label: 'Garden (30w)', cost: 30 });
        }

        for (let i = 0; i < builds.length; i++) {
            const by = btnY + i * (btnH + btnGap);
            if (my >= by && my <= by + btnH && mx >= panelX + 5 && mx <= panelX + panelW - 5) {
                selectedBuild = builds[i].type;
                coordMode = false;
                coordStart = null;
                return;
            }
        }

        // Coordinate button
        const coordBtnY = btnY + builds.length * (btnH + btnGap) + 10;
        if (my >= coordBtnY && my <= coordBtnY + btnH && mx >= panelX + 5 && mx <= panelX + panelW - 5) {
            coordMode = !coordMode;
            coordStart = null;
            return;
        }

        // Casino button (appears when pressure phase)
        if (phase !== 'idyllic') {
            const casinoBtnY = coordBtnY + btnH + btnGap + 10;
            if (my >= casinoBtnY && my <= casinoBtnY + btnH && mx >= panelX + 5 && mx <= panelX + panelW - 5) {
                selectedBuild = TILE_TYPES.CASINO;
                coordMode = false;
                coordStart = null;
            }
        }
    }

    function onMouseDown(mx, my, button) {}
    function onMouseUp(mx, my, button) {}
    function onKeyDown(code) {}
    function onKeyUp(code) {}

    // --- END SCREEN ---
    function updateEndScreen(dt, input) {
        if (input.mouse.clicked) {
            if (phase === 'won') {
                showInsightPopup(1, "The only winning move is to coordinate — not against Moloch, but despite him.", () => returnToMenu());
            } else if (phase === 'hidden_ending') {
                showInsightPopup(1, "Moloch can't agree even to a 99.99999% victory.", () => returnToMenu());
            } else {
                returnToMenu();
            }
        }
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        computeLayout();

        ctx.fillStyle = '#0d0a1a';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) {
            renderTutorial(ctx);
            return;
        }

        if (phase === 'won' || phase === 'hidden_ending' || phase === 'lost') {
            renderEndScreen(ctx);
            return;
        }

        renderGrid(ctx);
        renderCitizens(ctx);
        renderMoloch(ctx);
        renderCoordLinks(ctx);
        renderPanel(ctx);
        renderMessages(ctx);
        renderGinsberg(ctx);
        renderDreamOverlay(ctx);
        renderGardenProgress(ctx);
        renderTooltip(ctx);
    }

    function renderGrid(ctx) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const tile = grid[r][c];
                const x = gridOffsetX + c * tileSize + tile.driftX;
                const y = gridOffsetY + r * tileSize + tile.driftY;

                ctx.fillStyle = TILE_COLORS[tile.type] || '#222';
                ctx.fillRect(x, y, tileSize - 1, tileSize - 1);

                // Health overlay
                if (tile.health < 100 && tile.type !== TILE_TYPES.EMPTY && tile.type !== TILE_TYPES.WATER) {
                    ctx.fillStyle = `rgba(200,0,0,${(100 - tile.health) / 200})`;
                    ctx.fillRect(x, y, tileSize - 1, tileSize - 1);
                }

                // Coordination glow
                if (tile.coordinated) {
                    ctx.strokeStyle = 'rgba(64, 176, 96, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 2, y + 2, tileSize - 5, tileSize - 5);
                }

                // Defection marker
                if (tile.defecting) {
                    ctx.strokeStyle = 'rgba(204, 48, 48, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 4, y + 4);
                    ctx.lineTo(x + tileSize - 5, y + tileSize - 5);
                    ctx.moveTo(x + tileSize - 5, y + 4);
                    ctx.lineTo(x + 4, y + tileSize - 5);
                    ctx.stroke();
                }

                // Hover
                if (hoverTile && hoverTile.r === r && hoverTile.c === c) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, tileSize - 1, tileSize - 1);
                }

                // Tile icon (simple symbols)
                if (tile.type !== TILE_TYPES.EMPTY && tile.type !== TILE_TYPES.WATER) {
                    ctx.font = `${Math.floor(tileSize * 0.4)}px sans-serif`;
                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const icons = {
                        [TILE_TYPES.FARM]: '\u{1F33E}',       // sheaf
                        [TILE_TYPES.ART_STUDIO]: '\u{1F3A8}', // palette
                        [TILE_TYPES.SCHOOL]: '\u{1F4DA}',     // books
                        [TILE_TYPES.HOUSE]: '\u{1F3E0}',      // house
                        [TILE_TYPES.FACTORY_FARM]: '\u{1F3ED}', // factory
                        [TILE_TYPES.CONTENT_FARM]: '\u{1F4F1}', // phone
                        [TILE_TYPES.TEST_PREP]: '\u{1F4DD}',  // memo
                        [TILE_TYPES.CASINO]: '\u{1F3B0}',     // slot machine
                        [TILE_TYPES.GARDEN]: '\u{1F337}'       // tulip
                    };
                    ctx.fillText(icons[tile.type] || '?', x + tileSize / 2, y + tileSize / 2);
                }
            }
        }
    }

    function renderCitizens(ctx) {
        for (const cit of citizens) {
            const g = cit.grey;
            if (g > 0.8) {
                ctx.fillStyle = '#666';
            } else {
                ctx.fillStyle = cit.color;
            }
            ctx.beginPath();
            ctx.arc(cit.x, cit.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function renderMoloch(ctx) {
        if (!moloch.risen) return;

        const cx = gridOffsetX + GRID_SIZE * tileSize / 2;
        const cy = gridOffsetY + GRID_SIZE * tileSize / 2;
        const time = Date.now() / 1000;

        // Moloch glow
        const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, tileSize * 2.5);
        gradient.addColorStop(0, `rgba(232, 88, 32, ${moloch.glow * 0.5})`);
        gradient.addColorStop(0.5, `rgba(232, 88, 32, ${moloch.glow * 0.2})`);
        gradient.addColorStop(1, 'rgba(232, 88, 32, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - tileSize * 3, cy - tileSize * 3, tileSize * 6, tileSize * 6);

        // Moloch figure (geometric stone idol)
        ctx.fillStyle = `rgba(100, 70, 50, ${0.5 + moloch.glow * 0.5})`;
        // Body
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy + 20);
        ctx.lineTo(cx + 15, cy + 20);
        ctx.lineTo(cx + 10, cy - 15);
        ctx.lineTo(cx, cy - 25);
        ctx.lineTo(cx - 10, cy - 15);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = `rgba(255, 100, 30, ${moloch.glow})`;
        ctx.fillRect(cx - 8, cy - 12, 5, 3);
        ctx.fillRect(cx + 3, cy - 12, 5, 3);

        // Furnace mouth (when active)
        if (moloch.active) {
            ctx.fillStyle = `rgba(255, 60, 20, ${0.5 + Math.sin(time * 5) * 0.3})`;
            ctx.fillRect(cx - 5, cy - 2, 10, 6);
        }

        if (dreamTime) {
            // Sleeping effect
            ctx.font = '14px serif';
            ctx.fillStyle = 'rgba(150,150,200,0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('z z z', cx + 20, cy - 30 + Math.sin(time * 2) * 5);
        }
    }

    function renderCoordLinks(ctx) {
        for (const link of coordLinks) {
            const x1 = gridOffsetX + link.from.c * tileSize + tileSize / 2;
            const y1 = gridOffsetY + link.from.r * tileSize + tileSize / 2;
            const x2 = gridOffsetX + link.to.c * tileSize + tileSize / 2;
            const y2 = gridOffsetY + link.to.r * tileSize + tileSize / 2;
            ctx.strokeStyle = `rgba(64, 176, 96, ${link.strength * 0.6})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    function renderPanel(ctx) {
        // Background
        ctx.fillStyle = 'rgba(26, 20, 40, 0.9)';
        ctx.fillRect(panelX, 0, panelW, H);
        ctx.strokeStyle = '#3d3060';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX, 0);
        ctx.lineTo(panelX, H);
        ctx.stroke();

        let py = 60;

        // Resources
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText('RESOURCES', panelX + 10, py);
        py += 20;

        const res = [
            { name: 'Food', val: Math.floor(resources.food), color: '#4a8a3a' },
            { name: 'Culture', val: Math.floor(resources.culture), color: '#8a5ab0' },
            { name: 'Knowledge', val: Math.floor(resources.knowledge), color: '#3a7abc' },
            { name: 'Wealth', val: Math.floor(resources.wealth), color: '#cc9030' },
            { name: 'Population', val: Math.floor(resources.population), color: '#aa8a5a' },
        ];
        for (const r of res) {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = r.color;
            ctx.fillText(`${r.name}: ${r.val}`, panelX + 10, py);
            py += 18;
        }

        py += 10;
        // Phase
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('PHASE', panelX + 10, py);
        py += 16;
        const phaseNames = {
            'idyllic': 'The Idyllic Age',
            'pressure': 'Carrying Capacity',
            'moloch_rising': 'Moloch Rises',
            'moloch_active': 'Moloch Active'
        };
        ctx.font = 'bold 13px serif';
        ctx.fillStyle = phase === 'moloch_active' ? '#e85820' : '#ffd764';
        ctx.fillText(phaseNames[phase] || phase, panelX + 10, py);
        py += 10;

        // Moloch power bar
        if (moloch.risen) {
            py += 10;
            Engine.drawBar(ctx, panelX + 10, py, panelW - 20, 12, moloch.power, moloch.maxPower, '#e85820', '#2a1a10');
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#cc8a60';
            ctx.textAlign = 'center';
            ctx.fillText(`Moloch: ${Math.floor(moloch.power)}%`, panelX + panelW / 2, py + 10);
            ctx.textAlign = 'left';
            py += 20;
        }

        py += 10;

        // Build buttons
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('BUILD (click grid)', panelX + 10, py);
        py += 12;

        const btnH = 34;
        const btnGap = 6;
        const builds = [
            { type: TILE_TYPES.FARM, label: 'Farm (10w)', cost: 10 },
            { type: TILE_TYPES.ART_STUDIO, label: 'Art Studio (15w)', cost: 15 },
            { type: TILE_TYPES.SCHOOL, label: 'School (15w)', cost: 15 },
            { type: TILE_TYPES.HOUSE, label: 'House (10w)', cost: 10 },
        ];
        if (phase === 'moloch_active' || phase === 'pressure') {
            builds.push({ type: TILE_TYPES.GARDEN, label: 'Garden (30w)', cost: 30 });
        }

        for (let i = 0; i < builds.length; i++) {
            const by = py + i * (btnH + btnGap);
            const sel = selectedBuild === builds[i].type && !coordMode;
            ctx.fillStyle = sel ? '#3d3060' : '#1a1428';
            ctx.fillRect(panelX + 5, by, panelW - 10, btnH);
            ctx.strokeStyle = sel ? '#ffd764' : '#3d3060';
            ctx.lineWidth = sel ? 2 : 1;
            ctx.strokeRect(panelX + 5, by, panelW - 10, btnH);
            ctx.font = '13px sans-serif';
            ctx.fillStyle = resources.wealth >= builds[i].cost ? '#e8e0f0' : '#6a5890';
            ctx.textAlign = 'left';
            ctx.fillText(builds[i].label, panelX + 14, by + btnH / 2 + 4);
        }

        // Coordinate button
        const coordBtnY = py + builds.length * (btnH + btnGap) + 10;
        ctx.fillStyle = coordMode ? '#1a3a2a' : '#1a1428';
        ctx.fillRect(panelX + 5, coordBtnY, panelW - 10, btnH);
        ctx.strokeStyle = coordMode ? '#40b060' : '#3d3060';
        ctx.lineWidth = coordMode ? 2 : 1;
        ctx.strokeRect(panelX + 5, coordBtnY, panelW - 10, btnH);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#40b060';
        ctx.textAlign = 'left';
        ctx.fillText('Coordinate (5w)', panelX + 14, coordBtnY + btnH / 2 + 4);

        // Casino button
        if (phase !== 'idyllic') {
            const casinoBtnY = coordBtnY + btnH + btnGap + 10;
            const sel = selectedBuild === TILE_TYPES.CASINO && !coordMode;
            ctx.fillStyle = sel ? '#3a2a10' : '#1a1428';
            ctx.fillRect(panelX + 5, casinoBtnY, panelW - 10, btnH);
            ctx.strokeStyle = sel ? '#cc8a20' : '#3d3060';
            ctx.lineWidth = sel ? 2 : 1;
            ctx.strokeRect(panelX + 5, casinoBtnY, panelW - 10, btnH);
            ctx.font = '13px sans-serif';
            ctx.fillStyle = '#cc8a20';
            ctx.fillText("Caesar's Palace (10w)", panelX + 14, casinoBtnY + btnH / 2 + 4);
        }

        // Instructions
        const instY = H - 80;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'left';
        ctx.fillText('Left-click: Build', panelX + 10, instY);
        ctx.fillText('Right-click: Optimize (Faustian)', panelX + 10, instY + 14);
        ctx.fillText('Coordinate: Link pure buildings', panelX + 10, instY + 28);
        if (phase === 'moloch_active') {
            ctx.fillText('Goal: 5 coordinated buildings + Garden', panelX + 10, instY + 42);
            ctx.fillText(`for ${GARDEN_WIN_TIME}s (${Math.floor(gardenTimer)}s/${GARDEN_WIN_TIME}s)`, panelX + 10, instY + 56);
        }
    }

    function renderMessages(ctx) {
        for (const m of messages) {
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = m.color.replace(')', `,${Math.max(0, m.alpha)})`).replace('rgb', 'rgba');
            if (!m.color.startsWith('rgba')) {
                ctx.globalAlpha = Math.max(0, m.alpha);
            }
            ctx.textAlign = 'center';
            ctx.fillText(m.text, m.x, m.y);
            ctx.globalAlpha = 1;
        }
    }

    function renderGinsberg(ctx) {
        if (ginsbergAlpha <= 0 || !currentGinsberg) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, ginsbergAlpha);
        ctx.font = 'italic bold 20px serif';
        ctx.fillStyle = '#e85820';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(currentGinsberg, gridOffsetX + GRID_SIZE * tileSize / 2, gridOffsetY - 30);
        ctx.restore();
    }

    function renderDreamOverlay(ctx) {
        if (!dreamTime) return;
        ctx.save();
        const time = Date.now() / 1000;
        ctx.fillStyle = `rgba(255, 215, 100, ${0.03 + Math.sin(time) * 0.02})`;
        ctx.fillRect(gridOffsetX, gridOffsetY, GRID_SIZE * tileSize, GRID_SIZE * tileSize);
        ctx.font = 'italic 14px serif';
        ctx.fillStyle = 'rgba(255, 215, 100, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('~ The Dream Time ~', gridOffsetX + GRID_SIZE * tileSize / 2, gridOffsetY + GRID_SIZE * tileSize + 20);
        ctx.restore();
    }

    function renderGardenProgress(ctx) {
        if (phase !== 'moloch_active') return;
        if (gardenTimer <= 0) return;
        const barW = GRID_SIZE * tileSize;
        const barH = 8;
        const barX = gridOffsetX;
        const barY = gridOffsetY + GRID_SIZE * tileSize + 5;
        Engine.drawBar(ctx, barX, barY, barW, barH, gardenTimer, GARDEN_WIN_TIME, '#60c060', '#1a2a1a');
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#60c060';
        ctx.textAlign = 'center';
        ctx.fillText(`Garden: ${Math.floor(gardenTimer)}s / ${GARDEN_WIN_TIME}s`, barX + barW / 2, barY + barH + 12);
    }

    function renderTooltip(ctx) {
        if (!tooltipText) return;
        if (!hoverTile) return;
        const x = gridOffsetX + hoverTile.c * tileSize + tileSize + 5;
        const y = gridOffsetY + hoverTile.r * tileSize;
        ctx.font = '11px sans-serif';
        const tw = ctx.measureText(tooltipText).width + 12;
        ctx.fillStyle = 'rgba(26, 20, 40, 0.9)';
        ctx.fillRect(x, y, tw, 20);
        ctx.fillStyle = '#e8e0f0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tooltipText, x + 6, y + 10);
    }

    function renderTutorial(ctx) {
        ctx.fillStyle = 'rgba(13, 10, 26, 0.95)';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'MEDITATIONS ON MOLOCH',
                text: '"Moloch whose mind is pure machinery! Moloch whose blood is running money!"\n\nYou stand on a pristine island. Build a civilization.\nBut beware: every optimization feeds Moloch.'
            },
            {
                title: 'BUILDING',
                text: 'Click to place buildings on the island.\nFarms grow food. Art Studios create culture.\nSchools generate knowledge. Houses grow population.\n\nRight-click a building to "optimize" it\n— more output, but at what cost?'
            },
            {
                title: 'THE COORDINATION CHALLENGE',
                text: 'When Moloch rises, he pulls everything toward optimization.\nThe only defense: coordinate your buildings.\nLinked pure buildings resist his pull.\n\nBut under pressure, buildings defect...'
            },
            {
                title: 'YOUR MISSION',
                text: 'Build a Garden and sustain 5 coordinated\nun-optimized buildings for 60 seconds\nwhile Moloch is fully active.\n\nOr... discover the hidden ending.\n\nClick to begin.'
            }
        ];

        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 28px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, cx, cy - 100);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        const lines = step.text.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, cx, cy - 40 + i * 24);
        });

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Click to continue (${tutorialStep + 1}/${steps.length})`, cx, cy + 160);
    }

    function renderEndScreen(ctx) {
        ctx.fillStyle = 'rgba(13, 10, 26, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;

        if (phase === 'won') {
            ctx.font = 'bold 32px serif';
            ctx.fillStyle = '#60c060';
            ctx.textAlign = 'center';
            ctx.fillText('THE GARDEN ENDURES', cx, cy - 60);
            ctx.font = 'italic 18px serif';
            ctx.fillStyle = '#ffd764';
            ctx.fillText('"The only winning move is to coordinate —"', cx, cy);
            ctx.fillText('"not against Moloch, but despite him."', cx, cy + 26);
        } else if (phase === 'hidden_ending') {
            ctx.font = 'bold 28px serif';
            ctx.fillStyle = '#e85820';
            ctx.textAlign = 'center';
            ctx.fillText('MOLOCH\'S PERSPECTIVE', cx, cy - 80);
            ctx.font = '16px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText('For a moment, you see through his eyes.', cx, cy - 40);
            ctx.fillText('He is not evil. He is not even alive.', cx, cy - 16);
            ctx.fillText('He is an emergent property of competition.', cx, cy + 8);
            ctx.font = 'italic 18px serif';
            ctx.fillStyle = '#ffd764';
            ctx.fillText('"Moloch can\'t agree even to a 99.99999% victory."', cx, cy + 50);
        } else {
            ctx.font = 'bold 32px serif';
            ctx.fillStyle = '#cc3030';
            ctx.textAlign = 'center';
            ctx.fillText('MOLOCH CONSUMED ALL', cx, cy - 40);
            ctx.font = '16px serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText('The island is silent. The furnace burns.', cx, cy + 10);
        }

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, cy + 120);
    }

    function cleanup() {
        // nothing dynamic to dispose
    }

    return {
        init, update, render, cleanup,
        onResize, onMouseDown, onMouseUp, onKeyDown, onKeyUp
    };
})();
