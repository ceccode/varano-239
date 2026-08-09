import type {
  AccessibilitySettings,
  GameState,
  RunState,
  SetupDraft,
} from "./game-state";

export const saveVersion = 2;

export interface SaveEnvelope {
  readonly version: typeof saveVersion;
  readonly state: GameState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isBooleanRecord(
  value: unknown,
): value is Readonly<Record<string, boolean>> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "boolean")
  );
}

function isStringRecord(
  value: unknown,
): value is Readonly<Record<string, string>> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function isStringMember<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T {
  return (
    typeof value === "string" &&
    allowedValues.some((allowedValue) => allowedValue === value)
  );
}

function isSetupDraft(value: unknown): value is SetupDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.role === undefined ||
      isStringMember(value.role, ["hunter", "guardian", "mayor", "varano"])) &&
    (value.storyScope === undefined ||
      isStringMember(value.storyScope, ["core", "origins", "all-registered"]))
  );
}

function isSettings(value: unknown): value is AccessibilitySettings {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringMember(value.playMode, ["standard", "story", "calm"]) &&
    isStringMember(value.textScale, ["small", "medium", "large"]) &&
    typeof value.highContrast === "boolean" &&
    typeof value.musicEnabled === "boolean" &&
    typeof value.effectsEnabled === "boolean" &&
    typeof value.dialectEnabled === "boolean"
  );
}

function isRunState(value: unknown): value is RunState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.currentNodeId === "string" &&
    typeof value.checkpointNodeId === "string" &&
    typeof value.coreCheckpointNodeId === "string" &&
    typeof value.evidence === "number" &&
    Number.isFinite(value.evidence) &&
    typeof value.care === "number" &&
    Number.isFinite(value.care) &&
    typeof value.publicTrust === "number" &&
    Number.isFinite(value.publicTrust) &&
    isStringMember(value.condition, [
      "unknown",
      "healthy",
      "weak",
      "critical",
    ]) &&
    isStringArray(value.seals) &&
    isStringArray(value.inventory) &&
    isBooleanRecord(value.flags) &&
    isStringArray(value.dossierCardIdsSeen) &&
    isStringArray(value.discoveredClueIds) &&
    isStringArray(value.completedPackIds) &&
    isStringMember(value.varanoFate, [
      "unresolved",
      "rescued",
      "escaped",
      "killedByHunter",
    ]) &&
    isStringRecord(value.selectedTheoryByMystery) &&
    isStringArray(value.visitedNodeIds) &&
    isStringRecord(value.choices) &&
    (value.outcomeId === undefined || typeof value.outcomeId === "string")
  );
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringMember(value.phase, ["title", "playing", "ending"]) &&
    isSetupDraft(value.setup) &&
    isSettings(value.settings) &&
    (value.run === undefined || isRunState(value.run)) &&
    (value.phase === "playing" || value.phase === "ending"
      ? value.run !== undefined
      : true)
  );
}

/**
 * Node IDs a content refactor renamed. Renaming needs a pure, tested migration
 * (EXPANSIONS.md), so a run saved on an old ID keeps working instead of landing
 * on «questa parte della storia non è disponibile».
 */
const renamedNodeIds: Readonly<Record<string, string>> = {
  // The open ending moved into its own finale chapter (ADR-034).
  "core.node.superstar.ending": "core.node.finale.open-mystery",
};

function currentNodeId(nodeId: string): string {
  return renamedNodeIds[nodeId] ?? nodeId;
}

function migrateRun(run: RunState): RunState {
  return {
    ...run,
    currentNodeId: currentNodeId(run.currentNodeId),
    checkpointNodeId: currentNodeId(run.checkpointNodeId),
    coreCheckpointNodeId: currentNodeId(run.coreCheckpointNodeId),
    visitedNodeIds: run.visitedNodeIds.map(currentNodeId),
  };
}

export function encodeSave(state: GameState): SaveEnvelope {
  return { version: saveVersion, state };
}

export function decodeSave(value: unknown): GameState | undefined {
  if (
    !isRecord(value) ||
    value.version !== saveVersion ||
    !isGameState(value.state)
  ) {
    return undefined;
  }

  const state = value.state;
  return state.run === undefined
    ? state
    : { ...state, run: migrateRun(state.run) };
}
