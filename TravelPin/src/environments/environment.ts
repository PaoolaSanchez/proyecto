// src/environments/environment.ts
// Detecta automáticamente si estamos en producción basándose en el hostname
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('travelpin'));

export const environment = {
  production: isProduction,
  apiUrl: isProduction 
    ? 'https://proyecto-ep1i.onrender.com/api' 
    : '/api'
};
