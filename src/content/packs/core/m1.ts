import type { StoryGraph } from "../../../core/model.ts";
import type { StoryPack } from "../../story-pack.ts";

export const m1Messages = {
  "core.message.pack.title": "Caso principale",
  "core.message.pack.description": "La fotografia delle 2:39.",
  "core.message.chapter.prologue.title": "Atto 0 — Ore 2:39",
  "core.message.scene.field.alt":
    "Campo di mais inventato al chiaro di luna, con un canale d’irrigazione e tre tracce evidenziate.",
  "core.message.scene.objective": "Scegli un dettaglio da osservare.",
  "core.message.scene.objective.hunter":
    "Toni cerca un dettaglio che trasformi il racconto in una prova.",
  "core.message.scene.objective.guardian":
    "Marta cerca un passaggio che lasci la creatura lontana dai curiosi.",
  "core.message.scene.objective.mayor":
    "Cesare valuta cosa riferire alla sola delegazione della fittizia Borgocoda.",
  "core.message.scene.objective.varano":
    "Il Varano cerca acqua, ombra e una strada lontana dal flash.",
  "core.message.scene.approach.evidence":
    "Priorità scelta: documentare con prudenza.",
  "core.message.scene.approach.rescue":
    "Priorità scelta: ridurre i rischi e lasciare spazio.",
  "core.message.level.background.alt":
    "Panorama inventato di un campo notturno con mais, balle di fieno, rogge e un canneto.",
  "core.message.level.player.alt": "Varano verde stilizzato visto di profilo.",
  "core.message.level.heading": "Livello 1 — I campi di Montichiari",
  "core.message.level.intro":
    "Corri nei campi di Montichiari (versione Leggenda): raccogli i tre segnali luminosi e raggiungi il canneto. Se cadi riparti dall’ultima bandierina, senza vite, nemici o tempo limite.",
  "core.message.level.objective":
    "Recupera i tre indizi — la foto, l’impronta e il luccichio nella roggia — e sparisci nel canneto.",
  "core.message.level.controls":
    "Tastiera: frecce o A/D per correre, Spazio o W per saltare; tieni premuto per saltare più in alto. Su telefono usa i pulsanti sullo schermo.",
  "core.message.level.control.left": "Vai a sinistra",
  "core.message.level.control.right": "Vai a destra",
  "core.message.level.control.jump": "Salta",
  "core.message.level.skip": "Salta il livello",
  "core.message.level.continue": "Continua la storia",
  "core.message.level.assisted":
    "Il livello arcade non è richiesto: puoi proseguire subito con lo stesso esito narrativo.",
  "core.message.level.status.0": "Indizi recuperati: 0 di 3.",
  "core.message.level.status.1": "Indizi recuperati: 1 di 3.",
  "core.message.level.status.2": "Indizi recuperati: 2 di 3.",
  "core.message.level.status.3": "Indizi recuperati: 3 di 3! Corri al canneto.",
  "core.message.level.narrative.start":
    "Ore 2:39. Un flash ti rovina il pisolino: recupera gli indizi e fila al canneto prima che arrivino tutti!",
  "core.message.level.narrative.pickup.photo":
    "La foto sfocata: praticamente arte moderna. Primo indizio!",
  "core.message.level.narrative.pickup.trace":
    "Un’impronta fresca nel fango. Elegante, peraltro. Secondo indizio!",
  "core.message.level.narrative.pickup.water":
    "Qualcosa luccica nella roggia. Il flash caduto?! Terzo indizio!",
  "core.message.level.narrative.checkpoint":
    "Bandierina presa! Da qui non si torna indietro. Cioè sì, ma hai capito.",
  "core.message.level.narrative.respawn":
    "Ops. Il fosso era più fosso del previsto: si riparte dalla bandierina.",
  "core.message.level.narrative.finish":
    "Il canneto ti nasconde. Colpo di scena: nessuno ti ha visto. O forse sì?",
  "core.message.hotspot.photo": "Osserva la fotografia sfocata",
  "core.message.hotspot.trace": "Segui la traccia nel fango",
  "core.message.hotspot.water": "Controlla il canale d’irrigazione",
  "core.message.dialogue.ada":
    "Ada Cartella (taccuino in mano): «Allora: un rettile misterioso, una foto sfocata alle 2:39 e mezzo paese sveglio. Separiamo i fatti dalle chiacchiere… poi godiamoci le chiacchiere.»",
  "core.message.dialogue.hunter":
    "Toni Pista: «Tre indizi in una notte sola. O sono bravissimo, o qualcuno vuole farsi trovare…»",
  "core.message.dialogue.guardian":
    "Marta Ramarro: «Prima che arrivi il circo dei curiosi, mettiamolo al sicuro. Poi discutiamo di chi ha fatto la spia.»",
  "core.message.dialogue.mayor":
    "Cesare Cerimonia: «Borgocoda è pronta a gestire l’emergenza. Qualunque cosa sia. Soprattutto se ci sono telecamere.»",
  "core.message.dialogue.varano":
    "Il Varano (dal canneto): «Tutta questa scena per una foto? Nemmeno ero venuto bene. E comunque il Castello Bonoris merita un Conte con la coda.»",
  "core.message.dialogue.twist":
    "Ada abbassa la voce: «Curioso. Chi ha scattato la foto non ha mai chiamato i giornali. Allora chi l’ha mandata alle chat di paese alle 2:41?»",
  "core.message.surprise.tail":
    "Una coda attraversa con calma il bordo del campo e scompare fra il mais.",
  "core.message.surprise.tail.alt":
    "Coda verde stilizzata del Varano che attraversa la scena.",
  "core.message.choice.prompt": "Che cosa conta di più in questa versione?",
  "core.message.choice.document": "Annota la traccia e conserva il dubbio",
  "core.message.choice.protect": "Lascia libero il passaggio verso l’acqua",
  "core.message.ending.title": "Il mistero si allarga",
  "core.message.ending.body":
    "Fine del prologo, ma non del mistero: alle 2:41 la foto era già su tre chat di paese, e qualcuno — nel buio — ha raccolto qualcosa fra il mais. Chi? E perché proprio alle 2:39? Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
  "core.message.ui.clear-save": "Cancella progressi e preferenze locali",
  "core.message.ui.disclaimer":
    "Gioco 12+ di finzione: tutto ciò che giochi è LEGGENDA, una ricostruzione inventata. I fatti documentati e le loro fonti restano nel registro editoriale del progetto. Non cercare, inseguire o toccare animali selvatici o esotici nella realtà.",
  "core.message.ui.role-select.heading": "Chi sei, questa notte?",
  "core.message.ui.role-select.body":
    "Montichiari, ore 2:39. Una foto sfocata, un rettile leggendario e mezzo paese col naso fuori dalla finestra. Scegli il tuo ruolo: ognuno insegue un obiettivo diverso.",
  "core.message.ui.role-select.varano.title": "Il Varano",
  "core.message.ui.role-select.varano.goal":
    "Sfuggi a tutti, fai sparire gli indizi e — perché no — punta al Castello Bonoris.",
  "core.message.ui.role-select.hunter.title": "Cacciatore — Toni Pista",
  "core.message.ui.role-select.hunter.goal":
    "Segui le tracce e cattura la Leggenda. Da vivo, possibilmente.",
  "core.message.ui.role-select.guardian.title":
    "Custode animalista — Marta Ramarro",
  "core.message.ui.role-select.guardian.goal":
    "Trova il Varano prima dei curiosi e mettilo in salvo.",
  "core.message.ui.role-select.mayor.title": "Sindaco eroe — Cesare Cerimonia",
  "core.message.ui.role-select.mayor.goal":
    "Gestisci il caso del secolo senza perdere la faccia (né la fascia).",
  "core.message.ui.score.last": "Punteggio",
  "core.message.ui.score.best": "Record personale",
  "core.message.ui.score.share": "Condividi il punteggio",
  "core.message.ui.score.shared": "Punteggio copiato: incollalo dove vuoi!",
  "core.message.ui.menu.open": "Menù",
  "core.message.ui.menu.heading": "Menù",
  "core.message.ui.menu.close": "Torna al gioco",
  "core.message.ui.menu.settings": "Impostazioni",
  "core.message.ui.menu.credits": "Credits",
  "core.message.ui.menu.privacy": "Privacy",
  "core.message.ui.menu.terms": "Termini e condizioni",
  "core.message.ui.credits.body":
    "VARANO 2:39 è un gioco gratuito e open source. Codice, testi, pixel art e musica chiptune sono originali e distribuiti con licenza MIT. Tutti i personaggi umani sono inventati o compositi; il Varano è il protagonista.",
  "core.message.ui.credits.link": "Codice sorgente su GitHub (nuova scheda)",
  "core.message.ui.credits.sources-link":
    "Fonti e note editoriali (nuova scheda)",
  "core.message.ui.privacy.body":
    "Il gioco non raccoglie dati personali: nessun account, nessun cookie di profilazione, nessun invio di testo a server. I progressi e le preferenze restano salvati soltanto in questo browser e puoi cancellarli in ogni momento dal pulsante qui sotto.",
  "core.message.ui.privacy.link":
    "Leggi l’informativa completa su GitHub (nuova scheda)",
  "core.message.ui.terms.body":
    "Gioco gratuito consigliato a un pubblico 12+, fornito «così com’è» e senza garanzie. Le scene giocabili sono LEGGENDA: una ricostruzione inventata che non attribuisce fatti o dichiarazioni a persone reali. Il gioco non è una guida alla ricerca dell’animale: non avvicinare o inseguire animali selvatici o esotici. Codice e testi sono distribuiti con licenza MIT.",
  "core.message.ui.options.role.legend": "Personaggio",
  "core.message.ui.options.role.hunter": "Cacciatore — Toni Pista",
  "core.message.ui.options.role.guardian": "Custode animalista — Marta Ramarro",
  "core.message.ui.options.role.mayor": "Sindaco eroe — Cesare Cerimonia",
  "core.message.ui.options.role.varano": "Varano",
  "core.message.ui.options.audio.legend": "Audio",
  "core.message.ui.options.music": "Musica",
  "core.message.ui.options.effects": "Effetti sonori",
  "core.message.ui.scope-fallback":
    "Il contenuto scelto non è ancora disponibile: prosegui nel Caso principale.",
  "core.message.ui.legend-banner": "LEGGENDA — ricostruzione inventata",
  "core.message.ui.scene.heading": "Campo di mais — Ore 2:39",
  "core.message.ui.hotspot-list": "Azioni disponibili",
  "core.message.ui.dialogue.heading": "Una versione prende forma",
  "core.message.ui.continue": "Continua",
  "core.message.ui.surprise.heading": "Una sorpresa gentile",
  "core.message.ui.surprise.dismiss": "Lascia passare la coda",
  "core.message.ui.choice.heading": "La prima scelta",
  "core.message.ui.ending.restart": "Rigioca dall’inizio",
  "core.message.ui.unavailable-node":
    "Questa parte della storia non è disponibile. Torna al titolo e ricomincia.",
} as const;

const chapterId = "core.chapter.c00-first-sighting";
const levelNodeId = "core.node.prologue.campi";
const dialogueId = "core.node.prologue.dialogue";
const choiceId = "core.node.prologue.choice";
const endingId = "core.node.prologue.ending";

export const corePack = {
  id: "core",
  version: 2,
  kind: "core",
  titleKey: "core.message.pack.title",
  descriptionKey: "core.message.pack.description",
  estimatedMinutes: 5,
  requires: [],
  chapters: [
    {
      chapter: {
        id: chapterId,
        titleKey: "core.message.chapter.prologue.title",
        entryNodeId: levelNodeId,
        checkpointNodeId: levelNodeId,
      },
      nodes: [
        {
          id: levelNodeId,
          chapterId,
          type: "level",
          narrativeLayer: "legend",
          levelId: "core.level.campi-di-montichiari",
          configId: "core.level-config.campi-1",
          completedNodeId: dialogueId,
          skippedNodeId: dialogueId,
        },
        {
          id: dialogueId,
          chapterId,
          type: "dialogue",
          narrativeLayer: "legend",
          lines: [
            {
              speakerId: "core.speaker.ada",
              textKey: "core.message.dialogue.ada",
            },
            {
              speakerId: "core.speaker.toni",
              textKey: "core.message.dialogue.hunter",
              when: [{ type: "role-is", role: "hunter" }],
            },
            {
              speakerId: "core.speaker.marta",
              textKey: "core.message.dialogue.guardian",
              when: [{ type: "role-is", role: "guardian" }],
            },
            {
              speakerId: "core.speaker.cesare",
              textKey: "core.message.dialogue.mayor",
              when: [{ type: "role-is", role: "mayor" }],
            },
            {
              speakerId: "core.speaker.varano",
              textKey: "core.message.dialogue.varano",
              when: [{ type: "role-is", role: "varano" }],
            },
            {
              speakerId: "core.speaker.ada",
              textKey: "core.message.dialogue.twist",
            },
          ],
          next: choiceId,
        },
        {
          id: choiceId,
          chapterId,
          type: "choice",
          narrativeLayer: "legend",
          promptKey: "core.message.choice.prompt",
          options: [
            {
              id: "core.option.prologue.document",
              textKey: "core.message.choice.document",
              effects: [
                { type: "adjust-score", score: "evidence", delta: 1 },
                {
                  type: "record-choice",
                  choiceId: "core.choice.prologue.priority",
                  optionId: "core.option.prologue.document",
                },
              ],
              targetNodeId: endingId,
            },
            {
              id: "core.option.prologue.protect",
              textKey: "core.message.choice.protect",
              effects: [
                { type: "adjust-score", score: "care", delta: 1 },
                {
                  type: "record-choice",
                  choiceId: "core.choice.prologue.priority",
                  optionId: "core.option.prologue.protect",
                },
              ],
              targetNodeId: endingId,
            },
          ],
        },
        {
          id: endingId,
          chapterId,
          type: "ending",
          narrativeLayer: "legend",
          outcomeId: "core.outcome.open-mystery",
          titleKey: "core.message.ending.title",
          bodyKey: "core.message.ending.body",
        },
      ],
      // The playable prologue carries no dossier card (ADR-024): the editorial
      // source registry lives in docs/SOURCES.md and is linked from the menu.
      dossierCards: [],
      clues: [],
      messages: m1Messages,
      sources: [],
    },
  ],
  mysteries: [],
  theories: [],
} as const satisfies StoryPack;

const coreChapter = corePack.chapters[0];

export const coreStoryGraph: StoryGraph = {
  entryNodeId: coreChapter.chapter.entryNodeId,
  nodes: coreChapter.nodes,
};
