import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import Database from 'better-sqlite3';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// ========== CONFIGURACIÓN PARA PRODUCCIÓN ==========
const isProduction = process.env['NODE_ENV'] === 'production';

// Configurar base de datos SQLite
// En producción usa el path de la variable de entorno, en desarrollo usa el local
const dbPath = process.env['DB_PATH'] || join(process.cwd(), 'travelpin-backend', 'BDTravelPin.db');
const dbDir = join(dbPath, '..');

// Crear directorio si no existe
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log('📁 Directorio de base de datos creado:', dbDir);
}

const db = new Database(dbPath);

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

console.log('✅ Base de datos conectada:', dbPath);

// Crear TODAS las tablas si no existen
try {
  // Tabla de usuarios
  db.prepare(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      email_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Tabla de destinos
  db.prepare(`
    CREATE TABLE IF NOT EXISTS destinos (
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
      imagenes_galeria TEXT,
      que_hacer TEXT,
      consejos TEXT,
      que_llevar TEXT,
      emergencias TEXT,
      latitud REAL,
      longitud REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Tabla de favoritos
  db.prepare(`
    CREATE TABLE IF NOT EXISTS favoritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE,
      UNIQUE(usuario_id, destino_id)
    )
  `).run();

  // Tabla de viajes
  db.prepare(`
    CREATE TABLE IF NOT EXISTS viajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      icono TEXT DEFAULT '✈️',
      fecha_inicio TEXT,
      fecha_fin TEXT,
      finalizado BOOLEAN DEFAULT 0,
      calificacion INTEGER DEFAULT NULL,
      resena TEXT DEFAULT NULL,
      agencia_id INTEGER,
      agencia_nombre TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `).run();

  // Migración: agregar columnas calificacion y resena si no existen
  try {
    db.prepare(`ALTER TABLE viajes ADD COLUMN calificacion INTEGER DEFAULT NULL`).run();
  } catch (e) {
    // Columna ya existe
  }
  try {
    db.prepare(`ALTER TABLE viajes ADD COLUMN resena TEXT DEFAULT NULL`).run();
  } catch (e) {
    // Columna ya existe
  }

  // Tabla de viaje_destinos
  db.prepare(`
    CREATE TABLE IF NOT EXISTS viaje_destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE
    )
  `).run();

  // Tabla de gastos
  db.prepare(`
    CREATE TABLE IF NOT EXISTS gastos (
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
    )
  `).run();

  // Tabla de pagos
  db.prepare(`
    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      participante TEXT NOT NULL,
      monto REAL NOT NULL,
      descripcion TEXT,
      fecha TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )
  `).run();

  // Tabla de participantes
  db.prepare(`
    CREATE TABLE IF NOT EXISTS participantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      usuario_id TEXT,
      nombre TEXT NOT NULL,
      email TEXT,
      iniciales TEXT,
      color TEXT,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )
  `).run();

  // Agregar columna usuario_id si no existe (para bases de datos existentes)
  try {
    db.prepare(`ALTER TABLE participantes ADD COLUMN usuario_id TEXT`).run();
  } catch (e) {
    // La columna ya existe, ignorar el error
  }

  // Tabla de encuestas
  db.prepare(`
    CREATE TABLE IF NOT EXISTS encuestas (
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
    )
  `).run();

  // Tabla de agencias
  db.prepare(`
    CREATE TABLE IF NOT EXISTS agencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      descripcion TEXT,
      logo TEXT,
      contacto TEXT,
      sitio_web TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Tabla de paquetes
  db.prepare(`
    CREATE TABLE IF NOT EXISTS paquetes (
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
    )
  `).run();

  // Tabla de paquete_destinos
  db.prepare(`
    CREATE TABLE IF NOT EXISTS paquete_destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paquete_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (paquete_id) REFERENCES paquetes(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE
    )
  `).run();

  // Tabla de invitaciones
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invitaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      viaje_id INTEGER NOT NULL,
      fecha_creacion INTEGER NOT NULL,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )
  `).run();
  
  // Tabla de recordatorios
  db.prepare(`
    CREATE TABLE IF NOT EXISTS recordatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      viaje_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha TEXT NOT NULL,
      completado INTEGER DEFAULT 0,
      FOREIGN KEY (viaje_id) REFERENCES viajes(id) ON DELETE CASCADE
    )
  `).run();

  // Tabla de colecciones
  db.prepare(`
    CREATE TABLE IF NOT EXISTS colecciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      icono TEXT DEFAULT '📁',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `).run();

  // Tabla de coleccion_destinos
  db.prepare(`
    CREATE TABLE IF NOT EXISTS coleccion_destinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coleccion_id INTEGER NOT NULL,
      destino_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coleccion_id) REFERENCES colecciones(id) ON DELETE CASCADE,
      FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE CASCADE,
      UNIQUE(coleccion_id, destino_id)
    )
  `).run();

  // Tabla de verificación de email
  db.prepare(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      verified INTEGER DEFAULT 0
    )
  `).run();
  
  console.log('✅ Todas las tablas de la base de datos verificadas');
} catch (err) {
  console.warn('⚠️ Error al crear tablas:', err);
}

// Middleware
app.use(express.json());

// ==================== HEALTH CHECK PARA PRODUCCIÓN ====================
app.get('/api/health', (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const result = db.prepare('SELECT 1 as ok').get();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env['NODE_ENV'] || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed' 
    });
  }
});

// ==================== PROXY PARA AUTENTICACIÓN ====================
// Redirige peticiones de auth al backend en puerto 3000

const AUTH_BACKEND_URL = process.env['AUTH_BACKEND_URL'] || 'http://localhost:3000';

// Función helper para hacer proxy de peticiones
async function proxyToAuthBackend(req: express.Request, res: express.Response, method: string, path: string) {
  try {
    const url = `${AUTH_BACKEND_URL}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { 'Authorization': req.headers.authorization as string } : {})
      },
    };
    
    if (method !== 'GET' && req.body) {
      options.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error(`Error proxy to ${path}:`, error);
    return res.status(503).json({ error: 'Servicio de autenticación no disponible. Asegúrate de que el backend esté corriendo en puerto 3000.' });
  }
}

// Proxy de rutas de autenticación
app.post('/api/auth/login', (req, res) => proxyToAuthBackend(req, res, 'POST', '/api/auth/login'));
app.post('/api/auth/register', (req, res) => proxyToAuthBackend(req, res, 'POST', '/api/auth/register'));
app.get('/api/auth/profile', (req, res) => proxyToAuthBackend(req, res, 'GET', '/api/auth/profile'));
app.post('/api/auth/exchange-token', (req, res) => proxyToAuthBackend(req, res, 'POST', '/api/auth/exchange-token'));
app.post('/api/send-verification', (req, res) => proxyToAuthBackend(req, res, 'POST', '/api/send-verification'));
app.get('/api/verify-email', (req, res) => {
  const token = req.query['token'] as string;
  return proxyToAuthBackend(req, res, 'GET', `/api/verify-email?token=${token}`);
});

// ==================== ENDPOINTS DE DESTINOS ====================

// GET - Obtener todos los destinos
app.get('/api/destinos', (req, res) => {
  try {
    const destinos = db.prepare('SELECT * FROM destinos').all();
    
    // Parsear los campos JSON
    const destinosFormateados = destinos.map((d: any) => ({
      ...d,
      imagenes_galeria: d.imagenes_galeria ? JSON.parse(d.imagenes_galeria) : [],
      que_hacer: d.que_hacer ? JSON.parse(d.que_hacer) : [],
      consejos: d.consejos ? JSON.parse(d.consejos) : [],
      que_llevar: d.que_llevar ? JSON.parse(d.que_llevar) : [],
      emergencias: d.emergencias ? JSON.parse(d.emergencias) : {}
    }));
    
    // Devolver en el formato que espera el frontend Angular
    return res.json({
      success: true,
      count: destinosFormateados.length,
      data: destinosFormateados
    });
  } catch (error) {
    console.error('Error al obtener destinos:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener destinos' });
  }
});

// GET - Obtener un destino por ID
app.get('/api/destinos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const destino: any = db.prepare('SELECT * FROM destinos WHERE id = ?').get(id);
    
    if (destino) {
      // Parsear campos JSON
      destino.imagenes_galeria = destino.imagenes_galeria ? JSON.parse(destino.imagenes_galeria) : [];
      destino.que_hacer = destino.que_hacer ? JSON.parse(destino.que_hacer) : [];
      destino.consejos = destino.consejos ? JSON.parse(destino.consejos) : [];
      destino.que_llevar = destino.que_llevar ? JSON.parse(destino.que_llevar) : [];
      destino.emergencias = destino.emergencias ? JSON.parse(destino.emergencias) : {};
      
      // Devolver en el formato que espera el frontend Angular
      return res.json({
        success: true,
        count: 1,
        data: destino
      });
    } else {
      return res.status(404).json({ success: false, error: 'Destino no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener destino:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener destino' });
  }
});

// ==================== ENDPOINTS DE USUARIOS ====================

// GET - Obtener datos de un usuario por ID
app.get('/api/usuarios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const usuario = db.prepare('SELECT id, nombre, email, avatar FROM usuarios WHERE id = ?').get(id);
    
    if (usuario) {
      return res.json(usuario);
    } else {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// ==================== ENDPOINTS DE VIAJES ====================

// GET - Obtener todos los viajes (filtrado por usuario si se proporciona)
// Incluye viajes creados por el usuario Y viajes donde es participante
app.get('/api/viajes', (req, res) => {
  try {
    const usuarioId = req.query['usuario_id'];
    
    console.log('📋 Buscando viajes para usuario_id:', usuarioId);
    
    let viajes;
    if (usuarioId) {
      // Obtener viajes creados por el usuario O donde es participante
      // Usar CAST para manejar tanto INTEGER como TEXT
      viajes = db.prepare(`
        SELECT DISTINCT v.* FROM viajes v
        LEFT JOIN participantes p ON v.id = p.viaje_id
        WHERE CAST(v.usuario_id AS TEXT) = ? OR p.usuario_id = ?
        ORDER BY v.created_at DESC
      `).all(String(usuarioId), String(usuarioId));
      
      console.log('📋 Viajes encontrados:', viajes.length);
    } else {
      viajes = db.prepare('SELECT * FROM viajes ORDER BY created_at DESC').all();
    }
    
    // Obtener destinos de cada viaje
    const viajesConDestinos = viajes.map((viaje: any) => {
      const destinos = db.prepare(`
        SELECT d.*, vd.orden
        FROM viaje_destinos vd
        JOIN destinos d ON vd.destino_id = d.id
        WHERE vd.viaje_id = ?
        ORDER BY vd.orden
      `).all(viaje.id);
      
      return {
        ...viaje,
        destinos: destinos,
        finalizado: Boolean(viaje.finalizado)
      };
    });
    
    return res.json(viajesConDestinos);
  } catch (error) {
    console.error('Error al obtener viajes:', error);
    return res.status(500).json({ error: 'Error al obtener viajes' });
  }
});

// GET - Obtener un viaje por ID con todos sus detalles
app.get('/api/viajes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const viaje: any = db.prepare('SELECT * FROM viajes WHERE id = ?').get(id);
    
    if (!viaje) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    
    // Obtener destinos del viaje
    const destinos = db.prepare(`
      SELECT d.*, vd.orden
      FROM viaje_destinos vd
      JOIN destinos d ON vd.destino_id = d.id
      WHERE vd.viaje_id = ?
      ORDER BY vd.orden
    `).all(id);
    
    // Obtener participantes
    const participantes = db.prepare('SELECT * FROM participantes WHERE viaje_id = ?').all(id);

    // Obtener recordatorios (si la tabla no existe, devolvemos [])
    let recordatorios: any[] = [];
    try {
      recordatorios = db.prepare('SELECT * FROM recordatorios WHERE viaje_id = ?').all(id);
    } catch (err: any) {
      if (err && err.code === 'SQLITE_ERROR' && /no such table: recordatorios/.test(err.message)) {
        console.warn('Tabla recordatorios no existe, devolviendo arreglo vacío');
        recordatorios = [];
      } else {
        throw err;
      }
    }
    
    const viajeCompleto = {
      ...viaje,
      destinos: destinos.map((d: any) => d.id),
      destinosCompletos: destinos,
      participantes,
      recordatorios: recordatorios.map((r: any) => ({
        ...r,
        completado: Boolean(r.completado)
      })),
      finalizado: Boolean(viaje.finalizado)
    };
    
    return res.json(viajeCompleto);
  } catch (error) {
    console.error('Error al obtener viaje:', error);
    return res.status(500).json({ error: 'Error al obtener viaje' });
  }
});

// POST - Crear un nuevo viaje
app.post('/api/viajes', (req, res) => {
  try {
    const { nombre, icono, destinos, fechaInicio, fechaFin, agencia, usuario_id, participanteInicial } = req.body;
    
    // Obtener un usuario_id válido (el primero disponible si no se proporciona)
    let validUsuarioId = usuario_id;
    if (!validUsuarioId) {
      const primerUsuario = db.prepare('SELECT id FROM usuarios LIMIT 1').get() as { id: number } | undefined;
      validUsuarioId = primerUsuario?.id || null;
    }
    
    // Si no hay usuarios, no podemos crear el viaje (usuario_id es NOT NULL)
    if (!validUsuarioId) {
      return res.status(400).json({ error: 'No hay usuarios disponibles para crear el viaje' });
    }
    
    // Obtener datos del usuario desde la base de datos
    const usuario = db.prepare('SELECT nombre, email FROM usuarios WHERE id = ?').get(validUsuarioId) as { nombre: string; email: string } | undefined;
    
    const insert = db.prepare(`
      INSERT INTO viajes (usuario_id, nombre, icono, fecha_inicio, fecha_fin, agencia_id, agencia_nombre)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      validUsuarioId,
      nombre,
      icono || '✈️',
      fechaInicio,
      fechaFin,
      agencia?.id || null,
      agencia?.nombre || null
    );
    
    const viajeId = result.lastInsertRowid;
    
    // Insertar destinos del viaje
    if (destinos && destinos.length > 0) {
      const insertDestino = db.prepare('INSERT INTO viaje_destinos (viaje_id, destino_id, orden) VALUES (?, ?, ?)');
      destinos.forEach((destinoId: number, index: number) => {
        insertDestino.run(viajeId, destinoId, index);
      });
    }
    
    // Insertar participante inicial
    // Si se envía participanteInicial (desde formulario de reserva), usarlo
    // Si no, usar los datos del usuario de la base de datos
    const insertParticipante = db.prepare(`
      INSERT INTO participantes (viaje_id, nombre, email, iniciales, color)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    let nombreParticipante: string;
    let emailParticipante: string;
    
    if (participanteInicial && participanteInicial.nombre) {
      // Datos del formulario de reserva (para paquetes de agencia)
      nombreParticipante = participanteInicial.nombre;
      emailParticipante = participanteInicial.email || '';
    } else {
      // Datos del usuario logueado (para viajes creados manualmente)
      nombreParticipante = usuario?.nombre || 'Usuario';
      emailParticipante = usuario?.email || '';
    }
    
    const inicialesParticipante = nombreParticipante.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    const colorParticipante = '#FF6B6B';
    
    insertParticipante.run(viajeId, nombreParticipante, emailParticipante, inicialesParticipante, colorParticipante);
    
    return res.status(201).json({ id: viajeId, ...req.body });
  } catch (error) {
    console.error('Error al crear viaje:', error);
    return res.status(500).json({ error: 'Error al crear viaje' });
  }
});

// PUT - Actualizar un viaje
app.put('/api/viajes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fechaInicio, fechaFin, finalizado, calificacion, resena } = req.body;
    
    const update = db.prepare(`
      UPDATE viajes 
      SET nombre = ?, fecha_inicio = ?, fecha_fin = ?, finalizado = ?, calificacion = ?, resena = ?
      WHERE id = ?
    `);
    
    const result = update.run(nombre, fechaInicio, fechaFin, finalizado ? 1 : 0, calificacion, resena, id);
    
    if (result.changes > 0) {
      return res.json({ id, ...req.body });
    } else {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar viaje:', error);
    return res.status(500).json({ error: 'Error al actualizar viaje' });
  }
});

// DELETE - Eliminar un viaje
app.delete('/api/viajes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM viajes WHERE id = ?');
    const result = deleteStmt.run(id);
    
    if (result.changes > 0) {
      return res.json({ message: 'Viaje eliminado correctamente' });
    } else {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar viaje:', error);
    return res.status(500).json({ error: 'Error al eliminar viaje' });
  }
});

// ==================== ENDPOINTS DE PARTICIPANTES ====================

// GET - Obtener participantes de un viaje
app.get('/api/viajes/:viajeId/participantes', (req, res) => {
  try {
    const { viajeId } = req.params;
    const participantes = db.prepare('SELECT * FROM participantes WHERE viaje_id = ?').all(viajeId);
    return res.json(participantes);
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    return res.status(500).json({ error: 'Error al obtener participantes' });
  }
});

// POST - Agregar participante a un viaje
app.post('/api/viajes/:viajeId/participantes', (req, res) => {
  try {
    const { viajeId } = req.params;
    let { nombre, email, iniciales, color, usuario_id } = req.body;
    
    console.log('📝 Agregando participante al viaje:', viajeId, 'usuario_id:', usuario_id);
    
    // Verificar que el viaje exista antes de intentar insertar
    const viajeExistente = db.prepare('SELECT id FROM viajes WHERE id = ?').get(viajeId);
    if (!viajeExistente) {
      return res.status(404).json({ error: 'Viaje no encontrado. Asegúrate de usar el id correcto del viaje.' });
    }

    // Si se proporciona usuario_id, obtener datos del usuario desde la base de datos
    if (usuario_id) {
      // Convertir a número para buscar en la tabla usuarios (que usa INTEGER como id)
      const usuarioIdNum = parseInt(usuario_id, 10);
      const usuario = db.prepare('SELECT nombre, email FROM usuarios WHERE id = ?').get(usuarioIdNum) as { nombre: string; email: string } | undefined;
      console.log('👤 Usuario encontrado:', usuario);
      if (usuario) {
        nombre = usuario.nombre;
        email = usuario.email;
        iniciales = nombre.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
      }
    }

    // Verificar que el participante no esté ya en el viaje (por email o usuario_id)
    if (email) {
      const participanteExistente = db.prepare('SELECT id FROM participantes WHERE viaje_id = ? AND email = ?').get(viajeId, email);
      if (participanteExistente) {
        return res.status(400).json({ error: 'Ya estás participando en este viaje' });
      }
    }
    
    // También verificar por usuario_id
    if (usuario_id) {
      const participanteExistentePorId = db.prepare('SELECT id FROM participantes WHERE viaje_id = ? AND usuario_id = ?').get(viajeId, usuario_id);
      if (participanteExistentePorId) {
        return res.status(400).json({ error: 'Ya estás participando en este viaje' });
      }
    }

    const insert = db.prepare(`
      INSERT INTO participantes (viaje_id, usuario_id, nombre, email, iniciales, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = insert.run(viajeId, usuario_id || null, nombre, email, iniciales, color);
      return res.status(201).json({ id: result.lastInsertRowid, usuario_id, nombre, email, iniciales, color });
    } catch (err: any) {
      // Manejar errores de restricción de clave foránea u otras restricciones con mensaje claro
      if (err && err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({ error: 'No se puede agregar participante: el viaje indicado no existe (clave foránea).' });
      }
      if (err && err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: 'Error de restricción en la base de datos al agregar participante.' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error al agregar participante:', error);
    return res.status(500).json({ error: 'Error al agregar participante' });
  }
});

// DELETE - Eliminar participante
app.delete('/api/participantes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM participantes WHERE id = ?');
    const result = deleteStmt.run(id);
    
    if (result.changes > 0) {
      return res.json({ message: 'Participante eliminado' });
    } else {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    return res.status(500).json({ error: 'Error al eliminar participante' });
  }
});

// ==================== ENDPOINTS DE ITINERARIO (DESTINOS DEL VIAJE) ====================

// GET - Obtener destinos/itinerario de un viaje
app.get('/api/viajes/:viajeId/itinerario', (req, res) => {
  try {
    const { viajeId } = req.params;
    const destinos = db.prepare(`
      SELECT d.*, vd.orden, vd.id as viaje_destino_id
      FROM viaje_destinos vd
      JOIN destinos d ON vd.destino_id = d.id
      WHERE vd.viaje_id = ?
      ORDER BY vd.orden
    `).all(viajeId);
    return res.json(destinos);
  } catch (error) {
    console.error('Error al obtener itinerario:', error);
    return res.status(500).json({ error: 'Error al obtener itinerario' });
  }
});

// POST - Agregar destino al itinerario de un viaje
app.post('/api/viajes/:viajeId/itinerario', (req, res) => {
  try {
    const { viajeId } = req.params;
    const { destinoId, orden } = req.body;
    
    // Verificar que el viaje exista
    const viajeExistente = db.prepare('SELECT id FROM viajes WHERE id = ?').get(viajeId);
    if (!viajeExistente) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    
    // Verificar que el destino exista
    const destinoExistente = db.prepare('SELECT id FROM destinos WHERE id = ?').get(destinoId);
    if (!destinoExistente) {
      return res.status(404).json({ error: 'Destino no encontrado' });
    }
    
    // Obtener el orden máximo actual
    const maxOrden: any = db.prepare('SELECT MAX(orden) as max FROM viaje_destinos WHERE viaje_id = ?').get(viajeId);
    const nuevoOrden = orden ?? ((maxOrden?.max || 0) + 1);
    
    const insert = db.prepare('INSERT INTO viaje_destinos (viaje_id, destino_id, orden) VALUES (?, ?, ?)');
    const result = insert.run(viajeId, destinoId, nuevoOrden);
    
    // Obtener los datos completos del destino agregado
    const destinoAgregado = db.prepare(`
      SELECT d.*, vd.orden, vd.id as viaje_destino_id
      FROM viaje_destinos vd
      JOIN destinos d ON vd.destino_id = d.id
      WHERE vd.id = ?
    `).get(result.lastInsertRowid);
    
    return res.status(201).json(destinoAgregado);
  } catch (error) {
    console.error('Error al agregar destino al itinerario:', error);
    return res.status(500).json({ error: 'Error al agregar destino al itinerario' });
  }
});

// DELETE - Eliminar destino del itinerario de un viaje
app.delete('/api/viajes/:viajeId/itinerario/:destinoId', (req, res) => {
  try {
    const { viajeId, destinoId } = req.params;
    
    const deleteStmt = db.prepare('DELETE FROM viaje_destinos WHERE viaje_id = ? AND destino_id = ?');
    const result = deleteStmt.run(viajeId, destinoId);
    
    if (result.changes > 0) {
      return res.json({ message: 'Destino eliminado del itinerario' });
    } else {
      return res.status(404).json({ error: 'Destino no encontrado en el itinerario' });
    }
  } catch (error) {
    console.error('Error al eliminar destino del itinerario:', error);
    return res.status(500).json({ error: 'Error al eliminar destino del itinerario' });
  }
});

// PUT - Reordenar destinos del itinerario
app.put('/api/viajes/:viajeId/itinerario/reordenar', (req, res) => {
  try {
    const { viajeId } = req.params;
    const { destinos } = req.body; // Array de { destinoId, orden }
    
    const updateStmt = db.prepare('UPDATE viaje_destinos SET orden = ? WHERE viaje_id = ? AND destino_id = ?');
    
    destinos.forEach((d: { destinoId: number; orden: number }) => {
      updateStmt.run(d.orden, viajeId, d.destinoId);
    });
    
    return res.json({ message: 'Itinerario reordenado' });
  } catch (error) {
    console.error('Error al reordenar itinerario:', error);
    return res.status(500).json({ error: 'Error al reordenar itinerario' });
  }
});

// ==================== ENDPOINTS DE RECORDATORIOS ====================

// GET - Obtener recordatorios de un viaje
app.get('/api/viajes/:viajeId/recordatorios', (req, res) => {
  try {
    const { viajeId } = req.params;
    const recordatorios = db.prepare('SELECT * FROM recordatorios WHERE viaje_id = ?').all(viajeId);
    return res.json(recordatorios.map((r: any) => ({ ...r, completado: Boolean(r.completado) })));
  } catch (error: any) {
    // Si la tabla no existe, devolver arreglo vacío en lugar de 500
    if (error && error.code === 'SQLITE_ERROR' && /no such table: recordatorios/.test(error.message)) {
      console.warn('Tabla recordatorios no existe, devolviendo arreglo vacío');
      return res.json([]);
    }
    console.error('Error al obtener recordatorios:', error);
    return res.status(500).json({ error: 'Error al obtener recordatorios' });
  }
});

// POST - Crear recordatorio
app.post('/api/viajes/:viajeId/recordatorios', (req, res) => {
  try {
    const { viajeId } = req.params;
    const { titulo, descripcion, fecha } = req.body;
    
    const insert = db.prepare(`
      INSERT INTO recordatorios (viaje_id, titulo, descripcion, fecha)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insert.run(viajeId, titulo, descripcion, fecha);
    
    return res.status(201).json({ id: result.lastInsertRowid, ...req.body, completado: false });
  } catch (error) {
    console.error('Error al crear recordatorio:', error);
    return res.status(500).json({ error: 'Error al crear recordatorio' });
  }
});

// PUT - Actualizar recordatorio (toggle completado)
app.put('/api/recordatorios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { completado } = req.body;
    
    const update = db.prepare('UPDATE recordatorios SET completado = ? WHERE id = ?');
    const result = update.run(completado ? 1 : 0, id);
    
    if (result.changes > 0) {
      return res.json({ id, completado });
    } else {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar recordatorio:', error);
    return res.status(500).json({ error: 'Error al actualizar recordatorio' });
  }
});

// DELETE - Eliminar recordatorio
app.delete('/api/recordatorios/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM recordatorios WHERE id = ?');
    const result = deleteStmt.run(id);
    
    if (result.changes > 0) {
      return res.json({ message: 'Recordatorio eliminado' });
    } else {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar recordatorio:', error);
    return res.status(500).json({ error: 'Error al eliminar recordatorio' });
  }
});

// ==================== ENDPOINTS DE GASTOS ====================

// GET - Obtener gastos de un viaje
app.get('/api/viajes/:viajeId/gastos', (req, res) => {
  try {
    const { viajeId } = req.params;
    const gastos = db.prepare('SELECT * FROM gastos WHERE viaje_id = ?').all(viajeId);
    
    const gastosFormateados = gastos.map((g: any) => ({
      ...g,
      dividir_entre: g.dividir_entre ? JSON.parse(g.dividir_entre) : [],
      es_agencia: Boolean(g.es_agencia)
    }));
    
    return res.json(gastosFormateados);
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

// POST - Crear gasto
app.post('/api/viajes/:viajeId/gastos', (req, res) => {
  try {
    const { viajeId } = req.params;
    const { descripcion, concepto, monto, categoria, pagadoPor, pagado_por, fecha, esAgencia } = req.body;
    
    // Usar descripcion o concepto (para compatibilidad con paquetes)
    const desc = descripcion || concepto || 'Gasto';
    // Usar pagadoPor o pagado_por
    const paidBy = pagadoPor || pagado_por || 'Usuario';
    // Fecha actual si no se proporciona
    const fechaGasto = fecha || new Date().toISOString().split('T')[0];
    
    const insert = db.prepare(`
      INSERT INTO gastos (viaje_id, descripcion, monto, categoria, pagado_por, fecha, es_agencia)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      viajeId,
      desc,
      monto,
      categoria || 'general',
      paidBy,
      fechaGasto,
      esAgencia ? 1 : 0
    );
    
    return res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    console.error('Error al crear gasto:', error);
    return res.status(500).json({ error: 'Error al crear gasto' });
  }
});

// DELETE - Eliminar gasto
app.delete('/api/gastos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM gastos WHERE id = ? AND es_agencia = 0');
    const result = deleteStmt.run(id);
    
    if (result.changes > 0) {
      return res.json({ message: 'Gasto eliminado' });
    } else {
      return res.status(404).json({ error: 'Gasto no encontrado o es de agencia' });
    }
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    return res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

// ==================== ENDPOINTS DE PAGOS ====================

// GET - Obtener pagos de un viaje
app.get('/api/viajes/:viajeId/pagos', (req, res) => {
  try {
    const { viajeId } = req.params;
    const pagos = db.prepare('SELECT * FROM pagos WHERE viaje_id = ?').all(viajeId);
    return res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

// POST - Crear pago
app.post('/api/viajes/:viajeId/pagos', (req, res) => {
  try {
    const { viajeId } = req.params;
    const { participante, monto, fecha, descripcion } = req.body;
    
    const insert = db.prepare(`
      INSERT INTO pagos (viaje_id, participante, monto, fecha, descripcion)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(viajeId, participante, monto, fecha, descripcion);
    
    return res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    console.error('Error al crear pago:', error);
    return res.status(500).json({ error: 'Error al crear pago' });
  }
});

// DELETE - Eliminar pago
app.delete('/api/pagos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM pagos WHERE id = ?');
    const result = deleteStmt.run(id);
    
    if (result.changes > 0) {
      return res.json({ message: 'Pago eliminado' });
    } else {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    return res.status(500).json({ error: 'Error al eliminar pago' });
  }
});

// ==================== ENDPOINTS DE AGENCIAS ====================

// GET - Obtener todas las agencias
app.get('/api/agencias', (req, res) => {
  try {
    const agencias = db.prepare('SELECT * FROM agencias').all();
    return res.json(agencias);
  } catch (error) {
    console.error('Error al obtener agencias:', error);
    return res.status(500).json({ error: 'Error al obtener agencias' });
  }
});

// POST - Login de agencia
app.post('/api/agencias/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos' });
    }
    
    const agencia: any = db.prepare('SELECT * FROM agencias WHERE email = ?').get(email);
    
    if (!agencia) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña (las agencias usan password en texto plano por simplicidad)
    // Si quieres bcrypt, descomenta y ajusta
    if (agencia.password !== password) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    // No enviar la contraseña al frontend
    const { password: _, ...agenciaSinPassword } = agencia;
    
    return res.json({ 
      success: true, 
      agencia: agenciaSinPassword 
    });
  } catch (error) {
    console.error('Error en login de agencia:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ==================== ENDPOINTS DE INVITACIONES ====================

// POST - Crear invitación
app.post('/api/invitaciones', (req, res) => {
  try {
    const { codigo, viajeId } = req.body;
    
    const insert = db.prepare(`
      INSERT INTO invitaciones (codigo, viaje_id, fecha_creacion)
      VALUES (?, ?, ?)
    `);
    
    const result = insert.run(codigo, viajeId, Date.now());
    
    return res.status(201).json({ id: result.lastInsertRowid, codigo, viajeId });
  } catch (error) {
    console.error('Error al crear invitación:', error);
    return res.status(500).json({ error: 'Error al crear invitación' });
  }
});

// GET - Validar invitación
app.get('/api/invitaciones/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;
    const invitacion: any = db.prepare('SELECT * FROM invitaciones WHERE codigo = ?').get(codigo);
    
    if (invitacion) {
      const viaje = db.prepare('SELECT * FROM viajes WHERE id = ?').get(invitacion.viaje_id);
      return res.json({ invitacion, viaje });
    } else {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }
  } catch (error) {
    console.error('Error al validar invitación:', error);
    return res.status(500).json({ error: 'Error al validar invitación' });
  }
});
// ==================== ENDPOINTS MEJORADOS DE PAQUETES ====================

// GET - Obtener paquetes de una agencia CON destinos
app.get('/api/agencias/:agenciaId/paquetes', (req, res) => {
  try {
    const { agenciaId } = req.params;
    const paquetes = db.prepare('SELECT * FROM paquetes WHERE agencia_id = ?').all(agenciaId);
    
    const paquetesFormateados = paquetes.map((p: any) => {
      // Obtener destinos del paquete
      const destinos = db.prepare(`
        SELECT d.* 
        FROM paquete_destinos pd
        JOIN destinos d ON pd.destino_id = d.id
        WHERE pd.paquete_id = ?
        ORDER BY pd.orden
      `).all(p.id);
      
      return {
        ...p,
        incluye: p.incluye ? JSON.parse(p.incluye) : [],
        itinerario: p.itinerario ? JSON.parse(p.itinerario) : [],
        gastos: p.gastos ? JSON.parse(p.gastos) : [],
        destinos: destinos.map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          pais: d.pais,
          imagen_principal: d.imagen_principal
        }))
      };
    });
    
    return res.json(paquetesFormateados);
  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    return res.status(500).json({ error: 'Error al obtener paquetes' });
  }
});

// POST - Crear paquete CON destinos
app.post('/api/agencias/:agenciaId/paquetes', (req, res) => {
  try {
    const { agenciaId } = req.params;
    const { nombre, precio, duracion, incluye, itinerario, gastos, destinos } = req.body;
    
    // Insertar paquete
    const insert = db.prepare(`
      INSERT INTO paquetes (agencia_id, nombre, precio, duracion, incluye, itinerario, gastos)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      agenciaId,
      nombre,
      precio,
      duracion,
      JSON.stringify(incluye || []),
      JSON.stringify(itinerario || []),
      JSON.stringify(gastos || [])
    );
    
    const paqueteId = result.lastInsertRowid;
    
    // Insertar relación con destinos
    if (destinos && destinos.length > 0) {
      const insertDestino = db.prepare(`
        INSERT INTO paquete_destinos (paquete_id, destino_id, orden)
        VALUES (?, ?, ?)
      `);
      
      destinos.forEach((destinoId: number, index: number) => {
        insertDestino.run(paqueteId, destinoId, index);
      });
    }
    
    return res.status(201).json({ 
      id: paqueteId, 
      ...req.body,
      message: 'Paquete creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear paquete:', error);
    return res.status(500).json({ error: 'Error al crear paquete' });
  }
});

// PUT - Actualizar paquete CON destinos
app.put('/api/paquetes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, duracion, incluye, itinerario, gastos, destinos } = req.body;
    
    // Actualizar paquete
    const update = db.prepare(`
      UPDATE paquetes 
      SET nombre = ?, precio = ?, duracion = ?, incluye = ?, itinerario = ?, gastos = ?
      WHERE id = ?
    `);
    
    const result = update.run(
      nombre,
      precio,
      duracion,
      JSON.stringify(incluye || []),
      JSON.stringify(itinerario || []),
      JSON.stringify(gastos || []),
      id
    );
    
    if (result.changes > 0) {
      // Eliminar relaciones anteriores
      db.prepare('DELETE FROM paquete_destinos WHERE paquete_id = ?').run(id);
      
      // Insertar nuevas relaciones
      if (destinos && destinos.length > 0) {
        const insertDestino = db.prepare(`
          INSERT INTO paquete_destinos (paquete_id, destino_id, orden)
          VALUES (?, ?, ?)
        `);
        
        destinos.forEach((destinoId: number, index: number) => {
          insertDestino.run(id, destinoId, index);
        });
      }
      
      return res.json({ id, ...req.body, message: 'Paquete actualizado' });
    } else {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar paquete:', error);
    return res.status(500).json({ error: 'Error al actualizar paquete' });
  }
});

// GET - Obtener paquetes por destino (para usuarios)
app.get('/api/destinos/:destinoId/paquetes', (req, res) => {
  try {
    const { destinoId } = req.params;
    
    const paquetes = db.prepare(`
      SELECT p.*, a.nombre as agencia_nombre, a.logo as agencia_logo
      FROM paquetes p
      JOIN paquete_destinos pd ON p.id = pd.paquete_id
      JOIN agencias a ON p.agencia_id = a.id
      WHERE pd.destino_id = ?
      ORDER BY p.precio ASC
    `).all(destinoId);
    
    const paquetesFormateados = paquetes.map((p: any) => ({
      ...p,
      incluye: p.incluye ? JSON.parse(p.incluye) : [],
      itinerario: p.itinerario ? JSON.parse(p.itinerario) : [],
      gastos: p.gastos ? JSON.parse(p.gastos) : []
    }));
    
    return res.json(paquetesFormateados);
  } catch (error) {
    console.error('Error al obtener paquetes por destino:', error);
    return res.status(500).json({ error: 'Error al obtener paquetes' });
  }
});


// POST - Crear agencia (para registro)
app.post('/api/agencias', (req, res) => {
  try {
    const { nombre, email, telefono, direccion, descripcion, logo } = req.body;
    
    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }
    
    const insert = db.prepare(`
      INSERT INTO agencias (nombre, email, telefono, direccion, descripcion, logo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(nombre, email, telefono, direccion, descripcion, logo);
    
    return res.status(201).json({ 
      id: result.lastInsertRowid, 
      ...req.body,
      message: 'Agencia creada exitosamente' 
    });
  } catch (error: any) {
    console.error('Error al crear agencia:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    return res.status(500).json({ error: 'Error al crear agencia' });
  }
});

// PUT - Actualizar agencia
app.put('/api/agencias/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, descripcion, logo } = req.body;
    
    const update = db.prepare(`
      UPDATE agencias 
      SET nombre = ?, email = ?, telefono = ?, direccion = ?, descripcion = ?, logo = ?
      WHERE id = ?
    `);
    
    const result = update.run(nombre, email, telefono, direccion, descripcion, logo, id);
    
    if (result.changes > 0) {
      return res.json({ id, ...req.body, message: 'Agencia actualizada' });
    } else {
      return res.status(404).json({ error: 'Agencia no encontrada' });
    }
  } catch (error) {
    console.error('Error al actualizar agencia:', error);
    return res.status(500).json({ error: 'Error al actualizar agencia' });
  }
});

// GET - Obtener agencia por ID
app.get('/api/agencias/:id', (req, res) => {
  try {
    const { id } = req.params;
    const agencia = db.prepare('SELECT * FROM agencias WHERE id = ?').get(id);
    
    if (agencia) {
      return res.json(agencia);
    } else {
      return res.status(404).json({ error: 'Agencia no encontrada' });
    }
  } catch (error) {
    console.error('Error al obtener agencia:', error);
    return res.status(500).json({ error: 'Error al obtener agencia' });
  }
});

// DELETE - Eliminar paquete (para agencias)
app.delete('/api/paquetes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { agenciaId } = req.query; // Validar que el paquete pertenece a la agencia
    
    let deleteStmt;
    if (agenciaId) {
      deleteStmt = db.prepare('DELETE FROM paquetes WHERE id = ? AND agencia_id = ?');
      const result = deleteStmt.run(id, agenciaId);
      
      if (result.changes > 0) {
        return res.json({ message: 'Paquete eliminado correctamente' });
      } else {
        return res.status(404).json({ error: 'Paquete no encontrado o no pertenece a esta agencia' });
      }
    } else {
      deleteStmt = db.prepare('DELETE FROM paquetes WHERE id = ?');
      const result = deleteStmt.run(id);
      
      if (result.changes > 0) {
        return res.json({ message: 'Paquete eliminado correctamente' });
      } else {
        return res.status(404).json({ error: 'Paquete no encontrado' });
      }
    }
  } catch (error) {
    console.error('Error al eliminar paquete:', error);
    return res.status(500).json({ error: 'Error al eliminar paquete' });
  }
});

// GET - Obtener un paquete específico por ID
app.get('/api/paquetes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const paquete: any = db.prepare('SELECT * FROM paquetes WHERE id = ?').get(id);
    
    if (!paquete) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }
    
    // Obtener destinos del paquete
    const destinos = db.prepare(`
      SELECT d.*, pd.orden
      FROM paquete_destinos pd
      JOIN destinos d ON pd.destino_id = d.id
      WHERE pd.paquete_id = ?
      ORDER BY pd.orden
    `).all(id);
    
    // Obtener información de la agencia
    const agencia = db.prepare('SELECT * FROM agencias WHERE id = ?').get(paquete.agencia_id);
    
    return res.json({
      ...paquete,
      incluye: paquete.incluye ? JSON.parse(paquete.incluye) : [],
      itinerario: paquete.itinerario ? JSON.parse(paquete.itinerario) : [],
      gastos: paquete.gastos ? JSON.parse(paquete.gastos) : [],
      destinos: destinos.map((d: any) => ({
        id: d.id,
        nombre: d.nombre,
        pais: d.pais,
        imagen_principal: d.imagen_principal
      })),
      agencia
    });
  } catch (error) {
    console.error('Error al obtener paquete:', error);
    return res.status(500).json({ error: 'Error al obtener paquete' });
  }
});

// GET - Buscar paquetes (con filtros)
app.get('/api/paquetes/search', (req, res) => {
  try {
    const { destino, minPrecio, maxPrecio, agencia } = req.query;
    
    let query = `
      SELECT DISTINCT p.*, a.nombre as agencia_nombre, a.logo as agencia_logo
      FROM paquetes p
      JOIN agencias a ON p.agencia_id = a.id
      LEFT JOIN paquete_destinos pd ON p.id = pd.paquete_id
      LEFT JOIN destinos d ON pd.destino_id = d.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (destino) {
      query += ' AND d.nombre LIKE ?';
      params.push(`%${destino}%`);
    }
    
    if (minPrecio) {
      query += ' AND p.precio >= ?';
      params.push(minPrecio);
    }
    
    if (maxPrecio) {
      query += ' AND p.precio <= ?';
      params.push(maxPrecio);
    }
    
    if (agencia) {
      query += ' AND a.nombre LIKE ?';
      params.push(`%${agencia}%`);
    }
    
    query += ' ORDER BY p.precio ASC';
    
    const paquetes = db.prepare(query).all(...params);
    
    const paquetesFormateados = paquetes.map((p: any) => ({
      ...p,
      incluye: p.incluye ? JSON.parse(p.incluye) : [],
      itinerario: p.itinerario ? JSON.parse(p.itinerario) : [],
      gastos: p.gastos ? JSON.parse(p.gastos) : []
    }));
    
    return res.json(paquetesFormateados);
  } catch (error) {
    console.error('Error al buscar paquetes:', error);
    return res.status(500).json({ error: 'Error al buscar paquetes' });
  }
});

// GET - Estadísticas de agencia (para dashboard)
app.get('/api/agencias/:agenciaId/estadisticas', (req, res) => {
  try {
    const { agenciaId } = req.params;
    
    // Total de paquetes
    const totalPaquetes = db.prepare('SELECT COUNT(*) as count FROM paquetes WHERE agencia_id = ?').get(agenciaId) as { count: number };
    
    // Total de viajes creados con paquetes de esta agencia
    const totalViajes = db.prepare('SELECT COUNT(*) as count FROM viajes WHERE agencia_id = ?').get(agenciaId) as { count: number };
    
    // Precio promedio de paquetes
    const precioPromedio = db.prepare('SELECT AVG(precio) as promedio FROM paquetes WHERE agencia_id = ?').get(agenciaId) as { promedio: number };
    
    // Paquetes más populares (más viajes)
    const paquetesPopulares = db.prepare(`
      SELECT p.nombre, COUNT(v.id) as total_viajes
      FROM paquetes p
      LEFT JOIN viajes v ON p.id = v.paquete_id
      WHERE p.agencia_id = ?
      GROUP BY p.id
      ORDER BY total_viajes DESC
      LIMIT 5
    `).all(agenciaId);
    
    return res.json({
      totalPaquetes: totalPaquetes.count,
      totalViajes: totalViajes.count,
      precioPromedio: precioPromedio.promedio || 0,
      paquetesPopulares
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// POST - Duplicar paquete (útil para agencias)
app.post('/api/paquetes/:id/duplicar', (req, res) => {
  try {
    const { id } = req.params;
    const paqueteOriginal: any = db.prepare('SELECT * FROM paquetes WHERE id = ?').get(id);
    
    if (!paqueteOriginal) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }
    
    // Crear copia del paquete
    const insert = db.prepare(`
      INSERT INTO paquetes (agencia_id, nombre, precio, duracion, incluye, itinerario, gastos)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      paqueteOriginal.agencia_id,
      `${paqueteOriginal.nombre} (Copia)`,
      paqueteOriginal.precio,
      paqueteOriginal.duracion,
      paqueteOriginal.incluye,
      paqueteOriginal.itinerario,
      paqueteOriginal.gastos
    );
    
    const nuevoPaqueteId = result.lastInsertRowid;
    
    // Copiar destinos asociados
    const destinos = db.prepare('SELECT destino_id, orden FROM paquete_destinos WHERE paquete_id = ?').all(id);
    
    if (destinos.length > 0) {
      const insertDestino = db.prepare(`
        INSERT INTO paquete_destinos (paquete_id, destino_id, orden)
        VALUES (?, ?, ?)
      `);
      
      destinos.forEach((d: any) => {
        insertDestino.run(nuevoPaqueteId, d.destino_id, d.orden);
      });
    }
    
    return res.status(201).json({ 
      id: nuevoPaqueteId,
      message: 'Paquete duplicado exitosamente' 
    });
  } catch (error) {
    console.error('Error al duplicar paquete:', error);
    return res.status(500).json({ error: 'Error al duplicar paquete' });
  }
});

// GET - Todos los paquetes (para vista pública)
app.get('/api/paquetes', (req, res) => {
  try {
    const paquetes = db.prepare(`
      SELECT p.*, a.nombre as agencia_nombre, a.logo as agencia_logo
      FROM paquetes p
      JOIN agencias a ON p.agencia_id = a.id
      ORDER BY p.id DESC
    `).all();
    
    const paquetesFormateados = paquetes.map((p: any) => {
      // Obtener destinos del paquete
      const destinos = db.prepare(`
        SELECT d.id, d.nombre, d.pais, d.imagen_principal
        FROM paquete_destinos pd
        JOIN destinos d ON pd.destino_id = d.id
        WHERE pd.paquete_id = ?
        ORDER BY pd.orden
      `).all(p.id);
      
      return {
        ...p,
        incluye: p.incluye ? JSON.parse(p.incluye) : [],
        itinerario: p.itinerario ? JSON.parse(p.itinerario) : [],
        gastos: p.gastos ? JSON.parse(p.gastos) : [],
        destinos
      };
    });
    
    return res.json(paquetesFormateados);
  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    return res.status(500).json({ error: 'Error al obtener paquetes' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 * Skip API routes - they should be handled by the API endpoints above.
 */
app.use((req, res, next) => {
  // Skip API routes - they are already handled
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`🚀 Node Express server listening on http://localhost:${port}`);
    console.log(`💾 SQLite database: ${dbPath}`);
  });
}

// Cerrar la base de datos al terminar
process.on('SIGINT', () => {
  db.close();
  console.log('✅ Base de datos cerrada');
  process.exit(0);
});

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);