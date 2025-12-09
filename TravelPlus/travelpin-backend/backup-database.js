const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('📦 Iniciando respaldo de BDTravelPin.db...\n');

const dbPath = path.join(__dirname, 'BDTravelPin.db');
const backupDir = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`✅ Directorio de respaldos creado: ${backupDir}\n`);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a BDTravelPin.db\n');
  exportarDatos();
});

function exportarDatos() {
  const backup = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  const tablas = ['usuarios', 'destinos', 'favoritos', 'viajes', 'viaje_destinos', 'gastos', 'pagos', 'participantes', 'encuestas'];
  let tablasCompletadas = 0;

  tablas.forEach((tabla) => {
    db.all(`SELECT * FROM ${tabla}`, [], (err, rows) => {
      if (err) {
        console.error(`❌ Error al exportar tabla ${tabla}:`, err.message);
        backup.tables[tabla] = { error: err.message };
      } else {
        backup.tables[tabla] = {
          count: rows ? rows.length : 0,
          data: rows || []
        };
        console.log(`✅ Tabla "${tabla}" exportada (${rows ? rows.length : 0} registros)`);
      }

      tablasCompletadas++;

      if (tablasCompletadas === tablas.length) {
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
        console.log(`\n📁 Respaldo guardado en: ${backupFile}`);
        console.log('\n✨ Respaldo completado exitosamente!');

        db.close((err) => {
          if (err) console.error('Error al cerrar la BD:', err);
          process.exit(0);
        });
      }
    });
  });
}
