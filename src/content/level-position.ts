import type { NodeId, StoryGraph } from "../core/model";

export interface LevelPosition {
  /** 1-based position of the level in story order. */
  readonly index: number;
  readonly total: number;
}

/**
 * Where a level sits in the campaign (ADR-045). Computed from the graph —
 * whose node order is the chapters' story order — so inserting a chapter in
 * the middle renumbers every heading and status line by itself, instead of
 * leaving stale «Livello N» copy around.
 */
export function levelPosition(
  story: StoryGraph,
  nodeId: NodeId,
): LevelPosition | undefined {
  const levels = story.nodes.filter((node) => node.type === "level");
  const index = levels.findIndex((node) => node.id === nodeId);
  return index === -1 ? undefined : { index: index + 1, total: levels.length };
}
