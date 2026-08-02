import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { appConfig } from "../../src/app/config";
import { resolveItalianMessage } from "../../src/content/locales/it";

const message = resolveItalianMessage;

function playerX(page: Page): Promise<number> {
  return page
    .locator("[data-level-host]")
    .evaluate((node) => Number((node as HTMLElement).dataset.playerX));
}

async function openMenu(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: message("core.message.ui.menu.open") })
    .click();
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

test("completes the gentle flow with the keyboard and restarts", async ({
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

  // Chapter 1: level 2 grants the sprint and leads to the ending.
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

  await expect(
    page.getByRole("heading", { name: message("core.message.ending.title") }),
  ).toBeVisible();
  await expect(page.locator("[data-app-root]")).not.toContainText(
    /morte|morto|uccid|abbatt|sparare/i,
  );
  // The ending promises the next level so players know to come back.
  await expect(
    page.getByText(message("core.message.ui.next-level.label")),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: message("core.message.ui.next-level.title"),
    }),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: message("core.message.ui.ending.restart"),
    })
    .click();
  await expect(
    page.getByText(message("core.message.ui.role-select.heading")),
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

test("offers the equivalent path when reduced motion is preferred", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await pickRole(page);

  await expect(page.locator("[data-level-host]")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByText(message("core.message.level.assisted")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: message("core.message.level.continue") })
    .click();
  await page
    .getByRole("button", { name: message("core.message.ui.continue") })
    .click();

  await expect(
    page.getByRole("heading", {
      name: message("core.message.ui.choice.heading"),
    }),
  ).toBeVisible();
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
    await expect(page.getByRole("button")).toHaveCount(0);
  });
});
