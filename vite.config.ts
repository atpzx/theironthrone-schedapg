import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const forumSheetCssId = 'virtual:forum-sheet-css'
const resolvedForumSheetCssId = `\0${forumSheetCssId}`
const forumSheetCssPath = fileURLToPath(new URL('./src/forum-sheet.css', import.meta.url))

function forumSheetCss(): Plugin {
  return {
    name: 'forum-sheet-css',
    resolveId(id: string) {
      return id === forumSheetCssId ? resolvedForumSheetCssId : null
    },
    load(id: string) {
      if (id !== resolvedForumSheetCssId) return null

      this.addWatchFile(forumSheetCssPath)
      const forumSheetStyles = readFileSync(forumSheetCssPath, 'utf8')
      return `export default ${JSON.stringify(forumSheetStyles)}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [forumSheetCss(), svelte()],
})
