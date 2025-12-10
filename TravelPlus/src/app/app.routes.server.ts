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
  // Ruta de detalle de viaje solo en cliente
  {
    path: 'trip-detail/:id',
    renderMode: RenderMode.Client
  },
  // Todas las demás rutas - Prerender
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
