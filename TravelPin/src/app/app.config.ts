import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // HTTP Client con interceptor de autenticación
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    
    // Detección de cambios optimizada
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Router
    provideRouter(routes), 
    
    // Hydration para SSR (si lo usas)
    provideClientHydration(withEventReplay()),
  ]
};