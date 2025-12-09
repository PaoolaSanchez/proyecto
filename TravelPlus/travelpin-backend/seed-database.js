// seed-database.js - Inicializa la BD con datos si está vacía
const sqlite3 = require('sqlite3').verbose();

// Usar la misma ruta de BD que el servidor
const dbPath = process.env.DATABASE_PATH || './BDTravelPin.db';
let db;

// Solo crear conexión si no se proporciona una
function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

// Datos de seed - se ejecutan solo si la BD está vacía
const seedData = {
  destinos: [
    { id: 1, nombre: 'París', pais: 'Francia', imagen_principal: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200', descripcion: 'La Ciudad de la Luz, famosa por la Torre Eiffel, el Louvre y su gastronomía.' },
    { id: 2, nombre: 'Tokio', pais: 'Japón', imagen_principal: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200', descripcion: 'Metrópoli vibrante que combina tradición ancestral con tecnología de vanguardia.' },
    { id: 3, nombre: 'Nueva York', pais: 'Estados Unidos', imagen_principal: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200', descripcion: 'La ciudad que nunca duerme, con Times Square, Central Park y la Estatua de la Libertad.' },
    { id: 4, nombre: 'Roma', pais: 'Italia', imagen_principal: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200', descripcion: 'La Ciudad Eterna, con el Coliseo, el Vaticano y una historia milenaria.' },
    { id: 5, nombre: 'Barcelona', pais: 'España', imagen_principal: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200', descripcion: 'Ciudad mediterránea con la arquitectura de Gaudí y hermosas playas.' },
    { id: 29, nombre: 'Cancún', pais: 'México', imagen_principal: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200', descripcion: 'Paraíso caribeño con playas de arena blanca y ruinas mayas cercanas.' },
    { id: 30, nombre: 'Riviera Maya', pais: 'México', imagen_principal: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200', descripcion: 'Costa caribeña con cenotes, ruinas de Tulum y resorts de lujo.' },
    { id: 31, nombre: 'Los Cabos', pais: 'México', imagen_principal: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200', descripcion: 'Destino de playa de lujo donde el desierto se encuentra con el mar.' },
    { id: 32, nombre: 'Puerto Vallarta', pais: 'México', imagen_principal: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=1200', descripcion: 'Encantadora ciudad costera con malecón, playas y vida nocturna.' },
    { id: 33, nombre: 'Ciudad de México', pais: 'México', imagen_principal: 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=1200', descripcion: 'Capital vibrante con historia azteca, museos de clase mundial y gastronomía.' }
  ],
  agencias: [
    { id: 16, nombre: 'Viajes Paradiso', logo: '🌴', email: 'paradiso@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', contacto: '555-0001', descripcion: 'Especialistas en viajes de lujo y experiencias únicas. Más de 20 años creando memorias inolvidables.' },
    { id: 17, nombre: 'TurMex Adventures', logo: '🦅', email: 'turmex@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', contacto: '555-0002', descripcion: 'Aventuras por todo México con guías expertos y rutas exclusivas.' },
    { id: 18, nombre: 'Sol y Playa Tours', logo: '☀️', email: 'solplaya@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', contacto: '555-0003', descripcion: 'Los mejores destinos de playa en México y el Caribe.' },
    { id: 19, nombre: 'Mundo Azteca', logo: '🏛️', email: 'azteca@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', contacto: '555-0004', descripcion: 'Viajes culturales y arqueológicos por las raíces de México.' },
    { id: 20, nombre: 'Destinos Mágicos', logo: '✨', email: 'magicos@viajes.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', contacto: '555-0005', descripcion: 'Pueblos mágicos y experiencias auténticas mexicanas.' }
  ],
  paquetes: [
    { 
      id: 7, agencia_id: 16, nombre: 'Cancún Premium All-Inclusive', precio: 25000, duracion: '5 días / 4 noches',
      incluye: JSON.stringify(['Vuelo redondo', 'Hotel 5 estrellas', 'Todo incluido', 'Traslados', 'Tour a Chichén Itzá']),
      itinerario: JSON.stringify([
        { dia: 1, actividades: 'Llegada y check-in en hotel. Cena de bienvenida.' },
        { dia: 2, actividades: 'Día libre en playa. Actividades acuáticas opcionales.' },
        { dia: 3, actividades: 'Excursión a Chichén Itzá y cenote sagrado.' },
        { dia: 4, actividades: 'Snorkel en arrecife. Tarde libre para compras.' },
        { dia: 5, actividades: 'Check-out y traslado al aeropuerto.' }
      ]),
      gastos: JSON.stringify([
        { concepto: 'Vuelo redondo', monto: 8000 },
        { concepto: 'Hotel 4 noches', monto: 12000 },
        { concepto: 'Tour Chichén Itzá', monto: 2500 },
        { concepto: 'Snorkel', monto: 1500 },
        { concepto: 'Traslados', monto: 1000 }
      ])
    },
    { 
      id: 8, agencia_id: 17, nombre: 'Aventura Riviera Maya', precio: 18000, duracion: '4 días / 3 noches',
      incluye: JSON.stringify(['Vuelo redondo', 'Hotel 4 estrellas', 'Desayunos', 'Tour Tulum', 'Nado con tortugas']),
      itinerario: JSON.stringify([
        { dia: 1, actividades: 'Llegada a Cancún, traslado a Playa del Carmen.' },
        { dia: 2, actividades: 'Ruinas de Tulum y playa. Nado con tortugas en Akumal.' },
        { dia: 3, actividades: 'Cenote y parque Xcaret o Xel-Há.' },
        { dia: 4, actividades: 'Mañana libre. Traslado al aeropuerto.' }
      ]),
      gastos: JSON.stringify([
        { concepto: 'Vuelo redondo', monto: 6000 },
        { concepto: 'Hotel 3 noches', monto: 7500 },
        { concepto: 'Tour Tulum', monto: 2000 },
        { concepto: 'Xcaret', monto: 2000 },
        { concepto: 'Traslados', monto: 500 }
      ])
    },
    { 
      id: 9, agencia_id: 18, nombre: 'Los Cabos Luxury', precio: 35000, duracion: '6 días / 5 noches',
      incluye: JSON.stringify(['Vuelo redondo', 'Resort 5 estrellas', 'Todo incluido', 'Paseo en yate', 'Spa']),
      itinerario: JSON.stringify([
        { dia: 1, actividades: 'Llegada y check-in en resort de lujo.' },
        { dia: 2, actividades: 'Día de spa y relajación.' },
        { dia: 3, actividades: 'Paseo en yate al Arco de Cabo San Lucas.' },
        { dia: 4, actividades: 'Tour gastronómico y cata de vinos.' },
        { dia: 5, actividades: 'Avistamiento de ballenas (temporada) o golf.' },
        { dia: 6, actividades: 'Check-out y traslado.' }
      ]),
      gastos: JSON.stringify([
        { concepto: 'Vuelo redondo', monto: 10000 },
        { concepto: 'Resort 5 noches', monto: 18000 },
        { concepto: 'Paseo en yate', monto: 3500 },
        { concepto: 'Spa', monto: 2000 },
        { concepto: 'Traslados', monto: 1500 }
      ])
    },
    { 
      id: 10, agencia_id: 19, nombre: 'CDMX Cultural', precio: 12000, duracion: '4 días / 3 noches',
      incluye: JSON.stringify(['Hotel céntrico', 'Desayunos', 'Tour Teotihuacán', 'Museo de Antropología', 'Xochimilco']),
      itinerario: JSON.stringify([
        { dia: 1, actividades: 'Llegada. Tour por Centro Histórico y Zócalo.' },
        { dia: 2, actividades: 'Pirámides de Teotihuacán y Basílica de Guadalupe.' },
        { dia: 3, actividades: 'Museo de Antropología, Chapultepec, Coyoacán.' },
        { dia: 4, actividades: 'Xochimilco. Tarde libre. Partida.' }
      ]),
      gastos: JSON.stringify([
        { concepto: 'Hotel 3 noches', monto: 6000 },
        { concepto: 'Tour Teotihuacán', monto: 2500 },
        { concepto: 'Xochimilco', monto: 1500 },
        { concepto: 'Entradas museos', monto: 1000 },
        { concepto: 'Transporte', monto: 1000 }
      ])
    },
    { 
      id: 11, agencia_id: 20, nombre: 'Puerto Vallarta Romántico', precio: 22000, duracion: '5 días / 4 noches',
      incluye: JSON.stringify(['Vuelo redondo', 'Hotel boutique', 'Cena romántica', 'Crucero al atardecer', 'Tour Islas Marietas']),
      itinerario: JSON.stringify([
        { dia: 1, actividades: 'Llegada. Paseo por el Malecón al atardecer.' },
        { dia: 2, actividades: 'Playa y zona romántica. Cena con vista al mar.' },
        { dia: 3, actividades: 'Tour a Islas Marietas y Playa del Amor.' },
        { dia: 4, actividades: 'Crucero al atardecer con cena.' },
        { dia: 5, actividades: 'Mañana libre. Regreso.' }
      ]),
      gastos: JSON.stringify([
        { concepto: 'Vuelo redondo', monto: 7000 },
        { concepto: 'Hotel 4 noches', monto: 9000 },
        { concepto: 'Islas Marietas', monto: 3000 },
        { concepto: 'Crucero', monto: 2500 },
        { concepto: 'Cena romántica', monto: 500 }
      ])
    }
  ],
  paquete_destinos: [
    { paquete_id: 7, destino_id: 29 },
    { paquete_id: 8, destino_id: 30 },
    { paquete_id: 9, destino_id: 31 },
    { paquete_id: 10, destino_id: 33 },
    { paquete_id: 11, destino_id: 32 }
  ],
  usuarios: [
    { id: 1, nombre: 'Demo User', email: 'demo@travelpin.com', password: '$2b$10$Th76h1Vvqrd3fnM5xPFW7e6LpRQZpjqbaumN60euGOAAEzAP5RcHi', avatar: '👤', email_verified: 1 }
  ]
};

async function seedDatabase() {
  const database = getDb();
  return new Promise((resolve, reject) => {
    // Verificar si ya hay destinos
    database.get('SELECT COUNT(*) as count FROM destinos', async (err, row) => {
      if (err) {
        console.log('⚠️ Error verificando destinos, intentando crear datos...');
      }
      
      if (row && row.count > 0) {
        console.log(`✅ Base de datos ya tiene ${row.count} destinos, saltando seed.`);
        resolve();
        return;
      }

      console.log('🌱 Iniciando seed de base de datos...');

      try {
        // Insertar destinos
        for (const destino of seedData.destinos) {
          await runQuery(database,
            'INSERT OR IGNORE INTO destinos (id, nombre, pais, imagen_principal, descripcion) VALUES (?, ?, ?, ?, ?)',
            [destino.id, destino.nombre, destino.pais, destino.imagen_principal, destino.descripcion]
          );
        }
        console.log(`✅ ${seedData.destinos.length} destinos insertados`);

        // Insertar agencias
        for (const agencia of seedData.agencias) {
          await runQuery(database,
            'INSERT OR IGNORE INTO agencias (id, nombre, logo, email, password, contacto, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [agencia.id, agencia.nombre, agencia.logo, agencia.email, agencia.password, agencia.contacto, agencia.descripcion]
          );
        }
        console.log(`✅ ${seedData.agencias.length} agencias insertadas (password: password123)`);

        // Insertar paquetes
        for (const paquete of seedData.paquetes) {
          await runQuery(database,
            'INSERT OR IGNORE INTO paquetes (id, agencia_id, nombre, precio, duracion, incluye, itinerario, gastos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [paquete.id, paquete.agencia_id, paquete.nombre, paquete.precio, paquete.duracion, paquete.incluye, paquete.itinerario, paquete.gastos]
          );
        }
        console.log(`✅ ${seedData.paquetes.length} paquetes insertados`);

        // Insertar paquete_destinos
        for (const pd of seedData.paquete_destinos) {
          await runQuery(database,
            'INSERT OR IGNORE INTO paquete_destinos (paquete_id, destino_id) VALUES (?, ?)',
            [pd.paquete_id, pd.destino_id]
          );
        }
        console.log(`✅ ${seedData.paquete_destinos.length} relaciones paquete-destino insertadas`);

        // Insertar usuario demo
        for (const usuario of seedData.usuarios) {
          await runQuery(database,
            'INSERT OR IGNORE INTO usuarios (id, nombre, email, password, avatar, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
            [usuario.id, usuario.nombre, usuario.email, usuario.password, usuario.avatar, usuario.email_verified]
          );
        }
        console.log(`✅ Usuario demo creado (demo@travelpin.com / password123)`);

        console.log('🎉 Seed completado exitosamente!');
        resolve();
      } catch (error) {
        console.error('❌ Error en seed:', error);
        reject(error);
      }
    });
  });
}

function runQuery(database, sql, params) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

module.exports = { seedDatabase };

// Si se ejecuta directamente
if (require.main === module) {
  const database = getDb();
  seedDatabase().then(() => {
    console.log('Seed ejecutado');
    database.close();
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    database.close();
    process.exit(1);
  });
}
