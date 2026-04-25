# AI Adventure Engine audit backlog

Last updated: 2026-04-25

These are deliberate follow-up audits, not loose ideas to silently fold
into feature work.

## API contract

- Done: documented current request/response ownership in
  [`api-contract.md`](./api-contract.md).
- Done: removed the legacy `/gemini` endpoint from `proxy/server.js`.
- Done: replaced top-level schema fingerprints with exact canonical schema
  hashes.
- Done: added `abilityParameter` so generated special abilities have a
  machine-readable parameter anchor.
- Follow-up: deploy proxy and confirm old cached clients refresh cleanly to
  `/generate`.

## Caching and Gemini capabilities

- Done: refreshed [`model-strategy.md`](./model-strategy.md) with Gemini
  structured outputs, thinking budget, implicit/explicit context caching,
  Batch API, and candidate Flash-Lite models.
- Decision: keep `gemini-2.5-flash` as live default until measured playtests
  prove a cheaper model keeps gameplay quality.
- Done: proxy logs Gemini cache-hit, thinking-token, and total-token fields
  from `usageMetadata` when present.
- Follow-up: run a short Estonian playtest matrix against `gemini-2.5-flash`,
  `gemini-2.5-flash-lite`, and `gemini-3.1-flash-lite-preview`.

## Prompt audit

- Done: added [`prompt-audit.md`](./prompt-audit.md) with current prompt risks
  and a playtest rubric.
- Done: tightened special ability generation with `abilityParameter`.
- Follow-up: run transcripts through the rubric and only then prune duplicated
  prompt text.
- Follow-up: audit secrets and final scoring after the next full playtest;
  the role/parameter design is now clearer, but needs table-feel validation.

## Documentation

- Done: refreshed README, architecture docs, script docs, API contract, model
  strategy, and prompt audit notes.
- Keep `docs/model-strategy.md` as the source of truth for model defaults and
  candidate tests.
