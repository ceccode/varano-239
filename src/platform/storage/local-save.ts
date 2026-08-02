import type { GameState } from "../../core/game-state";
import type { SavePort } from "../../core/ports";
import { decodeSave, encodeSave } from "../../core/save";

export const localSaveKey = "varano-239.save";

export class LocalSave implements SavePort {
  constructor(private readonly storage: Storage) {}

  load(): GameState | undefined {
    try {
      const serialized = this.storage.getItem(localSaveKey);
      return serialized === null
        ? undefined
        : decodeSave(JSON.parse(serialized));
    } catch {
      return undefined;
    }
  }

  save(state: GameState): void {
    this.storage.setItem(localSaveKey, JSON.stringify(encodeSave(state)));
  }

  clear(): void {
    this.storage.removeItem(localSaveKey);
  }
}
