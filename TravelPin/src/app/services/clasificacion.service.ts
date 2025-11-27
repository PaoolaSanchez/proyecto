// src/app/services/clasificacion.service.ts

import { Injectable } from '@angular/core';
import { 
    Firestore, 
    collection, 
    collectionData, 
    query, 
    where,
    CollectionReference 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
// Asegúrate de que esta ruta apunte a tu nuevo modelo:
import { Clasificacion } from '../models/clasificacion.model'; 

@Injectable({ providedIn: 'root' })
export class ClasificacionService {
  constructor(private firestore: Firestore) { }

  /**
   * Obtiene todas las clasificaciones para un Destino específico.
   * @param destinoId El ID del destino (ej. '1')
   */
  getClasificacionesByDestinoId(destinoId: string): Observable<Clasificacion[]> {
    // 1. Referencia a la colección con tipado estricto
    const clasificacionRef = collection(this.firestore, 'Clasificacion') as CollectionReference<Clasificacion>; 
    
    // 2. Consulta filtrada por el id_de_destino
    const q = query(clasificacionRef, where('id_de_destino', '==', destinoId)); 
    
    // 3. Retornamos los datos
    return collectionData(q, { idField: 'id' }) as Observable<Clasificacion[]>;
  }

  // Opcional: Podrías añadir un método para calcular el promedio de clasificación aquí.
}