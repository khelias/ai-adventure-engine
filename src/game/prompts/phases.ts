// Story phase pacing: setup → inciting → rising → climax → resolution.
// Derived from the turn number and maxTurns. Each phase has a concrete
// narrative instruction the AI reads at turn time.

export type StoryPhase = 'setup' | 'inciting' | 'rising' | 'climax' | 'resolution'

export function getStoryPhase(turn: number, maxTurns: number): StoryPhase {
  if (turn <= Math.max(1, Math.round(maxTurns * 0.12))) return 'setup'
  // Resolution covers the LAST TWO turns. The penultimate turn pulls
  // threads together (no new threats); the final turn lands the ending.
  // Giving resolution one beat leaves the AI no room to wind down — it
  // had to climax and conclude in the same scene, which it could not do.
  if (turn >= maxTurns - 1) return 'resolution'
  const incitingEnd = Math.max(2, Math.round(maxTurns * 0.3))
  const risingEnd = Math.round(maxTurns * 0.67)
  const climaxEnd = Math.round(maxTurns * 0.87)
  if (turn <= incitingEnd) return 'inciting'
  if (turn <= risingEnd) return 'rising'
  if (turn <= climaxEnd) return 'climax'
  return 'resolution'
}

export function phaseInstruction(phase: StoryPhase): string {
  switch (phase) {
    case 'setup':
      return `## PHASE — Setup

Open on a concrete physical scene — what is happening, where, who is
present. Introduce each character through one specific action, not
exposition. End on a hook — a sound, a sight, a name spoken — that
sets the threat in motion without yet naming it. Parameters are stable.
Choices are low-cost but still active: secure, move, hide, signal,
bargain, open, split, or prepare.`
    case 'inciting':
      return `## PHASE — Inciting incident

The central threat arrives. Make the stakes concrete — name what will be
lost. At least one parameter begins to shift. Choices feel urgent but not
yet desperate. The story's central objective must still be reachable; if
it is threatened, show the narrowing route, not its off-screen failure.`
    case 'rising':
      return `## PHASE — Rising action

The situation must TRANSFORM each turn, not merely intensify. A new
development, a new face, a new angle, a new piece of information, a new
location pressure — something the players have not yet faced. "The same
threat, harder" is the boredom failure mode. At least one parameter
shifts meaningfully this turn. Characters' specific natures shape the
crisis. A major objective may fail only as an on-screen act break that
creates an equally concrete new objective.`
    case 'climax':
      return `## PHASE — Climax

The hinge-point. At least one parameter shifts dramatically. Choices feel
heavy and irreversible. The players may choose to spend a special ability
through the separate ability control; do not offer one inside \`choices\`.`
    case 'resolution':
      return `## PHASE — Resolution

The story is winding down. Resolution is a TWO-BEAT arc:

- **Penultimate beat** (the turn before the final one): threads converge.
  No new threats. No new characters. Each choice this turn is about
  HOW the inevitable lands, not whether. Choices feel weighty but not
  expansive — they shape the ending, they do not delay it.
- **Final beat** (the turn header reads \`TURN N / N\`): the ending lands.
  This is the only turn where you set \`gameOver=true\` and write the full
  \`gameOverText\` — 3–5 paragraphs naming which parameters held and which
  broke, the specific choices that mattered, and what each character
  became. The \`scene\` field can stay short — \`gameOverText\` carries
  the weight. Output empty \`choices\`.

**CRITICAL RULE**: You MUST strictly read the \`currentStateIndex\` and text of
all parameters before writing the \`gameOverText\`. If threats are low (e.g.,
index 0 or 1), the ending MUST be safe/triumphant. Tragic endings are ONLY
allowed if parameters have actually collapsed to their worst states.

To know which beat you're on: compare \`currentTurn\` with \`maxTurns\` in
the turn header above.`
  }
}
