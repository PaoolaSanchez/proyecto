// src/app/services/trip-sync.service.ts
// Servicio para sincronización en tiempo real de viajes usando Server-Sent Events

import { Injectable, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface TripEvent {
  type: string;
  data: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class TripSyncService {
  private eventSource: EventSource | null = null;
  private currentViajeId: string | null = null;
  private isBrowser: boolean;
  private events$ = new Subject<TripEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Conectarse a la sincronización de un viaje
   */
  conectarAViaje(viajeId: string | number): Observable<TripEvent> {
    if (!this.isBrowser) {
      return this.events$.asObservable();
    }

    const viajeIdStr = viajeId.toString();
    
    // Si ya estamos conectados al mismo viaje, no reconectar
    if (this.currentViajeId === viajeIdStr && this.eventSource?.readyState === EventSource.OPEN) {
      return this.events$.asObservable();
    }

    // Desconectar de cualquier viaje anterior
    this.desconectar();

    // Obtener token de autenticación
    const user = this.authService.getCurrentUser();
    if (!user?.token) {
      console.warn('⚠️ No se puede conectar a sincronización sin token');
      return this.events$.asObservable();
    }

    this.currentViajeId = viajeIdStr;
    this.iniciarConexion(viajeIdStr, user.token);
    
    return this.events$.asObservable();
  }

  private iniciarConexion(viajeId: string, token: string): void {
    const url = `${environment.apiUrl}/viajes/${viajeId}/sync`;
    
    // EventSource no soporta headers, así que pasamos el token como query param
    // Nota: El backend debe aceptar el token también por query string
    const urlConToken = `${url}?token=${encodeURIComponent(token)}`;
    
    try {
      this.eventSource = new EventSource(urlConToken);
      
      this.eventSource.onopen = () => {
        console.log(`🔄 Conectado a sincronización del viaje ${viajeId}`);
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const data = JSON.parse(event.data);
            console.log('📡 Evento recibido:', data.type);
            this.events$.next(data);
          } catch (e) {
            console.error('Error parseando evento SSE:', e);
          }
        });
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ Error en conexión SSE:', error);
        
        // Cerrar conexión actual
        this.eventSource?.close();
        
        // Intentar reconectar
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          setTimeout(() => {
            if (this.currentViajeId) {
              const user = this.authService.getCurrentUser();
              if (user?.token) {
                this.iniciarConexion(this.currentViajeId, user.token);
              }
            }
          }, this.reconnectDelay);
        } else {
          console.warn('⚠️ Máximo de intentos de reconexión alcanzado');
          this.desconectar();
        }
      };
      
    } catch (error) {
      console.error('Error creando EventSource:', error);
    }
  }

  /**
   * Desconectarse de la sincronización actual
   */
  desconectar(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 Desconectado de sincronización');
    }
    this.currentViajeId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Verificar si está conectado
   */
  estaConectado(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Obtener el ID del viaje actual
   */
  getViajeActualId(): string | null {
    return this.currentViajeId;
  }
}
