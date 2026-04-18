# AI Adventure Engine — V2 Planning

V1 on live (`games.khe.ee/adventure/`) ja töötab.
See dokument on **input järgmisele sessioonile** — mitte lõplik plaan, vaid otsustuskoht ja koduülesanded.

---

## V1 tehnika hetkel

- `index.html` + `app.js` (~500 rida) + `style.css` — puhas vanilla, ei mingit build step'i
- Proxy (`khe-homelab/services/apps/games/adventure-proxy/`): provider-agnostic, Claude + Gemini adapteriga, schema enforcement tool use / responseSchema kaudu
- GitHub Actions self-hosted runner deploys staatika `/srv/data/games/adventure/app/`
- Mäng voolab: setup → loo valik → rollid → käigud → lõpp (koos "sequel" tekstiga)
- Parameetrid (toiduvaru, moraal jne) kriitilise oleku jälgimiseks
- ET + EN i18n
- Täielikult kliendipoolne state — refresh = mäng kadunud

---

## Mis töötab hästi (säilitada V2-s)

- **Turn loop** on tihe ja arusaadav
- **Sequel-mehaanika** — loo jätkamine kahe mängu vahel läbi "sequel text"
- **Parameetrid** annavad mängule panustatavat riski
- **Pass-the-phone muster** — üks seade, mitu mängijat, lihtne setup
- **i18n** — kergelt laiendatav uutele keeltele
- **Provider abstraktsioon** — juba tehtud, ei puutu

## Mis on nõrk (V2 peaks lahendama)

### Kood ise
- Monoliitne app.js segab kõik kontsernid kokku
- Raske lisada feature'eid (iga muudatus riskib regressiooniga)
- Ei ole teste → ei julge refactorida
- Pole tüüpe (TypeScript) → API muudatused lähevad märkamatult

### UX
- **Ei ole persistense'i** — brauseri refresh = mäng otsast algama. Perele kaotusvalu.
- Ei saa mängu sõbrale saata / jätkata hiljem
- Ei ole käikude ajalugu (tagasi vaatamine)
- Üks seade piirab mängijate arvu loomulikult 3-5 peale
- Mobiilisõbraliku UI pole (ekraani suurus kitsas)

### AI arhitektuur
- Iga käik = eraldi prompt ilma mäluta (mudel "loeb" mängu oleku promptist)
- Ei kasuta **prompt caching**'ut — iga turn saadab kogu ajaloo täishinnaga (Claude'il see suur kaotus)
- Ei kasuta **tool use'i** struktureeritud state halduseks — loo järjepidevus kannatab
- NPC-del pole "mälu" — iga käik uus

---

## V2 otsustusruum

Järgmises sessioonis otsustame:

### Stack
| Valik | Poolt | Vastu |
|---|---|---|
| **React + Vite + TS** | Sama muster mis study-game, teada tehnoloogia, tüübid | Overhead kui mäng jääb lihtsaks |
| **Svelte + Vite + TS** | Kergem bundle, reaktiivsem olek | Uus tehnoloogia sinu jaoks siin |
| **Vanilla + moodulid** | Null dependency, kerge käituda | Palju käsitsitööd state haldusega |

### Backend
- **Proxy muutused**: kas sama (Gemini/Claude), või lisa kolmas rada (stateful agent)?
- **Postgres mängude salvestamiseks** (shared Docker volume)? Võimaldab: sõbrale saatmine, jätkata hiljem, käikude ajalugu
- **WebSocket reaalajas multiplayer'i jaoks**? Või REST + polling?

### AI evolutsioon
- **Tool use** struktureeritud state'i jaoks (V2 sees): `update_inventory`, `damage_player`, `add_location` tööriistad — mudel kutsub, frontend salvestab
- **Prompt caching** (Claude) — system prompt + lugu cache'itakse, iga turn odav
- **NPC agendid** (V2.5) — iga oluline tegelane = mini-agent oma mäluga
- **Per-stseen pildid** (V3) — nano-banana / Flux, ~$0.003/pilt
- **TTS narratsioon** (V3) — ElevenLabs eesti hääl

### Fookus-skaala ("mis mäng päriselt on?")
See on V2 põhiline disainiküsimus:

1. **Pere-mäng** (lihtne, hubane, laste jaoks ohutu, lühike) →
   persistents + pildid, tool use tähtsam kui multiplayer, lühikesed mängud
2. **Seltskonna-mäng** (pikk, süvamõtlemine, täiskasvanud) →
   multiplayer + sessioonide vahel jätkamine, NPC agendid, pikk campaign
3. **Tehniline demo** (näidata AI võimalusi) →
   eksperimenteerida uue AI feature'iga (tool use, agent loop, images)

Kõike ei saa ja iga suund tähendab erinevaid tehnoloogilisi valikuid.

---

## Sisukas järgmise sessiooni alguses

### Kaido koduülesanded (enne)

- [ ] **Mängi vähemalt üks täielik mäng** läbi `games.khe.ee/adventure/` peal — Gemini-poolelt
- [ ] Pane kirja 3-5 asja mis tundub valesti / nõrgalt / ei toimi loogiliselt
- [ ] Mõtle **fookust**: kas see on pere-mäng, seltskonna-mäng või demo? (võib olla hübriid, aga prioriteetide tõttu on kasu selguest)
- [ ] (Optional) Lisa Anthropic võti — Claude annab parema eesti keele, V2 eeldab et see on kättesaadav (või vähemalt valik olemas)
- [ ] (Optional) Skim olemasolev `app.js` — saad tagasi mälus mis seal on

### Mu esimesed sammud (sessiooni alguses)

1. **Koodi audit** (30-45 min): loen kogu olemasoleva `app.js`-i läbi, märgin ära
   - Mis promptid on kasutusel (copy-paste'i kõik prompt string'id välja)
   - Kus on state'i haldus (mis globaalses `gameState`-is, mis DOM-is peidetud)
   - Kus on seoste/vigade riskialad
2. **Esita sulle kokkuvõte**: "V1 nagu on, siin on tõeline seis, siin on 3 suunda V2 jaoks"
3. **Otsustame koos**: stack, fookus, esimene etapp
4. **Töö**: etapp-etapi kaupa, iga sessioon mõõdetavalt edasi

---

## Praegune status (olulised failid)

- Frontend: `/Users/KaidoHenrik.Elias/Projects/ai-adventure-engine/` (see repo)
- Proxy: `../khe-homelab/services/apps/games/adventure-proxy/`
- Live: https://games.khe.ee/adventure/
- Git history: clean, pole tehnilist võlga

---

## Lõplik otsus

**V2 alustamine ootab järgmist sessiooni.** Täna (2026-04-18) oleme juba teinud:
- Games hub migratsioon (Faas 1)
- Adventure self-host (Faas 2)
- Provider-agnostic proxy (V1.5)
- Launcher redisain
- Cache-busting / CF quirks debug

Järgmisel korral: värske pilk, õige plaan, tõsi rewrite.
