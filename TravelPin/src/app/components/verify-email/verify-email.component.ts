import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verify-container">
      <div class="verify-card">
        <div *ngIf="isVerifying" class="verify-loading">
          <div class="spinner"></div>
          <h2>Verificando tu correo electrónico...</h2>
          <p>Por favor espera un momento</p>
        </div>

        <div *ngIf="verificationSuccess" class="verify-success">
          <div class="icon-success">✓</div>
          <h2>¡Correo verificado exitosamente!</h2>
          <p>Tu cuenta ha sido activada. Iniciando sesión...</p>
        </div>

        <div *ngIf="verificationError" class="verify-error">
          <div class="icon-error">✗</div>
          <h2>Error en la verificación</h2>
          <p>{{ errorMessage }}</p>
          <button (click)="goToLogin()" class="btn-primary">Ir al inicio de sesión</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .verify-card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .verify-loading, .verify-success, .verify-error {
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .spinner {
      width: 64px;
      height: 64px;
      border: 6px solid #f3f3f3;
      border-top: 6px solid #667eea;
      border-radius: 50%;
      margin: 0 auto 24px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .icon-success {
      width: 80px;
      height: 80px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      margin: 0 auto 24px;
      animation: scaleIn 0.5s ease-out;
    }

    .icon-error {
      width: 80px;
      height: 80px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      margin: 0 auto 24px;
      animation: scaleIn 0.5s ease-out;
    }

    @keyframes scaleIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    h2 {
      color: #1f2937;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  isVerifying = true;
  verificationSuccess = false;
  verificationError = false;
  errorMessage = '';
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Obtener el token de verificación de los query params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (!token) {
        this.showError('Token de verificación no proporcionado');
        return;
      }

      this.verifyEmail(token);
    });
  }

  verifyEmail(token: string): void {
    // Solo ejecutar en el navegador
    if (!this.isBrowser) return;
    
    // Llamar al endpoint de verificación del backend que ahora devuelve credenciales
    const url = `${environment.apiUrl}/verify-email-and-login?token=${encodeURIComponent(token)}`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.verificationSuccess = true;
        
        // Guardar la sesión del usuario automáticamente
        if (response.token && response.usuario) {
          const user = {
            uid: response.usuario.id.toString(),
            email: response.usuario.email,
            token: response.token
          };
          
          // Guardar en localStorage (solo en navegador)
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          
          // Actualizar el estado en AuthService (forzar la carga)
          this.authService['userSubject'].next(user);
        }
        
        // Redirigir al home después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (error) => {
        this.showError(error.error?.message || 'Error al verificar el correo electrónico');
      }
    });
  }

  showError(message: string): void {
    this.isVerifying = false;
    this.verificationError = true;
    this.errorMessage = message;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
