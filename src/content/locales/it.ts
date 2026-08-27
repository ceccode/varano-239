import type { MessageKey } from "../../core/model.ts";
import { coreMessages } from "../packs/core/pack.ts";

const shellMessages = {
  "core.message.title": "VARANO 2:39",
  "core.message.subtitle": "Il mistero dei Sei Colli",
  "core.message.meta-description":
    "Gioco narrativo gratuito in pixel art ispirato al misterioso varano avvistato a Montichiari. 10 livelli, 4 ruoli, 6 finali e circa 20 minuti di gioco.",
  "core.message.social-image-alt":
    "Silhouette pixel-art gialla di un varano su cielo notturno blu, con il titolo VARANO 2:39 e il timbro LEGGENDA.",
  "core.message.shell.skip-link": "Vai al contenuto",
  "core.message.shell.age-label": "Platformer narrativo 12+",
  "core.message.shell.nav-label": "Navigazione principale",
  "core.message.shell.sources-link": "Archivio e fonti",
  "core.message.shell.status-title": "10 livelli · 4 ruoli · 6 finali",
  "core.message.shell.description":
    "10 livelli platformer con musica chiptune, 4 ruoli e 6 finali in circa 20 minuti. Ogni livello è saltabile e la storia continua con lo stesso esito narrativo.",
  "core.message.shell.ready":
    "Applicazione inizializzata. Il Livello 1 «I campi di Montichiari» è pronto.",
  "core.message.shell.safety-title": "Sicurezza",
  "core.message.shell.safety-body":
    "Questa è una ricostruzione narrativa. Non cercare, inseguire o toccare animali selvatici o esotici: mantieni le distanze e avvisa le autorità competenti.",
  "core.message.shell.sources-title": "Archivio e fonti",
  "core.message.shell.sources-body":
    "Tutto ciò che si gioca è una ricostruzione inventata. La cronologia dei fatti documentati, le divergenze fra le fonti e le regole editoriali restano nel registro del progetto.",
  "core.message.shell.sources-document-link":
    "Apri il registro editoriale delle fonti su GitHub (nuova scheda)",
  "core.message.bootstrap-error.title": "Impossibile avviare il gioco",
  "core.message.bootstrap-error.body":
    "La pagina informativa resta disponibile. Ricarica la pagina; se il problema continua, riprova più tardi.",
} as const;

export const italianMessages = {
  ...shellMessages,
  ...coreMessages,
} as const;

export type ItalianMessageKey = keyof typeof italianMessages;

export function getItalianMessage(key: ItalianMessageKey): string {
  return italianMessages[key];
}

export function hasItalianMessage(key: MessageKey): key is ItalianMessageKey {
  return Object.hasOwn(italianMessages, key);
}

export type MessageValues = Readonly<Record<string, string | number>>;

/**
 * Fills `{name}` placeholders, so components never build visible sentences from
 * string literals. An unknown placeholder is left as it is: a typo in the
 * catalogue must stay visible instead of silently vanishing.
 */
export function formatMessage(template: string, values: MessageValues): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

export function resolveItalianMessage(
  key: MessageKey,
  values?: MessageValues,
): string {
  if (!hasItalianMessage(key)) {
    throw new Error(`Missing Italian message: ${key}`);
  }

  const template = italianMessages[key];
  return values === undefined ? template : formatMessage(template, values);
}
