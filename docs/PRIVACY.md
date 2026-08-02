# Privacy e misurazione

## Obiettivo

Misurare soltanto:

1. quante visite riceve il gioco;
2. quante nuove partite vengono avviate.

Non serve conoscere chi gioca, quale personaggio sceglie, come risponde, quale finale raggiunge o da dove si trova con precisione.

## Cosa significano i numeri

- **Visite**: sessioni stimate dal servizio di analytics.
- **Avvii**: numero di pressioni effettive su «Inizia la storia», una per nuova partita.
- **Visitatori unici**: stima tecnica, non conteggio esatto di persone. La stessa persona può risultare più volte in giorni o dispositivi diversi; più persone sullo stesso dispositivo possono risultare come una.

Nella UI e nei report usare «visite stimate», non «persone identificate».

## Dati locali

Nella M1 il browser conserva soltanto:

- avanzamento, checkpoint, scelte narrative e schede del Dossier scoperte;
- ruolo, approccio, sensibilità, profondità del mistero ed esito, tutti esclusivamente locali;
- impostazioni di accessibilità;
- versione dello schema locale.

I campi per teorie, inventario e versioni dei pack sono già predisposti nello stato ma restano vuoti finché i relativi contenuti non esistono. Il salvataggio usa la chiave `varano-239.save` in `localStorage`, non viene sincronizzato e non lascia il dispositivo. Il menu offre «Cancella progressi e preferenze locali». Non memorizzare nome, email, data di nascita, posizione, testo libero, data e ora del salvataggio o identificatori di analytics.

## Eventi remoti ammessi

L'interfaccia TypeScript ammette soltanto:

```ts
export type AnalyticsEvent =
  { readonly name: "page_view" } | { readonly name: "game_start" };
```

Regole:

- nessun payload o proprietà custom;
- nessun evento per ruolo, approccio, sensibilità, profondità del mistero, pacchetto, capitolo, scelta, teoria o finale;
- `page_view` una volta al caricamento del client;
- `game_start` una volta dopo «Inizia la storia», non a ogni ripresa del salvataggio;
- l'adapter traduce `game_start` in un evento GoatCounter con nome fisso e `no_session: true`, così ogni nuova partita viene contata anche se la stessa sessione ne avvia più di una; questa è configurazione statica dell'adapter, non un payload narrativo;
- nessun errore, tempo di sessione, click, movimento del mouse o heatmap;
- nessuna registrazione di URL con query string o frammenti;
- nessun referrer completo: se il provider non permette di disabilitarlo, inviare referrer vuoto;
- errori di rete ignorati senza retry aggressivo;
- il gioco deve funzionare identico con analytics bloccati.

## Provider attivo (ADR-025)

Il provider è **GoatCounter hosted** sull'istanza `varano239.goatcounter.com`, attivo soltanto sul sito pubblicato: l'endpoint è dichiarato in `netlify.toml` e senza quella variabile l'app usa `NoopAnalytics`, quindi build locali e test non fanno nessuna richiesta a terzi.

Cosa viene inviato, in tutto: una visita con percorso e titolo fissi (`/`, `VARANO 2:39`) e l'evento `game_start` senza proprietà. Il referrer è ridotto alla sola origine, mai l'URL completo, e i referrer interni vengono scartati. `Do Not Track` e `Global Privacy Control` disattivano l'adapter prima ancora di caricare lo script. Il punteggio, il record personale e la cartolina condivisibile restano sul dispositivo.

Per un progetto amatoriale su Netlify, GoatCounter hosted resta la scelta più adatta, configurato per dati aggregati e senza pageview individuali.

Motivi:

- progetto open-source;
- servizio ospitato gratuito per un uso pubblico ragionevole;
- nessun cookie o identificatore persistente nel browser;
- IP e User-Agent non vengono salvati nel database secondo la documentazione del provider;
- supporta eventi semplici, quindi `game_start` può essere contato senza proprietà.

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
- Lo script parte con `no_onload: true`: soltanto l'adapter tipizzato invia i due percorsi fissi, senza titolo dinamico, query string o referrer.
- Nella dashboard disabilitare pageview individuali e tutte le dimensioni opzionali non necessarie: posizione, browser, sistema, lingua e larghezza schermo.
- Se `navigator.doNotTrack === "1"` o il browser espone un segnale Global Privacy Control attivo, non caricare lo script e usare `NoopAnalytics`.
- Le impostazioni mostrano «Condividi statistiche anonime» e consentono di disattivare le richieste future. La preferenza resta locale.
- La Content Security Policy autorizza soltanto dominio del sito e dominio analytics scelto.
- Non usare Google Tag Manager, cookie manager, advertising SDK o proxy volto a eludere gli ad blocker.
- Non abilitare nel provider raccolta di pageview individuali, dettagli geografici più fini del necessario o conservazione non indispensabile.

## Informativa breve proposta

> Il gioco salva i progressi soltanto su questo dispositivo. Se le statistiche anonime sono attive, invia a GoatCounter una visita e l'eventuale avvio della partita, senza account, cookie, scelte di gioco o identificatori persistenti. Puoi disattivarle nelle Impostazioni.

L'informativa completa deve indicare almeno titolare del progetto, provider, finalità, categorie di dati trattati, base giuridica valutata dal titolare, durata/conservazione applicabile, modalità di esercizio dei diritti e data di aggiornamento. Prima della pubblicazione il proprietario deve inserire i propri dati reali e verificare l'assetto legale; questo documento non sostituisce consulenza legale.

## Test di privacy obbligatori

In E2E intercettare tutte le richieste di rete dopo il caricamento degli asset locali.

| Caso                     | Risultato atteso                       |
| ------------------------ | -------------------------------------- |
| Build senza endpoint     | Zero richieste analytics               |
| Prima visita configurata | Un solo `page_view`                    |
| Nuova partita            | Un solo `game_start`, nessun payload   |
| Due nuove partite        | Due `game_start` nella stessa sessione |
| Riprendi partita         | Nessun `game_start`                    |
| DNT o GPC                | Zero richieste analytics               |
| Toggle disattivato       | Zero richieste successive              |
| Provider irraggiungibile | Gioco completabile, nessun errore UI   |
| URL con query/frammento  | Nessun query/frammento inviato         |

## Fonti tecniche e normative di riferimento

- [Privacy policy di GoatCounter](https://www.goatcounter.com/help/privacy)
- [Sessioni e visitatori in GoatCounter](https://www.goatcounter.com/help/sessions)
- [Eventi GoatCounter](https://www.goatcounter.com/help/events)
- [Linee guida del Garante su cookie e altri strumenti di tracciamento](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876)

La configurazione va rivalutata se cambiano provider, hosting, finalità o dati raccolti.
