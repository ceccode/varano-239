# Game design

## Scheda sintetica

| Voce             | Decisione                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Titolo di lavoro | `VARANO 2:39 — Il mistero dei Sei Colli`                                                         |
| Genere           | Avventura narrativa point-and-click con scene pixel-art                                          |
| Pubblico         | 12+ consigliato; non è una classificazione PEGI ufficiale                                        |
| Tono             | Mistero goliardico, satira leggera, cospirazione fantastica, nessuna parolaccia o gore           |
| Piattaforma      | Browser mobile-first e desktop                                                                   |
| Durata MVP       | 20–30 minuti per il caso principale; il Dossier Origini aggiunge circa 15–20 minuti              |
| Modello          | Gratuito, open-source, nessun acquisto o pubblicità                                              |
| Protagonista     | Il Varano, giocabile o inseguito a seconda della prospettiva                                     |
| Input            | Touch, mouse e tastiera                                                                          |
| Fallimento       | Nessun game over punitivo; ogni esito racconta una versione della leggenda e apre o chiude piste |

## High concept

Una fotografia, associata dalle cronache all'orario 2:39, trasforma un rettile misterioso nella celebrità di Montichiari. Il giocatore sceglie chi racconta la vicenda e attraversa una «Montichiari della Leggenda» da quattro prospettive incompatibili. Ogni campagna tenta di rispondere a due domande indipendenti: «Che fine ha fatto il Varano?» e «Da dove è arrivato?». Nessuna risposta inventata pretende di sostituirsi alla cronaca reale.

La ricerca conduce dai campi e dalle rogge ai Sei Colli e al Castello Bonoris. I contenuti sono sempre riconoscibili tramite cinque timbri:

- **FATTO**: sostenuto da una o più fonti registrate.
- **TESTIMONIANZA**: dettaglio riportato ma non verificato in modo indipendente.
- **IPOTESI**: interpretazione plausibile e attribuita, ma non dimostrata.
- **LEGGENDA**: invenzione dichiarata del gioco.
- **SCONFESSATO**: affermazione contraddetta da una fonte autorevole successiva; una pista inventata scartata resta LEGGENDA.

Ogni scena giocabile mostra inoltre un banner persistente **LEGGENDA — ricostruzione inventata**. I timbri diversi da LEGGENDA appartengono alle schede consultabili, non trasformano dialoghi o azioni in cronaca documentata.

## Pilastri

### 1. Il Varano al centro

Ogni scena deve mostrare, evocare o far avanzare il destino del Varano. Le campagne umane non devono ridurlo a un semplice oggetto da raccogliere.

### 2. Quattro versioni, una città

Circa il 70% di luoghi, asset e fatti è condiviso. Il restante 30% cambia obiettivi, dialoghi, indizi e finale. Questo limita l'esplosione combinatoria e rende utile rigiocare.

### 3. Cronaca leggibile, leggenda giocabile

Le informazioni reali si trovano in carte brevi e in un archivio consultabile. La fiction collega i luoghi e crea il mistero senza confondere il giocatore sullo stato dei fatti.

### 4. Sorridere senza umiliare

La satira riguarda titoli sensazionalistici, versioni contrastanti, ansia burocratica e ambizione politica dell'archetipo inventato. Non imita o prende di mira persone reali o gruppi vulnerabili.

### 5. Tutti possono arrivare al finale

Non sono richiesti riflessi rapidi. Gli enigmi offrono suggerimenti, soluzione assistita e salto. La Modalità Storia elimina tempi e penalità.

### 6. Due misteri, finali indipendenti

Il destino del Varano e la sua provenienza sono assi separati. Ucciderlo non concede indizi esclusivi; salvarlo non risolve automaticamente l'origine. Una partita può chiudere il destino e lasciare il dossier aperto per capitoli futuri.

### 7. Espandibile senza riscrivere il gioco

Nuovi misteri e capitoli si innestano come Story Pack in punti dichiarati del grafo. Un nuovo livello usa un nodo dichiarativo e, soltanto per una nuova meccanica, un adapter isolato nel registro compilato. Le regole sono in `EXPANSIONS.md`.

## Setup iniziale

Il setup avviene dopo il disclaimer e richiede quattro scelte brevi: sensibilità, ruolo, approccio e profondità del mistero. Devono essere modificabili fino alla pressione di «Inizia la storia».

### 1. Sensibilità

- **Storia delicata** (`gentle`, predefinita): il Varano è sempre vivo; finali postumi e scelta letale sono esclusi e non appaiono nell'interfaccia.
- **Storia completa 12+** (`complete`): ammette che il Varano possa essere già morto, non farcela o, soltanto nel percorso `hunter + evidence`, essere ucciso dal Cacciatore. Ogni morte resta fuori campo e senza gore.

Questa non è una scelta di difficoltà e non attribuisce automaticamente un giudizio morale. Prima dell'abbattimento il gioco mostra una conferma esplicita e seleziona per default l'alternativa non letale.

### 2. Ruolo

Il ruolo decide voce, obiettivi intermedi e scene specifiche. Non decide da solo il destino dell'animale.

### 3. Approccio

- **Cerca una prova** (`evidence`): privilegia documentazione, fotografia e verifica materiale.
- **Prova a salvarlo** (`rescue`): privilegia tempo, benessere e coordinamento con esperti.

Ogni ruolo mostra una proposta iniziale — prova per Cacciatore e Sindaco, salvataggio per Custode e Varano — ma tutte le combinazioni devono restare giocabili. L'approccio modifica obiettivi e alcune battute, non crea otto campagne separate.

## Prospettive giocabili

| Ruolo UI           | Identificatore | Motivazione                                      | Meccanica dominante                   | Prova morale                                     | Finali principali                                    |
| ------------------ | -------------- | ------------------------------------------------ | ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Cacciatore         | `hunter`       | Capire che cosa è accaduto e ottenere una prova  | Tracce, fotografia, confronto finale  | La prova vale più della vita dell'animale?       | Salvataggio; fuga; ritrovamento; abbattimento        |
| Custode animalista | `guardian`     | Proteggere l'animale senza improvvisarsi esperta | Corridoi sicuri, ripari, fiducia      | Intervenire subito o aspettare chi è competente? | Salvataggio; ritrovamento tardivo e non grafico      |
| Sindaco eroe       | `mayor`        | Guidare la delegazione della fittizia Borgocoda  | Mappe, risorse e comunicazione        | Cercare consenso o coordinare con prudenza?      | Prova viva; prova postuma; mistero ancora aperto     |
| Varano             | `varano`       | Sopravvivere e scegliere il proprio finale       | Furtività narrativa, calore, percorsi | Fidarsi degli umani o diventare leggenda?        | Conquista del castello; salvataggio volontario; fuga |

Il Cacciatore può portare un'arma da caccia come elemento narrativo. Non esistono mira, munizioni, precisione, potenziamenti o istruzioni d'uso. L'unica azione letale è una scelta testuale nel confronto finale, disponibile a `hunter + evidence + complete` e seguita da una conferma aggiuntiva.

Ogni riferimento a morte o ritrovamento nella tabella è esclusivo di `complete`; l'abbattimento resta ulteriormente limitato a `hunter + evidence + complete`.

## Loop di gioco

1. Osserva una scena pixel-art.
2. Esplora 3–6 hotspot accessibili.
3. Leggi o ascolta un dialogo breve.
4. Raccogli un fatto, una testimonianza, un'ipotesi, una leggenda o un'affermazione sconfessata da una fonte autorevole.
5. Prendi una decisione coerente con il ruolo o sorprendente rispetto a esso.
6. Vedi una conseguenza immediata.
7. Avanza alla scena successiva e aggiorna Archivio e Bacheca delle origini.

Una scena standard dura 2–4 minuti. Nessuna scena deve richiedere più di due obiettivi contemporanei.

### Esperimento M1R — ritmo arcade

Il playtest proprietario del primo Atto 0 ha giudicato la sola selezione di hotspot poco giocabile e poco coinvolgente. Prima di estendere la campagna, M1R sostituisce l'apertura point-and-click con un unico micro-livello laterale originale:

- il giocatore guida il Varano, raccoglie tre segnali e raggiunge il canneto;
- movimento, salto e scorrimento servono a dare presenza fisica e ritmo, non a creare difficoltà punitiva;
- non ci sono nemici, vite, cadute letali, timer, punteggio o game over;
- «Salta la sfida» porta allo stesso nodo narrativo del completamento;
- Modalità Storia, Calma e movimento ridotto offrono direttamente il percorso equivalente senza loop real-time;
- dialoghi, scelte, Dossier, banner LEGGENDA e Archivio restano HTML semantico.

M1R è un test di formato, non l'approvazione di un platform completo. M2 resta sospesa finché il proprietario non valuta il nuovo prototipo.

## Struttura condivisa

| Atto                  | Luogo                                        | Fatto di partenza                                                              | Obiettivo ludico                               |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- |
| 0. Ore 2:39           | Campo di mais inventato                      | Fotografia ritenuta attendibile dall'ente; orario riportato come testimonianza | Tutorial, prima scelta, primo popup            |
| 1. La zona interdetta | Sintesi inventata di strade poderali e rogge | Scheda sull'ordinanza, droni e gabbie                                          | Ricostruire percorso e priorità                |
| 2. Tre identità       | Laboratorio delle versioni                   | Specie e dimensioni non confermate                                             | Confrontare indizi senza falsa certezza        |
| 3. Varano superstar   | Borgo e piazza immaginata                    | Meme e copertura internazionale                                                | Separare notizia, voce e invenzione            |
| X. Le origini         | Livelli opzionali inventati                  | Fuga o abbandono sono ipotesi; il complotto è fiction                          | Confrontare tre piste senza imporre una verità |
| 4. I Sei Colli        | Mappa stilizzata                             | Nomi riportati da una fonte locale, con grafie da verificare                   | Raccogliere sigilli e sbloccare la via         |
| 5. Il Bonoris         | Parco, mura e cassaforte                     | Elementi reali del castello                                                    | Risolvere il mistero e determinare l'esito     |

Gli atti 4 e 5 sono leggenda. La zona reale degli avvistamenti non comprende il centro o il castello.

L'atto X non è una singola posizione: i suoi nodi si inseriscono dopo gli atti 1 e 3 e prima del finale. Il preset di profondità decide quanti livelli opzionali mostrare.

## Variabili di gioco

Mantenere poche variabili, tutte leggibili dal giocatore:

- `evidence`: quantità e qualità delle prove, da 0 a 6.
- `care`: decisioni orientate al benessere, da 0 a 6.
- `publicTrust`: fiducia della comunità, da 0 a 6.
- `condition`: `healthy | weak | critical | unknown`.
- `seals`: insieme dei sigilli dei Sei Colli.
- `varanoFate`: `unresolved | rescued | escaped | foundDead | killedByHunter`.
- `discoveredClues`: insieme degli indizi, namespaced per mistero.
- `selectedTheoryByMystery`: teoria scelta per ciascun mistero; fuga, abbandono e complotto sono dati del pack `origins`, non union del motore.
- `completedPacks`: pacchetti narrativi conclusi.

Non aggiungere valuta, esperienza, crafting, albero abilità o inventario combinatorio nell'MVP.

## Finali

I finali sono versioni alternative. La pagina conclusiva mostra sempre il timbro **LEGGENDA** e rimanda alla cronologia reale.

Mappatura del destino: Salvataggio → `rescued`; Coda libera e Conte provvisorio → `escaped`; La prova postuma → `foundDead`; La prova che pesa → `killedByHunter`; Nessuna prova definitiva → `unresolved`.

### Salvataggio

Il Varano viene trovato vivo e trasferito da professionisti. È il finale più luminoso, ma non viene presentato come moralmente obbligatorio.

### La prova postuma

Viene ritrovato il corpo dell'animale. La scoperta avviene fuori scena: si mostrano un'area delimitata, un contenitore chiuso non sagomato e le reazioni dei personaggi, senza dettagli. La scena è breve, rispettosa e senza gag. Il sindaco ottiene la prova richiesta, ma il giocatore vede anche il costo del ritardo o delle priorità scelte.

### La prova che pesa

Soltanto il Cacciatore con approccio `evidence`, in `complete`, può scegliere «Abbatti il Varano» quando sono disponibili anche corridoio sicuro e chiamata agli operatori. Una conferma aggiuntiva chiarisce l'esito. L'inquadratura resta sulla torre; il colpo è fuori campo e l'audio può essere omesso. Non si mostrano impatto, ferite o corpo.

L'esito `killedByHunter` non assegna premio, trofeo, punti o indizi esclusivi. `publicTrust` e `care` scendono al minimo, i personaggi reagiscono e l'epilogo non definisce automaticamente l'atto come legale o illegale.

### La conquista

Il Varano raggiunge il Castello Bonoris e diventa il «Conte provvisorio dei Sei Colli». È il finale più apertamente leggendario.

### Coda libera

Il Varano trova un passaggio e lascia il castello vivo prima della cattura. Restano una fotografia o tracce sufficienti a sostenere che fosse lì, ma non una destinazione certa. `varanoFate` diventa `escaped`; l'origine rimane un dossier indipendente.

### Nessuna prova definitiva

Si trovano tracce incompatibili o una muta scambiata per corpo. La città continua a raccontare il mistero.

## Popup del Varano

Il popup sorpresa è una gag, non un jumpscare:

- sprite che sbuca da un bordo, da una finestra o da dietro un cartello;
- nessun suono improvviso ad alto volume;
- nessun flash;
- durata 700–1.200 ms in modalità standard;
- massimo uno per scena e almeno tre minuti di cooldown globale;
- disattivato in Modalità calma e con `prefers-reduced-motion`;
- non interrompe una scelta, un testo importante o la scena di morte;
- non compare dalla scelta letale fino alla fine dell'epilogo;
- casualità deterministica e testabile;
- almeno il 30% delle apparizioni deve contenere un piccolo indizio, non soltanto decorazione.

## Modalità e impostazioni

Queste modalità regolano accessibilità e difficoltà narrativa; sono separate dalla scelta di sensibilità `gentle | complete`.

- **Standard**: enigmi e sorprese gentili.
- **Storia**: nessun timer, suggerimenti immediati e pulsante «Continua la storia».
- **Calma**: niente popup, movimento ridotto e transizioni istantanee.
- Testo piccolo/medio/grande.
- Alto contrasto.
- Musica ed effetti regolabili separatamente.
- Battute bresciane: `off` per impostazione predefinita, `on` come overlay facoltativo.

## Profondità del mistero

Separata da difficoltà e sensibilità:

- **Caso principale** (`core`): campagna base e una sola domanda aperta sull'origine.
- **Dossier origini** (`origins`, predefinita): include le tre piste fuga, abbandono e complotto.
- **Tutti i contenuti inclusi** (`all-registered`): abilita tutti i pacchetti narrativi registrati e compatibili nella build corrente.

Il giocatore può saltare ogni arco opzionale. Il tempo stimato viene mostrato prima di abilitarlo. Un pacchetto non può rendere irraggiungibile un finale core.

## Battute dialettali

Il dialetto non porta informazioni necessarie e non sostituisce il testo italiano. Ogni battuta facoltativa deve avere una variante italiana semanticamente equivalente. Evitare un uso caricaturale o eccessivo di intercalari locali.

## Non-obiettivi dell'MVP

- Platform completo o mondo top-down liberamente esplorabile.
- Combattimento, simulazione di mira o caccia armata ripetibile.
- Multiplayer, chat, account o classifiche.
- Backend di gioco o salvataggi cloud.
- Realtà aumentata, GPS o segnalazioni dal pubblico.
- Generazione procedurale o contenuti generati dall'AI durante il gioco.
- Doppiaggio completo.
- PWA/offline obbligatori.
- Ruoli aggiuntivi nell'MVP.
- Plugin runtime, editor visuale o download di contenuti eseguibili.
