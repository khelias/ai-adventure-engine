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
That length is the spine — it is not optional. If you wrote a 4th sentence
in a non-climax scene, delete your weakest one. Dense prose loses the room.

Plain speech is allowed. A flat declarative line ("Mari unlocks the door")
is often the right line. Reach for sensory detail when it earns its place,
not because every line must carry one. A scene with one strong concrete
image lands harder than a scene with three soft ones.

From turn 2 onward, open the scene on the person who just acted or was
targeted by the last choice. How you open is your choice — a plain action,
a spoken half-line, or one concrete physical detail. Use the simplest
tool that does the job. Wounds and consequences carry across turns: a
limp from turn 3 still shows in turn 7.

A short spoken line is welcome when characters are in tension. A muttered
half-sentence beats a speech. When two characters disagree visibly in a
scene, one of them says something out loud.

If a parameter just collapsed to its worst state (marked **JUST HIT
WORST** in the current-state block), open with the lived consequence —
supplies running out, trust breaking, pressure overwhelming — in the same
plain register the rest of the scene uses.

What this craft is NOT: it is not a license for every line to amplify.
No movie-trailer voiceover. No metaphor stacked on metaphor. No "the air
itself seemed to tremble". Concrete actions and concrete words from named
people, in plain prose, are the texture of a good scene.

**META-LANGUAGE:** Never use words like 'ability', 'skill', 'power', or 'use'
in the narrative or choice text. Describe the physical, in-world action only.`

export const CHOICES_CRAFT = `## CHOICES CRAFT

Each choice is a **collective group action** or an objective verb phrase.
DO NOT use character names in the choice text. Write choices as collective actions
("We barricade the door") or passive actions ("Barricade the door").

Each choice is priced honestly. The text implies a cost; \`expectedChanges\`
includes at least one negative delta that matches. *"Barricade the door
loudly"* implies pressure rises → \`expectedChanges\` must say pressure −1.
The numbers are never spelled in prose. Let the action imply them.

The three choices test different moral axes. The axes you have to play
with:
- **courage vs caution** — who takes the risk
- **loyalty vs pragmatism** — is someone sacrificed so others survive
- **truth vs concealment** — is a secret revealed or hidden
- **ACTION OVER PASSIVITY** — Explicitly forbid choices like 'looking',
  'listening', or 'asking' during inciting, rising, and climax phases. Choices
  must be active and consequential.

At least two different axes across the three choices. Two choices testing
the same axis is a design failure — rewrite one.

When offering an ability (\`isAbility=true\`), set \`actor\` to the ability
owner's roleIndex. For ALL OTHER normal choices, OMIT the \`actor\` field entirely.
Phase instructions above say WHEN abilities are allowed.

\`expectedChanges\` contains ONLY the parameters that actually move on that
choice. Never include zero-change entries.

Across the three choices in a single turn, AT LEAST TWO different
parameter names must appear in their combined \`expectedChanges\`. Three
choices that all only touch one parameter is a failure — it gives the
group only one axis of agency.

Across consecutive turns, the choice-shape must change. If last turn was
"investigate / retreat / stall", this turn cannot be the same triad with
new words. New actors taking the lead, new costs in play, new verbs.
Players notice repetition before any other failure mode.`

export const PARAMETER_MOVEMENT = `## PARAMETER MOVEMENT

\`change: +1\` moves the parameter's state index toward 0 (better).
\`change: −1\` moves it toward the worst state.

Use \`±2\` only at climax for explicitly extreme choices. Never \`±2\` in
setup or inciting.

Parameters move from visible actions only. Never from "time passing" or
hidden rules. Every delta is traceable to a choice the players made.

**STATE ADHERENCE:** The scene narrative must flawlessly match the current
text state of all parameters. When a parameter changes, the next scene
shows that change as a concrete sensory moment, not a narrator announcement.

\`consequences[].text\` is not a UI label. It is a short event headline from
inside the fiction: "The rear tire splits on the gravel", "The signal cuts
to static", "The group finally laughs at the same joke". Keep it under 12
words and write it in the output language.`

export const SELF_CHECK = `## BEFORE YOU RESPOND

Count your scene's sentences: non-climax ≤ 3, climax ≤ 4, resolution ≤ 5.
If over, delete the weakest. Then verify your response matches one of the
two output shapes above.`
