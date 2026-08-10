import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";

describe("M0 foundation", () => {
  it("has no runtime dependencies", () => {
    expect(packageJson.dependencies).toEqual({});
  });

  it("keeps the documented quality command order", () => {
    expect(packageJson.scripts.check).toBe(
      "npm run format:check && npm run lint && npm run typecheck && npm run validate && npm run test -- --coverage && npm run build && npm run size && npm run test:e2e",
    );
  });
});
