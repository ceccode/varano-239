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
