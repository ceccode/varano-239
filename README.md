# VARANO 2:39

> Il mistero dei Sei Colli  
> Quattro punti di vista. Sei colli. Una sola foto.

**VARANO 2:39** è un videogioco narrativo gratuito e open-source, consigliato a un pubblico **12+**, liberamente ispirato al misterioso rettile avvistato nelle campagne di Montichiari nel luglio 2026.

Il gioco mescola cronaca documentata, testimonianze contraddittorie e una leggenda pixel-art. Il Varano è sempre il protagonista: può essere inseguito, protetto, interpretato dal giocatore o incoronato improbabile Conte del Castello Bonoris.

Le scene giocabili sono sempre marcate **LEGGENDA — ricostruzione inventata**. I fatti reali compaiono in schede attribuite e nell'Archivio; anche le **2:39** restano un orario riportato dalla stampa, distinto dai contenuti dell'ordinanza.

Accanto alla caccia nasce un secondo mistero: **da dove arriva il Varano?** Potrebbe essere fuggito, essere stato abbandonato oppure essere soltanto il primo indizio di un disegno molto più grande. Le ipotesi reali e la cospirazione inventata restano sempre distinguibili.

## Stato del progetto

La milestone **M0 — Fondamenta** è implementata: il repository contiene lo scaffold Vite + TypeScript strict, la shell statica accessibile, i contratti minimi del dominio e la pipeline completa di qualità e deploy. La prima versione giocabile sarà il vertical slice M1 sulla fotografia notturna associata dalle cronache all'orario **2:39**.

M0 non include ancora scene, setup, salvataggi o contenuti del Dossier. La pagina segnala esplicitamente questo stato e resta leggibile anche se JavaScript non parte.

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

| Comando                | Scopo                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Avvia il server Vite di sviluppo.                                     |
| `npm run preview`      | Serve localmente l'ultima build di produzione.                        |
| `npm run build`        | Controlla i tipi e genera `dist/`.                                    |
| `npm run typecheck`    | Esegue TypeScript strict senza emettere file.                         |
| `npm run lint`         | Esegue ESLint senza accettare warning.                                |
| `npm run format`       | Formatta i file supportati con Prettier.                              |
| `npm run format:check` | Verifica la formattazione senza modificare file.                      |
| `npm run test`         | Esegue i test unitari e DOM con Vitest.                               |
| `npm run test:e2e`     | Esegue Playwright e axe su build con base `/varano-239/`.             |
| `npm run validate`     | Compila i contratti e impedisce contenuti o dipendenze runtime in M0. |
| `npm run check`        | Esegue in ordine tutti i gate definiti in `docs/QUALITY.md`.          |

Per verificare manualmente una build sotto il sottopercorso GitHub Pages:

```sh
npm run build -- --base=/varano-239/
npm run preview -- --base=/varano-239/
```

La configurazione accetta anche `VITE_BASE_PATH` per altri sottopercorsi. Usa la stessa base per build e preview. La build non ha dipendenze runtime e non carica font, script o asset remoti.

Le pull request producono un artifact di preview scaricabile dopo il quality gate. I push su `main` eseguono nuovamente `npm run check` e pubblicano l'artifact statico tramite GitHub Pages; l'amministratore del repository deve selezionare **GitHub Actions** come sorgente Pages.

## Prospettive giocabili

- **Cacciatore** — segue tracce e falsi indizi. Nella versione completa, scegliendo l'approccio «Cerca una prova», può arrivare a un abbattimento non grafico, con conseguenze narrative e senza meccaniche realistiche d'arma.
- **Custode animalista** — tenta di localizzare il Varano e preparare un intervento sicuro.
- **Sindaco eroe** — sindaco del comune totalmente fittizio di Borgocoda, guida la propria delegazione in un'esercitazione intercomunale inventata; cerca una prova fra mappe, droni e reputazione.
- **Varano** — evita gli umani e sceglie fra salvezza, fuga e conquista del Castello Bonoris.

All'inizio della partita si scelgono separatamente:

1. la sensibilità della storia: `delicata`, senza morte, oppure `completa`, con temi di morte e la scelta letale del Cacciatore;
2. il personaggio;
3. l'approccio principale: cercare una prova oppure privilegiare il salvataggio;
4. la profondità del mistero: caso principale, Dossier Origini oppure tutti i contenuti inclusi nella build.

Soltanto il Cacciatore con approccio «Cerca una prova», nella storia completa, può scegliere direttamente di uccidere il Varano. La scelta è annunciata e confermata, avviene fuori campo, non mostra gore e non viene trasformata in un mini-gioco di mira.

## Direzione del gioco

- Avventura narrativa point-and-click con scene pixel-art.
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
- Nessun framework UI o game framework nel vertical slice.
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
