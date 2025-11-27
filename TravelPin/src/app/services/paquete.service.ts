// src/app/services/paquete.service.ts

import { Injectable } from '@angular/core';
import { 
    Firestore, 
    collection, 
    collectionData, 
    CollectionReference 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
// Asegúrate de que esta ruta apunte a tu nuevo modelo:
import { PaqueteViaje } from '../models/paquete.model'; 

@Injectable({ providedIn: 'root' })
export class PaqueteService {
  constructor(private firestore: Firestore) { }

  /**
   * Obtiene todos los paquetes de viaje disponibles.
   */
  getTodosLosPaquetes(): Observable<PaqueteViaje[]> {
    // 1. Referencia a la colección con tipado estricto
    const paquetesRef = collection(this.firestore, 'Paquete de viaje') as CollectionReference<PaqueteViaje>; 
    
    // 2. Retornamos todos los documentos sin filtrar (solo lectura pública)
    return collectionData(paquetesRef, { idField: 'id' }) as Observable<PaqueteViaje[]>;
  }

  // Opcional: Si quieres obtener un solo paquete por su ID
  // getPaqueteById(paqueteId: string): Observable<PaqueteViaje | undefined> {
  //   const paqueteRef = doc(this.firestore, 'Paquete de viaje', paqueteId);
  //   return docData(paqueteRef, { idField: 'id' }) as Observable<PaqueteViaje | undefined>;
  // }
}