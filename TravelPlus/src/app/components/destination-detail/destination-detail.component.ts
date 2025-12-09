import { Component, OnInit, Input, Output, EventEmitter, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CollectionsModalComponent } from '../collections-modal/collections-modal.component';
import { AuthWarningModalComponent } from '../auth-warning-modal/auth-warning-modal.component';
import { DestinosService, DestinoCompleto } from '../../services/destinos.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

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
  descripcion?: string;
  rating?: number;
}

interface PaqueteViaje {
  id: number;
  agencia_id: number;
  agencia_nombre?: string;
  agencia_logo?: string;
  nombre: string;
  duracion: string;
  precio: number;
  incluye: string[];
  itinerario: { dia: number; actividades: string }[];
  gastos: { concepto: string; monto: number }[];
  destinos?: { id: number; nombre: string; pais: string }[];
}

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CollectionsModalComponent, AuthWarningModalComponent],
  templateUrl: './destination-detail.component.html',
  styleUrls: ['./destination-detail.component.css']
})
export class DestinationDetailComponent implements OnInit {
  @Input() destino?: Destino;
  @Input() destinoId?: number;
  @Output() volver = new EventEmitter<void>();
  @Output() navegarAViajes = new EventEmitter<void>();
  @Output() navegarATab = new EventEmitter<string>();

  destinoActual?: DestinoCompleto;
  tabActiva: string = 'informacion';
  mostrarColecciones: boolean = false;
  cargando: boolean = false;
  errorCarga: string = '';
  mostrarAuthWarning: boolean = false;

  // Variables para agencias y paquetes (cargados desde backend)
  agencias: Agencia[] = [];
  paquetes: PaqueteViaje[] = [];
  agenciaSeleccionada?: Agencia;
  paqueteSeleccionado?: PaqueteViaje;
  mostrarDetalleAgencia: boolean = false;
  mostrarDetallePaquete: boolean = false;
  cargandoPaquetes: boolean = false;

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private apiUrl = environment.apiUrl;

  // Datos del formulario de reserva
  nombreCliente: string = '';
  emailCliente: string = '';
  telefonoCliente: string = '';
  fechaSalida: string = '';
  numPersonas: number = 1;

  // Modales de notificación para reserva
  mostrarModalReservaExitosa: boolean = false;
  mostrarModalErrorReserva: boolean = false;
  emailConfirmacion: string = '';

  constructor(
    private destinosService: DestinosService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  // Helper para obtener headers de autenticación
  private getAuthHeaders(): { headers: HttpHeaders } {
    if (!this.isBrowser) {
      return { headers: new HttpHeaders() };
    }
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser && currentUser.token) {
          return {
            headers: new HttpHeaders({
              'Authorization': `Bearer ${currentUser.token}`,
              'Content-Type': 'application/json'
            })
          };
        }
      }
    } catch (e) {
      console.error('Error al leer token:', e);
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

  private getFavoritosKey(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.uid) {
      return `travelplus_favoritos_${user.uid}`;
    }
    return 'travelplus_favoritos';
  }

  ngOnInit(): void {
    if (this.destino) {
      // Si el padre envía un objeto pero está incompleto (listado básico), pedir detalles al backend
      const posibleCompleto = this.destino as any;
      const tieneDetalles = posibleCompleto && (posibleCompleto.descripcion || posibleCompleto.imagen_principal || posibleCompleto.imagenesGaleria || posibleCompleto.queHacer);

      if (tieneDetalles) {
        this.destinoActual = this.destino as DestinoCompleto;
        this.cargarPaquetesDelDestino(this.destinoActual.id);
      } else {
        // Obtener versión completa desde backend
        this.cargando = true;
        this.errorCarga = '';
        this.destinosService.getDestinoByIdFromBackend((this.destino as any).id)
          .pipe(finalize(() => this.cargando = false))
          .subscribe({
            next: (destino) => {
              this.destinoActual = destino;
              this.cargarPaquetesDelDestino(destino.id);
              console.log('✅ Destino cargado desde backend (entrada por Input):', destino.nombre);
            },
            error: (error) => {
              console.error('❌ Error al cargar destino por Input:', error);
              this.errorCarga = 'No se pudo cargar la información del destino. Por favor, intenta nuevamente.';
            }
          });
      }
    } else if (this.destinoId) {
      // Primero intentar obtener del servicio local
      const destinoEncontrado = this.destinosService.getDestinoById(this.destinoId);
      
      if (destinoEncontrado) {
        this.destinoActual = destinoEncontrado;
        this.cargarPaquetesDelDestino(this.destinoId);
      } else {
        // Si no está en caché, obtener del backend
        this.cargando = true;
        this.errorCarga = '';
        
        this.destinosService.getDestinoByIdFromBackend(this.destinoId)
          .pipe(finalize(() => this.cargando = false))
          .subscribe({
            next: (destino) => {
              this.destinoActual = destino;
              this.cargarPaquetesDelDestino(destino.id);
              console.log('✅ Destino cargado desde backend:', destino.nombre);
            },
            error: (error) => {
              console.error('❌ Error al cargar destino:', error);
              this.errorCarga = 'No se pudo cargar la información del destino. Por favor, intenta nuevamente.';
            }
          });
      }
    }
  }

  // Cargar paquetes del destino desde el backend
  cargarPaquetesDelDestino(destinoId: number): void {
    this.cargandoPaquetes = true;
    this.http.get<PaqueteViaje[]>(`${this.apiUrl}/destinos/${destinoId}/paquetes`)
      .subscribe({
        next: (paquetes) => {
          this.paquetes = paquetes;
          // Extraer agencias únicas de los paquetes
          const agenciasMap = new Map<number, Agencia>();
          paquetes.forEach(p => {
            if (!agenciasMap.has(p.agencia_id)) {
              agenciasMap.set(p.agencia_id, {
                id: p.agencia_id,
                nombre: p.agencia_nombre || 'Agencia',
                logo: p.agencia_logo || '🏢',
                rating: 4.5 + Math.random() * 0.5
              });
            }
          });
          this.agencias = Array.from(agenciasMap.values());
          this.cargandoPaquetes = false;
          console.log(`✅ Paquetes cargados para destino ${destinoId}:`, paquetes.length);
        },
        error: (error) => {
          console.error('Error al cargar paquetes:', error);
          this.cargandoPaquetes = false;
        }
      });
  }

  cambiarTab(tab: string): void {
    this.tabActiva = tab;
    this.cerrarDetalleAgencia();
    this.cerrarDetallePaquete();
  }

  volverAtras(): void {
    this.volver.emit();
  }

  cambiarTabPrincipal(tab: string): void {
    this.navegarATab.emit(tab);
  }

  compartir(): void {
    alert('Función de compartir - Próximamente');
  }

  guardar(): void {
    if (!this.destinoActual) return;
    // Requerir login para añadir a favoritos
    if (!this.authService.isLogged()) {
      this.mostrarAuthWarning = true;
      return;
    }

    try {
      // Obtener favoritos guardados
      const favoritosGuardados = localStorage.getItem(this.getFavoritosKey());
      let favoritosIds: number[] = favoritosGuardados ? JSON.parse(favoritosGuardados) : [];
      
      // Verificar si ya está en favoritos
      if (favoritosIds.includes(this.destinoActual.id)) {
        // Si ya existe, eliminarlo
        favoritosIds = favoritosIds.filter(id => id !== this.destinoActual!.id);
        alert('❌ Removido de favoritos');
        console.log('Destino removido de favoritos:', this.destinoActual.nombre);
      } else {
        // Si no existe, agregarlo
        favoritosIds.push(this.destinoActual.id);
        alert('❤️ Agregado a favoritos');
        console.log('Destino agregado a favoritos:', this.destinoActual.nombre);
      }
      
      // Guardar en localStorage
      localStorage.setItem(this.getFavoritosKey(), JSON.stringify(favoritosIds));
      console.log('Favoritos guardados:', favoritosIds);
    } catch (error) {
      console.error('Error al guardar favorito:', error);
      alert('Error al guardar favorito');
    }
  }

  abrirColecciones(): void {
    if (!this.authService.isLogged()) {
      this.mostrarAuthWarning = true;
      return;
    }

    this.mostrarColecciones = true;
  }

  cerrarColecciones(): void {
    this.mostrarColecciones = false;
  }

  onDestinoAgregado(evento: any): void {
    console.log('Destino agregado a colección:', evento);
  }

  // Coordenadas de destinos populares
  private coordinadasDestinos: { [key: string]: { lat: number; lng: number } } = {
    'Machu Picchu': { lat: -13.1631, lng: -72.5450 },
    'Tokio': { lat: 35.6762, lng: 139.6503 },
    'Maldivas': { lat: 3.2028, lng: 73.2207 },
    'París': { lat: 48.8566, lng: 2.3522 },
    'Cancún': { lat: 21.1619, lng: -86.8515 },
    'Bali': { lat: -8.3405, lng: 115.0920 },
    'Londres': { lat: 51.5074, lng: -0.1278 },
    'Nueva York': { lat: 40.7128, lng: -74.0060 },
    'Roma': { lat: 41.9028, lng: 12.4964 },
    'Dubai': { lat: 25.2048, lng: 55.2708 },
    'Santorini': { lat: 36.3932, lng: 25.4615 },
    'Barcelona': { lat: 41.3851, lng: 2.1734 },
    'Sydney': { lat: -33.8688, lng: 151.2093 },
    'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
    'Bangkok': { lat: 13.7563, lng: 100.5018 },
    'Amsterdam': { lat: 52.3676, lng: 4.9041 },
    'Venecia': { lat: 45.4408, lng: 12.3155 },
    'Praga': { lat: 50.0755, lng: 14.4378 },
    'Marrakech': { lat: 31.6295, lng: -7.9811 },
    'Cusco': { lat: -13.5319, lng: -71.9675 },
    'Kyoto': { lat: 35.0116, lng: 135.7681 },
    'Cartagena': { lat: 10.3910, lng: -75.4794 },
    'Lima': { lat: -12.0464, lng: -77.0428 },
    'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
    'Ciudad de México': { lat: 19.4326, lng: -99.1332 },
    'La Habana': { lat: 23.1136, lng: -82.3666 },
    'Punta Cana': { lat: 18.5601, lng: -68.3725 },
    'San Juan': { lat: 18.4655, lng: -66.1057 },
    'Bogotá': { lat: 4.7110, lng: -74.0721 },
    'Santiago': { lat: -33.4489, lng: -70.6693 },
    'Montevideo': { lat: -34.9011, lng: -56.1645 },
    'Quito': { lat: -0.1807, lng: -78.4678 },
    'Madrid': { lat: 40.4168, lng: -3.7038 },
    'Lisboa': { lat: 38.7223, lng: -9.1393 },
    'Berlín': { lat: 52.5200, lng: 13.4050 },
    'Viena': { lat: 48.2082, lng: 16.3738 },
    'Atenas': { lat: 37.9838, lng: 23.7275 },
    'Estambul': { lat: 41.0082, lng: 28.9784 },
    'El Cairo': { lat: 30.0444, lng: 31.2357 },
    'Ciudad del Cabo': { lat: -33.9249, lng: 18.4241 },
    'Singapur': { lat: 1.3521, lng: 103.8198 },
    'Hong Kong': { lat: 22.3193, lng: 114.1694 },
    'Seúl': { lat: 37.5665, lng: 126.9780 },
    'Pekín': { lat: 39.9042, lng: 116.4074 },
    'Shanghái': { lat: 31.2304, lng: 121.4737 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Nueva Delhi': { lat: 28.6139, lng: 77.2090 },
    'Taipei': { lat: 25.0330, lng: 121.5654 },
    'Hanói': { lat: 21.0285, lng: 105.8542 },
    'Siem Reap': { lat: 13.3671, lng: 103.8448 },
    'Queenstown': { lat: -45.0312, lng: 168.6626 },
    'Reikiavik': { lat: 64.1466, lng: -21.9426 },
    'Dubrovnik': { lat: 42.6507, lng: 18.0944 },
    'Florencia': { lat: 43.7696, lng: 11.2558 },
    'Milán': { lat: 45.4642, lng: 9.1900 },
    'Múnich': { lat: 48.1351, lng: 11.5820 },
    'Zúrich': { lat: 47.3769, lng: 8.5417 },
    'Copenhague': { lat: 55.6761, lng: 12.5683 },
    'Oslo': { lat: 59.9139, lng: 10.7522 },
    'Estocolmo': { lat: 59.3293, lng: 18.0686 },
    'Helsinki': { lat: 60.1699, lng: 24.9384 }
  };

  // Variable para controlar el modal del mapa
  mostrarModalMapa: boolean = false;
  private mapaLeaflet: any;
  private L: any;

  async abrirMapa(): Promise<void> {
    if (!this.destinoActual || !this.isBrowser) return;

    this.mostrarModalMapa = true;

    // Importar Leaflet dinámicamente
    try {
      const leafletModule = await import('leaflet');
      this.L = leafletModule.default || leafletModule;

      // Esperar a que el DOM esté listo
      setTimeout(() => {
        this.inicializarMapaLeaflet();
      }, 100);
    } catch (error) {
      console.error('Error al cargar Leaflet:', error);
    }
  }

  private inicializarMapaLeaflet(): void {
    if (!this.L || !this.destinoActual) return;

    const mapElement = document.getElementById('mapa-destino');
    if (!mapElement) {
      setTimeout(() => this.inicializarMapaLeaflet(), 100);
      return;
    }

    // Buscar coordenadas del destino
    let coords = this.coordinadasDestinos[this.destinoActual.nombre];
    
    if (!coords) {
      const nombreNormalizado = this.normalizarTexto(this.destinoActual.nombre);
      for (const [key, value] of Object.entries(this.coordinadasDestinos)) {
        if (this.normalizarTexto(key).includes(nombreNormalizado) || 
            nombreNormalizado.includes(this.normalizarTexto(key))) {
          coords = value;
          break;
        }
      }
    }

    // Coordenadas por defecto si no se encuentran
    const lat = coords?.lat || 0;
    const lng = coords?.lng || 0;
    const zoom = coords ? 12 : 2;

    // Destruir mapa anterior si existe
    if (this.mapaLeaflet) {
      this.mapaLeaflet.remove();
    }

    // Crear el mapa
    this.mapaLeaflet = this.L.map('mapa-destino').setView([lat, lng], zoom);

    // Agregar capa de OpenStreetMap
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapaLeaflet);

    // Agregar marcador si hay coordenadas
    if (coords) {
      const customIcon = this.L.divIcon({
        className: 'custom-marker-destination',
        html: `
          <div class="marker-pin-destination">
            <span>📍</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = this.L.marker([lat, lng], { icon: customIcon }).addTo(this.mapaLeaflet);

      // Popup con información del destino
      const popupContent = `
        <div style="text-align: center; padding: 10px;">
          <img src="${this.destinoActual.imagenPrincipal}" alt="${this.destinoActual.nombre}" 
               style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #2d3748;">${this.destinoActual.nombre}</h3>
          <p style="margin: 0; font-size: 14px; color: #718096;">📍 ${this.destinoActual.pais}</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 200,
        className: 'custom-popup-destination'
      }).openPopup();
    }
  }

  cerrarModalMapa(): void {
    this.mostrarModalMapa = false;
    if (this.mapaLeaflet) {
      this.mapaLeaflet.remove();
      this.mapaLeaflet = null;
    }
  }

  abrirEnGoogleMaps(): void {
    if (!this.destinoActual) return;
    
    let coords = this.coordinadasDestinos[this.destinoActual.nombre];
    
    if (!coords) {
      const nombreNormalizado = this.normalizarTexto(this.destinoActual.nombre);
      for (const [key, value] of Object.entries(this.coordinadasDestinos)) {
        if (this.normalizarTexto(key).includes(nombreNormalizado) || 
            nombreNormalizado.includes(this.normalizarTexto(key))) {
          coords = value;
          break;
        }
      }
    }

    if (coords) {
      const url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
    } else {
      const query = encodeURIComponent(`${this.destinoActual.nombre}, ${this.destinoActual.pais}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank');
    }
  }

  private normalizarTexto(texto: string): string {
    return texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  llamarTurismo(): void {
    alert('Llamando a información turística...');
  }

  abrirSitioWeb(): void {
    alert('Abriendo sitio web oficial...');
  }

  // Métodos de agencias - ahora usan datos del backend
  getAgenciasParaDestino(): Agencia[] {
    return this.agencias;
  }

  contarPaquetes(agenciaId: number): number {
    return this.paquetes.filter(p => p.agencia_id === agenciaId).length;
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
    return this.paquetes.filter(p => p.agencia_id === agenciaId);
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
    if (!this.paqueteSeleccionado || !this.isBrowser) return;

    if (!this.authService.isLogged()) {
      this.mostrarAuthWarning = true;
      return;
    }

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
    
    // Obtener destinos del paquete o usar el destino actual
    const destinosIds = this.paqueteSeleccionado.destinos && this.paqueteSeleccionado.destinos.length > 0
      ? this.paqueteSeleccionado.destinos.map(d => d.id)
      : (this.destinoActual ? [this.destinoActual.id] : []);

    // Obtener el ID del usuario actual
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.uid ? parseInt(currentUser.uid) : null;

    const viajeData = {
      nombre: this.paqueteSeleccionado.nombre,
      icono: '✈️',
      destinos: destinosIds,
      fecha_inicio: this.fechaSalida,
      fecha_fin: this.calcularFechaFinISO(this.fechaSalida, this.paqueteSeleccionado.duracion),
      usuario_id: usuarioId,
      agencia: {
        id: this.paqueteSeleccionado.agencia_id,
        nombre: this.paqueteSeleccionado.agencia_nombre || this.getAgenciaNombre(this.paqueteSeleccionado.agencia_id),
        paqueteId: this.paqueteSeleccionado.id
      },
      participanteInicial: {
        nombre: this.nombreCliente,
        email: this.emailCliente,
        iniciales: this.nombreCliente.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
        color: '#FF6B6B'
      }
    };

    // Crear viaje en el backend
    this.http.post<{ id: number }>(`${this.apiUrl}/viajes`, viajeData, this.getAuthHeaders()).subscribe({
      next: (response) => {
        const viajeId = response.id;
        
        // Crear reserva para la agencia
        const reservaData = {
          paquete_id: this.paqueteSeleccionado!.id,
          agencia_id: this.paqueteSeleccionado!.agencia_id,
          nombre_cliente: this.nombreCliente,
          email_cliente: this.emailCliente,
          telefono_cliente: this.telefonoCliente,
          num_personas: this.numPersonas,
          fecha_salida: this.fechaSalida,
          precio_total: this.paqueteSeleccionado!.precio * this.numPersonas,
          notas: `Viaje ID: ${viajeId} - Destino: ${this.destinoActual?.nombre || ''}`
        };
        
        this.http.post(`${this.apiUrl}/reservas`, reservaData, this.getAuthHeaders()).subscribe({
          next: () => console.log('✅ Reserva creada para la agencia'),
          error: (err) => console.error('Error al crear reserva:', err)
        });
        
        // Agregar itinerario del paquete al viaje
        if (this.paqueteSeleccionado?.itinerario && this.paqueteSeleccionado.itinerario.length > 0) {
          this.paqueteSeleccionado.itinerario.forEach((item) => {
            const itinerarioData = {
              fecha: this.calcularFechaDia(this.fechaSalida, item.dia),
              dia: item.dia,
              actividad: item.actividades,
              destino_id: destinosIds[0] || null
            };
            this.http.post(`${this.apiUrl}/viajes/${viajeId}/itinerario`, itinerarioData, this.getAuthHeaders()).subscribe({
              error: (err) => console.error('Error al agregar itinerario:', err)
            });
          });
        }
        
        // ⭐ NUEVO: Agregar recordatorios automáticos basados en el itinerario del paquete
        if (this.paqueteSeleccionado?.itinerario && this.paqueteSeleccionado.itinerario.length > 0) {
          this.paqueteSeleccionado.itinerario.forEach((item) => {
            const fechaRecordatorio = this.calcularFechaDia(this.fechaSalida, item.dia);
            const recordatorioData = {
              titulo: `Día ${item.dia}: ${item.actividades.substring(0, 50)}${item.actividades.length > 50 ? '...' : ''}`,
              descripcion: item.actividades,
              fecha: this.formatearFechaRecordatorio(fechaRecordatorio)
            };
            this.http.post(`${this.apiUrl}/viajes/${viajeId}/recordatorios`, recordatorioData, this.getAuthHeaders()).subscribe({
              next: () => console.log(`✅ Recordatorio día ${item.dia} agregado`),
              error: (err) => console.error('Error al agregar recordatorio:', err)
            });
          });
        }
        
        // Agregar recordatorios adicionales del paquete (preparación y regreso)
        this.agregarRecordatoriosPreparacion(viajeId);
        
        // Agregar gastos del paquete al viaje (multiplicados por número de personas)
        if (this.paqueteSeleccionado?.gastos && this.paqueteSeleccionado.gastos.length > 0) {
          // Crear gastos por cada persona
          for (let persona = 1; persona <= this.numPersonas; persona++) {
            this.paqueteSeleccionado.gastos.forEach((gasto) => {
              const gastoData = {
                descripcion: this.numPersonas > 1 ? `${gasto.concepto} (Persona ${persona})` : gasto.concepto,
                monto: gasto.monto,
                categoria: 'paquete',
                pagado_por: this.nombreCliente,
                fecha: this.fechaSalida
              };
              this.http.post(`${this.apiUrl}/viajes/${viajeId}/gastos`, gastoData, this.getAuthHeaders()).subscribe({
                error: (err) => console.error('Error al agregar gasto:', err)
              });
            });
          }
        }

        // Notificar a la agencia sobre la nueva reservación
        this.notificarAgenciaReservacion(viajeId);

        // También guardar en localStorage para sincronizar
        const nuevaColeccion = {
          id: viajeId,
          nombre: this.paqueteSeleccionado!.nombre,
          icono: '✈️',
          destinos: destinosIds,
          fechaCreacion: Date.now(),
          fechaInicio: this.formatearFecha(this.fechaSalida),
          fechaFin: this.calcularFechaFin(this.fechaSalida, this.paqueteSeleccionado!.duracion),
          finalizado: false,
          agencia: viajeData.agencia
        };

        const colecciones = this.obtenerColecciones();
        colecciones.push(nuevaColeccion);
        localStorage.setItem(this.getStorageKey(), JSON.stringify(colecciones));

        this.emailConfirmacion = this.emailCliente;
        this.mostrarModalReservaExitosa = true;
        
        this.limpiarFormularioReserva();
        this.cerrarDetallePaquete();
        this.cerrarDetalleAgencia();
        this.cambiarTab('informacion');
      },
      error: (error) => {
        console.error('Error al crear viaje:', error);
        this.mostrarModalErrorReserva = true;
      }
    });
  }

  private calcularFechaDia(fechaSalida: string, dia: number): string {
    const fecha = new Date(fechaSalida);
    fecha.setDate(fecha.getDate() + dia - 1);
    return fecha.toISOString().split('T')[0];
  }

  private formatearFechaRecordatorio(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  private agregarRecordatoriosPreparacion(viajeId: number): void {
    if (!this.paqueteSeleccionado) return;

    // Recordatorio 1 día antes del viaje
    const fechaUnDiaAntes = new Date(this.fechaSalida);
    fechaUnDiaAntes.setDate(fechaUnDiaAntes.getDate() - 1);
    
    const recordatorioPreparacion = {
      titulo: '🧳 Preparar maleta y documentos',
      descripcion: `Mañana inicia tu viaje "${this.paqueteSeleccionado.nombre}". Revisa tu maleta, documentos de identidad y confirmaciones.`,
      fecha: this.formatearFechaRecordatorio(fechaUnDiaAntes.toISOString().split('T')[0])
    };
    
    this.http.post(`${this.apiUrl}/viajes/${viajeId}/recordatorios`, recordatorioPreparacion, this.getAuthHeaders()).subscribe({
      next: () => console.log('✅ Recordatorio de preparación agregado'),
      error: (err) => console.error('Error al agregar recordatorio:', err)
    });

    // Recordatorio de check-in (2 días antes si aplica)
    if (this.paqueteSeleccionado.incluye?.some(i => i.toLowerCase().includes('vuelo') || i.toLowerCase().includes('aéreo'))) {
      const fechaCheckIn = new Date(this.fechaSalida);
      fechaCheckIn.setDate(fechaCheckIn.getDate() - 2);
      
      const recordatorioCheckIn = {
        titulo: '✈️ Hacer check-in del vuelo',
        descripcion: 'Recuerda hacer el check-in online de tu vuelo para evitar filas en el aeropuerto.',
        fecha: this.formatearFechaRecordatorio(fechaCheckIn.toISOString().split('T')[0])
      };
      
      this.http.post(`${this.apiUrl}/viajes/${viajeId}/recordatorios`, recordatorioCheckIn, this.getAuthHeaders()).subscribe({
        error: (err) => console.error('Error al agregar recordatorio check-in:', err)
      });
    }
  }

  private limpiarFormularioReserva(): void {
    this.nombreCliente = '';
    this.emailCliente = '';
    this.telefonoCliente = '';
    this.fechaSalida = '';
    this.numPersonas = 1;
  }

  obtenerColecciones(): any[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
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

  calcularFechaFinISO(fechaInicio: string, duracion: string): string {
    const dias = parseInt(duracion.split(' ')[0]) || 7;
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
  }

  getTotalGastos(gastos: { concepto: string; monto: number }[]): number {
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

  closeAuthWarning(): void {
    this.mostrarAuthWarning = false;
  }

  onAuthWarningLogin(): void {
    this.mostrarAuthWarning = false;
    this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
  }

  onAuthWarningSignup(): void {
    this.mostrarAuthWarning = false;
    this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
  }

  cerrarModalReservaExitosa(): void {
    this.mostrarModalReservaExitosa = false;
    this.navegarAViajes.emit();
  }

  cerrarModalErrorReserva(): void {
    this.mostrarModalErrorReserva = false;
  }

  private notificarAgenciaReservacion(viajeId: number): void {
    if (!this.paqueteSeleccionado || !this.agenciaSeleccionada) return;

    // Obtener email de la agencia
    this.http.get<any>(`${this.apiUrl}/agencias/${this.agenciaSeleccionada.id}`, this.getAuthHeaders()).subscribe({
      next: (agencia) => {
        if (agencia.email) {
          const precioTotal = this.paqueteSeleccionado!.precio * this.numPersonas;
          const subject = `Nueva Reservación - ${this.paqueteSeleccionado!.nombre}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                🎉 ¡Nueva Reservación!
              </h2>
              
              <div style="background: #f7fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0;">Detalles del Paquete</h3>
                <p><strong>Paquete:</strong> ${this.paqueteSeleccionado!.nombre}</p>
                <p><strong>Duración:</strong> ${this.paqueteSeleccionado!.duracion}</p>
                <p><strong>Precio por persona:</strong> $${this.paqueteSeleccionado!.precio.toLocaleString()} MXN</p>
              </div>

              <div style="background: #e6fffa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #234e52; margin: 0 0 15px 0;">Información del Cliente</h3>
                <p><strong>Nombre:</strong> ${this.nombreCliente}</p>
                <p><strong>Email:</strong> ${this.emailCliente}</p>
                <p><strong>Teléfono:</strong> ${this.telefonoCliente || 'No proporcionado'}</p>
                <p><strong>Fecha de salida:</strong> ${this.formatearFecha(this.fechaSalida)}</p>
              </div>

              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0;">💰 Resumen de la Reservación</h3>
                <p style="font-size: 18px;"><strong>Número de personas:</strong> ${this.numPersonas}</p>
                <p style="font-size: 24px; margin: 10px 0;"><strong>Total:</strong> $${precioTotal.toLocaleString()} MXN</p>
              </div>

              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                ID de reservación: #${viajeId}<br>
                Este correo fue enviado automáticamente desde TravelPin.
              </p>
            </div>
          `;

          // Enviar correo a la agencia
          fetch(`${this.apiUrl}/email/test-send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: agencia.email, subject, html })
          }).then(() => {
            console.log('Notificación enviada a la agencia:', agencia.email);
          }).catch(err => {
            console.error('Error al notificar a la agencia:', err);
          });
        }
      },
      error: (err) => {
        console.warn('No se pudo obtener información de la agencia:', err);
      }
    });
  }
}