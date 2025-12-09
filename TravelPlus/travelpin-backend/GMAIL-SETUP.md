# 🚀 Guía Rápida: Configurar Email con Gmail

## ❌ Problema con Outlook/Hotmail

Microsoft ha deshabilitado la autenticación básica SMTP para Outlook/Hotmail por razones de seguridad. Por esto, **recomendamos usar Gmail** para el envío de correos.

## ✅ Configurar Gmail (5 minutos)

### Paso 1: Preparar tu cuenta de Gmail

1. Ve a https://myaccount.google.com/security
2. Busca "Verificación en dos pasos"
3. Si no está activada, actívala (es obligatorio para contraseñas de aplicación)

### Paso 2: Generar contraseña de aplicación

1. Ve a https://myaccount.google.com/apppasswords
2. En "Selecciona la app", elige "Correo"
3. En "Selecciona el dispositivo", elige "Computadora con Windows"
4. Haz clic en "Generar"
5. **Copia la contraseña de 16 caracteres** que aparece (ejemplo: `abcd efgh ijkl mnop`)

### Paso 3: Configurar en .env

Abre el archivo `.env` y configura:

```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**IMPORTANTE:** 
- Pega la contraseña SIN ESPACIOS (todos juntos: `abcdefghijklmnop`)
- NO uses tu contraseña normal de Gmail
- Usa la contraseña de aplicación que acabas de generar

### Paso 4: Reiniciar el servidor

```powershell
# Detener el servidor (Ctrl+C si está corriendo)
# Luego iniciar de nuevo:
node server.js
```

### Paso 5: Probar

```powershell
# Verificar configuración
Invoke-RestMethod http://localhost:3000/api/email/test

# Enviar email de prueba a tu correo
Invoke-RestMethod -Uri "http://localhost:3000/api/email/test-send" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"to":"tu-email@gmail.com"}'
```

Si todo funciona, verás:
- ✅ Conexión SMTP verificada
- ✅ Email enviado exitosamente
- Recibirás el email de prueba en tu bandeja

## 🔄 Alternativa: Modo Simulado (Sin configuración)

Si no quieres configurar email ahora, simplemente **deja EMAIL_USER y EMAIL_PASSWORD vacíos**:

```env
EMAIL_USER=
EMAIL_PASSWORD=
```

El sistema funcionará en **modo simulado**:
- No envía emails reales
- Los links de verificación aparecen en los logs del servidor
- Útil para desarrollo y pruebas

## 📧 Usar en la Aplicación

Una vez configurado:

1. **Registrar usuario**: El sistema enviará email de verificación automáticamente
2. **Usuario recibe email**: Con un botón grande "Verificar mi correo electrónico"
3. **Hacer clic en el link**: Automáticamente verifica y inicia sesión
4. **Redirige al home**: Con la sesión ya iniciada

## ❓ Problemas Comunes

### "Invalid login" o "Bad credentials"
- Verifica que usaste una contraseña de aplicación (no tu contraseña normal)
- Asegúrate de pegar la contraseña sin espacios
- Confirma que la verificación en 2 pasos esté activada

### "Connection timeout"
- Verifica tu conexión a internet
- Algunos firewalls corporativos bloquean el puerto 587
- Intenta desde otra red (ej. hotspot del celular)

### "App password not available"
- Necesitas activar primero la verificación en dos pasos
- Espera unos minutos después de activarla
- Refresca la página de contraseñas de aplicación

## 💡 Consejo

Para producción, considera usar servicios especializados como:
- SendGrid (gratis hasta 100 emails/día)
- Mailgun (gratis hasta 5,000 emails/mes)
- Amazon SES (muy económico)

Estos son más confiables y tienen mejor entregabilidad que Gmail para aplicaciones en producción.
