const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'travelpin-backend', 'BDTravelPin.db');
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

    let destinosDelJSON = [];
    if (fs.existsSync(destinosJsonPath)) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(destinosJsonPath, 'utf8'));
        destinosDelJSON = Object.values(jsonData).map((destino, index) => ({
          nombre: destino.title || destino.nombre,
          pais: destino.country || destino.pais,
          categoria: destino.category || destino.categoria,
          imagen: destino.image_url || destino.imagen,
          imagen_principal: destino.image_url || destino.imagen_principal,
          rating: destino.rating || 4.5,
          descripcion: destino.description || destino.descripcion,
          presupuesto_promedio: destino.budget_estimate || destino.presupuesto_promedio,
          duracion_recomendada: destino.duration || destino.duracion_recomendada,
          mejor_epoca: destino.best_season || destino.mejor_epoca,
          es_popular: index < 3
        }));
        console.log(`✅ ${destinosDelJSON.length} destinos cargados desde destinos.json\n`);
      } catch (err) {
        console.error('❌ Error al leer destinos.json:', err.message);
      }
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
      }
    ];

    const todosDestinos = [...destinosDelJSON];
    const nombresEnJSON = destinosDelJSON.map(d => d.nombre.toLowerCase());
    destinosOriginales.forEach(destino => {
      if (!nombresEnJSON.includes(destino.nombre.toLowerCase())) {
        todosDestinos.push(destino);
      }
    });

    console.log(`📍 Total destinos a insertar: ${todosDestinos.length}\n`);

    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO destinos (
          nombre, pais, categoria, imagen, imagen_principal, 
          rating, descripcion, presupuesto_promedio, 
          duracion_recomendada, mejor_epoca, es_popular
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      todosDestinos.forEach((destino) => {
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

              if (count === todosDestinos.length) {
                stmt.finalize();
                console.log('\n✨ Base de datos poblada exitosamente!');
                console.log(`📊 Total destinos agregados: ${count}`);
                
                db.close((err) => {
                  if (err) {
                    console.error('Error al cerrar la base de datos:', err);
                  } else {
                    console.log('\n🎉 Seed completado. BD lista para usar.\n');
                  }
                  process.exit(0);
                });
              }
            }
          }
        );
      });
    });
  });
}
