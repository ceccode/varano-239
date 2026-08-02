# VARANO 2:39

> Il mistero dei Sei Colli  
> Quattro punti di vista. Sei colli. Una sola foto.

**VARANO 2:39** è un videogioco narrativo gratuito e open-source, consigliato a un pubblico **12+**, liberamente ispirato al misterioso rettile avvistato nelle campagne di Montichiari nel luglio 2026.

Il gioco mescola cronaca documentata, testimonianze contraddittorie e una leggenda pixel-art. Il Varano è sempre il protagonista: può essere inseguito, protetto, interpretato dal giocatore o incoronato improbabile Conte del Castello Bonoris.

Le scene giocabili sono sempre marcate **LEGGENDA — ricostruzione inventata**. I fatti reali compaiono in schede attribuite e nell'Archivio; anche le **2:39** restano un orario riportato dalla stampa, distinto dai contenuti dell'ordinanza.

Accanto alla caccia nasce un secondo mistero: **da dove arriva il Varano?** Potrebbe essere fuggito, essere stato abbandonato oppure essere soltanto il primo indizio di un disegno molto più grande. Le ipotesi reali e la cospirazione inventata restano sempre distinguibili.

## Stato del progetto

Dopo i playtest delle prime iterazioni (M1 point-and-click e M1R arcade DOM), il progetto è pivotato a **platformer arcade** (ADR-018) con onboarding a schermo intero (ADR-021): la milestone corrente è **M1P — «Livello 1: I campi di Montichiari»**.

Al caricamento il gioco parte subito, senza title screen: si guida il Varano in un livello a scorrimento laterale su canvas (corsa, salto con coyote time, tre segnali da raccogliere, checkpoint morbidi e traguardo nel canneto), con musica chiptune ed effetti generati via WebAudio e controlli touch mobile-first — anche in landscape, con i controlli in overlay. L'edizione è unica, 12+, con tono goliardico e colpi di scena (ADR-022). La narrativa vive nel gioco: una barra contestuale durante la corsa e overlay a scheda per dialogo, scelta e finale aperto, tutti nello stesso stile grafico. Un menù in-game raccoglie impostazioni (personaggio, audio), credits, privacy e termini; il registro delle fonti resta in [`docs/SOURCES.md`](./docs/SOURCES.md), linkato dai credits (ADR-024). Il livello non ha nemici, vite, timer o game over; è sempre saltabile e con `prefers-reduced-motion` viene sostituito da un percorso narrativo equivalente. La webapp è installabile come PWA portrait-first con supporto offline. `origins` e `all-registered` degradano esplicitamente al caso `core` finché i relativi pack non saranno implementati.

## Sviluppo locale

Prerequisiti:

- Node.js 24 LTS, fissato in [`.nvmrc`](./.nvmrc);
- npm;
- Chromium per i test end-to-end.

Installazione iniziale:

```sh
nvm use
npm ci
npx playwright install chromium
```

Comandi disponibili:

| Comando                | Scopo                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Avvia il server Vite di sviluppo.                                   |
| `npm run preview`      | Serve localmente l'ultima build di produzione.                      |
| `npm run build`        | Controlla i tipi e genera `dist/`.                                  |
| `npm run typecheck`    | Esegue TypeScript strict senza emettere file.                       |
| `npm run lint`         | Esegue ESLint senza accettare warning.                              |
| `npm run format`       | Formatta i file supportati con Prettier.                            |
| `npm run format:check` | Verifica la formattazione senza modificare file.                    |
| `npm run test`         | Esegue i test unitari e DOM con Vitest.                             |
| `npm run test:e2e`     | Esegue Playwright e axe su build con base `/varano-239/`.           |
| `npm run validate`     | Compila i contratti e valida grafo, fonti, asset e combinazioni M1. |
| `npm run check`        | Esegue in ordine tutti i gate definiti in `docs/QUALITY.md`.        |

Per verificare manualmente una build sotto il sottopercorso GitHub Pages:

```sh
npm run build -- --base=/varano-239/
npm run preview -- --base=/varano-239/
```

La configurazione accetta anche `VITE_BASE_PATH` per altri sottopercorsi. Usa la stessa base per build e preview. La build non ha dipendenze runtime e non carica font, script o asset remoti.

Le pull request producono un artifact di preview scaricabile dopo il quality gate. I push su `main` eseguono nuovamente `npm run check` e pubblicano l'artifact statico tramite GitHub Pages. Il repository usa già **GitHub Actions** come sorgente ed è disponibile su [ceccode.github.io/varano-239](https://ceccode.github.io/varano-239/).

## Prospettive giocabili

- **Cacciatore** — segue tracce e falsi indizi. Nella versione completa, scegliendo l'approccio «Cerca una prova», può arrivare a un abbattimento non grafico, con conseguenze narrative e senza meccaniche realistiche d'arma.
- **Custode animalista** — tenta di localizzare il Varano e preparare un intervento sicuro.
- **Sindaco eroe** — sindaco del comune totalmente fittizio di Borgocoda, guida la propria delegazione in un'esercitazione intercomunale inventata; cerca una prova fra mappe, droni e reputazione.
- **Varano** — evita gli umani e sceglie fra salvezza, fuga e conquista del Castello Bonoris.

L'edizione è unica, consigliata a un pubblico 12+, con tono goliardico e scherzoso (ADR-022). Il personaggio si sceglie in ogni momento dal menù in-game; approccio e profondità del mistero (Dossier Origini, contenuti extra) arriveranno con i prossimi capitoli.

Soltanto il Cacciatore con approccio «Cerca una prova» potrà scegliere direttamente di uccidere il Varano. La scelta è annunciata e confermata, avviene fuori campo, non mostra gore e non viene trasformata in un mini-gioco di mira.

## Direzione del gioco

- Avventura narrativa DOM-first con scene pixel-art e brevi livelli arcade facoltativi.
- Browser mobile-first e desktop.
- Touch, mouse e tastiera.
- Italiano completo; battute bresciane facoltative e revisionate.
- Nessun game over punitivo o sfida basata obbligatoriamente sui riflessi.
- Contenuti distinti come **FATTO**, **TESTIMONIANZA**, **IPOTESI**, **LEGGENDA** o **SCONFESSATO**.
- Personaggi umani inventati o compositi, senza rappresentare persone reali.
- Misteri e capitoli opzionali aggiungibili come contenuti dichiarativi; nuove meccaniche isolate dietro un registro di livelli compilato.

## Direzione tecnica

- TypeScript in modalità strict.
- Vite.
- Interfaccia DOM-first, accessibile e testabile.
- Nessun framework UI o game framework nel vertical slice o nel prototipo arcade.
- Stato narrativo gestito da funzioni pure e contenuti dichiarativi.
- Pacchetti narrativi compilati insieme al gioco, senza plugin runtime o codice remoto.
- Test unitari, di integrazione ed end-to-end.
- Salvataggio locale, senza account o backend.
- Analytics facoltativi e limitati a visite aggregate e avvii della partita, senza tracciare ruoli, scelte o finali.

Un framework 2D potrà essere valutato soltanto se futuri mini-giochi real-time ne dimostreranno la necessità. La storia e i controlli accessibili resteranno comunque nel DOM.

## Principi

- **KISS** — preferire soluzioni piccole, esplicite e comprensibili.
- **Mantenibilità** — moduli con responsabilità chiare e dipendenze direzionate.
- **Testabilità** — logica di gioco indipendente dal browser e dagli asset.
- **Accessibilità** — ogni percorso deve poter essere completato senza suono, mouse o riflessi rapidi.
- **Privacy first** — raccogliere soltanto ciò che è strettamente necessario.
- **Rispetto delle fonti** — nessun finale inventato viene presentato come esito reale.

## Sicurezza e disclaimer

Il gioco non è una guida alla ricerca dell'animale. Non avvicinare, inseguire, spaventare o tentare di catturare animali selvatici o esotici: mantieni le distanze e avvisa le autorità competenti.

La morte resta non grafica. Nel solo percorso Cacciatore + «Cerca una prova» della modalità completa, il giocatore può esserne direttamente responsabile; il gioco mostra conseguenze, non celebra la violenza e non insegna l'uso di armi.

## Documentazione

Tutte le specifiche di prodotto, storia, architettura, privacy, qualità ed espansione sono raccolte nell'[indice della documentazione](./docs/README.md). Le istruzioni vincolanti per agenti AI e contributori si trovano anche in [`AGENTS.md`](./AGENTS.md).

## Contribuire

Leggi [CONTRIBUTING.md](./CONTRIBUTING.md) prima di aprire una issue o una pull request.

## Licenza

Il codice e la documentazione originali sono distribuiti con licenza [MIT](./LICENSE). Immagini, font, musica e altri asset devono essere originali oppure accompagnati da una licenza compatibile e da informazioni chiare sulla provenienza.
