// src/app/components/login/login.component.ts (Ejemplo conceptual)

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router'; // Para la navegación
import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true, 
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  
  
  imports: [FormsModule,
  CommonModule]
})
export class LoginComponent {
  
  email = '';
  password = '';
  errorMessage: string | null = null;
  showVerify = false;
  sendingVerification = false;
  googleAuthInProgress = false;

  // 1. Inyectar el servicio de autenticación y el router
  private redirectTo: string | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Leer query param `redirect` si existe
    this.route.queryParams.subscribe(params => {
      if (params['redirect']) {
        this.redirectTo = params['redirect'];
      }
      // Si backend redirige con token (ej. OAuth), intercambiarlo
      if (params['token']) {
        const token = params['token'];
        this.handleSocialToken(token);
      }
    });
  }

  private async handleSocialToken(token: string) {
    try {
      await this.authService.exchangeToken(token);
      if (this.redirectTo) {
        this.router.navigateByUrl(this.redirectTo);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (err) {
      console.error('Error exchanging social token', err);
      this.errorMessage = 'Error en inicio con proveedor externo.';
    }
  }

  /**
   * 2. Método llamado al enviar el formulario
   */
  async onLoginSubmit(): Promise<void> {
    this.errorMessage = null; // Limpiar errores anteriores

    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, introduce email y contraseña.';
      return;
    }

    try {
      // 3. Llamar al método login del servicio
      // Este método devuelve una Promise<void> que espera la respuesta del servidor Node.js
      await this.authService.login(this.email, this.password);

      // 4. Si la promesa se resuelve (login exitoso), navegar al origen (si existe)
      if (this.redirectTo) {
        this.router.navigateByUrl(this.redirectTo);
      } else {
        this.router.navigate(['/home']);
      }

    } catch (error: any) {
      // 5. Manejar errores del servidor (ej. 401 Credenciales inválidas)
      console.error('Error durante el login:', error);
      
      // Extraer mensaje de error de diferentes formatos posibles
      let errorMsg = 'Error de conexión. Inténtalo más tarde.';
      
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (typeof error.error === 'string') {
        errorMsg = error.error;
      } else if (typeof error.error === 'object' && error.error !== null) {
        errorMsg = error.error.error || error.error.message || JSON.stringify(error.error);
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      this.errorMessage = errorMsg;

      // Si el servidor indica que el email no ha sido verificado, mostrar opción
      if (error.error?.error === 'email_not_verified' || errorMsg.includes('email_not_verified')) {
        this.showVerify = true;
      }
    }
  }

  async sendVerification(): Promise<void> {
    if (!this.email) {
      alert('Introduce tu email para enviar verificación');
      return;
    }

    this.sendingVerification = true;
    try {
      await this.authService.sendVerification(this.email);
      alert('Correo de verificación enviado. Revisa tu bandeja.');
      this.showVerify = false;
    } catch (err) {
      console.error('Error enviando verificación', err);
      alert('No se pudo enviar el correo de verificación');
    } finally {
      this.sendingVerification = false;
    }
  }

  // Inicia flujo de login con Google abriendo una ventana y esperando token
  startGoogleLogin(): void {
    const origin = window.location.origin;
    const redirectParam = this.redirectTo ? `?redirect=${encodeURIComponent(this.redirectTo)}` : '';
    const oauthUrl = `http://localhost:3000/api/auth/google${redirectParam}`;

    // Open popup and poll for redirect with token
    const popup = window.open(oauthUrl, 'google_oauth', 'width=600,height=700');
    if (!popup) {
      alert('No se pudo abrir la ventana de autenticación');
      return;
    }

    this.googleAuthInProgress = true;

    const poll = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(poll);
          this.googleAuthInProgress = false;
          return;
        }

        // Si el popup redirige a nuestra misma origen y contiene token en query
        const popupUrl = popup.location.href;
        if (popupUrl && popup.location.origin === origin) {
          const params = new URL(popup.location.href).searchParams;
          const token = params.get('token');
          if (token) {
            clearInterval(poll);
            popup.close();
            this.googleAuthInProgress = false;
            this.handleSocialToken(token);
          }
        }
      } catch (e) {
        // cross-origin while OAuth provider in popup — ignore until redirect back to our origin
      }
    }, 500);
  }
}