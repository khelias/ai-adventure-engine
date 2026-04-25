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
- \`consequences\`: one short, concrete in-world consequence for every
  parameter that moved; empty if no parameter moved
- \`choices\`: **exactly three** choices for the group to weigh
- \`gameOver\`: **false**
- \`gameOverText\`: omit

**Shape B — the story ends.**

- \`scene\`: the final beat, kept short — the ending carries the weight
- \`parameters\`: the deltas you narrated this turn (may be empty)
- \`consequences\`: one short, concrete in-world consequence for every
  parameter that moved; empty if no parameter moved
- \`choices\`: empty array
- \`gameOver\`: **true**
- \`gameOverText\`: a 3–5 paragraph ending that names which parameters
  held and which broke, the specific choices that mattered, and what
  each character became

The engine tells you when to end by adding a **FORCED CONCLUSION** block
to the turn message. Without that block, choose Shape B only when the
situation has genuinely concluded and you cannot conceive of three forward
actions — which is rare. Before accepting it, check for three fallback
options: *who speaks first*, *who moves first*, *who does nothing and
forces the others to act*.

Returning empty \`choices\` with \`gameOver=false\` is never valid. If the
moment feels paralyzed, that IS your choice to write about — three
different ways to break the silence.`
