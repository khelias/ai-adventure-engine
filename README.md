# AI Adventure Engine

An AI-driven group adventure game for 3–6 players — live at **[games.khe.ee/adventure](https://games.khe.ee/adventure/)**.

Pick a genre. Name your characters. One person reads aloud while the group decides what happens next.

---

## How it works

The game runs in turns. Each turn the AI narrates a story beat and presents choices. The group discusses, picks one (or writes their own), and the story continues. A full game runs 20–40 minutes depending on the chosen duration.

The setup screen accepts optional context — where you are, who's in the room, today's inside joke — and the AI weaves it into the story. A car trip becomes the setting; a friend's name shows up in a character description.

## Design

The interface is built around a concept called **Séance**: a dark, still space lit by a single violet beam. The goal was a UI that reads like a quality product rather than a typical game app, with maximum readability for story text (one person reads aloud to a group of 3–6).

- Near-black background (`#0a0913`) with violet accent (`#a78bfa`) — same family as the parent [games.khe.ee](https://games.khe.ee)
- **Fraunces** variable serif for story text and choices — high readability at phone sizes, literary feel without being costume-y
- **Inter** for all UI chrome
- Setup screen: **The Circle** — a 140px ring with a violet beam that intensifies on genre selection, icon cross-fades inside, big Fraunces numbers for player count
- Ambient breathing glow (8s opacity cycle on `body::before`), staggered paragraph fade-in on each new scene
- Design system designed in collaboration with Claude Opus for direction, then implemented as hand-written CSS custom properties

## Stack

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS v4 + hand-written design system in `src/index.css`
- Zustand for state management

**Adventure Proxy** — Node.js / Express container on the homelab
- Routes to Anthropic (Claude Sonnet 4.6) or Google (Gemini 2.5 Flash)
- Prompt caching via Claude's `cache_control: ephemeral` on the system prompt — reduces cost ~50–60% on long games
- Logs provider, model, response time, and cache hit/miss per request

**Deployment**
- Self-hosted on a home server (Proxmox VM, Docker Compose)
- GitHub Actions self-hosted runner deploys on every push to `main`
- Served via nginx behind Cloudflare tunnel at `games.khe.ee`

## Architecture

```
Browser
  └── games.khe.ee (nginx)
        ├── /adventure/         → static React build
        └── /adventure/api/     → adventure-proxy (Node.js)
                                      ├── Anthropic API  (Claude Sonnet 4.6)
                                      └── Google AI API  (Gemini 2.5 Flash)
```

Story generation always uses Gemini Flash (fast, cheap). Turn-by-turn narration uses Claude Sonnet 4.6 with prompt caching. Rough cost: ~$0.06–0.09 per full game.

## Local development

```bash
npm install
npm run dev
```

The dev build proxies `/adventure/api/` to the production endpoint at `games.khe.ee` by default. To run a local proxy, see the [`proxy/`](./proxy) directory in this repo.

## What's next

- **Whispers** — the AI privately messages one player mid-scene (`whisper_to(player)` tool). Creates information asymmetry without the group knowing. The player reads silently, hands the phone back, and the story continues.
- **Tool use** — structured AI actions (`update_parameter`, `introduce_npc`, `raise_stakes`) instead of JSON-in-prose parsing
- **Wounded / ghost states** — players who "die" narratively continue as wounded (limited agency) or a ghost (exclusive whispers only they receive), so no one sits out of a 20-minute session

Full roadmap in [ROADMAP.md](ROADMAP.md).

---

Part of a personal homelab project. Infrastructure details at [khe-homelab](https://github.com/khelias/khe-homelab).
