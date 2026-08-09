# Registro delle decisioni

Le decisioni con stato **Accettata** guidano l'implementazione finché il proprietario non le sostituisce con una nuova voce. Non modificare retroattivamente una decisione: aggiungere una nuova ADR che la sostituisce.

## ADR-001 — Nome del progetto

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: titolo `VARANO 2:39`, sottotitolo `Il mistero dei Sei Colli`, repository `varano-239`.
- Perché: 2:39 è un dettaglio memorabile attribuito dalla stampa al racconto del sindaco, pur non comparendo nell'ordinanza; i Sei Colli legano il caso al territorio e al percorso leggendario verso il castello; il titolo non dipende da una specie non confermata.
- Alternative: `Il Conte dei Sei Colli`, più fiabesco ma meno legato alla cronaca; `Varano a Montichiari`, chiaro ma generico.
- Conseguenza: titolo e metadati devono provenire da una configurazione unica per consentire un cambio senza riscrivere il codice.

## ADR-002 — Formato point-and-click

- Stato: **Accettata per vertical slice e MVP**
- Data: 1 agosto 2026
- Decisione: avventura narrativa a scene con hotspot, dialoghi, carte fonte ed enigmi brevi.
- Perché: migliore equilibrio fra lettura, gioco, mobile, accessibilità e quantità di asset.
- Alternative: platform completo, top-down, visual novel pura, raccolta di mini-giochi.
- Conseguenza: nessun controllo virtuale continuo; eventuali sfide d'azione sono isolate, facoltative e saltabili.
- Riesame: dopo il playtest di M1.

## ADR-003 — TypeScript + Vite, nessun framework runtime

- Stato: **Accettata per vertical slice e MVP narrativo**
- Data: 1 agosto 2026
- Decisione: TypeScript vanilla, Vite e DOM; zero dipendenze runtime iniziali.
- Perché: lo stato narrativo e i controlli HTML sono semplici da testare e mantenere; un framework UI o 2D non risolve un problema presente nell'MVP.
- Alternative: React/Preact per UI; Phaser per l'intero gioco.
- Conseguenza: funzioni DOM piccole, composizione esplicita e CSS per sprite.
- Fonti: [guida Vite](https://vite.dev/guide/), [documentazione Phaser](https://docs.phaser.io/).

### Gate Phaser

Una nuova ADR può introdurre Phaser soltanto se:

1. esistono almeno due mini-giochi real-time approvati;
2. richiedono loop continuo, collisioni, tilemap o camera;
3. un prototipo misura un vantaggio netto rispetto a TypeScript locale;
4. il bundle è lazy-loaded;
5. il framework resta dietro `MiniGamePort`;
6. UI narrativa e accessibile restano nel DOM.

## ADR-004 — Dominio puro con reducer unico

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: una sola `GameState`, aggiornata da un reducer puro che restituisce stato ed effetti richiesti.
- Perché: rende transizioni, salvataggi e finali deterministici e verificabili senza browser.
- Alternative: stato distribuito nei componenti, event bus globale, ECS.
- Conseguenza: storage, audio, analytics, clock e casualità passano da porte/adattatori; nessuna mutazione globale.

## ADR-005 — Contenuti TypeScript dichiarativi

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: grafo e cataloghi come moduli TypeScript con `satisfies`, validati in build.
- Perché: l'MVP non richiede CMS o caricamento remoto; i tipi evitano riferimenti rotti e callback arbitrarie.
- Alternative: JSON runtime, CMS headless, logica scritta direttamente nei componenti.
- Conseguenza: chi scrive contenuti modifica dati tipizzati; l'italiano è catalogo completo e il bresciano overlay parziale.

## ADR-006 — Tre livelli di verità

- Stato: **Superata da ADR-014**
- Data: 1 agosto 2026
- Decisione: ogni scheda è `fact`, `testimony` o `legend`.
- Perché: le fonti concordano su alcuni atti ufficiali ma divergono su specie, dimensioni e comportamento; la fiction del castello deve essere inequivocabile.
- Alternative: un unico testo narrativo senza etichette.
- Conseguenza: FATTO e TESTIMONIANZA richiedono fonti; ogni finale inventato mostra LEGGENDA.

## ADR-007 — Ruolo, approccio e sensibilità indipendenti

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: il setup salva tre valori ortogonali:
  - `Role = hunter | guardian | mayor | varano`;
  - `Approach = evidence | rescue`;
  - `Sensitivity = gentle | complete`.
- Perché: il personaggio non deve imporre moralità o destino; un Sindaco può privilegiare il salvataggio e una Custode può cercare prove.
- Conseguenza: tutte le 16 combinazioni iniziali devono essere valide, ma almeno il 70% dei nodi resta condiviso.

## ADR-008 — Morte soltanto come possibilità editoriale

- Stato: **Superata da ADR-013**
- Data: 1 agosto 2026
- Decisione: `gentle` esclude ogni finale postumo; `complete` lo ammette fuori scena, non grafico e mai causato da violenza diretta del giocatore.
- Motivo originario: separare due sensibilità editoriali; i vincoli correnti sono ridefiniti da ADR-013.
- Conseguenza: la validazione dimostra l'irraggiungibilità del finale postumo in `gentle`; nessun popup o gag nella scena.

## ADR-009 — Analytics minimali tramite porta chiusa

- Stato: **Accettata nel modello; provider proposto**
- Data: 1 agosto 2026
- Decisione: soltanto `page_view` e `game_start`, senza payload. `NoopAnalytics` di default. GoatCounter hosted è la proposta per il lancio; l'adapter usa percorsi fissi e `no_session: true` soltanto per contare ogni nuova partita.
- Perché: risponde alle sole domande «quante visite?» e «quanti avvii?» senza analizzare il comportamento di gioco.
- Alternative: Plausible Cloud, Umami self-hosted, nessun analytics.
- Conseguenza: il proprietario deve approvare provider, endpoint e informativa prima di M6. DNT/GPC e toggle locale disattivano il tracker; pageview individuali e dimensioni opzionali restano disabilitate.
- Fonti: [privacy GoatCounter](https://www.goatcounter.com/help/privacy), [eventi GoatCounter](https://www.goatcounter.com/help/events), [API JavaScript GoatCounter](https://www.goatcounter.com/help/js).

## ADR-010 — GitHub Pages e nessun backend

- Stato: **Sostituita da ADR-020**
- Data: 1 agosto 2026
- Decisione: sito statico su GitHub Pages dal repository personale; salvataggio solo locale.
- Perché: distribuzione gratuita, trasparente e adatta a Vite; nessun requisito attuale giustifica un server.
- Alternative: Vercel/Cloudflare Pages; backend dedicato.
- Conseguenza: routing compatibile con sottocartella, `base` configurato, nessun segreto nel bundle.

## ADR-011 — Licenza e identità originali

- Stato: **Superata da ADR-027** per la parte sulla licenza; la regola sull'identità originale resta valida.
- Data: 1 agosto 2026
- Decisione: codice e documentazione originali MIT; asset originali o con licenza compatibile registrata; tutti gli umani inventati/compositi.
- Perché: progetto gratuito e riusabile senza dipendere da materiale giornalistico o franchise esistenti.
- Conseguenza: nessuna fotografia, meme, stemma, logo, sprite o musica copiati; nessuna somiglianza intenzionale con persone reali.

## ADR-012 — Qualità e accessibilità come gate

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: Vitest, Playwright, axe, validazione contenuti e test manuali sono parte della Definition of Done.
- Perché: quattro ruoli e contenuti ramificati richiedono protezione automatica; l'accessibilità non può essere aggiunta alla fine.
- Conseguenza: `npm run check` è il gate della CI; target WCAG 2.2 AA per i flussi essenziali.
- Fonti: [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro), [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## ADR-013 — Pubblico 12+ e scelta letale del Cacciatore

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: il target editoriale è 12+, senza equivalenza automatica con una classificazione PEGI ufficiale. `gentle` mantiene il Varano vivo e non mostra opzioni letali. `complete` ammette un ritrovamento postumo e, soltanto a `hunter + evidence`, l'abbattimento fuori campo nel confronto finale.
- Vincoli: la scelta richiede un'azione aggiuntiva di conferma con focus iniziale sull'annullamento; sono sempre visibili almeno due alternative non letali; niente mira, timer, gore, corpo, istruzioni d'arma, premio, trofeo, analytics o indizi esclusivi.
- Perché: conserva una scelta morale esplicita senza trasformare la storia in una simulazione di violenza o renderla attivabile per errore.
- Conseguenza: validatore e test dimostrano l'assenza di morte in `gentle` e l'irraggiungibilità dell'abbattimento per ogni altro ruolo, approccio o modalità.

## ADR-014 — Cinque livelli di verità

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: ogni scheda del dossier è `fact`, `testimony`, `hypothesis`, `legend` o `disproven`.
- Perché: il mistero dell'origine richiede di distinguere una dichiarazione riportata da un'interpretazione plausibile; le piste contraddette devono restare consultabili senza sembrare valide.
- Conseguenza: FATTO, TESTIMONIANZA e IPOTESI richiedono fonti conformi; LEGGENDA richiede un avviso di finzione; SCONFESSATO richiede una confutazione autorevole e non si applica a una pista inventata semplicemente scartata dal giocatore. La UI mostra sempre timbro e data di verifica.

## ADR-015 — Story Pack compilati e profondità del mistero

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: capitoli e misteri opzionali sono moduli TypeScript dichiarativi importati esplicitamente in `campaign.ts`. Il giocatore sceglie `core`, `origins` o `all-registered`; non esistono plugin runtime, discovery automatica o codice remoto.
- Perché: il gioco deve poter crescere con nuove piste e livelli senza modificare il reducer o introdurre un sistema di estensioni difficile da testare.
- Conseguenza: ogni Story Pack usa namespace, dipendenze e punti d'innesto versionati, può essere saltato, torna al core e supera una suite contrattuale. I salvataggi registrano versione dei pack e checkpoint core.

## ADR-016 — Scene giocabili sempre dichiarate come leggenda

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: l'intero grafo giocabile è una ricostruzione inventata e mostra un banner persistente **LEGGENDA**. Soltanto le schede del Dossier e l'Archivio usano FATTO, TESTIMONIANZA, IPOTESI o SCONFESSATO.
- Perché: personaggi compositi, dialoghi, azioni, armi, percorsi e finali non devono sembrare una ricostruzione documentaria delle ricerche reali.
- Conseguenza: il Sindaco Eroe governa il comune totalmente fittizio di Borgocoda e guida soltanto la propria delegazione in un'esercitazione intercomunale inventata nella «Montichiari della Leggenda»; non rappresenta il sindaco reale, non esercita autorità sulla Montichiari reale, non firma né emette l'ordinanza reale e non usa sue citazioni o tratti biografici. Il Cacciatore e il fucile sono LEGGENDA dalla prima apparizione. Atti e dichiarazioni di persone reali compaiono soltanto in schede attribuite e fonti esterne.

## ADR-017 — Revisione M1R con micro-livello arcade

- Stato: **Accettata per prototipo**
- Data: 1 agosto 2026
- Sostituisce: ADR-002 soltanto per l'esperimento M1R; la direzione definitiva dell'MVP resta da riesaminare.
- Decisione: sostituire l'apertura a tre hotspot di M1 con un unico micro-livello laterale 320×180. Il Varano usa movimento continuo e salto per raccogliere tre segnali e raggiungere un'uscita. Il livello è originale, facoltativo, saltabile e confinato dietro `MiniGamePort`; completamento e salto hanno lo stesso esito narrativo.
- Perché: il playtest del proprietario ha giudicato il loop M1 tecnicamente leggibile ma poco arcade, poco giocabile e poco coinvolgente. Un greybox real-time risponde alla domanda di formato prima di produrre M2.
- Vincoli: nessun nemico, morte, vita, timer, punteggio, premio esclusivo o game over; tastiera e touch; percorso immediato equivalente in Modalità Storia, Calma e movimento ridotto; UI narrativa e Dossier nel DOM; nessun asset, personaggio, livello, suono o identità copiato da Super Mario Bros.
- Conseguenza: nessun framework e nessuna dipendenza runtime vengono introdotti. M2 resta sospesa fino al playtest di M1R. Un framework potrà essere proposto soltanto dopo l'approvazione di almeno un secondo mini-gioco real-time e il rispetto del gate di ADR-003.

## ADR-018 — Pivot: platformer arcade come loop principale

- Stato: **Accettata**
- Data: 1 agosto 2026
- Sostituisce: ADR-002 e ADR-017 per il formato del loop principale.
- Decisione: il loop principale del gioco diventa un **platformer a scorrimento laterale** in stile classico (corsa, salto, raccolta, traguardo), retrò nell'estetica ma con UI e audio curati. Il rendering del livello usa **canvas 2D con motore TypeScript locale**, senza framework; menu, HUD accessibile, dialoghi, Dossier e Archivio restano nel DOM. L'onboarding è ridotto al minimo: schermata titolo → «Gioca» porta subito al primo livello con default sicuri (`varano + gentle`); il disclaimer è condensato nella title screen e le impostazioni sono raggiungibili ma non bloccanti.
- Perché: il playtest del proprietario su M1 e M1R ha giudicato il flusso troppo macchinoso (cinque passaggi prima di giocare) e poco usabile da mobile; il formato richiesto è un arcade giocabile immediatamente, paragonabile ai platformer classici, senza copiarne asset o identità.
- Vincoli invariati: pubblico 12+, banner LEGGENDA persistente, nessuna morte grafica, nessun game over punitivo (respawn morbido al checkpoint), ogni livello saltabile con esito narrativo equivalente, gioco completabile senza suono e senza riflessi rapidi tramite «Salta la sfida», nessun asset o elemento identificativo copiato da Super Mario Bros o Sonic.
- Conseguenza: la scena point-and-click di M1 viene ritirata dal percorso principale; la narrativa sopravvive come brevi interludi DOM fra i livelli. Il gate framework di ADR-003 resta in vigore: il motore è locale e il canvas resta confinato al livello, dietro il registro compilato.

## ADR-019 — Audio chiptune generato con WebAudio

- Stato: **Accettata**
- Data: 1 agosto 2026
- Decisione: musica ed effetti sonori sono chiptune originali generati a runtime con la Web Audio API, dietro la porta audio già prevista. Nessun file audio remoto, nessuna dipendenza runtime, nessuna libreria.
- Perché: il pivot arcade richiede audio dal primo livello; la sintesi locale evita asset da licenziare, mantiene il bundle leggero e resta disattivabile.
- Conseguenza: musica ed effetti hanno toggle separati, partono solo dopo un gesto dell'utente (policy autoplay), e nessuna informazione di gioco dipende dal suono.

## ADR-020 — Pubblicazione su Netlify

- Stato: **Accettata**
- Data: 1 agosto 2026
- Sostituisce: ADR-010 per la piattaforma di pubblicazione principale.
- Decisione: il sito statico viene pubblicato su **Netlify** con `netlify.toml` (build `npm run build`, publish `dist/`, base path `/`) all'indirizzo **app.varano239.it**. La landing page è su **varano239.it** (progetto separato). GitHub Pages è stato rimosso come mirror.
- Perché: richiesta esplicita del proprietario; Netlify offre deploy da CLI, anteprime e dominio dedicato senza sottocartella, semplificando il base path.
- Conseguenza: il base path di produzione predefinito diventa `/`; `VITE_BASE_PATH` resta disponibile per eventuali mirror in sottocartella. Nessun backend, nessun segreto nel bundle.

## ADR-021 — Gioco a schermo intero senza title screen

- Stato: **Accettata**
- Data: 2 agosto 2026
- Sostituisce: la title screen introdotta con ADR-018.
- Decisione: al caricamento il gioco parte **subito a schermo intero**: nessuna pagina iniziale, auto-avvio di una nuova partita (o ripresa automatica del salvataggio). La narrativa vive dentro il gioco: una barra narrativa contestuale durante il livello e overlay a scheda (dialogo, Dossier, scelta, finale) sopra lo sfondo di gioco. Un **menù in-game** (pulsante ☰) raccoglie impostazioni (personaggio, sensibilità, modalità, audio), Archivio della Cronaca, credits, informativa privacy, termini e condizioni e cancellazione progressi. Il disclaimer 12+ resta nel menù e nel `<noscript>`.
- Perché: playtest del proprietario sul flusso M1P: la pagina iniziale non piace e spezza l'esperienza mobile; il formato desiderato è gioco immediato con narrativa integrata.
- Vincoli invariati: banner LEGGENDA sempre visibile nell'HUD; «Salta il livello» raggiungibile senza riflessi; percorso assistito per Storia/Calma/movimento ridotto; `game_start` resta un evento senza payload, ora emesso all'avvio automatico della partita.
- Conseguenza: `index.html` diventa una shell minimale a viewport pieno con fallback `<noscript>` informativo; l'Archivio si consulta dal menù; la fase `title` diventa transitoria e non visibile.

## ADR-022 — Edizione unica 12+, nomi reali dei luoghi e PWA portrait-first

- Stato: **Accettata**
- Data: 2 agosto 2026
- Sostituisce: la scelta `gentle | complete` di ADR-007/ADR-013 come opzione del giocatore e la selezione delle modalità di gioco nel menù; aggiorna ADR-001/ADR-016 sulla nomenclatura dei luoghi.
- Decisione del proprietario:
  1. **Edizione unica 12+** con tono goliardico, scherzoso e con colpi di scena: nessuna scelta di sensibilità nel menù. Nel dominio `sensitivity` resta con valore fisso `complete`; i vincoli di ADR-013 sull'eventuale scelta letale (solo `hunter + evidence`, conferma aggiuntiva, fuori campo, niente gag) restano validi per i contenuti futuri.
  2. **Una sola modalità di gioco** (standard): niente selezione Storia/Calma nel menù. L'accessibilità resta garantita da «Salta il livello» e dal percorso assistito attivato da `prefers-reduced-motion`; il campo `playMode` resta nel dominio per usi futuri.
  3. **I luoghi reali restano reali**: Montichiari e il Castello Bonoris sono nominati come tali (il pubblico di riferimento è locale). Restano inventati i personaggi umani e il comune di Borgocoda del Sindaco Eroe (ADR-016). Il livello 1 diventa «I campi di Montichiari».
  4. **Archivio della Cronaca rimosso dal menù**: le carte FATTO con fonte restano nel flusso narrativo; un archivio consultabile potrà tornare con M2.
  5. **PWA portrait-first**: manifest, service worker e icone; l'uso previsto è prevalentemente mobile in verticale, ma il layout landscape resta giocabile con controlli in overlay.
- Conseguenza: menù ridotto a Personaggio + Audio, credits con link al repository; `GAME_DESIGN.md` e `NARRATIVE.md` andranno riallineati al tono e all'edizione unica durante la pianificazione di M2.

## ADR-023 — Obiettivi per ruolo, scelta iniziale, punteggio locale e testi in stile gioco

- Stato: **Accettata**
- Data: 2 agosto 2026
- Decisione del proprietario:
  1. **Ogni ruolo ha un obiettivo dichiarato**: il Varano vuole sfuggire a tutti e puntare al Castello Bonoris; il Cacciatore vuole catturare la Leggenda (l'eventuale esito letale resta vincolato ad ADR-013); la Custode vuole metterlo in salvo; il Sindaco vuole gestire il caso mediatico. I tre bagliori del Livello 1 sono **indizi** (foto, impronta, luccichio nella roggia) e ogni ruolo ha un motivo diverso per recuperarli.
  2. **Al primo avvio si sceglie il ruolo** in una schermata in stile gioco con l'obiettivo di ciascun personaggio; con un salvataggio attivo si riprende direttamente. Il personaggio resta cambiabile dal menù.
  3. **Superpoteri per ruolo** (posseduti o trovati nei livelli) entrano nel design di M2: bozza — Varano scatto di coda, Cacciatore fiuto che rivela indizi, Custode richiamo che calma, Sindaco drone di Borgocoda. Nessun potere è legato ad azioni letali.
  4. **Punteggio con classifica personale locale e condivisione**: punteggio di livello (indizi, tempo, cadute), record personale salvato solo nel browser, condivisione via Web Share API o copia negli appunti di un testo generato localmente. Nessun backend, nessuna classifica online, nessun punto assegnato da azioni letali (ADR-013).
  5. **Testi dentro la UI di gioco**: dialoghi e schede restano DOM accessibile (vincolo AGENTS) ma con lo stesso stile grafico del gioco (pannelli pixel, palette e font display), e la storia punta sull'«incredibile» con colpi di scena a fine capitolo.
- Conseguenza: la fase `title` mostra la selezione ruolo al primo avvio; il punteggio vive fuori da `GameState` (porta dedicata su `localStorage`); la riscrittura dei dialoghi del prologo introduce il gancio per il Livello 2.

## ADR-024 — Nessuna scheda Dossier nel percorso giocabile

- Stato: **Accettata**
- Data: 2 agosto 2026
- Modifica: ADR-014 e ADR-016 restano validi come regole editoriali, ma nessuna scheda del Dossier compare più nel gioco; completa la rimozione dell'Archivio decisa in ADR-022.
- Decisione: il prologo non mostra più la scheda FATTO. Il grafo passa dal livello al dialogo e poi direttamente alla scelta. Il registro editoriale delle fonti resta in `docs/SOURCES.md`, raggiungibile dal menù (sezione Credits) e dalla shell statica senza JavaScript.
- Perché: la scheda interrompeva il ritmo del gioco e non piaceva al proprietario; il banner LEGGENDA persistente e il disclaimer nel menù coprono già l'obbligo di non spacciare la finzione per cronaca.
- Vincoli confermati: nessun contenuto è classificato `fact` dentro il gioco, quindi non serve alcuna fonte in-game; nessun atto o dichiarazione di persone reali entra nei dialoghi (ADR-016); Montichiari e il Castello Bonoris restano nominati come luoghi reali senza attribuire loro fatti inventati.
- Conseguenza: `DossierCard`, `SourceRef`, il nodo `dossier-card`, l'effetto `reveal-dossier` e le relative validazioni restano nel contratto dei contenuti per un eventuale Archivio in M2, ma non hanno rendering: un nodo dossier in una build futura richiede di ripristinare la vista. Il pack `core` dichiara `dossierCards: []` e `sources: []`.

## ADR-025 — GoatCounter attivo solo sul sito pubblicato

- Stato: **Accettata**
- Data: 2 agosto 2026
- Attua: ADR-009, che aveva approvato il modello ma lasciato il provider «proposto».
- Decisione: il proprietario ha creato l'istanza `https://varano239.goatcounter.com`. L'adapter `GoatCounterAnalytics` implementa `AnalyticsPort` e invia soltanto i due eventi già approvati:
  - `page_view` → `count({ path: "/", title: "VARANO 2:39" })`, con percorso e titolo **fissi**;
  - `game_start` → `count({ path: "game_start", event: true, no_session: true })`, così ogni avvio esplicito è contato anche più volte nella stessa sessione.
- L'endpoint è configurato in `netlify.toml` (`VITE_GOATCOUNTER_ENDPOINT`): senza quella variabile l'app usa `NoopAnalytics`, quindi build locali, `npm run check` e i test end-to-end non fanno **nessuna** richiesta a terzi e il test «tutte le richieste sono same-origin» resta valido.
- `count.js` è caricato dinamicamente dall'adapter con `no_onload` e `no_events`, così non parte alcun pageview automatico né tracciamento dei click. La Content-Security-Policy è generata in `vite.config.ts` e apre `https://gc.zgo.at` e l'host GoatCounter **solo** quando l'endpoint è configurato.
- Privacy: DNT e Global Privacy Control disattivano l'adapter prima di caricare lo script. Il referrer è ridotto alla sola **origine** (`https://esempio.it`), mai URL completi, query o referrer interni. Non vengono inviati ruolo, scelte, punteggio, impostazioni, dimensioni schermo o identificatori.
- Conseguenza: un errore di rete, un blocco da estensione o uno script assente non interrompono mai il gioco; la coda di eventi viene semplicemente scartata.

## ADR-026 — Teaser del livello successivo e cartolina del punteggio

- Stato: **Accettata**
- Data: 2 agosto 2026
- Decisione:
  1. La schermata finale mostra un blocco **«Prossimo episodio»** con titolo, testo di suspance e l'invito a installare la PWA, così è chiaro che il Livello 2 arriverà e conviene restare.
  2. Il punteggio è condiviso come **immagine**: una cartolina quadrata 1080×1080 disegnata proceduralmente su canvas (cielo notturno, Varano, ruolo, punti, indizi, tempo, eventuale record e host del sito). L'anteprima è visibile nel finale con `role="img"` e testo alternativo.
  3. La condivisione degrada in ordine: Web Share con il file PNG → download dell'immagine → copia del testo negli appunti → messaggio che invita allo screenshot. Ogni esito ha un messaggio dedicato; una cancellazione volontaria non mostra nulla.
- Perché: la condivisione solo testuale non funzionava in modo affidabile (nessuna guardia su `navigator.share`/`clipboard`) e un'immagine è molto più condivisibile sui social locali.
- Vincoli: la cartolina è generata in locale, non contiene dati personali e non viene caricata su alcun server; il punteggio non premia azioni letali (ADR-013) e resta salvato solo nel browser.
- Conseguenza: `MiniGameRequest.onComplete` riporta un `LevelOutcome` (punti, indizi, tempo, respawn) invece del solo punteggio.

## ADR-027 — Doppia licenza: codice AGPL, contenuti non commerciali

- Stato: **Accettata**
- Data: 2 agosto 2026
- Sostituisce: ADR-011 per la parte sulla licenza.
- Contesto: il proprietario vuole un progetto aperto, vuole essere citato e non vuole che altri vendano il gioco o ne facciano un business. «Open source» nella definizione OSI **obbliga** però a consentire l'uso commerciale: le due cose non stanno insieme in una licenza sola.
- Decisione: separare programma e opera creativa.
  - **Codice** (motore, reducer, fisica, adapter, build, test): `GNU AGPL-3.0-only` in `LICENSE`. Resta software libero a tutti gli effetti e chi pubblica una versione modificata, anche solo come sito, deve pubblicarne i sorgenti.
  - **Contenuti** (storia, dialoghi, catalogo messaggi, pixel art, musica chiptune, level design, documentazione pubblica): `CC BY-NC-SA 4.0` in `LICENSE-CONTENT`, quindi attribuzione obbligatoria, condivisione con la stessa licenza e **nessun uso commerciale**.
  - **Nome, titolo e personaggi**: nessuna licenza concessa. Una versione derivata deve usare un nome proprio.
  - `LICENSING.md` è la mappa normativa e stabilisce che, nei file che contengono entrambe le cose, «come si comporta il programma» è codice mentre «cosa si vede, si legge e si ascolta» è contenuto.
- Perché: il gioco è inseparabile dalla propria storia, grafica e musica, quindi vincolare i contenuti a `NonCommercial` impedisce di vendere l'opera pur lasciando il motore riusabile e realmente aperto.
- Conseguenza: il titolare del copyright è **Francesco Falanga**; i testi di credits e termini nel gioco, il README e il registro asset dichiarano la doppia licenza. Le due licenze non sono combinabili in un'opera commerciale: chi vuole usare il gioco a fini commerciali deve chiedere un permesso esplicito.

## ADR-028 — Documenti di trama fuori dal repository pubblico

- Stato: **Accettata**
- Data: 2 agosto 2026
- Contesto: `STORY_TREATMENT.md`, `NARRATIVE.md`, `GAME_DESIGN.md` e la roadmap descrivono per intero la trama, i finali e le piste inventate sull'origine del Varano. Pubblicarli annulla la suspance che il gioco costruisce fra un livello e il successivo.
- Decisione: quei documenti vivono in `docs/private/`, ignorata da git, e vengono rimossi anche dallo storico dei commit. Restano pubblici i documenti tecnici, editoriali e legali: architettura, modello dei contenuti, espansioni, qualità, privacy, fonti, asset, scouting del formato e questo registro.
- Perché: la scelta è stata fatta quando il repository aveva un giorno di vita, zero fork e zero star, quindi la riscrittura della storia costava poco. `SOURCES.md` e `PRIVACY.md` restano pubblici perché il gioco li collega da credits e menù.
- Limite noto e accettato: i testi del livello già pubblicato sono comunque leggibili nel bundle JavaScript. La riservatezza protegge la trama **non ancora uscita**, non il contenuto già distribuito. Dopo un force-push GitHub può mantenere per un periodo gli oggetti non più referenziati raggiungibili via SHA.
- Conseguenza: `AGENTS.md` e `docs/README.md` indicano il percorso privato; i documenti privati non sono versionati, quindi vanno conservati a parte dal proprietario.

## ADR-029 — Superpotere corsa e capitolo 2

- Stato: **Accettata**
- Data: 2 agosto 2026
- Attua: il primo dei superpoteri previsti da ADR-023 e apre il secondo capitolo della campagna.
- Decisione sul superpotere: lo **scatto** si carica **tenendo premuta una direzione** a terra per `holdSeconds`; supera la velocità massima normale e sopravvive al salto, ma si azzera fermandosi, girandosi o cadendo.
  - Nessun quarto pulsante: su un telefono da 320 px lo spazio non c'è, e un potere che si attiva tenendo premuto funziona identico con tastiera e touch, senza tempi di reazione né combinazioni.
  - È una `sprint` **opzionale nella configurazione del livello**: il livello 1 resta senza scatto, quindi il suo bilanciamento e i suoi test non cambiano.
  - Ha un riscontro chiaro su tre canali: scie di velocità sul canvas, effetto sonoro dedicato e una riga narrativa. Chi gioca senza audio o senza colori se ne accorge comunque.
- Decisione sul capitolo: il pack `core` ha un secondo `ChapterBundle`, `core.chapter.c01-village-chats` («Atto I — Le chat di paese»). La scelta del prologo non porta più al finale ma al livello 2; dopo il livello 2 il dialogo rivela che chi ha spedito la foto alle 2:41 sapeva già dove fosse il Varano, e il finale aperto rilancia sul Castello Bonoris.
  - `coreStoryGraph` compone ora i nodi di **tutti** i capitoli del pack, non solo del primo.
  - Il punteggio mostrato nella cartolina è il **totale della partita**: ogni livello somma punti, indizi, tempo e cadute, e il record personale confronta i totali.
- Vincoli confermati: nessun nemico, vita, timer o game over; le cadute riportano alla bandierina; «Salta il livello» resta su ogni livello con lo stesso esito narrativo; il percorso assistito con `prefers-reduced-motion` salta entrambi i livelli.
- Verifica: i test di modello coprono carica, velocità, azzeramento e persistenza nel salto; due test di level design dimostrano che ogni fossato è superabile **solo** in scatto ma entro la sua portata e che c'è pista sufficiente per caricarlo; una simulazione completa prova che il livello 2 è finibile senza cadute.

## ADR-030 — Ogni livello porta le proprie chiavi di testo

- Stato: **Accettata**
- Data: 3 agosto 2026
- Contesto: `renderLevel()` leggeva `core.message.level.heading`, `.intro`, `.assisted` e `.continue` per **ogni** `LevelNode`. `core.message.level2.heading` e `core.message.level2.intro` esistevano nel catalogo ma non venivano mai letti, quindi nel percorso assistito (movimento ridotto, dove il livello arcade non parte) il Livello 2 si presentava come «Livello 1 — I campi di Montichiari». Un terzo livello avrebbe ereditato lo stesso difetto.
- Decisione: `LevelNode` dichiara `headingKey` e `introKey`. Il renderer non conosce più il testo di nessun livello: lo legge dal nodo. Restano condivise `core.message.level.assisted`, `.continue` e `.skip`, perché descrivono il **meccanismo** («puoi proseguire subito con lo stesso esito narrativo») e non il livello.
  - `nodeMessageKeys()` include le due chiavi, quindi una chiave mancante è un errore di build come per ogni altro testo di nodo.
  - Il testo di condivisione del punteggio, che era una stringa italiana scritta dentro `render-game.ts` e diceva «nel Livello 1», passa a `core.message.ui.score.share-text` con segnaposto. Il punteggio è il totale della partita (ADR-029), quindi non nomina alcun livello.
  - L'interpolazione vive nel resolver dei messaggi (`resolveItalianMessage(key, values?)` più `formatMessage`), non nel layer DOM: `platform` non acquisisce una dipendenza verso `content`, che la direzione delle dipendenze di `ARCHITECTURE.md` non prevede. Un segnaposto sconosciuto resta visibile, così un errore di catalogo si nota.
- Perché: la regola «tutto il testo visibile usa chiavi di messaggio» era rispettata nella forma ma non nella sostanza, perché il renderer decideva _quale_ chiave usare. Un livello è un contenuto e porta il proprio testo.
- Conseguenza: aggiungere un livello richiede due chiavi in più nel nodo e non tocca il renderer. Un test di contenuto dimostra che titoli e introduzioni dei livelli sono distinti fra loro, e un test end-to-end percorre il percorso assistito fino al Livello 2 verificando che mostri il proprio titolo.

## ADR-031 — Pulsante del superpotere tenuto premuto, dal Livello 3

- Stato: **Accettata**
- Data: 3 agosto 2026
- Sostituisce: **soltanto** la clausola «nessun quarto pulsante» di ADR-029. Il resto di ADR-029 resta valido, e per il Livello 2 resta valido integralmente: lì lo scatto si carica ancora tenendo premuta una direzione e non compare alcun pulsante nuovo.
- Contesto: ADR-023 prevede quattro superpoteri per ruolo, di cui solo lo scatto era implementato. Con tre soli input il completamento richiedeva gesti invisibili — «stai fermo N ms per annusare» — che nessuno scopre senza un tutorial e che non hanno alcun nome accessibile. ADR-029 aveva escluso un quarto pulsante per motivi di spazio: la misura sul CSS attuale mostra che a 320 px il contenitore lascia 296 px, e `62 + 8 + 62 + 12 + 56 + 8 + 88 = 296` tiene ogni bersaglio a 44 px o più. Lo spazio quindi c'è; il costo reale è che le due direzioni scendono da 82 a 62 px.
- Decisione: un quarto pulsante **★**, **tenuto premuto**, è l'attivazione unica di tutti e quattro i poteri, dal Livello 3 in avanti.
  - La regola sostanziale di ADR-029 resta rispettata alla lettera: si attiva tenendo premuto, funziona identico su tastiera e touch e non richiede tempi di reazione né combinazioni.
  - Tastiera: `Shift` (entrambi) e `K`. Su `Shift` non si chiama `preventDefault()`, così `Shift+Tab` continua a navigare a ritroso.
  - Il pulsante esiste soltanto dove il livello concede un potere, quindi il Livello 1 e il Livello 2 restano identici a vista e i loro test non cambiano.
  - Il nome accessibile è quello del potere del ruolo («Usa il fiuto», «Alza il drone»): un gesto temporale non avrebbe avuto alcun nome per uno screen reader.
- Perché un pulsante e non un gesto: la scopribilità e l'accessibilità valgono più del 25% di larghezza perso dalle direzioni. Un potere che parte perché ti sei fermato a leggere non è una scelta del giocatore, ed è l'opposto dell'intento di ADR-023.
- Modello: un solo meccanismo `power?: PowerConfig` opzionale nella configurazione del livello, come già `sprint?`. È una union discriminata su `sprint | scent | call | drone`, quindi i quattro poteri condividono carica, attivazione, riscontro e test invece di avere tre rilevatori di gesto diversi. `powerHeld` è opzionale in `PlatformerInput`, così nessun test esistente cambia.
- Riscontro su tre canali per ogni potere: canvas (scie per lo scatto, anello e indicatori per il fiuto, anello per il richiamo, rotore e barra del carburante per il drone), effetto sonoro dedicato (`power`, più `blocked` per l'urto) e riga narrativa propria. Il pulsante si illumina solo quando il potere è **ingaggiato**, non mentre carica.
- Conseguenza: `MiniGameRequest` acquisisce `role`, perché il gating per ruolo avviene nel registro; il modello puro continua a vedere un solo potere e resta testabile senza ruolo.

## ADR-032 — Livello 3 «Varano superstar», ostacoli non letali e poteri concessi dal livello

- Stato: **Accettata**
- Data: 3 agosto 2026
- Attua: i tre superpoteri di ADR-023 non ancora implementati e apre il terzo capitolo della campagna.
- Decisione sull'ambientazione: il Livello 3 è l'**Atto III del trattamento**, il circo mediatico fuori dalle mura del Castello Bonoris il giorno dell'apertura al pubblico. Non è il castello: l'Atto V resta il finale e verrà costruito dopo.
  - È l'unica ambientazione del trattamento che offre ostacoli **naturalmente** non letali — furgoni, treppiedi, cavi, curiosi, un drone da riprese — senza dover inventare danno o game over.
  - Prepara il finale: il poster che incorona il Varano «Conte dei Sei Colli» è la prima istruzione chiara che riceve, quindi il capitolo si chiude con il Varano che **decide** di salire.
  - I tre indizi sono il pass stampa, il microfono lasciato aperto e il poster con la corona: convergono sul mittente della foto delle 2:41, che è in prima fila davanti alle telecamere.
  - L'alternativa «Tre animali e nessuna certezza» (Atto II) è stata scartata per questo livello: è un puzzle di abbinamento e in un platformer diventerebbe un quiz travestito da livello. Resta disponibile per un interludio o per il pack `origins`.
  - Nessuna emittente, testata o troupe reale: i soggetti del circo mediatico sono inventati e non riconoscibili. Montichiari e il Castello Bonoris restano luoghi reali citati come tali (ADR-022); l'apertura al pubblico messa in scena è un evento inventato.
  - Un secondo manifesto è dichiaratamente generato da un computer, con sei dita e due code, ed è una battuta di una riga. **Non** stabilisce nulla sull'origine del Varano: l'ipotesi che una AI abbia generato l'animale cambierebbe la premessa del mistero e richiede una decisione separata del proprietario.
- Decisione sugli ostacoli non letali: tre tipi, nessuno dei quali infligge danno, sottrae vite o produce un game over. L'unico costo è il tempo, che il punteggio già pesa.
  - `onlooker` — ti respinge e ti azzera la carica; lo attraversa lo scatto, lo apre in modo permanente il fiuto, lo sposta temporaneamente il richiamo.
  - `drone` — blocco solido: ci sbatti e ti fermi. Nessun potere di velocità lo apre; lo posa il richiamo, lo si sorvola col drone o dalle piattaforme.
  - `cables` — zona d'attrito: dimezza la velocità e rende impossibile lo scatto. Non blocca mai, si aggira dai treppiedi. È il set piece in cui il Varano **non** è il più forte.
- Decisione sulla concessione dei poteri (modello **ibrido**): la configurazione del livello dichiara quali poteri concede e se sono legati al ruolo. Il Livello 2 continua a concedere lo scatto a **tutti** i ruoli, quindi il suo bilanciamento, i suoi test e ciò che è già pubblicato non cambiano. Il Livello 3 concede i quattro poteri gated per ruolo.
- Vincolo di progettazione, ed è il cuore di questa ADR: **il Livello 3 è finibile da ogni ruolo e anche senza usare alcun potere**. Ogni fossato sta entro i 117 px di portata di un salto normale e ogni ostacolo bloccante ha una piattaforma che lo scavalca. I poteri sono scorciatoie e carattere, non chiavi obbligatorie. Questo lo distingue dal Livello 2, dove due fossati sono superabili solo in scatto.
- Verifica: oltre ai test di meccanica per ogni potere, la suite dimostra che ogni fossato è entro la portata base, che ogni indizio è raggiungibile da un appoggio sottostante, che ogni ostacolo bloccante è coperto da una piattaforma, e completa il livello con **cinque simulazioni**: una per ciascuno dei quattro ruoli con il proprio potere e una che non tocca mai il pulsante, tutte senza cadute.
- Conseguenza: il finale aperto si sposta in coda al nuovo capitolo e il suo testo riflette l'apertura del castello già avvenuta; il teaser promuove il Castello Bonoris a Livello 4.

## ADR-033 — Fondali come dati, uno per livello

- Stato: **Accettata**
- Data: 4 agosto 2026
- Contesto: i tre livelli condividevano lo stesso fondale, quindi il gioco «sembrava tutto uguale». Il problema non era però soltanto estetico: il Livello 3 è il **giorno** dell'apertura al pubblico del Castello, ma il canvas disegnava cielo notturno, luna e stelle — gli stessi delle 2:39. Il fondale condiviso al Livello 3 contraddiceva la narrativa del Livello 3.
- Decisione: il parallasse già presente in `drawBackground()` (tre bande di cielo, stelle a 0,12×, luna a 0,05×, strato lontano a 0,3×, strato vicino a 0,6×) resta invariato come **meccanismo**; diventa dato il suo **contenuto**, con un `backdrop` obbligatorio per livello:
  - `sky`: le tre bande dall'alto all'orizzonte;
  - `night`: stelle e luna, oppure sole e nuvole;
  - `far`: `hills | rooftops | castle | none`;
  - `near`: `corn | hedges | crowd | none`.
- Vive in `PlatformerViewConfig` (presentazione) e **non** in `PlatformerConfig`: la fisica pura non deve sapere di colori.
- Assegnazione: Livello 1 notte con colline e mais, **con i valori identici a quelli pubblicati**; Livello 2 notte appena più chiara con tetti dalle finestre accese e siepi; Livello 3 **giorno**, con il Castello in lontananza e la folla in controluce.
- Perché il castello sullo strato lontano: mostra al giocatore dove sta andando, e il traguardo `walls` in primo piano chiude il percorso visivo.
- Aggiungo soltanto le varianti che servono adesso; quelle da interno arriveranno con il livello che le userà davvero.
- Verifica: un test blocca il fondale del Livello 1 contro le costanti pubblicate, uno vieta che due livelli abbiano lo stesso fondale, uno lega l'ora del giorno alla storia. Uno smoke test monta **ogni** livello registrato e ne disegna il fondale, così una variante mai esercitata non resta un crash in attesa del livello che la userà: proprio quel test ha rivelato che il canvas stub non implementava `stroke()` né `globalAlpha`, usati dall'anello del fiuto e del richiamo.
- Conseguenza: `registeredLevels` espone i livelli con la loro configurazione, così le invarianti si affermano su tutti i livelli invece che uno per uno. Il limite noto registrato in `ASSETS.md` sul fondale condiviso decade.

## ADR-034 — Contenuti per capitolo, concatenamento dichiarativo e scheda di briefing

- Stato: **Accettata**
- Data: 4 agosto 2026
- Contesto: il proprietario vuole arrivare ad almeno dieci livelli. Aggiungere il terzo ha mostrato dove il progetto non scalava: `m1.ts` teneva catalogo e capitoli in un solo file, e per attaccare il capitolo 2 ho dovuto **modificare il capitolo 1** e **spostare il finale**. Ripetuta otto volte, quella manovra tocca ogni volta contenuti già collaudati.
- Decisione, in quattro parti.
  1. **Un capitolo, una cartella.** `m1.ts` sparisce — era il nome di una milestone, non di un contenuto — e i contenuti prendono la forma che `ARCHITECTURE.md` ed `EXPANSIONS.md` già descrivevano: `chapters/cNN-slug/{chapter,messages}.ts`, più `ui-messages.ts` per il testo dell'interfaccia, che non appartiene ad alcun capitolo. Il catalogo italiano si compone dai `messages` dei bundle, che prima erano dati morti.
  2. **Concatenamento dichiarativo.** Un capitolo non nomina il proprio successore: punta al segnaposto `nextChapterNodeId`, e `chainChapters()` lo risolve nell'ingresso del capitolo seguente. Un segnaposto nell'ultimo capitolo è un errore di build, non un collegamento rotto.
  3. **Il finale è un capitolo suo**, sempre in coda. Aggiungere un livello è quindi una voce nell'array del pack: nessun capitolo esistente viene aperto e nulla deve spostare il finale.
  4. **Scheda di briefing.** Ogni livello si apre con «Dove eravamo», «Che cosa devi fare» e il superpotere del ruolo, con «Gioca» e «Salta il livello». `LevelNode` acquisisce `recapKey`.
- Sul briefing e ADR-021: la scheda **non** compare davanti al primo livello di una partita nuova, dove i zero passaggi prima di giocare restano la regola. La decisione vive nel controller e non tocca il reducer: è presentazione, non dominio. La scheda **unifica** inoltre il percorso assistito, che aveva una propria card separata; lì mostra «Continua la storia» al posto di «Gioca».
- `defineLevel()` raccoglie le costanti fisiche condivise — velocità, gravità, salto, coyote, dimensioni — e le etichette dei controlli. Un livello dichiara solo ciò che lo distingue, e un test verifica che tutti i livelli conservino il feel pubblicato.
- Migrazione: spostare il finale ha rinominato `core.node.superstar.ending` in `core.node.finale.open-mystery`. Rinominare un ID richiede una migrazione pura e testata (`EXPANSIONS.md`), quindi `decodeSave` rimappa i nodi rinominati invece di lasciare una partita salvata sulla schermata «questa parte non è disponibile».
- Difetto di layout trovato durante la verifica: `.app-root` aveva soltanto `min-block-size: 100dvh`, quindi una scheda lunga faceva crescere il documento e scorrere l'intera pagina invece di scorrere dentro di sé — su 320 px il pulsante «Gioca» finiva sotto la piega. Ora l'altezza è esatta e la barra delle azioni è sticky.
- Conseguenza: aggiungere un livello significa una cartella di capitolo, una voce nell'array, una configurazione con `defineLevel()` e una voce in `levelConfigs`. Nessun file già scritto viene modificato.

## ADR-035 — Il suolo si attraversa dall'alto, come una piattaforma

- Stato: **Accettata**
- Data: 4 agosto 2026
- Contesto: giocando il Livello 3 il proprietario ha notato che cadendo in un fossato il gioco proseguiva. Non era voluto. `landingPlatform()` richiedeva già di attraversare la superficie **dall'alto** (`previousBottom <= platform.y && nextBottom >= platform.y`), ma il suolo si accontentava di `proposedBottom >= groundTop`. Chi era già sceso sotto il livello del pavimento veniva quindi risucchiato sopra il segmento opposto appena lo sfiorava di lato.
- Portata del difetto: era presente **da sempre** e riguardava tutti i livelli. Ogni fossato sotto i ~100 px era attraversabile camminando, senza saltare: 50-65 px nel Livello 1, 90 e 95 px nel Livello 2, tutti e tre nel Livello 3. Restavano onesti soltanto i due fossati larghi del Livello 2 (140 e 150 px), gli unici in cui lo scatto era davvero necessario — ecco perché il difetto non era emerso prima.
- Decisione: il suolo usa la stessa regola delle piattaforme. Un fossato è un fossato: camminare oltre il bordo è una caduta, e la caduta riporta alla bandierina senza perdere gli indizi già raccolti, come previsto da ADR-018.
- Conseguenza sui livelli pubblicati: i fossati del Livello 1 e del Livello 2 ora richiedono un salto. È un aumento di difficoltà su contenuto già online, ed è l'unico modo di renderli coerenti con ciò che mostrano. «Salta il livello» resta su ogni livello e il percorso assistito non cambia.
- Verifica: cinque test scritti **prima** del fix lo riproducevano su tutti e tre i livelli. Restano come regressione, insieme a un'invariante nuova che vale per ogni livello presente e futuro: la finestra utile per saltare un fossato — dal primo istante in cui il salto arriva al bordo opposto fino all'ultimo che il coyote time concede — deve superare i 250 ms. Oggi va da 345 a 708 ms, quindi nessun salto chiede precisione al frame.
- Nota di metodo: la prima verifica nel browser dopo il fix falliva, e non per colpa del livello. Lo script di guida rilasciava il salto dopo 300 ms, il jump-cut riduceva l'arco da 117 a 108 px e il Varano atterrava tre pixel prima del bordo. Il livello resta finibile da ogni ruolo e anche senza usare alcun potere.

## ADR-036 — Livello 4 «Il parco del Castello»

- Stato: **Accettata**
- Data: 5 agosto 2026
- Attua: la prima metà dell'Atto V. Per decisione del proprietario il castello è diviso in due livelli: il 4 è il parco all'aperto, il 5 sarà l'interno con la salita alla torre.
- Decisione narrativa: il mittente della foto delle 2:41 viene **indiziato ma non svelato**. I tre indizi — il badge stampato a biglietteria chiusa, la porta di servizio aperta con la chiave, le squame sul bordo del fossato — dicono che è entrato prima dell'apertura e non da turista; il filo di Borgocoda (il numero del Livello 2, il timbro del Livello 3, ora una chiave) continua a stringersi. Il nome arriva nel Livello 5. Due prove più una traccia del Conte, così il Varano resta al centro (pilastro 1 del game design).
- Decisione sul fossato d'acqua: è una **variante di solo rendering** (`gapKind: "water"`). Cadere in acqua è la stessa caduta di ADR-035 — respawn alla bandierina, indizi salvi — disegnata bagnata e raccontata dalla riga narrativa («Splash nel fossato…»). Nessuna fisica nuova, quindi nessun bilanciamento nuovo da testare.
- Decisione sui poteri: **identici al Livello 3**, stessi valori, gated per ruolo. Il giocatore li ha appena imparati e il Livello 4 li consolida su geometrie nuove. La configurazione condivisa vive in `roleSuperpowers`, e un test verifica che il parco usi esattamente quell'oggetto.
  - Le otto chiavi di testo dei poteri sono state promosse da `core.message.level3.power.*` a `core.message.power.*` in `ui-messages.ts`: il testo appartiene al ruolo, non a un livello. È un rename di chiavi di messaggio, senza alcun impatto sui salvataggi.
- Vincoli confermati di ADR-032: ogni fossato entro la portata del salto senza potere, ogni ostacolo bloccante coperto da una rotta di piattaforme (statue, pergolati, il tetto del chiosco), livello finibile da ogni ruolo e anche senza mai toccare ★. Ostacoli: due gruppi di curiosi e un drone che vola basso; nel parco non ci sono cavi.
- Fondale: quarto look distinto — tardo pomeriggio dorato con il castello che ormai incombe e le siepi del parco in primo piano. Notte, notte, giorno, tramonto.
- Costo strutturale, ed è la prova che ADR-034 funziona: una cartella di capitolo (`c03-castle-park`), una voce nell'array del pack e una configurazione `defineLevel()`. **Nessun capitolo esistente è stato modificato**; il finale si è aggiornato da solo restando in coda.
- Verifica: suite dedicata con le invarianti del livello e cinque simulazioni (quattro ruoli più una senza potere, tutte senza cadute); il driver di simulazione è stato estratto in un helper condiviso con la suite del Livello 3. Nel browser reale: cinque percorsi completati, splash nel fossato con respawn corretto, briefing a 320 px senza overflow.

## ADR-037 — Il furgoncino dei gadget: il primo ostacolo mobile

- Stato: **Accettata**
- Data: 5 agosto 2026
- Contesto: giocato il Livello 4, il proprietario lo ha trovato piatto e ha proposto un veicolo con un varano gonfiabile da saltare, «e se non salta muore». La diagnosi è giusta — fino a qui ogni ostacolo sta fermo — ma la morte è esclusa dai vincoli non negoziabili (AGENTS.md, ADR-018: nessuna vita, nessun game over, respawn morbido). La punizione richiesta viene quindi resa con lo strumento già canonico: **il contatto è la caduta di ADR-035 in un altro costume**, ritorno alla bandierina con le prove in tasca.
- Decisione: un `PatrolCar` opzionale nella configurazione del livello (`cars?`, come `sprint?`, `power?`, `obstacles?`). Il furgoncino del merchandising fa la spola sull'ultimo tratto del parco, con un varano gonfiabile che dondola sul cruscotto.
  - **Movimento puro e deterministico**: la posizione è un'onda triangolare su `elapsedSeconds` (`carPositionAt`), senza clock né casualità, come impone AGENTS.md. Stesso istante, stessa posizione: testabile e riproducibile.
  - **Sempre saltabile**: il furgoncino è alto 20 px contro i 48,8 px di un salto normale, e un test tiene il margine sopra i 20 px. È un pericolo, mai un muro; nessun potere serve né aiuta a superarlo, quindi i quattro ruoli restano pari.
  - **Percorso senza riflessi**: la terrazza a 3100/y118 sta dentro il raggio di pattuglia e sopra il tetto del furgoncino — ci si può fermare lì e lasciarlo passare. Un test garantisce che un rifugio simile esista. «Salta il livello» resta comunque la via di ADR-018.
  - La pattuglia vive interamente su un segmento di terreno (mai nell'acqua), parte oltre il chiosco del drone e si ferma lontana dal traguardo, così nessun set piece si somma a un altro.
  - Riscontro: riga narrativa dedicata (`narrativeCarHitKey`, «Travolto dal furgoncino dei gadget: gonfiabile 1, Conte 0…»), effetto `respawn`, e il furgoncino disegnato con ruote che girano, polvere e il gonfiabile che dondola. Nessuna gag sul corpo, nessun danno mostrato: il tono resta 12+.
- Verifica: test di determinismo e confini della pattuglia, contatto → respawn con indizi salvi e `respawns + 1`, salto sopra il furgoncino senza contatto, rifugio esistente; le cinque simulazioni del livello ora saltano anche il furgoncino. Nel browser: investimento deliberato → narrativa dedicata e respawn alla bandierina, screenshot del mezzo in avvicinamento.
- Conseguenza: i livelli futuri possono usare `cars?` senza codice nuovo. Se il proprietario vorrà **davvero** morte e vite, è un cambio ai vincoli di base (ADR-018 e AGENTS.md) e richiede una decisione esplicita separata.

## ADR-038 — AIDA Metrics: contabilità dello sviluppo AI del repository

- Stato: **Accettata**
- Data: 5 agosto 2026
- Contesto: il proprietario vuole misurare quanto di questo repository è costruito dall'AI e come quel codice regge nel tempo, usando il proprio strumento [AIDA Metrics](https://github.com/ceccode/AIDA-Metrics) (`@aida-dev/cli`, MIT). Il primo test locale ha dato il risultato più istruttivo possibile: **copertura di attribuzione 0%** su 9 commit — il repository è interamente scritto con Claude Code, ma nessun commit lo dichiarava, e le euristiche leggono solo ciò che i messaggi ammettono.
- Compatibilità con i vincoli, verificata prima dell'adozione: è uno **strumento di sviluppo**, non una dipendenza runtime — `dependencies` resta `{}` (ADR-003) e il test di fondazione non cambia. Analizza la storia git in locale; non tocca il gioco, il bundle né i giocatori, quindi ADR-009/025 non sono interessate. L'unico comando che usa la rete (`fetch-prs`) è opt-in, richiede un token esplicito e **non** viene adottato.
- Decisione, in quattro parti:
  1. `@aida-dev/cli` **pinnata esatta** (0.15.0) nei `devDependencies`, con gli script `npm run aida` (collect 90d → analyze → report) e `npm run aida:hooks`; `aida-output/` in `.gitignore`.
  2. `.aida.json` con **`defaultMode: "agent"`**: dichiarazione del proprietario che i commit senza evidenza di questo repository sono lavoro d'agente. AIDA la tratta correttamente come _prior_, non come dato osservato, e non la conta nella copertura.
  3. **Da ora ogni commit fatto dall'agente porta il trailer `AI-Mode: agent`**, così la provenienza diventa `declared` e la copertura sale dai commit nuovi. L'hook `prepare-commit-msg` di AIDA (shell POSIX autonoma, non blocca mai un commit, si disinstalla pulito) è installato nel clone locale; ogni altro clone lo attiva con `npm run aida:hooks`.
  4. **Workflow CI** su push a `main`: checkout con storia completa, `aida collect --redact-authors` (identità sostituite da hash salato, come raccomandato in CI), report caricato come artifact per 30 giorni. Il workflow è **informativo e mai bloccante**: una metrica non è un gate.
- Perché: il progetto è un caso di studio naturale per AIDA — un gioco costruito quasi per intero in sessioni agentiche — e AIDA è il modo di renderlo misurabile invece che aneddotico. La persistenza per coorte (quanto sopravvive il codice d'agente prima di essere riscritto) diventerà interessante man mano che il repo invecchia.
- Limite dichiarato: l'hook è volontario e locale a ogni clone; il `defaultMode` è una dichiarazione retroattiva. La copertura _dichiarata_ comincia da questo commit.
- Conseguenza: le metriche si leggono con `npm run aida` in locale o dall'artifact `aida-report` in Actions. Nessun dato lascia la macchina o il runner CI.

## ADR-039 — Livello 5 «Dentro il Castello»: la salita, il fondale da interno e i depistaggi dell'AI

- Stato: **Accettata**
- Data: 7 agosto 2026
- Attua: la seconda metà dell'Atto V. Il capitolo `c04-castle-keep` chiude la salita cominciata nel parco (ADR-036): androne, scalone, sale allestite, corridoio e torre, fino al tetto.
- Decisione narrativa, confermata dal proprietario: **il mittente della foto delle 2:41 è Pina Protocollo**, segretaria dell'ufficio protocollo di Borgocoda, di turno al coordinamento dell'esercitazione alle 2:39 — prima a ricevere la foto, prima a girarla alle chat. Il filo dei tre livelli (un numero del suo ufficio, il suo timbro, una chiave che «apre come la mia») si chiude su di lei. Movente: fede nella Leggenda — il paese aveva bisogno di un Conte e il Conte di una strada, e lei le strade le apre di mestiere. I tre indizi sono **il registro delle chiavi** (sigla P.P.), **la cassaforte già aperta** con la prima bozza del comunicato di Cesare datata 3:05 (la gag della cassaforte del trattamento, già promessa dal teaser) e **il telefono dimenticato** con la chat delle 2:41 ancora aperta. Tutto Borgocoda, tutto inventato: ADR-016 impedisce di attribuire questi atti alla Montichiari reale, ed è il motivo per cui il filo era di Borgocoda fin dal livello 2.
- Decisione sul tema AI, nel perimetro fissato dal proprietario: Pina ha usato **strumenti generativi per confondere le tracce** — varani gonfiabili palesemente sbagliati (due code, una cucitura, un occhio finto), il manifesto a sei dita del livello 3 e il gonfiabile del furgoncino del livello 4 ne diventano retroattivamente i fratelli. È satira dell'AI che non azzecca il Varano vero e **non stabilisce nulla sull'origine dell'animale**: la quarta pista del Dossier Origini resta una decisione separata per il pack `origins`.
- Decisione sul fondale: è **l'unico livello senza cielo** (variante `indoor` di ADR-033): le tre bande diventano pietra, niente stelle né luna, `far: "arches"` e `near: "torches"`. Oltre `skyFromX` — lo stipite della porta del tetto, ancorato al mondo 1:1 — il cielo torna: **la notte delle 2:39 del giorno dopo**, con luna e stelle come nel livello 1. La storia si chiude sotto lo stesso cielo in cui era cominciata. Suolo e piattaforme hanno la variante `stone`; il traguardo è la **pietra al sole** (`finishKind: "sunstone"`).
- Decisione sugli ostacoli: nessuna fisica nuova. I costumi sono dati di sola presentazione (`obstacleLooks`, `carLooks`), come l'acqua di ADR-036: la saracinesca è il blocco solido del `drone`, i gonfiabili AI sono `onlooker`, i cavi dei proiettori sono `cables`, e il **robot di pattuglia** è il furgoncino di ADR-037 in un altro vestito — stessa onda triangolare, sempre saltabile (14 px contro i 48,8 del salto), con la finestra-rifugio dentro il raggio di pattuglia.
- Vincoli confermati: ogni tromba delle scale entro la portata del salto base, ogni ostacolo bloccante coperto da una rotta di piattaforme, poteri **identici** ai livelli 3-4 (`roleSuperpowers`), tre indizi, salta-livello con lo stesso esito. Cinque simulazioni senza cadute (quattro ruoli più una senza ★) lo dimostrano; il driver dei test ha imparato a leggere le pattuglie come un giocatore vero (aspettare all'imbocco, accodarsi, saltare frontalmente a metà corridoio).
- Conseguenza: ADR-034 regge alla quinta prova — una cartella di capitolo, una voce nell'array, nessun capitolo esistente toccato. `dataset.elapsed` si aggiunge a `dataset.playerX` come gancio di guida per i test.

## ADR-040 — Il confronto sulla torre: l'arco si chiude e ADR-013 va in scena

- Stato: **Accettata**
- Data: 7 agosto 2026
- Attua: ADR-013 (la scelta letale del Cacciatore) e il finale dell'Atto V; il capitolo finale smette di essere il segnaposto «mistero aperto».
- Decisione sulla struttura: il capitolo `c99-finale` — sempre ultimo, mai referenziato per nome (ADR-034) — apre ora sul **confronto sulla torre**: un nodo `choice` («un enigma di posizionamento e fiducia», mai un combattimento) le cui opzioni puntano a cinque `EndingNode` interni al capitolo stesso. Il capitolo 5 chiude sul proprio dialogo e punta a `nextChapterNodeId` come tutti.
- Le cinque famiglie di finale: **Il trasportino aperto** (`rescued`), **Coda libera** (`escaped`), **Il Conte provvisorio** (`varano-count`), **Una muta, forse** (l'esito aperto, che conserva l'id `core.node.finale.open-mystery`: nessuna migrazione dei salvataggi) e **La prova che pesa** (`killedByHunter`). «La prova postuma» (`foundDead`) resta fuori: richiede la meccanica `condition`, che oggi nessun contenuto muove, e merita la propria decisione.
- Decisione sul gate letale: `approach` non ha una UI (il flusso a zero passaggi di ADR-021 non la prevede), ma la scelta del prologo registra già la stessa domanda. **«Cerca una prova» è la scelta «Annota la traccia» del prologo**: l'opzione «Abbatti il Varano» richiede `role-is hunter` + `sensitivity-is complete` (fissa nell'edizione unica di ADR-022) + `choice-is core.choice.prologue.priority = document`. ADR-013 resta rispettata alla lettera: conferma aggiuntiva con il testo approvato del trattamento, focus iniziale su «Torna indietro», almeno due alternative non letali sempre visibili, atto fuori campo, niente gag nel confronto né nell'epilogo, nessun premio.
- Decisione sul dominio: la conferma non è solo presentazione. `OPTION_CHOSEN` acquisisce `confirmed?`: il reducer **rifiuta** un'opzione con `confirmation` senza il secondo atto esplicito, quindi nessun percorso — nemmeno sintetico — abbatte il Varano con un solo input. Il validatore impone in build le regole di QUALITY finora dormienti: conferma con focus sull'annullamento, gate a cacciatore+completa, epilogo marcato `impliedAnimalDeath`, almeno due alternative incondizionate.
- Conseguenza: `ChoiceNode` porta un proprio `headingKey` opzionale (ADR-030 esteso alle scelte); il teaser del finale promuove il Dossier Origini; le voci 2-4 della lista E2E di QUALITY (annullamento sicuro, conferma, ruoli esclusi) diventano test reali su tre viewport.

## ADR-041 — Vite e game over di livello

- Stato: **Accettata**
- Data: 7 agosto 2026
- Sostituisce: la clausola «nessuna vita, nessun game over» di ADR-018 e la premessa corrispondente di ADR-037, **su decisione esplicita del proprietario**: il protagonista può vincere o essere messo KO, per rendere il gioco più gioco. AGENTS.md è aggiornato di conseguenza.
- Decisione: **3 vite per tentativo, su ogni livello, anche quelli già pubblicati** (il precedente di contenuto già online più difficile è ADR-035). Sono letali soltanto **le cadute e i veicoli di pattuglia** (furgoncino, robot): curiosi, gonfiabili, cavi e droni restano ostacoli non letali e il ritmo dei set piece non cambia. Ogni caduta costa una vita e riporta alla bandierina come prima; all'ultima vita non c'è respawn: il tentativo finisce.
- Il game over è **di livello e di sessione**: una card «KO!» dentro la cornice arcade — lessico da sala giochi, nessun lessico di morte, nessuna rappresentazione grafica — con «Riprova il livello» (stato di sessione ricreato da zero: vite piene, indizi del livello azzerati, come la ripresa di ADR-018) e il consueto «Salta il livello» con lo stesso esito narrativo. **La storia non perde mai progressi**: capitoli completati, scelte e salvataggio restano intatti.
- Accessibilità invariata: «Salta il livello» e il percorso assistito con `prefers-reduced-motion` valgono come prima, quindi il gioco resta finibile senza riflessi rapidi; il vincolo di AGENTS.md è riformulato, non indebolito. Le vite sono leggibili su tre canali: cuori sul canvas, riga di stato testuale (`aria-live`) e `dataset.lives`.
- Modello: `lives?` in `PlatformerConfig` con il default condiviso `lives: 3` in `platformerDefaults`; senza limite quando omesso, così i test mirati del modello restano validi. `livesRemaining` e `gameOver` vivono nello stato puro; il reducer e il grafo narrativo non sanno nulla di vite.
- Verifica: test del modello (caduta e veicolo scalano una vita, ostacoli statici mai, ultimo respawn negato e stato terminale), test DOM della card (focus su «Riprova», retry che azzera, skip equivalente), E2E con le vite in stato, e nel browser reale un KO provocato con tre cadute e il retry che riparte pieno.
- Conseguenza: il punteggio continua a pesare i respawn; un KO non assegna né toglie punti di partita, semplicemente il livello ricomincia. Se in futuro si vorranno vite condivise sull'intera partita o continue limitati, è una nuova decisione.

## ADR-042 — Una musica per livello

- Stato: **Accettata**
- Data: 7 agosto 2026
- Contesto: cinque livelli con fondali distinti (ADR-033) suonavano tutti uguali — un solo loop chiptune di 4 battute in La minore a 108 BPM per l'intero gioco. L'analisi sulla monotonia del proprietario ha indicato la musica come la modifica dal miglior rapporto resa/costo.
- Decisione: le tracce diventano **dati** (`musicTracks` in `chiptune-audio.ts`): tempo, timbri degli oscillatori e pattern di 32 step per lead e basso. Cinque loop originali sintetizzati a runtime (ADR-019, zero file e zero dipendenze): `fields` è **il loop pubblicato, intoccato** (il livello 1 suona come ha sempre suonato); `chats` (Mi minore, 132 BPM, nervoso), `fanfare` (Do maggiore, 120), `sunset` (Re dorico, 96, caldo), `keep` (Re minore basso, 84, sotto le volte).
- La porta resta piccola: `startMusic(track?: string)` — il layer dei livelli passa un nome (`music?` nella configurazione del livello) e non importa tipi audio; un nome sconosciuto o assente degrada al loop originale.
- Verifica: un test afferma che ogni livello registrato dichiara una traccia distinta (con `fields` implicito sul livello 1); i test esistenti dell'adapter audio non cambiano.
- Conseguenza: un livello futuro aggiunge un pattern e un nome. Cambiare la musica a metà livello (es. sul tetto del livello 5) resta possibile ma è un'altra decisione.

## ADR-043 — Interludi vivi: dialoghi a battute, micro-scelte e reputazione visibile

- Stato: **Accettata**
- Data: 7 agosto 2026
- Contesto: fra il prologo e il confronto finale il giocatore non decideva mai nulla: due sole scelte nell'intera partita, e i dialoghi erano un muro di testo con un pulsante. I punteggi `evidence/care/publicTrust` esistevano nel dominio dal primo giorno ma non erano mai mostrati.
- Decisione, in tre parti:
  1. **Dialoghi a battute.** Ogni riga diventa una bolla con il nome del parlante (chiave derivata per convenzione: `<pack>.speaker.X` → `<pack>.message.speaker.X`, validata in build) e un ingresso scaglionato via CSS. Tutto il testo è nel DOM da subito: lettori di schermo e `prefers-reduced-motion` vedono la scena intera, l'animazione è solo presentazione.
  2. **Una micro-scelta per interludio** nei capitoli 1-3 (il numero sconosciuto, il microfono aperto, la porta di servizio): due opzioni, effetti sui punteggi e `record-choice`, stesso capitolo e stesso ritorno a `nextChapterNodeId`. Il capitolo 4 non ne ha: il suo sbocco è il confronto (ADR-040). Il giocatore decide qualcosa ogni due-tre minuti.
  3. **Reputazione visibile**: la scheda di briefing mostra «Prove · Cura · Fiducia» della partita, così le scelte hanno un riscontro leggibile.
- Vincoli: le scelte non bloccano mai il percorso (entrambe le opzioni proseguono); nessun dato nuovo raccolto; la satira resta sul mittente e sul paese, mai sul giocatore.
- Conseguenza: i walkthrough di test e gli E2E attraversano tre scelte in più; l'ADR-034 resta vera per i livelli (le scelte vivono nei capitoli esistenti come contenuto, non come struttura).

## ADR-044 — Livelli vivi: piattaforme mobili, indizio guadagnato, stella da potere e cameo

- Stato: **Accettata**
- Data: 7 agosto 2026
- Contesto: dentro il livello il ritmo era piatto — tutto fermo tranne i veicoli (ADR-037), indizi su mensole lungo la linea principale, superpoteri ignorabili per l'intera partita («salto tutto» era sempre ottimale).
- Decisione, in quattro parti:
  1. **Piattaforme mobili** (`movingPlatforms?`): la stessa onda triangolare pura di ADR-037 applicata a una piattaforma one-way, su un asse; chi ci sta sopra viene **trasportato** (il delta della piattaforma si somma alla base del giocatore, per step, deterministico). Debutti: la **zattera** sul terzo tratto del fossato del parco (asse x) e il **montacarichi** sulla seconda tromba delle scale del castello (asse y). Invariante confermata: ogni fossato resta saltabile da solo — i mover sono rotte sceniche, mai chiavi.
  2. **Indizio guadagnato**: in ogni livello uno dei tre indizi chiede una deviazione — la percia alta nei livelli 1 e 2, le squame spostate **dentro il raggio di pattuglia del furgoncino** nel 4; nei livelli 3 e 5 la collocazione lo era già. Con le vite (ADR-041) il rischio/ricompensa ha finalmente un prezzo. L'invariante «ogni indizio ha un appoggio sotto» è promossa a test su **tutti** i livelli registrati.
  3. **La stella della Leggenda** (`bonus?`): un raccoglibile facoltativo nei livelli con superpotere (3-5), preso **solo mentre il potere è ingaggiato** (`powerActive`), +500 punti e nessun altro effetto. È spettro finché il potere è spento, si accende quando è attivo: il pulsante ★ smette di essere decorativo e ogni ruolo ha il suo modo di arrivarci. Non è mai un indizio e non serve a finire il livello; la collocazione è a portata di piattaforma, così la sfida è «essere lì col potere acceso», non il pixel-perfect.
  4. **Il cameo del Varano** (`cameo?`): l'apparizione gentile prevista dal game design entra nei livelli — una per livello (coda dietro il covone, occhi nella siepe, coda dietro il poster, occhi nel fossato, occhi nella feritoia), deterministica, una sola volta, con la propria riga narrativa. Pura presentazione nell'adapter; con movimento ridotto il livello non gira affatto, quindi il vincolo sui popup resta rispettato.
- Verifica: determinismo e confini dei mover, atterraggio e trasporto (montacarichi giù, zattera avanti), stella presa solo col potere e una sola volta, cameo e traccia musicale distinti per livello, indizi con appoggio su tutti i livelli; verifica nel browser reale con zattera, montacarichi, stella raccolta e cameo fotografati.
- Conseguenza: `dataset.playerY` si aggiunge ai ganci di guida dei test. I livelli futuri hanno quattro strumenti nuovi senza codice nuovo; se un mover dovrà mai essere una chiave di percorso, quella è una decisione da prendere esplicitamente contro l'invariante di ADR-032.

## ADR-045 — La lunga notte: cinque livelli nuovi e la campagna a dieci

- Stato: **Accettata**
- Data: 8 agosto 2026
- Contesto: chiuso l'arco principale, il proprietario vuole gli atti mancanti del trattamento fino ai dieci livelli. La collocazione è decisa dalla continuità già pubblicata: il twist del livello 2 dice «domani il Castello apre» e il livello 3 è già fuori dalle mura, quindi i nuovi livelli vivono **fra le chat e Varano superstar** — la lunga notte di viaggio. Regge perché l'esercitazione era già attiva alle 2:39 (Pina era di turno al coordinamento, ADR-039): la zona interdetta esiste quella notte stessa. Nessun testo pubblicato viene ritoccato.
- Decisione sulla campagna: cinque capitoli nuovi inseriti **in mezzo** all'array del pack (il concatenamento di ADR-034 rilinka da solo; l'ordine narrativo è dell'array, i nomi delle cartelle sono di produzione):
  1. **c05 «La zona interdetta»** (Atto I) — rogge e strade poderali sigillate, gabbie con l'esca intatta, il drone delle ricerche, l'impronta che è di Toni.
  2. **c06 «Tre identità»** (Atto II) — il laboratorio delle versioni come **livello**, non come quiz (la domanda vive nell'interludio): i tre cartelli-specie, «IDENTIFICAZIONE CERTA» che perde «CERTA», il nastro trasportatore.
  3. **c07 «Acqua e impronte»** (Atto IV, sigilli Rotondo + Generale) — canneti, zattera, le sei nutrie del drone.
  4. **c08 «Il borgo delle versioni»** (Atto IV, San Giorgio + San Zeno) — lo stendibiancheria investigativo di Ada come fondale, la cesta su carrucola.
  5. **c09 «Il colle di San Pancrazio»** (Atto IV, Santa Margherita + San Pancrazio) — l'ultima salita all'alba, il profilo del castello, il livello «respiro».
- I cinque livelli sono **prima del debutto di ★**: niente poteri per ruolo e niente stella (il ★ resta una conquista del giorno di gloria); lo sprint di ADR-029 è disponibile come comfort e **ogni fossato sta nella portata del salto base**.
- Decisione sui **sigilli**: un livello non può concedere effetti al completamento, quindi i sei sigilli (`core.seal.rotondo`, `generale`, `san-giorgio`, `san-zeno`, `santa-margherita`, `san-pancrazio`) sono concessi **dagli interludi** dei tre colli — due per capitolo, da entrambe le opzioni: la scelta decide il come, mai il se. La reputazione del briefing li mostra («Sigilli dei Sei Colli: K/6»).
- Decisione sul **finale**: con tutti e sei i sigilli il confronto sulla torre mostra un'opzione in più — «Il trono dei Sei Colli è pronto: incoronalo» → finale nuovo **«Il Conte dei Sei Colli»** (`core.outcome.count-of-six-hills`, fate `escaped`). È puramente additivo: senza sigilli l'opzione non esiste, le cinque famiglie di ADR-040 restano identiche e i salvataggi già in corso non perdono nulla.
- Decisione sulla **condizione**: l'interludio di San Pancrazio attua la scelta canonica «traccia fresca o strada sicura» con `set-condition` (`weak`/`healthy`), mostrata in linguaggio semplice nella reputazione. È il seme meccanico per l'eventuale «Prova postuma», che resta una decisione separata.
- Infrastruttura: cinque tracce chiptune nuove (`redzone`, `lab`, `hills`, `versions` — un valzer in 3/4 da 24 step, lo scheduler gira sulla lunghezza del pattern —, `dawn`); varianti di fondale `near: reeds | laundry` e costumi ostacolo `nutria` e `cage` (solo presentazione, come ADR-039/044). I walkthrough di test derivano ora i passi da un'unica lista condivisa (`tests/helpers/interludes.ts`): aggiungere un capitolo è una voce lì, non trenta righe in tre file.
- Processo: **ogni livello viene validato dal proprietario giocandolo prima della propria PR** (anteprima locale o deploy preview Netlify da draft PR); il pack `origins` e la quarta pista AI arrivano dopo il decimo livello, con la loro ADR e il macchinario di composizione ancora da costruire.
- Conseguenza: il caso principale passa da ~12 a ~22 minuti; `estimatedMinutes` e `version` del pack si aggiornano a ogni capitolo consegnato.

## ADR-046 — L'arcade è il default: il percorso assistito diventa una scelta esplicita

- Stato: **Accettata**
- Data: 9 agosto 2026
- Contesto: sui telefoni Samsung provati dal proprietario «la parte arcade non parte mai». La causa non è un difetto di esecuzione: Chrome su Android dichiara `prefers-reduced-motion: reduce` quando è attivo «Rimuovi animazioni» **o, su molti dispositivi, il risparmio energetico** — e il gioco leggeva quel segnale una volta sola all'avvio, instradava ogni livello sulla scheda assistita («Continua la storia», nessun canvas) e **congelava il valore dentro il salvataggio**: anche spegnendo il risparmio energetico, il gioco restava assistito finché non si cancellavano i progressi. Un segnale di sistema che mezza platea ha acceso senza saperlo decideva al posto del giocatore, in silenzio e per sempre.
- Decisione del proprietario: **l'arcade è il default per tutti**. Il media query `prefers-reduced-motion` non instrada più il percorso assistito e il campo `reducedMotion` esce dalle impostazioni, dal salvataggio e dal bootstrap.
- Che cosa resta, e dove:
  1. **«Salta il livello» è la garanzia di accessibilità universale** (invariata da ADR-018): sempre visibile accanto al canvas, stesso esito narrativo, nessun riflesso richiesto. AGENTS.md è riformulato di conseguenza.
  2. **Il percorso assistito non muore**: resta dietro le modalità `story`/`calm` di `playMode` (dominio senza UI dall'ADR-022), con la sua card, il suo test e le sue chiavi di testo. Se un giorno servirà un interruttore, sarà una scelta visibile del giocatore, non un automatismo.
  3. **Le animazioni CSS continuano a rispettare `prefers-reduced-motion`** (bolle di dialogo, transizioni della shell): ridurre il movimento decorativo è giusto; nascondere il gioco no.
  4. I popup a sorpresa restano saltati nella sola modalità Calma.
- Compatibilità: i salvataggi esistenti che portano ancora la chiave `reducedMotion` decodificano senza migrazioni (il validatore controlla i campi elencati, la chiave estranea è ignorata). Un giocatore Samsung «bloccato» torna all'arcade al primo caricamento della versione nuova, senza perdere nulla.
- Modifica: supera il punto 2 di ADR-022 dove garantiva l'accessibilità anche tramite «percorso assistito attivato da `prefers-reduced-motion`», e le menzioni equivalenti in ADR-032/041/045. La verifica manuale n. 8 di QUALITY.md diventa «Modalità Calma senza popup animati; con `prefers-reduced-motion` l'arcade parte comunque».
- Verifica: test end-to-end nuovo — con `reducedMotion: reduce` emulato il canvas monta, il giocatore si muove e «Salta il livello» è visibile; test unit sul percorso assistito via `playMode: story` (la card con «Continua la storia» esiste ancora, dietro la scelta giusta); riproduzione su profilo Galaxy S9+ prima e dopo la rimozione.

## ADR-047 — Il gioco è concluso: sei famiglie di finale, e sei è il tetto

- Stato: **Accettata**
- Data: 9 agosto 2026
- Contesto: chiusa la campagna a dieci livelli, il finale `foundDead` («La prova postuma») era nei tipi dal primo giorno e la meccanica `condition` che l'avrebbe sbloccato è arrivata con San Pancrazio. Un prototipo del settimo finale è stato costruito e provato; alla prova, il proprietario ha giudicato i finali già abbastanza: «troppi finali sono dispersivi».
- Decisione del proprietario: **il gioco è concluso**. Sei famiglie di finale — quattro prese di posizione sempre disponibili, più due premi condizionati (la corona dei sei sigilli e l'epilogo del Cacciatore dietro tripla barriera) — e sei è il tetto. «La prova postuma» non si costruisce: il destino `foundDead` esce dai tipi e dal validatore del salvataggio, come gli assi morti di ADR-048.
- La meccanica `condition` resta com'è: colore narrativo nel briefing («Il Varano sta bene / è affaticato»), impostata dall'interludio di San Pancrazio, senza aprire o chiudere finali. La scelta «traccia fresca o strada sicura» pesa sulla storia raccontata, non sull'esito.
- Nuovi capitoli non sono in programma: se mai arriveranno, saranno un **sequel**, con la propria ADR — non un'estensione silenziosa di questo gioco.
- Verifica: il grafo conta esattamente sei nodi di finale; la corona e la scelta letale funzionano come prima; nessun contenuto pubblicato cambia.

## ADR-048 — Setup a due assi: via `approach` e `sensitivity`, resta `storyScope`

- Stato: **Accettata**
- Data: 9 agosto 2026
- Contesto: il proprietario teme che il gioco diventi immantenibile e difficile da testare. La misura dice altro: i percorsi condizionali reali sono tre (scelta letale, corona, prova postuma), ma il setup dichiarava quattro assi — e due erano morti. `approach` era fisso a `rescue` dal primo giorno e stampava la stessa riga a tutti i briefing; `sensitivity` era fissa a `complete` dall'edizione unica (ADR-022). Insieme gonfiavano la matrice nominale da 4 a 48 combinazioni che i test dovevano fingere di coprire.
- Decisione del proprietario, su raccomandazione: **nessun personaggio si tocca** (quattro ruoli, quattro obiettivi, quattro poteri, quattro battute per capitolo — è il contenuto che i giocatori vedono). Si rimuove l'impalcatura morta:
  1. **`approach` rimosso**: tipo, condizione `approach-is`, azione `APPROACH_SELECTED`, campo del setup, validatore del salvataggio e la riga sempre-uguale del briefing. L'obiettivo di ruolo — quello vero — resta.
  2. **`sensitivity` rimossa dal setup**: tipo, condizione `sensitivity-is`, azione. ADR-013 resta in vigore con i denti che contano: il validatore dei contenuti continua a pretendere per ogni opzione letale la conferma con fuoco su «Annulla», il gate al Cacciatore e due alternative non letali sempre visibili; cade solo la clausola `sensitivity-is complete`, che dall'ADR-022 era sempre vera. I tag `sensitivityTags` sui contenuti restano: descrivono il contenuto, non il giocatore.
  3. **`storyScope` resta**: è la cucitura per i livelli bonus e l'eventuale sequel (pack `origins`), e costa un campo.
- Compatibilità: i salvataggi esistenti portano le chiavi rimosse come proprietà estranee e decodificano senza migrazioni (il validatore controlla i campi che elenca, come già in ADR-046).
- Conseguenza: 48 combinazioni nominali → 4 reali; due tipi di condizione e due azioni in meno; il test «16 combinazioni» diventa «4 ruoli»; la matrice di test smette di crescere con i livelli. Emenda ADR-007 (i tre valori ortogonali si riducono al ruolo) e la formulazione di ADR-013/040 sul gate (`hunter` + scelta del prologo, senza clausola di edizione).

## ADR-049 — La card-meme del finale: il congedo del gioco, fatto per viaggiare

- Stato: **Accettata**
- Data: 9 agosto 2026
- Contesto: la schermata di finale prometteva un «PROSSIMO EPISODIO — Il Dossier Origini … arriva a breve» (ADR-026), scritto quando il Dossier era in roadmap. Con ADR-047 il gioco è concluso e la promessa è diventata falsa; il proprietario vuole inoltre un premio di completamento che spinga la condivisione («mi serve per la viralità del gioco»).
- Decisione del proprietario: al posto del teaser, una **card-meme del finale** — il Varano in pixel art vestito del titolo che si è guadagnato — condivisibile con la stessa macchina della cartolina del punteggio (Web Share → download → appunti, ADR-023/026):
  - «Il trasportino aperto» → il papillon (in carrozza, come un sovrano);
  - «Coda libera» → gli occhiali da sole;
  - «Il Conte provvisorio» → il monocolo (il meme canonico del borgo);
  - «Il Conte dei Sei Colli» → la corona;
  - «Una muta, forse» → nessun varano: due occhi nel buio e un punto interrogativo.
- **L'epilogo grave non ha meme**: sul finale dell'abbattimento la card non compare — la regola del tono (niente gag nelle scene gravi) vale più della viralità. Lì restano il testo e la cartolina del punteggio.
- La card porta **il timbro LEGGENDA sull'immagine stessa**: condivisa fuori contesto per costruzione, deve dichiarare da sola di essere finzione.
- A differenza della cartolina del punteggio (che richiede almeno un livello giocato), la card del finale compare **sempre**: anche una partita tutta «Salta il livello» si congeda con la sua card.
- Il teaser di ADR-026 e le sue chiavi sono rimossi. Il gioco non promette episodi: l'eventuale seguito è un sequel (ADR-047).
- Verifica: una card per ciascuna delle cinque famiglie non gravi, tutte visivamente distinte (test sul disegno); il timbro, il titolo in maiuscolo e il dominio presenti sull'immagine; il finale grave senza card; condivisione e fallback coperti dai test esistenti della cartolina.

## ADR-050 — Il menù e il livello smettono di combattersi

- Stato: **Accettata**
- Data: 9 agosto 2026
- Contesto: tre difetti distinti, stessa radice — il menù in sovrimpressione e il livello montato non si riconoscevano a vicenda. Tutti e tre colpivano il proprietario a ogni playtest.
  1. **Il menù faceva ricominciare il livello.** Ogni `dispatch` chiama `render()`, e `render()` apre con `activeLevel?.destroy()`: togliere la musica dal menù a metà livello ricostruiva l'albero e rimontava il livello dall'inizio, **in silenzio**, con la partita ancora in corso.
  2. **Il livello mangiava i tasti del menù.** L'handler della tastiera era attivo anche a livello in pausa e chiamava `preventDefault` su Spazio e frecce: i `<summary>` delle sezioni non si aprivano da tastiera e il menù non si scorreva. In più la pressione fatta durante la pausa restava in coda e alla ripresa partiva come un salto fantasma.
  3. **Il gioco sotto l'overlay restava raggiungibile.** `.menu-overlay` è opaco e a tutto schermo, ma Tab e i lettori di schermo entravano nei controlli coperti — il contrario di quanto QUALITY.md già richiedeva.
- Decisione, in quattro parti:
  1. **Un'eccezione stretta al «ogni dispatch ricostruisce il DOM»**: se l'azione è `SETTINGS_UPDATED` e tocca **solo** `musicEnabled`/`effectsEnabled` mentre un livello è montato, il controller applica stato ed effetti (incluso il salvataggio), spinge i flag alla porta audio e **salta `render()`**. La casella si è già aggiornata da sé e nulla di disegnato dipende da quei flag. Il cambio di **ruolo** continua a rimontare, perché cambia il superpotere concesso: l'eccezione resta larga quanto la sua ragione.
  2. **A livello in pausa la tastiera non è del livello**: `onKeyDown` esce subito se non sta girando, e `pause()` azzera gli input tenuti. `isInteractiveTarget` riconosce anche `summary` e `[role="dialog"]`.
  3. **`inert` su HUD e stage** finché il menù è aperto, rimosso prima che il fuoco torni al pulsante. **Escape chiude il menù**: il listener vive sullo `shell`, che viene ricostruito a ogni render, quindi non può accumularsi.
  4. **La riga di stato smette di riscriversi a ogni frame.** `.arcade-status` è `role="status" aria-live="polite"` e `updateStatus()` gira a 60 fps: assegnare `textContent` sostituisce il nodo anche a stringa identica, quindi un lettore di schermo riceveva la stessa frase sessanta volte al secondo. Ora la frase (e ogni `dataset`) si scrive solo quando cambia davvero.
- Verifica: test unit sul nodo `[data-level-host]` che resta **lo stesso oggetto** dopo il toggle audio e cambia dopo il cambio ruolo; `MutationObserver` sulla live region che conta meno di tre mutazioni in 120 frame; `inert` presente e rimosso con Escape; e un test end-to-end sui tre viewport che corre nel livello, apre il menù, apre la sezione impostazioni **con la barra spaziatrice** (la regressione), toglie la musica, chiude con Escape e verifica che la posizione sia identica.
- Conseguenza: `data-elapsed` sparisce dal `dataset` (nessun test lo leggeva) e le scritture per frame passano da 5-8 a zero a regime. È la prima eccezione documentata alla regola di ADR-018 sul render; qualunque altra deve passare da qui.
