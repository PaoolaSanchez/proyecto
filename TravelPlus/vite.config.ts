import { defineConfig } from 'vite';

export default defineConfig({
  ssr: {
    noExternal: ['sql.js']
  },
  define: {
    '__dirname': 'import.meta.dirname',
    '__filename': 'import.meta.filename'
  },
  resolve: {
    alias: {
      'sql.js': 'sql.js/dist/sql-wasm.js'
    }
  }
});