# Privacy e misurazione

## Obiettivo

Misurare soltanto il funnel aggregato:

1. quante visite riceve il gioco e quante nuove partite vengono avviate;
2. quante partite completano i livelli 1, 3, 6 e 10;
3. quante campagne arrivano a un finale;
4. quanti tentativi di condivisione e replay vengono avviati.

Non serve conoscere chi gioca, quale personaggio sceglie, come risponde, quale finale raggiunge, il punteggio o da dove si trova con precisione.

## Cosa significano i numeri

- **Visite**: sessioni stimate dal servizio di analytics.
- **Avvii**: una per nuova partita, cioè per ogni scelta di ruolo nella schermata iniziale. Una ripresa dal salvataggio non conta.
- **Milestone**: un segnale soltanto dopo il completamento arcade dei livelli 1, 3, 6 e 10. Un livello saltato non conta.
- **Completamenti**: una campagna che entra in qualunque finale, senza indicare quale.
- **Condivisioni e replay**: intenzioni esplicite (clic sul pulsante), non conferme del risultato dell'API o dati sul contenuto.
- **Visitatori unici**: stima tecnica, non conteggio esatto di persone. La stessa persona può risultare più volte in giorni o dispositivi diversi; più persone sullo stesso dispositivo possono risultare come una.

Nella UI e nei report usare «visite stimate», non «persone identificate».

## Dati locali

Il browser conserva soltanto, in `localStorage`, tre chiavi:

| Chiave                     | Contenuto                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `varano-239.save`          | avanzamento, checkpoint, scelte narrative, schede del Dossier scoperte, ruolo, esito e impostazioni       |
| `varano-239.best-score`    | il record personale di punteggio                                                                          |
| `varano-239.level-records` | l'archivio della Collezione: per ogni livello punteggio, indizi, stella, cameo e «senza cadute» (ADR-057) |

I campi per teorie, inventario e versioni dei pack sono predisposti nello stato ma restano vuoti, perché i relativi contenuti non esistono. Niente viene sincronizzato e niente lascia il dispositivo. Il menù offre «Cancella progressi e preferenze locali», che azzera tutte e tre le chiavi. Non memorizzare nome, email, data di nascita, posizione, testo libero, data e ora del salvataggio o identificatori di analytics.

## Eventi remoti ammessi

L'interfaccia TypeScript ammette soltanto:

```ts
export type AnalyticsEvent = {
  readonly name:
    | "page_view"
    | "game_start"
    | "level_1_complete"
    | "level_3_complete"
    | "level_6_complete"
    | "level_10_complete"
    | "game_complete"
    | "share_attempt"
    | "replay_start";
};
```

Regole:

- nessun payload o proprietà custom;
- nessun evento per ruolo, capitolo o livello specifico oltre le quattro milestone fisse; nessun punteggio, scelta o identificatore del finale;
- `page_view` una volta al caricamento del client;
- `game_start` una volta per nuova partita, non a ogni ripresa del salvataggio;
- le milestone di livello vengono emesse soltanto dal callback di completamento arcade; «Salta il livello» non le emette;
- `game_complete` viene emesso entrando in un finale, ma non durante la ripresa di un salvataggio già concluso;
- `share_attempt` e `replay_start` misurano il clic prima dell'azione, senza indicarne contenuto o risultato;
- l'adapter traduce ogni evento in un nome fisso con `no_session: true`, così ogni azione esplicita viene contata anche se la stessa sessione ne produce più di una; questa è configurazione statica dell'adapter, non un payload narrativo;
- nessun errore, tempo di sessione, click, movimento del mouse o heatmap;
- nessuna registrazione di URL con query string o frammenti;
- nessun referrer completo: se il provider non permette di disabilitarlo, inviare referrer vuoto;
- errori di rete ignorati senza retry aggressivo;
- il gioco deve funzionare identico con analytics bloccati.

## Provider attivo (ADR-025)

Il provider è **GoatCounter hosted** sull'istanza `varano239.goatcounter.com`, attivo soltanto sul sito pubblicato: l'endpoint è dichiarato in `netlify.toml` e senza quella variabile l'app usa `NoopAnalytics`, quindi build locali e test non fanno nessuna richiesta a terzi.

Cosa viene inviato, in tutto: una visita con percorso e titolo fissi (`/`, `VARANO 2:39`) e gli otto nomi fissi del funnel elencati sopra, senza proprietà. Il referrer è ridotto alla sola origine per la visita, mai l'URL completo, e resta vuoto per gli eventi. `Do Not Track` e `Global Privacy Control` disattivano l'adapter prima ancora di caricare lo script. Ruolo, scelte, finale, punteggio, record personale e cartolina condivisibile restano sul dispositivo.

Per un progetto amatoriale su Netlify, GoatCounter hosted resta la scelta più adatta, configurato per dati aggregati e senza pageview individuali.

Motivi:

- progetto open-source;
- servizio ospitato gratuito per un uso pubblico ragionevole;
- nessun cookie o identificatore persistente nel browser;
- IP e User-Agent non vengono salvati nel database secondo la documentazione del provider;
- supporta eventi semplici, quindi il funnel può essere contato senza proprietà.

Limiti da dichiarare:

- è comunque una richiesta verso un servizio terzo;
- IP e User-Agent sono elaborati temporaneamente per stimare le sessioni;
- ad blocker e protezioni del browser possono ridurre il conteggio;
- «visitatori» resta una stima;
- l'assenza di cookie non elimina l'obbligo di un'informativa trasparente o di una valutazione del titolare.

Alternative:

| Opzione            | Vantaggio                                                | Costo/limite                     | Quando sceglierla                            |
| ------------------ | -------------------------------------------------------- | -------------------------------- | -------------------------------------------- |
| GoatCounter hosted | Minimo sforzo, open-source, gratuito per uso ragionevole | Terza parte, metriche essenziali | Lancio amatoriale consigliato                |
| Plausible Cloud    | Dashboard curata, eventi e metriche chiare               | Servizio a pagamento             | Se si desidera supporto commerciale          |
| Umami self-hosted  | Controllo dei dati                                       | Server e manutenzione            | Solo se esiste già infrastruttura affidabile |
| Nessun analytics   | Massima minimizzazione                                   | Nessun dato d'uso                | Sempre disponibile via configurazione        |

## Configurazione sicura

- `NoopAnalytics` è il default del codice e di ogni build senza endpoint esplicito.
- Il provider è selezionato tramite variabile di build validata; nessun endpoint hardcoded nei test.
- Lo script parte con `no_onload: true`: soltanto l'adapter tipizzato invia i percorsi dell'allowlist, senza titolo dinamico, query string o referrer sugli eventi.
- Nella dashboard disabilitare pageview individuali e tutte le dimensioni opzionali non necessarie: posizione, browser, sistema, lingua e larghezza schermo.
- Se `navigator.doNotTrack === "1"` o il browser espone un segnale Global Privacy Control attivo, l'adapter non carica nemmeno lo script e si comporta come `NoopAnalytics`. **Oggi questo è l'unico opt-out**: non esiste un interruttore in-app, e l'informativa non deve prometterne uno.
- La Content Security Policy autorizza soltanto dominio del sito e dominio analytics scelto.
- Non usare Google Tag Manager, cookie manager, advertising SDK o proxy volto a eludere gli ad blocker.
- Non abilitare nel provider raccolta di pageview individuali, dettagli geografici più fini del necessario o conservazione non indispensabile.

## Informativa breve proposta

> Il gioco salva i progressi soltanto su questo dispositivo. Sul sito pubblicato invia a GoatCounter una visita e pochi passaggi aggregati del funnel — avvio, milestone fisse, completamento, tentativo di condivisione e replay — senza account, cookie, proprietà di gioco o identificatori persistenti. Se il tuo browser segnala «Do Not Track» o Global Privacy Control, non viene inviato nulla.

L'informativa completa deve indicare almeno titolare del progetto, provider, finalità, categorie di dati trattati, base giuridica valutata dal titolare, durata/conservazione applicabile, modalità di esercizio dei diritti e data di aggiornamento. Prima della pubblicazione il proprietario deve inserire i propri dati reali e verificare l'assetto legale; questo documento non sostituisce consulenza legale.

## Test di privacy obbligatori

In E2E intercettare tutte le richieste di rete dopo il caricamento degli asset locali.

| Caso                      | Risultato atteso                       |
| ------------------------- | -------------------------------------- |
| Build senza endpoint      | Zero richieste analytics               |
| Prima visita configurata  | Un solo `page_view`                    |
| Nuova partita             | Un solo `game_start`, nessun payload   |
| Due nuove partite         | Due `game_start` nella stessa sessione |
| Riprendi partita          | Nessun `game_start`                    |
| Completa livelli 1/3/6/10 | Una milestone fissa, nessun payload    |
| Salta un livello          | Nessuna milestone di livello           |
| Raggiungi un finale       | Un solo `game_complete`, senza esito   |
| Condividi o rigioca       | Un intento fisso per clic              |
| DNT o GPC                 | Zero richieste analytics               |
| Provider irraggiungibile  | Gioco completabile, nessun errore UI   |
| URL con query/frammento   | Nessun query/frammento inviato         |

## Fonti tecniche e normative di riferimento

- [Privacy policy di GoatCounter](https://www.goatcounter.com/help/privacy)
- [Sessioni e visitatori in GoatCounter](https://www.goatcounter.com/help/sessions)
- [Eventi GoatCounter](https://www.goatcounter.com/help/events)
- [Linee guida del Garante su cookie e altri strumenti di tracciamento](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876)

La configurazione va rivalutata se cambiano provider, hosting, finalità o dati raccolti.
