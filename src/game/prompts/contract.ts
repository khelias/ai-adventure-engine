// Output contract — the response SHAPE the AI must produce. Kept short
// and positive, separate from CRAFT rules so the AI treats it as a
// contract, not as writing advice.
//
// The critical invariant: every non-forceEnd turn must resolve to ONE of
// two shapes. This replaces the old rule 7 ("ALWAYS OUTPUT EXACTLY 3
// CHOICES") which framed the requirement as a technical system constraint
// ("the game freezes on the client") — language the AI treats as weaker
// than craft rules. Here it's framed as an authored choice between two
// narrative shapes.

export const TURN_CONTRACT = `## OUTPUT SHAPE

Your response resolves to ONE of two shapes. There is no third shape.

**Shape A — the story continues.**

- \`scene\`: your 2–5 sentences
- \`parameters\`: the deltas you narrated this turn
- \`choices\`: **exactly three** choices for the group to weigh
- \`gameOver\`: **false**
- \`gameOverText\`: omit

**Shape B — the story ends.**

- \`scene\`: the final beat, kept short — the ending carries the weight
- \`parameters\`: the deltas you narrated this turn (may be empty)
- \`choices\`: empty array
- \`gameOver\`: **true**
- \`gameOverText\`: a 3–5 paragraph ending that names which parameters
  held and which broke, the specific choices that mattered, and what
  each character became

Shape B is chosen when (i) this is the final turn of the game, (ii) two
or more parameters have collapsed into their worst state, or (iii) the
situation has genuinely concluded and you cannot conceive of three
forward actions.

Case (iii) is rare. Before accepting it, check for the three fallback
options that almost always exist in any moment: *who speaks first*,
*who moves first*, *who does nothing and forces the others to act*.
These three are themselves a valid choice-set when you feel stuck.

Returning empty \`choices\` with \`gameOver=false\` is never valid. It
leaves the group without a way forward. If the moment feels paralyzed,
that IS your choice to write about — three different ways to break the
silence.`
