// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const emailService = require('./email-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui_cambiar_en_produccion';

// SQLite - funciona igual en local y en Railway
const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.DATABASE_PATH || './BDTravelPin.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos SQLite:', dbPath);
});

// Middleware - CORS abierto para producción
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== HELPER PARA ASYNC HANDLERS (evita deprecated warning) ==========
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ========== HEALTH CHECK PARA RAILWAY ==========
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'travelpin-backend'
  });
});

// Health check en español para Railway
app.get('/api/salud', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inicializar base de datos y servidor
inicializarBaseDeDatos(() => {
  const HOST = '0.0.0.0'; // Necesario para Railway/Docker
  
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
    console.log(`📊 API disponible en http://${HOST}:${PORT}/api`);
  });
  
  server.on('error', (err) => {
    console.error('Error del servidor:', err);
    process.exit(1);
  });
});

// Función para inicializar las tablas de forma secuencial
function inicializarBaseDeDatos(callback) {
  const tablas = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      email_verified INTEGER DEFAULT 0,
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
      calificacion INTEGER,
      resena TEXT,
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
    )`,
    
    `CREATE TABLE IF NOT EXISTS viaje_itinerario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      fecha TEXT,
      dia INTEGER,
      actividad TEXT NOT NULL,
      destino_id INTEGER,
      hora TEXT,
      notas TEXT,
      completado INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS recordatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha TEXT,
      completado INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS invitaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      viaje_id INTEGER NOT NULL,
      fecha_creacion INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS viajes_compartidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      rol TEXT DEFAULT 'participante',
      fecha_union DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE(viaje_id, usuario_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS reservas (
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
      FOREIGN KEY (paquete_id) REFERENCES paquetes(id) ON DELETE CASCADE,
      FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
    )`
  ];

  // Tabla para tokens de verificación de email
  tablas.push(`CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`);

  let index = 0;
  function crearTablaProxima() {
    if (index >= tablas.length) {
      console.log('✨ Todas las tablas creadas correctamente');
      // Ejecutar seed de datos si la BD está vacía
      const { seedDatabase } = require('./seed-database');
      seedDatabase().then(() => {
        if (callback) callback();
      }).catch(err => {
        console.error('Error en seed:', err);
        if (callback) callback();
      });
      return;
    }
    
    const sql = tablas[index];
    index++;
    
    db.run(sql, (err) => {
      if (err) {
        console.error('Error creando tabla:', err.message);
      } else {
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
        console.log(`✅ Tabla ${tableName} lista`);
      }
      // Crear la siguiente tabla
      crearTablaProxima();
    });
  }

  crearTablaProxima();
}

// Intentar añadir columna email_verified si no existe (safe - ignoramos errores)
db.run("ALTER TABLE usuarios ADD COLUMN email_verified INTEGER DEFAULT 0", (err) => {
  if (err) {
    // Probablemente la columna ya existe; ignorar
  } else {
    console.log('✅ Columna email_verified añadida a usuarios (si no existía)');
  }
});

// Añadir columnas calificacion y resena a viajes si no existen
db.run("ALTER TABLE viajes ADD COLUMN calificacion INTEGER", (err) => {
  if (!err) console.log('✅ Columna calificacion añadida a viajes');
});
db.run("ALTER TABLE viajes ADD COLUMN resena TEXT", (err) => {
  if (!err) console.log('✅ Columna resena añadida a viajes');
});

// Middleware de autenticación
function verificarToken(req, res, next) {
  // Buscar token en headers o query string (para SSE que no soporta headers)
  let token = req.headers['authorization']?.split(' ')[1];
  
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    req.userId = decoded.id;
    next();
  });
}

// Helper: Verificar si el usuario tiene acceso al viaje (propietario o compartido)
function verificarAccesoViaje(viajeId, usuarioId, callback) {
  // Primero verificar si es el propietario
  db.get('SELECT id, usuario_id FROM viajes WHERE id = ?', [viajeId], (err, viaje) => {
    if (err) {
      return callback(err, false);
    }
    if (!viaje) {
      return callback(null, false, 'Viaje no encontrado');
    }
    
    // Si es el propietario, tiene acceso
    if (viaje.usuario_id === usuarioId) {
      return callback(null, true, 'propietario');
    }
    
    // Si no, verificar si está en viajes_compartidos
    db.get('SELECT id FROM viajes_compartidos WHERE viaje_id = ? AND usuario_id = ?', 
      [viajeId, usuarioId], 
      (err2, compartido) => {
        if (err2) {
          return callback(err2, false);
        }
        if (compartido) {
          return callback(null, true, 'compartido');
        }
        return callback(null, false, 'Sin acceso');
      }
    );
  });
}

// ==================== ENDPOINT DE SEED (para inicializar datos) ====================
app.post('/api/admin/seed', asyncHandler(async (req, res) => {
  const { force } = req.body;
  
  try {
    // Verificar si hay destinos
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM destinos', (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    if (count > 0 && !force) {
      return res.json({ message: `Ya hay ${count} destinos en la BD. Usa force:true para reinicializar.`, count });
    }

    // Datos de seed
    const seedData = {
      destinos: [
        { id: 1, nombre: 'París', pais: 'Francia', categoria: 'Ciudad', imagen_principal: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200', descripcion: 'La Ciudad de la Luz.' },
        { id: 2, nombre: 'Tokio', pais: 'Japón', categoria: 'Ciudad', imagen_principal: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200', descripcion: 'Metrópoli vibrante.' },
        { id: 3, nombre: 'Nueva York', pais: 'Estados Unidos', categoria: 'Ciudad', imagen_principal: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200', descripcion: 'La ciudad que nunca duerme.' },
        { id: 4, nombre: 'Roma', pais: 'Italia', categoria: 'Ciudad', imagen_principal: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200', descripcion: 'La Ciudad Eterna.' },
        { id: 5, nombre: 'Barcelona', pais: 'España', categoria: 'Ciudad', imagen_principal: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200', descripcion: 'Ciudad de Gaudí.' },
        { id: 27, nombre: 'Maldivas', pais: 'Maldivas', categoria: 'Playa', imagen_principal: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200', descripcion: 'Paraíso tropical.' },
        { id: 29, nombre: 'Cancún', pais: 'México', categoria: 'Playa', imagen_principal: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200', descripcion: 'Paraíso caribeño.' },
        { id: 30, nombre: 'Riviera Maya', pais: 'México', categoria: 'Playa', imagen_principal: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200', descripcion: 'Costa caribeña con cenotes.' },
        { id: 31, nombre: 'Los Cabos', pais: 'México', categoria: 'Playa', imagen_principal: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200', descripcion: 'Destino de playa de lujo.' },
        { id: 32, nombre: 'Puerto Vallarta', pais: 'México', categoria: 'Playa', imagen_principal: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=1200', descripcion: 'Ciudad costera encantadora.' },
        { id: 33, nombre: 'Ciudad de México', pais: 'México', categoria: 'Ciudad', imagen_principal: 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=1200', descripcion: 'Capital vibrante.' }
      ],
      agencias: [
        { id: 16, nombre: 'Viajes Paradiso', logo: '🌴', email: 'paradiso@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', descripcion: 'Especialistas en viajes de lujo.' },
        { id: 17, nombre: 'TurMex Adventures', logo: '🦅', email: 'turmex@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', descripcion: 'Aventuras por México.' },
        { id: 18, nombre: 'Sol y Playa Tours', logo: '☀️', email: 'solplaya@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', descripcion: 'Mejores destinos de playa.' },
        { id: 19, nombre: 'World Explorer', logo: '🌍', email: 'world@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', descripcion: 'Viajes internacionales de ensueño.' }
      ],
      paquetes: [
        { id: 7, agencia_id: 16, nombre: 'Cancún Premium All-Inclusive', precio: 25000, duracion: '5 días / 4 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Hotel 5 estrellas', 'Todo incluido', 'Tour Chichén Itzá']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada y check-in'},{dia:2,actividades:'Playa y actividades'},{dia:3,actividades:'Chichén Itzá'},{dia:4,actividades:'Snorkel'},{dia:5,actividades:'Check-out'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:8000},{concepto:'Hotel',monto:12000},{concepto:'Tours',monto:5000}])
        },
        { id: 8, agencia_id: 17, nombre: 'Aventura Riviera Maya', precio: 18000, duracion: '4 días / 3 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Hotel 4 estrellas', 'Tour Tulum']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada'},{dia:2,actividades:'Tulum y cenotes'},{dia:3,actividades:'Xcaret'},{dia:4,actividades:'Regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:6000},{concepto:'Hotel',monto:7500},{concepto:'Tours',monto:4500}])
        },
        { id: 9, agencia_id: 19, nombre: 'Maldivas Paradise', precio: 85000, duracion: '7 días / 6 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Resort sobre el agua', 'Todo incluido', 'Snorkel', 'Spa']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada a Malé, traslado en lancha al resort'},{dia:2,actividades:'Día de relax en villa sobre el agua'},{dia:3,actividades:'Snorkel con mantarrayas y tiburones'},{dia:4,actividades:'Excursión a isla local'},{dia:5,actividades:'Día de spa y masajes'},{dia:6,actividades:'Pesca al atardecer y cena romántica'},{dia:7,actividades:'Check-out y regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo internacional',monto:35000},{concepto:'Resort 6 noches',monto:42000},{concepto:'Excursiones',monto:5000},{concepto:'Spa',monto:3000}])
        },
        { id: 10, agencia_id: 19, nombre: 'París Romántico', precio: 45000, duracion: '6 días / 5 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Hotel 4 estrellas', 'Tour Torre Eiffel', 'Crucero por el Sena', 'Louvre']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada a París, paseo por Champs-Élysées'},{dia:2,actividades:'Torre Eiffel y Arco del Triunfo'},{dia:3,actividades:'Museo del Louvre y Notre Dame'},{dia:4,actividades:'Versalles'},{dia:5,actividades:'Montmartre y crucero por el Sena'},{dia:6,actividades:'Compras y regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:18000},{concepto:'Hotel',monto:20000},{concepto:'Tours',monto:5000},{concepto:'Entradas',monto:2000}])
        },
        { id: 11, agencia_id: 19, nombre: 'Tokio Moderno', precio: 55000, duracion: '8 días / 7 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Hotel céntrico', 'JR Pass', 'Tour guiado']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada a Tokio'},{dia:2,actividades:'Shibuya y Harajuku'},{dia:3,actividades:'Templo Senso-ji y Akihabara'},{dia:4,actividades:'Monte Fuji'},{dia:5,actividades:'Kyoto - templos'},{dia:6,actividades:'Kyoto - geishas'},{dia:7,actividades:'Osaka'},{dia:8,actividades:'Regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:25000},{concepto:'Hotel',monto:21000},{concepto:'JR Pass',monto:6000},{concepto:'Tours',monto:3000}])
        },
        { id: 12, agencia_id: 18, nombre: 'Nueva York City Break', precio: 38000, duracion: '5 días / 4 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Hotel Manhattan', 'City Pass', 'Tour en bus']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada, Times Square'},{dia:2,actividades:'Estatua de la Libertad y Wall Street'},{dia:3,actividades:'Central Park y museos'},{dia:4,actividades:'Brooklyn y compras'},{dia:5,actividades:'Regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:15000},{concepto:'Hotel',monto:18000},{concepto:'City Pass',monto:3500},{concepto:'Transporte',monto:1500}])
        },
        { id: 13, agencia_id: 18, nombre: 'Roma Imperial', precio: 42000, duracion: '6 días / 5 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Hotel céntrico', 'Tour Coliseo', 'Vaticano', 'Pompeya']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada, Fontana di Trevi'},{dia:2,actividades:'Coliseo y Foro Romano'},{dia:3,actividades:'Vaticano y Capilla Sixtina'},{dia:4,actividades:'Excursión a Pompeya'},{dia:5,actividades:'Trastevere y compras'},{dia:6,actividades:'Regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:16000},{concepto:'Hotel',monto:17500},{concepto:'Tours',monto:6000},{concepto:'Entradas',monto:2500}])
        },
        { id: 14, agencia_id: 16, nombre: 'Barcelona Gaudí', precio: 35000, duracion: '5 días / 4 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Hotel 4 estrellas', 'Sagrada Familia', 'Park Güell']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada, Las Ramblas'},{dia:2,actividades:'Sagrada Familia y Park Güell'},{dia:3,actividades:'Barrio Gótico y playa'},{dia:4,actividades:'Montjuic y Camp Nou'},{dia:5,actividades:'Regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:14000},{concepto:'Hotel',monto:15000},{concepto:'Tours',monto:4000},{concepto:'Entradas',monto:2000}])
        },
        { id: 15, agencia_id: 17, nombre: 'Los Cabos Luxury', precio: 32000, duracion: '5 días / 4 noches',
          incluye: JSON.stringify(['Vuelo redondo', 'Resort 5 estrellas', 'Tour al Arco', 'Pesca']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada al resort'},{dia:2,actividades:'Playa y piscina'},{dia:3,actividades:'Tour al Arco y El Médano'},{dia:4,actividades:'Pesca deportiva'},{dia:5,actividades:'Regreso'}]),
          gastos: JSON.stringify([{concepto:'Vuelo',monto:8000},{concepto:'Resort',monto:18000},{concepto:'Tours',monto:4000},{concepto:'Pesca',monto:2000}])
        },
        { id: 16, agencia_id: 17, nombre: 'CDMX Cultural', precio: 12000, duracion: '4 días / 3 noches',
          incluye: JSON.stringify(['Hotel céntrico', 'Tour Teotihuacán', 'Xochimilco', 'Museo Antropología']),
          itinerario: JSON.stringify([{dia:1,actividades:'Llegada, Zócalo y Centro Histórico'},{dia:2,actividades:'Teotihuacán'},{dia:3,actividades:'Coyoacán y Xochimilco'},{dia:4,actividades:'Museo y regreso'}]),
          gastos: JSON.stringify([{concepto:'Hotel',monto:6000},{concepto:'Tours',monto:4000},{concepto:'Entradas',monto:1500},{concepto:'Transporte',monto:500}])
        }
      ],
      paquete_destinos: [
        { paquete_id: 7, destino_id: 29 },   // Cancún
        { paquete_id: 8, destino_id: 30 },   // Riviera Maya
        { paquete_id: 9, destino_id: 27 },   // Maldivas
        { paquete_id: 10, destino_id: 1 },   // París
        { paquete_id: 11, destino_id: 2 },   // Tokio
        { paquete_id: 12, destino_id: 3 },   // Nueva York
        { paquete_id: 13, destino_id: 4 },   // Roma
        { paquete_id: 14, destino_id: 5 },   // Barcelona
        { paquete_id: 15, destino_id: 31 },  // Los Cabos
        { paquete_id: 16, destino_id: 33 }   // CDMX
      ]
    };

    // Insertar datos
    for (const d of seedData.destinos) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO destinos (id, nombre, pais, categoria, imagen_principal, descripcion) VALUES (?,?,?,?,?,?)',
          [d.id, d.nombre, d.pais, d.categoria, d.imagen_principal, d.descripcion], err => err ? reject(err) : resolve());
      });
    }

    for (const a of seedData.agencias) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO agencias (id, nombre, logo, email, password, descripcion) VALUES (?,?,?,?,?,?)',
          [a.id, a.nombre, a.logo, a.email, a.password, a.descripcion], err => err ? reject(err) : resolve());
      });
    }

    for (const p of seedData.paquetes) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO paquetes (id, agencia_id, nombre, precio, duracion, incluye, itinerario, gastos) VALUES (?,?,?,?,?,?,?,?)',
          [p.id, p.agencia_id, p.nombre, p.precio, p.duracion, p.incluye, p.itinerario, p.gastos], err => err ? reject(err) : resolve());
      });
    }

    for (const pd of seedData.paquete_destinos) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO paquete_destinos (paquete_id, destino_id) VALUES (?,?)',
          [pd.paquete_id, pd.destino_id], err => err ? reject(err) : resolve());
      });
    }

    res.json({ 
      success: true, 
      message: 'Seed ejecutado correctamente',
      inserted: {
        destinos: seedData.destinos.length,
        agencias: seedData.agencias.length,
        paquetes: seedData.paquetes.length
      }
    });
  } catch (error) {
    console.error('Error en seed:', error);
    res.status(500).json({ error: 'Error al ejecutar seed', details: error.message });
  }
}));

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Registro de usuario (SIN verificación de email - acceso directo)
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO usuarios (nombre, email, password, email_verified) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, 1], // email_verified = 1 (verificado automáticamente)
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'El email ya está registrado' });
          }
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }

        const userId = this.lastID;

        // Devolver token directamente sin requerir verificación
        const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
          message: 'Usuario registrado exitosamente',
          token,
          usuario: { id: userId, nombre, email }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}));

// Login de usuario
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
    if (err) {
      return res.status(500).json({ error: 'Error al buscar usuario' });
    }

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Sin verificación de email requerida
    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        avatar: usuario.avatar
      }
    });
  });
});

// Obtener perfil del usuario autenticado
app.get('/api/auth/profile', verificarToken, (req, res) => {
  db.get(
    'SELECT id, nombre, email, avatar, created_at FROM usuarios WHERE id = ?',
    [req.userId],
    (err, usuario) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener perfil' });
      }
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(usuario);
    }
  );
});

// ==================== EMAIL VERIFICATION & SOCIAL TOKEN EXCHANGE ====================

// Enviar correo de verificación (con envío real de email)
app.post('/api/send-verification', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email requerido' });

  db.get('SELECT id, nombre FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
    if (err) return res.status(500).json({ success: false, error: 'Error al buscar usuario' });
    if (!usuario) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hora

    db.run('INSERT INTO email_verifications (usuario_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
      [usuario.id, email, token, expiresAt], async function(err2) {
        if (err2) return res.status(500).json({ success: false, error: 'Error al crear token de verificación' });

        const frontend = process.env.FRONTEND_URL || `http://localhost:4200`;
        const verificationLink = `${frontend}/verify-email?token=${token}`;

        try {
          // Intentar enviar email real
          const emailResult = await emailService.sendVerificationEmail(email, verificationLink, usuario.nombre);
          
          if (emailResult.simulated) {
            // Email simulado (no configurado)
            res.json({ 
              success: true, 
              message: 'Correo de verificación generado (revisa logs - email no configurado)',
              verificationLink, // Incluir link para testing
              simulated: true
            });
          } else {
            // Email enviado exitosamente
            res.json({ 
              success: true, 
              message: 'Correo de verificación enviado exitosamente',
              simulated: false
            });
          }
        } catch (error) {
          console.error('Error al enviar email:', error);
          // Si falla el envío, devolver el link para que pueda usarse manualmente
          res.json({ 
            success: true, 
            message: 'Token creado pero hubo un error al enviar el email',
            verificationLink,
            error: error.message
          });
        }
      }
    );
  });
}));

// Verificar email por token (redirige al frontend)
app.get('/api/verify-email', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Token requerido');

  db.get('SELECT * FROM email_verifications WHERE token = ?', [token], (err, row) => {
    if (err) return res.status(500).send('Error al verificar token');
    if (!row) return res.status(404).send('Token no encontrado o ya usado');

    if (Date.now() > Number(row.expires_at)) {
      return res.status(400).send('Token expirado');
    }

    // Marcar usuario como verificado y redirigir
    db.run('UPDATE usuarios SET email_verified = 1 WHERE id = ?', [row.usuario_id], function(err2) {
      if (err2) return res.status(500).send('Error al actualizar usuario');

      // Eliminar token
      db.run('DELETE FROM email_verifications WHERE id = ?', [row.id], () => {});

      // Redirigir a frontend con el token en la URL
      const frontend = process.env.FRONTEND_URL || `http://localhost:4200`;
      return res.redirect(`${frontend}/verify-email?token=${encodeURIComponent(token)}`);
    });
  });
});

// Nuevo endpoint: Verificar email y devolver credenciales para auto-login
app.get('/api/verify-email-and-login', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ success: false, message: 'Token requerido' });

  db.get('SELECT * FROM email_verifications WHERE token = ?', [token], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al verificar token' });
    if (!row) return res.status(404).json({ success: false, message: 'Token no encontrado o ya usado' });

    if (Date.now() > Number(row.expires_at)) {
      return res.status(400).json({ success: false, message: 'Token expirado' });
    }

    // Marcar usuario como verificado
    db.run('UPDATE usuarios SET email_verified = 1 WHERE id = ?', [row.usuario_id], function(err2) {
      if (err2) return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });

      // Obtener datos del usuario
      db.get('SELECT id, nombre, email, avatar FROM usuarios WHERE id = ?', [row.usuario_id], (err3, usuario) => {
        if (err3 || !usuario) {
          return res.status(500).json({ success: false, message: 'Error al obtener datos del usuario' });
        }

        // Eliminar token usado
        db.run('DELETE FROM email_verifications WHERE id = ?', [row.id], () => {});

        // Generar token JWT para la sesión
        const sessionToken = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });

        // Devolver credenciales para auto-login
        res.json({
          success: true,
          message: 'Email verificado exitosamente',
          token: sessionToken,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            avatar: usuario.avatar
          }
        });
      });
    });
  });
});

// Intercambiar token social (emitido por provider o por ruta dev) por sesión en nuestra app
app.post('/api/auth/exchange-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Token requerido' });

  // Intentar verificar token (firmado con JWT_SECRET por nuestras herramientas de dev)
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const email = payload.email;

    if (!email) return res.status(400).json({ success: false, error: 'Token inválido' });

    // Buscar o crear usuario
    db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
      if (err) return res.status(500).json({ success: false, error: 'Error al buscar usuario' });

      if (!usuario) {
        // Crear usuario mínimo (password aleatorio)
        const randomPass = Math.random().toString(36).slice(-8);
        const hashed = await bcrypt.hash(randomPass, 10);
        db.run('INSERT INTO usuarios (nombre, email, password, email_verified) VALUES (?, ?, ?, 1)',
          [email.split('@')[0], email, hashed], function(err2) {
            if (err2) return res.status(500).json({ success: false, error: 'Error al crear usuario' });
            const newUserId = this.lastID;
            const appToken = jwt.sign({ id: newUserId }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ success: true, uid: newUserId, email, token: appToken });
        });
      } else {
        const appToken = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, uid: usuario.id, email: usuario.email, token: appToken });
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
});

// Ruta DEV para simular login con Google (local): redirige al frontend con un token JWT firmado
app.get('/api/auth/google/dev', (req, res) => {
  const email = req.query.email;
  const redirect = req.query.redirect || (process.env.FRONTEND_URL || 'http://localhost:4200');

  if (!email) {
    return res.status(400).send('Usar ?email=tu@correo para simular login de Google en desarrollo');
  }

  // Generar token temporal que el frontend intercambiará
  const socialToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' });

  // Redirigir al frontend login con token
  const target = `${redirect.replace(/\/$/, '')}/login?token=${encodeURIComponent(socialToken)}&redirect=${encodeURIComponent(req.query.redirect || '')}`;
  console.log('DEV Google redirect ->', target);
  res.redirect(target);
});

// ==================== RUTAS PARA PANEL-AGENCIA ====================

// Migrar agencias sin password (agregar password por defecto)
async function migrateAgenciasPassword() {
  const defaultPassword = await bcrypt.hash('password123', 10);
  db.all('SELECT id, email, password FROM agencias', [], (err, agencias) => {
    if (err || !agencias) return;
    agencias.forEach(agencia => {
      if (!agencia.password) {
        db.run('UPDATE agencias SET password = ? WHERE id = ?', [defaultPassword, agencia.id], (err2) => {
          if (!err2) console.log(`✅ Password agregado a agencia ID ${agencia.id}`);
        });
      }
    });
  });
}
// Ejecutar migración al iniciar
migrateAgenciasPassword();

// Registro de agencia
app.post('/api/agencias/registro', async (req, res) => {
  const { nombre, email, password, descripcion, logo, contacto } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ success: false, error: 'Nombre, email y password son requeridos' });
  }

  try {
    // Verificar si ya existe
    db.get('SELECT id FROM agencias WHERE email = ?', [email], async (err, existing) => {
      if (err) return res.status(500).json({ success: false, error: 'Error en base de datos' });
      if (existing) return res.status(400).json({ success: false, error: 'Ya existe una agencia con ese email' });

      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO agencias (nombre, email, password, descripcion, logo, contacto) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, email, hashedPassword, descripcion || '', logo || '🏢', contacto || ''],
        function(err2) {
          if (err2) return res.status(500).json({ success: false, error: 'Error al crear agencia' });
          
          res.json({ 
            success: true, 
            agencia: { 
              id: this.lastID, 
              nombre, 
              email, 
              descripcion, 
              logo, 
              contacto 
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Login de agencia
app.post('/api/agencias/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email y password requeridos' });

  db.get('SELECT * FROM agencias WHERE email = ?', [email], async (err, agencia) => {
    if (err) return res.status(500).json({ success: false, error: 'Error al buscar agencia' });
    if (!agencia) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });

    const valido = await bcrypt.compare(password, agencia.password);
    if (!valido) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });

    // No exponemos el password
    delete agencia.password;
    res.json({ success: true, agencia });
  });
});

// Obtener paquetes de una agencia (con destinos completos)
app.get('/api/agencias/:id/paquetes', (req, res) => {
  const agenciaId = req.params.id;
  db.all('SELECT * FROM paquetes WHERE agencia_id = ? ORDER BY created_at DESC', [agenciaId], (err, paquetes) => {
    if (err) return res.status(500).json({ error: 'Error al obtener paquetes' });

    // Para cada paquete obtener destinos completos
    const result = [];
    let processed = 0;
    if (!paquetes || paquetes.length === 0) return res.json([]);

    paquetes.forEach((p) => {
      db.all(
        `SELECT d.* FROM destinos d INNER JOIN paquete_destinos pd ON d.id = pd.destino_id WHERE pd.paquete_id = ? ORDER BY pd.orden ASC`,
        [p.id],
        (err2, destinos) => {
          processed++;
          const paquete = { ...p };
          // parse JSON fields
          try { paquete.incluye = paquete.incluye ? JSON.parse(paquete.incluye) : []; } catch(e) { paquete.incluye = []; }
          try { paquete.itinerario = paquete.itinerario ? JSON.parse(paquete.itinerario) : []; } catch(e) { paquete.itinerario = []; }
          try { paquete.gastos = paquete.gastos ? JSON.parse(paquete.gastos) : []; } catch(e) { paquete.gastos = []; }
          
          // Retornar tanto los IDs como los destinos completos
          const destMatriz = destinos || [];
          paquete.destinos = destMatriz.map(d => d.id); // Array de IDs
          paquete.destinosCompletos = destMatriz; // Array de objetos destino completos
          
          result.push(paquete);

          if (processed === paquetes.length) {
            res.json(result);
          }
        }
      );
    });
  });
});

// Crear paquete para una agencia
app.post('/api/agencias/:id/paquetes', (req, res) => {
  const agenciaId = req.params.id;
  const { nombre, precio, duracion, incluye, itinerario, gastos, destinos } = req.body;

  const incluyeJSON = incluye ? JSON.stringify(incluye) : JSON.stringify([]);
  const itinJSON = itinerario ? JSON.stringify(itinerario) : JSON.stringify([]);
  const gastosJSON = gastos ? JSON.stringify(gastos) : JSON.stringify([]);

  db.run(
    'INSERT INTO paquetes (agencia_id, nombre, precio, duracion, incluye, itinerario, gastos) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [agenciaId, nombre, precio, duracion || '', incluyeJSON, itinJSON, gastosJSON],
    function(err) {
      if (err) {
        console.error('Error al crear paquete:', err);
        return res.status(500).json({ error: 'Error al crear paquete' });
      }
      const paqueteId = this.lastID;

      if (Array.isArray(destinos) && destinos.length > 0) {
        // Insertar destinos uno por uno con db.run en lugar de prepare
        let inserted = 0;
        let hasError = false;
        
        destinos.forEach((destId, idx) => {
          if (hasError) return;
          db.run(
            'INSERT INTO paquete_destinos (paquete_id, destino_id, orden) VALUES (?, ?, ?)',
            [paqueteId, destId, idx],
            (err2) => {
              if (err2 && !hasError) {
                hasError = true;
                console.error('Error al insertar destino:', err2);
                return res.status(500).json({ error: 'Error al asociar destinos' });
              }
              inserted++;
              if (inserted === destinos.length && !hasError) {
                res.status(201).json({ message: 'Paquete creado', id: paqueteId });
              }
            }
          );
        });
      } else {
        res.status(201).json({ message: 'Paquete creado', id: paqueteId });
      }
    }
  );
});

// Actualizar paquete
app.put('/api/paquetes/:id', (req, res) => {
  const paqueteId = req.params.id;
  const { nombre, precio, duracion, incluye, itinerario, gastos, destinos } = req.body;

  const incluyeJSON = incluye ? JSON.stringify(incluye) : JSON.stringify([]);
  const itinJSON = itinerario ? JSON.stringify(itinerario) : JSON.stringify([]);
  const gastosJSON = gastos ? JSON.stringify(gastos) : JSON.stringify([]);

  db.run(
    'UPDATE paquetes SET nombre = ?, precio = ?, duracion = ?, incluye = ?, itinerario = ?, gastos = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
    [nombre, precio, duracion || '', incluyeJSON, itinJSON, gastosJSON, paqueteId],
    function(err) {
      if (err) {
        console.error('Error al actualizar paquete:', err);
        return res.status(500).json({ error: 'Error al actualizar paquete' });
      }
      // actualizar destinos: eliminar existentes y volver a insertar
      db.run('DELETE FROM paquete_destinos WHERE paquete_id = ?', [paqueteId], (err2) => {
        if (err2) {
          console.error('Error al eliminar destinos:', err2);
          return res.status(500).json({ error: 'Error al actualizar destinos del paquete' });
        }
        if (Array.isArray(destinos) && destinos.length > 0) {
          // Insertar destinos uno por uno con db.run
          let inserted = 0;
          let hasError = false;
          
          destinos.forEach((destId, idx) => {
            if (hasError) return;
            db.run(
              'INSERT INTO paquete_destinos (paquete_id, destino_id, orden) VALUES (?, ?, ?)',
              [paqueteId, destId, idx],
              (err3) => {
                if (err3 && !hasError) {
                  hasError = true;
                  console.error('Error al insertar destino:', err3);
                  return res.status(500).json({ error: 'Error al asociar destinos' });
                }
                inserted++;
                if (inserted === destinos.length && !hasError) {
                  res.json({ message: 'Paquete actualizado' });
                }
              }
            );
          });
        } else {
          res.json({ message: 'Paquete actualizado' });
        }
      });
    }
  );
});

// Eliminar paquete
app.delete('/api/paquetes/:id', (req, res) => {
  const paqueteId = req.params.id;
  db.run('DELETE FROM paquete_destinos WHERE paquete_id = ?', [paqueteId], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar relaciones de paquete' });
    db.run('DELETE FROM paquetes WHERE id = ?', [paqueteId], function(err2) {
      if (err2) return res.status(500).json({ error: 'Error al eliminar paquete' });
      res.json({ message: 'Paquete eliminado' });
    });
  });
});

// ==================== RUTAS DE RESERVAS ====================

// Crear una reserva de paquete
app.post('/api/reservas', asyncHandler(async (req, res) => {
  const { paquete_id, agencia_id, nombre_cliente, email_cliente, telefono_cliente, num_personas, fecha_salida, precio_total, notas } = req.body;
  
  if (!paquete_id || !agencia_id || !nombre_cliente || !email_cliente) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  try {
    // Obtener información completa del paquete para el email
    const paquete = await new Promise((resolve, reject) => {
      db.get('SELECT nombre, duracion, precio, incluye FROM paquetes WHERE id = ?', [paquete_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Obtener información completa de la agencia para el email
    const agencia = await new Promise((resolve, reject) => {
      db.get('SELECT nombre, email, contacto FROM agencias WHERE id = ?', [agencia_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Obtener destinos del paquete
    const destinos = await new Promise((resolve, reject) => {
      db.all(`
        SELECT d.nombre, d.pais 
        FROM paquete_destinos pd 
        JOIN destinos d ON pd.destino_id = d.id 
        WHERE pd.paquete_id = ?
      `, [paquete_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    // Crear la reserva
    const reservaId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reservas (paquete_id, agencia_id, nombre_cliente, email_cliente, telefono_cliente, num_personas, fecha_salida, precio_total, notas, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
        [paquete_id, agencia_id, nombre_cliente, email_cliente, telefono_cliente || '', num_personas || 1, fecha_salida || '', precio_total || 0, notas || ''],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // Preparar lista de destinos para el email
    const listaDestinos = destinos.length > 0 
      ? destinos.map(d => `${d.nombre}, ${d.pais}`).join(' → ')
      : '';
    
    // Enviar correo de confirmación
    try {
      await emailService.sendReservationConfirmationEmail(email_cliente, {
        nombreCliente: nombre_cliente,
        nombrePaquete: paquete?.nombre || 'Paquete de viaje',
        nombreAgencia: agencia?.nombre || 'Agencia de viajes',
        emailAgencia: agencia?.email || '',
        contactoAgencia: agencia?.contacto || '',
        numPersonas: num_personas || 1,
        fechaSalida: fecha_salida,
        precioTotal: precio_total,
        reservaId: reservaId,
        duracion: paquete?.duracion || '',
        destinos: listaDestinos,
        incluye: paquete?.incluye || ''
      });
      console.log(`✅ Email de confirmación de reserva enviado a ${email_cliente}`);
    } catch (emailError) {
      console.error('⚠️ Error al enviar email de confirmación:', emailError.message);
      // No fallamos la reserva si el email falla
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Reserva creada exitosamente. Te hemos enviado un correo de confirmación.', 
      id: reservaId 
    });
    
  } catch (err) {
    console.error('Error al crear reserva:', err);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
}));

// Obtener reservas de una agencia
app.get('/api/agencias/:id/reservas', (req, res) => {
  const agenciaId = req.params.id;
  
  db.all(
    `SELECT r.*, p.nombre as paquete_nombre, p.precio as paquete_precio, p.duracion as paquete_duracion
     FROM reservas r
     JOIN paquetes p ON r.paquete_id = p.id
     WHERE r.agencia_id = ?
     ORDER BY r.created_at DESC`,
    [agenciaId],
    (err, reservas) => {
      if (err) {
        console.error('Error al obtener reservas:', err);
        return res.status(500).json({ error: 'Error al obtener reservas' });
      }
      res.json(reservas || []);
    }
  );
});

// Actualizar estado de una reserva
app.put('/api/reservas/:id/estado', (req, res) => {
  const reservaId = req.params.id;
  const { estado } = req.body;
  
  const estadosValidos = ['pendiente', 'confirmada', 'cancelada', 'completada'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }
  
  db.run(
    'UPDATE reservas SET estado = ? WHERE id = ?',
    [estado, reservaId],
    function(err) {
      if (err) {
        console.error('Error al actualizar reserva:', err);
        return res.status(500).json({ error: 'Error al actualizar reserva' });
      }
      res.json({ message: 'Estado actualizado', estado });
    }
  );
});

// ==================== RUTAS DE DESTINOS ====================

// Endpoint de prueba simple
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test OK' });
});

// Obtener todos los destinos
app.get('/api/destinos', (req, res) => {
  console.log('📍 GET /api/destinos llamado');
  const sql = 'SELECT * FROM destinos ORDER BY rating DESC';
  console.log('🔍 Ejecutando query:', sql);
  
  db.all(sql, (err, destinos) => {
    if (err) {
      console.error('❌ Error en BD:', err.message);
      return res.status(500).json({ success: false, message: 'Error al obtener destinos: ' + err.message });
    }
    console.log('📊 Respuesta de BD:', destinos?.length || 0, 'destinos');
    res.json({
      success: true,
      count: destinos?.length || 0,
      data: destinos || []
    });
  });
});

// Obtener un destino por ID
app.get('/api/destinos/:id', (req, res) => {
  db.get('SELECT * FROM destinos WHERE id = ?', [req.params.id], (err, destino) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener destino' });
    }
    if (!destino) {
      return res.status(404).json({ success: false, message: 'Destino no encontrado', count: 0, data: null });
    }
    res.json({
      success: true,
      count: 1,
      data: destino
    });
  });
});

// Buscar destinos por nombre, país o categoría
app.get('/api/destinos/buscar/:query', (req, res) => {
  const query = `%${req.params.query}%`;
  
  db.all(`
    SELECT * FROM destinos 
    WHERE nombre LIKE ? OR pais LIKE ? OR categoria LIKE ?
    ORDER BY rating DESC
  `, [query, query, query], (err, destinos) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al buscar destinos' });
    }
    res.json({
      success: true,
      count: destinos?.length || 0,
      data: destinos || []
    });
  });
});

// Obtener destinos populares (es_popular = 1)
app.get('/api/destinos/featured/populares', (req, res) => {
  db.all(`
    SELECT * FROM destinos 
    WHERE es_popular = 1
    ORDER BY rating DESC
  `, [], (err, destinos) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener destinos populares' });
    }
    res.json({
      success: true,
      count: destinos?.length || 0,
      data: destinos || []
    });
  });
});

// Obtener paquetes de un destino específico
app.get('/api/destinos/:id/paquetes', (req, res) => {
  const destinoId = req.params.id;
  console.log(`📦 GET /api/destinos/${destinoId}/paquetes`);
  
  // Obtener paquetes que incluyen este destino
  db.all(`
    SELECT p.*, a.nombre as agencia_nombre, a.logo as agencia_logo, a.descripcion as agencia_descripcion
    FROM paquetes p
    JOIN paquete_destinos pd ON p.id = pd.paquete_id
    JOIN agencias a ON p.agencia_id = a.id
    WHERE pd.destino_id = ?
    ORDER BY p.precio ASC
  `, [destinoId], (err, paquetes) => {
    if (err) {
      console.error('Error al obtener paquetes del destino:', err);
      return res.status(500).json({ error: 'Error al obtener paquetes' });
    }
    
    // Parsear campos JSON y obtener destinos de cada paquete
    const paquetesConDestinos = paquetes.map(p => {
      let incluye = [];
      let itinerario = [];
      let gastos = [];
      
      try { incluye = typeof p.incluye === 'string' ? JSON.parse(p.incluye || '[]') : (p.incluye || []); } catch(e) {}
      try { itinerario = typeof p.itinerario === 'string' ? JSON.parse(p.itinerario || '[]') : (p.itinerario || []); } catch(e) {}
      try { gastos = typeof p.gastos === 'string' ? JSON.parse(p.gastos || '[]') : (p.gastos || []); } catch(e) {}
      
      return {
        ...p,
        incluye,
        itinerario,
        gastos,
        destinos: [] // Se llenará después
      };
    });
    
    // Obtener destinos para cada paquete
    if (paquetesConDestinos.length === 0) {
      return res.json([]);
    }
    
    const paqueteIds = paquetesConDestinos.map(p => p.id);
    const placeholders = paqueteIds.map(() => '?').join(',');
    
    db.all(`
      SELECT pd.paquete_id, d.id, d.nombre, d.pais, d.imagen_principal
      FROM paquete_destinos pd
      JOIN destinos d ON pd.destino_id = d.id
      WHERE pd.paquete_id IN (${placeholders})
      ORDER BY pd.orden
    `, paqueteIds, (err2, destinosPaquetes) => {
      if (err2) {
        console.error('Error al obtener destinos de paquetes:', err2);
        return res.json(paquetesConDestinos);
      }
      
      // Asignar destinos a cada paquete
      paquetesConDestinos.forEach(paquete => {
        paquete.destinos = destinosPaquetes
          .filter(d => d.paquete_id === paquete.id)
          .map(d => ({ id: d.id, nombre: d.nombre, pais: d.pais, imagen_principal: d.imagen_principal }));
      });
      
      console.log(`✅ Paquetes encontrados para destino ${destinoId}:`, paquetesConDestinos.length);
      res.json(paquetesConDestinos);
    });
  });
});

// ==================== RUTAS DE FAVORITOS ====================

// Obtener favoritos (compatible con ambas rutas)
app.get('/api/favoritos', (req, res) => {
  let userId = null;
  
  // Intentar obtener userId del token si está disponible
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch(e) {
      // Token inválido, ignorar
    }
  }
  
  // Si no hay token, esperar usuario_id en query
  if (!userId) userId = req.query.usuario_id;
  if (!userId) return res.status(400).json({ error: 'usuario_id requerido' });
  
  const query = `
    SELECT d.* FROM destinos d
    INNER JOIN favoritos f ON d.id = f.destino_id
    WHERE f.usuario_id = ?
    ORDER BY f.created_at DESC
  `;

  db.all(query, [userId], (err, favoritos) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener favoritos' });
    }
    res.json(favoritos);
  });
});

// Obtener favoritos de un usuario específico
app.get('/api/favoritos/usuario/:usuarioId', (req, res) => {
  const query = `
    SELECT d.* FROM destinos d
    INNER JOIN favoritos f ON d.id = f.destino_id
    WHERE f.usuario_id = ?
    ORDER BY f.created_at DESC
  `;

  db.all(query, [req.params.usuarioId], (err, favoritos) => {
    if (err) return res.status(500).json({ success: false, error: 'Error al obtener favoritos' });
    res.json({ success: true, count: favoritos.length, data: favoritos });
  });
});

// Agregar a favoritos (compatible con nueva API)
app.post('/api/favoritos', (req, res) => {
  const { usuario_id, destino_id } = req.body;
  if (!usuario_id || !destino_id) {
    return res.status(400).json({ error: 'usuario_id y destino_id son requeridos' });
  }

  db.run(
    'INSERT INTO favoritos (usuario_id, destino_id) VALUES (?, ?)',
    [usuario_id, destino_id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ success: false, error: 'Ya está en favoritos' });
        }
        return res.status(500).json({ success: false, error: 'Error al agregar favorito' });
      }
      res.status(201).json({ success: true, message: 'Agregado a favoritos', id: this.lastID });
    }
  );
});

// Agregar a favoritos (endpoint antiguo con token)
app.post('/api/favoritos/:destinoId', verificarToken, (req, res) => {
  db.run(
    'INSERT INTO favoritos (usuario_id, destino_id) VALUES (?, ?)',
    [req.userId, req.params.destinoId],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Ya está en favoritos' });
        }
        return res.status(500).json({ error: 'Error al agregar favorito' });
      }
      res.status(201).json({ message: 'Agregado a favoritos', id: this.lastID });
    }
  );
});

// Eliminar de favoritos por ID
app.delete('/api/favoritos/:id', (req, res) => {
  // Verificar si es un número de ID o es usuario/destino
  if (req.params.id.includes('/')) {
    // Manejar la ruta alternativa
    return;
  }
  
  db.run(
    'DELETE FROM favoritos WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Error al eliminar favorito' });
      res.json({ success: true, message: 'Eliminado de favoritos' });
    }
  );
});

// Eliminar de favoritos por usuario y destino (nueva ruta)
app.delete('/api/favoritos/usuario/:usuarioId/destino/:destinoId', (req, res) => {
  db.run(
    'DELETE FROM favoritos WHERE usuario_id = ? AND destino_id = ?',
    [req.params.usuarioId, req.params.destinoId],
    function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Error al eliminar favorito' });
      res.json({ success: true, message: 'Eliminado de favoritos' });
    }
  );
});

// Eliminar de favoritos (endpoint antiguo con token)
app.delete('/api/favoritos/destino/:destinoId', verificarToken, (req, res) => {
  db.run(
    'DELETE FROM favoritos WHERE usuario_id = ? AND destino_id = ?',
    [req.userId, req.params.destinoId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar favorito' });
      }
      res.json({ message: 'Eliminado de favoritos' });
    }
  );
});

// ==================== RUTAS DE VIAJES ====================

// Obtener viajes del usuario (propios + compartidos)
app.get('/api/viajes', verificarToken, asyncHandler(async (req, res) => {
  const usuarioId = req.userId;
  
  try {
    // Obtener viajes propios
    const viajesPropios = await new Promise((resolve, reject) => {
      db.all(
        'SELECT *, "propietario" as rol FROM viajes WHERE usuario_id = ? ORDER BY created_at DESC',
        [usuarioId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
    
    // Obtener viajes compartidos con este usuario
    const viajesCompartidos = await new Promise((resolve, reject) => {
      db.all(
        `SELECT v.*, vc.rol, vc.fecha_union 
         FROM viajes v 
         INNER JOIN viajes_compartidos vc ON v.id = vc.viaje_id 
         WHERE vc.usuario_id = ? 
         ORDER BY vc.fecha_union DESC`,
        [usuarioId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
    
    // Combinar ambas listas (evitando duplicados)
    const viajesIds = new Set(viajesPropios.map(v => v.id));
    const todosLosViajes = [
      ...viajesPropios,
      ...viajesCompartidos.filter(v => !viajesIds.has(v.id))
    ];
    
    // Obtener destinos para cada viaje
    for (const viaje of todosLosViajes) {
      const destinos = await new Promise((resolve, reject) => {
        db.all(
          `SELECT d.id, d.nombre, d.pais, d.imagen 
           FROM viaje_destinos vd 
           INNER JOIN destinos d ON vd.destino_id = d.id 
           WHERE vd.viaje_id = ? 
           ORDER BY vd.orden`,
          [viaje.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });
      viaje.destinos = destinos;
    }
    
    // Ordenar por fecha de creación/unión
    todosLosViajes.sort((a, b) => {
      const fechaA = new Date(a.fecha_union || a.created_at);
      const fechaB = new Date(b.fecha_union || b.created_at);
      return fechaB - fechaA;
    });
    
    res.json(todosLosViajes);
  } catch (error) {
    console.error('Error al obtener viajes:', error);
    res.status(500).json({ error: 'Error al obtener viajes' });
  }
}));

// Crear viaje
app.post('/api/viajes', verificarToken, asyncHandler(async (req, res) => {
  const { nombre, icono, fecha_inicio, fecha_fin, destinos } = req.body;

  try {
    // Primero obtener datos del usuario desde la base de datos
    const usuario = await new Promise((resolve, reject) => {
      db.get('SELECT nombre, email FROM usuarios WHERE id = ?', [req.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Crear el viaje
    const viajeId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO viajes (usuario_id, nombre, icono, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
        [req.userId, nombre, icono || '✈️', fecha_inicio, fecha_fin],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Agregar destinos si existen (uno por uno, compatible con Turso)
    if (destinos && destinos.length > 0) {
      for (let i = 0; i < destinos.length; i++) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO viaje_destinos (viaje_id, destino_id, orden) VALUES (?, ?, ?)',
            [viajeId, destinos[i], i],
            (err) => err ? reject(err) : resolve()
          );
        });
      }
    }

    // Agregar participante inicial con datos del usuario de la base de datos
    const nombreParticipante = usuario?.nombre || 'Usuario';
    const emailParticipante = usuario?.email || '';
    const inicialesParticipante = nombreParticipante.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const colorParticipante = '#FF6B6B';
    
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO participantes (viaje_id, nombre, email, iniciales, color) VALUES (?, ?, ?, ?, ?)',
        [viajeId, nombreParticipante, emailParticipante, inicialesParticipante, colorParticipante],
        (err) => err ? reject(err) : resolve()
      );
    });

    res.status(201).json({ message: 'Viaje creado', id: viajeId });
  } catch (err) {
    console.error('Error al crear viaje:', err);
    res.status(500).json({ error: 'Error al crear viaje' });
  }
}));

// Obtener gastos de un viaje
app.get('/api/viajes/:id/gastos', verificarToken, (req, res) => {
  const viajeId = req.params.id;
  const usuarioId = req.userId;
  
  // Verificar que el usuario tenga acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }
    
    db.all(
      'SELECT * FROM gastos WHERE viaje_id = ?',
      [viajeId],
      (err2, gastos) => {
        if (err2) {
          return res.status(500).json({ error: 'Error al obtener gastos' });
        }
        res.json(gastos);
      }
    );
  });
});

// Agregar gasto a un viaje
app.post('/api/viajes/:id/gastos', verificarToken, (req, res) => {
  const { descripcion, monto, categoria, pagado_por, fecha } = req.body;
  const viajeId = req.params.id;
  const usuarioId = req.userId;

  // Verificar que el usuario tenga acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }

    db.run(
      'INSERT INTO gastos (viaje_id, descripcion, monto, categoria, pagado_por, fecha) VALUES (?, ?, ?, ?, ?, ?)',
      [viajeId, descripcion, monto, categoria, pagado_por, fecha],
      function(err2) {
        if (err2) {
          return res.status(500).json({ error: 'Error al agregar gasto' });
        }
        const gastoId = this.lastID;
        
        // Notificar a todos los clientes conectados
        if (app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'gasto_agregado', { 
            id: gastoId, descripcion, monto, categoria, pagado_por, fecha 
          });
        }
        
        res.status(201).json({ message: 'Gasto agregado', id: gastoId });
      }
    );
  });
});

// Eliminar gasto de un viaje
app.delete('/api/viajes/:viajeId/gastos/:gastoId', verificarToken, (req, res) => {
  const { viajeId, gastoId } = req.params;
  const usuarioId = req.userId;

  // Verificar que el usuario tenga acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }

    db.run(
      'DELETE FROM gastos WHERE id = ? AND viaje_id = ?',
      [gastoId, viajeId],
      function(err2) {
        if (err2) {
          return res.status(500).json({ error: 'Error al eliminar gasto' });
        }
        
        // Notificar a todos los clientes conectados
        if (app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'gasto_eliminado', { id: gastoId });
        }
        
        res.json({ message: 'Gasto eliminado', deleted: this.changes > 0 });
      }
    );
  });
});

// Obtener pagos de un viaje
app.get('/api/viajes/:id/pagos', verificarToken, (req, res) => {
  const viajeId = req.params.id;
  const usuarioId = req.userId;
  
  // Verificar que el usuario tenga acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }
    
    db.all(
      'SELECT * FROM pagos WHERE viaje_id = ?',
      [viajeId],
      (err2, pagos) => {
        if (err2) {
          return res.status(500).json({ error: 'Error al obtener pagos' });
        }
        res.json(pagos);
      }
    );
  });
});

// Agregar pago a un viaje
app.post('/api/viajes/:id/pagos', verificarToken, (req, res) => {
  const { participante, monto, descripcion, fecha } = req.body;
  const viajeId = req.params.id;
  const usuarioId = req.userId;

  // Verificar que el usuario tenga acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }

    db.run(
      'INSERT INTO pagos (viaje_id, participante, monto, descripcion, fecha) VALUES (?, ?, ?, ?, ?)',
      [viajeId, participante, monto, descripcion, fecha],
      function(err2) {
        if (err2) {
          return res.status(500).json({ error: 'Error al agregar pago' });
        }
        const pagoId = this.lastID;
        
        // Notificar a todos los clientes conectados
        if (app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'pago_agregado', { 
            id: pagoId, participante, monto, descripcion, fecha 
          });
        }
        
        res.status(201).json({ message: 'Pago registrado', id: pagoId });
      }
    );
  });
});

// Eliminar pago de un viaje
app.delete('/api/viajes/:viajeId/pagos/:pagoId', verificarToken, (req, res) => {
  const { viajeId, pagoId } = req.params;
  const usuarioId = req.userId;

  // Verificar que el usuario tenga acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }

    db.run(
      'DELETE FROM pagos WHERE id = ? AND viaje_id = ?',
      [pagoId, viajeId],
      function(err2) {
        if (err2) {
          return res.status(500).json({ error: 'Error al eliminar pago' });
        }
        
        // Notificar a todos los clientes conectados
        if (app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'pago_eliminado', { id: pagoId });
        }
        
        res.json({ message: 'Pago eliminado', deleted: this.changes > 0 });
      }
    );
  });
});

// ==================== RUTAS DE DESTINOS DE VIAJES ====================

// Obtener destinos de un viaje con información completa
app.get('/api/viajes/:id/destinos', verificarToken, (req, res) => {
  const viajeId = req.params.id;
  
  db.all(
    `SELECT d.*, vd.orden 
     FROM viaje_destinos vd 
     JOIN destinos d ON vd.destino_id = d.id 
     WHERE vd.viaje_id = ? 
     ORDER BY vd.orden ASC`,
    [viajeId],
    (err, destinos) => {
      if (err) {
        console.error('Error al obtener destinos del viaje:', err);
        return res.status(500).json({ error: 'Error al obtener destinos' });
      }
      res.json(destinos || []);
    }
  );
});

// Agregar destino a un viaje
app.post('/api/viajes/:id/destinos', verificarToken, (req, res) => {
  const viajeId = req.params.id;
  const { destinoId, orden } = req.body;
  const usuarioId = req.usuario?.id || req.userId;

  // Verificar que el usuario tenga acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }

    // Verificar si el destino ya está en el viaje
    db.get(
      'SELECT id FROM viaje_destinos WHERE viaje_id = ? AND destino_id = ?',
      [viajeId, destinoId],
      (err, existente) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar destino' });
        }
        if (existente) {
          return res.json({ message: 'Destino ya existe en el viaje', existe: true });
        }

        // Obtener el orden máximo actual si no se proporciona
        db.get(
          'SELECT MAX(orden) as maxOrden FROM viaje_destinos WHERE viaje_id = ?',
          [viajeId],
          (err2, result) => {
            if (err2) {
              return res.status(500).json({ error: 'Error al obtener orden' });
            }
            
            const nuevoOrden = orden || ((result?.maxOrden || 0) + 1);
            
            db.run(
              'INSERT INTO viaje_destinos (viaje_id, destino_id, orden) VALUES (?, ?, ?)',
              [viajeId, destinoId, nuevoOrden],
              function(err3) {
                if (err3) {
                  console.error('Error al agregar destino al viaje:', err3);
                  return res.status(500).json({ error: 'Error al agregar destino' });
                }
                
                // Notificar cambio
                if (app.notificarCambioViaje) {
                  app.notificarCambioViaje(viajeId, 'destino_agregado', { destinoId, orden: nuevoOrden });
                }
                
                res.status(201).json({ message: 'Destino agregado', id: this.lastID });
              }
            );
          }
        );
      }
    );
  });
});

// ==================== RUTAS DE ITINERARIO DE VIAJES ====================

// Obtener itinerario de un viaje
app.get('/api/viajes/:id/itinerario', verificarToken, (req, res) => {
  db.all(
    'SELECT * FROM viaje_itinerario WHERE viaje_id = ? ORDER BY dia ASC, fecha ASC',
    [req.params.id],
    (err, itinerario) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener itinerario' });
      }
      res.json(itinerario);
    }
  );
});

// Agregar actividad al itinerario de un viaje
app.post('/api/viajes/:id/itinerario', verificarToken, (req, res) => {
  const { fecha, dia, actividad, destino_id, hora, notas } = req.body;
  const viajeId = req.params.id;

  db.run(
    'INSERT INTO viaje_itinerario (viaje_id, fecha, dia, actividad, destino_id, hora, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [viajeId, fecha, dia, actividad, destino_id, hora, notas],
    function(err) {
      if (err) {
        console.error('Error al agregar itinerario:', err);
        return res.status(500).json({ error: 'Error al agregar actividad al itinerario' });
      }
      const actividadId = this.lastID;
      
      // Notificar a todos los clientes conectados
      if (app.notificarCambioViaje) {
        app.notificarCambioViaje(viajeId, 'itinerario_agregado', { 
          id: actividadId, fecha, dia, actividad, destino_id, hora, notas 
        });
      }
      
      res.status(201).json({ message: 'Actividad agregada', id: actividadId });
    }
  );
});

// Actualizar actividad del itinerario
app.put('/api/viajes/:viajeId/itinerario/:id', verificarToken, (req, res) => {
  const { fecha, dia, actividad, hora, notas, completado } = req.body;
  const viajeId = req.params.viajeId;
  const actividadId = req.params.id;

  db.run(
    'UPDATE viaje_itinerario SET fecha = ?, dia = ?, actividad = ?, hora = ?, notas = ?, completado = ? WHERE id = ? AND viaje_id = ?',
    [fecha, dia, actividad, hora, notas, completado ? 1 : 0, actividadId, viajeId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar itinerario' });
      }
      
      // Notificar a todos los clientes conectados
      if (app.notificarCambioViaje) {
        app.notificarCambioViaje(viajeId, 'itinerario_actualizado', { 
          id: actividadId, fecha, dia, actividad, hora, notas, completado 
        });
      }
      
      res.json({ message: 'Itinerario actualizado' });
    }
  );
});

// Eliminar actividad del itinerario
app.delete('/api/viajes/:viajeId/itinerario/:id', verificarToken, (req, res) => {
  db.run(
    'DELETE FROM viaje_itinerario WHERE id = ? AND viaje_id = ?',
    [req.params.id, req.params.viajeId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar actividad' });
      }
      res.json({ message: 'Actividad eliminada' });
    }
  );
});

// ==================== RUTAS DE PARTICIPANTES Y RECORDATORIOS ====================

// Obtener un viaje específico por ID (propietario o participante compartido)
app.get('/api/viajes/:id', verificarToken, (req, res) => {
  const viajeId = req.params.id;
  const usuarioId = req.userId;
  
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar acceso' });
    }
    if (!tieneAcceso) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    
    db.get('SELECT * FROM viajes WHERE id = ?', [viajeId], (err, viaje) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener viaje' });
      }
      // Agregar rol del usuario en la respuesta
      viaje.userRole = rol;
      res.json(viaje);
    });
  });
});

// Actualizar un viaje (propietario o participante compartido)
app.put('/api/viajes/:id', verificarToken, (req, res) => {
  const { nombre, icono, fecha_inicio, fecha_fin, finalizado, calificacion, resena } = req.body;
  const viajeId = req.params.id;
  const usuarioId = req.userId;
  
  // Verificar acceso al viaje
  verificarAccesoViaje(viajeId, usuarioId, (err, tieneAcceso, rol) => {
    if (err || !tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este viaje' });
    }
    
    db.run(
      'UPDATE viajes SET nombre = ?, icono = ?, fecha_inicio = ?, fecha_fin = ?, finalizado = ?, calificacion = ?, resena = ? WHERE id = ?',
      [nombre, icono, fecha_inicio, fecha_fin, finalizado ? 1 : 0, calificacion || null, resena || null, viajeId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar viaje' });
        }
        
        // Notificar a todos los clientes conectados
        if (app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'viaje_actualizado', { 
            id: viajeId, nombre, icono, fecha_inicio, fecha_fin, finalizado, calificacion, resena 
          });
        }
        
        res.json({ message: 'Viaje actualizado' });
      }
    );
  });
});

// Eliminar un viaje (solo el propietario)
app.delete('/api/viajes/:id', verificarToken, (req, res) => {
  const viajeId = req.params.id;
  const usuarioId = req.userId;
  
  console.log(`🗑️ Solicitud de eliminar viaje ${viajeId} por usuario ${usuarioId}`);
  
  // Verificar que el usuario es el propietario del viaje
  db.get('SELECT * FROM viajes WHERE id = ? AND usuario_id = ?', [viajeId, usuarioId], (err, viaje) => {
    if (err) {
      console.error('Error al verificar viaje:', err);
      return res.status(500).json({ error: 'Error al verificar viaje' });
    }
    
    if (!viaje) {
      console.log(`❌ Viaje ${viajeId} no encontrado o usuario ${usuarioId} no es propietario`);
      return res.status(404).json({ error: 'Viaje no encontrado o no tienes permiso para eliminarlo' });
    }
    
    // Eliminar el viaje (las tablas relacionadas se eliminan en cascada)
    db.run('DELETE FROM viajes WHERE id = ?', [viajeId], function(err) {
      if (err) {
        console.error('Error al eliminar viaje:', err);
        return res.status(500).json({ error: 'Error al eliminar viaje' });
      }
      
      console.log(`✅ Viaje ${viajeId} eliminado correctamente`);
      
      // Notificar a todos los clientes conectados
      if (app.notificarCambioViaje) {
        app.notificarCambioViaje(viajeId, 'viaje_eliminado', { id: viajeId });
      }
      
      res.json({ success: true, message: 'Viaje eliminado correctamente' });
    });
  });
});

// Obtener participantes de un viaje
app.get('/api/viajes/:id/participantes', verificarToken, (req, res) => {
  db.all(
    'SELECT * FROM participantes WHERE viaje_id = ?',
    [req.params.id],
    (err, participantes) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener participantes' });
      }
      res.json(participantes);
    }
  );
});

// Agregar participante a un viaje
app.post('/api/viajes/:id/participantes', verificarToken, (req, res) => {
  const { nombre, email, iniciales, color } = req.body;
  const viajeId = req.params.id;

  db.run(
    'INSERT INTO participantes (viaje_id, nombre, email, iniciales, color) VALUES (?, ?, ?, ?, ?)',
    [viajeId, nombre, email, iniciales, color],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al agregar participante' });
      }
      const participanteId = this.lastID;
      
      // Notificar a todos los clientes conectados
      if (app.notificarCambioViaje) {
        app.notificarCambioViaje(viajeId, 'participante_agregado', { 
          id: participanteId, nombre, email, iniciales, color 
        });
      }
      
      res.status(201).json({ message: 'Participante agregado', id: participanteId });
    }
  );
});

// Eliminar participante
app.delete('/api/participantes/:id', verificarToken, (req, res) => {
  // Primero obtener el viaje_id para notificar
  db.get('SELECT viaje_id FROM participantes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar participante' });
    }
    
    const viajeId = row?.viaje_id;
    
    db.run(
      'DELETE FROM participantes WHERE id = ?',
      [req.params.id],
      function(err2) {
        if (err2) {
          return res.status(500).json({ error: 'Error al eliminar participante' });
        }
        
        // Notificar a todos los clientes conectados
        if (viajeId && app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'participante_eliminado', { 
            id: req.params.id 
          });
        }
        
        res.json({ message: 'Participante eliminado' });
      }
    );
  });
});

// Obtener recordatorios de un viaje
app.get('/api/viajes/:id/recordatorios', verificarToken, (req, res) => {
  db.all(
    'SELECT * FROM recordatorios WHERE viaje_id = ? ORDER BY fecha ASC',
    [req.params.id],
    (err, recordatorios) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener recordatorios' });
      }
      res.json(recordatorios);
    }
  );
});

// Agregar recordatorio a un viaje
app.post('/api/viajes/:id/recordatorios', verificarToken, (req, res) => {
  const { titulo, descripcion, fecha } = req.body;
  const viajeId = req.params.id;

  db.run(
    'INSERT INTO recordatorios (viaje_id, titulo, descripcion, fecha) VALUES (?, ?, ?, ?)',
    [viajeId, titulo, descripcion, fecha],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al agregar recordatorio' });
      }
      const recordatorioId = this.lastID;
      
      // Notificar a todos los clientes conectados
      if (app.notificarCambioViaje) {
        app.notificarCambioViaje(viajeId, 'recordatorio_agregado', { 
          id: recordatorioId, titulo, descripcion, fecha 
        });
      }
      
      res.status(201).json({ message: 'Recordatorio agregado', id: recordatorioId });
    }
  );
});

// Actualizar recordatorio
app.put('/api/recordatorios/:id', verificarToken, (req, res) => {
  const { titulo, descripcion, fecha, completado } = req.body;
  const recordatorioId = req.params.id;
  
  // Primero obtener el viaje_id
  db.get('SELECT viaje_id FROM recordatorios WHERE id = ?', [recordatorioId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar recordatorio' });
    }
    
    const viajeId = row?.viaje_id;

    db.run(
      'UPDATE recordatorios SET titulo = COALESCE(?, titulo), descripcion = COALESCE(?, descripcion), fecha = COALESCE(?, fecha), completado = COALESCE(?, completado) WHERE id = ?',
      [titulo, descripcion, fecha, completado ? 1 : 0, recordatorioId],
      function(err2) {
        if (err2) {
          return res.status(500).json({ error: 'Error al actualizar recordatorio' });
        }
        
        // Notificar a todos los clientes conectados
        if (viajeId && app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'recordatorio_actualizado', { 
            id: recordatorioId, titulo, descripcion, fecha, completado 
          });
        }
        
        res.json({ message: 'Recordatorio actualizado' });
      }
    );
  });
});

// Eliminar recordatorio
app.delete('/api/recordatorios/:id', verificarToken, (req, res) => {
  const recordatorioId = req.params.id;
  
  // Primero obtener el viaje_id
  db.get('SELECT viaje_id FROM recordatorios WHERE id = ?', [recordatorioId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar recordatorio' });
    }
    
    const viajeId = row?.viaje_id;
    
    db.run(
      'DELETE FROM recordatorios WHERE id = ?',
      [recordatorioId],
      function(err2) {
        if (err2) {
          return res.status(500).json({ error: 'Error al eliminar recordatorio' });
        }
        
        // Notificar a todos los clientes conectados
        if (viajeId && app.notificarCambioViaje) {
          app.notificarCambioViaje(viajeId, 'recordatorio_eliminado', { 
            id: recordatorioId 
          });
        }
        
        res.json({ message: 'Recordatorio eliminado' });
      }
    );
  });
});

// ==================== RUTAS DE ENCUESTAS ====================

// Obtener todas las encuestas del usuario
app.get('/api/encuestas', verificarToken, (req, res) => {
  db.all(
    'SELECT * FROM encuestas WHERE usuario_id = ? ORDER BY creada_en DESC',
    [req.userId],
    (err, encuestas) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener encuestas' });
      }
      res.json(encuestas);
    }
  );
});

// Obtener una encuesta por ID
app.get('/api/encuestas/:id', verificarToken, (req, res) => {
  db.get(
    'SELECT * FROM encuestas WHERE id = ? AND usuario_id = ?',
    [req.params.id, req.userId],
    (err, encuesta) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener encuesta' });
      }
      if (!encuesta) {
        return res.status(404).json({ error: 'Encuesta no encontrada' });
      }
      res.json(encuesta);
    }
  );
});

// Crear nueva encuesta
app.post('/api/encuestas', verificarToken, (req, res) => {
  const { titulo, descripcion, tipo, preguntas } = req.body;
  
  if (!titulo || !preguntas) {
    return res.status(400).json({ error: 'Título y preguntas son requeridos' });
  }

  const preguntasJSON = typeof preguntas === 'string' ? preguntas : JSON.stringify(preguntas);

  db.run(
    'INSERT INTO encuestas (usuario_id, titulo, descripcion, tipo, preguntas) VALUES (?, ?, ?, ?, ?)',
    [req.userId, titulo, descripcion || null, tipo || 'preferencias', preguntasJSON],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al crear encuesta' });
      }
      res.status(201).json({ 
        message: 'Encuesta creada exitosamente',
        id: this.lastID
      });
    }
  );
});

// Actualizar encuesta
app.put('/api/encuestas/:id', verificarToken, (req, res) => {
  const { titulo, descripcion, respuestas } = req.body;
  
  db.run(
    'UPDATE encuestas SET titulo = ?, descripcion = ?, respuestas = ?, actualizada_en = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?',
    [titulo, descripcion, respuestas, req.params.id, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar encuesta' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Encuesta no encontrada' });
      }
      res.json({ message: 'Encuesta actualizada correctamente' });
    }
  );
});

// Eliminar encuesta
app.delete('/api/encuestas/:id', verificarToken, (req, res) => {
  db.run(
    'DELETE FROM encuestas WHERE id = ? AND usuario_id = ?',
    [req.params.id, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar encuesta' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Encuesta no encontrada' });
      }
      res.json({ message: 'Encuesta eliminada correctamente' });
    }
  );
});

// ==================== RUTAS ALTERNATIVAS DE USUARIOS ====================

// Alias: Registro con ruta /api/usuarios/registro
app.post('/api/usuarios/registro', asyncHandler(async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, message: 'El email ya está registrado' });
          }
          return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
        }

        const usuario = { id: this.lastID, nombre, email };
        res.status(201).json({
          success: true,
          message: 'Usuario registrado exitosamente',
          data: usuario
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
}));

// Alias: Login con ruta /api/usuarios/login
app.post('/api/usuarios/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y password son requeridos' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al buscar usuario' });
    }

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Revisar verificación de email
    if (usuario.email_verified === 0 || usuario.email_verified === null) {
      return res.status(403).json({ success: false, code: 'email_not_verified', message: 'Email no verificado' });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  });
});

// Obtener usuario por ID
app.get('/api/usuarios/:id', verificarToken, (req, res) => {
  db.get('SELECT id, nombre, email, avatar, created_at FROM usuarios WHERE id = ?', [req.params.id], (err, usuario) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener usuario' });
    }
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({
      success: true,
      data: usuario
    });
  });
});

// Actualizar usuario (nombre, avatar)
app.put('/api/usuarios/:id', verificarToken, asyncHandler(async (req, res) => {
  const { nombre, avatar } = req.body;
  const userId = req.params.id;
  
  // Verificar que el usuario que hace la petición es el mismo que se quiere actualizar
  if (req.user && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ success: false, message: 'No autorizado para modificar este usuario' });
  }
  
  db.run(
    'UPDATE usuarios SET nombre = ?, avatar = ? WHERE id = ?',
    [nombre, avatar, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      res.json({
        success: true,
        message: 'Usuario actualizado correctamente'
      });
    }
  );
}));

// Cambiar contraseña del usuario
app.put('/api/usuarios/:id/password', verificarToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.params.id;
  
  // Verificar que el usuario que hace la petición es el mismo
  if (req.user && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ success: false, message: 'No autorizado para modificar este usuario' });
  }
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }
  
  try {
    // Obtener usuario actual
    db.get('SELECT * FROM usuarios WHERE id = ?', [userId], async (err, user) => {
      if (err || !user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValida) {
        return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
      
      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Actualizar contraseña
      db.run(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error al cambiar contraseña' });
          }
          res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
          });
        }
      );
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}));

// Actualizar perfil completo (nombre, email) - sin autenticación estricta para simplificar
app.put('/api/usuarios/perfil/:email', asyncHandler(async (req, res) => {
  const { nombre, nuevoEmail } = req.body;
  const emailActual = decodeURIComponent(req.params.email);
  
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ success: false, message: 'El nombre es requerido' });
  }
  
  // Verificar si el nuevo email ya existe (si se está cambiando)
  if (nuevoEmail && nuevoEmail !== emailActual) {
    db.get('SELECT id FROM usuarios WHERE email = ?', [nuevoEmail], (err, existingUser) => {
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'El email ya está en uso por otro usuario' });
      }
      
      // Actualizar con nuevo email
      db.run(
        'UPDATE usuarios SET nombre = ?, email = ? WHERE email = ?',
        [nombre.trim(), nuevoEmail, emailActual],
        function(err) {
          if (err) {
            console.error('Error al actualizar perfil:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
          }
          res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: { nombre: nombre.trim(), email: nuevoEmail }
          });
        }
      );
    });
  } else {
    // Solo actualizar nombre
    db.run(
      'UPDATE usuarios SET nombre = ? WHERE email = ?',
      [nombre.trim(), emailActual],
      function(err) {
        if (err) {
          console.error('Error al actualizar perfil:', err);
          return res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({
          success: true,
          message: 'Perfil actualizado correctamente',
          data: { nombre: nombre.trim(), email: emailActual }
        });
      }
    );
  }
}));

// Cambiar contraseña por email (sin token, verificando contraseña actual)
app.put('/api/usuarios/cambiar-password/:email', asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const email = decodeURIComponent(req.params.email);
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }
  
  try {
    db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
      if (err || !user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValida) {
        return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
      
      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Actualizar contraseña
      db.run(
        'UPDATE usuarios SET password = ? WHERE email = ?',
        [hashedPassword, email],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error al cambiar contraseña' });
          }
          res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
          });
        }
      );
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}));

// ==================== RUTAS ADICIONALES DE ENCUESTAS ====================

// Obtener encuestas de un usuario específico
app.get('/api/encuestas/usuario/:usuarioId', (req, res) => {
  db.all(
    'SELECT * FROM encuestas WHERE usuario_id = ? ORDER BY creada_en DESC',
    [req.params.usuarioId],
    (err, encuestas) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error al obtener encuestas' });
      }
      res.json({
        success: true,
        count: encuestas?.length || 0,
        data: encuestas || []
      });
    }
  );
});

// ==================== ENVIAR INVITACIÓN DE VIAJE POR EMAIL ====================

app.post('/api/viajes/invitar-email', asyncHandler(async (req, res) => {
  const { email, tripName, invitationLink, senderName } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email destinatario requerido' });
  }

  if (!invitationLink) {
    return res.status(400).json({ error: 'Link de invitación requerido' });
  }

  const nombreViaje = tripName || 'un viaje';
  const remitente = senderName || 'Un amigo';

  try {
    const result = await emailService.sendTripInvitationEmail(
      email,
      invitationLink,
      nombreViaje,
      remitente
    );

    res.json({
      success: true,
      message: result.simulated 
        ? 'Invitación simulada (configura email en .env para envío real)' 
        : 'Invitación enviada exitosamente',
      simulated: result.simulated,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error al enviar invitación:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// ==================== RUTAS DE PRUEBA ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Verificar configuración de email
app.get('/api/email/test', asyncHandler(async (req, res) => {
  const isConfigured = emailService.isConfigured;
  
  if (!isConfigured) {
    return res.json({
      configured: false,
      message: 'Email no configurado. Configura EMAIL_USER y EMAIL_PASSWORD en el archivo .env',
      instructions: [
        '1. Abre el archivo .env en la carpeta travelpin-backend',
        '2. Configura EMAIL_USER con tu correo (ej: tucorreo@gmail.com)',
        '3. Para Gmail, genera una contraseña de aplicación en: https://myaccount.google.com/apppasswords',
        '4. Configura EMAIL_PASSWORD con la contraseña de aplicación',
        '5. Reinicia el servidor'
      ]
    });
  }

  try {
    const verification = await emailService.verifyConnection();
    res.json({
      configured: true,
      connected: verification.success,
      message: verification.success ? 'Email configurado y conectado correctamente' : 'Email configurado pero hay un error de conexión',
      error: verification.error || null
    });
  } catch (error) {
    res.json({
      configured: true,
      connected: false,
      message: 'Error al verificar conexión',
      error: error.message
    });
  }
}));

// Enviar email de prueba
app.post('/api/email/test-send', asyncHandler(async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Email destinatario requerido' });
  }

  const emailSubject = subject || '✈️ Invitación - TravelPlus';
  const emailHtml = html || `
        <h1>¡Has recibido una invitación!</h1>
        <p>Has sido invitado a un viaje en TravelPlus.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `;

  try {
    const result = await emailService.sendEmail(to, emailSubject, emailHtml);

    res.json({
      success: true,
      message: result.simulated ? 'Email simulado (revisa los logs)' : 'Email enviado exitosamente',
      simulated: result.simulated,
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// ==================== ENDPOINTS DE INVITACIONES ====================

// POST - Unirse a un viaje usando código de invitación
app.post('/api/viajes/unirse', verificarToken, asyncHandler(async (req, res) => {
  const { codigo } = req.body;
  const usuarioId = req.userId;
  
  if (!codigo) {
    return res.status(400).json({ error: 'Código de invitación requerido' });
  }

  try {
    // Buscar la invitación
    const invitacion = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM invitaciones WHERE codigo = ?', [codigo], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!invitacion) {
      return res.status(404).json({ error: 'Invitación no encontrada o expirada' });
    }
    
    const viajeId = invitacion.viaje_id;
    
    // Verificar que el viaje existe
    const viaje = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM viajes WHERE id = ?', [viajeId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!viaje) {
      return res.status(404).json({ error: 'El viaje ya no existe' });
    }
    
    // Verificar si el usuario ya es dueño del viaje
    if (viaje.usuario_id === usuarioId) {
      return res.status(400).json({ error: 'Ya eres el dueño de este viaje' });
    }
    
    // Verificar si ya está unido
    const yaUnido = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM viajes_compartidos WHERE viaje_id = ? AND usuario_id = ?', [viajeId, usuarioId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (yaUnido) {
      return res.json({ message: 'Ya estás unido a este viaje', viajeId, viaje });
    }
    
    // Obtener datos del usuario para agregarlo como participante
    const usuario = await new Promise((resolve, reject) => {
      db.get('SELECT nombre, email FROM usuarios WHERE id = ?', [usuarioId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Agregar al usuario a viajes_compartidos
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO viajes_compartidos (viaje_id, usuario_id, rol) VALUES (?, ?, ?)', 
        [viajeId, usuarioId, 'participante'], 
        (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    // También agregar como participante visible en el viaje
    const nombreParticipante = usuario?.nombre || 'Usuario';
    const inicialesParticipante = nombreParticipante.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const colorParticipante = colores[Math.floor(Math.random() * colores.length)];
    
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO participantes (viaje_id, nombre, email, iniciales, color) VALUES (?, ?, ?, ?, ?)',
        [viajeId, nombreParticipante, usuario?.email || '', inicialesParticipante, colorParticipante],
        (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    console.log(`✅ Usuario ${usuarioId} se unió al viaje ${viajeId}`);
    
    // Obtener destinos del viaje para enviar datos completos
    const destinos = await new Promise((resolve, reject) => {
      db.all('SELECT destino_id FROM viaje_destinos WHERE viaje_id = ? ORDER BY orden', [viajeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows ? rows.map(r => r.destino_id) : []);
      });
    });
    
    res.json({ 
      success: true, 
      message: '¡Te has unido al viaje exitosamente!', 
      viajeId,
      viaje: {
        id: viaje.id,
        nombre: viaje.nombre,
        icono: viaje.icono || '✈️',
        fecha_inicio: viaje.fecha_inicio,
        fecha_fin: viaje.fecha_fin,
        destinos: destinos
      }
    });
    
  } catch (error) {
    console.error('Error al unirse al viaje:', error);
    res.status(500).json({ error: 'Error al unirse al viaje' });
  }
}));

// POST - Crear invitación para compartir viaje
app.post('/api/invitaciones', (req, res) => {
  const { codigo, viajeId } = req.body;
  
  if (!codigo || !viajeId) {
    return res.status(400).json({ error: 'Código y viajeId son requeridos' });
  }

  const sql = `INSERT INTO invitaciones (codigo, viaje_id, fecha_creacion) VALUES (?, ?, ?)`;
  
  db.run(sql, [codigo, viajeId, Date.now()], function(err) {
    if (err) {
      // Si ya existe el código, actualizamos
      if (err.message.includes('UNIQUE constraint')) {
        return res.json({ id: 0, codigo, viajeId, message: 'Invitación ya existe' });
      }
      console.error('Error al crear invitación:', err);
      return res.status(500).json({ error: 'Error al crear invitación' });
    }
    
    console.log('✅ Invitación creada:', codigo, 'para viaje:', viajeId);
    res.status(201).json({ id: this.lastID, codigo, viajeId });
  });
});

// GET - Validar y obtener información de una invitación
app.get('/api/invitaciones/:codigo', (req, res) => {
  const { codigo } = req.params;
  
  const sqlInvitacion = `SELECT * FROM invitaciones WHERE codigo = ?`;
  
  db.get(sqlInvitacion, [codigo], (err, invitacion) => {
    if (err) {
      console.error('Error al buscar invitación:', err);
      return res.status(500).json({ error: 'Error al validar invitación' });
    }
    
    if (!invitacion) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }
    
    // Obtener información del viaje
    const sqlViaje = `SELECT * FROM viajes WHERE id = ?`;
    
    db.get(sqlViaje, [invitacion.viaje_id], (err2, viaje) => {
      if (err2) {
        console.error('Error al obtener viaje:', err2);
        return res.json({ invitacion, viaje: null });
      }
      
      console.log('✅ Invitación validada:', codigo);
      res.json({ invitacion, viaje });
    });
  });
});

// ==================== SINCRONIZACIÓN EN TIEMPO REAL (SSE) ====================

// Almacén de clientes conectados por viaje
const viajeClientes = new Map(); // Map<viajeId, Set<res>>

// Endpoint SSE para escuchar cambios en un viaje
app.get('/api/viajes/:id/sync', verificarToken, (req, res) => {
  const viajeId = req.params.id;
  const userId = req.userId;
  
  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  
  // Agregar cliente a la lista del viaje
  if (!viajeClientes.has(viajeId)) {
    viajeClientes.set(viajeId, new Set());
  }
  viajeClientes.get(viajeId).add(res);
  
  console.log(`🔄 Cliente conectado para sincronización del viaje ${viajeId}. Total: ${viajeClientes.get(viajeId).size}`);
  
  // Enviar evento inicial de conexión
  res.write(`data: ${JSON.stringify({ type: 'connected', viajeId, userId })}\n\n`);
  
  // Ping cada 30 segundos para mantener la conexión viva
  const pingInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
  }, 30000);
  
  // Cuando el cliente se desconecta
  req.on('close', () => {
    clearInterval(pingInterval);
    if (viajeClientes.has(viajeId)) {
      viajeClientes.get(viajeId).delete(res);
      if (viajeClientes.get(viajeId).size === 0) {
        viajeClientes.delete(viajeId);
      }
    }
    console.log(`🔌 Cliente desconectado del viaje ${viajeId}`);
  });
});

// Función para notificar cambios a todos los clientes de un viaje
function notificarCambioViaje(viajeId, tipo, datos) {
  if (!viajeClientes.has(viajeId)) return;
  
  const evento = JSON.stringify({ 
    type: tipo, 
    data: datos, 
    timestamp: Date.now() 
  });
  
  viajeClientes.get(viajeId).forEach(cliente => {
    try {
      cliente.write(`data: ${evento}\n\n`);
    } catch (e) {
      console.error('Error enviando evento SSE:', e.message);
    }
  });
  
  console.log(`📡 Notificación enviada: ${tipo} para viaje ${viajeId}`);
}

// Exponer función para usarla en otros endpoints
app.notificarCambioViaje = notificarCambioViaje;

// ==================== INICIAR SERVIDOR ====================

// Manejar cierre graceful
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    } else {
      console.log('Base de datos cerrada correctamente');
    }
    process.exit(0);
  });
});

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error.message);
  console.error(error.stack);
  db.close((err) => {
    if (err) console.error('Error al cerrar BD:', err);
    process.exit(1);
  });
});
