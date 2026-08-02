# Roadmap

## Obiettivo dell'MVP

Pubblicare su GitHub Pages un'avventura completa in italiano, mobile-first, giocabile da quattro prospettive, con finali alternativi, un Dossier Origini e un Archivio che separa cronaca e fiction.

Il caso principale dura circa 20–30 minuti; il Dossier Origini aggiunge circa 15–20 minuti. Il riuso di scene e contenuti deve rendere possibile una seconda prospettiva senza rileggere tutto: dialoghi già visti possono essere accelerati o saltati.

## Priorità

### P0 — necessario per il primo rilascio pubblico

- Disclaimer e sicurezza.
- Edizione unica 12+ (ADR-022), quattro ruoli, due approcci e profondità `core | origins | all-registered`.
- Prologo e cinque atti descritti nel game design.
- Dossier Origini con fuga, abbandono e complotto, senza soluzione canonica.
- Almeno sei famiglie di finale: salvataggio, fuga, conquista, prova postuma, abbattimento del Cacciatore e mistero aperto.
- L'abbattimento è limitato a `hunter + evidence`, con conferma aggiuntiva e fuori campo (ADR-013, ADR-022).
- Scene DOM-first con touch, mouse e tastiera.
- Una sola modalità di gioco; accessibilità garantita da «Salta il livello» e dal percorso assistito con `prefers-reduced-motion` (ADR-022).
- Archivio FATTO/TESTIMONIANZA/IPOTESI/LEGGENDA/SCONFESSATO con fonti e data di verifica.
- Story Pack compilati, saltabili e verificati, senza plugin runtime.
- Salvataggio locale versionato.
- Italiano completo.
- Pixel art originale sufficiente a tutte le scene.
- Popup sorpresa accessibili e disattivabili.
- Analytics limitati a visita e `game_start`, oppure `NoopAnalytics` se non configurati.
- Test, CI, privacy notice, licenze e GitHub Pages.

### P1 — desiderabile se non mette a rischio P0

- Battute bresciane revisionate e facoltative.
- Effetti sonori originali e musica breve, entrambi disattivabili.
- Indicatore di contenuti già letti fra le campagne.
- Condivisione del finale come immagine generata localmente, senza tracker o dati personali.
- Uno o due enigmi con variante specifica per ruolo.

### P2 — dopo il lancio

- Mini-giochi real-time facoltativi.
- Traduzioni oltre italiano e dialetto.
- Nuovi epiloghi, misteri e capitoli tramite Story Pack; nuovi livelli tramite `LevelNode` e adapter isolati.
- Modalità commento del regista sulle fonti.

Multiplayer, account, classifica, geolocalizzazione e caccia nel mondo reale restano fuori scope.

## Milestone M0 — Fondamenta

**Stato al 1 agosto 2026:** implementata e pubblicata nel commit iniziale su `main`; GitHub Actions è configurato come sorgente Pages e il primo deploy è riuscito.

### Deliverable

- Repository Vite + TypeScript strict.
- Struttura di cartelle definita in `ARCHITECTURE.md`.
- ESLint, Prettier, Vitest, Playwright e axe.
- Tutti i comandi del README.
- GitHub Actions per `npm run check`.
- Deploy preview e workflow GitHub Pages.
- App shell con titolo, errore di bootstrap accessibile e `NoopAnalytics`.
- Primi tipi di dominio senza logica prematura.
- Contratti minimi per dossier, Story Pack e punti d'innesto, senza implementare contenuti futuri.

### Acceptance criteria

- `npm run check` passa in locale e CI.
- Build pubblicabile sotto un `base` configurabile per GitHub Pages.
- Nessuna dipendenza runtime.
- Nessuna richiesta di rete a parte i file del sito.
- La pagina è leggibile da 320 px e con sola tastiera.

## Milestone M1 — Vertical slice «Ore 2:39»

**Stato al 1 agosto 2026:** implementata localmente sul branch `codex/m1-vertical-slice`. Gli acceptance criteria automatici sono coperti, ma il playtest qualitativo del proprietario ha giudicato il loop poco arcade, poco giocabile e poco coinvolgente. La domanda di milestone non è superata e M2 resta sospesa durante M1R.

### Deliverable

- Titolo, disclaimer e setup completo.
- Una scena del campo con fondale temporaneo originale.
- Tre hotspot, un dialogo, una scelta e una carta FATTO.
- Varianti brevi per tutti e quattro i ruoli nello stesso grafo.
- Primo popup del Varano.
- Un finale temporaneo `core.outcome.open-mystery`.
- Salvataggio e ripresa.
- Archivio minimo con una fonte.

### Acceptance criteria

- Tutte le 16 combinazioni ruolo × approccio × sensibilità del caso `core` avviano la scena e raggiungono il finale temporaneo.
- I tre valori di profondità sono selezionabili; i pacchetti non ancora implementati degradano al `core` con un messaggio chiaro.
- Dopo disclaimer e setup, la campagna `gentle` non mostra testo, opzioni o finali sulla morte.
- Touch, tastiera e screen reader hanno azioni equivalenti.
- `prefers-reduced-motion` e Modalità Calma eliminano il popup animato.
- Stato e contenuto sono testati senza browser.
- Nessun codice di framework 2D.

### Domanda a cui deve rispondere

La scena point-and-click è divertente e leggibile su telefono? Se no, correggere il loop prima di produrre gli altri capitoli.

## Milestone M1R — Prototipo «Ore 2:39 arcade»

**Stato al 1 agosto 2026:** implementata localmente sul branch `codex/m1-vertical-slice`; resta da eseguire il nuovo playtest qualitativo del proprietario su telefono.

### Deliverable

- Un `LevelNode` laterale 320×180 con panorama originale a scorrimento.
- Movimento, salto, tre segnali da raccogliere e uscita nel canneto.
- Controlli tastiera e touch; nessun nemico, vita, timer o game over.
- «Salta la sfida» con lo stesso esito narrativo del completamento.
- Percorso immediato equivalente per Modalità Storia, Calma e movimento ridotto.
- Adapter isolato, registro compilato e fisica TypeScript pura, senza framework.
- Dialogo, Dossier, scelta, Archivio e finale M1 conservati nel DOM.

### Acceptance criteria

- In Modalità Standard il Varano si muove, salta, raccoglie tutti e tre i segnali e può raggiungere l'uscita con tastiera o touch.
- Completamento e salto conducono allo stesso nodo narrativo e tutte le 16 combinazioni core raggiungono il finale temporaneo.
- Il salvataggio registra il `LevelNode`; la ripresa ricomincia la breve sfida senza serializzare fisica, input o timer.
- Modalità Storia, Calma e `prefers-reduced-motion` non richiedono il loop real-time e conservano tutto il contenuto narrativo.
- Il livello non mostra morte, armi, danni, punteggi, premi esclusivi o inviti alla ricerca reale dell'animale.
- Controlli, salto e stato hanno nomi accessibili; il banner LEGGENDA resta persistente.
- La coppia livello/configurazione e le chiavi di testo sono validate in build.
- Nessun asset o elemento identificativo di Super Mario Bros viene copiato.
- `npm run check` passa senza dipendenze runtime.

### Domanda a cui deve rispondere

La corsa rende il prologo più arcade, giocabile e coinvolgente su telefono senza trasformare lettura e accessibilità in ostacoli? Se no, rivedere ancora il formato prima di M2.

**Esito del playtest (1 agosto 2026):** no. Il flusso resta macchinoso (cinque passaggi prima di giocare) e poco usabile da mobile. ADR-018 pivota il loop principale a platformer arcade; la milestone successiva è M1P.

## Milestone M1P — Platformer «Livello 1: I campi di Montichiari»

**Stato:** implementata. Sostituisce M1R come formato del loop principale (ADR-018). Dopo i playtest del proprietario (2 agosto 2026) la title screen è stata rimossa (ADR-021) e la revisione ADR-022 ha fissato l'edizione unica 12+ dal tono goliardico, i nomi reali dei luoghi (Montichiari, Castello Bonoris), il menù ridotto a Personaggio + Audio e la distribuzione come PWA portrait-first.

### Deliverable

- Onboarding a zero passaggi: al caricamento il gioco parte subito a schermo intero con il Varano come default (o riprende il salvataggio); narrativa contestuale durante il livello e overlay a scheda per dialogo, Dossier, scelta e finale; menù in-game con impostazioni (personaggio, audio), credits, privacy e termini (ADR-021, ADR-022).
- Layout giocabile anche in landscape (controlli in overlay sul canvas) e PWA installabile: manifest, icone originali generate e service worker offline (ADR-022).
- Selezione del ruolo al primo avvio con obiettivo dichiarato per personaggio, punteggio di livello con record personale locale e condivisione via Web Share/appunti, overlay narrativi nello stesso stile grafico del gioco e riscrittura del prologo con gancio per il Livello 2 (ADR-023).

### Verso M2

- Superpoteri per ruolo (posseduti o trovati nei livelli): Varano scatto di coda, Cacciatore fiuto, Custode richiamo, Sindaco drone (bozza ADR-023).
- Livello 2 con il seguito del colpo di scena («chi ha mandato la foto alle chat alle 2:41?»).
- Livello 1 platformer a scorrimento laterale su canvas: corsa, salto con gravità e coyote time, piattaforme, collezionabili (segnali), checkpoint morbidi e traguardo nel canneto.
- Controlli touch mobile-first (frecce + salto, pulsanti grandi) e tastiera; nessuna rotazione imposta.
- «Salta il livello» sempre disponibile con lo stesso esito narrativo.
- Musica chiptune e SFX generati con WebAudio (ADR-019), toggle separati, avvio solo dopo gesto utente.
- UI retrò curata: HUD, title screen, schermata di completamento; banner LEGGENDA persistente.
- Breve interludio narrativo dopo il livello con dialogo, scelta e finale temporaneo aperto; nessuna scheda del Dossier nel percorso giocabile (ADR-024).
- `netlify.toml` e pubblicazione su Netlify (ADR-020).

### Acceptance criteria

- Da title screen al gameplay in al massimo due tap.
- Il livello è completabile con tastiera o touch su viewport da 320 px; «Salta il livello» conduce allo stesso nodo narrativo.
- Nessun game over punitivo: cadute e ostacoli riportano al checkpoint senza perdere i segnali raccolti.
- Musica ed effetti disattivabili; il gioco resta completabile senza suono.
- `prefers-reduced-motion` e Modalità Calma offrono il percorso immediato senza loop real-time.
- Nessun asset o elemento identificativo copiato da Super Mario Bros o Sonic.
- `npm run check` passa; nessuna dipendenza runtime.
- Il sito è pubblicato su Netlify con base `/`.

### Domanda a cui deve rispondere

Il platformer è divertente, immediato e usabile su telefono? Se sì, M2 produce i livelli successivi con gli interludi narrativi; se no, iterare sul feel (fisica, controlli, feedback audio-visivo) prima di aggiungere contenuti.

## Milestone M2 — Cronaca giocabile

**Nota:** da ri-scopare dopo il playtest di M1P: gli atti diventano livelli platformer con interludi narrativi DOM; carte, punteggi e Archivio restano.

### Deliverable

- Atto 1 «La zona interdetta».
- Atto 2 «Tre identità».
- Atto 3 «Varano superstar».
- Carte per foto, ordinanza, droni, gabbie, specie incerta e pubblicazioni su canali internazionali o multilingue.
- Punteggi `evidence`, `care`, `publicTrust` e `condition` visibili in linguaggio semplice.
- Archivio consultabile dal menu.
- Prime migrazioni del salvataggio.

### Acceptance criteria

- Nessun fatto senza fonte.
- Le versioni contraddittorie sono affiancate come testimonianze.
- Almeno il 70% dei nodi è condiviso fra ruoli.
- Ogni scena dura 2–4 minuti in una prova moderata.
- Nessun percorso richiede riflessi o suono.

## Milestone M3 — Dossier Origini ed espandibilità

### Deliverable

- Composizione statica di Story Pack e validazione di namespace, dipendenze e punti d'innesto.
- Pack `origins` con «La gabbia aperta», «La cassa senza nome» e «La Società della Coda».
- Bacheca delle origini con indizi a favore e contro ogni teoria.
- Selezione `core | origins | all-registered`, durata stimata e salto degli archi opzionali.
- Checkpoint core e compatibilità del salvataggio quando un pack non è più presente.

### Acceptance criteria

- Fuga e abbandono restano ipotesi attribuite; il complotto è sempre LEGGENDA.
- Nessun soggetto reale è associato ad abbandono, possesso illecito o complotto.
- Ogni arco entra e torna al core senza modificare reducer, renderer, storage o analytics.
- Completare o saltare il pack lascia raggiungibili tutti i finali core.
- Nessun indizio sull'origine dipende dal destino o dall'uccisione del Varano.
- La rimozione del pack da un salvataggio torna a un checkpoint core valido.

## Milestone M4 — Leggenda e finali

### Deliverable

- Atto 4 con tre scene e sei sigilli.
- Atto 5 al Castello Bonoris.
- Regole di esito deterministiche.
- Salvataggio, fuga, conquista, prova postuma e mistero aperto.
- Abbattimento fuori campo disponibile soltanto al Cacciatore con approccio prova nella Storia completa.
- Epilogo specifico per ogni ruolo.
- Epilogo indipendente del Dossier Origini.
- Archivio finale e stato reale alla data verificata.

### Acceptance criteria

- La suite enumera e termina tutte le diramazioni supportate.
- Ogni ruolo raggiunge almeno due finali diversi.
- Ogni approccio può sorprendere rispetto al ruolo senza produrre dialoghi incoerenti.
- Il finale postumo è irraggiungibile in `gentle`, non grafico e senza gag.
- La scelta letale richiede un'azione aggiuntiva di conferma, parte con focus sull'annullamento e offre almeno due alternative non letali.
- L'abbattimento non assegna premio, trofeo, punti, analytics o indizi esclusivi.
- Il castello è chiaramente separato dalla zona reale degli avvistamenti.
- I Sei Colli e i relativi sigilli restano LEGGENDA; una scheda con nomi o associazioni territoriali reali richiede prima revisione locale e fonte primaria.

## Milestone M5 — Arte, suono e inclusività

### Deliverable

- Pixel art finale originale e registro asset completo.
- Animazioni CSS e popup rifiniti.
- Audio opzionale originale o con licenza compatibile.
- Testo grande, alto contrasto, Modalità Storia e Calma.
- Overlay bresciano soltanto dopo revisione locale.
- Playtest con i profili definiti in `FORMAT_SCOUTING.md`.

### Acceptance criteria

- Nessun placeholder in build di produzione.
- Nessun asset senza provenienza/licenza.
- Nessuna informazione dipende da audio, colore o dialetto.
- I problemi P0 emersi nei playtest sono chiusi o documentati come blocker.
- Budget di performance rispettati.

## Milestone M6 — Privacy e rilascio 1.0

### Deliverable

- Provider analytics approvato oppure analytics disabilitati.
- Informativa privacy con dati reali del titolare.
- CSP e test rete.
- README pubblico, CONTRIBUTING, changelog e screenshot originali.
- GitHub Pages da repository personale.
- Tag `v1.0.0` e release notes.

### Acceptance criteria

- Checklist di `QUALITY.md` completa.
- Dashboard conta visite e avvii senza proprietà extra.
- Il gioco resta completo con tracker bloccato.
- Tutti i link dell'Archivio sono verificati alla data di rilascio.
- Repository pubblico con licenza MIT e notice degli asset.

## Ordine delle issue per un agente autonomo

Creare issue piccole, ognuna completabile e verificabile senza iniziarne tre insieme:

1. Scaffold e comandi M0.
2. Tipi minimi di `GameState`, azioni e reducer.
3. Validatore di un grafo con tre nodi fittizi.
4. Renderer DOM della title screen.
5. Disclaimer e setup.
6. Scene renderer e hotspot.
7. Dialogo, scelta e carta fonte.
8. Persistenza locale e migrazioni.
9. Vertical slice completo e test E2E.
10. Review M1 prima di espandere contenuti.
11. Cronaca giocabile M2 e relativo Archivio.
12. Compositore Story Pack e Dossier Origini M3.
13. Castello, scelta morale e finali M4.

Non iniziare arte finale, audio, dialetto o analytics prima che M1 abbia superato il playtest.

## Decisioni ancora del proprietario

Non bloccano M0 o il primo prototipo:

- conferma definitiva dei nomi dei personaggi;
- scelta 320×180 o 384×216 dopo confronto su telefono;
- stile preciso della palette;
- account/endpoint GoatCounter o scelta alternativa;
- URL e nome del repository GitHub;
- identità del titolare da inserire nell'informativa;
- revisione locale di grafie, nomi e associazioni territoriali dei Sei Colli prima di pubblicare la relativa scheda;
- approvazione finale delle battute bresciane.
