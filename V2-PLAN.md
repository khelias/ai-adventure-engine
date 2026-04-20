# AI Adventure Engine — V2 Plan

> **Staatus 2026-04-20:** V2 Faas 0-2 ✅ done, Faas 2 edukriteerium täidetud pärast
> 2026-04-20 hotfix-sessiooni (vt [CHANGELOG.md](CHANGELOG.md)). Järgmine aktiivne töö
> on **Faas 3** (whispers + wounded/ghost). Arhitektuuridetailid: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

V1 oli live (`games.khe.ee/adventure/`) ja töötas tehniliselt, aga mängides tundus
**igav, korduv, vähe kaasahaarav** — lugu ei resoneerinud grupiga, erivõimed ei teinud
midagi erilist, iga mäng tundus sama.

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
- **Gemini jääb fallback'iks** (kiire/odav). Kohalik mudel (Ollama) pole V2-s —
  tool-use töökindlus kohalikel mudelitel pole veel piisav, latents liiga kõrge.
  Vt "V3 suunad" allpool.

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

## V2 disaini invariandid

Need on **mittekaubanduslikud reeglid** kogu V2-le. Iga faas peab neid
järgima — kui disaini-otsus rikub invarianti, otsus muutub, mitte invariant.

1. **Keegi ei istu pealt.** Kui karakter "sureb" narratiivselt, mängija jätkab
   uues rollis: **haavatud** (vähendatud agentsus, erivõime kadunud) või
   **vaim/nõuandja** (eksklusiivsed whisperid — "sa näed rohkem kui elusad").
   Surm muudab **osaluse-modelli**, mitte ei eemalda mängijat laualt. 20-30min
   mäng kus keegi 5. käigul kaotab kohti = seltskond ei taha enam mängida.
   *(Zombi/poole-vahetuse staatus kaalutud — nihutatud V3-sse, vt "V3 suunad".)*

2. **Fast-path on pühak.** Setup ei tohi kesta üle 60 sekundi kui kasutaja
   tahab mängida *nüüd*. Kõik advanced-väljad (kontekst, vibe, inside joke)
   on optional. 1-click start peab tegema mängitava mängu targade defaultidega.

3. **Lugeja juhib tempot.** UI ei võta lugejalt dramaatilist pausi. Ei
   auto-advance, ei timer. "Valmis?" nupp lugeja käes.

4. **Pass-the-phone ritual.** Saladused jõuavad õige mängijani turvaliselt:
   **hold-to-reveal** UI fundament, mitte gimmick. Vabastamine = tekst kaob
   kohe. Kõrvaltvaatajal pole akna.

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
   - Staatus-animatsioonid: **alive → wounded → ghost** (V2 mitte-elimineerimise
     invariant; zombie-staatus on V3, kuni UX on läbi disainitud). Iga staatus
     visuaalselt eristuv:
     - *wounded* — kaart saab kriimu / sidemete tekstuuri, nimi kaldkirjas
     - *ghost* — kaart muutub läbipaistvaks, väike halo ikoon, "vaim" silt
   - Kas sellel mängijal on saladus (📬 ikoon)
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

Faas 0-s ehitame baasi, hilisemates faasides täiendame:
- `SceneView` — narratiivi täisekraan-vaade, serif typography
- `ChoiceCards` — valikud kaartidena stseeni all: **2-3 AI-genereeritud nuppu
  primary + väike link "Või kirjutage oma valik →"**, mis avab tekstivälja.
  Hübriid-mudel: kiirus default, loovus 1-tap kaugusel (mitte 3 samaväärset valikut)
- `ParameterDashboard` — horisontaalne riba ülaosas, animeeritavad gauge'id
- `CharacterCard` — rollide vaade, saab välja-libistada sidepaneelist,
  staatus-animatsioonid (alive/wounded/ghost — zombie V3)
- `WhisperOverlay` (Faas 3) — saladuse täisekraan-ülekate, **hold-to-reveal**
  mehaanikaga: blur'itud tekst keskel, "[Marko], vajuta ja hoia et lugeda",
  tekst ilmub hoides, vabastades kaob kohe. Lühikesed whispered (max 3-4 rida),
  pika teksti korral jaotatakse tükkideks ("1/3 — hoia edasi")
- `GhostView` (Faas 3) — surnud/vaim-mängija vaade. Visuaalselt eristuv
  (hämar ümbris, läbipaistev stiil). Näeb eksklusiivseid whispereid mida
  elusad ei saa. Valikud piiratud: "sosista elusatele" tüüpi tegevused.
- `PhaseIndicator` (Faas 2) — diskreetne progress-visuaal ülaosas mis
  väljendab loo kaare faasi (setup / tõus / midpoint / climax / resolutsioon),
  mitte "Käik 7/15" numbri-tekst. Lugeja näeb *kus loos oleme*.
- `GenreTheme` — CSS-muutujate provider, lülitab värvid/tekstuurid

Kõik shadcn-primitive'ide peal, mitte nullist. Tailwind + CSS-muutujad per-žanr.

### Mida disain **ei** tee V2-s

- Pole 3D-efekte, parallaxe, liigseid animatsioone — see on rahulik lugemine, mitte mäng-ärritus
- Pole AI-genereeritud pilte (V3)
- Pole videot / muusikat default'is (V2.5 optional)
- Pole "splash screen" / laadiekraani — kohe kasutusel

---

## Faasid

Iga faas = eraldi PR, eraldi deploy, mängitav. Pärast iga faasi **edukriteeriumi
test** sõpradega, õpid, järgmine faas või iteratsioon. *Ei mingit 3-kuu closed
beta'd.*

**Ajalised hinnangud on sessiooni-tunnid, mitte kalendripäevad.** 1 sessioon =
~2-3h tööd.

---

### ✅ Faas 0 — Skeleton
React+Vite+TS scaffold, Tailwind, Zustand, kõik 5 ekraani, deploy pipeline `/adventure-v2/`.

### ✅ Faas 1 — Kontekst-teadlik setup + hübriid-valikud
Setup paneel (kus/kes/vibe/inside joke), hübriid-valikud (AI nupud + "kirjuta oma"), free-text guardrail.

### ✅ Prompt Overhaul (enne F2 arhitektuuri)
Tehtud 2026-04-19. Suurim kvaliteedimuutus ilma F2 arhitektuurita:
- `getStoryPhase(turn, maxTurns)` — 5 narratiivset faasi skaleeruvad mängu pikkusega
- `turnPrompt()` → `{ system, user }` — staatiline kontekst system promptis (cachitud), dünaamiline käik user promptis
- Prompt caching (`cache_control: ephemeral`) süsteemipromptile
- Story gen → alati Gemini Flash (kiire, tasuta); käigud → Claude Sonnet 4.6
- Turn history: viimased 2 scene'i user promptis (loo järjepidevus)
- Eestikeelne few-shot stiilimall süsteemipromptis (Opus kirjutas)
- Scene-length varieerimine; setup = 2 käiku pikemas mängus
- Language reminder iga käigu user promptis

**Edukriteerium:** Kaido mängib ühe täismängu ja ütleb et lood on huvitavad.

**Staatus 2026-04-19:** Täitmata. Lood jäid pikkaks ja eestikeele-vigade-täis, mängud
lõppesid turnis 4-5 parameetri-force-end-iga, mitte narratiivselt. Põhjused paljastusid
2026-04-20 audit-sessioonil ja parandati seal samas.

---

### ✅ Faas 2 — Séance redesign + UI/UX ergonoomia
Tehtud 2026-04-20. Opus auditeeris algse disaini (soojad toonid, raamatumuster) — tuvastas
et see on **soolo-mängija UI, mitte pass-the-phone seltskonnamäng**. Täielik ümberkujundamine
"Séance" kontseptsiooni järgi.

**Disain (Séance):**
- `#0a0913` taust, `#a78bfa` violett aktsent, `#f5f3ff` tekst (17.8:1 kontrast)
- **Fraunces** variable serif (`opsz,wght`) narratiivile ja valikutele — literaarne tunne, kõrge loetavus
- **Inter** UI chrome'ile
- `body::before` ambient hingav kuma (8s tsükkel, `prefers-reduced-motion` respekteeritud)
- Täielik CSS custom properties design system (`src/index.css`)

**Ergonoomia-muutused:**
- Valikute numbritega eesliide (`01 / 02 / 03`) — lugeja küsib "üks, kaks või kolm?"
- "The Circle" — 140px žanri-ring koos violett beam'iga, 6 žanri-punktiga; genre-nimi all
- Players: `[3] [4] [5] [6]` Fraunces numbritega segmented buttons (min=3, max=6)
- Duration: sõnanupp-read `·` eraldajatega (mitte `<select>`)
- Provider → Advanced sektsiooni (tavakasutaja ei näe)
- Vibe: sõnanupud dropdown asemel
- Context: `input-page` stiil (underline-only, mitte dark box)
- Role assignment: `◈` erivõime sümbol, `01 / 02` numbrid aktsendivärvis
- GameOver: Fraunces serif `.scene-prose` lõpptekstile

**Cutover:** `/adventure-v2/` staging liideti `/adventure/`-ga — React app on nüüd
live peaapp'ina. V1 vanilla kood arhiivitud `legacy/v1/`. README.md kirjutatud (2026-04-20).

**Järelejäänud väikesed asjad (järgmine sessioon):**
- `window.scrollTo({ top: 0 })` pärast iga käiku
- "Näita kogu lugu" collapsible GameOver ekraanil + export clipboard
- "Kasuta Mängija 1, 2, 3…" kiirklõps RoleAssignment'is

---

### ✅ Hotfix-sessioon 2026-04-20 — playability fixes

Faas 2 polnud päriselt "valmis" — mängida oli pettumus. See sessioon parandas seda
**ilma uut arhitektuuri lisamata** (Faas 4 "tool use" jääb endiselt hilisemaks).
Täielik detail: [CHANGELOG.md](CHANGELOG.md).

- **Narratiivne gameOver** — 1 param worst = faasi-üleminek, 2+ worst = AI kirjutab lõpu
- **Eesti toimetaja** — Gemini Flash proxy-pass korrigeerib Claude stseenide keelevead
- **Proxy kaitstud** — schema allowlist + origin check + päris per-visitor rate limit
- **Playtest harness** (`scripts/playtest.ts`) — headless täis-mängu runner, Markdown transkriptid
- **Rollinimed** on päris nimed (Mari, Liisa), mitte ametinimetused
- **Stseenid** poole lühemad (reeglite pingutamine + few-shot näide)

**Edukriteerium:** mõlemad playtest-žanrid (Zombies, Fantasy) jõuavad turn 8 natuurselt
ja AI kirjutab emotsionaalse lõpu. Täidetud 2026-04-20.

### ⏳ Faas 3 — Saladused + wounded + ghost (~3-5 sessiooni)
- Tool: `whisper_to_player(playerIndex, message)` — privaatne info ühele
- Tool: `transition_player_state(playerIndex, "wounded"|"ghost")`
- **Hold-to-reveal UX** (`WhisperOverlay`): blur'd tekst + hoia et lugeda, vabastades kaob
- **GhostView**: eksklusiivsed whisperid, piiratud valikud ("sosista elusatele")
- *Wounded*: erivõime kadunud, osalus säilib
- **Zombi/poole-vahetus → V3** (ühe seadmega lahendamata disainprobleem)
- **Edukriteerium**: whisper-saladused tekitavad arutelu; surm ei eemalda mängijat

### ⏳ Faas 4 — Tool use arhitektuur (~2-3 sessiooni)
*(Opus hinnang: tool use on arhitektuuriline cleanup, mitte narratiivikvaliteedi
eeldus. Teha pärast F2+F3, kui mäng on muidu hea.)*
- `update_parameter(name, change, reason)` — reason kuvatakse UI-s (dramaatiline kontekst)
- `introduce_npc`, `raise_stakes` tool'id
- Gemini fallback: baastool'id töötavad mõlemal provideril
- Proxy laiendus Claude tool-use jaoks
- **Edukriteerium**: parameter muutusel kuvatakse põhjus; narratiiv järjepidevam

### ⏳ Faas 5 — Design polish (~2-3 sessiooni)
*(Séance redesign (F2) täitis suure osa F5 algsest eesmärgist — Fraunces, design system,
The Circle, violett atmosfäär. Järelejäänud F5 on animatsioonid + per-žanr teemad.)*
- Parameetri muutuste animatsioon (Framer Motion — "moraal kukub")
- `PhaseIndicator` — progress-visuaal loo kaarele (mitte turn-number tekst)
- Žanripõhine teemastamine (`GenreTheme` — värvid/tekstuurid/fondid per žanr)
- Staatuse-animatsioonid karakteri-kaartidel (wounded/ghost üleminekud)
- Optional TTS: ElevenLabs eesti hääl
- **Edukriteerium**: iga žanr tunneb erinev; parameetri muutus on visuaalselt dramaatiline

### ⏳ Faas 6 — Persistens (~2-3 sessiooni, hilisem)
- Postgres (Docker volume)
- Mängu salvestus + resume hiljem
- Jaga-link: "vaata mida me eile mängisime"
- **Edukriteerium**: sulge brauser → ava URL → mäng jätkub samast kohast

---

## Hinnang kuludele

Üks ~20-käiguline mäng Sonnet 4.6-ga:

**Cache-hit realistlik 50-70%**, mitte 90%. Põhjused:
- Phase-aware pacing vahetab süsteem-prompti 5-6 korda mängus (faasipiirid) → cache break
- Turn-history kasvab iga käigul, cache boundary nihkub
- Parameetrite state muutub tool call'ide tulemusena

Hinnaarvutus:
- **Ilma caching'uta**: ~$0.12 / mäng
- **Caching'uga (50-70% hit)**: ~$0.06-0.09 / mäng

50 mängu kuus = **$3-5/kuu**. Kuni GPU tuleb, see on OK. Tulevikus võib proovida
agressivamat caching-strategy'it (phase-info turn-variable osasse, süsteem-prompt
täiesti stabiilne) aga see on optimiseering, mitte V2 baas.

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

## V3 suunad (mitte V2)

Need on **kaalutud aga V2-st välja jäetud** — põhjustega.

- **Zombi/poole-vahetus mehaanika**: kaalutud V2 Faas 3-s, nihutatud V3-sse
  sest ühe seadmega draama — "sa salaja kutsud horde aga lauas kõrvuti istuvad
  teised näevad su ekraani" — ei ole lahendatud disaini-probleem. Võib-olla
  nõuab periodilist pass-the-phone rütmi zombile või lausa teist seadet.
  Enne proovimist on vaja UX-prototüüp. V2 hoiab *wounded + ghost* — need
  töötavad ühe seadmega puhtalt.
- **Lokaalne mudel (Ollama)**: 16GB GPU-ga qwen2.5:14b või gemma3:12b mahub.
  V2-st välja sest (a) tool-use töökindlus kohalikel mudelitel on praegu 5-10%
  malformatsioon → iga Faas 2/3 tööriist muutub ebausaldusväärseks, (b) latents
  10-15 sek/turn vs Claude Sonnet 2-3 sek cache'itud — rütm kukub, (c) eesti
  keele loominguline kvaliteet jääb märgatavalt alla. **Adapter-arhitektuur
  proxies juba olemas** — GPU tulekul ja tingimuste paranedes 2-3 päeva töö
  plugida sisse. Ei ole planeeritud faas, vaid opportunistlik lisa.
- **Pildid**: nano-banana / Flux per-stseen, ~$0.003/pilt. Atmosfääri hüpe,
  aga paneb rütmi lõksu (genereerimine 5-10 sek). Optional V3.
- **TTS laiemalt**: ElevenLabs eesti hääl kõigile mängijatele mitte ainult
  lugejale. Kallis ($3/mäng), latents lõhub tempot. Ainult kui inimlik
  lugeja ei saa.
- **NPC agendid**: iga oluline tegelane = mini-agent oma mäluga (tool use +
  persistence state). Vajab Faas 5 persistents kihti eelduseks.
- **Kampaania**: mitu seostatud sessiooni, mäng kestab mitu õhtut. Vajab
  persistens + jaga-linki + tegelaste-läbivust. Suurim nishi laiendus.
- **Laste variant**: eraldi projekt, filtreeritud teemad, lühemad kestused,
  kohandatud žanrid.

---

## Järgmine samm

**Faas 0 — skeleton**. Alustame kui Kaido annab OK.
