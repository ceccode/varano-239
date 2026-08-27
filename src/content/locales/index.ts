import type { Locale, MessageKey } from "../../core/model.ts";
import type { MessageCatalog } from "../story-pack.ts";
import { formatMessage, italianMessages, type MessageValues } from "./it.ts";

const catalogs: Partial<Record<Locale, MessageCatalog>> = {
  it: italianMessages,
};

export function registerEnglishMessages(catalog: MessageCatalog): void {
  catalogs.en = catalog;
}

export async function loadLocale(locale: Locale): Promise<void> {
  if (locale === "en" && catalogs.en === undefined) {
    const { englishMessages } = await import("./en.ts");
    registerEnglishMessages(englishMessages);
  }
}

export function resolveMessage(
  locale: Locale,
  key: MessageKey,
  values?: MessageValues,
): string {
  const template = catalogs[locale]?.[key];
  if (template === undefined) {
    throw new Error(`Missing ${locale} message: ${key}`);
  }
  return values === undefined ? template : formatMessage(template, values);
}
