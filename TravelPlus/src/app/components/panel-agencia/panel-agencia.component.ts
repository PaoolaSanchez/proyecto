import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Subscription, interval } from 'rxjs';

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

interface Reserva {
  id: number;
  paquete_id: number;
  agencia_id: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  num_personas: number;
  fecha_salida: string;
  precio_total: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  notas?: string;
  created_at: string;
  paquete_nombre?: string;
  paquete_precio?: number;
  paquete_duracion?: string;
}

@Component({
  selector: 'app-panel-agencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-agencia.component.html',
  styleUrls: ['./panel-agencia.component.css']
})
export class PanelAgenciaComponent implements OnInit, OnDestroy {
  // Autenticación
  loggedIn = false;
  modoRegistro = false;
  loginData = { email: '', password: '' };
  registroData = { nombre: '', email: '', password: '', descripcion: '', logo: '🏢', contacto: '' };
  agencia: Agencia | null = null;
  
  // Navegación del panel
  vistaActual: 'paquetes' | 'reservas' = 'paquetes';
  
  // Paquetes y Destinos
  paquetes: Paquete[] = [];
  destinosDisponibles: Destino[] = [];
  mostrarFormulario = false;
  editandoPaquete: Paquete | null = null;
  
  // Reservas
  reservas: Reserva[] = [];
  filtroEstado: string = '';
  
  // Tiempo real - Polling
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 10000; // 10 segundos
  nuevasReservas = 0;
  mostrarNotificacion = false;
  
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
  private apiUrl = environment.apiUrl;
  
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
      this.cargarReservas();
      this.iniciarPollingReservas();
    } else {
      // Si no está logueado, redirigir al login de agencias
      this.router.navigate(['/login-agencia']);
    }
  }
  
  login() {
    this.http.post<any>(`${this.apiUrl}/agencias/login`, this.loginData)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.agencia = response.agencia;
            this.loggedIn = true;
            if (this.isBrowser) {
              localStorage.setItem('agencia', JSON.stringify(this.agencia));
            }
            this.cargarPaquetes();
            this.cargarReservas();
            this.iniciarPollingReservas();
            alert('¡Bienvenido/a!');
          }
        },
        error: (error) => {
          alert(error.error?.error || 'Credenciales inválidas');
          console.error(error);
        }
      });
  }

  registro() {
    if (!this.registroData.nombre || !this.registroData.email || !this.registroData.password) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    this.http.post<any>(`${this.apiUrl}/agencias/registro`, this.registroData)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.agencia = response.agencia;
            this.loggedIn = true;
            if (this.isBrowser) {
              localStorage.setItem('agencia', JSON.stringify(this.agencia));
            }
            this.cargarPaquetes();
            this.cargarReservas();
            this.iniciarPollingReservas();
            alert('¡Agencia registrada exitosamente!');
          }
        },
        error: (error) => {
          alert(error.error?.error || 'Error al registrar agencia');
          console.error(error);
        }
      });
  }

  toggleModoRegistro() {
    this.modoRegistro = !this.modoRegistro;
  }
  
  logout() {
    this.detenerPollingReservas();
    this.loggedIn = false;
    this.agencia = null;
    this.paquetes = [];
    this.reservas = [];
    this.nuevasReservas = 0;
    if (this.isBrowser) {
      localStorage.removeItem('agencia');
    }
    this.router.navigate(['/login-agencia']);
  }
  
  irInicio() {
    this.router.navigate(['/']);
  }
  
  cambiarVista(vista: 'paquetes' | 'reservas') {
    this.vistaActual = vista;
    this.mostrarFormulario = false;
  }
  
  cargarDestinos() {
    this.http.get<any>(`${this.apiUrl}/destinos`)
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
    
    this.http.get<any[]>(`${this.apiUrl}/agencias/${this.agencia.id}/paquetes`)
      .subscribe({
        next: (paquetes) => {
          this.paquetes = paquetes.map(p => ({
            ...p,
            incluye: typeof p.incluye === 'string' ? JSON.parse(p.incluye || '[]') : (p.incluye || []),
            itinerario: typeof p.itinerario === 'string' ? JSON.parse(p.itinerario || '[]') : (p.itinerario || []),
            gastos: typeof p.gastos === 'string' ? JSON.parse(p.gastos || '[]') : (p.gastos || []),
            destinos: p.destinos?.map((d: any) => d.id) || [],
            destinosCompletos: p.destinos || []
          }));
        },
        error: (error) => {
          console.error('Error al cargar paquetes:', error);
        }
      });
  }
  
  cargarReservas(silencioso = false) {
    if (!this.agencia) return;
    
    const cantidadAnterior = this.reservas.length;
    
    this.http.get<Reserva[]>(`${this.apiUrl}/agencias/${this.agencia.id}/reservas`)
      .subscribe({
        next: (reservas) => {
          // Detectar nuevas reservas (solo si ya teníamos datos y es una actualización silenciosa)
          if (silencioso && cantidadAnterior > 0 && reservas.length > cantidadAnterior) {
            const nuevas = reservas.length - cantidadAnterior;
            this.nuevasReservas += nuevas;
            this.mostrarNotificacion = true;
            this.reproducirSonidoNotificacion();
            
            // Auto-ocultar notificación después de 5 segundos
            setTimeout(() => {
              this.mostrarNotificacion = false;
            }, 5000);
          }
          
          this.reservas = reservas;
        },
        error: (error) => {
          console.error('Error al cargar reservas:', error);
        }
      });
  }
  
  // Iniciar polling de reservas en tiempo real
  iniciarPollingReservas() {
    if (!this.isBrowser || this.pollingSubscription) return;
    
    console.log('🔄 Iniciando polling de reservas cada', this.POLLING_INTERVAL / 1000, 'segundos');
    
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      if (this.loggedIn && this.agencia) {
        this.cargarReservas(true); // true = modo silencioso
      }
    });
  }
  
  // Detener polling
  detenerPollingReservas() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
      console.log('⏹️ Polling de reservas detenido');
    }
  }
  
  // Reproducir sonido de notificación
  reproducirSonidoNotificacion() {
    if (!this.isBrowser) return;
    
    try {
      // Crear un sonido simple usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Ignorar si no se puede reproducir sonido
    }
  }
  
  // Marcar notificaciones como vistas
  verNuevasReservas() {
    this.nuevasReservas = 0;
    this.mostrarNotificacion = false;
    this.vistaActual = 'reservas';
  }
  
  ngOnDestroy() {
    this.detenerPollingReservas();
  }
  
  get reservasFiltradas(): Reserva[] {
    if (!this.filtroEstado) return this.reservas;
    return this.reservas.filter(r => r.estado === this.filtroEstado);
  }
  
  get reservasPendientes(): number {
    return this.reservas.filter(r => r.estado === 'pendiente').length;
  }
  
  get reservasConfirmadas(): number {
    return this.reservas.filter(r => r.estado === 'confirmada').length;
  }
  
  actualizarEstadoReserva(reservaId: number, nuevoEstado: string) {
    this.http.put(`${this.apiUrl}/reservas/${reservaId}/estado`, { estado: nuevoEstado })
      .subscribe({
        next: () => {
          this.cargarReservas();
          alert(`✅ Reserva ${nuevoEstado}`);
        },
        error: (error) => {
          alert('❌ Error al actualizar estado');
          console.error(error);
        }
      });
  }
  
  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'confirmada': return 'estado-confirmada';
      case 'cancelada': return 'estado-cancelada';
      case 'completada': return 'estado-completada';
      default: return '';
    }
  }
  
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      this.http.put(`${this.apiUrl}/paquetes/${this.editandoPaquete.id}`, this.nuevoPaquete)
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
      this.http.post(`${this.apiUrl}/agencias/${this.agencia.id}/paquetes`, this.nuevoPaquete)
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
      this.http.delete(`${this.apiUrl}/paquetes/${id}`)
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