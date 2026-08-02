import type { AssetId, MessageKey } from "../core/model";
import fieldNightUrl from "./scenes/field-night.svg";
import fieldRunUrl from "./scenes/field-run.svg";
import varanoTailUrl from "./sprites/varano-tail.svg";
import varanoRunUrl from "./sprites/varano-run.svg";

export interface AssetDefinition {
  readonly id: AssetId;
  readonly src: string;
  readonly altKey: MessageKey;
}

export const assetManifest = [
  {
    id: "core.asset.scene.field-night",
    src: fieldNightUrl,
    altKey: "core.message.scene.field.alt",
  },
  {
    id: "core.asset.scene.field-run",
    src: fieldRunUrl,
    altKey: "core.message.level.background.alt",
  },
  {
    id: "core.asset.sprite.varano-tail",
    src: varanoTailUrl,
    altKey: "core.message.surprise.tail.alt",
  },
  {
    id: "core.asset.sprite.varano-run",
    src: varanoRunUrl,
    altKey: "core.message.level.player.alt",
  },
] as const satisfies readonly AssetDefinition[];
