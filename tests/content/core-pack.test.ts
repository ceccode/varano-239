import { describe, expect, it } from "vitest";

import { assetManifest } from "../../src/assets/manifest";
import { createInitialState, type GameState } from "../../src/core/game-state";
import type { Approach, Role, Sensitivity } from "../../src/core/model";
import { reduce } from "../../src/core/reducer";
import {
  italianMessages,
  resolveItalianMessage,
} from "../../src/content/locales/it";
import { corePack, coreStoryGraph } from "../../src/content/packs/core/pack";
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

function finishRun(
  state: GameState,
  standOptionId = "core.option.finale.document",
  confirmed?: boolean,
): GameState {
  const actions = [
    // Chapter 0: level 1, dialogue, first choice.
    { type: "MINIGAME_SKIPPED" },
    { type: "DIALOGUE_ADVANCED" },
    { type: "OPTION_CHOSEN", optionId: "core.option.prologue.document" },
    // Chapter 1: level 2, dialogue.
    { type: "MINIGAME_SKIPPED" },
    { type: "DIALOGUE_ADVANCED" },
    // Chapter 2: level 3, dialogue.
    { type: "MINIGAME_SKIPPED" },
    { type: "DIALOGUE_ADVANCED" },
    // Chapter 3: level 4, dialogue.
    { type: "MINIGAME_SKIPPED" },
    { type: "DIALOGUE_ADVANCED" },
    // Chapter 4: level 5, the reveal dialogue (ADR-039).
    { type: "MINIGAME_SKIPPED" },
    { type: "DIALOGUE_ADVANCED" },
    // The confrontation on the tower picks the ending family (ADR-040).
    ...(confirmed === undefined
      ? [{ type: "OPTION_CHOSEN", optionId: standOptionId } as const]
      : [
          {
            type: "OPTION_CHOSEN",
            optionId: standOptionId,
            confirmed,
          } as const,
        ]),
  ] as const;

  return actions.reduce<GameState>(
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

  it("gives every level its own heading and intro copy", () => {
    // Regression guard: the renderer used to hardcode level 1's keys for every
    // level, so the assisted path announced level 2 as «Livello 1» (ADR-030).
    const levels = coreStoryGraph.nodes.filter((node) => node.type === "level");
    expect(levels.length).toBeGreaterThan(1);

    for (const key of [
      ...levels.map((level) => level.headingKey),
      ...levels.map((level) => level.introKey),
    ]) {
      expect(Object.hasOwn(italianMessages, key)).toBe(true);
    }

    const headings = levels.map((level) =>
      resolveItalianMessage(level.headingKey),
    );
    const intros = levels.map((level) => resolveItalianMessage(level.introKey));
    expect(new Set(headings).size).toBe(levels.length);
    expect(new Set(intros).size).toBe(levels.length);
  });

  it("lets all 16 core setup combinations reach an ending", () => {
    for (const role of roles) {
      for (const approach of approaches) {
        for (const sensitivity of sensitivities) {
          // Chasing the perfect proof keeps the mystery open for everyone.
          const open = finishRun(startRun(role, approach, sensitivity));
          expect(open.phase).toBe("ending");
          expect(open.run?.outcomeId).toBe("core.outcome.open-mystery");

          // Opening the corridor rescues the Varano for everyone too.
          const rescued = finishRun(
            startRun(role, approach, sensitivity),
            "core.option.finale.corridor",
          );
          expect(rescued.phase).toBe("ending");
          expect(rescued.run?.outcomeId).toBe(
            "core.outcome.varano-chooses-rescue",
          );
          expect(rescued.run?.varanoFate).toBe("rescued");
        }
      }
    }
  });

  it("gates the lethal choice to the hunter who documents, behind a confirmation", () => {
    // Without the explicit confirmation nothing happens (ADR-013): the state
    // stays on the confrontation.
    const unconfirmed = finishRun(
      startRun("hunter", "evidence", "complete"),
      "core.option.finale.shoot",
    );
    expect(unconfirmed.phase).toBe("playing");
    expect(unconfirmed.run?.currentNodeId).toBe(
      "core.node.finale.confrontation",
    );

    // Confirmed, the hunter who chose «Documenta» reaches the lethal ending.
    const confirmed = finishRun(
      startRun("hunter", "evidence", "complete"),
      "core.option.finale.shoot",
      true,
    );
    expect(confirmed.phase).toBe("ending");
    expect(confirmed.run?.outcomeId).toBe("core.outcome.hunter-killed-varano");
    expect(confirmed.run?.varanoFate).toBe("killedByHunter");

    // Every other role is refused even with the confirmation in hand.
    for (const role of ["guardian", "mayor", "varano"] as const) {
      const refused = finishRun(
        startRun(role, "evidence", "complete"),
        "core.option.finale.shoot",
        true,
      );
      expect(refused.phase).toBe("playing");
      expect(refused.run?.varanoFate).toBe("unresolved");
    }
  });

  it("keeps everything outside the ADR-013 gate free of death language", () => {
    // The lethal option and its ending exist (ADR-040), but they carry the
    // impliedAnimalDeath tag and sit behind the hunter+complete gate: all the
    // content a player meets without crossing that gate stays clean.
    const graphKeys = coreStoryGraph.nodes.flatMap((node) => {
      if (node.sensitivityTags?.includes("impliedAnimalDeath")) {
        return [];
      }
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
            ...node.options
              .filter(
                (option) =>
                  !option.sensitivityTags?.includes("impliedAnimalDeath"),
              )
              .map((option) => option.textKey),
          ];
        case "surprise":
          return node.messageKey === undefined ? [] : [node.messageKey];
        case "ending":
          return [node.titleKey, node.bodyKey];
        case "level":
          return [node.headingKey, node.introKey];
        case "dossier-card":
        case "chapter-end":
          return [];
      }
    });
    const content = graphKeys
      .map((key) => resolveItalianMessage(key))
      .join(" ");
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
              headingKey: "missing.level.heading",
              recapKey: "missing.level.recap",
              introKey: "missing.level.intro",
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
    // A level's own copy is validated like any other node text (ADR-030).
    expect(errors).toContain(
      "core.node.level references missing message missing.level.heading.",
    );
    expect(errors).toContain(
      "core.node.level references missing message missing.level.recap.",
    );
    expect(errors).toContain(
      "core.node.level references missing message missing.level.intro.",
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

  it("enforces the ADR-013 rules on any lethal choice option", () => {
    // A lethal option without confirmation, gate, tagged target or enough
    // unconditional alternatives must fail the build, not slip online.
    const chapterId = "core.chapter.lethal";
    const brokenPack = {
      id: "core",
      version: 1,
      kind: "core",
      titleKey: "core.message.pack.title",
      descriptionKey: "core.message.pack.description",
      estimatedMinutes: 1,
      requires: [],
      chapters: [
        {
          chapter: {
            id: chapterId,
            titleKey: "core.message.pack.title",
            entryNodeId: "core.node.lethal.choice",
            checkpointNodeId: "core.node.lethal.choice",
          },
          nodes: [
            {
              id: "core.node.lethal.choice",
              chapterId,
              type: "choice",
              narrativeLayer: "legend",
              promptKey: "core.message.pack.title",
              options: [
                {
                  id: "core.option.lethal.shoot",
                  textKey: "core.message.pack.title",
                  sensitivityTags: ["impliedAnimalDeath"],
                  // No confirmation, no complete gate, untagged target.
                  when: [{ type: "role-is", role: "hunter" }],
                  targetNodeId: "core.node.lethal.end",
                },
                {
                  id: "core.option.lethal.safe",
                  textKey: "core.message.pack.title",
                  targetNodeId: "core.node.lethal.end",
                },
              ],
            },
            {
              id: "core.node.lethal.end",
              chapterId,
              type: "ending",
              narrativeLayer: "legend",
              outcomeId: "core.outcome.open-mystery",
              titleKey: "core.message.pack.title",
              bodyKey: "core.message.pack.description",
            },
          ],
          dossierCards: [],
          clues: [],
          messages: {},
          sources: [],
        },
      ],
      mysteries: [],
      theories: [],
    } as const satisfies StoryPack;

    const errors = validateContent(brokenPack, [], italianMessages, []);
    expect(errors).toContain(
      "core.option.lethal.shoot needs a confirmation with the focus on cancel.",
    );
    expect(errors).toContain(
      "core.option.lethal.shoot must be gated to hunter and the complete edition.",
    );
    expect(errors).toContain(
      "core.option.lethal.shoot must target an ending tagged impliedAnimalDeath.",
    );
    expect(errors).toContain(
      "core.node.lethal.choice needs at least two unconditional non-lethal options.",
    );

    // The shipped confrontation, by contrast, passes those same rules.
    expect(
      validateContent(
        corePack,
        assetManifest,
        italianMessages,
        registeredLevelDescriptors,
      ),
    ).toEqual([]);
  });

  it("rejects a pack without an entry chapter", () => {
    const emptyPack = { ...corePack, chapters: [] } satisfies StoryPack;
    expect(validateContent(emptyPack, [], {}, [])).toContain(
      "core has no entry chapter.",
    );
  });
});
