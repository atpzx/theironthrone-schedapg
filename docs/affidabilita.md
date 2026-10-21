# Integrità dei link e recupero delle schede

## Formato e compatibilità

I nuovi collegamenti mantengono `#data=gz.<Base64URL>`: JSON UTF-8 compresso con
GZIP, codificato con l'alfabeto Base64URL. Rimangono supportati i vecchi link con
JSON Base64 senza prefisso e i parametri `module` e `layer`. Non servono migrazioni
dei link già pubblicati. La compressione non è cifratura.

`codec.ts` distingue la lettura del JSON originale (`decodeSheetJson`) dalla
validazione e migrazione (`parseSheetJson`). Questa distinzione consente di
verificare l'identità del JSON senza confonderla con normalizzazioni legittime,
come il limite del livello o la migrazione delle statistiche.

La trasformazione usa `Blob.stream().pipeThrough()` e consuma l'uscita tramite
`Response.arrayBuffer()`: il rifiuto dello stream raggiunge il chiamante, senza
promesse `writer.write()` / `writer.close()` lasciate senza gestione. Base64
malformato, UTF-8 invalido e GZIP corrotto o incompleto vengono rifiutati. La
validazione delle sezioni importate precede ogni sostituzione della scheda.

## Esportazione verificata

`createSheetExport` in `sheetLinks.ts`:

1. Acquisisce una copia immutabile della scheda prima di qualsiasi `await`.
2. Verifica che il documento sia importabile.
3. Comprime, costruisce l'URL definitivo e ne rilegge `data`.
4. Decomprime il parametro e lo confronta con il JSON originale esatto.
5. Genera l'HTML e verifica il link effettivamente inserito nel contenitore
   `sheet-editor-link`, inclusi percorso, query e modulo.

La copia negli appunti e il download HTML usano entrambi questo percorso. Un
errore blocca l'esportazione e compare in modo persistente; l'anteprima può
continuare a mostrare la scheda, ma quell'HTML non verificato non viene esportato.
Gli errori degli appunti sono distinti dagli errori della verifica. Il download
JSON rimane disponibile anche senza Compression Streams o salvataggio locale.

La scheda **Copie e link** confronta un URL o l'HTML ripreso dal forum con il
documento aperto. Non scarica l'indirizzo inserito. La comparazione ignora
l'ordine delle proprietà e la spaziatura JSON, ma conserva l'ordine degli array
e i valori: un link leggibile ma diverso può contenere una versione precedente.
Se manca il contenitore riconoscibile e sono presenti più link con `data`, occorre
incollare il solo link da verificare.

## Cronologia locale

`sheetHistory.ts` usa una sola chiave `localStorage`:
`ironthrone.sheet-history.v1`. Il contenitore ha formato
`{ version: 1, entries: [...] }`. Ogni voce contiene `id`, `savedAt`, `name`,
`reason` e il JSON completo. Non cambiare la versione senza una migrazione.

- Salvataggio delle modifiche dei campi dopo 600 ms di inattività; salvataggio
  immediato su `pagehide` e quando la pagina diventa nascosta.
- Fino a 10 copie. Gli autosalvataggi nello stesso minuto vengono accorpati in
  intervalli fissi: anche una modifica continua produce versioni periodiche.
- Prima di importare JSON, aprire un link valido, ripristinare l'esempio o
  recuperare una copia, viene conservata la scheda corrente. Queste copie non
  vengono accorpate al successivo autosalvataggio. Restano soggette al limite
  totale di 10, oltre il quale le più vecchie vengono eliminate.
- All'apertura viene recuperata l'ultima copia valida, poi viene elaborato
  l'eventuale link. Un link non valido lascia aperta la copia recuperata.
  L'esempio iniziale non sovrascrive automaticamente la cronologia.
- Dopo un caricamento riuscito il frammento importato viene rimosso dall'indirizzo:
  ricaricare la pagina recupera la copia di lavoro, senza riapplicare il vecchio
  payload sopra le modifiche recenti. Anche importazioni e recuperi espliciti
  rimuovono il vecchio frammento. I nuovi link da condividere sono nell'HTML
  esportato, non nella barra degli indirizzi dell'editor.
- L'importazione non valida non cambia né scheda né cronologia. Le operazioni
  asincrone divenute obsolete vengono ignorate, anche dopo nuove modifiche,
  importazioni, reset o cambi del frammento URL.
- Il JSON scritto nell'editor ma non ancora applicato non è un salvataggio.
  Campi temporaneamente incompleti o invalidi non vengono salvati come copie
  importabili: compare un avviso e le copie valide precedenti restano disponibili.
  Una sostituzione viene bloccata se non è possibile creare una copia valida
  della scheda corrente; il download JSON permette comunque di conservarne il
  contenuto per correggerlo manualmente.

In caso di spazio esaurito o accesso negato, le copie nuove restano in memoria
nella sessione corrente e un avviso persistente invita a scaricare il JSON.
La scrittura fallita lascia intatto il contenuto precedentemente persistito.
Una cronologia danneggiata o con versione sconosciuta non viene sovrascritta:
le nuove copie rimangono in memoria. Per un'analisi manuale, conservare il valore
originale della chiave tramite gli strumenti di sviluppo prima di modificarlo.

Prima di una scrittura si rileggono le copie salvate da altre schede del browser.
Non è un database con transazioni tra finestre: due scritture realmente
simultanee possono ancora competere. La scheda aperta non viene sostituita da
modifiche effettuate in altre finestre.

## Limiti e recupero

La verifica protegge la generazione; non può impedire al forum, a un editor o
a una copia manuale di alterare successivamente l'indirizzo. GZIP verifica già
CRC e lunghezza, ma non ricostruisce dati mancanti. La copia JSON esterna è
quindi la protezione principale contro la perdita completa dei dati.

Le copie locali appartengono all'origine e al profilo del browser. Non si
trasferiscono tra dispositivi e possono essere eliminate cancellando i dati del
sito o terminando una sessione privata. Non è garantito il salvataggio se il
browser o il sistema vengono terminati prima del debounce o degli eventi finali.
Il limite di 10 versioni non garantisce che tutte possano entrare nella quota
disponibile; in quel caso si passa alla conservazione in memoria con avviso.

Il sito rimane statico: non vengono introdotti un servizio di archiviazione,
identificativi remoti o nuovi checksum. Un backend con collegamenti brevi è
un'evoluzione distinta, da valutare solo se necessaria.

Riferimento del comportamento degli stream: [Compression Standard](https://compression.spec.whatwg.org/).
