# Strategia di test

## Comandi

| Comando | Verifica |
| --- | --- |
| `npm run check` | Svelte, TypeScript dell'app, configurazioni e test |
| `npm test` | Tutti i test Vitest |
| `npm run test:watch` | Vitest durante lo sviluppo |
| `npm run test:coverage` | Test e soglie di copertura |
| `npm run test:e2e` | Build di produzione e test Chromium + Firefox |
| `npm run test:e2e -- --project=firefox` | Solo Firefox |
| `npm run test:e2e:ui` | Interfaccia interattiva Playwright |
| `npm run verify` | Tipi, copertura e build |
| `npm run verify:all` | Verifica completa, inclusi i browser |

Serve installare i browser con `npx playwright install chromium firefox` dopo
`npm ci` o dopo un aggiornamento Playwright. I test avviano un server locale,
quindi un sandbox che vieta l'ascolto su porte locali deve autorizzarlo.
Il server dei test usa la build di produzione, non il server di sviluppo.

## Test di logica

Le parti che proteggono i dati non dipendono da Svelte:

- `codec.test.ts`: GZIP prodotto e letto anche da `node:zlib`, testi Unicode
  lunghi con più blocchi, compatibilità legacy, alterazioni di header, corpo e
  checksum, troncamenti, UTF-8 invalido, API mancanti, schema e migrazioni.
- `sheetLinks.test.ts`: confronto esatto prima delle migrazioni, snapshot durante
  operazioni asincrone, guasti iniettati nel codec e renderer, HTML senza link,
  URL alterati, percorsi e query, entità HTML, selezione dei moduli e confronto
  dei collegamenti ripresi dal forum.
- `sheetHistory.test.ts`: tempo e memoria iniettati, versioni periodiche,
  copie prima delle sostituzioni, deduplicazione, limite, accessi negati,
  quota esaurita, dati danneggiati e interazione sequenziale tra finestre.
- `sheetWorkspace.test.ts`: importazioni e ripristini, avvio senza sovrascritture,
  conservazione dopo errori, letture file e link asincroni diventati obsoleti.

Le fixture sintetiche includono accenti, apostrofi, emoji, caratteri non latini,
markup come testo e una biografia lunga generata con un seme riproducibile.
I test non usano schede personali o il link danneggiato dell'incidente.
Un rifiuto di promessa non gestito fa fallire Vitest; non viene soppresso.

`vitest.config.ts` misura i quattro moduli di protezione dei dati, con soglie
minime di 90% righe/istruzioni, 95% funzioni e 80% rami. La copertura non
include Svelte né pretende di misurare tutto il progetto. Gli altri test
esistenti continuano comunque a essere eseguiti.

## Test nei browser

Ogni scenario viene eseguito in Chromium e Firefox con profilo isolato. Sono
verificati caricamento ed esportazione di schede lunghe, errori GZIP reali,
assenza di errori non gestiti, autosalvataggio dopo reload e `pagehide`, import
da file, recupero prima di import/reset, JSON scaricato, confronto con HTML
pubblicato, archivio locale corrotto, storage vietato, compressione mancante,
appunti negati e visibilità del backup su schermi piccoli.

Nel percorso ordinario gli appunti vengono simulati per rendere il test
indipendente dai permessi del sistema operativo; il contenuto copiato viene
poi decompresso con un'implementazione indipendente. Il rifiuto degli appunti
ha uno scenario dedicato. I download sono file reali di cui si verificano i dati.
Font e immagini esterni vengono bloccati: non sono dipendenze della verifica.

Questi test non possono provare che un forum esterno conserverà un link
inalterato. Per quel passaggio serve il confronto dopo la pubblicazione.
Safari/WebKit non è incluso nella matrice attuale.

## Report e aggiunta di casi

La copertura HTML è in `coverage/index.html`, il riepilogo numerico in
`coverage/coverage-summary.json`. Playwright produce `playwright-report/` e,
in caso di errore, screenshot e trace in `test-results/`. Per aprire un report:

```sh
npx playwright show-report
```

La CI conserva questi artefatti per 14 giorni anche quando i controlli falliscono.
Le directory generate non vengono versionate.

Per un nuovo bug, riprodurre prima il comportamento osservabile. Usare clock,
storage e promesse controllabili nei test della logica; aggiungere un test
browser se il difetto riguarda DOM, eventi, stream nativi o interazioni utente.
Non includere dati personali nelle fixture e non aggiornare snapshot o soglie
solo per ottenere una suite verde.
