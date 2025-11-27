import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // 👈 Usamos HttpClient
import { Observable } from 'rxjs';
import { map, switchMap, filter } from 'rxjs/operators';
import { AuthService } from './auth.service'; // Usamos el AuthService adaptado a REST
import { Recopilacion } from '../models/recopilacion.model'; // Asegúrate de tener este modelo

// Interfaz para la respuesta del servidor (adaptada a tu backend)
interface RecopilacionResponse {
    message: string;
    data: Recopilacion[];
}

@Injectable({ providedIn: 'root' })
export class RecopilacionService {
    
    // 🚨 URL del endpoint en tu servidor Node.js (debes crearlo)
    private readonly API_URL = 'http://localhost:3000/api/recopilaciones';

    // 1. Inyección de HttpClient (para REST) y AuthService (para obtener el UID)
    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    // =======================================================
    // 2. OBTENER RECOPILACIONES DEL USUARIO (GET /api/recopilaciones/usuario/:userId)
    //    Reemplaza la lógica de collectionData y query
    // =======================================================
    getRecopilacionesDelUsuario(): Observable<Recopilacion[]> {
        
        // Usamos switchMap para obtener el UID del AuthService REST
        return this.authService.currentUserId$.pipe(
            // Aseguramos que el UID exista antes de hacer la llamada HTTP
            filter((uid): uid is string => !!uid), 
            
            switchMap(uid => {
                // Hacemos una petición GET al servidor con el ID del usuario
                const url = `${this.API_URL}/usuario/${uid}`; 
                
                return this.http.get<RecopilacionResponse>(url).pipe(
                    // Mapeamos la respuesta para devolver solo el array de datos
                    map(response => response.data || [])
                );
            })
        );
    }
    
    // --- Métodos Adicionales que necesitarás (Adaptados a REST) ---
    
    // CREAR (POST /api/recopilaciones)
    addRecopilacion(recopilacion: Partial<Recopilacion>): Observable<Recopilacion> {
        return this.http.post<Recopilacion>(this.API_URL, recopilacion); 
    }
    
    // ELIMINAR (DELETE /api/recopilaciones/:id)
    deleteRecopilacion(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`);
    }
}
