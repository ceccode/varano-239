import type { OutcomeId } from "./model";

/**
 * The six campaign endings in their canonical presentation order (ADR-047).
 * The order follows the finale chapter's ending nodes, so the «FINALE X/6»
 * label is stable across runs and editions — a numbered position, never a
 * ranking. The labels themselves stay in the message catalogues; this module
 * only answers «which of the six is this?».
 */
export const endingOutcomes: readonly OutcomeId[] = [
  "core.outcome.varano-chooses-rescue",
  "core.outcome.escaped-alive",
  "core.outcome.varano-count",
  "core.outcome.count-of-six-hills",
  "core.outcome.hunter-killed-varano",
  "core.outcome.open-mystery",
];

export const endingCount = endingOutcomes.length;

/**
 * The 1-based position of an outcome among the six endings, or `undefined`
 * when the outcome is not part of the closed campaign. The caller decides how
 * to render an unknown outcome; the UI simply omits the label.
 */
export function endingNumber(
  outcomeId: OutcomeId | undefined,
): number | undefined {
  if (outcomeId === undefined) {
    return undefined;
  }
  const index = endingOutcomes.indexOf(outcomeId);
  return index === -1 ? undefined : index + 1;
}
