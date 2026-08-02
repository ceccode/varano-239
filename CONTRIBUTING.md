# Contribuire a VARANO 2:39

Grazie per voler contribuire. Il progetto è amatoriale, gratuito e pensato per essere comprensibile anche a chi incontra il codice per la prima volta.

## Regole fondamentali

- Pubblico 12+: niente parolacce o gore. La sola violenza letale diretta ammessa è la scelta finale `hunter + evidence + complete`.
- Il Varano resta il protagonista narrativo in ogni percorso.
- Le persone umane sono inventate o composite.
- Le scene giocabili sono sempre marcate LEGGENDA; i fatti reali compaiono in schede attribuite e nell'Archivio.
- Il Sindaco Eroe governa il comune totalmente fittizio di Borgocoda, guida soltanto la propria delegazione in un'esercitazione inventata e non riproduce il sindaco reale; il Cacciatore armato è LEGGENDA dalla prima apparizione.
- I finali sono versioni alternative e non devono sembrare cronaca reale.
- Fuga, abbandono e complotto sono teorie narrative: nessuna può accusare persone o organizzazioni reali.
- Fatti, testimonianze, ipotesi, leggende e piste sconfessate devono essere distinguibili nei dati e nell'interfaccia.
- Il gioco deve essere completabile con touch, mouse o sola tastiera e senza audio.
- Nessun account, pubblicità, geolocalizzazione, classifica o tracciamento individuale.

## Prima di iniziare

1. Cerca una issue esistente relativa al cambiamento.
2. Se manca, aprine una indicando problema, ambito e criteri di accettazione.
3. Leggi l'[indice delle specifiche](./docs/README.md) e le istruzioni in [`AGENTS.md`](./AGENTS.md).
4. Concorda in anticipo nuove dipendenze runtime, servizi esterni, formati di dati o asset di terze parti.
5. Realizza la più piccola modifica completa e verificabile.

## Ambiente di sviluppo

Usa la versione Node.js indicata in `.nvmrc`, installa dal lockfile e prepara Chromium per i test end-to-end:

```text
nvm use
npm ci
npx playwright install chromium
```

I comandi disponibili sono:

```text
npm run dev
npm run preview
npm run build
npm run typecheck
npm run lint
npm run format
npm run format:check
npm run test
npm run test:e2e
npm run validate
npm run check
```

`npm run check` applica l'intero quality gate in ordine fail-fast. Eseguilo prima di aprire una pull request. La build di produzione usa base `/` (Netlify, ADR-020); usa `VITE_BASE_PATH` se devi testare un sottopercorso diverso.

## Codice

- Usare TypeScript strict e union discriminate per stati, azioni ed esiti.
- Evitare `any`, cast usati per nascondere errori e variabili globali mutabili.
- Tenere il dominio indipendente da DOM, storage, audio e analytics.
- Isolare i side effect dietro interfacce piccole.
- Preferire funzioni esplicite ad astrazioni generiche, event bus, container di dependency injection o plugin system runtime.
- Non introdurre una libreria per risolvere una funzione piccola e stabile.
- Non creare cartelle generiche come `utils`, `helpers`, `common` o `services`.
- Ogni modulo deve avere una responsabilità descrivibile in una frase.
- Nuovi misteri e capitoli sono Story Pack dichiarativi registrati a build time. Un nuovo livello aggiunge un `LevelNode` e, per una nuova meccanica, un adapter isolato nel registro compilato, secondo `docs/EXPANSIONS.md`.
- I bug fix riproducibili devono includere un test di regressione.

## Interfaccia e accessibilità

- Usare HTML semantico e veri elementi `button` per le azioni.
- Mantenere focus visibile e prevedibile dopo dialoghi e popup.
- Offrire un elenco testuale equivalente agli hotspot pixel-art.
- Non affidare informazioni soltanto a colore, suono, posizione o movimento.
- Rispettare `prefers-reduced-motion` e la modalità senza sorprese.
- Ogni mini-gioco deve poter essere saltato con un esito narrativo equivalente.

## Storia e fonti

- Sintetizzare le fonti con parole originali; non copiare articoli o lunghi passaggi.
- Un **FATTO** richiede almeno una fonte autorevole registrata.
- Una **TESTIMONIANZA** richiede una fonte che attribuisca chiaramente il racconto.
- Una **LEGGENDA** non deve sembrare una citazione o un fatto storico.
- **SCONFESSATO** richiede una fonte autorevole di confutazione; scartare una pista inventata non cambia il suo timbro LEGGENDA.
- Specie, dimensioni e destino reale del Varano restano incerti finché non esiste una fonte diretta verificabile.
- Nessuna scena deve incoraggiare visite o ricerche nella zona reale degli avvistamenti.
- La scena postuma e l'abbattimento sono fuori campo, rispettosi e senza gag.
- La scelta «Abbatti il Varano» è disponibile solo a `hunter + evidence + complete`, richiede conferma e non usa mira, precisione o simulazione d'arma.
- Fuga e abbandono restano TESTIMONIANZA o IPOTESI attribuite; reperti, responsabili, organizzazioni, codici e complotti sono LEGGENDA, completamente inventati e non riconoscibili tramite dettagli indiretti.
- Le battute bresciane sono facoltative e richiedono revisione di una persona competente.

## Asset e proprietà intellettuale

- Preferire immagini, sprite, font, musica ed effetti originali.
- Registrare autore, fonte, licenza, modifiche e percorso di ogni asset di terze parti.
- Aprendo una pull request accetti di rilasciare il tuo contributo con le licenze del progetto: AGPL-3.0-only per il codice e CC BY-NC-SA 4.0 per i contenuti (vedi [LICENSING.md](./LICENSING.md)).
- I documenti di trama stanno in `docs/private/` e non sono versionati: non incollare nella pull request finali o colpi di scena non ancora pubblicati.
- Non copiare fotografie giornalistiche, meme, stemmi, loghi o opere di videogiochi esistenti.
- Citare un gioco come riferimento di genere non autorizza a riprodurne personaggi, livelli, grafica o musica.

## Privacy

Gli unici eventi analytics ammessi sono una visita aggregata e l'avvio di una nuova partita, senza proprietà aggiuntive. Non raccogliere ruolo, approccio, sensibilità, capitoli, scelte, finale, posizione o identificatori persistenti.

Il gioco deve funzionare normalmente se analytics, rete o salvataggio locale non sono disponibili.

## Pull request

Una pull request deve:

- risolvere un solo problema ben delimitato;
- descrivere comportamento precedente e nuovo;
- collegare l'issue o il milestone;
- includere test pertinenti;
- includere screenshot o video per cambi visivi;
- aggiornare documentazione, fonti e registro asset quando necessario;
- aggiungere validazione e test di raggiungibilità per ogni nuovo pacchetto narrativo;
- superare `npm run check`.

Evitare di combinare refactor estesi e nuove funzionalità quando possono essere revisionati separatamente.

## Definition of Done

Una modifica è completa quando:

- soddisfa i criteri di accettazione concordati;
- è testata in proporzione al rischio;
- funziona con tastiera, touch e movimento ridotto;
- non amplia dati raccolti o dipendenze senza approvazione;
- aggiorna documentazione e provenienza degli asset;
- non lascia TODO privi di issue o milestone.

## Segnalazioni delicate

Non pubblicare in una issue dettagli sfruttabili relativi a vulnerabilità o dati personali. Prima della release pubblica il maintainer indicherà un canale privato per queste segnalazioni.
