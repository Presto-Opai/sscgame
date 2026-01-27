# CODEX DESCENDING
## A Ten-Level Video Game Based on SlateStarCodex

*A browser-based game playable directly from GitHub Pages*

---

## PROJECT OVERVIEW

### Concept
A single-protagonist adventure spanning ten radically different gameplay styles, each level themed around one of the greatest SlateStarCodex essays. The player embodies **ELUA** — a small spark of human values navigating systems designed to grind them down.

### Technical Architecture
```
/codex-descending/
├── index.html              # Main entry point + level select
├── css/
│   └── main.css            # Shared styles, theme variables
├── js/
│   ├── engine.js           # Shared game loop, input, audio
│   ├── protagonist.js      # Elua's shared state across levels
│   ├── save.js             # LocalStorage persistence
│   └── levels/
│       ├── level01-moloch.js
│       ├── level02-outgroup.js
│       ├── level03-toxoplasma.js
│       ├── level04-control-group.js
│       ├── level05-commensurable.js
│       ├── level06-talents.js
│       ├── level07-secret-success.js
│       ├── level08-motte-bailey.js
│       ├── level09-conflict-mistake.js
│       └── level10-ssri.js
├── assets/
│   ├── sprites/
│   ├── audio/
│   └── fonts/
└── README.md
```

### Protagonist: ELUA
Named after the god Scott invokes at the end of "Meditations on Moloch" — the god of flowers, free love, art, science, philosophy, and all soft human things. Elua is a small luminous figure, androgynous, trailing gentle light. They are fragile but persistent.

**Persistent Mechanics Across Levels:**
- **Humanity Meter**: Depletes when forced into optimization traps; replenishes through acts of genuine connection
- **Collected Insights**: Quotes/concepts from each essay, unlockable
- **Scars**: Visual changes reflecting compromises made in previous levels

---

## LEVEL 1: MEDITATIONS ON MOLOCH

### Essay Theme
Coordination failures, multipolar traps, and the demon god of optimization who demands you sacrifice everything good for competitive advantage.

### Gameplay Style
**Tower Defense / Reverse Tower Defense Hybrid**

The player must build and maintain a civilization on an island while Moloch's influence spreads from the edges. But here's the twist: you're not defending against monsters — you're defending against *optimization pressures* that emerge from your own buildings.

### Core Mechanics

1. **The Island**: A pristine island. You place buildings: farms, art studios, schools, houses.

2. **The Rats of NIMH Phase**: Early game is idyllic. Your rat-citizens compose art, live long, have modest families. Resources are abundant.

3. **Carrying Capacity**: Population grows. Resources become scarce. Now buildings can be "upgraded" — but upgrades always involve a Faustian bargain:
   - Art Studio → "Content Farm" (more output, no beauty)
   - School → "Test Prep Center" (higher scores, no learning)
   - Farm → "Factory Farm" (more food, pollution spreads)

4. **Moloch's Emergence**: A massive stone figure rises from the center of the island. Each optimization you make causes Moloch to glow brighter. He doesn't attack — he *pulls*. Buildings drift toward him, citizens begin walking zombie-like to feed themselves into his furnace.

5. **The Coordination Challenge**: The only way to resist is to get multiple buildings to "coordinate" — link them with precious resources, but if any one defects (which they do automatically under pressure), all linked buildings suffer.

### Key References to Include
- **"Caesar's Palace in the desert"**: A gambling den appears if you build too much — it generates wealth but drains everything else
- **"Cancer cells"**: Some upgraded buildings metastasize, spawning copies of themselves
- **"Rats who abandoned art"**: Visible transformation of citizen sprites from colorful to grey
- **Allen Ginsberg quotes**: Flash on screen during Moloch's growth ("Moloch whose mind is pure machinery!")
- **"The Dream Time"**: A special resource — periods when Moloch is dormant and you can actually build something beautiful

### Win Condition
Survive until you can build a "Garden" — requires sustained coordination of at least 5 un-optimized buildings for 60 seconds while Moloch is fully active.

### Hidden Ending
If you feed *everything* to Moloch voluntarily before he fully awakens, you get a brief flash of his perspective — and understand he's not evil, just an emergent property. Unlocks a quote: "Moloch can't agree even to a 99.99999% victory."

---

## LEVEL 2: I CAN TOLERATE ANYTHING EXCEPT THE OUTGROUP

### Essay Theme
We hate our near enemies, not our far enemies. The Blue Tribe and Red Tribe despise each other more than either despises distant foreigners.

### Gameplay Style
**Social Puzzle / Empathy Simulator**

### Core Mechanics

1. **The Dinner Party**: You're hosting a dinner party. Guests arrive one by one. Each has visible tribal markers (clothing, vocabulary, bumper sticker on their car visible through the window).

2. **The Seating Arrangement**: You must seat guests to maximize "tolerance" — but tolerance is calculated *inversely* to similarity. Seating a Blue Tribe member next to a Far Foreigner = easy harmony. Seating them next to someone who's *almost* Blue but disagrees on one key issue = explosion.

3. **The Emperor's Paradox**: You can give speeches about tolerance. The more groups you praise, the more "tolerance points" you claim. But the game tracks *which* groups you actually seat comfortably.

4. **Belief Congruence Mechanic**: Each guest has hidden beliefs. Two guests who look completely different but share beliefs will get along. Two guests who look identical but have one belief difference will fight.

5. **The Mirror Phase**: Halfway through, you realize the camera has been on *you* the whole time. Your tolerance meter is displayed — and you've been unconsciously favoring guests similar to yourself.

### Key References to Include
- **"Bodhidharma's Zero"**: A wise figure appears periodically and awards you zero tolerance points when you brag about tolerance
- **"Nazis and Japanese"**: A puzzle where two groups who seem like they should hate each other (very different) get along, while two similar groups fight
- **The Red/Blue Tribe visual**: Guests literally tint red or blue as the evening progresses based on their sorting
- **"Galaxy-brained himself into being tolerant"**: A joke achievement if you somehow seat everyone perfectly through pure optimization

### Win Condition
Successfully identify the *actual* outgroup dynamics (who really hates whom) and either:
- (Good ending) Arrange seating to force genuine difficult tolerance
- (Meta ending) Acknowledge in a speech that "This essay is bad and I should feel bad" — quoting Scott's own conclusion

---

## LEVEL 3: THE TOXOPLASMA OF RAGE

### Essay Theme
Controversial cases spread further than clear-cut cases. PETA picks undefendable battles because they *spread*. The most memetically virulent position is the one that splits people 50/50.

### Gameplay Style
**Infection/Propagation Strategy Game**

You play as a memetic organism trying to spread through a social network.

### Core Mechanics

1. **The Network**: A web of connected nodes (people). Each person has beliefs, tribal affiliations, and an "engagement threshold."

2. **Choosing Your Host**: You can pick which case/cause to embody. Clear-cut ethical cases (unambiguous murder, obvious injustice) infect people easily but *don't spread* — everyone agrees, no engagement.

3. **The PETA Principle**: The more *controversial* your case, the more it spreads. Pick a dubious rape allegation over a clear one. Pick the police shooting with ambiguous evidence.

4. **The Ferguson Effect**: When you infect someone, they *must respond*. If they share your view, they boost the signal. If they oppose it, they boost it *even more* to denounce it.

5. **Scissor Statements**: Special power-up. A "scissor" is a statement that perfectly divides any population, causing maximum engagement and spread. ("Sort by Controversial" reference)

6. **The Tumblr Wars**: A zone where failing to reblog makes you "trash" — forced engagement multiplies your spread.

### Key References to Include
- **"Chain letter mechanics"**: Your meme literally has chain-letter characteristics ("reblog or you're problematic")
- **The dark-red/light-red spectrum**: Visual representation of how ambiguous cases (light red) spread further than clear-cut cases (dark red)
- **"War on Terror" dual-host lifecycle**: A special meme that alternates between two populations, growing stronger in each
- **PETA Detroit water bills**: An early-game scenario exactly replicating this case

### Win Condition
Successfully infect the entire network. But at the end, reveal the *real* score: how much lasting good was accomplished versus how much rage was generated.

### Ironic Twist
The *best* strategy (highest spread) always involves picking the *worst* cases for your cause, meaning "winning" requires betraying the thing you're supposedly fighting for.

---

## LEVEL 4: THE CONTROL GROUP IS OUT OF CONTROL

### Essay Theme
Parapsychology is the control group for science. If their rigorous studies consistently find positive results for phenomena that don't exist, what does that say about *all* science?

### Gameplay Style
**Laboratory Management / Statistical Puzzle Game**

### Core Mechanics

1. **You Run a Lab**: Design studies, recruit subjects, run experiments, publish results. Your lab has a "prestige" meter.

2. **The Phenomenon**: You're studying something — could be a drug, could be psychic powers, could be a social intervention. You don't know if it's real.

3. **Statistical Traps**: The game teaches you all the ways to get false positives:
   - P-hacking: Run many analyses, report the one that works
   - Publication bias: Drawer full of failed replications nobody sees
   - Stopping rules: Stop the experiment when results look good
   - Researcher degrees of freedom: Many small choices that compound

4. **The Bem Challenge**: A famous researcher with impeccable methodology publishes a meta-analysis of 90 studies showing psychic powers exist, p < 10^-10. Can you figure out what's wrong? (The answer is: maybe nothing obvious. That's the horror.)

5. **The Ten Commandments**: You can implement reforms — pre-registration, Bayesian statistics, demanding replication. Each costs prestige. Do you follow them?

### Key References to Include
- **Daryl Bem's actual papers**: In-game versions of his precognition studies
- **"Funnel plots beautifully symmetrical"**: A visual of a perfect funnel plot that's still somehow wrong
- **Irving Kirsch cameo**: "Associate Director of the Program for Placebo Studies" 
- **The replication crisis**: A wave that hits midgame, tanking the value of all previous findings

### Win Condition
Either:
- Publish enough to keep your lab funded (but probably produce garbage)
- Maintain rigorous standards (but watch your career collapse)
- Find the narrow path where rigor *and* productivity coexist

### The Twist
At the end, you find out whether your phenomenon was real or not. The gut-punch: your methodology produced the same results either way.

---

## LEVEL 5: NOBODY IS PERFECT, EVERYTHING IS COMMENSURABLE

### Essay Theme
You don't have to be a saint to help. The "Giving What We Can" pledge of 10% is achievable. Perfectionism is the enemy of good.

### Gameplay Style
**Resource Management / Moral Accounting Game**

### Core Mechanics

1. **Your Life**: You have time, money, energy, willpower — all finite resources represented as meters.

2. **The Demands**: Tumblr-style demands scroll across the screen: "Reblog this or you don't care about X." "If you have time for Y, you have time to fight Z." Each demand is technically correct.

3. **The Paralysis**: Trying to respond to everything depletes you to zero. You accomplish nothing.

4. **The Pledge**: You can take a pledge — commit 10% of one resource to a cause. This creates a "sustainable" loop where you can function AND help.

5. **Commensurability**: Everything converts to "QALY-equivalents" or similar. Your Netflix time, your charitable donations, your emotional labor — all on one scale. This is both liberating (you can compare) and horrifying (nothing is sacred).

### Key References to Include
- **The Tumblr guilt spiral**: Actual quotes about "if you can reblog fandom stuff, you can reblog Pakistan"
- **The 10% solution**: Visual demonstration of how giving 10% forever beats giving 100% once and burning out
- **The third servant**: A character who buried their talent in the ground because perfect was impossible

### Win Condition
Find a sustainable equilibrium that maximizes total good *over your whole life*, not just this moment.

### Emotional Beat
The relief of realizing you're *allowed* to not be perfect. The game explicitly tells you it's okay.

---

## LEVEL 6: THE PARABLE OF THE TALENTS

### Essay Theme
Ability is largely innate. You shouldn't beat yourself up for lacking talent, but you also shouldn't take credit for having it. It's genetic luck.

### Gameplay Style
**RPG with Hidden Stats**

### Core Mechanics

1. **Character Creation**: You roll a character. But unlike normal RPGs, you don't see your stats. You just see how tasks *feel*.

2. **The Two Paths**: Two skill trees — one your character is naturally good at, one they're not. In the "easy" tree, actions feel effortless, progress is fast. In the "hard" tree, every step is agony.

3. **The Scott Alexander Experience**: You dominate English class. You barely pass Calculus. Everyone praises you for English (feels unearned). Everyone criticizes you for Calculus (feels unfair).

4. **The Ramanujan Problem**: You meet NPCs with extraordinary talents. Some had hard lives, no opportunities. Some had every advantage. Their talents don't correlate with their virtue.

5. **The Bargain**: You can "grind" in your weak area. Hours of work might equal minutes of natural improvement in your strong area. Is it worth it?

### Key References to Include
- **"Perfect SAT Verbal, C- in Calculus"**: The opening scenario
- **The brother who became a famous musician**: An NPC with the same parents, different outcomes
- **"IQ 70 ditch-digger donating to charity"**: A wise NPC who found meaning despite limited ability
- **"Any system where only one person can feel good"**: A trap where you're always comparing to someone better

### Win Condition
Accept the bargain — you won't beat yourself up for your weaknesses, but you also won't take excess pride in your strengths. Find your comparative advantage and use it.

---

## LEVEL 7: BOOK REVIEW — THE SECRET OF OUR SUCCESS

### Essay Theme
Culture, not individual intelligence, is humanity's superpower. Reason is dangerous. Traditions encode wisdom we can't consciously access.

### Gameplay Style
**Survival / Mystery Game**

### Core Mechanics

1. **You're an Explorer**: Stranded in an unfamiliar environment (Arctic, jungle, or Alabama — yes, Alabama). You have high intelligence but no cultural knowledge.

2. **The Locals**: Indigenous people thrive here. They do many things that seem stupid or superstitious.

3. **The Manioc Problem**: You find a food source. The locals process it through a complicated, time-consuming, seemingly pointless ritual. You, the smart rationalist, realize you can skip most of it.
   - Short term: You're fine!
   - Medium term: Vague symptoms.
   - Long term: Death by cyanide poisoning.

4. **The Shark Taboo**: Pregnant NPCs won't eat certain fish because "the baby will have shark skin." This is obviously false. But the fish contain teratogens. The false belief protects the true outcome.

5. **The Caribou Bones**: The locals decide where to hunt by reading caribou bones (random). You use logic (go where caribou were yesterday). They catch more caribou because randomization defeats the caribou's strategy.

### Key References to Include
- **European explorers starving in plenty**: Historical references to exact cases Scott mentions
- **"Epistemic Hell"**: A location where every useful belief is justified by a false explanation
- **"Reason as the villain"**: A narrative reversal where your intelligence actively hurts you

### Win Condition
Learn humility. Either adopt the traditions wholesale (survive but never understand) or somehow synthesize tradition and reason (hard mode).

### The Horror
Realizing that "why have we always done this?" is often a better epistemology than "what makes sense to me right now?"

---

## LEVEL 8: ALL IN ALL, ANOTHER BRICK IN THE MOTTE

### Essay Theme
The motte-and-bailey fallacy: make bold claims (the bailey), retreat to defensible claims (the motte) when challenged, then return to the bailey.

### Gameplay Style
**Debate/Rhetoric Strategy Game** (think Phoenix Wright meets tower defense)

### Core Mechanics

1. **The Castle**: You control a motte-and-bailey castle. Your resources live in the bailey. Your defense is the motte.

2. **Making Claims**: You can place "claims" in the bailey — bold, useful, but vulnerable. "God performs miracles." "All men are trash." "Capitalism is violence."

3. **Attacks Come**: Opponents attack your claims with arguments. You can:
   - Defend the bailey (risky, might fail)
   - Retreat to the motte ("I just meant there's beauty in the universe!")
   - Abandon the claim

4. **The Motte's Limit**: Your motte is small. You can't keep everything there. You have to decide what's actually defensible.

5. **The Mirror Match**: Opponents use the same tactic. You have to identify *their* motte-and-bailey to attack effectively.

### Key References to Include
- **Post-modernism example**: "Reality is socially constructed" (bailey) vs. "Different cultures perceive things differently" (motte)
- **Religion example**: "God heals the sick" (bailey) vs. "God is the beauty in the universe" (motte)
- **Feminism example**: "All these specific policies" (bailey) vs. "Women are people" (motte)

### Win Condition
Either:
- Build an intellectually honest castle where bailey and motte are the same (very small, but impregnable)
- Become a master of rhetorical warfare (large bailey, quick retreats)
- Expose your opponent's fallacies without using them yourself

---

## LEVEL 9: CONFLICT VS. MISTAKE

### Essay Theme
Mistake theorists think political opponents are wrong. Conflict theorists think political opponents are evil. These are fundamentally different worldviews.

### Gameplay Style
**Dual-Mode Strategy Game**

You can play the same political scenario in two modes, yielding totally different games.

### Core Mechanics

1. **The Problem**: A policy issue — let's say healthcare. Many stakeholders, imperfect information, competing values.

2. **Mistake Mode**: 
   - Politics is a puzzle
   - Opponents are misguided
   - Solution: find truth, persuade with evidence
   - Win condition: optimal policy enacted
   - Gameplay: Research, debate, compromise, iterate

3. **Conflict Mode**:
   - Politics is war
   - Opponents serve different interests
   - Solution: accumulate power, defeat enemies
   - Win condition: your faction wins
   - Gameplay: Coalition building, resource control, strategic rhetoric

4. **The Crossover**: Some situations are genuinely mistakes (everyone benefits from coordination). Some are genuinely conflicts (zero-sum). The challenge is knowing which is which.

5. **The Trap**: If you're a mistake theorist in a conflict situation, you get exploited. If you're a conflict theorist in a mistake situation, you prevent cooperation.

### Key References to Include
- **"Mistake theorists think their opponents are smart people with wrong ideas"**: Tutorial text
- **"Conflict theorists think their opponents are bad people with selfish interests"**: Alternative tutorial
- **The meritocracy debate**: A scenario where the correct frame genuinely matters

### Win Condition
Correctly identify which frame applies to which situation. Or: realize that both frames are partial, and find a synthesis.

---

## LEVEL 10: SSRIs — MUCH MORE THAN YOU WANTED TO KNOW

### Essay Theme
The truth about antidepressants is complicated. They work, but not as much as advertised. Effect sizes are small but real. Individual variation is huge.

### Gameplay Style
**Body-Horror Puzzle / Internal Journey**

The most personal, intimate level. You're navigating your own brain.

### Core Mechanics

1. **The Landscape**: Your brain is a world. Serotonin transporters are structures. Receptors are locks. Neurotransmitters are flowing rivers.

2. **The Imbalance**: Something is wrong. The flow is disturbed. You feel it as weather — grey skies, heavy gravity, no music.

3. **The SSRIs**: Pills fall from the sky. They don't create serotonin — they block reuptake. The rivers flow longer before draining.

4. **The Waiting**: SSRIs take a month to work. The game makes you wait. Real time? No. But gameplay time that *feels* long.

5. **The Effect Size**: When things improve, it's subtle. Not a transformation — an 0.3 standard deviation improvement. The grey doesn't become sunshine. It becomes slightly lighter grey.

6. **Individual Variation**: The game is different each playthrough. Sometimes SSRIs work beautifully. Sometimes they do nothing. Sometimes side effects dominate.

### Key References to Include
- **Irving Kirsch as a boss**: "The Associate Director of the Program for Placebo Studies" questioning whether any of this is real
- **The HAM-D scale**: Your depression literally measured as a visible score
- **"Severely depressed patients benefit most"**: Mechanic where the worse your state, the more the intervention helps
- **The MAOI option**: More effective but you can't eat cheese, chocolate, beer, or kimchi (actually enforced)
- **"Much More Than You Wanted To Know"**: The phrase appears when you dig into any mechanic too deeply

### Win Condition
Reach a stable state. Not perfect — that's not the message. Functional. The sun doesn't come out. But you can get out of bed.

### The Message
This is not a triumphant ending. It's a realistic one. The game explicitly tells you: "This medication has an effect size of approximately 0.3. You are slightly better. That slight improvement may be the difference between living and not living. That is enough."

---

## CROSS-LEVEL MECHANICS

### The Insight Collection
Each level drops a collectible insight — a key quote or concept from the essay. Collecting all 10 unlocks a final confrontation with Moloch where you can deploy them.

### Elua's Transformation
Elua visually changes based on choices:
- Bright and flowing if you've maintained humanity
- Crystalline and efficient if you've optimized
- Scarred but warm if you've compromised but retained core values

### The Final Moment
After Level 10, a brief coda: Elua confronts Moloch one last time, armed with everything learned. The battle isn't won by force. It's won by *coordination* — if you've collected enough insights and maintained enough humanity, you can summon the fleeting coalition that makes Moloch flinch.

Quote at the end: *"I am a transhumanist because I do not have enough hubris not to try to kill God."*

---

## DEVELOPMENT PRIORITIES

### Phase 1 (MVP)
- Levels 1 (Moloch), 3 (Toxoplasma), 8 (Motte-Bailey)
- Core engine and save system
- Basic Elua sprite and mechanics

### Phase 2
- Levels 2, 4, 5, 6
- Full insight collection system
- Audio and polish

### Phase 3
- Levels 7, 9, 10
- Final confrontation sequence
- Full visual transformation system

---

## AESTHETIC NOTES

### Visual Style
- **Main palette**: Deep purples, greys, and a single warm gold (Elua's light)
- **Moloch**: Industrial, geometric, burning orange
- **Essays**: Each level has a unique sub-palette matching its theme

### Audio
- Ambient, unsettling, with moments of genuine beauty
- Moloch has industrial grinding; Elua has something like distant bells

### Typography
- Serious serif for essay quotes
- Clean sans-serif for gameplay UI
- Occasional handwriting for personal moments

---

## FINAL NOTES FOR DEVELOPMENT

This game is meant to be *actually playable*, not just a thought experiment. Each level should be:
1. Fun on its own terms
2. True to the essay's ideas
3. Surprising in how it makes abstract philosophy concrete

The goal is that someone who's never read SlateStarCodex could play this game, enjoy it, and walk away understanding ten important ideas about rationality, coordination, and being human.

And someone who *has* read SlateStarCodex should feel like they're meeting an old friend in a new form.

*"The Universe is a dark and foreboding place, suspended between alien deities. Cthulhu, Gnon, Moloch, call them what you will. Somewhere in this darkness is another god. He is the god of flowers and free love and all soft and fragile things. And the gods who oppose Him tend to find Themselves meeting with a surprising number of unfortunate accidents."*

---

**Document Version**: 1.0  
**For**: Claude Code Implementation  
**Target Platform**: GitHub Pages (static hosting, no backend required)
