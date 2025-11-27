import { Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
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
    this.mostrarEditarPerfil = true;
  }

  cerrarEditarPerfil(): void {
    this.mostrarEditarPerfil = false;
  }

  guardarCambiosPerfil(): void {
    if (this.nombreTemporal.trim() && this.emailTemporal.trim()) {
      this.usuario.nombre = this.nombreTemporal.trim();
      this.usuario.email = this.emailTemporal.trim();
      this.usuario.iniciales = this.obtenerIniciales(this.usuario.nombre);
      this.guardarDatosUsuario();
      this.cerrarEditarPerfil();
      alert('Perfil actualizado correctamente');
    } else {
      alert('Por favor completa todos los campos');
    }
  }

  obtenerIniciales(nombre: string): string {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  cerrarSesion(): void {
    const confirmar = confirm('¿Estás seguro que deseas cerrar sesión?');
    if (confirmar) {
      if (this.isBrowser) {
        localStorage.removeItem('travelplus_usuario');
      }
      alert('Sesión cerrada');
      this.navegarTab('inicio');
    }
  }

  navegarTab(tab: string): void {
    this.currentTab = tab;
    this.navegarATab.emit(tab);
  }
}