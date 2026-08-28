import { endingOutcomes } from "../../core/endings";
import type { OutcomeId } from "../../core/model";

/**
 * The endings the player has already reached, across every run (FASE 4).
 * Local only, like the personal best and «La Collezione»: no account, no
 * leaderboard, no identifier — just which of the six endings this browser has
 * seen, so the ending card can honestly say «Hai scoperto N dei 6 finali».
 */
export interface DiscoveredEndingsPort {
  readonly load: () => readonly OutcomeId[];
  readonly record: (outcomeId: OutcomeId) => void;
  readonly clear: () => void;
}

export const discoveredEndingsKey = "varano-239.discovered-endings";

const knownOutcomes = new Set<string>(endingOutcomes);

export class LocalDiscoveredEndings implements DiscoveredEndingsPort {
  constructor(private readonly storage: Storage) {}

  load(): readonly OutcomeId[] {
    try {
      const raw = this.storage.getItem(discoveredEndingsKey);
      if (raw === null) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (id): id is OutcomeId =>
          typeof id === "string" && knownOutcomes.has(id),
      );
    } catch {
      return [];
    }
  }

  record(outcomeId: OutcomeId): void {
    if (!knownOutcomes.has(outcomeId)) {
      return;
    }
    try {
      const current = new Set(this.load());
      current.add(outcomeId);
      this.storage.setItem(discoveredEndingsKey, JSON.stringify([...current]));
    } catch {
      // Optional, like every local persistence port.
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(discoveredEndingsKey);
    } catch {
      // Optional.
    }
  }
}
