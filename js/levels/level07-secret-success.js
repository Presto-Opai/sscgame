// Level 07 — BOOK REVIEW: THE SECRET OF OUR SUCCESS
// Survival / Mystery Game
// "Culture, not individual intelligence, is humanity's superpower.
//  Reason is dangerous. Traditions encode wisdom we can't consciously access."
//
// You're stranded. Locals have traditions that seem stupid.
// Skip them at your peril: cyanide in manioc, teratogens in fish,
// randomization in caribou bones.

const Level07SecretSuccess = (() => {
    let canvas, ctx;
    let W, H;

    // --- STATE ---
    let health = 100;
    let knowledge = 0; // cultural knowledge gained
    let hubris = 50;   // rationalist overconfidence
    let day = 0;
    const MAX_DAYS = 20;
    let phase = 'explore'; // 'explore', 'event', 'result'
    let environment = '';  // 'arctic', 'jungle', 'alabama'
    let events = [];
    let currentEvent = null;
    let eventChoice = null;
    let eventOutcome = null;
    let log = []; // history of decisions and outcomes
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let localsTrust = 50; // locals' trust in you
    let reasonDeaths = 0; // times reason nearly killed you
    let traditionFollows = 0;
    let reasonOverrides = 0;
    let delayedEffects = []; // { triggerDay, effect, reason }
    let epistemicHellVisited = false;
    let dayTimer = 0;
    const DAY_LENGTH = 3;

    // --- EVENTS ---
    const EVENT_POOL = [
        {
            title: 'The Manioc Problem',
            desc: 'You find a starchy root (manioc). The locals process it through a complicated, time-consuming ritual: soak for days, squeeze, ferment, dry, wash again.',
            tradition: { label: 'Follow the ritual', effect: 'safe', healthCost: 0, text: 'Three days of tedious processing. The result is bland but safe food.', delayed: false },
            reason: { label: 'Skip the ritual (you\'re smart)', effect: 'poison', healthCost: 0, text: 'You eat the manioc after basic cooking. Tastes fine!', delayed: true, delayDays: 5, delayEffect: -40, delayText: 'Chronic cyanide poisoning from unprocessed manioc. You\'re very sick.' },
            insight: 'The ritual removes cyanogenic glucosides. No local knows this — they just know "grandmother did it this way."'
        },
        {
            title: 'The Shark Taboo',
            desc: 'A pregnant local woman refuses to eat a certain fish. She says "the baby will have shark skin." This is obviously false.',
            tradition: { label: 'Respect the taboo', effect: 'safe', healthCost: 0, text: 'You eat something else. The woman thanks you for respecting their ways.', delayed: false },
            reason: { label: 'Eat the fish (it\'s nutritious!)', effect: 'harm', healthCost: -5, text: 'You eat the fish. It\'s delicious. But you notice a rash the next day.', delayed: false },
            insight: 'The fish contains mercury and teratogens. The false belief (shark skin) protects the true outcome (birth defects). Epistemically wrong, practically right.'
        },
        {
            title: 'The Caribou Bones',
            desc: 'The locals decide where to hunt by reading cracks in caribou shoulder bones heated over fire. This is clearly random nonsense.',
            tradition: { label: 'Follow the bones', effect: 'success', healthCost: 0, text: 'The bones point northeast. You go. You find caribou. The locals are unsurprised.', delayed: false },
            reason: { label: 'Use logic (go where caribou were yesterday)', effect: 'fail', healthCost: -10, text: 'You go where caribou were spotted last time. Nothing. The caribou learned to avoid that spot.', delayed: false },
            insight: 'Randomization defeats the caribou\'s strategy of avoiding previous hunters. The "superstition" is optimal game theory.'
        },
        {
            title: 'The Fermentation Ritual',
            desc: 'The locals ferment a plant mixture for weeks before consuming it. They say it "pleases the spirits." You could eat it fresh.',
            tradition: { label: 'Wait for fermentation', effect: 'safe', healthCost: 0, text: 'After weeks, the fermented mixture is nutrient-rich and easily digestible.', delayed: false },
            reason: { label: 'Eat it fresh (save time)', effect: 'sick', healthCost: -15, text: 'You eat the raw plant. Severe stomach cramps. The fresh version has antinutrients that fermentation removes.', delayed: false },
            insight: 'Fermentation breaks down antinutrients, increases bioavailability of vitamins, and produces beneficial bacteria. No one knows this — they just know the ritual.'
        },
        {
            title: 'The Fire Dance',
            desc: 'Before the rainy season, the entire village performs a dancing ritual around fires, spreading ash in patterns. They say it "asks the rain to be gentle."',
            tradition: { label: 'Join the dance', effect: 'safe', healthCost: 0, text: 'You dance. You feel silly. The fields grow well after the rains.', delayed: false },
            reason: { label: 'Skip it (superstition!)', effect: 'neutral', healthCost: 0, text: 'You don\'t dance. Nothing bad happens... but the locals are disappointed.', delayed: true, delayDays: 3, delayEffect: -5, delayText: 'The locals stop sharing food with you. The ash was fertilizer for the fields, and dancing compacted the soil.' },
            insight: 'The fire ash is potash fertilizer. The dancing compacts soil to prevent erosion. Superstitious framing, practical wisdom.'
        },
        {
            title: 'The Hunting Prayer',
            desc: 'Before hunting, the locals pray and enter a trance state, consulting "animal spirits" about which direction to go.',
            tradition: { label: 'Pray and follow', effect: 'success', healthCost: 0, text: 'In the trance, the elder reads subtle environmental cues unconsciously. Good hunt.', delayed: false },
            reason: { label: 'Use rational tracking', effect: 'partial', healthCost: -5, text: 'Your tracking is decent but you miss subtle signs. Moderate success.', delayed: false },
            insight: 'The "trance" accesses pattern recognition that conscious analysis can\'t match. Cultural practice > individual reasoning.'
        },
        {
            title: 'The Marriage Rule',
            desc: 'The village has an elaborate rule about who can marry whom based on clan membership, animal totems, and birth order. Seems arbitrary.',
            tradition: { label: 'Follow the rule', effect: 'safe', healthCost: 0, text: 'The marriages produce healthy children. The system works.', delayed: false },
            reason: { label: 'Ignore it (marry for love)', effect: 'harm', healthCost: 0, text: 'You encourage a couple to marry freely. Over generations, the rule was preventing inbreeding.', delayed: true, delayDays: 4, delayEffect: -10, delayText: 'The couple\'s children have health problems. The marriage rules encoded genetic diversity.' },
            insight: 'Complex marriage rules in small populations prevent inbreeding without anyone understanding genetics.'
        },
        {
            title: 'European Explorer\'s Camp',
            desc: 'You find remains of a European expedition. They had maps, compasses, firearms, and education. They all starved to death.',
            tradition: { label: 'Study what they did wrong', effect: 'learn', healthCost: 0, text: 'They ignored local knowledge. Used "reason" to survive. Died surrounded by food they didn\'t recognize.', delayed: false },
            reason: { label: 'Take their equipment', effect: 'hubris', healthCost: 0, text: 'Their compass and tools feel reassuring. But the real survival tool is cultural knowledge.', delayed: false },
            insight: 'European explorers with superior technology regularly starved in environments where indigenous people thrived. Intelligence without culture = death.'
        }
    ];

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
    }

    function resetState() {
        health = 100;
        knowledge = 0;
        hubris = 50;
        day = 0;
        phase = 'explore';
        const envs = ['Arctic Tundra', 'Tropical Jungle', 'Rural Alabama'];
        environment = envs[Math.floor(Math.random() * envs.length)];
        events = shuffleArray([...EVENT_POOL]);
        currentEvent = null;
        eventChoice = null;
        eventOutcome = null;
        log = [];
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        localsTrust = 50;
        reasonDeaths = 0;
        traditionFollows = 0;
        reasonOverrides = 0;
        delayedEffects = [];
        epistemicHellVisited = false;
        dayTimer = 0;
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function onResize(w, h) { W = w; H = h; }

    function update(dt, input) {
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 2) { showTutorial = false; nextEvent(); }
            }
            return;
        }

        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 12; return m.alpha > 0; });

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insight = knowledge > hubris ?
                    '"Why have we always done this?" is often better epistemology than "what makes sense to me right now?"' :
                    "Reason as the villain: your intelligence actively hurt you. Culture encodes what reason cannot.";
                showInsightPopup(7, insight, () => returnToMenu());
            }
            return;
        }

        if (phase === 'event' && currentEvent) {
            if (eventOutcome) {
                if (input.mouse.clicked) {
                    // Show insight, advance day
                    day++;
                    checkDelayedEffects();
                    if (health <= 0 || day >= MAX_DAYS || events.length === 0) {
                        phase = 'result';
                        finalizeResult();
                    } else {
                        nextEvent();
                    }
                }
            } else {
                handleEventChoice(input);
            }
        }
    }

    function nextEvent() {
        if (events.length === 0) {
            phase = 'result';
            finalizeResult();
            return;
        }
        currentEvent = events.shift();
        eventChoice = null;
        eventOutcome = null;
        phase = 'event';
    }

    function handleEventChoice(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        // Tradition button
        if (mx >= W * 0.1 && mx <= W * 0.48 && my >= H * 0.58 && my <= H * 0.58 + 55) {
            eventChoice = 'tradition';
            const t = currentEvent.tradition;
            eventOutcome = {
                text: t.text,
                insight: currentEvent.insight,
                healthChange: t.healthCost
            };
            health += t.healthCost;
            knowledge += 10;
            hubris = Math.max(0, hubris - 5);
            localsTrust = Math.min(100, localsTrust + 5);
            traditionFollows++;
            if (t.delayed) {
                delayedEffects.push({ triggerDay: day + t.delayDays, effect: t.delayEffect, reason: t.delayText });
            }
            log.push({ day, event: currentEvent.title, choice: 'tradition', result: t.effect });
            Protagonist.recordConnection();
        }

        // Reason button
        if (mx >= W * 0.52 && mx <= W * 0.9 && my >= H * 0.58 && my <= H * 0.58 + 55) {
            eventChoice = 'reason';
            const r = currentEvent.reason;
            eventOutcome = {
                text: r.text,
                insight: currentEvent.insight,
                healthChange: r.healthCost
            };
            health += r.healthCost;
            hubris = Math.min(100, hubris + 5);
            localsTrust = Math.max(0, localsTrust - 5);
            reasonOverrides++;
            if (r.healthCost < -10) reasonDeaths++;
            if (r.delayed) {
                delayedEffects.push({ triggerDay: day + r.delayDays, effect: r.delayEffect, reason: r.delayText });
            }
            log.push({ day, event: currentEvent.title, choice: 'reason', result: r.effect });
            Protagonist.recordOptimization();
        }
    }

    function checkDelayedEffects() {
        const triggered = delayedEffects.filter(d => d.triggerDay <= day);
        for (const d of triggered) {
            health += d.effect;
            addMessage(d.reason, W / 2, H * 0.3, d.effect < 0 ? '#cc3030' : '#40b060');
            log.push({ day, event: 'Delayed Effect', choice: 'delayed', result: d.reason });
            if (d.effect < -15) reasonDeaths++;
        }
        delayedEffects = delayedEffects.filter(d => d.triggerDay > day);
    }

    function finalizeResult() {
        const insight = knowledge > hubris ?
            '"Why have we always done this?" is often better epistemology than "what makes sense to me right now?"' :
            "Reason as the villain: your intelligence actively hurt you. Culture encodes what reason cannot.";
        Protagonist.addInsight(7, insight);
        Protagonist.completeLevel(7, traditionFollows > reasonOverrides ? 'humble' : 'rationalist');
        Protagonist.save();
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 2, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;

        // Environment background
        const bgColors = {
            'Arctic Tundra': '#0a1420',
            'Tropical Jungle': '#0a1a0a',
            'Rural Alabama': '#1a1410'
        };
        ctx.fillStyle = bgColors[environment] || '#0e0e1a';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }

        renderStatusBars(ctx);
        renderEvent(ctx);
        renderMessages(ctx);
    }

    function renderStatusBars(ctx) {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
        ctx.fillRect(0, 0, W, 50);

        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        let x = 15;

        ctx.fillStyle = '#40b060';
        ctx.fillText(`Health: ${Math.floor(health)}`, x, 18);
        Engine.drawBar(ctx, x, 24, 100, 8, health, 100, health > 50 ? '#40b060' : health > 25 ? '#cc9030' : '#cc3030', '#1a1a28');
        x += 120;

        ctx.fillStyle = '#4488cc';
        ctx.fillText(`Cultural Knowledge: ${knowledge}`, x, 18);
        Engine.drawBar(ctx, x, 24, 100, 8, knowledge, 100, '#4488cc', '#1a1a28');
        x += 130;

        ctx.fillStyle = '#cc8a20';
        ctx.fillText(`Hubris: ${hubris}`, x, 18);
        Engine.drawBar(ctx, x, 24, 100, 8, hubris, 100, '#cc8a20', '#1a1a28');
        x += 120;

        ctx.fillStyle = '#aa8844';
        ctx.fillText(`Locals' Trust: ${localsTrust}`, x, 18);
        Engine.drawBar(ctx, x, 24, 100, 8, localsTrust, 100, '#aa8844', '#1a1a28');

        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'right';
        ctx.fillText(`Day ${day + 1}/${MAX_DAYS} | ${environment}`, W - 15, 18);
    }

    function renderEvent(ctx) {
        if (!currentEvent) return;
        const cx = W / 2;

        // Event title
        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText(currentEvent.title, cx, 90);

        // Description
        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        const descLines = Engine.wrapText(ctx, currentEvent.desc, W * 0.75, '14px serif');
        let y = 120;
        for (const line of descLines) {
            ctx.fillText(line, cx, y);
            y += 20;
        }

        if (!eventOutcome) {
            // Choice buttons
            const btnY = H * 0.58;

            // Tradition
            ctx.fillStyle = '#141a20';
            ctx.fillRect(W * 0.1, btnY, W * 0.38, 55);
            ctx.strokeStyle = '#aa8844';
            ctx.lineWidth = 2;
            ctx.strokeRect(W * 0.1, btnY, W * 0.38, 55);
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#aa8844';
            ctx.textAlign = 'center';
            ctx.fillText(currentEvent.tradition.label, W * 0.29, btnY + 22);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#8a7844';
            ctx.fillText('Follow tradition. Don\'t question.', W * 0.29, btnY + 40);

            // Reason
            ctx.fillStyle = '#1a1420';
            ctx.fillRect(W * 0.52, btnY, W * 0.38, 55);
            ctx.strokeStyle = '#4488cc';
            ctx.lineWidth = 2;
            ctx.strokeRect(W * 0.52, btnY, W * 0.38, 55);
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#4488cc';
            ctx.textAlign = 'center';
            ctx.fillText(currentEvent.reason.label, W * 0.71, btnY + 22);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#446688';
            ctx.fillText('Use your intelligence.', W * 0.71, btnY + 40);
        } else {
            // Outcome display
            y += 20;
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = eventOutcome.healthChange < 0 ? '#cc3030' : '#40b060';
            ctx.textAlign = 'center';
            ctx.fillText(eventChoice === 'tradition' ? 'FOLLOWED TRADITION' : 'USED REASON', cx, y);
            y += 25;

            ctx.font = '13px serif';
            ctx.fillStyle = '#e8e0f0';
            const outcomeLines = Engine.wrapText(ctx, eventOutcome.text, W * 0.7, '13px serif');
            for (const line of outcomeLines) {
                ctx.fillText(line, cx, y);
                y += 20;
            }

            if (eventOutcome.healthChange !== 0) {
                y += 10;
                ctx.font = 'bold 13px sans-serif';
                ctx.fillStyle = eventOutcome.healthChange < 0 ? '#cc3030' : '#40b060';
                ctx.fillText(`Health: ${eventOutcome.healthChange > 0 ? '+' : ''}${eventOutcome.healthChange}`, cx, y);
            }

            // Insight reveal
            y += 25;
            ctx.font = 'italic 12px serif';
            ctx.fillStyle = '#cc8a60';
            const insightLines = Engine.wrapText(ctx, eventOutcome.insight, W * 0.7, 'italic 12px serif');
            for (const line of insightLines) {
                ctx.fillText(line, cx, y);
                y += 18;
            }

            // Check for delayed effects warning
            const hasDelayed = currentEvent[eventChoice]?.delayed;
            if (hasDelayed) {
                y += 10;
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#cc8a20';
                ctx.fillText('(Something feels... not quite right. But you can\'t tell what.)', cx, y);
            }

            y += 30;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText('Click to continue', cx, y);
        }

        // Epistemic Hell marker
        if (eventOutcome && eventChoice === 'tradition') {
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.textAlign = 'left';
            ctx.fillText('EPISTEMIC HELL: Every useful belief here is justified by a false explanation.', 15, H - 20);
        }
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.08;

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('SURVIVAL REPORT', cx, y); y += 35;

        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText(`Environment: ${environment}`, cx, y); y += 22;
        ctx.fillText(`Days survived: ${day}/${MAX_DAYS}`, cx, y); y += 22;
        ctx.fillText(`Final Health: ${Math.floor(health)}`, cx, y); y += 22;

        y += 10;
        ctx.fillStyle = '#aa8844';
        ctx.fillText(`Times followed tradition: ${traditionFollows}`, cx, y); y += 20;
        ctx.fillStyle = '#4488cc';
        ctx.fillText(`Times used reason: ${reasonOverrides}`, cx, y); y += 20;
        ctx.fillStyle = '#cc3030';
        ctx.fillText(`Times reason nearly killed you: ${reasonDeaths}`, cx, y); y += 30;

        // Cultural knowledge vs hubris
        ctx.font = 'bold 14px sans-serif';
        if (knowledge > hubris) {
            ctx.fillStyle = '#aa8844';
            ctx.fillText('You learned humility. Culture > Intelligence.', cx, y);
        } else if (health > 50) {
            ctx.fillStyle = '#4488cc';
            ctx.fillText('You survived through reason... barely.', cx, y);
        } else {
            ctx.fillStyle = '#cc3030';
            ctx.fillText('Like the European explorers, reason was your downfall.', cx, y);
        }
        y += 30;

        // The Horror
        ctx.font = 'bold 16px serif';
        ctx.fillStyle = '#cc8a60';
        ctx.fillText('THE HORROR', cx, y); y += 25;
        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText('"Why have we always done this?"', cx, y); y += 22;
        ctx.fillText('is often a better epistemology than', cx, y); y += 22;
        ctx.fillText('"What makes sense to me right now?"', cx, y); y += 30;

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
        ctx.fillStyle = 'rgba(10, 14, 20, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'THE SECRET OF OUR SUCCESS',
                text: `You are stranded in: ${environment}\n\nYou have high intelligence\nbut no cultural knowledge.\n\nThe locals thrive here.\nThey do many things that seem stupid.`
            },
            {
                title: 'THE MANIOC PROBLEM',
                text: 'The locals process food through complicated,\nseemingly pointless rituals.\n\nYou, the smart rationalist,\ncan see they\'re wasting time.\n\nYou can skip the ritual.\nShort term: you\'re fine.\nLong term: cyanide poisoning.'
            },
            {
                title: 'YOUR MISSION',
                text: 'Each event: follow tradition or use reason?\n\nTradition: survive but never understand why.\nReason: understand but possibly die.\n\nThe locals don\'t know WHY their traditions work.\nBut the traditions work.\n\nClick to begin.'
            }
        ];
        const step = steps[Math.min(tutorialStep, steps.length - 1)];
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#aa8844';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, cx, cy - 110);
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#e8e0f0';
        step.text.split('\n').forEach((line, i) => {
            ctx.fillText(line, cx, cy - 40 + i * 22);
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
