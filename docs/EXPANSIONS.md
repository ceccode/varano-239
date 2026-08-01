# Misteri, capitoli e nuovi livelli

## Obiettivo

Il gioco deve poter crescere nel tempo senza trasformare il motore narrativo in uno spaghetti code. Un contributore deve poter aggiungere un dossier o un capitolo modificando quasi soltanto contenuti dichiarativi, mentre reducer, renderer, salvataggio e analytics restano invariati.

La soluzione è un registro statico di **Story Pack compilati insieme al gioco**. Non è un plugin system: il browser non scarica o esegue codice di terze parti.

## Tipi di espansione

### Mistero

Raggruppa indizi già distribuiti in uno o più capitoli. Esempi:

- da dove arriva il Varano;
- perché le cronache associano alla fotografia proprio l'orario 2:39;
- due segnali termici incompatibili;
- chi ha disegnato il primo sigillo dei Sei Colli.

Un mistero non richiede un quest engine. Il suo stato — nascosto, aperto, approfondito — viene derivato dagli indizi scoperti.

Gli ID delle teorie sono dati namespaced del pack, non una union del core. Per esempio `origins.theory.escape`, `origins.theory.abandonment` e `origins.theory.conspiracy`. Un futuro mistero introduce teorie proprie senza modificare reducer, storage o UI.

### Capitolo narrativo

Aggiunge scene, dialoghi, scelte, dossier e checkpoint. Entra in un punto dichiarato della campagna e torna sempre al core.

### Livello interattivo

Aggiunge una sfida con un adattatore isolato. Ogni livello deve avere un percorso «Salta» equivalente. Phaser o altro framework richiedono il gate già descritto in `ARCHITECTURE.md`.

## Preset del giocatore

- `core`: soltanto il caso principale; mostra comunque che l'origine è sconosciuta.
- `origins`: core più il Dossier Origini; è il preset consigliato.
- `all-registered`: tutti i pacchetti compatibili registrati nella build; etichetta UI «Tutti i contenuti inclusi».

Il preset cambia durata e numero di piste, non accessibilità o difficoltà degli enigmi. Prima di entrare in un arco opzionale la UI mostra titolo, durata stimata e pulsante «Salta questo dossier».

## Struttura

```text
src/content/
  campaign.ts
  compose-packs.ts
  packs/
    core/
      pack.ts
      chapters/
    origins/
      pack.ts
      chapters/
        x01-open-cage/
        x02-unnamed-crate/
        x03-tail-society/
    two-shadows/
      pack.ts
      chapters/
```

Ogni cartella di capitolo contiene soltanto ciò che le appartiene:

```text
chapter.ts
nodes.ts
clues.ts
messages.ts
sources.ts
```

Gli asset restano nel manifest globale, referenziati tramite `AssetId`.

## Contratto del pacchetto

```ts
export interface StoryPack {
  readonly id: StoryPackId;
  readonly version: number;
  readonly kind: "core" | "mystery" | "expansion";
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly estimatedMinutes: number;
  readonly requires: readonly StoryPackId[];
  readonly chapters: readonly ChapterBundle[];
  readonly mysteries: readonly MysteryDefinition[];
  readonly theories: readonly TheoryDefinition[];
}
```

Ogni `ChapterBundle` opzionale dichiara invece i propri punti d'ingresso e ritorno:

```ts
export interface ChapterBundle {
  readonly chapter: Chapter;
  readonly insertion?: ChapterInsertion;
  readonly nodes: readonly StoryNode[];
  readonly dossierCards: readonly DossierCard[];
  readonly clues: readonly ClueDefinition[];
  readonly messages: MessageCatalog;
  readonly sources: readonly SourceRef[];
}

export interface ChapterInsertion {
  readonly at: ExtensionPointId;
  readonly order: number;
}
```

`insertion` è assente nei capitoli del pack `core` e obbligatoria nei capitoli dei pack opzionali. `at` sceglie uno slot pubblicato dal core; `order` è un intero non negativo e stabilisce la posizione quando più capitoli usano lo stesso slot.

`campaign.ts` importa esplicitamente i pacchetti:

```ts
export const campaign = defineCampaign({
  id: "varano-239",
  titleKey: "core.message.title",
  subtitleKey: "core.message.subtitle",
  entryNodeId: "core.node.prologue.field-intro",
  contentVersion: 1,
  sharedFlagIds: [],
  coreTransitions,
  outcomes: coreOutcomeRules,
  packs: [corePack, originsPack],
});
```

Niente scansione del filesystem, manifest remoto, `eval`, import da URL o callback nei dati.

## Namespace e confini

Ogni ID posseduto da un pack inizia con il Pack ID:

```text
origins.open-cage.scene.greenhouse
origins.open-cage.clue.broken-mesh
two-shadows.marsh.level.thermal-scan
```

Un pacchetto non può:

- usare o sovrascrivere un ID core;
- collegarsi direttamente a un nodo interno di un altro pacchetto;
- leggere flag locali di un altro pacchetto;
- cambiare testi o fonti esistenti;
- rendere obbligatorio un mini-gioco;
- aggiungere eventi analytics;
- impedire un finale core.

I soli flag leggibili o scrivibili fra pacchetti sono quelli `campaign.*` presenti nella allowlist `CampaignDefinition.sharedFlagIds`. Il prefisso, da solo, non concede accesso. Un pack opzionale non modifica punteggi, condizione o destino del core: usa indizi, carte, teorie, flag, oggetti e scelte col proprio namespace.

## Punti d'innesto

Il core pubblica una lista corta e versionata:

```text
core.hook.after-red-zone
core.hook.after-superstar
core.hook.before-castle
core.hook.after-credits
```

Il registro tipizzato `CampaignDefinition.coreTransitions` assegna una destinazione a ogni uscita core non terminale. Una transizione pubblica un hook tramite `extensionPointId`; le altre restano semplici rotte base. `composeStoryPacks()` raggruppa i capitoli abilitati per hook e li ordina per `insertion.order`, poi per Pack ID e Chapter ID. Collega l'uscita core al primo capitolo, ogni `chapter.exitNodeId` al successivo e l'ultimo al `targetNodeId` originale; senza inserimenti conserva la rotta base. Un capitolo opzionale termina quindi con il proprio `chapter-end`, mai con un riferimento arbitrario al core.

Un nuovo hook richiede una decisione architetturale soltanto se cambia la semantica della campagna. Non creare un hook per ogni scena.

## Dossier Origini iniziale

### Capitolo `origins.open-cage`

- Teoria: fuga accidentale.
- Derivazione reale: ipotesi riportata, non accertata.
- Fiction: serra, rete, ricevuta e proprietario.
- Innesto: `core.hook.after-red-zone`.

### Capitolo `origins.unnamed-crate`

- Teoria: abbandono.
- Derivazione reale — TESTIMONIANZA: un'opinione attribuita dalla stampa ritiene possibile l'abbandono.
- Derivazione reale — IPOTESI: alcuni articoli presentano l'abbandono come spiegazione possibile, non accertata.
- Fiction: deposito, cassa, appunti, veicolo e responsabile.
- Innesto: `core.hook.after-superstar`.

### Capitolo `origins.tail-society`

- Teoria: complotto più grande.
- Derivazione reale: nessuna; pura leggenda.
- Fiction: Società della Coda, dossier `2:39`, sigilli e piano del castello.
- Innesto: `core.hook.before-castle`.

Il pack non conferma una teoria. L'epilogo registra l'interpretazione scelta e mostra l'avviso che fuga, abbandono e complotto non sono dimostrati dalle fonti.

## Regole editoriali

Ogni indizio dichiara:

- mistero di appartenenza;
- teoria sostenuta e contraddetta;
- timbro FATTO, TESTIMONIANZA, IPOTESI, LEGGENDA o SCONFESSATO;
- fonti e data di verifica quando richieste;
- parte reale e parte inventata;
- condizione di sblocco.

Non usare nomi, indirizzi, fotografie, loghi o dettagli che rendano riconoscibile una persona o attività reale come responsabile di abbandono, traffico, possesso illecito o complotto.

## Nuovi livelli

La definizione canonica di `LevelNode`, inclusi i campi ereditati da `BaseNode`, vive soltanto in `CONTENT_MODEL.md`. Il nodo contiene `levelId`, `configId`, `completedNodeId` e `skippedNodeId`.

`src/levels/registry.ts` registra insieme, per ogni `LevelId`, l'adattatore e la mappa tipizzata delle configurazioni ammesse. `resolveLevel(levelId, configId)` restituisce adattatore e configurazione oppure un errore esplicito; la validazione di build rifiuta coppie non registrate. Il reducer non salva l'oggetto del mini-gioco: applica il ramo `completed` o `skipped` e persiste il normale `RunState` risultante.

Aggiungere un livello richiede:

1. configurazione tipizzata;
2. adattatore isolato;
3. voce nel registro compilato;
4. suite contrattuale condivisa;
5. nodo nel capitolo;
6. percorso di salto equivalente;
7. verifica touch, tastiera e movimento ridotto.

## Validazione

Ogni pack fallisce la build se:

- ID o flag non rispettano il namespace;
- dipendenze del pack o hook dei capitoli non esistono;
- `insertion.order` non è un intero non negativo;
- esistono dipendenze cicliche;
- un nodo è irraggiungibile o senza uscita;
- non esiste un ritorno al core;
- una carta usa un timbro senza fonti/avvisi conformi;
- un mistero o indizio referenziato non esiste;
- un livello non ha `skippedNodeId`;
- la coppia `levelId`/`configId` non è presente nel registro;
- un testo italiano o asset manca;
- un finale core diventa irraggiungibile;
- l'abbattimento diventa disponibile fuori da `hunter + evidence + complete`;
- la scelta letale sblocca indizi o ricompense esclusivi.

## Test contrattuali

La stessa suite Vitest viene applicata a ogni pacchetto:

- composizione con il solo core;
- composizione con tutte le dipendenze;
- ingresso, completamento, salto e ritorno;
- checkpoint valido prima e dopo il pack;
- nessuna collisione di ID;
- catalogo italiano completo;
- grafo finito per tutti i setup supportati;
- nessuna richiesta analytics aggiuntiva;
- rimozione del pack con ritorno al checkpoint core.

Il test architetturale principale è questo: aggiungere un capitolo narrativo non modifica `core/`, `features/` o `platform/`.

## Salvataggi e versioni

Il salvataggio registra `contentVersion`, `activePackVersions`, pack completati, `coreCheckpointNodeId` e indizi scoperti.

- Aggiungere un pack opzionale non richiede migrazione.
- Aggiungere un capitolo in coda non richiede migrazione.
- Rinominare o rimuovere ID richiede una migrazione pura e testata.
- Se un pack del salvataggio non è più presente nella build, il gioco torna al checkpoint core compatibile e applica la bonifica completa descritta in `ARCHITECTURE.md`; conserva stato core e soli flag condivisi ancora dichiarati in `sharedFlagIds`.
- Un nuovo pack aggiunto alla build non si attiva nel mezzo di una partita salvata: valgono gli `activePackVersions` fissati all'avvio.
- La ripresa usa `StorySelection.kind = "resume"`; il preset `all-registered` viene rivalutato soltanto quando il giocatore avvia una nuova partita.
- Nessuna migrazione esegue codice del pacchetto.

## Definition of Done di un'espansione

- Issue e breve trattamento approvati.
- Pack importato esplicitamente in `campaign.ts`.
- Tutti gli ID namespaced.
- Fonti e confine fra realtà e fiction revisionati.
- Percorso completo e percorso salto testati.
- Nessuna modifica a reducer, renderer, storage o analytics per un pack solo narrativo.
- Asset registrati in `ASSETS.md`.
- `npm run check` verde.
