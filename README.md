# VARANO 2:39

_An open-source narrative browser game inspired by a bizarre true story from Northern Italy._

**Four points of view. Six hills. One photo at 2:39 a.m.**

<p align="center">
  <a href="https://app.varano239.it">
    <img src="https://varano239.it/og-image.png" alt="VARANO 2:39 — The Mystery of the Six Hills, an invented pixel-art reconstruction" width="960" />
  </a>
</p>

<p align="center">
  <strong><a href="https://app.varano239.it">PLAY NOW</a></strong><br />
  10 levels · 4 roles · 6 endings · ~20 minutes<br />
  Free · In your browser · No download · No account
</p>

## What is VARANO 2:39?

A free, open-source narrative game, recommended for a **12+** audience, loosely inspired by the mysterious reptile spotted in the countryside near Montichiari, Italy, in July 2026.

The game mixes documented news, contradictory witness accounts and a pixel-art legend. The monitor lizard is always the protagonist: it can be chased, protected, played by you, or crowned the improbable Count of Castello Bonoris.

The playable scenes are always marked **LEGEND — an invented reconstruction**. The documented facts and their sources stay in the editorial archive, [`docs/SOURCES.md`](./docs/SOURCES.md), linked from the credits (ADR-024). The **2:39** time also remains a time reported by the press.

A second mystery stays open on purpose: **where did the monitor lizard come from?** The game does not solve it. Escape and abandonment remain reported, unverified hypotheses — everything the game adds is declared LEGEND.

## Game features

- **10 levels** in a single campaign (~20 minutes), each with its own background, chiptune track, three clues, checkpoint, a cameo of the lizard and a bonus star reachable only with the role's superpower;
- **4 perspectives**: Hunter, Wildlife Guardian, Hero Mayor and the Monitor Lizard itself — each with its own goal, superpower and dialogue in every chapter;
- **6 endings**: the story changes with what you do — and the game invites you to replay with another role;
- **3 lives per attempt** (ADR-041), no enemies and no timer; «Skip the level» is always available and produces the same story outcome;
- **six seals** collected in the hill interludes unlock the «Count of the Six Hills» ending, and the lizard's condition is visible in the briefing;
- **level result card** (ADR-056) and **«La Collezione»** (ADR-057), the local archive of the ten levels with your best result in each;
- **shareable meme card** at the end of a campaign and a postcard of your score, both generated on your device (ADR-026/049);
- in-game menu with settings (character, audio, text scale, high contrast), Collection, credits, privacy and terms; the credits reach the sources register;
- **installable PWA** with atomic offline, announced updates and a visible version number in settings (ADR-054).

The edition is a single, 12+, playful-tone release (ADR-022). The arcade mode is the default for everyone (ADR-046): no system signal hides it, and the assisted path stays available in the Story and Calm modes. Current work focuses on performance, usability and the existing levels — not new chapters.

## The real story

In July 2026 somebody photographed a monitor lizard wandering the fields near Montichiari, a small town in northern Italy. The pages and the local press told the story at 2:39 a.m., when the trail went cold.

VARANO 2:39 takes that news story and builds a fully playable story around it.

**News where it is documented. Legend where the game begins.** The sources of the documented facts are listed in [`docs/SOURCES.md`](./docs/SOURCES.md).

## Technical highlights

- **TypeScript strict** with Vite, **zero runtime dependencies** — no UI framework, no game framework, no external runtime;
- **DOM-first, accessible UI**: Canvas for the pixel-art scenes, semantic HTML for menus, dialogue, choices and endings; completable without sound, mouse or quick reflexes (12+);
- **purity**: narrative state driven by pure functions over a single `GameState`; the platformer uses a pure physics model (ADR-018);
- **declarative content**: chapters and levels are typed data compiled alongside the game — no remote scripts, no runtime plugin system [`docs/EXPANSIONS.md`](./docs/EXPANSIONS.md);
- **complete Italian and English editions** (ADR-060): same message keys, same placeholders, no silent fallback;
- **privacy-first analytics** (optional, disabled by default): visits and a fixed set of aggregate milestones, no identifiers, no choices, no endings (ADR-059);
- **local save only** — no account, no backend;
- **tested**: unit, integration and end-to-end tests, keyboard/touch/reduced-motion verified.

## Architecture & documentation

All product, story, architecture, privacy, quality and expansion specifications live in the [documentation index](./docs/README.md). Binding instructions for AI agents and contributors are also in [`AGENTS.md`](./AGENTS.md). `docs/DECISIONS.md` records every architectural decision (ADR).

## Local development

Prerequisites:

- Node.js 24 LTS, pinned in [`.nvmrc`](./.nvmrc);
- npm;
- Chromium for end-to-end tests.

Initial setup:

```sh
nvm use
npm ci
npx playwright install chromium
```

Commands:

| Command                | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start the Vite development server.                                   |
| `npm run preview`      | Serve the latest production build locally.                           |
| `npm run build`        | Type-check and generate `dist/`.                                     |
| `npm run typecheck`    | Run TypeScript strict without emitting files.                        |
| `npm run lint`         | Run ESLint without accepting warnings.                               |
| `npm run format`       | Format supported files with Prettier.                                |
| `npm run format:check` | Verify formatting without modifying files.                           |
| `npm run test`         | Run unit and DOM tests with Vitest.                                  |
| `npm run test:e2e`     | Run Playwright and axe against a `/`-based build.                    |
| `npm run validate`     | Compile the contracts and validate graph, sources, assets, messages. |
| `npm run size`         | Enforce the bundle budget (80 KB JS / 10 KB CSS gzip).               |
| `npm run dist`         | Build the portable zip `varano239-web.zip` for portals (FASE 8).     |
| `npm run marketing`    | Generate the marketing asset pack in `marketing/` (FASE 12).         |
| `npm run check`        | Run every gate defined in `docs/QUALITY.md`, in order.               |

The build uses base `/` (Netlify, ADR-020). The configuration accepts `VITE_BASE_PATH` for other subpaths; use the same base for build and preview. The build has no runtime dependencies and loads no remote fonts, scripts or assets.

### Distributable web build

`npm run dist` produces `varano239-web.zip` (contents in `dist-dist/`) for portals that host the game in an iframe, starting with itch.io. It rebuilds with a **relative base** (`./`) and **without the service worker** (portal iframes cannot register one), then fails if the artifact keeps absolute asset paths or depends on the production domains. `index.html` sits at the zip root. The zip is gitignored and regenerated on demand.

### Marketing asset pack

`npm run marketing` writes the distribution assets used by the landing page, itch.io and the press into `marketing/`: a transparent logo, covers (landscape/square/portrait), the Open Graph image, screenshots captured from the running game, an example share card, a short gameplay GIF and two silent preview videos. The brand SVGs are the source of truth and are rasterized to PNG; the screenshots, GIF and videos are driven through the real game with Playwright and assembled with ffmpeg. See `docs/ASSETS.md` for the full registry. Ready-to-use copy for itch.io, press, Reddit, Hacker News and LinkedIn lives in `marketing/copy-kit.md`.

Pull requests produce a downloadable preview artifact after the quality gate, and pushes on `main` re-run `npm run check` on the merge result. Publishing is separate: **Netlify** builds `main` on its own and serves it at [app.varano239.it](https://app.varano239.it), so the gate is the signal, not the lock — a red run on `main` means the live build needs a look. The landing page is at [varano239.it](https://varano239.it).

## Game direction

- Arcade platformer on canvas with DOM-first narrative: contextual bar during the run, card overlay for dialogue, choice and ending.
- Mobile-first and desktop browser.
- Touch and keyboard.
- Complete Italian and English editions.
- No mandatory reflex challenge: every level is skippable with the same story outcome.
- Content distinguished as **FACT**, **TESTIMONY**, **HYPOTHESIS**, **LEGEND** or **RECANTED**.
- Human characters are invented or composite and never represent real people.
- Chapters and levels are declarative content compiled with the game; a new mechanic stays isolated behind the level register.

## Safety & disclaimer

The game is not a guide to find the animal. Do not approach, chase, startle or try to catch wild or exotic animals: keep your distance and alert the competent authorities.

Death remains non-graphic. Only in the Hunter's path, when he chose «Document the scene» in the prologue, the player can be directly responsible for it; the game shows consequences, does not celebrate violence and does not teach weapon use.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or a pull request.

## Licensing

The project uses two licenses, explained in [LICENSING.md](./LICENSING.md):

- the **code** is free software under [GNU AGPL-3.0-only](./LICENSE): you can study, modify and redistribute it, and whoever publishes a modified version (even as a website) must publish its source code;
- **story, text, pixel art, music and level design** use [CC BY-NC-SA 4.0](./LICENSE-CONTENT): shareable and modifiable with attribution, but **not for commercial purposes**. Because the game is inseparable from its content, the work as a whole cannot be sold.

The name **VARANO 2:39** and the characters are not licensed: a derivative version must use its own name. Images, fonts, music and other assets must be original or accompanied by a compatible license and clear provenance information.

---

## Italiano

VARANO 2:39 è un videogioco narrativo gratuito e open-source ispirato al misterioso varano avvistato nei campi di Montichiari nel luglio 2026: dieci livelli, quattro ruoli, sei finali e circa venti minuti di gioco, direttamente nel browser, senza account.

- **Gioca subito**: [app.varano239.it](https://app.varano239.it)
- **Landing page**: [varano239.it](https://varano239.it)
- **Documentazione**: [`docs/README.md`](./docs/README.md)

Copyright © 2026 Francesco Falanga.
