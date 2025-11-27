import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripExpensesComponent } from '../trip-expenses/trip-expenses.component';
import { TripMapComponent } from '../trip-map/trip-map.component';

interface Participante {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
  email?: string;
}

interface DestinoItinerario {
  id: number;
  nombre: string;
  pais: string;
  imagen: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface Recordatorio {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  completado: boolean;
}

interface DetalleViaje {
  id: number;
  nombre: string;
  icono: string;
  participantes: Participante[];
  itinerario: DestinoItinerario[];
  recordatorios: Recordatorio[];
  fechaCreacion: Date;
  fechaInicio?: string;
  fechaFin?: string;
}

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

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TripExpensesComponent, TripMapComponent],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.css']
})
export class TripDetailComponent implements OnInit {
  @Input() viajeId?: number;
  @Output() volver = new EventEmitter<void>();
  @Output() verDetalleDestino = new EventEmitter<number>();

  viaje?: DetalleViaje;
  nuevoAmigo: string = '';
  mostrarAgregarAmigo: boolean = false;
  mostrarGastos: boolean = false;
  mostrarMapa: boolean = false;
  
  // Propiedades para calificación
  mostrarModalCalificacion: boolean = false;
  calificacionSeleccionada: number = 0;
  resenaViaje: string = '';
  viajeCalificado: boolean = false;

  // Propiedades para recordatorios
  mostrarFormularioRecordatorio: boolean = false;
  nuevoRecordatorioTitulo: string = '';
  nuevoRecordatorioFecha: string = '';
  
  // Propiedades compartir...
mostrarModalCompartir: boolean = false;
enlaceInvitacion: string = '';
emailInvitacion: string = '';


  // Base de datos de destinos
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
    this.cargarDetalleViaje();
  }

  cargarDetalleViaje(): void {
    if (!this.viajeId) return;

    const colecciones = this.obtenerColecciones();
    const coleccion = colecciones.find(c => c.id === this.viajeId);

    if (coleccion) {
      this.viaje = {
        id: coleccion.id,
        nombre: coleccion.nombre,
        icono: coleccion.icono,
        fechaInicio: coleccion.fechaInicio,
        fechaFin: coleccion.fechaFin,
        participantes: [
          { id: '1', nombre: 'Usuario', iniciales: 'NU', color: '#FF6B6B', email: 'usuario@email.com' },
          { id: '2', nombre: 'Santiago', iniciales: 'SA', color: '#F9A826' }
        ],
        itinerario: coleccion.destinos
          .map((destinoId: number) => {
            const destino = this.destinosDB.find(d => d.id === destinoId);
            if (!destino) return null;
            return {
              id: destino.id,
              nombre: destino.nombre,
              pais: destino.pais,
              imagen: destino.imagen
            };
          })
          .filter((d): d is DestinoItinerario => d !== null),
        recordatorios: [
          {
            id: 1,
            titulo: 'Desayuno Familiar',
            descripcion: 'Nuevo Recordatorio',
            fecha: '26 de Sep 2025',
            completado: false
          }
        ],
        fechaCreacion: new Date(coleccion.fechaCreacion ?? Date.now())
      };

      // Verificar si el viaje está finalizado y calificado
      this.viajeCalificado = Boolean(coleccion.finalizado && coleccion.calificacion);
      this.calificacionSeleccionada = coleccion.calificacion ?? 0;
      this.resenaViaje = coleccion.reseña ?? '';
    }

    console.log('Detalle del viaje cargado:', this.viaje);
  }

  obtenerColecciones(): Coleccion[] {
    try {
      const data = localStorage.getItem('travelplus_colecciones');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al cargar colecciones:', error);
      return [];
    }
  }

  volverAtras(): void {
    this.volver.emit();
  }

  verGastos(): void {
    console.log('Ver gastos del viaje');
    this.mostrarGastos = true;
  }

  volverDeGastos(): void {
    this.mostrarGastos = false;
  }

  verMapa(): void {
    console.log('Ver mapa del viaje');
    this.mostrarMapa = true;
  }

  volverDeMapa(): void {
    this.mostrarMapa = false;
  }

  finalizarViaje(): void {
    if (!this.viaje) return;
    
    const confirmar = confirm('¿Deseas marcar este viaje como finalizado?');
    if (confirmar) {
      const colecciones = this.obtenerColecciones();
      const coleccion = colecciones.find(c => c.id === this.viajeId);
      
      if (coleccion) {
        coleccion.finalizado = true;
        localStorage.setItem('travelplus_colecciones', JSON.stringify(colecciones));
        this.mostrarModalCalificacion = true;
        alert('Viaje marcado como finalizado');
      }
    }
  }

  abrirModalCalificacion(): void {
    this.mostrarModalCalificacion = true;
  }

  cerrarModalCalificacion(): void {
    this.mostrarModalCalificacion = false;
  }

  seleccionarCalificacion(puntos: number): void {
    this.calificacionSeleccionada = puntos;
  }

  guardarCalificacion(): void {
    if (this.calificacionSeleccionada === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    const colecciones = this.obtenerColecciones();
    const coleccion = colecciones.find(c => c.id === this.viajeId);
    
    if (coleccion) {
      coleccion.finalizado = true;
      coleccion.calificacion = this.calificacionSeleccionada;
      coleccion.reseña = this.resenaViaje.trim();
      localStorage.setItem('travelplus_colecciones', JSON.stringify(colecciones));
      
      this.viajeCalificado = true;
      this.cerrarModalCalificacion();
      
      alert('¡Gracias por calificar tu viaje!');
    }
  }

  esViajeActivo(): boolean {
    const colecciones = this.obtenerColecciones();
    const coleccion = colecciones.find(c => c.id === this.viajeId);
    return !coleccion?.finalizado;
  }

  getEstrellas(): number[] {
    return [1, 2, 3, 4, 5];
  }

  mostrarFormularioAmigo(): void {
    this.mostrarAgregarAmigo = true;
  }

  agregarAmigo(): void {
    if (this.nuevoAmigo.trim() && this.viaje) {
      const iniciales = this.obtenerIniciales(this.nuevoAmigo);
      const nuevoParticipante: Participante = {
        id: Date.now().toString(),
        nombre: this.nuevoAmigo.trim(),
        iniciales: iniciales,
        color: this.generarColorAleatorio()
      };

      this.viaje.participantes.push(nuevoParticipante);
      this.guardarCambios();
      
      this.nuevoAmigo = '';
      this.mostrarAgregarAmigo = false;
    }
  }

  cancelarAgregarAmigo(): void {
    this.nuevoAmigo = '';
    this.mostrarAgregarAmigo = false;
  }

  eliminarParticipante(participante: Participante): void {
    if (!this.viaje) return;
    
    const confirmar = confirm(`¿Eliminar a ${participante.nombre} del viaje?`);
    if (confirmar) {
      this.viaje.participantes = this.viaje.participantes.filter(p => p.id !== participante.id);
      this.guardarCambios();
    }
  }

  verDestinoEnItinerario(destino: DestinoItinerario): void {
    console.log('Ver destino:', destino.nombre);
    this.verDetalleDestino.emit(destino.id);
  }

  eliminarDestinoItinerario(destino: DestinoItinerario): void {
    if (!this.viaje) return;
    
    const confirmar = confirm(`¿Eliminar ${destino.nombre} del itinerario?`);
    if (confirmar) {
      this.viaje.itinerario = this.viaje.itinerario.filter(d => d.id !== destino.id);
      
      const colecciones = this.obtenerColecciones();
      const coleccion = colecciones.find(c => c.id === this.viajeId);
      if (coleccion) {
        coleccion.destinos = coleccion.destinos.filter((id: number) => id !== destino.id);
        localStorage.setItem('travelplus_colecciones', JSON.stringify(colecciones));
      }
    }
  }

  toggleRecordatorio(recordatorio: Recordatorio): void {
    recordatorio.completado = !recordatorio.completado;
    this.guardarCambios();
  }

  eliminarRecordatorio(recordatorio: Recordatorio): void {
    if (!this.viaje) return;
    
    this.viaje.recordatorios = this.viaje.recordatorios.filter(r => r.id !== recordatorio.id);
    this.guardarCambios();
  }

  mostrarFormularioNuevoRecordatorio(): void {
  this.mostrarFormularioRecordatorio = true;
  this.nuevoRecordatorioTitulo = '';
  this.nuevoRecordatorioFecha = '';
}

cancelarRecordatorio(): void {
  this.mostrarFormularioRecordatorio = false;
  this.nuevoRecordatorioTitulo = '';
  this.nuevoRecordatorioFecha = '';
}

agregarRecordatorio(): void {
  if (!this.viaje) return;
  
  if (!this.nuevoRecordatorioTitulo.trim()) {
    alert('Por favor ingresa un título para el recordatorio');
    return;
  }

  if (!this.nuevoRecordatorioFecha.trim()) {
    alert('Por favor selecciona una fecha');
    return;
  }

  const nuevoRecordatorio: Recordatorio = {
    id: Date.now(),
    titulo: this.nuevoRecordatorioTitulo.trim(),
    descripcion: 'Nuevo Recordatorio',
    fecha: this.formatearFecha(this.nuevoRecordatorioFecha),
    completado: false
  };
  
  this.viaje.recordatorios.push(nuevoRecordatorio);
  this.guardarCambios();
  this.cancelarRecordatorio();
}

formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

  guardarCambios(): void {
    console.log('Cambios guardados');
  }

  obtenerIniciales(nombre: string): string {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  generarColorAleatorio(): string {
    const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    return colores[Math.floor(Math.random() * colores.length)];
  }

 
abrirModalCompartir(): void {
  this.generarEnlaceInvitacion();
  this.mostrarModalCompartir = true;
}

cerrarModalCompartir(): void {
  this.mostrarModalCompartir = false;
  this.emailInvitacion = '';
}

generarEnlaceInvitacion(): void {
  // Generar un código único para el viaje
  const codigoViaje = `${this.viajeId}-${Date.now().toString(36)}`;
  
  // En producción, esto sería tu dominio real
  const baseUrl = window.location.origin;
  this.enlaceInvitacion = `${baseUrl}/unirse-viaje/${codigoViaje}`;
  
  // Guardar el código en localStorage para validación posterior
  const invitaciones = this.obtenerInvitaciones();
  invitaciones[codigoViaje] = {
    viajeId: this.viajeId,
    nombreViaje: this.viaje?.nombre,
    fechaCreacion: Date.now()
  };
  localStorage.setItem('travelplus_invitaciones', JSON.stringify(invitaciones));
}

obtenerInvitaciones(): any {
  try {
    const data = localStorage.getItem('travelplus_invitaciones');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
}

copiarEnlace(): void {
  navigator.clipboard.writeText(this.enlaceInvitacion).then(() => {
    alert('¡Enlace copiado al portapapeles!');
  }).catch(err => {
    console.error('Error al copiar:', err);
    // Fallback para navegadores que no soportan clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = this.enlaceInvitacion;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('¡Enlace copiado!');
  });
}

compartirPorEmail(): void {
  if (!this.emailInvitacion.trim()) {
    alert('Por favor ingresa un correo electrónico');
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.emailInvitacion)) {
    alert('Por favor ingresa un correo electrónico válido');
    return;
  }

  // En una app real, aquí enviarías el email a través de un backend
  // Por ahora, abrimos el cliente de email del usuario
  const asunto = `Invitación a ${this.viaje?.nombre}`;
  const cuerpo = `¡Hola! Te invito a unirte a mi viaje "${this.viaje?.nombre}".

Haz clic en este enlace para unirte:
${this.enlaceInvitacion}

¡Nos vemos pronto!`;

  const mailtoLink = `mailto:${this.emailInvitacion}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  window.location.href = mailtoLink;
  
  alert('Se abrirá tu cliente de email para enviar la invitación');
  this.cerrarModalCompartir();
}

compartirPorWhatsApp(): void {
  const mensaje = `¡Hola! Te invito a unirte a mi viaje "${this.viaje?.nombre}". 

Únete aquí: ${this.enlaceInvitacion}`;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  window.open(whatsappUrl, '_blank');
}

compartirPorRedes(): void {
  // Compartir usando la API nativa del navegador si está disponible
  if (navigator.share) {
    navigator.share({
      title: `Invitación a ${this.viaje?.nombre}`,
      text: `¡Únete a mi viaje!`,
      url: this.enlaceInvitacion
    }).catch(err => console.log('Error al compartir:', err));
  } else {
    this.copiarEnlace();
  }
}

// Reemplaza el método compartir() existente:
compartir(): void {
  this.abrirModalCompartir();
}


  getContadorParticipantes(): string {
    if (!this.viaje) return '0';
    const count = this.viaje.participantes.length;
    return count === 1 ? '1' : `${count}`;
  }

  getContadorItinerario(): string {
    if (!this.viaje) return '0';
    return `${this.viaje.itinerario.length}`;
  }
}