// Script para importar datos de SQLite local a Turso
const { createClient } = require('@libsql/client');
const fs = require('fs');

const TURSO_URL = 'libsql://travelpin-paoolasanchez.aws-us-west-2.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ3NzU0NTYsImlkIjoiY2UzYTAxOWQtZTM0NS00NDAxLTg4NTgtZGExMjZjZjQyMGI0IiwicmlkIjoiZjYzZWI3YmYtODdmMi00YzFkLWI5NjUtM2U4NjlkYWY2NGMxIn0.RE2RoKOGcmdHC-0X4bDRAP6Q__2ip8UuOfs3MB7QHFBBZgjYscAw2nuSRD0ZKmS5bWILcG70IrVlzawLeNa3AA';

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

async function importData() {
  console.log('📦 Cargando datos exportados...');
  const data = JSON.parse(fs.readFileSync('export-data.json', 'utf8'));
  
  console.log(`   Destinos: ${data.destinos.length}`);
  console.log(`   Agencias: ${data.agencias.length}`);
  console.log(`   Paquetes: ${data.paquetes.length}`);
  
  // Limpiar tablas existentes (en orden correcto por foreign keys)
  console.log('\n🗑️ Limpiando tablas existentes...');
  await client.execute('DELETE FROM paquete_destinos');
  await client.execute('DELETE FROM paquetes');
  await client.execute('DELETE FROM agencias');
  await client.execute('DELETE FROM destinos');
  console.log('✅ Tablas limpiadas');

  // Importar destinos
  console.log('\n🌍 Importando destinos...');
  let destinosOk = 0;
  for (const d of data.destinos) {
    try {
      await client.execute({
        sql: `INSERT INTO destinos (id, nombre, pais, categoria, imagen, imagen_principal, rating, descripcion, presupuesto_promedio, duracion_recomendada, mejor_epoca, latitud, longitud, es_popular, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          d.id, d.nombre, d.pais, d.categoria, d.imagen, d.imagen_principal,
          d.rating, d.descripcion, d.presupuesto_promedio, d.duracion_recomendada,
          d.mejor_epoca, d.latitud || null, d.longitud || null, d.es_popular || 0, d.created_at || new Date().toISOString()
        ]
      });
      destinosOk++;
    } catch (e) {
      console.log(`   ⚠️ Error destino ${d.id}: ${e.message}`);
    }
  }
  console.log(`✅ ${destinosOk}/${data.destinos.length} destinos importados`);

  // Importar agencias
  console.log('\n🏢 Importando agencias...');
  let agenciasOk = 0;
  for (const a of data.agencias) {
    try {
      await client.execute({
        sql: `INSERT INTO agencias (id, nombre, descripcion, logo, telefono, email, website, direccion, ciudad, pais, rating, num_reviews, verificada, especialidades, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          a.id, 
          a.nombre, 
          a.descripcion || '', 
          a.logo || '', 
          a.telefono || a.contacto || '', 
          a.email || '',
          a.website || a.sitio_web || '', 
          a.direccion || '', 
          a.ciudad || '', 
          a.pais || 'México',
          a.rating || 4.5, 
          a.num_reviews || 0, 
          a.verificada || 1, 
          a.especialidades || '',
          a.created_at || new Date().toISOString()
        ]
      });
      agenciasOk++;
    } catch (e) {
      console.log(`   ⚠️ Error agencia ${a.id} (${a.nombre}): ${e.message}`);
    }
  }
  console.log(`✅ ${agenciasOk}/${data.agencias.length} agencias importadas`);

  // Importar paquetes
  console.log('\n📦 Importando paquetes...');
  let paquetesOk = 0;
  for (const p of data.paquetes) {
    try {
      await client.execute({
        sql: `INSERT INTO paquetes (id, agencia_id, nombre, descripcion, precio, duracion, incluye, imagen, destacado, activo, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.id, 
          p.agencia_id, 
          p.nombre || '', 
          p.descripcion || '', 
          p.precio || 0,
          p.duracion || '', 
          p.incluye || '', 
          p.imagen || '', 
          p.destacado || 1, 
          p.activo ?? 1,
          p.created_at || new Date().toISOString()
        ]
      });
      paquetesOk++;
    } catch (e) {
      console.log(`   ⚠️ Error paquete ${p.id} (${p.nombre}): ${e.message}`);
    }
  }
  console.log(`✅ ${paquetesOk}/${data.paquetes.length} paquetes importados`);

  // Importar paquete_destinos si existe
  if (data.paquete_destinos && data.paquete_destinos.length > 0) {
    console.log('\n🔗 Importando relaciones paquete-destinos...');
    let relOk = 0;
    for (const pd of data.paquete_destinos) {
      try {
        await client.execute({
          sql: `INSERT INTO paquete_destinos (paquete_id, destino_id, orden) VALUES (?, ?, ?)`,
          args: [pd.paquete_id, pd.destino_id, pd.orden || 0]
        });
        relOk++;
      } catch (e) {
        // Ignorar errores de relaciones
      }
    }
    console.log(`✅ ${relOk} relaciones importadas`);
  }

  // Verificar
  console.log('\n📊 Verificando datos en Turso...');
  const countDestinos = await client.execute('SELECT COUNT(*) as count FROM destinos');
  const countAgencias = await client.execute('SELECT COUNT(*) as count FROM agencias');
  const countPaquetes = await client.execute('SELECT COUNT(*) as count FROM paquetes');
  
  console.log(`   Destinos: ${countDestinos.rows[0].count}`);
  console.log(`   Agencias: ${countAgencias.rows[0].count}`);
  console.log(`   Paquetes: ${countPaquetes.rows[0].count}`);

  console.log('\n🎉 ¡Importación completada!');
}

importData().catch(console.error);
