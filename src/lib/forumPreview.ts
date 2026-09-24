import sheetStyles from 'virtual:forum-sheet-css'

const previewStyles = `
  :root { color-scheme: dark; }
  html { min-height: 100%; background: #261f1c; }
  body {
    margin: 0;
    padding: 18px;
    color: #d9d3c8;
    background: #261f1c;
    font: 13px/1.5 'Droid Sans', Arial, sans-serif;
  }
  a, a:visited { color: #da9c5d; text-decoration: none; }
  .scheda-pg { max-width: 860px; margin: 0 auto; color: var(--main-text-color); }
  .scheda-pg .module:before,
  .scheda-pg .simple-container > dt { font-size: 13px; letter-spacing: .02em; }
  .scheda-pg .info-container .simple-container > dd { max-height: 240px; }
  .scheda-pg .perks .info-container .simple-container > dd { max-height: 260px; }
  .scheda-pg .talents dl.simple-container > dd { max-height: 320px; }
  .scheda-pg .info-container .text-area > dd {
    height: auto;
    min-height: 160px;
    max-height: 360px;
    line-height: 1.65;
  }
  .scheda-pg .button .name span { text-overflow: clip; }
  @media screen and (max-width: 800px) {
    body { padding: 0; }
    .scheda-pg .info-container .text-area > dd { min-height: 120px; }
  }
`

export function renderPreviewDocument(sheetHtml: string): string {
  return `<!doctype html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${sheetStyles}\n${previewStyles}</style></head><body>${sheetHtml}</body></html>`
}
