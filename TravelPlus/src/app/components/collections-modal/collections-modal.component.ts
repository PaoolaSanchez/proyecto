import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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

  private getAuthHeaders(): { headers: HttpHeaders } {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.token) {
      return {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        })
      };
    }
    return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  }

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
    // Cargar viajes del backend (que son las colecciones)
    this.http.get<any[]>(`${environment.apiUrl}/viajes`, this.getAuthHeaders()).subscribe({
      next: (viajesBackend) => {
        console.log('Viajes/Colecciones cargados del backend:', viajesBackend);
        
        // Convertir viajes del backend a formato de colección
        this.colecciones = viajesBackend.map(v => ({
          id: v.id,
          nombre: v.nombre,
          icono: v.icono || '✈️',
          destinos: (v.destinos || []).map((d: any) => typeof d === 'object' ? d.id : d),
          fechaCreacion: new Date(v.created_at || Date.now()).getTime()
        }));
        
        // También guardar en localStorage para sincronización
        this.guardarEnLocalStorage();
      },
      error: (error) => {
        console.error('Error al cargar viajes del backend:', error);
        // Fallback: cargar desde localStorage
        this.cargarDesdeLocalStorage();
      }
    });
  }

  private cargarDesdeLocalStorage(): void {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        this.colecciones = JSON.parse(data);
      } else {
        this.colecciones = [];
      }
      console.log('Colecciones cargadas desde localStorage:', this.colecciones);
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
      
      // Sincronizar con el backend - agregar destino al viaje
      this.http.post(`${environment.apiUrl}/viajes/${coleccion.id}/destinos`, { 
        destinoId: this.destinoId,
        orden: coleccion.destinos.length
      }, this.getAuthHeaders()).subscribe({
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

      this.http.post<{ id: number }>(`${environment.apiUrl}/viajes`, viajeData, this.getAuthHeaders()).subscribe({
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
          alert('Error al crear el viaje. Por favor intenta de nuevo.');
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