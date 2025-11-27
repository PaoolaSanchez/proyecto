import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Coleccion {
  id: number;
  nombre: string;
  icono: string;
  destinos: number[];
  fechaCreacion?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
  private colecciones: Coleccion[] = [
    {
      id: 1,
      nombre: 'Verano en Italia',
      icono: '🇮🇹',
      destinos: [4], // París
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
      destinos: [5], // Cancún
      fechaCreacion: Date.now()
    }
  ];

  // Observable para que los componentes se suscriban a cambios
  private coleccionesSubject = new BehaviorSubject<Coleccion[]>(this.colecciones);
  public colecciones$ = this.coleccionesSubject.asObservable();

  constructor() {
    this.cargarDesdeLocalStorage();
  }

  obtenerColecciones(): Coleccion[] {
    return [...this.colecciones];
  }

  obtenerColeccionPorId(id: number): Coleccion | undefined {
    return this.colecciones.find(c => c.id === id);
  }

  agregarColeccion(nombre: string, icono: string = '✈️'): Coleccion {
    const nuevaColeccion: Coleccion = {
      id: this.generarId(),
      nombre: nombre,
      icono: icono,
      destinos: [],
      fechaCreacion: Date.now()
    };

    this.colecciones.push(nuevaColeccion);
    this.notificarCambios();
    this.guardarEnLocalStorage();

    return nuevaColeccion;
  }

  agregarDestinoAColeccion(coleccionId: number, destinoId: number): boolean {
    const coleccion = this.colecciones.find(c => c.id === coleccionId);
    
    if (coleccion && !coleccion.destinos.includes(destinoId)) {
      coleccion.destinos.push(destinoId);
      this.notificarCambios();
      this.guardarEnLocalStorage();
      return true;
    }

    return false;
  }

  eliminarDestinoDeColeccion(coleccionId: number, destinoId: number): boolean {
    const coleccion = this.colecciones.find(c => c.id === coleccionId);
    
    if (coleccion) {
      const index = coleccion.destinos.indexOf(destinoId);
      if (index > -1) {
        coleccion.destinos.splice(index, 1);
        this.notificarCambios();
        this.guardarEnLocalStorage();
        return true;
      }
    }

    return false;
  }

  eliminarColeccion(coleccionId: number): boolean {
    const index = this.colecciones.findIndex(c => c.id === coleccionId);
    
    if (index > -1) {
      this.colecciones.splice(index, 1);
      this.notificarCambios();
      this.guardarEnLocalStorage();
      return true;
    }

    return false;
  }

  actualizarNombreColeccion(coleccionId: number, nuevoNombre: string): boolean {
    const coleccion = this.colecciones.find(c => c.id === coleccionId);
    
    if (coleccion) {
      coleccion.nombre = nuevoNombre;
      this.notificarCambios();
      this.guardarEnLocalStorage();
      return true;
    }

    return false;
  }

  private generarId(): number {
    return this.colecciones.length > 0
      ? Math.max(...this.colecciones.map(c => c.id)) + 1
      : 1;
  }

  private notificarCambios(): void {
    this.coleccionesSubject.next([...this.colecciones]);
  }

  private guardarEnLocalStorage(): void {
    try {
      localStorage.setItem('travelplus_colecciones', JSON.stringify(this.colecciones));
      console.log('Colecciones guardadas en localStorage');
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  private cargarDesdeLocalStorage(): void {
    try {
      const data = localStorage.getItem('travelplus_colecciones');
      if (data) {
        this.colecciones = JSON.parse(data);
        this.notificarCambios();
        console.log('Colecciones cargadas desde localStorage');
      }
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
    }
  }

  // Método para SQLite (implementar más tarde)
  async sincronizarConSQLite(): Promise<void> {
    // TODO: Implementar sincronización con SQLite
    console.log('Sincronización con SQLite - Pendiente');
  }
}