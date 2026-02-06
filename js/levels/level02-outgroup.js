/* ======================================
   LEVEL 2: I CAN TOLERATE ANYTHING
   EXCEPT THE OUTGROUP

   Social Puzzle / Empathy Simulator

   We hate our near enemies, not our far
   enemies. The Blue Tribe and Red Tribe
   despise each other more than either
   despises distant foreigners.
   ====================================== */

// ---- TRIBE & BELIEF DATA ----

const TRIBES = {
    BLUE: {
        name: 'Blue Tribe',
        hue: 220,
        color: '#4a7adf',
        markers: ['NPR tote bag', 'craft oat milk latte', 'Subaru with coexist sticker',
                  '"I voted" pin', 'New Yorker subscription', 'reusable grocery bags'],
        descriptors: ['urban professional', 'academic', 'progressive activist',
                      'nonprofit worker', 'journalist', 'tech ethicist']
    },
    RED: {
        name: 'Red Tribe',
        hue: 0,
        color: '#df4a4a',
        markers: ['flag lapel pin', 'pickup truck keys', 'church bulletin',
                  'camo baseball cap', 'Carhartt jacket', 'NRA membership card'],
        descriptors: ['small business owner', 'veteran', 'church deacon',
                      'rancher', 'sheriff deputy', 'football coach']
    },
    GREY: {
        name: 'Grey Tribe',
        hue: 200,
        color: '#7aaabb',
        markers: ['rationalist blog pin', 'effective altruism lanyard', 'tech hoodie',
                  'Kindle with SSC bookmarks', 'nootropics bottle', 'prediction market app'],
        descriptors: ['software engineer', 'rationalist blogger', 'EA researcher',
                      'startup founder', 'data scientist', 'LessWrong moderator']
    },
    FAR_EAST: {
        name: 'Far Culture (East)',
        hue: 40,
        color: '#c0943a',
        markers: ['traditional silk scarf', 'calligraphy brush', 'green tea thermos',
                  'prayer beads', 'foreign passport', 'hand-painted fan'],
        descriptors: ['visiting scholar', 'tea ceremony master', 'exchange student',
                      'calligrapher', 'Buddhist monk', 'traditional healer']
    },
    FAR_SOUTH: {
        name: 'Far Culture (South)',
        hue: 140,
        color: '#4aaf6a',
        markers: ['handwoven textile', 'carved walking stick', 'herbal pouch',
                  'bright patterned cloth', 'hand-drum', 'beaded jewelry'],
        descriptors: ['community elder', 'folk musician', 'herbalist',
                      'village teacher', 'storyteller', 'artisan weaver']
    }
};

// Belief topics
const BELIEF_TOPICS = [
    { id: 'markets',     label: 'Free Markets',       icon: '\u2696' },
    { id: 'tradition',   label: 'Tradition',           icon: '\u26EA' },
    { id: 'authority',   label: 'Authority',           icon: '\u2655' },
    { id: 'progress',    label: 'Progress',            icon: '\u2192' },
    { id: 'individual',  label: 'Individualism',       icon: '\u2606' },
    { id: 'community',   label: 'Community',           icon: '\u2302' },
    { id: 'science',     label: 'Science',             icon: '\u2697' },
    { id: 'equality',    label: 'Equality',            icon: '\u2261' }
];

// Tribal belief tendencies (probability of agreeing, 0-1)
const TRIBE_BELIEF_PROBS = {
    BLUE:     { markets: 0.2, tradition: 0.1, authority: 0.15, progress: 0.9, individual: 0.4, community: 0.8, science: 0.85, equality: 0.95 },
    RED:      { markets: 0.85, tradition: 0.9, authority: 0.8, progress: 0.3, individual: 0.85, community: 0.6, science: 0.4, equality: 0.3 },
    GREY:     { markets: 0.7, tradition: 0.2, authority: 0.2, progress: 0.8, individual: 0.8, community: 0.3, science: 0.95, equality: 0.5 },
    FAR_EAST: { markets: 0.4, tradition: 0.7, authority: 0.5, progress: 0.5, individual: 0.3, community: 0.85, science: 0.6, equality: 0.5 },
    FAR_SOUTH:{ markets: 0.3, tradition: 0.8, authority: 0.4, progress: 0.4, individual: 0.2, community: 0.9, science: 0.4, equality: 0.6 }
};

// Tribal distance matrix (higher = more distant = easier baseline tolerance)
const TRIBAL_DISTANCE = {
    BLUE:      { BLUE: 0, RED: 1, GREY: 2, FAR_EAST: 5, FAR_SOUTH: 5 },
    RED:       { BLUE: 1, RED: 0, GREY: 3, FAR_EAST: 5, FAR_SOUTH: 5 },
    GREY:      { BLUE: 2, RED: 3, GREY: 0, FAR_EAST: 4, FAR_SOUTH: 4 },
    FAR_EAST:  { BLUE: 5, RED: 5, GREY: 4, FAR_EAST: 0, FAR_SOUTH: 3 },
    FAR_SOUTH: { BLUE: 5, RED: 5, GREY: 4, FAR_EAST: 3, FAR_SOUTH: 0 }
};

// Guest name pools
const NAMES = {
    BLUE: ['Aiden', 'Maya', 'Jordan', 'Quinn', 'Sage', 'River', 'Harper', 'Avery', 'Ellis', 'Rowan'],
    RED: ['Buck', 'Tammy', 'Dale', 'Charlene', 'Hank', 'Jolene', 'Travis', 'Patsy', 'Clay', 'Darla'],
    GREY: ['Eliezer', 'Julia', 'Scott', 'Kelsey', 'Nate', 'Gwern', 'Robin', 'Zvi', 'Wei', 'Anna'],
    FAR_EAST: ['Kenji', 'Mei-Lin', 'Hiroshi', 'Yuki', 'Jian', 'Sakura', 'Ravi', 'Priya', 'Chen', 'Aiko'],
    FAR_SOUTH: ['Amara', 'Kofi', 'Nia', 'Jabari', 'Zuri', 'Kwame', 'Adaeze', 'Tendai', 'Fatima', 'Oluwole']
};

// ---- LEVEL CLASS ----

class Level02Outgroup {
    constructor(engine) {
        this.engine = engine;
        this.ctx = engine.ctx;
        this.canvas = engine.canvas;
        this.elua = engine.protagonist;
    }

    init() {
        // ---- State ----
        this.time = 0;
        this.gameOver = false;
        this.round = 1;
        this.maxRounds = 5;
        this.phase = 'seating'; // 'seating', 'mirror', 'post_mirror', 'final', 'meta_speech'

        // ---- Table ----
        this.tableCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        this.tableRadiusX = Math.min(this.canvas.width * 0.3, 280);
        this.tableRadiusY = Math.min(this.canvas.height * 0.22, 180);
        this.seatCount = 8;
        this.seats = [];
        for (let i = 0; i < this.seatCount; i++) {
            const angle = (i / this.seatCount) * Math.PI * 2 - Math.PI / 2;
            this.seats.push({
                x: this.tableCenter.x + Math.cos(angle) * (this.tableRadiusX + 40),
                y: this.tableCenter.y + Math.sin(angle) * (this.tableRadiusY + 40),
                angle,
                guest: null,
                hoverHighlight: false
            });
        }

        // ---- Guests ----
        this.allGuests = [];
        this.currentGuests = [];       // Guests available to seat this round
        this.waitingGuest = null;       // The guest currently at the door
        this.seatedGuests = [];
        this.guestIdCounter = 0;
        this.selectedSeat = null;
        this.hoveredSeat = null;
        this.hoveredGuest = null;
        this.dragGuest = null;
        this.beliefsRevealed = false;   // After mirror phase, beliefs become visible

        // ---- Scoring ----
        this.toleranceScore = 0;
        this.maxTolerance = 0;
        this.speechesTolerance = 0;     // Claimed tolerance from speeches
        this.actualTolerance = 0;       // Real tolerance from seating
        this.speechesGiven = [];
        this.groupsSeatedComfortably = {};  // Track which tribes seated near similar
        this.playerBias = {};           // Track unconscious bias

        // ---- Mirror Phase ----
        this.mirrorTriggered = false;
        this.mirrorDismissed = false;

        // ---- Bodhidharma ----
        this.bodhidharmaTimer = 0;
        this.bodhidharmaShown = false;

        // ---- Galaxy Brain achievement ----
        this.galaxyBrained = false;

        // ---- Tint animation ----
        this.tintProgress = 0; // 0 = no tint, 1 = full tribal tint

        // ---- Elua at the head ----
        this.elua.setPosition(this.tableCenter.x, this.tableCenter.y - this.tableRadiusY - 90);

        // ---- Visual ----
        this.candleFlicker = 0;
        this.particles = [];

        // Generate all rounds of guests
        this.generateAllGuests();

        // Start round 1
        this.startRound();

        // Show Level 2 UI, hide Level 1 UI
        document.getElementById('dinner-ui').style.display = 'block';
        document.getElementById('speech-panel').style.display = 'block';
        document.getElementById('tolerance-display').style.display = 'block';

        // Setup speeches
        this.setupSpeeches();

        // Setup mirror dismiss
        document.getElementById('mirror-dismiss').onclick = () => {
            this.mirrorDismissed = true;
            document.getElementById('mirror-overlay').style.display = 'none';
            this.phase = 'post_mirror';
            this.beliefsRevealed = true;
            // Clear table for final rounds
            this.clearTable();
            this.round = 4;
            this.startRound();
        };

        // Intro
        this.engine.showMessage(
            "You are hosting a <b>dinner party</b>.<br><br>" +
            "Guests will arrive one by one. Each carries visible markers of their tribe &mdash; " +
            "their clothing, their vocabulary, the bumper sticker on their car.<br><br>" +
            "Seat them at the table. Your goal: maximize <b>tolerance</b>.",
            () => {
                this.engine.showMessage(
                    "But tolerance is not what you think.<br><br>" +
                    "Two people from <i>very different</i> backgrounds will get along fine. " +
                    "Two people who are <i>almost identical</i> but disagree on one key issue? " +
                    "<b>Explosion.</b><br><br>" +
                    "<i>Click on an empty seat to place the arriving guest.</i>",
                    null
                );
            }
        );
    }

    // ===============================
    //  GUEST GENERATION
    // ===============================

    generateAllGuests() {
        // Round 1: Easy — mostly far cultures + one Blue
        this.roundGuests = [];

        // Round 1: Introduction (3 guests) - easy placement
        this.roundGuests.push(this.generateRoundGuests(1, [
            { tribe: 'BLUE', variant: 'standard' },
            { tribe: 'FAR_EAST', variant: 'standard' },
            { tribe: 'FAR_SOUTH', variant: 'standard' }
        ]));

        // Round 2: Tension builds (3 guests) - introduce Red near Blue
        this.roundGuests.push(this.generateRoundGuests(2, [
            { tribe: 'RED', variant: 'standard' },
            { tribe: 'BLUE', variant: 'standard' },
            { tribe: 'GREY', variant: 'standard' }
        ]));

        // Round 3: The "Nazis and Japanese" puzzle (2 guests)
        // Two who look very different but share beliefs, and prior seated who look alike but clash
        this.roundGuests.push(this.generateRoundGuests(3, [
            { tribe: 'RED', variant: 'shares_blue_beliefs' },
            { tribe: 'FAR_EAST', variant: 'shares_red_beliefs' }
        ]));

        // Round 4: Post-mirror, harder (3 guests) - near-outgroup dynamics
        this.roundGuests.push(this.generateRoundGuests(4, [
            { tribe: 'BLUE', variant: 'almost_grey' },
            { tribe: 'GREY', variant: 'almost_blue' },
            { tribe: 'RED', variant: 'moderate' }
        ]));

        // Round 5: Final challenge (2 guests)
        this.roundGuests.push(this.generateRoundGuests(5, [
            { tribe: 'BLUE', variant: 'extreme' },
            { tribe: 'RED', variant: 'extreme' }
        ]));
    }

    generateRoundGuests(round, specs) {
        return specs.map(spec => this.createGuest(spec.tribe, spec.variant, round));
    }

    createGuest(tribeKey, variant, round) {
        const tribe = TRIBES[tribeKey];
        const probs = { ...TRIBE_BELIEF_PROBS[tribeKey] };
        const id = this.guestIdCounter++;

        // Apply variant modifications
        switch (variant) {
            case 'shares_blue_beliefs':
                // Red tribe appearance but Blue beliefs (the "Nazis and Japanese" reference)
                Object.assign(probs, TRIBE_BELIEF_PROBS.BLUE);
                break;
            case 'shares_red_beliefs':
                // Far East appearance but Red beliefs
                Object.assign(probs, TRIBE_BELIEF_PROBS.RED);
                break;
            case 'almost_grey':
                // Blue but with Grey-like beliefs on most things, differs on 1 key
                Object.assign(probs, TRIBE_BELIEF_PROBS.GREY);
                probs.equality = 0.95; // The one key difference
                probs.community = 0.8;
                break;
            case 'almost_blue':
                // Grey but with Blue-like beliefs, differs on 1 key
                Object.assign(probs, TRIBE_BELIEF_PROBS.BLUE);
                probs.equality = 0.3; // Disagrees on equality — explosion
                probs.markets = 0.7;
                break;
            case 'moderate':
                // Red but moderate — agrees with some Blue positions
                probs.progress = 0.5;
                probs.science = 0.6;
                probs.equality = 0.4;
                break;
            case 'extreme':
                // Pushes all tribal beliefs to extremes
                for (const key in probs) {
                    probs[key] = probs[key] > 0.5 ? Math.min(1, probs[key] + 0.15) : Math.max(0, probs[key] - 0.15);
                }
                break;
        }

        // Roll beliefs
        const beliefs = {};
        for (const topic of BELIEF_TOPICS) {
            beliefs[topic.id] = Math.random() < probs[topic.id];
        }

        // Pick name and markers
        const namePool = NAMES[tribeKey] || NAMES.BLUE;
        const name = namePool[id % namePool.length];
        const markerPool = tribe.markers;
        const markers = [
            markerPool[Math.floor(Math.random() * markerPool.length)],
            markerPool[Math.floor(Math.random() * markerPool.length)]
        ].filter((v, i, a) => a.indexOf(v) === i); // unique

        const descriptor = tribe.descriptors[Math.floor(Math.random() * tribe.descriptors.length)];

        return {
            id,
            name,
            tribe: tribeKey,
            tribeName: tribe.name,
            tribeColor: tribe.color,
            tribeHue: tribe.hue,
            beliefs,
            markers,
            descriptor,
            variant,
            round,
            seated: false,
            seatIndex: -1,
            tintAmount: 0,  // Starts neutral, tints toward tribe color
            arrivalTime: 0,
            // Position for rendering (when at door or being dragged)
            x: 0, y: 0
        };
    }

    // ===============================
    //  ROUND MANAGEMENT
    // ===============================

    startRound() {
        if (this.round > this.maxRounds) {
            this.finishGame();
            return;
        }

        const roundIdx = this.round - 1;
        if (roundIdx >= this.roundGuests.length) {
            this.finishGame();
            return;
        }

        this.currentGuests = [...this.roundGuests[roundIdx]];
        this.waitingGuest = null;
        this.nextGuest();

        this.updateDinnerUI();
    }

    nextGuest() {
        if (this.currentGuests.length === 0) {
            // Round complete
            this.endRound();
            return;
        }

        this.waitingGuest = this.currentGuests.shift();
        this.waitingGuest.arrivalTime = this.time;

        // Position at the "door" (top of screen)
        this.waitingGuest.x = this.canvas.width / 2;
        this.waitingGuest.y = 60;

        // Show guest info
        this.showGuestInfo(this.waitingGuest);
    }

    endRound() {
        this.waitingGuest = null;
        this.calculateToleranceScores();
        this.updateToleranceDisplay();

        // Check for mirror phase (after round 3)
        if (this.round === 3 && !this.mirrorTriggered) {
            this.triggerMirrorPhase();
            return;
        }

        this.round++;

        if (this.round > this.maxRounds) {
            this.finishGame();
        } else {
            this.engine.showMessage(
                `<b>Round ${this.round}</b><br><br>` +
                `New guests are arriving...` +
                (this.round === 4 && this.beliefsRevealed
                    ? `<br><br><i>You can now see guests' hidden beliefs. Does it change how you seat them?</i>`
                    : ''),
                () => this.startRound()
            );
        }
    }

    clearTable() {
        for (const seat of this.seats) {
            seat.guest = null;
        }
        this.seatedGuests = [];
    }

    // ===============================
    //  TOLERANCE CALCULATION
    // ===============================

    calculateToleranceScores() {
        let totalTolerance = 0;
        let pairCount = 0;

        for (let i = 0; i < this.seatCount; i++) {
            const seatA = this.seats[i];
            const seatB = this.seats[(i + 1) % this.seatCount];
            if (!seatA.guest || !seatB.guest) continue;

            const tol = this.calculatePairTolerance(seatA.guest, seatB.guest);
            totalTolerance += tol;
            pairCount++;
        }

        this.actualTolerance = pairCount > 0 ? totalTolerance / pairCount : 0;
        this.toleranceScore = Math.max(0, Math.min(100, this.actualTolerance));
    }

    calculatePairTolerance(guestA, guestB) {
        // Base: tribal distance (far apart = easier tolerance)
        const tribalDist = TRIBAL_DISTANCE[guestA.tribe][guestB.tribe];
        let tolerance = tribalDist * 12; // 0-60 range

        // Belief congruence
        let sharedBeliefs = 0;
        let totalBeliefs = BELIEF_TOPICS.length;
        let keyDisagreement = false;

        for (const topic of BELIEF_TOPICS) {
            if (guestA.beliefs[topic.id] === guestB.beliefs[topic.id]) {
                sharedBeliefs++;
            } else {
                // Key disagreements between near-tribes are explosive
                if (tribalDist <= 2) {
                    // Near tribe: disagreement on key topics is devastating
                    if (topic.id === 'equality' || topic.id === 'authority' || topic.id === 'tradition') {
                        keyDisagreement = true;
                    }
                }
            }
        }

        const congruence = sharedBeliefs / totalBeliefs;
        tolerance += congruence * 30; // 0-30 range from beliefs

        // NEAR-OUTGROUP PENALTY: The essay's key insight
        // If tribes are close (dist 1-2) and there's a key disagreement, massive penalty
        if (tribalDist <= 2 && keyDisagreement) {
            tolerance -= 40;  // Devastating
        }

        // Extra penalty for same tribe with any disagreement (the "worst enemy is the heretic")
        if (tribalDist === 0) {
            const disagreements = totalBeliefs - sharedBeliefs;
            if (disagreements >= 1) {
                tolerance -= disagreements * 10; // Heretics are worse than enemies
            }
        }

        return Math.max(-50, Math.min(100, tolerance));
    }

    // ===============================
    //  SPEECHES
    // ===============================

    setupSpeeches() {
        const panel = document.getElementById('speech-buttons');
        panel.innerHTML = '';

        const speeches = [
            { id: 'praise_all', text: 'Praise everyone\'s diversity', tolerance: 5 },
            { id: 'praise_blue', text: 'Praise Blue Tribe values', tolerance: 3 },
            { id: 'praise_red', text: 'Praise Red Tribe values', tolerance: 3 },
            { id: 'praise_far', text: 'Praise Far cultures\' wisdom', tolerance: 3 },
            { id: 'meta', text: '"This essay is bad and I should feel bad"', tolerance: 0 }
        ];

        for (const speech of speeches) {
            const btn = document.createElement('button');
            btn.className = 'speech-btn';
            btn.textContent = speech.text;
            btn.dataset.speechId = speech.id;
            btn.onclick = () => this.giveSpeech(speech, btn);
            panel.appendChild(btn);
        }
    }

    giveSpeech(speech, btn) {
        if (btn.classList.contains('used')) return;
        btn.classList.add('used');
        this.speechesGiven.push(speech.id);
        this.speechesTolerance += speech.tolerance;

        const feedback = document.getElementById('speech-feedback');

        if (speech.id === 'meta') {
            // The meta ending trigger
            feedback.textContent = '"I acknowledge I\'m not as tolerant as I pretend."';
            this.phase = 'meta_speech';
            setTimeout(() => this.triggerMetaEnding(), 2000);
            return;
        }

        if (speech.id === 'praise_all') {
            feedback.textContent = 'The guests applaud politely. Tolerance score +5.';
            // Check Bodhidharma trigger
            if (this.speechesGiven.length >= 3 && !this.bodhidharmaShown) {
                setTimeout(() => this.showBodhidharma(), 1500);
            }
        } else {
            // Track bias — which groups you praise
            const praised = speech.id.replace('praise_', '');
            this.playerBias[praised] = (this.playerBias[praised] || 0) + 1;
            feedback.textContent = `You speak warmly of the ${speech.text.split(' ').slice(1).join(' ')}. +${speech.tolerance}`;
        }
    }

    showBodhidharma() {
        this.bodhidharmaShown = true;
        const el = document.getElementById('bodhidharma-overlay');
        const text = document.getElementById('bodhidharma-text');
        text.textContent = 'Bodhidharma awards you ZERO tolerance points for bragging about tolerance.';
        el.style.display = 'flex';

        text.style.animation = 'none';
        void text.offsetHeight;
        text.style.animation = 'bodhidharmaFade 3.5s ease-out forwards';

        this.speechesTolerance = Math.max(0, this.speechesTolerance - 5);
        document.getElementById('speech-feedback').textContent = 'Bodhidharma: "Zero."';

        setTimeout(() => { el.style.display = 'none'; }, 3800);
    }

    // ===============================
    //  MIRROR PHASE
    // ===============================

    triggerMirrorPhase() {
        this.mirrorTriggered = true;
        this.phase = 'mirror';

        // Analyze player's seating patterns
        const tribeSeatingCounts = {};
        for (const seat of this.seats) {
            if (!seat.guest) continue;
            const tribe = seat.guest.tribe;
            tribeSeatingCounts[tribe] = (tribeSeatingCounts[tribe] || 0) + 1;
        }

        // Check if player unconsciously favored certain tribes
        // (placed them in "comfortable" spots — next to similar or very distant)
        let comfortablePlacements = 0;
        let difficultPlacements = 0;
        for (let i = 0; i < this.seatCount; i++) {
            const seatA = this.seats[i];
            const seatB = this.seats[(i + 1) % this.seatCount];
            if (!seatA.guest || !seatB.guest) continue;
            const dist = TRIBAL_DISTANCE[seatA.guest.tribe][seatB.guest.tribe];
            if (dist >= 4 || dist === 0) comfortablePlacements++;
            else difficultPlacements++;
        }

        // Determine Elua's "tribe" based on seating pattern
        const eluaTribe = this.speechesGiven.includes('praise_blue') ? 'Blue' :
                          this.speechesGiven.includes('praise_red') ? 'Red' : 'Grey';

        const statsDiv = document.getElementById('mirror-stats');
        statsDiv.innerHTML = '';

        const stats = [
            ['Comfortable pairings', comfortablePlacements],
            ['Difficult pairings', difficultPlacements],
            ['Speeches given', this.speechesGiven.length],
            ['Claimed tolerance', '+' + this.speechesTolerance],
            ['Your detected tribe', eluaTribe]
        ];

        for (const [label, value] of stats) {
            const row = document.createElement('div');
            row.className = 'mirror-stat-row';
            row.innerHTML = `<span>${label}</span><span>${value}</span>`;
            statsDiv.appendChild(row);
        }

        document.getElementById('mirror-text').innerHTML =
            "The camera turns. It has been on <b>you</b> the whole time.<br><br>" +
            "You have been unconsciously seating guests based on your <i>own</i> tribal affiliations. " +
            "The tolerance you claimed in speeches? The game was tracking what you <i>actually did</i>.<br><br>" +
            "<i>\"I can tolerate anything except the outgroup.\"</i>";

        document.getElementById('mirror-overlay').style.display = 'flex';

        // Start tinting guests toward their tribal colors
        this.tintProgress = 0;
    }

    // ===============================
    //  INPUT HANDLING
    // ===============================

    handleInput() {
        if (this.gameOver) return;

        const mx = this.engine.mouse.x;
        const my = this.engine.mouse.y;

        // Update hover states
        this.hoveredSeat = null;
        this.hoveredGuest = null;

        for (let i = 0; i < this.seats.length; i++) {
            const seat = this.seats[i];
            const dist = Math.hypot(seat.x - mx, seat.y - my);
            seat.hoverHighlight = false;
            if (dist < 28) {
                this.hoveredSeat = i;
                seat.hoverHighlight = true;
                if (seat.guest) {
                    this.hoveredGuest = seat.guest;
                }
            }
        }

        // Hover over waiting guest
        if (this.waitingGuest) {
            const dist = Math.hypot(this.waitingGuest.x - mx, this.waitingGuest.y - my);
            if (dist < 25) {
                this.hoveredGuest = this.waitingGuest;
            }
        }

        // Show info for hovered guest
        if (this.hoveredGuest) {
            this.showGuestInfo(this.hoveredGuest);
        }

        // Left click — seat the waiting guest
        if (this.engine.mouse.clicked && this.waitingGuest && this.hoveredSeat !== null) {
            const seat = this.seats[this.hoveredSeat];
            if (!seat.guest) {
                this.seatGuest(this.waitingGuest, this.hoveredSeat);
            }
        }

        // Right click on seated guest — show detailed info
        if (this.engine.mouse.rightClicked && this.hoveredGuest) {
            this.showGuestInfo(this.hoveredGuest);
        }
    }

    seatGuest(guest, seatIndex) {
        const seat = this.seats[seatIndex];
        seat.guest = guest;
        guest.seated = true;
        guest.seatIndex = seatIndex;
        guest.x = seat.x;
        guest.y = seat.y;
        this.seatedGuests.push(guest);

        // Track bias
        this.playerBias[guest.tribe] = (this.playerBias[guest.tribe] || 0) + 1;

        // Recalculate tolerance
        this.calculateToleranceScores();
        this.updateToleranceDisplay();
        this.updateDinnerUI();

        // Particles — seat glow
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: seat.x, y: seat.y,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                life: 1,
                color: guest.tribeColor,
                size: 2
            });
        }

        // Next guest
        this.waitingGuest = null;
        this.nextGuest();
    }

    // ===============================
    //  GUEST INFO UI
    // ===============================

    showGuestInfo(guest) {
        const panel = document.getElementById('guest-info-panel');
        const title = document.getElementById('guest-info-title');
        const content = document.getElementById('guest-info-content');

        title.textContent = guest.name;

        let html = '';

        // Tribe tag
        html += `<span class="tribe-tag" style="background:${guest.tribeColor}; color:#fff;">${guest.tribeName}</span><br>`;

        // Descriptor
        html += `<span style="color:var(--grey-cold); font-style:italic;">${guest.descriptor}</span><br>`;

        // Visible markers
        html += `<div class="marker-list">`;
        for (const marker of guest.markers) {
            html += `&bull; ${marker}<br>`;
        }
        html += `</div>`;

        // Beliefs (hidden unless revealed)
        html += `<div style="margin-top:0.5em; border-top:1px solid rgba(74,61,110,0.3); padding-top:0.4em;">`;
        html += `<b style="font-size:0.6rem; letter-spacing:0.1em; color:var(--grey-cold);">BELIEFS</b><br>`;

        for (const topic of BELIEF_TOPICS) {
            const value = guest.beliefs[topic.id];
            if (this.beliefsRevealed) {
                const color = value ? '#4aaf5a' : '#d44040';
                const label = value ? 'Yes' : 'No';
                html += `<div class="belief-row"><span>${topic.icon} ${topic.label}</span><span style="color:${color};">${label}</span></div>`;
            } else {
                html += `<div class="belief-row"><span>${topic.icon} ${topic.label}</span><span class="belief-hidden">???</span></div>`;
            }
        }
        html += `</div>`;

        content.innerHTML = html;
        panel.style.display = 'block';
    }

    // ===============================
    //  TOLERANCE DISPLAY
    // ===============================

    updateToleranceDisplay() {
        const breakdown = document.getElementById('tolerance-breakdown');
        let html = '<b style="font-size:0.6rem; letter-spacing:0.1em; color:var(--grey-cold);">NEIGHBOR PAIRS</b><br>';

        for (let i = 0; i < this.seatCount; i++) {
            const seatA = this.seats[i];
            const seatB = this.seats[(i + 1) % this.seatCount];
            if (!seatA.guest || !seatB.guest) continue;

            const tol = this.calculatePairTolerance(seatA.guest, seatB.guest);
            let cls = 'tol-ok';
            if (tol >= 60) cls = 'tol-good';
            else if (tol < 20 && tol >= 0) cls = 'tol-ok';
            else if (tol < 0) cls = 'tol-explosive';
            else if (tol < 30) cls = 'tol-bad';

            const tolLabel = tol < 0 ? 'EXPLOSIVE' : Math.floor(tol);
            html += `<div class="tol-pair"><span>${seatA.guest.name} \u2194 ${seatB.guest.name}</span><span class="${cls}">${tolLabel}</span></div>`;
        }

        if (this.speechesTolerance > 0) {
            html += `<div class="tol-pair" style="border-top:1px solid var(--purple-dim); margin-top:0.3em; padding-top:0.3em;"><span>Speeches (claimed)</span><span style="color:var(--culture-blue);">+${this.speechesTolerance}</span></div>`;
        }

        breakdown.innerHTML = html;
    }

    // ===============================
    //  DINNER UI UPDATE
    // ===============================

    updateDinnerUI() {
        const seatedCount = this.seats.filter(s => s.guest !== null).length;
        const totalRound = this.roundGuests[Math.min(this.round - 1, this.roundGuests.length - 1)]
            ? this.roundGuests[Math.min(this.round - 1, this.roundGuests.length - 1)].length
            : 0;

        document.getElementById('round-display').textContent = `Round: ${this.round} / ${this.maxRounds}`;
        document.getElementById('guests-seated-display').textContent = `Seated: ${seatedCount}`;
        document.getElementById('tolerance-fill').style.width = Math.max(0, this.toleranceScore) + '%';
        document.getElementById('tolerance-value').textContent = Math.floor(this.toleranceScore);
        document.getElementById('humanity-fill-l2').style.width = this.elua.humanity + '%';
    }

    // ===============================
    //  WIN / LOSS / META
    // ===============================

    finishGame() {
        this.gameOver = true;
        this.calculateToleranceScores();

        // Check galaxy-brained achievement
        const allPairsPositive = (() => {
            for (let i = 0; i < this.seatCount; i++) {
                const seatA = this.seats[i];
                const seatB = this.seats[(i + 1) % this.seatCount];
                if (!seatA.guest || !seatB.guest) continue;
                if (this.calculatePairTolerance(seatA.guest, seatB.guest) < 50) return false;
            }
            return true;
        })();

        if (allPairsPositive && this.seatedGuests.length >= 8) {
            this.galaxyBrained = true;
        }

        // Determine ending
        const hasDifficultPairings = (() => {
            let count = 0;
            for (let i = 0; i < this.seatCount; i++) {
                const seatA = this.seats[i];
                const seatB = this.seats[(i + 1) % this.seatCount];
                if (!seatA.guest || !seatB.guest) continue;
                const dist = TRIBAL_DISTANCE[seatA.guest.tribe][seatB.guest.tribe];
                if (dist <= 2 && dist > 0) count++;
            }
            return count >= 3;
        })();

        let title, text, insight;

        if (this.galaxyBrained) {
            title = "GALAXY-BRAINED";
            text = "You somehow seated everyone perfectly through pure optimization. " +
                   "Every pair tolerates each other. Every near-enemy sits beside a far-stranger instead.<br><br>" +
                   "It's beautiful. It's also completely artificial. " +
                   "In real life, you can't rearrange the seating chart of civilization.<br><br>" +
                   "<i>Achievement unlocked: \"Galaxy-brained himself into being tolerant.\"</i>";
            insight = "\"I can tolerate anything except the outgroup. And the outgroup is " +
                      "whoever is close enough to be a heretic rather than a heathen.\"";
        } else if (hasDifficultPairings && this.toleranceScore > 30) {
            title = "GENUINE TOLERANCE";
            text = "You didn't take the easy path. You placed near-enemies beside each other " +
                   "and forced genuine, difficult tolerance.<br><br>" +
                   "Some conversations were explosive. Some were transformative. " +
                   "That's the difference between real tolerance and comfortable distance.";
            insight = "\"I can tolerate anything except the outgroup. And the outgroup is " +
                      "whoever is close enough to be a heretic rather than a heathen.\"";
        } else {
            title = "COMFORTABLE DISTANCE";
            text = "You kept the peace by keeping everyone far from their near-enemies. " +
                   "Blue sat with Far, Red sat with Far, nobody was challenged, " +
                   "and everyone went home feeling very tolerant.<br><br>" +
                   "But was it <i>tolerance</i>? Or just comfortable distance?";
            insight = "\"I can tolerate anything except the outgroup. And the outgroup is " +
                      "whoever is close enough to be a heretic rather than a heathen.\"";
        }

        // Humanity adjustment based on genuine tolerance
        if (hasDifficultPairings) {
            this.elua.adjustHumanity(10);
        } else {
            this.elua.adjustHumanity(-5);
        }

        this.engine.endLevel(title, text, insight, false);
    }

    triggerMetaEnding() {
        this.gameOver = true;
        const insight = "\"I can tolerate anything except the outgroup. " +
                        "This essay is bad and I should feel bad.\"";

        this.engine.endLevel(
            "THE META ENDING",
            "You quoted Scott's own conclusion back at the dinner party.<br><br>" +
            "The guests stare. Then, slowly, they start to laugh. " +
            "Not at you — <i>with</i> you. Because the whole exercise was the point.<br><br>" +
            "The essay doesn't teach tolerance. It teaches you to <b>notice</b> " +
            "when you're being intolerant toward the people closest to you — " +
            "the ones who should be your allies but became your outgroup instead.",
            insight,
            true
        );
    }

    // ===============================
    //  UPDATE
    // ===============================

    update(dt) {
        if (this.gameOver) return;

        this.time += dt;
        this.candleFlicker += dt * 8;

        // Handle input
        this.handleInput();

        // Animate waiting guest bobbing
        if (this.waitingGuest) {
            this.waitingGuest.y = 60 + Math.sin(this.time * 2) * 5;
        }

        // Tint progress (after mirror)
        if (this.mirrorTriggered && this.tintProgress < 1) {
            this.tintProgress = Math.min(1, this.tintProgress + dt * 0.3);
            for (const seat of this.seats) {
                if (seat.guest) {
                    seat.guest.tintAmount = this.tintProgress;
                }
            }
        }

        // Particles
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // Update Elua
        this.elua.setPosition(
            this.tableCenter.x + Math.sin(this.time * 0.3) * 5,
            this.tableCenter.y - this.tableRadiusY - 85
        );
    }

    // ===============================
    //  DRAWING
    // ===============================

    draw(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.drawBackground(ctx, w, h);
        this.drawTable(ctx);
        this.drawSeats(ctx);
        this.drawLinks(ctx);
        this.drawGuests(ctx);
        this.drawWaitingGuest(ctx);
        this.drawParticles(ctx);
        this.elua.draw(ctx);
    }

    drawBackground(ctx, w, h) {
        // Warm interior gradient
        const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, '#1a1525');
        grad.addColorStop(0.5, '#120e1e');
        grad.addColorStop(1, '#0a0812');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Candle light effect
        const flickerIntensity = 0.08 + Math.sin(this.candleFlicker) * 0.02 + Math.sin(this.candleFlicker * 1.7) * 0.01;
        const candleGrad = ctx.createRadialGradient(
            this.tableCenter.x, this.tableCenter.y, 10,
            this.tableCenter.x, this.tableCenter.y, this.tableRadiusX + 150
        );
        candleGrad.addColorStop(0, `rgba(255, 200, 100, ${flickerIntensity})`);
        candleGrad.addColorStop(0.5, `rgba(255, 180, 80, ${flickerIntensity * 0.4})`);
        candleGrad.addColorStop(1, 'rgba(255, 180, 80, 0)');
        ctx.beginPath();
        ctx.arc(this.tableCenter.x, this.tableCenter.y, this.tableRadiusX + 150, 0, Math.PI * 2);
        ctx.fillStyle = candleGrad;
        ctx.fill();

        // Door indicator at top
        if (this.waitingGuest) {
            ctx.fillStyle = 'rgba(200, 200, 220, 0.05)';
            ctx.fillRect(w / 2 - 40, 0, 80, 90);
            ctx.fillStyle = 'rgba(200, 200, 220, 0.3)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ARRIVING', w / 2, 20);
        }
    }

    drawTable(ctx) {
        const cx = this.tableCenter.x;
        const cy = this.tableCenter.y;

        // Table surface
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.tableRadiusX, this.tableRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#2a1f15';
        ctx.fill();
        ctx.strokeStyle = '#4a3525';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Wood grain
        ctx.save();
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 8; i++) {
            const offset = (i - 4) * (this.tableRadiusX / 5);
            ctx.beginPath();
            ctx.ellipse(cx + offset, cy, this.tableRadiusX * 0.1, this.tableRadiusY * 0.9, 0, 0, Math.PI * 2);
            ctx.strokeStyle = '#5a4535';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();

        // Centerpiece candle
        const flickerH = 6 + Math.sin(this.candleFlicker) * 2;
        ctx.fillStyle = '#ddd';
        ctx.fillRect(cx - 2, cy - 3, 4, 8);
        // Flame
        ctx.beginPath();
        ctx.ellipse(cx, cy - 3 - flickerH / 2, 3, flickerH, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 80, ${0.7 + Math.sin(this.candleFlicker * 1.3) * 0.2})`;
        ctx.fill();
        // Flame inner
        ctx.beginPath();
        ctx.ellipse(cx, cy - 4 - flickerH / 2, 1.5, flickerH * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    drawSeats(ctx) {
        for (let i = 0; i < this.seats.length; i++) {
            const seat = this.seats[i];

            // Chair
            ctx.beginPath();
            ctx.arc(seat.x, seat.y, 20, 0, Math.PI * 2);

            if (seat.guest) {
                ctx.fillStyle = 'rgba(42, 31, 21, 0.8)';
            } else if (seat.hoverHighlight && this.waitingGuest) {
                ctx.fillStyle = 'rgba(232, 197, 71, 0.15)';
            } else {
                ctx.fillStyle = 'rgba(30, 22, 15, 0.5)';
            }
            ctx.fill();

            // Highlight border for empty seats when guest is waiting
            if (!seat.guest && this.waitingGuest) {
                ctx.strokeStyle = seat.hoverHighlight
                    ? 'rgba(232, 197, 71, 0.6)'
                    : 'rgba(232, 197, 71, 0.15)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Seat number
            if (!seat.guest) {
                ctx.fillStyle = 'rgba(200, 200, 220, 0.15)';
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(i + 1, seat.x, seat.y);
            }
        }
    }

    drawGuests(ctx) {
        for (const seat of this.seats) {
            if (!seat.guest) continue;
            this.drawGuestFigure(ctx, seat.guest, seat.x, seat.y);
        }
    }

    drawGuestFigure(ctx, guest, x, y) {
        // Base color — neutral to start, tinting toward tribe color
        const tribeData = TRIBES[guest.tribe];
        const tint = guest.tintAmount || 0;

        // Base neutral color
        const baseR = 180, baseG = 170, baseB = 165;
        // Tribe color via HSL
        const hue = tribeData.hue;
        const tribeR = parseInt(tribeData.color.slice(1, 3), 16);
        const tribeG = parseInt(tribeData.color.slice(3, 5), 16);
        const tribeB = parseInt(tribeData.color.slice(5, 7), 16);

        const r = Math.floor(baseR + (tribeR - baseR) * tint);
        const g = Math.floor(baseG + (tribeG - baseG) * tint);
        const b = Math.floor(baseB + (tribeB - baseB) * tint);

        // Body
        ctx.beginPath();
        ctx.arc(x, y - 2, 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(x, y - 14, 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 25)}, ${Math.min(255, b + 20)})`;
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x - 2.5, y - 15, 1, 0, Math.PI * 2);
        ctx.arc(x + 2.5, y - 15, 1, 0, Math.PI * 2);
        ctx.fill();

        // Name label
        ctx.fillStyle = 'rgba(200, 200, 220, 0.7)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(guest.name, x, y + 16);

        // Tribe indicator (small dot)
        ctx.beginPath();
        ctx.arc(x + 12, y - 16, 3, 0, Math.PI * 2);
        ctx.fillStyle = tribeData.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawWaitingGuest(ctx) {
        if (!this.waitingGuest) return;

        const guest = this.waitingGuest;
        const x = guest.x;
        const y = guest.y;

        // Entrance spotlight
        const spotGrad = ctx.createRadialGradient(x, y, 5, x, y, 50);
        spotGrad.addColorStop(0, 'rgba(255, 200, 100, 0.08)');
        spotGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.beginPath();
        ctx.arc(x, y, 50, 0, Math.PI * 2);
        ctx.fillStyle = spotGrad;
        ctx.fill();

        // Draw the guest figure larger
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1.3, 1.3);
        ctx.translate(-x, -y);
        this.drawGuestFigure(ctx, guest, x, y);
        ctx.restore();

        // "Click to seat" hint
        ctx.fillStyle = 'rgba(232, 197, 71, 0.5)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('\u2193 Click a seat to place', x, y + 35);
    }

    drawLinks(ctx) {
        // Draw tolerance indicators between adjacent seated guests
        for (let i = 0; i < this.seatCount; i++) {
            const seatA = this.seats[i];
            const seatB = this.seats[(i + 1) % this.seatCount];
            if (!seatA.guest || !seatB.guest) continue;

            const tol = this.calculatePairTolerance(seatA.guest, seatB.guest);
            const midX = (seatA.x + seatB.x) / 2;
            const midY = (seatA.y + seatB.y) / 2;

            // Line between seats colored by tolerance
            let color;
            if (tol >= 60) color = 'rgba(74, 175, 90, 0.4)';
            else if (tol >= 30) color = 'rgba(192, 160, 48, 0.3)';
            else if (tol >= 0) color = 'rgba(212, 64, 64, 0.3)';
            else color = 'rgba(255, 32, 32, 0.5)';

            ctx.beginPath();
            ctx.moveTo(seatA.x, seatA.y);
            ctx.lineTo(seatB.x, seatB.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = tol < 0 ? 2.5 : 1.5;
            ctx.stroke();

            // Explosion particles for very negative tolerance
            if (tol < 0) {
                const sparkle = Math.sin(this.time * 6 + i) * 0.5 + 0.5;
                ctx.beginPath();
                ctx.arc(midX, midY, 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 50, 50, ${sparkle * 0.6})`;
                ctx.fill();
            }

            // Tolerance number
            ctx.fillStyle = color.replace(/[\d.]+\)$/, '0.8)');
            ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'center';
            const tolText = tol < 0 ? '\u26A0' : Math.floor(tol);
            ctx.fillText(tolText, midX, midY - 8);
        }
    }

    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // ===============================
    //  CLEANUP
    // ===============================

    cleanup() {
        document.getElementById('dinner-ui').style.display = 'none';
        document.getElementById('guest-info-panel').style.display = 'none';
        document.getElementById('speech-panel').style.display = 'none';
        document.getElementById('tolerance-display').style.display = 'none';
        document.getElementById('mirror-overlay').style.display = 'none';
        document.getElementById('bodhidharma-overlay').style.display = 'none';
    }
}
