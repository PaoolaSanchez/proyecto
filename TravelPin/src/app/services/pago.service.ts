// src/app/services/pago.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// 🚨 SOLUCIÓN: Agrupa CollectionReference con las demás funciones de AngularFire.
// AngularFire maneja la re-exportación de estos tipos.
import { 
    Firestore, 
    collection, 
    collectionData, 
    query, 
    where,
    CollectionReference, 
} from '@angular/fire/firestore'; 

import { Pago } from '../models/pago.model'; 

@Injectable({ providedIn: 'root' })
export class PagoService {
  constructor(private firestore: Firestore) { }

  getGastosByViajeId(viajeId: string): Observable<Pago[]> {
    // Línea 12: Ahora funciona correctamente con la importación unificada.
    const pagosRef = collection(this.firestore, 'Pago') as CollectionReference<Pago>; 
    
    // Línea 14: Esto es correcto y no debe dar error.
    const q = query(pagosRef, where('id_del_viaje', '==', viajeId)); 
    
    return collectionData(q, { idField: 'id' }) as Observable<Pago[]>;
  }
}