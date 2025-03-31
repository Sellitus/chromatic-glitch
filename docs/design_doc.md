# CHROMATIC GLITCH: THE UNKNOWN
## Comprehensive Game Design Document (Expanded Edition)

---

# SECTION I: CORE SYSTEMS ARCHITECTURE

## A. FUNDAMENTAL GAMEPLAY STRUCTURE

**Game Identity:** "Chromatic Glitch: The Unknown" is a narrative-driven survival management game set in the collapsing pre-Hispanic Upano Valley civilization. As the Soul Singer, you provide musical palliative care to those suffering from the incurable Ash-Fever epidemic.

**Core Loop Structure:**
1. **Management Phase** (Non-Combat): Assess patient queue, manage resources, perform world actions
2. **Resonance Ritual Phase** (Combat): Perform musical rituals to comfort patients using cards and dice
3. **Cycle Resolution Phase**: World state updates, timers advance, consequences manifest
4. **Progressive Deterioration**: Game gradually increases in difficulty through environmental decay, increased disease severity, resource scarcity

---

# SECTION II: PATIENT SYSTEM & DISEASE PROGRESSION

## A. PATIENT GENERATION MECHANICS

**Patient Spawning Protocol:**
- Each dawn cycle: 1-3 new patients arrive (weighted probability: 40% for 1, 40% for 2, 20% for 3)
- Maximum patients in queue: 8 (expandable through Sanctuary upgrades)
- When queue is full: New patients are turned away (increasing community distrust and player strain)

**Patient Attributes (Generated on Spawn):**
1. **Name & Background:** Randomly generated from cultural pool (400+ possibilities)
2. **Portrait:** Procedurally combined from base portrait + disease overlay system (showing symptoms)
3. **Age Category:** Child (15%), Adult (65%), Elder (20%) - affects survival timer and difficulty
4. **Social Role:** Craftsperson, Farmer, Elder, Healer, Warrior, etc. (affects narrative outcomes)
5. **Survival Timer:** Randomized days remaining based on formula:
   - Base Value: 2-6 days (weighted RNG)
   - Modified by Age: Children/Elders have 0.8x multiplier
   - Modified by Disease State: Severe manifestations reduce timer by 0.7x
   - Results in actual range of 1-6 days before death

**Disease Manifestation Profile:**
1. **Severity Level:** Mild (30%), Moderate (40%), Severe (30%)
   - Affects Disease Entity HP (30-80 base HP)
   - Determines attack patterns and intensity
   
2. **Primary Symptom Cluster:** (Determines combat behavior pattern)
   - **Fever-Terror:** High damage, delirium effects
   - **Skin Ablaze:** DOT damage, defensive buffs
   - **Lost Whispers:** Disruptive effects, dice manipulation
   - **Soul Flicker:** Spirit Strain amplification, defensive
   - **Bone Weep:** High defense, steady damage
   
3. **Visual Representation:**
   - Progressive disease visual effects on patient portrait
   - Symptom-specific animations and color schemes
   - UI timer indicator shows time remaining via:
     * Withering flower petals
     * Draining hourglass
     * Fading portrait saturation

## B. PATIENT TIMER SYSTEM

**Timer Mechanics:**
- Each patient has a hidden "Health Score" (100-300 points)
- Disease reduces Health Score by 20-50 points per day (severity dependent)
- Failed Rituals accelerate Health Score loss
- Successful Rituals may temporarily pause Health Score loss
- Death occurs when Health Score reaches zero

**Visual Representation:**
- Health Score translated to Days Remaining (visible to player)
- Timer updates after each daily action
- Visual indicators change as timer approaches zero:
  * 4-6 days: Normal portrait, soft border glow
  * 2-3 days: Increased symptom visuals, flickering border
  * 1 day: Severe symptom visuals, pulsing red border
  * 0 days: Death animation, portrait fades to ash

**Timer Modifiers:**
- **Age Impact:** Children/Elders have faster timer progression
- **Sanctuary Upgrades:** Can slow timer progression by 10-15%
- **Medical Supplies:** Can temporarily pause timer for 1 day when used
- **Successful Rituals:** High success (Full House+) temporarily pauses timer
- **Community Events:** Random events can accelerate or rarely slow timers

---

# SECTION III: COMBAT GAMEPLAY SYSTEM (THE RESONANCE RITUAL)

## A. RITUAL INITIALIZATION

**Combat Entry Sequence:**
1. **Patient Selection**: Choose patient from the queue
2. **Pre-Ritual Preparation**: Option to:
   - Use a Medical Item (if available)
   - Perform Brief Meditation (small Spirit Strain reduction)
   - Review Patient History (reveals disease attack pattern)
3. **Ritual Environment Generation**:
   - Environment reflects time of day and disease state
   - Weather conditions affect available dice bonuses
   - Physical location determines background visuals

**Combat Interface Layout:**
- **Left Panel**: Patient information, portrait (dynamically updates), symptom display, timer
- **Center Panel**: Disease entity visualization, intent indicators, attack animations
- **Right Panel**: Player's hand, dice area, energy meter, strain meter
- **Lower Panel**: Deck, discard pile, available actions
- **Upper Panel**: Turn counter, time of day, weather effects

## B. TURN STRUCTURE & MECHANICS

**Player Turn Structure:**
1. **Initialization Phase:**
   - Draw hand (5 cards standard)
   - Receive 3 Spirit Energy
   - Roll 5 Resonance Stones (dice)
   
2. **Action Phase:** (Can perform in any order until energy depleted)
   - Play Cards (using Spirit Energy)
   - Manipulate Dice (limited rerolls/locks)
   - Use Special Abilities (if available)
   - End Turn (discard remaining cards)
   
3. **Resolution Phase:**
   - Apply all card effects
   - Check for dice combinations (poker hands)
   - Apply combination effects
   - Update Spirit Strain
   - Trigger any end-of-turn effects

**Disease Turn Structure:**
1. **Intent Resolution:** Execute previously indicated action
2. **Intent Selection:** Choose next action (visually indicated to player)
3. **Status Effect Updates:** Apply/remove any ongoing effects
4. **Special Trigger Check:** Evaluate conditions for special actions

## C. CARD SYSTEM (MUSICAL PATTERNS)

**Deck Construction:**
- Starting deck: 15 basic cards (balanced distribution)
- Maximum deck size: 40 cards
- Minimum deck size: 20 cards
- Card acquisition: Rewards, events, crafting, discoveries

**Card Categories:**
1. **Melody Cards (Offensive):** 
   - Deal damage to disease entity
   - Energy costs: 0-3
   - Examples:
     * *Soothing Whisper* (0 Energy): Deal 4 damage
     * *Rising Tone* (1 Energy): Deal 7 damage
     * *Drum Flourish* (2 Energy): Deal 12 damage
     * *Ancestral Chorus* (3 Energy): Deal 18 damage, draw a card

2. **Harmony Cards (Defensive):**
   - Protect patient from damage
   - Energy costs: 0-3
   - Examples:
     * *Minor Shield* (0 Energy): Apply 3 Block to patient
     * *Pain Barrier* (1 Energy): Apply 6 Block to patient
     * *Tranquil Sphere* (2 Energy): Apply 10 Block to patient
     * *Ancestral Embrace* (3 Energy): Apply 15 Block, heal 3 HP

3. **Rhythm Cards (Utility):**
   - Manipulate dice or add effects
   - Energy costs: 0-3
   - Examples:
     * *Gentle Tap* (0 Energy): Reroll 1 die
     * *Pattern Shift* (1 Energy): Change 1 die to any value
     * *Echo Chamber* (2 Energy): Duplicate 1 die value to another die
     * *Resonant Cycle* (3 Energy): Reroll all dice, +2 to all values

4. **Resonance Cards (Rare/Powerful):**
   - Unique powerful effects
   - Energy costs: 1-3
   - Examples:
     * *Ancestral Memory* (1 Energy): Copy effect of last played card
     * *Disease Binding* (2 Energy): Disease skips next attack
     * *Soul Synchronization* (3 Energy): Double all dice effects this turn

**Card Rarity Distribution:**
- Common: 60% (Basic effects, consistent performance)
- Uncommon: 30% (Moderate effects, interesting synergies)
- Rare: 8% (Powerful effects, unique mechanics)
- Legendary: 2% (Game-changing effects, story significance)

**Card Upgrade System:**
- Cards can be upgraded through Meditation (non-combat action)
- Each card has three potential upgrade paths:
  * **Potency Path**: Increases raw numerical effect
  * **Efficiency Path**: Reduces energy cost or adds draw
  * **Synergy Path**: Adds interactions with specific dice values

## D. DICE SYSTEM (RESONANCE STONES)

**Basic Dice Mechanics:**
- Standard roll: 5 six-sided dice (1-6 values)
- Dice represent the chaotic/ordered nature of sound patterns
- Values directly influence card effects (e.g., damage multiplier)
- Poker-hand combinations trigger powerful effects

**Dice Manipulation:**
- **Reroll**: Standard action, can reroll selected dice once per turn
- **Lock**: Preserve specific dice between turns (costs 1 Spirit Energy)
- **Transmute**: Change die value (rare ability from specific cards)
- **Sacrifice**: Remove die from pool to trigger special effect

**Poker-Hand Combinations & Effects:**
1. **Pair (2 matching dice):**
   - Effect: +25% to next card's effect
   - Visual: Subtle harmonic glow around matched dice
   
2. **Two Pair (2 sets of matching dice):**
   - Effect: +25% to next two cards' effects
   - Visual: Connected harmonic strings between pairs
   
3. **Three of a Kind (3 matching dice):**
   - Effect: +50% to next card's effect, reduce Strain by 3
   - Visual: Triangular resonance pattern connecting dice
   
4. **Straight (5 sequential dice):**
   - Effect: Draw 2 cards immediately, gain 1 Spirit Energy
   - Visual: Linear flow effect connecting dice in sequence
   
5. **Full House (3 of one number, 2 of another):**
   - Effect: Disease skips next attack, heal patient for 10% max HP
   - Visual: Complex geometric pattern connecting all dice
   
6. **Four of a Kind (4 matching dice):**
   - Effect: Double the effect of next played card, reduce Strain by 5
   - Visual: Square resonance pattern with intense glow
   
7. **Five of a Kind (all 5 dice match):**
   - Effect: "Perfect Resonance" - Deal 30% of disease max HP immediately
   - Visual: Explosive harmonic visualization, screen-wide effect

**Resonance Stone Types:** (Unlockable as game progresses)
1. **Standard Stones**: Balanced 1-6 distribution
2. **Harmony Stones**: Higher chance of pairs (values 2-5 more common)
3. **Rhythm Stones**: Better for straights (more sequential values)
4. **Ancestral Stones**: Can roll special faces (symbols with unique effects)

## E. SPIRIT STRAIN SYSTEM

**Strain Accumulation:**
- Starting Strain: 0/100
- Natural accumulation: +1-3 per combat turn
- Failed treatments: +5-15 Strain (severity dependent)
- Patient deaths: +10-20 Strain (relationship dependent)
- Witnessed suffering: +3-8 Strain (event dependent)

**Strain Effects:**
- 0-25%: No negative effects
- 26-50%: Minor effects (-1 card draw, slight visual distortion)
- 51-75%: Moderate effects (-1 dice, -1 card draw, visual/audio distortion)
- 76-99%: Severe effects (-2 dice, -2 card draw, major distortions, random card effects)
- 100%: Collapse (forced retreat from current ritual, patient dies, major narrative event)

**Strain Reduction Methods:**
- Rest Action: -15-25% (time of day dependent)
- Meditation: -10-15% (location dependent)
- Personal Ritual: -10% + dice benefit
- Specific cards: -2-5 per use
- Special locations: -5-10% (rare discoveries)
- Rare consumables: -10-30% (very limited supply)

**Strain Visualization:**
- UI Element: Distinctive meter with thresholds clearly marked
- Character Effects: Player character portrait gradually shows exhaustion
- Environmental Effects: Vision blurs/distorts at high Strain
- Audio Effects: Dissonant tones emerge at high Strain levels

## F. DISEASE AI & BEHAVIOR PATTERNS

**Disease Entity Attributes:**
- HP: 30-80 (based on severity)
- Attack Power: 5-15 damage per attack
- Defense: 0-5 damage reduction
- Special Abilities: Based on symptom cluster

**Attack Patterns:** (Always telegraphed one turn ahead)
1. **Basic Attacks:** Direct damage to patient
2. **Weakening Effects:** Reduce effectiveness of specific card types
3. **Spreading Symptoms:** Self-buff, increasing damage or defense
4. **Strain Amplification:** Increase player's Spirit Strain
5. **Corrupted Resonance:** Manipulate player's dice negatively

**Symptom Cluster Specializations:**
- **Fever-Terror:** Emphasis on high damage attacks, occasional delirium (forced card discard)
- **Skin Ablaze:** Focus on DOT effects and self-protection
- **Lost Whispers:** Specializes in disrupting player's dice and cards
- **Soul Flicker:** Rapidly increases Spirit Strain, moderate damage
- **Bone Weep:** High defense, consistent moderate damage

**Difficulty Scaling:**
- Early Game: Simpler patterns, telegraphed attacks, lower stats
- Mid Game: Introduces combo attacks, status effects
- Late Game: Multi-phase encounters, adaptive behaviors, sacrifice mechanics

## G. COMBAT REWARDS & OUTCOMES

**Victory Conditions & Rewards:**
- Disease HP reduced to zero
- Patient temporarily stabilized (timer paused for 1-2 days)
- Rewards based on performance:
  * Standard: 1 new card choice, minor resource, -5-10% Strain
  * Excellent (no patient damage): Additional card choice, -15% Strain
  * Perfect (no damage, high combos): Rare card, special resource, -20% Strain

**Defeat Conditions & Consequences:**
- Patient HP reaches zero OR player Strain reaches 100%
- Patient dies immediately
- Consequences:
  * +15-25% Spirit Strain
  * Community trust decrease
  * Potential permanent loss of specific card
  * Narrative consequence (patient-dependent)

**Partial Success:**
- Disease HP reduced below 50% but not defeated
- Patient's timer slowed but not paused
- Mixed rewards/consequences:
  * Minor resource reward
  * No Strain reduction
  * Small narrative acknowledgment

---

# SECTION IV: NON-COMBAT GAMEPLAY SYSTEM

## A. DAILY ACTION SYSTEM

**Time Structure:**
- Each day divided into 3 time periods: Dawn, Day, Dusk
- Each time period allows ONE major action
- Night period is automatic (passive healing, strain accumulation, potential events)
- Full day-night cycle progresses all timers by 1 day

**Action Selection Interface:**
- Map-based navigation between 5 key locations
- Location-specific action menus
- Time period indicator shows current phase
- Patient queue always visible (minimized) during selection

**Action Categories & Locations:**

1. **The Sick Hut / Abandoned Plaza:**
   - Primary location for patient interaction
   - Available Actions:
     * Treat Patient (enters Resonance Ritual combat)
     * Organize Supplies (+10% treatment effectiveness next day)
     * Expand Treatment Area (permanent upgrade, increases queue size)
     * Counsel Families (reputation gain, minor resource gain)

2. **Sacred Grove:**
   - Focus on personal recovery and spiritual connection
   - Available Actions:
     * Deep Rest (major Strain reduction -20-30%)
     * Meditate (moderate Strain reduction -10-15%, upgrade 1-2 cards)
     * Commune with Ancestors (narrative event, potential special reward)
     * Harvest Medicinal Plants (gather resources for items)

3. **Elder's Dwelling:**
   - Knowledge and community connection
   - Available Actions:
     * Study Ancient Texts (learn new cards, narrative insights)
     * Train Assistant (unlock passive ability for 3 days)
     * Listen to Elders (narrative event, major decision point)
     * Craft Medical Supplies (create items from resources)

4. **River's Edge:**
   - Resource gathering and reflection
   - Available Actions:
     * Collect Sacred Waters (rare resources, minor Strain reduction)
     * Fish for Food (sustenance resources, passive health regeneration)
     * Perform Cleansing Ritual (moderate Strain reduction, dice blessing)
     * Watch the Flow (narrative moment, insight into future events)

5. **Abandoned Plaza / Outskirts:**
   - Risk/reward exploration
   - Available Actions:
     * Scavenge for Supplies (random resources, risk of Strain)
     * Explore Ruins (discover rare items, high risk/reward)
     * Witness Collapse (powerful narrative moment, high Strain, special reward)
     * Search for Survivors (potential new assistant or patient)

## B. RESOURCE MANAGEMENT SYSTEM

**Resource Categories:**

1. **Medicinal Resources:**
   - **Sacred Herbs**: Base component for healing items
   - **River Clay**: Component for poultices and treatments
   - **Fungal Spores**: Rare component for powerful remedies
   - **Crystal Fragments**: Very rare, used for spiritual items

2. **Survival Resources:**
   - **Food**: Prevents hunger debuff, minor passive healing
   - **Clean Water**: Required for brewing remedies, prevents thirst
   - **Firewood**: Keeps the Sick Hut operational, ambient healing
   - **Cloth**: Used for bandages and ritual components

3. **Spiritual Resources:**
   - **Memory Fragments**: Used to learn/upgrade specific cards
   - **Ancestral Tokens**: Rare currency for special upgrades
   - **Resonant Crystals**: Modify dice or unlock special abilities
   - **Song Fragments**: Extremely rare, unlocks legendary cards

**Resource Storage & Limits:**
- Each resource type has storage capacity (initially limited)
- Upgradeable through specific actions
- Stockpiling provides buffs (e.g., excess Food improves healing)
- Visual UI shows current amounts and storage capacity

**Resource Acquisition Methods:**
- Location-specific gathering actions
- Rewards from successful treatments
- Scavenging with risk/reward balance
- Trading with rare traveling merchants
- Community gifts (if reputation is high)

## C. SANCTUARY DEVELOPMENT SYSTEM

**Sanctuary Overview:**
- The Sick Hut serves as the player's base of operations
- Gradually upgradeable through resources and actions
- Visual changes reflect improvements
- Provides passive and active bonuses

**Upgrade Paths:**

1. **Treatment Capacity:**
   - Level 1: 5 patient maximum
   - Level 2: 6 patient maximum, +5% treatment effectiveness
   - Level 3: 7 patient maximum, +10% treatment effectiveness
   - Level 4: 8 patient maximum, +15% treatment effectiveness

2. **Medicinal Garden:**
   - Level 1: Passive generation of 1 Herb per day
   - Level 2: 2 Herbs per day, unlock basic poultices
   - Level 3: 3 Herbs per day, improved poultice effectiveness
   - Level 4: 4 Herbs per day, rare herb chance, special remedies

3. **Sacred Space:**
   - Level 1: Basic rituals available
   - Level 2: -5% Strain cost during all rituals
   - Level 3: Dice blessing (one free reroll per combat)
   - Level 4: "Ancestral Harmony" (starting poker hand bonus in combat)

4. **Knowledge Corner:**
   - Level 1: Card inspection and basic upgrades
   - Level 2: Advanced card upgrades, 1 free card per week
   - Level 3: Deck save/load presets, card transformation
   - Level 4: Legendary card crafting, perfect upgrade chance

**Upgrade Costs:**
- Scaling resource requirements (increasingly rare components)
- Time investment (certain upgrades require multiple actions)
- Occasionally requires community support (reputation-dependent)
- Some upgrades require narrative milestones

## D. CRAFTING & ITEM SYSTEM

**Craftable Item Categories:**

1. **Medical Items:** (Used during combat)
   - **Herbal Poultice**: Heals patient for 15% HP
   - **Calming Tea**: Reduces next Strain gain by 50%
   - **Sacred Ointment**: Provides 15 Block to patient
   - **Dream Essence**: Manipulate 2 dice to any value

2. **Personal Items:** (Used outside combat)
   - **Meditation Bundle**: Enhanced Strain reduction from Rest
   - **Memory Charm**: Retain 1-2 cards between combats
   - **Ancestral Flute**: Improved dice odds on next 3 combats
   - **Carved Totem**: Permanently enhance specific card type

3. **Community Items:** (Passive effects)
   - **Prayer Flags**: Slows all patient timers by 5%
   - **Communal Fire**: Passive Strain reduction each night
   - **Hope Symbols**: Improves reputation gain
   - **Ancient Wards**: Reduces negative event chance

**Crafting Interface:**
- Recipe-based system with discovered components
- Clear visual representation of required materials
- Preview of resulting item effects
- Crafting occurs at Elder's Dwelling or Sanctuary
- Success chance system for more powerful items

**Item Usage Mechanics:**
- Combat items: Usable once per combat, doesn't consume turn
- Personal items: Activated during non-combat actions
- Community items: Passive effect once installed in Sanctuary
- Item stacking restrictions (max 3 of each type carried)

## E. COMMUNITY & REPUTATION SYSTEM

**Reputation Mechanics:**
- Scale of 0-100 (starts at 50)
- Visible as both numerical value and descriptive state
- Affects available options, dialogue, and community assistance

**Reputation States:**
- 0-20: Distrusted (limited patient queue, hostile interactions)
- 21-40: Suspicious (reduced assistance, challenging conversations)
- 41-60: Accepted (standard options available)
- 61-80: Respected (increased assistance, occasional gifts)
- 81-100: Revered (maximum assistance, special options unlocked)

**Reputation Influences:**
- Success/failure ratio with patients
- Specific narrative choices
- Community-focused actions
- Resource sharing decisions
- Time spent on community vs. personal actions

**Community Assistance:**
- Higher reputation enables:
  * Assistant characters (passive bonuses)
  * Resource donations
  * Slower patient arrival rate (less overwhelming)
  * Special upgrade options
  * Unique narrative branches

---

# SECTION V: NARRATIVE & PROGRESSION SYSTEMS

## A. NARRATIVE STRUCTURE

**Story Arc Framework:**
1. **Introduction**: Establish normal life, initial disease cases
2. **Rising Action**: Disease spreads, community fragmentation begins
3. **Midpoint Crisis**: Major character death, community breakdown
4. **Escalating Collapse**: Widespread devastation, spiritual questions
5. **Climax**: Personal disease confrontation, final choice
6. **Resolution**: Outcome based on player choices and performance

**Narrative Delivery Methods:**
- Patient backgrounds and dialogues
- Environmental storytelling (changing world state)
- Direct narrative vignettes during Witness events
- Dream sequences during Rest actions
- Text/dialogue during key interactions
- Visual storytelling through art progression

**Major Decision Points:**
- 5-7 critical choices that significantly affect narrative branches
- Clearly telegraphed as major decisions
- Affect both mechanical gameplay and story direction
- No clear "right/wrong" answers - focus on personal values
- Consequences visible in world state changes

## B. PROGRESSION SYSTEM

**Player Character Development:**
- No traditional "leveling" - progression through:
  * Expanded card collection (up to 120 unlockable cards)
  * Improved dice collection (12 different Resonance Stone types)
  * Sanctuary upgrades (16 total upgrades across 4 paths)
  * Strain resistance (gradually improves with story progress)
  * Narrative relationship development

**World State Progression:**
- Environment visibly deteriorates through game stages
- Community population decreases
- Available locations change (new areas open, others become inaccessible)
- Resource availability shifts
- Weather patterns become more extreme
- Day/night cycle visual changes reflect spiritual degradation

**Disease Evolution:**
- Early: Simple manifestations, straightforward patterns
- Mid: Complex symptom combinations, unique abilities
- Late: Multi-phase encounters, environmental effects, corruption mechanics

**Game Length & Pacing:**
- Approximately 15-20 hours for main narrative
- Balanced difficulty curve:
  * Early game (hours 1-5): Learning mechanics, manageable pressure
  * Mid game (hours 6-12): Rising challenge, strategic depth required
  * Late game (hours 13-20): Maximum challenge, true mastery needed
- Daily cycle structure provides natural play session boundaries

## C. BALANCE CONSIDERATIONS

**Core Balance Philosophies:**
1. **Meaningful Choices**: No single optimal strategy
2. **Escalating Challenge**: Difficulty increases with player skill
3. **Multiple Paths**: Different viable approaches to success
4. **Recoverable Failure**: Setbacks are significant but not campaign-ending
5. **Resource Tension**: Always slightly insufficient resources for perfect outcomes

**Specific Balance Mechanisms:**
- **Patient Generation**: Algorithm ensures manageable but challenging queue
- **Card Distribution**: Carefully controlled power curve across rarities
- **Dice Probability**: Engineered to make poker hands achievable but not guaranteed
- **Strain Accumulation**: Calculated to create cyclic tension-release pattern
- **Resource Economy**: Closed system with predictable inflow/outflow

**Difficulty Settings:**
- **Storyteller**: Reduced Strain accumulation, slower patient deterioration
- **Healer**: Standard balanced experience (default)
- **Survivor**: Accelerated timers, increased Strain gain, fewer resources
- **Martyr**: Extreme challenge, minimal resources, maximum disease strength

---

# SECTION VI: TECHNICAL & PRESENTATION ELEMENTS

## A. USER INTERFACE DESIGN

**UI Philosophy:**
- Minimal but informative
- Thematically integrated (natural materials, handcrafted appearance)
- Critical information always visible
- Nested detail levels (basic info at glance, details on interaction)

**Key UI Elements:**
1. **Patient Queue**: Visual display of waiting patients with timers
2. **Strain Meter**: Always visible, clear threshold indicators
3. **Time/Day Tracker**: Shows current time period and day number
4. **Resource Display**: Compact icons with numbers, expandable for details
5. **Location Map**: Stylized map for navigation between areas
6. **Action Menu**: Context-sensitive based on location and time
7. **Combat Interface**: Card hand, dice area, energy, combat state

**Accessibility Features:**
- Configurable text size
- High contrast mode
- Colorblind options
- Reduced animation setting
- Difficulty modifications
- Comprehensive tooltips and help system

## B. AUDIO DESIGN SYSTEM

**Adaptive Music System:**
- Layered tracks that respond to:
  * Current Strain level
  * Time of day
  * Location
  * Combat state
  * Narrative tension

**Sound Effect Categories:**
1. **Musical Elements**: Different instruments, voice chants, percussion
2. **Environment**: Location ambience, weather, wildlife
3. **Interface**: Feedback sounds for actions, navigation
4. **Character**: Patient sounds, player character efforts
5. **Combat**: Disease manifestations, card plays, dice rolls
6. **Emotional**: Underlining narrative moments, transitions

**Voice Acting Approach:**
- Minimal voiced dialogue (key narrative moments only)
- Stylized vocalizations for patients and rituals
- Focus on emotional authenticity over quantity

## C. VISUAL STYLE & EFFECTS

**Art Direction:**
- Hand-painted 2D environments
- Expressive character portraits with animation states
- Mystical/realistic fusion for disease entities
- Environmental storytelling through visual degradation
- Limited but impactful animation for key moments

**Visual Effect Systems:**
1. **Musical Manifestations**: Visual representation of sound patterns
2. **Disease Corruption**: Visual distortion effects for symptoms
3. **Spiritual Elements**: Subtle particle effects for rituals
4. **Environmental Changes**: Seasonal, weather, and decay effects
5. **Strain Visualization**: Interface and world distortion at high Strain

---

# SECTION VII: ENDGAME & REPLAYABILITY

## A. THE FINAL RESONANCE (ENDGAME SEQUENCE)

**Trigger Conditions:**
- Narrative progression reaches climax point
- OR Player reaches extremely high cumulative Strain (90%+ sustained)
- OR Random chance increases daily after day 30

**Gameplay Mechanics:**
- Player contracts the Ash-Fever
- Special multi-phase combat against internalized disease
- Unique dice mechanics and card interactions
- Environmental shifts reflecting internal struggle
- Ultimate choice at conclusion (sacrifice vs. preservation)

**Outcome Variations:**
- Victory outcomes (3 variations based on performance and choices)
- Defeat outcomes (2 variations based on player choices)
- Ambiguous endings that prompt player interpretation

## B. POST-COMPLETION CONTENT

**Unlockable Characters:**
1. **The Seedling**: Child survivor with unique growth mechanics
2. **The Whisper**: Elder with enhanced dice manipulation
3. **The Carver**: Focus on artifact creation and passive effects
4. **The Doubled**: Two-character system with unique interactions

**New Game+ Features:**
- Retained cards but increased difficulty
- New narrative branches unavailable in first playthrough
- Alternate perspective on key events
- Hidden areas and interactions
- Challenge modes with special conditions

**Achievement System:**
- Progression milestones
- Gameplay mastery challenges
- Collection completionist goals
- Narrative path discoveries
- Special condition victories

---

# SECTION VIII: PLAYER EXPERIENCE JOURNEY

## A. EARLY GAME EXPERIENCE (HOURS 1-5)

**Tutorial Integration:**
- Organic teaching through guided first cases
- Progressive introduction of mechanics
- Clear feedback on successful technique application
- Safety net mechanics preventing early catastrophic failure

**Early Game Balancing:**
- Limited patient queue (3-5 maximum)
- Slower disease progression
- More plentiful basic resources
- Simplified disease attack patterns
- Higher success probability for dice combinations

**First Major Choice:**
- Significant narrative branch at approximately hour 4
- Clear consequences visible in game state
- Sets tone for weight of future decisions

## B. MID-GAME EXPERIENCE (HOURS 6-12)

**Difficulty Progression:**
- Patient queue grows to capacity
- Resource scarcity becomes meaningful constraint
- Disease entities develop complex attack patterns
- Time management becomes critical
- Strategic deck building becomes necessary for success

**Gameplay Expansion:**
- All locations become accessible
- Full range of craftable items available
- Majority of card types discoverable
- Special dice types begin appearing
- Multiple upgrade paths require prioritization

**Narrative Complexity:**
- Community relationships deepen
- Key character developments and potential losses
- Moral ambiguity in choices increases
- Environmental deterioration becomes pronounced
- Personal strain manifestations affect narrative options

## C. LATE GAME EXPERIENCE (HOURS 13-20)

**Maximum Challenge:**
- Full patient queue with high severity cases
- Resource management requires careful prioritization
- Combat encounters reach maximum complexity
- Time pressure forces difficult triage decisions
- Strain management becomes vital to survival

**Mastery Opportunities:**
- Advanced dice manipulation strategies
- Complex card synergies and combinations
- Deep upgrade paths completion
- Resource optimization techniques
- Risk/reward balancing at highest stakes

**Narrative Convergence:**
- Previous choices manifest significant consequences
- Community state reflects player decisions
- Personal journey reaches emotional crescendo
- Philosophical questions raised explicitly
- Preparation for final narrative and gameplay sequence

---

# CONCLUSION: DESIGN PRINCIPLES & PLAYER JOURNEY

"Chromatic Glitch: The Unknown" is designed to create a deeply emotional, strategically engaging experience that balances:

1. **Mechanical Depth**: Through interlinked systems of cards, dice, resource management and time pressure
2. **Emotional Impact**: Via meaningful choices, atmospheric presentation, and connection to patients
3. **Strategic Mastery**: Allowing players to develop skill in optimization and decision-making
4. **Narrative Weight**: Providing a thought-provoking story about care, loss, and purpose

The core gameplay loop creates tension through the constant pressure of decisions - who to save, when to rest, how to balance personal strain against community needs - while providing satisfaction through mastery of the musical ritual system and meaningful relationship development.

The game is fundamentally about making peace with limitation rather than achieving total victory, creating a unique emotional journey that stays with the player well beyond completion.