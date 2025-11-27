// src/app/services/viaje.service.ts

import { Injectable } from '@angular/core';
import { 
    Firestore, 
    collection, 
    collectionData, 
    query, 
    where,
    CollectionReference 
} from '@angular/fire/firestore';
import { Observable, switchMap, of } from 'rxjs';
import { AuthService } from './auth.service'; // Para obtener el UID del usuario logeado
import { Viaje } from '../models/viaje.model'; 

@Injectable({ providedIn: 'root' })
export class ViajeService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) { }

  /**
   * Obtiene todos los viajes en los que el usuario logeado es miembro.
   * Utiliza el UID del usuario para filtrar la lista 'miembros'.
   */
  getViajesDelUsuario(): Observable<Viaje[]> {
    return this.authService.currentUserId$.pipe(
      switchMap(userId => {
        // Si no hay UID (usuario no logeado), retorna un array vacío
        if (!userId) { 
          return of([]); 
        }
        
        const viajesRef = collection(this.firestore, 'Viaje') as CollectionReference<Viaje>; 
        
        // 🚨 FILTRO CLAVE: El usuario debe estar contenido en el array 'miembros'.
        // Nota: Firestore en un query normal (where) solo funciona si el campo
        // 'miembros' contiene exactamente el 'userId'
        // Si usas el email como ID de miembro:
        // const userEmail = 'sanchezaboytespaola@gmail.com'; // Necesitas obtener el email
        
        // Asumiendo que guardaste el EMAIL en 'miembros':
        const userEmail = 'sanchezaboytespaola@gmail.com'; // O pasas el email del AuthState
        
        const q = query(viajesRef, where('miembros', 'array-contains', userEmail)); 
        
        // Si usaste UID en el array:
        // const q = query(viajesRef, where('miembros', 'array-contains', userId)); 
        
        return collectionData(q, { idField: 'id' }) as Observable<Viaje[]>;
      })
    );
  }
}