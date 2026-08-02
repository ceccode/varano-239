export interface BestScorePort {
  readonly load: () => number | undefined;
  readonly save: (score: number) => void;
  readonly clear: () => void;
}

export const bestScoreKey = "varano-239.best-score";

export class LocalBestScore implements BestScorePort {
  constructor(private readonly storage: Storage) {}

  load(): number | undefined {
    const raw = this.storage.getItem(bestScoreKey)?.trim();
    // An empty entry is absent, not a score of zero: Number("") would be 0.
    if (raw === undefined || raw === "") {
      return undefined;
    }
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }

  save(score: number): void {
    this.storage.setItem(bestScoreKey, String(Math.round(score)));
  }

  clear(): void {
    this.storage.removeItem(bestScoreKey);
  }
}
