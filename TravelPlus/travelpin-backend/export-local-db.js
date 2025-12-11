// Script para exportar datos de la BD local
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'BDTravelPin.db');
const db = new sqlite3.Database(dbPath);

const tables = ['usuarios', 'destinos', 'agencias', 'paquetes', 'paquete_itinerario', 'paquete_gastos', 'viajes', 'viaje_destinos', 'gastos', 'participantes', 'favoritos', 'encuestas'];

async function exportTable(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        console.log(`⚠️ Tabla ${tableName} no existe o error:`, err.message);
        resolve({ table: tableName, data: [], error: err.message });
      } else {
        console.log(`✅ ${tableName}: ${rows.length} registros`);
        resolve({ table: tableName, data: rows });
      }
    });
  });
}

async function main() {
  console.log('📦 Exportando datos de la BD local...\n');
  
  const exports = {};
  
  for (const table of tables) {
    const result = await exportTable(table);
    exports[table] = result.data;
  }
  
  fs.writeFileSync('local-data-export.json', JSON.stringify(exports, null, 2));
  console.log('\n✅ Datos exportados a local-data-export.json');
  
  db.close();
}

main();
