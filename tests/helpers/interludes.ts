/**
 * The interlude of every chapter between the prologue and the finale, in
 * STORY order. Walkthrough tests — reducer walks and e2e alike — derive their
 * steps from this list, so adding a chapter to the campaign means adding one
 * entry here instead of editing thirty lines across three files (ADR-045).
 *
 * `undefined` marks a chapter whose dialogue hands over directly with no
 * interlude choice (today only the castle keep, whose outlet is the tower).
 */
export interface CoreInterlude {
  /** The option a mechanical walkthrough picks. */
  readonly optionId: string;
  /** Its button text key, for DOM and e2e walkthroughs. */
  readonly textKey: string;
}

export const coreInterludes: readonly (CoreInterlude | undefined)[] = [
  // c01 — Le chat di paese.
  {
    optionId: "core.option.chat.call",
    textKey: "core.message.choice2.call",
  },
  // c05 — La zona interdetta.
  {
    optionId: "core.option.zona.photo",
    textKey: "core.message.choice-zona.photo",
  },
  // c02 — Varano superstar.
  {
    optionId: "core.option.superstar.hand-over",
    textKey: "core.message.choice3.hand-over",
  },
  // c03 — Il parco del Castello.
  {
    optionId: "core.option.park.photograph",
    textKey: "core.message.choice4.photograph",
  },
  // c04 — Dentro il Castello: the reveal hands over to the confrontation.
  undefined,
];

/**
 * The interludes of every chapter BEFORE «Varano superstar», where the ★
 * powers debut: tests that navigate to level 3 walk exactly these. Computed,
 * so inserting the long-night chapters never edits the navigation tests.
 */
export const interludesBeforeSuperstar: readonly (CoreInterlude | undefined)[] =
  coreInterludes.slice(
    0,
    coreInterludes.findIndex((interlude) =>
      interlude?.optionId.startsWith("core.option.superstar"),
    ),
  );
