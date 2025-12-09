import { Component, OnInit, Output, EventEmitter, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AuthHeadersService } from '../../services/auth-headers.service';
import { environment } from '../../../environments/environment';

interface Coleccion {
  id: number;
  nombre: string;
  icono: string;
  destinos: number[];
  fechaCreacion?: number;
  fechaInicio?: string;
  fechaFin?: string;
  finalizado?: boolean;
  calificacion?: number;
  reseña?: string;
}

interface Viaje {
  id: number;
  nombre: string;
  icono: string;
  destinos: DestinoViaje[];
  fechaCreacion: Date;
  fechaInicio?: string;
  fechaFin?: string;
  finalizado?: boolean;
}

interface DestinoViaje {
  id: number;
  nombre: string;
  pais: string;
  imagen: string;
}

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent implements OnInit, OnDestroy {
  @Output() navegarATab = new EventEmitter<string>();
  @Output() verDetalle = new EventEmitter<number>();
  @Output() verDetalleViaje = new EventEmitter<number>();
  @Output() crearNuevoViaje = new EventEmitter<void>();

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private authHeaders = inject(AuthHeadersService);

  currentTab: string = 'viajes';
  viajes: Viaje[] = [];
  private colecciones: Coleccion[] = [];
  private intervalId: any;
  
  // Variables para el modal de crear viaje
  mostrarModalCrearViaje: boolean = false;
  nuevoViajeNombre: string = '';
  nuevoViajeFechaInicio: string = '';
  nuevoViajeFechaFin: string = '';
  
  // Variables para el modal de eliminar viaje
  mostrarModalEliminar: boolean = false;
  viajeAEliminar?: Viaje;
  eliminandoViaje: boolean = false;

  destinosDB = [
    {
      id: 1,
      nombre: 'Machu Picchu',
      pais: 'Perú',
      imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400'
    },
    {
      id: 2,
      nombre: 'Tokio',
      pais: 'Japón',
      imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400'
    },
    {
      id: 3,
      nombre: 'Maldivas',
      pais: 'Maldivas',
      imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400'
    },
    {
      id: 4,
      nombre: 'París',
      pais: 'Francia',
      imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400'
    },
    {
      id: 5,
      nombre: 'Cancún',
      pais: 'México',
      imagen: 'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=400'
    },
    {
      id: 6,
      nombre: 'Bali',
      pais: 'Indonesia',
      imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400'
    }
  ];

  constructor(private authService: AuthService) {}

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.uid) {
      return `travelplus_colecciones_${user.uid}`;
    }
    return 'travelplus_colecciones';
  }

  ngOnInit(): void {
    this.cargarViajes();
    this.verificarViajesFinalizados();
    
    this.intervalId = setInterval(() => {
      if (!this.mostrarModalCrearViaje) {
        this.verificarViajesFinalizados();
      }
    }, 30000); // 30 segundos
  }

  ngOnDestroy(): void {
    // Limpiar el intervalo cuando el componente se destruya
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  verificarViajesFinalizados(): void {
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    
    let huboActualizacion = false;
    
    this.colecciones.forEach(coleccion => {
      if (coleccion.fechaFin && !coleccion.finalizado) {
        const [dia, mes, anio] = coleccion.fechaFin.split('/').map(Number);
        const fechaFin = new Date(anio, mes - 1, dia);
        fechaFin.setHours(23, 59, 59, 999);
        
        if (fechaActual > fechaFin) {
          coleccion.finalizado = true;
          huboActualizacion = true;
          console.log(`Viaje "${coleccion.nombre}" marcado como finalizado automáticamente`);
        }
      }
    });
    
    if (huboActualizacion) {
      this.guardarEnLocalStorage();
    }
  }

  cargarViajes(): void {
    // Obtener el ID del usuario actual para filtrar sus viajes
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.uid || '';
    
    // Cargar viajes desde el backend filtrados por usuario (con headers de auth)
    this.http.get<any[]>(`${environment.apiUrl}/viajes?usuario_id=${usuarioId}`, this.authHeaders.getAuthHeaders()).subscribe({
      next: (viajesBackend) => {
        console.log('✅ Viajes cargados del backend:', viajesBackend);
        
        // Convertir viajes del backend al formato del componente
        this.viajes = viajesBackend.map(v => ({
          id: v.id,
          nombre: v.nombre,
          icono: v.icono || '✈️',
          destinos: (v.destinos || []).map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
            pais: d.pais,
            imagen: d.imagen || this.getImagenDestino(d.id)
          })),
          fechaCreacion: new Date(v.created_at || Date.now()),
          fechaInicio: v.fecha_inicio || v.fechaInicio,
          fechaFin: v.fecha_fin || v.fechaFin,
          finalizado: v.finalizado
        }));
        
        // También actualizar colecciones para mantener compatibilidad
        this.colecciones = viajesBackend.map(v => ({
          id: v.id,
          nombre: v.nombre,
          icono: v.icono || '✈️',
          destinos: (v.destinos || []).map((d: any) => d.id),
          fechaCreacion: Date.now(),
          fechaInicio: v.fecha_inicio || v.fechaInicio,
          fechaFin: v.fecha_fin || v.fechaFin,
          finalizado: v.finalizado
        }));
      },
      error: (error) => {
        console.error('Error al cargar viajes del backend:', error);
        // Fallback: cargar desde localStorage
        this.cargarDesdeLocalStorage();
        this.convertirColeccionesAViajes(this.colecciones);
      }
    });
  }

  private getImagenDestino(destinoId: number): string {
    const destino = this.destinosDB.find(d => d.id === destinoId);
    return destino?.imagen || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400';
  }

  cargarDesdeLocalStorage(): void {
    if (!this.isBrowser) return;
    
    try {
      const storageKey = this.getStorageKey();
      const data = localStorage.getItem(storageKey);
      if (data) {
        this.colecciones = JSON.parse(data);
      } else {
        this.colecciones = [];
      }
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
    }
  }

  guardarEnLocalStorage(): void {
    try {
      const storageKey = this.getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(this.colecciones));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  convertirColeccionesAViajes(colecciones: any[]): void {
    this.viajes = colecciones.map(coleccion => {
      const destinosCompletos = coleccion.destinos
        .map((destinoId: number) => {
          const destino = this.destinosDB.find(d => d.id === destinoId);
          return destino ? {
            id: destino.id,
            nombre: destino.nombre,
            pais: destino.pais,
            imagen: destino.imagen
          } : null;
        })
        .filter((d: any) => d !== null);

      return {
        id: coleccion.id,
        nombre: coleccion.nombre,
        icono: coleccion.icono,
        destinos: destinosCompletos,
        fechaCreacion: new Date(coleccion.fechaCreacion || Date.now()),
        fechaInicio: coleccion.fechaInicio,
        fechaFin: coleccion.fechaFin,
        finalizado: coleccion.finalizado || false
      };
    });
  }

  irADetalleViaje(viaje: Viaje): void {
    console.log('Ver detalle del viaje:', viaje.nombre);
    this.verDetalleViaje.emit(viaje.id);
  }

  verDetalleDestino(destinoId: number): void {
    console.log('Ver detalle del destino:', destinoId);
    this.verDetalle.emit(destinoId);
  }

  crearViaje(): void {
    this.mostrarModalCrearViaje = true;
    this.nuevoViajeNombre = '';
    this.nuevoViajeFechaInicio = '';
    this.nuevoViajeFechaFin = '';
  }

  cerrarModalCrearViaje(): void {
    this.mostrarModalCrearViaje = false;
    this.nuevoViajeNombre = '';
    this.nuevoViajeFechaInicio = '';
    this.nuevoViajeFechaFin = '';
  }

  guardarNuevoViaje(): void {
    if (!this.nuevoViajeNombre.trim()) {
      alert('Por favor ingresa el nombre del viaje');
      return;
    }

    if (!this.nuevoViajeFechaInicio.trim()) {
      alert('Por favor ingresa la fecha de inicio');
      return;
    }

    if (!this.nuevoViajeFechaFin.trim()) {
      alert('Por favor ingresa la fecha de finalización');
      return;
    }

    if (!this.validarFormatoFecha(this.nuevoViajeFechaInicio) || 
        !this.validarFormatoFecha(this.nuevoViajeFechaFin)) {
      alert('Formato de fecha inválido. Usa DD/MM/YYYY');
      return;
    }

    if (!this.validarFechas(this.nuevoViajeFechaInicio, this.nuevoViajeFechaFin)) {
      alert('La fecha de finalización debe ser posterior a la fecha de inicio');
      return;
    }

    const iconos = ['🏖️', '🏔️', '🏛️', '🌴', '🗼', '🏰', '🌊', '🎭'];
    const icono = iconos[Math.floor(Math.random() * iconos.length)];

    // Obtener el ID del usuario actual
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.uid ? parseInt(currentUser.uid) : null;

    // Crear viaje en el backend primero para obtener un ID válido
    // El servidor obtiene automáticamente los datos del usuario de la base de datos
    const viajeData = {
      nombre: this.nuevoViajeNombre.trim(),
      icono: icono,
      destinos: [],
      fechaInicio: this.nuevoViajeFechaInicio,
      fechaFin: this.nuevoViajeFechaFin,
      usuario_id: usuarioId
    };

    this.http.post<{ id: number }>(`${environment.apiUrl}/viajes`, viajeData, this.authHeaders.getAuthHeaders()).subscribe({
      next: (response) => {
        // Usar el ID del backend
        const nuevaColeccion: Coleccion = {
          id: response.id,
          nombre: this.nuevoViajeNombre.trim(),
          icono: icono,
          destinos: [],
          fechaCreacion: Date.now(),
          fechaInicio: this.nuevoViajeFechaInicio,
          fechaFin: this.nuevoViajeFechaFin,
          finalizado: false
        };

        this.colecciones.push(nuevaColeccion);
        this.guardarEnLocalStorage();
        this.cargarViajes();

        console.log('Nueva colección creada con ID del backend:', nuevaColeccion);
        this.cerrarModalCrearViaje();
      },
      error: (error) => {
        console.error('Error al crear viaje en backend:', error);
        // Fallback a ID local si falla el backend
        const nuevaColeccion: Coleccion = {
          id: Date.now(),
          nombre: this.nuevoViajeNombre.trim(),
          icono: icono,
          destinos: [],
          fechaCreacion: Date.now(),
          fechaInicio: this.nuevoViajeFechaInicio,
          fechaFin: this.nuevoViajeFechaFin,
          finalizado: false
        };

        this.colecciones.push(nuevaColeccion);
        this.guardarEnLocalStorage();
        this.cargarViajes();

        console.log('Nueva colección creada con ID local (fallback):', nuevaColeccion);
        this.cerrarModalCrearViaje();
      }
    });
  }

  validarFormatoFecha(fecha: string): boolean {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(fecha);
  }

  validarFechas(fechaInicio: string, fechaFin: string): boolean {
    const [diaI, mesI, anioI] = fechaInicio.split('/').map(Number);
    const [diaF, mesF, anioF] = fechaFin.split('/').map(Number);
    
    const inicio = new Date(anioI, mesI - 1, diaI);
    const fin = new Date(anioF, mesF - 1, diaF);
    
    return fin > inicio;
  }

  getDiasRestantes(viaje: Viaje): number | null {
    if (!viaje.fechaInicio || viaje.finalizado) return null;
    
    // Intentar parsear fecha en formato dd/mm/yyyy o yyyy-mm-dd
    let fechaInicio: Date;
    if (viaje.fechaInicio.includes('/')) {
      const [dia, mes, anio] = viaje.fechaInicio.split('/').map(Number);
      fechaInicio = new Date(anio, mes - 1, dia);
    } else {
      fechaInicio = new Date(viaje.fechaInicio);
    }
    
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const diferencia = fechaInicio.getTime() - fechaActual.getTime();
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    return dias >= 0 ? dias : null;
  }

  getMensajeDiasRestantes(viaje: Viaje): string {
    const dias = this.getDiasRestantes(viaje);
    
    if (dias === null) return '';
    if (dias === 0) return '¡Comienza hoy!';
    if (dias === 1) return 'Comienza mañana';
    return `Faltan ${dias} días`;
  }

  eliminarViaje(viaje: Viaje, event: Event): void {
    event.stopPropagation();
    this.viajeAEliminar = viaje;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar(): void {
    this.mostrarModalEliminar = false;
    this.viajeAEliminar = undefined;
  }

  confirmarEliminar(): void {
    if (!this.viajeAEliminar) return;
    
    this.eliminandoViaje = true;
    
    // Eliminar del backend
    this.http.delete(`${environment.apiUrl}/viajes/${this.viajeAEliminar.id}`, this.authHeaders.getAuthHeaders()).subscribe({
      next: () => {
        console.log('✅ Viaje eliminado del backend:', this.viajeAEliminar?.nombre);
        
        // También eliminar de localStorage por compatibilidad
        const index = this.colecciones.findIndex(c => c.id === this.viajeAEliminar?.id);
        if (index > -1) {
          this.colecciones.splice(index, 1);
          this.guardarEnLocalStorage();
        }
        
        // Recargar viajes
        this.cargarViajes();
        
        this.eliminandoViaje = false;
        this.mostrarModalEliminar = false;
        this.viajeAEliminar = undefined;
      },
      error: (error) => {
        console.error('Error al eliminar viaje:', error);
        this.eliminandoViaje = false;
        
        // Intentar eliminar solo de localStorage si el backend falla
        const index = this.colecciones.findIndex(c => c.id === this.viajeAEliminar?.id);
        if (index > -1) {
          this.colecciones.splice(index, 1);
          this.guardarEnLocalStorage();
          this.cargarViajes();
        }
        
        this.mostrarModalEliminar = false;
        this.viajeAEliminar = undefined;
      }
    });
  }

  editarViaje(viaje: Viaje, event: Event): void {
    event.stopPropagation();
    
    const nuevoNombre = prompt('Nuevo nombre para el viaje:', viaje.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
      const coleccion = this.colecciones.find(c => c.id === viaje.id);
      if (coleccion) {
        coleccion.nombre = nuevoNombre.trim();
        this.guardarEnLocalStorage();
        this.cargarViajes();
        console.log('Viaje renombrado:', nuevoNombre);
      }
    }
  }

  navegarTab(tab: string): void {
    this.currentTab = tab;
    this.navegarATab.emit(tab);
    console.log('Navegar a tab:', tab);
  }

  getFechaFormateada(fecha: Date): string {
    const opciones: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'short' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  }

  getContadorDestinos(viaje: Viaje): string {
    const count = viaje.destinos.length;
    return count === 1 ? '1 Destino' : `${count} Destinos`;
  }

  getEstadoViaje(viaje: Viaje): string {
    return viaje.finalizado ? 'Finalizado' : 'Próximo';
  }
}