// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import {
  drawMemeCard,
  memeCardSize,
  type MemeAccessory,
} from "../../src/platform/dom/meme-card";
import { stubCanvasContext } from "./helpers/canvas-stub";

/**
 * The completion meme card (ADR-049). What matters: every accessory paints a
 * visibly different card, the caption travels uppercase, and the LEGGENDA
 * stamp is on the image itself — a share lands out of context by design.
 */
describe("completion meme card", () => {
  const accessories: readonly MemeAccessory[] = [
    "crown",
    "sunglasses",
    "monocle",
    "bowtie",
    "mystery",
  ];

  function draw(accessory: MemeAccessory): {
    calls: readonly unknown[];
    texts: readonly string[];
  } {
    const stub = stubCanvasContext();
    const canvas = document.createElement("canvas");
    drawMemeCard(canvas, {
      header: "VARANO 2:39 · LEGGENDA",
      caption: "Il Conte dei Sei Colli",
      accessory,
      siteLabel: "app.varano239.it",
    });
    expect(canvas.width).toBe(memeCardSize);
    return { calls: stub.calls, texts: stub.texts };
  }

  it("stamps the header, the uppercase caption and the site on every card", () => {
    for (const accessory of accessories) {
      const { texts } = draw(accessory);
      expect(texts, accessory).toContain("VARANO 2:39 · LEGGENDA");
      expect(texts, accessory).toContain("IL CONTE DEI SEI COLLI");
      expect(texts, accessory).toContain("app.varano239.it");
    }
  });

  it("paints a different varano for every ending family", () => {
    const signatures = accessories.map((accessory) =>
      JSON.stringify(draw(accessory).calls),
    );
    expect(new Set(signatures).size).toBe(accessories.length);
  });

  it("keeps the doubt for «Una muta, forse»: eyes and a question mark", () => {
    const { texts } = draw("mystery");
    expect(texts).toContain("?");
  });

  it("stamps the numbered ending and the role detail when present (FASE 4)", () => {
    const stub = stubCanvasContext();
    const canvas = document.createElement("canvas");
    drawMemeCard(canvas, {
      header: "VARANO 2:39 · LEGGENDA",
      caption: "Il trasportino aperto",
      accessory: "bowtie",
      siteLabel: "app.varano239.it",
      endingLabel: "FINALE 1/6",
      detailLine: "Varano · 8/10 indizi",
    });
    expect(stub.texts).toContain("FINALE 1/6");
    expect(stub.texts).toContain("Varano · 8/10 indizi");
  });
});
