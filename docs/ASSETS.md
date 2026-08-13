# Registro degli asset

Ogni immagine, sprite, font, effetto sonoro, brano musicale e testo di terze parti deve comparire in questo registro prima del merge.

Non copiare fotografie giornalistiche, meme, stemmi, loghi, musiche o sprite trovati online senza una licenza esplicita compatibile. Una fonte giornalistica usata per verificare un fatto non concede automaticamente il diritto di riutilizzarne fotografie o testi.

## Regole

- Preferire asset originali, coperti dalla licenza contenuti del repository (CC BY-NC-SA 4.0, vedi `LICENSING.md`).
- Se un asset usa un'altra licenza, conservarlo sotto `src/assets/third-party/<id>/` con il relativo file di licenza.
- Registrare autore, URL originale, licenza, data di acquisizione, eventuali modifiche e percorso locale.
- Non usare asset con clausole `NC` se si vuole preservare la libertà di riuso del progetto.
- Non importare risorse con provenienza incerta.
- Le immagini reali di persone non sono ammesse.
- L'arma del Cacciatore può apparire come oggetto narrativo non dettagliato; non creare animazioni di mira, sparo, impatto, ferite o corpo.
- I riferimenti a Mario o ad altri giochi servono soltanto al confronto di genere: non sono fonti di asset, level design, musica o identità visiva.

## Registro

| ID                              | Percorso                             | Tipo                | Autore            | Fonte                                                | Licenza         | Modifiche | Verificato il |
| ------------------------------- | ------------------------------------ | ------------------- | ----------------- | ---------------------------------------------------- | --------------- | --------- | ------------- |
| `core.asset.scene.field-night`  | `src/assets/scenes/field-night.svg`  | Fondale SVG 320×180 | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | 1/8/26        |
| `core.asset.scene.field-run`    | `src/assets/scenes/field-run.svg`    | Fondale SVG 768×180 | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | 1/8/26        |
| `core.asset.sprite.varano-tail` | `src/assets/sprites/varano-tail.svg` | Sprite SVG 160×64   | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | 1/8/26        |
| `core.asset.sprite.varano-run`  | `src/assets/sprites/varano-run.svg`  | Sprite SVG 32×18    | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | 1/8/26        |
| Icone PWA                       | `public/icons/*.png`                 | Icone 180/192/512   | Francesco Falanga | Originale (generate da `scripts/generate-icons.mjs`) | CC BY-NC-SA 4.0 | Nessuna   | 2/8/26        |

I quattro SVG restano nel manifest ma **oggi nessuna schermata li mostra**: sono i residui del prototipo a scene, raggiungibili soltanto da nodi `scene` e `surprise` che il pack pubblicato non contiene. Vanno rimossi insieme ai relativi tipi di nodo, o riusati, con una decisione registrata: nel frattempo sono qui per completezza del registro, non perché il gioco li carichi.

**Tutto ciò che il giocatore vede davvero è generato dal codice**: i dieci livelli, i loro fondali, gli sprite, gli ostacoli, i veicoli, le card condivisibili e l'audio chiptune sono disegnati o sintetizzati proceduralmente (canvas 2D e WebAudio), senza file esterni. Rientrano qui i curiosi e la troupe del Livello 8, l'acqua del fossato e il furgoncino dei gadget del Livello 9, le mura del Livello 10, e per la lunga notte i droni, le transenne, la zattera, le nutrie in costume, lo stendibiancheria e le terrazze all'alba. Il furgoncino è un veicolo generico inventato, senza marchio, targa o livrea riconducibili a mezzi reali. Nessun elemento riproduce fotografie, loghi, stemmi, marchi di emittenti, persone, edifici, percorsi reali o materiale di altri videogiochi.

Ogni livello dichiara il proprio fondale (ADR-033): cielo, ora del giorno, strato lontano e strato vicino sono dati, non codice, e `tests/unit/backdrop.test.ts` verifica che due livelli vicini non si somiglino.
