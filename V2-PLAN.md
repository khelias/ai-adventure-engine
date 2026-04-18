# AI Adventure Engine — V2 Plan

V1 on live (`games.khe.ee/adventure/`) ja töötab tehniliselt, aga mängides tundus
**igav, korduv, vähe kaasahaarav** — lugu ei resoneeri grupiga, erivõimed ei tee
midagi erilist, iga mäng tundub sama.

V2 lahendab selle **ühel lihtsal viisil**: mäng hakkab peegeldama *seda gruppi,
selles kohas, praegu* — ja sellega tuleb kaasa päriselt pinge, draama, saladused.

---

## Fookus (ühelauseline)

**Seltskonnamäng 3-6 täiskasvanule, 20-30 min sessioon, autoreis / õhtu / kodu,
üks loeb ette ja teised arutavad.**

Kõik disaini-otsused järgnevad sellest. Solo-mäng, laste-variant, mobiil-single-player —
*eraldi projektid hiljem*, mitte V2.

---

## Kolm põhimuutust V2-s

### 1. Kontekst-teadlik jutustaja
Praegune mäng genereerib "Zombid-Lugu-27" mis võiks olla ükskõik kelle oma. V2
setup küsib *optional* lisasisendit enne mängu algust:
- **Kus te füüsiliselt olete?** (buss, köök, kontor, ranna-maja...)
- **Kes on ruumis?** (nimed, suhted, vanused, rollid)
- **Vibe?** (kerge & totter / pingeline / tume)
- **Midagi täna juhtus?** (inside joke, päeva-sündmus)

AI koob need stsenaariumisse. Buss → juht kaob rooli tagant. Kontor → kohv lõppeb,
sein variseb. Pere juures → uksele tuleb keegi keda pole näinud 20 aastat.

**Fast-path kohustuslik**: 1-click start jätab kontekst-küsimused vahele, AI
kasutab targalt defaulte (zombi-žanr, 4 mängijat, "seltskond arutab"). Setup
kestab ~60 sek kui inimesed tahavad mängida *praegu*.

### 2. AI kvaliteet
Praegu on Gemini Flash default — teeb JSON-i õigesti, aga *toon, huumor, üllatus
on lame*. Seltskonnamängus peab kirjutamine *lööma*.

- **Default mudel**: Claude Sonnet 4.6 (Anthropic võti lisatud VM-i)
- **Prompt caching**: system prompt + lugu stabiilne (cache hit), turn variable
  osa on ainus mis iga käik saadab. Tõmbab hinna alla, kiiremad vastused.
- **Tool use**: AI ei "loe" state'i promptist, vaid *kutsub* tool'e:
  `damage_character`, `introduce_npc`, `raise_stakes`, `whisper_to(player)`.
  Struktuurne, kontrollitud, järjepidev.
- **Gemini jääb fallback'iks** (kiire/odav) + hiljem **local Ollama** GPU-ga.

### 3. Saladused / privaatne info
Praegune mäng = 100% avalik info, kõik näevad sama ekraani. V2-s AI saab
**whisper**-tool'i kasutades anda ühele mängijale privaatset infot mida teised
ei näe. Telefon liigub salaja tema kätte, ta loeb vaikselt, paneb tagasi.

> *"Marko, koridori lõpus on su ex-naine. Teised ei näinud veel. Mis sa teed?"*

See on **draama mootor**: info-asümmeetria ongi Werewolf'i / Mafia / mõrva-
müsteeriumite magnet. Iga laua-arutelu muutub huvitavaks kui keegi *teab midagi*
mida teised ei tea. See on V2 tõeline diferentseerija.

---

## Mis V1-st säilib

- Turn loop baasstruktuur
- Sequel-mehaanika (lugude jätkumine)
- Parameeter-süsteem (aga muudetud, vt allpool)
- Pass-the-phone muster
- ET + EN i18n
- Provider-agnostic proxy (lisan ainult Claude caching + tool use)

### Keelte kvaliteet

Nii Claude kui Gemini on inglise-natiivsed — koolitatud hiiglaslikel
ingliskeelsetel korpustel. Eesti keel töötab hästi (grammatika, sisu, järjepidevus),
aga *huumor, sõnamäng, loomulik toon* on inglise keeles **märgatavalt teravamad**.
Kui mängitakse segakeelse või välismaa grupiga, inglise režiim võib isegi parem
kogemus olla. **Eesti on primaarne fookus**, inglise "lisaboonus".

## Mis muutub / kaob

- ~~"Lemmik-žanr" localStorage toggle~~ — zombi/maailmalõpp on vaikimisi, teised
  valikud jäävad aga pole rõhutatud
- ~~Inline onclick="selectStory(${index})"~~ — React komponendid
- ~~Monoliitne app.js~~ — moodulid, tüübid, testid kus mõtekas
- ~~Parameter = abstraktne number~~ — parameetrid jäävad aga **draama on nüüd
  karakter-põhine** (saladused, liitlased, moraalikonflikt), mitte "moraal -1"

---

## Tehniline stack

- **Frontend**: React + Vite + TypeScript
- **Stiil**: Tailwind CSS + shadcn/ui baas, custom typography peal — *peab
  lugema nagu raamat*, mitte "äppi"
- **State**: Zustand (kerge, tüübid, ei ole Redux overhead)
- **Proxy**: olemasolev provider-agnostic proxy (`khe-homelab/services/apps/games/adventure-proxy/`)
  laiendatud Claude prompt caching'i + tool use'iga
- **Persistens**: V2-s mitte. V2.5-s Postgres (Docker volume), võimaldab "jaga
  linki sõbrale" ja "jätka hiljem"
- **Deploy**: sama GitHub Actions runner → `/srv/data/games/adventure/app/`
- **URL strateegia**: vana app elab `/adventure/` all kuni V2 valmis. Uus arendus
  `/adventure-v2/` staging'us. Lülitus kui on stabiilne.

---

## Faasid

Iga faas = eraldi PR, eraldi deploy, mängitav. Pärast iga faasi testid sõpradega,
õpid, järgmine faas. *Ei mingit 3-kuu closed beta'd.*

### Faas 0 — Skeleton (~1 sessioon)
- React + Vite + TS scaffold
- Tailwind + shadcn/ui setup
- Basic routing, state management (Zustand)
- Proxy sama, vana V1 turn-loop kopeeritud üle et miski oleks juba mängitav
- Deploy `/adventure-v2/` staging'usse

### Faas 1 — Kontekst-teadlik setup (~1 sessioon)
- Setup ekraan: žanr (zombi default), mängijate arv, kestvus — *see on FAST-PATH*
- "Advanced" paneel (optional): kus oleme, kes ruumis, vibe, inside joke
- Proxy prompt laieneb: kontekst-väljad sisestatakse system prompt'i
- Test: mäng resoneerib praeguse kohaga / grupiga

### Faas 2 — AI upgrade (~1 sessioon)
- Proxy: Anthropic SDK integration (Sonnet 4.6 default)
- Prompt caching: süsteem-prompt + lugu cache'itud, turn variable osa odav
- Tool use: `update_parameter`, `damage_character`, `introduce_npc`,
  `raise_stakes` — state muutused lähevad tool call'idena, mitte JSON-response'is
- Fallback Gemini'le kui Claude võti puudub / ei tööta

### Faas 3 — Saladused / whispers (~1-2 sessiooni)
- Tool: `whisper_to_player(playerIndex, message)`
- UI: "anna telefon Markole" ekraan, Marko näeb privaatset teksti, peidab enne tagasi
- AI saab saladusi kaaluda järgmistes käikudes (cache'itud, ta mäletab)
- Test: kas seltskonnas *tõesti* tekib draama / arutelu / kahtlus

### Faas 4 — Design polish (~1-2 sessiooni)
- Tüpograafia viimistlus (lugeja-optimeeritud, suur font, pikad read)
- Pacing: stseeni pikkus varieerub (mõned lühikesed-põrutavad, mõned pikemad-dramaatilised)
- Parameetri muutuste animatsioon (kui "moraal" kukub, lugeja näitab dramaatiliselt)
- Optional TTS: ElevenLabs eesti hääl (lugeja saab kuulata / puhata)

### Faas 5 — Persistens (~1 sessioon, hilisem)
- Postgres (Docker volume, ai-adventure-engine stack)
- Mängu salvestus + resume hiljem
- Jaga-link: "vaata mida me eile mängisime" URL
- Mängu ajalugu: tagasi vaatamine

### Faas 6 — Local GPU Ollama (~hiljem, GPU tulekul)
- Ollama adapter proxy'sse (qwen2.5:14b või gemma3:12b — 16GB GPU-le mahub)
- UI: provider selector laieneb "tasuta kohalik" valikuga
- Test: eesti keele kvaliteet kohalikul mudelil — vs. Claude

---

## Hinnang kuludele

Üks ~20-käiguline mäng Sonnet 4.6-ga, **prompt caching'iga**:
- Ilma caching'uta: ~$0.12 / mäng
- Caching'uga (90% cache hit turn-loop'is): ~$0.03-0.05 / mäng

50 mängu kuus caching'uga: ~$2-3. Kuni GPU tuleb, see on OK. GPU-ga: tasuta.

---

## Mis V2 *ei tee*

- ❌ Solo-mäng / single-player flow (eraldi kasutuskoge, teine disain)
- ❌ Mobiil-single-device-app (praegu webapp jääb)
- ❌ Live multiplayer (mitu seadet korraga) — pass-the-phone jääb
- ❌ Pildid / TTS vaikimisi (need on polish / V3 territooriumis)
- ❌ Kompleksne kampaania-süsteem (pikad, mitu-sessioonilised mängud)

**Laste-režiim**: V2 ei lisa spetsiaalseid filtreid / kohandatud žanre laste
jaoks, aga *midagi ei takista* mängida kergemat zombi-lugu perega. Kui tuleb
eraldi laste-fookusega vajadus — see on V2.5+ laiendus, mitte keelatud.

---

## Edasised mõtted (V2.5 / V3, mitte nüüd)

- **Pildid**: nano-banana / Flux per-stseen, ~$0.003/pilt
- **TTS**: ElevenLabs eesti hääl, lugeja saab puhata
- **NPC agendid**: iga oluline tegelane = mini-agent oma mäluga (tool use + state)
- **Kampaania**: mitu seostatud sessiooni, mäng kestab mitu õhtut
- **Laste variant**: tumedad teemad filtreeritud, žanrid kohandatud

---

## Järgmine samm

**Faas 0 — skeleton**. Alustame kui Kaido annab OK.
