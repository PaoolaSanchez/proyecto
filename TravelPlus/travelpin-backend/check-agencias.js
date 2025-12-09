const db = require('better-sqlite3')('BDTravelPin.db');

console.log('=== Estructura de tabla agencias ===');
const info = db.pragma('table_info(agencias)');
console.log(info);

console.log('\n=== Agencias en la BD ===');
const agencias = db.prepare('SELECT * FROM agencias').all();
console.log(agencias);
