# Deploy en Render — TravelPin Backend

Este documento describe los pasos recomendados para desplegar `travelpin-backend` en Render usando un *Persistent Disk* para que la base de datos SQLite (`BDTravelPin.db`) persista entre despliegues.

Resumen rápido
- Montar un Persistent Disk en la instancia de Render (ej. en `/data`).
- Establecer la variable de entorno `DATABASE_PATH=/data/BDTravelPin.db` (opcional: `DB_PATH`).
- Asegurar que el comando de inicio copie el archivo de la repo al disco persistente si aún no existe (ya existe `copy-db-if-needed.sh`).
- Start command: `bash ./copy-db-if-needed.sh` (o `sh ./copy-db-if-needed.sh`).

Detalles paso a paso

1) Crear el servicio en Render

- Tipo: **Web Service** (Node). 
- Branch: `main` (o la rama que uses).
- Build Command: `npm --prefix travelpin-backend install` (Render correrá el build antes del start). 
- Start Command: `bash ./copy-db-if-needed.sh` (o `sh ./copy-db-if-needed.sh`).

2) Añadir Persistent Disk

- En la página de tu servicio en Render, ve a la pestaña **Disk** o **Volumes** y crea/adjunta un Persistent Disk.
- Monta el volumen en la ruta: `/data`.

3) Variables de entorno necesarias

- `DATABASE_PATH=/data/BDTravelPin.db`  # ruta en el Persistent Disk
- `PORT` — normalmente Render pone automáticamente `PORT`, no es necesario cambiarlo.
- `JWT_SECRET` — configura una clave segura para producción.

4) Script `copy-db-if-needed.sh`

- El repositorio incluye `copy-db-if-needed.sh` que copia `travelpin-backend/BDTravelPin.db` al disco persistente si no existe, y luego exporta `DATABASE_PATH` antes de iniciar el servidor.
- Esto facilita empezar con la DB incluida en el repo. En producción preferible: no mantener la DB en el repo; sube el archivo a `/data` o sube un dump inicial.

5) Health check y puertos

- Render hace health checks automáticamente; configura la ruta de health a `/api/health`.
- El servidor escucha `process.env.PORT` (Render inyecta `PORT`), así que no necesitas cambiar el puerto.

6) Recomenaciones y seguridad

- Evita subir datos sensibles (credenciales o DB con datos reales) al repositorio público. Si ya está en el repo temporalmente, considera eliminarlo y usar un proceso de seed o una copia manual al disco persistente.
- Asegura `JWT_SECRET` y otros secretos mediante las Environment Variables de Render.

7) Comandos útiles (local / debugging)

```powershell
# Ejecutar servidor backend local (desde la carpeta del repo)
cd travelpin-backend
npm install
node server.js      # o npm start si está configurado

# Comprobar la API localmente
Invoke-RestMethod -Uri 'http://localhost:3000/api/destinos' | ConvertTo-Json -Depth 6
```

8) Si prefieres usar un seed en vez de subir la DB

- Ejecuta el script de seed incluido que inserta datos iniciales: `node seed-database.js` (desde `travelpin-backend`).

Notas finales
- Ya revisamos `TravelPlus/src/environments/environment.production.ts` y actualmente apunta a `https://proyecto-ep1i.onrender.com/api`. Asegúrate de que esa URL coincida con el nombre de tu servicio en Render.

Si quieres, puedo:
- Quitar `BDTravelPin.db` del repo y darte pasos para subir solo el dump al Persistent Disk.
- Generar un `README` en la raíz del repo con instrucciones unificadas para Frontend + Backend.
