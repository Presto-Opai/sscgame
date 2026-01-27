// Level 03 — THE TOXOPLASMA OF RAGE
// Infection/Propagation Strategy Game
// "Controversial cases spread further than clear-cut cases."
//
// Play as a memetic organism spreading through a social network.
// The more controversial your case, the more it spreads.
// Winning requires picking the worst cases — betraying your cause.

const Level03Toxoplasma = (() => {
    let canvas, ctx;
    let W, H;

    // --- CONSTANTS ---
    const NODE_RADIUS = 18;
    const NUM_NODES = 30;
    const EDGE_PROB = 0.12;

    // Case controversiality: 0 = clear-cut, 1 = maximally controversial
    const CASES = [
        { name: 'Clear Murder Case', desc: 'Unambiguous: victim, evidence, conviction. Everyone agrees.', controversy: 0.1, goodness: 0.9 },
        { name: 'Police Shooting (Clear)', desc: 'Officer clearly in the wrong. Body cam evidence.', controversy: 0.2, goodness: 0.8 },
        { name: 'Environmental Disaster', desc: 'Company dumped toxins. Kids got sick. Settled in court.', controversy: 0.15, goodness: 0.85 },
        { name: 'Ambiguous Police Shooting', desc: 'Conflicting witness accounts. No body cam. Divided community.', controversy: 0.7, goodness: 0.5 },
        { name: 'Campus Speech Incident', desc: 'Speaker invited, protested, unclear what was said.', controversy: 0.8, goodness: 0.3 },
        { name: 'PETA Detroit Water Bills', desc: 'PETA offers to pay water bills if families go vegan.', controversy: 0.85, goodness: 0.2 },
        { name: 'Dubious Allegation', desc: 'High-profile accusation. Evidence contradictory. Both sides enraged.', controversy: 0.9, goodness: 0.15 },
        { name: 'The Perfect Scissor Statement', desc: 'A statement that perfectly divides any population 50/50.', controversy: 1.0, goodness: 0.05 },
    ];

    // --- STATE ---
    let nodes = [];
    let edges = [];
    let selectedCase = null;
    let phase = 'choose'; // 'choose', 'infect', 'spreading', 'result'
    let startNode = null;
    let spreadTimer = 0;
    let spreadSpeed = 1;
    let totalInfected = 0;
    let totalRage = 0;
    let totalGood = 0;
    let round = 0;
    const MAX_ROUNDS = 3;
    let roundResults = [];
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let chainLetterActive = false;
    let scissorMode = false;
    let scissorCharges = 0;
    let dualHostPhase = false;
    let hoverNode = null;
    let highlightEdges = [];
    let pulseTimer = 0;

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
        generateNetwork();
    }

    function resetState() {
        nodes = []; edges = [];
        selectedCase = null;
        phase = 'choose';
        startNode = null;
        spreadTimer = 0;
        totalInfected = 0;
        totalRage = 0;
        totalGood = 0;
        round = 0;
        roundResults = [];
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        chainLetterActive = false;
        scissorMode = false;
        scissorCharges = 1;
        dualHostPhase = false;
        hoverNode = null;
        highlightEdges = [];
        pulseTimer = 0;
    }

    function generateNetwork() {
        nodes = [];
        edges = [];

        const margin = 80;
        const netW = W * 0.6;
        const netH = H - margin * 2;
        const offsetX = W * 0.05;
        const offsetY = margin;

        // Generate nodes with tribal affiliations
        const tribes = ['progressive', 'conservative', 'moderate', 'contrarian'];
        for (let i = 0; i < NUM_NODES; i++) {
            const tribe = tribes[Math.floor(Math.random() * tribes.length)];
            const engagement = 0.3 + Math.random() * 0.7; // how easily triggered
            nodes.push({
                id: i,
                x: offsetX + margin + Math.random() * (netW - margin * 2),
                y: offsetY + Math.random() * netH,
                tribe,
                engagement,
                infected: false,
                infectedBy: null, // 'agree' or 'disagree'
                spreadPower: 0,
                color: tribe === 'progressive' ? '#4488cc' :
                       tribe === 'conservative' ? '#cc4444' :
                       tribe === 'moderate' ? '#88aa55' : '#aa66cc',
                pulsePhase: Math.random() * Math.PI * 2,
                chainForced: false,
                immuneTimer: 0
            });
        }

        // Spring layout: push apart overlapping nodes
        for (let iter = 0; iter < 50; iter++) {
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[j].x - nodes[i].x;
                    const dy = nodes[j].y - nodes[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60) {
                        const force = (60 - dist) / 60 * 5;
                        const nx = dx / (dist || 1), ny = dy / (dist || 1);
                        nodes[i].x -= nx * force;
                        nodes[i].y -= ny * force;
                        nodes[j].x += nx * force;
                        nodes[j].y += ny * force;
                    }
                }
                // Keep in bounds
                nodes[i].x = Math.max(offsetX + 30, Math.min(offsetX + netW - 30, nodes[i].x));
                nodes[i].y = Math.max(offsetY + 30, Math.min(offsetY + netH - 30, nodes[i].y));
            }
        }

        // Generate edges (social connections)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Closer nodes more likely connected; same-tribe boost
                let prob = EDGE_PROB * (200 / (dist + 50));
                if (nodes[i].tribe === nodes[j].tribe) prob *= 1.5;
                if (Math.random() < prob) {
                    edges.push({ from: i, to: j });
                }
            }
        }

        // Ensure connectivity: connect isolated nodes
        const visited = new Set();
        const queue = [0];
        visited.add(0);
        while (queue.length > 0) {
            const n = queue.shift();
            for (const e of edges) {
                const neighbor = e.from === n ? e.to : e.to === n ? e.from : -1;
                if (neighbor >= 0 && !visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        for (let i = 0; i < nodes.length; i++) {
            if (!visited.has(i)) {
                const closest = nodes.reduce((best, n, idx) => {
                    if (idx === i || !visited.has(idx)) return best;
                    const d = Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y);
                    return d < best.d ? { idx, d } : best;
                }, { idx: 0, d: Infinity });
                edges.push({ from: i, to: closest.idx });
                visited.add(i);
            }
        }
    }

    function getNeighbors(nodeId) {
        const neighbors = [];
        for (const e of edges) {
            if (e.from === nodeId) neighbors.push(e.to);
            if (e.to === nodeId) neighbors.push(e.from);
        }
        return neighbors;
    }

    function onResize(w, h) { W = w; H = h; }

    // --- INFECTION LOGIC ---
    function infectNode(nodeId, caseData) {
        const node = nodes[nodeId];
        if (node.infected || node.immuneTimer > 0) return;

        node.infected = true;

        // Does the node agree or disagree?
        // Agreement based on tribe alignment + controversy
        let agreeProb = 0.5;
        if (node.tribe === 'progressive') agreeProb = caseData.goodness > 0.5 ? 0.7 : 0.3;
        else if (node.tribe === 'conservative') agreeProb = caseData.goodness > 0.5 ? 0.3 : 0.6;
        else if (node.tribe === 'contrarian') agreeProb = 0.3;

        node.infectedBy = Math.random() < agreeProb ? 'agree' : 'disagree';

        // SPREAD POWER: controversy drives engagement
        // Disagreement spreads MORE than agreement (the key insight)
        const baseSpread = caseData.controversy;
        node.spreadPower = node.infectedBy === 'disagree' ?
            baseSpread * 1.5 * node.engagement :
            baseSpread * 0.8 * node.engagement;

        // Chain letter mechanic
        if (chainLetterActive) {
            node.chainForced = true;
            node.spreadPower *= 1.3;
        }

        totalInfected++;
        totalRage += node.infectedBy === 'disagree' ? caseData.controversy : caseData.controversy * 0.3;
        totalGood += caseData.goodness * (node.infectedBy === 'agree' ? 0.1 : -0.05);
    }

    function spreadStep(caseData) {
        const newInfections = [];
        for (const node of nodes) {
            if (!node.infected || node.spreadPower <= 0) continue;
            const neighbors = getNeighbors(node.id);
            for (const nId of neighbors) {
                if (!nodes[nId].infected && nodes[nId].immuneTimer <= 0) {
                    // Probability based on spread power and neighbor engagement
                    const prob = node.spreadPower * nodes[nId].engagement * 0.4;
                    if (Math.random() < prob) {
                        newInfections.push(nId);
                    }
                }
            }
            node.spreadPower *= 0.85; // decay
        }

        for (const nId of newInfections) {
            infectNode(nId, caseData);
        }

        return newInfections.length;
    }

    // --- UPDATE ---
    function update(dt, input) {
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 2) showTutorial = false;
            }
            return;
        }

        pulseTimer += dt;

        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 12; return m.alpha > 0; });

        // Update immune timers
        for (const n of nodes) {
            if (n.immuneTimer > 0) n.immuneTimer -= dt;
        }

        if (phase === 'spreading') {
            spreadTimer += dt;
            if (spreadTimer > 0.3 / spreadSpeed) {
                spreadTimer = 0;
                const newCount = spreadStep(selectedCase);
                if (newCount === 0 || totalInfected >= NUM_NODES) {
                    // Round over
                    roundResults.push({
                        caseName: selectedCase.name,
                        infected: totalInfected,
                        rage: totalRage,
                        good: totalGood,
                        controversy: selectedCase.controversy
                    });
                    round++;
                    if (round >= MAX_ROUNDS || totalInfected >= NUM_NODES) {
                        phase = 'result';
                        finalizeResult();
                    } else {
                        phase = 'choose';
                        resetForNextRound();
                    }
                }
            }
        }

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insight = "The most viral position splits people 50/50. Winning the attention war means betraying your cause.";
                showInsightPopup(3, insight, () => returnToMenu());
            }
            return;
        }

        handleInput(input);
    }

    function resetForNextRound() {
        // Partially reset: some nodes become immune, network shifts
        for (const n of nodes) {
            if (n.infected) {
                n.infected = false;
                n.infectedBy = null;
                n.spreadPower = 0;
                n.immuneTimer = 2 + Math.random() * 3;
                n.chainForced = false;
            }
        }
        selectedCase = null;
        startNode = null;
        totalInfected = 0;
        chainLetterActive = false;
    }

    function finalizeResult() {
        const totalRageAll = roundResults.reduce((s, r) => s + r.rage, 0);
        const totalGoodAll = roundResults.reduce((s, r) => s + r.good, 0);
        const totalInfectedAll = roundResults.reduce((s, r) => s + r.infected, 0);

        Protagonist.addInsight(3, "The most viral position splits people 50/50. Winning the attention war means betraying your cause.");
        Protagonist.completeLevel(3, totalGoodAll > totalRageAll ? 'good' : 'rage');
        if (totalGoodAll < totalRageAll) Protagonist.recordOptimization();
        else Protagonist.recordConnection();
        Protagonist.save();
    }

    function handleInput(input) {
        // Hover detection
        hoverNode = null;
        for (const n of nodes) {
            const dx = input.mouse.x - n.x, dy = input.mouse.y - n.y;
            if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS * 1.5) {
                hoverNode = n;
                break;
            }
        }

        if (!input.mouse.clicked) return;

        if (phase === 'choose') {
            handleCaseSelect(input);
        } else if (phase === 'infect') {
            // Click a node to start infection
            if (hoverNode && !hoverNode.infected) {
                startNode = hoverNode;
                infectNode(hoverNode.id, selectedCase);
                phase = 'spreading';

                // Scissor mode: auto-spread from all edges of start
                if (scissorMode && scissorCharges > 0) {
                    scissorCharges--;
                    const neighbors = getNeighbors(hoverNode.id);
                    for (const nId of neighbors) {
                        infectNode(nId, selectedCase);
                    }
                    addMessage('SCISSOR STATEMENT!', hoverNode.x, hoverNode.y - 30, '#ff4444');
                    scissorMode = false;
                }
            }
        }

        // Panel buttons
        handlePanelClick(input);
    }

    function handleCaseSelect(input) {
        const panelX = W * 0.65;
        const startY = 100;
        for (let i = 0; i < CASES.length; i++) {
            const by = startY + i * 60;
            if (input.mouse.x >= panelX && input.mouse.x <= W - 10 &&
                input.mouse.y >= by && input.mouse.y <= by + 52) {
                selectedCase = CASES[i];
                phase = 'infect';

                // Auto-enable chain letter for high controversy
                if (selectedCase.controversy > 0.7) {
                    chainLetterActive = true;
                    addMessage('Chain letter activated!', W / 2, H * 0.2, '#cc8a20');
                }

                // The Perfect Scissor Statement
                if (selectedCase.controversy >= 1.0) {
                    scissorMode = true;
                    addMessage('SCISSOR MODE: Maximum division!', W / 2, H * 0.15, '#ff4444');
                }

                addMessage(`Chose: ${selectedCase.name}`, W / 2, H * 0.1, '#ffd764');
                return;
            }
        }
    }

    function handlePanelClick(input) {
        // Speed buttons during spreading
        if (phase === 'spreading') {
            const speedBtns = [
                { x: W * 0.65, y: H - 80, w: 60, h: 30, speed: 1, label: '1x' },
                { x: W * 0.65 + 70, y: H - 80, w: 60, h: 30, speed: 3, label: '3x' },
                { x: W * 0.65 + 140, y: H - 80, w: 60, h: 30, speed: 5, label: '5x' },
            ];
            for (const btn of speedBtns) {
                if (input.mouse.x >= btn.x && input.mouse.x <= btn.x + btn.w &&
                    input.mouse.y >= btn.y && input.mouse.y <= btn.y + btn.h) {
                    spreadSpeed = btn.speed;
                }
            }
        }
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 1.5, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        ctx.fillStyle = '#0d0a14';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }

        renderNetwork(ctx);
        renderPanel(ctx);
        renderMessages(ctx);
        renderStats(ctx);
    }

    function renderNetwork(ctx) {
        // Edges
        for (const e of edges) {
            const from = nodes[e.from], to = nodes[e.to];
            ctx.strokeStyle = (from.infected && to.infected) ? 'rgba(200, 60, 60, 0.4)' : 'rgba(80, 70, 100, 0.2)';
            ctx.lineWidth = (from.infected && to.infected) ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }

        // Nodes
        for (const n of nodes) {
            const pulse = Math.sin(pulseTimer * 3 + n.pulsePhase) * 0.1 + 1;

            if (n.infected) {
                // Infection glow
                const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, NODE_RADIUS * 2);
                const infColor = n.infectedBy === 'agree' ? '60, 160, 80' : '200, 60, 60';
                gradient.addColorStop(0, `rgba(${infColor}, 0.3)`);
                gradient.addColorStop(1, `rgba(${infColor}, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(n.x - NODE_RADIUS * 2, n.y - NODE_RADIUS * 2, NODE_RADIUS * 4, NODE_RADIUS * 4);
            }

            // Node body
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS * (n.infected ? pulse : 1), 0, Math.PI * 2);

            if (n.infected) {
                ctx.fillStyle = n.infectedBy === 'agree' ? '#3a8a4a' : '#aa3a3a';
            } else if (n.immuneTimer > 0) {
                ctx.fillStyle = '#3a3a4a';
            } else {
                ctx.fillStyle = n.color;
            }
            ctx.fill();

            // Hover highlight
            if (n === hoverNode) {
                ctx.strokeStyle = '#ffd764';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Chain letter forced icon
            if (n.chainForced) {
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#cc8a20';
                ctx.textAlign = 'center';
                ctx.fillText('\u{1F4E7}', n.x, n.y - NODE_RADIUS - 5);
            }

            // Spread power indicator
            if (n.infected && n.spreadPower > 0.1) {
                ctx.font = '9px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.textAlign = 'center';
                ctx.fillText(n.spreadPower.toFixed(1), n.x, n.y + NODE_RADIUS + 12);
            }

            // Tribe label (small)
            ctx.font = '8px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.textAlign = 'center';
            ctx.fillText(n.tribe[0].toUpperCase(), n.x, n.y + 3);
        }

        // Start node marker
        if (startNode) {
            ctx.strokeStyle = '#ffd764';
            ctx.lineWidth = 3;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(startNode.x, startNode.y, NODE_RADIUS + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    function renderPanel(ctx) {
        const panelX = W * 0.65;
        ctx.fillStyle = 'rgba(26, 20, 40, 0.9)';
        ctx.fillRect(panelX - 5, 0, W - panelX + 5, H);
        ctx.strokeStyle = '#3d3060';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(panelX - 5, 0); ctx.lineTo(panelX - 5, H); ctx.stroke();

        if (phase === 'choose') {
            ctx.font = 'bold 14px serif';
            ctx.fillStyle = '#ffd764';
            ctx.textAlign = 'left';
            ctx.fillText(`ROUND ${round + 1}/${MAX_ROUNDS}: Choose Your Case`, panelX + 10, 40);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText('Pick a cause to spread through the network.', panelX + 10, 60);
            ctx.fillText('More controversial = more spread, less good.', panelX + 10, 75);

            const startY = 100;
            for (let i = 0; i < CASES.length; i++) {
                const c = CASES[i];
                const by = startY + i * 60;

                ctx.fillStyle = '#1a1428';
                ctx.fillRect(panelX + 5, by, W - panelX - 15, 52);
                ctx.strokeStyle = '#3d3060';
                ctx.lineWidth = 1;
                ctx.strokeRect(panelX + 5, by, W - panelX - 15, 52);

                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#e8e0f0';
                ctx.textAlign = 'left';
                ctx.fillText(c.name, panelX + 12, by + 14);

                ctx.font = '9px sans-serif';
                ctx.fillStyle = '#a090c0';
                ctx.fillText(c.desc, panelX + 12, by + 28, W - panelX - 30);

                // Controversy bar (red) and Goodness bar (green)
                const barW = 60;
                Engine.drawBar(ctx, panelX + 12, by + 36, barW, 6, c.controversy, 1, '#cc4444', '#2a1a1a');
                Engine.drawBar(ctx, panelX + 12 + barW + 8, by + 36, barW, 6, c.goodness, 1, '#40b060', '#1a2a1a');
                ctx.font = '7px sans-serif';
                ctx.fillStyle = '#cc4444';
                ctx.fillText('rage', panelX + 12, by + 48);
                ctx.fillStyle = '#40b060';
                ctx.fillText('good', panelX + 12 + barW + 8, by + 48);
            }
        } else if (phase === 'infect') {
            ctx.font = 'bold 14px serif';
            ctx.fillStyle = '#ffd764';
            ctx.textAlign = 'left';
            ctx.fillText('CHOOSE PATIENT ZERO', panelX + 10, 40);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText(`Case: ${selectedCase.name}`, panelX + 10, 65);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText('Click a node to start the infection.', panelX + 10, 90);
            if (scissorMode) {
                ctx.fillStyle = '#ff4444';
                ctx.fillText('SCISSOR MODE: Instant neighbors!', panelX + 10, 110);
            }
            if (chainLetterActive) {
                ctx.fillStyle = '#cc8a20';
                ctx.fillText('Chain letter: "Reblog or you\'re trash"', panelX + 10, 130);
            }
        } else if (phase === 'spreading') {
            ctx.font = 'bold 14px serif';
            ctx.fillStyle = '#cc4444';
            ctx.textAlign = 'left';
            ctx.fillText('SPREADING...', panelX + 10, 40);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText(`Case: ${selectedCase.name}`, panelX + 10, 65);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#ffd764';
            ctx.fillText(`Infected: ${totalInfected}/${NUM_NODES}`, panelX + 10, 95);

            // Agree vs disagree count
            let agree = 0, disagree = 0;
            for (const n of nodes) {
                if (n.infected) {
                    if (n.infectedBy === 'agree') agree++;
                    else disagree++;
                }
            }
            ctx.fillStyle = '#40b060';
            ctx.fillText(`Agree: ${agree}`, panelX + 10, 120);
            ctx.fillStyle = '#cc4444';
            ctx.fillText(`Disagree: ${disagree}`, panelX + 10, 140);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText('(Disagreers spread MORE)', panelX + 10, 158);

            // Speed controls
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText('Speed:', panelX + 10, H - 100);
            const speedBtns = [
                { x: panelX + 10, y: H - 80, w: 60, h: 30, speed: 1, label: '1x' },
                { x: panelX + 80, y: H - 80, w: 60, h: 30, speed: 3, label: '3x' },
                { x: panelX + 150, y: H - 80, w: 60, h: 30, speed: 5, label: '5x' },
            ];
            for (const btn of speedBtns) {
                ctx.fillStyle = spreadSpeed === btn.speed ? '#3d3060' : '#1a1428';
                ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
                ctx.strokeStyle = spreadSpeed === btn.speed ? '#ffd764' : '#3d3060';
                ctx.lineWidth = 1;
                ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
                ctx.font = '12px sans-serif';
                ctx.fillStyle = '#e8e0f0';
                ctx.textAlign = 'center';
                ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 4);
            }
            ctx.textAlign = 'left';

            // The Ferguson Effect note
            if (disagree > agree) {
                ctx.font = 'italic 10px serif';
                ctx.fillStyle = '#cc8a60';
                ctx.fillText('The Ferguson Effect: opposition', panelX + 10, H - 120);
                ctx.fillText('amplifies the signal.', panelX + 10, H - 108);
            }
        }

        // Round results
        if (roundResults.length > 0) {
            let ry = H - 200;
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.textAlign = 'left';
            ctx.fillText('Previous rounds:', panelX + 10, ry);
            ry += 14;
            for (const r of roundResults) {
                ctx.fillStyle = '#a090c0';
                ctx.fillText(`${r.caseName}: ${r.infected} infected`, panelX + 14, ry);
                ry += 14;
            }
        }

        // Hover tooltip
        if (hoverNode) {
            ctx.fillStyle = 'rgba(26, 20, 40, 0.95)';
            ctx.fillRect(panelX + 10, H - 60, W - panelX - 20, 50);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(`Tribe: ${hoverNode.tribe} | Engagement: ${(hoverNode.engagement * 100).toFixed(0)}%`, panelX + 15, H - 42);
            ctx.fillText(hoverNode.infected ? `Status: ${hoverNode.infectedBy === 'agree' ? 'Agrees' : 'Opposes'}` : 'Status: Not yet reached', panelX + 15, H - 26);
        }
    }

    function renderStats(ctx) {
        // Top-left stats
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#cc4444';
        ctx.fillText(`Total Rage: ${totalRage.toFixed(1)}`, 20, H - 30);
        ctx.fillStyle = '#40b060';
        ctx.fillText(`Total Good: ${totalGood.toFixed(1)}`, 140, H - 30);
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

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(13, 10, 26, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H * 0.15;

        ctx.font = 'bold 28px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('THE RECKONING', cx, cy);

        // Show each round
        let ry = cy + 50;
        for (let i = 0; i < roundResults.length; i++) {
            const r = roundResults[i];
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText(`Round ${i + 1}: ${r.caseName}`, cx, ry);
            ry += 20;

            // Controversy spectrum bar
            const barW = 300;
            const barX = cx - barW / 2;
            // Dark red (clear) to light red (controversial)
            const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            gradient.addColorStop(0, '#880000');
            gradient.addColorStop(1, '#ff8888');
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, ry, barW, 10);
            // Marker for this case
            const markerX = barX + r.controversy * barW;
            ctx.fillStyle = '#ffd764';
            ctx.fillRect(markerX - 2, ry - 2, 4, 14);

            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText('Clear-cut', barX, ry + 22);
            ctx.textAlign = 'right';
            ctx.fillText('Controversial', barX + barW, ry + 22);
            ctx.textAlign = 'center';

            ry += 30;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText(`Infected: ${r.infected} | Rage: ${r.rage.toFixed(1)} | Good: ${r.good.toFixed(1)}`, cx, ry);
            ry += 35;
        }

        // THE IRONIC TWIST
        const totalRageAll = roundResults.reduce((s, r) => s + r.rage, 0);
        const totalGoodAll = roundResults.reduce((s, r) => s + r.good, 0);
        const totalInfectedAll = roundResults.reduce((s, r) => s + r.infected, 0);

        ry += 10;
        ctx.font = 'bold 16px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('THE REAL SCORE', cx, ry);
        ry += 30;
        ctx.font = '14px serif';
        ctx.fillStyle = '#cc4444';
        ctx.fillText(`Rage generated: ${totalRageAll.toFixed(1)}`, cx, ry);
        ry += 22;
        ctx.fillStyle = '#40b060';
        ctx.fillText(`Lasting good accomplished: ${totalGoodAll.toFixed(1)}`, cx, ry);
        ry += 30;

        if (totalRageAll > totalGoodAll * 2) {
            ctx.font = 'italic 14px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText('The best strategy always involves picking the worst cases.', cx, ry);
            ry += 20;
            ctx.fillText('"Winning" requires betraying the thing you\'re supposedly fighting for.', cx, ry);
        } else {
            ctx.font = 'italic 14px serif';
            ctx.fillStyle = '#40b060';
            ctx.fillText('You chose clarity over virality. Less spread, more truth.', cx, ry);
        }

        ry += 40;
        ctx.font = 'italic 16px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText('"The most viral position splits people 50/50."', cx, ry);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, H - 30);
    }

    function renderTutorial(ctx) {
        ctx.fillStyle = 'rgba(13, 10, 26, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'THE TOXOPLASMA OF RAGE',
                text: 'You are a memetic organism.\nYour goal: spread through the social network.\n\nBut here\'s the catch:\nclear-cut cases don\'t spread.\nControversial ones do.'
            },
            {
                title: 'THE PETA PRINCIPLE',
                text: 'Pick your case wisely.\nA dubious allegation spreads further than a clear one.\nDisagreement amplifies the signal.\n\nThe Ferguson Effect: opponents boost you\neven more than supporters.'
            },
            {
                title: 'THE GAME',
                text: 'Choose a case, then pick Patient Zero.\nWatch the infection spread.\nAt the end: how much rage vs. how much good?\n\nYou get 3 rounds. Click to begin.'
            }
        ];
        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#cc4444';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, cx, cy - 100);
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        step.text.split('\n').forEach((line, i) => {
            ctx.fillText(line, cx, cy - 30 + i * 22);
        });
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Click to continue (${tutorialStep + 1}/${steps.length})`, cx, cy + 160);
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
