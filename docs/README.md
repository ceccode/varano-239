# Indice della documentazione

Questa cartella contiene la specifica completa di **VARANO 2:39**. Il codice non deve anticipare o contraddire decisioni qui registrate.

## Documenti di trama (privati)

Game design, trattamento della storia, specifica narrativa e roadmap **non sono nel repository pubblico**: contengono trama, finali e colpi di scena, e pubblicarli annullerebbe la suspance del gioco (ADR-028). Vivono in `docs/private/`, ignorata da git:

- `docs/private/GAME_DESIGN.md` — loop, ruoli, finali e profondità del mistero;
- `docs/private/STORY_TREATMENT.md` — trama completa ed epiloghi;
- `docs/private/NARRATIVE.md` — personaggi, tono, testi approvati e regole sulla morte;
- `docs/private/ROADMAP.md` — stato del progetto e cosa resta;
- `docs/private/LAUNCH.md` — piano di lancio, contatti e testi per le comunicazioni.

Non essendo versionati, il proprietario li conserva a parte. Chi contribuisce dall'esterno lavora sui documenti pubblici e concorda i contenuti narrativi nella issue o nella pull request.

## Per implementare

1. [Architettura](./ARCHITECTURE.md) — TypeScript/Vite, dominio puro, DOM-first, storage e porte.
2. [Modello dei contenuti](./CONTENT_MODEL.md) — nodi, dossier, condizioni, effetti e definizione della campagna.
3. [Espansioni](./EXPANSIONS.md) — come è fatto un capitolo e come si aggiunge un livello.
4. [Qualità](./QUALITY.md) — test, accessibilità, performance, sicurezza e checklist di rilascio.
5. [Privacy](./PRIVACY.md) — dati locali e analytics minimali.
6. [Licenze](../LICENSING.md) — quali parti sono codice AGPL e quali contenuti CC BY-NC-SA.

## Per verificare e contribuire

7. [Fonti](./SOURCES.md) — cronologia reale, divergenze e regole editoriali.
8. [Decisioni](./DECISIONS.md) — ADR accettate e proposte.
9. [Registro degli asset](./ASSETS.md) — provenienza e licenze di immagini, font e audio.
10. [`AGENTS.md`](../AGENTS.md) — istruzioni vincolanti per agenti AI di coding.
11. [`CONTRIBUTING.md`](../CONTRIBUTING.md) — guida per contributori umani.

## Archivio storico

- [Scouting del formato](./FORMAT_SCOUTING.md) — il confronto fra i formati candidati, chiuso da ADR-018 a favore del platformer. Documento storico: non descrive il gioco attuale.

## Ordine di autorità

In caso di conflitto:

1. `AGENTS.md`;
2. ADR con stato Accettata in `DECISIONS.md`;
3. requisiti P0 in `docs/private/ROADMAP.md`;
4. `docs/private/GAME_DESIGN.md`, `docs/private/NARRATIVE.md` e `EXPANSIONS.md`;
5. esempi non normativi negli altri documenti.

## Decisioni correnti essenziali

- Titolo: **VARANO 2:39 — Il mistero dei Sei Colli**.
- Pubblico consigliato: **12+**, senza parolacce o gore.
- Quattro ruoli; il Varano resta il protagonista. Il ruolo è l'unica scelta di setup (ADR-048).
- Edizione unica: nessuna scelta di sensibilità e nessun asse `approach` (ADR-022, ADR-048).
- Tutte le scene giocabili sono LEGGENDA; i fatti reali restano nell'Archivio, cioè in `docs/SOURCES.md`, linkato dai credits (ADR-024). Il gioco non contiene schede di Dossier.
- Le 2:39 sono una testimonianza riportata dalla stampa, distinta dal FATTO delle segnalazioni fotografiche ritenute attendibili nell'ordinanza.
- Soltanto il Cacciatore che ha scelto «Documenta la scena» nel prologo può scegliere un abbattimento fuori campo, seguito da una conferma aggiuntiva.
- Il destino del Varano e il mistero della sua origine sono indipendenti; l'origine non viene risolta.
- Fuga e abbandono sono ipotesi non accertate; ogni complotto è pura leggenda con soggetti inventati.
- La campagna è chiusa a **10 livelli e 6 finali** (ADR-047): capitoli e livelli sono contenuti dichiarativi compilati, un nuovo livello aggiunge una cartella di capitolo e una voce nel registro senza toccare quelli già scritti (ADR-034).
- TypeScript + Vite, zero dipendenze runtime; il loop principale è un platformer canvas con motore locale (ADR-018), avvio immediato a schermo intero e menù in-game (ADR-021); menù e overlay narrativi restano nel DOM.
- La parte arcade è il default per tutti (ADR-046); «Salta il livello» resta sempre disponibile con lo stesso esito narrativo.
- Nessun account o backend; analytics limitati al funnel aggregato e senza payload definito da ADR-059.
- Italiano e inglese completi, con URL e metadata canonici distinti (ADR-060).

## Aggiornare la documentazione

Una modifica narrativa o tecnica è completa soltanto se aggiorna tutti i documenti coinvolti. In particolare:

- nuovo finale o regola morale: game design, narrativa, content model, qualità e ADR;
- nuovo fatto o ipotesi: `SOURCES.md`, modello dei contenuti e test di validazione;
- nuovo capitolo o livello: espansioni, definizione della campagna, registro dei livelli e test contrattuali;
- nuovo servizio o dato raccolto: privacy, architettura e ADR;
- nuovo asset: registro asset e relativa licenza.
