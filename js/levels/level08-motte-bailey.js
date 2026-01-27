// Level 08 — ALL IN ALL, ANOTHER BRICK IN THE MOTTE
// Debate / Rhetoric Strategy Game
// "The motte-and-bailey fallacy: make bold claims (the bailey),
//  retreat to defensible claims (the motte) when challenged."
//
// Phoenix Wright meets tower defense. Place claims, defend or retreat,
// identify your opponent's motte-and-bailey to attack.

const Level08MotteBailey = (() => {
    let canvas, ctx;
    let W, H;

    // --- CLAIMS ---
    const CLAIM_SETS = [
        {
            domain: 'Postmodernism',
            bailey: { text: 'Reality is socially constructed', strength: 30, boldness: 90 },
            motte: { text: 'Different cultures perceive things differently', strength: 85, boldness: 15 },
            color: '#8a5ab0'
        },
        {
            domain: 'Religion',
            bailey: { text: 'God performs miracles and heals the sick', strength: 25, boldness: 95 },
            motte: { text: 'There is beauty and meaning in the universe', strength: 90, boldness: 10 },
            color: '#cc9030'
        },
        {
            domain: 'Feminism',
            bailey: { text: 'We need all these specific radical policies', strength: 35, boldness: 85 },
            motte: { text: 'Women are people and deserve equal rights', strength: 95, boldness: 5 },
            color: '#cc4488'
        },
        {
            domain: 'Free Markets',
            bailey: { text: 'All regulation is tyranny and must be abolished', strength: 20, boldness: 95 },
            motte: { text: 'Markets are generally efficient at allocating resources', strength: 80, boldness: 20 },
            color: '#40a060'
        },
        {
            domain: 'Science',
            bailey: { text: 'Science has proven that God doesn\'t exist', strength: 25, boldness: 90 },
            motte: { text: 'We should base beliefs on evidence and reason', strength: 90, boldness: 10 },
            color: '#4488cc'
        },
        {
            domain: 'Tradition',
            bailey: { text: 'Everything was better in the old days', strength: 20, boldness: 85 },
            motte: { text: 'Some traditional practices encode useful wisdom', strength: 85, boldness: 15 },
            color: '#aa8844'
        }
    ];

    // --- STATE ---
    let playerClaims = []; // { claimSet, inBailey: true/false, health, retreated }
    let opponentClaims = [];
    let motteCapacity = 3; // max claims in the motte
    let baileyCapacity = 5;
    let playerMotte = [];
    let playerBailey = [];
    let round = 0;
    const MAX_ROUNDS = 5;
    let phase = 'build'; // 'build', 'defend', 'attack', 'mirror', 'result'
    let currentAttack = null;
    let attackResult = null;
    let score = { player: 0, opponent: 0 };
    let intellectualHonesty = 50; // 0-100
    let retreats = 0;
    let defenses = 0;
    let abandonments = 0;
    let exposures = 0; // times you exposed opponent's fallacy
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let availableClaims = [];
    let selectedClaim = null;
    let opponentRevealed = false;
    let turnPhase = 'player_build'; // within a round

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
    }

    function resetState() {
        playerClaims = [];
        opponentClaims = [];
        playerMotte = [];
        playerBailey = [];
        round = 0;
        phase = 'build';
        currentAttack = null;
        attackResult = null;
        score = { player: 0, opponent: 0 };
        intellectualHonesty = 50;
        retreats = 0;
        defenses = 0;
        abandonments = 0;
        exposures = 0;
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        selectedClaim = null;
        opponentRevealed = false;
        turnPhase = 'player_build';

        // Available claims (shuffle and offer subset)
        availableClaims = shuffleArray([...CLAIM_SETS]);

        // Generate opponent's castle
        const oppSets = shuffleArray([...CLAIM_SETS]).slice(0, 3);
        for (const cs of oppSets) {
            opponentClaims.push({
                ...cs,
                inBailey: true,
                health: 100,
                retreated: false,
                exposed: false
            });
        }
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function onResize(w, h) { W = w; H = h; }

    // --- UPDATE ---
    function update(dt, input) {
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 3) { showTutorial = false; }
            }
            return;
        }

        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 12; return m.alpha > 0; });

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insight = intellectualHonesty > 60 ?
                    "Build an honest castle where bailey and motte are the same. Very small, but impregnable." :
                    "Everyone uses the motte-and-bailey. The question is whether you notice yourself doing it.";
                showInsightPopup(8, insight, () => returnToMenu());
            }
            return;
        }

        handleInput(input);
    }

    function handleInput(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        if (phase === 'build') handleBuildClick(mx, my);
        else if (phase === 'defend') handleDefendClick(mx, my);
        else if (phase === 'attack') handleAttackClick(mx, my);
        else if (phase === 'mirror') handleMirrorClick(mx, my);
    }

    function handleBuildClick(mx, my) {
        // Place claims from available pool
        const startY = 160;
        for (let i = 0; i < availableClaims.length; i++) {
            const cs = availableClaims[i];
            const by = startY + i * 55;

            // Bailey button
            if (mx >= W * 0.05 && mx <= W * 0.47 && my >= by && my <= by + 45) {
                if (playerBailey.length < baileyCapacity) {
                    const claim = { ...cs, inBailey: true, health: 100, retreated: false };
                    playerBailey.push(claim);
                    playerClaims.push(claim);
                    availableClaims.splice(i, 1);
                    score.player += cs.bailey.boldness * 0.1;
                    addMessage(`Placed "${cs.bailey.text}" in the bailey!`, W / 2, 80, cs.color);
                }
                return;
            }

            // Motte button
            if (mx >= W * 0.53 && mx <= W * 0.95 && my >= by && my <= by + 45) {
                if (playerMotte.length < motteCapacity) {
                    const claim = { ...cs, inBailey: false, health: 100, retreated: false };
                    playerMotte.push(claim);
                    playerClaims.push(claim);
                    availableClaims.splice(i, 1);
                    addMessage(`Placed "${cs.motte.text}" in the motte (safe)`, W / 2, 80, cs.color);
                }
                return;
            }
        }

        // Done building button
        if (mx >= W * 0.35 && mx <= W * 0.65 && my >= H - 60 && my <= H - 20) {
            if (playerClaims.length > 0) {
                phase = 'defend';
                generateAttack();
            }
        }
    }

    function generateAttack() {
        // Opponent attacks a random bailey claim
        const baileyTargets = playerClaims.filter(c => c.inBailey && c.health > 0);
        if (baileyTargets.length === 0) {
            // Attack motte claims (harder for opponent)
            const motteTargets = playerClaims.filter(c => !c.inBailey && c.health > 0);
            if (motteTargets.length === 0) {
                advanceRound();
                return;
            }
            currentAttack = {
                target: motteTargets[Math.floor(Math.random() * motteTargets.length)],
                strength: 20 + Math.floor(Math.random() * 30), // weak attack against motte
                argument: 'Your opponent questions even your safe position...'
            };
        } else {
            const target = baileyTargets[Math.floor(Math.random() * baileyTargets.length)];
            currentAttack = {
                target,
                strength: 40 + Math.floor(Math.random() * 40),
                argument: `"Your claim that '${target.bailey.text}' is indefensible!"`
            };
        }
        attackResult = null;
    }

    function handleDefendClick(mx, my) {
        if (!currentAttack) return;
        const btnY = H * 0.6;
        const btnH = 50;
        const gap = 10;

        // Defend the bailey
        if (mx >= W * 0.05 && mx <= W * 0.32 && my >= btnY && my <= btnY + btnH) {
            const target = currentAttack.target;
            const defense = target.inBailey ? target.bailey.strength : target.motte.strength;
            const success = defense + Math.random() * 30 > currentAttack.strength;

            if (success) {
                attackResult = { type: 'defended', text: 'You held your ground! The bailey stands.' };
                score.player += 5;
                defenses++;
            } else {
                target.health -= 40;
                attackResult = { type: 'failed', text: 'Defense failed! Your claim is weakened.' };
                score.opponent += 5;
            }
            intellectualHonesty += 3; // defending honestly is good
            showResult();
            return;
        }

        // Retreat to motte
        if (mx >= W * 0.35 && mx <= W * 0.65 && my >= btnY && my <= btnY + btnH) {
            const target = currentAttack.target;
            if (target.inBailey) {
                if (playerMotte.length < motteCapacity) {
                    target.inBailey = false;
                    target.retreated = true;
                    playerBailey = playerBailey.filter(c => c !== target);
                    playerMotte.push(target);
                    attackResult = { type: 'retreated', text: `Retreated to: "${target.motte.text}"\nOpponent: "That's not what you said before!"` };
                    retreats++;
                    intellectualHonesty -= 8; // retreating is dishonest
                } else {
                    attackResult = { type: 'full', text: 'Motte is FULL! You can\'t retreat here.' };
                }
            } else {
                attackResult = { type: 'already', text: 'Already in the motte. Nowhere to retreat.' };
            }
            showResult();
            return;
        }

        // Abandon claim
        if (mx >= W * 0.68 && mx <= W * 0.95 && my >= btnY && my <= btnY + btnH) {
            const target = currentAttack.target;
            target.health = 0;
            playerClaims = playerClaims.filter(c => c !== target);
            playerBailey = playerBailey.filter(c => c !== target);
            playerMotte = playerMotte.filter(c => c !== target);
            attackResult = { type: 'abandoned', text: 'You abandoned the claim entirely. Honest, but costly.' };
            abandonments++;
            intellectualHonesty += 5;
            showResult();
            return;
        }
    }

    function showResult() {
        // After a brief display, move to attack phase
        setTimeout(() => {
            if (round < MAX_ROUNDS - 1) {
                phase = 'attack';
            } else {
                phase = 'result';
                finalizeResult();
            }
        }, 100);
    }

    function handleAttackClick(mx, my) {
        // Player attacks opponent's claims
        const startY = 180;
        for (let i = 0; i < opponentClaims.length; i++) {
            const oc = opponentClaims[i];
            if (oc.health <= 0) continue;
            const by = startY + i * 80;

            // Attack bailey
            if (mx >= W * 0.05 && mx <= W * 0.47 && my >= by && my <= by + 35) {
                const attackStrength = 40 + Math.floor(Math.random() * 40);
                if (attackStrength > oc.bailey.strength) {
                    // Opponent retreats to motte
                    oc.inBailey = false;
                    oc.retreated = true;
                    addMessage(`Opponent retreats to: "${oc.motte.text}"`, W / 2, by, '#40b060');
                    score.player += 3;
                } else {
                    addMessage('Opponent defended their bailey!', W / 2, by, '#cc3030');
                    score.opponent += 2;
                }
                advanceRound();
                return;
            }

            // Expose motte-and-bailey (if retreated)
            if (oc.retreated && mx >= W * 0.53 && mx <= W * 0.95 && my >= by && my <= by + 35) {
                oc.exposed = true;
                oc.health -= 50;
                exposures++;
                intellectualHonesty += 10;
                score.player += 8;
                addMessage('EXPOSED! Motte-and-bailey fallacy identified!', W / 2, by, '#ffd764');
                advanceRound();
                return;
            }
        }

        // Skip attack
        if (mx >= W * 0.35 && mx <= W * 0.65 && my >= H - 60 && my <= H - 20) {
            advanceRound();
        }
    }

    function handleMirrorClick(mx, my) {
        // Just advance
        phase = playerClaims.length > 0 ? 'defend' : 'result';
        if (phase === 'defend') generateAttack();
        else finalizeResult();
    }

    function advanceRound() {
        round++;
        if (round >= MAX_ROUNDS) {
            phase = 'result';
            finalizeResult();
            return;
        }

        // Mirror match reveal at midpoint
        if (round === Math.floor(MAX_ROUNDS / 2) && !opponentRevealed) {
            opponentRevealed = true;
            phase = 'mirror';
            return;
        }

        phase = 'defend';
        generateAttack();
    }

    function finalizeResult() {
        const insight = intellectualHonesty > 60 ?
            "Build an honest castle where bailey and motte are the same. Very small, but impregnable." :
            "Everyone uses the motte-and-bailey. The question is whether you notice yourself doing it.";
        Protagonist.addInsight(8, insight);

        let ending = 'warrior';
        if (intellectualHonesty > 70 && abandonments > 0) ending = 'honest';
        else if (retreats > defenses) ending = 'retreater';
        else if (exposures >= 2) ending = 'detective';

        Protagonist.completeLevel(8, ending);
        if (intellectualHonesty > 60) Protagonist.recordConnection();
        else Protagonist.recordOptimization();
        Protagonist.save();
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 2, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        ctx.fillStyle = '#0e0a16';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }

        renderStatusBar(ctx);

        if (phase === 'build') renderBuild(ctx);
        else if (phase === 'defend') renderDefend(ctx);
        else if (phase === 'attack') renderAttack(ctx);
        else if (phase === 'mirror') renderMirror(ctx);

        renderCastle(ctx);
        renderMessages(ctx);
    }

    function renderStatusBar(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 22, 0.9)';
        ctx.fillRect(0, 0, W, 45);

        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        let x = 15;

        ctx.fillStyle = '#ffd764';
        ctx.fillText(`Round: ${round + 1}/${MAX_ROUNDS}`, x, 16); x += 110;

        ctx.fillStyle = '#40b060';
        ctx.fillText(`Your Score: ${score.player}`, x, 16); x += 110;

        ctx.fillStyle = '#cc3030';
        ctx.fillText(`Opponent: ${score.opponent}`, x, 16); x += 110;

        ctx.fillStyle = intellectualHonesty > 60 ? '#40b060' : intellectualHonesty > 30 ? '#cc9030' : '#cc3030';
        ctx.fillText(`Honesty: ${intellectualHonesty}`, x, 16);

        // Honesty bar
        Engine.drawBar(ctx, 15, 26, W - 30, 8, intellectualHonesty, 100,
            intellectualHonesty > 60 ? '#40b060' : intellectualHonesty > 30 ? '#cc9030' : '#cc3030', '#1a1428');
    }

    function renderCastle(ctx) {
        // Mini castle view at bottom
        const castleY = H - 120;
        const castleH = 110;

        ctx.fillStyle = 'rgba(20, 16, 30, 0.6)';
        ctx.fillRect(0, castleY, W, castleH);

        // Motte (center, small)
        const motteX = W * 0.4, motteW = W * 0.2;
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(motteX, castleY + 10, motteW, castleH - 30);
        ctx.strokeStyle = '#6a6a8a';
        ctx.lineWidth = 2;
        ctx.strokeRect(motteX, castleY + 10, motteW, castleH - 30);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#8a8aaa';
        ctx.textAlign = 'center';
        ctx.fillText(`MOTTE (${playerMotte.length}/${motteCapacity})`, motteX + motteW / 2, castleY + 6);

        // Motte claims
        for (let i = 0; i < playerMotte.length; i++) {
            const mc = playerMotte[i];
            ctx.font = '8px sans-serif';
            ctx.fillStyle = mc.color;
            ctx.fillText(mc.motte.text.substring(0, 25) + '...', motteX + motteW / 2, castleY + 25 + i * 14, motteW - 10);
        }

        // Bailey (wider, both sides)
        const baileyLX = W * 0.05, baileyRX = W * 0.62;
        const baileyW = W * 0.33;

        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(baileyLX, castleY + 10, baileyW, castleH - 30);
        ctx.strokeStyle = '#4a4a6a';
        ctx.lineWidth = 1;
        ctx.strokeRect(baileyLX, castleY + 10, baileyW, castleH - 30);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#6a6a8a';
        ctx.textAlign = 'center';
        ctx.fillText(`BAILEY (${playerBailey.length}/${baileyCapacity})`, baileyLX + baileyW / 2, castleY + 6);

        for (let i = 0; i < playerBailey.length; i++) {
            const bc = playerBailey[i];
            ctx.font = '8px sans-serif';
            ctx.fillStyle = bc.health > 50 ? bc.color : '#cc3030';
            ctx.fillText(bc.bailey.text.substring(0, 30) + '...', baileyLX + baileyW / 2, castleY + 25 + i * 14, baileyW - 10);
        }
    }

    function renderBuild(ctx) {
        const cx = W / 2;
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('BUILD YOUR CASTLE', cx, 70);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('Place claims in the Bailey (bold, vulnerable) or Motte (safe, boring)', cx, 92);
        ctx.fillText(`Bailey: ${playerBailey.length}/${baileyCapacity} | Motte: ${playerMotte.length}/${motteCapacity}`, cx, 110);

        const startY = 130;
        for (let i = 0; i < availableClaims.length; i++) {
            const cs = availableClaims[i];
            const by = startY + i * 55;

            // Domain label
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = cs.color;
            ctx.textAlign = 'left';
            ctx.fillText(cs.domain, W * 0.05, by - 4);

            // Bailey option
            ctx.fillStyle = '#1a1420';
            ctx.fillRect(W * 0.05, by, W * 0.42, 45);
            ctx.strokeStyle = cs.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.05, by, W * 0.42, 45);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(cs.bailey.text, W * 0.07, by + 16, W * 0.38);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText(`Bold! Str: ${cs.bailey.strength} | Score: +${Math.floor(cs.bailey.boldness * 0.1)}`, W * 0.07, by + 32);

            // Motte option
            ctx.fillStyle = '#141a20';
            ctx.fillRect(W * 0.53, by, W * 0.42, 45);
            ctx.strokeStyle = '#6a8a6a';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.53, by, W * 0.42, 45);
            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(cs.motte.text, W * 0.55, by + 16, W * 0.38);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#6a8a6a';
            ctx.fillText(`Safe. Str: ${cs.motte.strength} | Boring but true`, W * 0.55, by + 32);
        }

        // Done button
        if (playerClaims.length > 0) {
            ctx.fillStyle = '#1a2a1a';
            ctx.fillRect(W * 0.35, H - 165, W * 0.3, 35);
            ctx.strokeStyle = '#40b060';
            ctx.lineWidth = 2;
            ctx.strokeRect(W * 0.35, H - 165, W * 0.3, 35);
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#40b060';
            ctx.textAlign = 'center';
            ctx.fillText('Begin the Debate!', W / 2, H - 143);
        }
    }

    function renderDefend(ctx) {
        if (!currentAttack) return;
        const cx = W / 2;

        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#cc3030';
        ctx.textAlign = 'center';
        ctx.fillText('INCOMING ATTACK!', cx, 70);

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        const argLines = Engine.wrapText(ctx, currentAttack.argument, W * 0.7, '14px serif');
        let y = 100;
        for (const line of argLines) {
            ctx.fillText(line, cx, y); y += 20;
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText(`Attack strength: ${currentAttack.strength}`, cx, y + 10);

        if (attackResult) {
            y += 35;
            ctx.font = 'bold 14px sans-serif';
            const resultColors = { defended: '#40b060', failed: '#cc3030', retreated: '#cc9030', abandoned: '#6a5890', full: '#cc3030', already: '#6a5890' };
            ctx.fillStyle = resultColors[attackResult.type] || '#e8e0f0';
            const resLines = Engine.wrapText(ctx, attackResult.text, W * 0.7, 'bold 14px sans-serif');
            for (const line of resLines) {
                ctx.fillText(line, cx, y); y += 22;
            }
            y += 15;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText('Click anywhere to continue', cx, y);
        } else {
            // Choice buttons
            const btnY = H * 0.6;
            const btnH = 50;

            // Defend
            ctx.fillStyle = '#141a20';
            ctx.fillRect(W * 0.05, btnY, W * 0.27, btnH);
            ctx.strokeStyle = '#4488cc';
            ctx.lineWidth = 2;
            ctx.strokeRect(W * 0.05, btnY, W * 0.27, btnH);
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#4488cc';
            ctx.textAlign = 'center';
            ctx.fillText('Defend the Bailey', W * 0.185, btnY + 20);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#446688';
            ctx.fillText('Risky but honest', W * 0.185, btnY + 36);

            // Retreat
            ctx.fillStyle = '#1a1420';
            ctx.fillRect(W * 0.35, btnY, W * 0.3, btnH);
            ctx.strokeStyle = '#cc9030';
            ctx.lineWidth = 2;
            ctx.strokeRect(W * 0.35, btnY, W * 0.3, btnH);
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#cc9030';
            ctx.fillText('Retreat to Motte', W * 0.5, btnY + 20);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#aa7830';
            ctx.fillText('"I just meant..."', W * 0.5, btnY + 36);

            // Abandon
            ctx.fillStyle = '#1a141a';
            ctx.fillRect(W * 0.68, btnY, W * 0.27, btnH);
            ctx.strokeStyle = '#6a5890';
            ctx.lineWidth = 2;
            ctx.strokeRect(W * 0.68, btnY, W * 0.27, btnH);
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.textAlign = 'center';
            ctx.fillText('Abandon Claim', W * 0.815, btnY + 20);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#5a4870';
            ctx.fillText('Honest but costly', W * 0.815, btnY + 36);
        }
    }

    function renderAttack(ctx) {
        const cx = W / 2;
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#40b060';
        ctx.textAlign = 'center';
        ctx.fillText('YOUR TURN: ATTACK!', cx, 70);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('Challenge your opponent\'s claims. Look for motte-and-bailey!', cx, 92);

        const startY = 120;
        for (let i = 0; i < opponentClaims.length; i++) {
            const oc = opponentClaims[i];
            if (oc.health <= 0) continue;
            const by = startY + i * 80;

            // Show claim
            ctx.fillStyle = '#141420';
            ctx.fillRect(W * 0.05, by, W * 0.9, 70);
            ctx.strokeStyle = oc.exposed ? '#ffd764' : oc.color;
            ctx.lineWidth = oc.exposed ? 2 : 1;
            ctx.strokeRect(W * 0.05, by, W * 0.9, 70);

            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = oc.color;
            ctx.textAlign = 'left';
            ctx.fillText(`${oc.domain} — ${oc.inBailey ? 'IN BAILEY' : 'IN MOTTE'}`, W * 0.07, by + 16);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            const claimText = oc.inBailey ? oc.bailey.text : oc.motte.text;
            ctx.fillText(`"${claimText}"`, W * 0.07, by + 34, W * 0.55);

            // Attack bailey button
            ctx.fillStyle = '#2a1a1a';
            ctx.fillRect(W * 0.65, by + 5, W * 0.13, 25);
            ctx.strokeStyle = '#cc3030';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.65, by + 5, W * 0.13, 25);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#cc3030';
            ctx.textAlign = 'center';
            ctx.fillText('Attack', W * 0.715, by + 22);

            // Expose button (if retreated)
            if (oc.retreated && !oc.exposed) {
                ctx.fillStyle = '#2a2a1a';
                ctx.fillRect(W * 0.8, by + 5, W * 0.13, 25);
                ctx.strokeStyle = '#ffd764';
                ctx.lineWidth = 1;
                ctx.strokeRect(W * 0.8, by + 5, W * 0.13, 25);
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#ffd764';
                ctx.fillText('EXPOSE!', W * 0.865, by + 22);
            }

            if (oc.retreated) {
                ctx.font = '9px sans-serif';
                ctx.fillStyle = '#cc8a60';
                ctx.textAlign = 'left';
                ctx.fillText(`Previously claimed: "${oc.bailey.text}"`, W * 0.07, by + 52, W * 0.85);
            }

            if (oc.exposed) {
                ctx.font = 'bold 9px sans-serif';
                ctx.fillStyle = '#ffd764';
                ctx.textAlign = 'right';
                ctx.fillText('FALLACY EXPOSED!', W * 0.93, by + 55);
            }
        }

        // Skip button
        ctx.fillStyle = '#141420';
        ctx.fillRect(W * 0.35, H - 165, W * 0.3, 35);
        ctx.strokeStyle = '#6a5890';
        ctx.lineWidth = 1;
        ctx.strokeRect(W * 0.35, H - 165, W * 0.3, 35);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'center';
        ctx.fillText('End Turn', W / 2, H - 143);
    }

    function renderMirror(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 22, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;

        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('THE MIRROR MATCH', cx, H * 0.15);

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('Your opponent uses the same tactics.', cx, H * 0.25);
        ctx.fillText('Can you identify THEIR motte-and-bailey?', cx, H * 0.3);

        let y = H * 0.4;
        for (const oc of opponentClaims) {
            if (oc.health <= 0) continue;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = oc.color;
            ctx.fillText(`${oc.domain}: "${oc.inBailey ? oc.bailey.text : oc.motte.text}"`, cx, y);
            if (oc.retreated) {
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#cc8a60';
                ctx.fillText(`(Was: "${oc.bailey.text}")`, cx, y + 16);
                y += 18;
            }
            y += 25;
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, H * 0.85);
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 22, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.08;

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('DEBATE CONCLUDED', cx, y); y += 40;

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#40b060';
        ctx.fillText(`Your Score: ${score.player}`, cx, y); y += 22;
        ctx.fillStyle = '#cc3030';
        ctx.fillText(`Opponent Score: ${score.opponent}`, cx, y); y += 30;

        ctx.fillStyle = '#e8e0f0';
        ctx.fillText(`Bailey defenses: ${defenses}`, cx, y); y += 20;
        ctx.fillStyle = '#cc9030';
        ctx.fillText(`Retreats to motte: ${retreats}`, cx, y); y += 20;
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Claims abandoned: ${abandonments}`, cx, y); y += 20;
        ctx.fillStyle = '#ffd764';
        ctx.fillText(`Opponent fallacies exposed: ${exposures}`, cx, y); y += 30;

        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = intellectualHonesty > 60 ? '#40b060' : '#cc9030';
        ctx.fillText(`Intellectual Honesty: ${intellectualHonesty}/100`, cx, y); y += 30;

        // Assessment
        ctx.font = 'bold 16px serif';
        if (intellectualHonesty > 70 && abandonments > 0) {
            ctx.fillStyle = '#40b060';
            ctx.fillText('Honest Castle: Small but impregnable.', cx, y); y += 22;
            ctx.font = '13px serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText('Bailey and motte are the same. Very small, but you never retreated from truth.', cx, y);
        } else if (retreats > defenses) {
            ctx.fillStyle = '#cc9030';
            ctx.fillText('Master Retreater: Large bailey, quick escapes.', cx, y); y += 22;
            ctx.font = '13px serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText('You claimed boldly and retreated strategically. Effective, but dishonest.', cx, y);
        } else if (exposures >= 2) {
            ctx.fillStyle = '#ffd764';
            ctx.fillText('Fallacy Detective: You saw through them.', cx, y); y += 22;
            ctx.font = '13px serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText('You identified the opponent\'s motte-and-bailey without using it yourself.', cx, y);
        } else {
            ctx.fillStyle = '#4488cc';
            ctx.fillText('Rhetorical Warrior', cx, y); y += 22;
            ctx.font = '13px serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText('You fought, defended, and sometimes retreated. The debate goes on.', cx, y);
        }

        y += 40;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, y);
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

    function renderTutorial(ctx) {
        ctx.fillStyle = 'rgba(14, 10, 22, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'ALL IN ALL, ANOTHER BRICK IN THE MOTTE',
                text: 'You control a motte-and-bailey castle.\n\nThe BAILEY is open ground — bold, useful claims.\nThe MOTTE is your fortress — safe, boring claims.\n\nPlace claims. Defend them. Or retreat.'
            },
            {
                title: 'THE FALLACY',
                text: '"God performs miracles" (bailey)\n→ attacked → retreat →\n"God is the beauty in the universe" (motte)\n\nBold claims expand your territory.\nBut when challenged, can you hold them?'
            },
            {
                title: 'THE MIRROR MATCH',
                text: 'Your opponent uses the same tactic.\nWatch for their retreats.\n\nWhen they switch from bailey to motte,\nyou can EXPOSE the fallacy!\n\nOr build an honest castle where\nbailey and motte are the same.'
            },
            {
                title: 'THE GAME',
                text: 'Build your castle. Defend your claims.\nAttack your opponent. Find the truth.\n\nIntellectual honesty matters.\n\nClick to begin.'
            }
        ];
        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, cx, cy - 120);
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        step.text.split('\n').forEach((line, i) => {
            ctx.fillText(line, cx, cy - 50 + i * 22);
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
