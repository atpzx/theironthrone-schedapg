# Verifica e rilascio al push

Il workflow `Verify` viene eseguito sulle pull request. Su push a `main`/`master`,
`Deploy GitHub Pages` richiama lo stesso workflow e pubblica soltanto dopo il
superamento di tutti i controlli. Questo evita di eseguire due suite identiche
sullo stesso push. Rimane disponibile anche l'avvio manuale con `workflow_dispatch`.
Le modifiche locali non vengono pubblicate fino al push sul branch di rilascio.

Prima di scegliere una revisione da pubblicare:

1. Eseguire `npm ci` e `npm run verify:all` con i browser installati.
2. Controllare che `Verify` passi sulla stessa revisione candidata.
3. Provare manualmente un vecchio link, un link appena esportato, il recupero
   di una copia e il download/import JSON. Conservare un backup esterno.
4. Se viene usato un forum, confrontare il link effettivamente pubblicato
   tramite **Copie e link**: questo passaggio non è sostituito dai test locali.
5. Rivedere le differenze e decidere esplicitamente il rilascio.

Per pubblicare, effettuare il merge/push della revisione approvata su `main` o
`master`. In alternativa, avviare `Deploy GitHub Pages` dalla scheda Actions
selezionando il branch candidato. Il workflow richiama tutti i controlli di
`Verify` prima di costruire e caricare l'artefatto Pages; un errore blocca il
deploy. I permessi Pages e le eventuali approvazioni dell'ambiente restano necessari.

Dopo il deploy, verificare che il percorso GitHub Pages e un collegamento
`#data=...` funzionino sulla versione pubblicata. La build usa URL relativi e
l'esportazione conserva percorso e query dell'indirizzo attuale.

Per tornare a una versione precedente, creare un revert sul branch di rilascio
o selezionare un branch con un commit compatibile nell'avvio manuale. Si eseguono
gli stessi controlli prima della pubblicazione.
Non cancellare o modificare automaticamente la cronologia locale degli utenti.

Il gate verifica tipi, test, copertura, build e browser; non è un controllo delle
trasformazioni effettuate da servizi terzi, né un audit di sicurezza completo.
