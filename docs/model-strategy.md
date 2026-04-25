# AI Adventure Engine model strategy

Last reviewed: 2026-04-25

## Product goal

This is a casual social game. The default model choice should optimize for:

- low cost per full game
- low latency between turns
- reliable structured JSON
- good enough Estonian after the editor pass

Top-tier narrative quality matters, but not enough to make every game expensive.
The product should feel quick at the table; a slower premium model is only
worth it if a cheap model repeatedly breaks gameplay.

## Current default

Use `gemini-2.5-flash` as the default model for story generation, custom
stories, sequels, and turns.

Why:

- It is cheap enough for repeated casual play: $0.30 / 1M input tokens and $2.50 / 1M output tokens on the paid tier.
- It supports a 1M token context window, thinking, function calling, and structured outputs.
- It is fast enough for table play.
- The existing proxy already uses Gemini for the Estonian editor pass, so keeping the main game on Gemini avoids mixing an expensive generator with a cheap editor.
- It is stable, while the currently interesting Gemini 3 options are still preview models.

Implementation:

- Client provider default: `gemini`
- Proxy fallback default: `gemini`
- Proxy model default: `gemini-2.5-flash`
- Advanced UI may still expose `claude` as a quality mode.

## Quality mode

Use `claude-sonnet-4-6` only as an opt-in quality mode.

Why not default:

- Sonnet 4.6 is roughly 10x more expensive than Gemini 2.5 Flash for this workload: $3 / 1M input tokens and $15 / 1M output tokens.
- Better prose does not justify that cost for every casual game.
- If we use Sonnet, it should be a conscious "quality over cost" choice, not a hidden default.

## Candidate models

| Model | Status | Input / Output per 1M tokens | Notes |
|---|---:|---:|---|
| `gemini-2.5-flash` | Default | $0.30 / $2.50 | Best current fit for cheap, fast, structured game turns. |
| `gemini-2.5-flash-lite` | Cost test | $0.10 / $0.40 | Cheapest stable option. Test if volume cost becomes the main issue; likely weaker prose and fewer interesting consequences. |
| `gemini-3.1-flash-lite-preview` | Candidate | $0.25 / $1.50 | New preview option that may be cheaper than 2.5 Flash with stronger quality. Do not use as live default until schema retries and Estonian playtests are clean. |
| `gemini-3-flash-preview` | Candidate | $0.50 / $3.00 | Newer preview model with better capability claims, but it is more expensive than 2.5 Flash and preview-risky. |
| `gemini-2.5-pro` | Avoid by default | $1.25 / $10.00 | Good reasoning, but too expensive for every turn of a casual game. |
| `claude-haiku-4-5` | Candidate | $1 / $5 | Possible middle ground if Gemini quality is too weak, but still notably more expensive. |
| `claude-sonnet-4-6` | Opt-in quality | $3 / $15 | Better narrative quality, too expensive as default. |
| `gpt-5.4-mini` | Candidate, not implemented | $0.75 / $4.50 | Strong structured-output candidate; requires adding an OpenAI provider to the proxy. |
| `gpt-5.4-nano` | Candidate, not implemented | $0.20 input listed in model comparison | Could be a future low-cost test, but pricing and quality need a dedicated provider spike. |

## Review process

Do not switch defaults based on one nice or bad run. Use this loop:

1. Run at least three short Estonian playtests per candidate.
2. Compare latency, schema retries, Estonian editor corrections, and whether choices are playable.
3. Estimate full-game cost from proxy logs (`in=`, `out=`, retries, editor time).
4. Change the default only if the cheaper model repeatedly breaks gameplay, not merely because a premium model writes prettier prose.

## Current recommendation

Keep `gemini-2.5-flash` as the live default.

Next model work should be a measurement branch, not a blind switch:

1. Add an env-only test override for `gemini-3.1-flash-lite-preview`.
2. Run three short Estonian playtests against 2.5 Flash, 2.5 Flash-Lite, and 3.1 Flash-Lite Preview.
3. Record average first-story latency, average turn latency, schema retries, editor-pass use, and total token cost.
4. Promote a cheaper model only if the story still produces tense choices, concrete consequences, and no repeated empty/free choices.

## Sources

- Google Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google Gemini model capabilities: https://ai.google.dev/gemini-api/docs/models
- Anthropic Claude pricing: https://platform.claude.com/docs/en/docs/about-claude/pricing
- Anthropic Claude model overview: https://platform.claude.com/docs/en/about-claude/models/overview
- OpenAI GPT-5.4 mini model page: https://developers.openai.com/api/docs/models/gpt-5.4-mini/
- OpenAI models overview: https://developers.openai.com/api/docs/models
