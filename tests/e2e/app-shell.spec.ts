import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { appConfig, appConfigForLocale } from "../../src/app/config";
import {
  registerEnglishMessages,
  resolveMessage,
} from "../../src/content/locales";
import { englishMessages } from "../../src/content/locales/en";
import { resolveItalianMessage } from "../../src/content/locales/it";
import {
  coreInterludes,
  interludesBeforeSuperstar,
} from "../helpers/interludes";

const message = resolveItalianMessage;
registerEnglishMessages(englishMessages);

function playerX(page: Page): Promise<number> {
  return page
    .locator("[data-level-host]")
    .evaluate((node) => Number((node as HTMLElement).dataset.playerX));
}

/**
 * One axe scan, anywhere (ADR-052): until now the only scan covered the
 * first screen, so dialogs, the menu, the briefing and the endings shipped
 * unaudited. Every surface a test reaches now gets scanned in passing.
 */
async function expectNoViolations(page: Page): Promise<void> {
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations).toEqual([]);
}

async function openMenu(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: message("core.message.ui.menu.open") })
    .click();
}

/**
 * One long-night chapter, driven entirely from the keyboard: briefing, canvas,
 * skip, dialogue, interlude. Every chapter added from «Acqua e impronte» on
 * uses this instead of another twenty-five hand-written lines (ADR-045).
 */
async function walkChapter(
  page: Page,
  keys: {
    readonly recapKey: string;
    readonly startKey: string;
    readonly twistKey: string;
    readonly choiceKey: string;
  },
): Promise<void> {
  await expect(page.getByText(message(keys.recapKey))).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(page.getByText(message(keys.startKey))).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.skip") })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(message(keys.twistKey))).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: message(keys.choiceKey) }).focus();
  await page.keyboard.press("Enter");
}

async function pickRole(
  page: Page,
  titleKey:
    | "core.message.ui.role-select.varano.title"
    | "core.message.ui.role-select.hunter.title"
    | "core.message.ui.role-select.guardian.title"
    | "core.message.ui.role-select.mayor.title" = "core.message.ui.role-select.varano.title",
): Promise<void> {
  await page
    .getByRole("button", { name: message(titleKey), exact: false })
    .first()
    .click();
}

test("boots straight into an accessible, local-only full-screen game", async ({
  page,
  baseURL,
}) => {
  const consoleErrors: string[] = [];
  const requestedUrls: string[] = [];

  page.on("console", (consoleMessage) => {
    if (consoleMessage.type() === "error") {
      consoleErrors.push(consoleMessage.text());
    }
  });
  page.on("request", (request) => {
    requestedUrls.push(request.url());
  });

  const response = await page.goto("./");
  await page.waitForLoadState("networkidle");

  expect(response?.ok()).toBe(true);
  // First boot shows the role selection with each goal.
  await expect(
    page.getByText(message("core.message.ui.role-select.heading")),
  ).toBeVisible();
  await expect(
    page.getByText(message("core.message.ui.role-select.hunter.goal")),
  ).toBeVisible();
  await expect(
    page.getByText(message("core.message.ui.legend-banner")),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: message("core.message.ui.menu.open") }),
  ).toBeVisible();

  await pickRole(page);
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByText(message("core.message.level.narrative.start")),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: message("core.message.level.skip") }),
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);

  const expectedOrigin = new URL(baseURL ?? "http://127.0.0.1:4173").origin;
  expect(
    requestedUrls.every((url) => new URL(url).origin === expectedOrigin),
  ).toBe(true);
  expect(consoleErrors).toEqual([]);
});

test("publishes canonical and social metadata for the complete game", async ({
  page,
}) => {
  await page.goto("./");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    appConfig.canonicalUrl,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    appConfig.metaDescription,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    `${appConfig.title} — ${appConfig.subtitle}`,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    appConfig.metaDescription,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    appConfig.canonicalUrl,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    appConfig.socialImageUrl,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("publishes and boots the complete English edition", async ({ page }) => {
  const englishConfig = appConfigForLocale("en");
  await page.goto("en/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    englishConfig.canonicalUrl,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    englishConfig.metaDescription,
  );
  await expect(
    page.getByText(resolveMessage("en", "core.message.ui.role-select.heading")),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Italiano" })).toHaveAttribute(
    "href",
    "../",
  );
  await page
    .locator(".role-card")
    .filter({
      has: page.getByText(
        resolveMessage("en", "core.message.ui.role-select.varano.title"),
        { exact: true },
      ),
    })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: resolveMessage("en", "core.message.level.skip"),
    }),
  ).toBeVisible();
  await expectNoViolations(page);
});

test("completes the whole story with the keyboard and restarts", async ({
  page,
}) => {
  await page.goto("./");
  await pickRole(page);

  await expect(page.locator("[data-level-host]")).toHaveCount(1);
  const startingPosition = await playerX(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  await expect.poll(() => playerX(page)).toBeGreaterThan(startingPosition);

  const skip = page.getByRole("button", {
    name: message("core.message.level.skip"),
  });
  await skip.focus();
  await page.keyboard.press("Enter");

  await expect(
    page.getByText(message("core.message.dialogue.varano")),
  ).toBeVisible();
  await expect(
    page.getByText(message("core.message.dialogue.twist")),
  ).toBeVisible();
  await expect(page.locator("[data-app-root]")).not.toContainText(
    /morte|morto|uccid|abbatt|sparare/i,
  );

  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.choice.prompt")),
  ).toBeVisible();
  const protect = page.getByRole("button", {
    name: message("core.message.choice.protect"),
  });
  await protect.focus();
  await page.keyboard.press("Enter");

  // Chapter 1: the briefing recaps the story, then level 2 grants the sprint.
  await expect(
    page.getByText(message("core.message.level2.recap")),
  ).toBeVisible();
  await expectNoViolations(page);
  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByText(message("core.message.level2.narrative.start")),
  ).toBeVisible();
  const skipSecond = page.getByRole("button", {
    name: message("core.message.level.skip"),
  });
  await skipSecond.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.dialogue2.twist")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");

  // The interlude choice (ADR-043): the player decides between levels.
  await expect(
    page.getByText(message("core.message.choice2.prompt")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.choice2.mute") })
    .focus();
  await page.keyboard.press("Enter");

  // The long night (ADR-045): the sealed zone, third in story order.
  await expect(
    page.getByText(message("core.message.zona.recap")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByText(message("core.message.zona.narrative.start")),
  ).toBeVisible();
  const skipZona = page.getByRole("button", {
    name: message("core.message.level.skip"),
  });
  await skipZona.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.dialogue-zona.twist")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: message("core.message.choice-zona.bait") })
    .focus();
  await page.keyboard.press("Enter");

  // Fourth in story order: the versions laboratory (ADR-045).
  await expect(page.getByText(message("core.message.lab.recap"))).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByText(message("core.message.lab.narrative.start")),
  ).toBeVisible();
  const skipLab = page.getByRole("button", {
    name: message("core.message.level.skip"),
  });
  await skipLab.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.dialogue-lab.twist")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: message("core.message.choice-lab.prudent") })
    .focus();
  await page.keyboard.press("Enter");

  // Fifth in story order: the ditches, the six nutrias and the first two of
  // the six seals (ADR-045).
  await walkChapter(page, {
    recapKey: "core.message.acqua.recap",
    startKey: "core.message.acqua.narrative.start",
    twistKey: "core.message.dialogue-acqua.twist",
    choiceKey: "core.message.choice-acqua.wait",
  });

  // Sixth in story order: the upper village, roofs over the dressing gowns
  // and the second pair of seals (ADR-045).
  await walkChapter(page, {
    recapKey: "core.message.borgo.recap",
    startKey: "core.message.borgo.narrative.start",
    twistKey: "core.message.dialogue-borgo.twist",
    choiceKey: "core.message.choice-borgo.order",
  });

  // Seventh in story order and tenth level: the terraces at dawn, the last
  // two seals and the Varano's condition (ADR-045).
  await walkChapter(page, {
    recapKey: "core.message.colle.recap",
    startKey: "core.message.colle.narrative.start",
    twistKey: "core.message.dialogue-colle.twist",
    choiceKey: "core.message.choice-colle.road",
  });

  // Chapter 2: the media circus, where the level grants a power per role.
  await expect(
    page.getByText(message("core.message.level3.recap")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByText(message("core.message.level3.narrative.start")),
  ).toBeVisible();
  const skipThird = page.getByRole("button", {
    name: message("core.message.level.skip"),
  });
  await skipThird.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.dialogue3.twist")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: message("core.message.choice3.delete") })
    .focus();
  await page.keyboard.press("Enter");

  // Chapter 3: the castle park, with the moat drawn as water (ADR-036).
  await expect(
    page.getByText(message("core.message.level4.recap")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByText(message("core.message.level4.narrative.start")),
  ).toBeVisible();
  const skipFourth = page.getByRole("button", {
    name: message("core.message.level.skip"),
  });
  await skipFourth.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.dialogue4.twist")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: message("core.message.choice4.close") })
    .focus();
  await page.keyboard.press("Enter");

  // Chapter 4: inside the castle (ADR-039), where the sender is named.
  await expect(
    page.getByText(message("core.message.level5.recap")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByText(message("core.message.level5.narrative.start")),
  ).toBeVisible();
  // Lives are announced in the status line (ADR-041).
  await expect(
    page.getByText(message("core.message.level.lives", { lives: 3 })),
  ).toBeVisible();
  const skipFifth = page.getByRole("button", {
    name: message("core.message.level.skip"),
  });
  await skipFifth.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.dialogue5.pina")),
  ).toBeVisible();
  await expect(
    page.getByText(message("core.message.dialogue5.twist")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .focus();
  await page.keyboard.press("Enter");

  // The confrontation on the tower (ADR-040): the varano never sees the
  // lethal option, and opening the corridor rescues the Count.
  await expect(
    page.getByRole("heading", {
      name: message("core.message.finale.heading"),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: message("core.message.finale.option.shoot"),
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: message("core.message.finale.option.corridor"),
    })
    .focus();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("heading", {
      name: message("core.message.ending.rescued.title"),
    }),
  ).toBeVisible();
  await expect(page.locator("[data-app-root]")).not.toContainText(
    /morte|morto|uccid|abbatt|sparare/i,
  );
  // The game is concluded (ADR-049): no next-episode promise, and the
  // completion meme card is there to be shared instead.
  await expect(
    page.getByRole("button", {
      name: message("core.message.ui.meme.share"),
    }),
  ).toBeVisible();

  await expectNoViolations(page);

  await page
    .getByRole("button", {
      name: message("core.message.ui.ending.restart"),
    })
    .click();
  await expect(
    page.getByText(message("core.message.ui.role-select.heading")),
  ).toBeVisible();
});

test("guards the lethal choice behind an explicit confirmation", async ({
  page,
}) => {
  await page.goto("./");
  await pickRole(page, "core.message.ui.role-select.hunter.title");

  // Prologue: skip level 1, advance, choose «Documenta la scena» — the
  // evidence stance ADR-013 requires of the hunter.
  await page
    .getByRole("button", { name: message("core.message.level.skip") })
    .click();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .click();
  await page
    .getByRole("button", { name: message("core.message.choice.document") })
    .click();

  // Every middle chapter: skip the level, advance the dialogue, take the
  // interlude when there is one — all derived from the shared list, so a new
  // level never edits this test (ADR-045).
  for (const interlude of coreInterludes) {
    await page
      .getByRole("button", { name: message("core.message.level.skip") })
      .click();
    await page
      .getByRole("button", { name: message("core.message.ui.continue") })
      .click();
    if (interlude !== undefined) {
      await page
        .getByRole("button", { name: message(interlude.textKey) })
        .click();
    }
  }

  // The confrontation shows the lethal option to this setup only, always
  // alongside the non-lethal stands (ADR-013).
  const shoot = page.getByRole("button", {
    name: message("core.message.finale.option.shoot"),
  });
  await expect(shoot).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: message("core.message.finale.option.corridor"),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: message("core.message.finale.option.garden"),
    }),
  ).toBeVisible();

  // Selecting it only opens the confirmation, focused on «Torna indietro».
  await shoot.click();
  await expect(
    page.getByText(message("core.message.finale.confirm.body")),
  ).toBeVisible();
  const cancel = page.getByRole("button", {
    name: message("core.message.finale.confirm.cancel"),
  });
  await expect(cancel).toBeFocused();
  await expectNoViolations(page);

  // Cancelling from the keyboard returns to the confrontation, unrecorded.
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(message("core.message.finale.confirm.body")),
  ).toHaveCount(0);
  await expect(shoot).toBeFocused();

  // The second, explicit act reaches «La prova che pesa», off screen.
  await shoot.click();
  await page
    .getByRole("button", {
      name: message("core.message.finale.confirm.confirm"),
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: message("core.message.ending.killed.title"),
    }),
  ).toBeVisible();
});

test("offers settings, credits, privacy and terms from the in-game menu", async ({
  page,
}) => {
  await page.goto("./");
  await openMenu(page);

  await expect(
    page.getByRole("heading", {
      name: message("core.message.ui.menu.heading"),
    }),
  ).toBeVisible();
  for (const key of [
    "core.message.ui.menu.settings",
    "core.message.ui.menu.credits",
    "core.message.ui.menu.privacy",
    "core.message.ui.menu.terms",
  ] as const) {
    await expect(page.getByText(message(key), { exact: true })).toBeVisible();
  }

  await expectNoViolations(page);

  // Version and updates (ADR-054): the build id from the page meta, and the
  // manual check answering «already latest» against the live worker.
  await expect(page.getByText(/^Versione: \w/)).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.ui.update.check") })
    .click();
  await expect(
    page.getByText(message("core.message.ui.update.none")),
  ).toBeVisible();

  await page
    .getByText(message("core.message.ui.menu.credits"), { exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: message("core.message.ui.credits.link") }),
  ).toHaveAttribute("href", "https://github.com/ceccode/varano-239");
  // The editorial source registry stays reachable even without dossier cards.
  await expect(
    page.getByRole("link", {
      name: message("core.message.ui.credits.sources-link"),
    }),
  ).toHaveAttribute("href", /\/docs\/SOURCES\.md$/);

  // The legal notices are pages of this site, so they also work offline.
  await page
    .getByText(message("core.message.ui.menu.privacy"), { exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: message("core.message.ui.privacy.link") }),
  ).toHaveAttribute("href", "privacy.html");

  await page
    .getByText(message("core.message.ui.menu.terms"), { exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: message("core.message.ui.terms.link") }),
  ).toHaveAttribute("href", "termini.html");

  await page
    .getByRole("button", { name: message("core.message.ui.menu.close") })
    .click();
  await expect(
    page.getByText(message("core.message.ui.role-select.heading")),
  ).toBeVisible();

  await pickRole(page, "core.message.ui.role-select.guardian.title");
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.skip") })
    .click();
  await expect(
    page.getByText(message("core.message.dialogue.guardian")),
  ).toBeVisible();
});

test("grants the run superpower in level 2", async ({ page }) => {
  await page.goto("./");
  await pickRole(page);
  await page
    .getByRole("button", { name: message("core.message.level.skip") })
    .click();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .click();
  await page
    .getByRole("button", { name: message("core.message.choice.protect") })
    .click();

  await page
    .getByRole("button", { name: message("core.message.level.play") })
    .click();
  await expect(
    page.getByText(message("core.message.level2.narrative.start")),
  ).toBeVisible();

  // Holding one direction long enough charges the sprint, with no extra button.
  const startingPosition = await playerX(page);
  await page.keyboard.down("ArrowRight");
  await expect(
    page.getByText(message("core.message.level2.narrative.sprint")),
  ).toBeVisible({ timeout: 5000 });
  await page.keyboard.up("ArrowRight");
  expect(await playerX(page)).toBeGreaterThan(startingPosition);
});

const powerLabelKeys = {
  "core.message.ui.role-select.varano.title": "core.message.power.varano.label",
  "core.message.ui.role-select.hunter.title": "core.message.power.hunter.label",
  "core.message.ui.role-select.guardian.title":
    "core.message.power.guardian.label",
  "core.message.ui.role-select.mayor.title": "core.message.power.mayor.label",
} as const;

for (const [roleKey, labelKey] of Object.entries(powerLabelKeys) as [
  keyof typeof powerLabelKeys,
  (typeof powerLabelKeys)[keyof typeof powerLabelKeys],
][]) {
  test(`grants a role superpower in level 3: ${message(labelKey)}`, async ({
    page,
  }) => {
    await page.goto("./");
    await pickRole(page, roleKey);

    // Straight through the first two levels to the media circus.
    await page
      .getByRole("button", { name: message("core.message.level.skip") })
      .click();
    await page
      .getByRole("button", { name: message("core.message.ui.continue") })
      .click();
    await page
      .getByRole("button", { name: message("core.message.choice.protect") })
      .click();
    // Every chapter before «Varano superstar», derived from the shared list
    // (ADR-045): skip the level from its briefing, advance, take the
    // interlude when there is one.
    for (const interlude of interludesBeforeSuperstar) {
      await page
        .getByRole("button", { name: message("core.message.level.play") })
        .click();
      await page
        .getByRole("button", { name: message("core.message.level.skip") })
        .click();
      await page
        .getByRole("button", { name: message("core.message.ui.continue") })
        .click();
      if (interlude !== undefined) {
        await page
          .getByRole("button", { name: message(interlude.textKey) })
          .click();
      }
    }

    await page
      .getByRole("button", { name: message("core.message.level.play") })
      .click();
    await expect(
      page.getByText(message("core.message.level3.narrative.start")),
    ).toBeVisible();

    // The button carries the role's own accessible name, and holding it — the
    // same gesture on touch and keyboard — engages the power (ADR-031).
    const powerButton = page.getByRole("button", { name: message(labelKey) });
    await expect(powerButton).toBeVisible();

    const host = page.locator("[data-level-host]");
    await expect(host).toHaveAttribute("data-power-active", "false");
    await powerButton.dispatchEvent("pointerdown", { pointerId: 1 });
    await expect(host).toHaveAttribute("data-power-active", "true", {
      timeout: 5000,
    });
    await powerButton.dispatchEvent("pointerup", { pointerId: 1 });
    await expect(host).toHaveAttribute("data-power-active", "false");
  });
}

test("restores a saved run automatically after reload", async ({ page }) => {
  await page.goto("./");
  await pickRole(page);
  await page
    .getByRole("button", { name: message("core.message.level.skip") })
    .click();
  await expect(
    page.getByText(message("core.message.dialogue.varano")),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByText(message("core.message.dialogue.varano")),
  ).toBeVisible();
  await expect(page.locator(".arcade-canvas")).toHaveCount(0);
});

test("keeps the arcade even when the system asks for reduced motion (ADR-046)", async ({
  page,
}) => {
  // On many Android phones the battery saver raises this media query without
  // the player choosing anything: it must not hide the game. The universal
  // accessible route stays «Salta il livello», visible next to the canvas.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await pickRole(page);

  await expect(page.locator("[data-level-host]")).toHaveCount(1);
  await expect(page.locator(".arcade-canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: message("core.message.level.skip") }),
  ).toBeVisible();

  // And the game is genuinely running, not just mounted.
  await page.keyboard.down("ArrowRight");
  const startingPosition = await playerX(page);
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  await expect.poll(() => playerX(page)).toBeGreaterThan(startingPosition);
});

test("keeps the level running when audio is toggled mid-run (ADR-050)", async ({
  page,
}) => {
  await page.goto("./");
  await pickRole(page);
  await expect(page.locator(".arcade-canvas")).toBeVisible();

  // Get properly into the level, so a restart would be unmistakable.
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowRight");
  // Let the deceleration finish, so the reading is a standstill and any
  // later movement can only mean the level restarted or resumed running.
  await page.waitForTimeout(400);
  const reached = await playerX(page);
  expect(reached).toBeGreaterThan(60);

  await openMenu(page);
  // The game underneath is inert while the overlay is up.
  await expect(page.locator(".stage")).toHaveAttribute("inert", "");
  // Settings live in a collapsed section; opening it with the keyboard is
  // itself the regression check — the level used to swallow Space here.
  await page
    .getByText(message("core.message.ui.menu.settings"), { exact: true })
    .focus();
  await page.keyboard.press(" ");
  await page
    .getByRole("checkbox", { name: message("core.message.ui.options.music") })
    .click();

  // Text scale and contrast apply live from the same panel (ADR-053), and
  // the level survives those too.
  await page
    .getByRole("radio", {
      name: message("core.message.ui.options.text.large"),
    })
    .click();
  await page
    .getByRole("checkbox", {
      name: message("core.message.ui.options.contrast"),
    })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-text-scale",
    "large",
  );
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  // The high-contrast theme is itself scanned: tokens must keep AA.
  await expectNoViolations(page);

  // Escape closes the menu, and the run is exactly where it was left.
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-menu]")).toBeHidden();
  await expect(page.locator(".stage")).not.toHaveAttribute("inert", "");
  expect(await playerX(page)).toBe(reached);
});

test("pauses by name and restarts the attempt from the menu (ADR-051)", async ({
  page,
}) => {
  await page.goto("./");
  await pickRole(page);
  await expect(page.locator(".arcade-canvas")).toBeVisible();

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowRight");
  await page.waitForTimeout(400);
  expect(await playerX(page)).toBeGreaterThan(60);

  await openMenu(page);
  await expect(
    page.getByRole("heading", {
      name: message("core.message.ui.menu.paused"),
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: message("core.message.ui.menu.restart-level"),
    })
    .click();

  // Menu gone, attempt back at the spawn, and the level answers the keys.
  await expect(page.locator("[data-menu]")).toBeHidden();
  expect(await playerX(page)).toBe(14);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  await expect.poll(() => playerX(page)).toBeGreaterThan(14);
});

test("celebrates a finished level with its result card (ADR-056)", async ({
  page,
}) => {
  // Playing a whole level to its finish line takes about twenty seconds of
  // real time, so this one test gets a longer budget than the default.
  test.setTimeout(120_000);
  await page.goto("./");
  await pickRole(page);
  await expect(page.locator(".arcade-canvas")).toBeVisible();

  // Run the level for real, jumping at the gap edges rather than on a blind
  // cadence: «I campi di Montichiari» opens its ditches at these four marks.
  const gapEdges = [420, 900, 1500, 2150];
  await page.keyboard.down("ArrowRight");
  let jumping = false;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await page.locator(".arcade-result").isVisible()) break;
    const x = await playerX(page);
    const nearEdge = gapEdges.some((edge) => x > edge - 60 && x < edge + 8);
    if (nearEdge !== jumping) {
      await page.keyboard[nearEdge ? "down" : "up"]("Space");
      jumping = nearEdge;
    }
    await page.waitForTimeout(120);
  }
  if (jumping) await page.keyboard.up("Space");
  await page.keyboard.up("ArrowRight");

  // The card waits for the player — no timer decides (ADR-056).
  const card = page.locator(".arcade-result");
  await expect(card).toBeVisible({ timeout: 20_000 });
  // The keys carry «{score}» placeholders, so assert the rendered shape and
  // the badge text, which has none.
  await expect(card).toContainText(/Punteggio: \d+/);
  await expect(card).toContainText(/Indizi: \d+ di 3/);
  await expect(card).toContainText(
    message("core.message.level.result.badge.unscathed"),
  );
  await expectNoViolations(page);
  await page.waitForTimeout(1500);
  await expect(card).toBeVisible();

  // «Continua» hands over to the story, exactly like a skip would.
  await page
    .getByRole("button", {
      name: message("core.message.level.result.continue"),
    })
    .click();
  await expect(
    page.getByText(message("core.message.dialogue.twist")),
  ).toBeVisible();

  // …and the Collection remembers it (ADR-057): ten rows, the first filled.
  await openMenu(page);
  await page
    .getByText(message("core.message.ui.menu.collection"), { exact: true })
    .click();
  const rows = page.locator(".collection__row");
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText(/Record \d+/);
  await expect(rows.nth(1)).toContainText(
    message("core.message.ui.collection.pending"),
  );
  await expectNoViolations(page);
});

test("moves with the touch controls and keeps an equivalent skip action", async ({
  page,
}) => {
  await page.goto("./");
  await pickRole(page);

  await expect(page.locator(".arcade-canvas")).toBeVisible();
  const startingPosition = await playerX(page);
  const moveRight = page.getByRole("button", {
    name: message("core.message.level.control.right"),
  });
  await moveRight.dispatchEvent("pointerdown", { pointerId: 1 });
  await page.waitForTimeout(300);
  await moveRight.dispatchEvent("pointerup", { pointerId: 1 });
  await expect.poll(() => playerX(page)).toBeGreaterThan(startingPosition);
  await expect(
    page.getByRole("button", { name: message("core.message.level.skip") }),
  ).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("keeps the essential project information readable", async ({ page }) => {
    await page.goto("./");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      appConfig.title,
    );
    await expect(page.getByText(appConfig.shell.safetyBody)).toBeVisible();
    await expect(
      page.getByRole("link", { name: appConfig.shell.sourcesDocumentLink }),
    ).toBeVisible();
    await expect(page.getByText(appConfig.shell.description)).toBeVisible();
    await expect(page.getByText(/10 livelli/)).toBeVisible();
    await expect(page.getByText(/4 ruoli/)).toBeVisible();
    await expect(page.getByText(/6 finali/)).toBeVisible();
    await expect(page.getByText(/Tre livelli/)).toHaveCount(0);
    await expect(page.getByRole("button")).toHaveCount(0);
  });
});
