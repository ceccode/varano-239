import type { DossierCardId, MessageKey, SourceId } from "../core/model";

export type TruthLabel =
  "fact" | "testimony" | "hypothesis" | "legend" | "disproven";

export interface SourceRef {
  readonly id: SourceId;
  readonly publisher: string;
  readonly title: string;
  readonly url: string;
  readonly publishedAt?: string;
  readonly accessedAt: string;
}

export interface DossierCard {
  readonly id: DossierCardId;
  readonly label: TruthLabel;
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
  readonly sourceIds: readonly SourceId[];
  readonly refutationSourceIds?: readonly SourceId[];
  readonly fictionNoticeKey?: MessageKey;
  readonly verifiedAt: string;
}
