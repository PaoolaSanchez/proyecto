import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Coleccion {
  id: number;
  nombre: string;
  icono: string;
  destinos: number[];
  fechaCreacion?: number;
}

@Component({
  selector: 'app-collections-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collections-modal.component.html',
  styleUrls: ['./collections-modal.component.css']
})
export class CollectionsModalComponent implements OnInit {
  @Input() destinoId?: number;
  @Input() nombreDestino?: string;
  @Output() cerrar = new EventEmitter<void>();
  @Output() agregado = new EventEmitter<{ coleccionId: number, destinoId: number }>();

  mostrarNuevaColeccion: boolean = false;
  nuevaColeccionNombre: string = '';
  colecciones: Coleccion[] = [];

  ngOnInit(): void {
    this.cargarColecciones();
  }

  cargarColecciones(): void {
    try {
      const data = localStorage.getItem('travelplus_colecciones');
      if (data) {
        this.colecciones = JSON.parse(data);
      } else {
        // Colecciones por defecto
        this.colecciones = [
          {
            id: 1,
            nombre: 'Verano en Italia',
            icono: '🇮🇹',
            destinos: [],
            fechaCreacion: Date.now()
          },
          {
            id: 2,
            nombre: 'Invierno en Madrid',
            icono: '❄️',
            destinos: [],
            fechaCreacion: Date.now()
          },
          {
            id: 3,
            nombre: 'Cancún',
            icono: '🏖️',
            destinos: [],
            fechaCreacion: Date.now()
          }
        ];
        this.guardarEnLocalStorage();
      }
      console.log('Colecciones cargadas:', this.colecciones);
    } catch (error) {
      console.error('Error al cargar colecciones:', error);
    }
  }

  guardarEnLocalStorage(): void {
    try {
      localStorage.setItem('travelplus_colecciones', JSON.stringify(this.colecciones));
      console.log('Colecciones guardadas');
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  }

  agregarAColeccion(coleccion: Coleccion): void {
    if (!this.destinoId) return;

    if (!coleccion.destinos.includes(this.destinoId)) {
      coleccion.destinos.push(this.destinoId);
      this.guardarEnLocalStorage();
      
      console.log(`Destino ${this.destinoId} agregado a colección ${coleccion.nombre}`);
      
      // Emitir evento
      this.agregado.emit({ 
        coleccionId: coleccion.id, 
        destinoId: this.destinoId 
      });

      // Cerrar modal después de agregar
      setTimeout(() => {
        this.cerrarModal();
      }, 500);
    } else {
      console.log('El destino ya está en esta colección');
    }
  }

  mostrarFormularioNuevaColeccion(): void {
    this.mostrarNuevaColeccion = true;
  }

  cancelarNuevaColeccion(): void {
    this.mostrarNuevaColeccion = false;
    this.nuevaColeccionNombre = '';
  }

  crearNuevaColeccion(): void {
    if (this.nuevaColeccionNombre.trim()) {
      const nuevoId = this.colecciones.length > 0
        ? Math.max(...this.colecciones.map(c => c.id)) + 1
        : 1;

      const nuevaColeccion: Coleccion = {
        id: nuevoId,
        nombre: this.nuevaColeccionNombre.trim(),
        icono: '✈️',
        destinos: this.destinoId ? [this.destinoId] : [],
        fechaCreacion: Date.now()
      };

      this.colecciones.push(nuevaColeccion);
      this.guardarEnLocalStorage();

      console.log('Nueva colección creada:', nuevaColeccion);

      // Emitir evento si hay destino
      if (this.destinoId) {
        this.agregado.emit({ 
          coleccionId: nuevaColeccion.id, 
          destinoId: this.destinoId 
        });
      }

      // Resetear formulario
      this.nuevaColeccionNombre = '';
      this.mostrarNuevaColeccion = false;

      // Cerrar modal
      setTimeout(() => {
        this.cerrarModal();
      }, 500);
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  estaEnColeccion(coleccion: Coleccion): boolean {
    return this.destinoId ? coleccion.destinos.includes(this.destinoId) : false;
  }
}