import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthHeadersService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Obtiene los headers de autenticación con el token JWT
   */
  getAuthHeaders(): { headers: HttpHeaders } {
    if (!this.isBrowser) {
      return { headers: new HttpHeaders() };
    }

    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser && currentUser.token) {
          console.log('🔐 AuthHeaders: Token encontrado');
          return {
            headers: new HttpHeaders({
              'Authorization': `Bearer ${currentUser.token}`,
              'Content-Type': 'application/json'
            })
          };
        }
      }
    } catch (e) {
      console.error('❌ AuthHeaders: Error al leer token:', e);
    }

    console.warn('⚠️ AuthHeaders: No hay token disponible');
    return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  }

  /**
   * Obtiene solo el token JWT
   */
  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        return currentUser?.token || null;
      }
    } catch (e) {
      console.error('Error al obtener token:', e);
    }
    return null;
  }
}
