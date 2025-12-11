const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'BDTravelPin.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening DB:', err.message);
    process.exit(1);
  }
});

function listAgenciasAndPaquetes() {
  db.all('SELECT id, nombre, email FROM agencias ORDER BY nombre', [], (err, agencias) => {
    if (err) {
      console.error('Error querying agencias:', err);
      process.exit(1);
    }

    if (!agencias || agencias.length === 0) {
      console.log('No hay agencias en la base de datos.');
      process.exit(0);
    }

    agencias.forEach((a, idx) => {
      db.all('SELECT id, nombre, precio, gastos FROM paquetes WHERE agencia_id = ?', [a.id], (err2, paquetes) => {
        if (err2) {
          console.error(`Error querying paquetes for agencia ${a.id}:`, err2);
          return;
        }

        console.log(`\nAgencia: ${a.id} - ${a.nombre} (${a.email || 'sin email'})`);
        if (!paquetes || paquetes.length === 0) {
          console.log('  No hay paquetes para esta agencia.');
          return;
        }

        paquetes.forEach(p => {
          let gastos = [];
          try { gastos = p.gastos ? JSON.parse(p.gastos) : []; } catch(e) { gastos = []; }
          console.log(`  Paquete ${p.id}: ${p.nombre} - $${p.precio} - gastos:${gastos.length}`);
        });
      });
    });
  });
}

listAgenciasAndPaquetes();

// Close after a short delay to allow async prints
setTimeout(() => db.close(), 500);
