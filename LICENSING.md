# Licenze di VARANO 2:39

Copyright © 2026 **Francesco Falanga**.

Il progetto usa **due licenze diverse**, una per il programma e una per l'opera creativa:

| Parte                                                        | Licenza                                                        |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| **Codice** (motore, logica, build, test)                     | [GNU AGPL-3.0-only](./LICENSE)                                 |
| **Contenuti** (storia, testi, grafica, musica, level design) | [CC BY-NC-SA 4.0](./LICENSE-CONTENT) — **uso non commerciale** |
| **Nome, titolo e personaggi**                                | Nessuna licenza concessa (vedi «Nome e identità»)              |

## In breve

- Puoi **studiare, modificare e ridistribuire** il gioco, anche pubblicando la tua versione.
- Se pubblichi una versione modificata, anche solo come servizio web, devi **pubblicarne i sorgenti** (AGPL) e **citare l'autore** mantenendo questa nota (CC BY).
- **Non puoi vendere il gioco né usarlo per scopi commerciali**: i contenuti sono `NonCommercial`. Poiché il gioco è inseparabile dalla propria storia, grafica e musica, questo vale per l'opera nel suo insieme.
- Il codice del motore, preso da solo e senza i contenuti, resta software libero riusabile secondo l'AGPL.

## Che cosa è «Contenuto»

Sono contenuti sotto CC BY-NC-SA 4.0:

- `src/content/**` — catalogo dei messaggi, dialoghi, grafo narrativo e dati di storia;
- `src/assets/**` e `public/icons/**` — grafica originale;
- `docs/**` — documentazione pubblica del progetto;
- all'interno dei file di codice, **l'espressione creativa** e non la logica di programma:
  - i motivi musicali e le sequenze di note in `src/platform/audio/chiptune-audio.ts`;
  - la composizione pixel-art, le palette e le routine di disegno di scena e sprite in `src/platform/dom/score-card.ts` e `src/levels/adapters/platformer.ts`;
  - il level design (terreno, piattaforme, indizi, bandierine, traguardo) in `src/levels/registry.ts`.

Tutto il resto — reducer, macchina a stati, fisica, adapter di piattaforma, configurazioni, script e test — è **codice** sotto AGPL-3.0-only.

Dove un file contiene entrambe le cose, la regola è: **come si comporta il programma** è codice, **cosa si vede, si legge e si ascolta** è contenuto.

## Come citare

> VARANO 2:39 — Il mistero dei Sei Colli, di Francesco Falanga
> https://github.com/ceccode/varano-239 — CC BY-NC-SA 4.0

## Nome e identità

Il titolo **VARANO 2:39**, il sottotitolo **Il mistero dei Sei Colli**, i personaggi inventati (Ada Cartella, Toni Pista, Marta Ramarro, Cesare Cerimonia, il Varano) e il comune immaginario di Borgocoda **non sono coperti dalle licenze sopra**: nessun diritto sul nome o sull'identità del progetto viene concesso. Una versione derivata deve usare un nome proprio e chiarire di non essere quella ufficiale.

Montichiari e il Castello Bonoris sono luoghi reali citati come tali: il gioco non attribuisce loro fatti inventati e non rappresenta persone reali (vedi `docs/SOURCES.md`).

## Contributi

Chi contribuisce accetta di rilasciare il proprio contributo con le stesse licenze: AGPL-3.0-only per il codice, CC BY-NC-SA 4.0 per i contenuti.
