# VARANO 2:39

> Il mistero dei Sei Colli  
> Quattro punti di vista. Sei colli. Una sola foto.

<p align="center">
  <a href="https://app.varano239.it">
    <img src="https://varano239.it/og-image.png" alt="VARANO 2:39 — Il mistero dei Sei Colli, ricostruzione inventata in pixel art" width="960" />
  </a>
</p>

<p align="center">
  <strong><a href="https://app.varano239.it">GIOCA ORA</a></strong><br />
  10 livelli · 4 ruoli · 6 finali · circa 20 minuti<br />
  Gratis · Nel browser · Nessuna installazione · Nessun account
</p>

**VARANO 2:39** è un videogioco narrativo gratuito e open-source, consigliato a un pubblico **12+**, liberamente ispirato al misterioso rettile avvistato nelle campagne di Montichiari nel luglio 2026.

Il gioco mescola cronaca documentata, testimonianze contraddittorie e una leggenda pixel-art. Il Varano è sempre il protagonista: può essere inseguito, protetto, interpretato dal giocatore o incoronato improbabile Conte del Castello Bonoris.

Le scene giocabili sono sempre marcate **LEGGENDA — ricostruzione inventata**. I fatti documentati e le loro fonti restano nell'Archivio, cioè nel registro editoriale [`docs/SOURCES.md`](./docs/SOURCES.md), linkato dai credits (ADR-024); anche le **2:39** restano un orario riportato dalla stampa, distinto dai contenuti dell'ordinanza.

Accanto alla caccia resta aperto un secondo mistero: **da dove arriva il Varano?** Il gioco non lo risolve. Fuga e abbandono restano ipotesi riportate e non accertate; tutto ciò che il gioco aggiunge è dichiarato LEGGENDA.

## Stato del progetto

**La campagna è completa e pubblicata.** Dopo i playtest delle prime iterazioni (M1 point-and-click e M1R arcade DOM) il progetto è pivotato a **platformer arcade** (ADR-018) con avvio a schermo intero (ADR-021); da allora sono stati costruiti tutti e dieci i livelli, la notte lunga dei Sei Colli e il confronto finale. Il gioco è dichiarato concluso a **sei finali** (ADR-047): non sono previsti altri capitoli in questa edizione.

Cosa c'è oggi, in breve:

- **10 livelli** in un'unica campagna (~22 minuti), ciascuno con fondale, traccia chiptune, tre indizi, checkpoint, cameo del Varano e una stella bonus raggiungibile solo col superpotere del ruolo;
- **3 vite per tentativo** (ADR-041), nessun nemico e nessun timer; «Salta il livello» è sempre disponibile e produce lo stesso esito narrativo;
- **sei sigilli** raccolti negli interludi dei colli, che sbloccano il finale «Il Conte dei Sei Colli», e la condizione del Varano visibile nel briefing;
- **card di fine livello** (ADR-056) e **«La Collezione»** (ADR-057), l'archivio locale dei dieci livelli con il meglio ottenuto in ciascuno;
- **card-meme condivisibile** a fine campagna e cartolina del punteggio, entrambe generate sul dispositivo (ADR-026/049);
- menù in-game con impostazioni (personaggio, audio, scala del testo, alto contrasto), Collezione, credits, privacy e termini; dai credits si raggiunge il registro delle fonti;
- **PWA installabile** con offline atomico, aggiornamenti annunciati e numero di versione visibile nelle impostazioni (ADR-054).

L'edizione è unica, 12+, con tono goliardico e colpi di scena (ADR-022). La parte arcade è il default per tutti (ADR-046): nessun segnale di sistema la nasconde, e il percorso assistito resta disponibile dalle modalità Storia e Calma. Il lavoro successivo riguarda performance, usabilità e i livelli esistenti, non nuovi capitoli.

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

| Comando                | Scopo                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Avvia il server Vite di sviluppo.                                 |
| `npm run preview`      | Serve localmente l'ultima build di produzione.                    |
| `npm run build`        | Controlla i tipi e genera `dist/`.                                |
| `npm run typecheck`    | Esegue TypeScript strict senza emettere file.                     |
| `npm run lint`         | Esegue ESLint senza accettare warning.                            |
| `npm run format`       | Formatta i file supportati con Prettier.                          |
| `npm run format:check` | Verifica la formattazione senza modificare file.                  |
| `npm run test`         | Esegue i test unitari e DOM con Vitest.                           |
| `npm run test:e2e`     | Esegue Playwright e axe su build con base `/`.                    |
| `npm run validate`     | Compila i contratti e valida grafo, fonti, asset e messaggi.      |
| `npm run size`         | Verifica il tetto di peso del bundle (60 KB JS / 10 KB CSS gzip). |
| `npm run check`        | Esegue in ordine tutti i gate definiti in `docs/QUALITY.md`.      |

La build usa base `/` (Netlify, ADR-020). La configurazione accetta `VITE_BASE_PATH` per eventuali altri sottopercorsi. Usa la stessa base per build e preview. La build non ha dipendenze runtime e non carica font, script o asset remoti.

Le pull request producono un artifact di preview scaricabile dopo il quality gate. I push su `main` eseguono nuovamente `npm run check` e pubblicano l'artifact statico su **Netlify** all'indirizzo [app.varano239.it](https://app.varano239.it). La landing page è su [varano239.it](https://varano239.it).

## Prospettive giocabili

- **Cacciatore** — segue tracce e falsi indizi. Se nel prologo ha scelto «Documenta la scena», al confronto finale può arrivare a un abbattimento non grafico, con conseguenze narrative e senza meccaniche realistiche d'arma.
- **Custode animalista** — tenta di localizzare il Varano e preparare un intervento sicuro.
- **Sindaco eroe** — sindaco del comune totalmente fittizio di Borgocoda, guida la propria delegazione in un'esercitazione intercomunale inventata; cerca una prova fra mappe, droni e reputazione.
- **Varano** — evita gli umani e sceglie fra salvezza, fuga e conquista del Castello Bonoris.

Ogni ruolo ha il proprio obiettivo, il proprio superpotere e battute proprie in ogni capitolo. Il personaggio si sceglie in ogni momento dal menù in-game; cambiarlo a livello vivo rimonta il tentativo, perché cambia il potere.

L'edizione è unica, consigliata a un pubblico 12+, con tono goliardico e scherzoso (ADR-022): al giocatore non viene offerta nessuna scelta di sensibilità (ADR-048). Soltanto il Cacciatore che ha scelto di documentare la scena può scegliere direttamente di uccidere il Varano. La scelta è annunciata e confermata, avviene fuori campo, non mostra gore e non viene trasformata in un mini-gioco di mira.

## Direzione del gioco

- Platformer arcade su canvas con narrativa DOM-first: barra contestuale durante la corsa, overlay a scheda per dialogo, scelta e finale.
- Browser mobile-first e desktop.
- Touch e tastiera.
- Italiano completo.
- Nessuna sfida obbligatoria basata sui riflessi: ogni livello è saltabile con lo stesso esito narrativo.
- Contenuti distinti come **FATTO**, **TESTIMONIANZA**, **IPOTESI**, **LEGGENDA** o **SCONFESSATO**.
- Personaggi umani inventati o compositi, senza rappresentare persone reali.
- Capitoli e livelli sono contenuti dichiarativi compilati insieme al gioco; una meccanica nuova resta isolata dietro il registro dei livelli.

## Direzione tecnica

- TypeScript in modalità strict.
- Vite.
- Interfaccia DOM-first, accessibile e testabile.
- Nessun framework UI o game framework: zero dipendenze runtime.
- Stato narrativo gestito da funzioni pure e contenuti dichiarativi.
- Contenuti narrativi compilati insieme al gioco, senza plugin runtime o codice remoto.
- Test unitari, di integrazione ed end-to-end.
- Salvataggio locale, senza account o backend.
- Analytics facoltativi e limitati a visite aggregate e avvii della partita, senza tracciare ruoli, scelte o finali.

Il platformer è implementato con un modello fisico puro in TypeScript e un rendering canvas procedurale: un framework 2D resta escluso finché non esiste una prova misurata che serva davvero (la procedura è in [`docs/DECISIONS.md`](./docs/DECISIONS.md)). La storia e i controlli accessibili restano comunque nel DOM.

## Principi

- **KISS** — preferire soluzioni piccole, esplicite e comprensibili.
- **Mantenibilità** — moduli con responsabilità chiare e dipendenze direzionate.
- **Testabilità** — logica di gioco indipendente dal browser e dagli asset.
- **Accessibilità** — ogni percorso deve poter essere completato senza suono, mouse o riflessi rapidi.
- **Privacy first** — raccogliere soltanto ciò che è strettamente necessario.
- **Rispetto delle fonti** — nessun finale inventato viene presentato come esito reale.

## Sicurezza e disclaimer

Il gioco non è una guida alla ricerca dell'animale. Non avvicinare, inseguire, spaventare o tentare di catturare animali selvatici o esotici: mantieni le distanze e avvisa le autorità competenti.

La morte resta non grafica. Nel solo percorso del Cacciatore che ha scelto di documentare la scena, il giocatore può esserne direttamente responsabile; il gioco mostra conseguenze, non celebra la violenza e non insegna l'uso di armi.

## Documentazione

Tutte le specifiche di prodotto, storia, architettura, privacy, qualità ed espansione sono raccolte nell'[indice della documentazione](./docs/README.md). Le istruzioni vincolanti per agenti AI e contributori si trovano anche in [`AGENTS.md`](./AGENTS.md).

## Contribuire

Leggi [CONTRIBUTING.md](./CONTRIBUTING.md) prima di aprire una issue o una pull request.

## Licenza

Il progetto usa due licenze, spiegate in [LICENSING.md](./LICENSING.md):

- il **codice** è software libero con licenza [GNU AGPL-3.0-only](./LICENSE): puoi studiarlo, modificarlo e ridistribuirlo, e chi pubblica una versione modificata (anche solo come sito) deve pubblicarne i sorgenti;
- **storia, testi, pixel art, musica e level design** usano [CC BY-NC-SA 4.0](./LICENSE-CONTENT): condivisibili e modificabili citando l'autore, ma **non per scopi commerciali**. Poiché il gioco è inseparabile dai suoi contenuti, l'opera nel suo insieme non può essere venduta.

Il nome **VARANO 2:39** e i personaggi non sono concessi in licenza: una versione derivata deve usare un nome proprio. Immagini, font, musica e altri asset devono essere originali oppure accompagnati da una licenza compatibile e da informazioni chiare sulla provenienza.

Copyright © 2026 Francesco Falanga.
