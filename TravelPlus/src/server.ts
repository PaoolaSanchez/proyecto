import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import Database from 'better-sqlite3';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// ========== CONFIGURACIÓN PARA PRODUCCIÓN ==========
const isProduction = process.env['NODE_ENV'] === 'production';

// Configurar base de datos SQLite
// En producción usa el path de la variable de entorno, en desarrollo usa el local
const dbPath = process.env['DB_PATH'] || join(process.cwd(), 'travelpin-backend', 'BDTravelPin.db');
const dbDir = join(dbPath, '..');

// Crear directorio si no existe
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log('📁 Directorio de base de datos creado:', dbDir);
}

const db = new Database(dbPath);

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

console.log('✅ Base de datos conectada:', dbPath);

// ... (el resto del código del backup src/server.ts.bak) ...

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 * Skip API routes - they should be handled by the API endpoints above.
 */
app.use((req, res, next) => {
  // Skip API routes - they are already handled
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`🚀 Node Express server listening on http://localhost:${port}`);
    console.log(`💾 SQLite database: ${dbPath}`);
  });
}

// Cerrar la base de datos al terminar
process.on('SIGINT', () => {
  db.close();
  console.log('✅ Base de datos cerrada');
  process.exit(0);
});

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
