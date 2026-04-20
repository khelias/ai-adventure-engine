# scripts/playtest.ts

Headless game runner. Simulates what the frontend does — generates a story, plays turns against the proxy API, writes a Markdown transcript. Use it to review AI quality after prompt or engine changes without clicking through the UI.

The runner imports the real `src/game/prompts.ts` and `src/game/engine.ts` directly, so any change there is automatically reflected in the next playtest. No duplication.

## Setup

One-time install of `tsx` (to run TypeScript directly without a build step):

```bash
npm install -D tsx
```

Then add a `playtest` script to `package.json` if you want shorter invocation:

```json
"scripts": {
  "playtest": "tsx scripts/playtest.ts"
}
```

## Running

```bash
# Default: Zombies / Medium / Estonian / Claude / balanced strategy
npx tsx scripts/playtest.ts

# Push through to the endgame even if engine tries to force-end early
npx tsx scripts/playtest.ts --skip-parametric-end

# Short fantasy in English, picking the first choice every turn
npx tsx scripts/playtest.ts --genre=Fantasy --duration=Short --language=en --strategy=first

# Against a local dev server (vite dev + proxy)
npx tsx scripts/playtest.ts --endpoint=http://localhost:5173/adventure/api/generate
```

Transcripts land in `playtest-transcripts/<timestamp>__<genre>-<duration>-<strategy>.md` at the repo root. Add that directory to `.gitignore` (transcripts are large and one-off — commit a specific file manually if you want to preserve a canonical sample).

## Options

| Flag | Default | Notes |
|---|---|---|
| `--genre` | `Zombies` | `Zombies` \| `Fantasy` \| `Sci-Fi` \| `Thriller` \| `Cyberpunk` \| `Post-Apocalyptic` |
| `--duration` | `Medium` | `Short`(8) \| `Medium`(15) \| `Long`(20) turns |
| `--players` | `3` | Role count |
| `--language` | `et` | `et` \| `en` |
| `--provider` | `claude` | `claude` \| `gemini` — which model handles turns |
| `--strategy` | `balanced` | See below |
| `--endpoint` | `https://games.khe.ee/adventure/api/generate` | Override for local dev |
| `--skip-parametric-end` | off | Continue past the engine's auto-end when one parameter hits worst state. Needed to see climax/resolution phase while the parametric-end bug is unfixed. |
| `--out` | auto | Override transcript path |

## Strategies

Decides how the bot picks one of the three choices each turn. Different strategies surface different failure modes.

- **`first`** — always choice 0. Deterministic. Good for regression-testing: same story seed + same strategy should produce broadly similar arcs. Reveals what the AI puts first when it's uncertain.
- **`random`** — uniform random. Baseline variance. Useful to run many short games and see whether any path produces a watchable story.
- **`balanced`** (default) — weighted by criticality. Protects the parameter closest to worst state. Approximates a cautious player.
- **`protect-threat`** — always picks the choice with the best effect on the last parameter (heuristic: THREAT archetype is generated last). Useful to push deeper into the game if you're testing late-phase prompts.

## What the transcript shows

Per turn:
- Phase (setup / inciting / rising / climax / resolution)
- Current parameter states
- Previous choice text
- AI model + latency
- Scene prose
- Declared parameter deltas
- All three choices with their promised costs
- Strategy's pick

At end: reason (narrative / parametric / maxTurns / api-error) and final parameter states.

## Cost

Each turn is one Claude or Gemini API call. Claude Sonnet 4.6 turn is ~4-8k tokens. Ballpark:

- Short (8 turns) ≈ $0.20-0.40 on Claude
- Medium (15 turns) ≈ $0.40-0.80
- Long (20 turns) ≈ $0.50-1.00

Gemini Flash is roughly 10× cheaper.

## When to run

- After editing `src/game/prompts.ts` — sanity-check a full game
- After editing `src/game/engine.ts` — confirm mechanics still work
- Before committing a prompt PR — attach a transcript as evidence
- Periodically to catch regressions from model-side changes (Anthropic/Google update their models; output drifts)

## Known limitations

- The bot reads `expectedChanges` numerics, not scene text. A real player weighs narrative pull too. Use `random` strategy occasionally to get choices a human might make for thematic reasons.
- No retry on transient API errors. A single 503 aborts the run.
- Context block (`location`, `playersDesc`, `vibe`, `insideJoke`) is always empty. Add a `--context` flag if you need to test that path.
- Story-variant generation (`storyGenerationSchema` returns up to 3 stories) is not exercised — we always pick story 0.
