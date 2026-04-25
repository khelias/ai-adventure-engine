import type { Language } from '../game/types'

interface StringTable {
  appTitle: string
  playerCountLabel: string
  playerCountQuestion: string
  durationQuestion: string
  adventureKicker: string
  castKicker: string
  yourAdventureKicker: string
  storyToldKicker: string
  backToSetup: string
  loadingStoryTitle: string
  playersAriaLabel: (n: number) => string
  vibeBtnAny: string
  vibeBtnLight: string
  vibeBtnTense: string
  vibeBtnDark: string
  advancedToggle: string
  experimentalSettings: string
  nextStepBtn: string
  prevStepBtn: string
  step1Title: string
  step2Title: string
  setupStepLabel: (step: number, total: number) => string
  setupContextNote: string
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
  sequelHint: string
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
  downloadTranscriptBtn: string
  finalParametersTitle: string
  winnersTitle: string
  winnersList: (names: string) => string
  noSecretWinners: string
  parameterEventTitle: (name: string) => string
  parameterStateChange: (from: string, to: string) => string
  parameterStatusAria: (name: string, state: string) => string
  endNarrative: string
  endParametric: string
  endGenericText: string
  loading: string
  endParametricText: (paramName: string, state: string) => string
  errorApi: (msg: string) => string
  errorStart: (msg: string) => string
  errorSequel: (msg: string) => string
  errorCustom: (msg: string) => string
  // Secrets
  secretsKicker: string
  secretsAssignIntro: string
  secretsAssignWarning: string
  secretsPassPhoneTo: (name: string) => string
  secretsRevealBtn: (name: string) => string
  secretsRememberBtn: string
  secretsHideBtn: string
  secretsRevealKicker: string
  secretsRevealIntro: string
  secretsShowResultsBtn: string
  secretsResultWon: string
  secretsResultLost: string
  secretsYourGoalLabel: string
  secretsDocumentStamp: string
  secretsGoalFor: (name: string) => string
  secretArchetypeName: (archetype: string) => string
  secretDescription: (archetype: string, paramName?: string) => string
  // Rotating hints shown during the between-turns wait so 20-30s feels
  // purposeful, not broken. Cycled every 4s client-side.
  loadingHints: string[]
}

export const translations: Record<Language, StringTable> = {
  et: {
    appTitle: 'AI Seiklusmootor',
    playerCountLabel: 'Mängijate arv:',
    playerCountQuestion: 'Mängijate arv',
    durationQuestion: 'Mängu kestvus',
    adventureKicker: 'mängu seadistus',
    castKicker: 'rollid',
    yourAdventureKicker: 'teie seiklus',
    storyToldKicker: 'lugu on räägitud',
    backToSetup: 'seadistused',
    loadingStoryTitle: 'Tint voolab…',
    playersAriaLabel: (n) => `${n} mängijat`,
    vibeBtnAny: 'vaba',
    vibeBtnLight: 'kerge',
    vibeBtnTense: 'pingeline',
    vibeBtnDark: 'tume',
    advancedToggle: 'Tehniline',
    experimentalSettings: 'Eksperimentaalne',
    nextStepBtn: 'Järgmine samm →',
    prevStepBtn: '← Tagasi',
    step1Title: 'Vali mängu algus',
    step2Title: 'Lisa päris kontekst',
    setupStepLabel: (step, total) => `${step} / ${total}`,
    setupContextNote: 'Võid ka tühjaks jätta. Päris koht ja inimesed teevad alguse kohe huvitavamaks.',
    groupSectionHeader: 'Vabatahtlik, aga soovitatav',
    groupSectionHint: 'Lisa mõni päris detail, mille AI saab seikluseks keerata.',
    locationLabel: 'Kus te praegu olete?',
    locationPlaceholder: 'nt köögis, kontoris, bussis, saunas...',
    playersDescLabel: 'Kes mängivad?',
    playersDescPlaceholder: 'nt Mart, Mari ja Jaan',
    vibeLabel: 'Mängu meeleolu',
    vibeAny: 'Mis tuleb, see tuleb',
    vibeLight: 'Kerge & naljakas',
    vibeTense: 'Pingeline & tõsine',
    vibeDark: 'Tume & atmosfäärne',
    insideJokeLabel: 'Detail, mida võiks loos kasutada',
    insideJokePlaceholder: 'nt keegi unustas täna võtmed maha',
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
    generateStoryBtn: 'Alusta mängu →',
    storyChoiceTitle: 'Sinu seiklus',
    regenerateBtn: 'Genereeri uus',
    customStoryTitle: 'Kirjuta oma stsenaarium',
    customStoryPlaceholder:
      'Näiteks: Ellujäänud on varjunud vanasse kaubamajja, kuid toiduvarud on lõppemas ja hord läheneb...',
    useCustomStoryBtn: 'Kasuta oma lugu',
    useThisStoryBtn: 'Vali see lugu',
    roleAssignTitle: 'Määra rollid ja nimed',
    startGameBtn: 'Alusta mängu!',
    parametersTitle: 'Parameetrid',
    sceneTitle: 'Praegune olukord',
    choiceTitle: 'Mida te teete?',
    summaryTitle: 'Kokkuvõte:',
    sequelLabel: 'Järjenda lugu',
    sequelHint: 'Muuda järgmise seikluse lähtekohta või jätka nii nagu on.',
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
    downloadTranscriptBtn: 'Lae alla JSON',
    finalParametersTitle: 'Lõppseis',
    winnersTitle: 'Salajased võitjad',
    winnersList: (names) => `Võitsid: ${names}`,
    noSecretWinners: 'Seekord ei täitnud keegi oma salajast eesmärki.',
    parameterEventTitle: (name) => `${name} muutus`,
    parameterStateChange: (from, to) => `${from} → ${to}`,
    parameterStatusAria: (name, state) => `${name}: ${state}`,
    endNarrative: 'Narratiivne lõpp',
    endParametric: 'Parameetriline kaotus',
    endGenericText: 'Seiklus on jõudnud ootamatu lõpuni.',
    loading: 'Laen...',
    endParametricText: (paramName, state) =>
      `Olukord muutus lootusetuks. ${paramName} jõudis kriitilisele tasemele (${state}). Teie grupp ei pidanud vastu.`,
    errorApi: (msg) => `AI-ga suhtlemisel tekkis viga: ${msg}`,
    errorStart: (msg) => `Mängu alustamisel tekkis viga: ${msg}`,
    errorSequel: (msg) => `Järjeloo genereerimisel tekkis viga: ${msg}`,
    errorCustom: (msg) => `Uue loo genereerimisel tekkis viga: ${msg}`,
    secretsKicker: 'saladused',
    secretsAssignIntro: 'Igaüks saab ühe salajase eesmärgi. Teised ei tohi näha.',
    secretsAssignWarning: 'Teised, pöörake selg. Ära piilu üle õla.',
    secretsPassPhoneTo: (name) => `Anna telefon ${name}-le.`,
    secretsRevealBtn: (name) => `${name}, vajuta kui oled üksi`,
    secretsRememberBtn: 'Hoian meeles — anna edasi',
    secretsHideBtn: 'Peida',
    secretsRevealKicker: 'saladused paljastatud',
    secretsRevealIntro: 'Nüüd näidake kõik, mis olid teie salajased eesmärgid.',
    secretsShowResultsBtn: 'Paljasta saladused →',
    secretsResultWon: 'Võitsid',
    secretsResultLost: 'Kaotasid',
    secretsYourGoalLabel: 'Sinu salajane eesmärk',
    secretsDocumentStamp: 'SALAJANE',
    secretsGoalFor: (name) => `${name} salajane eesmärk`,
    secretArchetypeName: (a) => ({
      optimist: 'Perfektsionist',
      traitor: 'Reetur',
      survivor: 'Ellujääja',
      keeper: 'Hoidja',
      sacrificer: 'Ohverdaja',
      guardian: 'Saladuse kaitsja',
    }[a] ?? a),
    secretDescription: (a, paramName) => ({
      optimist: 'Sinu eesmärk on täiuslik lõpp. Kõik grupi parameetrid peavad mängu lõpuks olema parimas olekus.',
      traitor: 'Sa töötad salaja grupile vastu. Võidad siis, kui lugu lõpeb kollapsiga — vähemalt kaks parameetrit on halvimasse olekusse langenud.',
      survivor: 'Peaasi, et me lõpuni jõuame. Mäng peab lõppema loo kaudu, mitte mõõturite varisemisest.',
      keeper: `Sul on üks asi, mida hoida. «${paramName}» peab mängu lõpuks olema hea olukorras — ülemises pooles.`,
      sacrificer: `Üks asi peab minema pihta — muidu sa ei võida. «${paramName}» peab jõudma halvimasse olekusse.`,
      guardian: 'Mitte midagi ei tohi lõplikult kaotsi minna. Ükski parameeter ei tohi mängu lõpuks halvimasse olekusse jõuda.',
    }[a] ?? a),
    loadingHints: [
      'AI ragistab ajusid...',
      'Kududes narratiivi lõngu...',
      'Karakterite saatused on otsustamisel...',
      'Järgmine stseen kirjutatakse',
      'Tegelased arutavad',
      'Eelmise valiku tagajärjed joonistuvad',
    ],
  },
  en: {
    appTitle: 'AI Adventure Engine',
    playerCountLabel: 'Number of players:',
    playerCountQuestion: 'How many players',
    durationQuestion: 'How long',
    adventureKicker: 'adventure',
    castKicker: 'cast',
    yourAdventureKicker: 'your adventure',
    storyToldKicker: 'the story is told',
    backToSetup: 'setup',
    loadingStoryTitle: 'Ink flows…',
    playersAriaLabel: (n) => `${n} players`,
    vibeBtnAny: 'any',
    vibeBtnLight: 'light',
    vibeBtnTense: 'tense',
    vibeBtnDark: 'dark',
    advancedToggle: 'Technical',
    experimentalSettings: 'Experimental',
    nextStepBtn: 'Next Step →',
    prevStepBtn: '← Back',
    step1Title: 'Story Framework',
    step2Title: 'Adventure Context',
    setupStepLabel: (step, total) => `${step} / ${total}`,
    setupContextNote: 'You can start now. A few details make the story feel more personal.',
    groupSectionHeader: 'Tell us about tonight',
    groupSectionHint: 'Add only what you want the story to remember.',
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
    generateStoryBtn: "Let's begin →",
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
    sequelLabel: 'Continue the story',
    sequelHint: 'Edit the starting point for the next adventure, or leave it as is.',
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
    downloadTranscriptBtn: 'Download JSON',
    finalParametersTitle: 'Final state',
    winnersTitle: 'Secret winners',
    winnersList: (names) => `Winners: ${names}`,
    noSecretWinners: 'No one completed their secret goal this time.',
    parameterEventTitle: (name) => `${name} changed`,
    parameterStateChange: (from, to) => `${from} → ${to}`,
    parameterStatusAria: (name, state) => `${name}: ${state}`,
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
    secretsKicker: 'secrets',
    secretsAssignIntro: 'Each player gets one secret goal. No one else may see it.',
    secretsAssignWarning: 'Others, turn your backs. No peeking over the shoulder.',
    secretsPassPhoneTo: (name) => `Pass the phone to ${name}.`,
    secretsRevealBtn: (name) => `${name}, tap when alone`,
    secretsRememberBtn: 'Got it — pass it on',
    secretsHideBtn: 'Hide',
    secretsRevealKicker: 'secrets revealed',
    secretsRevealIntro: 'Now each of you shows what you were secretly playing for.',
    secretsShowResultsBtn: 'Reveal the secrets →',
    secretsResultWon: 'You Won',
    secretsResultLost: 'You Lost',
    secretsYourGoalLabel: 'Your secret goal',
    secretsDocumentStamp: 'SECRET',
    secretsGoalFor: (name) => `${name}'s secret goal`,
    secretArchetypeName: (a) => ({
      optimist: 'Perfectionist',
      traitor: 'Traitor',
      survivor: 'Survivor',
      keeper: 'Keeper',
      sacrificer: 'Sacrificer',
      guardian: 'Guardian',
    }[a] ?? a),
    secretDescription: (a, paramName) => ({
      optimist: 'You want a perfect finish. Every group parameter must end at its best state.',
      traitor: 'You are secretly working against the group. You win if the story ends in collapse — at least two parameters at their worst state.',
      survivor: 'Just get us to the end. The game must end narratively, not by parameter collapse.',
      keeper: `You hold one thing dear. «${paramName}» must end in the top half.`,
      sacrificer: `One thing must fall — or you don't win. «${paramName}» must reach its worst state.`,
      guardian: 'Nothing may be lost for good. No parameter may end at its worst state.',
    }[a] ?? a),
    loadingHints: [
      'AI is racking its brains...',
      'Weaving narrative threads...',
      'Character fates are being decided...',
      'Writing the next scene',
      'Characters are talking',
      'The last choice lands',
    ],
  },
}

export function useT(language: Language): StringTable {
  return translations[language]
}
