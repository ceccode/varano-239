import type { AssetDefinition } from "../../assets/manifest";
import type { Locale } from "../../core/model";
import type { GameAction } from "../../core/actions";
import type { LevelOutcome } from "../../levels/contract";
import { drawScoreCard } from "./score-card";
import { drawMemeCard, type MemeAccessory } from "./meme-card";
import { shareScoreCard, type ShareOutcome } from "./share-card";
import { checkForUpdates, type ContainerLike } from "../pwa/sw-update";
import { levelPowerLabelKey } from "../../levels/registry";
import type { LevelRecord } from "../storage/level-records";
import { matchesConditions } from "../../core/conditions";
import { endingCount, endingNumber } from "../../core/endings";
import { levelPosition } from "../../content/level-position";
import { completeSetup, type GameState } from "../../core/game-state";
import type {
  ChoiceConfirmation,
  ChoiceOption,
  MessageKey,
  Role,
  StoryGraph,
  StoryNode,
} from "../../core/model";

interface GameContent {
  readonly story: StoryGraph;
  readonly assets: readonly AssetDefinition[];
  /** Optional values fill `{name}` placeholders, keeping copy out of the DOM layer. */
  readonly message: (
    key: MessageKey,
    values?: Readonly<Record<string, string | number>>,
  ) => string;
}

export interface RenderGameAppOptions {
  readonly document: Document;
  readonly mount: HTMLElement;
  readonly state: GameState;
  readonly savedState: GameState | undefined;
  readonly lastOutcome?: LevelOutcome | undefined;
  readonly bestScore?: number | undefined;
  readonly isRecord?: boolean | undefined;
  /** The per-level archive behind «La Collezione» (ADR-057). */
  readonly levelRecords?: Readonly<Record<string, LevelRecord>> | undefined;
  /** The endings already reached, for the «FINALE X/6» progress (FASE 4). */
  readonly discoveredEndings?: readonly string[] | undefined;
  readonly content: GameContent;
  readonly dispatch: (action: GameAction) => void;
  readonly onMenuToggled?: (open: boolean) => void;
  /** Restarts the mounted level's attempt (ADR-051); menu-only, arcade-only. */
  readonly onRestartLevel?: (() => void) | undefined;
  /** Whether the level should open with its briefing card (ADR-034). */
  readonly showBriefing?: boolean | undefined;
  readonly onBriefingCleared?: (() => void) | undefined;
  /** Counts the intent only; no card, score or ending data leaves the device. */
  readonly onShareAttempt?: (() => void) | undefined;
  /** The ending's explicit new-run control, distinct from clearing local data. */
  readonly onReplayStart?: (() => void) | undefined;
}

interface RenderContext extends RenderGameAppOptions {
  readonly screen: HTMLElement;
}

const repositoryUrl = "https://github.com/ceccode/varano-239";
const sourcesDocumentUrl = `${repositoryUrl}/blob/main/docs/SOURCES.md`;
// Same-origin legal pages: they work offline and under any base path.
function legalPageUrl(context: RenderContext, page: "privacy" | "terms") {
  if (context.state.settings.locale === "en") {
    return page === "privacy" ? "../privacy-en.html" : "../terms-en.html";
  }
  return page === "privacy" ? "privacy.html" : "termini.html";
}

const roleObjectiveKeys: Readonly<Record<Role, MessageKey>> = {
  hunter: "core.message.scene.objective.hunter",
  guardian: "core.message.scene.objective.guardian",
  mayor: "core.message.scene.objective.mayor",
  varano: "core.message.scene.objective.varano",
};

/** Short role names for the shareable cards, where the full title is too long. */
const roleShortKeys: Readonly<Record<Role, MessageKey>> = {
  varano: "core.message.ui.ending.role.varano",
  hunter: "core.message.ui.ending.role.hunter",
  guardian: "core.message.ui.ending.role.guardian",
  mayor: "core.message.ui.ending.role.mayor",
};

function element<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function heading(context: RenderContext, key: MessageKey): HTMLHeadingElement {
  const title = element(context.document, "h2", context.content.message(key));
  title.tabIndex = -1;
  title.dataset.focusTarget = "screen-heading";
  context.screen.append(title);
  return title;
}

function button(
  context: RenderContext,
  key: MessageKey,
  action: GameAction,
): HTMLButtonElement {
  const control = element(
    context.document,
    "button",
    context.content.message(key),
  );
  control.type = "button";
  control.addEventListener("click", () => {
    context.dispatch(action);
  });
  return control;
}

function findNode(context: RenderContext): StoryNode | undefined {
  return context.state.run === undefined
    ? undefined
    : context.content.story.nodes.find(
        (node) => node.id === context.state.run?.currentNodeId,
      );
}

function checkbox(
  context: RenderContext,
  labelKey: MessageKey,
  checked: boolean,
  onChange: (value: boolean) => GameAction,
): HTMLLabelElement {
  const label = element(context.document, "label");
  label.className = "toggle-option";
  const input = element(context.document, "input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => {
    context.dispatch(onChange(input.checked));
  });
  label.append(
    input,
    element(context.document, "span", context.content.message(labelKey)),
  );
  return label;
}

interface RadioOption<T extends string> {
  readonly value: T;
  readonly labelKey: MessageKey;
  readonly bodyKey?: MessageKey;
}

function radioGroup<T extends string>(
  context: RenderContext,
  name: string,
  legendKey: MessageKey,
  options: readonly RadioOption<T>[],
  selected: T | undefined,
  onChange: (value: T) => GameAction,
): HTMLFieldSetElement {
  const fieldset = element(context.document, "fieldset");
  const legend = element(
    context.document,
    "legend",
    context.content.message(legendKey),
  );
  const choices = element(context.document, "div");
  choices.className = "radio-cards";
  fieldset.append(legend, choices);

  for (const option of options) {
    const label = element(context.document, "label");
    const input = element(context.document, "input");
    const copy = element(context.document, "span");
    const title = element(
      context.document,
      "strong",
      context.content.message(option.labelKey),
    );
    input.type = "radio";
    input.name = name;
    input.value = option.value;
    input.checked = selected === option.value;
    input.addEventListener("change", () => {
      if (input.checked) {
        context.dispatch(onChange(option.value));
      }
    });
    label.className = "radio-card";
    copy.className = "radio-card__copy";
    copy.append(title);
    if (option.bodyKey !== undefined) {
      const body = element(
        context.document,
        "span",
        context.content.message(option.bodyKey),
      );
      body.className = "radio-card__body";
      copy.append(body);
    }
    label.append(input, copy);
    choices.append(label);
  }

  return fieldset;
}

function overlayCard(context: RenderContext): HTMLElement {
  const card = element(context.document, "section");
  card.className = "overlay-card game-screen";
  context.screen.append(card);
  return card;
}

/**
 * The arcade is the default for everyone (ADR-046): the system's
 * reduced-motion signal no longer reroutes to the assisted card — on Samsung
 * phones the battery saver raises it silently, and players never saw the
 * game. The assisted path stays behind the dormant story/calm play modes;
 * «Salta il livello» remains the universal accessible route.
 */
function isAssisted(context: RenderContext): boolean {
  return context.state.settings.playMode !== "standard";
}

/** A labelled block of the briefing: «Dove eravamo», «Che cosa devi fare»… */
function briefingSection(
  context: RenderContext,
  labelKey: MessageKey,
  bodyKey: MessageKey,
): HTMLElement {
  const section = element(context.document, "div");
  section.className = "briefing__section";
  const label = element(
    context.document,
    "h3",
    context.content.message(labelKey),
  );
  label.className = "briefing__label";
  section.append(
    label,
    element(context.document, "p", context.content.message(bodyKey)),
  );
  return section;
}

/**
 * The briefing card (ADR-034). It recaps the story and states the objective, so
 * a ten-level run stays followable, and it doubles as the assisted path's card:
 * same content, «Continua la storia» instead of «Gioca».
 */
function renderLevelBriefing(
  context: RenderContext,
  node: StoryNode & { type: "level" },
): void {
  const assisted = isAssisted(context);
  const card = overlayCard(context);
  card.classList.add("briefing");
  const cardContext: RenderContext = { ...context, screen: card };
  heading(cardContext, node.headingKey);

  // «Livello 3 di 10», computed from the graph (ADR-045).
  const position = levelPosition(context.content.story, node.id);
  if (position !== undefined) {
    const positionLine = element(
      context.document,
      "p",
      context.content.message("core.message.level.briefing.position", {
        index: position.index,
        total: position.total,
      }),
    );
    positionLine.className = "quiet-copy briefing__position";
    card.append(positionLine);
  }

  card.append(
    briefingSection(
      context,
      "core.message.level.briefing.recap",
      node.recapKey,
    ),
    briefingSection(
      context,
      "core.message.level.briefing.objective",
      node.introKey,
    ),
  );

  const powerLabelKey = levelPowerLabelKey(
    node.levelId,
    node.configId,
    context.state.setup.role ?? "varano",
  );
  if (powerLabelKey !== undefined && !assisted) {
    card.append(
      briefingSection(
        context,
        "core.message.level.briefing.power",
        powerLabelKey,
      ),
    );
  }

  // The run's reputation, in plain language (ADR-043/045): the three scores,
  // the Sei Colli seals once any are held, and the Varano's condition once it
  // is known.
  const run = context.state.run;
  if (run !== undefined) {
    const reputation = element(
      context.document,
      "p",
      context.content.message("core.message.level.briefing.reputation", {
        evidence: run.evidence,
        care: run.care,
        publicTrust: run.publicTrust,
      }) +
        (run.seals.length > 0
          ? ` ${context.content.message("core.message.level.briefing.seals", {
              seals: run.seals.length,
            })}`
          : "") +
        (run.condition === "healthy" || run.condition === "weak"
          ? ` ${context.content.message(
              run.condition === "healthy"
                ? "core.message.level.briefing.condition.healthy"
                : "core.message.level.briefing.condition.weak",
            )}`
          : ""),
    );
    reputation.className = "quiet-copy briefing__reputation";
    card.append(reputation);
  }

  const actions = element(context.document, "div");
  actions.className = "briefing__actions";

  if (assisted) {
    const notice = element(
      context.document,
      "p",
      context.content.message("core.message.level.assisted"),
    );
    notice.className = "scope-notice";
    card.append(notice);
    actions.append(
      button(cardContext, "core.message.level.continue", {
        type: "MINIGAME_SKIPPED",
      }),
    );
  } else {
    const play = element(
      context.document,
      "button",
      context.content.message("core.message.level.play"),
    );
    play.type = "button";
    play.dataset.briefingPlay = "";
    play.addEventListener("click", () => {
      context.onBriefingCleared?.();
    });
    actions.append(
      play,
      button(cardContext, "core.message.level.skip", {
        type: "MINIGAME_SKIPPED",
      }),
    );
  }

  card.append(actions);
}

function renderLevel(
  context: RenderContext,
  node: StoryNode & { type: "level" },
): void {
  if (isAssisted(context) || context.showBriefing === true) {
    renderLevelBriefing(context, node);
    return;
  }

  const srHeading = element(
    context.document,
    "h2",
    context.content.message(node.headingKey),
  );
  srHeading.className = "sr-only";
  srHeading.tabIndex = -1;
  srHeading.dataset.focusTarget = "screen-heading";
  const host = element(context.document, "div");
  host.className = "arcade-host";
  host.dataset.levelHost = "";
  context.screen.append(srHeading, host);
}

function findAsset(
  context: RenderContext,
  assetId: string,
): AssetDefinition | undefined {
  return context.content.assets.find((asset) => asset.id === assetId);
}

function renderScene(
  context: RenderContext,
  node: StoryNode & { type: "scene" },
): void {
  const card = overlayCard(context);
  const cardContext: RenderContext = { ...context, screen: card };
  heading(cardContext, "core.message.ui.scene.heading");
  const setup = completeSetup(context.state.setup);
  if (setup !== undefined) {
    // Only the role objective: the approach line always printed «rescue» to
    // everyone, because the axis had no UI and never changed (ADR-048).
    card.append(
      element(
        context.document,
        "p",
        context.content.message(roleObjectiveKeys[setup.role]),
      ),
    );
  }

  const asset = findAsset(context, node.backgroundAssetId);
  const scene = element(context.document, "div");
  scene.className = "scene-frame";
  if (asset !== undefined) {
    const image = element(context.document, "img");
    image.src = asset.src;
    image.alt = context.content.message(asset.altKey);
    image.width = 320;
    image.height = 180;
    scene.append(image);
  }

  const listHeading = element(
    context.document,
    "h3",
    context.content.message("core.message.ui.hotspot-list"),
  );
  const list = element(context.document, "ul");
  list.className = "action-list";
  for (const hotspot of node.hotspots) {
    const item = element(context.document, "li");
    const control = element(
      context.document,
      "button",
      context.content.message(hotspot.labelKey),
    );
    control.type = "button";
    control.addEventListener("click", () => {
      context.dispatch({
        type: "HOTSPOT_ACTIVATED",
        hotspotId: hotspot.id,
      });
    });
    item.append(control);
    list.append(item);
  }

  card.append(scene, listHeading, list);
}

/** The speaker's display-name key, derived by convention (ADR-043). */
function speakerNameKey(speakerId: string): MessageKey {
  return speakerId.replace(".speaker.", ".message.speaker.");
}

function renderDialogue(
  context: RenderContext,
  node: StoryNode & { type: "dialogue" },
): void {
  const card = overlayCard(context);
  const cardContext: RenderContext = { ...context, screen: card };
  heading(cardContext, "core.message.ui.dialogue.heading");
  const setup = completeSetup(context.state.setup);
  if (setup !== undefined && context.state.run !== undefined) {
    const dialogue = element(context.document, "div");
    dialogue.className = "dialogue";
    let index = 0;
    for (const line of node.lines) {
      if (matchesConditions(line.when, { setup, run: context.state.run })) {
        // One bubble per line, named and staggered like a conversation
        // (ADR-043). Everything is in the DOM at once — the stagger is CSS
        // only, so screen readers and reduced motion see the whole scene.
        const bubble = element(context.document, "div");
        bubble.className = "dialogue__line";
        bubble.style.animationDelay = `${String(index * 320)}ms`;
        const speaker = element(
          context.document,
          "strong",
          context.content.message(speakerNameKey(line.speakerId)),
        );
        speaker.className = "dialogue__speaker";
        bubble.append(
          speaker,
          element(context.document, "p", context.content.message(line.textKey)),
        );
        dialogue.append(bubble);
        index += 1;
      }
    }
    card.append(dialogue);
  }
  card.append(
    button(cardContext, "core.message.ui.continue", {
      type: "DIALOGUE_ADVANCED",
    }),
  );
}

function renderSurprise(
  context: RenderContext,
  node: StoryNode & { type: "surprise" },
): void {
  const dialog = element(context.document, "section");
  const title = element(
    context.document,
    "h2",
    context.content.message("core.message.ui.surprise.heading"),
  );
  title.id = "surprise-heading";
  dialog.className = "surprise-dialog overlay-card";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", title.id);
  dialog.append(title);
  const asset = findAsset(context, node.assetId);
  if (asset !== undefined) {
    const image = element(context.document, "img");
    image.className = "surprise-sprite";
    image.src = asset.src;
    image.alt = context.content.message(asset.altKey);
    image.width = 160;
    image.height = 64;
    dialog.append(image);
  }
  if (node.messageKey !== undefined) {
    dialog.append(
      element(context.document, "p", context.content.message(node.messageKey)),
    );
  }
  const dismiss = button(context, "core.message.ui.surprise.dismiss", {
    type: "SURPRISE_DISMISSED",
  });
  dismiss.dataset.focusTarget = "surprise-dismiss";
  dialog.append(dismiss);
  context.screen.append(dialog);
}

/**
 * The confirmation dialog of ADR-013: a second, explicit act with the focus
 * opening on «Torna indietro», so nothing irreversible happens by accident.
 * Cancelling returns the focus to the option that opened it.
 */
function openChoiceConfirmation(
  context: RenderContext,
  option: ChoiceOption & { confirmation: ChoiceConfirmation },
  opener: HTMLButtonElement,
): void {
  const confirmation = option.confirmation;
  const dialog = element(context.document, "section");
  dialog.className = "overlay-card game-screen choice-confirmation";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const title = element(
    context.document,
    "h2",
    context.content.message(confirmation.titleKey),
  );
  title.id = "choice-confirmation-heading";
  dialog.setAttribute("aria-labelledby", title.id);

  const body = element(
    context.document,
    "p",
    context.content.message(confirmation.bodyKey),
  );

  const actions = element(context.document, "div");
  actions.className = "choice-list";

  const cancel = element(
    context.document,
    "button",
    context.content.message(confirmation.cancelKey),
  );
  cancel.type = "button";
  cancel.addEventListener("click", () => {
    dialog.remove();
    opener.focus();
  });

  const confirm = element(
    context.document,
    "button",
    context.content.message(confirmation.confirmKey),
  );
  confirm.type = "button";
  confirm.className = "choice-confirmation__confirm";
  confirm.addEventListener("click", () => {
    context.dispatch({
      type: "OPTION_CHOSEN",
      optionId: option.id,
      confirmed: true,
    });
  });

  // Cancelling first, in reading order and in focus order alike.
  actions.append(cancel, confirm);
  dialog.append(title, body, actions);
  context.screen.append(dialog);
  cancel.focus();
}

function renderChoice(
  context: RenderContext,
  node: StoryNode & { type: "choice" },
): void {
  const card = overlayCard(context);
  const cardContext: RenderContext = { ...context, screen: card };
  heading(cardContext, node.headingKey ?? "core.message.ui.choice.heading");
  card.append(
    element(context.document, "p", context.content.message(node.promptKey)),
  );
  const choices = element(context.document, "div");
  choices.className = "choice-list";
  const setup = completeSetup(context.state.setup);
  for (const option of node.options) {
    if (
      setup !== undefined &&
      context.state.run !== undefined &&
      matchesConditions(option.when, { setup, run: context.state.run })
    ) {
      const control = element(
        context.document,
        "button",
        context.content.message(option.textKey),
      );
      control.type = "button";
      const confirmation = option.confirmation;
      control.addEventListener("click", () => {
        if (confirmation === undefined) {
          context.dispatch({ type: "OPTION_CHOSEN", optionId: option.id });
        } else {
          openChoiceConfirmation(context, { ...option, confirmation }, control);
        }
      });
      choices.append(control);
    }
  }
  card.append(choices);
}

const shareNoticeKeys: Readonly<Record<ShareOutcome, MessageKey | undefined>> =
  {
    shared: "core.message.ui.score.shared",
    downloaded: "core.message.ui.score.downloaded",
    copied: "core.message.ui.score.copied",
    unavailable: "core.message.ui.score.unavailable",
    // A deliberate cancellation needs no feedback.
    cancelled: undefined,
  };

function roleLabel(context: RenderContext): string {
  const role = context.state.setup.role ?? "varano";
  return context.content.message(
    roleSelectEntries.find((entry) => entry.role === role)?.titleKey ??
      "core.message.ui.role-select.varano.title",
  );
}

function renderScorePanel(context: RenderContext): HTMLElement | undefined {
  const outcome = context.lastOutcome;
  if (outcome === undefined) {
    return undefined;
  }

  const panel = element(context.document, "div");
  panel.className = "score-panel";

  const canvas = element(context.document, "canvas");
  canvas.className = "score-card";
  canvas.setAttribute(
    "aria-label",
    context.content.message("core.message.ui.score.card-alt"),
  );
  canvas.setAttribute("role", "img");
  const view = context.document.defaultView;
  const siteLabel =
    view === null ? "" : view.location.host.replace(/^www\./, "");
  drawScoreCard(canvas, {
    title: context.content.message("core.message.title"),
    subtitle: context.content.message("core.message.subtitle"),
    roleName: roleLabel(context),
    score: outcome.score,
    clues: outcome.clues,
    totalClues: outcome.totalClues,
    seconds: outcome.seconds,
    isRecord: context.isRecord === true,
    siteLabel,
    message: context.content.message,
  });

  const summary = element(
    context.document,
    "p",
    `${context.content.message("core.message.ui.score.last")}: ${String(outcome.score)}`,
  );
  summary.className = "score-panel__value";
  panel.append(canvas, summary);

  if (context.bestScore !== undefined) {
    panel.append(
      element(
        context.document,
        "p",
        `${context.content.message("core.message.ui.score.best")}: ${String(context.bestScore)}`,
      ),
    );
  }

  const share = element(
    context.document,
    "button",
    context.content.message("core.message.ui.score.share"),
  );
  share.type = "button";
  const notice = element(context.document, "p");
  notice.className = "quiet-copy";
  notice.setAttribute("role", "status");

  share.addEventListener("click", () => {
    context.onShareAttempt?.();
    if (view === null) {
      return;
    }
    const url = `${view.location.origin}${view.location.pathname}`;
    const text = context.content.message("core.message.ui.score.share-text", {
      score: outcome.score,
      clues: outcome.clues,
      totalClues: outcome.totalClues,
      seconds: outcome.seconds,
      url,
    });
    share.disabled = true;
    void shareScoreCard(view, {
      canvas,
      text,
      fileName: "varano-239-punteggio.png",
    })
      .then((result) => {
        const key = shareNoticeKeys[result];
        notice.textContent =
          key === undefined ? "" : context.content.message(key);
      })
      .finally(() => {
        share.disabled = false;
      });
  });

  panel.append(share, notice);
  return panel;
}

/**
 * What the varano wears on the completion meme card (ADR-049), by ending.
 * The lethal epilogue is deliberately absent: a grave scene gets no meme.
 */
const memeAccessoryByOutcome: Readonly<Record<string, MemeAccessory>> = {
  "core.outcome.varano-chooses-rescue": "bowtie",
  "core.outcome.escaped-alive": "sunglasses",
  "core.outcome.varano-count": "monocle",
  "core.outcome.count-of-six-hills": "crown",
  "core.outcome.open-mystery": "mystery",
};

/**
 * The completion meme card (ADR-049): the parting reward of a finished run,
 * always shareable like the score card — including a run that skipped every
 * level, which is why it does not depend on `lastOutcome`.
 */
function renderMemePanel(
  context: RenderContext,
  node: StoryNode & { type: "ending" },
): HTMLElement | undefined {
  const accessory = memeAccessoryByOutcome[node.outcomeId];
  if (accessory === undefined) {
    return undefined;
  }

  const panel = element(context.document, "div");
  panel.className = "score-panel";

  const canvas = element(context.document, "canvas");
  canvas.className = "score-card";
  canvas.setAttribute(
    "aria-label",
    context.content.message("core.message.ui.meme.card-alt"),
  );
  canvas.setAttribute("role", "img");
  const view = context.document.defaultView;
  const siteLabel =
    view === null ? "" : view.location.host.replace(/^www\./, "");
  const caption = context.content.message(node.titleKey);
  const number = endingNumber(node.outcomeId);
  const endingLabel =
    number === undefined
      ? undefined
      : context.content.message("core.message.ui.ending.number", {
          number,
          total: endingCount,
        });
  const role = context.state.setup.role ?? "varano";
  const roleShort = context.content.message(roleShortKeys[role]);
  const outcome = context.lastOutcome;
  const detailLine =
    outcome === undefined
      ? roleShort
      : context.content.message("core.message.ui.ending.detail", {
          role: roleShort,
          clues: outcome.clues,
          totalClues: outcome.totalClues,
        });
  drawMemeCard(canvas, {
    header: `${context.content.message("core.message.title")} · ${context.content.message("core.message.ui.legend-stamp")}`,
    caption,
    accessory,
    siteLabel,
    ...(endingLabel === undefined ? {} : { endingLabel }),
    detailLine,
  });

  const share = element(
    context.document,
    "button",
    context.content.message("core.message.ui.meme.share"),
  );
  share.type = "button";
  const notice = element(context.document, "p");
  notice.className = "quiet-copy";
  notice.setAttribute("role", "status");

  share.addEventListener("click", () => {
    context.onShareAttempt?.();
    if (view === null) {
      return;
    }
    const url = `${view.location.origin}${view.location.pathname}`;
    const text = context.content.message("core.message.ui.meme.share-text", {
      title: caption,
      url,
    });
    share.disabled = true;
    void shareScoreCard(view, {
      canvas,
      text,
      fileName: "varano-239-finale.png",
    })
      .then((result) => {
        const key = shareNoticeKeys[result];
        notice.textContent =
          key === undefined ? "" : context.content.message(key);
      })
      .finally(() => {
        share.disabled = false;
      });
  });

  panel.append(canvas, share, notice);
  return panel;
}

function renderEnding(
  context: RenderContext,
  node: StoryNode & { type: "ending" },
): void {
  const card = overlayCard(context);
  const cardContext: RenderContext = { ...context, screen: card };
  const number = endingNumber(node.outcomeId);
  if (number !== undefined) {
    const badge = element(context.document, "p");
    badge.className = "ending__number";
    badge.textContent = context.content.message(
      "core.message.ui.ending.number",
      { number, total: endingCount },
    );
    card.append(badge);
  }
  heading(cardContext, node.titleKey);
  card.append(
    element(context.document, "p", context.content.message(node.bodyKey)),
  );
  // The meme card first — the completion's own reward (ADR-049) — then the
  // score numbers, when a played level produced any.
  const memePanel = renderMemePanel(context, node);
  if (memePanel !== undefined) {
    card.append(memePanel);
  }
  const scorePanel = renderScorePanel(context);
  if (scorePanel !== undefined) {
    card.append(scorePanel);
  }
  const discovered = context.discoveredEndings?.length ?? 0;
  const progress = element(context.document, "p");
  progress.className = "ending__progress";
  progress.textContent = context.content.message(
    "core.message.ui.ending.progress",
    { discovered, total: endingCount },
  );
  card.append(progress);
  const restart = element(
    context.document,
    "button",
    context.content.message("core.message.ui.ending.restart"),
  );
  restart.type = "button";
  restart.addEventListener("click", () => {
    context.onReplayStart?.();
    context.dispatch({ type: "LOCAL_DATA_CLEARED" });
  });
  card.append(restart);
}

function renderUnavailable(context: RenderContext): void {
  const card = overlayCard(context);
  const cardContext: RenderContext = { ...context, screen: card };
  heading(cardContext, "core.message.ui.unavailable-node");
  card.append(
    button(cardContext, "core.message.ui.ending.restart", {
      type: "LOCAL_DATA_CLEARED",
    }),
  );
}

const roleSelectEntries: readonly {
  readonly role: Role;
  readonly titleKey: MessageKey;
  readonly goalKey: MessageKey;
}[] = [
  {
    role: "varano",
    titleKey: "core.message.ui.role-select.varano.title",
    goalKey: "core.message.ui.role-select.varano.goal",
  },
  {
    role: "hunter",
    titleKey: "core.message.ui.role-select.hunter.title",
    goalKey: "core.message.ui.role-select.hunter.goal",
  },
  {
    role: "guardian",
    titleKey: "core.message.ui.role-select.guardian.title",
    goalKey: "core.message.ui.role-select.guardian.goal",
  },
  {
    role: "mayor",
    titleKey: "core.message.ui.role-select.mayor.title",
    goalKey: "core.message.ui.role-select.mayor.goal",
  },
];

function renderRoleSelect(context: RenderContext): void {
  const panel = element(context.document, "section");
  panel.className = "role-select game-screen";
  const panelContext: RenderContext = { ...context, screen: panel };
  const language = element(context.document, "div");
  language.className = "language-select";
  language.setAttribute(
    "aria-label",
    context.content.message("core.message.ui.language.label"),
  );
  language.setAttribute("role", "group");
  for (const locale of ["it", "en"] as const satisfies readonly Locale[]) {
    const control = element(
      context.document,
      "a",
      context.content.message(`core.message.ui.language.${locale}`),
    );
    control.lang = locale;
    control.href =
      locale === context.state.settings.locale
        ? "./"
        : locale === "en"
          ? "en/"
          : "../";
    if (context.state.settings.locale === locale) {
      control.setAttribute("aria-current", "page");
    }
    language.append(control);
  }
  panel.append(language);
  heading(panelContext, "core.message.ui.role-select.heading");
  panel.append(
    element(
      context.document,
      "p",
      context.content.message("core.message.ui.role-select.body"),
    ),
  );

  const list = element(context.document, "div");
  list.className = "role-select__cards";
  for (const entry of roleSelectEntries) {
    const card = element(context.document, "button");
    card.type = "button";
    card.className = "role-card";
    const title = element(
      context.document,
      "strong",
      context.content.message(entry.titleKey),
    );
    const goal = element(
      context.document,
      "span",
      context.content.message(entry.goalKey),
    );
    card.append(title, goal);
    card.addEventListener("click", () => {
      context.dispatch({ type: "ROLE_SELECTED", value: entry.role });
      context.dispatch({ type: "RUN_STARTED" });
    });
    list.append(card);
  }
  panel.append(list);
  context.screen.append(panel);
}

function renderStage(context: RenderContext): void {
  if (context.state.phase === "title") {
    renderRoleSelect(context);
    return;
  }

  if (context.state.setup.storyScope !== "core") {
    const fallback = element(
      context.document,
      "p",
      context.content.message("core.message.ui.scope-fallback"),
    );
    fallback.className = "scope-notice scope-notice--floating";
    fallback.setAttribute("role", "status");
    context.screen.append(fallback);
  }

  const node = findNode(context);
  if (node === undefined) {
    if (context.state.run !== undefined) {
      renderUnavailable(context);
    }
    return;
  }

  switch (node.type) {
    case "scene":
      renderScene(context, node);
      return;
    case "dialogue":
      renderDialogue(context, node);
      return;
    case "surprise":
      renderSurprise(context, node);
      return;
    // Dossier cards stay in the content contract for a future Archive, but no
    // shipped node uses them (ADR-024).
    case "dossier-card":
      renderUnavailable(context);
      return;
    case "choice":
      renderChoice(context, node);
      return;
    case "ending":
      renderEnding(context, node);
      return;
    case "level":
      renderLevel(context, node);
      return;
    case "chapter-end":
      renderUnavailable(context);
      return;
  }
}

function menuSection(
  context: RenderContext,
  labelKey: MessageKey,
  wasOpen: boolean,
): HTMLDetailsElement {
  const details = element(context.document, "details");
  details.className = "menu-section";
  details.dataset.menuSection = labelKey;
  details.open = wasOpen;
  details.append(
    element(context.document, "summary", context.content.message(labelKey)),
  );
  return details;
}

function renderSettings(context: RenderContext): HTMLElement {
  const wrapper = element(context.document, "div");
  wrapper.className = "menu-settings";
  wrapper.append(
    radioGroup<Role>(
      context,
      "role",
      "core.message.ui.options.role.legend",
      [
        { value: "varano", labelKey: "core.message.ui.options.role.varano" },
        { value: "hunter", labelKey: "core.message.ui.options.role.hunter" },
        {
          value: "guardian",
          labelKey: "core.message.ui.options.role.guardian",
        },
        { value: "mayor", labelKey: "core.message.ui.options.role.mayor" },
      ],
      context.state.setup.role,
      (value) => ({ type: "ROLE_SELECTED", value }),
    ),
  );

  // Text scale and contrast (ADR-053): finally real, not just persisted.
  wrapper.append(
    radioGroup<"small" | "medium" | "large">(
      context,
      "text-scale",
      "core.message.ui.options.text.legend",
      [
        { value: "small", labelKey: "core.message.ui.options.text.small" },
        { value: "medium", labelKey: "core.message.ui.options.text.medium" },
        { value: "large", labelKey: "core.message.ui.options.text.large" },
      ],
      context.state.settings.textScale,
      (textScale) => ({ type: "SETTINGS_UPDATED", settings: { textScale } }),
    ),
  );

  const viewFieldset = element(context.document, "fieldset");
  viewFieldset.append(
    element(
      context.document,
      "legend",
      context.content.message("core.message.ui.options.view.legend"),
    ),
  );
  const viewToggles = element(context.document, "div");
  viewToggles.className = "toggle-options";
  viewToggles.append(
    checkbox(
      context,
      "core.message.ui.options.contrast",
      context.state.settings.highContrast,
      (highContrast) => ({
        type: "SETTINGS_UPDATED",
        settings: { highContrast },
      }),
    ),
  );
  viewFieldset.append(viewToggles);
  wrapper.append(viewFieldset);

  const audioFieldset = element(context.document, "fieldset");
  audioFieldset.append(
    element(
      context.document,
      "legend",
      context.content.message("core.message.ui.options.audio.legend"),
    ),
  );
  const toggles = element(context.document, "div");
  toggles.className = "toggle-options";
  toggles.append(
    checkbox(
      context,
      "core.message.ui.options.music",
      context.state.settings.musicEnabled,
      (musicEnabled) => ({
        type: "SETTINGS_UPDATED",
        settings: { musicEnabled },
      }),
    ),
    checkbox(
      context,
      "core.message.ui.options.effects",
      context.state.settings.effectsEnabled,
      (effectsEnabled) => ({
        type: "SETTINGS_UPDATED",
        settings: { effectsEnabled },
      }),
    ),
  );
  audioFieldset.append(toggles);
  wrapper.append(audioFieldset);
  return wrapper;
}

function sectionOpen(mount: HTMLElement, labelKey: MessageKey): boolean {
  return (
    mount.querySelector<HTMLDetailsElement>(
      `details[data-menu-section="${labelKey}"]`,
    )?.open ?? false
  );
}

function renderMenu(context: RenderContext): HTMLElement {
  const wasOpen =
    context.mount.querySelector<HTMLElement>("[data-menu]")?.hidden === false;
  const menu = element(context.document, "section");
  menu.className = "menu-overlay";
  menu.dataset.menu = "";
  menu.hidden = !wasOpen;

  const bar = element(context.document, "div");
  bar.className = "menu-bar";
  // With a level alive behind the overlay the menu IS the pause screen, and
  // it says so (ADR-051).
  const pausesLevel =
    context.onRestartLevel !== undefined && !isAssisted(context);
  const title = element(
    context.document,
    "h2",
    context.content.message(
      pausesLevel
        ? "core.message.ui.menu.paused"
        : "core.message.ui.menu.heading",
    ),
  );
  title.id = "menu-heading";
  title.tabIndex = -1;
  const close = element(
    context.document,
    "button",
    context.content.message("core.message.ui.menu.close"),
  );
  close.type = "button";
  close.dataset.menuClose = "";
  bar.append(title, close);
  menu.setAttribute("aria-labelledby", title.id);
  menu.append(bar);

  const settings = menuSection(
    context,
    "core.message.ui.menu.settings",
    sectionOpen(context.mount, "core.message.ui.menu.settings"),
  );
  settings.append(renderSettings(context));

  const collectionSection = menuSection(
    context,
    "core.message.ui.menu.collection",
    sectionOpen(context.mount, "core.message.ui.menu.collection"),
  );

  const credits = menuSection(
    context,
    "core.message.ui.menu.credits",
    sectionOpen(context.mount, "core.message.ui.menu.credits"),
  );
  const externalLink = (labelKey: MessageKey, href: string): HTMLElement => {
    const paragraph = element(context.document, "p");
    const link = element(
      context.document,
      "a",
      context.content.message(labelKey),
    );
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    paragraph.append(link);
    return paragraph;
  };
  credits.append(
    element(
      context.document,
      "p",
      context.content.message("core.message.ui.credits.body"),
    ),
    externalLink("core.message.ui.credits.link", repositoryUrl),
    externalLink("core.message.ui.credits.sources-link", sourcesDocumentUrl),
  );

  const privacy = menuSection(
    context,
    "core.message.ui.menu.privacy",
    sectionOpen(context.mount, "core.message.ui.menu.privacy"),
  );
  privacy.append(
    element(
      context.document,
      "p",
      context.content.message("core.message.ui.privacy.body"),
    ),
    externalLink(
      "core.message.ui.privacy.link",
      legalPageUrl(context, "privacy"),
    ),
  );

  const terms = menuSection(
    context,
    "core.message.ui.menu.terms",
    sectionOpen(context.mount, "core.message.ui.menu.terms"),
  );
  terms.append(
    element(
      context.document,
      "p",
      context.content.message("core.message.ui.terms.body"),
    ),
    externalLink("core.message.ui.terms.link", legalPageUrl(context, "terms")),
  );

  // Version and updates (ADR-054): the build id lands in the page's meta at
  // build time; «Controlla aggiornamenti» asks the worker to re-fetch now.
  const buildId =
    context.document
      .querySelector('meta[name="varano-build"]')
      ?.getAttribute("content") ?? "dev";
  const version = element(
    context.document,
    "p",
    context.content.message("core.message.ui.version", { build: buildId }),
  );
  version.className = "quiet-copy";
  const updateCheck = element(
    context.document,
    "button",
    context.content.message("core.message.ui.update.check"),
  );
  updateCheck.type = "button";
  updateCheck.className = "menu-clear";
  const updateNotice = element(context.document, "p");
  updateNotice.className = "quiet-copy";
  updateNotice.setAttribute("role", "status");
  updateCheck.addEventListener("click", () => {
    const container = context.document.defaultView?.navigator.serviceWorker as
      ContainerLike | undefined;
    if (container === undefined) {
      updateNotice.textContent = context.content.message(
        "core.message.ui.update.none",
      );
      return;
    }
    updateCheck.disabled = true;
    void checkForUpdates(container)
      .then((outcome) => {
        updateNotice.textContent = context.content.message(
          outcome === "pending"
            ? "core.message.ui.update.pending"
            : "core.message.ui.update.none",
        );
      })
      .finally(() => {
        updateCheck.disabled = false;
      });
  });

  // «La Collezione» (ADR-057): the campaign's levels in story order, with
  // what this browser has managed in each. Built from the graph, so
  // inserting a chapter renumbers the list by itself — as it did three
  // times during the long night.
  const collection = element(context.document, "div");
  collection.className = "collection";
  const levels = context.content.story.nodes.filter(
    (node) => node.type === "level",
  );
  const records = context.levelRecords ?? {};
  let visited = 0;
  levels.forEach((level, index) => {
    const record = records[level.levelId];
    const row = element(context.document, "div");
    row.className = "collection__row";
    const name = element(
      context.document,
      "p",
      `${String(index + 1)}. ${context.content.message(level.headingKey)}`,
    );
    name.className = "collection__name";
    row.append(name);

    if (record === undefined) {
      const pending = element(
        context.document,
        "p",
        context.content.message("core.message.ui.collection.pending"),
      );
      pending.className = "collection__pending quiet-copy";
      row.append(pending);
    } else {
      visited += 1;
      const marks = element(context.document, "p");
      marks.className = "collection__marks";
      const badges = [
        context.content.message("core.message.ui.collection.best", {
          score: record.score,
        }),
        context.content.message("core.message.ui.collection.clues", {
          clues: record.clues,
          total: record.totalClues,
        }),
      ];
      if (record.bonusCollected) {
        badges.push(context.content.message("core.message.ui.collection.star"));
      }
      if (record.cameoSeen) {
        badges.push(
          context.content.message("core.message.ui.collection.cameo"),
        );
      }
      if (record.unscathed) {
        badges.push(
          context.content.message("core.message.ui.collection.unscathed"),
        );
      }
      marks.textContent = badges.join(" · ");
      row.append(marks);
    }
    collection.append(row);
  });
  const summary = element(
    context.document,
    "p",
    context.content.message("core.message.ui.collection.summary", {
      visited,
      total: levels.length,
    }),
  );
  summary.className = "quiet-copy";
  collection.append(summary);

  collectionSection.append(collection);

  const clear = button(context, "core.message.ui.clear-save", {
    type: "LOCAL_DATA_CLEARED",
  });
  clear.className = "menu-clear";

  // «Riprova il livello» (ADR-051): arcade only, story untouched — the
  // menu-side twin of the KO card's retry. Wired to close the menu first
  // in renderGameApp, where closeMenu exists.
  if (pausesLevel) {
    const restart = element(
      context.document,
      "button",
      context.content.message("core.message.ui.menu.restart-level"),
    );
    restart.type = "button";
    restart.dataset.menuRestart = "";
    restart.className = "menu-clear";
    menu.append(restart);
  }

  const disclaimer = element(
    context.document,
    "p",
    context.content.message("core.message.ui.disclaimer"),
  );
  disclaimer.className = "quiet-copy";

  menu.append(
    settings,
    collectionSection,
    credits,
    privacy,
    terms,
    clear,
    version,
    updateCheck,
    updateNotice,
    disclaimer,
  );
  return menu;
}

interface HudHandle {
  readonly hud: HTMLElement;
  /** Closes the menu from outside the HUD — today, the Escape key. */
  readonly closeMenu: () => void;
  readonly isMenuOpen: () => boolean;
}

function renderHud(context: RenderContext, menu: HTMLElement): HudHandle {
  const hud = element(context.document, "header");
  hud.className = "hud";

  const siteTitle = element(context.document, "h1", "VARANO 2:39");
  siteTitle.className = "sr-only";

  const legend = element(
    context.document,
    "p",
    context.content.message("core.message.ui.legend-banner"),
  );
  legend.className = "legend-banner";

  const actions = element(context.document, "div");
  actions.className = "hud-actions";

  const node = findNode(context);
  // While the briefing is up the card carries its own skip, so the HUD stays
  // clear of a second identical button.
  if (
    node?.type === "level" &&
    !isAssisted(context) &&
    context.showBriefing !== true
  ) {
    const skip = button(context, "core.message.level.skip", {
      type: "MINIGAME_SKIPPED",
    });
    skip.className = "hud-skip";
    actions.append(skip);
  }

  const menuButton = element(
    context.document,
    "button",
    context.content.message("core.message.ui.menu.open"),
  );
  menuButton.type = "button";
  menuButton.className = "hud-menu";
  menuButton.dataset.menuButton = "";
  menuButton.setAttribute("aria-expanded", menu.hidden ? "false" : "true");

  const setMenuOpen = (open: boolean): void => {
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    // The overlay is opaque and full-screen, but Tab and a screen reader
    // used to walk straight into the game underneath it (ADR-050).
    // `inert` must be cleared before focus returns to the menu button.
    for (const covered of [hud, context.screen]) {
      if (open) {
        covered.setAttribute("inert", "");
      } else {
        covered.removeAttribute("inert");
      }
    }
    context.onMenuToggled?.(open);
    if (open) {
      menu.querySelector<HTMLElement>("#menu-heading")?.focus();
    } else {
      menuButton.focus();
    }
  };
  menuButton.addEventListener("click", () => {
    setMenuOpen(menu.hasAttribute("hidden"));
  });
  menu
    .querySelector<HTMLElement>("[data-menu-close]")
    ?.addEventListener("click", () => {
      setMenuOpen(false);
    });

  actions.append(menuButton);
  hud.append(siteTitle, legend, actions);
  return {
    hud,
    closeMenu: () => {
      setMenuOpen(false);
    },
    isMenuOpen: () => !menu.hidden,
  };
}

export function renderGameApp(options: RenderGameAppOptions): void {
  const shell = element(options.document, "section");
  shell.className = "game-shell";

  const stage = element(options.document, "div");
  stage.className = "stage";
  const context: RenderContext = { ...options, screen: stage };

  const menu = renderMenu(context);
  const { hud, closeMenu, isMenuOpen } = renderHud(context, menu);
  renderStage(context);

  // Escape closes the menu (ADR-050). The listener lives on the shell, which
  // is thrown away and rebuilt on every render, so it can never accumulate.
  shell.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      event.preventDefault();
      closeMenu();
    }
  });

  // The menu closes BEFORE the restart (ADR-051): closing resumes the level,
  // and the restart then swaps the queued frame for its own — one loop, never
  // two.
  menu
    .querySelector<HTMLElement>("[data-menu-restart]")
    ?.addEventListener("click", () => {
      closeMenu();
      options.onRestartLevel?.();
    });

  shell.append(hud, stage, menu);
  options.mount.replaceChildren(shell);
}
