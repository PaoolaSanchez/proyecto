#!/usr/bin/env node
// migrate-to-postgres.js
// Copia datos desde la BD SQLite local a una base Postgres indicada por DATABASE_URL

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'BDTravelPin.db');
const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_CONNECTION || process.env.PGDATABASE;

if (!DATABASE_URL) {
  console.error('ERROR: debes definir la variable de entorno DATABASE_URL con la conexión a Postgres.');
  console.error('Ejemplo: export DATABASE_URL="postgres://user:pass@host:5432/dbname"');
  process.exit(1);
}

const sqliteDb = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error abriendo SQLite:', err.message);
    process.exit(1);
  }
  console.log('🔌 Conectado a SQLite:', SQLITE_PATH);
});

const pool = new Pool({ connectionString: DATABASE_URL });

function sqliteAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function run() {
  console.log('🚀 Iniciando migración a Postgres...');
  const client = await pool.connect();
  try {
    // Crear tablas en Postgres (equivalentes a las de server.js) - adaptadas a Postgres
    const createStatements = [
      `CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS destinos (
        id SERIAL PRIMARY KEY,
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
        es_popular BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS favoritos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        destino_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS viajes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        icono TEXT DEFAULT '✈️',
        fecha_inicio TEXT,
        fecha_fin TEXT,
        finalizado BOOLEAN DEFAULT FALSE,
        calificacion INTEGER,
        resena TEXT,
        agencia_id INTEGER,
        agencia_nombre TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS viaje_destinos (
        id SERIAL PRIMARY KEY,
        viaje_id INTEGER NOT NULL,
        destino_id INTEGER NOT NULL,
        orden INTEGER DEFAULT 0
      )`,

      `CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        viaje_id INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        categoria TEXT NOT NULL,
        pagado_por TEXT NOT NULL,
        fecha TEXT NOT NULL,
        es_agencia BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS pagos (
        id SERIAL PRIMARY KEY,
        viaje_id INTEGER NOT NULL,
        participante TEXT NOT NULL,
        monto REAL NOT NULL,
        descripcion TEXT,
        fecha TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS participantes (
        id SERIAL PRIMARY KEY,
        viaje_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        email TEXT,
        iniciales TEXT,
        color TEXT
      )`,

      `CREATE TABLE IF NOT EXISTS encuestas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        tipo TEXT DEFAULT 'preferencias',
        preguntas TEXT NOT NULL,
        respuestas TEXT,
        creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS agencias (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        descripcion TEXT,
        logo TEXT,
        contacto TEXT,
        sitio_web TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS paquetes (
        id SERIAL PRIMARY KEY,
        agencia_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        duracion TEXT,
        incluye TEXT,
        itinerario TEXT,
        gastos TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS paquete_destinos (
        id SERIAL PRIMARY KEY,
        paquete_id INTEGER NOT NULL,
        destino_id INTEGER NOT NULL,
        orden INTEGER DEFAULT 0
      )`,

      `CREATE TABLE IF NOT EXISTS viaje_itinerario (
        id SERIAL PRIMARY KEY,
        viaje_id INTEGER NOT NULL,
        fecha TEXT,
        dia INTEGER,
        actividad TEXT NOT NULL,
        destino_id INTEGER,
        hora TEXT,
        notas TEXT,
        completado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS recordatorios (
        id SERIAL PRIMARY KEY,
        viaje_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        fecha TEXT,
        completado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS invitaciones (
        id SERIAL PRIMARY KEY,
        codigo TEXT UNIQUE NOT NULL,
        viaje_id INTEGER NOT NULL,
        fecha_creacion INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS viajes_compartidos (
        id SERIAL PRIMARY KEY,
        viaje_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        rol TEXT DEFAULT 'participante',
        fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of createStatements) {
      await client.query(sql);
    }

    // List of tables to transfer (order can matter for foreign keys)
    const tables = [
      'usuarios','agencias','destinos','paquetes','paquete_destinos',
      'viajes','viaje_destinos','participantes','gastos','pagos','reservas',
      'viaje_itinerario','recordatorios','invitaciones','viajes_compartidos',
      'favoritos','encuestas','email_verifications'
    ];

    for (const table of tables) {
      console.log(`\n📦 Migrando tabla: ${table}`);
      const rows = await sqliteAll(`SELECT * FROM ${table}`);
      console.log(`   → filas desde sqlite: ${rows.length}`);
      if (rows.length === 0) continue;

      for (const row of rows) {
        const cols = Object.keys(row).filter(c => c !== undefined && c !== null);
        const values = cols.map(c => {
          const v = row[c];
          // Convertir flags 0/1 a booleanos donde aplique
          if (v === 0) return false;
          if (v === 1) return true;
          return v;
        });

        const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
        const colList = cols.join(',');

        const insertSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`;
        try {
          await client.query(insertSql, values);
        } catch (err) {
          console.error(`     ✖ error insert ${table}:`, err.message);
        }
      }

      // Ajustar la secuencia si existe columna id
      try {
        const seqRes = await client.query(`SELECT MAX(id) AS maxid FROM ${table}`);
        const maxid = seqRes.rows[0].maxid || 0;
        await client.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), $2, true)`, [table, maxid]);
      } catch (err) {
        // puede fallar si no hay serial o no hay columna id
      }
      console.log(`   → migrada tabla: ${table}`);
    }

    console.log('\n✅ Migración completada. Verifica los datos en tu Postgres.');
  } finally {
    client.release();
    sqliteDb.close();
    await pool.end();
  }
}

run().catch(err => {
  console.error('ERROR durante migración:', err);
  process.exit(1);
});
