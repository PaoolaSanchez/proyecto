const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'BDTravelPin.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Error al abrir BD:', err);
  console.log('Abierta BD:', dbPath);

  const tables = ['destinos','usuarios','favoritos','viajes','viaje_destinos','gastos','pagos','participantes','encuestas','agencias','paquetes','paquete_destinos'];
  let completed = 0;
  tables.forEach(tbl => {
    db.get(`SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name=?`, [tbl], (err, row) => {
      if (err) {
        console.log(`${tbl}: error al comprobar existencia`);
        completed++; if (completed === tables.length) db.close();
        return;
      }
      if (row && row.c === 1) {
        db.get(`SELECT COUNT(*) as cnt FROM ${tbl}`, (err2, r2) => {
          if (err2) console.log(`${tbl}: error al contar ->`, err2.message);
          else console.log(`${tbl}: ${r2.cnt} filas`);
          completed++; if (completed === tables.length) db.close();
        });
      } else {
        console.log(`${tbl}: (tabla no existe)`);
        completed++; if (completed === tables.length) db.close();
      }
    });
  });
});
