import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { appConfig } from "../../src/app/config";

test("renders an accessible, local-only shell without horizontal overflow", async ({
  page,
  baseURL,
}) => {
  const consoleErrors: string[] = [];
  const requestedUrls: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("request", (request) => {
    requestedUrls.push(request.url());
  });

  const response = await page.goto("./");
  await page.waitForLoadState("networkidle");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    appConfig.title,
  );
  await expect(
    page.getByRole("heading", { name: appConfig.shell.safetyTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: appConfig.shell.sourcesTitle }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(appConfig.shell.ready);

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

test("offers a visible keyboard path to content and sources", async ({
  page,
}) => {
  await page.goto("./");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", {
    name: appConfig.shell.skipLink,
  });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenuto")).toBeFocused();

  await page.goto("./");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const sourcesLink = page.getByRole("link", {
    name: appConfig.shell.sourcesLink,
  });
  await expect(sourcesLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#fonti$/);
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
      page.getByRole("link", { name: appConfig.shell.sourcesLink }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: appConfig.shell.sourcesDocumentLink }),
    ).toBeVisible();
    await expect(page.getByText(appConfig.shell.description)).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
  });
});
