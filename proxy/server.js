const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { ET_STYLE_GUIDE } = require('./et-style-guide');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER || 'claude';
const PORT = Number(process.env.PORT) || 3000;
const UPSTREAM_TIMEOUT_MS = 115_000; // slightly under nginx proxy_read_timeout (120s)

if (!GEMINI_API_KEY && !ANTHROPIC_API_KEY) {
  console.error('FATAL: at least one of GEMINI_API_KEY or ANTHROPIC_API_KEY must be set');
  process.exit(1);
}

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
const geminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const app = express();
app.use(express.json({ limit: '1mb', type: '*/*' }));

// ---- Abuse protections ----
//
// 1. Schema allowlist: reject requests whose JSON Schema does not match one of
//    the four known game shapes. Without this, the proxy is a free generic
//    Claude/Gemini API for whoever finds the URL.
// 2. Origin check: require Origin or Referer to match an allowed origin.
//    Filters casual curl abuse; real attackers can spoof but then they still
//    hit the schema allowlist + per-IP rate limit in nginx.
// 3. Rate limit: enforced by nginx (see nginx.conf) using CF-Connecting-IP.
//
// Shapes are identified by the sorted top-level keys of schema.properties.
// When adding a new schema in prompts.ts, add its fingerprint here too.
const ALLOWED_SCHEMA_SHAPES = new Set([
  'stories',                                         // storyGenerationSchema
  'parameters,roles',                                // customStorySchema
  'newAbilities,newParameters',                      // sequelSchema
  'choices,gameOver,gameOverText,parameters,scene',  // turnSchema
]);

function schemaFingerprint(schema) {
  if (!schema || typeof schema !== 'object' || !schema.properties || typeof schema.properties !== 'object') {
    return null;
  }
  return Object.keys(schema.properties).sort().join(',');
}

function isKnownSchema(schema) {
  const fp = schemaFingerprint(schema);
  return fp != null && ALLOWED_SCHEMA_SHAPES.has(fp);
}

// Allowed origins for the game UI. Localhost entries let `npm run dev`
// and `npm run preview` hit the proxy during development.
const ALLOWED_ORIGIN_PREFIXES = [
  'https://games.khe.ee',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

function isAllowedOrigin(req) {
  const origin = req.get('origin') || '';
  if (origin && ALLOWED_ORIGIN_PREFIXES.some((a) => origin === a)) return true;
  const referer = req.get('referer') || '';
  if (referer && ALLOWED_ORIGIN_PREFIXES.some((a) => referer.startsWith(a + '/'))) return true;
  return false;
}

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// Legacy endpoint used by older cached frontends. Forwards a Gemini-shaped
// request body straight through to Google and returns Gemini's raw response.
// Keep until old `app.js` bundles have aged out of browser/CDN caches.
app.post('/gemini', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Gemini not configured on this proxy' });
  }
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(geminiUrl(GEMINI_MODEL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || 'Gemini upstream error',
      });
    }
    res.json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    console.error('proxy legacy /gemini:', err.message || err);
    res.status(500).json({ error: err.message || 'Proxy error' });
  } finally {
    clearTimeout(timer);
  }
});

app.post('/generate', async (req, res) => {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  const { prompt, schema, provider = DEFAULT_PROVIDER, systemPrompt, language } = req.body || {};
  if (typeof prompt !== 'string' || !prompt || typeof schema !== 'object' || !schema) {
    return res.status(400).json({ error: 'prompt (string) and schema (object) are required' });
  }
  if (!isKnownSchema(schema)) {
    return res.status(400).json({ error: 'schema shape is not in the allowlist' });
  }
  if (provider !== 'claude' && provider !== 'gemini') {
    return res.status(400).json({ error: `unknown provider: ${provider}` });
  }
  const t0 = Date.now();
  try {
    // Estonian grammar is handled by the Gemini editor pass (corrective),
    // not by prepending the style guide to the generator's system prompt.
    // This keeps the generator focused on narrative craft and saves ~800
    // tokens per turn. The ET_STYLE_GUIDE is still used in EDITOR_SYSTEM.
    const effectiveSystemPrompt = systemPrompt;

    const callOnce = (extraPrompt) => provider === 'claude'
      ? callClaude({ prompt: prompt + (extraPrompt || ''), schema, systemPrompt: effectiveSystemPrompt })
      : callGemini({ prompt: prompt + (extraPrompt || ''), schema, systemPrompt: effectiveSystemPrompt });

    let result = await callOnce();

    // Turn responses have { scene, choices, parameters, gameOver }. For those:
    //   1) Validate choice costs: reject silently by logging, caller trusts AI.
    //   2) If language is Estonian, run scene + gameOverText through Gemini editor.
    // A turn-shaped response may arrive with a malformed `choices` field
    // (object, null, or even a string) if the model drifts off-schema at
    // climax / gameOver moments. Normalise here so frontend `.map()` and
    // playtest `.entries()` don't crash.
    if (result?.data && typeof result.data.scene === 'string' && !Array.isArray(result.data.choices)) {
      console.warn(`turn response has non-array choices (type=${typeof result.data.choices}, provider=${provider}); coerced to []`);
      result.data.choices = [];
    }
    let isTurnShape = result?.data && typeof result.data.scene === 'string' && Array.isArray(result.data.choices);

    // Schema-contract retry: turn-shaped responses MUST have either
    // choices.length === 3 OR gameOver === true. Claude sometimes drifts and
    // emits neither — most often on tense reveal scenes where the model
    // "feels" the turn has concluded. Without fallback, the game freezes.
    //
    // Strategy: two retries with escalating reminders, then server-side
    // coercion (force gameOver=true so the client shows a finale rather
    // than a blank choices panel).
    const isEmptyTurnContract = () =>
      isTurnShape && Array.isArray(result.data.choices) && result.data.choices.length === 0 && result.data.gameOver !== true;
    const RETRY_REMINDERS = [
      '\n\n⚠ SCHEMA CONTRACT: Your previous attempt returned an empty `choices` array with `gameOver: false`. This is not a valid response — the game cannot continue without either 3 choices OR gameOver=true. Retry now: output EXACTLY 3 choices that advance the story, OR set gameOver=true with a full gameOverText.',
      '\n\n⚠ FINAL ATTEMPT: The previous TWO responses returned empty choices with gameOver=false. This will FREEZE THE GAME for the players at the table. You have ONE job right now: either produce 3 concrete choices that let play continue, OR commit to gameOver=true and write a full 3-5 paragraph gameOverText that concludes the scene. Choosing one of these is a REQUIREMENT, not a preference. Do not return empty choices again.',
    ];
    let retried = 0;
    for (const reminder of RETRY_REMINDERS) {
      if (!isEmptyTurnContract()) break;
      retried += 1;
      console.warn(`empty-choices contract violation attempt ${retried} (provider=${provider}); retrying`);
      try {
        const retryResult = await callOnce(reminder);
        if (retryResult?.data && typeof retryResult.data.scene === 'string' && !Array.isArray(retryResult.data.choices)) {
          retryResult.data.choices = [];
        }
        result = retryResult;
        isTurnShape = result?.data && typeof result.data.scene === 'string' && Array.isArray(result.data.choices);
      } catch (e) {
        console.warn(`retry ${retried} failed: ${e.message || e}`);
      }
    }
    // Last-resort coercion: if we still have empty choices + gameOver=false
    // after all retries, force gameOver=true and synthesize a minimal
    // gameOverText from the scene. Better an abrupt ending than a freeze.
    let coercedGameOver = false;
    if (isEmptyTurnContract()) {
      coercedGameOver = true;
      console.warn(`coercing gameOver=true after ${retried} retries failed (provider=${provider})`);
      result.data.gameOver = true;
      if (!result.data.gameOverText || typeof result.data.gameOverText !== 'string' || result.data.gameOverText.trim().length < 20) {
        result.data.gameOverText = (result.data.scene || '') + '\n\n' + (language === 'et'
          ? 'Lugu katkeb siin — jutustaja jäi sõnadega kimbatusse. Mis edasi juhtus, jääb teie kujutlusvõimesse.'
          : 'The story breaks off here — the narrator ran out of words. What happens next is yours to imagine.');
      }
    }
    let editorMs = 0;
    let editorApplied = false;
    if (isTurnShape) {
      logChoiceCostViolations(result.data, provider);
      if (language === 'et' && GEMINI_API_KEY) {
        const te = Date.now();
        try {
          await estonianEditorPass(result.data);
          editorApplied = true;
        } catch (e) {
          console.warn(`editor-pass failed (continuing with unedited): ${e.message || e}`);
        }
        editorMs = Date.now() - te;
      }
    }

    const ms = Date.now() - t0;
    const cacheHit = result.cacheHit;
    console.log(
      `proxy ok: provider=${provider} model=${result.model} ms=${ms}${cacheHit != null ? ` cache=${cacheHit}` : ''}${editorApplied ? ` editor=${editorMs}ms` : ''}${retried ? ` retried=${retried}` : ''}${coercedGameOver ? ' coerced-gameover' : ''}`,
    );
    res.json({ provider, model: result.model, data: result.data });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`proxy (${provider}): upstream timeout`);
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    const status = err.status || 500;
    console.error(`proxy (${provider}):`, status, err.message || err);
    res.status(status).json({ error: err.message || 'Proxy error' });
  }
});

// Warn in logs if any choice has no cost (all expectedChanges zero/positive)
// or if a choice is missing expectedChanges entirely. Does not block — the AI
// self-check is primary; this is telemetry so we can spot drift.
function logChoiceCostViolations(turn, provider) {
  if (!Array.isArray(turn.choices)) return;
  const violations = [];
  turn.choices.forEach((c, i) => {
    const changes = Array.isArray(c.expectedChanges) ? c.expectedChanges : [];
    if (changes.length === 0) { violations.push(`choice[${i}] has no expectedChanges`); return; }
    const hasNegative = changes.some((ch) => typeof ch.change === 'number' && ch.change < 0);
    if (!hasNegative) violations.push(`choice[${i}] has no negative cost: ${JSON.stringify(changes)}`);
  });
  if (violations.length > 0) {
    console.warn(`choice-cost violations (provider=${provider}): ${violations.join(' | ')}`);
  }
}

// Estonian editor pass: send the scene (and optional gameOverText) through
// Gemini Flash with a strict editorial prompt. Fixes invented words, wrong
// word register, and non-native sentence structure while preserving facts.
// Mutates `turn.scene` and `turn.gameOverText` in place.
const EDITOR_SYSTEM = `Sa oled eesti kirjanduse toimetaja. Saad ilukirjandusliku lõigu ja parandad eesti keele vigu — kasuta allpool olevat sõnajärje ja grammatika reeglistikku kontrolljuhisena.

PARANDA:
- Sõnad, mida eesti keeles ei ole (hallutsinatsioonid, valed liitsõnad, otsetõlked inglise keelest — nt "dešifreerib" kui mõeldakse "avab jõuga")
- Sõnad, mis on valel registril (loomahääl masina kohta, murdesõna proosa sees)
- Kalque'd ja kohmakad lauseehitused (inglise-mõõtkavaline struktuur)
- Ebaühtlane ajavorm ühe lõigu sees
- Sõnajärje vead vastavalt allolevale reeglistikule — eelkõige V2-reegli rikkumised, eituspartikli "ei" lahutamine verbist, rõhumäärsõnade ("ka", "just", "isegi") vale asend

ÄRA MUUDA:
- Fakte, tegelaste nimesid, sündmuste sisu
- Atmosfääri ega tooni
- Pikkust olulisel määral — paranda sõnu ja sõnajärge, mitte kompositsiooni ega stseeni mahtu

Vasta AINULT parandatud tekstiga, ilma selgituseta. Kui tekstis pole vigu, vasta täpselt sama tekstiga.

---

${ET_STYLE_GUIDE}`;

const EDITOR_SCHEMA = {
  type: 'OBJECT',
  properties: { corrected: { type: 'STRING' } },
  required: ['corrected'],
};

// Global budget for the entire editor pass (both scene + gameOverText together).
// nginx proxy_read_timeout is 120s; upstream AI call can use up to 115s; we
// keep editor-pass well under the remaining margin so the total stays ≤ 120s.
const EDITOR_TOTAL_BUDGET_MS = 25_000;

async function estonianEditorPass(turnData) {
  // Each task: { label, text, apply }. `apply(corrected)` writes the edited
  // text back to its home in turnData. Choice tasks carry their index so the
  // right element is updated.
  const tasks = [];
  if (turnData.scene && typeof turnData.scene === 'string' && turnData.scene.trim().length > 10) {
    tasks.push({
      label: 'scene',
      text: turnData.scene,
      apply: (c) => { turnData.scene = c; },
    });
  }
  if (turnData.gameOverText && typeof turnData.gameOverText === 'string' && turnData.gameOverText.trim().length > 20) {
    tasks.push({
      label: 'gameOverText',
      text: turnData.gameOverText,
      apply: (c) => { turnData.gameOverText = c; },
    });
  }
  if (Array.isArray(turnData.choices)) {
    turnData.choices.forEach((choice, idx) => {
      if (choice && typeof choice.text === 'string' && choice.text.trim().length > 5) {
        tasks.push({
          label: `choice[${idx}]`,
          text: choice.text,
          apply: (c) => { turnData.choices[idx].text = c; },
        });
      }
    });
  }
  if (tasks.length === 0) return;

  const sharedController = new AbortController();
  const budgetTimer = setTimeout(() => sharedController.abort(), EDITOR_TOTAL_BUDGET_MS);

  try {
    const results = await Promise.all(tasks.map(async (task) => {
      try {
        const edited = await editorCall(task.text, sharedController.signal);
        return { task, edited };
      } catch (e) {
        // Per-task failure: log and leave field unedited. Don't fail the whole pass.
        console.warn(`editor-pass ${task.label} failed: ${e.message || e}`);
        return { task, edited: null };
      }
    }));
    for (const { task, edited } of results) {
      if (edited && edited.length > 0) task.apply(edited);
    }
  } finally {
    clearTimeout(budgetTimer);
  }
}

async function editorCall(text, externalSignal) {
  const body = {
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: EDITOR_SCHEMA,
      temperature: 0.2,
    },
    systemInstruction: { parts: [{ text: EDITOR_SYSTEM }] },
  };
  const res = await fetch(geminiUrl(GEMINI_MODEL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: externalSignal,
  });
  if (!res.ok) throw new Error(`editor HTTP ${res.status}`);
  const raw = await res.json();
  const responseText = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) throw new Error('editor returned empty response');
  const parsed = JSON.parse(responseText);
  return typeof parsed.corrected === 'string' ? parsed.corrected : null;
}

// Game schemas were written for Gemini's responseSchema, which accepts
// uppercase type names ("OBJECT", "STRING", ...). JSON Schema (and thus
// Claude's tool input_schema) requires lowercase. Walk the schema tree and
// lowercase any `type` string values before handing to Claude.
function normalizeSchemaForClaude(node) {
  if (Array.isArray(node)) {
    return node.map(normalizeSchemaForClaude);
  }
  if (node !== null && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === 'type' && typeof value === 'string') {
        out[key] = value.toLowerCase();
      } else {
        out[key] = normalizeSchemaForClaude(value);
      }
    }
    return out;
  }
  return node;
}

async function callClaude({ prompt, schema, systemPrompt }) {
  if (!anthropic) {
    const err = new Error('Claude not configured on this proxy');
    err.status = 503;
    throw err;
  }
  const createParams = {
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    tools: [
      {
        name: 'respond',
        description: 'Submit the structured response that matches the requested schema.',
        input_schema: normalizeSchemaForClaude(schema),
      },
    ],
    tool_choice: { type: 'tool', name: 'respond' },
    messages: [{ role: 'user', content: prompt }],
  };
  if (systemPrompt) {
    createParams.system = [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }];
  }
  const message = await anthropic.messages.create(createParams, { timeout: UPSTREAM_TIMEOUT_MS });

  const toolUse = message.content.find((b) => b.type === 'tool_use');
  if (!toolUse || typeof toolUse.input !== 'object') {
    throw new Error('Claude did not emit a structured tool_use block');
  }
  const usage = message.usage;
  const cacheHit = usage?.cache_read_input_tokens > 0 ? `${usage.cache_read_input_tokens}tok` : 'miss';
  return { model: CLAUDE_MODEL, data: toolUse.input, cacheHit };
}

async function callGemini({ prompt, schema, systemPrompt }) {
  if (!GEMINI_API_KEY) {
    const err = new Error('Gemini not configured on this proxy');
    err.status = 503;
    throw err;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const geminiBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.8,
      },
    };
    if (systemPrompt) geminiBody.systemInstruction = { parts: [{ text: systemPrompt }] };
    const upstream = await fetch(geminiUrl(GEMINI_MODEL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
      signal: controller.signal,
    });
    const body = await upstream.json();
    if (!upstream.ok) {
      const err = new Error(body?.error?.message || 'Gemini upstream error');
      err.status = upstream.status;
      throw err;
    }
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini returned an empty response');
    }
    return { model: GEMINI_MODEL, data: JSON.parse(text) };
  } finally {
    clearTimeout(timer);
  }
}

app.listen(PORT, () => {
  const claudeInfo = anthropic ? CLAUDE_MODEL : 'disabled';
  const geminiInfo = GEMINI_API_KEY ? GEMINI_MODEL : 'disabled';
  console.log(
    `adventure-proxy listening on :${PORT} | default=${DEFAULT_PROVIDER} | claude=${claudeInfo} | gemini=${geminiInfo}`,
  );
});
