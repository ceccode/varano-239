# Scouting del formato di gioco

> **Documento storico.** Registra il confronto fra i formati candidati fatto ad agosto 2026 e la sua conclusione. **Non descrive il gioco attuale**: la domanda è stata chiusa da ADR-018 a favore del platformer arcade su canvas, che è ciò che il gioco è oggi. Resta qui perché la motivazione di una scelta strutturale vale più della scelta stessa.

## Come è andata

La prima raccomandazione era un'**avventura narrativa point-and-click a scene pixel-art**, con il platform tenuto come possibile mini-gioco: rendeva centrali storia, fonti e quattro prospettive, e costava poco in asset, fisica e test.

Il playtest del proprietario del 1 agosto 2026 l'ha bocciata: tecnicamente leggibile, ma poco arcade, poco giocabile, poco coinvolgente. ADR-017 ha allora autorizzato **M1R**, una corsa laterale 320×180 costruita come confronto diretto.

Ha vinto quella. **ADR-018 ha ribaltato la raccomandazione qui sotto**: il platformer non è un mini-gioco dentro un'avventura, è la struttura del prodotto, e la narrativa gli vive intorno nel DOM. Dieci livelli dopo, la scelta ha retto — con un solo adapter, un modello fisico puro e zero dipendenze runtime.

Il confronto originale segue, invariato.

## Confronto

Scala: 1 insufficiente, 5 ottimo. «Costo» misura quanto l'opzione è economica da produrre: 5 è il costo minore.

| Formato                 | Storia e lettura | Mobile | Accessibilità | Costo | Rigiocabilità | Framework 2D | Totale indicativo |
| ----------------------- | ---------------: | -----: | ------------: | ----: | ------------: | ------------ | ----------------: |
| Platform 2D completo    |                2 |      2 |             2 |     1 |             4 | Sì           |             11/25 |
| Esplorazione top-down   |                3 |      3 |             3 |     2 |             4 | Probabile    |             15/25 |
| Visual novel pura       |                5 |      5 |             5 |     5 |             3 | No           |             23/25 |
| Point-and-click a scene |                5 |      5 |             5 |     4 |             4 | No           |         **23/25** |
| Raccolta di mini-giochi |                3 |      3 |             2 |     2 |             5 | Probabile    |             15/25 |

Il pareggio numerico fra visual novel e point-and-click si risolve a favore del secondo: conserva la semplicità narrativa ma dà al Varano presenza fisica attraverso esplorazione, tracce, sprite e popup.

## Perché non partire da un platform

Un platform richiederebbe:

- movimento continuo, salto, collisioni, camera e livelli;
- comandi touch virtuali, difficili da rendere precisi per tutti;
- molte animazioni e tile coerenti;
- un bilanciamento separato per ciascun personaggio;
- pause frequenti dell'azione per leggere fonti e dialoghi;
- un game framework fin dal primo giorno.

Il risultato rischierebbe di essere un piccolo platform generico con la storia del Varano appoggiata sopra. Potrà invece funzionare bene come sfida facoltativa di 30–60 secondi: attraversare una roggia, evitare coni di luce del drone o superare il ponte levatoio. Ogni sfida deve avere «Salta» e un'alternativa accessibile.

## Formato dell'MVP

### Scene

- Fondale pixel-art statico o con 1–3 sprite animati.
- Da 3 a 6 hotspot grandi e nominati.
- Pannello narrativo con obiettivo, dialoghi e scelte.
- Elenco testuale equivalente agli hotspot.
- Carta FATTO/TESTIMONIANZA/IPOTESI/LEGGENDA/SCONFESSATO quando serve.
- Un popup gentile e deterministico del Varano in scene selezionate.

### Interazioni

- osservare;
- confrontare due o tre indizi;
- scegliere una priorità;
- posizionare elementi in un ordine semplice;
- aprire o liberare un percorso;
- decidere quando chiamare gli operatori.

Non usare combinazioni arbitrarie di oggetti, pixel hunting o enigmi che richiedono conoscenze esterne.

### Controlli

| Azione            | Touch             | Mouse             | Tastiera                |
| ----------------- | ----------------- | ----------------- | ----------------------- |
| Seleziona hotspot | Tap               | Click             | Tab + Invio/Spazio      |
| Avanza dialogo    | Tap pulsante      | Click             | Invio/Spazio            |
| Torna/chiudi      | Pulsante visibile | Pulsante visibile | Esc                     |
| Apri archivio     | Pulsante menu     | Pulsante menu     | Scorciatoia documentata |

## Prototipi da confrontare

Prima di produrre tutti gli asset, realizzare due prototipi usa-e-getta sullo stesso Atto 0:

1. **Scena narrativa DOM-first**: campo di mais, tre hotspot, una carta fatto e un popup.
2. **Micro-platform isolato**: dopo il feedback su M1, il Varano attraversa il campo con movimento e salto espliciti; i controlli virtuali restano confinati al livello e la storia offre sempre un'alternativa equivalente.

Farli provare ad almeno:

- una persona di 12–15 anni;
- una persona non abituata ai videogiochi;
- una persona che usa soltanto tastiera;
- due telefoni, uno compatto e uno grande;
- un desktop.

Il micro-platform entra nella roadmap soltanto se aggiunge divertimento senza bloccare nessuno e se emerge un secondo mini-gioco reale. Altrimenti si elimina senza modificare il motore narrativo.

## Criterio per introdurre Phaser

Phaser può essere proposto soltanto quando esistono almeno due mini-giochi approvati che richiedono davvero loop continuo, collisioni, tilemap o camera. Deve essere caricato in modo differito e restare dietro `MiniGamePort`. Scene, menu, testi, scelte, fonti e impostazioni rimangono nel DOM.

## Direzione visiva

- Risoluzione logica iniziale da decidere nel prototipo fra 320×180 e 384×216.
- Palette limitata, alto contrasto e silhouette leggibili.
- Personaggi umani caricaturali ma non somiglianti a persone reali.
- Il Varano è riconoscibile soprattutto da coda, postura e occhi; la pixel art non fissa una specie non verificata.
- Castello ispirato a elementi architettonici documentati, ridisegnato senza copiare fotografie.
- UI contemporanea e leggibile, non vincolata ai limiti delle console anni Ottanta.
