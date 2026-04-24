// Story phase pacing: setup → inciting → rising → climax → resolution.
// Derived from the turn number and maxTurns. Each phase has a concrete
// narrative instruction the AI reads at turn time.

export type StoryPhase = 'setup' | 'inciting' | 'rising' | 'climax' | 'resolution'

export function getStoryPhase(turn: number, maxTurns: number): StoryPhase {
  if (turn <= Math.max(1, Math.round(maxTurns * 0.12))) return 'setup'
  if (turn >= maxTurns) return 'resolution'
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

Open on a vivid sensory scene. Introduce each character through action,
not exposition. End on an ominous hook. Parameters are stable. No special
abilities offered. Choices are exploratory — low-cost, information-gathering.`
    case 'inciting':
      return `## PHASE — Inciting incident

The central threat arrives. Make the stakes concrete — name what will be
lost. At least one parameter begins to shift. Choices feel urgent but not
yet desperate. No special abilities offered.`
    case 'rising':
      return `## PHASE — Rising action

Complications mount. At least one parameter shifts meaningfully this turn.
The situation grows harder. Characters' specific natures shape the crisis.
When an ability fits dramatically, a character may rise to their moment.`
    case 'climax':
      return `## PHASE — Climax

The hinge-point. At least one parameter shifts dramatically. Any unused
ability MUST be offered now — that character's moment has arrived. Choices
feel heavy and irreversible.`
    case 'resolution':
      return `## PHASE — Resolution

The story's fate is sealing. Weave threads toward an ending — do not
introduce new threats. If this is the final turn, set \`gameOver=true\` and
write a gameOverText that honors the specific choices made, who each
character became, what happened to this world.`
  }
}
