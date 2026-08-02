# Indice della documentazione

Questa cartella contiene la specifica completa di **VARANO 2:39**. Il codice non deve anticipare o contraddire decisioni qui registrate.

## Per iniziare

1. [Scouting del formato](./FORMAT_SCOUTING.md) — confronto fra platform, top-down, visual novel e point-and-click.

### Documenti di trama (privati)

Game design, trattamento della storia, specifica narrativa e roadmap **non sono nel repository pubblico**: contengono trama, finali e colpi di scena, e pubblicarli annullerebbe la suspance del gioco (ADR-028). Vivono in `docs/private/`, ignorata da git:

- `docs/private/GAME_DESIGN.md` — loop, ruoli, finali e profondità del mistero;
- `docs/private/STORY_TREATMENT.md` — trama completa ed epiloghi;
- `docs/private/NARRATIVE.md` — personaggi, tono, testi approvati e regole sulla morte;
- `docs/private/ROADMAP.md` — milestone, priorità e acceptance criteria.

Non essendo versionati, il proprietario li conserva a parte. Chi contribuisce dall'esterno lavora sui documenti pubblici e concorda i contenuti narrativi nella issue o nella pull request.

## Per implementare

5. [Architettura](./ARCHITECTURE.md) — TypeScript/Vite, dominio puro, DOM-first, storage e porte.
6. [Modello dei contenuti](./CONTENT_MODEL.md) — nodi, dossier, condizioni, effetti, misteri, definizione della campagna e grafo composto.
7. [Espansioni](./EXPANSIONS.md) — come aggiungere misteri, capitoli e livelli senza plugin runtime.
8. [Qualità](./QUALITY.md) — test, accessibilità, performance, sicurezza e checklist di rilascio.
9. [Privacy](./PRIVACY.md) — dati locali e analytics minimali.
10. [Licenze](../LICENSING.md) — quali parti sono codice AGPL e quali contenuti CC BY-NC-SA.

## Per verificare e contribuire

11. [Fonti](./SOURCES.md) — cronologia reale, divergenze e regole editoriali.
12. [Decisioni](./DECISIONS.md) — ADR accettate e proposte.
13. [Registro degli asset](./ASSETS.md) — provenienza e licenze di immagini, font e audio.
14. [`AGENTS.md`](../AGENTS.md) — istruzioni vincolanti per agenti AI di coding.
15. [`CONTRIBUTING.md`](../CONTRIBUTING.md) — guida per contributori umani.

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
- Quattro ruoli; il Varano resta il protagonista.
- Tutte le scene giocabili sono LEGGENDA; i fatti reali restano nelle schede attribuite e nell'Archivio.
- Le 2:39 sono una testimonianza riportata dalla stampa, distinta dal FATTO delle segnalazioni fotografiche ritenute attendibili nell'ordinanza.
- In `gentle` il Varano sopravvive sempre.
- In `complete`, soltanto `hunter + evidence` può scegliere un abbattimento fuori campo, seguito da una conferma aggiuntiva.
- Il destino del Varano e il mistero della sua origine sono indipendenti.
- Fuga e abbandono sono ipotesi non accertate; il complotto è pura leggenda con soggetti inventati.
- Misteri e capitoli sono Story Pack compilati, dichiarativi, saltabili e namespaced; una nuova meccanica di livello usa anche un adapter isolato.
- TypeScript + Vite, nessun framework di gioco nell'MVP; il loop principale è un platformer canvas con motore locale (ADR-018), avvio immediato a schermo intero e menù in-game (ADR-021); menu, overlay narrativi, Dossier e Archivio restano nel DOM.
- Nessun account o backend; analytics limitati a visite aggregate e `game_start`.

## Aggiornare la documentazione

Una modifica narrativa o tecnica è completa soltanto se aggiorna tutti i documenti coinvolti. In particolare:

- nuovo finale o regola morale: game design, narrativa, content model, qualità e ADR;
- nuovo fatto o ipotesi: fonti, modello dossier e test di validazione;
- nuovo Story Pack: espansioni, roadmap, definizione della campagna e test contrattuali;
- nuovo servizio o dato raccolto: privacy, architettura e ADR;
- nuovo asset: registro asset e relativa licenza.
