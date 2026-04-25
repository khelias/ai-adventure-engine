# UI/UX Notes

Last reviewed: 2026-04-25

This document records the product-facing screen structure and the UI principles
that should stay true as the game changes. It is not a pixel-perfect design
spec; the source of truth for implementation remains the React components and
CSS.

## Product Experience Goals

- **Sell the game before generation starts.** The first setup screen should feel
  like choosing the shape of an adventure, not filling a form.
- **Keep setup fast.** A group should be able to start a playable game in about
  a minute.
- **Separate different kinds of decisions.** Genre and duration are about the
  game promise; player count and names are about the table; place and mood are
  context; the final idea is optional.
- **Use Estonian as authored product copy.** Estonian labels should be natural,
  not literal translations from English.
- **Keep technical controls out of the main path.** Model selection is an
  advanced/experimental control, not a gameplay decision.
- **Design for one shared device.** Screens should work when one person reads
  aloud and the device is passed around.

## Screen Flow

### 1. Adventure Direction

Purpose: create the first impression and choose the game promise.

Inputs:

- genre
- game length

UI notes:

- The selected genre is shown as a large visual signal with a short teaser.
- Game length is visible immediately because it affects commitment and pacing.
- Player count is intentionally not here; it belongs with the group setup.

### 2. The Group

Purpose: define who is playing.

Inputs:

- player count
- optional player names or group description

UI notes:

- Player count affects roles and secret goals, so it should be explicit.
- Names remain optional to keep setup quick.

### 3. Place And Tone

Purpose: anchor the adventure in the current room or situation.

Inputs:

- current location
- mood

UI notes:

- Location asks where the group is right now, because familiar places make the
  generated story more immediately interesting.
- Mood may remain open if the group wants surprise.

### 4. Final Detail

Purpose: give the AI one optional spark and confirm the setup.

Inputs:

- one optional detail the adventure may use

UI notes:

- The screen includes a compact review of genre, player count, length, and
  location before generation.
- The optional detail should be one useful seed, not a full prompt brief.

## Gameplay Screens

### Story Selection

The generated story choices should help the group pick a premise quickly. The
screen should avoid implying that players are editing a prompt; they are choosing
which adventure to enter.

### Role Assignment

Role and name assignment is deterministic app behavior. The AI may supply story
material, but the app owns player identity, ability-used state, and secret goal
scoring.

### Secrets

Secrets are pass-the-phone interactions. Only one player should see their secret
at a time, and the UI should make the privacy ritual obvious without a long
explanation.

### Gameplay

The gameplay screen must prioritize:

- current scene text
- shared parameter state
- three group-facing choices
- separate special ability action
- visible consequences when parameters move

Normal choices should not be named after one player. Special abilities may use a
player's skill, but they are triggered through the separate ability action.

### Game Over

The end screen should read as one conclusion:

- final narrative
- final parameters
- revealed secrets
- winners

Players should not need to click through the entire game again to understand who
won and why.

## Current UI Assessment

Strong:

- Setup now has a clearer first impression.
- Player count and names are grouped correctly.
- Advanced model selection is hidden from the main path.
- Special abilities are separate from normal choices.
- The final setup screen gives useful review before generation.

Needs continued playtest attention:

- Parameter board density on small screens.
- Whether parameter event feedback feels like story, not scoring.
- Whether secrets are immediately understandable when the phone is passed.
- Whether game-over summaries create a satisfying table discussion.
- Whether the generated choices create disagreement instead of obvious
  optimization.

## Documentation Rule

For this project, screen documentation should stay at the level of user flows,
interaction contracts, and product invariants. Avoid maintaining duplicated
component-level specs unless a screen becomes complex enough that implementation
intent is no longer obvious from code.
