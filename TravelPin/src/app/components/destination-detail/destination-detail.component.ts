import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionsModalComponent } from '../collections-modal/collections-modal.component';
import { DestinosService, DestinoCompleto } from '../../services/destinos.service';

interface Destino {
  id: number;
  nombre: string;
  pais: string;
  imagenPrincipal: string;
  imagenesGaleria: string[];
  descripcion: string;
  queHacer: string[];
  detallesViaje: {
    mejorEpoca: string;
    duracionRecomendada: string;
    presupuestoPromedio: string;
  };
  consejos: string[];
  queEllevar: string[];
  emergencias: {
    policia: string;
    bomberos: string;
    ambulancia: string;
    embajada: string;
  };
}

interface Agencia {
  id: number;
  nombre: string;
  logo: string;
  rating: number;
  descripcion: string;
  destinos: number[];
  especialidad: string;
}

interface PaqueteViaje {
  id: number;
  agenciaId: number;
  destinoId: number;
  nombrePaquete: string;
  duracion: string;
  precio: number;
  incluye: string[];
  itinerario: ItemItinerario[];
  gastos: GastoDetallado[];
}

interface ItemItinerario {
  dia: number;
  actividad: string;
  descripcion: string;
}

interface GastoDetallado {
  concepto: string;
  monto: number;
  categoria: 'transporte' | 'hospedaje' | 'comida' | 'actividades' | 'otros';
}

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CollectionsModalComponent],
  templateUrl: './destination-detail.component.html',
  styleUrls: ['./destination-detail.component.css']
})
export class DestinationDetailComponent implements OnInit {
  @Input() destino?: Destino;
  @Input() destinoId?: number;
  @Output() volver = new EventEmitter<void>();
  @Output() navegarAViajes = new EventEmitter<void>();

  destinoActual?: DestinoCompleto;
  tabActiva: string = 'informacion';
  mostrarColecciones: boolean = false;

  // Variables para agencias
  agenciaSeleccionada?: Agencia;
  paqueteSeleccionado?: PaqueteViaje;
  mostrarDetalleAgencia: boolean = false;
  mostrarDetallePaquete: boolean = false;

  // Datos del formulario de reserva
  nombreCliente: string = '';
  emailCliente: string = '';
  telefonoCliente: string = '';
  fechaSalida: string = '';
  numPersonas: number = 1;

  constructor(private destinosService: DestinosService) {}

  // Datos de agencias
  agencias: Agencia[] = [
    {
      id: 1,
      nombre: 'Viajes Globales',
      logo: '🌎',
      rating: 4.8,
      descripcion: 'Expertos en viajes internacionales',
      destinos: [1, 2, 3, 4, 5, 6],
      especialidad: 'Internacional'
    },
    {
      id: 2,
      nombre: 'Aventura Total',
      logo: '⛰️',
      rating: 4.9,
      descripcion: 'Especialistas en turismo de aventura',
      destinos: [1, 8],
      especialidad: 'Aventura'
    },
    {
      id: 3,
      nombre: 'Playas Paradisíacas',
      logo: '🏖️',
      rating: 4.7,
      descripcion: 'Los mejores destinos de playa',
      destinos: [3, 5, 6, 9],
      especialidad: 'Playa'
    },
    {
      id: 4,
      nombre: 'City Tours Pro',
      logo: '🏙️',
      rating: 4.6,
      descripcion: 'Tours urbanos y culturales',
      destinos: [2, 4, 7, 11, 12],
      especialidad: 'Ciudad'
    }
  ];

  paquetes: PaqueteViaje[] = [
    {
      id: 1,
      agenciaId: 1,
      destinoId: 4,
      nombrePaquete: 'París Romántico - 5 días',
      duracion: '5 días / 4 noches',
      precio: 15000,
      incluye: [
        'Vuelo redondo',
        'Hotel 4 estrellas',
        'Desayunos incluidos',
        'Tour por la Torre Eiffel',
        'Crucero por el Sena',
        'Guía en español'
      ],
      itinerario: [
        { dia: 1, actividad: 'Llegada a París', descripcion: 'Transfer al hotel y recorrido por Montmartre' },
        { dia: 2, actividad: 'Torre Eiffel y Louvre', descripcion: 'Visita guiada a los principales monumentos' },
        { dia: 3, actividad: 'Versalles', descripcion: 'Excursión al Palacio de Versalles' },
        { dia: 4, actividad: 'Crucero y compras', descripcion: 'Crucero por el Sena y tarde libre' },
        { dia: 5, actividad: 'Despedida', descripcion: 'Transfer al aeropuerto' }
      ],
      gastos: [
        { concepto: 'Vuelo redondo', monto: 8000, categoria: 'transporte' },
        { concepto: 'Hotel 4 noches', monto: 4000, categoria: 'hospedaje' },
        { concepto: 'Desayunos', monto: 800, categoria: 'comida' },
        { concepto: 'Tours y entradas', monto: 1500, categoria: 'actividades' },
        { concepto: 'Transfers', monto: 700, categoria: 'transporte' }
      ]
    },
    {
      id: 2,
      agenciaId: 2,
      destinoId: 1,
      nombrePaquete: 'Aventura Inca - 4 días',
      duracion: '4 días / 3 noches',
      precio: 12000,
      incluye: [
        'Vuelo Lima-Cusco',
        'Hotel en Cusco',
        'Tren a Aguas Calientes',
        'Entrada a Machu Picchu',
        'Guía especializado',
        'Todas las comidas'
      ],
      itinerario: [
        { dia: 1, actividad: 'Llegada a Cusco', descripcion: 'Aclimatación y city tour' },
        { dia: 2, actividad: 'Valle Sagrado', descripcion: 'Recorrido por Pisac y Ollantaytambo' },
        { dia: 3, actividad: 'Machu Picchu', descripcion: 'Visita guiada a la ciudadela inca' },
        { dia: 4, actividad: 'Regreso', descripcion: 'Transfer al aeropuerto' }
      ],
      gastos: [
        { concepto: 'Vuelos', monto: 4000, categoria: 'transporte' },
        { concepto: 'Hotel 3 noches', monto: 2500, categoria: 'hospedaje' },
        { concepto: 'Alimentación completa', monto: 1500, categoria: 'comida' },
        { concepto: 'Tren turístico', monto: 2000, categoria: 'transporte' },
        { concepto: 'Entradas y guía', monto: 2000, categoria: 'actividades' }
      ]
    },
    {
      id: 3,
      agenciaId: 3,
      destinoId: 3,
      nombrePaquete: 'Maldivas All Inclusive - 7 días',
      duracion: '7 días / 6 noches',
      precio: 35000,
      incluye: [
        'Vuelo internacional',
        'Resort 5 estrellas',
        'Todo incluido',
        'Spa y actividades acuáticas',
        'Cenas románticas',
        'Transfer en lancha'
      ],
      itinerario: [
        { dia: 1, actividad: 'Llegada', descripcion: 'Transfer al resort en lancha privada' },
        { dia: 2, actividad: 'Playa y relax', descripcion: 'Día libre en la playa privada' },
        { dia: 3, actividad: 'Snorkel', descripcion: 'Tour de snorkel en arrecife de coral' },
        { dia: 4, actividad: 'Spa', descripcion: 'Tratamiento de spa incluido' },
        { dia: 5, actividad: 'Excursión', descripcion: 'Pesca deportiva y cena en la playa' },
        { dia: 6, actividad: 'Día libre', descripcion: 'Actividades opcionales' },
        { dia: 7, actividad: 'Despedida', descripcion: 'Transfer al aeropuerto' }
      ],
      gastos: [
        { concepto: 'Vuelo internacional', monto: 15000, categoria: 'transporte' },
        { concepto: 'Resort 6 noches', monto: 12000, categoria: 'hospedaje' },
        { concepto: 'Todo incluido', monto: 6000, categoria: 'comida' },
        { concepto: 'Actividades y spa', monto: 2000, categoria: 'actividades' }
      ]
    }
  ];

  paquetesPorAgencia: any = {
    1: 3,
    2: 2,
    3: 4,
    4: 3
  };

  ngOnInit(): void {
    if (this.destino) {
      this.destinoActual = this.destino as DestinoCompleto;
    } else if (this.destinoId) {
      const destinoEncontrado = this.destinosService.getDestinoById(this.destinoId);
      if (destinoEncontrado) {
        this.destinoActual = destinoEncontrado;
      } else {
        console.error('Destino no encontrado con ID:', this.destinoId);
      }
    }
  }

  cambiarTab(tab: string): void {
    this.tabActiva = tab;
    this.cerrarDetalleAgencia();
    this.cerrarDetallePaquete();
  }

  volverAtras(): void {
    this.volver.emit();
  }

  compartir(): void {
    alert('Función de compartir - Próximamente');
  }

  guardar(): void {
    alert('Guardado en favoritos');
  }

  abrirColecciones(): void {
    this.mostrarColecciones = true;
  }

  cerrarColecciones(): void {
    this.mostrarColecciones = false;
  }

  onDestinoAgregado(evento: any): void {
    console.log('Destino agregado a colección:', evento);
  }

  abrirMapa(): void {
    alert('Abriendo Google Maps...');
  }

  llamarTurismo(): void {
    alert('Llamando a información turística...');
  }

  abrirSitioWeb(): void {
    alert('Abriendo sitio web oficial...');
  }

  // Métodos de agencias
  getAgenciasParaDestino(): Agencia[] {
    if (!this.destinoActual) return [];
    return this.agencias.filter(agencia => 
      agencia.destinos.includes(this.destinoActual!.id)
    );
  }

  contarPaquetes(agenciaId: number): number {
    if (!this.destinoActual) return 0;
    return this.paquetes.filter(p => 
      p.agenciaId === agenciaId && p.destinoId === this.destinoActual!.id
    ).length;
  }

  verDetalleAgencia(agencia: Agencia): void {
    this.agenciaSeleccionada = agencia;
    this.mostrarDetalleAgencia = true;
  }

  cerrarDetalleAgencia(): void {
    this.mostrarDetalleAgencia = false;
    this.agenciaSeleccionada = undefined;
  }

  getPaquetesPorAgencia(agenciaId: number): PaqueteViaje[] {
    if (!this.destinoActual) return [];
    return this.paquetes.filter(p => 
      p.agenciaId === agenciaId && p.destinoId === this.destinoActual!.id
    );
  }

  verDetallePaquete(paquete: PaqueteViaje): void {
    this.paqueteSeleccionado = paquete;
    this.mostrarDetallePaquete = true;
    this.mostrarDetalleAgencia = false;
  }

  cerrarDetallePaquete(): void {
    this.mostrarDetallePaquete = false;
    this.paqueteSeleccionado = undefined;
    if (this.agenciaSeleccionada) {
      this.mostrarDetalleAgencia = true;
    }
  }

  volverAAgencia(): void {
    this.mostrarDetallePaquete = false;
    this.paqueteSeleccionado = undefined;
    this.mostrarDetalleAgencia = true;
  }

  reservarPaquete(): void {
    if (!this.paqueteSeleccionado) return;

    if (!this.nombreCliente.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }
    if (!this.emailCliente.trim()) {
      alert('Por favor ingresa tu email');
      return;
    }
    if (!this.fechaSalida) {
      alert('Por favor selecciona una fecha de salida');
      return;
    }

    const nuevaColeccion = {
      id: Date.now(),
      nombre: this.paqueteSeleccionado.nombrePaquete,
      icono: '✈️',
      destinos: [this.paqueteSeleccionado.destinoId],
      fechaCreacion: Date.now(),
      fechaInicio: this.formatearFecha(this.fechaSalida),
      fechaFin: this.calcularFechaFin(this.fechaSalida, this.paqueteSeleccionado.duracion),
      finalizado: false,
      agencia: {
        id: this.paqueteSeleccionado.agenciaId,
        nombre: this.getAgenciaNombre(this.paqueteSeleccionado.agenciaId),
        paqueteId: this.paqueteSeleccionado.id
      },
      gastosProgramados: this.paqueteSeleccionado.gastos,
      itinerarioProgramado: this.paqueteSeleccionado.itinerario
    };

    const colecciones = this.obtenerColecciones();
    colecciones.push(nuevaColeccion);
    localStorage.setItem('travelplus_colecciones', JSON.stringify(colecciones));

    alert(`¡Viaje reservado exitosamente!\n\nRecibirás un correo de confirmación a ${this.emailCliente}`);
    
    this.nombreCliente = '';
    this.emailCliente = '';
    this.telefonoCliente = '';
    this.fechaSalida = '';
    this.numPersonas = 1;
    
    this.cerrarDetallePaquete();
    this.cerrarDetalleAgencia();
    this.cambiarTab('informacion');
    
    setTimeout(() => {
      this.navegarAViajes.emit();
    }, 500);
  }

  obtenerColecciones(): any[] {
    try {
      const data = localStorage.getItem('travelplus_colecciones');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  getAgenciaNombre(agenciaId: number): string {
    const agencia = this.agencias.find(a => a.id === agenciaId);
    return agencia ? agencia.nombre : 'Agencia';
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  calcularFechaFin(fechaInicio: string, duracion: string): string {
    const dias = parseInt(duracion.split(' ')[0]);
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + dias);
    return this.formatearFecha(fecha.toISOString());
  }

  getTotalGastos(gastos: GastoDetallado[]): number {
    return gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  getIconoCategoria(categoria: string): string {
    const iconos: any = {
      'transporte': '🚗',
      'hospedaje': '🏨',
      'comida': '🍽️',
      'actividades': '🎯',
      'otros': '💰'
    };
    return iconos[categoria] || '💰';
  }

  getEstrellas(rating: number): string[] {
    const estrellas = [];
    const estrellaCompleta = Math.floor(rating);
    
    for (let i = 0; i < estrellaCompleta; i++) {
      estrellas.push('★');
    }
    
    if (rating % 1 !== 0) {
      estrellas.push('☆');
    }
    
    return estrellas;
  }
}