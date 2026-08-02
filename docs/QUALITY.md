# Strategia di qualità

## Contratto della CI

`npm run check` deve eseguire, in ordine fail-fast:

1. `npm run format:check`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run validate`
5. `npm run test -- --coverage`
6. `npm run build`
7. `npm run test:e2e`

Il repository non è pronto per il merge se uno di questi comandi fallisce. La CI usa una versione LTS di Node fissata in `.nvmrc` e il lockfile viene committato.

## Strumenti di sviluppo

Dipendenze di sviluppo iniziali:

- Vite e TypeScript;
- ESLint con `typescript-eslint`;
- Prettier;
- Vitest e coverage V8;
- Testing Library DOM;
- Playwright;
- `@axe-core/playwright`.

Non aggiungere una dipendenza runtime per test, formattazione o utilità di build.

## TypeScript

Configurazione minima:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Ogni `switch` su union discriminate deve essere esaustivo. `any`, asserzioni non-null e cast doppi richiedono una motivazione nel codice e review esplicita.

## Piramide dei test

### Unit test

Veloci, senza DOM e senza rete:

- reducer per ogni fase e azione;
- condizioni ed effetti;
- calcolo deterministico degli esiti;
- clamp dei punteggi;
- casualità con seed;
- migrazioni del salvataggio;
- fallback al `coreCheckpointNodeId` con rimozione completa di tutti i riferimenti namespaced di un pack assente e della relativa versione attiva;
- snapshot `activePackVersions`: un pack aggiunto alla build non entra a metà di un vecchio salvataggio;
- composizione distinta `new-run | resume`, incluse versione diversa, pack opzionale assente e core incompatibile;
- fallback italiano per il dialetto;
- allowlist analytics.

### Test dei contenuti

`validateContent()` deve verificare:

- ID unici e riferimenti esistenti;
- grafo raggiungibile e senza cicli privi di uscita;
- tutte le combinazioni cartesiane supportate `role × approach × sensitivity × storyScope` arrivano a un finale: 48 con i valori correnti;
- ogni profondità del mistero torna al percorso core senza rompere una specifica combinazione di ruolo, approccio o sensibilità;
- `gentle` non raggiunge mai esiti postumi;
- `killedByHunter` è raggiungibile soltanto con `hunter + evidence + complete`, dopo una conferma aggiuntiva e con almeno due alternative non letali;
- ruoli o approcci diversi non possono causare direttamente la morte del Varano;
- ogni famiglia di finale descritta nel game design privato è raggiungibile da almeno un percorso, e quelle con esito postumo soltanto in `complete`;
- tutte le carte FATTO, TESTIMONIANZA e IPOTESI hanno fonti conformi;
- ogni LEGGENDA ha un avviso di finzione e ogni SCONFESSATO una confutazione;
- nessun indizio sull'origine o premio è esclusivo dell'abbattimento;
- ogni Story Pack rispetta namespace, dipendenze, punti d'innesto, uscita e finali core;
- un mistero con teorie diverse dal Dossier Origini non richiede modifiche al core;
- ogni nodo giocabile è LEGGENDA e mantiene il banner; la fotografia attendibile e l'orario 2:39 restano due schede distinte, FATTO e TESTIMONIANZA;
- `EndingNode`, `ChapterEndNode` e `LevelNode` non accettano uscite estranee al proprio contratto;
- ogni `ChapterEndNode` core non terminale ha una sola rotta base; un capitolo opzionale dichiara `exitNodeId`, `insertion.at` esistente e `insertion.order` intero non negativo;
- opzione ed epilogo letali hanno `sensitivityTags: ["impliedAnimalDeath"]`;
- ogni testo italiano, asset e nome accessibile esiste;
- ogni sorpresa ha un `hostSceneNodeId` valido e nessun popup compare in una scena `noSurprise`;
- le battute dialettali non contengono informazioni uniche.

La validazione enumera tutte le diramazioni finite dell'MVP. Se il numero cresce troppo, è un segnale di scope eccessivo, non un motivo per saltare il test.

### Test DOM

Per ciascuna feature verificare comportamento, non markup accidentale:

- nome e ruolo accessibile;
- attivazione con tastiera;
- focus iniziale e restituzione del focus dopo modal/popup;
- elenco testuale equivalente agli hotspot;
- dimensione testo e alto contrasto;
- riduzione del movimento;
- rendering sicuro con `textContent`.

### End-to-end

Flussi minimi:

1. una partita per ciascun ruolo fino al finale previsto dal game design privato;
2. Cacciatore `complete + evidence`: annullamento sicuro della scelta letale e finale vivo;
3. Cacciatore `complete + evidence`: conferma dell'abbattimento fuori campo e relativo epilogo;
4. Custode, Sindaco e Varano senza accesso alla scelta letale;
5. pacchetto opzionale completato, saltato e rimosso da un salvataggio compatibile;
6. salvataggio, ricarica, ripresa e cancellazione dati;
7. Modalità Storia con salto di ogni sfida;
8. Modalità Calma e `prefers-reduced-motion` senza popup animati;
9. percorso completo con sola tastiera;
10. analytics configurati e non configurati come descritto in `PRIVACY.md`;
11. apertura di una fonte esterna dal menù.

Per M1R la suite verifica inoltre movimento reale con tastiera, pressione dei controlli touch, presenza del salto equivalente, assenza del loop real-time con movimento ridotto e salvataggio/ripresa dal `LevelNode`.

Ogni adapter di livello usa la stessa suite contrattuale: configurazione presente, completamento, salto equivalente e `destroy()` senza timer o listener residui.

Eseguire almeno su profili Playwright mobile compatto, mobile grande e desktop Chromium. Prima del rilascio aggiungere uno smoke test su Firefox e WebKit.

## Coverage

- `core`, migrazioni e validazione contenuti: minimo 90% branch e line.
- totale TypeScript: minimo 80% line.
- nessun obiettivo quantitativo per CSS, cataloghi testuali o asset.

Il coverage non sostituisce i test dei comportamenti critici. Non scrivere test vuoti per raggiungere la soglia.

## Accessibilità

Obiettivo: WCAG 2.2 livello AA per i flussi essenziali.

- Tutto è usabile con tastiera e touch.
- Target touch di almeno 44×44 CSS pixel quando possibile.
- Focus sempre visibile.
- Testo ridimensionabile al 200% senza perdita di contenuto o azioni.
- Nessuna informazione affidata soltanto a colore, suono, movimento o posizione nella scena.
- Sottotitoli/testo per ogni cue audio informativo.
- Nessun timer obbligatorio.
- Popup annunciato in modo non invasivo oppure ignorato dagli screen reader se puramente decorativo.
- Dialoghi modali con titolo, chiusura e focus trap corretti.
- La conferma dell'abbattimento apre con il focus su «Torna indietro» e non accetta attivazioni accidentali.
- La scena postuma non usa immagini ambigue o sorprendenti.

L'analisi automatica con axe è necessaria ma non sufficiente. Ogni milestone richiede una prova manuale di tastiera e zoom.

## Compatibilità

Supporto target al lancio:

- ultime due versioni stabili di Chrome, Safari, Firefox ed Edge;
- Safari iOS e Chrome Android correnti;
- viewport da 320 CSS pixel in su;
- orientamento verticale e orizzontale senza obbligo di rotazione.

Il gioco degrada senza Web Audio, analytics o persistenza. Richiede JavaScript per la partita, ma il documento HTML mostra titolo, descrizione, disclaimer e link all'Archivio/fonti anche se il bootstrap fallisce.

## Performance

- JavaScript iniziale: massimo 150 KB gzip, asset esclusi.
- Primo caricamento giocabile: massimo 2 MB su rete, font compresi.
- Nessun font remoto; preferire font di sistema o bitmap originale incluso.
- Asset per capitolo caricati quando necessario.
- Immagini con dimensioni dichiarate per evitare salti di layout.
- Nessun task lungo oltre 100 ms durante dialoghi e scelte su telefono rappresentativo.
- Lighthouse mobile come segnale diagnostico, non come unico criterio.

## Sicurezza

- Nessun HTML proveniente dai cataloghi; usare `textContent`.
- Nessun `eval`, `new Function`, script inline non necessario o contenuto remoto dinamico.
- Link esterni con indicazione chiara e `rel="noopener noreferrer"` quando aprono una nuova scheda.
- Content Security Policy restrittiva.
- Dipendenze bloccate da lockfile e aggiornate con PR verificabili.
- Nessuna chiave segreta nel client o nelle variabili `VITE_*`.

## Review dei contenuti 12+

Prima del rilascio, una persona diversa dall'autore controlla:

- assenza di parolacce, minacce esplicite, gore e umorismo sul corpo;
- comprensibilità per un lettore dai dodici anni, senza infantilizzare gli adulti;
- distinzione visiva e verbale di fatti, testimonianze, ipotesi, leggende e piste sconfessate;
- assenza di somiglianze intenzionali con persone reali;
- Sindaco Eroe e Cacciatore riconoscibili come archetipi LEGGENDA anche in screenshot privi di contesto;
- assenza di istruzioni che incoraggino una ricerca nel mondo reale;
- rispetto nei finali postumi e nell'abbattimento, senza rappresentazioni grafiche o ricompense;
- battute dialettali revisionate da persona competente.

## Checklist di rilascio

- `npm run check` verde su commit pulito.
- Nessun errore console nei flussi E2E.
- Test manuale su almeno un iPhone/iPad, un Android e un desktop.
- Privacy notice con dati reali del titolare.
- Endpoint analytics e raccolta dati verificati nel pannello provider.
- `SOURCES.md` e data dell'Archivio aggiornati.
- `ASSETS.md` completo e senza placeholder.
- Licenze di terze parti presenti.
- URL di produzione su Netlify (app.varano239.it) provato da finestra privata.
- Tag di versione e changelog.
