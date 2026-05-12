/**
 * Deterministic eval — runs rule-based checks over playtest transcripts.
 *
 * Why deterministic checks first: they are fast, free, reproducible, and
 * encode product invariants that should NEVER break regardless of model
 * choice. They form the bottom of the eval pyramid; LLM-as-judge sits on
 * top later.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const TRANSCRIPTS_DIR = join(HERE, '..', '..', 'playtest-transcripts');

// ---------- Types ----------

type Choice = {
  index: number;
  text: string;
  costs: Array<{ param: string; delta: number }>;
};

type Turn = {
  number: number;
  phase: string;
  scene: string | null;
  choices: Choice[];
};

type Transcript = {
  file: string;
  language: string;
  provider: string;
  turns: Turn[];
};

type CheckResult = {
  check: string;
  pass: boolean;
  detail?: string;
};

// ---------- Parser ----------
// The transcript is Markdown with a stable structure (see playtest.ts).
// We do not need a full Markdown parser; targeted regexes are enough and
// keep the dependency list at zero.

function parseTranscript(path: string): Transcript {
  const raw = readFileSync(path, 'utf8');

  const language = raw.match(/\| Language \| (\w+) \|/)?.[1] ?? 'unknown';
  const provider = raw.match(/\| Provider \| (\w+) \|/)?.[1] ?? 'unknown';

  // Split by "## Turn N / M" headers. The "## Story generation" and "## End"
  // sections are ignored for now — they need their own checks later.
  const turnBlocks = raw.split(/\n## Turn (\d+) \/ \d+\n/);
  // After split: [preamble, "1", block1, "2", block2, ...]
  const turns: Turn[] = [];
  for (let i = 1; i < turnBlocks.length; i += 2) {
    const num = Number(turnBlocks[i]);
    const body = turnBlocks[i + 1];
    turns.push(parseTurn(num, body));
  }

  return { file: path, language, provider, turns };
}

function parseTurn(number: number, body: string): Turn {
  const phase = body.match(/\*\*Phase\*\*: (\w+)/)?.[1] ?? 'unknown';

  // Scene is the first blockquote after "**Scene:**".
  const sceneMatch = body.match(/\*\*Scene:\*\*\n\n> ([\s\S]*?)\n\n/);
  const scene = sceneMatch ? sceneMatch[1].trim() : null;

  // Each choice line: "- 1. <text>  _(cost: Param:+1, Other:-1)_"
  // The "[ABILITY roleIndex=N]" marker may sit before the cost block.
  const choices: Choice[] = [];
  const choiceRegex =
    /^- (\d+)\. (.+?)\s+_\(cost: ([^)]+)\)_\s*$/gm;
  const choiceBlock = body.split(/\*\*Choices:\*\*/)[1] ?? '';
  let m: RegExpExecArray | null;
  while ((m = choiceRegex.exec(choiceBlock)) !== null) {
    const [, idx, text, costStr] = m;
    const costs = costStr.split(',').map((part) => {
      const [param, delta] = part.split(':').map((s) => s.trim());
      return { param, delta: Number(delta) };
    });
    choices.push({ index: Number(idx), text: text.trim(), costs });
  }

  return { number, phase, scene, choices };
}

// ---------- Checks ----------
// Each check returns a CheckResult per turn. Keep checks pure and tiny —
// one rule per function so failures point at one specific invariant.

function checkSceneLength(turn: Turn): CheckResult {
  // Scenes below ~200 chars feel skeletal; above ~1000 chars hurt
  // pass-the-phone readability. Bounds are heuristic, not contractual.
  const MIN = 200;
  const MAX = 1000;
  if (turn.scene == null) {
    return { check: 'scene_length', pass: true, detail: 'no scene (end?)' };
  }
  const len = turn.scene.length;
  if (len < MIN || len > MAX) {
    return {
      check: 'scene_length',
      pass: false,
      detail: `${len} chars (expected ${MIN}-${MAX})`,
    };
  }
  return { check: 'scene_length', pass: true };
}

function checkChoicesCount(turn: Turn): CheckResult {
  // Product invariant: every turn presents exactly three choices.
  // Exception: terminal turns (game over) legitimately have zero.
  if (turn.choices.length === 0) {
    return { check: 'choices_count', pass: true, detail: 'terminal turn' };
  }
  if (turn.choices.length !== 3) {
    return {
      check: 'choices_count',
      pass: false,
      detail: `got ${turn.choices.length}`,
    };
  }
  return { check: 'choices_count', pass: true };
}

function checkChoiceHasCost(turn: Turn): CheckResult {
  // Product invariant: every choice must cost something. Per engine.ts
  // (the authoritative source for sign semantics), `change = -1` moves a
  // parameter toward its worst state and is therefore THE cost direction.
  // Mirrors proxy/server.js getChoiceCostViolations.
  const offenders = turn.choices.filter(
    (c) => !c.costs.some((cost) => cost.delta < 0),
  );
  if (offenders.length > 0) {
    return {
      check: 'choice_has_cost',
      pass: false,
      detail: `choices #${offenders.map((o) => o.index).join(',')} have no negative (worsening) delta`,
    };
  }
  return { check: 'choice_has_cost', pass: true };
}

function checkEstonianMarkers(turn: Turn): CheckResult {
  // Cheap proxy for "is this really Estonian": does the scene contain at
  // least one Estonian-specific letter? Real langdetect would be more
  // robust; for v0 this catches the obvious "model slipped into English"
  // failure mode.
  if (turn.scene == null) {
    return { check: 'estonian_markers', pass: true, detail: 'no scene' };
  }
  const hasEtChar = /[äöõüÄÖÕÜ]/.test(turn.scene);
  if (!hasEtChar) {
    return {
      check: 'estonian_markers',
      pass: false,
      detail: 'no ä/ö/õ/ü letters found',
    };
  }
  return { check: 'estonian_markers', pass: true };
}

const TURN_CHECKS = [
  checkSceneLength,
  checkChoicesCount,
  checkChoiceHasCost,
  checkEstonianMarkers,
];

// ---------- Runner ----------

function shortName(path: string): string {
  return path.split('/').pop() ?? path;
}

function main(): void {
  const files = readdirSync(TRANSCRIPTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(TRANSCRIPTS_DIR, f));

  const transcripts = files.map(parseTranscript);

  const totals: Record<string, { pass: number; fail: number }> = {};
  const failures: Array<{ file: string; turn: number; result: CheckResult }> =
    [];

  for (const t of transcripts) {
    // Only check Estonian-language transcripts for the language marker.
    for (const turn of t.turns) {
      for (const check of TURN_CHECKS) {
        if (check === checkEstonianMarkers && t.language !== 'et') continue;
        const r = check(turn);
        totals[r.check] ??= { pass: 0, fail: 0 };
        if (r.pass) totals[r.check].pass++;
        else {
          totals[r.check].fail++;
          failures.push({ file: shortName(t.file), turn: turn.number, result: r });
        }
      }
    }
  }

  console.log(`\nParsed ${transcripts.length} transcripts.\n`);
  console.log('Check summary:');
  for (const [name, counts] of Object.entries(totals)) {
    const total = counts.pass + counts.fail;
    const pct = total === 0 ? 0 : Math.round((counts.pass / total) * 100);
    console.log(
      `  ${name.padEnd(22)} ${counts.pass}/${total} pass (${pct}%)`,
    );
  }

  if (failures.length === 0) {
    console.log('\nNo failures.\n');
    return;
  }

  console.log(`\nFailures (${failures.length}):`);
  for (const f of failures) {
    console.log(
      `  ${f.file} · turn ${f.turn} · ${f.result.check}: ${f.result.detail ?? ''}`,
    );
  }
  console.log();
}

main();
