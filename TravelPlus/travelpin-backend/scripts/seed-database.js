const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'BDTravelPin.db');
const destinosJsonPath = path.join(__dirname, '..', '..', 'firestore-import', 'destinos.json');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a BDTravelPin.db');
  console.log(`📁 Ruta BD: ${dbPath}\n`);
  inicializarBaseDeDatos();
});

function inicializarBaseDeDatos() {
  const tablas = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      email_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS destinos (
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
      es_popular BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS favoritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE,
      UNIQUE(usuario_id, destino_id)
    )`,
    `CREATE TABLE IF NOT EXISTS viajes (
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
    )`,
    `CREATE TABLE IF NOT EXISTS viaje_destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS gastos (
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
    )`,
    `CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      participante TEXT NOT NULL,
      monto REAL NOT NULL,
      descripcion TEXT,
      fecha TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS participantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT,
      iniciales TEXT,
      color TEXT,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS encuestas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      tipo TEXT DEFAULT 'preferencias',
      preguntas TEXT NOT NULL,
      respuestas TEXT,
      creada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      actualizada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS agencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      descripcion TEXT,
      logo TEXT,
      contacto TEXT,
      sitio_web TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS paquetes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agencia_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      duracion TEXT,
      incluye TEXT,
      itinerario TEXT,
      gastos TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS paquete_destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paquete_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (paquete_id) REFERENCES paquetes(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE
    )`
  ];

  let tablasCreadas = 0;

  tablas.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('❌ Error creando tabla:', err.message);
      } else {
        tablasCreadas++;
        console.log(`✅ Tabla lista (${tablasCreadas}/${tablas.length})`);
      }

      if (tablasCreadas === tablas.length) {
        console.log('\n✨ Todas las tablas creadas correctamente\n');
        poblarDestinos();
      }
    });
  });
}

function poblarDestinos() {
  db.run('DELETE FROM destinos', (err) => {
    if (err) {
      console.log('⚠️ Advertencia al limpiar tabla destinos:', err.message);
    } else {
      console.log('🧹 Tabla destinos limpiada');
    }

    const destinosOriginales = [
      {
        nombre: 'Machu Picchu',
        pais: 'Perú',
        categoria: 'Aventura',
        imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
        rating: 4.7,
        descripcion: 'Machu Picchu es una antigua ciudad inca ubicada en lo alto de los Andes peruanos. Este sitio arqueológico es considerado una de las maravillas del mundo moderno.',
        presupuesto_promedio: '$800 - $1,500 USD',
        duracion_recomendada: '3-4 días',
        mejor_epoca: 'Abril a Octubre',
        es_popular: 1
      },
      {
        nombre: 'Tokio',
        pais: 'Japón',
        categoria: 'Ciudad',
        imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
        rating: 4.9,
        descripcion: 'Tokyo es la vibrante capital de Japón, donde la tradición milenaria se encuentra con la tecnología de vanguardia.',
        presupuesto_promedio: '$1,200 - $2,500 USD',
        duracion_recomendada: '5-7 días',
        mejor_epoca: 'Marzo a Mayo / Septiembre a Noviembre',
        es_popular: 1
      },
      {
        nombre: 'Maldivas',
        pais: 'Maldivas',
        categoria: 'Lujo',
        imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
        rating: 5.0,
        descripcion: 'Las Maldivas son un paraíso tropical compuesto por más de 1,000 islas de coral. Famosas por sus aguas cristalinas color turquesa.',
        presupuesto_promedio: '$2,500 - $5,000+ USD',
        duracion_recomendada: '5-7 días',
        mejor_epoca: 'Noviembre a Abril',
        es_popular: 1
      },
      {
        nombre: 'París',
        pais: 'Francia',
        categoria: 'Cultura',
        imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
        rating: 4.8,
        descripcion: 'París, la Ciudad de la Luz, es sinónimo de romance, arte y gastronomía. Con monumentos icónicos como la Torre Eiffel.',
        presupuesto_promedio: '$1,500 - $3,000 USD',
        duracion_recomendada: '4-6 días',
        mejor_epoca: 'Abril a Junio / Septiembre a Octubre',
        es_popular: 0
      },
      {
        nombre: 'Cancún',
        pais: 'México',
        categoria: 'Playa',
        imagen: 'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=800',
        rating: 4.6,
        descripcion: 'Cancún es el destino de playa más popular de México, famoso por sus aguas turquesas y vida nocturna vibrante.',
        presupuesto_promedio: '$800 - $1,800 USD',
        duracion_recomendada: '5-7 días',
        mejor_epoca: 'Diciembre a Abril',
        es_popular: 0
      },
      {
        nombre: 'Bali',
        pais: 'Indonesia',
        categoria: 'Playa',
        imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        rating: 4.8,
        descripcion: 'Bali, la Isla de los Dioses, combina playas paradisíacas, templos sagrados y una cultura espiritual única.',
        presupuesto_promedio: '$1,000 - $2,200 USD',
        duracion_recomendada: '7-10 días',
        mejor_epoca: 'Abril a Octubre',
        es_popular: 0
      },
      {
        nombre: 'Nueva York',
        pais: 'Estados Unidos',
        categoria: 'Ciudad',
        imagen: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
        rating: 4.7,
        descripcion: 'La ciudad que nunca duerme, Nueva York es conocida por sus rascacielos, museos y diversidad cultural.',
        presupuesto_promedio: '$1,500 - $3,500 USD',
        duracion_recomendada: '5-7 días',
        mejor_epoca: 'Abril a Junio / Septiembre a Noviembre',
        es_popular: 0
      },
      {
        nombre: 'Barcelona',
        pais: 'España',
        categoria: 'Cultura',
        imagen: 'https://images.unsplash.com/photo-1562883676-8c6b0d0b2a6e?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1562883676-8c6b0d0b2a6e?w=800',
        rating: 4.6,
        descripcion: 'Barcelona es una ciudad vibrante con arquitectura modernista, playas y una escena gastronómica excepcional.',
        presupuesto_promedio: '$1,200 - $2,500 USD',
        duracion_recomendada: '4-5 días',
        mejor_epoca: 'Mayo a Junio / Septiembre a Octubre',
        es_popular: 0
      },
      {
        nombre: 'Estambul',
        pais: 'Turquía',
        categoria: 'Cultura',
        imagen: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800',
        rating: 4.5,
        descripcion: 'Estambul es la ciudad donde Oriente y Occidente se encuentran, con su famoso Bósforo y mezquitas históricas.',
        presupuesto_promedio: '$800 - $1,800 USD',
        duracion_recomendada: '3-5 días',
        mejor_epoca: 'Abril a Mayo / Octubre a Noviembre',
        es_popular: 0
      },
      {
        nombre: 'Dubai',
        pais: 'Emiratos Árabes Unidos',
        categoria: 'Lujo',
        imagen: 'https://images.unsplash.com/photo-1518684029980-cf91ee70ee05?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1518684029980-cf91ee70ee05?w=800',
        rating: 4.6,
        descripcion: 'Dubai es una ciudad de lujo con rascacielos futuristas, compras de clase mundial y playas exóticas.',
        presupuesto_promedio: '$1,200 - $3,000 USD',
        duracion_recomendada: '4-6 días',
        mejor_epoca: 'Noviembre a Marzo',
        es_popular: 0
      },
      {
        nombre: 'Riviera Maya',
        pais: 'México',
        categoria: 'Playa',
        imagen: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        rating: 4.7,
        descripcion: 'La Riviera Maya combina playas de arena blanca, cenotes y ruinas mayas en un paraíso tropical.',
        presupuesto_promedio: '$1,000 - $2,500 USD',
        duracion_recomendada: '5-7 días',
        mejor_epoca: 'Diciembre a Abril',
        es_popular: 0
      },
      {
        nombre: 'Kioto',
        pais: 'Japón',
        categoria: 'Cultura',
        imagen: 'https://images.unsplash.com/photo-1522383507460-1d0089e8e77d?w=400',
        imagen_principal: 'https://images.unsplash.com/photo-1522383507460-1d0089e8e77d?w=800',
        rating: 4.8,
        descripcion: 'Kioto es la antigua capital de Japón, famosa por sus templos tradicionales, jardines zen y geishas.',
        presupuesto_promedio: '$1,000 - $2,000 USD',
        duracion_recomendada: '4-5 días',
        mejor_epoca: 'Marzo a Mayo / Octubre a Noviembre',
        es_popular: 0
      }
    ];

    console.log(`📍 Total destinos a insertar: ${destinosOriginales.length}\n`);

    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO destinos (
          nombre, pais, categoria, imagen, imagen_principal, 
          rating, descripcion, presupuesto_promedio, 
          duracion_recomendada, mejor_epoca, es_popular
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      destinosOriginales.forEach((destino) => {
        stmt.run(
          destino.nombre,
          destino.pais,
          destino.categoria,
          destino.imagen,
          destino.imagen_principal,
          destino.rating,
          destino.descripcion,
          destino.presupuesto_promedio,
          destino.duracion_recomendada,
          destino.mejor_epoca,
          destino.es_popular ? 1 : 0,
          (err) => {
            if (err) {
              console.error(`❌ Error insertando ${destino.nombre}:`, err.message);
            } else {
              count++;
              console.log(`✅ Destino agregado: ${destino.nombre}`);

              if (count === destinosOriginales.length) {
                stmt.finalize();
                console.log('\n✨ Destinos poblados exitosamente!');
                console.log(`📊 Total destinos agregados: ${count}\n`);
                
                poblarUsuarios();
              }
            }
          }
        );
      });
    });
  });
}

function poblarUsuarios() {
  db.run('DELETE FROM usuarios', (err) => {
    console.log('🧹 Tabla usuarios limpiada');

    const usuarios = [
      { nombre: 'Joel Sánchez', email: 'joel@example.com', password: 'password123', avatar: '👨‍💼' },
      { nombre: 'María García', email: 'maria@example.com', password: 'password123', avatar: '👩‍💼' },
      { nombre: 'Carlos López', email: 'carlos@example.com', password: 'password123', avatar: '👨‍💻' },
      { nombre: 'Ana Martínez', email: 'ana@example.com', password: 'password123', avatar: '👩‍💻' },
      { nombre: 'Diego Rodríguez', email: 'diego@example.com', password: 'password123', avatar: '👨‍🎤' }
    ];

    // Hashear las contraseñas antes de insertarlas
    (async () => {
      const stmt = db.prepare(`INSERT INTO usuarios (nombre, email, password, avatar) VALUES (?, ?, ?, ?)`);
      let count = 0;

      for (const usuario of usuarios) {
        try {
          const hashed = await bcrypt.hash(usuario.password, 10);
          await new Promise((resolve) => {
            stmt.run(usuario.nombre, usuario.email, hashed, usuario.avatar, (err) => {
              if (err) {
                console.error(`❌ Error insertando usuario ${usuario.nombre}:`, err.message);
              } else {
                count++;
                console.log(`✅ Usuario agregado: ${usuario.nombre}`);
              }
              resolve();
            });
          });
        } catch (e) {
          console.error(`❌ Error al hashear/insertar ${usuario.nombre}:`, e.message || e);
        }
      }

      stmt.finalize(() => {
        console.log(`\n📊 Total usuarios agregados: ${count}\n`);
        poblarAgencias();
      });
    })();
  });
}

function poblarAgencias() {
  db.run('DELETE FROM agencias', (err) => {
    console.log('🧹 Tabla agencias limpiada');

    const agencias = [
      {
        nombre: 'Viajes Globales',
        email: 'info@viagesglobales.com',
        password: 'agencia123',
        descripcion: 'Expertos en viajes internacionales con 20 años de experiencia',
        logo: '🌎',
        contacto: '+1-800-VIAJES',
        sitio_web: 'www.viagesglobales.com'
      },
      {
        nombre: 'Aventura Total',
        email: 'contact@aventuratotal.com',
        password: 'agencia123',
        descripcion: 'Especialistas en turismo de aventura y expediciones',
        logo: '⛰️',
        contacto: '+1-800-AVENTURA',
        sitio_web: 'www.aventuratotal.com'
      },
      {
        nombre: 'Playas Paradisíacas',
        email: 'reservas@playasparadisiacas.com',
        password: 'agencia123',
        descripcion: 'Los mejores destinos de playa del mundo',
        logo: '🏖️',
        contacto: '+1-800-PLAYAS',
        sitio_web: 'www.playasparadisiacas.com'
      },
      {
        nombre: 'City Tours Pro',
        email: 'bookings@citytourspo.com',
        password: 'agencia123',
        descripcion: 'Tours urbanos y culturales en las principales ciudades',
        logo: '🏙️',
        contacto: '+1-800-CITYTOURS',
        sitio_web: 'www.citytourspo.com'
      },
      {
        nombre: 'Lujo Travel',
        email: 'reservations@lujotrave.com',
        password: 'agencia123',
        descripcion: 'Experiencias de viaje de lujo y exclusivas',
        logo: '💎',
        contacto: '+1-800-LUJO',
        sitio_web: 'www.lujotrave.com'
      }
    ];

    const stmt = db.prepare(`INSERT INTO agencias (nombre, email, password, descripcion, logo, contacto, sitio_web) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    let count = 0;

    agencias.forEach((agencia) => {
      stmt.run(agencia.nombre, agencia.email, agencia.password, agencia.descripcion, agencia.logo, agencia.contacto, agencia.sitio_web, (err) => {
        if (err) {
          console.error(`❌ Error insertando agencia ${agencia.nombre}:`, err.message);
        } else {
          count++;
          console.log(`✅ Agencia agregada: ${agencia.nombre}`);

          if (count === agencias.length) {
            stmt.finalize();
            console.log(`\n📊 Total agencias agregadas: ${count}\n`);
            finalizarSeed();
          }
        }
      });
    });
  });
}

function finalizarSeed() {
  console.log('🎉 Seed completado exitosamente!');
  console.log('📊 Resumen:');
  console.log('   - 17 destinos');
  console.log('   - 5 usuarios de ejemplo');
  console.log('   - 5 agencias de viaje');
  console.log('\nBD lista para usar.\n');
  
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    }
    process.exit(0);
  });
}
