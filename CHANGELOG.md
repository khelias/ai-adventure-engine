# Changelog

Notable changes to the adventure engine. Uses loose Keep-a-Changelog format — entries describe *why* the change happened, not just what.

## 2026-04-20 — Engine redesign, Estonian editor, proxy hardening

The post-F2 game was technically live but "igav, korduv, vähe kaasahaarav" — the Faas 2 success criterion ("Kaido plays one full game and says stories are interesting") was **not met**. A playtest session surfaced several concrete defects. This entry captures the fixes.

### Game-ending logic (biggest fix)

The engine previously force-ended the game as soon as **one** parameter hit its worst state, and wrote a hardcoded template line — even though the system prompt told the AI *"do not set gameOver mechanically — dramatize it in the scene"*. Every playthrough ended abruptly around turn 4-5 of 15, with a generic template like *"Olukord muutus lootusetuks. X jõudis kriitilisele tasemele. Teie grupp ei pidanud vastu."*

- **Added** `isUnrecoverable(parameters)` — true only when 2+ parameters are at worst simultaneously.
- **Added** `justBroke` flag on the `Parameter` type, set for exactly one turn when a param transitions into worst state. The next turn's prompt tells the AI to open the scene with the narrative consequence.
- **Added** `forceEnd: 'unrecoverable'` mode in `turnPrompt`. When `isUnrecoverable` is true, `actions.ts` calls the AI once more with this flag to get a multi-paragraph `gameOverText` written in-story. The hardcoded template drops to fallback-only (API error).
- **Removed** the hidden "rule #4" in the system prompt — *"THREAT worsens by at least 1 each turn UNLESS the chosen action specifically delays it"*. This rule was invisible to players: choice `expectedChanges` said "cost: nothing", but the AI would still worsen threat on top, violating the player-facing contract.

### Estonian language quality

Claude-generated Estonian had consistent defects: hallucinated words (`falšfalsi`, `akupliiats`), wrong verb register (`mootor röhiseb` — `röhiseb` is for animal grunts), English calques (`hoiavad sees`, `aeg töötab vastu`), typos (`silmapilkseltselt`).

- **Added** Gemini Flash editor-pass in the adventure-proxy. When the client requests with `language: 'et'`, the proxy routes the Claude response's `scene` and `gameOverText` through Gemini with an editorial system prompt that fixes hallucinations, register, calques — without changing facts or atmosphere. 25-second shared budget across both fields; per-task failures fall back to unedited text.
- **Tightened** scene-length rules (2-3 sentences non-climax, 60-word cap) and added a few-shot Estonian turn example as a style anchor in the system prompt.
- **Required** `role.name` to be a proper Estonian first name (Mari, Mattis, Liisa…) — previous runs produced titles-as-names like *"Noor Meditsiinitudeng"*.
- **Renamed** the gender-assuming parameter "Meeste side" pattern — prompts now require gender-neutral framing ("Grupi side").

### Proxy hardening

Previously the `/generate` endpoint accepted any prompt + any JSON Schema, making it a free generic Claude/Gemini API for anyone who found the URL. Three layered protections added:

- **Schema allowlist** — incoming `schema.properties` top-level keys must match one of the four known shapes (story, turn, custom, sequel). Others return `400 schema shape is not in the allowlist`.
- **Origin check** — `Origin` or `Referer` must match `https://games.khe.ee` or a localhost dev origin. Others return `403 Origin not allowed`.
- **Real per-visitor nginx rate limit** — `limit_req_zone` now keys on `$http_cf_connecting_ip` via a `map` block, falling back to `$remote_addr`. Previously `$binary_remote_addr` saw only the cloudflared container's socket IP, collapsing all users to one 30-req/min counter.

### Playtest harness

- **Added** `scripts/playtest.ts` — headless runner that imports live prompts + engine and plays a full game against the proxy, writing a Markdown transcript. Strategies: `first`, `random`, `balanced`, `protect-threat`. Use for smoke-testing prompt or engine changes without clicking through the UI. See [`scripts/README.md`](scripts/README.md).

### Docs

- **Added** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — C4-style reference for containers, request flows, cost model, security layers, deployment.
- **Added** this `CHANGELOG.md`.

---

## 2026-04-20 earlier — Faas 2 "Séance" redesign

Complete UI rework to match the pass-the-phone group-game framing. Violet-on-dark typography-first design. See `V2-PLAN.md` for the full list of changes.

## 2026-04-19 — Prompt overhaul

Turn prompts split into system (cached) + user (dynamic). Story phases scale with game length. Estonian few-shot style anchor added. Detailed in `V2-PLAN.md` phase notes.

## Earlier

Before 2026-04-19 the engine was a vanilla JS single-file implementation. See commit history for migration to React + Vite + TypeScript.
