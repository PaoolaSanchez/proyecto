// src/app/services/recordatorio.service.ts

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
import { Recordatorio } from '../models/recordatorio.model'; 

@Injectable({ providedIn: 'root' })
export class RecordatorioService {
  constructor(private firestore: Firestore) { }

  /**
   * Obtiene todos los recordatorios para un Viaje específico.
   * @param viajeId El ID del viaje (ej. '68cc0183...')
   */
  getRecordatoriosByViajeId(viajeId: string): Observable<Recordatorio[]> {
    // 1. Referencia a la colección con tipado estricto
    const recordatoriosRef = collection(this.firestore, 'Recordatorio') as CollectionReference<Recordatorio>; 
    
    // 2. Consulta filtrada por el id_del_viaje
    const q = query(recordatoriosRef, where('id_del_viaje', '==', viajeId)); 
    
    // 3. Retornamos los datos
    return collectionData(q, { idField: 'id' }) as Observable<Recordatorio[]>;
  }
}