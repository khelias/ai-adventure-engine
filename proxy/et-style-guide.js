// Estonian word-order / style guide for AI-generated text.
//
// Loaded into:
//   - Claude system prompt (preventive) when request body has language === 'et'
//   - Gemini editor pass system prompt (corrective)
//
// Claude's `cache_control: ephemeral` is applied to the full system block, so
// the guide is cached per-conversation — negligible per-turn cost.

const ET_STYLE_GUIDE = `# Eesti keele sõnajärje juhis

## Alusprintsiip

Eesti keele sõnajärg väljendab infostruktuuri:
- **Lause algus** = teema (teadaolev, millest räägitakse)
- **Lause lõpp** = reema fookus (olulisim uus info)
- **Verb** = tavaliselt teisel kohal (V2), aga sõltub lausetüübist

Kui kahtled sõnajärjes, küsi: „Mis on selle lause olulisim uus info?" → see läheb lõppu.

## Verbi asend lausetüübiti

| Lausetüüp | Verbi asend | Näide |
|---|---|---|
| **Jaatav väitlause** (normaal) | **V2** — verb teisel kohal | *Kasutaja saadab päringu.* |
| Väitlause, teema ≠ alus | **V2** — alus nihkub verbi taha | *Igal hommikul **saadab** kasutaja päringu.* |
| Väitlause, rõhutu asesõna alus | **V2 või V3** — mõlemad aktsepteeritavad | *Homme **ootan** ma kõnet.* / *Homme ma **ootan** kõnet.* |
| Väitlause, pikk/raske alus | **V2 eelistatud** | *Juba hommikul **esitas** mu noorem poeg Kalle selle küsimuse.* |
| **Küsisõnaga küsimus** | V2 või **verb lõpus** | *Miks **tekib** viga?* / *Kuidas te siia **jõudsite**?* |
| **Kas-küsimus** | V2 või **verb lõpus** | *Kas süsteem **töötab**?* / *Kas sa homme **tuled**?* |
| **Inversiooniküsimus** (ilma kas/küsisõnata) | **V1** — verb esimesele kohale | ***Saadab** kasutaja päringu?* |
| **Käsklause** | **V1** | ***Käi** vahepeal kodus ära!* |
| **Hüüdlause** | **V1** | ***Oled** sina alles tubli!* |
| **Soovlause** | **V1** | ***Läheks** nad ometi minema!* |

### Kõrvallause verbi asend

| Kõrvallause tüüp | Verbi asend | Näide |
|---|---|---|
| **et, sest, kuna, kuigi** | Sama mis pealauses (V2) | *..., et kasutaja **saadab** päringu.* |
| **kes/mis-relatiivlause** | V2 või **verb lõpus** | *Server, mis päringuid **töötleb**, ...* |
| **kui-tingimus-/ajalause** | V2 või **verb lõpus** | *Kui sa seda **teed**, juhtub õnnetus.* |
| **Kaudküsilause** | Sageli **verb lõpus** | *Ma tean, miks arst seda tegema **pidi**.* |

## Eituse reeglid

**Eitussõna *ei*:**
- Seisab **vahetult** öeldise ees, lahutamatu plokina: \`ei\` + verb
- Verbi vorm on muutumatu (ilma pöördelõputa)
- \`ei\`-plokk liigub V2-reegli järgi teisele kohale: *Seetõttu **ei töötle** süsteem päringut.*
- ❌ *Ma **ei** homme **tule**.* → *ei* ja verb ei tohi olla lahutatud
- Eitavas lauses, mis algab *ega*-ga või eituse mõjualaga, võib verb olla lõpus: *Ega ma rumal **ei ole**!*

**Eitussõna *ära*:**
- Käskiva kõneviisi eitus
- **Võib** olla verbist eraldatud: ✅ *Ära homme tule.*

## Liitöeldis

Abiverb (pöördeline osa) → V2-reegli kohaselt teisel kohal.
Infinitiivvorm → lause lõpu poole, aga täpne koht sõltub fookusest.

✅ *Kasutaja **peab** päringu kinnitama.* (fookus: kinnitamine)
✅ *Kasutaja **peab** kinnitama päringu.* (fookus: päring)
✅ *Täna **peab** kasutaja päringu kinnitama.*
❌ *Täna kasutaja **peab** päringu kinnitama.* (abiverb 3. kohal)

## Muud sõnajärjereeglid

**Omadussõna** — alati nimisõna ees: *turvaline ühendus*, *uus krüpteeritud kanal*.

**Rõhumäärsõnad** (*ka, just, isegi, juba, veel, alles, hoopis* + *-gi/-ki*) — vahetult rõhutatava sõna **ees**:
- ***Ka** kasutaja saab päringut saata.* → rõhk: kasutajal
- *Kasutaja saab **ka** päringut saata.* → rõhk: saatmisel
- ❌ *Keelepäevi võiks edaspidi **ka** korraldada.* (mida rõhutab *ka*? segane)
- ✅ *Keelepäevi võiks **ka** edaspidi korraldada.* (*ka* rõhutab *edaspidi*)

**Aja-/kohamäärus** — lause alguses (siis V2!) või lause lõpus:
- *Täna juurutame uue versiooni.* / *Juurutame uue versiooni täna.*

**Viisimäärus** — öeldise lähedal. Lause algul olev viisimäärus eelistab V2-järge:
- *Kiiresti **lahkusid** õpilased koolimajast.*

**Kõrvallause** eraldatakse **alati komaga**.

## Lause kontrollpipeline

Rakenda iga genereeritud lause puhul järgmised sammud järjekorras:

1. FOOKUS    → Mis on lause uus/oluline info? → see läheb lõppu.
2. LAUSETÜÜP → Väitlause? Küsimus? Käsk? Eitus? Kõrvallause?
   → vali verbi asend tabelist ülal.
3. VERB V2?  → Kui jaatav iseseisev väitlause: verb teisel kohal.
   Kui lause algab määrusega: alus nihkub verbi taha.
   Erand: rõhutu asesõna (ma, ta, sa) lubab V3.
4. EITUS     → Kas „ei" on vahetult verbi ees, lahutamata?
5. RÕHUPARTIKKEL → Kas „ka/just/isegi/juba" on õige sõna ees?
6. OMADUSSÕNA → Nimisõna ees?
7. KOMA       → Kõrvallause komaga eraldatud?

*Alus: EKK 2007, SÜ 91–95, SÜ 32.*`;

module.exports = { ET_STYLE_GUIDE };
