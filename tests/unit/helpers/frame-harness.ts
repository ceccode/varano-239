import { vi } from "vitest";

type FrameCallback = (time: number) => void;

export interface FrameHarness {
  /** Runs up to `frames` queued animation frames, `frameMs` apart. */
  readonly run: (frames: number, frameMs?: number) => void;
}

/**
 * Deterministic requestAnimationFrame for jsdom: frames run only when a test
 * asks, at a fixed cadence. Extracted from the adapter suite so the render
 * budget (ADR-052) can drive every level through the same clock.
 */
export function installFrameHarness(): FrameHarness {
  let queue: FrameCallback[] = [];
  let now = 0;
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: vi.fn((callback: FrameCallback) => {
      queue.push(callback);
      return queue.length;
    }),
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    value: vi.fn(() => {
      queue = [];
    }),
  });
  return {
    run(frames: number, frameMs = 16): void {
      for (let index = 0; index < frames; index += 1) {
        const callbacks = queue;
        queue = [];
        now += frameMs;
        for (const callback of callbacks) {
          callback(now);
        }
        if (queue.length === 0) {
          return;
        }
      }
    },
  };
}
