// Global game state
const DEFAULT_PROVIDER = 'claude';
let gameState = {
    settings: {
        language: 'et', // Default language
        provider: localStorage.getItem('adventureProvider') || DEFAULT_PROVIDER,
    }
};

// Translations object
const translations = {
    et: {
        appTitle: "AI Seiklusmootor",
        playerCountLabel: "Mängijate arv:",
        genreLabel: "Žanr:",
        genreZombies: "Zombid",
        genreFantasy: "Fantaasia",
        genreSciFi: "Ulme",
        genreThriller: "Põnevik",
        genreCyberpunk: "Küberpunk",
        genrePostApocalyptic: "Postapokalüptiline",
        durationLabel: "Mängu kestvus:",
        durationShort: "Lühike (~5-8 käiku)",
        durationMedium: "Keskmine (~9-15 käiku)",
        durationLong: "Pikk (16+ käiku)",
        providerLabel: "AI mudel:",
        providerClaude: "Claude Sonnet 4.6 (parem kvaliteet)",
        providerGemini: "Gemini 2.5 Flash (kiire, odav)",
        generateStoryBtn: "Genereeri Lugu",
        storyChoiceTitle: "Vali seikluse algus",
        customStoryTitle: "...või kirjuta omaenda stsenaarium:",
        customStoryPlaceholder: "Näiteks: Ellujäänud on varjunud vanasse kaubamajja, kuid toiduvarud on lõppemas ja hord läheneb...",
        useCustomStoryBtn: "Kasuta oma lugu",
        roleAssignTitle: "Määra rollid ja nimed",
        startGameBtn: "Alusta Mängu!",
        parametersTitle: "Parameetrid",
        sceneTitle: "Praegune olukord",
        choiceTitle: "Mida te teete?",
        summaryTitle: "Kokkuvõte:",
        sequelLabel: "Järjeloo tekst (kopeeri see uue mängu alustamiseks):",
        restartBtn: "Alusta uuesti",
        continueSequelBtn: "Jätka järjelooga",
        turn: "Käik",
        durationDisplay: "Kestvus",
        playerName: "Mängija",
        playerNamePlaceholder: "Sisesta uus nimi soovi korral",
        endNarrative: "Narratiivne Lõpp",
        endParametric: "Parameetriline Kaotus",
        endParametricText: (paramName, state) => `Olukord muutus lootusetuks. ${paramName} jõudis kriitilisele tasemele (${state}). Teie grupp ei pidanud vastu.`,
        endGenericText: "Seiklus on jõudnud ootamatu lõpuni.",
        errorApi: (msg) => `AI-ga suhtlemisel tekkis viga: ${msg}`,
        errorStart: (msg) => `Mängu alustamisel tekkis viga: ${msg}`,
        errorSequel: (msg) => `Järjeloo genereerimisel tekkis viga: ${msg}`,
        errorCustom: (msg) => `Uue loo genereerimisel tekkis viga: ${msg}`,
    },
    en: {
        appTitle: "AI Adventure Engine",
        playerCountLabel: "Number of players:",
        genreLabel: "Genre:",
        genreZombies: "Zombies",
        genreFantasy: "Fantasy",
        genreSciFi: "Sci-Fi",
        genreThriller: "Thriller",
        genreCyberpunk: "Cyberpunk",
        genrePostApocalyptic: "Post-Apocalyptic",
        durationLabel: "Game duration:",
        durationShort: "Short (~5-8 turns)",
        durationMedium: "Medium (~9-15 turns)",
        durationLong: "Long (16+ turns)",
        providerLabel: "AI model:",
        providerClaude: "Claude Sonnet 4.6 (better quality)",
        providerGemini: "Gemini 2.5 Flash (fast, cheap)",
        generateStoryBtn: "Generate Story",
        storyChoiceTitle: "Choose your adventure's start",
        customStoryTitle: "...or write your own scenario:",
        customStoryPlaceholder: "Example: The survivors are hiding in an old mall, but food is running out and the horde is approaching...",
        useCustomStoryBtn: "Use your story",
        roleAssignTitle: "Assign roles and names",
        startGameBtn: "Start Game!",
        parametersTitle: "Parameters",
        sceneTitle: "Current Situation",
        choiceTitle: "What do you do?",
        summaryTitle: "Summary:",
        sequelLabel: "Sequel text (copy this to start a new game):",
        restartBtn: "Restart",
        continueSequelBtn: "Continue with a sequel",
        turn: "Turn",
        durationDisplay: "Duration",
        playerName: "Player",
        playerNamePlaceholder: "Enter new name if desired",
        endNarrative: "Narrative End",
        endParametric: "Parametric Loss",
        endParametricText: (paramName, state) => `The situation became hopeless. ${paramName} reached a critical level (${state}). Your group did not make it.`,
        endGenericText: "The adventure has come to an unexpected end.",
        errorApi: (msg) => `An error occurred while communicating with the AI: ${msg}`,
        errorStart: (msg) => `An error occurred while starting the game: ${msg}`,
        errorSequel: (msg) => `An error occurred while generating the sequel: ${msg}`,
        errorCustom: (msg) => `An error occurred while generating the new story: ${msg}`,
    }
};

// ----- DOM Element References -----
const screens = {
    setup: document.getElementById('setup-screen'),
    storyChoice: document.getElementById('story-choice-screen'),
    roleAssignment: document.getElementById('role-assignment-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen')
};

const buttons = {
    generateStory: document.getElementById('generate-story-button'),
    chooseCustom: document.getElementById('choose-custom-story-button'),
    startGame: document.getElementById('start-game-button'),
    continueSequel: document.getElementById('continue-sequel-button'),
    langEt: document.getElementById('lang-et'),
    langEn: document.getElementById('lang-en'),
    restart: document.getElementById('restart-button'),
};

const errorDisplays = {
    setup: document.getElementById('setup-error'),
    game: document.getElementById('game-error')
};

// ----- AI Integration (provider-agnostic proxy) -----
const API_URL = `/adventure/api/generate`;

async function callAI(prompt, jsonSchema) {
    const provider = gameState.settings.provider || DEFAULT_PROVIDER;
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, schema: jsonSchema, provider })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Invalid JSON response from server' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    const result = await response.json();
    if (!result || typeof result.data !== 'object' || result.data === null) {
        throw new Error("Proxy returned an invalid or empty response structure.");
    }
    return result.data;
}

// ----- UI Helper Functions -----

function updateUIText(lang) {
    const langStrings = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (langStrings[key]) {
            el.textContent = langStrings[key];
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (langStrings[key]) {
            el.placeholder = langStrings[key];
        }
    });
    document.title = langStrings.appTitle;
    buttons.langEt.classList.toggle('active', lang === 'et');
    buttons.langEn.classList.toggle('active', lang === 'en');
}

function showScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenId].classList.add('active');
}

function setLoadingState(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    const loader = button.querySelector('.loader');
    const text = button.querySelector('span');

    if (isLoading) {
        if (!loader) {
            const newLoader = document.createElement('div');
            newLoader.className = 'loader';
            button.prepend(newLoader);
        }
        if (text) text.style.visibility = 'hidden';
    } else {
        if (loader) loader.remove();
        if (text) text.style.visibility = 'visible';
    }
}

function setGameScreenLoading(isLoading) {
    const loader = document.getElementById('game-screen-loader');
    if (loader) loader.style.display = isLoading ? 'flex' : 'none';
}

function displayError(screen, message) {
    const errorDisplay = errorDisplays[screen];
    if (errorDisplay) {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    }
}

function hideErrors() {
    Object.values(errorDisplays).forEach(el => el.style.display = 'none');
}

// ----- Game Logic -----

async function handleStoryGeneration() {
    hideErrors();
    setLoadingState(buttons.generateStory, true);

    gameState.settings.players = document.getElementById('player-count').value;
    gameState.settings.genre = document.getElementById('genre').value;
    gameState.settings.duration = document.getElementById('game-duration').value;
    
    const schema = { type: "OBJECT", properties: { stories: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, summary: { type: "STRING" }, roles: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, description: { type: "STRING" }, ability: { type: "STRING" } }, required: ["name", "description", "ability"] } }, parameters: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, states: { type: "ARRAY", items: { type: "STRING" } } }, required: ["name", "states"] } } }, required: ["title", "summary", "roles", "parameters"] } } }, required: ["stories"] };
    const prompt = `Generate 3 adventure stories for ${gameState.settings.players} players in the ${gameState.settings.genre} genre. Each story should be suitable for a ${gameState.settings.duration} duration game. For each story, provide a title, a summary, exactly ${gameState.settings.players} unique roles with a name, description, and a single powerful, one-time-use special ability. Also provide THREE unique, story-specific parameters. Each parameter must have a name and exactly 4 states, from best to worst. Output language must be ${gameState.settings.language === 'et' ? 'Estonian' : 'English'}.`;

    try {
        const aiResponse = await callAI(prompt, schema);
        gameState.availableStories = aiResponse.stories;
        const container = document.getElementById('story-options-container');
        container.innerHTML = '';
        aiResponse.stories.forEach((story, index) => {
            const storyEl = document.createElement('div');
            storyEl.className = 'story-option';
            storyEl.innerHTML = `<h3>${story.title}</h3><p>${story.summary}</p><button onclick="selectStory(${index})">${translations[gameState.settings.language].useCustomStoryBtn}</button>`;
            container.appendChild(storyEl);
        });
        showScreen('storyChoice');
    } catch (error) {
        displayError('setup', error.message);
    } finally {
        setLoadingState(buttons.generateStory, false);
    }
}

function selectStory(index) {
    const story = gameState.availableStories[index];
    setupInitialGameState(story);
}

async function generateNewGameFromText(storyText, buttonToLoad) {
    hideErrors();
    setLoadingState(buttonToLoad, true);
    const schema = { type: "OBJECT", properties: { roles: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, description: { type: "STRING" }, ability: { type: "STRING" } }, required: ["name", "description", "ability"] } }, parameters: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, states: { type: "ARRAY", items: { type: "STRING" } } }, required: ["name", "states"] } } }, required: ["roles", "parameters"] };
    const prompt = `Based on this custom story idea: "${storyText}", generate ${gameState.settings.players} thematically appropriate roles and 3 unique parameters for a ${gameState.settings.genre} game. Each role needs a name, description, and a one-time-use ability. Each parameter needs a name and 4 states from best to worst. Output language must be ${gameState.settings.language === 'et' ? 'Estonian' : 'English'}.`;
    try {
        const aiResponse = await callAI(prompt, schema);
        const story = { title: translations[gameState.settings.language].customStoryTitle.replace('...', ''), summary: storyText, ...aiResponse };
        setupInitialGameState(story);
    } catch (error) {
        displayError('setup', translations[gameState.settings.language].errorCustom(error.message));
    } finally {
        setLoadingState(buttonToLoad, false);
    }
}

async function handleCustomStory() {
    const customText = document.getElementById('custom-story-input').value;
    if (customText.trim() === '') return;
    await generateNewGameFromText(customText, buttons.chooseCustom);
}

async function handleSequel() {
    const sequelText = document.getElementById('sequel-text').value;
    const oldRoles = gameState.roles.map(r => ({ name: r.name, description: r.description }));
    setLoadingState(buttons.continueSequel, true);
    const schema = { type: "OBJECT", properties: { newAbilities: { type: "ARRAY", items: { type: "STRING" } }, newParameters: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, states: { type: "ARRAY", items: { type: "STRING" } } }, required: ["name", "states"] } } }, required: ["newAbilities", "newParameters"] };
    const prompt = `This is a sequel to a previous adventure. The story continues from this summary: "${sequelText}". The returning characters are: ${JSON.stringify(oldRoles)}. Please generate: 1. A new, unique, one-time-use special ability for EACH of the returning characters. The list of abilities must be in the same order as the characters. 2. Three completely new, unique parameters suitable for this sequel story. Each parameter needs a name and 4 states from best to worst. Output language must be ${gameState.settings.language === 'et' ? 'Estonian' : 'English'}.`;
    try {
        const aiResponse = await callAI(prompt, schema);
        const updatedRoles = gameState.roles.map((role, index) => ({ ...role, ability: aiResponse.newAbilities[index] || "New Ability", used: false }));
        const story = { title: "Järjelugu", summary: sequelText, roles: updatedRoles, parameters: aiResponse.newParameters };
        setupInitialGameState(story);
    } catch (error) {
        displayError('setup', translations[gameState.settings.language].errorSequel(error.message));
    } finally {
        setLoadingState(buttons.continueSequel, false);
    }
}

function setupInitialGameState(story) {
    gameState.title = story.title;
    gameState.summary = story.summary;
    gameState.roles = story.roles.map((r, index) => ({ ...r, id: index, used: r.used || false }));
    gameState.parameters = story.parameters.map(p => ({ ...p, currentStateIndex: 1 }));
    populateRoleScreen();
}

function populateRoleScreen() {
    document.getElementById('chosen-story-title').innerText = gameState.title;
    document.getElementById('chosen-story-summary').innerText = gameState.summary;
    const rolesContainer = document.getElementById('roles-container');
    rolesContainer.innerHTML = '';
    const lang = gameState.settings.language;
    gameState.roles.forEach((role, index) => {
        const roleEl = document.createElement('div');
        roleEl.className = 'role-card';
        roleEl.innerHTML = `
            <div class="form-group">
                <label for="player-name-${index}">${translations[lang].playerName} ${index + 1}: <strong>${role.name}</strong></label>
                <input type="text" id="player-name-${index}" class="player-name-input" value="${role.name}" placeholder="${translations[lang].playerNamePlaceholder}">
            </div>
            <p>${role.description}</p>
            <p><strong>Erioskus:</strong> ${role.ability}</p>`;
        rolesContainer.appendChild(roleEl);
    });
    showScreen('roleAssignment');
}

async function startGame() {
    setLoadingState(buttons.startGame, true);
    try {
        document.querySelectorAll('.player-name-input').forEach((input, index) => {
            if (input.value.trim()) gameState.roles[index].name = input.value.trim();
        });
        gameState.currentTurn = 1;
        const duration = gameState.settings.duration;
        if (duration === "Short") gameState.maxTurns = 8;
        else if (duration === "Medium") gameState.maxTurns = 15;
        else gameState.maxTurns = 20;
        await handlePlayerChoice("Mäng algab.", true);
        showScreen('game');
    } catch (error) {
        displayError('game', translations[gameState.settings.language].errorStart(error.message));
    } finally {
        setLoadingState(buttons.startGame, false);
    }
}

async function handlePlayerChoice(choiceText, isFirstTurn = false) {
    hideErrors();
    setGameScreenLoading(true);
    const availableAbilities = gameState.roles.filter(r => !r.used).map(r => `Role '${r.name}' (index ${r.id}) has ability '${r.ability}' available.`).join(' ');
    const parameterStates = gameState.parameters.map(p => `'${p.name}' is '${p.states[p.currentStateIndex]}'`).join(', ');
    const schema = { type: "OBJECT", properties: { scene: { type: "STRING" }, parameters: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, change: { type: "INTEGER" } }, required: ["name", "change"] } }, choices: { type: "ARRAY", items: { type: "OBJECT", properties: { text: { type: "STRING" }, isAbility: { type: "BOOLEAN" }, roleIndex: { type: "INTEGER" } }, required: ["text", "isAbility"] } }, gameOver: { type: "BOOLEAN" }, gameOverText: { type: "STRING" } }, required: ["scene", "parameters", "choices", "gameOver"] };
    const prompt = `This is turn ${gameState.currentTurn} of a ${gameState.settings.duration} length ${gameState.settings.genre} game. The current parameter states are: ${parameterStates}. The following special abilities are available: ${availableAbilities || 'None'}. The players chose: "${choiceText}". Continue the story. Strictly follow these rules: 1. The new scene MUST reflect the current parameter states and the player's choice. 2. You MUST change the parameters based on the choice. For each parameter, provide its name and an integer change (-1 for worse, 0 for no change, 1 for better). 3. Provide 2-3 new team-based choices. 4. RARELY, you may offer a choice to use a special ability. If you do, set isAbility to true and provide the roleIndex (0-based) of the role whose ability is being offered. Do NOT offer abilities for roles that are not in the 'availableAbilities' list. 5. Pace the story towards a conclusion. If the turn count (${gameState.currentTurn}) is nearing the limit for the game length (${gameState.maxTurns}), you MUST start concluding the story. If this is the final turn, set gameOver to true and write a concluding gameOverText. The gameOverText should describe the final outcome and also reflect on the critical choice "${choiceText}" that led the players to this fate. 6. The output language for all player-facing text (scene, choices, gameOverText) MUST be ${gameState.settings.language === 'et' ? 'Estonian' : 'English'}.`;

    try {
        const aiResponse = await callAI(prompt, schema);
        if (aiResponse.gameOver) {
            endGame(translations[gameState.settings.language].endNarrative, aiResponse.gameOverText || translations[gameState.settings.language].endGenericText);
            return;
        }
        if (choiceText.includes("Kasuta erioskust:") || choiceText.includes("Use special ability:")) {
            const roleNameMatch = choiceText.match(/\[(.*?)\]/);
            if (roleNameMatch?.[1]) {
                const role = gameState.roles.find(r => r.name === roleNameMatch[1]);
                if (role) role.used = true;
            }
        }
        if (!isFirstTurn) gameState.currentTurn++;
        aiResponse.parameters.forEach(p_change => {
            const p_state = gameState.parameters.find(p => p.name === p_change.name);
            if (p_state) p_state.currentStateIndex = Math.max(0, Math.min(p_state.states.length - 1, p_state.currentStateIndex - p_change.change));
        });
        for (const param of gameState.parameters) {
            if (param.currentStateIndex >= param.states.length - 1) {
                endGame(translations[gameState.settings.language].endParametric, translations[gameState.settings.language].endParametricText(param.name, param.states[param.states.length - 1]));
                return;
            }
        }
        updateGameUI(aiResponse.scene, aiResponse.choices);
    } catch (error) {
        displayError('game', translations[gameState.settings.language].errorApi(error.message));
    } finally {
        setGameScreenLoading(false);
    }
}

function updateGameUI(sceneText, choices) {
    const lang = gameState.settings.language;
    document.getElementById('turn-counter').innerText = `${translations[lang].turn}: ${gameState.currentTurn}/${gameState.maxTurns}`;
    document.getElementById('game-length-display').innerText = `${translations[lang].durationDisplay}: ${translations[lang]['duration' + gameState.settings.duration]}`;
    const paramsContainer = document.getElementById('parameters-container');
    paramsContainer.innerHTML = '';
    gameState.parameters.forEach(p => {
        const stateText = p.states[p.currentStateIndex];
        const paramEl = document.createElement('div');
        paramEl.className = 'parameter-display';
        paramEl.innerHTML = `<div class="param-name">${p.name}</div><div class="param-state">${stateText}</div>`;
        paramsContainer.appendChild(paramEl);
    });
    document.getElementById('scene-description').innerHTML = `<p>${sceneText.replace(/\n/g, '</p><p>')}</p>`;
    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = '';
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.innerHTML = `<span>${choice.text}</span>`;
        if (choice.isAbility && choice.roleIndex !== undefined) {
            const role = gameState.roles[choice.roleIndex];
            if (role && !role.used) {
                const abilityText = lang === 'et' ? `[${role.name}] Kasuta erioskust: ${role.ability}` : `[${role.name}] Use special ability: ${role.ability}`;
                button.onclick = () => handlePlayerChoice(abilityText);
            } else {
                button.disabled = true;
                button.innerHTML = `<span>${choice.text} (Kasutatud)</span>`;
            }
        } else {
            button.onclick = () => handlePlayerChoice(choice.text);
        }
        choicesContainer.appendChild(button);
    });
}

function endGame(title, text) {
    document.getElementById('game-over-title').innerText = title;
    document.getElementById('game-over-text').innerText = text;
    document.getElementById('sequel-text').value = text;
    if (title === translations[gameState.settings.language].endNarrative) {
        buttons.continueSequel.style.display = 'flex';
    } else {
        buttons.continueSequel.style.display = 'none';
    }
    showScreen('gameOver');
}

// ----- Initialization -----
function initializeApp() {
    buttons.generateStory.addEventListener('click', handleStoryGeneration);
    buttons.chooseCustom.addEventListener('click', handleCustomStory);
    buttons.startGame.addEventListener('click', startGame);
    buttons.continueSequel.addEventListener('click', handleSequel);
    buttons.restart.addEventListener('click', () => window.location.reload());
    buttons.langEt.addEventListener('click', () => {
        gameState.settings.language = 'et';
        updateUIText('et');
    });
    buttons.langEn.addEventListener('click', () => {
        gameState.settings.language = 'en';
        updateUIText('en');
    });
    
    const providerSelect = document.getElementById('ai-provider');
    if (providerSelect) {
        providerSelect.value = gameState.settings.provider;
        providerSelect.addEventListener('change', () => {
            gameState.settings.provider = providerSelect.value;
            localStorage.setItem('adventureProvider', providerSelect.value);
        });
    }

    updateUIText(gameState.settings.language); // Set initial text
    showScreen('setup');
}

document.addEventListener('DOMContentLoaded', initializeApp);
