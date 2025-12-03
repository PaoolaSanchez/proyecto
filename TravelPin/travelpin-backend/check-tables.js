const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'libsql://travelpin-paoolasanchez.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ3NzU0NTYsImlkIjoiY2UzYTAxOWQtZTM0NS00NDAxLTg4NTgtZGExMjZjZjQyMGI0IiwicmlkIjoiZjYzZWI3YmYtODdmMi00YzFkLWI5NjUtM2U4NjlkYWY2NGMxIn0.RE2RoKOGcmdHC-0X4bDRAP6Q__2ip8UuOfs3MB7QHFBBZgjYscAw2nuSRD0ZKmS5bWILcG70IrVlzawLeNa3AA'
});

async function fixSchema() {
  // Verificar columnas de paquetes
  const paquetesCols = await client.execute('PRAGMA table_info(paquetes)');
  const colNames = paquetesCols.rows.map(c => c.name);
  console.log('Columnas actuales de paquetes:', colNames);
  
  // Agregar columnas faltantes
  if (!colNames.includes('itinerario')) {
    console.log('Agregando columna itinerario...');
    await client.execute("ALTER TABLE paquetes ADD COLUMN itinerario TEXT DEFAULT '[]'");
    console.log('✅ Columna itinerario agregada');
  }
  
  if (!colNames.includes('gastos')) {
    console.log('Agregando columna gastos...');
    await client.execute("ALTER TABLE paquetes ADD COLUMN gastos TEXT DEFAULT '[]'");
    console.log('✅ Columna gastos agregada');
  }
  
  // Verificar de nuevo
  const newCols = await client.execute('PRAGMA table_info(paquetes)');
  console.log('\nColumnas finales de paquetes:');
  newCols.rows.forEach(c => console.log('  ' + c.name + ' - ' + c.type));
  
  console.log('\n✅ Schema actualizado correctamente');
}

fixSchema().catch(console.error);
