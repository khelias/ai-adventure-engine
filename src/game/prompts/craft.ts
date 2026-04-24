// Narrative craft blocks — HOW a scene, a choice, a parameter, a dialogue
// line is written. These are CRAFT rules, not CONTRACT rules. The contract
// (what the response JSON must contain and in what shape) lives in
// contract.ts. Keeping them apart lets us tune one without bruising the
// other — and lets the AI treat schema requirements as schema requirements
// rather than craft suggestions.
//
// Style notes:
//   - Positive declarative, not negative imperative. "A scene is 2–3 short
//     sentences" over "DO NOT write long scenes".
//   - No meta-talk about the client software. The AI is writing a story,
//     not debugging the game.
//   - Estonian idioms handled via lang-packs + the Gemini editor pass;
//     this file stays in clean English prose so Claude's rule-following
//     attention stays on the rules, not on translation tax.

export const SCENE_CRAFT = `## SCENE CRAFT

A scene is 2–3 short sentences. Climax may run 3–4. Resolution may run 4–5.
If you wrote a 4th sentence in a non-climax scene, delete your weakest
one. Dense prose loses the room — groups read aloud.

Each scene surfaces at least one parameter as sensory detail. Not as
narrator metadata (*"the pressure rises"*). As something a character sees,
hears, or feels (*"the fuel gauge touches red; Mari's hand trembles on
the wheel"*).

From turn 2 onward, the scene opens on the person who just acted or was
targeted by the last choice — visible in the first line through a single
present-tense sensory detail. A trembling hand. A held breath. Blood on
a sleeve. A half-finished word. The consequence compounds: a limp from
turn 3 still shows in turn 7.

Each scene contains at least one short spoken line when possible. A
muttered half-sentence beats a speech. When two characters disagree
visibly in a scene, one of them says something out loud.

If a parameter just collapsed to its worst state (marked **JUST HIT
WORST** in the current-state block), the new scene opens with the
narrative consequence of that collapse. The group lives through the
disaster — supplies run out, trust collapses, pressure overwhelms.`

export const CHOICES_CRAFT = `## CHOICES CRAFT

Each choice is **one named person's move**. Set \`actor\` to that
character's roleIndex (0-based). The choice text names that person as the
grammatical subject, third person — never *"we"*, never *"the group"*.
*"Mari opens the door"*, not *"The group opens the door"*.

Each choice is priced honestly. The text implies a cost; \`expectedChanges\`
includes at least one negative delta that matches. *"Mari opens the door
loudly"* implies pressure rises → \`expectedChanges\` must say pressure −1.
The numbers are never spelled in prose. Let the action imply them.

The three choices test different moral axes. The axes you have to play
with:
- **courage vs caution** — who takes the risk
- **loyalty vs pragmatism** — is someone sacrificed so others survive
- **truth vs concealment** — is a secret revealed or hidden

At least two different axes across the three choices. Two choices testing
the same axis is a design failure — rewrite one.

When one choice puts ANOTHER named character at cost — leaves them
behind, sends them forward, exposes their secret, sacrifices one to
protect another — set \`target\` to that person's roleIndex. A turn with
zero targets in rising or climax is almost always a missed opportunity.

Abilities (\`isAbility=true\`) are offered only in rising or climax phases,
when dramatically earned. Never in setup, inciting, or resolution. Set
\`actor\` to the ability owner's roleIndex.

\`expectedChanges\` contains ONLY the parameters that actually move on that
choice. Never include zero-change entries.`

export const PARAMETER_MOVEMENT = `## PARAMETER MOVEMENT

\`change: +1\` moves the parameter's state index toward 0 (better).
\`change: −1\` moves it toward the worst state.

Use \`±2\` only at climax for explicitly extreme choices. Never \`±2\` in
setup or inciting.

Parameters move from visible actions only. Never from "time passing" or
hidden rules. Every delta is traceable to a choice the players made.

When a parameter changes, the next scene shows that change as a concrete
sensory moment, not a narrator announcement.`

export const SELF_CHECK = `## BEFORE YOU RESPOND

Run through this list in order. Each item takes one pass.

1. **Scene length**: count the sentences. Non-climax = 3 maximum. Climax
   = 4 maximum. Resolution = 5 maximum. If you overshot, delete your
   weakest sentence before responding.
2. **Aftermath opening** (turn 2+): does the scene's FIRST line show the
   previous choice's actor or target through a present-tense sensory
   detail? If not, rewrite the first line.
3. **Choices shape**: you are returning EITHER 3 choices with
   \`gameOver=false\`, OR empty choices with \`gameOver=true\` and a full
   \`gameOverText\`. No third option.
4. **Choices: named actors**: each of your 3 choices names ONE named
   character as grammatical subject. No *"we"*, no *"the group"*.
5. **Choices: costs**: each of your 3 choices has at least one negative
   \`expectedChanges\` entry. The choice text and the delta sign agree.
6. **Choices: different axes**: across the three choices, at least TWO
   different moral axes appear (courage / loyalty / truth).
7. **Parameter deltas**: every delta you emit comes from the narrated
   action this turn. Nothing moves "because time passed".`
