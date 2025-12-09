// Script para poblar la base de datos Turso con datos iniciales
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Configuración de Turso
const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://travelpin-paoolasanchez.aws-us-west-2.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ3NzU0NTYsImlkIjoiY2UzYTAxOWQtZTM0NS00NDAxLTg4NTgtZGExMjZjZjQyMGI0IiwicmlkIjoiZjYzZWI3YmYtODdmMi00YzFkLWI5NjUtM2U4NjlkYWY2NGMxIn0.RE2RoKOGcmdHC-0X4bDRAP6Q__2ip8UuOfs3MB7QHFBBZgjYscAw2nuSRD0ZKmS5bWILcG70IrVlzawLeNa3AA';

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

async function seedDatabase() {
  console.log('🌐 Conectando a Turso...');
  
  try {
    // 1. Crear tablas
    console.log('\n📋 Creando tablas...');
    
    await client.execute(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      email_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('✅ Tabla usuarios');

    await client.execute(`CREATE TABLE IF NOT EXISTS destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      pais TEXT NOT NULL,
      categoria TEXT NOT NULL,
      imagen TEXT,
      imagen_principal TEXT,
      rating REAL DEFAULT 0,
      descripcion TEXT,
      presupuesto_promedio TEXT,
      duracion_recomendada TEXT,
      mejor_epoca TEXT,
      latitud REAL,
      longitud REAL,
      es_popular BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('✅ Tabla destinos');

    await client.execute(`CREATE TABLE IF NOT EXISTS favoritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE,
      UNIQUE(usuario_id, destino_id)
    )`);
    console.log('✅ Tabla favoritos');

    await client.execute(`CREATE TABLE IF NOT EXISTS viajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      icono TEXT DEFAULT '✈️',
      fecha_inicio TEXT,
      fecha_fin TEXT,
      finalizado BOOLEAN DEFAULT 0,
      agencia_id INTEGER,
      agencia_nombre TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla viajes');

    await client.execute(`CREATE TABLE IF NOT EXISTS viaje_destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla viaje_destinos');

    await client.execute(`CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria TEXT NOT NULL,
      pagado_por TEXT NOT NULL,
      fecha TEXT NOT NULL,
      es_agencia BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla gastos');

    await client.execute(`CREATE TABLE IF NOT EXISTS participantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla participantes');

    await client.execute(`CREATE TABLE IF NOT EXISTS agencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      logo TEXT,
      telefono TEXT,
      email TEXT,
      website TEXT,
      direccion TEXT,
      ciudad TEXT,
      pais TEXT,
      rating REAL DEFAULT 0,
      num_reviews INTEGER DEFAULT 0,
      verificada BOOLEAN DEFAULT 0,
      especialidades TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('✅ Tabla agencias');

    await client.execute(`CREATE TABLE IF NOT EXISTS paquetes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agencia_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      duracion TEXT,
      incluye TEXT,
      imagen TEXT,
      destacado BOOLEAN DEFAULT 0,
      activo BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla paquetes');

    await client.execute(`CREATE TABLE IF NOT EXISTS paquete_destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paquete_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (paquete_id) REFERENCES paquetes(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla paquete_destinos');

    // 2. Cargar destinos desde JSON
    console.log('\n🌍 Cargando destinos...');
    const destinosPath = path.join(__dirname, '..', '..', 'firestore-import', 'destinos.json');
    const destinosData = JSON.parse(fs.readFileSync(destinosPath, 'utf8'));
    
    let destinosCount = 0;
    for (const [key, destino] of Object.entries(destinosData)) {
      try {
        await client.execute({
          sql: `INSERT OR IGNORE INTO destinos (nombre, pais, categoria, imagen, imagen_principal, rating, descripcion, presupuesto_promedio, duracion_recomendada, mejor_epoca, latitud, longitud, es_popular)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            destino.title || destino.city,
            destino.country,
            destino.category,
            destino.image_url,
            destino.image_url,
            destino.rating || 4.5,
            destino.description,
            destino.budget_estimate,
            destino.duration,
            destino.best_season,
            destino.latitude,
            destino.longitude,
            destino.rating >= 4.7 ? 1 : 0
          ]
        });
        destinosCount++;
      } catch (e) {
        console.log(`  ⚠️ Error insertando ${destino.title}: ${e.message}`);
      }
    }
    console.log(`✅ ${destinosCount} destinos insertados`);

    // 3. Crear agencias de ejemplo
    console.log('\n🏢 Creando agencias...');
    const agencias = [
      {
        nombre: 'Viajes Aventura México',
        descripcion: 'Especialistas en tours de aventura y ecoturismo en México y Latinoamérica',
        logo: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop',
        telefono: '+52 55 1234 5678',
        email: 'contacto@viajesaventura.mx',
        website: 'https://viajesaventura.mx',
        direccion: 'Av. Reforma 500, Col. Juárez',
        ciudad: 'Ciudad de México',
        pais: 'México',
        rating: 4.8,
        num_reviews: 156,
        verificada: 1,
        especialidades: 'aventura,ecoturismo,naturaleza'
      },
      {
        nombre: 'TravelPlus Internacional',
        descripcion: 'Tu agencia de confianza para viajes internacionales de lujo',
        logo: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=200&fit=crop',
        telefono: '+52 33 9876 5432',
        email: 'info@travelplus.com',
        website: 'https://travelplus.com',
        direccion: 'Av. Vallarta 1500',
        ciudad: 'Guadalajara',
        pais: 'México',
        rating: 4.9,
        num_reviews: 234,
        verificada: 1,
        especialidades: 'lujo,internacional,luna de miel'
      },
      {
        nombre: 'Mochileros Sin Fronteras',
        descripcion: 'Viajes económicos para jóvenes aventureros',
        logo: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=200&h=200&fit=crop',
        telefono: '+52 81 5555 4444',
        email: 'hola@mochileros.mx',
        website: 'https://mochileros.mx',
        direccion: 'Calle Morelos 200',
        ciudad: 'Monterrey',
        pais: 'México',
        rating: 4.6,
        num_reviews: 89,
        verificada: 1,
        especialidades: 'mochilero,economico,aventura'
      }
    ];

    for (const agencia of agencias) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO agencias (nombre, descripcion, logo, telefono, email, website, direccion, ciudad, pais, rating, num_reviews, verificada, especialidades)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [agencia.nombre, agencia.descripcion, agencia.logo, agencia.telefono, agencia.email, agencia.website, agencia.direccion, agencia.ciudad, agencia.pais, agencia.rating, agencia.num_reviews, agencia.verificada, agencia.especialidades]
      });
    }
    console.log(`✅ ${agencias.length} agencias creadas`);

    // 4. Crear paquetes de ejemplo
    console.log('\n📦 Creando paquetes...');
    const paquetes = [
      {
        agencia_id: 1,
        nombre: 'Aventura en Chiapas',
        descripcion: 'Explora las maravillas naturales de Chiapas: cascadas, selva y zonas arqueológicas',
        precio: 12500,
        duracion: '5 días / 4 noches',
        incluye: 'Hospedaje,Transporte,Guía,Desayunos,Entradas',
        imagen: 'https://images.unsplash.com/photo-1552537376-3abf35237215?w=500&h=300&fit=crop',
        destacado: 1
      },
      {
        agencia_id: 1,
        nombre: 'Ruta Maya Completa',
        descripcion: 'Recorre los sitios arqueológicos más impresionantes de la civilización Maya',
        precio: 18900,
        duracion: '7 días / 6 noches',
        incluye: 'Hospedaje,Vuelos,Guía,Comidas,Entradas',
        imagen: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=500&h=300&fit=crop',
        destacado: 1
      },
      {
        agencia_id: 2,
        nombre: 'Europa Clásica',
        descripcion: 'París, Roma y Barcelona en un solo viaje inolvidable',
        precio: 45000,
        duracion: '12 días / 11 noches',
        incluye: 'Vuelos,Hoteles 4★,Traslados,Tours,Seguro',
        imagen: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=500&h=300&fit=crop',
        destacado: 1
      },
      {
        agencia_id: 2,
        nombre: 'Luna de Miel en Maldivas',
        descripcion: 'El destino más romántico del mundo te espera',
        precio: 85000,
        duracion: '8 días / 7 noches',
        incluye: 'Vuelos,Resort 5★,Todo incluido,Spa,Cena romántica',
        imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500&h=300&fit=crop',
        destacado: 1
      },
      {
        agencia_id: 3,
        nombre: 'Sudamérica Mochilera',
        descripcion: 'Perú, Bolivia y Chile en modo aventura',
        precio: 15000,
        duracion: '15 días / 14 noches',
        incluye: 'Hostales,Transporte terrestre,Guía,Algunas comidas',
        imagen: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=500&h=300&fit=crop',
        destacado: 1
      }
    ];

    for (const paquete of paquetes) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO paquetes (agencia_id, nombre, descripcion, precio, duracion, incluye, imagen, destacado)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [paquete.agencia_id, paquete.nombre, paquete.descripcion, paquete.precio, paquete.duracion, paquete.incluye, paquete.imagen, paquete.destacado]
      });
    }
    console.log(`✅ ${paquetes.length} paquetes creados`);

    // Verificar datos
    console.log('\n📊 Verificando datos...');
    const countDestinos = await client.execute('SELECT COUNT(*) as count FROM destinos');
    const countAgencias = await client.execute('SELECT COUNT(*) as count FROM agencias');
    const countPaquetes = await client.execute('SELECT COUNT(*) as count FROM paquetes');
    
    console.log(`   Destinos: ${countDestinos.rows[0].count}`);
    console.log(`   Agencias: ${countAgencias.rows[0].count}`);
    console.log(`   Paquetes: ${countPaquetes.rows[0].count}`);

    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

seedDatabase();
