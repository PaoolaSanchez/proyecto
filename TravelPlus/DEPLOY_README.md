 # Despliegue: Frontend SPA (Vercel) + Backend (Render)

 Este documento explica cómo desplegar la aplicación como SPA en Vercel y desplegar el backend (SSE-friendly) en Render. Está pensado para Windows PowerShell.

 **Resumen**
 - Frontend: `TravelPlus` (Angular) — desplegar estático en Vercel con `vercel.json` (ya presente).
 - Backend: `travelpin-backend` — desplegar como Web Service en Render (proceso Node persistente) para soportar SSE.

 Antes de empezar
 - Asegúrate de que el repo está en GitHub (o Git provider) y que contiene ambos directorios: `TravelPlus` y `travelpin-backend`.
 - Ten a mano las variables de entorno necesarias (JWT_SECRET, credenciales de email si usas notificaciones, DB path si se necesita).

 1) Verificar & ajustar `environment.production`
 - Abre `src/environments/environment.production.ts` y configura la URL pública de tu backend (la que Render te dará):

 ```ts
 export const environment = {
   production: true,
   apiUrl: 'https://<TU_BACKEND>.onrender.com/api'
 };
 ```

 2) Build y prueba local del frontend (SPA)

 ```powershell
 cd C:\Users\joel_\Downloads\proyecto\TravelPlus
 npm install
 ng build --configuration=production
 # Servir la carpeta build para probar localmente
 npx serve -s dist/TravelPin/browser
 # Abrir http://localhost:5000 y probar rutas como /trip-detail/1
 ```

 3) Probar backend local (opcional, recomendado)

 ```powershell
 cd C:\Users\joel_\Downloads\proyecto\TravelPlus\travelpin-backend
 npm install
 npm start
 # Verificar health
 curl http://localhost:3000/api/health
 ```

 4) Preparar deploy en Vercel (frontend)
 - Asegúrate de que `vercel.json` en el repo apunta a `TravelPlus/dist/TravelPin/browser` y contiene la rewrite `/(.*) -> /index.html`. (Ya lo actualizamos.)
 - Push a GitHub.
 - En Vercel: crear un nuevo proyecto -> conectar el repo -> Vercel detectará y correrá el `buildCommand` de `vercel.json`.

 5) Desplegar backend en Render (recomendado para SSE)

 - Opciones: usar el `render.yaml` incluido en `travelpin-backend` o crear servicio manualmente en Render.

 Usando Render dashboard (manual):
   - New -> Web Service -> Connect GitHub repo -> seleccionar `travelpin-backend` como root
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`, setear vars: `NODE_ENV=production`, `PORT=10000`, `JWT_SECRET`, etc.

 Usando `render.yaml` (si tu repo/Render lo soporta): el archivo ya está en `travelpin-backend/render.yaml`; en Render crea el servicio apuntando al repo y Render usará esa configuración.

 6) Actualizar frontend con la URL de backend y redeploy
 - Cambia `environment.production.apiUrl` a `https://<TU_BACKEND>.onrender.com/api`, commit y push. Vercel redeployará.

 7) Verificación end-to-end
 - Abrir la URL del frontend (Vercel) y crear/unirse a un viaje.
 - En dos navegadores distintas, subscribirse al mismo viaje y realizar cambios (p. ej. agregar gasto) — comprueba que aparecen por SSE.
 - Verifica health y SSE endpoint directamente:

 ```powershell
 curl https://<TU_BACKEND>.onrender.com/api/health
 # Para SSE (ejemplo):
 curl -N "https://<TU_BACKEND>.onrender.com/api/viajes/1/sync?token=<TOKEN>"
 ```

 Checklist antes de marcar como completado
 - [ ] `environment.production.apiUrl` actualizado
 - [ ] Backend desplegado en Render y `GET /api/health` responde
 - [ ] Frontend deploy en Vercel listo y al abrir rutas directas carga la app
 - [ ] SSE funciona entre 2 clientes en producción

 Problemas comunes y soluciones rápidas
 - CORS: el backend ya tiene CORS habilitado con origen wildcard; si necesitas restringir, actualiza `cors()` en `travelpin-backend/server.js`.
 - SSE en serverless: evitar Vercel serverless para SSE (usa Render/Railway/DigitalOcean App).
 - Meta tags/SEO: si necesitas previews dinámicos, considera SSR o un prerender para bots.

 Si quieres, puedo:
 - Generar un `README` más corto para el equipo y un `deploy-checklist.md` separado.
 - Preparar un workflow de GitHub Actions que despliegue el backend a Render automáticamente (necesitarás una API key de Render).

 ---
 Fecha: 2025-12-10
