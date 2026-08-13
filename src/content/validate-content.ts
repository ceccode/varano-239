import type { AssetDefinition } from "../assets/manifest";
import type { MessageKey, StoryNode } from "../core/model";
import type { DossierCard, SourceRef } from "./dossier";
import type { StoryPack } from "./story-pack";

export interface LevelDescriptor {
  readonly levelId: string;
  readonly configId: string;
  readonly messageKeys: readonly MessageKey[];
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function nodeTargets(node: StoryNode): readonly string[] {
  switch (node.type) {
    case "scene":
      return node.hotspots.map((hotspot) => hotspot.targetNodeId);
    case "dialogue":
    case "dossier-card":
    case "surprise":
      return [node.next];
    case "choice":
      return node.options.map((option) => option.targetNodeId);
    case "level":
      return [node.completedNodeId, node.skippedNodeId];
    case "chapter-end":
    case "ending":
      return [];
  }
}

function nodeMessageKeys(node: StoryNode): readonly MessageKey[] {
  switch (node.type) {
    case "scene":
      return [
        node.objectiveKey,
        ...node.hotspots.map((hotspot) => hotspot.labelKey),
      ];
    case "dialogue":
      // Every speaker needs a display name for its bubble (ADR-043); the key
      // is derived from the speaker id by convention, per pack namespace.
      return node.lines.flatMap((line) => [
        line.speakerId.replace(".speaker.", ".message.speaker."),
        line.textKey,
      ]);
    case "choice":
      return [
        ...(node.headingKey === undefined ? [] : [node.headingKey]),
        node.promptKey,
        ...node.options.flatMap((option) => {
          const confirmation = option.confirmation;
          return confirmation === undefined
            ? [option.textKey]
            : [
                option.textKey,
                confirmation.titleKey,
                confirmation.bodyKey,
                confirmation.confirmKey,
                confirmation.cancelKey,
              ];
        }),
      ];
    case "surprise":
      return node.messageKey === undefined ? [] : [node.messageKey];
    case "ending":
      return [node.titleKey, node.bodyKey];
    case "level":
      return [node.headingKey, node.recapKey, node.introKey];
    case "dossier-card":
    case "chapter-end":
      return [];
  }
}

function dossierMessageKeys(card: DossierCard): readonly MessageKey[] {
  return [
    card.titleKey,
    card.bodyKey,
    ...(card.fictionNoticeKey === undefined ? [] : [card.fictionNoticeKey]),
  ];
}

function validateDossierCard(
  card: DossierCard,
  sourceIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (!isIsoDate(card.verifiedAt)) {
    errors.push(`${card.id} has an invalid verifiedAt date.`);
  }

  for (const sourceId of [
    ...card.sourceIds,
    ...(card.refutationSourceIds ?? []),
  ]) {
    if (!sourceIds.has(sourceId)) {
      errors.push(`${card.id} references missing source ${sourceId}.`);
    }
  }

  if (
    ["fact", "testimony", "hypothesis"].includes(card.label) &&
    card.sourceIds.length === 0
  ) {
    errors.push(`${card.id} requires at least one source.`);
  }

  if (card.label === "legend" && card.fictionNoticeKey === undefined) {
    errors.push(`${card.id} requires a fiction notice.`);
  }

  if (
    card.label === "disproven" &&
    (card.refutationSourceIds?.length ?? 0) === 0
  ) {
    errors.push(`${card.id} requires an authoritative refutation source.`);
  }
}

function validateSource(source: SourceRef, errors: string[]): void {
  try {
    if (new URL(source.url).protocol !== "https:") {
      errors.push(`${source.id} must use HTTPS.`);
    }
  } catch {
    errors.push(`${source.id} has an invalid URL.`);
  }

  if (!isIsoDate(source.accessedAt)) {
    errors.push(`${source.id} has an invalid accessedAt date.`);
  }

  if (source.publishedAt !== undefined && !isIsoDate(source.publishedAt)) {
    errors.push(`${source.id} has an invalid publishedAt date.`);
  }
}

export function validateContent(
  pack: StoryPack,
  assets: readonly AssetDefinition[],
  messages: Readonly<Record<string, string>>,
  levelDescriptors: readonly LevelDescriptor[] = [],
): readonly string[] {
  const errors: string[] = [];
  const chapters = pack.chapters;
  const nodes = chapters.flatMap((bundle) => bundle.nodes);
  const cards = chapters.flatMap((bundle) => bundle.dossierCards);
  const sources = chapters.flatMap((bundle) => bundle.sources);
  const ids = [
    ...chapters.map((bundle) => bundle.chapter.id),
    ...nodes.map((node) => node.id),
    ...cards.map((card) => card.id),
    ...sources.map((source) => source.id),
  ];
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  for (const duplicateId of new Set(duplicateIds)) {
    errors.push(`Duplicate ID: ${duplicateId}.`);
  }

  const namespace = `${pack.id}.`;
  for (const id of ids) {
    if (!id.startsWith(namespace)) {
      errors.push(`${id} is outside the ${pack.id} namespace.`);
    }
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const sourceIds = new Set(sources.map((source) => source.id));
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const levelDescriptorKeys = new Set(
    levelDescriptors.map(
      (descriptor) => `${descriptor.levelId}\u0000${descriptor.configId}`,
    ),
  );

  for (const bundle of chapters) {
    const chapter = bundle.chapter;
    for (const nodeId of [
      chapter.entryNodeId,
      chapter.checkpointNodeId,
      ...(chapter.exitNodeId === undefined ? [] : [chapter.exitNodeId]),
    ]) {
      const node = nodeById.get(nodeId);
      if (node?.chapterId !== chapter.id) {
        errors.push(
          `${chapter.id} references node outside its chapter: ${nodeId}.`,
        );
      }
    }
  }

  for (const node of nodes) {
    for (const targetId of nodeTargets(node)) {
      if (!nodeById.has(targetId)) {
        errors.push(`${node.id} references missing node ${targetId}.`);
      }
    }

    for (const key of nodeMessageKeys(node)) {
      if (!Object.hasOwn(messages, key)) {
        errors.push(`${node.id} references missing message ${key}.`);
      }
    }

    if (node.type === "scene") {
      if (!assetById.has(node.backgroundAssetId)) {
        errors.push(
          `${node.id} references missing asset ${node.backgroundAssetId}.`,
        );
      }

      for (const hotspot of node.hotspots) {
        const { x, y, width, height } = hotspot.rect;
        if (
          width <= 0 ||
          height <= 0 ||
          x < 0 ||
          y < 0 ||
          x + width > 100 ||
          y + height > 100
        ) {
          errors.push(`${hotspot.id} is outside the scene bounds.`);
        }
      }
    }

    if (node.type === "dossier-card" && !cardById.has(node.dossierCardId)) {
      errors.push(
        `${node.id} references missing dossier card ${node.dossierCardId}.`,
      );
    }

    // The lethal choice rules of ADR-013, enforced at build time: gated to the
    // Cacciatore in the complete edition, behind a confirmation that opens on
    // the cancel action, with at least two unconditional non-lethal options.
    if (node.type === "choice") {
      const lethalOptions = node.options.filter((option) =>
        option.sensitivityTags?.includes("impliedAnimalDeath"),
      );
      for (const option of lethalOptions) {
        if (option.confirmation?.safeInitialFocus !== "cancel") {
          errors.push(
            `${option.id} needs a confirmation with the focus on cancel.`,
          );
        }
        // The `sensitivity-is complete` clause of ADR-013 fell away with the
        // axis itself (ADR-048): the edition IS complete, so the gate that
        // still means something is the role.
        const conditions = option.when ?? [];
        const gatedToHunter = conditions.some(
          (condition) =>
            condition.type === "role-is" && condition.role === "hunter",
        );
        if (!gatedToHunter) {
          errors.push(`${option.id} must be gated to the hunter.`);
        }
        const target = nodeById.get(option.targetNodeId);
        if (
          target?.type !== "ending" ||
          !target.sensitivityTags?.includes("impliedAnimalDeath")
        ) {
          errors.push(
            `${option.id} must target an ending tagged impliedAnimalDeath.`,
          );
        }
      }
      if (lethalOptions.length > 0) {
        const alwaysVisibleAlternatives = node.options.filter(
          (option) =>
            option.sensitivityTags === undefined &&
            (option.when === undefined || option.when.length === 0),
        );
        if (alwaysVisibleAlternatives.length < 2) {
          errors.push(
            `${node.id} needs at least two unconditional non-lethal options.`,
          );
        }
      }
    }

    if (node.type === "surprise") {
      const host = nodeById.get(node.hostSceneNodeId);
      if (host?.type !== "scene" || host.noSurprise === true) {
        errors.push(`${node.id} has an invalid surprise host.`);
      }
      if (!assetById.has(node.assetId)) {
        errors.push(`${node.id} references missing asset ${node.assetId}.`);
      }
    }

    if (
      node.type === "level" &&
      !levelDescriptorKeys.has(`${node.levelId}\u0000${node.configId}`)
    ) {
      errors.push(
        `${node.id} references missing level configuration ${node.levelId}/${node.configId}.`,
      );
    }
  }

  for (const descriptor of levelDescriptors) {
    for (const key of descriptor.messageKeys) {
      if (!Object.hasOwn(messages, key)) {
        errors.push(
          `${descriptor.levelId}/${descriptor.configId} references missing message ${key}.`,
        );
      }
    }
  }

  for (const asset of assets) {
    if (!Object.hasOwn(messages, asset.altKey)) {
      errors.push(
        `${asset.id} references missing alt message ${asset.altKey}.`,
      );
    }
  }

  for (const source of sources) {
    validateSource(source, errors);
  }

  for (const card of cards) {
    validateDossierCard(card, sourceIds, errors);
    for (const key of dossierMessageKeys(card)) {
      if (!Object.hasOwn(messages, key)) {
        errors.push(`${card.id} references missing message ${key}.`);
      }
    }
  }

  const entryNodeId = chapters[0]?.chapter.entryNodeId;
  if (entryNodeId === undefined) {
    errors.push(`${pack.id} has no entry chapter.`);
  } else {
    const reachable = new Set<string>();
    const pending = [entryNodeId];
    while (pending.length > 0) {
      const nodeId = pending.pop();
      if (nodeId === undefined || reachable.has(nodeId)) {
        continue;
      }
      reachable.add(nodeId);
      const node = nodeById.get(nodeId);
      if (node !== undefined) {
        pending.push(...nodeTargets(node));
      }
    }

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push(`${node.id} is unreachable from ${entryNodeId}.`);
      }
    }
  }

  if (
    !nodes.some(
      (node) =>
        node.type === "ending" &&
        node.outcomeId === "core.outcome.open-mystery",
    )
  ) {
    errors.push("Missing core.outcome.open-mystery fallback ending.");
  }

  return errors;
}

export function assertValidContent(
  pack: StoryPack,
  assets: readonly AssetDefinition[],
  messages: Readonly<Record<string, string>>,
): void {
  const errors = validateContent(pack, assets, messages);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
