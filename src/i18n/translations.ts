import type { Language } from '../game/types'

interface StringTable {
  appTitle: string
  playerCountLabel: string
  advancedToggle: string
  groupSectionHeader: string
  groupSectionHint: string
  locationLabel: string
  locationPlaceholder: string
  playersDescLabel: string
  playersDescPlaceholder: string
  vibeLabel: string
  vibeAny: string
  vibeLight: string
  vibeTense: string
  vibeDark: string
  insideJokeLabel: string
  insideJokePlaceholder: string
  customChoiceLink: string
  customChoicePlaceholder: string
  customChoiceSubmit: string
  customChoiceCancel: string
  genreLabel: string
  genreZombies: string
  genreFantasy: string
  genreSciFi: string
  genreThriller: string
  genreCyberpunk: string
  genrePostApocalyptic: string
  durationLabel: string
  durationShort: string
  durationMedium: string
  durationLong: string
  providerLabel: string
  providerClaude: string
  providerGemini: string
  generateStoryBtn: string
  storyChoiceTitle: string
  regenerateBtn: string
  customStoryTitle: string
  customStoryPlaceholder: string
  useCustomStoryBtn: string
  useThisStoryBtn: string
  roleAssignTitle: string
  startGameBtn: string
  parametersTitle: string
  sceneTitle: string
  choiceTitle: string
  summaryTitle: string
  sequelLabel: string
  restartBtn: string
  continueSequelBtn: string
  abilityLabel: string
  turn: string
  durationDisplay: string
  playerName: string
  playerNamePlaceholder: string
  usedLabel: string
  defaultNamesBtn: string
  sceneLabel: string
  showFullStoryBtn: string
  hideFullStoryBtn: string
  copyStoryBtn: string
  copiedMsg: string
  endNarrative: string
  endParametric: string
  endGenericText: string
  loading: string
  endParametricText: (paramName: string, state: string) => string
  errorApi: (msg: string) => string
  errorStart: (msg: string) => string
  errorSequel: (msg: string) => string
  errorCustom: (msg: string) => string
}

export const translations: Record<Language, StringTable> = {
  et: {
    appTitle: 'AI Seiklusmootor',
    playerCountLabel: 'Mängijate arv:',
    advancedToggle: 'Muud seaded (valikuline)',
    groupSectionHeader: 'Sinu grupp',
    groupSectionHint: 'Ütle kes täna mängib — kirjutame loo teie enda jaoks, mitte võõrastest.',
    locationLabel: 'Kus te praegu olete?',
    locationPlaceholder: 'nt buss, köök, rannakuur, kontor...',
    playersDescLabel: 'Kes on ruumis?',
    playersDescPlaceholder: 'nt Mart, Mari ja Jaan — vanad koolikaaslased',
    vibeLabel: 'Mängu meeleolu',
    vibeAny: 'Mis tuleb, see tuleb',
    vibeLight: 'Kerge & naljakas',
    vibeTense: 'Pingeline & tõsine',
    vibeDark: 'Tume & atmosfäärne',
    insideJokeLabel: 'Midagi täna juhtus? (inside joke)',
    insideJokePlaceholder: 'nt Mari kukkus täna jalgrattalt, Mart unustas sünnipäeva...',
    customChoiceLink: 'Kirjuta oma valik',
    customChoicePlaceholder: 'Mida grupp teeb?',
    customChoiceSubmit: 'Kinnita',
    customChoiceCancel: 'Tühista',
    genreLabel: 'Žanr:',
    genreZombies: 'Zombid',
    genreFantasy: 'Fantaasia',
    genreSciFi: 'Ulme',
    genreThriller: 'Põnevik',
    genreCyberpunk: 'Küberpunk',
    genrePostApocalyptic: 'Postapokalüptiline',
    durationLabel: 'Mängu kestvus:',
    durationShort: 'Lühike (~5-8 käiku)',
    durationMedium: 'Keskmine (~9-15 käiku)',
    durationLong: 'Pikk (16+ käiku)',
    providerLabel: 'AI mudel:',
    providerClaude: 'Claude (parem kvaliteet)',
    providerGemini: 'Gemini (kiire, odav)',
    generateStoryBtn: 'Loo seiklus',
    storyChoiceTitle: 'Sinu seiklus',
    regenerateBtn: 'Genereeri uus',
    customStoryTitle: 'Kirjuta oma stsenaarium',
    customStoryPlaceholder:
      'Näiteks: Ellujäänud on varjunud vanasse kaubamajja, kuid toiduvarud on lõppemas ja hord läheneb...',
    useCustomStoryBtn: 'Kasuta oma lugu',
    useThisStoryBtn: 'Vali see lugu',
    roleAssignTitle: 'Määra rollid ja nimed',
    startGameBtn: 'Alusta Mängu!',
    parametersTitle: 'Parameetrid',
    sceneTitle: 'Praegune olukord',
    choiceTitle: 'Mida te teete?',
    summaryTitle: 'Kokkuvõte:',
    sequelLabel: 'Järjeloo tekst (kopeeri see uue mängu alustamiseks):',
    restartBtn: 'Alusta uuesti',
    continueSequelBtn: 'Jätka järjelooga',
    abilityLabel: 'Erioskus',
    turn: 'Käik',
    durationDisplay: 'Kestvus',
    playerName: 'Mängija',
    playerNamePlaceholder: 'Sisesta uus nimi soovi korral',
    usedLabel: 'Kasutatud',
    defaultNamesBtn: 'Kasuta Mängija 1, 2, 3…',
    sceneLabel: 'Stseen',
    showFullStoryBtn: 'Näita kogu lugu',
    hideFullStoryBtn: 'Peida kogu lugu',
    copyStoryBtn: 'Kopeeri tekst',
    copiedMsg: 'Kopeeritud!',
    endNarrative: 'Narratiivne Lõpp',
    endParametric: 'Parameetriline Kaotus',
    endGenericText: 'Seiklus on jõudnud ootamatu lõpuni.',
    loading: 'Laen...',
    endParametricText: (paramName, state) =>
      `Olukord muutus lootusetuks. ${paramName} jõudis kriitilisele tasemele (${state}). Teie grupp ei pidanud vastu.`,
    errorApi: (msg) => `AI-ga suhtlemisel tekkis viga: ${msg}`,
    errorStart: (msg) => `Mängu alustamisel tekkis viga: ${msg}`,
    errorSequel: (msg) => `Järjeloo genereerimisel tekkis viga: ${msg}`,
    errorCustom: (msg) => `Uue loo genereerimisel tekkis viga: ${msg}`,
  },
  en: {
    appTitle: 'AI Adventure Engine',
    playerCountLabel: 'Number of players:',
    advancedToggle: 'Other settings (optional)',
    groupSectionHeader: 'Your group',
    groupSectionHint: "Tell us who's playing tonight — we'll write the story for you, not for strangers.",
    locationLabel: 'Where are you right now?',
    locationPlaceholder: 'e.g. bus, kitchen, beach house, office...',
    playersDescLabel: 'Who is in the room?',
    playersDescPlaceholder: 'e.g. Alex, Sarah, and John — old school friends',
    vibeLabel: 'Game mood',
    vibeAny: 'Whatever happens, happens',
    vibeLight: 'Light & humorous',
    vibeTense: 'Tense & serious',
    vibeDark: 'Dark & atmospheric',
    insideJokeLabel: "Anything that happened today? (inside joke)",
    insideJokePlaceholder: "e.g. Alex's car broke down, Sarah forgot someone's birthday...",
    customChoiceLink: 'Write your own choice',
    customChoicePlaceholder: 'What does the group do?',
    customChoiceSubmit: 'Confirm',
    customChoiceCancel: 'Cancel',
    genreLabel: 'Genre:',
    genreZombies: 'Zombies',
    genreFantasy: 'Fantasy',
    genreSciFi: 'Sci-Fi',
    genreThriller: 'Thriller',
    genreCyberpunk: 'Cyberpunk',
    genrePostApocalyptic: 'Post-Apocalyptic',
    durationLabel: 'Game duration:',
    durationShort: 'Short (~5-8 turns)',
    durationMedium: 'Medium (~9-15 turns)',
    durationLong: 'Long (16+ turns)',
    providerLabel: 'AI model:',
    providerClaude: 'Claude (better quality)',
    providerGemini: 'Gemini (fast, cheap)',
    generateStoryBtn: 'Create Adventure',
    storyChoiceTitle: 'Your adventure',
    regenerateBtn: 'Regenerate',
    customStoryTitle: 'Write your own scenario',
    customStoryPlaceholder:
      'Example: The survivors are hiding in an old mall, but food is running out and the horde is approaching...',
    useCustomStoryBtn: 'Use your story',
    useThisStoryBtn: 'Use this story',
    roleAssignTitle: 'Assign roles and names',
    startGameBtn: 'Start Game!',
    parametersTitle: 'Parameters',
    sceneTitle: 'Current Situation',
    choiceTitle: 'What do you do?',
    summaryTitle: 'Summary:',
    sequelLabel: 'Sequel text (copy this to start a new game):',
    restartBtn: 'Restart',
    continueSequelBtn: 'Continue with a sequel',
    abilityLabel: 'Special ability',
    turn: 'Turn',
    durationDisplay: 'Duration',
    playerName: 'Player',
    playerNamePlaceholder: 'Enter new name if desired',
    usedLabel: 'Used',
    defaultNamesBtn: 'Use Player 1, 2, 3…',
    sceneLabel: 'Scene',
    showFullStoryBtn: 'Show full story',
    hideFullStoryBtn: 'Hide full story',
    copyStoryBtn: 'Copy text',
    copiedMsg: 'Copied!',
    endNarrative: 'Narrative End',
    endParametric: 'Parametric Loss',
    endGenericText: 'The adventure has come to an unexpected end.',
    loading: 'Loading...',
    endParametricText: (paramName, state) =>
      `The situation became hopeless. ${paramName} reached a critical level (${state}). Your group did not make it.`,
    errorApi: (msg) =>
      `An error occurred while communicating with the AI: ${msg}`,
    errorStart: (msg) =>
      `An error occurred while starting the game: ${msg}`,
    errorSequel: (msg) =>
      `An error occurred while generating the sequel: ${msg}`,
    errorCustom: (msg) =>
      `An error occurred while generating the new story: ${msg}`,
  },
}

export function useT(language: Language): StringTable {
  return translations[language]
}
