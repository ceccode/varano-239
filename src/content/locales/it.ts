import type { MessageKey } from "../../core/model.ts";
import { m1Messages } from "../packs/core/m1.ts";

const shellMessages = {
  "core.message.title": "VARANO 2:39",
  "core.message.subtitle": "Il mistero dei Sei Colli",
  "core.message.meta-description":
    "Platformer narrativo 12+ che distingue cronaca documentata e leggenda inventata.",
  "core.message.shell.skip-link": "Vai al contenuto",
  "core.message.shell.age-label": "Platformer narrativo 12+",
  "core.message.shell.nav-label": "Navigazione principale",
  "core.message.shell.sources-link": "Archivio e fonti",
  "core.message.shell.status-title": "Livello 1 giocabile",
  "core.message.shell.description":
    "Il prologo M1P è un livello platformer con musica chiptune, sempre saltabile, seguito da un primo finale aperto.",
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
  ...m1Messages,
} as const;

export type ItalianMessageKey = keyof typeof italianMessages;

export function getItalianMessage(key: ItalianMessageKey): string {
  return italianMessages[key];
}

export function hasItalianMessage(key: MessageKey): key is ItalianMessageKey {
  return Object.hasOwn(italianMessages, key);
}

export function resolveItalianMessage(key: MessageKey): string {
  if (!hasItalianMessage(key)) {
    throw new Error(`Missing Italian message: ${key}`);
  }

  return italianMessages[key];
}
