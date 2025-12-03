import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private authService: AuthService, 
    private router: Router,
    private http: HttpClient
  ) {}

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.uid) {
      return `travelplus_colecciones_${user.uid}`;
    }
    return 'travelplus_colecciones';
  }

  ngOnInit(): void {
    this.cargarColecciones();
  }

  cargarColecciones(): void {
    try {
      const data = localStorage.getItem(this.getStorageKey());
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
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.colecciones));
      console.log('Colecciones guardadas');
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  }

  agregarAColeccion(coleccion: Coleccion): void {
    if (!this.destinoId) return;
    if (!this.authService.isLogged()) {
      alert('Debes iniciar sesión o crear una cuenta para guardar destinos en tus colecciones');
      this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      return;
    }

    if (!coleccion.destinos.includes(this.destinoId)) {
      coleccion.destinos.push(this.destinoId);
      this.guardarEnLocalStorage();
      
      console.log(`Destino ${this.destinoId} agregado a colección ${coleccion.nombre}`);
      
      // Sincronizar con el backend - agregar destino al itinerario del viaje
      this.http.post(`/api/viajes/${coleccion.id}/itinerario`, { 
        destinoId: this.destinoId,
        orden: coleccion.destinos.length
      }).subscribe({
        next: () => console.log('Destino sincronizado con backend'),
        error: (err) => console.warn('No se pudo sincronizar destino con backend:', err)
      });
      
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
    if (!this.authService.isLogged()) {
      alert('Debes iniciar sesión o crear una cuenta para crear una colección');
      this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      return;
    }

    if (this.nuevaColeccionNombre.trim()) {
      // Crear viaje en el backend primero
      const viajeData = {
        nombre: this.nuevaColeccionNombre.trim(),
        icono: '✈️',
        destinos: this.destinoId ? [this.destinoId] : []
      };

      this.http.post<{ id: number }>('/api/viajes', viajeData).subscribe({
        next: (response) => {
          // Usar el ID del backend
          const nuevaColeccion: Coleccion = {
            id: response.id,
            nombre: this.nuevaColeccionNombre.trim(),
            icono: '✈️',
            destinos: this.destinoId ? [this.destinoId] : [],
            fechaCreacion: Date.now()
          };

          this.colecciones.push(nuevaColeccion);
          this.guardarEnLocalStorage();

          console.log('Nueva colección creada con ID del backend:', nuevaColeccion);

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
        },
        error: (err) => {
          console.error('Error al crear viaje en backend:', err);
          // Fallback: crear con ID local
          const nuevoId = this.colecciones.length > 0
            ? Math.max(...this.colecciones.map(c => c.id)) + 1
            : Date.now();

          const nuevaColeccion: Coleccion = {
            id: nuevoId,
            nombre: this.nuevaColeccionNombre.trim(),
            icono: '✈️',
            destinos: this.destinoId ? [this.destinoId] : [],
            fechaCreacion: Date.now()
          };

          this.colecciones.push(nuevaColeccion);
          this.guardarEnLocalStorage();

          if (this.destinoId) {
            this.agregado.emit({ 
              coleccionId: nuevaColeccion.id, 
              destinoId: this.destinoId 
            });
          }

          this.nuevaColeccionNombre = '';
          this.mostrarNuevaColeccion = false;

          setTimeout(() => {
            this.cerrarModal();
          }, 500);
        }
      });
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  estaEnColeccion(coleccion: Coleccion): boolean {
    return this.destinoId ? coleccion.destinos.includes(this.destinoId) : false;
  }
}