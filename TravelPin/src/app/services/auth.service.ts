// src/app/services/auth.service.ts 

import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http'; 
import { Observable, BehaviorSubject, of, throwError } from 'rxjs'; 
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Definición de tipos simplificados, ya no necesitamos los de Firebase
export type User = { uid: string; email: string; token: string; };

@Injectable({ providedIn: 'root' })
export class AuthService {
    
    // 🚨 URL de tu endpoint de login en el servidor Node.js
    private readonly API_URL_BASE = environment.apiUrl;
    private readonly LOGIN_URL = `${this.API_URL_BASE}/auth/login`; // Usar /api/auth/login en el backend
    private readonly REGISTER_URL = `${this.API_URL_BASE}/auth/register`; // Registro de usuario
    
    // Sujeto para mantener el estado del usuario logueado. Inicia en null (no logueado)
    private userSubject = new BehaviorSubject<User | null>(null);
    private isBrowser: boolean;

    
    // Ya no inyectamos 'Auth', sino 'HttpClient'
    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: Object
    ) { 
        this.isBrowser = isPlatformBrowser(platformId);
        // Recuperar el usuario del almacenamiento local al iniciar la app (solo en navegador)
        this.loadCurrentUser();
    }
    
    private loadCurrentUser(): void {
        if (!this.isBrowser) return; // Solo acceder a localStorage en el navegador
        
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
                    // Mapear respuesta del backend { token, usuario: { id, nombre, email, avatar } }
                    const user: User = { 
                        uid: response.usuario.id.toString(), 
                        email: response.usuario.email,
                        token: response.token 
                    };
                    
                    // Almacenar la sesión localmente (solo en navegador)
                    if (this.isBrowser) {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    }
                    this.userSubject.next(user);
                }),
                // Si la petición falla, extraer mensaje de error
                catchError(err => {
                    // Extraer mensaje de error del HttpErrorResponse
                    let errorMessage = 'Error de conexión';
                    if (err.error) {
                        if (typeof err.error === 'string') {
                            errorMessage = err.error;
                        } else if (err.error.error) {
                            errorMessage = err.error.error;
                        } else if (err.error.message) {
                            errorMessage = err.error.message;
                        }
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                    return throwError(() => new Error(errorMessage));
                })
            )
            .toPromise() as Promise<void>; 
    }

    // Registro de nuevo usuario
    register(nombre: string, email: string, password: string): Promise<any> {
        return this.http.post<any>(this.REGISTER_URL, { nombre, email, password })
            .pipe(
                tap(response => {
                    // El backend devuelve { usuario: { id, nombre, email }, token }
                    const user: User = {
                        uid: response.usuario.id.toString(),
                        email: response.usuario.email,
                        token: response.token
                    };

                    // Almacenar la sesión localmente (solo en navegador)
                    if (this.isBrowser) {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    }
                    this.userSubject.next(user);
                }),
                catchError(err => {
                    let errorMessage = 'Error al registrar';
                    if (err.error) {
                        if (typeof err.error === 'string') {
                            errorMessage = err.error;
                        } else if (err.error.error) {
                            errorMessage = err.error.error;
                        } else if (err.error.message) {
                            errorMessage = err.error.message;
                        }
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                    return throwError(() => new Error(errorMessage));
                })
            )
            .toPromise() as Promise<any>;
    }

    // Solicita que el backend reenvíe un correo de verificación al email
    sendVerification(email: string): Promise<void> {
        const url = `${this.API_URL_BASE}/send-verification`;
        return this.http.post<any>(url, { email })
            .pipe(
                tap(() => {}),
                catchError(err => throwError(() => err))
            ).toPromise() as Promise<void>;
    }

    // Intercambia un token recibido desde un proveedor social o middleware
    // por los datos del usuario en el backend.
    exchangeToken(token: string): Promise<void> {
        const url = `${this.API_URL_BASE}/auth/exchange-token`;
        return this.http.post<any>(url, { token })
            .pipe(
                tap(response => {
                    const user: User = {
                        uid: response.uid,
                        email: response.email,
                        token: response.token
                    };
                    if (this.isBrowser) {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    }
                    this.userSubject.next(user);
                }),
                catchError(err => throwError(() => err))
            ).toPromise() as Promise<void>;
    }

    // =======================================================
    // 3. Reemplazo de logout (Limpieza Local)
    // =======================================================

    logout(): Promise<void> {
        // Limpiar el estado local y el almacenamiento (solo en navegador)
        if (this.isBrowser) {
            // Claves usadas por la app: `currentUser` y `travelplus_usuario` (perfil local)
            localStorage.removeItem('currentUser');
            localStorage.removeItem('travelplus_usuario');
            // Elimina cualquier otra clave de sesión conocida (por si acaso)
            try {
                const keysToRemove = ['session_token', 'auth_token', 'usuario_session'];
                keysToRemove.forEach(k => localStorage.removeItem(k));
            } catch (e) {
                // ignorar errores de localStorage
            }
        }
        this.userSubject.next(null);
        
         this.http.post(`${this.API_URL_BASE}/logout`, {}).subscribe();
        
        return Promise.resolve();
    }
    
    // Método de utilidad para saber si el usuario está logueado
    public isLogged(): boolean {
        return this.userSubject.value !== null;
    }

    // Obtener el usuario actual (sincronamente)
    public getCurrentUser(): User | null {
        return this.userSubject.value;
    }
}