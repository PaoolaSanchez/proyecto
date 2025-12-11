// src/environments/environment.ts
// Detecta automáticamente si estamos en producción basándose en el hostname
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('travelpin') ||
   window.location.hostname.includes('render.com'));

export const environment = {
  production: isProduction,
  // En desarrollo usar el backend local en puerto 3000
  // En producción usar Render
  apiUrl: isProduction 
    ? 'https://proyecto-ep1i.onrender.com/api' 
    : 'http://localhost:10000/api'
};
