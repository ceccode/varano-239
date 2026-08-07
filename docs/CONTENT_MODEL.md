# Modello dei contenuti

## Obiettivo

La storia deve poter cambiare e crescere senza introdurre logica nei dati, callback arbitrarie o quattro copie degli stessi capitoli. Per l'MVP i contenuti sono moduli TypeScript verificati con `satisfies`; non servono CMS, database, JSON runtime o plugin caricati dalla rete.

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
core.node.prologue.field-intro
core.message.prologue.field-flash
core.asset.scene.field-night
core.source.comune.ordinanza-2026
core.dossier.photo-confirmed
core.outcome.varano-count
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

## Misteri e indizi

Lo stato di un mistero è derivato dagli indizi scoperti; non salvare un secondo campo `mysteryStatus` che potrebbe divergere.

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
  readonly dialectTextKey?: MessageKey;
  readonly portraitAssetId?: AssetId;
}
```

Le coordinate hotspot sono percentuali da 0 a 100. `validateContent()` verifica che il rettangolo sia valido e che esista sempre un'etichetta testuale equivalente.

## Condizioni

Il linguaggio delle condizioni resta volutamente piccolo:

```ts
export type Condition =
  | { readonly type: "role-is"; readonly role: Role }
  | { readonly type: "approach-is"; readonly approach: Approach }
  | { readonly type: "sensitivity-is"; readonly sensitivity: Sensitivity }
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

Il validatore applica anche il contesto del pacchetto. Un pack opzionale può scrivere soltanto ID col proprio namespace o flag condivisi presenti nella allowlist `campaign.*`; non può modificare punteggi, condizione, destino del Varano o ID posseduti dal core. In questo modo un dossier rimosso non lascia effetti invisibili sui finali principali.

## Esiti

Gli esiti sono deterministici e ordinati per priorità:

```ts
export interface OutcomeRule {
  readonly outcomeId: OutcomeId;
  readonly priority: number;
  readonly when: readonly Condition[];
}
```

La validazione deve dimostrare che:

- ogni combinazione cartesiana supportata `role × approach × sensitivity × storyScope` raggiunge almeno un finale: 48 combinazioni con i valori correnti;
- ogni scope narrativo supportato torna al core e non rompe una specifica combinazione di ruolo, approccio o sensibilità;
- `gentle` non può raggiungere `foundDead` o `killedByHunter`;
- `complete` può raggiungere `foundDead` senza azione del giocatore;
- `killedByHunter` è raggiungibile soltanto da `hunter + evidence + complete`, con conferma e tag `impliedAnimalDeath`;
- nessun altro ruolo o approccio può produrre un'azione letale diretta;
- il finale letale non aggiunge indizi esclusivi, premi o analytics;
- regole con la stessa priorità non si sovrappongono;
- esiste un fallback `core.outcome.open-mystery`.

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

export interface LocaleBundle {
  readonly locale: "it" | "it-BS";
  readonly messages: MessageCatalog;
}
```

- Il catalogo italiano deve coprire tutte le chiavi referenziate.
- Il catalogo bresciano può essere parziale.
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

Il core espone pochi punti d'innesto stabili:

```text
core.hook.after-red-zone
core.hook.after-superstar
core.hook.before-castle
core.hook.after-credits
```

Un pacchetto può usare più hook tramite capitoli distinti. Ogni capitolo opzionale ha un solo `exitNodeId`, che deve identificare un `chapter-end`; il compositore collega quell'uscita al capitolo seguente nello stesso hook oppure alla rotta core. Un capitolo core che termina direttamente in `EndingNode` può omettere `exitNodeId`. Gli ID sono namespaced, per esempio `origins.open-cage.scene.greenhouse`.

## Definizione e grafo composto

```ts
export interface CampaignDefinition {
  readonly id: "varano-239";
  readonly titleKey: MessageKey;
  readonly subtitleKey: MessageKey;
  readonly entryNodeId: NodeId;
  readonly contentVersion: number;
  readonly sharedFlagIds: readonly FlagId[];
  readonly coreTransitions: readonly CoreChapterTransition[];
  readonly outcomes: readonly OutcomeRule[];
  readonly packs: readonly StoryPack[];
}

export interface CoreChapterTransition {
  readonly exitNodeId: NodeId;
  readonly targetNodeId: NodeId;
  readonly extensionPointId?: ExtensionPointId;
}

export interface StoryGraph {
  readonly entryNodeId: NodeId;
  readonly chapters: Readonly<Record<ChapterId, Chapter>>;
  readonly nodes: Readonly<Record<NodeId, StoryNode>>;
  readonly chapterExitTargets: Readonly<Record<NodeId, NodeId>>;
  readonly dossierCards: Readonly<Record<DossierCardId, DossierCard>>;
  readonly clues: Readonly<Record<ClueId, ClueDefinition>>;
  readonly messages: MessageCatalog;
  readonly mysteries: Readonly<Record<MysteryId, MysteryDefinition>>;
  readonly theories: Readonly<Record<TheoryId, TheoryDefinition>>;
  readonly sources: Readonly<Record<SourceId, SourceRef>>;
  readonly outcomes: readonly OutcomeRule[];
}

export type StorySelection =
  | { readonly kind: "new-run"; readonly scope: StoryScope }
  | {
      readonly kind: "resume";
      readonly activePackVersions: Readonly<Record<StoryPackId, number>>;
    };

export interface StoryComposition {
  readonly graph: StoryGraph;
  readonly activePackVersions: Readonly<Record<StoryPackId, number>>;
  readonly unavailablePackIds: readonly StoryPackId[];
}
```

`composeStoryPacks(CampaignDefinition, StorySelection)` produce `StoryComposition`; gli autori non mantengono registri appiattiti duplicati. La definizione contiene tutti gli input necessari: ingresso, esiti, flag condivisi e transizioni core. Il titolo viene letto dalla definizione della campagna: non duplicarlo in componenti, metadati o test senza una funzione di configurazione condivisa.

`coreTransitions` assegna una destinazione a ogni `ChapterEndNode` core non terminale; una transizione diventa un punto d'innesto soltanto se dichiara `extensionPointId`. Il compositore copia prima tutte le rotte base, poi raggruppa i capitoli opzionali per `insertion.at`, li ordina per `order`, Pack ID e Chapter ID, e costruisce `chapterExitTargets`: uscita core → primo capitolo opzionale → eventuali capitoli successivi → `targetNodeId` originale. Se non esistono inserimenti, conserva la rotta base. `order` deve essere un intero non negativo; gli spareggi rendono la build deterministica, ma la CI segnala gli ordini duplicati nello stesso pack.

Per una nuova partita, `scope` seleziona i pack dalla build corrente. Per una ripresa, il compositore include soltanto gli ID presenti nello snapshot `activePackVersions`: un pack appena aggiunto non entra a metà della storia. Una differenza di versione richiede prima una migrazione; un pack opzionale non più registrato compare in `unavailablePackIds` e attiva il fallback del salvataggio. L'assenza o incompatibilità del pack core rende invece il salvataggio non ripristinabile e offre una nuova partita.

Ogni ID posseduto da un pack inizia con il suo Pack ID. I soli ID senza proprietario di pack sono i flag `campaign.*` elencati esplicitamente in `sharedFlagIds`; il validatore ricava condizioni ed effetti dai dati e rifiuta ogni altro accesso cross-pack.

## Validazione di build

`npm run validate` deve fallire per:

- ID duplicati o riferimenti inesistenti;
- teoria associata a un mistero inesistente o elencata da un mistero diverso;
- indizio che sostiene o contraddice una teoria di un altro mistero;
- nodi irraggiungibili dal prologo;
- cicli senza uscita;
- finali irraggiungibili;
- chiavi italiane o asset mancanti;
- hotspot senza etichetta o fuori area;
- `fact`/`testimony`/`hypothesis` senza fonti conformi;
- `legend` senza avviso di finzione o che renda riconoscibile un soggetto reale accusato;
- `disproven` senza fonte autorevole di confutazione;
- URL fonte non HTTPS;
- data `verifiedAt` non valida;
- `SurpriseNode` senza `hostSceneNodeId` valido o associato a una scena `noSurprise`;
- nodo giocabile privo di `narrativeLayer: "legend"` o schermata senza il banner persistente di ricostruzione;
- finale postumo raggiungibile in modalità `gentle`;
- `killedByHunter` raggiungibile fuori da `hunter + evidence + complete`;
- scelta letale senza conferma aggiuntiva, tag sensibile o alternative non letali;
- indizio disponibile soltanto dopo l'abbattimento;
- combinazioni di setup prive di esito;
- contenuti dialettali usati come informazione necessaria;
- ID di pacchetto senza namespace o collisioni con il core;
- dipendenza di pacchetto mancante o ciclica;
- hook contenuto nella `insertion` di capitolo inesistente o non pubblicato da una transizione core;
- `coreTransitions` che non assegna una e una sola rotta a ogni `ChapterEndNode` core non terminale;
- transizione core con uscita diversa da un `ChapterEndNode` core o destinazione core inesistente;
- `entryNodeId`, eventuale `exitNodeId` o `checkpointNodeId` estraneo al capitolo dichiarato;
- pacchetto senza via di uscita o che rende irraggiungibile un finale core;
- nodo, flag o messaggio core sovrascritto da un'espansione;
- lettura o scrittura cross-pack di un flag non presente in `sharedFlagIds`, anche se usa il prefisso `campaign.*`;
- effetto di pack opzionale che cambia punteggio, condizione, destino o un ID posseduto dal core;
- `ChapterBundle` core con `insertion`, oppure bundle opzionale senza `exitNodeId`, `insertion.at` e `insertion.order` validi;
- opzione che imposta `killedByHunter` o relativo `EndingNode` senza `sensitivityTags: ["impliedAnimalDeath"]`;
- collisione fra messaggi, indizi, carte, fonti o regole di esito durante la composizione;
- `EndingNode`, `ChapterEndNode` o `LevelNode` con uscite ulteriori rispetto al proprio contratto.

La validazione del grafo è codice di dominio e deve avere test unitari propri.
