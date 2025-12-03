import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-join-trip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="join-container">
      <div class="join-card">
        <div class="icon" *ngIf="!cargando && !errorMensaje && !requiereLogin">✈️</div>
        <div class="icon error" *ngIf="errorMensaje">❌</div>
        <div class="icon login" *ngIf="requiereLogin">🔐</div>
        <div class="spinner" *ngIf="cargando"></div>
        
        <h1>{{ mensaje }}</h1>
        <p class="viaje-nombre" *ngIf="nombreViaje && !requiereLogin">{{ nombreViaje }}</p>
        
        <!-- Mostrar cuenta actual cuando está logueado -->
        <div class="cuenta-actual" *ngIf="!cargando && !errorMensaje && !requiereLogin && usuarioActual">
          <p class="cuenta-label">Te unirás con la cuenta:</p>
          <div class="cuenta-info">
            <span class="cuenta-avatar">{{ obtenerIniciales(nombreUsuarioActual) }}</span>
            <div class="cuenta-datos">
              <span class="cuenta-nombre">{{ nombreUsuarioActual }}</span>
              <span class="cuenta-email">{{ usuarioActual }}</span>
            </div>
          </div>
          <button class="btn-cambiar-cuenta" (click)="cambiarCuenta()">
            🔄 Usar otra cuenta
          </button>
        </div>
        
        <!-- Requiere iniciar sesión -->
        <div class="auth-required" *ngIf="requiereLogin">
          <p class="auth-mensaje">
            <strong>⚠️ Importante:</strong> Debes iniciar sesión con <strong>TU propia cuenta</strong> para unirte a este viaje.
          </p>
          <div class="auth-buttons">
            <button class="btn-login" (click)="irALogin()">
              🔑 Iniciar Sesión
            </button>
            <button class="btn-register" (click)="irARegistro()">
              📝 Crear Cuenta Nueva
            </button>
          </div>
        </div>
        
        <div class="acciones" *ngIf="!cargando && !errorMensaje && !yaUnido && !requiereLogin">
          <button class="btn-unirse" (click)="unirseAlViaje()">
            🎉 Unirme al viaje
          </button>
        </div>
        
        <div class="acciones" *ngIf="yaUnido">
          <button class="btn-ver" (click)="irAlViaje()">
            📍 Ver mi viaje
          </button>
        </div>
        
        <button class="btn-volver" (click)="volver()">
          ← Volver al inicio
        </button>
      </div>
    </div>
  `,
  styles: [`
    .join-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .join-card {
      background: white;
      padding: 50px 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    .icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    .icon.error {
      filter: grayscale(0);
    }
    .icon.login {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    h1 {
      color: #2D3748;
      font-size: 1.5rem;
      margin-bottom: 10px;
    }
    .viaje-nombre {
      color: #667eea;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
    }
    
    /* Estilos para mostrar cuenta actual */
    .cuenta-actual {
      background: linear-gradient(135deg, #f0f1ff 0%, #fff0f5 100%);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      border: 2px solid #667eea30;
    }
    .cuenta-label {
      color: #718096;
      font-size: 0.85rem;
      margin-bottom: 12px;
    }
    .cuenta-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .cuenta-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .cuenta-datos {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .cuenta-nombre {
      font-weight: 600;
      color: #2D3748;
      font-size: 1rem;
    }
    .cuenta-email {
      color: #718096;
      font-size: 0.85rem;
    }
    .btn-cambiar-cuenta {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }
    .btn-cambiar-cuenta:hover {
      background: #667eea;
      color: white;
    }
    
    .auth-required {
      margin: 20px 0;
    }
    .auth-mensaje {
      color: #718096;
      font-size: 0.95rem;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .auth-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn-login {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 30px;
      border-radius: 25px;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
    .btn-register {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
      padding: 12px 30px;
      border-radius: 25px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-register:hover {
      background: #667eea;
      color: white;
    }
    .acciones {
      margin-bottom: 20px;
    }
    .btn-unirse {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 30px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-unirse:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .btn-ver {
      background: #48BB78;
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 30px;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .btn-volver {
      background: transparent;
      color: #718096;
      border: none;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 0.9rem;
      margin-top: 15px;
    }
    .btn-volver:hover {
      color: #2D3748;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #E2E8F0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class JoinTripComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  codigoInvitacion: string = '';
  nombreViaje: string = '';
  viajeId: number | null = null;
  mensaje: string = 'Cargando invitación...';
  errorMensaje: boolean = false;
  cargando: boolean = true;
  yaUnido: boolean = false;
  requiereLogin: boolean = false;
  
  // Información del usuario actual
  usuarioActual: string = '';
  nombreUsuarioActual: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.codigoInvitacion = this.route.snapshot.params['codigo'];
    
    // Verificar si el usuario ya confirmó su cuenta para este link
    const invitacionConfirmada = this.isBrowser ? 
      localStorage.getItem('travelplus_invite_confirmed_' + this.codigoInvitacion) : null;
    
    if (invitacionConfirmada) {
      // El usuario ya confirmó su cuenta, continuar normal
      this.cargarDatosUsuarioActual();
      this.validarInvitacion();
    } else {
      // Primera vez accediendo al link - cerrar cualquier sesión existente
      // para que el usuario invitado use su propia cuenta
      this.forzarNuevaSesion();
    }
  }

  private forzarNuevaSesion(): void {
    if (this.isBrowser) {
      // Guardar el código de invitación
      localStorage.setItem('travelplus_pending_invite', this.codigoInvitacion);
      
      // Cerrar cualquier sesión existente
      this.authService.logout();
      
      // Mostrar pantalla de login requerido
      this.requiereLogin = true;
      this.mensaje = 'Inicia sesión con TU cuenta para unirte';
      this.cargando = false;
      
      // Obtener información del viaje para mostrar
      this.obtenerInfoViaje();
    }
  }

  private obtenerInfoViaje(): void {
    this.http.get<any>(`/api/invitaciones/${this.codigoInvitacion}`).subscribe({
      next: (response) => {
        if (response && response.viaje) {
          this.nombreViaje = response.viaje.nombre || 'Viaje';
          this.viajeId = response.invitacion?.viaje_id;
        }
      },
      error: () => {
        // Intentar desde localStorage
        if (this.isBrowser) {
          try {
            const invitaciones = JSON.parse(localStorage.getItem('travelplus_invitaciones') || '{}');
            const invitacion = invitaciones[this.codigoInvitacion];
            if (invitacion) {
              this.nombreViaje = invitacion.nombreViaje || 'Viaje';
              this.viajeId = invitacion.viajeId;
            }
          } catch (e) {}
        }
      }
    });
  }

  validarInvitacion(): void {
    if (!this.codigoInvitacion) {
      this.mensaje = 'Código de invitación inválido';
      this.errorMensaje = true;
      this.cargando = false;
      return;
    }

    // Primero intentar validar desde el backend
    this.http.get<any>(`/api/invitaciones/${this.codigoInvitacion}`).subscribe({
      next: (response) => {
        if (response && response.invitacion && response.invitacion.viaje_id) {
          this.viajeId = response.invitacion.viaje_id;
          if (response.viaje) {
            this.nombreViaje = response.viaje.nombre || 'Viaje';
          } else {
            this.nombreViaje = 'Viaje';
          }
          this.verificarAutenticacion();
        } else {
          this.validarDesdeLocalStorage();
        }
      },
      error: () => {
        // Si falla el backend, intentar con localStorage
        this.validarDesdeLocalStorage();
      }
    });
  }

  private verificarAutenticacion(): void {
    // Verificar si el usuario está logueado
    if (!this.authService.isLogged()) {
      this.requiereLogin = true;
      this.mensaje = 'Inicia sesión para unirte';
      this.cargando = false;
      
      // Guardar el código de invitación para después del login
      if (this.isBrowser) {
        localStorage.setItem('travelplus_pending_invite', this.codigoInvitacion);
      }
    } else {
      this.requiereLogin = false;
      this.mensaje = '¡Te han invitado a unirte!';
      this.cargando = false;
    }
  }

  private validarDesdeLocalStorage(): void {
    if (!this.isBrowser) {
      this.mensaje = 'No se puede validar en el servidor';
      this.errorMensaje = true;
      this.cargando = false;
      return;
    }

    try {
      const invitaciones = JSON.parse(localStorage.getItem('travelplus_invitaciones') || '{}');
      const invitacion = invitaciones[this.codigoInvitacion];
      
      if (invitacion) {
        this.nombreViaje = invitacion.nombreViaje || 'Viaje';
        this.viajeId = invitacion.viajeId;
        this.verificarAutenticacion();
      } else {
        this.mensaje = 'Esta invitación no es válida o ha expirado';
        this.errorMensaje = true;
        this.cargando = false;
      }
    } catch (error) {
      this.mensaje = 'Error al validar la invitación';
      this.errorMensaje = true;
      this.cargando = false;
    }
  }

  irALogin(): void {
    // Guardar el código de invitación para después del login
    if (this.isBrowser) {
      localStorage.setItem('travelplus_pending_invite', this.codigoInvitacion);
      // Marcar que el usuario va a confirmar su cuenta para este link
      localStorage.setItem('travelplus_invite_confirmed_' + this.codigoInvitacion, 'true');
    }
    this.router.navigate(['/login'], { 
      queryParams: { redirect: `/unirse-viaje/${this.codigoInvitacion}` } 
    });
  }

  irARegistro(): void {
    // Guardar el código de invitación para después del registro
    if (this.isBrowser) {
      localStorage.setItem('travelplus_pending_invite', this.codigoInvitacion);
      // Marcar que el usuario va a confirmar su cuenta para este link
      localStorage.setItem('travelplus_invite_confirmed_' + this.codigoInvitacion, 'true');
    }
    this.router.navigate(['/register'], { 
      queryParams: { redirect: `/unirse-viaje/${this.codigoInvitacion}` } 
    });
  }

  unirseAlViaje(): void {
    if (!this.viajeId) {
      alert('Error: No se pudo identificar el viaje');
      return;
    }

    // Verificar si el usuario está logueado
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.requiereLogin = true;
      this.mensaje = 'Debes iniciar sesión para unirte';
      return;
    }

    // Enviar el usuario_id para que el servidor obtenga los datos de la base de datos
    const participanteData = {
      usuario_id: user.uid,
      color: this.generarColorAleatorio()
    };

    this.cargando = true;
    this.mensaje = 'Uniéndote al viaje...';

    this.http.post<any>(`/api/viajes/${this.viajeId}/participantes`, participanteData).subscribe({
      next: (res) => {
        this.cargando = false;
        this.yaUnido = true;
        this.mensaje = '¡Te has unido exitosamente!';
        
        // Limpiar las marcas de invitación
        if (this.isBrowser) {
          localStorage.removeItem('travelplus_pending_invite');
          localStorage.removeItem('travelplus_invite_confirmed_' + this.codigoInvitacion);
        }
        
        // Agregar el viaje a las colecciones del usuario en localStorage
        this.agregarViajeAColecciones();
      },
      error: (err) => {
        console.error('Error al unirse:', err);
        this.cargando = false;
        
        // Limpiar las marcas de invitación
        if (this.isBrowser) {
          localStorage.removeItem('travelplus_pending_invite');
          localStorage.removeItem('travelplus_invite_confirmed_' + this.codigoInvitacion);
        }
        
        // Intentar de todos modos agregar localmente
        this.agregarViajeAColecciones();
        this.yaUnido = true;
        this.mensaje = '¡Te has unido al viaje!';
      }
    });
  }

  private agregarViajeAColecciones(): void {
    if (!this.isBrowser || !this.viajeId) return;

    const user = this.authService.getCurrentUser();
    const storageKey = user?.uid ? `travelplus_colecciones_${user.uid}` : 'travelplus_colecciones';

    try {
      const colecciones = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Verificar si ya existe
      if (!colecciones.find((c: any) => c.id === this.viajeId)) {
        colecciones.push({
          id: this.viajeId,
          nombre: this.nombreViaje,
          icono: '✈️',
          destinos: [],
          fechaCreacion: Date.now()
        });
        localStorage.setItem(storageKey, JSON.stringify(colecciones));
      }
    } catch (e) {
      console.error('Error al guardar en colecciones:', e);
    }
  }

  irAlViaje(): void {
    this.router.navigate(['/']);
  }

  volver(): void {
    this.router.navigate(['/']);
  }

  // Cargar datos del usuario actualmente logueado
  private cargarDatosUsuarioActual(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.usuarioActual = user.email || '';
      this.nombreUsuarioActual = user.email?.split('@')[0] || 'Usuario';
      
      // Intentar obtener el nombre real desde la base de datos
      if (user.uid && this.isBrowser) {
        this.http.get<any>(`/api/usuarios/${user.uid}`).subscribe({
          next: (usuario) => {
            if (usuario && usuario.nombre) {
              this.nombreUsuarioActual = usuario.nombre;
            }
          },
          error: () => {
            // Si falla, mantener el nombre del email
          }
        });
      }
    }
  }

  // Cambiar de cuenta - cerrar sesión y redirigir a login
  cambiarCuenta(): void {
    // Guardar el código de invitación para después del login
    if (this.isBrowser) {
      localStorage.setItem('travelplus_pending_invite', this.codigoInvitacion);
    }
    
    // Cerrar sesión actual
    this.authService.logout();
    
    // Redirigir a login con redirect al link de invitación
    this.router.navigate(['/login'], { 
      queryParams: { redirect: `/unirse-viaje/${this.codigoInvitacion}` } 
    });
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  private generarColorAleatorio(): string {
    const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    return colores[Math.floor(Math.random() * colores.length)];
  }
}