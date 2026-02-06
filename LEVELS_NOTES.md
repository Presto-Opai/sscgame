# CODEX DESCENDING — Level Implementation Notes

*Working document for building each level. Contains specific implementation plans, technical requirements, art direction, and gameplay details.*

---

## GLOBAL TECHNICAL DECISIONS

### Engine Approach
- **Pure vanilla JS + Canvas 2D** — no frameworks, no build tools, just `<script>` tags
- Each level is a self-contained module that exports `init()`, `update(dt)`, `render(ctx)`, and `cleanup()`
- Shared engine handles: game loop (requestAnimationFrame), input normalization, screen transitions, audio context, save/load
- Target: 60fps on a 2018 laptop, graceful degradation to 30fps
- Resolution: 960×640 logical canvas, CSS-scaled to fill viewport while maintaining aspect ratio

### Elua (Protagonist) Visual Design
- **Idle**: A luminous teardrop-shaped sprite, ~24×32px, soft gold glow with 2-frame breathing animation
- **Moving**: Glow trail follows with 0.3s fade, slight stretch in movement direction
- **Damaged**: Glow dims, cracks appear as dark lines across the sprite (scars from previous levels persist)
- **Joyful**: Glow expands, tiny particle sparkles orbit the sprite
- Elua is always rendered at a consistent scale and style regardless of the level's visual language — they're the constant in a shifting world

### Persistent State Schema (LocalStorage)
```json
{
  "codexDescending": {
    "version": 1,
    "currentLevel": 0,
    "humanity": 100,
    "insights": [null, null, null, null, null, null, null, null, null, null],
    "scars": [],
    "levelsCompleted": [false, false, false, false, false, false, false, false, false, false],
    "levelBestScores": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "hiddenEndingsFound": [],
    "totalPlaytime": 0
  }
}
```

### Audio System
- Web Audio API with a single AudioContext
- Procedural ambient audio per level (oscillators + filters, no large audio files)
- Elua has a signature motif: a sequence of 4 soft bell tones (C5-E5-G5-C6) that plays on insight collection
- Moloch has a low rumble drone (filtered brown noise at ~80Hz)
- Each level crossfades its ambient over 2 seconds on transition

---

## LEVEL 1: MEDITATIONS ON MOLOCH
**File**: `js/levels/level01-moloch.js`

### Implementation Plan

**Genre**: Tower Defense / Civilization Sim Hybrid
**Camera**: Top-down isometric-ish (45° tile grid), scrollable
**Duration**: ~8-12 minutes per run

#### Game Board
- 12×12 hex grid representing the island
- Tiles: grass, water (edges), stone, fertile soil
- Buildings snap to hex centers
- Moloch statue occupies center 2×2 hexes, starts dormant (grey stone)

#### Building Types & Their Corruptions
| Building | Cost | Benefit | Corrupted Form | Corruption Effect |
|----------|------|---------|-----------------|-------------------|
| Cottage | 10 wood | +2 population cap | Tenement | +6 pop cap, -happiness |
| Farm | 15 wood | +3 food/tick | Factory Farm | +9 food, poisons adjacent tiles |
| Art Studio | 20 wood, 10 stone | +5 beauty/tick | Content Farm | +0 beauty, +15 gold |
| School | 25 wood, 15 stone | +3 knowledge/tick | Test Prep Center | +1 knowledge, +10 prestige |
| Garden | 50 of everything | Win condition building | Cannot be corrupted | But Moloch pulls hardest at it |

#### Moloch Mechanics
- **Moloch Power** = sum of all corruption levels across buildings
- At power thresholds (25%, 50%, 75%), Moloch animates:
  - 25%: Eyes glow orange
  - 50%: Gravitational pull starts (buildings visually lean toward center)
  - 75%: Citizens walk toward Moloch; you can intercept them by clicking
  - 100%: Game over — Moloch consumes the island
- **Corruption pressure**: Every 30 seconds, the least-productive building gets a corruption prompt. Accept = +power to Moloch but immediate benefit. Decline = building output halved for 15 seconds.

#### Coordination Mechanic
- Link buildings by dragging a line between them (costs 5 wood per link)
- Linked buildings share benefits and resist corruption together
- BUT: if one linked building corrupts, ALL linked buildings take 2× corruption pressure next cycle
- This creates the core prisoner's dilemma the essay describes

#### Key Moments
1. **Opening**: Peaceful music, Ginsberg quote fades in: *"I saw the best minds of my generation destroyed by madness"*
2. **First corruption**: Tutorial popup explains the choice. No judgment.
3. **Dream Time**: Every 90 seconds, Moloch sleeps for 15 seconds. During this window, beauty generated is 3× and buildings can be de-corrupted (costly).
4. **Caesar's Palace**: If gold > 100, a casino auto-spawns. Generates massive gold, drains everything else. Can only be destroyed during Dream Time.
5. **Cancer mechanic**: Corrupted buildings at max level have a 10% chance per cycle to clone themselves onto adjacent empty tiles.

#### Win: Build and maintain a Garden for 60 seconds with Moloch at 50%+ power
#### Hidden Ending: Voluntarily corrupt every building before Moloch hits 50%. Triggers a cinematic.

#### Visual Notes
- Palette: Forest greens → industrial orange/black gradient as corruption spreads
- Moloch: Geometric, brutalist statue. Think Aztec + Soviet constructivism.
- Corruption: Buildings get darker, smokestacks appear, warm colors drain to grey
- Garden: The ONLY source of green once corruption is high — it glows like Elua

#### SSC Quote Triggers
- Building first art studio: *"Once one of them 'gains an advantage' by switching to food production, the resistance is broken"*
- Moloch at 50%: *"Moloch whose mind is pure machinery! Moloch whose blood is running money!"*
- Win screen: *"Elua is the god of flowers and free love and all soft and fragile things"*

---

## LEVEL 2: I CAN TOLERATE ANYTHING EXCEPT THE OUTGROUP
**File**: `js/levels/level02-outgroup.js`

### Implementation Plan

**Genre**: Social Puzzle / Seating Arrangement Game
**Camera**: Fixed overhead view of a long dinner table
**Duration**: ~6-8 minutes

#### The Table
- 12-seat dinner table rendered from above
- Chairs as circles around a rectangular table
- Each seat has a "tension meter" (invisible until activated)

#### Guest System
- 16 guests total, 12 seats — you must choose who to invite AND where to seat them
- Each guest has:
  - **Visual markers**: Clothing color (red/blue spectrum), accessories (flag pin, NPR tote, pickup truck keys, Whole Foods bag)
  - **Visible beliefs**: 3 beliefs shown as icons on their "name card"
  - **Hidden beliefs**: 2 additional beliefs revealed only when seated next to someone
  - **Tribe**: Blue, Red, Grey (rationalist), Far (foreign/unfamiliar)

#### Tolerance Calculation
```
tension(A, B) = similarity(A, B) * belief_disagreement(A, B)
```
- Two very different people who disagree = LOW tension (they expected it)
- Two very similar people who disagree on ONE thing = MAXIMUM tension
- Two identical people = zero tension but zero tolerance points

#### The Mirror Mechanic
- The game tracks YOUR choices (which guests you invite first, who you hesitate on)
- At the midpoint, the camera zooms out to reveal you're also sitting at the table
- Your "player character" has tribe markers based on your choices
- Other guests react to YOU

#### Scoring
- **Tolerance Score**: Based on actual difficult-but-peaceful pairings
- **Hypocrisy Score**: Based on gap between your stated tolerance and actual seating patterns
- **Insight**: Awarded if Hypocrisy Score is acknowledged (click "I see it" when mirror reveals)

#### Key Moments
1. First two guests are easy — a Blue Tribe member and someone from a distant country. They get along great. Tutorial teaches basic mechanics.
2. Third guest is *almost* Blue but with one Red belief. Tension spikes.
3. The "Nazis and Japanese" puzzle: Two guests who LOOK like they should fight but bond over shared love of organization.
4. **Bodhidharma appears** (floating NPC) whenever you congratulate yourself on tolerance. Awards zero points.
5. Final guest is YOU. Where do you sit?

#### Visual Notes
- Warm dinner party lighting, candles on table
- Guests literally tint toward red or blue as they "sort" during conversation
- Tension shown as heat waves between conflicting guests
- The mirror reveal: screen literally mirrors/reflects for a moment

---

## LEVEL 3: THE TOXOPLASMA OF RAGE
**File**: `js/levels/level03-toxoplasma.js`

### Implementation Plan

**Genre**: Infection/Network Propagation Strategy
**Camera**: Network graph view (nodes and edges, force-directed layout)
**Duration**: ~5-7 minutes per run

#### The Network
- 50-80 nodes (people) connected in a small-world network
- Each node has: political leaning (spectrum), engagement threshold, share probability
- Nodes are colored by state: unaware (grey), aware (yellow), enraged (red), exhausted (dark)

#### Meme Selection Phase
- At level start, choose a CAUSE (justice, environment, health, etc.)
- Then choose a CASE to represent it:
  - **Clear-cut case**: Obviously correct, high moral clarity, low controversy → infects easily but DOESN'T SPREAD (everyone agrees, no engagement)
  - **Ambiguous case**: Debatable, some complications → moderate spread
  - **Outrageous case**: Clearly flawed representative, maximum controversy → MAXIMUM SPREAD (everyone must weigh in)
- This is the core teaching: the PETA principle that bad representatives spread further

#### Propagation Mechanics
- Click a node to "seed" your meme there
- Infected nodes share with probability based on: controversy × their engagement level
- Nodes who AGREE share it (+1 spread)
- Nodes who DISAGREE share it to denounce (+2 spread, because outrage is engagement)
- The "Sort by Controversial" power-up: Highlight the most divisive statement variant to maximize split

#### Scissor Statements
- Special unlockable: a "scissor" perfectly divides any group 50/50
- Visual: a literal scissors icon cuts through a cluster of nodes
- Using it is the most effective strategy but leaves permanent damage to the network (connections severed)

#### The Scoreboard Twist
- During play, a big "SPREAD %" counter feels like your score
- At level end, reveal the REAL metrics:
  - Minds actually changed: very few
  - Relationships damaged: many
  - Actual good accomplished: almost none
  - Rage generated: enormous
- The gap between spread and impact IS the lesson

#### Visual Notes
- Dark background, nodes as glowing circles
- Connections pulse when memes travel along them
- Red pulse waves ripple outward from controversy
- "Viral" animations: exponential branching light patterns
- Exhausted nodes dim and disconnect

---

## LEVEL 4: THE CONTROL GROUP IS OUT OF CONTROL
**File**: `js/levels/level04-control-group.js`

### Implementation Plan

**Genre**: Lab Management / Statistical Puzzle
**Camera**: Split screen — lab view (left) and data dashboard (right)
**Duration**: ~10-12 minutes

#### Your Lab
- You're a researcher. You have a budget, graduate students, and a phenomenon to study.
- The phenomenon: **does this pill work?** (The player never knows the ground truth until the end)

#### Experiment Loop
1. **Design**: Choose sample size (small = cheap, large = expensive), control type, blinding level
2. **Run**: Watch animated subjects take pills/placebos. Results generate with randomness.
3. **Analyze**: Choose statistical tests. See p-values. Decide what to report.
4. **Publish or File-drawer**: Publish significant results (gains prestige), file away nulls (loses nothing... apparently)

#### The Traps (Playable)
- **P-hacking mini-game**: You have 20 outcome variables. Run tests on each. By chance, 1 will be p < 0.05. The game lets you "choose" to report only that one. It WORKS — you gain prestige.
- **Stopping rule exploit**: Watch data come in live. A "STOP" button appears whenever p < 0.05 transiently. Hit it at the right time and you "caught" significance.
- **Garden of forking paths**: At each decision point, the game shows you branching paths. Each branch is defensible. But the combination biases everything.

#### The Bem Challenge (Mid-level Boss)
- A famous NPC publishes: "Precognition is real, p < 10^-10, 90 studies"
- You must figure out what went wrong
- The horror: their methodology is *actually decent*
- Answer: the entire system is broken at a deeper level

#### The Replication Crisis Event
- Halfway through, a "replication crisis" wave hits. All your previous findings are scrutinized.
- Your p-hacked results fail replication. Your careful results mostly hold.
- Your prestige either crashes or survives based on your earlier choices.

#### End Reveal
- The game reveals whether the phenomenon was real or not
- EITHER WAY, your published results look the same
- This is the horror: the methodology couldn't tell the difference

#### Visual Notes
- Clean, clinical aesthetic. White backgrounds, sans-serif fonts
- Data visualizations are central: scatter plots, funnel plots, forest plots
- P-values displayed prominently (they turn green at < 0.05 — deliberately misleading)
- The "file drawer" is a literal drawer on screen that fills with unpublished studies

---

## LEVEL 5: NOBODY IS PERFECT, EVERYTHING IS COMMENSURABLE
**File**: `js/levels/level05-commensurable.js`

### Implementation Plan

**Genre**: Resource Management / Life Sim
**Camera**: Side-scrolling timeline (your life from left to right)
**Duration**: ~6-8 minutes

#### Your Resources
- 5 bars at the top of screen: **Time**, **Money**, **Energy**, **Willpower**, **Joy**
- Each tick (1 "day"), all deplete slightly. Actions replenish some, cost others.
- If ANY resource hits zero, you crash (burnout, bankruptcy, depression, etc.)

#### The Demand Feed
- A scrolling feed on the right side (styled like Tumblr/Twitter)
- Posts demand your action: "Reblog for awareness", "Donate NOW", "If you have time for Netflix you have time to fight injustice"
- Each demand is technically correct and morally compelling
- Responding to each costs resources

#### The Paralysis Trap
- Early game: the feed is slow. You can respond to everything. Feels good.
- Mid game: the feed accelerates. You start falling behind. Guilt mechanic activates (screen edges darken when you ignore demands).
- The trap: trying to respond to EVERYTHING drains all resources to zero. You collapse. Zero good accomplished.

#### The 10% Pledge
- A quiet option in the corner: "Commit 10% of one resource"
- Taking it creates a small but SUSTAINABLE drain
- The game visually shows: steady 10% over 50 years > desperate 100% for 1 year
- A bar graph grows over the "timeline" showing cumulative impact

#### Commensurability Calculator
- Clicking any action shows its QALY-equivalent value
- Your Netflix hour = 0 QALYs but +5 Joy (which prevents burnout, which enables future giving)
- The calculator is both useful and horrifying — everything reduced to a number

#### Win Condition
- Reach the end of the timeline with: no resource at zero, total impact > threshold, joy > 0
- The message: *"You are allowed to not be perfect. The universe needs you functional more than it needs you martyred."*

#### Visual Notes
- Warm, personal aesthetic. Watercolor-style backgrounds.
- The demand feed is harsh and bright (social media aesthetic) — contrasts with the soft life view
- The 10% commitment is visualized as a golden thread running through your life timeline
- Burnout is literally visualized: colors drain, music stops, controls become sluggish

---

## LEVEL 6: THE PARABLE OF THE TALENTS
**File**: `js/levels/level06-talents.js`

### Implementation Plan

**Genre**: RPG with Hidden Stats & Introspective Mechanics
**Camera**: Side-scrolling RPG perspective
**Duration**: ~8-10 minutes

#### Character Creation (The Trick)
- Player is shown a "character creation" screen
- They pick a name and a portrait
- Stats are rolled... but NOT SHOWN
- Instead of "STR: 14", you see: "You find physical tasks... [somewhat natural]"
- The vagueness is deliberate — you don't know your numbers

#### The Two Skill Trees
- **Skill Tree A**: Tasks in this tree feel easy. Progress bars fill fast. NPCs praise you. "You're so talented!"
- **Skill Tree B**: Tasks here are agonizing. Progress is glacial. NPCs give pity. "At least you tried."
- The player eventually realizes: Tree A matches their hidden high stat. Tree B matches their hidden low stat.

#### The Grinding Dilemma
- You can grind in Tree B. Each hour of grinding = 1 point.
- In Tree A, each hour = 10 points.
- NPCs in Tree B congratulate your effort: "Hard work beats talent!"
- But the numbers don't lie. The math is cruel.
- An NPC with naturally high stats in Tree B blazes past you effortlessly. They didn't work hard. They were born for it.

#### Key NPCs
- **The Brother**: Same parents, different stats. Became a famous musician. Didn't practice more than you.
- **The Ditch-Digger**: IQ 70 (shown through gameplay, not stated). Donates to charity. Wise. Happy. Has found peace.
- **The Perfectionist**: Maximum stats in everything. Miserable. Always comparing to someone better.

#### The Acceptance Mechanic
- Late in the level, a choice: "Accept your stats"
- If yes: Your character stops flinching at Tree B failures. The soundtrack softens. Scars become beauty marks.
- If no: You can keep grinding. The game lets you. It just... doesn't change.

#### Visual Notes
- Classic JRPG aesthetic but with a melancholy undertone
- Stats are shown as feelings, not numbers, until the acceptance moment (then numbers briefly flash)
- Color palette: autumnal — oranges, browns, falling leaves
- The Ditch-Digger's scene should be the most beautiful in the level

---

## LEVEL 7: BOOK REVIEW — THE SECRET OF OUR SUCCESS
**File**: `js/levels/level07-secret-success.js`

### Implementation Plan

**Genre**: Survival / Don't Starve-lite
**Camera**: Top-down exploration view
**Duration**: ~8-10 minutes

#### The Setup
- You (Elua, but visually "dressed" as a European explorer) arrive in an unfamiliar biome
- A village of locals is nearby. They perform strange rituals.
- You have a **Rationality Meter** (high) and a **Cultural Knowledge Meter** (zero)

#### The Survival Loop
- Gather food, build shelter, avoid hazards
- Each day cycle: find food, process it, eat, sleep
- Health depletes from: starvation, poisoning, exposure, predators

#### The Manioc Problem (Core Puzzle)
- You find a root vegetable (manioc). The locals spend 3 in-game days processing it through an elaborate ritual: soaking, scraping, fermenting, drying.
- You can skip steps. Eating raw/underprocessed manioc:
  - Day 1-3: No symptoms. "See? The ritual was pointless."
  - Day 4-7: Mild symptoms. "Probably unrelated."
  - Day 8+: Severe illness. Cyanide poisoning. Death if not treated.
- The locals' "pointless ritual" removes cyanide. They don't know WHY. Their explanation is "the spirits demand it."

#### Other Cultural Wisdom Puzzles
1. **Shark Taboo**: Pregnant NPC won't eat certain fish. Reason given: "baby will have shark skin." Real reason: fish contains teratogens. Ignoring taboo = birth defects.
2. **Caribou Bones**: Locals decide hunting direction by reading cracks in heated bones (random). You use logic (go where caribou were yesterday). Randomization beats determinism because caribou ALSO avoid where they were yesterday.
3. **The Fire Ritual**: Locals burn certain fields annually. Seems destructive. Actually prevents larger fires and returns nutrients to soil.
4. **The Alabama Scenario**: A section where "the locals" are modern Americans with traditions YOU think are silly (tipping, saying "bless you," not splitting the check). Some of these encode real social wisdom.

#### Rationality vs. Tradition Tracker
- Every time you override a tradition with reason, your Rationality Meter goes up and Cultural Knowledge stays low
- Every time you follow a tradition you don't understand, Cultural Knowledge goes up
- Survival probability correlates with Cultural Knowledge, NOT Rationality
- This is the uncomfortable lesson

#### Visual Notes
- Lush, detailed natural environment — greens, earth tones
- The locals' village is warm and inviting
- Your "rational" camp is efficient but sterile
- Illness is shown as creeping grey/green corruption on the screen edges

---

## LEVEL 8: ALL IN ALL, ANOTHER BRICK IN THE MOTTE
**File**: `js/levels/level08-motte-bailey.js`

### Implementation Plan

**Genre**: Debate Strategy / Castle Defense Hybrid
**Camera**: Split — castle cross-section (left), debate arena (right)
**Duration**: ~7-9 minutes

#### The Castle
- Literal motte-and-bailey castle shown in cross-section
- **Motte** (hilltop keep): Small, defensible. Can hold 3 claims max.
- **Bailey** (courtyard): Large, productive. Can hold 10 claims. But vulnerable.
- Claims are represented as banners/flags on the castle.

#### Claims System
- You draft claims by combining a **Topic** + **Strength**:
  - Weak claim: "Some aspects of gender are socially influenced" (very defensible, low impact)
  - Strong claim: "Gender is entirely a social construct" (high impact, hard to defend)
- Strong claims go in the bailey. They generate "Influence Points" (the currency).
- Weak claims go in the motte. They survive attacks.

#### Debate Rounds
- Opponents appear and attack a specific claim with an argument
- You have 10 seconds to respond:
  - **Defend**: Try to justify the claim as stated. Success = big points. Failure = claim destroyed + credibility loss.
  - **Retreat**: Swap the attacked claim for your motte version. Claim survives but opponent marks you with a "Motte-and-Bailey" flag. 3 flags = credibility collapse.
  - **Concede**: Remove the claim. Lose influence but gain "Intellectual Honesty" (IH) points.

#### The Mirror Match
- In phase 2, opponents use the SAME tactic against you
- You must identify THEIR motte-and-bailey to attack effectively
- "That's a motte!" button — click it when they retreat. If correct, their credibility drops.

#### The Honest Castle (Hard Mode Win)
- If you build a castle where ALL claims are the same in motte and bailey (fully defensible AND fully meant), the castle is tiny but impregnable
- This is hard — low influence generation — but earns maximum IH and the level's insight

#### Key Debate Topics (ripped from the essay)
- Religion: "God heals the sick" ↔ "There is beauty in the universe"
- Feminism: "All these specific policies" ↔ "Women deserve equal rights"
- Postmodernism: "There is no objective reality" ↔ "Cultural context matters"

#### Visual Notes
- Medieval aesthetic meets debate stage
- Claims are literal banners with text
- Retreating to the motte: animated drawbridge raising, claims physically moving uphill
- Credibility shown as structural integrity of castle walls
- When the castle collapses (game over), it's dramatic — stones tumbling, banners burning

---

## LEVEL 9: CONFLICT VS. MISTAKE
**File**: `js/levels/level09-conflict-mistake.js`

### Implementation Plan

**Genre**: Dual-Mode Political Strategy
**Camera**: Map view (like a simplified Risk/Diplomacy board)
**Duration**: ~10-12 minutes (effectively two shorter games)

#### The Setup
- A political crisis: healthcare reform
- 5 factions with different interests: Hospitals, Insurance, Patients, Government, Pharma
- The same scenario plays TWICE with different lenses

#### Mistake Mode (First Playthrough)
- **UI**: Clean, analytical. Think spreadsheet + debate podium.
- **Win condition**: Find the optimal policy (exists, but hard to reach)
- **Tools**: Research (reveals data), Debate (persuade with evidence), Compromise (find middle ground), Expert Consultation
- **Opponents**: Wrong but well-meaning. Can be persuaded with enough evidence.
- **Loss condition**: Fail to find consensus in time (the problem worsens)

#### Conflict Mode (Second Playthrough)
- SAME scenario, same factions
- **UI**: Dark, tactical. Think war room.
- **Win condition**: Your chosen faction controls the outcome
- **Tools**: Coalition building, Resource leverage, Strategic communication (spin), Institutional capture
- **Opponents**: Rational actors serving their interests. Evidence doesn't persuade them — power does.
- **Loss condition**: Your faction is outmaneuvered

#### The Revelation
- After both playthroughs, the game overlays the two
- Some decisions were genuinely mistake-type (coordination problem, everyone benefits from solution)
- Some were genuinely conflict-type (zero-sum, someone must lose)
- The player's performance in each mode reveals their default worldview

#### The Trap Mechanic
- In Mistake Mode: one faction is actually acting in bad faith. Treating them as mistaken = you get exploited.
- In Conflict Mode: one faction genuinely just wants to help. Treating them as adversary = you lose an ally.
- The challenge: knowing when to switch frames

#### Visual Notes
- Mistake Mode: bright, academic, whiteboards and graphs
- Conflict Mode: dim, strategic, red lighting and chess pieces
- Transition between modes is dramatic — same room, different lighting
- Overlay scene: both modes shown as transparent layers atop each other

---

## LEVEL 10: SSRIs — MUCH MORE THAN YOU WANTED TO KNOW
**File**: `js/levels/level10-ssri.js`

### Implementation Plan

**Genre**: Internal Landscape Puzzle / Atmospheric Exploration
**Camera**: Side-scrolling through abstract brain architecture
**Duration**: ~7-9 minutes

#### The Landscape
- You navigate INSIDE a brain rendered as an abstract landscape
- Serotonin receptors are structures (towers with keyholes)
- Serotonin molecules are floating golden orbs
- Reuptake transporters are vacuum-like structures that suck molecules back
- The world has "weather" representing mood: grey skies, heavy rain, muted colors

#### The Weight
- Movement is heavy. Elua moves slower than any other level. Jumping is low. Colors are muted.
- This is NOT a bug. This is the level communicating depression through mechanics.
- The player should feel: "This is hard. Everything takes more effort."

#### The SSRI Mechanic
- Pills appear. Taking one doesn't create serotonin — it blocks reuptake transporters.
- Mechanically: the vacuum structures slow down. Serotonin stays in the gaps longer.
- The effect is NOT IMMEDIATE. You take the pill and... nothing happens for several in-game "days."
- Gradually, the weather shifts. Not to sunshine — to lighter grey. Movement becomes slightly less heavy.

#### The Effect Size Visualization
- A HAM-D scale (depression score) is always visible
- The SSRI moves it by ~3 points on a 52-point scale
- The game explicitly shows: "This is an effect size of 0.3 standard deviations"
- For the severely depressed starting state, this small shift crosses a meaningful threshold
- For a mildly depressed state, it's barely perceptible

#### Irving Kirsch Boss Fight
- A spectral figure appears: "The Associate Director of the Program for Placebo Studies"
- He argues that the entire landscape is illusory — it's just placebo
- You must navigate while he removes structures ("These aren't real effects")
- The counter-argument plays out through gameplay: even accounting for placebo, the landscape IS slightly better

#### Individual Variation (Per-Playthrough Randomization)
- Each playthrough randomly assigns an "SSRI response type":
  - **Strong responder** (30%): Weather clears significantly. Movement normalizes. Music returns.
  - **Moderate responder** (40%): Slight improvement. The canonical 0.3 SD.
  - **Non-responder** (20%): Nothing happens. The MAOI option becomes available (more effective, but now cheese/chocolate/beer are hazards in the landscape).
  - **Side effects dominant** (10%): Some improvement but new obstacles appear (emotional blunting = colors wash out even more; weight gain = movement even slower temporarily)

#### The Ending
- You reach a door. Not a golden door — a plain one. You open it. Grey light.
- Text: *"This medication has an effect size of approximately 0.3. You are slightly better. That slight improvement may be the difference between living and not living. That is enough."*
- Elua's glow returns, but softly. Not triumph. Just... continuation.

#### Visual Notes
- The most restrained level visually. Greys, muted blues, no saturated colors until improvement begins
- Serotonin molecules are the only warm color (faint gold)
- The "weather" system is central: cloud density, rain intensity, light level all map to depression score
- The MAOI section has literal cheese, chocolate, and beer as environmental hazards (funny but real)
- Sound design: start with near-silence, very slowly introduce ambient tones as the SSRI takes effect

---

## CROSS-LEVEL SYSTEMS TO BUILD FIRST

### Priority Order for Framework
1. **Game loop & canvas manager** (engine.js) — requestAnimationFrame, delta time, input events
2. **Scene/state manager** — title screen, level select, in-level, transitions
3. **Elua sprite & state** (protagonist.js) — rendering, persistent state, scar system
4. **Save/load** (save.js) — LocalStorage with version migration
5. **Audio manager** — Web Audio API wrapper, procedural ambient, crossfades
6. **Level module interface** — standard API each level implements
7. **Insight collection UI** — the 10 collectible quotes, display overlay
8. **Transition system** — fade to black, quote display between levels

### The Final Confrontation (Post-Level 10)
- Elua faces Moloch one last time in a void
- Each collected insight manifests as a shield/weapon
- It's not a combat — it's a *coordination*
- If all 10 insights are collected AND humanity > 50: Elua summons a coalition that makes Moloch pause
- The pause is enough. Not victory. Just enough space for something beautiful to exist.
- Final quote: *"I am a transhumanist because I do not have enough hubris not to try to kill God."*

---

## IMPLEMENTATION NOTES PER LEVEL

| Level | Estimated Complexity | Key Technical Challenge | Can Prototype Quickly? |
|-------|---------------------|------------------------|----------------------|
| 1. Moloch | High | Hex grid, building sim, AI corruption | Medium (core loop is clear) |
| 2. Outgroup | Medium | Social simulation, belief system | Yes (mostly UI/logic) |
| 3. Toxoplasma | Medium | Force-directed graph, propagation sim | Yes (well-defined algorithm) |
| 4. Control Group | High | Statistical visualization, experiment sim | Medium (lots of UI states) |
| 5. Commensurable | Medium | Resource management, scrolling timeline | Yes (classic game loop) |
| 6. Talents | Medium-High | RPG mechanics, hidden stat system | Medium (needs content) |
| 7. Secret Success | High | Survival mechanics, many interconnected systems | No (most systems needed) |
| 8. Motte-Bailey | Medium | Debate AI, claim system, castle rendering | Yes (turn-based = simpler) |
| 9. Conflict vs. Mistake | High | Dual-mode gameplay, same scenario twice | No (effectively 2 games) |
| 10. SSRIs | Medium | Atmospheric rendering, weather system, mood mechanics | Yes (focus on feel) |

---

*Document Version: 1.0*
*Companion to: ssc_game_design.md*
*For: Claude Code Implementation*
