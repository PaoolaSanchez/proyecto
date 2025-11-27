// src/app/services/auth.service.ts (ADAPTADO PARA REST/SQLITE)

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // 👈 Nuevo: Para hacer peticiones HTTP
import { Observable, BehaviorSubject, of } from 'rxjs'; // 👈 BehaviorSubject para manejar la sesión
import { map, catchError, tap } from 'rxjs/operators';

// Definición de tipos simplificados, ya no necesitamos los de Firebase
export type User = { uid: string; email: string; token: string; };

@Injectable({ providedIn: 'root' })
export class AuthService {
    
    // 🚨 URL de tu endpoint de login en el servidor Node.js
    private readonly API_URL_BASE = 'http://localhost:3000/api';
    private readonly LOGIN_URL = `${this.API_URL_BASE}/login`; // Asume que crearás un endpoint /api/login
    
    // Sujeto para mantener el estado del usuario logueado. Inicia en null (no logueado)
    private userSubject = new BehaviorSubject<User | null>(null);

    
    // Ya no inyectamos 'Auth', sino 'HttpClient'
    constructor(private http: HttpClient) { 
        // Recuperar el usuario del almacenamiento local al iniciar la app
        this.loadCurrentUser();
    }
    
    private loadCurrentUser(): void {
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            this.userSubject.next(JSON.parse(userJson));
        }
    }
    
    // Reemplazo de authState(this.auth). Observable que emite el usuario actual
    public get currentUser$(): Observable<User | null> {
        return this.userSubject.asObservable();
    }
    
    // Reemplazo de currentUserId$. Observable que emite el UID (ID de usuario)
    public get currentUserId$(): Observable<string | null> {
        return this.currentUser$.pipe(
            map(user => user ? user.uid : null)
        );
    }
    
    // =======================================================
    // 2. Reemplazo de login (POST a Node.js/SQLite)
    // =======================================================
    
    login(email: string, password: string): Promise<void> {
        // El servidor Node.js debe verificar las credenciales en SQLite
        return this.http.post<any>(this.LOGIN_URL, { email, password })
            .pipe(
                tap(response => {
                    // 🚨 ASUME que el backend devuelve { uid: '...', email: '...', token: '...' }
                    const user: User = { 
                        uid: response.uid, 
                        email: response.email,
                        token: response.token 
                    };
                    
                    // Almacenar la sesión localmente
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.userSubject.next(user);
                }),
                // Si la petición falla, debe ser manejada por la vista o un interceptor
                catchError(err => {
                    // Lanza el error para que el componente que llama lo capture
                    return Promise.reject(err);
                })
            )
            .toPromise() as Promise<void>; // Convertir a Promise<void> como tu código anterior
    }

    // =======================================================
    // 3. Reemplazo de logout (Limpieza Local)
    // =======================================================

    logout(): Promise<void> {
        // Limpiar el estado local y el almacenamiento
        localStorage.removeItem('currentUser');
        this.userSubject.next(null);
        
        // Puedes agregar una llamada al backend para invalidar el token si lo deseas
        // this.http.post(`${this.API_URL_BASE}/logout`, {}).subscribe();
        
        return Promise.resolve();
    }
    
    // Método de utilidad para saber si el usuario está logueado
    public isLogged(): boolean {
        return this.userSubject.value !== null;
    }
}