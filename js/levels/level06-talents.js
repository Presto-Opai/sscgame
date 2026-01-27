// Level 06 — THE PARABLE OF THE TALENTS
// RPG with Hidden Stats
// "Ability is largely innate. You shouldn't beat yourself up for lacking talent,
//  but you also shouldn't take credit for having it."
//
// You can't see your stats. You only feel how tasks go.
// One skill tree is easy; one is agony. Grinding weak areas barely helps.

const Level06Talents = (() => {
    let canvas, ctx;
    let W, H;

    // --- HIDDEN STATS (player never sees raw numbers) ---
    let stats = { verbal: 0, math: 0, art: 0, social: 0 };
    let statNames = { verbal: 'Verbal', math: 'Mathematical', art: 'Artistic', social: 'Social' };
    let strongStat = '';
    let weakStat = '';
    let xp = { verbal: 0, math: 0, art: 0, social: 0 };
    let level = 1;
    let totalXP = 0;
    const MAX_LEVEL = 5;

    // --- STATE ---
    let phase = 'intro'; // 'intro', 'school', 'tasks', 'npcs', 'bargain', 'result'
    let schoolYear = 1;
    const MAX_YEARS = 4;
    let currentTask = null;
    let taskResult = null;
    let taskHistory = [];
    let npcs = [];
    let npcIndex = 0;
    let praises = 0;
    let criticisms = 0;
    let grindAttempts = 0;
    let comparisons = 0; // times compared to someone better
    let messages = [];
    let showTutorial = true;
    let tutorialStep = 0;
    let bargainAccepted = false;
    let selfKnowledge = 0; // 0-100: how well you understand your stats
    let menuTasks = [];
    let feelings = []; // emotional feedback log

    // NPC templates
    const NPC_TEMPLATES = [
        { name: 'Your Brother', desc: 'Same parents, became a famous musician. Different outcomes.', talent: 'art', iq: 130, story: 'Had the same upbringing. Somehow music just clicked.' },
        { name: 'Ramanujan', desc: 'Born in poverty. No formal training. Pure mathematical genius.', talent: 'math', iq: 180, story: 'Derived thousands of theorems from scratch. Talent without opportunity.' },
        { name: 'The Ditch-Digger', desc: 'IQ 70. Donates to charity. Found meaning despite limited ability.', talent: 'social', iq: 70, story: '"I can\'t do much. But I can be kind."' },
        { name: 'The Prodigy', desc: 'Perfect scores in everything. Never struggled a day.', talent: 'verbal', iq: 160, story: 'Everything comes easy. Feels guilty about it sometimes.' },
        { name: 'The Hard Worker', desc: 'Average ability. Extraordinary discipline. Modest success.', talent: 'math', iq: 100, story: 'Spent 10,000 hours. Got to "pretty good." Never great.' },
    ];

    // Task types
    const TASKS = {
        verbal: [
            { name: 'Write an Essay', desc: 'Compose a thoughtful analysis' },
            { name: 'Debate Club', desc: 'Argue a position persuasively' },
            { name: 'Poetry Reading', desc: 'Interpret and recite a complex poem' },
            { name: 'SAT Verbal', desc: 'Reading comprehension and vocabulary' },
        ],
        math: [
            { name: 'Calculus Problem Set', desc: 'Solve differential equations' },
            { name: 'Statistics Exam', desc: 'Probability and inference' },
            { name: 'Logic Puzzle', desc: 'Formal logical deduction' },
            { name: 'SAT Math', desc: 'Quantitative reasoning under time pressure' },
        ],
        art: [
            { name: 'Sketch a Portrait', desc: 'Draw a human face from memory' },
            { name: 'Compose a Melody', desc: 'Create an original musical phrase' },
            { name: 'Design a Poster', desc: 'Visual communication challenge' },
            { name: 'Creative Writing', desc: 'Write a short story in 30 minutes' },
        ],
        social: [
            { name: 'Group Project', desc: 'Coordinate a team of 4' },
            { name: 'Negotiate a Deal', desc: 'Find a mutually beneficial agreement' },
            { name: 'Public Speaking', desc: 'Address an audience of 50' },
            { name: 'Comfort a Friend', desc: 'Navigate an emotional conversation' },
        ]
    };

    function init(c, context) {
        canvas = c; ctx = context;
        W = canvas.width; H = canvas.height;
        resetState();
        rollCharacter();
    }

    function resetState() {
        stats = { verbal: 0, math: 0, art: 0, social: 0 };
        xp = { verbal: 0, math: 0, art: 0, social: 0 };
        level = 1;
        totalXP = 0;
        phase = 'intro';
        schoolYear = 1;
        currentTask = null;
        taskResult = null;
        taskHistory = [];
        npcs = shuffleArray([...NPC_TEMPLATES]);
        npcIndex = 0;
        praises = 0;
        criticisms = 0;
        grindAttempts = 0;
        comparisons = 0;
        messages = [];
        showTutorial = true;
        tutorialStep = 0;
        bargainAccepted = false;
        selfKnowledge = 0;
        menuTasks = [];
        feelings = [];
    }

    function rollCharacter() {
        // Roll stats: one strong, one weak, rest moderate
        const keys = ['verbal', 'math', 'art', 'social'];
        const shuffled = shuffleArray([...keys]);
        strongStat = shuffled[0];
        weakStat = shuffled[1];

        stats[strongStat] = 80 + Math.floor(Math.random() * 20); // 80-99
        stats[weakStat] = 20 + Math.floor(Math.random() * 20);   // 20-39
        stats[shuffled[2]] = 45 + Math.floor(Math.random() * 20); // 45-64
        stats[shuffled[3]] = 45 + Math.floor(Math.random() * 20); // 45-64
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function onResize(w, h) { W = w; H = h; }

    // --- TASK EXECUTION ---
    function attemptTask(statKey) {
        const stat = stats[statKey] + xp[statKey] * 0.5;
        const difficulty = 50 + schoolYear * 10;
        const roll = Math.random() * 100;
        const success = roll < stat;
        const margin = stat - difficulty;

        // Experience gain: strong stat = easy XP; weak stat = very slow
        let xpGain;
        if (statKey === strongStat) {
            xpGain = 3 + Math.floor(Math.random() * 2);
        } else if (statKey === weakStat) {
            xpGain = 0.5 + Math.random() * 0.5; // Grinding barely helps
            grindAttempts++;
        } else {
            xpGain = 1.5 + Math.random();
        }
        xp[statKey] += xpGain;
        totalXP += xpGain;

        // Feelings (the only feedback)
        let feeling;
        if (margin > 30) {
            feeling = 'Effortless. Like breathing.';
            if (statKey === strongStat) feeling += ' (Everyone praises you. It feels unearned.)';
            praises++;
        } else if (margin > 10) {
            feeling = 'Comfortable. You handled it well.';
        } else if (margin > -10) {
            feeling = 'Challenging but manageable.';
        } else if (margin > -30) {
            feeling = 'Painful. Every step was agony.';
            if (statKey === weakStat) feeling += ' (Everyone criticizes you. It feels unfair.)';
            criticisms++;
        } else {
            feeling = 'Brutal. You barely survived.';
            criticisms++;
        }

        // Self-knowledge grows
        selfKnowledge = Math.min(100, selfKnowledge + 3);

        return {
            statKey,
            success,
            margin,
            feeling,
            xpGain,
            grade: margin > 30 ? 'A+' : margin > 15 ? 'A' : margin > 0 ? 'B' : margin > -15 ? 'C' : margin > -30 ? 'D' : 'F'
        };
    }

    // --- UPDATE ---
    function update(dt, input) {
        if (showTutorial) {
            if (input.mouse.clicked) {
                tutorialStep++;
                if (tutorialStep > 2) { showTutorial = false; phase = 'school'; generateMenuTasks(); }
            }
            return;
        }

        messages = messages.filter(m => { m.alpha -= dt * 0.4; m.y -= dt * 12; return m.alpha > 0; });

        if (phase === 'result') {
            if (input.mouse.clicked) {
                const insight = bargainAccepted ?
                    "Find your comparative advantage and use it. Don't beat yourself up for what you can't do." :
                    "Any system where only one person can feel good about themselves is a system that needs to change.";
                showInsightPopup(6, insight, () => returnToMenu());
            }
            return;
        }

        if (phase === 'npcs') {
            if (input.mouse.clicked) {
                npcIndex++;
                if (npcIndex >= npcs.length) {
                    phase = 'bargain';
                }
            }
            return;
        }

        if (phase === 'bargain') {
            handleBargainInput(input);
            return;
        }

        handleInput(input);
    }

    function generateMenuTasks() {
        menuTasks = [];
        const keys = ['verbal', 'math', 'art', 'social'];
        for (const key of keys) {
            const tasks = TASKS[key];
            const task = tasks[Math.floor(Math.random() * tasks.length)];
            menuTasks.push({ ...task, statKey: key });
        }
    }

    function handleInput(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        if (phase === 'school' && !currentTask) {
            // Task selection
            const startY = 160;
            for (let i = 0; i < menuTasks.length; i++) {
                const by = startY + i * 70;
                if (mx >= W * 0.15 && mx <= W * 0.85 && my >= by && my <= by + 60) {
                    currentTask = menuTasks[i];
                    taskResult = attemptTask(currentTask.statKey);
                    taskHistory.push(taskResult);
                    feelings.push({ feeling: taskResult.feeling, grade: taskResult.grade, task: currentTask.name });

                    // Check for year progression
                    const tasksThisYear = taskHistory.filter(t => true).length;
                    if (tasksThisYear % 4 === 0) {
                        schoolYear++;
                        if (schoolYear > MAX_YEARS) {
                            phase = 'npcs';
                            return;
                        }
                        generateMenuTasks();
                        addMessage(`Year ${schoolYear} begins...`, W / 2, 80, '#4488cc');
                    } else {
                        generateMenuTasks();
                    }
                    return;
                }
            }

            // Dismiss task result
        } else if (currentTask && taskResult) {
            currentTask = null;
            taskResult = null;
        }
    }

    function handleBargainInput(input) {
        if (!input.mouse.clicked) return;
        const mx = input.mouse.x, my = input.mouse.y;

        // Accept bargain
        if (mx >= W * 0.15 && mx <= W * 0.48 && my >= H * 0.6 && my <= H * 0.6 + 50) {
            bargainAccepted = true;
            phase = 'result';
            finalizeResult();
        }
        // Reject bargain
        if (mx >= W * 0.52 && mx <= W * 0.85 && my >= H * 0.6 && my <= H * 0.6 + 50) {
            bargainAccepted = false;
            phase = 'result';
            finalizeResult();
        }
    }

    function finalizeResult() {
        const insight = bargainAccepted ?
            "Find your comparative advantage and use it. Don't beat yourself up for what you can't do." :
            "Any system where only one person can feel good about themselves is a system that needs to change.";
        Protagonist.addInsight(6, insight);
        Protagonist.completeLevel(6, bargainAccepted ? 'accept' : 'reject');
        Protagonist.recordConnection();
        Protagonist.save();
    }

    function addMessage(text, x, y, color = '#ffd764') {
        messages.push({ text, x, y, alpha: 1.5, color });
    }

    // --- RENDER ---
    function render(ctx, canvas) {
        W = canvas.width; H = canvas.height;
        ctx.fillStyle = '#0e0e1a';
        ctx.fillRect(0, 0, W, H);

        if (showTutorial) { renderTutorial(ctx); return; }
        if (phase === 'result') { renderResult(ctx); return; }
        if (phase === 'npcs') { renderNPC(ctx); return; }
        if (phase === 'bargain') { renderBargain(ctx); return; }

        renderSchool(ctx);
        renderMessages(ctx);
    }

    function renderSchool(ctx) {
        const cx = W / 2;

        // Header
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText(`Year ${schoolYear} of ${MAX_YEARS}`, cx, 50);

        // Self-knowledge bar (vague feelings, not numbers)
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`Self-awareness: ${selfKnowledge < 30 ? 'Confused' : selfKnowledge < 60 ? 'Learning...' : selfKnowledge < 80 ? 'Developing intuition' : 'Self-aware'}`, cx, 75);

        // Feeling indicators for each stat (no numbers!)
        ctx.textAlign = 'left';
        const indicators = [
            { key: 'verbal', label: 'Language & Words' },
            { key: 'math', label: 'Numbers & Logic' },
            { key: 'art', label: 'Art & Creativity' },
            { key: 'social', label: 'People & Relations' },
        ];

        ctx.font = '11px sans-serif';
        let iy = 95;
        for (const ind of indicators) {
            const effective = stats[ind.key] + xp[ind.key] * 0.5;
            let feelLabel;
            if (effective > 80) feelLabel = '\u2605\u2605\u2605 Effortless';
            else if (effective > 60) feelLabel = '\u2605\u2605 Comfortable';
            else if (effective > 40) feelLabel = '\u2605 Manageable';
            else if (effective > 25) feelLabel = '\u2606 Painful';
            else feelLabel = '\u2606\u2606 Agonizing';

            ctx.fillStyle = effective > 60 ? '#40b060' : effective > 35 ? '#cc9030' : '#cc3030';
            ctx.fillText(`${ind.label}: ${selfKnowledge > 20 ? feelLabel : '???'}`, W * 0.62, iy);
            iy += 16;
        }

        // Task result display
        if (currentTask && taskResult) {
            renderTaskResult(ctx);
            return;
        }

        // Task menu
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.textAlign = 'center';
        ctx.fillText('Choose a task:', cx * 0.7, 145);

        const startY = 160;
        for (let i = 0; i < menuTasks.length; i++) {
            const task = menuTasks[i];
            const by = startY + i * 70;
            const isStrong = task.statKey === strongStat;
            const isWeak = task.statKey === weakStat;

            ctx.fillStyle = '#141420';
            ctx.fillRect(W * 0.15, by, W * 0.7, 60);
            ctx.strokeStyle = isStrong ? '#40b060' : isWeak ? '#cc3030' : '#3d3060';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.15, by, W * 0.7, 60);

            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.textAlign = 'left';
            ctx.fillText(task.name, W * 0.18, by + 20);

            ctx.font = '11px sans-serif';
            ctx.fillStyle = '#8088a0';
            ctx.fillText(task.desc, W * 0.18, by + 38);

            ctx.textAlign = 'right';
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.fillText(`[${statNames[task.statKey]}]`, W * 0.82, by + 20);

            // Vague difficulty hint based on self-knowledge
            if (selfKnowledge > 30) {
                const effective = stats[task.statKey] + xp[task.statKey] * 0.5;
                const hint = effective > 70 ? 'Feels easy' : effective > 45 ? 'Feels doable' : 'Feels hard';
                ctx.fillStyle = effective > 60 ? '#40b060' : effective > 35 ? '#cc9030' : '#cc3030';
                ctx.fillText(hint, W * 0.82, by + 38);
            }
        }

        // Recent feelings
        if (feelings.length > 0) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#6a5890';
            ctx.textAlign = 'left';
            ctx.fillText('Recent experiences:', W * 0.15, H - 100);
            const recent = feelings.slice(-3);
            let fy = H - 84;
            for (const f of recent) {
                ctx.fillStyle = f.grade <= 'B' ? '#40b060' : f.grade <= 'D' ? '#cc9030' : '#cc3030';
                ctx.fillText(`${f.task}: ${f.grade} — "${f.feeling}"`, W * 0.15, fy, W * 0.7);
                fy += 16;
            }
        }
    }

    function renderTaskResult(ctx) {
        const cx = W / 2;
        ctx.fillStyle = 'rgba(14, 14, 26, 0.9)';
        ctx.fillRect(W * 0.1, H * 0.25, W * 0.8, H * 0.5);
        ctx.strokeStyle = '#3d3060';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.1, H * 0.25, W * 0.8, H * 0.5);

        let y = H * 0.3;
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText(currentTask.name, cx, y); y += 30;

        // Grade
        const gradeColors = { 'A+': '#40b060', 'A': '#40b060', 'B': '#88aa55', 'C': '#cc9030', 'D': '#cc6030', 'F': '#cc3030' };
        ctx.font = 'bold 36px serif';
        ctx.fillStyle = gradeColors[taskResult.grade] || '#cc9030';
        ctx.fillText(taskResult.grade, cx, y + 10); y += 50;

        // Feeling
        ctx.font = 'italic 14px serif';
        ctx.fillStyle = '#e8e0f0';
        const lines = Engine.wrapText(ctx, taskResult.feeling, W * 0.6, 'italic 14px serif');
        for (const line of lines) {
            ctx.fillText(line, cx, y); y += 20;
        }

        // Praise/Criticism
        if (taskResult.statKey === strongStat && taskResult.margin > 20) {
            y += 15;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#40b060';
            ctx.fillText('Everyone praises your talent. (It feels unearned.)', cx, y);
        } else if (taskResult.statKey === weakStat && taskResult.margin < -10) {
            y += 15;
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#cc3030';
            ctx.fillText('Everyone criticizes your effort. (It feels unfair.)', cx, y);
        }

        // XP gain hint
        y += 25;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6a5890';
        if (taskResult.statKey === weakStat) {
            ctx.fillText(`You grew a tiny bit. (Hours of work = minutes of natural talent elsewhere.)`, cx, y);
        } else if (taskResult.statKey === strongStat) {
            ctx.fillText('You improved effortlessly.', cx, y);
        } else {
            ctx.fillText('Steady progress.', cx, y);
        }

        y += 30;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Click to continue', cx, y);
    }

    function renderNPC(ctx) {
        if (npcIndex >= npcs.length) return;
        const npc = npcs[npcIndex];
        const cx = W / 2;

        ctx.fillStyle = 'rgba(14, 14, 26, 0.98)';
        ctx.fillRect(0, 0, W, H);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.textAlign = 'center';
        ctx.fillText('THE RAMANUJAN PROBLEM', cx, H * 0.1);
        ctx.fillText('People with extraordinary talents.', cx, H * 0.13);

        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd764';
        ctx.fillText(npc.name, cx, H * 0.25);

        ctx.font = '14px serif';
        ctx.fillStyle = '#e8e0f0';
        ctx.fillText(npc.desc, cx, H * 0.33);

        ctx.font = 'italic 16px serif';
        ctx.fillStyle = '#cc8a60';
        const storyLines = Engine.wrapText(ctx, `"${npc.story}"`, W * 0.6, 'italic 16px serif');
        let sy = H * 0.45;
        for (const line of storyLines) {
            ctx.fillText(line, cx, sy); sy += 22;
        }

        // Compare to player
        comparisons++;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText(`(You compare yourself. Again.)`, cx, H * 0.7);
        ctx.fillText(`${npcIndex + 1}/${npcs.length} — Click to continue`, cx, H * 0.85);
    }

    function renderBargain(ctx) {
        const cx = W / 2;

        ctx.fillStyle = 'rgba(14, 14, 26, 0.98)';
        ctx.fillRect(0, 0, W, H);

        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('THE BARGAIN', cx, H * 0.12);

        ctx.font = '15px serif';
        ctx.fillStyle = '#e8e0f0';
        let y = H * 0.2;
        const text = [
            'You\'ve seen it now.',
            `Your ${statNames[strongStat]} ability: effortless, natural, unearned.`,
            `Your ${statNames[weakStat]} ability: agonizing, slow, unfair.`,
            '',
            'The bargain is this:',
            '',
            'You will not beat yourself up for your weaknesses.',
            'You will not take excess pride in your strengths.',
            'You will find your comparative advantage and use it.',
            '',
            '"The IQ 70 ditch-digger who donates to charity',
            'is more virtuous than the genius who doesn\'t."'
        ];
        for (const line of text) {
            ctx.fillText(line, cx, y); y += 24;
        }

        // Accept / Reject buttons
        const btnY = H * 0.6;
        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(W * 0.15, btnY, W * 0.33, 50);
        ctx.strokeStyle = '#40b060';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.15, btnY, W * 0.33, 50);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#40b060';
        ctx.fillText('Accept the Bargain', W * 0.315, btnY + 30);

        ctx.fillStyle = '#2a1a1a';
        ctx.fillRect(W * 0.52, btnY, W * 0.33, 50);
        ctx.strokeStyle = '#cc3030';
        ctx.lineWidth = 2;
        ctx.strokeRect(W * 0.52, btnY, W * 0.33, 50);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#cc3030';
        ctx.fillText('Reject: Change the System', W * 0.685, btnY + 30);

        ctx.font = '10px serif';
        ctx.fillStyle = '#6a5890';
        ctx.fillText('Accept: Use what you have.', W * 0.315, btnY + 70);
        ctx.fillText('Reject: "Any system where only one person', W * 0.685, btnY + 65);
        ctx.fillText('can feel good is a system to change."', W * 0.685, btnY + 78);
    }

    function renderResult(ctx) {
        ctx.fillStyle = 'rgba(14, 14, 26, 0.98)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        let y = H * 0.1;

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd764';
        ctx.textAlign = 'center';
        ctx.fillText('YOUR TALENTS', cx, y); y += 40;

        // Reveal hidden stats
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#a090c0';
        ctx.fillText('Your hidden stats were:', cx, y); y += 25;

        const keys = ['verbal', 'math', 'art', 'social'];
        for (const key of keys) {
            const val = stats[key];
            const effective = val + xp[key] * 0.5;
            const isStrong = key === strongStat;
            const isWeak = key === weakStat;

            ctx.font = '14px sans-serif';
            ctx.fillStyle = isStrong ? '#40b060' : isWeak ? '#cc3030' : '#a090c0';
            ctx.textAlign = 'left';
            ctx.fillText(`${statNames[key]}: `, W * 0.3, y);

            // Bar
            Engine.drawBar(ctx, W * 0.45, y - 8, 150, 14, effective, 120,
                isStrong ? '#40b060' : isWeak ? '#cc3030' : '#6a7a8a', '#1a1428');

            ctx.textAlign = 'right';
            ctx.fillText(`${Math.floor(effective)}${isStrong ? ' (Natural!)' : isWeak ? ' (Grind...)' : ''}`, W * 0.72, y);
            y += 24;
        }

        y += 15;
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#cc8a60';
        ctx.textAlign = 'center';
        ctx.fillText(`Times praised (felt unearned): ${praises}`, cx, y); y += 18;
        ctx.fillText(`Times criticized (felt unfair): ${criticisms}`, cx, y); y += 18;
        ctx.fillText(`Grind attempts on weak area: ${grindAttempts}`, cx, y); y += 18;
        ctx.fillText(`Times compared to someone better: ${comparisons}`, cx, y); y += 30;

        if (grindAttempts > 3) {
            ctx.font = 'italic 12px serif';
            ctx.fillStyle = '#cc8a60';
            ctx.fillText('You spent hours grinding. It barely moved the needle.', cx, y); y += 18;
            ctx.fillText('Hours of weak-area work = minutes of strong-area talent.', cx, y); y += 25;
        }

        ctx.font = 'bold 16px serif';
        ctx.fillStyle = '#ffd764';
        if (bargainAccepted) {
            ctx.fillText('"Find your comparative advantage and use it."', cx, y); y += 22;
            ctx.font = '13px serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText('You accepted the bargain. No guilt for weakness.', cx, y); y += 18;
            ctx.fillText('No pride for talent. Just contribution.', cx, y);
        } else {
            ctx.fillText('"Any system where only one person can feel good', cx, y); y += 22;
            ctx.fillText('about themselves is a system that needs to change."', cx, y); y += 25;
            ctx.font = '13px serif';
            ctx.fillStyle = '#e8e0f0';
            ctx.fillText('You rejected the bargain. The system is the problem.', cx, y);
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
        ctx.fillStyle = 'rgba(14, 14, 26, 0.95)';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2;
        const steps = [
            {
                title: 'THE PARABLE OF THE TALENTS',
                text: 'You\'ve been given a character.\nBut you can\'t see your stats.\n\nYou only know how tasks FEEL.\nSome are effortless. Some are agony.'
            },
            {
                title: 'THE SCOTT ALEXANDER EXPERIENCE',
                text: '"Perfect SAT Verbal. C- in Calculus."\n\nOne skill tree is natural talent.\nThe other is an uphill battle.\n\nYou didn\'t choose either.'
            },
            {
                title: 'THE GAME',
                text: 'Complete tasks across 4 school years.\nDiscover what you\'re good at.\nMeet people with different talents.\n\nThen face The Bargain.\n\nClick to begin.'
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
