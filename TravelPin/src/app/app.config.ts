import { ApplicationConfig, provideZoneChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

// Importaciones necesarias de AngularFire
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth'; 


const firebaseConfig = {
    apiKey: "AIzaSyCLrIohMa4U-8gzCV6nWJ-T6QDP8puH6HI",
    authDomain: "travelpin-caa28.firebaseapp.com",
    projectId: "travelpin-caa28",
    storageBucket: "travelpin-caa28.firebasestorage.app",
    messagingSenderId: "692322619587",
    appId: "1:692322619587:web:5895c34f59ede777c89276",
    measurementId: "G-KM7V7PZ2TB"
};
// ----------------------------------------------------

export const appConfig: ApplicationConfig = {
  providers: [
    // Proveedores de Angular (ya existentes)
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),


    // Inicialización de la aplicación
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    
    // Provisión de la Base de Datos (Firestore)
    provideFirestore(() => getFirestore()), 
    
    // Provisión de Autenticación 
    provideAuth(() => getAuth()), 
    
  
    // import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
    // provideAnalytics(() => getAnalytics(initializeApp(firebaseConfig))), 
  ]
};