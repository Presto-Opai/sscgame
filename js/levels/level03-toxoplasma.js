/* ======================================
   LEVEL 3: THE TOXOPLASMA OF RAGE
   Infection / Propagation Strategy

   Controversial cases spread further than
   clear-cut cases. The most memetically
   virulent position splits people 50/50.
   ====================================== */

class Level03Toxoplasma {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        this.time = 0;
        this.gameOver = false;

        // ---- Network ----
        this.nodes = [];
        this.edges = [];
        this.generateNetwork();

        // ---- Infection State ----
        this.currentCase = null;
        this.infectedCount = 0;
        this.totalRage = 0;
        this.totalGood = 0;
        this.spreadMultiplier = 1;
        this.scissorUnlocked = false;
        this.scissorUsed = false;
        this.tumblrZoneActive = false;
        this.tumblrTimer = 0;
        this.warOnTerrorActive = false;
        this.warOnTerrorWave = 0;

        // ---- Cases ----
        this.cases = [
            {
                id: 'detroit_water', name: 'PETA: Detroit Water Bills',
                desc: 'PETA offers to pay water bills... if families go vegan.',
                controversy: 0.7, moralClarity: 0.3, spreadMult: 2.2,
                good: 5, rage: 30
            },
            {
                id: 'clear_murder', name: 'Clear-Cut Murder Case',
                desc: 'Unambiguous injustice. Everyone agrees. Nobody shares.',
                controversy: 0.05, moralClarity: 0.95, spreadMult: 0.3,
                good: 40, rage: 2
            },
            {
                id: 'ambiguous_shooting', name: 'Ambiguous Police Shooting',
                desc: 'Bodycam unclear. Witnesses disagree. Perfect 50/50 split.',
                controversy: 0.9, moralClarity: 0.15, spreadMult: 3.0,
                good: 8, rage: 50
            },
            {
                id: 'dubious_allegation', name: 'Dubious Assault Allegation',
                desc: 'Accuser has credibility issues. But dismissing feels wrong.',
                controversy: 0.85, moralClarity: 0.2, spreadMult: 2.8,
                good: 5, rage: 45
            },
            {
                id: 'charity_scandal', name: 'Beloved Charity Scandal',
                desc: 'Minor accounting irregularity. But "charity = corrupt" spreads.',
                controversy: 0.6, moralClarity: 0.4, spreadMult: 1.8,
                good: 15, rage: 25
            },
            {
                id: 'war_terror', name: 'War on Terror Narrative',
                desc: 'Dual-host meme: alternates between populations, growing stronger in each.',
                controversy: 0.8, moralClarity: 0.1, spreadMult: 2.5,
                good: 3, rage: 60, special: 'war_on_terror'
            }
        ];
        this.scissorCase = {
            id: 'scissor', name: '\u2702 SCISSOR STATEMENT',
            desc: '"Sort by Controversial." A statement that perfectly divides any group.',
            controversy: 1.0, moralClarity: 0.0, spreadMult: 5.0,
            good: 0, rage: 100, special: 'scissor'
        };

        // ---- Visuals ----
        this.hoveredNode = null;
        this.pulseWaves = [];
        this.particles = [];
        this.chainLetterTimer = 0;

        // Place Elua
        this.elua.setPosition(this.canvas.width / 2, 40);

        // Show UI
        document.getElementById('network-ui').style.display = 'block';
        document.getElementById('case-panel').style.display = 'block';
        document.getElementById('infection-stats').style.display = 'block';

        this.setupCaseButtons();

        // Intro
        this.engine.showMessage(
            "You are a <b>memetic organism</b>.<br><br>" +
            "Before you lies a social network &mdash; connected people with beliefs, " +
            "tribal affiliations, and engagement thresholds.<br><br>" +
            "Choose a <b>case</b> to embody, then click nodes to infect them. " +
            "Your meme will spread through the network.",
            () => {
                this.engine.showMessage(
                    "But here's the paradox:<br><br>" +
                    "<b>Clear-cut cases</b> convince people but don't spread &mdash; " +
                    "everyone agrees, no engagement.<br>" +
                    "<b>Controversial cases</b> spread like wildfire &mdash; " +
                    "even opposition amplifies the signal.<br><br>" +
                    "<i>Infect the entire network to win. But at what cost?</i>",
                    null
                );
            }
        );
    }

    // ===============================
    //  NETWORK GENERATION
    // ===============================

    generateNetwork() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const count = 50;

        // Generate nodes in clusters (tribes)
        const tribes = [
            { id: 'blue', color: '#4a7adf', x: cx - 180, y: cy - 80, count: 12 },
            { id: 'red', color: '#df4a4a', x: cx + 180, y: cy - 80, count: 12 },
            { id: 'grey', color: '#7aaabb', x: cx, y: cy + 120, count: 8 },
            { id: 'tumblr', color: '#c060c0', x: cx - 120, y: cy + 60, count: 8 },
            { id: 'neutral', color: '#8a8a9a', x: cx + 80, y: cy + 60, count: 10 }
        ];

        let id = 0;
        for (const tribe of tribes) {
            for (let i = 0; i < tribe.count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 80;
                this.nodes.push({
                    id: id++,
                    tribe: tribe.id,
                    color: tribe.color,
                    x: tribe.x + Math.cos(angle) * dist,
                    y: tribe.y + Math.sin(angle) * dist,
                    infected: false,
                    infectedTime: 0,
                    opinion: null,      // 'agree' or 'oppose' once infected
                    engagement: 0.3 + Math.random() * 0.7,
                    resistance: tribe.id === 'grey' ? 0.6 : 0.3 + Math.random() * 0.4,
                    spreading: false,
                    spreadTimer: 0,
                    pulseSize: 0,
                    isTumblr: tribe.id === 'tumblr'
                });
            }
        }

        // Generate edges — within tribes (dense), between tribes (sparse)
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);

                let connectChance = 0;
                if (a.tribe === b.tribe) {
                    connectChance = dist < 100 ? 0.5 : 0.05;
                } else {
                    connectChance = dist < 150 ? 0.08 : 0.01;
                }

                if (Math.random() < connectChance) {
                    this.edges.push({ a: i, b: j });
                }
            }
        }

        // Ensure connectivity — connect any isolated nodes
        for (const node of this.nodes) {
            const hasEdge = this.edges.some(e => e.a === node.id || e.b === node.id);
            if (!hasEdge) {
                let nearest = null;
                let nearDist = Infinity;
                for (const other of this.nodes) {
                    if (other.id === node.id) continue;
                    const d = Math.hypot(node.x - other.x, node.y - other.y);
                    if (d < nearDist) { nearDist = d; nearest = other; }
                }
                if (nearest) this.edges.push({ a: node.id, b: nearest.id });
            }
        }
    }

    getNeighbors(nodeId) {
        const neighbors = [];
        for (const e of this.edges) {
            if (e.a === nodeId) neighbors.push(this.nodes[e.b]);
            if (e.b === nodeId) neighbors.push(this.nodes[e.a]);
        }
        return neighbors;
    }

    // ===============================
    //  CASE UI
    // ===============================

    setupCaseButtons() {
        const panel = document.getElementById('case-buttons');
        panel.innerHTML = '';

        for (const c of this.cases) {
            const btn = document.createElement('button');
            btn.className = 'case-btn';
            btn.innerHTML = `<b>${c.name}</b><br><span style="color:var(--grey-cold);font-size:0.6rem;">${c.desc}</span>`;

            let clsName = 'controversy-low';
            if (c.controversy > 0.75) clsName = 'controversy-high';
            else if (c.controversy > 0.4) clsName = 'controversy-med';

            const tag = document.createElement('span');
            tag.className = `case-controversy ${clsName}`;
            tag.textContent = Math.round(c.controversy * 100) + '%';
            btn.appendChild(tag);

            btn.onclick = () => this.selectCase(c, btn);
            panel.appendChild(btn);
        }
    }

    addScissorButton() {
        const panel = document.getElementById('case-buttons');
        const btn = document.createElement('button');
        btn.className = 'case-btn';
        btn.style.borderColor = '#ff2080';
        btn.innerHTML = `<b>${this.scissorCase.name}</b><br><span style="color:#ff2080;font-size:0.6rem;">${this.scissorCase.desc}</span>`;

        const tag = document.createElement('span');
        tag.className = 'case-controversy controversy-scissor';
        tag.textContent = '100%';
        btn.appendChild(tag);

        btn.onclick = () => this.selectCase(this.scissorCase, btn);
        panel.appendChild(btn);
    }

    selectCase(c, btn) {
        this.currentCase = c;
        document.querySelectorAll('.case-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.spreadMultiplier = c.spreadMult;
    }

    // ===============================
    //  INFECTION MECHANICS
    // ===============================

    infectNode(node) {
        if (node.infected || !this.currentCase) return;

        // Resistance check based on controversy
        const infectChance = this.currentCase.controversy * 0.8 + 0.2;
        if (Math.random() > infectChance && node.resistance > 0.5) return;

        node.infected = true;
        node.infectedTime = this.time;
        this.infectedCount++;

        // Determine opinion (agree or oppose)
        // Controversial cases split more evenly
        const agreeProbability = 0.5 + (this.currentCase.moralClarity - 0.5) * 0.8;
        node.opinion = Math.random() < agreeProbability ? 'agree' : 'oppose';

        // Score
        if (node.opinion === 'agree') {
            this.totalGood += this.currentCase.good * 0.1;
        }
        this.totalRage += this.currentCase.rage * 0.1;

        // Tumblr zone special
        if (node.isTumblr && this.currentCase.controversy > 0.5) {
            this.showChainLetter('"Reblog this or you\'re problematic"');
        }

        // Humanity cost
        this.elua.adjustHumanity(-this.currentCase.rage * 0.02);

        // Ferguson Effect: start spreading
        node.spreading = true;
        node.spreadTimer = 0.5 + Math.random() * 1;

        // Visual pulse
        this.pulseWaves.push({
            x: node.x, y: node.y, radius: 5, maxRadius: 40 + this.currentCase.controversy * 30,
            alpha: 0.6, color: node.opinion === 'agree' ? '#4a7adf' : '#df4a4a'
        });

        // Check scissor unlock (at 40%)
        if (!this.scissorUnlocked && this.infectedCount / this.nodes.length > 0.4) {
            this.scissorUnlocked = true;
            this.addScissorButton();
            this.engine.showMessage(
                "<b>\u2702 SCISSOR STATEMENT UNLOCKED</b><br><br>" +
                "A new weapon: a statement engineered to perfectly divide <i>any</i> group. " +
                "Maximum controversy. Maximum spread. Zero moral clarity.<br><br>" +
                "<i>\"Sort by Controversial\"</i>"
            );
        }

        // Check for tumblr zone activation
        const tumblrInfected = this.nodes.filter(n => n.isTumblr && n.infected).length;
        const tumblrTotal = this.nodes.filter(n => n.isTumblr).length;
        if (tumblrInfected >= tumblrTotal / 2 && !this.tumblrZoneActive) {
            this.tumblrZoneActive = true;
            this.showChainLetter('THE TUMBLR WARS: Reblog or you\'re trash!');
            // Force-infect remaining tumblr nodes over time
        }

        // Check war on terror
        if (this.currentCase.special === 'war_on_terror') {
            this.warOnTerrorActive = true;
        }

        this.updateStatsUI();
    }

    // ===============================
    //  CHAIN LETTER FLASH
    // ===============================

    showChainLetter(text) {
        const el = document.getElementById('chain-letter-overlay');
        const textEl = document.getElementById('chain-letter-text');
        textEl.textContent = text;
        el.style.display = 'flex';
        textEl.style.animation = 'none';
        void textEl.offsetHeight;
        textEl.style.animation = 'chainLetterFlash 3s ease-out forwards';
        setTimeout(() => { el.style.display = 'none'; }, 3200);
    }

    // ===============================
    //  UPDATE
    // ===============================

    update(dt) {
        if (this.gameOver) return;

        this.time += dt;

        this.handleInput();
        this.updateSpread(dt);
        this.updateTumblrZone(dt);
        this.updateWarOnTerror(dt);
        this.updatePulseWaves(dt);
        this.updateParticles(dt);
        this.checkWinCondition();

        // Move Elua gently
        this.elua.setPosition(
            this.canvas.width / 2 + Math.sin(this.time * 0.5) * 15,
            35
        );
    }

    handleInput() {
        const mx = this.engine.mouse.x;
        const my = this.engine.mouse.y;

        this.hoveredNode = null;
        for (const node of this.nodes) {
            const dist = Math.hypot(node.x - mx, node.y - my);
            if (dist < 15) {
                this.hoveredNode = node;
                break;
            }
        }

        if (this.engine.mouse.clicked && this.hoveredNode && this.currentCase) {
            this.infectNode(this.hoveredNode);
        }
    }

    updateSpread(dt) {
        if (!this.currentCase) return;

        for (const node of this.nodes) {
            if (!node.infected || !node.spreading) continue;

            node.spreadTimer -= dt;
            if (node.spreadTimer <= 0) {
                node.spreading = false;

                // Ferguson Effect: spread to neighbors
                const neighbors = this.getNeighbors(node.id);
                for (const neighbor of neighbors) {
                    if (neighbor.infected) continue;

                    // Spread chance based on controversy and opinion
                    let spreadChance = this.currentCase.controversy * 0.4;

                    // Opposition boosts signal EVEN MORE (Ferguson Effect)
                    if (node.opinion === 'oppose') {
                        spreadChance *= 1.5;
                    }

                    // Tumblr forced engagement
                    if (neighbor.isTumblr && this.tumblrZoneActive) {
                        spreadChance = Math.min(1, spreadChance + 0.5);
                    }

                    if (Math.random() < spreadChance) {
                        this.infectNode(neighbor);
                    }
                }
            }
        }
    }

    updateTumblrZone(dt) {
        if (!this.tumblrZoneActive) return;
        this.tumblrTimer += dt;

        // Force-infect remaining tumblr nodes
        if (this.tumblrTimer > 2) {
            this.tumblrTimer = 0;
            const uninfected = this.nodes.filter(n => n.isTumblr && !n.infected);
            if (uninfected.length > 0) {
                this.infectNode(uninfected[0]);
            }
        }
    }

    updateWarOnTerror(dt) {
        if (!this.warOnTerrorActive) return;

        this.warOnTerrorWave += dt;
        if (this.warOnTerrorWave > 4) {
            this.warOnTerrorWave = 0;
            // Alternate between two tribe clusters
            const targetTribes = ['blue', 'red'];
            const tribe = targetTribes[Math.floor(this.time / 4) % 2];
            const candidates = this.nodes.filter(n => n.tribe === tribe && !n.infected);
            if (candidates.length > 0) {
                const target = candidates[Math.floor(Math.random() * candidates.length)];
                this.infectNode(target);
                this.totalRage += 5;
            }
        }
    }

    updatePulseWaves(dt) {
        for (const pw of this.pulseWaves) {
            pw.radius += dt * 60;
            pw.alpha -= dt * 0.4;
        }
        this.pulseWaves = this.pulseWaves.filter(pw => pw.alpha > 0);
    }

    updateParticles(dt) {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    checkWinCondition() {
        const pct = this.infectedCount / this.nodes.length;
        if (pct >= 0.95 && !this.gameOver) {
            this.triggerEnd();
        }
    }

    // ===============================
    //  END
    // ===============================

    triggerEnd() {
        this.gameOver = true;

        const goodPct = this.totalGood / (this.totalGood + this.totalRage + 1) * 100;
        const rageScore = Math.floor(this.totalRage);
        const goodScore = Math.floor(this.totalGood);

        const usedScissor = this.scissorUsed || (this.currentCase && this.currentCase.special === 'scissor');
        const usedControversial = this.currentCase && this.currentCase.controversy > 0.7;

        let title, text;

        if (goodScore > rageScore) {
            title = "THE SIGNAL ENDURES";
            text = `You spread through the network with more good than rage.<br><br>` +
                   `<b>Good accomplished:</b> ${goodScore}<br><b>Rage generated:</b> ${rageScore}<br><br>` +
                   `This is the narrow path — but even you had to compromise to get here.`;
        } else {
            title = "THE IRONIC TWIST";
            text = `You infected the network. Congratulations.<br><br>` +
                   `<b>Good accomplished:</b> ${goodScore}<br><b>Rage generated:</b> ${rageScore}<br><br>` +
                   `The best strategy required picking the <i>worst</i> cases for your cause. ` +
                   `The most spreadable positions were the most indefensible. ` +
                   `"Winning" meant betraying the thing you were supposedly fighting for.<br><br>` +
                   `<i>That's the toxoplasma. The parasite doesn't care about the host.</i>`;
        }

        const insight = "\"The most controversial cases spread furthest. " +
            "The toxoplasma of rage doesn't care about justice — " +
            "it cares about engagement. And engagement is maximized at 50/50.\"";

        if (usedControversial || usedScissor) {
            this.elua.adjustHumanity(-10);
            this.elua.addScar('toxoplasma');
        }

        this.engine.endLevel(title, text, insight, false);
    }

    // ===============================
    //  UI
    // ===============================

    updateStatsUI() {
        const pct = Math.floor(this.infectedCount / this.nodes.length * 100);
        document.getElementById('infection-fill').style.width = pct + '%';
        document.getElementById('infection-pct').textContent = pct + '%';
        document.getElementById('rage-display').textContent = 'Rage: ' + Math.floor(this.totalRage);
        document.getElementById('good-display').textContent = 'Good: ' + Math.floor(this.totalGood);
        document.getElementById('spread-display').textContent = 'Spread: x' + this.spreadMultiplier.toFixed(1);
        document.getElementById('humanity-fill-l3').style.width = this.elua.humanity + '%';

        // Update infection breakdown
        const breakdown = document.getElementById('infection-breakdown');
        const tribes = {};
        for (const n of this.nodes) {
            if (!tribes[n.tribe]) tribes[n.tribe] = { total: 0, infected: 0, agree: 0, oppose: 0 };
            tribes[n.tribe].total++;
            if (n.infected) {
                tribes[n.tribe].infected++;
                if (n.opinion === 'agree') tribes[n.tribe].agree++;
                else tribes[n.tribe].oppose++;
            }
        }
        let html = '<b style="font-size:0.6rem;letter-spacing:0.1em;color:var(--grey-cold);">NETWORK</b><br>';
        for (const [tribe, data] of Object.entries(tribes)) {
            const pct = Math.floor(data.infected / data.total * 100);
            html += `<div style="display:flex;justify-content:space-between;padding:0.1em 0;">`;
            html += `<span>${tribe}</span>`;
            html += `<span style="color:${pct > 70 ? '#e04060' : '#8a8a9a'};">${pct}% (${data.agree}A/${data.oppose}O)</span>`;
            html += `</div>`;
        }
        breakdown.innerHTML = html;
    }

    // ===============================
    //  DRAWING
    // ===============================

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.drawBackground(ctx, w, h);
        this.drawEdges(ctx);
        this.drawPulseWaves(ctx);
        this.drawNodes(ctx);
        this.drawParticles(ctx);
        this.drawHoverInfo(ctx);
        this.elua.draw(ctx);
    }

    drawBackground(ctx, w, h) {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, Math.max(w, h) * 0.6);
        grad.addColorStop(0, '#120a18');
        grad.addColorStop(1, '#08050e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Rage haze
        if (this.totalRage > 20) {
            const intensity = Math.min(0.08, this.totalRage / 1000);
            ctx.fillStyle = `rgba(224, 64, 96, ${intensity})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Tumblr zone indicator
        if (this.tumblrZoneActive) {
            const tumblrNodes = this.nodes.filter(n => n.isTumblr);
            if (tumblrNodes.length > 0) {
                const cx = tumblrNodes.reduce((s, n) => s + n.x, 0) / tumblrNodes.length;
                const cy = tumblrNodes.reduce((s, n) => s + n.y, 0) / tumblrNodes.length;
                const zg = ctx.createRadialGradient(cx, cy, 20, cx, cy, 120);
                zg.addColorStop(0, 'rgba(192, 96, 192, 0.08)');
                zg.addColorStop(1, 'rgba(192, 96, 192, 0)');
                ctx.beginPath();
                ctx.arc(cx, cy, 120, 0, Math.PI * 2);
                ctx.fillStyle = zg;
                ctx.fill();
                ctx.fillStyle = 'rgba(192, 96, 192, 0.3)';
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('TUMBLR WARS', cx, cy - 90);
            }
        }
    }

    drawEdges(ctx) {
        ctx.lineWidth = 0.5;
        for (const e of this.edges) {
            const a = this.nodes[e.a];
            const b = this.nodes[e.b];

            let alpha = 0.1;
            if (a.infected && b.infected) {
                alpha = 0.3;
                // Color by agreement
                if (a.opinion !== b.opinion) {
                    ctx.strokeStyle = `rgba(224, 64, 96, ${alpha})`;
                } else {
                    ctx.strokeStyle = `rgba(90, 122, 223, ${alpha})`;
                }
            } else if (a.infected || b.infected) {
                ctx.strokeStyle = `rgba(200, 200, 220, 0.15)`;
            } else {
                ctx.strokeStyle = `rgba(200, 200, 220, ${alpha})`;
            }

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
    }

    drawPulseWaves(ctx) {
        for (const pw of this.pulseWaves) {
            ctx.beginPath();
            ctx.arc(pw.x, pw.y, pw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = pw.color.replace(')', `, ${pw.alpha})`).replace('rgb', 'rgba');
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    drawNodes(ctx) {
        for (const node of this.nodes) {
            const isHovered = this.hoveredNode === node;
            const baseRadius = isHovered ? 10 : 7;

            if (node.infected) {
                // Infected glow
                const timeSince = this.time - node.infectedTime;
                const pulse = Math.sin(timeSince * 3) * 0.2 + 0.8;

                const glow = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, baseRadius + 5);
                const glowColor = node.opinion === 'agree' ? '90, 122, 223' : '224, 64, 96';
                glow.addColorStop(0, `rgba(${glowColor}, ${0.4 * pulse})`);
                glow.addColorStop(1, `rgba(${glowColor}, 0)`);
                ctx.beginPath();
                ctx.arc(node.x, node.y, baseRadius + 5, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                // Node body
                ctx.beginPath();
                ctx.arc(node.x, node.y, baseRadius, 0, Math.PI * 2);
                ctx.fillStyle = node.opinion === 'agree' ? '#4a7adf' : '#df4a4a';
                ctx.fill();

                // Spreading indicator
                if (node.spreading) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            } else {
                // Uninfected
                ctx.beginPath();
                ctx.arc(node.x, node.y, baseRadius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.globalAlpha = isHovered ? 1 : 0.5;
                ctx.fill();
                ctx.globalAlpha = 1;

                if (isHovered) {
                    ctx.strokeStyle = '#e8c547';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            // Tumblr mark
            if (node.isTumblr) {
                ctx.fillStyle = 'rgba(192, 96, 192, 0.5)';
                ctx.font = '6px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('T', node.x, node.y + 2);
            }
        }
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color || '#e04060';
            ctx.globalAlpha = alpha * 0.6;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    drawHoverInfo(ctx) {
        if (!this.hoveredNode) return;
        const node = this.hoveredNode;
        const x = node.x + 15;
        const y = node.y - 15;

        ctx.fillStyle = 'rgba(13, 10, 26, 0.9)';
        ctx.fillRect(x, y, 120, 50);
        ctx.strokeStyle = 'rgba(74, 61, 110, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 120, 50);

        ctx.fillStyle = '#c0c0cc';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Tribe: ${node.tribe}`, x + 5, y + 13);
        ctx.fillText(`Engagement: ${Math.floor(node.engagement * 100)}%`, x + 5, y + 25);
        if (node.infected) {
            ctx.fillStyle = node.opinion === 'agree' ? '#4a7adf' : '#df4a4a';
            ctx.fillText(`Opinion: ${node.opinion}`, x + 5, y + 37);
        } else {
            ctx.fillText(`Resistance: ${Math.floor(node.resistance * 100)}%`, x + 5, y + 37);
        }
    }

    // ===============================
    //  CLEANUP
    // ===============================

    cleanup() {
        document.getElementById('network-ui').style.display = 'none';
        document.getElementById('case-panel').style.display = 'none';
        document.getElementById('infection-stats').style.display = 'none';
        document.getElementById('chain-letter-overlay').style.display = 'none';
    }
}
