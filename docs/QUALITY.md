# Strategia di qualità

## Contratto della CI

`npm run check` esegue, in ordine fail-fast:

1. `npm run format:check`
2. `npm run lint` (zero warning ammessi)
3. `npm run typecheck`
4. `npm run validate`
5. `npm run test -- --coverage`
6. `npm run build`
7. `npm run size`
8. `npm run test:e2e`

Il repository non è pronto per il merge se uno di questi comandi fallisce. La CI usa una versione LTS di Node fissata in `.nvmrc` e il lockfile viene committato.

Ogni livello e ogni feature arrivano come **draft PR**: il proprietario la prova prima che diventi Ready for review, e il merge su `main` pubblica su Netlify.

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
- clamp dei punteggi;
- collegamento dei capitoli e numerazione dei livelli derivata dal grafo;
- decodifica del salvataggio: tollerante sulle impostazioni, severa sul run, con le migrazioni degli ID rinominati;
- archivio dei livelli: merge best-of, round trip fra sessioni, voce corrotta isolata, JSON rotto, cancellazione;
- modelli fisici per livello, invarianti del registro e budget di disegno;
- allowlist analytics.

### Test dei contenuti

`validateContent()` deve verificare:

- ID unici, dentro il namespace del pack, e riferimenti esistenti;
- ogni nodo raggiungibile dall'ingresso;
- ogni capitolo che dichiara ingresso, checkpoint e uscita dentro sé stesso;
- ciascuno dei quattro ruoli arriva a un finale;
- `killedByHunter` è raggiungibile soltanto dal Cacciatore che ha scelto «Documenta la scena», dopo una conferma con focus su «annulla» e con almeno due alternative non letali sempre visibili;
- opzione ed epilogo letali hanno entrambi `sensitivityTags: ["impliedAnimalDeath"]`;
- nessun indizio o premio è esclusivo dell'abbattimento;
- tutte le carte FATTO, TESTIMONIANZA e IPOTESI hanno fonti conformi;
- ogni LEGGENDA ha un avviso di finzione e ogni SCONFESSATO una confutazione;
- ogni fonte usa HTTPS e date valide;
- ogni nodo giocabile è LEGGENDA e mantiene il banner; la fotografia attendibile e l'orario 2:39 restano due schede distinte, FATTO e TESTIMONIANZA;
- ogni `LevelNode` risolve una coppia `levelId`/`configId` registrata, con le sue chiavi di messaggio;
- ogni testo italiano e inglese, asset e testo alternativo esiste; i due cataloghi hanno chiavi e segnaposto identici;
- ogni sorpresa ha un `hostSceneNodeId` valido e nessun popup compare in una scena `noSurprise`;
- esiste il finale di fallback `core.outcome.open-mystery`.

L'elenco completo e sempre aggiornato è il codice di `src/content/validate-content.ts`: se una regola non è lì, non è verificata.

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

La suite gira su tre profili — mobile compatto (320 px), mobile grande e desktop — e copre:

1. avvio diretto in un gioco accessibile e solo-locale, con scansione axe;
2. la storia intera con la sola tastiera, fino al finale, e la ripartenza;
3. la scelta letale: conferma esplicita, annullamento sicuro, epilogo;
4. menù in-game: impostazioni, credits, privacy, termini e apertura di una fonte esterna;
5. il superpotere del ruolo, per ciascuno dei quattro ruoli;
6. ripresa automatica del salvataggio dopo un reload;
7. con `prefers-reduced-motion` la parte arcade parte comunque (ADR-046);
8. il livello resta vivo togliendo la musica dal menù, e la posizione non si azzera (ADR-050);
9. pausa dichiarata e «Riprova il livello» dal menù (ADR-051);
10. la card di fine livello e la riga corrispondente nella Collezione (ADR-056/057);
11. controlli touch, con l'azione di salto equivalente sempre disponibile;
12. senza JavaScript, il documento resta leggibile.

Axe non gira solo sulla prima schermata: scandisce anche il menù aperto, la scheda di briefing, il dialogo di conferma della scelta letale, la schermata di finale con la card-meme e il tema ad alto contrasto.

Ogni adapter di livello usa la stessa suite contrattuale: configurazione presente, completamento, salto equivalente e `destroy()` senza timer o listener residui.

Prima del rilascio aggiungere uno smoke test su Firefox e WebKit.

## Coverage

- Soglia applicata da `vitest.config.ts` e quindi dal gate: **80% su branch, funzioni, righe e statement** su tutto `src/`.
- Esclusi dal calcolo i soli file di puri tipi (`core/model.ts`, `content/dossier.ts`, `content/story-pack.ts`) e `main.ts`, che è il bootstrap del browser.
- Nessun obiettivo quantitativo per CSS, cataloghi testuali o asset.

Il coverage non sostituisce i test dei comportamenti critici. Non scrivere test vuoti per raggiungere la soglia.

## Accessibilità

Obiettivo: WCAG 2.2 livello AA per i flussi essenziali.

- Tutto è usabile con tastiera e touch.
- Target touch di almeno 44×44 CSS pixel quando possibile.
- Focus sempre visibile.
- Testo ridimensionabile al 200% (la scala in-app di ADR-053 copre il primo tratto; lo zoom del browser resta pienamente supportato) senza perdita di contenuto o azioni.
- Nessuna informazione affidata soltanto a colore, suono, movimento o posizione nella scena.
- Sottotitoli/testo per ogni cue audio informativo.
- Nessun timer obbligatorio.
- Popup annunciato in modo non invasivo oppure ignorato dagli screen reader se puramente decorativo.
- Dialoghi modali con titolo, chiusura e focus trap corretti.
- La conferma dell'abbattimento apre con il focus su «Torna indietro» e non accetta attivazioni accidentali.
- La scena postuma non usa immagini ambigue o sorprendenti.

L'analisi automatica con axe è necessaria ma non sufficiente: ogni PR che tocca l'interfaccia richiede una prova manuale di tastiera e zoom.

## Compatibilità

Supporto target al lancio:

- ultime due versioni stabili di Chrome, Safari, Firefox ed Edge;
- Safari iOS e Chrome Android correnti;
- viewport da 320 CSS pixel in su;
- orientamento verticale e orizzontale senza obbligo di rotazione.

Il gioco degrada senza Web Audio, analytics o persistenza. Richiede JavaScript per la partita, ma il documento HTML mostra titolo, descrizione, disclaimer e link all'Archivio/fonti anche se il bootstrap fallisce.

## Performance

- JavaScript iniziale: tetto verificato da `npm run size` in `npm run check` — 60 KB gzip per il JS e 10 KB per il CSS (ADR-052), ben dentro il vecchio budget dichiarato di 150 KB.
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
- rispetto nei finali postumi e nell'abbattimento, senza rappresentazioni grafiche o ricompense.

## Checklist di rilascio

- `npm run check` verde su commit pulito.
- Nessun errore console nei flussi E2E.
- Test manuale su almeno un iPhone/iPad, un Android e un desktop.
- Privacy notice con dati reali del titolare.
- Endpoint analytics e raccolta dati verificati nel pannello provider.
- `SOURCES.md` e data dell'Archivio aggiornati.
- `ASSETS.md` completo e senza placeholder.
- URL di produzione su Netlify (app.varano239.it) provato da finestra privata.
- Prova offline manuale sulla deploy preview per ogni PR che tocca il service worker.
- Versione visibile nelle impostazioni coerente con il deploy (ADR-054).
