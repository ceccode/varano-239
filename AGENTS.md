# Istruzioni per gli agenti di coding

Queste istruzioni valgono per tutto il repository. L'obiettivo è costruire `VARANO 2:39` in modo incrementale, testabile e comprensibile a nuovi contributori.

## Prima di modificare il progetto

Leggere, nell'ordine:

1. `README.md`
2. `docs/README.md`
3. `docs/ARCHITECTURE.md`
4. `docs/QUALITY.md`
5. le decisioni in `docs/DECISIONS.md`, dall'ultima all'indietro

I documenti di trama in `docs/private/` (game design, trattamento, narrativa, roadmap) servono soltanto per modifiche narrative.

Per modifiche narrative o ai dossier, leggere inoltre `docs/SOURCES.md`, `docs/private/NARRATIVE.md` e `docs/CONTENT_MODEL.md` prima di intervenire.

I documenti in `docs/private/` contengono trama, finali e colpi di scena: sono ignorati da git per non anticipare la storia (ADR-028). Non copiarne contenuti narrativi non ancora pubblicati nei documenti pubblici, nei messaggi di commit o nelle pull request.

Prima di scrivere codice, dichiarare gli acceptance criteria che si intendono soddisfare. Implementare la più piccola fetta verticale che produca valore verificabile.

**La campagna è chiusa**: dieci livelli, undici capitoli, sei finali (ADR-047). Il lavoro corrente riguarda performance, usabilità e i livelli esistenti. Aggiungere un capitolo, un livello o un finale è una decisione del proprietario, non un'iniziativa autonoma.

## Vincoli non negoziabili

- Pubblico 12+, nessuna parolaccia, gore o rappresentazione grafica della morte.
- Il Varano è il protagonista narrativo anche quando non è il personaggio giocabile.
- Tutte le persone umane sono inventate o composite.
- Tutto il grafo giocabile mostra il banner persistente LEGGENDA. FATTO, TESTIMONIANZA, IPOTESI e SCONFESSATO vivono soltanto nell'Archivio, cioè in `docs/SOURCES.md`: nessun nodo pubblicato è una scheda di Dossier (ADR-024).
- Il Sindaco Eroe governa il comune totalmente fittizio di Borgocoda e guida soltanto la propria delegazione in un'esercitazione intercomunale inventata: non rappresenta il sindaco reale, non esercita autorità sulla Montichiari reale, non firma l'ordinanza reale e non ne riproduce voce, volto, biografia o citazioni.
- Il Cacciatore, il fucile e ogni sua azione sono LEGGENDA dalla prima apparizione e non vengono presentati come parte delle ricerche documentate.
- Le campagne sono versioni alternative: nessun finale inventato deve essere presentato come esito reale.
- L'edizione è unica, 12+, con tono goliardico e scherzoso (ADR-022): nessuna scelta di sensibilità offerta al giocatore.
- La sola azione letale diretta ammessa è quella del Cacciatore che ha scelto «Documenta la scena» nel prologo, nel nodo finale dedicato. Richiede conferma esplicita con il focus su «Torna indietro», avviene fuori campo e non include una meccanica di mira o uso realistico dell'arma. La clausola `sensitivity-is complete` di ADR-013 è caduta con l'asse (ADR-048): l'edizione **è** quella completa.
- I finali con morte o corpo ritrovato sono mostrati con rispetto, senza dettagli o gag.
- Nessun invito a cercare il rettile nel mondo reale; niente AR, coordinate precise o geolocalizzazione.
- Fatti, testimonianze, ipotesi, leggende e piste sconfessate devono essere distinti visivamente e nei dati.
- Fuga e abbandono sono TESTIMONIANZA o IPOTESI non verificate; ogni reperto, responsabile, complotto, società segreta o codice è LEGGENDA e usa soltanto nomi inventati.
- SCONFESSATO richiede una confutazione autorevole. Una leggenda scartata dal giocatore resta LEGGENDA con lo stato «PISTA SCARTATA IN QUESTA VERSIONE».
- Un soggetto inventato deve anche essere non riconoscibile: niente edifici, mestieri, veicoli, percorsi o biografie che puntino a persone o attività reali.
- Nessun contenuto classificato `fact` senza almeno una fonte registrata.
- Nessun account, classifica, pubblicità, testo libero inviato a server o identificatore persistente.
- Analytics consentiti: visita, `game_start`, milestone aggregate dei livelli 1/3/6/10, completamento, tentativo di condivisione e replay, sempre senza proprietà aggiuntive (ADR-059). Il provider è disabilitato se manca una configurazione esplicita.
- Il gioco deve essere completabile senza suono, mouse, riflessi rapidi o mini-giochi obbligatori. Le vite e il game over di livello (ADR-041) valgono per chi gioca la sfida arcade: «Salta il livello» resta sempre disponibile con lo stesso esito narrativo, un game over non cancella mai i progressi della storia e non viene mai rappresentato come morte grafica. La parte arcade è il default per tutti (ADR-046): nessun segnale di sistema la nasconde; il percorso assistito resta nel dominio dietro le modalità `story`/`calm`.
- Capitoli e livelli sono contenuti dichiarativi compilati a build time. Un livello usa un `LevelNode` e, se introduce una meccanica, un adapter isolato nel registro compilato; niente script remoto, callback arbitrarie o modifica dei capitoli già scritti.

## Principi di implementazione

### KISS

- Preferire funzioni e tipi espliciti a framework, metaprogrammazione e astrazioni generiche.
- Non creare un'astrazione finché non esistono almeno due usi reali che condividono lo stesso comportamento.
- Non introdurre dependency injection container, event bus globale, ECS o plugin system.
- Non introdurre un plugin system runtime per le espansioni: usare il registro statico descritto in `docs/EXPANSIONS.md`.
- Non usare una libreria per una funzione piccola e stabile che può essere implementata e testata localmente.
- Ogni modulo deve avere una responsabilità descrivibile in una frase.

### Dipendenze

- `core` è TypeScript puro: niente DOM, storage, audio, analytics o import Vite.
- `features` dipende da `core`, mai il contrario.
- `platform` implementa le porte definite dal dominio; il dominio non importa adapter concreti.
- `content` contiene dati dichiarativi e tipi condivisi, non logica applicativa o accesso alla piattaforma.
- `app` compone i moduli; non deve diventare un contenitore di logica.
- Vietati import circolari.

### TypeScript

- `strict: true` e nessun `any` non giustificato.
- Usare union discriminate per azioni, ruoli, scene, effetti ed esiti.
- Rendere impossibili gli stati invalidi quando è semplice farlo con i tipi.
- Non usare cast per nascondere errori di modellazione.
- Le funzioni pure ricevono clock e casualità come dipendenze; niente `Date.now()` o `Math.random()` nel dominio.

### Stato

- Una sola fonte di verità: `GameState` aggiornato da un reducer puro.
- I side effect sono restituiti come intenti o gestiti da adapter dopo la transizione.
- Nessuna variabile globale mutabile.
- Il salvataggio locale è versionato e passa da una funzione di migrazione.

### UI

- HTML semantico per menu, dialoghi, hotspot, inventario, impostazioni, fonti e finali.
- I pulsanti devono essere elementi `button`, non `div` cliccabili.
- Il focus deve essere visibile e ripristinato dopo dialoghi o popup.
- Le scene pixel-art sono presentazione; le azioni restano disponibili nel DOM.
- Le animazioni decorative rispettano `prefers-reduced-motion`; i popup a sorpresa rispettano la modalità calma interna. Il segnale di sistema non instrada mai fuori dall'arcade (ADR-046).

## Flusso di lavoro

- Non fare commit né push su `main`. Lavorare su un branch e aprire una pull request: un merge su `main` pubblica su Netlify.
- Ogni livello e ogni feature arrivano come **draft PR**, che il proprietario prova prima che diventi Ready for review. È lui a mergiare.
- Prima della draft PR: `npm run check` verde **e** verifica in un browser reale, con zero errori in console.
- Ogni commit porta il trailer `AI-Mode: agent`.

## Politica sul game framework

Il gioco non usa Phaser o altri game framework: dieci livelli girano su un adapter unico e un modello fisico puro.

Un agente può proporre un framework soltanto se:

1. esistono almeno due mini-giochi real-time approvati;
2. richiedono un loop continuo, collisioni, tilemap o input normalizzato;
3. una prova misurata dimostra che l'implementazione locale sarebbe più complessa;
4. il framework resta confinato dietro `MiniGamePort`;
5. viene aggiunta e approvata una decisione in `docs/DECISIONS.md`.

Non migrare il motore narrativo o la UI accessibile dentro un canvas.

## Contenuti e narrativa

- Tutto il testo visibile usa chiavi di messaggio, non stringhe sparse nei componenti.
- Italiano e inglese sono cataloghi completi (ADR-060): una chiave mancante o un segnaposto divergente fa fallire la build, senza fallback silenzioso.
- La satira colpisce confusione, burocrazia e febbre mediatica, non etnia, disabilità, età o singole persone reali.
- Le scene di morte e la scelta letale non contengono gag. Le battute possono riprendere soltanto nella scena successiva.
- Non descrivere tecniche, distanze, munizioni, mira o istruzioni d'arma; l'abbattimento è una decisione narrativa, non una simulazione.
- Il popup del Varano è una sorpresa gentile: niente urla, flash o salti aggressivi.

## Test richiesti per ogni modifica

- Cambi al dominio: unit test delle transizioni e dei casi limite.
- Cambi ai contenuti: validazione di riferimenti, fonti, raggiungibilità ed esiti.
- Nuovi pacchetti: test di namespace, dipendenze, punti d'innesto, ritorno al core e compatibilità con i salvataggi.
- Cambi UI: test DOM per tastiera, focus e nome accessibile.
- Cambi a un flusso utente: aggiornare o aggiungere un test Playwright.
- Bug fix: aggiungere prima un test che fallisce, quando riproducibile.
- Snapshot test soltanto se verificano una struttura stabile e utile; non sostituiscono asserzioni comportamentali.

## Definition of Done

Una modifica è completa soltanto quando:

- soddisfa gli acceptance criteria del task;
- non amplia lo scope senza una decisione registrata;
- `npm run check` passa;
- i nuovi stati sono raggiungibili e quelli rimossi non sono referenziati;
- tastiera, touch e movimento ridotto sono verificati;
- non introduce eventi analytics o dati personali non autorizzati;
- documentazione, fonti e registro asset in `docs/ASSETS.md` sono aggiornati;
- non lascia TODO privi di issue.

## Decisioni che richiedono il proprietario

Fermarsi e chiedere conferma prima di:

- aggiungere un servizio esterno o una dipendenza runtime;
- introdurre un game framework;
- raccogliere nuovi dati o eventi analytics;
- cambiare fascia d'età, tono, ruolo del Varano o regole della scelta letale;
- aggiungere capitoli, livelli o finali oltre la campagna chiusa da ADR-047;
- usare nomi, immagini, loghi o opere di persone/enti reali;
- aggiungere multiplayer, account, classifiche, backend o geolocalizzazione;
- cambiare licenza.

Per normali scelte implementative interne ai vincoli documentati, procedere autonomamente e registrare solo le decisioni durature.
