# Changelog

Tutte le modifiche notevoli a VARANO 2:39 sono riportate in questo file. Il formato segue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); il progetto segue [Semantic Versioning](https://semver.org/). I numeri delle decisioni fanno riferimento a `docs/DECISIONS.md` (ADR).

## [v1.1.0] — 2026-09-05

### Added

- **FINALE X/6**: la card di fine campagna numera il finale raggiunto e il gioco ricorda in locale quali dei sei finali sono stati scoperti (FASE 4 del piano di lancio).
- **Build distribuibile per i portali** (`npm run dist`): `varano239-web.zip` con base relativa e senza service worker, pensato per l'iframe di itch.io e degli altri portali (FASE 8).
- **Asset pack di marketing** (`npm run marketing`): logo, cover, screenshot, GIF e clip in `marketing/` (FASE 12).
- **Copy kit** in `marketing/copy-kit.md`: testi pronti per landing, itch.io, stampa, Reddit, Hacker News e LinkedIn, in italiano e inglese (FASE 13).

### Changed

- Lo strumento di contabilità dello sviluppo AI si chiama **evidtrail** (ADR-061): stesso tool, stesso trailer `AI-Mode`; l'hook di commit si installa da solo a ogni `npm ci`.
- Il gate di qualità gira anche sui push a `main`, non solo sulle pull request.

## [v1.0.0] — 2026-08-27

### Added

- Campagna completa: **10 livelli** in un'unica notte attraverso i Sei Colli, **4 ruoli** giocabili, **6 finali** (ADR-047).
- **La Collezione** (ADR-057): archivio locale dei dieci livelli con il miglior risultato per ciascuno.
- **Card di fine livello** (ADR-056) e card-meme/finali condivisibili generate sul dispositivo (ADR-026/049).
- **Varietà arcade** (ADR-042/043/044): musica per livello, dialoghi a bolle, micro-scelte, montacarichi, stella della Leggenda e cameo.
- **PWA installabile** con offline atomico, aggiornamenti annunciati e versione visibile (ADR-054).
- **Edizione inglese completa** (ADR-060): `/en/` con cataloghi equivalenti, metadata canonici e selezione della lingua.
- **Funnel analytics aggregato** (ADR-059): visita, `game_start`, milestone dei livelli 1/3/6/10, completamento, condivisione e replay, privacy-first.

### Changed

- Il platformer **arcade è il default per tutti** (ADR-046): nessun segnale di sistema nasconde la parte giocata; il percorso assistito resta nelle modalità Story/Calm.
- **Salvataggio tollerante** (ADR-053): impostazioni dichiarate diventano reali (contrasto, scala del testo) e i salvataggi vecchi migrano senza perdite.
- **Qualità verificata**, non promessa (ADR-052): budget di bundle, typecheck, lint, formattazione, validazione e test come gate automatici.
- **Documentazione allineata al gioco** (ADR-058): la documentazione pubblica descrive ciò che esiste.

### Fixed

- Menù e livello non si combattono più (ADR-050).
- Metadata e fallback statici aggiornati alla campagna completa e al launch funnel.
- Testi, asset e grafo narrativo coerenti con la campagna chiusa.

### Notes

- Licenza: codice **AGPL-3.0-only**, contenuti **CC BY-NC-SA 4.0**, nome e personaggi non concessi in licenza.
- Una sola edizione, pubblico **12+**, tono goliardico e scherzoso (ADR-022).

[v1.1.0]: https://github.com/ceccode/varano-239/releases/tag/v1.1.0
[v1.0.0]: https://github.com/ceccode/varano-239/releases/tag/v1.0.0
