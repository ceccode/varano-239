import { describe, expect, it } from "vitest";

import { matchesCondition, matchesConditions } from "../../src/core/conditions";
import type { CompletedSetup, RunState } from "../../src/core/game-state";
import type { Condition } from "../../src/core/model";

const setup: CompletedSetup = {
  role: "hunter",
  storyScope: "core",
};

const run: RunState = {
  currentNodeId: "core.node.test",
  checkpointNodeId: "core.node.test",
  coreCheckpointNodeId: "core.node.test",
  evidence: 2,
  care: 1,
  publicTrust: 0,
  condition: "healthy",
  seals: ["core.seal.one"],
  inventory: ["core.item.one"],
  flags: { "core.flag.one": true },
  dossierCardIdsSeen: [],
  discoveredClueIds: ["core.clue.one"],
  completedPackIds: ["core.pack.one"],
  varanoFate: "rescued",
  selectedTheoryByMystery: { "core.mystery.one": "core.theory.one" },
  visitedNodeIds: ["core.node.test"],
  choices: { "core.choice.one": "core.option.one" },
};

const matchingConditions: readonly Condition[] = [
  { type: "role-is", role: "hunter" },
  { type: "story-scope-is", scope: "core" },
  { type: "flag-is", flagId: "core.flag.one", value: true },
  { type: "score-at-least", score: "evidence", value: 2 },
  { type: "condition-is", value: "healthy" },
  { type: "fate-is", fate: "rescued" },
  { type: "has-item", itemId: "core.item.one" },
  { type: "has-seal", sealId: "core.seal.one" },
  { type: "has-clue", clueId: "core.clue.one" },
  {
    type: "theory-selected",
    mysteryId: "core.mystery.one",
    theoryId: "core.theory.one",
  },
  { type: "pack-complete", packId: "core.pack.one" },
  {
    type: "choice-is",
    choiceId: "core.choice.one",
    optionId: "core.option.one",
  },
];

describe("story conditions", () => {
  it("evaluates every supported condition against one context", () => {
    const context = { setup, run };
    expect(
      matchingConditions.every((condition) =>
        matchesCondition(condition, context),
      ),
    ).toBe(true);
    expect(matchesConditions(matchingConditions, context)).toBe(true);
    expect(matchesConditions(undefined, context)).toBe(true);
  });

  it("rejects a non-matching condition", () => {
    expect(
      matchesConditions([{ type: "role-is", role: "varano" }], { setup, run }),
    ).toBe(false);
  });
});
