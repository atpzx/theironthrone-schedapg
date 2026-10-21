# Sviluppo e verifiche

Il configuratore è un'applicazione statica Svelte/TypeScript. Il caricamento e la
verifica dei link, l'esportazione e la cronologia avvengono nel browser.

Usare Node.js 22.12 o successivo e le dipendenze del lockfile:

```sh
npm ci
npx playwright install chromium firefox
npm run dev
```

Su Linux, se mancano librerie di sistema dei browser, usare
`npx playwright install --with-deps chromium firefox`.

Prima di proporre un rilascio:

```sh
npm run verify:all
```

Il comando esegue controllo dei tipi (applicazione, configurazione e test), test
con soglie di copertura, build di produzione e test end-to-end in Chromium e
Firefox. Playwright avvia la build su `127.0.0.1:4173`; la porta deve essere libera.
Non sono richiesti account, backend o accesso al forum per eseguire i test.

- [Architettura e comportamento dei salvataggi](docs/affidabilita.md)
- [Test, report e diagnosi](docs/test.md)
- [Procedura di rilascio](docs/rilascio.md)

## Cosa versionare

Il repository contiene sorgenti, risorse dell'applicazione, configurazioni,
lockfile delle dipendenze, workflow CI/deploy, test e documentazione tecnica.
`package-lock.json` va conservato per rendere riproducibili installazioni e verifiche.
Anche `README.md` ed eventuali nuove risorse in `src/assets/` possono essere versionati.

I contenuti degli utenti e i file usati per un recupero manuale non appartengono
al repository. Tenerli in `recovery/` o `local-data/`, entrambe escluse dal
`.gitignore`, senza importarli nei sorgenti, nei test o nelle risorse pubbliche.
Non collocarli in `public/` o `src/assets/`: quelle directory possono finire nel
sito pubblicato. Non usare `git add -f` per includerli.

Le fixture automatiche in `tests/fixtures.ts` contengono esclusivamente valori
fittizi, comprese le biografie. Per riprodurre un problema usare dati sintetici
con le stesse caratteristiche (lunghezza, Unicode, struttura), senza copiare
schede, immagini o link compressi di utenti.

Restano locali anche riferimenti di lavoro (`refs/`), dipendenze installate,
build, report di copertura, risultati Playwright e configurazioni della macchina.
I file di esempio `.env.example` possono essere versionati se contengono solo
valori dimostrativi. Non ignorare globalmente JSON, HTML o Markdown: sono anche
formati usati dal progetto e dai suoi test.

Per controllare cosa entrerebbe nel prossimo commit:

```sh
git status --short --untracked-files=all
git diff --cached --stat
git ls-files -ci --exclude-standard
```

L'ultimo comando deve restituire un elenco vuoto. Il `.gitignore` non rimuove
file già tracciati: se un contenuto locale fosse stato aggiunto, rimuoverlo dal
solo indice con `git rm --cached -- percorso`, conservando il file sul disco.
