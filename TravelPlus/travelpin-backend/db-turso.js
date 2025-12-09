// db-turso.js - Wrapper para usar Turso con una API similar a sqlite3
const { createClient } = require('@libsql/client');

// Configuración de Turso
const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://travelpin-paoolasanchez.aws-us-west-2.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ3NzU0NTYsImlkIjoiY2UzYTAxOWQtZTM0NS00NDAxLTg4NTgtZGExMjZjZjQyMGI0IiwicmlkIjoiZjYzZWI3YmYtODdmMi00YzFkLWI5NjUtM2U4NjlkYWY2NGMxIn0.RE2RoKOGcmdHC-0X4bDRAP6Q__2ip8UuOfs3MB7QHFBBZgjYscAw2nuSRD0ZKmS5bWILcG70IrVlzawLeNa3AA';

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

// Wrapper para hacer que Turso funcione similar a sqlite3
const db = {
  // Ejecutar query sin retorno (INSERT, UPDATE, DELETE, CREATE)
  run: function(sql, params = [], callback) {
    const args = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    
    client.execute({ sql, args })
      .then(result => {
        if (cb) {
          // Simular el contexto de sqlite3 con lastID
          const context = { lastID: Number(result.lastInsertRowid) || 0 };
          cb.call(context, null);
        }
      })
      .catch(err => {
        if (cb) cb(err);
      });
  },

  // Obtener una fila
  get: function(sql, params = [], callback) {
    const args = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    
    client.execute({ sql, args })
      .then(result => {
        const row = result.rows[0] || null;
        // Convertir a objeto plano
        const plainRow = row ? Object.fromEntries(Object.entries(row)) : null;
        if (cb) cb(null, plainRow);
      })
      .catch(err => {
        if (cb) cb(err, null);
      });
  },

  // Obtener múltiples filas
  all: function(sql, params = [], callback) {
    const args = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    
    client.execute({ sql, args })
      .then(result => {
        // Convertir cada fila a objeto plano
        const rows = result.rows.map(row => Object.fromEntries(Object.entries(row)));
        if (cb) cb(null, rows);
      })
      .catch(err => {
        if (cb) cb(err, []);
      });
  },

  // Para compatibilidad
  serialize: function(callback) {
    if (callback) callback();
  },

  // Ejecutar múltiples statements
  exec: function(sql, callback) {
    client.executeMultiple(sql)
      .then(() => {
        if (callback) callback(null);
      })
      .catch(err => {
        if (callback) callback(err);
      });
  }
};

module.exports = { db, client };
