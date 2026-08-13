# Capitoli e livelli

## Come stanno le cose

La campagna è chiusa: **dieci livelli, undici capitoli, sei finali** (ADR-047). Questo documento non è un piano di crescita — è la ricetta con cui i dieci livelli sono stati costruiti, scritta perché resti riproducibile.

Il gioco è un unico **Story Pack compilato**, `core`. Non è un plugin system: il browser non scarica né esegue codice di terze parti, non c'è discovery automatica, non c'è manifest remoto. I contratti per un secondo pack (`ChapterInsertion`, `CoreChapterTransition`, `ExtensionPointId`) esistono nei tipi come cucitura, ma **la funzione di composizione non è implementata** e non esiste nessun pack opzionale. Costruirne uno sarebbe una decisione nuova, con la sua ADR.

## Anatomia di un capitolo

Ogni capitolo è una cartella con due file:

```text
src/content/packs/core/chapters/cNN-slug/
  chapter.ts    il ChapterBundle: nodi, carte del Dossier, fonti
  messages.ts   il catalogo italiano del capitolo
```

I numeri di cartella (`c00`…`c09`, più `c99-finale`) sono l'**ordine di produzione**. L'ordine di storia vive nell'array di `pack.ts` e può essere diverso: i cinque capitoli della lunga notte sono stati prodotti dopo i primi, ma giocati prima (ADR-045).

Il capitolo si collega in avanti al segnaposto `nextChapterNodeId`, mai al nome del successore. `chainChapters()` risolve i segnaposti in ordine di array. È questa indirezione a rendere l'inserimento di un capitolo a metà campagna un'operazione che **non modifica nessun capitolo già scritto** — ha retto tre inserimenti consecutivi senza una riga di diff nei capitoli vicini.

Il finale vive in `chapters/c99-finale/` ed è sempre l'ultimo bundle dell'array: nessun capitolo nuovo lo scavalca.

## Aggiungere un livello

Ricetta consolidata (ADR-034/045), **senza modificare alcun capitolo già scritto**:

1. una cartella `chapters/cNN-slug/` con `chapter.ts` e `messages.ts`;
2. il capitolo collegato in avanti a `nextChapterNodeId`;
3. una voce nell'array del pack, prima del capitolo finale;
4. configurazione con `defineLevel()`, che porta già fisica ed etichette dei controlli;
5. voce in `levelConfigs` di `src/levels/registry.ts`;
6. chiavi proprie del nodo: `headingKey`, `introKey`, `recapKey`;
7. tre indizi, checkpoint, un `backdrop` diverso da quello dei livelli vicini e una traccia `music` propria;
8. adattatore isolato **soltanto** se introduce una meccanica nuova;
9. percorso di salto equivalente e suite contrattuale condivisa;
10. verifica touch, tastiera e viewport da 320 px;
11. `version` ed `estimatedMinutes` del pack aggiornati.

`src/levels/registry.ts` è l'unico modulo che risolve la coppia `levelId`/`configId`. La mappa `levelConfigs` associa ogni `LevelId` al proprio `configId` ammesso e alla configurazione tipizzata; `registeredLevelDescriptors` ne è derivato automaticamente ed espone al validatore le chiavi di messaggio di ciascun livello. `mountRegisteredLevel()` cerca la coppia e monta l'adapter platformer, restituendo `undefined` quando la coppia non è registrata: è un errore di contenuto in build e un errore recuperabile al bootstrap. È anche l'unico punto in cui il ruolo diventa un potere (ADR-031), così la fisica resta pura e testabile senza ruolo.

Finché esiste un solo adapter non c'è un secondo uso che giustifichi un'astrazione `resolveLevel()` generica: una meccanica davvero nuova introduce prima il proprio adapter dietro `MiniGamePort`, e solo allora la risoluzione diventa un punto di variazione reale.

Il reducer non salva l'oggetto del mini-gioco: applica il ramo `completed` o `skipped` e persiste il normale `RunState` risultante.

## Invarianti di design che il registro afferma

Le invarianti non sono raccomandazioni in prosa: `tests/unit/arcade-variety.test.ts` e i modelli per livello le affermano sull'**intero registro**, così un livello nuovo non può romperle in silenzio.

- ogni fossato è attraversabile col salto base, senza superpotere e senza corsa;
- una planata in scatto non finisce mai in un fossato;
- ogni indizio ha un appoggio raggiungibile;
- una simulazione senza poteri chiude il livello a zero cadute;
- fondale, musica, intestazione e cameo sono distinti da quelli dei livelli vicini;
- nessun tratto senza checkpoint oltre la soglia registrata;
- il budget di chiamate di disegno per frame resta sotto il tetto misurato.

Indizi, stella, cameo e vite **non toccano mai** reputazione, sigilli, condizione o disponibilità dei finali. Altrimenti salterebbe l'invariante fondamentale: «Salta il livello» deve produrre un esito narrativo identico.

## Regole editoriali

Ogni carta del Dossier dichiara:

- timbro FATTO, TESTIMONIANZA, IPOTESI, LEGGENDA o SCONFESSATO;
- fonti e data di verifica quando il timbro le richiede;
- parte reale e parte inventata.

Non usare nomi, indirizzi, fotografie, loghi o dettagli che rendano riconoscibile una persona o attività reale come responsabile di abbandono, traffico, possesso illecito o complotto. Montichiari e il Castello Bonoris sono reali e nominati come tali; Borgocoda è inventato.

## Namespace

Ogni ID posseduto dal pack inizia con il Pack ID, e il validatore rifiuta il resto:

```text
core.node.finale.rescued
core.level.colle-san-pancrazio
core.dossier.photo-confirmed
```

## Salvataggi e migrazioni

- Aggiungere un capitolo in coda non richiede migrazione.
- **Rinominare o rimuovere un ID di nodo sì**: va inserito in `renamedNodeIds` in `src/core/save.ts`, con il suo test. Senza, un giocatore a metà campagna atterra su «questa parte della storia non è disponibile».
- Aggiungere o togliere un campo delle impostazioni è retrocompatibile per costruzione dalla ADR-053: la decodifica è tollerante sulle preferenze e severa solo sul run.

## Definition of Done

- Trattamento breve approvato dal proprietario.
- Tutti gli ID namespaced.
- Fonti e confine fra realtà e fiction revisionati.
- Percorso completo e percorso salto testati.
- Invarianti del registro verdi, incluso il budget di disegno.
- Livello guidato in un browser reale prima della PR, poi playtest del proprietario sulla draft PR.
- Asset registrati in `ASSETS.md`.
- `npm run check` verde.
