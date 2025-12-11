// Script para probar el flujo de verificación de email
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const JWT_SECRET = 'tu_clave_secreta_aqui_cambiar_en_produccion';
const dbPath = path.join(__dirname, 'BDTravelPin.db');
const db = new sqlite3.Database(dbPath);

async function testVerification() {
  console.log('🧪 Iniciando prueba de verificación de email...\n');

  // 1. Crear usuario de prueba sin verificar
  const testEmail = 'test-verificacion@example.com';
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Primero eliminar el usuario si ya existe
  await new Promise((resolve) => {
    db.run('DELETE FROM usuarios WHERE email = ?', [testEmail], () => resolve());
  });

  // Insertar usuario sin verificar (email_verified = 0)
  const userId = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO usuarios (nombre, email, password, email_verified) VALUES (?, ?, ?, 0)',
      ['Usuario Test', testEmail, hashedPassword],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  console.log(`✅ Usuario de prueba creado:`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: password123`);
  console.log(`   ID: ${userId}`);
  console.log(`   Verificado: NO\n`);

  // 2. Generar token de verificación
  const token = jwt.sign({ email: testEmail }, JWT_SECRET, { expiresIn: '1h' });
  const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hora

  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO email_verifications (usuario_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
      [userId, testEmail, token, expiresAt],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  // 3. Generar link de verificación
  const verificationLink = `http://localhost:4200/verify-email?token=${token}`;
  
  console.log('✅ Token de verificación generado\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 LINK DE VERIFICACIÓN:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(verificationLink);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 PASOS PARA PROBAR:');
  console.log('1. Copia el link de arriba');
  console.log('2. Pégalo en tu navegador');
  console.log('3. El sistema verificará tu email automáticamente');
  console.log('4. Serás redirigido al home con sesión iniciada\n');
  
  console.log('💡 NOTAS:');
  console.log('- El token expira en 1 hora');
  console.log('- Después de verificar, podrás hacer login con:');
  console.log(`  Email: ${testEmail}`);
  console.log('  Password: password123\n');

  db.close();
}

testVerification().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
