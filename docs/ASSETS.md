# Registro degli asset

Ogni immagine, sprite, font, effetto sonoro, brano musicale e testo di terze parti deve comparire in questo registro prima del merge.

Non copiare fotografie giornalistiche, meme, stemmi, loghi, musiche o sprite trovati online senza una licenza esplicita compatibile. Una fonte giornalistica usata per verificare un fatto non concede automaticamente il diritto di riutilizzarne fotografie o testi.

## Regole

- Preferire asset originali, coperti dalla licenza contenuti del repository (CC BY-NC-SA 4.0, vedi `LICENSING.md`).
- Se un asset usa un'altra licenza, conservarlo sotto `src/assets/third-party/<id>/` con il relativo file di licenza.
- Registrare autore, URL originale, licenza, data di acquisizione, eventuali modifiche e percorso locale.
- Non usare asset con clausole `NC` se si vuole preservare la libertà di riuso del progetto.
- Non importare risorse con provenienza incerta.
- Le immagini reali di persone non sono ammesse nell'MVP.
- L'arma del Cacciatore può apparire come oggetto narrativo non dettagliato; non creare animazioni di mira, sparo, impatto, ferite o corpo.
- I riferimenti a Mario o ad altri giochi servono soltanto al confronto di genere: non sono fonti di asset, level design, musica o identità visiva.

## Registro

| ID                              | Percorso                             | Tipo                | Autore            | Fonte                                                | Licenza         | Modifiche | Verificato da            |
| ------------------------------- | ------------------------------------ | ------------------- | ----------------- | ---------------------------------------------------- | --------------- | --------- | ------------------------ |
| `core.asset.scene.field-night`  | `src/assets/scenes/field-night.svg`  | Fondale SVG 320×180 | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | Quality gate M1, 1/8/26  |
| `core.asset.scene.field-run`    | `src/assets/scenes/field-run.svg`    | Fondale SVG 768×180 | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | Quality gate M1R, 1/8/26 |
| `core.asset.sprite.varano-tail` | `src/assets/sprites/varano-tail.svg` | Sprite SVG 160×64   | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | Quality gate M1, 1/8/26  |
| `core.asset.sprite.varano-run`  | `src/assets/sprites/varano-run.svg`  | Sprite SVG 32×18    | Francesco Falanga | Originale                                            | CC BY-NC-SA 4.0 | Nessuna   | Quality gate M1R, 1/8/26 |
| Icone PWA                       | `public/icons/*.png`                 | Icone 180/192/512   | Francesco Falanga | Originale (generate da `scripts/generate-icons.mjs`) | CC BY-NC-SA 4.0 | Nessuna   | Quality gate M1P, 2/8/26 |

La scena del Livello 1, gli sprite e l'audio chiptune di M1P sono disegnati/sintetizzati proceduralmente dal codice (canvas 2D e WebAudio), senza file esterni. Gli asset sono originali e temporanei. Non riproducono fotografie, loghi, stemmi, persone, edifici, percorsi reali o materiale di altri videogiochi e possono essere sostituiti dopo il playtest senza cambiare il grafo narrativo.
