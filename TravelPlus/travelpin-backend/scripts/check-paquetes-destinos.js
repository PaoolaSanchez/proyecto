const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'libsql://travelpin-paoolasanchez.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ3NzU0NTYsImlkIjoiY2UzYTAxOWQtZTM0NS00NDAxLTg4NTgtZGExMjZjZjQyMGI0IiwicmlkIjoiZjYzZWI3YmYtODdmMi00YzFkLWI5NjUtM2U4NjlkYWY2NGMxIn0.RE2RoKOGcmdHC-0X4bDRAP6Q__2ip8UuOfs3MB7QHFBBZgjYscAw2nuSRD0ZKmS5bWILcG70IrVlzawLeNa3AA'
});

async function checkPaquetesDestinos() {
  // Ver paquetes existentes
  const paquetes = await client.execute('SELECT id, nombre, agencia_id FROM paquetes');
  console.log('📦 Paquetes existentes:', paquetes.rows.length);
  paquetes.rows.forEach(p => console.log(`  ${p.id}: ${p.nombre} (agencia ${p.agencia_id})`));
  
  // Ver relaciones paquete-destino
  const relaciones = await client.execute('SELECT * FROM paquete_destinos');
  console.log('\n🔗 Relaciones paquete_destinos:', relaciones.rows.length);
  relaciones.rows.forEach(r => console.log(`  Paquete ${r.paquete_id} -> Destino ${r.destino_id}`));
  
  // Ver destinos
  const destinos = await client.execute('SELECT id, nombre FROM destinos LIMIT 10');
  console.log('\n🌍 Destinos (primeros 10):');
  destinos.rows.forEach(d => console.log(`  ${d.id}: ${d.nombre}`));
  
  // Si no hay relaciones, crear algunas
  if (relaciones.rows.length === 0) {
    console.log('\n⚠️ No hay relaciones paquete_destinos. Creando...');
    
    // Mapeo de paquetes a destinos (basado en los nombres)
    const paquetesDestinos = [
      { paquete: 'París', destino: 'París' },
      { paquete: 'Inca', destino: 'Machu Picchu' },
      { paquete: 'Maldivas', destino: 'Maldivas' },
      { paquete: 'Tokio', destino: 'Tokio' },
      { paquete: 'Santorini', destino: 'Santorini' },
      { paquete: 'Nueva York', destino: 'Nueva York' },
      { paquete: 'Bali', destino: 'Bali' },
      { paquete: 'Cancún', destino: 'Cancún' },
      { paquete: 'Roma', destino: 'Roma' },
      { paquete: 'Barcelona', destino: 'Barcelona' },
    ];
    
    for (const pd of paquetesDestinos) {
      const paquete = paquetes.rows.find(p => p.nombre.toLowerCase().includes(pd.paquete.toLowerCase()));
      const destino = destinos.rows.find(d => d.nombre.toLowerCase().includes(pd.destino.toLowerCase()));
      
      if (paquete && destino) {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO paquete_destinos (paquete_id, destino_id, orden) VALUES (?, ?, 0)',
          args: [paquete.id, destino.id]
        });
        console.log(`  ✅ ${paquete.nombre} -> ${destino.nombre}`);
      }
    }
    
    // Verificar de nuevo
    const nuevasRelaciones = await client.execute('SELECT * FROM paquete_destinos');
    console.log('\n🔗 Relaciones creadas:', nuevasRelaciones.rows.length);
  }
}

checkPaquetesDestinos().catch(console.error);
