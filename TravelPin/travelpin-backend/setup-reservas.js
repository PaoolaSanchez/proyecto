const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'libsql://travelpin-paoolasanchez.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ3NzU0NTYsImlkIjoiY2UzYTAxOWQtZTM0NS00NDAxLTg4NTgtZGExMjZjZjQyMGI0IiwicmlkIjoiZjYzZWI3YmYtODdmMi00YzFkLWI5NjUtM2U4NjlkYWY2NGMxIn0.RE2RoKOGcmdHC-0X4bDRAP6Q__2ip8UuOfs3MB7QHFBBZgjYscAw2nuSRD0ZKmS5bWILcG70IrVlzawLeNa3AA'
});

async function setupReservas() {
  // Ver tablas existentes
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tablas existentes:', tables.rows.map(t => t.name));

  // Crear tabla de reservas si no existe
  console.log('\nCreando tabla de reservas...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paquete_id INTEGER NOT NULL,
      agencia_id INTEGER NOT NULL,
      nombre_cliente TEXT NOT NULL,
      email_cliente TEXT NOT NULL,
      telefono_cliente TEXT,
      num_personas INTEGER DEFAULT 1,
      fecha_salida TEXT,
      precio_total REAL,
      estado TEXT DEFAULT 'pendiente',
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paquete_id) REFERENCES paquetes(id),
      FOREIGN KEY (agencia_id) REFERENCES agencias(id)
    )
  `);
  console.log('✅ Tabla reservas creada');

  // Verificar estructura
  const cols = await client.execute('PRAGMA table_info(reservas)');
  console.log('\nColumnas de reservas:');
  cols.rows.forEach(c => console.log('  ' + c.name + ' - ' + c.type));
}

setupReservas().catch(console.error);
