export const italianMessages = {
  "core.message.title": "VARANO 2:39",
  "core.message.subtitle": "Il mistero dei Sei Colli",
  "core.message.meta-description":
    "Avventura narrativa 12+ che distingue cronaca documentata e leggenda inventata.",
  "core.message.shell.skip-link": "Vai al contenuto",
  "core.message.shell.age-label": "Avventura narrativa 12+",
  "core.message.shell.nav-label": "Navigazione principale",
  "core.message.shell.sources-link": "Archivio e fonti",
  "core.message.shell.status-title": "Fondamenta del progetto",
  "core.message.shell.description":
    "La base tecnica accessibile è pronta. Le scene giocabili arriveranno nelle milestone successive.",
  "core.message.shell.ready":
    "Applicazione inizializzata. Nessun contenuto giocabile è incluso in M0.",
  "core.message.shell.safety-title": "Sicurezza",
  "core.message.shell.safety-body":
    "Questa è una ricostruzione narrativa. Non cercare, inseguire o toccare animali selvatici o esotici: mantieni le distanze e avvisa le autorità competenti.",
  "core.message.shell.sources-title": "Archivio e fonti",
  "core.message.shell.sources-body":
    "L’Archivio interattivo sarà aggiunto in una milestone successiva. Le fonti editoriali sono già registrate nella documentazione del progetto.",
  "core.message.shell.sources-document-link":
    "Apri il registro editoriale delle fonti su GitHub (nuova scheda)",
  "core.message.bootstrap-error.title": "Impossibile avviare il gioco",
  "core.message.bootstrap-error.body":
    "La pagina informativa resta disponibile. Ricarica la pagina; se il problema continua, riprova più tardi.",
} as const;

export type ItalianMessageKey = keyof typeof italianMessages;

export function getItalianMessage(key: ItalianMessageKey): string {
  return italianMessages[key];
}
