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
- **Parameeter-süsteem** — jääb kui **mängu mehaaniline süda**. Ilma selleta
  pole mehaanilist pinget. Ressursid, ohud, parameetrid = *avalik kaotuse-hirm*
  mida kõik näevad. V2-s täienevad (vt järgmine sektsioon), ei kao.
- Erivõimed — ühekordne kasutus säilib
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
- ~~Abstraktsed parameetrid~~ — parameetrid jäävad, aga muutuvad **spetsiifilisemateks
  ja põhjendatuks**. V1: "Moraal -1" ilma põhjuseta. V2: tool use kaudu AI kutsub
  `update_parameter("bensiin paagis", -1, reason="linna läbimine võttis palju")` —
  põhjus on logitud, lugeja saab dramatiseerida, parameetri nimed on story-spetsiifilised

## V2 draama kolm kihti

V1 pinge oli ühedimensiooniline (ainult grupi parameetrid). V2-s kolm kihti
üksteise peal:

1. **Grupi ressursid** (parameetrid) — avalik, jagatud risk, mehaaniline
   kaotuse-surve
2. **Karakterite saladused / suhted** — privaatne info, info-asümmeetria,
   draama-mootor
3. **Erivõimed** — ühekordne, dramaatiline, seltskonna-arutelu tekitav

Iga kiht töötab iseseisvalt, koos loovad mitmedimensioonilise pinge.

---

## Tehniline stack

- **Frontend**: React + Vite + TypeScript
- **Stiil**: Tailwind CSS + shadcn/ui baas, custom typography peal — *peab
  lugema nagu raamat*, mitte "äppi"
- **Animatsioonid**: Framer Motion (stseenide üleminekud, parameetri-muutused,
  saladuste dramaatiline ilmumine)
- **Typography**: Fraunces või Spectral narratiivi jaoks (serif, raamatulik),
  Inter UI chrome'i jaoks (sans-serif). Google Fonts self-hosted.
- **State**: Zustand (kerge, tüübid, ei ole Redux overhead)
- **Proxy**: olemasolev provider-agnostic proxy (`khe-homelab/services/apps/games/adventure-proxy/`)
  laiendatud Claude prompt caching'i + tool use'iga
- **Persistens**: V2-s mitte. V2.5-s Postgres (Docker volume), võimaldab "jaga
  linki sõbrale" ja "jätka hiljem"
- **Deploy**: sama GitHub Actions runner → `/srv/data/games/adventure/app/`
- **URL strateegia**: vana app elab `/adventure/` all kuni V2 valmis. Uus arendus
  `/adventure-v2/` staging'us. Lülitus kui on stabiilne.

---

## Disain — kuidas see PÄRISELT ilus välja näeb

V1 on inetu sest seal polnud ühtegi disaini-mõtet. V2-s peab iga ekraan
tundama nagu **raamatuleheküljel**, mitte veebivormil.

### Põhiprintsiibid

1. **Typography-first** — see on LUGEMIS-mäng. Tekst *on* kogemus.
   - Narrative: serif font (Fraunces), 18-22px, line-height 1.7, mõõde 65-75 char rea kohta
   - UI chrome: sans-serif (Inter), väiksem, diskreetne
   - Drop cap stseeni alguses? Peatüki-stiilis üleminekud.

2. **Žanripõhine atmosfäär** — iga žanr on *oma raamat* oma värvipaleti,
   tekstuuri, tüpograafilise häälestusega. Žanr = teema:
   - **Zombie/maailmalõpp**: summuda hall, roostepunane aktsent, distressed textuur (CSS noise), tume, saastunud tunne
   - **Fantaasia**: süvavärvid (veini-punane, metsa-roheline), kuld-aktsent, ornaamentilised piirid
   - **Sci-fi**: puhas must/valge, tsüaan-magenta aktsent, monospaced font status-UI-s
   - **Põnevik**: noir must-valge, neoon-aktsent, dramaatilised varjud
   - CSS muutujate kaudu, lülitub setup'is

3. **Lugeja-optimeeritud reading view** — üks stseen korraga, ei midagi muud.
   - Suur tekst, palju ruumi. Lugeja saab vaikselt dramatiseerida.
   - Stseenil võib olla "peatüki pealkiri" ("III peatükk: Garaaž") — visuaalne progress.
   - Valikud ERALDI tekstist, kaardi-stiilis, ei ole inline.

4. **Parameetrid kui armatuurlaud, mitte tekst** — mitte "Moraal: Hea", vaid:
   - Visuaalne gauge / riba, värvikoodiga (roheline → kollane → oranž → punane)
   - Spetsiifilise ikooniga (bensiin = pumbaikoon, tervis = süda)
   - **Animatsioon muutusel**: "moraal -1" = riba tõmbub dramaatiliselt kokku, värv käib läbi punase-sähvatuse. Lugeja *näeb* et midagi olulist juhtus, saab dramatiseerida.

5. **Kinematograafilised hetked** — mitte lihtsalt teksti vahetus:
   - Stseenide üleminekud: fade + subtle slide (Framer Motion)
   - Saladus-ilmumine: envelope-ikoon alustab kõikumist, "anna telefon Markole" täisekraan-ülekate
   - Game over: parameetrite viimane klikk dramaatiliselt punaseks, "Lõpp" raamatulik tiitel

6. **Karakteri-kaardid isikupäraga** — iga roll on *kaart*:
   - Nimi (mängija poolt muudetav), lühike kirjeldus
   - Erivõime selgelt näha (kasutatud = kaart muutub halliks, grafisti-märgistusega)
   - Staatus: kas sellel mängijal on saladus (📬 ikoon), kas ta on haavatud
   - Placeholder-portree (V3-s AI-genereeritud, V2-s geomeetriline abstraktsioon žanri-teemas)

7. **Mobile-first** — see on pass-the-phone mäng:
   - Kõrge aspekt, peapöial-friendly, suured tap-sihikud
   - Ei mingit landscape-assumpt'i
   - Dark-mode vaikimisi (alkohol-õhtud vähese valgusega)

8. **Progress-visuaal** — mitte "Käik 7/15" tekstiga, vaid:
   - Rada / joon mis täitub loo edenedes
   - Näitab kus oleme loo kaares (keskpaik, klimaks, lõpp lähedal)
   - Dramaatiline "viimased käigud" visuaal (raamat läheb paksuks)

### Inspiratsioon (need on *vibe*, mitte copy)

- **Reigns** (mobile) — minimalistlik kaardi-disain, atmosfääri üks ekraan
- **80 Days / Sorcery!** (Inkle) — literaarne UI, päris raamatu-tunne
- **Her Story** — täisekraaniline kinematograafiline tekst
- **Sunless Sea / Sunless Skies** (Failbetter) — tume atmosfäärne UI, tekst on *kunst*

### Konkreetne komponendi-pesa

Faas 0-s ehitame baasi:
- `SceneView` — narratiivi täisekraan-vaade, serif typography
- `ChoiceCards` — valikud kaartidena stseeni all
- `ParameterDashboard` — horisontaalne riba ülaosas, animeeritavad gauge'id
- `CharacterCard` — rollide vaade, saab välja-libistada sidepaneelist
- `WhisperOverlay` — saladuse täisekraan-ülekate "anna telefon Markole"
- `GenreTheme` — CSS-muutujate provider, lülitab värvid/tekstuurid

Kõik shadcn-primitive'ide peal, mitte nullist. Tailwind + CSS-muutujad per-žanr.

### Mida disain **ei** tee V2-s

- Pole 3D-efekte, parallaxe, liigseid animatsioone — see on rahulik lugemine, mitte mäng-ärritus
- Pole AI-genereeritud pilte (V3)
- Pole videot / muusikat default'is (V2.5 optional)
- Pole "splash screen" / laadiekraani — kohe kasutusel

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
