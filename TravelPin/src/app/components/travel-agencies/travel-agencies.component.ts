import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  selector: 'app-travel-agencies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel-agencies.component.html',
  styleUrls: ['./travel-agencies.component.css']
})
export class TravelAgenciesComponent implements OnInit {
  @Output() navegarATab = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

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
      destinoId: 4, // París
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
      destinoId: 1, // Machu Picchu
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
      destinoId: 3, // Maldivas
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

  ngOnInit(): void {}

  verDetalleAgencia(agencia: Agencia): void {
    this.agenciaSeleccionada = agencia;
    this.mostrarDetalleAgencia = true;
  }

  cerrarDetalleAgencia(): void {
    this.mostrarDetalleAgencia = false;
    this.agenciaSeleccionada = undefined;
  }

  getPaquetesPorAgencia(agenciaId: number): PaqueteViaje[] {
    return this.paquetes.filter(p => p.agenciaId === agenciaId);
  }

  verDetallePaquete(paquete: PaqueteViaje): void {
    this.paqueteSeleccionado = paquete;
    this.mostrarDetallePaquete = true;
    this.mostrarDetalleAgencia = false;
  }

  cerrarDetallePaquete(): void {
    this.mostrarDetallePaquete = false;
    this.paqueteSeleccionado = undefined;
  }

  reservarPaquete(): void {
    if (!this.paqueteSeleccionado) return;

    // Validaciones
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

    // Crear el viaje en la colección
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

    // Guardar en localStorage
    const colecciones = this.obtenerColecciones();
    colecciones.push(nuevaColeccion);
    localStorage.setItem('travelplus_colecciones', JSON.stringify(colecciones));

    alert(`¡Viaje reservado exitosamente!\n\nRecibirás un correo de confirmación a ${this.emailCliente}`);
    
    // Limpiar formulario
    this.nombreCliente = '';
    this.emailCliente = '';
    this.telefonoCliente = '';
    this.fechaSalida = '';
    this.numPersonas = 1;
    
    // Cerrar modal y navegar a viajes
    this.cerrarDetallePaquete();
    this.navegarATab.emit('viajes');
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
    }).replace(/\//g, '/');
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

  volver(): void {
    this.cerrar.emit();
  }
}