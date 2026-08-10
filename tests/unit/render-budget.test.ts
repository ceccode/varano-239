// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialState } from "../../src/core/game-state";
import { platformerMiniGame } from "../../src/levels/adapters/platformer";
import type { LevelAudioPort } from "../../src/levels/contract";
import { registeredLevels } from "../../src/levels/registry";
import { stubCanvasContext } from "./helpers/canvas-stub";
import { installFrameHarness } from "./helpers/frame-harness";

/**
 * The render budget (ADR-052): every canvas-context call of a frame,
 * counted per level on the same deterministic clock. This is the ratchet
 * performance work is measured against — CI-safe because it counts calls,
 * never milliseconds. The ceiling is one for all levels, set ~20% above the
 * busiest one measured; a level that blows past it is drawing off-screen
 * work or allocating scenery per frame, and the failure names it.
 */
const callsPerFrameCeiling = 800;

describe("render budget (ADR-052)", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  for (const level of registeredLevels) {
    it(`stays under ${String(callsPerFrameCeiling)} context calls per frame: ${level.levelId}`, () => {
      const stub = stubCanvasContext();
      const harness = installFrameHarness();
      const host = document.createElement("div");
      document.body.append(host);
      const audio: LevelAudioPort = {
        startMusic: vi.fn(),
        stopMusic: vi.fn(),
        playEffect: vi.fn(),
      };
      const handle = platformerMiniGame.mount(host, {
        levelId: level.levelId,
        configId: level.configId,
        config: level.config,
        role: "varano",
        settings: createInitialState().settings,
        message: (key) => key,
        audio,
        onComplete: vi.fn(),
        onExit: vi.fn(),
      });

      // Run one second while moving: the camera scrolls, the parallax
      // layers reseed and the busiest paths get exercised.
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
      const before = stub.calls.length;
      const frames = 60;
      harness.run(frames);
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight" }));

      // Measured on introduction (ADR-052): 222-442 calls/frame across the
      // campaign, with «Il borgo delle versioni» the outlier at 643 — the
      // laundry backdrop earns its keep. The ceiling leaves it ~24%.
      const perFrame = (stub.calls.length - before) / frames;
      expect(
        perFrame,
        `${level.levelId} draws ${String(Math.round(perFrame))} calls/frame`,
      ).toBeLessThan(callsPerFrameCeiling);
      handle.destroy();
    });
  }
});
