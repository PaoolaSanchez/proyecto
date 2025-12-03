import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [FormsModule, CommonModule]
})
export class RegisterComponent {
  nombre = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  googleAuthInProgress = false;
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
    });
  }

  /**
   * Validar que las contraseñas coincidan
   */
  validatePasswords(): boolean {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }
    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }
    return true;
  }

  /**
   * Enviar formulario de registro
   */
  async onRegisterSubmit(): Promise<void> {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.nombre || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    if (!this.validatePasswords()) {
      return;
    }

    this.isLoading = true;
    try {
      // Llamar al servicio de registro
      const response = await this.authService.register(this.nombre, this.email, this.password);

      this.successMessage = 'Cuenta creada exitosamente. Redirigiendo...';
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        if (this.redirectTo) {
          this.router.navigateByUrl(this.redirectTo);
        } else {
          this.router.navigate(['/home']);
        }
      }, 1500);

    } catch (error: any) {
      console.error('Error durante el registro:', error);
      this.errorMessage = error.error?.error || 'Error al registrar. Intenta de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Inicia flujo de login con Google
   */
  startGoogleLogin(): void {
    const origin = window.location.origin;
    const redirectParam = this.redirectTo ? `?redirect=${encodeURIComponent(this.redirectTo)}` : '';
    const oauthUrl = `http://localhost:3000/api/auth/google${redirectParam}`;

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
        // cross-origin while OAuth provider in popup — ignore until redirect back
      }
    }, 500);
  }

  /**
   * Intercambiar token social por sesión de la app
   */
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
      this.errorMessage = 'Error en registro con proveedor externo.';
    }
  }

  /**
   * Navegar a login
   */
  goToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: this.redirectTo ? { redirect: this.redirectTo } : {}
    });
  }
}
