import { vi } from "vitest";

export interface CanvasContextStub {
  readonly calls: readonly string[];
}

/**
 * jsdom does not implement the 2D canvas API, so unit tests stub the small
 * surface the platformer renderer uses.
 */
export function stubCanvasContext(): CanvasContextStub {
  const calls: string[] = [];
  const record =
    (name: string) =>
    (...args: unknown[]): void => {
      void args;
      calls.push(name);
    };

  const contextStub = {
    canvas: undefined as unknown,
    imageSmoothingEnabled: false,
    fillStyle: "",
    fillRect: record("fillRect"),
    beginPath: record("beginPath"),
    arc: record("arc"),
    fill: record("fill"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    closePath: record("closePath"),
    save: record("save"),
    restore: record("restore"),
    translate: record("translate"),
    scale: record("scale"),
  };

  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(function (this: HTMLCanvasElement, kind: string) {
      contextStub.canvas = this;
      return kind === "2d"
        ? (contextStub as unknown as CanvasRenderingContext2D)
        : null;
    }),
  });

  return { calls };
}
