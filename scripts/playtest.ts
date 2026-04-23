#!/usr/bin/env tsx
// Playtest harness: simulates the frontend, plays a full game through the
// proxy API, writes a Markdown transcript.
//
// Imports live prompts + engine from src/ — no duplication. When prompts.ts
// or engine.ts change, this runner follows automatically.
//
// Run:
//   npx tsx scripts/playtest.ts --duration=Short --strategy=balanced
//
// See scripts/README.md for full options.

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'

import {
  storyGenerationPrompt,
  storyGenerationSchema,
  turnPrompt,
  turnSchema,
  getStoryPhase,
  type TurnResponse,
} from '../src/game/prompts'
import {
  applyParameterChanges,
  findBrokenParameters,
  findJustBrokenParameters,
  isUnrecoverable,
  durationToMaxTurns,
} from '../src/game/engine'
import { LANG_PACKS } from '../src/i18n/lang-packs'
import type {
  Choice,
  ContextInput,
  Duration,
  Genre,
  Language,
  Parameter,
  Provider,
  Role,
  Story,
} from '../src/game/types'

// ---------- CLI ----------

const { values } = parseArgs({
  options: {
    genre: { type: 'string', default: 'Zombies' },
    duration: { type: 'string', default: 'Medium' },
    players: { type: 'string', default: '3' },
    language: { type: 'string', default: 'et' },
    provider: { type: 'string', default: 'claude' },
    strategy: { type: 'string', default: 'balanced' },
    endpoint: { type: 'string', default: 'https://games.khe.ee/adventure/api/generate' },
    out: { type: 'string' },
    'skip-parametric-end': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false, short: 'h' },
  },
})

if (values.help) {
  console.log(`
Usage: npx tsx scripts/playtest.ts [options]

  --genre=<Zombies|Fantasy|Sci-Fi|Thriller|Cyberpunk|Post-Apocalyptic>
                              Default: Zombies
  --duration=<Short|Medium|Long>   Default: Medium   (8 / 15 / 20 turns)
  --players=<1..6>            Default: 3
  --language=<et|en>          Default: et
  --provider=<claude|gemini>  Default: claude
  --strategy=<first|random|balanced|protect-threat>
                              Default: balanced  (see README)
  --endpoint=<url>            Default: https://games.khe.ee/adventure/api/generate
  --skip-parametric-end       Continue past engine's auto-end to see climax/resolution
  --out=<path>                Transcript output. Default: playtest-transcripts/<...>.md
  --help, -h                  Show this help
`)
  process.exit(0)
}

type StrategyName = 'first' | 'random' | 'balanced' | 'protect-threat'

const genre = values.genre as Genre
const duration = values.duration as Duration
const players = Number(values.players)
const language = values.language as Language
const provider = values.provider as Provider
const strategy = values.strategy as StrategyName
const endpoint = values.endpoint!
const skipParametricEnd = Boolean(values['skip-parametric-end'])
const maxTurns = durationToMaxTurns(duration)

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const transcriptsDir = path.join(repoRoot, 'playtest-transcripts')
fs.mkdirSync(transcriptsDir, { recursive: true })
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outPath =
  values.out ??
  path.join(transcriptsDir, `${timestamp}__${genre}-${duration}-${strategy}${skipParametricEnd ? '-skipend' : ''}.md`)

// ---------- API ----------

async function callAI<T>(
  prompt: string,
  schema: unknown,
  providerArg: Provider,
  systemPrompt?: string,
): Promise<{ data: T; model: string }> {
  const body: Record<string, unknown> = { prompt, schema, provider: providerArg, language }
  if (systemPrompt) body.systemPrompt = systemPrompt
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Proxy's origin allowlist permits https://games.khe.ee; the playtest
      // script identifies itself as that origin so it isn't rejected as abuse.
      Origin: 'https://games.khe.ee',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`)
  }
  const json = (await res.json()) as { data: T; model: string }
  return json
}

// ---------- Strategies ----------

function pickChoice(choices: Choice[], parameters: Parameter[], strat: StrategyName): Choice {
  if (choices.length === 0) throw new Error('No choices to pick from')
  if (strat === 'first') return choices[0]
  if (strat === 'random') return choices[Math.floor(Math.random() * choices.length)]
  if (strat === 'protect-threat') {
    // Heuristic: THREAT is generated last in story gen. Rank by most +change on it.
    const threatName = parameters[parameters.length - 1].name
    return [...choices].sort((a, b) => threatChange(b, threatName) - threatChange(a, threatName))[0]
  }
  // balanced: score by change × criticality weight (closer to worst = weightier)
  return [...choices].sort((a, b) => scoreChoice(b, parameters) - scoreChoice(a, parameters))[0]
}

function threatChange(c: Choice, name: string): number {
  return c.expectedChanges?.find((ec) => ec.name === name)?.change ?? 0
}

function scoreChoice(choice: Choice, parameters: Parameter[]): number {
  const changes = choice.expectedChanges ?? []
  let score = 0
  for (const p of parameters) {
    const ch = changes.find((c) => c.name === p.name)?.change ?? 0
    const criticality = p.currentStateIndex / Math.max(1, p.states.length - 1)
    score += ch * (1 + criticality * 3)
  }
  return score
}

// ---------- Transcript ----------

function log(line = '') {
  console.log(line)
  fs.appendFileSync(outPath, line + '\n')
}

function paramsLine(parameters: Parameter[]): string {
  return parameters
    .map((p) => `${p.name}=${p.currentStateIndex + 1}/4 "${p.states[p.currentStateIndex]}"`)
    .join(' · ')
}

// ---------- Main ----------

async function main() {
  fs.writeFileSync(outPath, '')
  log(`# Playtest transcript`)
  log('')
  log(`| Field | Value |`)
  log(`|---|---|`)
  log(`| When | ${new Date().toISOString()} |`)
  log(`| Genre | ${genre} |`)
  log(`| Duration | ${duration} (${maxTurns} turns) |`)
  log(`| Players | ${players} |`)
  log(`| Language | ${language} |`)
  log(`| Provider | ${provider} |`)
  log(`| Strategy | ${strategy} |`)
  log(`| Skip parametric end | ${skipParametricEnd} |`)
  log(`| Endpoint | ${endpoint} |`)
  log('')

  // ---- Story generation ----
  log(`## Story generation`)
  log('')
  const ctx: ContextInput = { location: '', playersDesc: '', vibe: '', insideJoke: '' }
  const t0 = Date.now()
  const storyPrompt = storyGenerationPrompt({ players, genre, duration, language, context: ctx })
  const storyResp = await callAI<{ stories: Story[] }>(storyPrompt, storyGenerationSchema, 'claude')
  const story = storyResp.data.stories[0]
  log(`_model: ${storyResp.model} · ${Date.now() - t0}ms_`)
  log('')
  log(`### ${story.title}`)
  log('')
  log(`> ${story.summary}`)
  log('')
  log(`**Characters:**`)
  for (const r of story.roles) log(`- **${r.name}** — ${r.description}  _(ability: ${r.ability})_`)
  log('')
  log(`**Parameters:**`)
  for (const p of story.parameters) log(`- **${p.name}**: ${p.states.join(' → ')}`)
  log('')

  // ---- State init ----
  let roles: Role[] = story.roles.map((r, i) => ({ ...r, id: i, used: false }))
  let parameters: Parameter[] = story.parameters.map((p) => ({ ...p, currentStateIndex: 0 }))
  const recentScenes: string[] = []
  let nextChoice = LANG_PACKS[language].gameStartChoice
  let endReason: 'narrative' | 'parametric' | 'maxTurns' | 'api-error' = 'maxTurns'

  // ---- Turn loop ----
  for (let t = 1; t <= maxTurns; t++) {
    log(`## Turn ${t} / ${maxTurns}`)
    log('')
    log(`- **Phase**: ${getStoryPhase(t, maxTurns)}`)
    log(`- **State**: ${paramsLine(parameters)}`)
    log(`- **Last choice**: ${nextChoice}`)
    log('')

    const { system, user } = turnPrompt({
      currentTurn: t,
      maxTurns,
      genre,
      title: story.title,
      summary: story.summary,
      parameters,
      roles,
      recentScenes,
      choiceText: nextChoice,
      language,
      context: ctx,
    })

    const turnStart = Date.now()
    let resp: { data: TurnResponse; model: string }
    try {
      resp = await callAI<TurnResponse>(user, turnSchema, provider, system)
    } catch (err) {
      log(`**API error**: ${(err as Error).message}`)
      endReason = 'api-error'
      break
    }
    const r = resp.data
    log(`_model: ${resp.model} · ${Date.now() - turnStart}ms_`)
    log('')
    log(`**Scene:**`)
    log('')
    log(`> ${r.scene.replace(/\n+/g, '\n> ')}`)
    log('')
    const deltas = Array.isArray(r.parameters) ? r.parameters : []
    log(`**Param deltas**: ${deltas.map((p) => `${p.name}:${p.change >= 0 ? '+' : ''}${p.change}`).join(', ') || '(none)'}`)
    log('')
    log(`**Choices:**`)
    for (const [i, c] of r.choices.entries()) {
      const cost = (c.expectedChanges ?? [])
        .map((ec) => `${ec.name}:${ec.change >= 0 ? '+' : ''}${ec.change}`)
        .join(', ') || '_none declared_'
      const actorLabel = c.actor !== undefined ? ` _[actor=${c.actor}]_` : ''
      const ability = c.isAbility ? ` **[ABILITY]**` : ''
      log(`- ${i + 1}.${actorLabel} ${c.text}${ability}  _(cost: ${cost})_`)
    }
    log('')

    if (r.gameOver) {
      log(`### GAME OVER — narrative`)
      log('')
      log(r.gameOverText || '_(no gameOverText provided)_')
      log('')
      endReason = 'narrative'
      break
    }

    recentScenes.push(r.scene)
    if (recentScenes.length > 3) recentScenes.shift()
    parameters = applyParameterChanges(parameters, deltas)

    const justBroke = findJustBrokenParameters(parameters)
    if (justBroke.length > 0) {
      log(`> ⚠ _Phase transition: **${justBroke.map((p) => p.name).join(', ')}** just hit worst state. AI should dramatize the consequence next turn._`)
      log('')
    }

    const broken = findBrokenParameters(parameters)
    if (isUnrecoverable(parameters) && !skipParametricEnd) {
      log(`### UNRECOVERABLE — requesting AI-narrated end`)
      log('')
      log(`Broken parameters: ${broken.map((p) => `**${p.name}** ("${p.states[p.states.length - 1]}")`).join(', ')}`)
      log('')
      // Call the AI once more with forceEnd flag
      const endPrompt = turnPrompt({
        currentTurn: t + 1,
        maxTurns,
        genre,
        title: story.title,
        summary: story.summary,
        parameters,
        roles,
        recentScenes,
        choiceText: pickChoice(r.choices, parameters, strategy).text,
        language,
        context: ctx,
        forceEnd: 'unrecoverable',
      })
      try {
        const endResp = await callAI<TurnResponse>(endPrompt.user, turnSchema, provider, endPrompt.system)
        log(`_model: ${endResp.model}_`)
        log('')
        log(`**Final scene:**`)
        log('')
        log(`> ${endResp.data.scene.replace(/\n+/g, '\n> ')}`)
        log('')
        log(`**Game Over text (AI-narrated):**`)
        log('')
        log(endResp.data.gameOverText || '_(no text)_')
        log('')
      } catch (err) {
        log(`**End narration failed**: ${(err as Error).message}`)
      }
      endReason = 'parametric'
      break
    }
    if (broken.length >= 1 && skipParametricEnd) {
      log(`> ℹ _[skip-parametric-end] ${broken.length} param(s) at worst — continuing. (New logic: 2+ needed anyway.)_`)
      log('')
    }

    const picked = pickChoice(r.choices, parameters, strategy)
    if (picked.isAbility && typeof picked.actor === 'number') {
      roles = roles.map((role) => (role.id === picked.actor ? { ...role, used: true } : role))
    }
    nextChoice = picked.text
    log(`**→ Strategy "${strategy}" picks:** ${picked.text}`)
    log('')
    log(`---`)
    log('')
  }

  // ---- End ----
  log(`## End`)
  log('')
  log(`- **Reason**: ${endReason}`)
  log(`- **Final params**: ${paramsLine(parameters)}`)
  log(`- **Abilities used**: ${roles.filter((r) => r.used).map((r) => r.name).join(', ') || 'none'}`)
  log('')
  console.error(`\nTranscript: ${outPath}`)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
