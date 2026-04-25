# Architecture

Reference document for how the AI Adventure Engine fits together. Start with [the README](../README.md) for what the game is.

Diagrams use Mermaid — GitHub renders them inline.

## 1. System context

```mermaid
flowchart TB
    subgraph "Player side"
        Group["🧑‍🤝‍🧑 Player group<br/>3-6 people, one reads aloud"]
    end

    subgraph "Edge"
        CF["Cloudflare<br/>DNS + tunnel + TLS"]
    end

    subgraph "Home server (Proxmox VM)"
        Engine["AI Adventure Engine<br/>React SPA + Node proxy"]
    end

    subgraph "External AI providers"
        Anthropic["Anthropic API<br/>Claude Sonnet 4.6"]
        Google["Google AI API<br/>Gemini 2.5 Flash"]
    end

    Group -->|"games.khe.ee/adventure/"| CF
    CF -->|"tunnel (cloudflared)"| Engine
    Engine -->|"story gen + turn narration"| Anthropic
    Engine -->|"Estonian editor + fallback"| Google
```

The group's browser never talks to Anthropic or Google directly — every AI call goes through the home-server proxy, which holds the API keys and enforces schema + origin rules.

## 2. Containers

```mermaid
flowchart LR
    Browser["React SPA<br/>(in player's browser)"]
    subgraph "games container (nginx)"
        NginxStatic["Static bundle<br/>/adventure/*"]
        NginxProxy["Reverse proxy + rate limit<br/>/adventure/api/*"]
    end
    subgraph "adventure-proxy container (Node.js)"
        Endpoint["/generate endpoint"]
        EditorPass["Gemini editor pass<br/>(Estonian only)"]
        SchemaGuard["Schema allowlist<br/>Origin check"]
    end
    Anthropic["Anthropic API"]
    Google["Google AI API"]

    Browser -->|"GET /adventure/*"| NginxStatic
    Browser -->|"POST /adventure/api/generate"| NginxProxy
    NginxProxy -->|"internal: adventure-proxy:3000"| SchemaGuard
    SchemaGuard --> Endpoint
    Endpoint -->|"turn / story / sequel / custom"| Anthropic
    Endpoint -->|"fallback or editor"| Google
    Endpoint -.->|"if scene.language=et"| EditorPass
    EditorPass --> Google
```

- **Browser**: React 19 + Vite + Zustand SPA. Built once, served as static files.
- **nginx (games container)**: serves the bundle, reverse-proxies `/adventure/api/` to the proxy container, enforces per-visitor rate limit (30 req/min keyed on `CF-Connecting-IP`).
- **adventure-proxy (Node.js)**: the only place holding API keys. Validates origin + schema shape, calls Claude or Gemini, optionally routes the response through an Estonian editor pass. Logs choice-cost violations as telemetry.
- **Cloudflare Tunnel**: a separate `cloudflared` container (in the homelab's `core/cloudflare-tunnel` stack) publishes `games.khe.ee` to the internet. No ports exposed from the VM directly.

## 3. Request flows

### 3a. Story generation (game setup)

```mermaid
sequenceDiagram
    participant UI as Browser (React)
    participant N as nginx (games)
    participant P as adventure-proxy
    participant C as Claude

    UI->>N: POST /adventure/api/generate<br/>{prompt, schema=storyGen, provider=claude}
    N->>P: forward (internal network)
    P->>P: origin check ✓<br/>schema allowlist ✓
    P->>C: messages.create(tool=respond)
    C-->>P: tool_use { stories: [...] }
    P->>P: not turn-shaped → skip editor
    P-->>N: {data: {stories}, model}
    N-->>UI: 200 OK
```

Story gen is a single Claude call. No editor pass (different schema shape). Typical cost: ~$0.02, ~15-20s latency.

### 3b. Turn (the hot path)

```mermaid
sequenceDiagram
    participant UI as Browser (React)
    participant P as adventure-proxy
    participant C as Claude
    participant G as Gemini (editor)

    UI->>P: POST /generate<br/>{prompt=turnPrompt.user, schema=turn,<br/>systemPrompt=turnPrompt.system, language=et}
    P->>P: origin ✓ / schema ✓
    P->>C: messages.create(tool=respond)<br/>(system prompt cached via ephemeral)
    C-->>P: { scene, parameters, choices, gameOver }
    P->>P: log choice-cost violations
    alt language=et AND turn-shaped
        par editor scene
            P->>G: editorCall(scene)
            G-->>P: corrected
        and editor gameOverText (if present)
            P->>G: editorCall(gameOverText)
            G-->>P: corrected
        end
        Note over P,G: 25s shared budget;<br/>failures fall back to unedited
    end
    P-->>UI: {data: {scene, choices, ...}, model}
```

A turn is one Claude call + up to two parallel Gemini editor calls. The editor pass has a 25-second shared budget (one `AbortController` across both fields) so total response time stays below nginx's 120s ceiling even in the worst case.

### 3c. Narrative end (2+ parameters at worst)

```mermaid
sequenceDiagram
    participant Engine as client-side engine
    participant P as proxy + Claude
    Engine->>Engine: applyParameterChanges<br/>detects 2+ params at worst
    Engine->>P: turn call with forceEnd='unrecoverable'
    P-->>Engine: { scene (short), gameOverText (3-5 paragraphs), gameOver: true }
    Engine->>Engine: setGameOver('parametric', aiText)
```

One parameter at worst = phase transition (AI narrates the consequence, game continues); two or more at worst = dedicated finale Claude call with `forceEnd: 'unrecoverable'`, AI writes the ending. The hardcoded template line in `translations.ts` is a fallback that fires only if this second call throws.

## 4. Prompt architecture

Prompts live in `src/game/prompts/` as a per-concern decomposition. The
public API (`storyGenerationPrompt`, `customStoryPrompt`, `sequelPrompt`,
`turnPrompt`, schemas, `getStoryPhase`) is re-exported from
`prompts/index.ts` so callers import unchanged.

Internal layout:

| File | Concern |
|---|---|
| `schemas.ts` | JSON schemas + `TurnResponse` type |
| `archetypes.ts` | 11-archetype palette + turn-time behavior rules + parameter-craft block |
| `phases.ts` | `getStoryPhase()` + per-phase narrative instruction |
| `tone.ts` | TONE blocks for light / tense / dark vibes |
| `craft.ts` | Scene / choices / parameter-movement craft + self-check |
| `contract.ts` | Output-shape contract (the "two narrative shapes" rule) |
| `story-gen.ts` | `storyGenerationPrompt` / `customStoryPrompt` / `sequelPrompt` |
| `turn.ts` | `turnPrompt({...}) → { system, user }` composer |
| `index.ts` | Public re-exports |

Four schemas; the proxy validates against the sorted top-level `properties` keys:

| Schema | Purpose | Shape fingerprint |
|---|---|---|
| `storyGenerationSchema` | Generate a story + roles + parameters | `stories` |
| `customStorySchema` | User-typed story idea → roles + params | `parameters,roles` |
| `sequelSchema` | Continue a finished game with new twist | `newAbilities,newParameters` |
| `turnSchema` | One turn: scene + param changes + choices + optional gameOver | `choices,gameOver,gameOverText,parameters,scene` |

The turn prompt is split into **system** (static — story, characters,
parameters, archetype behaviors, craft + contract blocks, few-shot
example) and **user** (dynamic — current turn, parameter states, recent
scenes, last choice).
Claude's `cache_control: { type: 'ephemeral' }` caches the system block
across turns — cache hit saves ~50% of input tokens.

### CRAFT vs CONTRACT vs META

Three concerns are kept apart because Claude attends to each differently:

- **CRAFT** (`craft.ts`, `scene-craft`/`choices-craft`/`parameter-movement`):
  how to write the scene, the choices, the dialogue. Treated as creative
  direction. Positive declarative — *"a scene is 2-3 sentences"* — never
  imperative-negative.
- **CONTRACT** (`contract.ts`): the response *shape*. Phrased as a binary
  narrative choice: *"Your response resolves to ONE of two shapes. There
  is no third shape."* (3 choices + gameOver=false, or empty + gameOver=true
  + a full gameOverText.) The contract does not enumerate ending triggers —
  the engine handles forced endings via `forceEnd` blocks in the user
  message, and the contract only describes the AI-initiated case (rare).
- **META** (kept out of system prompt): app internals, what the engine
  does with the response. The model is a narrator, not the engine — telling
  it about engine behavior wastes attention.

### Parameter archetypes

11-shape palette: `resource`, `bond`, `pressure`, `secret`, `curse`,
`time`, `guilt`, `proof`, `promise`, `hunger`, `debt`. AI picks 3 different
archetypes per story (not the fixed RESOURCE+BOND+PRESSURE that earlier
versions defaulted to). Each parameter declares its archetype + optional
`ownerRoleId` (set when the parameter anchors to one specific character).

### Empty-choices safety net

Even with the new contract framing, Claude occasionally still emits
`choices: []` + `gameOver: false`. Proxy retries 2x with escalating
reminders, then coerces `gameOver=true` and synthesizes a minimal
gameOverText from the scene. Logs `retried=N` and `coerced-gameover`
when this fires — telemetry to track real-world drift rate.

## 5. Cost model

Approximate per-game costs at Claude Sonnet 4.6 input $3/MTok, output $15/MTok, Gemini Flash input/output ~$0.075/$0.3 per MTok:

| Action | Claude call | Editor pass | Total |
|---|---|---|---|
| Story gen (once) | ~$0.02 | — | **~$0.02** |
| Turn (each) | ~$0.04 | ~$0.001 | **~$0.04** |
| Narrative end | ~$0.05 | ~$0.002 | **~$0.05** |

Per full game:
- **Short (8 turns)**: ~$0.35
- **Medium (15 turns)**: ~$0.65
- **Long (20 turns)**: ~$0.85

Monthly bill for moderate use (~30 games): **$10-25**. Anthropic prompt caching gets a 50-70% hit rate in practice (system prompt stable within a run), dropping bills proportionally.

## 6. Security boundaries

```mermaid
flowchart LR
    Internet["Internet"]
    CFEdge["CF Edge<br/>DDoS + TLS termination"]
    Tunnel["CF Tunnel<br/>(cloudflared on VM)"]
    NginxLimit["nginx rate limit<br/>30 req/min per CF-Connecting-IP"]
    ProxyGuard["proxy<br/>Origin check<br/>Schema allowlist<br/>Body size ≤1MB"]
    AI["AI providers<br/>(keys never leave VM .env)"]

    Internet --> CFEdge --> Tunnel --> NginxLimit --> ProxyGuard --> AI
```

Three layered controls against abuse:

1. **nginx rate limit** — per-visitor via `$http_cf_connecting_ip` map (falls back to `$remote_addr` for direct LAN hits). Without the map, all CF-tunnel traffic would collapse to one counter.
2. **Origin check** in proxy — `Origin` or `Referer` must match `https://games.khe.ee` or a localhost dev origin. 403 otherwise. Filters casual curl abuse.
3. **Schema allowlist** in proxy — incoming `schema.properties` top-level keys must match one of the four known shapes. 400 otherwise. This is the single biggest protection: without it, the proxy is a free generic Claude/Gemini API.

What is **not** protected:
- Anyone who knows the API shape + spoofs `Origin: https://games.khe.ee` can still make game-shaped calls (bounded by rate limit). Acceptable threat model for a public share-link game.
- No CAPTCHA / bot check at the edge. If abuse materializes, Cloudflare Turnstile is the next layer.
- Anthropic API quota is the ultimate ceiling — set an account-level hard budget cap.

API keys live only in the VM's `.env` file, never in the repo or git history.

## 7. Deployment

Both frontend and proxy ship from this repo. `khe-homelab` only owns the compose orchestration (nginx config, container wiring, env).

```mermaid
flowchart LR
    Dev["Developer"]
    AERepo["ai-adventure-engine<br/>GitHub repo"]
    HLRepo["khe-homelab<br/>GitHub repo"]
    GHA["GitHub Actions<br/>self-hosted runner on VM"]
    VM["Docker VM<br/>192.168.0.11"]

    Dev -->|"push to main"| AERepo
    Dev -->|"push to main"| HLRepo
    AERepo -->|"webhook → build React + build proxy image + restart container"| GHA
    GHA -->|"dist → /srv/data/games/adventure/app/<br/>docker build games-adventure-proxy:latest<br/>docker compose up -d --force-recreate"| VM
    HLRepo -.->|"manual: ssh + git pull + docker compose up"| VM
```

- **Frontend + proxy** (`ai-adventure-engine`): every push to `main` triggers a GitHub Actions runner on the VM. The workflow (a) builds the Vite bundle and writes to `/srv/data/games/adventure/app/` (bind-mounted into the games nginx container — no restart needed), and (b) runs `docker build` on `proxy/` to produce `games-adventure-proxy:latest`, then `docker compose up -d --force-recreate adventure-proxy` to swap the container onto the new image. End-to-end push-to-live is ~20s.

- **Compose orchestration** (`khe-homelab`): manual deploy. `services/apps/games/docker-compose.yml` references `games-adventure-proxy:latest` by tag (no build context). Changes to nginx config, env vars, or network wiring still require `ssh + git pull + docker compose up -d` on the VM.

### Coupling note

Frontend and proxy live in the same repo, so schema/contract changes go in one commit:
- **Schema shapes**: adding or changing a schema in `src/game/prompts/schemas.ts`
  requires updating `ALLOWED_SCHEMA_SHAPES` in `proxy/server.js`. Forgetting this
  breaks the feature silently (proxy returns 400).
- **Request body contract**: adding a new field the proxy should respect
  (e.g. `language`) requires matching changes in `src/api/adventure.ts`.

## 8. Where to look for what

| Concern | File |
|---|---|
| Prompt authoring (CRAFT / CONTRACT / META) | `src/game/prompts/` modules |
| Parameter mechanics, gameOver detection | `src/game/engine.ts` |
| Secrets archetypes + scoring (client-only) | `src/game/secrets.ts` |
| Turn orchestration, error handling | `src/game/actions.ts` |
| Pass-the-phone secrets ritual UI | `src/components/SecretAssignmentScreen.tsx`, `src/components/GameOverScreen.tsx` (reveal flow) |
| Scene-slug UI (replaces param pills) | `src/components/GameScreen.tsx` (`SceneSlug`) |
| Proxy routing + editor pass + retry/coerce | `proxy/server.js` |
| nginx rate limit + reverse proxy | `khe-homelab/services/apps/games/nginx.conf` |
| Full-game smoke test (with secret simulation) | `scripts/playtest.ts` — see [`scripts/README.md`](../scripts/README.md) |
| Design principles / invariants, roadmap | [`ROADMAP.md`](../ROADMAP.md) |
