import {
  getItalianMessage,
  type ItalianMessageKey,
} from "../content/locales/it.ts";

const copyKeys = {
  title: "core.message.title",
  subtitle: "core.message.subtitle",
  metaDescription: "core.message.meta-description",
  socialImageAlt: "core.message.social-image-alt",
  skipLink: "core.message.shell.skip-link",
  ageLabel: "core.message.shell.age-label",
  navigationLabel: "core.message.shell.nav-label",
  sourcesLink: "core.message.shell.sources-link",
  statusTitle: "core.message.shell.status-title",
  description: "core.message.shell.description",
  ready: "core.message.shell.ready",
  safetyTitle: "core.message.shell.safety-title",
  safetyBody: "core.message.shell.safety-body",
  sourcesTitle: "core.message.shell.sources-title",
  sourcesBody: "core.message.shell.sources-body",
  sourcesDocumentLink: "core.message.shell.sources-document-link",
  bootstrapErrorTitle: "core.message.bootstrap-error.title",
  bootstrapErrorBody: "core.message.bootstrap-error.body",
} as const satisfies Readonly<Record<string, ItalianMessageKey>>;

function resolveCopy(key: keyof typeof copyKeys): string {
  return getItalianMessage(copyKeys[key]);
}

export const appConfig = {
  title: resolveCopy("title"),
  subtitle: resolveCopy("subtitle"),
  metaDescription: resolveCopy("metaDescription"),
  canonicalUrl: "https://app.varano239.it/",
  socialImageUrl: "https://varano239.it/og-image.png",
  socialImageAlt: resolveCopy("socialImageAlt"),
  shell: {
    skipLink: resolveCopy("skipLink"),
    ageLabel: resolveCopy("ageLabel"),
    navigationLabel: resolveCopy("navigationLabel"),
    sourcesLink: resolveCopy("sourcesLink"),
    statusTitle: resolveCopy("statusTitle"),
    description: resolveCopy("description"),
    ready: resolveCopy("ready"),
    safetyTitle: resolveCopy("safetyTitle"),
    safetyBody: resolveCopy("safetyBody"),
    sourcesTitle: resolveCopy("sourcesTitle"),
    sourcesBody: resolveCopy("sourcesBody"),
    sourcesDocumentLink: resolveCopy("sourcesDocumentLink"),
  },
  bootstrapError: {
    title: resolveCopy("bootstrapErrorTitle"),
    body: resolveCopy("bootstrapErrorBody"),
  },
} as const;
