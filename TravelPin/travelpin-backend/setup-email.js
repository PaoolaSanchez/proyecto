// setup-email.js - Script interactivo para configurar email
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEmail() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Configuración de Email para TravelPlus');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Este script te ayudará a configurar el envío de correos electrónicos.\n');

  // Seleccionar proveedor
  console.log('Selecciona tu proveedor de email:');
  console.log('1. Gmail (Recomendado)');
  console.log('2. Outlook/Hotmail');
  console.log('3. Yahoo');
  console.log('4. Otro (manual)\n');

  const provider = await question('Opción (1-4): ');

  let host, port;
  switch(provider) {
    case '1':
      host = 'smtp.gmail.com';
      port = '587';
      console.log('\n✅ Gmail seleccionado');
      console.log('⚠️  IMPORTANTE: Necesitas una "contraseña de aplicación", no tu contraseña normal.');
      console.log('📖 Guía: https://support.google.com/accounts/answer/185833\n');
      break;
    case '2':
      host = 'smtp.office365.com';
      port = '587';
      console.log('\n✅ Outlook/Hotmail seleccionado\n');
      break;
    case '3':
      host = 'smtp.mail.yahoo.com';
      port = '587';
      console.log('\n✅ Yahoo seleccionado');
      console.log('⚠️  Necesitas una contraseña de aplicación para Yahoo.\n');
      break;
    case '4':
      host = await question('Host SMTP: ');
      port = await question('Puerto (587 o 465): ');
      break;
    default:
      console.log('❌ Opción inválida');
      rl.close();
      return;
  }

  // Obtener credenciales
  const email = await question('Tu correo electrónico: ');
  const password = await question('Tu contraseña (o contraseña de aplicación): ');

  // Leer archivo .env actual
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Actualizar o agregar variables de email
  const updates = {
    'EMAIL_HOST': host,
    'EMAIL_PORT': port,
    'EMAIL_USER': email,
    'EMAIL_PASSWORD': password
  };

  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      if (!envContent.endsWith('\n')) envContent += '\n';
      envContent += `${key}=${value}\n`;
    }
  });

  // Guardar archivo .env
  fs.writeFileSync(envPath, envContent);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Configuración guardada en .env');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Configuración aplicada:');
  console.log(`   Host: ${host}`);
  console.log(`   Puerto: ${port}`);
  console.log(`   Email: ${email}`);
  console.log(`   Contraseña: ${'*'.repeat(password.length)}\n`);

  console.log('🔄 Reinicia el servidor para aplicar los cambios:');
  console.log('   node server.js\n');

  console.log('🧪 Prueba la configuración:');
  console.log('   1. Ve a http://localhost:3000/api/email/test');
  console.log('   2. O envía un POST a http://localhost:3000/api/email/test-send');
  console.log('      con el body: {"to":"tu-email@example.com"}\n');

  rl.close();
}

setupEmail().catch(err => {
  console.error('❌ Error:', err.message);
  rl.close();
  process.exit(1);
});
