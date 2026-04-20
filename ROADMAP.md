# Roadmap

Live at `games.khe.ee/adventure/`. Active work: **Phase 3** (whispers + wounded/ghost).
Architecture detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The game reflects *this group, in this place, right now* — group context (location,
people, vibe) is woven into the story; secrets introduce information asymmetry;
narrative "death" changes how a player participates rather than removing them from
the table.

---

## Focus (one sentence)

**A party game for 3-6 adults, 20-30 min session, played on a car trip / evening /
at home, one person reads aloud and the others discuss.**

Every design decision follows from this. Solo play, kids' variant, mobile-single-player —
separate projects, not this one.

---

## Current state

- Stack: React 19 + Vite + TypeScript + Zustand, Tailwind with Fraunces / Inter typography
- Design: "Séance" — dark background, violet accent, ambient breathing glow. Pass-the-phone
  party game, not a solo app
- AI: Claude Sonnet 4.6 for scenes + story generation (prompt caching via
  `cache_control: ephemeral`); Gemini 2.5 Flash as fallback and Estonian editor pass
- Narrative: 5 phases (setup → inciting → rising → climax → resolution) scale with game
  length. One parameter at worst state = narrative phase transition (AI narrates the
  consequence and the game continues); two or more at worst = AI writes the ending in
  its own words. No hardcoded end template unless the AI call fails
- Proxy: Node.js Express. Schema allowlist + Origin check + real per-visitor rate
  limit. Estonian editor pass cleans Claude-generated prose before returning it to the
  client
- Infra: GitHub Actions runner auto-deploys on push; Cloudflare tunnel publishes the
  site; API keys live only in the VM's `.env`

---

## Three core design pillars

### 1. Context-aware narrator

Setup asks for *optional* extra input before the game starts:
- **Where are you physically?** (bus, kitchen, office, beach house…)
- **Who's in the room?** (names, relationships, ages, roles)
- **Vibe?** (light & absurd / tense / dark)
- **Something that happened today?** (inside joke, event of the day)

The AI weaves these into the scenario. Bus → the driver disappears from behind the
wheel. Office → the coffee runs out, the wall caves in. Family home → someone appears
at the door you haven't seen in 20 years.

**Fast-path is mandatory**: 1-click start skips the context fields, AI picks sensible
defaults (zombie genre, 4 players, "group discusses"). Setup takes ~60s when people
want to play *now*.

### 2. AI quality

Scenes are written by Claude Sonnet 4.6 with a style anchor (Estonian few-shot example
in the system prompt) and a Gemini Flash editor pass for Estonian cleanup. Result:
fewer hallucinated words, natural verb register, no English calques leaking through.

- Prompt caching (system prompt cached ephemerally) brings cost down ~50% on longer games
- Story generation and turns both use Claude; Gemini is fallback + editor
- Local models (Ollama) stay out for now — tool-use reliability and latency don't hit
  the bar yet. Adapter architecture is in place; 2-3 days of work to plug a local model
  in when a GPU lands

### 3. Secrets / private information

The game currently shows 100% public information to everyone. The next phase (3) adds a
`whisper_to(player)` tool: the AI privately messages one player mid-scene. The phone
moves to them quietly, they read, hand it back, and the story continues.

> *"Marko, your ex-wife is at the end of the corridor. The others haven't seen her yet.
> What do you do?"*

This is **the drama engine**: information asymmetry is what Werewolf / Mafia / murder
mystery stories are built on. Every table discussion becomes interesting when one person
*knows something* the others don't.

---

## Core mechanics

Three layers of tension stacked on top of each other:

1. **Group resources** (parameters) — public, shared risk, mechanical pressure toward
   loss. Three parameters per game; each a distinct archetype:
   - RESOURCE (depletes with action, rarely restored)
   - BOND (swings from social/moral choices)
   - PRESSURE (rises from events in the story; all changes visible via choice costs, no
     hidden auto-degradation)
   Together they form a trilemma: no single choice can improve all three. Every
   meaningful decision trades one against another.

2. **Character secrets / relationships** — private information, information asymmetry,
   the drama engine (phase 3)

3. **Special abilities** — one-shot, dramatic, group-discussion-generating. Offered only
   in rising or climax phases, when narratively earned.

Each layer works on its own; together they create multi-dimensional pressure.

---

## Design invariants

Non-negotiable rules. If a design decision violates one of these, the decision changes,
not the invariant.

1. **Nobody sits out.** If a character "dies" narratively, the player continues in a
   new role: **wounded** (reduced agency, ability gone) or **ghost/advisor** (exclusive
   whispers — "you see more than the living"). Death changes the *participation model*,
   it doesn't remove the player from the table. A 20-30 minute game where someone loses
   their seat at turn 5 means the group doesn't want to play again.

2. **Fast-path is sacred.** Setup must not take longer than 60 seconds when the user
   wants to play *now*. All advanced fields (context, vibe, inside joke) are optional.
   1-click start must produce a playable game with smart defaults.

3. **The reader sets the pace.** The UI never takes the dramatic pause away from the
   reader. No auto-advance, no timer. "Ready?" button is in the reader's hand.

4. **Pass-the-phone ritual.** Secrets reach the right player safely: **hold-to-reveal**
   is the UI foundation, not a gimmick. Release = text disappears immediately. No view
   for bystanders.

---

## Technical stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + hand-written design system in `src/index.css` — must
  *read like a book*, not "like an app"
- **Animations**: Framer Motion (scene transitions, parameter changes, dramatic secret reveals)
- **Typography**: Fraunces for narrative (serif, literary), Inter for UI chrome
- **State**: Zustand (lightweight, typed, no Redux overhead)
- **Proxy**: the existing provider-agnostic Node proxy (`adventure-proxy/` in the homelab repo)
- **Persistence**: none for now. Comes with Phase 6 (Postgres Docker volume)
- **Deploy**: GitHub Actions self-hosted runner → `/srv/data/games/adventure/app/`

---

## Design philosophy — how it looks

This is a reading game. Text *is* the experience.

1. **Typography-first**. Narrative: Fraunces serif, 18-22px, line-height 1.7, 65-75
   characters per line. UI chrome: Inter, smaller, discreet.

2. **Genre-based atmosphere** — each genre is its own book with its own palette,
   texture, typographic tuning:
   - Zombie / apocalypse: muted grays, rust accent, distressed texture, dark tone
   - Fantasy: deep reds and greens, gold accent, ornamental borders
   - Sci-fi: clean black/white, cyan-magenta accent, monospaced for status UI
   - Thriller: noir black/white, neon accent, dramatic shadows
   - Switched via CSS variables in setup

3. **Reader-optimized reading view** — one scene at a time, nothing else.
   - Large text, lots of whitespace. The reader can dramatize silently.
   - Each scene may carry a chapter title ("Chapter III: The Garage") — visual progress.
   - Choices sit as cards below the text, not inline.

4. **Parameters as a dashboard, not text** — not "Morale: Good", but:
   - Visual gauge / bar with color coding (green → yellow → orange → red)
   - Specific icon (fuel = pump, health = heart)
   - **Animation on change**: "morale -1" = the bar snaps down, color flashes red. The
     reader *sees* something significant happened and can dramatize it.

5. **Cinematic moments** — transitions, not just text swaps:
   - Scene transitions: fade + subtle slide (Framer Motion)
   - Secret reveal: envelope icon starts shaking, "pass the phone to Marko" full-screen overlay
   - Game over: parameters dramatically snap red, "The End" book-style title

6. **Character cards with personality** — each role is a card:
   - Name (editable), short description
   - Ability clearly visible (used = card grays out with a crossed-out mark)
   - Status animations: **alive → wounded → ghost** (zombie status is a later direction
     once UX is designed). Each status visually distinct:
     - *wounded* — card gets a scratch / bandage texture, name in italics
     - *ghost* — card turns translucent, small halo icon, "spirit" label
   - Whether this player has a secret (📬 icon)
   - Placeholder portrait (AI-generated later, geometric abstraction in genre theme for now)

7. **Mobile-first** — this is a pass-the-phone game:
   - Tall aspect, thumb-friendly, large tap targets
   - No landscape assumptions
   - Dark mode by default (late-evening low-light settings)

8. **Progress visual** — not "Turn 7/15" text, but:
   - A path / line that fills as the story advances
   - Shows where we are in the story arc (middle, climax, end approaching)
   - Dramatic "final turns" visual (the book thickens)

### Inspiration (vibe, not copy)

- **Reigns** (mobile) — minimalist card design, atmosphere from one screen
- **80 Days / Sorcery!** (Inkle) — literary UI, genuine book feel
- **Her Story** — full-screen cinematic text
- **Sunless Sea / Sunless Skies** (Failbetter) — dark atmospheric UI, text as art

### What the design does *not* do

- No 3D effects, parallax, excessive animations — this is calm reading, not game-flash
- No AI-generated images (later)
- No video / music by default (optional later)
- No splash screen / loading screen — ready to use immediately

---

## Phases

Each phase = one PR, one deploy, playable. After each phase, **success criterion test**
with friends, learn, next phase or iteration. *No 3-month closed beta.* Time estimates
are session-hours (~2-3h), not calendar days.

### ⏳ Phase 3 — Secrets + wounded + ghost (~3-5 sessions)

- Tool: `whisper_to_player(playerIndex, message)` — private info to one player
- Tool: `transition_player_state(playerIndex, "wounded" | "ghost")`
- **Hold-to-reveal UX** (`WhisperOverlay`): blurred text, hold to read, release to hide
- **GhostView**: exclusive whispers, limited choices ("whisper to the living")
- *Wounded*: ability gone, participation preserved
- Zombie / side-switching stays later (unsolved single-device design problem)
- **Success criterion**: whispered secrets generate discussion; death does not remove
  a player from the game

### ⏳ Phase 4 — Tool-use architecture (~2-3 sessions)

*(Architectural cleanup, not a narrative-quality prerequisite. Do after 3, when the game
is otherwise good.)*

- `update_parameter(name, change, reason)` — reason shown in UI as dramatic context
- `introduce_npc`, `raise_stakes` tools
- Gemini fallback: base tools work on both providers
- Proxy extension for Claude tool-use
- **Success criterion**: parameter changes show a reason; narrative is more consistent

### ⏳ Phase 5 — Design polish (~2-3 sessions)

- Parameter-change animations (Framer Motion — "morale drops")
- `PhaseIndicator` — story-arc progress visual (not "Turn N/M" text)
- Per-genre theming (`GenreTheme` — colors / textures / fonts per genre)
- Character-card status animations (wounded / ghost transitions)
- Optional TTS: ElevenLabs Estonian voice
- **Success criterion**: each genre feels different; a parameter change is visually dramatic

### ⏳ Phase 6 — Persistence (~2-3 sessions, later)

- Postgres (Docker volume)
- Save game + resume later
- Share link: "see what we played last night"
- **Success criterion**: close browser → reopen URL → game continues from the same point

---

## Cost estimate

One ~20-turn game with Sonnet 4.6:

Cache hit is realistically 50-70%, not 90%. Reasons:
- Phase-aware pacing rotates the system prompt 5-6 times per game (phase boundaries) → cache break
- Turn history grows each turn, cache boundary shifts
- Parameter state changes between turns

Math:
- **Without caching**: ~$0.12 / game
- **With caching (50-70% hit)**: ~$0.06-0.09 / game

50 games a month = **$3-5/month**. Acceptable until a GPU shows up. A more aggressive
caching strategy (phase info in the turn-variable portion, system prompt fully stable)
is available later as an optimization, not a necessity.

---

## Out of scope

- Solo play / single-player flow (different use case, different design)
- Mobile single-device app (web app stays)
- Live multiplayer (multiple devices at once) — pass-the-phone stays
- Images / TTS by default (polish, later)
- Complex campaign system (long, multi-session games)

**Kids' mode**: no special filters or customized genres for kids in scope. Nothing stops
playing a lighter zombie story with family. If a dedicated kids' focus emerges — it's
its own project, not forbidden.

---

## Later directions

Considered but currently out of scope — with reasons.

- **Zombie / side-switching mechanic**: single-device drama — "you secretly summon the
  horde while the others sitting next to you can see your screen" — is an unsolved
  design problem. May need periodic pass-the-phone rhythm to the zombie, or a second
  device. Needs a UX prototype first. Phase 3 holds *wounded + ghost* — those work
  cleanly on one device.
- **Local model (Ollama)**: a 16GB GPU fits qwen2.5:14b or gemma3:12b. Out for now
  because (a) tool-use reliability on local models is 5-10% malformed → phase 3+ tools
  become unreliable, (b) latency 10-15 s/turn vs Claude Sonnet 2-3 s cached — rhythm
  breaks, (c) Estonian creative quality is visibly worse. Adapter architecture is in
  the proxy already — 2-3 days to plug in when a GPU arrives and conditions improve.
  Opportunistic addition, not a planned phase.
- **Images**: nano-banana / Flux per scene, ~$0.003/image. Atmosphere boost, but traps
  the pacing (generation takes 5-10 s). Optional later.
- **Full TTS**: ElevenLabs Estonian voice for all players, not just the reader. Expensive
  ($3/game), latency breaks the tempo. Only if a human reader isn't available.
- **NPC agents**: each important character = mini-agent with its own memory (tool use +
  persistence). Requires the Phase 6 persistence layer first.
- **Campaigns**: multiple linked sessions, game runs across several evenings. Requires
  persistence + share-link + character continuity. Largest niche extension.
- **Kids' variant**: separate project, filtered themes, shorter durations, custom genres.

---

## Next step

**Phase 3 — secrets + wounded + ghost.** Information asymmetry is the biggest
differentiator the game doesn't yet offer.
