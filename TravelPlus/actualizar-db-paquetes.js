import Database from 'better-sqlite3';
import { join } from 'path';

// RUTA CORRECTA a tu base de datos
const dbPath = join(process.cwd(), 'travelpin-backend', 'BDTravelPin.db');

console.log('📦 Actualizando base de datos...');
console.log('📍 Ruta:', dbPath);

const db = new Database(dbPath);

// Crear tabla de relación entre paquetes y destinos
db.exec(`
  CREATE TABLE IF NOT EXISTS paquete_destinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paquete_id INTEGER NOT NULL,
    destino_id INTEGER NOT NULL,
    orden INTEGER DEFAULT 0,
    FOREIGN KEY (paquete_id) REFERENCES paquetes(id) ON DELETE CASCADE,
    FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE,
    UNIQUE(paquete_id, destino_id)
  );
`);

console.log('✅ Tabla paquete_destinos creada exitosamente');

db.close();
console.log('✅ Base de datos actualizada');