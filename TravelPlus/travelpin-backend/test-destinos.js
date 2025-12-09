const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'BDTravelPin.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar:', err);
    process.exit(1);
  }
  
  console.log('✅ BD conectada');
  
  db.all('SELECT * FROM destinos', [], (err, rows) => {
    if (err) {
      console.error('❌ Error en query:', err);
    } else {
      console.log(`✅ Total de destinos: ${rows.length}`);
      if (rows.length > 0) {
        console.log('Primeros 3 destinos:');
        rows.slice(0, 3).forEach((d, i) => {
          console.log(`  ${i+1}. ${d.nombre}, ${d.pais}`);
        });
      }
    }
    
    db.close((err) => {
      if (err) console.error('Error al cerrar:', err);
      else console.log('✅ BD cerrada');
      process.exit(0);
    });
  });
});
