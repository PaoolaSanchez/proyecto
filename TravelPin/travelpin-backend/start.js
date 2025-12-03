#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando proceso de startup...\n');

// Primero ejecutar el seed
console.log('1️⃣  Ejecutando seed-database.js...\n');
const seedProcess = spawn('node', ['scripts/seed-database.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

seedProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Error en seed-database.js');
    process.exit(1);
  }

  console.log('\n✅ Seed completado. Iniciando servidor...\n');
  
  // Luego ejecutar el servidor
  const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  serverProcess.on('close', (code) => {
    process.exit(code);
  });

  // Manejar SIGINT para pasar al proceso hijo
  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
  });
});
