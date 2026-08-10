/**
 * Chrome and shared level copy: everything the interface says regardless of
 * which chapter is playing. Story text lives in its own chapter folder.
 */
export const uiMessages = {
  "core.message.pack.title": "Caso principale",
  "core.message.pack.description": "La fotografia delle 2:39.",

  // Alt text for the manifest's assets.
  "core.message.scene.field.alt":
    "Campo di mais inventato al chiaro di luna, con un canale d’irrigazione e tre tracce evidenziate.",
  "core.message.level.background.alt":
    "Panorama inventato di un campo notturno con mais, balle di fieno, rogge e un canneto.",
  "core.message.level.player.alt": "Varano verde stilizzato visto di profilo.",
  "core.message.surprise.tail.alt":
    "Coda verde stilizzata del Varano che attraversa la scena.",

  // Role and approach lines, read directly by the renderer.
  "core.message.scene.objective.hunter":
    "Toni cerca un dettaglio che trasformi il racconto in una prova.",
  "core.message.scene.objective.guardian":
    "Marta cerca un passaggio che lasci la creatura lontana dai curiosi.",
  "core.message.scene.objective.mayor":
    "Cesare valuta cosa riferire alla sola delegazione della fittizia Borgocoda.",
  "core.message.scene.objective.varano":
    "Il Varano cerca acqua, ombra e una strada lontana dal flash.",

  // Controls and level chrome: they describe the mechanism, not a level, so
  // they stay shared while headings and intros belong to the node (ADR-030).
  "core.message.level.control.left": "Vai a sinistra",
  "core.message.level.control.right": "Vai a destra",
  "core.message.level.control.jump": "Salta",
  "core.message.level.skip": "Salta il livello",
  "core.message.level.play": "Gioca",
  "core.message.level.continue": "Continua la storia",
  "core.message.level.assisted":
    "Il livello arcade non è richiesto: puoi proseguire subito con lo stesso esito narrativo.",
  // Lives and the KO card (ADR-041): arcade language, no death vocabulary —
  // the tone stays 12+ and the story never loses progress.
  "core.message.level.lives": "Vite: {lives}.",
  "core.message.level.gameover.title": "KO!",
  "core.message.level.gameover.body":
    "Vite finite: il Conte si ritira a leccarsi la coda. Si ricomincia il livello da capo, con le vite piene; la storia resta salva.",
  "core.message.level.gameover.retry": "Riprova il livello",
  // The level's position in the campaign, computed from the graph (ADR-045):
  // inserting a chapter renumbers everything by itself.
  "core.message.level.briefing.position": "Livello {index} di {total}",
  "core.message.level.status.position": "Liv. {index}/{total} ·",
  "core.message.level.briefing.recap": "Dove eravamo",
  "core.message.level.briefing.objective": "Che cosa devi fare",
  "core.message.level.briefing.power": "Il tuo superpotere",
  // The run's reputation, finally visible (ADR-043); seals and the Varano's
  // condition join it once they exist (ADR-045).
  "core.message.level.briefing.reputation":
    "Reputazione — Prove: {evidence} · Cura: {care} · Fiducia: {publicTrust}",
  "core.message.level.briefing.seals": "· Sigilli dei Sei Colli: {seals}/6",
  "core.message.level.briefing.condition.healthy": "· Il Varano sta bene.",
  "core.message.level.briefing.condition.weak": "· Il Varano è affaticato.",
  // The legend star (ADR-044): the ★ button's own reward, score only.
  "core.message.level.bonus":
    "STELLA DELLA LEGGENDA! Solo un superpotere poteva prenderla: +500.",

  // Speaker names for the dialogue bubbles (ADR-043).
  "core.message.speaker.ada": "Ada Cartella",
  "core.message.speaker.varano": "Il Varano",
  "core.message.speaker.toni": "Toni Pista",
  "core.message.speaker.marta": "Marta Ramarro",
  "core.message.speaker.cesare": "Cesare Cerimonia",
  "core.message.speaker.pina": "Pina Protocollo",

  // The role superpowers (ADR-031). The copy belongs to the role, not to a
  // level, so every level that grants them reuses these keys (ADR-036).
  "core.message.power.varano.label": "Superpotere: scatto di coda",
  "core.message.power.varano.narrative":
    "SCATTO! Nessun curioso afferra una coda che corre a quella velocità.",
  "core.message.power.hunter.label": "Superpotere: fiuto",
  "core.message.power.hunter.narrative":
    "FIUTO! Toni annusa l’aria: le prove si illuminano e nella fila dei curiosi si apre un varco.",
  "core.message.power.guardian.label": "Superpotere: richiamo",
  "core.message.power.guardian.narrative":
    "RICHIAMO! Marta fa il suo verso e tutti si girano dall’altra parte. Anche il drone si posa, mortificato.",
  "core.message.power.mayor.label": "Superpotere: drone di Borgocoda",
  "core.message.power.mayor.narrative":
    "DRONE DI BORGOCODA! Cesare si alza da terra e sorvola il problema. Metaforicamente lo fa da anni.",

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
  "core.message.ui.score.share": "Condividi il risultato",
  "core.message.ui.score.shared": "Condiviso!",
  "core.message.ui.score.downloaded":
    "Immagine salvata nei download: allegala dove vuoi!",
  "core.message.ui.score.copied": "Testo copiato: incollalo dove vuoi!",
  "core.message.ui.score.unavailable":
    "Questo browser non permette la condivisione: fai uno screenshot!",
  // The score is the whole run, not a single level (ADR-029).
  "core.message.ui.score.share-text":
    "Ho fatto {score} punti in VARANO 2:39 — {clues}/{totalClues} indizi in {seconds}s. Provaci: {url}",
  "core.message.ui.score.card-alt":
    "Cartolina del punteggio: il Varano nei campi di Montichiari con punteggio, indizi e tempo.",
  "core.message.ui.card.score": "PUNTI",
  "core.message.ui.card.clues": "INDIZI",
  "core.message.ui.card.time": "TEMPO",
  "core.message.ui.card.level": "LE NOTTI DI MONTICHIARI",
  "core.message.ui.card.record": "NUOVO RECORD!",
  // The completion meme card (ADR-049): the parting reward, built to travel.
  "core.message.ui.legend-stamp": "LEGGENDA",
  "core.message.ui.meme.card-alt":
    "La card del tuo finale: il Varano in pixel art, vestito del titolo che si è guadagnato.",
  "core.message.ui.meme.share": "Condividi la card del finale",
  "core.message.ui.meme.share-text":
    "Ho finito VARANO 2:39 — finale: «{title}». La leggenda di Montichiari, da giocare: {url}",
  // Text scale and contrast (ADR-053).
  "core.message.ui.options.text.legend": "Dimensione del testo",
  "core.message.ui.options.text.small": "Piccolo",
  "core.message.ui.options.text.medium": "Normale",
  "core.message.ui.options.text.large": "Grande",
  "core.message.ui.options.view.legend": "Visualizzazione",
  "core.message.ui.options.contrast": "Contrasto elevato",

  "core.message.ui.menu.open": "Menù",
  "core.message.ui.menu.heading": "Menù",
  // With a level alive behind the overlay, the menu is the pause (ADR-051).
  "core.message.ui.menu.paused": "In pausa",
  "core.message.ui.menu.restart-level": "Riprova il livello",
  "core.message.ui.menu.close": "Torna al gioco",
  "core.message.ui.menu.settings": "Impostazioni",
  "core.message.ui.menu.credits": "Credits",
  "core.message.ui.menu.privacy": "Privacy",
  "core.message.ui.menu.terms": "Termini e condizioni",
  "core.message.ui.credits.body":
    "VARANO 2:39 è un gioco gratuito. Codice, testi, pixel art e musica chiptune sono originali: il codice è aperto con licenza AGPL-3.0, mentre storia, grafica e musica usano CC BY-NC-SA 4.0 (puoi condividere e modificare citando l’autore, ma non per scopi commerciali). Tutti i personaggi umani sono inventati o compositi; il Varano è il protagonista.",
  "core.message.ui.credits.link": "Codice sorgente su GitHub (nuova scheda)",
  "core.message.ui.credits.sources-link":
    "Fonti e note editoriali (nuova scheda)",
  "core.message.ui.privacy.body":
    "Il gioco non raccoglie dati personali: nessun account, nessun cookie di profilazione, nessun invio di testo a server. I progressi e le preferenze restano salvati soltanto in questo browser e puoi cancellarli in ogni momento dal pulsante qui sotto.",
  "core.message.ui.privacy.link":
    "Leggi l’informativa privacy completa (nuova scheda)",
  "core.message.ui.terms.link":
    "Leggi i termini e condizioni completi (nuova scheda)",
  "core.message.ui.terms.body":
    "Gioco gratuito consigliato a un pubblico 12+, fornito «così com’è» e senza garanzie. Le scene giocabili sono LEGGENDA: una ricostruzione inventata che non attribuisce fatti o dichiarazioni a persone reali. Il gioco non è una guida alla ricerca dell’animale: non avvicinare o inseguire animali selvatici o esotici. Il codice è distribuito con licenza AGPL-3.0; storia, grafica e musica con CC BY-NC-SA 4.0, quindi non è consentito venderlo o usarlo per scopi commerciali. Il nome VARANO 2:39 e i suoi personaggi non sono concessi in licenza.",
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
