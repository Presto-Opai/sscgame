// Level 02 — I CAN TOLERATE ANYTHING EXCEPT THE OUTGROUP
// Social Puzzle / Empathy Simulator
// "We hate our near enemies, not our far enemies."
//
// Seat dinner party guests to maximize genuine tolerance.
// Tolerance is inversely proportional to similarity. Near-outgroup = explosive.

const Level02Outgroup = (() => {
    let canvas, ctx;
    let W, H;

    // --- TRIBES & BELIEFS ---
    const TRIBES = {
        BLUE: { name: 'Blue Tribe', color: '#4488cc', markers: ['NPR tote bag', 'Prius bumper sticker', 'Organic groceries', 'Yoga mat'] },
        RED: { name: 'Red Tribe', color: '#cc4444', markers: ['Flag pin', 'Pickup truck', 'Church bulletin', 'Camo jacket'] },
        GREY: { name: 'Grey Tribe', color: '#888899', markers: ['ThinkPad laptop', 'Rationalist mug', 'Effective Altruism pin', 'Hacker News tab'] },
        FAR: { name: 'Far Foreigner', color: '#aa8844', markers: ['Foreign passport', 'Unfamiliar clothes', 'Different language', 'Unknown customs'] }
    };

    const BELIEFS = [
        'gun_control', 'healthcare', 'immigration', 'religion', 'education',
        'environment', 'free_speech', 'capitalism', 'tradition', 'science'
    ];

    const BELIEF_LABELS = {
        gun_control: 'Gun Control', healthcare: 'Healthcare', immigration: 'Immigration',
        religion: 'Religion', education: 'Education', environment: 'Environment',
        free_speech: 'Free Speech', capitalism: 'Capitalism', tradition: 'Tradition', science: 'Science'
    };

    // --- STATE ---
    let guests = [];
    let seats = []; // 8 seats around a round table
    const NUM_SEATS = 8;
    let unseatedGuests = [];
    let selectedGuest = null;
    let toleranceScore = 0;
    let maxTolerance = 0;
    let playerBias = { tribe: null, favoredCount: 0, avoidedCount: 0 };
    let phase = 'seating'; // 'seating', 'speech', 'mirror', 'result'
    let speechGiven = false;
    let toleranceBragPoints = 0;
    let mirrorRevealed = false;
    let bodhidharmaVisible = false;
    let bodhidharmaTimer = 0;
    let guestArrivalTimer = 0;
    let guestsArrived = 0;
    let totalGuests = 10;
    let fights = [];
    let harmonies = [];
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let tintTimer = 0; // guests tint red/blue over time
    let galaxyBrained = false;
    let tooltipGuest = null;
    let speechOptions = [];
    let selectedSpeechGroups = [];
    let revealedBeliefs = {}; // guestId -> revealed belief indices

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
        generateGuests();
    }

    function resetState() {
        guests = [];
        seats = new Array(NUM_SEATS).fill(null);
        unseatedGuests = [];
        selectedGuest = null;
        toleranceScore = 0;
        maxTolerance = 0;
        playerBias = { tribe: null, favoredCount: 0, avoidedCount: 0 };
        phase = 'seating';
        speechGiven = false;
        toleranceBragPoints = 0;
        mirrorRevealed = false;
        bodhidharmaVisible = false;
        bodhidharmaTimer = 0;
        guestArrivalTimer = 0;
        guestsArrived = 0;
        fights = [];
        harmonies = [];
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        tintTimer = 0;
        galaxyBrained = false;
        tooltipGuest = null;
        speechOptions = [];
        selectedSpeechGroups = [];
        revealedBeliefs = {};
    }

    function generateGuests() {
        const tribeKeys = Object.keys(TRIBES);
        guests = [];

        for (let i = 0; i < totalGuests; i++) {
            const tribeKey = tribeKeys[i % tribeKeys.length] || tribeKeys[Math.floor(Math.random() * tribeKeys.length)];
            const tribe = TRIBES[tribeKey];

            // Generate beliefs: tribe-correlated but with variation
            const beliefs = {};
            for (const b of BELIEFS) {
                if (tribeKey === 'BLUE') {
                    beliefs[b] = (['gun_control', 'healthcare', 'environment', 'science'].includes(b)) ? 'progressive' : (Math.random() < 0.3 ? 'progressive' : 'moderate');
                } else if (tribeKey === 'RED') {
                    beliefs[b] = (['gun_control', 'tradition', 'religion', 'capitalism'].includes(b)) ? 'conservative' : (Math.random() < 0.3 ? 'conservative' : 'moderate');
                } else if (tribeKey === 'GREY') {
                    beliefs[b] = (['science', 'free_speech', 'capitalism'].includes(b)) ? 'rationalist' : (Math.random() < 0.5 ? 'progressive' : 'moderate');
                } else {
                    beliefs[b] = 'foreign'; // Different framework entirely
                }
            }

            // Create a near-outgroup variant: same tribe, one key difference
            if (i > 0 && i % 3 === 0) {
                const prevGuest = guests[i - 1];
                Object.assign(beliefs, prevGuest.beliefs);
                // Flip one key belief
                const keyBelief = BELIEFS[Math.floor(Math.random() * BELIEFS.length)];
                beliefs[keyBelief] = beliefs[keyBelief] === 'progressive' ? 'conservative' :
                                    beliefs[keyBelief] === 'conservative' ? 'progressive' : 'contrarian';
            }

            const names = [
                'Alex', 'Jordan', 'Sam', 'Casey', 'Morgan',
                'Riley', 'Quinn', 'Avery', 'Jamie', 'Taylor'
            ];

            guests.push({
                id: i,
                name: names[i % names.length],
                tribeKey,
                tribe,
                marker: tribe.markers[Math.floor(Math.random() * tribe.markers.length)],
                beliefs,
                tint: 0, // 0 = neutral, -1 = full blue, 1 = full red
                seated: false,
                revealed: false
            });
        }

        unseatedGuests = guests.slice(0, 4); // First batch arrives
        guestsArrived = 4;
    }

    function onResize(w, h) { W = w; H = h; }

    // --- CALCULATE TOLERANCE ---
    function calcSimilarity(g1, g2) {
        if (!g1 || !g2) return 0;
        let same = 0, total = 0;
        for (const b of BELIEFS) {
            total++;
            if (g1.beliefs[b] === g2.beliefs[b]) same++;
        }
        return same / total;
    }

    function calcSeatTolerance(seatIdx) {
        const guest = seats[seatIdx];
        if (!guest) return 0;
        let tolerance = 0;

        // Check neighbors (circular table)
        const leftIdx = (seatIdx - 1 + NUM_SEATS) % NUM_SEATS;
        const rightIdx = (seatIdx + 1) % NUM_SEATS;
        const left = seats[leftIdx];
        const right = seats[rightIdx];

        if (left) tolerance += calcPairTolerance(guest, left);
        if (right) tolerance += calcPairTolerance(guest, right);

        return tolerance;
    }

    function calcPairTolerance(g1, g2) {
        const sim = calcSimilarity(g1, g2);
        // Key insight: very different people (Far Foreigner + anyone) = easy harmony
        // Very similar people with one difference = explosive
        if (g1.tribeKey === 'FAR' || g2.tribeKey === 'FAR') {
            return 3; // Easy tolerance — far outgroup is tolerable
        }
        if (g1.tribeKey === g2.tribeKey) {
            // Same tribe: high similarity = boring, slight difference = fight
            if (sim > 0.8) return 1; // fine but boring
            if (sim > 0.5) return -2; // THE NEAR OUTGROUP EFFECT — disaster!
            return -1; // still bad
        }
        // Different tribes:
        if (sim < 0.3) return 2; // Very different, exotic, interesting
        if (sim > 0.6) return -1; // Similar but different label — confusing tension
        return 0; // neutral
    }

    function calcTotalScore() {
        let score = 0;
        for (let i = 0; i < NUM_SEATS; i++) {
            score += calcSeatTolerance(i);
        }
        return score / 2; // divide by 2 since each pair counted twice
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

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insightText = galaxyBrained ?
                    "Galaxy-brained yourself into being tolerant — but did you understand why it was hard?" :
                    "We hate our near enemies, not our far enemies. True tolerance means sitting with discomfort.";
                showInsightPopup(2, insightText, () => returnToMenu());
            }
            return;
        }

        // Guest arrival
        guestArrivalTimer += dt;
        if (guestArrivalTimer > 5 && guestsArrived < totalGuests) {
            guestArrivalTimer = 0;
            const nextGuest = guests[guestsArrived];
            if (nextGuest && !nextGuest.seated) {
                unseatedGuests.push(nextGuest);
                addMessage(`${nextGuest.name} arrives with a ${nextGuest.marker}`, W / 2, 80, '#e8e0f0');
            }
            guestsArrived++;
        }

        // Tinting (guests slowly tint red/blue as evening progresses)
        tintTimer += dt;
        if (tintTimer > 30) {
            for (const g of guests) {
                if (g.tribeKey === 'BLUE') g.tint = Math.max(-1, g.tint - 0.01);
                else if (g.tribeKey === 'RED') g.tint = Math.min(1, g.tint + 0.01);
            }
        }

        // Bodhidharma timer
        if (bodhidharmaVisible) {
            bodhidharmaTimer -= dt;
            if (bodhidharmaTimer <= 0) bodhidharmaVisible = false;
        }

        // Messages
        messages = messages.filter(m => {
            m.alpha -= dt * 0.4;
            m.y -= dt * 15;
            return m.alpha > 0;
        });

        // Mirror phase trigger: halfway through seating
        const seatedCount = seats.filter(s => s !== null).length;
        if (seatedCount >= 4 && !mirrorRevealed && phase === 'seating') {
            mirrorRevealed = true;
            // Analyze player bias
            analyzePlayerBias();
            phase = 'mirror';
            setTimeout(() => { phase = 'seating'; }, 100); // brief flash, rendered one frame
        }

        // Speech phase: when all seated
        if (seatedCount >= NUM_SEATS && phase === 'seating') {
            phase = 'speech';
            prepareSpeech();
        }

        // Handle clicks
        handleInput(input);

        // Update fight/harmony animations
        fights = fights.filter(f => { f.timer -= dt; return f.timer > 0; });
        harmonies = harmonies.filter(h => { h.timer -= dt; return h.timer > 0; });

        // Evaluate seated pairs for live feedback
        evaluateSeating();
    }

    function analyzePlayerBias() {
        // Track which tribes the player seated first/in preferred spots
        const seatedTribes = {};
        for (let i = 0; i < NUM_SEATS; i++) {
            if (seats[i]) {
                const tk = seats[i].tribeKey;
                seatedTribes[tk] = (seatedTribes[tk] || 0) + 1;
            }
        }
        // Find most favored
        let maxTribe = null, maxCount = 0;
        for (const [tk, count] of Object.entries(seatedTribes)) {
            if (count > maxCount) { maxCount = count; maxTribe = tk; }
        }
        playerBias.tribe = maxTribe;
        playerBias.favoredCount = maxCount;
    }

    function prepareSpeech() {
        speechOptions = [
            { label: 'Praise everyone equally', groups: ['all'], bragPoints: 3 },
            { label: 'Celebrate diversity', groups: ['FAR', 'BLUE', 'RED'], bragPoints: 2 },
            { label: 'Admit this is hard', groups: [], bragPoints: 0 },
            { label: '"This essay is bad and I should feel bad"', groups: [], bragPoints: -1, meta: true }
        ];
    }

    function evaluateSeating() {
        fights = [];
        harmonies = [];
        for (let i = 0; i < NUM_SEATS; i++) {
            if (!seats[i]) continue;
            const rightIdx = (i + 1) % NUM_SEATS;
            if (!seats[rightIdx]) continue;
            const score = calcPairTolerance(seats[i], seats[rightIdx]);
            const angle = (i + 0.5) * (Math.PI * 2 / NUM_SEATS) - Math.PI / 2;
            const r = Math.min(W, H) * 0.22;
            const cx = W * 0.45, cy = H * 0.5;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (score <= -2) {
                fights.push({ x, y, timer: 0.5 });
            } else if (score >= 2) {
                harmonies.push({ x, y, timer: 0.5 });
            }
        }
    }

    function handleInput(input) {
        if (!input.mouse.clicked) {
            // Tooltip on hover
            tooltipGuest = null;
            if (phase === 'seating') {
                // Check hovering over seats
                const tableR = Math.min(W, H) * 0.22;
                const cx = W * 0.45, cy = H * 0.5;
                for (let i = 0; i < NUM_SEATS; i++) {
                    if (!seats[i]) continue;
                    const angle = i * (Math.PI * 2 / NUM_SEATS) - Math.PI / 2;
                    const sx = cx + Math.cos(angle) * tableR;
                    const sy = cy + Math.sin(angle) * tableR;
                    const dx = input.mouse.x - sx, dy = input.mouse.y - sy;
                    if (dx * dx + dy * dy < 900) {
                        tooltipGuest = seats[i];
                        break;
                    }
                }
                // Check hovering over waiting guests
                if (!tooltipGuest) {
                    const startX = W * 0.75;
                    for (let i = 0; i < unseatedGuests.length; i++) {
                        const gy = 100 + i * 60;
                        const gx = startX + 30;
                        const dx = input.mouse.x - gx, dy = input.mouse.y - gy;
                        if (dx * dx + dy * dy < 900) {
                            tooltipGuest = unseatedGuests[i];
                            break;
                        }
                    }
                }
            }
            return;
        }

        if (phase === 'seating') {
            handleSeatingClick(input);
        } else if (phase === 'speech') {
            handleSpeechClick(input);
        } else if (phase === 'mirror') {
            phase = 'seating'; // click to dismiss
        }
    }

    function handleSeatingClick(input) {
        const mx = input.mouse.x, my = input.mouse.y;

        // Click on waiting guest to select
        const startX = W * 0.75;
        for (let i = 0; i < unseatedGuests.length; i++) {
            const gy = 100 + i * 60;
            const gx = startX + 30;
            const dx = mx - gx, dy = my - gy;
            if (dx * dx + dy * dy < 900) {
                selectedGuest = unseatedGuests[i];
                return;
            }
        }

        // Click on seat to place selected guest
        if (selectedGuest) {
            const tableR = Math.min(W, H) * 0.22;
            const cx = W * 0.45, cy = H * 0.5;
            for (let i = 0; i < NUM_SEATS; i++) {
                const angle = i * (Math.PI * 2 / NUM_SEATS) - Math.PI / 2;
                const sx = cx + Math.cos(angle) * tableR;
                const sy = cy + Math.sin(angle) * tableR;
                const dx = mx - sx, dy = my - sy;
                if (dx * dx + dy * dy < 1600) {
                    if (seats[i] === null) {
                        seats[i] = selectedGuest;
                        selectedGuest.seated = true;
                        unseatedGuests = unseatedGuests.filter(g => g.id !== selectedGuest.id);
                        // Reveal some beliefs when seated
                        revealedBeliefs[selectedGuest.id] = [
                            Math.floor(Math.random() * BELIEFS.length),
                            Math.floor(Math.random() * BELIEFS.length)
                        ];
                        selectedGuest = null;
                        addMessage('Seated!', sx, sy - 30, '#40b060');
                    } else {
                        // Swap: unseat current, place new
                        const prev = seats[i];
                        prev.seated = false;
                        unseatedGuests.push(prev);
                        seats[i] = selectedGuest;
                        selectedGuest.seated = true;
                        unseatedGuests = unseatedGuests.filter(g => g.id !== selectedGuest.id);
                        selectedGuest = null;
                        addMessage('Swapped!', sx, sy - 30, '#cc9030');
                    }
                    return;
                }
            }
        }

        // Click on seated guest to unseat
        const tableR = Math.min(W, H) * 0.22;
        const cx = W * 0.45, cy = H * 0.5;
        for (let i = 0; i < NUM_SEATS; i++) {
            if (!seats[i]) continue;
            const angle = i * (Math.PI * 2 / NUM_SEATS) - Math.PI / 2;
            const sx = cx + Math.cos(angle) * tableR;
            const sy = cy + Math.sin(angle) * tableR;
            const dx = mx - sx, dy = my - sy;
            if (dx * dx + dy * dy < 1600) {
                selectedGuest = seats[i];
                return;
            }
        }
    }

    function handleSpeechClick(input) {
        const mx = input.mouse.x, my = input.mouse.y;
        const startY = H * 0.35;
        for (let i = 0; i < speechOptions.length; i++) {
            const by = startY + i * 50;
            if (mx >= W * 0.2 && mx <= W * 0.8 && my >= by && my <= by + 40) {
                const option = speechOptions[i];
                toleranceBragPoints = option.bragPoints;

                // Bodhidharma appears if bragging
                if (option.bragPoints > 1) {
                    bodhidharmaVisible = true;
                    bodhidharmaTimer = 4;
                    addMessage('Bodhidharma awards you ZERO tolerance points.', W / 2, H * 0.2, '#aa8844');
                }

                // Meta ending
                if (option.meta) {
                    toleranceScore = calcTotalScore();
                    galaxyBrained = false;
                    phase = 'result';
                    Protagonist.addInsight(2, "We hate our near enemies, not our far enemies. True tolerance means sitting with discomfort.");
                    Protagonist.recordConnection();
                    Protagonist.completeLevel(2, 'meta');
                    Protagonist.save();
                    return;
                }

                // Calculate final score
                toleranceScore = calcTotalScore();
                // Check galaxy-brain achievement
                if (toleranceScore >= NUM_SEATS * 2) {
                    galaxyBrained = true;
                }

                phase = 'result';
                Protagonist.addInsight(2, galaxyBrained ?
                    "Galaxy-brained yourself into being tolerant — but did you understand why it was hard?" :
                    "We hate our near enemies, not our far enemies. True tolerance means sitting with discomfort.");
                Protagonist.completeLevel(2, galaxyBrained ? 'galaxy' : 'normal');
                Protagonist.save();
                return;
            }
        }
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 1.5, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        ctx.fillStyle = '#1a1420';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }

        renderTable(ctx);
        renderWaitingGuests(ctx);
        renderFightsHarmonies(ctx);
        renderMessages(ctx);
        renderMirror(ctx);
        renderBodhidharma(ctx);
        renderTooltip(ctx);
        renderScore(ctx);

        if (phase === 'speech') renderSpeech(ctx);
    }

    function renderTable(ctx) {
        const cx = W * 0.45, cy = H * 0.5;
        const tableR = Math.min(W, H) * 0.15;
        const seatR = Math.min(W, H) * 0.22;

        // Table
        ctx.fillStyle = '#2a1e14';
        ctx.beginPath();
        ctx.arc(cx, cy, tableR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a3a28';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Table label
        ctx.font = '12px serif';
        ctx.fillStyle = '#6a5a48';
        ctx.textAlign = 'center';
        ctx.fillText('THE DINNER TABLE', cx, cy - 8);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#5a4a38';
        ctx.fillText('Seat guests around the table', cx, cy + 8);

        // Seats
        for (let i = 0; i < NUM_SEATS; i++) {
            const angle = i * (Math.PI * 2 / NUM_SEATS) - Math.PI / 2;
            const sx = cx + Math.cos(angle) * seatR;
            const sy = cy + Math.sin(angle) * seatR;

            if (seats[i]) {
                // Occupied seat
                const g = seats[i];
                const tintColor = g.tint > 0 ?
                    `rgba(204, 68, 68, ${Math.abs(g.tint) * 0.3})` :
                    g.tint < 0 ? `rgba(68, 136, 204, ${Math.abs(g.tint) * 0.3})` : null;

                ctx.fillStyle = g.tribe.color;
                ctx.beginPath();
                ctx.arc(sx, sy, 22, 0, Math.PI * 2);
                ctx.fill();

                if (tintColor) {
                    ctx.fillStyle = tintColor;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 22, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.strokeStyle = selectedGuest === g ? '#ffd764' : '#555';
                ctx.lineWidth = selectedGuest === g ? 3 : 1;
                ctx.stroke();

                // Name
                ctx.font = 'bold 11px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(g.name, sx, sy + 4);

                // Tribe initial
                ctx.font = '9px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(g.tribeKey[0], sx, sy - 10);
            } else {
                // Empty seat
                ctx.strokeStyle = '#3d3060';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(sx, sy, 22, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#3d3060';
                ctx.textAlign = 'center';
                ctx.fillText(`Seat ${i + 1}`, sx, sy + 4);
            }

            // Pair score indicator between seats
            const nextIdx = (i + 1) % NUM_SEATS;
            if (seats[i] && seats[nextIdx]) {
                const score = calcPairTolerance(seats[i], seats[nextIdx]);
                const midAngle = (i + 0.5) * (Math.PI * 2 / NUM_SEATS) - Math.PI / 2;
                const mx = cx + Math.cos(midAngle) * (seatR + 30);
                const my = cy + Math.sin(midAngle) * (seatR + 30);
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                if (score >= 2) {
                    ctx.fillStyle = '#40b060';
                    ctx.fillText('\u2764', mx, my); // heart
                } else if (score <= -2) {
                    ctx.fillStyle = '#cc3030';
                    ctx.fillText('\u26A1', mx, my); // lightning
                } else if (score > 0) {
                    ctx.fillStyle = '#88aa44';
                    ctx.fillText('\u263A', mx, my); // smiley
                } else if (score < 0) {
                    ctx.fillStyle = '#aa6644';
                    ctx.fillText('\u2639', mx, my); // frowny
                }
            }
        }
    }

    function renderWaitingGuests(ctx) {
        const startX = W * 0.75;
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText('ARRIVING GUESTS', startX, 70);
        ctx.fillText('(click to select, then click a seat)', startX, 84);

        for (let i = 0; i < unseatedGuests.length; i++) {
            const g = unseatedGuests[i];
            const gy = 100 + i * 60;
            const gx = startX + 30;

            // Guest circle
            ctx.fillStyle = g.tribe.color;
            ctx.beginPath();
            ctx.arc(gx, gy, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = selectedGuest === g ? '#ffd764' : '#555';
            ctx.lineWidth = selectedGuest === g ? 3 : 1;
            ctx.stroke();

            // Name and marker
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(g.name, gx + 28, gy - 4);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText(g.marker, gx + 28, gy + 10);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = g.tribe.color;
            ctx.fillText(g.tribe.name, gx + 28, gy + 22);
        }
    }

    function renderFightsHarmonies(ctx) {
        for (const f of fights) {
            ctx.font = '20px sans-serif';
            ctx.fillStyle = `rgba(204, 48, 48, ${f.timer * 2})`;
            ctx.textAlign = 'center';
            ctx.fillText('\u{1F4A2}', f.x, f.y); // anger symbol
        }
        for (const h of harmonies) {
            ctx.font = '20px sans-serif';
            ctx.fillStyle = `rgba(64, 176, 96, ${h.timer * 2})`;
            ctx.textAlign = 'center';
            ctx.fillText('\u2728', h.x, h.y); // sparkles
        }
    }

    function renderMessages(ctx) {
        for (const m of messages) {
            ctx.font = '13px sans-serif';
            ctx.globalAlpha = Math.max(0, m.alpha);
            ctx.fillStyle = m.color;
            ctx.textAlign = 'center';
            ctx.fillText(m.text, m.x, m.y);
            ctx.globalAlpha = 1;
        }
    }

    function renderMirror(ctx) {
        if (phase !== 'mirror' && !mirrorRevealed) return;
        if (phase === 'mirror') {
            // Flash the mirror reveal
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.font = 'bold 24px serif';
            ctx.fillStyle = '#ffd764';
            ctx.textAlign = 'center';
            ctx.fillText('THE MIRROR', W / 2, H * 0.3);
            ctx.font = '16px serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText('The camera has been on YOU the whole time.', W / 2, H * 0.4);
            if (playerBias.tribe) {
                ctx.fillStyle = '#cc8a60';
                ctx.fillText(`You\'ve been unconsciously favoring: ${TRIBES[playerBias.tribe]?.name || playerBias.tribe}`, W / 2, H * 0.5);
                ctx.fillText(`(${playerBias.favoredCount} seated from that tribe)`, W / 2, H * 0.55);
            }
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText('Click to continue', W / 2, H * 0.7);
        }
    }

    function renderBodhidharma(ctx) {
        if (!bodhidharmaVisible) return;
        const bx = W * 0.1, by = H * 0.7;
        // Wise figure
        ctx.fillStyle = 'rgba(170, 136, 68, 0.8)';
        ctx.beginPath();
        ctx.arc(bx, by, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 12px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('Bodhidharma', bx, by - 35);
        ctx.font = 'italic 11px serif';
        ctx.fillStyle = '#aa8844';
        ctx.fillText('"Zero tolerance points', bx, by + 35);
        ctx.fillText('for bragging about tolerance."', bx, by + 48);
    }

    function renderTooltip(ctx) {
        if (!tooltipGuest) return;
        const g = tooltipGuest;
        const tx = Math.min(W - 220, Math.max(10, W * 0.3));
        const ty = H - 140;

        ctx.fillStyle = 'rgba(26, 20, 40, 0.95)';
        ctx.fillRect(tx, ty, 210, 130);
        ctx.strokeStyle = g.tribe.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, 210, 130);

        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.textAlign = 'left';
        ctx.fillText(`${g.name} (${g.tribe.name})`, tx + 8, ty + 18);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText(`"${g.marker}"`, tx + 8, ty + 34);

        // Show revealed beliefs
        const revealed = revealedBeliefs[g.id] || [];
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Known beliefs:', tx + 8, ty + 52);
        let yy = ty + 66;
        for (const idx of revealed) {
            const belief = BELIEFS[idx];
            ctx.fillStyle = '#cc9060';
            ctx.fillText(`${BELIEF_LABELS[belief]}: ${g.beliefs[belief]}`, tx + 12, yy);
            yy += 14;
        }
        if (revealed.length === 0) {
            ctx.fillStyle = '#5a4a38';
            ctx.fillText('(seat to reveal beliefs)', tx + 12, yy);
        }
    }

    function renderScore(ctx) {
        const score = calcTotalScore();
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'left';
        ctx.fillText(`Tolerance Score: ${score.toFixed(1)}`, 20, H - 20);

        const seatedCount = seats.filter(s => s !== null).length;
        ctx.fillText(`Seated: ${seatedCount}/${NUM_SEATS}`, 20, H - 38);
    }

    function renderSpeech(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('THE SPEECH', W / 2, H * 0.15);
        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('Everyone is seated. Time for a toast.', W / 2, H * 0.22);
        ctx.fillText('What do you say about tolerance?', W / 2, H * 0.27);

        const startY = H * 0.35;
        for (let i = 0; i < speechOptions.length; i++) {
            const by = startY + i * 50;
            const hovered = ctx.canvas && true; // always draw
            ctx.fillStyle = '#1a1428';
            ctx.fillRect(W * 0.2, by, W * 0.6, 40);
            ctx.strokeStyle = speechOptions[i].meta ? '#cc8a20' : '#3d3060';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.2, by, W * 0.6, 40);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = speechOptions[i].meta ? '#cc8a20' : '#e8e0f0';
            ctx.textAlign = 'center';
            ctx.fillText(speechOptions[i].label, W / 2, by + 24);
        }

        // Score preview
        const score = calcTotalScore();
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Current seating score: ${score.toFixed(1)}`, W / 2, H * 0.8);
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(13, 10, 26, 0.95)';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2, cy = H * 0.3;
        ctx.font = 'bold 28px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('THE EVENING ENDS', cx, cy);

        ctx.font = '18px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText(`Tolerance Score: ${toleranceScore.toFixed(1)}`, cx, cy + 50);

        if (toleranceBragPoints > 1) {
            ctx.font = 'italic 14px serif';
            ctx.fillStyle = '#aa8844';
            ctx.fillText('Bodhidharma awarded you zero points for bragging.', cx, cy + 80);
        }

        if (galaxyBrained) {
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#cc8a20';
            ctx.fillText('ACHIEVEMENT: Galaxy-Brained Tolerance!', cx, cy + 110);
            ctx.font = '13px serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText('You optimized tolerance through pure logic.', cx, cy + 135);
            ctx.fillText('But did you understand why it was hard?', cx, cy + 155);
        }

        // Player bias reveal
        if (playerBias.tribe) {
            ctx.font = '14px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText(`Your unconscious bias: favored ${TRIBES[playerBias.tribe]?.name || '?'}`, cx, cy + 190);
        }

        ctx.font = 'italic 16px serif';
        ctx.fillStyle = '#ffd764';
        const insight = galaxyBrained ?
            '"Galaxy-brained yourself into being tolerant."' :
            '"We hate our near enemies, not our far enemies."';
        ctx.fillText(insight, cx, cy + 240);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, cy + 300);
    }

    function renderTutorial(ctx) {
        ctx.fillStyle = 'rgba(13, 10, 26, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;

        const steps = [
            {
                title: 'I CAN TOLERATE ANYTHING EXCEPT THE OUTGROUP',
                text: 'You\'re hosting a dinner party.\nGuests arrive with visible tribal markers.\n\nYour job: seat them around the table\nto maximize genuine tolerance.'
            },
            {
                title: 'THE NEAR-OUTGROUP EFFECT',
                text: 'Easy tolerance: seat a Blue Tribe member\nnext to a Far Foreigner. No friction.\n\nHard tolerance: seat near-identical people\nwho disagree on ONE key issue.\nThat\'s where the real explosions happen.'
            },
            {
                title: 'THE RULES',
                text: 'Click a guest to select, then click a seat.\nWatch the indicators between seats.\nHeart = harmony. Lightning = fight.\n\nHalfway through, the mirror turns on you.\n\nClick to begin.'
            }
        ];

        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd764';
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
