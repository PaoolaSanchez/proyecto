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

// Detectar si usar Turso (producción) o SQLite local (desarrollo)
const USE_TURSO = process.env.TURSO_DATABASE_URL || process.env.RENDER || false;
let db;

if (USE_TURSO) {
  console.log('🌐 Usando Turso (base de datos en la nube)');
  const turso = require('./db-turso');
  db = turso.db;
} else {
  console.log('💾 Usando SQLite local');
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database('./BDTravelPin.db', (err) => {
    if (err) {
      console.error('Error al conectar con la base de datos:', err);
      process.exit(1);
    }
    console.log('✅ Conectado a la base de datos SQLite local');
  });
}

// Middleware - CORS abierto para producción
app.use(cors({
  origin: true, // Permite cualquier origen
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== HEALTH CHECK PARA RAILWAY ==========
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'travelpin-backend',
    database: USE_TURSO ? 'turso' : 'sqlite-local'
  });
});

// Inicializar base de datos y servidor
inicializarBaseDeDatos(() => {
  let portActual = PORT;
  
  const iniciarServidor = (puerto) => {
    const server = app.listen(puerto, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${puerto}`);
      console.log(`📊 API disponible en http://localhost:${puerto}/api`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Puerto ${puerto} en uso, intentando puerto ${puerto + 1}...`);
        iniciarServidor(puerto + 1);
      } else {
        console.error('Error del servidor:', err);
        process.exit(1);
      }
    });
  };
  
  iniciarServidor(portActual);
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
      if (callback) callback();
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
    // console.log('email_verified columna ya existe o error: ', err.message);
  } else {
    console.log('✅ Columna email_verified añadida a usuarios (si no existía)');
  }
});

// Middleware de autenticación
function verificarToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
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

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Registro de usuario (SIN verificación de email - acceso directo)
app.post('/api/auth/register', async (req, res) => {
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
});

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
app.post('/api/send-verification', async (req, res) => {
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
});

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
      if (err) return res.status(500).json({ error: 'Error al crear paquete' });
      const paqueteId = this.lastID;

      if (Array.isArray(destinos) && destinos.length > 0) {
        const stmt = db.prepare('INSERT INTO paquete_destinos (paquete_id, destino_id, orden) VALUES (?, ?, ?)');
        destinos.forEach((destId, idx) => stmt.run(paqueteId, destId, idx));
        stmt.finalize(() => res.status(201).json({ message: 'Paquete creado', id: paqueteId }));
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
      if (err) return res.status(500).json({ error: 'Error al actualizar paquete' });
      // actualizar destinos: eliminar existentes y volver a insertar
      db.run('DELETE FROM paquete_destinos WHERE paquete_id = ?', [paqueteId], (err2) => {
        if (err2) return res.status(500).json({ error: 'Error al actualizar destinos del paquete' });
        if (Array.isArray(destinos) && destinos.length > 0) {
          const stmt = db.prepare('INSERT INTO paquete_destinos (paquete_id, destino_id, orden) VALUES (?, ?, ?)');
          destinos.forEach((destId, idx) => stmt.run(paqueteId, destId, idx));
          stmt.finalize(() => res.json({ message: 'Paquete actualizado' }));
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

// Obtener viajes del usuario
app.get('/api/viajes', verificarToken, (req, res) => {
  db.all(
    'SELECT * FROM viajes WHERE usuario_id = ? ORDER BY created_at DESC',
    [req.userId],
    (err, viajes) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener viajes' });
      }
      res.json(viajes);
    }
  );
});

// Crear viaje
app.post('/api/viajes', verificarToken, (req, res) => {
  const { nombre, icono, fecha_inicio, fecha_fin, destinos } = req.body;

  // Primero obtener datos del usuario desde la base de datos
  db.get('SELECT nombre, email FROM usuarios WHERE id = ?', [req.userId], (err, usuario) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener usuario' });
    }

    db.run(
      'INSERT INTO viajes (usuario_id, nombre, icono, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
      [req.userId, nombre, icono || '✈️', fecha_inicio, fecha_fin],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al crear viaje' });
        }

        const viajeId = this.lastID;

        // Agregar destinos si existen
        if (destinos && destinos.length > 0) {
          const stmt = db.prepare('INSERT INTO viaje_destinos (viaje_id, destino_id, orden) VALUES (?, ?, ?)');
          destinos.forEach((destinoId, index) => {
            stmt.run(viajeId, destinoId, index);
          });
          stmt.finalize();
        }

        // Agregar participante inicial con datos del usuario de la base de datos
        const nombreParticipante = usuario?.nombre || 'Usuario';
        const emailParticipante = usuario?.email || '';
        const inicialesParticipante = nombreParticipante.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const colorParticipante = '#FF6B6B';
        
        db.run(
          'INSERT INTO participantes (viaje_id, nombre, email, iniciales, color) VALUES (?, ?, ?, ?, ?)',
          [viajeId, nombreParticipante, emailParticipante, inicialesParticipante, colorParticipante]
        );

        res.status(201).json({ message: 'Viaje creado', id: viajeId });
      }
    );
  });
});

// Obtener gastos de un viaje
app.get('/api/viajes/:id/gastos', verificarToken, (req, res) => {
  db.all(
    'SELECT * FROM gastos WHERE viaje_id = ?',
    [req.params.id],
    (err, gastos) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener gastos' });
      }
      res.json(gastos);
    }
  );
});

// Agregar gasto a un viaje
app.post('/api/viajes/:id/gastos', verificarToken, (req, res) => {
  const { descripcion, monto, categoria, pagado_por, fecha } = req.body;

  db.run(
    'INSERT INTO gastos (viaje_id, descripcion, monto, categoria, pagado_por, fecha) VALUES (?, ?, ?, ?, ?, ?)',
    [req.params.id, descripcion, monto, categoria, pagado_por, fecha],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al agregar gasto' });
      }
      res.status(201).json({ message: 'Gasto agregado', id: this.lastID });
    }
  );
});

// Obtener pagos de un viaje
app.get('/api/viajes/:id/pagos', verificarToken, (req, res) => {
  db.all(
    'SELECT * FROM pagos WHERE viaje_id = ?',
    [req.params.id],
    (err, pagos) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener pagos' });
      }
      res.json(pagos);
    }
  );
});

// Agregar pago a un viaje
app.post('/api/viajes/:id/pagos', verificarToken, (req, res) => {
  const { participante, monto, descripcion, fecha } = req.body;

  db.run(
    'INSERT INTO pagos (viaje_id, participante, monto, descripcion, fecha) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, participante, monto, descripcion, fecha],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al agregar pago' });
      }
      res.status(201).json({ message: 'Pago registrado', id: this.lastID });
    }
  );
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
app.post('/api/usuarios/registro', async (req, res) => {
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
});

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
app.put('/api/usuarios/:id', verificarToken, async (req, res) => {
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
});

// Cambiar contraseña del usuario
app.put('/api/usuarios/:id/password', verificarToken, async (req, res) => {
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
});

// Actualizar perfil completo (nombre, email) - sin autenticación estricta para simplificar
app.put('/api/usuarios/perfil/:email', async (req, res) => {
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
});

// Cambiar contraseña por email (sin token, verificando contraseña actual)
app.put('/api/usuarios/cambiar-password/:email', async (req, res) => {
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
});

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

app.post('/api/viajes/invitar-email', async (req, res) => {
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
});

// ==================== RUTAS DE PRUEBA ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Verificar configuración de email
app.get('/api/email/test', async (req, res) => {
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
});

// Enviar email de prueba
app.post('/api/email/test-send', async (req, res) => {
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
});

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
