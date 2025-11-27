import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  currentTab: string = 'viajes';
  viajes: Viaje[] = [];
  private colecciones: Coleccion[] = [];
  private intervalId: any;
  
  // Variables para el modal de crear viaje
  mostrarModalCrearViaje: boolean = false;
  nuevoViajeNombre: string = '';
  nuevoViajeFechaInicio: string = '';
  nuevoViajeFechaFin: string = '';

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

  ngOnInit(): void {
    this.cargarViajes();
    this.verificarViajesFinalizados();
    
    this.intervalId = setInterval(() => {
      if (!this.mostrarModalCrearViaje) {
        this.verificarViajesFinalizados();
        this.cargarViajes();
      }
    }, 10000); // 10 segundos en lugar de 1 segundo
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
      this.cargarViajes();
    }
  }

  cargarViajes(): void {
    this.cargarDesdeLocalStorage();
    this.convertirColeccionesAViajes(this.colecciones);
  }

  cargarDesdeLocalStorage(): void {
    try {
      const data = localStorage.getItem('travelplus_colecciones');
      if (data) {
        this.colecciones = JSON.parse(data);
      } else {
        this.colecciones = [];
        this.guardarEnLocalStorage();
      }
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
    }
  }

  guardarEnLocalStorage(): void {
    try {
      localStorage.setItem('travelplus_colecciones', JSON.stringify(this.colecciones));
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

    console.log('Nueva colección creada:', nuevaColeccion);
    this.cerrarModalCrearViaje();
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
    if (!viaje.fechaFin || viaje.finalizado) return null;
    
    const [dia, mes, anio] = viaje.fechaFin.split('/').map(Number);
    const fechaFin = new Date(anio, mes - 1, dia);
    const fechaActual = new Date();
    
    fechaActual.setHours(0, 0, 0, 0);
    fechaFin.setHours(0, 0, 0, 0);
    
    const diferencia = fechaFin.getTime() - fechaActual.getTime();
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    
    return dias >= 0 ? dias : null;
  }

  getMensajeDiasRestantes(viaje: Viaje): string {
    const dias = this.getDiasRestantes(viaje);
    
    if (dias === null) return '';
    if (dias === 0) return 'Termina hoy';
    if (dias === 1) return 'Termina mañana';
    return `Faltan ${dias} días`;
  }

  eliminarViaje(viaje: Viaje, event: Event): void {
    event.stopPropagation();
    
    const confirmar = confirm(`¿Estás seguro de eliminar "${viaje.nombre}"?`);
    if (confirmar) {
      const index = this.colecciones.findIndex(c => c.id === viaje.id);
      if (index > -1) {
        this.colecciones.splice(index, 1);
        this.guardarEnLocalStorage();
        this.cargarViajes();
        console.log('Viaje eliminado:', viaje.nombre);
      }
    }
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