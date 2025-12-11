const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'BDTravelPin.db');
const db = new Database(dbPath);

console.log('=== Estructura de tabla agencias ===');
const info = db.pragma('table_info(agencias)');
console.log(info);

console.log('\n=== Agencias en la BD ===');
const agencias = db.prepare('SELECT * FROM agencias').all();
console.log(agencias);
