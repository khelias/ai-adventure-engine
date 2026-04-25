# AI Adventure Engine audit backlog

Last updated: 2026-04-25

These are deliberate follow-up audits, not loose ideas to silently fold
into feature work.

## API contract

- Re-check every request and response shape used by the frontend, proxy,
  and playtest script.
- Decide whether the legacy `/gemini` endpoint can be removed.
- Confirm whether schema fingerprints are still enough now that
  `consequences` and special-ability handling are stricter.
- Document which fields are authored by the AI and which are app-owned
  (`choice.isAbility`, `choice.actor`, `expectedChanges`, `consequences`).

## Caching and Gemini capabilities

- Audit whether Anthropic prompt caching still matters if Gemini is the
  default provider.
- Review Gemini options that may improve the game without making each turn
  expensive: structured outputs, thinking budget, context caching, batch
  tests, and newer Flash-Lite preview models.
- Measure before switching: first-story latency, turn latency, schema
  retries, editor-pass frequency, and total token cost per short game.

## Prompt audit

- Review story, turn, secret, sequel, and editor prompts together instead
  of tuning them one by one.
- Remove duplicated instructions where they make prompts longer without
  improving behavior.
- Check for hidden sameness: repeated zombie siege shapes, repeated
  investigate/fortify/wait choices, generic abilities, and parameters that
  are too abstract.
- Add a small playtest rubric so model comparisons judge gameplay, not just
  prettier prose.

## Documentation

- Update the README and script docs after the API contract audit.
- Keep `docs/model-strategy.md` as the source of truth for model defaults
  and candidate tests.
