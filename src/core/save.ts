import {
  createInitialState,
  type AccessibilitySettings,
  type GameState,
  type RunState,
  type SetupDraft,
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

/**
 * Settings decode tolerantly (ADR-053): each field is validated on its own
 * and falls back to its default, so adding or removing a preference never
 * wipes a run again — the old all-or-nothing validator turned any settings
 * change into a silent save discard. Runs stay strict: a corrupt run is
 * where discarding is right.
 */
function tolerantSettings(value: unknown): AccessibilitySettings {
  const defaults = createInitialState().settings;
  if (!isRecord(value)) {
    return defaults;
  }
  return {
    playMode: isStringMember(value.playMode, ["standard", "story", "calm"])
      ? value.playMode
      : defaults.playMode,
    textScale: isStringMember(value.textScale, ["small", "medium", "large"])
      ? value.textScale
      : defaults.textScale,
    highContrast:
      typeof value.highContrast === "boolean"
        ? value.highContrast
        : defaults.highContrast,
    musicEnabled:
      typeof value.musicEnabled === "boolean"
        ? value.musicEnabled
        : defaults.musicEnabled,
    effectsEnabled:
      typeof value.effectsEnabled === "boolean"
        ? value.effectsEnabled
        : defaults.effectsEnabled,
  };
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

  // Settings are absent here on purpose: they decode tolerantly in
  // decodeSave, never vetoing the whole state (ADR-053).
  return (
    isStringMember(value.phase, ["title", "playing", "ending"]) &&
    isSetupDraft(value.setup) &&
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

  const raw = value.state as GameState & { settings?: unknown };
  const state: GameState = {
    ...raw,
    settings: tolerantSettings(raw.settings),
  };
  return state.run === undefined
    ? state
    : { ...state, run: migrateRun(state.run) };
}
