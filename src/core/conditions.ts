import type { CompletedSetup, RunState } from "./game-state";
import type { Condition } from "./model";

export interface ConditionContext {
  readonly setup: CompletedSetup;
  readonly run: RunState;
}

export function matchesCondition(
  condition: Condition,
  context: ConditionContext,
): boolean {
  switch (condition.type) {
    case "role-is":
      return context.setup.role === condition.role;
    case "approach-is":
      return context.setup.approach === condition.approach;
    case "sensitivity-is":
      return context.setup.sensitivity === condition.sensitivity;
    case "story-scope-is":
      return context.setup.storyScope === condition.scope;
    case "flag-is":
      return context.run.flags[condition.flagId] === condition.value;
    case "score-at-least":
      return context.run[condition.score] >= condition.value;
    case "condition-is":
      return context.run.condition === condition.value;
    case "fate-is":
      return context.run.varanoFate === condition.fate;
    case "has-item":
      return context.run.inventory.includes(condition.itemId);
    case "has-seal":
      return context.run.seals.includes(condition.sealId);
    case "has-clue":
      return context.run.discoveredClueIds.includes(condition.clueId);
    case "theory-selected":
      return (
        context.run.selectedTheoryByMystery[condition.mysteryId] ===
        condition.theoryId
      );
    case "pack-complete":
      return context.run.completedPackIds.includes(condition.packId);
    case "choice-is":
      return context.run.choices[condition.choiceId] === condition.optionId;
  }
}

export function matchesConditions(
  conditions: readonly Condition[] | undefined,
  context: ConditionContext,
): boolean {
  return (
    conditions?.every((condition) => matchesCondition(condition, context)) ??
    true
  );
}
