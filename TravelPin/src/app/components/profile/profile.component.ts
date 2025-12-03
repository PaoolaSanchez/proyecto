import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Usuario {
  nombre: string;
  email: string;
  avatar: string;
  iniciales: string;
  favoritos: number;
  viajes: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnChanges {
  @Output() navegarATab = new EventEmitter<string>();
  @Input() contadorFavoritos: number = 0;
  @Input() contadorViajes: number = 0;

  currentTab: string = 'perfil';
  private isBrowser: boolean;
  
  usuario: Usuario = {
    nombre: 'Nombre usuario',
    email: 'correoelectronico@usuario.com',
    avatar: '',
    iniciales: 'NU',
    favoritos: 0,
    viajes: 0
  };

  mostrarEditarPerfil: boolean = false;
  nombreTemporal: string = '';
  emailTemporal: string = '';
  
  // Tab de edición (perfil o password)
  tabEdicion: string = 'perfil';
  
  // Estados de carga
  guardandoPerfil: boolean = false;
  guardandoPassword: boolean = false;
  
  // Campos de contraseña
  passwordActual: string = '';
  passwordNueva: string = '';
  passwordConfirmar: string = '';
  
  // Mostrar/ocultar contraseñas
  mostrarPasswordActual: boolean = false;
  mostrarPasswordNueva: boolean = false;
  mostrarPasswordConfirmar: boolean = false;
  
  // Mensajes de estado
  mensajeEstado: string = '';
  esError: boolean = false;
  
  // Modal de confirmación de cierre de sesión
  mostrarModalConfirmLogout: boolean = false;
  
  // Modal de despedida de cierre de sesión
  mostrarModalLogout: boolean = false;
  mensajeLogout: string = '';
  contadorLogout: number = 3;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.actualizarContadores();
  }

  // Este método detecta cuando cambian los Inputs
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contadorFavoritos'] || changes['contadorViajes']) {
      this.actualizarContadores();
      console.log('Contadores actualizados:', {
        favoritos: this.contadorFavoritos,
        viajes: this.contadorViajes
      });
    }
  }

  actualizarContadores(): void {
    // Actualizar con los valores recibidos del componente padre
    this.usuario.favoritos = this.contadorFavoritos;
    this.usuario.viajes = this.contadorViajes;
  }

  cargarDatosUsuario(): void {
    if (!this.isBrowser) return;
    
    try {
      // Obtener usuario logueado si existe
      const currentUser = this.authService.getCurrentUser();
      
      if (currentUser && currentUser.email) {
        // Usuario logueado - cargar desde AuthService
        this.usuario.email = currentUser.email;
        this.usuario.nombre = currentUser.email.split('@')[0]; // Usar parte del email como nombre
        this.usuario.iniciales = this.obtenerIniciales(this.usuario.nombre);
        
        // Guardar en localStorage para persistencia
        this.guardarDatosUsuario();
        return;
      }

      // Si no hay usuario logueado, cargar desde localStorage
      const datosGuardados = localStorage.getItem('travelplus_usuario');
      if (datosGuardados) {
        const usuarioGuardado = JSON.parse(datosGuardados);
        this.usuario.nombre = usuarioGuardado.nombre;
        this.usuario.email = usuarioGuardado.email;
        this.usuario.iniciales = usuarioGuardado.iniciales;
        this.usuario.avatar = usuarioGuardado.avatar || '';
      } else {
        this.guardarDatosUsuario();
      }
    } catch (error) {
      console.log('Error al cargar datos del usuario:', error);
    }
  }

  guardarDatosUsuario(): void {
    if (!this.isBrowser) return;
    
    try {
      const datosUsuario = {
        nombre: this.usuario.nombre,
        email: this.usuario.email,
        iniciales: this.usuario.iniciales,
        avatar: this.usuario.avatar
      };
      localStorage.setItem('travelplus_usuario', JSON.stringify(datosUsuario));
    } catch (error) {
      console.error('Error al guardar datos del usuario:', error);
    }
  }

  abrirEditarPerfil(): void {
    this.nombreTemporal = this.usuario.nombre;
    this.emailTemporal = this.usuario.email;
    this.tabEdicion = 'perfil';
    this.limpiarCamposPassword();
    this.mensajeEstado = '';
    this.mostrarEditarPerfil = true;
  }

  cerrarEditarPerfil(): void {
    this.mostrarEditarPerfil = false;
    this.limpiarCamposPassword();
    this.mensajeEstado = '';
  }

  limpiarCamposPassword(): void {
    this.passwordActual = '';
    this.passwordNueva = '';
    this.passwordConfirmar = '';
    this.mostrarPasswordActual = false;
    this.mostrarPasswordNueva = false;
    this.mostrarPasswordConfirmar = false;
  }

  mostrarMensaje(mensaje: string, esError: boolean = false): void {
    this.mensajeEstado = mensaje;
    this.esError = esError;
    
    // Auto-ocultar mensaje después de 4 segundos
    setTimeout(() => {
      this.mensajeEstado = '';
    }, 4000);
  }

  guardarCambiosPerfil(): void {
    if (!this.nombreTemporal.trim()) {
      this.mostrarMensaje('Por favor ingresa tu nombre', true);
      return;
    }

    this.guardandoPerfil = true;
    this.mensajeEstado = '';

    // Llamar al backend para actualizar el perfil
    this.http.put<any>(`/api/usuarios/perfil/${encodeURIComponent(this.usuario.email)}`, {
      nombre: this.nombreTemporal.trim(),
      nuevoEmail: this.emailTemporal.trim()
    }).subscribe({
      next: (response) => {
        this.guardandoPerfil = false;
        if (response.success) {
          // Actualizar datos locales
          this.usuario.nombre = this.nombreTemporal.trim();
          this.usuario.iniciales = this.obtenerIniciales(this.usuario.nombre);
          this.guardarDatosUsuario();
          this.mostrarMensaje('✅ Perfil actualizado correctamente');
          
          // Cerrar modal después de un momento
          setTimeout(() => {
            this.cerrarEditarPerfil();
          }, 1500);
        } else {
          this.mostrarMensaje(response.message || 'Error al actualizar perfil', true);
        }
      },
      error: (error) => {
        this.guardandoPerfil = false;
        console.error('Error al actualizar perfil:', error);
        this.mostrarMensaje(error.error?.message || 'Error al conectar con el servidor', true);
      }
    });
  }

  cambiarPassword(): void {
    // Validaciones
    if (!this.passwordActual) {
      this.mostrarMensaje('Ingresa tu contraseña actual', true);
      return;
    }
    if (!this.passwordNueva) {
      this.mostrarMensaje('Ingresa la nueva contraseña', true);
      return;
    }
    if (this.passwordNueva.length < 6) {
      this.mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', true);
      return;
    }
    if (this.passwordNueva !== this.passwordConfirmar) {
      this.mostrarMensaje('Las contraseñas no coinciden', true);
      return;
    }

    this.guardandoPassword = true;
    this.mensajeEstado = '';

    // Llamar al backend para cambiar la contraseña
    this.http.put<any>(`/api/usuarios/cambiar-password/${encodeURIComponent(this.usuario.email)}`, {
      currentPassword: this.passwordActual,
      newPassword: this.passwordNueva
    }).subscribe({
      next: (response) => {
        this.guardandoPassword = false;
        if (response.success) {
          this.mostrarMensaje('✅ Contraseña actualizada correctamente');
          this.limpiarCamposPassword();
          
          // Cerrar modal después de un momento
          setTimeout(() => {
            this.cerrarEditarPerfil();
          }, 1500);
        } else {
          this.mostrarMensaje(response.message || 'Error al cambiar contraseña', true);
        }
      },
      error: (error) => {
        this.guardandoPassword = false;
        console.error('Error al cambiar contraseña:', error);
        this.mostrarMensaje(error.error?.message || 'Error al conectar con el servidor', true);
      }
    });
  }

  obtenerIniciales(nombre: string): string {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  cerrarSesion(): void {
    // Mostrar modal de confirmación
    this.mostrarModalConfirmLogout = true;
  }

  cancelarLogout(): void {
    this.mostrarModalConfirmLogout = false;
  }

  confirmarLogout(): void {
    // Cerrar modal de confirmación
    this.mostrarModalConfirmLogout = false;
    
    // Mostrar modal de despedida
    this.mostrarModalLogout = true;
    this.mensajeLogout = '¡Hasta pronto! Cerrando sesión...';
    this.contadorLogout = 3;
    
    // Usar AuthService para logout
    this.authService.logout().then(() => {
      // Limpiar datos locales del usuario
      if (this.isBrowser) {
        localStorage.removeItem('travelplus_usuario');
      }
      
      // Iniciar cuenta regresiva
      const intervalo = setInterval(() => {
        this.contadorLogout--;
        if (this.contadorLogout <= 0) {
          clearInterval(intervalo);
          this.mostrarModalLogout = false;
          // Emitir evento para ir al inicio y forzar recarga de la página
          this.navegarATab.emit('inicio');
          // Forzar recarga después de un pequeño delay
          setTimeout(() => {
            window.location.href = '/home';
          }, 100);
        }
      }, 1000);
    });
  }

  navegarTab(tab: string): void {
    this.currentTab = tab;
    this.navegarATab.emit(tab);
  }
}