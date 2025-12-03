import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // HTTP Client para hacer peticiones al backend
    provideHttpClient(withFetch()),
    
    // Detección de cambios optimizada
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Router
    provideRouter(routes), 
    
    // Hydration para SSR (si lo usas)
    provideClientHydration(withEventReplay()),
  ]
};