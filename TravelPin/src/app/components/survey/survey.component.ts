import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface OpcionClima {
  id: string;
  nombre: string;
  icono: string;
}

interface OpcionPresupuesto {
  id: string;
  nombre: string;
  rango: string;
}

interface OpcionTipo {
  id: string;
  nombre: string;
  icono: string;
}

interface OpcionEstilo {
  id: string;
  nombre: string;
  descripcion: string;
}

interface OpcionActividad {
  id: string;
  nombre: string;
  icono: string;
}

interface RespuestasEncuesta {
  clima?: string;
  presupuesto?: string;
  tipo?: string;
  estilo?: string;
  actividades: string[];
}

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.css']
})
export class SurveyComponent {
  @Output() cerrarEncuesta = new EventEmitter<void>();
  @Output() verResultados = new EventEmitter<RespuestasEncuesta>();

  pasoActual: number = 1;
  totalPasos: number = 5;

  respuestas: RespuestasEncuesta = {
    actividades: []
  };

  opcionesClima: OpcionClima[] = [
    { id: 'tropical', nombre: 'Tropical', icono: '🌴' },
    { id: 'templado', nombre: 'Templado', icono: '🌤️' },
    { id: 'frio', nombre: 'Frío', icono: '❄️' },
    { id: 'arido', nombre: 'Árido', icono: '🏜️' },
    { id: 'mediterraneo', nombre: 'Mediterráneo', icono: '☀️' },
    { id: 'alpino', nombre: 'Alpino', icono: '🏔️' }
  ];

  opcionesPresupuesto: OpcionPresupuesto[] = [
    { id: 'economico', nombre: 'Económico', rango: 'Hasta $40/día' },
    { id: 'moderado', nombre: 'Moderado', rango: '$80-$180/día' },
    { id: 'lujo', nombre: 'Lujo', rango: 'Más de $180/día' }
  ];

  opcionesTipo: OpcionTipo[] = [
    { id: 'playa', nombre: 'Playa', icono: '🏖️' },
    { id: 'montana', nombre: 'Montaña', icono: '⛰️' },
    { id: 'ciudad', nombre: 'Ciudad', icono: '🏙️' },
    { id: 'aventura', nombre: 'Aventura', icono: '🎒' },
    { id: 'cultural', nombre: 'Cultural', icono: '🏛️' },
    { id: 'naturaleza', nombre: 'Naturaleza', icono: '🌿' }
  ];

  opcionesEstilo: OpcionEstilo[] = [
    { 
      id: 'solitario', 
      nombre: 'Viajero solitario', 
      descripcion: 'Viaja solo/a por tu cuenta' 
    },
    { 
      id: 'pareja', 
      nombre: 'En pareja', 
      descripcion: 'Viajes románticos' 
    },
    { 
      id: 'familiar', 
      nombre: 'Familiar', 
      descripcion: 'Con niños y familia' 
    },
    { 
      id: 'amigos', 
      nombre: 'Con amigos', 
      descripcion: 'Aventuras en grupo' 
    }
  ];

  opcionesActividades: OpcionActividad[] = [
    { id: 'deportes-extremos', nombre: 'Deportes extremos', icono: '🪂' },
    { id: 'visitas-culturales', nombre: 'Visitas culturales', icono: '🎭' },
    { id: 'relajacion', nombre: 'Relajación', icono: '🧘' },
    { id: 'gastronomia', nombre: 'Gastronomía', icono: '🍽️' },
    { id: 'vida-nocturna', nombre: 'Vida nocturna', icono: '🎉' }
  ];

  seleccionarClima(clima: string): void {
    this.respuestas.clima = clima;
  }

  seleccionarPresupuesto(presupuesto: string): void {
    this.respuestas.presupuesto = presupuesto;
  }

  seleccionarTipo(tipo: string): void {
    this.respuestas.tipo = tipo;
  }

  seleccionarEstilo(estilo: string): void {
    this.respuestas.estilo = estilo;
  }

  toggleActividad(actividad: string): void {
    const index = this.respuestas.actividades.indexOf(actividad);
    if (index > -1) {
      this.respuestas.actividades.splice(index, 1);
    } else {
      this.respuestas.actividades.push(actividad);
    }
  }

  isActividadSeleccionada(actividad: string): boolean {
    return this.respuestas.actividades.includes(actividad);
  }

  siguiente(): void {
    if (this.pasoActual < this.totalPasos) {
      this.pasoActual++;
    }
  }

  anterior(): void {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  puedeAvanzar(): boolean {
    switch (this.pasoActual) {
      case 1:
        return !!this.respuestas.clima;
      case 2:
        return !!this.respuestas.presupuesto;
      case 3:
        return !!this.respuestas.tipo;
      case 4:
        return !!this.respuestas.estilo;
      case 5:
        return this.respuestas.actividades.length > 0;
      default:
        return false;
    }
  }

  cerrar(): void {
    this.cerrarEncuesta.emit();
  }

  finalizarEncuesta(): void {
    console.log('Respuestas finales:', this.respuestas);
    this.verResultados.emit(this.respuestas);
  }

  getProgreso(): number {
    return (this.pasoActual / this.totalPasos) * 100;
  }
}