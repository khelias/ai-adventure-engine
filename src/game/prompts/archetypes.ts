// Parameter archetypes drive mechanical variety between stories. At
// story-generation time the AI picks three that fit the story's shape.
// The turn-time narrator sees the archetype tag on each parameter and
// can narrate consequences in the right register (a curse inches, a
// debt pursues, a secret drifts, a resource bleeds).

export const ARCHETYPE_PALETTE = `## ARCHETYPE PALETTE

Each archetype is a distinct kind of pressure a story can put on its
characters. Pick three that fit THIS story — not a fixed formula.

- **resource** — depletes with action, rarely restored. *"Mari's strength",
  "the car's fuel", "Kalev's sobriety"*. Starts full, ends empty.
- **bond** — a named pair or specific relation. *"Mari & Jaan's trust",
  "the marriage", "mother and son"*. Shifts both ways from social and
  moral choices.
- **pressure** — a specific external threat that escalates with events.
  *"The zombie wave", "the village closing in"*. Named — never "danger".
- **secret** — a hidden thing drifting toward exposure. *"Mari's lie about
  the fire", "what Jaan did in the war"*. States track hidden → suspected
  → known → exposed.
- **curse** — an inevitable arc that a specific act can interrupt.
  *"The ring's hold on Kalev", "the ghost's claim on the house"*.
- **time** — a bounded ticker. *"Nightfall", "the trial at dawn"*. Moves
  at named thresholds, not every turn.
- **guilt** — grows from specific choices, never shrinks. *"What was done
  in the barn", "the unsigned letter"*.
- **proof** — grows toward revelation via truth-seeking, at cost to
  safety. *"Evidence against the mayor", "proof the well was poisoned"*.
- **promise** — a sworn oath with teeth if broken. *"The vow to bring
  Liisa home", "the debt to old Mart"*.
- **hunger** — an external need that must be fed or the world breaks.
  *"The village's winter stores", "the furnace that keeps the frost out"*.
- **debt** — an unpaid obligation pursuing the group. *"What the family
  owes Kask", "the blood price on Mari's name"*.

A ghost-story fantasy wants secret + curse + time. A zombie siege wants
resource + bond + pressure. A thriller wants secret + proof + debt. A
post-apocalyptic wants hunger + resource + pressure. Match the story.`

export const ARCHETYPE_BEHAVIORS = `## ARCHETYPE BEHAVIORS

How each archetype moves — respect these at turn time.

- **resource**: depletes with action, rarely restored. Starts full, ends empty.
- **bond**: shifts both ways from social and moral choices. Named pair.
- **pressure**: escalates with events. Named external threat.
- **secret**: drifts hidden → suspected → known → exposed. Never jumps two states.
- **curse**: inevitable arc that a specific act can interrupt. Inches, not leaps.
- **time**: moves at named thresholds, NOT every turn.
- **guilt**: grows from choices, NEVER shrinks. Only worsens.
- **proof**: grows toward revelation via truth-seeking, at cost to safety.
- **promise**: sworn oath with teeth if broken.
- **hunger**: external need that must be fed or the world breaks.
- **debt**: unpaid obligation pursuing the group.`

export const PARAMETER_CRAFT = `## PARAMETER CRAFT

Three parameters per story. Three DIFFERENT archetypes — no duplicates.

A parameter name anchors to one specific thing: a named person, a named
pair, a specific named threat, or a concrete fact. Never abstract qualities
("strength", "trust", "danger").

Each has exactly four states, best → worst. Each state is 2–4 words, and
OBSERVABLE — something a character would see or feel. Good: "Tank full",
"Tank half". Bad: "Good", "Bad".

When a parameter is tied to ONE specific character (resource and guilt and
curse often are), set its \`ownerRoleId\` to that character's 0-based
roleIndex. Leave \`ownerRoleId\` unset for parameters about a pair (bond),
an external threat (pressure), or a shared fact.`
