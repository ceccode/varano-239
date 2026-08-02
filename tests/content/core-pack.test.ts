import { describe, expect, it } from "vitest";

import { assetManifest } from "../../src/assets/manifest";
import { createInitialState, type GameState } from "../../src/core/game-state";
import type { Approach, Role, Sensitivity } from "../../src/core/model";
import { reduce } from "../../src/core/reducer";
import {
  italianMessages,
  resolveItalianMessage,
} from "../../src/content/locales/it";
import { corePack, coreStoryGraph } from "../../src/content/packs/core/m1";
import { validateContent } from "../../src/content/validate-content";
import type { StoryPack } from "../../src/content/story-pack";
import { registeredLevelDescriptors } from "../../src/levels/registry";

const roles: readonly Role[] = ["hunter", "guardian", "mayor", "varano"];
const approaches: readonly Approach[] = ["evidence", "rescue"];
const sensitivities: readonly Sensitivity[] = ["gentle", "complete"];

function startRun(
  role: Role,
  approach: Approach,
  sensitivity: Sensitivity,
): GameState {
  const state: GameState = {
    ...createInitialState(),
    setup: { role, approach, sensitivity, storyScope: "core" },
  };
  return reduce(state, { type: "RUN_STARTED" }, coreStoryGraph).state;
}

function finishRun(state: GameState): GameState {
  const actions = [
    { type: "MINIGAME_SKIPPED" },
    { type: "DIALOGUE_ADVANCED" },
    { type: "OPTION_CHOSEN", optionId: "core.option.prologue.document" },
  ] as const;

  return actions.reduce(
    (current, action) => reduce(current, action, coreStoryGraph).state,
    state,
  );
}

describe("M1 core content", () => {
  it("passes structural validation", () => {
    expect(
      validateContent(
        corePack,
        assetManifest,
        italianMessages,
        registeredLevelDescriptors,
      ),
    ).toEqual([]);
  });

  it("starts with one registered, optional arcade level", () => {
    const level = coreStoryGraph.nodes.find(
      (node) => node.id === coreStoryGraph.entryNodeId,
    );
    expect(level?.type).toBe("level");
    if (level?.type === "level") {
      expect(
        registeredLevelDescriptors.some(
          (descriptor) =>
            descriptor.levelId === level.levelId &&
            descriptor.configId === level.configId,
        ),
      ).toBe(true);
      expect(level.skippedNodeId).toBe(level.completedNodeId);
    }
  });

  it("lets all 16 core setup combinations reach the temporary ending", () => {
    for (const role of roles) {
      for (const approach of approaches) {
        for (const sensitivity of sensitivities) {
          const finished = finishRun(startRun(role, approach, sensitivity));
          expect(finished.phase).toBe("ending");
          expect(finished.run?.outcomeId).toBe("core.outcome.open-mystery");
        }
      }
    }
  });

  it("keeps all post-setup gentle content free of death language", () => {
    const graphKeys = coreStoryGraph.nodes.flatMap((node) => {
      switch (node.type) {
        case "scene":
          return [
            node.objectiveKey,
            ...node.hotspots.map((hotspot) => hotspot.labelKey),
          ];
        case "dialogue":
          return node.lines.map((line) => line.textKey);
        case "choice":
          return [
            node.promptKey,
            ...node.options.map((option) => option.textKey),
          ];
        case "surprise":
          return node.messageKey === undefined ? [] : [node.messageKey];
        case "ending":
          return [node.titleKey, node.bodyKey];
        case "dossier-card":
        case "level":
        case "chapter-end":
          return [];
      }
    });
    const content = graphKeys.map(resolveItalianMessage).join(" ");
    expect(content).not.toMatch(/morte|morto|uccid|abbatt|sparare/i);
  });

  it("reports malformed graph, source, dossier, asset and level data", () => {
    const malformedPack = {
      id: "core",
      version: 1,
      kind: "core",
      titleKey: "missing.pack.title",
      descriptionKey: "missing.pack.description",
      estimatedMinutes: 1,
      requires: [],
      chapters: [
        {
          chapter: {
            id: "outside.chapter",
            titleKey: "missing.chapter.title",
            entryNodeId: "outside.node.scene",
            checkpointNodeId: "core.node.missing",
          },
          nodes: [
            {
              id: "outside.node.scene",
              chapterId: "outside.chapter",
              type: "scene",
              narrativeLayer: "legend",
              backgroundAssetId: "core.asset.missing",
              objectiveKey: "missing.objective",
              hotspots: [
                {
                  id: "outside.hotspot",
                  labelKey: "missing.hotspot",
                  rect: { x: -1, y: 95, width: 0, height: 10 },
                  targetNodeId: "core.node.missing",
                },
              ],
            },
            {
              id: "core.node.dossier",
              chapterId: "outside.chapter",
              type: "dossier-card",
              narrativeLayer: "legend",
              dossierCardId: "core.dossier.missing",
              next: "core.node.missing",
            },
            {
              id: "core.node.surprise",
              chapterId: "outside.chapter",
              type: "surprise",
              narrativeLayer: "legend",
              surpriseId: "core.surprise.invalid",
              hostSceneNodeId: "core.node.missing",
              assetId: "core.asset.missing",
              messageKey: "missing.surprise",
              next: "core.node.missing",
            },
            {
              id: "core.node.level",
              chapterId: "outside.chapter",
              type: "level",
              narrativeLayer: "legend",
              levelId: "core.level.missing",
              configId: "core.level-config.missing",
              completedNodeId: "core.node.missing",
              skippedNodeId: "core.node.missing",
            },
            {
              id: "core.node.ending",
              chapterId: "outside.chapter",
              type: "ending",
              narrativeLayer: "legend",
              outcomeId: "core.outcome.other",
              titleKey: "missing.ending.title",
              bodyKey: "missing.ending.body",
            },
          ],
          dossierCards: [
            {
              id: "core.dossier.fact",
              label: "fact",
              titleKey: "missing.fact.title",
              bodyKey: "missing.fact.body",
              sourceIds: [],
              verifiedAt: "not-a-date",
            },
            {
              id: "core.dossier.legend",
              label: "legend",
              titleKey: "missing.legend.title",
              bodyKey: "missing.legend.body",
              sourceIds: ["core.source.missing"],
              verifiedAt: "2026-08-01",
            },
            {
              id: "core.dossier.disproven",
              label: "disproven",
              titleKey: "missing.disproven.title",
              bodyKey: "missing.disproven.body",
              sourceIds: [],
              verifiedAt: "2026-08-01",
            },
          ],
          clues: [],
          messages: {},
          sources: [
            {
              id: "core.source.invalid",
              publisher: "Invalid",
              title: "Invalid",
              url: "http://example.test/source",
              publishedAt: "yesterday",
              accessedAt: "today",
            },
          ],
        },
      ],
      mysteries: [],
      theories: [],
    } as const satisfies StoryPack;

    const errors = validateContent(
      malformedPack,
      [
        {
          id: "core.asset.unused",
          src: "/unused.svg",
          altKey: "missing.asset.alt",
        },
      ],
      {},
      [],
    );
    expect(errors).toContain("outside.chapter is outside the core namespace.");
    expect(errors).toContain(
      "core.node.level references missing level configuration core.level.missing/core.level-config.missing.",
    );
    expect(errors).toContain("core.dossier.fact requires at least one source.");
    expect(errors).toContain("core.dossier.legend requires a fiction notice.");
    expect(errors).toContain(
      "core.dossier.disproven requires an authoritative refutation source.",
    );
    expect(errors).toContain("core.source.invalid must use HTTPS.");
    expect(errors).toContain(
      "Missing core.outcome.open-mystery fallback ending.",
    );
  });

  it("rejects a pack without an entry chapter", () => {
    const emptyPack = { ...corePack, chapters: [] } satisfies StoryPack;
    expect(validateContent(emptyPack, [], {}, [])).toContain(
      "core has no entry chapter.",
    );
  });
});
