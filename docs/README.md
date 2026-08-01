# Indice della documentazione

Questa cartella contiene la specifica completa di **VARANO 2:39**. Il codice non deve anticipare o contraddire decisioni qui registrate.

## Per iniziare

1. [Game design](./GAME_DESIGN.md) — pubblico 12+, loop, ruoli, sensibilità, finali e profondità del mistero.
2. [Trattamento della storia](./STORY_TREATMENT.md) — trama completa, Dossier Origini, Castello Bonoris ed epiloghi.
3. [Specifica narrativa](./NARRATIVE.md) — personaggi, tono, testi approvati, atti e regole sulla morte.
4. [Scouting del formato](./FORMAT_SCOUTING.md) — confronto fra platform, top-down, visual novel e point-and-click.

## Per implementare

5. [Architettura](./ARCHITECTURE.md) — TypeScript/Vite, dominio puro, DOM-first, storage e porte.
6. [Modello dei contenuti](./CONTENT_MODEL.md) — nodi, dossier, condizioni, effetti, misteri, definizione della campagna e grafo composto.
7. [Espansioni](./EXPANSIONS.md) — come aggiungere misteri, capitoli e livelli senza plugin runtime.
8. [Qualità](./QUALITY.md) — test, accessibilità, performance, sicurezza e checklist di rilascio.
9. [Privacy](./PRIVACY.md) — dati locali e analytics minimali.
10. [Roadmap](./ROADMAP.md) — milestone, priorità e acceptance criteria.

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
3. requisiti P0 in `ROADMAP.md`;
4. `GAME_DESIGN.md`, `NARRATIVE.md` e `EXPANSIONS.md`;
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
- TypeScript + Vite, DOM-first, nessun framework di gioco nell'MVP.
- Nessun account o backend; analytics limitati a visite aggregate e `game_start`.

## Aggiornare la documentazione

Una modifica narrativa o tecnica è completa soltanto se aggiorna tutti i documenti coinvolti. In particolare:

- nuovo finale o regola morale: game design, narrativa, content model, qualità e ADR;
- nuovo fatto o ipotesi: fonti, modello dossier e test di validazione;
- nuovo Story Pack: espansioni, roadmap, definizione della campagna e test contrattuali;
- nuovo servizio o dato raccolto: privacy, architettura e ADR;
- nuovo asset: registro asset e relativa licenza.
