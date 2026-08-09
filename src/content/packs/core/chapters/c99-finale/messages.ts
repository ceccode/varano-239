/**
 * The confrontation on the tower and the ending families (ADR-040). The
 * confrontation and the lethal branch carry no jokes (AGENTS.md): the comedy
 * resumes only in the endings where nothing grave has happened.
 */
export const finaleMessages = {
  "core.message.chapter.finale.title": "Il confronto sulla torre",
  "core.message.finale.heading": "Il confronto sulla torre",
  "core.message.finale.prompt":
    "Sul tetto della torre il tempo rallenta. Il Conte è sulla pietra al sole; Pina Protocollo resta a un passo da lui, ferma. Di sotto la Brigata Guanto Lungo ha preparato un trasportino aperto e il vialetto del giardino è ancora libero. Nessuno ti obbliga a niente: dove ti metti conta più di quello che dici.",
  "core.message.finale.option.corridor":
    "Apri il corridoio verso il trasportino e fai un passo indietro",
  "core.message.finale.option.garden":
    "Tieni libero il passaggio verso il giardino e spegni le luci",
  "core.message.finale.option.tower":
    "Non toccare niente: la pietra al sole è sua",
  "core.message.finale.option.crown":
    "Il trono dei Sei Colli è pronto: incoronalo",
  "core.message.finale.option.document":
    "Cerca ancora la prova perfetta, un minuto soltanto",
  "core.message.finale.option.wait":
    "Non avvicinarti e chiama gli operatori: stanotte ha corso troppo",
  "core.message.finale.option.shoot": "Abbatti il Varano",
  "core.message.finale.confirm.title": "Sei sicuro?",
  "core.message.finale.confirm.body":
    "Questa non è una prova di mira. Se confermi, il Cacciatore ucciderà il Varano. L’azione resterà fuori campo, ma i personaggi e il finale ricorderanno questa scelta. Vuoi continuare?",
  "core.message.finale.confirm.cancel": "Torna indietro",
  "core.message.finale.confirm.confirm": "Conferma: il Cacciatore spara",

  "core.message.ending.rescued.title": "Il trasportino aperto",
  "core.message.ending.rescued.body":
    "Il corridoio è pronto e nessuno si muove. Il Conte scende dalla pietra, annusa l’aria e sceglie da solo: entra nel trasportino della Brigata Guanto Lungo come un sovrano in carrozza. Cesare rinuncia alla posa eroica perché sta tenendo aperto il cancello, e nella foto ufficiale sono tutti fuori fuoco tranne la coda, perfettamente nitida. Pina Protocollo firma il verbale di consegna — stavolta con il timbro giusto. Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
  "core.message.ending.escaped.title": "Coda libera",
  "core.message.ending.escaped.body":
    "Le luci si spengono una a una e il passaggio verso il giardino resta libero. Il Conte attraversa il parco senza fretta, come chi conosce già la strada, e sparisce oltre la siepe. Resta una foto nitida che dimostra che era arrivato fin quassù, e nessuna che dica dove sia andato dopo. Ada archivia: «Meta ignota. Titolo mantenuto.» Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
  "core.message.ending.count.title": "Il Conte provvisorio",
  "core.message.ending.count.body":
    "Nessuno tocca niente. Il Conte resta sulla pietra al sole, chiude gli occhi, e per lui la questione è risolta. Ada verbalizza che non si tratta di una conquista legalmente valida; Cesare istituisce a Borgocoda una commissione per stabilire se il titolo di Conte richieda la residenza; Pina Protocollo, in via del tutto irrituale, protocolla un trono. Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
  "core.message.ending.crowned.title": "Il Conte dei Sei Colli",
  "core.message.ending.crowned.body":
    "Sei sigilli, sei colli, una notte intera di strada: stavolta non è un titolo provvisorio. Il Conte sale sulla pietra al sole e il paese, di sotto, applaude senza sapere bene perché. Ada verbalizza contro voglia che «la prassi non prevede il caso»; Cesare dichiara i Sei Colli «gemellati con sé stessi»; Pina Protocollo protocolla la corona, numero uno, fascicolo unico. Il Conte chiude gli occhi: le istruzioni erano chiare fin dal poster. Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
  "core.message.ending.killed.title": "La prova che pesa",
  "core.message.ending.killed.body":
    "La visuale resta sulla torre. Un colpo interrompe il silenzio, fuori campo; gli uccelli lasciano il tetto. Toni ottiene la prova definitiva: troppo grande per essere messa in tasca, troppo pesante per essere chiamata vittoria. Marta interrompe ogni collaborazione. Cesare posa il discorso preparato e riconosce che «a ogni costo» non era soltanto una frase. Gli operatori verificano l’accaduto secondo le procedure. Questo finale è inventato: nella cronaca reale, alla data dell’ultima verifica, nessun abbattimento risultava documentato e il caso restava aperto.",
  "core.message.ending.found.title": "La prova postuma",
  "core.message.ending.found.body":
    "Il corridoio resta aperto, ma il Conte non lo attraversa. Si sposta piano, più piano di quanto dovrebbe, e sparisce oltre il tetto prima che gli operatori arrivino. Lo ritrovano giorni dopo, lontano dalle mura, fuori scena: nessuna fotografia. Toni abbassa la macchina senza scattare. Cesare annulla la conferenza. Marta ricompone in silenzio il corridoio che non è servito, e Ada scrive per esteso quello che tutti hanno capito: la lunga notte era costata più di quanto sembrasse. Questo finale è inventato: nella cronaca reale, alla data dell’ultima verifica, nessun ritrovamento risultava documentato e il caso restava aperto.",
  "core.message.ending.title": "Una muta, forse",
  "core.message.ending.body":
    "Un minuto per la prova perfetta, e il tetto è già vuoto. Sulla pietra al sole resta qualcosa: una muta, un telo, un’ombra — dipende a chi lo chiedi. La città continua a raccontare la storia, che è la cosa che le riesce meglio. Il caso rimase aperto. Questa ricostruzione è Leggenda: specie, provenienza e destino reale del Varano restano tutti da scoprire.",
} as const;
