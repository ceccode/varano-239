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

- Stato: **Accettata per MVP**
- Data: 1 agosto 2026
- Decisione: sito statico su GitHub Pages dal repository personale; salvataggio solo locale.
- Perché: distribuzione gratuita, trasparente e adatta a Vite; nessun requisito attuale giustifica un server.
- Alternative: Vercel/Cloudflare Pages; backend dedicato.
- Conseguenza: routing compatibile con sottocartella, `base` configurato, nessun segreto nel bundle.

## ADR-011 — Licenza e identità originali

- Stato: **Accettata**
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
- Decisione: il sito statico viene pubblicato su **Netlify** con `netlify.toml` (build `npm run build`, publish `dist/`, base path `/`). GitHub Pages può restare come mirror finché non crea ambiguità.
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
