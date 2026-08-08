import type { AssetDefinition } from "../../assets/manifest";
import type { GameAction } from "../../core/actions";
import type { LevelOutcome } from "../../levels/contract";
import { drawScoreCard } from "./score-card";
import { shareScoreCard, type ShareOutcome } from "./share-card";
import { levelPowerLabelKey } from "../../levels/registry";
import { matchesConditions } from "../../core/conditions";
import { levelPosition } from "../../content/level-position";
import { completeSetup, type GameState } from "../../core/game-state";
import type {
  Approach,
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
  readonly content: GameContent;
  readonly dispatch: (action: GameAction) => void;
  readonly onMenuToggled?: (open: boolean) => void;
  /** Whether the level should open with its briefing card (ADR-034). */
  readonly showBriefing?: boolean | undefined;
  readonly onBriefingCleared?: (() => void) | undefined;
}

interface RenderContext extends RenderGameAppOptions {
  readonly screen: HTMLElement;
}

const repositoryUrl = "https://github.com/ceccode/varano-239";
const sourcesDocumentUrl = `${repositoryUrl}/blob/main/docs/SOURCES.md`;
// Same-origin legal pages: they work offline and under any base path.
const privacyPageUrl = "privacy.html";
const termsPageUrl = "termini.html";

const roleObjectiveKeys: Readonly<Record<Role, MessageKey>> = {
  hunter: "core.message.scene.objective.hunter",
  guardian: "core.message.scene.objective.guardian",
  mayor: "core.message.scene.objective.mayor",
  varano: "core.message.scene.objective.varano",
};

const approachObjectiveKeys: Readonly<Record<Approach, MessageKey>> = {
  evidence: "core.message.scene.approach.evidence",
  rescue: "core.message.scene.approach.rescue",
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

function isAssisted(context: RenderContext): boolean {
  return (
    context.state.settings.playMode !== "standard" ||
    context.state.settings.reducedMotion
  );
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
    card.append(
      element(
        context.document,
        "p",
        context.content.message(roleObjectiveKeys[setup.role]),
      ),
      element(
        context.document,
        "p",
        context.content.message(approachObjectiveKeys[setup.approach]),
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

function renderNextLevelTeaser(context: RenderContext): HTMLElement {
  const teaser = element(context.document, "aside");
  teaser.className = "teaser";

  const label = element(
    context.document,
    "p",
    context.content.message("core.message.ui.next-level.label"),
  );
  label.className = "teaser__label";

  const title = element(
    context.document,
    "h3",
    context.content.message("core.message.ui.next-level.title"),
  );

  const body = element(
    context.document,
    "p",
    context.content.message("core.message.ui.next-level.body"),
  );

  const install = element(
    context.document,
    "p",
    context.content.message("core.message.ui.next-level.install"),
  );
  install.className = "quiet-copy";

  teaser.append(label, title, body, install);
  return teaser;
}

function renderEnding(
  context: RenderContext,
  node: StoryNode & { type: "ending" },
): void {
  const card = overlayCard(context);
  const cardContext: RenderContext = { ...context, screen: card };
  heading(cardContext, node.titleKey);
  card.append(
    element(context.document, "p", context.content.message(node.bodyKey)),
  );
  const scorePanel = renderScorePanel(context);
  if (scorePanel !== undefined) {
    card.append(scorePanel);
  }
  card.append(
    renderNextLevelTeaser(context),
    button(cardContext, "core.message.ui.ending.restart", {
      type: "LOCAL_DATA_CLEARED",
    }),
  );
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
  const title = element(
    context.document,
    "h2",
    context.content.message("core.message.ui.menu.heading"),
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
    externalLink("core.message.ui.privacy.link", privacyPageUrl),
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
    externalLink("core.message.ui.terms.link", termsPageUrl),
  );

  const clear = button(context, "core.message.ui.clear-save", {
    type: "LOCAL_DATA_CLEARED",
  });
  clear.className = "menu-clear";

  const disclaimer = element(
    context.document,
    "p",
    context.content.message("core.message.ui.disclaimer"),
  );
  disclaimer.className = "quiet-copy";

  menu.append(settings, credits, privacy, terms, clear, disclaimer);
  return menu;
}

function renderHud(context: RenderContext, menu: HTMLElement): HTMLElement {
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
  return hud;
}

export function renderGameApp(options: RenderGameAppOptions): void {
  const shell = element(options.document, "section");
  shell.className = "game-shell";

  const stage = element(options.document, "div");
  stage.className = "stage";
  const context: RenderContext = { ...options, screen: stage };

  const menu = renderMenu(context);
  const hud = renderHud(context, menu);
  renderStage(context);

  shell.append(hud, stage, menu);
  options.mount.replaceChildren(shell);
}
