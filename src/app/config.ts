import { resolveMessage } from "../content/locales/index.ts";
import type { ItalianMessageKey } from "../content/locales/it.ts";
import type { Locale } from "../core/model.ts";

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

function resolveCopy(locale: Locale, key: keyof typeof copyKeys): string {
  return resolveMessage(locale, copyKeys[key]);
}

export function appConfigForLocale(locale: Locale) {
  return {
    title: resolveCopy(locale, "title"),
    subtitle: resolveCopy(locale, "subtitle"),
    metaDescription: resolveCopy(locale, "metaDescription"),
    canonicalUrl:
      locale === "en"
        ? "https://app.varano239.it/en/"
        : "https://app.varano239.it/",
    socialImageUrl: "https://varano239.it/og-image.png",
    socialImageAlt: resolveCopy(locale, "socialImageAlt"),
    shell: {
      skipLink: resolveCopy(locale, "skipLink"),
      ageLabel: resolveCopy(locale, "ageLabel"),
      navigationLabel: resolveCopy(locale, "navigationLabel"),
      sourcesLink: resolveCopy(locale, "sourcesLink"),
      statusTitle: resolveCopy(locale, "statusTitle"),
      description: resolveCopy(locale, "description"),
      ready: resolveCopy(locale, "ready"),
      safetyTitle: resolveCopy(locale, "safetyTitle"),
      safetyBody: resolveCopy(locale, "safetyBody"),
      sourcesTitle: resolveCopy(locale, "sourcesTitle"),
      sourcesBody: resolveCopy(locale, "sourcesBody"),
      sourcesDocumentLink: resolveCopy(locale, "sourcesDocumentLink"),
    },
    bootstrapError: {
      title: resolveCopy(locale, "bootstrapErrorTitle"),
      body: resolveCopy(locale, "bootstrapErrorBody"),
    },
  } as const;
}

export const appConfig = appConfigForLocale("it");
