# 📧 Configuración de Email para TravelPlus

Este documento explica cómo configurar el envío de correos electrónicos reales para la verificación de usuarios.

## 🚀 Inicio Rápido

### Opción 1: Gmail (Recomendado)

1. **Abrir el archivo `.env`** en la carpeta `travelpin-backend`

2. **Configurar las credenciales de Gmail:**
   ```env
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASSWORD=tu-contraseña-de-aplicacion
   ```

3. **Obtener una contraseña de aplicación de Gmail:**
   - Ve a https://myaccount.google.com/security
   - Activa la "Verificación en dos pasos" si no está activada
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Windows" (o tu sistema)
   - Copia la contraseña de 16 caracteres (sin espacios)
   - Pégala en `EMAIL_PASSWORD`

4. **Reiniciar el servidor backend**
   ```bash
   cd travelpin-backend
   node server.js
   ```

### Opción 2: Outlook/Hotmail

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu-contraseña
```

### Opción 3: Yahoo

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=tu-email@yahoo.com
EMAIL_PASSWORD=tu-contraseña-de-aplicacion
```

## 🧪 Probar la Configuración

### 1. Verificar estado del servicio de email

Abre en tu navegador o usa curl:
```
http://localhost:3000/api/email/test
```

### 2. Enviar un email de prueba

Usando curl/PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/email/test-send" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"to":"tu-email@example.com"}'
```

O usando Postman:
- Método: POST
- URL: `http://localhost:3000/api/email/test-send`
- Body (JSON):
  ```json
  {
    "to": "tu-email@example.com"
  }
  ```

## 📝 Flujo de Verificación

### Modo Desarrollo (Sin configurar email)
- Los usuarios se registran con email verificado automáticamente
- Los links de verificación se muestran en los logs del servidor
- Útil para desarrollo y testing

### Modo Producción (Con email configurado)
1. Usuario se registra
2. Sistema envía email con link de verificación
3. Usuario hace clic en el link
4. Sistema verifica el email automáticamente
5. Usuario es redirigido al home con sesión iniciada

## 🔧 Configuración Avanzada

### Variables de entorno disponibles

```env
# Servidor de email
EMAIL_HOST=smtp.gmail.com          # Servidor SMTP
EMAIL_PORT=587                      # Puerto (587 para TLS, 465 para SSL)
EMAIL_USER=tu-email@gmail.com       # Tu correo
EMAIL_PASSWORD=tu-contraseña        # Contraseña de aplicación

# Frontend URL (para los links)
FRONTEND_URL=http://localhost:4200

# JWT Secret (para tokens)
JWT_SECRET=tu_clave_secreta_super_segura
```

## ❓ Problemas Comunes

### "Email no configurado"
- Verifica que `EMAIL_USER` y `EMAIL_PASSWORD` estén configurados en `.env`
- Asegúrate de que no haya espacios extra
- Reinicia el servidor después de cambiar `.env`

### "Error de autenticación SMTP"
- Para Gmail: usa una contraseña de aplicación, no tu contraseña normal
- Verifica que la verificación en dos pasos esté activada
- Revisa que el correo y contraseña sean correctos

### "Connection timeout"
- Verifica tu conexión a internet
- Algunos firewalls bloquean el puerto 587
- Intenta con puerto 465 y agrega `EMAIL_SECURE=true` en `.env`

### "Less secure apps"
- Gmail ya no soporta "aplicaciones menos seguras"
- DEBES usar contraseñas de aplicación
- No uses tu contraseña normal de Gmail

## 📚 Recursos

- [Contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

## 💡 Notas

- Los emails de verificación expiran en 1 hora
- Un usuario solo puede tener un token de verificación activo a la vez
- Los tokens usados se eliminan automáticamente de la base de datos
