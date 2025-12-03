import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Agencia {
  id: number;
  nombre: string;
  email: string;
  descripcion?: string;
  logo?: string;
  contacto?: string;
  sitio_web?: string;
}

interface Destino {
  id: number;
  nombre: string;
  pais: string;
  imagen_principal?: string;
}

interface Paquete {
  id?: number;
  agencia_id?: number;
  nombre: string;
  precio: number;
  duracion: string;
  incluye: string[];
  itinerario: { dia: number; actividades: string }[];
  gastos: { concepto: string; monto: number }[];
  destinos: number[]; // IDs de destinos
  destinosCompletos?: Destino[]; // Datos completos para mostrar
}

@Component({
  selector: 'app-panel-agencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-agencia.component.html',
  styleUrls: ['./panel-agencia.component.css']
})
export class PanelAgenciaComponent implements OnInit {
  // Autenticación
  loggedIn = false;
  loginData = { email: '', password: '' };
  agencia: Agencia | null = null;
  
  // Paquetes y Destinos
  paquetes: Paquete[] = [];
  destinosDisponibles: Destino[] = [];
  mostrarFormulario = false;
  editandoPaquete: Paquete | null = null;
  
  // Formulario de paquete
  nuevoPaquete: Paquete = {
    nombre: '',
    precio: 0,
    duracion: '',
    incluye: [],
    itinerario: [],
    gastos: [],
    destinos: []
  };
  
  // Campos temporales
  nuevoIncluye = '';
  nuevoItinerario = { dia: 1, actividades: '' };
  nuevoGasto = { concepto: '', monto: 0 };
  
  // Filtros y búsqueda
  filtroDestino: number | null = null;
  busqueda = '';

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.verificarSesion();
    this.cargarDestinos();
  }
  
  verificarSesion() {
    if (!this.isBrowser) return;
    
    const agenciaGuardada = localStorage.getItem('agencia');
    if (agenciaGuardada) {
      this.agencia = JSON.parse(agenciaGuardada);
      this.loggedIn = true;
      this.cargarPaquetes();
    }
  }
  
  login() {
    this.http.post<any>('/api/agencias/login', this.loginData)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.agencia = response.agencia;
            this.loggedIn = true;
            if (this.isBrowser) {
              localStorage.setItem('agencia', JSON.stringify(this.agencia));
            }
            this.cargarPaquetes();
            alert('¡Bienvenido/a!');
          }
        },
        error: (error) => {
          alert('Credenciales inválidas');
          console.error(error);
        }
      });
  }
  
  logout() {
    this.loggedIn = false;
    this.agencia = null;
    this.paquetes = [];
    if (this.isBrowser) {
      localStorage.removeItem('agencia');
    }
    this.router.navigate(['/']);
  }
  
  cargarDestinos() {
    this.http.get<any>('/api/destinos')
      .subscribe({
        next: (response) => {
          // El endpoint devuelve {success, count, data}
          this.destinosDisponibles = response.data || response;
        },
        error: (error) => {
          console.error('Error al cargar destinos:', error);
        }
      });
  }
  
  cargarPaquetes() {
    if (!this.agencia) return;
    
    this.http.get<any[]>(`/api/agencias/${this.agencia.id}/paquetes`)
      .subscribe({
        next: (paquetes) => {
          this.paquetes = paquetes.map(p => ({
            ...p,
            destinos: p.destinos?.map((d: any) => d.id) || [],
            destinosCompletos: p.destinos || []
          }));
        },
        error: (error) => {
          console.error('Error al cargar paquetes:', error);
        }
      });
  }
  
  get paquetesFiltrados() {
    return this.paquetes.filter(p => {
      const matchDestino = !this.filtroDestino || p.destinos.includes(this.filtroDestino);
      const matchBusqueda = !this.busqueda || 
        p.nombre.toLowerCase().includes(this.busqueda.toLowerCase());
      return matchDestino && matchBusqueda;
    });
  }
  
  abrirFormulario() {
    this.mostrarFormulario = true;
    this.editandoPaquete = null;
    this.nuevoPaquete = {
      nombre: '',
      precio: 0,
      duracion: '',
      incluye: [],
      itinerario: [],
      gastos: [],
      destinos: []
    };
  }
  
  editarPaquete(paquete: Paquete) {
    this.mostrarFormulario = true;
    this.editandoPaquete = paquete;
    this.nuevoPaquete = { 
      ...paquete,
      destinos: [...paquete.destinos]
    };
  }
  
  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editandoPaquete = null;
  }
  
  // Gestión de destinos del paquete
  toggleDestino(destinoId: number) {
    const index = this.nuevoPaquete.destinos.indexOf(destinoId);
    if (index > -1) {
      this.nuevoPaquete.destinos.splice(index, 1);
    } else {
      this.nuevoPaquete.destinos.push(destinoId);
    }
  }
  
  esDestinoSeleccionado(destinoId: number): boolean {
    return this.nuevoPaquete.destinos.includes(destinoId);
  }
  
  getNombreDestino(destinoId: number): string {
    const destino = this.destinosDisponibles.find(d => d.id === destinoId);
    return destino ? `${destino.nombre}, ${destino.pais}` : '';
  }
  
  // Gestión de incluye
  agregarIncluye() {
    if (this.nuevoIncluye.trim()) {
      this.nuevoPaquete.incluye.push(this.nuevoIncluye.trim());
      this.nuevoIncluye = '';
    }
  }
  
  eliminarIncluye(index: number) {
    this.nuevoPaquete.incluye.splice(index, 1);
  }
  
  // Gestión de itinerario
  agregarItinerario() {
    if (this.nuevoItinerario.actividades.trim()) {
      this.nuevoPaquete.itinerario.push({ ...this.nuevoItinerario });
      this.nuevoItinerario = { dia: this.nuevoItinerario.dia + 1, actividades: '' };
    }
  }
  
  eliminarItinerario(index: number) {
    this.nuevoPaquete.itinerario.splice(index, 1);
  }
  
  // Gestión de gastos
  agregarGasto() {
    if (this.nuevoGasto.concepto.trim() && this.nuevoGasto.monto > 0) {
      this.nuevoPaquete.gastos.push({ ...this.nuevoGasto });
      this.nuevoGasto = { concepto: '', monto: 0 };
    }
  }
  
  eliminarGasto(index: number) {
    this.nuevoPaquete.gastos.splice(index, 1);
  }
  
  getTotalGastos(): number {
    return this.nuevoPaquete.gastos.reduce((sum, g) => sum + g.monto, 0);
  }
  
  guardarPaquete() {
    if (!this.agencia) return;
    
    // Validaciones
    if (!this.nuevoPaquete.nombre.trim()) {
      alert('Por favor ingresa un nombre para el paquete');
      return;
    }
    
    if (this.nuevoPaquete.precio <= 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }
    
    if (this.nuevoPaquete.destinos.length === 0) {
      alert('Por favor selecciona al menos un destino');
      return;
    }
    
    if (this.editandoPaquete && this.editandoPaquete.id) {
      // Actualizar
      this.http.put(`/api/paquetes/${this.editandoPaquete.id}`, this.nuevoPaquete)
        .subscribe({
          next: () => {
            alert('✅ Paquete actualizado exitosamente');
            this.cargarPaquetes();
            this.cerrarFormulario();
          },
          error: (error) => {
            alert('❌ Error al actualizar paquete');
            console.error(error);
          }
        });
    } else {
      // Crear
      this.http.post(`/api/agencias/${this.agencia.id}/paquetes`, this.nuevoPaquete)
        .subscribe({
          next: () => {
            alert('✅ Paquete creado exitosamente');
            this.cargarPaquetes();
            this.cerrarFormulario();
          },
          error: (error) => {
            alert('❌ Error al crear paquete');
            console.error(error);
          }
        });
    }
  }
  
  eliminarPaquete(id: number | undefined) {
    if (!id) return;
    
    if (confirm('¿Estás seguro de eliminar este paquete? Esta acción no se puede deshacer.')) {
      this.http.delete(`/api/paquetes/${id}`)
        .subscribe({
          next: () => {
            alert('✅ Paquete eliminado');
            this.cargarPaquetes();
          },
          error: (error) => {
            alert('❌ Error al eliminar paquete');
            console.error(error);
          }
        });
    }
  }
}