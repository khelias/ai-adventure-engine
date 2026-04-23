// Language-specific strings SENT TO THE AI. Sits next to translations.ts
// (UI-facing strings) so all language content lives in one directory, but
// the two files target different audiences:
//   - translations.ts → browser users (labels, buttons, error messages)
//   - lang-packs.ts   → language models (prompt blocks, few-shots, system reminders)
//
// Every string here leaves the code base and ends up inside a prompt, a turn's
// user message, or is echoed back as the synthetic 'choice' that kicks off a
// game. To add a new target language, add a new key to LANG_PACKS with the
// full pack and the rest of the system picks it up automatically.
//
// Keep the keys language-neutral (`instruction`, `fewShotExample`), not
// language-specific (`ESTONIAN_EXAMPLE`), so nothing about the English-vs-
// Estonian split is baked into the surrounding code.

import type { Language } from '../game/types'

export type AiLangPack = {
  /** Top-of-system-prompt language rules. Always included. */
  instruction: string
  /** Optional few-shot example block. Empty string = no example for this language. */
  fewShotExample: string
  /** Optional extra reminder injected at the top of the turn user-prompt. Empty = none. */
  turnReminder: string
  /** Synthetic player choice sent on turn 1 to kick off the story. */
  gameStartChoice: string
  /** Title used when a game is a sequel to a previous run. */
  sequelTitle: string
  /** Name of the language — used when telling another service (e.g. Gemini) what to output. */
  label: 'Estonian' | 'English'
}

const et: AiLangPack = {
  instruction: `LANGUAGE: Write all player-facing text in natural, native-level Estonian (eesti keel).
- Think and write in Estonian. Do NOT translate from English. Avoid anglicised sentence structure.
- Choices MUST be in kolmandas isikus — name the acting character as the grammatical subject: "Mari avab ukse vaikselt." / "Jaan kustutab lambi ja ootab." / "Karin koputab uksele." NEVER meie-vorm ("Avame ukse"), NEVER teie-vorm ("Te avate ukse"), NEVER abstract "Grupp otsustab".
- Parameter names: 1-3 words, noun/noun phrase. States: 2-4 words each, no full sentences.
- Character names (role.name) MUST be proper Estonian first names (e.g. Mari, Jaan, Karin, Mattis) — NOT job titles. Put the profession/role in role.description.
- Prefer simple, common words over rare compounds. If unsure whether a compound exists, use two separate words instead.`,

  fewShotExample: `EXAMPLE OF A GOOD TURN (match this style — especially scene length, sentence rhythm, and how each choice names a specific character as actor):

Scene:
"Koridor lõpeb raudukse ees. Midagi kriibib seina taga metalli vastu — aeglaselt, nagu küüned, kes otsivad pragu. Mari taskulamp väriseb; ta hoiab seda kahe käega, aga käed ise ei pea."

Choices (assume roles: 0=Mari, 1=Jaan, 2=Karin; parameters: "Mari jõud", "Mari ja Jaan usaldus", "Zombide laine"):
- { text: "Mari avab ukse vaikselt ja astub esimesena ette.", actor: 0, expectedChanges: [{name:"Mari ja Jaan usaldus", change:+1}, {name:"Zombide laine", change:-1}] }
  → courage axis: Mari takes the risk herself, shielding the others.
- { text: "Jaan kustutab lambi ja jätab Mari pimedusse ukse ette.", actor: 1, target: 0, expectedChanges: [{name:"Mari ja Jaan usaldus", change:-1}, {name:"Zombide laine", change:+1}] }
  → loyalty axis: Jaan sacrifices Mari's position for the group's concealment. Target is Mari.
- { text: "Karin tunnistab kõigile, et kuulis seda häält juba pool tundi tagasi.", actor: 2, expectedChanges: [{name:"Mari ja Jaan usaldus", change:-1}, {name:"Zombide laine", change:-1}] }
  → truth axis: Karin reveals withheld information — pair trust drops, but the threat is newly understood.

Note: 3 sentences total in the scene. Each choice names one character as grammatical subject AND sets actor. The three choices test three different moral axes (courage / loyalty / truth), not three variants of the same question. Parameter names anchor to named people ("Mari jõud", "Mari ja Jaan usaldus") or a specific threat ("Zombide laine") — never abstract ("Jõud", "Usaldus"). expectedChanges lists ONLY the parameters that actually move this turn — never include a zero-change entry. The choice TEXT does not spell numbers; the action implies the cost clearly.`,

  turnReminder: 'LANGUAGE REMINDER: Scene and all choices MUST be written in Estonian (eesti keel). Natural, vivid, colloquial — not translated from English.\n\n',

  gameStartChoice: 'Mäng algab.',
  sequelTitle: 'Järjelugu',
  label: 'Estonian',
}

const en: AiLangPack = {
  instruction: `LANGUAGE: Write all player-facing text in English.
- Choices MUST be in third person with the acting character as the subject: "Mari opens the door." / "Jaan kills the light and waits." NEVER "We open the door." NEVER "The group decides".`,

  fewShotExample: '',
  turnReminder: '',
  gameStartChoice: 'The game begins.',
  sequelTitle: 'Sequel',
  label: 'English',
}

export const LANG_PACKS: Record<Language, AiLangPack> = { et, en }
