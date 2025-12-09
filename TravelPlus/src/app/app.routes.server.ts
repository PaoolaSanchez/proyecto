import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas con parámetros dinámicos - Server side rendering
  {
    path: 'unirse-viaje/:codigo',
    renderMode: RenderMode.Server
  },
  {
    path: 'verify-email',
    renderMode: RenderMode.Server
  },
  // Todas las demás rutas - Prerender
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
