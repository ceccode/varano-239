# Modello dei contenuti

## Obiettivo

La storia deve poter cambiare senza introdurre logica nei dati, callback arbitrarie o quattro copie degli stessi capitoli. I contenuti sono moduli TypeScript verificati con `satisfies`, compilati insieme al gioco: non servono CMS, database, JSON runtime o plugin caricati dalla rete.

## Identificatori

Usare stringhe nominali o convenzioni prefissate:

```ts
type NodeId = string;
type ChapterId = string;
type MessageKey = string;
type AssetId = string;
type SourceId = string;
type DossierCardId = string;
type OutcomeId = string;
type MysteryId = string;
type TheoryId = string;
type ClueId = string;
type StoryPackId = string;
type ExtensionPointId = string;
type LevelId = string;
type LevelConfigId = string;
type ItemId = string;
type SealId = string;
type ChoiceId = string;
type OptionId = string;
type HotspotId = string;
type SpeakerId = string;
type SurpriseId = string;
type FlagId = string;
type ScoreName = "evidence" | "care" | "publicTrust";
```

Formato consigliato:

```text
core.node.finale.rescued
core.message.finale.option.shoot
core.level.colle-san-pancrazio
core.choice.prologue.priority
core.outcome.count-of-six-hills
```

Gli ID sono stabili e non contengono testo tradotto.

## Classificazione della verità

```ts
export type TruthLabel =
  "fact" | "testimony" | "hypothesis" | "legend" | "disproven";

export type ContentSensitivityTag = "impliedAnimalDeath";

export interface SourceRef {
  readonly id: SourceId;
  readonly publisher: string;
  readonly title: string;
  readonly url: string;
  readonly publishedAt?: string;
  readonly accessedAt: string;
}

export interface DossierCard {
  readonly id: DossierCardId;
  readonly label: TruthLabel;
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
  readonly sourceIds: readonly SourceId[];
  readonly refutationSourceIds?: readonly SourceId[];
  readonly fictionNoticeKey?: MessageKey;
  readonly verifiedAt: string;
}
```

Invarianti:

- `fact` richiede almeno una fonte autorevole.
- `testimony` richiede almeno una fonte che attribuisca chiaramente la testimonianza.
- `hypothesis` richiede una fonte che presenti l'interpretazione come ipotesi e un testo che dichiari ciò che manca per provarla.
- `legend` non richiede fonti ma richiede `fictionNoticeKey` e non può usare un testo che sembri una citazione storica autentica.
- `disproven` richiede almeno una fonte autorevole di confutazione in `refutationSourceIds`; non si applica a una semplice scelta narrativa.
- Una pista inventata scartata dal giocatore conserva il timbro `legend` e usa lo stato UI «PISTA SCARTATA IN QUESTA VERSIONE»; non diventa `disproven`.
- La UI mostra sempre etichetta e data di verifica.
- Una scheda non può cambiare etichetta senza aggiornare test e `SOURCES.md`.
- Nessuna carta collega reati o condotte illecite a soggetti reali senza una fonte primaria e una review legale.

## Grafo narrativo

```ts
export type StoryNode =
  | SceneNode
  | DialogueNode
  | ChoiceNode
  | DossierCardNode
  | SurpriseNode
  | LevelNode
  | ChapterEndNode
  | EndingNode;

interface BaseNode {
  readonly id: NodeId;
  readonly chapterId: ChapterId;
  readonly narrativeLayer: "legend";
  readonly sensitivityTags?: readonly ContentSensitivityTag[];
  readonly when?: readonly Condition[];
}

interface LinearNode extends BaseNode {
  readonly next: NodeId;
}

export interface SceneNode extends BaseNode {
  readonly type: "scene";
  readonly backgroundAssetId: AssetId;
  readonly objectiveKey: MessageKey;
  readonly hotspots: readonly Hotspot[];
  readonly noSurprise?: boolean;
}

export interface DialogueNode extends LinearNode {
  readonly type: "dialogue";
  readonly lines: readonly DialogueLine[];
}

export interface ChoiceNode extends BaseNode {
  readonly type: "choice";
  /** Titolo proprio, come per i livelli (ADR-030/040); default condiviso se assente. */
  readonly headingKey?: MessageKey;
  readonly promptKey: MessageKey;
  readonly options: readonly ChoiceOption[];
}

export interface DossierCardNode extends LinearNode {
  readonly type: "dossier-card";
  readonly dossierCardId: DossierCardId;
}

export interface SurpriseNode extends LinearNode {
  readonly type: "surprise";
  readonly surpriseId: SurpriseId;
  readonly hostSceneNodeId: NodeId;
  readonly assetId: AssetId;
  readonly messageKey?: MessageKey;
  readonly clueId?: ClueId;
}

export interface LevelNode extends BaseNode {
  readonly type: "level";
  readonly levelId: LevelId;
  readonly configId: LevelConfigId;
  /** Titolo e introduzione propri: ogni livello si presenta (ADR-030). */
  readonly headingKey: MessageKey;
  readonly introKey: MessageKey;
  /** «Dove eravamo»: il riassunto mostrato nel briefing (ADR-034). */
  readonly recapKey: MessageKey;
  readonly completedNodeId: NodeId;
  readonly skippedNodeId: NodeId;
}

export interface ChapterEndNode extends BaseNode {
  readonly type: "chapter-end";
}

export interface EndingNode extends BaseNode {
  readonly type: "ending";
  readonly outcomeId: OutcomeId;
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
}
```

**Quali di questi tipi sono davvero in gioco.** Il pack pubblicato usa soltanto `dialogue`, `choice`, `level` ed `ending`. `scene`, `dossier-card`, `surprise` e `chapter-end` restano definiti e renderizzabili, ma nessun nodo li usa: `scene` e `surprise` sono i residui del prototipo point-and-click, `dossier-card` è caduto con ADR-024 quando l'Archivio è passato a `docs/SOURCES.md`. Il renderer lo dichiara nel proprio `switch`. Sono cuciture, non funzioni: chi legge questo modello non deve dedurre che il gioco mostri schede o hotspot, perché oggi non lo fa.

## Misteri e indizi

I contratti esistono, i contenuti no: nel pack `core` `mysteries` e `theories` sono array vuoti, e l'origine del Varano resta dichiaratamente irrisolta. Sono la cucitura per un eventuale seguito, non una funzione che il gioco usa oggi.

Se un giorno venissero riempiti, la regola è: lo stato di un mistero è derivato dagli indizi scoperti; non salvare un secondo campo `mysteryStatus` che potrebbe divergere.

```ts
export interface TheoryDefinition {
  readonly id: TheoryId;
  readonly mysteryId: MysteryId;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
}

export interface MysteryDefinition {
  readonly id: MysteryId;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly theoryIds: readonly TheoryId[];
}

export interface ClueDefinition {
  readonly id: ClueId;
  readonly mysteryId: MysteryId;
  readonly dossierCardId: DossierCardId;
  readonly supports: readonly TheoryId[];
  readonly contradicts: readonly TheoryId[];
}
```

- Nessun indizio sull'origine risolve automaticamente il mistero nel gioco base.
- Fuga e abbandono possono usare carte `hypothesis`; luoghi, responsabili e reperti inventati usano `legend`.
- Il complotto usa soltanto `legend` e soggetti interamente inventati.
- Uccidere il Varano non rivela un indizio esclusivo.

## Hotspot e dialogo

```ts
export interface Hotspot {
  readonly id: HotspotId;
  readonly labelKey: MessageKey;
  readonly rect: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  readonly targetNodeId: NodeId;
  readonly when?: readonly Condition[];
}

export interface DialogueLine {
  readonly speakerId: SpeakerId;
  readonly textKey: MessageKey;
  readonly portraitAssetId?: AssetId;
}
```

Il nome del parlante non si scrive nella battuta: la bolla lo ricava dallo `speakerId` con la chiave `<pack>.message.speaker.<id>`, validata in build (ADR-043).

Le coordinate hotspot sono percentuali da 0 a 100. `validateContent()` verifica che il rettangolo sia valido e che esista sempre un'etichetta testuale equivalente.

## Condizioni

Il linguaggio delle condizioni resta volutamente piccolo:

```ts
export type Condition =
  | { readonly type: "role-is"; readonly role: Role }
  | { readonly type: "story-scope-is"; readonly scope: StoryScope }
  | {
      readonly type: "flag-is";
      readonly flagId: FlagId;
      readonly value: boolean;
    }
  | {
      readonly type: "score-at-least";
      readonly score: ScoreName;
      readonly value: number;
    }
  | { readonly type: "condition-is"; readonly value: RunState["condition"] }
  | { readonly type: "fate-is"; readonly fate: VaranoFate }
  | { readonly type: "has-item"; readonly itemId: ItemId }
  | { readonly type: "has-seal"; readonly sealId: SealId }
  | { readonly type: "has-clue"; readonly clueId: ClueId }
  | {
      readonly type: "theory-selected";
      readonly mysteryId: MysteryId;
      readonly theoryId: TheoryId;
    }
  | { readonly type: "pack-complete"; readonly packId: StoryPackId }
  | {
      readonly type: "choice-is";
      readonly choiceId: ChoiceId;
      readonly optionId: OptionId;
    };
```

Non introdurre espressioni stringa, `eval`, callback nei dati o un mini linguaggio generico.

## Effetti dichiarativi

```ts
export type StoryEffect =
  | {
      readonly type: "adjust-score";
      readonly score: ScoreName;
      readonly delta: -1 | 1;
    }
  | { readonly type: "set-condition"; readonly value: RunState["condition"] }
  | {
      readonly type: "set-flag";
      readonly flagId: FlagId;
      readonly value: boolean;
    }
  | { readonly type: "add-item"; readonly itemId: ItemId }
  | { readonly type: "add-seal"; readonly sealId: SealId }
  | { readonly type: "reveal-dossier"; readonly dossierCardId: DossierCardId }
  | { readonly type: "add-clue"; readonly clueId: ClueId }
  | { readonly type: "complete-pack"; readonly packId: StoryPackId }
  | {
      readonly type: "select-theory";
      readonly mysteryId: MysteryId;
      readonly theoryId: TheoryId;
    }
  | { readonly type: "set-varano-fate"; readonly fate: VaranoFate }
  | {
      readonly type: "record-choice";
      readonly choiceId: ChoiceId;
      readonly optionId: OptionId;
    };

export interface ChoiceOption {
  readonly id: OptionId;
  readonly textKey: MessageKey;
  readonly sensitivityTags?: readonly ContentSensitivityTag[];
  readonly when?: readonly Condition[];
  readonly effects?: readonly StoryEffect[];
  readonly targetNodeId: NodeId;
  readonly confirmation?: ChoiceConfirmation;
}

export interface ChoiceConfirmation {
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
  readonly confirmKey: MessageKey;
  readonly cancelKey: MessageKey;
  readonly safeInitialFocus: "cancel";
}
```

I punteggi restano nell'intervallo 0–6. Il reducer applica clamp; il contenuto non gestisce direttamente numeri fuori intervallo.

Il validatore verifica che ogni ID stia nel namespace del proprio pack. La regola più forte — un pack opzionale non può toccare punteggi, condizione, destino o ID del core — è scritta ma non ancora codificata: varrà quando esisterà un secondo pack.

## Esiti

L'esito non è calcolato da un motore di regole a priorità: è **il finale in cui il giocatore arriva**. Ogni `EndingNode` dichiara il proprio `outcomeId`, e il confronto sulla torre porta a uno dei sei tramite opzioni con `when`. La scelta di non introdurre un `OutcomeRule` separato è deliberata: due sorgenti di verità sull'esito diverrebbero due sorgenti da tenere d'accordo.

La validazione deve dimostrare che:

- ognuno dei quattro ruoli — l'unico asse di setup rimasto (ADR-048) — raggiunge almeno un finale;
- `killedByHunter` è raggiungibile soltanto dal Cacciatore che ha scelto «Documenta la scena», con conferma e tag `impliedAnimalDeath` sull'opzione **e** sul finale;
- nessun altro ruolo può produrre un'azione letale diretta;
- il finale letale non aggiunge indizi esclusivi, premi o analytics;
- il finale con la corona richiede tutti e sei i sigilli, che i tre interludi dei colli assegnano;
- esiste un finale di fallback `core.outcome.open-mystery`, e la sua assenza fa fallire la build.

Sono **sei famiglie di finale** e il tetto è dichiarato (ADR-047): rescued, escaped, il Varano che sceglie, il Conte dei Sei Colli, l'abbattimento e il mistero aperto.

## Riutilizzo fra ruoli

Non duplicare un nodo soltanto per cambiare una frase. Usare:

- cataloghi di messaggi condizionati;
- `when` per hotspot realmente diversi;
- uno stesso nodo con obiettivo derivato dal ruolo;
- brevi nodi specifici soltanto quando cambia l'azione.

Indicatore di allarme: se un capitolo contiene quattro file quasi uguali per ruolo, fermarsi e semplificare il modello.

## Localizzazione

```ts
export type MessageCatalog = Readonly<Record<MessageKey, string>>;
```

- L'italiano è l'unica lingua e deve coprire tutte le chiavi referenziate; una chiave mancante fa fallire la build.
- Ogni capitolo porta il proprio `messages.ts`; `pack.ts` li unisce al catalogo di chrome.
- Niente HTML nei messaggi; rendering con `textContent`.
- Placeholder permessi solo tramite una funzione tipizzata e valori interni, mai input utente.

## Pacchetti di contenuto

I pacchetti sono moduli compilati e importati esplicitamente. Non sono plugin runtime.

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

export interface Chapter {
  readonly id: ChapterId;
  readonly titleKey: MessageKey;
  readonly entryNodeId: NodeId;
  readonly exitNodeId?: NodeId;
  readonly checkpointNodeId: NodeId;
}

export interface ChapterInsertion {
  readonly at: ExtensionPointId;
  readonly order: number;
}

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

`ChapterInsertion` esiste come cucitura per un eventuale pack opzionale: nel pack `core` è sempre assente. Ogni ID posseduto da un pack inizia con il suo Pack ID, e il validatore rifiuta un ID fuori namespace.

## Il grafo

```ts
export interface StoryGraph {
  readonly entryNodeId: NodeId;
  readonly nodes: readonly StoryNode[];
}
```

Il grafo è volutamente minimo: un ingresso e una lista di nodi. Non esiste un compositore multi-pack — `composeStoryPacks()` non è implementata, perché con un solo pack non ci sarebbe niente da comporre. Il collegamento fra capitoli lo fa `chainChapters()`, che sostituisce il segnaposto `nextChapterNodeId` di ogni capitolo con l'ingresso del successivo (ADR-034). È questo a rendere l'inserimento di un capitolo a metà campagna un'operazione che **non tocca i capitoli già scritti**.

Il grafo è anche la fonte della numerazione: `level-position.ts` conta i nodi di tipo `level` per produrre «Liv. N/10» nell'HUD e le righe della Collezione. Aggiungere un livello aggiorna i numeri da solo, senza costanti da tenere allineate.

## Validazione di build

`npm run validate` compila i contratti di tipo ed esegue `validateContent()` sul pack. La build fallisce per:

- ID duplicati;
- ID fuori dal namespace del pack;
- riferimento a un nodo, messaggio, asset o carta del Dossier inesistente;
- nodo irraggiungibile dall'ingresso del pack;
- pack senza capitolo d'ingresso;
- `entryNodeId`, `exitNodeId` o `checkpointNodeId` di un capitolo che punta a un nodo di un altro capitolo;
- hotspot fuori dai limiti della scena (rettangolo in percentuali 0–100);
- `SurpriseNode` con host che non è una scena o è una scena `noSurprise`;
- `LevelNode` la cui coppia `levelId`/`configId` non è nel registro dei livelli, o le cui chiavi di messaggio mancano;
- asset senza il messaggio di testo alternativo;
- `fact`/`testimony`/`hypothesis` senza almeno una fonte registrata;
- `legend` senza `fictionNoticeKey`;
- `disproven` senza almeno una fonte di confutazione in `refutationSourceIds`;
- URL di fonte non HTTPS o malformato, `accessedAt`/`publishedAt`/`verifiedAt` con data non valida;
- opzione letale senza conferma con focus su «annulla», non gated al Cacciatore, o che non punta a un finale taggato `impliedAnimalDeath`;
- nodo di scelta con un'opzione letale ma meno di due alternative non letali sempre visibili;
- assenza del finale di fallback `core.outcome.open-mystery`.

La validazione del grafo è codice di dominio e ha i suoi test in `tests/content/`.
