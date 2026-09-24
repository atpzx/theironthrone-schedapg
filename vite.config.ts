import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const forumSheetCssId = 'virtual:forum-sheet-css'
const resolvedForumSheetCssId = `\0${forumSheetCssId}`

function forumSheetCss() {
  return {
    name: 'forum-sheet-css',
    resolveId(id: string) {
      return id === forumSheetCssId ? resolvedForumSheetCssId : null
    },
    load(id: string) {
      if (id !== resolvedForumSheetCssId) return null

      const forumSheetStyles = readFileSync(new URL('./src/forum-sheet.css', import.meta.url), 'utf8')
      return `export default ${JSON.stringify(forumSheetStyles)}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [forumSheetCss(), svelte()],
})
