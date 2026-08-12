import type { LevelId } from "../../core/model";

/**
 * The per-level archive behind «La Collezione» (ADR-057). Until now a level's
 * result vanished the moment its card was dismissed: the star and the cameo
 * had nowhere to be remembered, and there was nothing to come back for.
 *
 * Local only, like the personal best (ADR-023): no account, no leaderboard,
 * no identifier — just what this browser has managed, in this browser.
 */
export interface LevelRecord {
  readonly score: number;
  readonly clues: number;
  readonly totalClues: number;
  readonly bonusCollected: boolean;
  readonly cameoSeen: boolean;
  readonly unscathed: boolean;
}

export interface LevelRecordsPort {
  readonly load: () => Readonly<Record<LevelId, LevelRecord>>;
  /** Keeps the best of what is stored and what just happened, field by field. */
  readonly record: (levelId: LevelId, result: LevelRecord) => void;
  readonly clear: () => void;
}

export const levelRecordsKey = "varano-239.level-records";

function isRecordShape(value: unknown): value is LevelRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<LevelRecord>;
  return (
    typeof candidate.score === "number" &&
    Number.isFinite(candidate.score) &&
    typeof candidate.clues === "number" &&
    typeof candidate.totalClues === "number" &&
    typeof candidate.bonusCollected === "boolean" &&
    typeof candidate.cameoSeen === "boolean" &&
    typeof candidate.unscathed === "boolean"
  );
}

/**
 * The archive keeps the BEST of each field, never the latest: a run that
 * finally spots the cameo does not lose the star taken three runs ago.
 */
export function mergeRecords(
  previous: LevelRecord | undefined,
  next: LevelRecord,
): LevelRecord {
  if (previous === undefined) {
    return next;
  }
  return {
    score: Math.max(previous.score, next.score),
    clues: Math.max(previous.clues, next.clues),
    totalClues: next.totalClues,
    bonusCollected: previous.bonusCollected || next.bonusCollected,
    cameoSeen: previous.cameoSeen || next.cameoSeen,
    unscathed: previous.unscathed || next.unscathed,
  };
}

export class LocalLevelRecords implements LevelRecordsPort {
  constructor(private readonly storage: Storage) {}

  load(): Readonly<Record<LevelId, LevelRecord>> {
    let parsed: unknown;
    try {
      const raw = this.storage.getItem(levelRecordsKey);
      parsed = raw === null ? undefined : JSON.parse(raw);
    } catch {
      return {};
    }
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    // Entry by entry: one malformed level never costs the whole archive.
    const records: Record<LevelId, LevelRecord> = {};
    for (const [levelId, value] of Object.entries(parsed)) {
      if (isRecordShape(value)) {
        records[levelId] = value;
      }
    }
    return records;
  }

  record(levelId: LevelId, result: LevelRecord): void {
    const records = { ...this.load() };
    records[levelId] = mergeRecords(records[levelId], result);
    try {
      this.storage.setItem(levelRecordsKey, JSON.stringify(records));
    } catch {
      // The archive is a bonus; a full quota never breaks a run.
    }
  }

  clear(): void {
    this.storage.removeItem(levelRecordsKey);
  }
}
