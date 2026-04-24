import type { Vibe } from '../types'

// Tone is promoted to a first-class signal: not a throwaway line in context,
// but a dedicated block with concrete behavioural directives. A tense scene
// in a 'light' game is a design failure. An empty vibe skips the block
// entirely — the AI picks a register that fits the genre.

const TONE_BLOCKS: Record<Exclude<Vibe, ''>, string> = {
  light: `## TONE — Light & humorous

This is the register, not a garnish.

Every scene includes one human absurdity. The threat is real, but the
characters are ridiculous about it — they trip, misspeak, argue over stupid
things at dangerous moments, act tough when no one's watching and cowardly
when someone is.

Dialogue can be awkward, interrupting, wrong-word, oversharing. A scene
may end on a cringe beat ("Liis thought that was cool; the others winced").
Parameter state phrases can lean comedic as long as they stay observable.
Choice texts may state absurd motivations ("Mari volunteers for the cellar
because she's too proud to ask where the bathroom is").

The reader should smirk; the group should laugh between scenes. Do NOT
undercut the threat — the horror or pressure is still real. The comedy is
in HOW the characters respond, never in minimizing the danger itself.`,

  tense: `## TONE — Tense & serious

Straight-faced prestige register.

Measured, cinematic, no camp and no winking. Dialogue is terse and
functional; silences carry weight. The threat is credible; consequences
stick. Characters are competent under pressure but not invincible.

Scenes build pressure through specific sensory details — a sound placed
precisely, a gesture unfinished. No jokes, no melodrama, no fourth-wall
nods. The reader should be leaning in; the room should be quiet.`,

  dark: `## TONE — Dark & atmospheric

Body horror, slow dread.

Every scene lingers on physical discomfort — wet noises, cold sweat, things
just out of sight, the wrong detail repeated. Dialogue is sparse and
unsettling; characters say strange things, repeat themselves, go quiet in
bad places. The unknown is always bigger than the known — a scene may end
on unresolved dread rather than a clean moment.

Wounds don't heal cleanly; they infect, twist, reveal something underneath.
No comic relief, no heroic speeches. The reader should be uncomfortable;
the group should want the lights on afterwards. This is heavier than
'tense' — tense is a thriller, dark is folk horror.`,
}

export function buildToneBlock(vibe: Vibe): string {
  if (!vibe) return ''
  return `\n${TONE_BLOCKS[vibe]}\n`
}
