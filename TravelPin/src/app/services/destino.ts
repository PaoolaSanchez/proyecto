// src/app/services/destino.ts

import { Injectable } from '@angular/core';
import { Firestore, GeoPoint, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// **IMPORTANTE:** Define la interfaz de tu modelo de datos.
// Esto garantiza que los datos de Firebase coincidan con tu código Angular.
export interface Destino {
  id?: string; // ID único del documento de Firestore
  
  titulo: string;
  descripcion: string;
  pais: string;
  ciudad: string;
  categoria: string;
  nivel_precio: string; // 'lujo'
  imagen_url: string;
  rating: number; // 4.9 (debe ser number)
  mejor_temporada: string;
  duracion: string;
  estimacion_presupuestaria: string;
  
  // 🚨 CORRECCIÓN 1: Arrays deben especificar el tipo de sus elementos
  galeria: string[]; // Debe ser Array de strings (URLs)
  Aspectos_destacados: string[]; // Debe ser Array de strings

  // 🚨 CORRECCIÓN 2: Tipo de ubicacion

  // Opción A: Si usaste el tipo nativo GeoPoint de Firestore
  ubicacion: GeoPoint; 
  
  // Opción B (Más probable): Si lo guardaste como un array [latitud, longitud]
  // ubicacion: number[]; 
  
  // Opción C (Menos probable): Si lo guardaste como un objeto con keys
  // ubicacion: { lat: number, lon: number };
}

@Injectable({
  providedIn: 'root'
})
// 1. Cambiamos el nombre de la clase a DestinoService (buena práctica)
export class DestinoService { 

  // 2. Inyectamos la dependencia Firestore en el constructor. 
  // Esto funciona porque lo proveímos en app.config.ts.
  constructor(private firestore: Firestore) { } 

  /**
   * Obtiene todos los documentos de la colección 'Destino' de Firebase.
   * @returns Un Observable que emite un array de Destino.
   */
  getTodosLosDestinos(): Observable<Destino[]> {
    // 3. Obtenemos la referencia a la colección de Firestore
    // Asegúrate que el nombre 'Destino' coincida con tu base de datos (mayúsculas/minúsculas)
    const destinosRef = collection(this.firestore, 'destinos'); 
    
    // 4. Utilizamos collectionData para escuchar los datos en tiempo real
    // { idField: 'id' } añade el ID de Firestore al objeto de TypeScript
    return collectionData(destinosRef, { idField: 'id' }) as Observable<Destino[]>;
  }
}