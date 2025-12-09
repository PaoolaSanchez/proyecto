//trip-detail.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { TripExpensesComponent } from '../trip-expenses/trip-expenses.component';
import { TripMapComponent } from '../trip-map/trip-map.component';
import { DestinosService, DestinoCompleto } from '../../services/destinos.service';
import { AuthService } from '../../services/auth.service';
import { TripSyncService, TripEvent } from '../../services/trip-sync.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';



interface Participante {
  id: string;
  nombre: string;
  iniciales: string;
  color: string;
  email?: string;
}

interface DestinoItinerario {
  id: number;
  nombre: string;
  pais: string;
  imagen: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface Recordatorio {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  completado: boolean;
}

interface DetalleViaje {
  id: number;
  nombre: string;
  icono: string;
  participantes: Participante[];
  itinerario: DestinoItinerario[];
  recordatorios: Recordatorio[];
  fechaCreacion: Date;
  fechaInicio?: string;
  fechaFin?: string;
}

interface Coleccion {
  id: number;
  nombre: string;
  icono: string;
  destinos: number[];
  fechaCreacion?: number;
  fechaInicio?: string;
  fechaFin?: string;
  finalizado?: boolean;
  calificacion?: number;
  reseña?: string;
  participantes?: any[];
  recordatorios?: any[];
}

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, TripExpensesComponent, TripMapComponent],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.css']
})
export class TripDetailComponent implements OnInit, OnDestroy {
  @Input() viajeId?: number;
  @Output() volver = new EventEmitter<void>();
  @Output() verDetalleDestino = new EventEmitter<number>();
  @Output() navegarATab = new EventEmitter<string>();

  private apiUrl = environment.apiUrl;
  
  viaje?: DetalleViaje;
  currentTab: string = 'viajes';
  nuevoAmigo: string = '';
  nuevoAmigoEmail: string = '';
  mostrarAgregarAmigo: boolean = false;
  mostrarGastos: boolean = false;
  mostrarMapa: boolean = false;
  
  // Estado del viaje desde el backend
  viajeFinalizado: boolean = false;
  userRole: string = 'propietario'; // 'propietario' o 'compartido'
  
  // Propiedades para calificación
  mostrarModalCalificacion: boolean = false;
  calificacionSeleccionada: number = 0;
  resenaViaje: string = '';
  viajeCalificado: boolean = false;

  // Propiedades para recordatorios
  mostrarFormularioRecordatorio: boolean = false;
  nuevoRecordatorioTitulo: string = '';
  nuevoRecordatorioFecha: string = '';
  
  // Propiedades compartir...
mostrarModalCompartir: boolean = false;
enlaceInvitacion: string = '';
emailInvitacion: string = '';

// Propiedades para modales de notificación
mostrarModalLinkCopiado: boolean = false;
mostrarModalCorreoEnviado: boolean = false;
mostrarModalCorreoInvalido: boolean = false;
mensajeCorreoInvalido: string = '';

// Propiedades para modal de finalizar viaje
mostrarModalConfirmarFinalizar: boolean = false;
mostrarModalViajeFinalizadoExito: boolean = false;
finalizandoViaje: boolean = false;

// Propiedades para modal de calificación guardada
mostrarModalGraciasCalificacion: boolean = false;
mostrarModalSeleccionaCalificacion: boolean = false;

// Propiedades para modal de agregar participante
mostrarModalAgregarParticipante: boolean = false;
nombreNuevoParticipante: string = '';
emailNuevoParticipante: string = '';
enviandoInvitacion: boolean = false;
mostrarModalInvitacionEnviada: boolean = false;
mostrarModalErrorInvitacion: boolean = false;
mensajeErrorInvitacion: string = '';

// Propiedades para modal de eliminar participante
mostrarModalEliminarParticipante: boolean = false;
participanteAEliminar: Participante | null = null;
eliminandoParticipante: boolean = false;

// Propiedades para modal del mapa Leaflet
mostrarModalMapa: boolean = false;
private mapaLeaflet: any;
private L: any;

// Suscripción a eventos de sincronización
private syncSubscription?: Subscription;

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Nota: ahora cargamos destinos desde el backend via DestinosService
  destinosDB: DestinoCompleto[] = [];

  constructor(
    private destinosService: DestinosService, 
    private authService: AuthService, 
    private http: HttpClient,
    private tripSyncService: TripSyncService
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

  ngOnInit(): void {
    console.log('TripDetail ngOnInit - viajeId:', this.viajeId);
    
    if (!this.viajeId) {
      console.error('No se proporcionó viajeId');
      return;
    }
    
    // Cargar cache inicial de destinos (no bloqueante)
    this.destinosService.cargarDestinosDesdeBackend().subscribe({
      next: (destinos) => {
        this.destinosDB = destinos;
        this.cargarDetalleViaje();
      },
      error: () => {
        // Si falla, aún intentamos cargar desde cache
        const cache = this.destinosService.getDestinos();
        this.destinosDB = cache as DestinoCompleto[];
        this.cargarDetalleViaje();
      }
    });
    
    // Conectar a sincronización en tiempo real
    this.conectarSincronizacion();
  }
  
  private conectarSincronizacion(): void {
    if (!this.viajeId || !this.isBrowser) return;
    
    this.syncSubscription = this.tripSyncService.conectarAViaje(this.viajeId).subscribe({
      next: (evento: TripEvent) => {
        this.procesarEventoSincronizacion(evento);
      },
      error: (err) => {
        console.error('Error en sincronización:', err);
      }
    });
  }
  
  private procesarEventoSincronizacion(evento: TripEvent): void {
    console.log('📡 Procesando evento de sincronización:', evento.type);
    
    switch (evento.type) {
      case 'participante_agregado':
      case 'participante_eliminado':
      case 'gasto_agregado':
      case 'pago_agregado':
      case 'itinerario_agregado':
      case 'itinerario_actualizado':
      case 'recordatorio_agregado':
      case 'recordatorio_actualizado':
      case 'recordatorio_eliminado':
      case 'viaje_actualizado':
        // Recargar todo el viaje para mantener sincronización
        console.log('🔄 Recargando datos del viaje...');
        this.cargarDetalleViaje();
        break;
        
      case 'ping':
      case 'connected':
        // Eventos de sistema, ignorar
        break;
        
      default:
        console.log('Evento desconocido:', evento.type);
    }
  }
  
  ngOnDestroy(): void {
    // Desconectar de la sincronización al salir del componente
    this.syncSubscription?.unsubscribe();
    this.tripSyncService.desconectar();
    
    // Limpiar mapa si existe
    if (this.mapaLeaflet) {
      this.mapaLeaflet.remove();
      this.mapaLeaflet = null;
    }
  }

  cargarDetalleViaje(): void {
    if (!this.viajeId) {
      console.error('cargarDetalleViaje: No hay viajeId');
      return;
    }

    console.log('Cargando detalles del viaje:', this.viajeId);

    const colecciones = this.obtenerColecciones();
    console.log('Colecciones encontradas:', colecciones.length);
    
    const coleccion = colecciones.find(c => c.id === this.viajeId);
    console.log('Colección encontrada:', coleccion);

    if (coleccion) {
      this.viaje = {
        id: coleccion.id,
        nombre: coleccion.nombre,
        icono: coleccion.icono,
        fechaInicio: coleccion.fechaInicio,
        fechaFin: coleccion.fechaFin,
        participantes: [],
        itinerario: [],
        recordatorios: [],
        fechaCreacion: new Date(coleccion.fechaCreacion ?? Date.now())
      };

      // Verificar si el viaje está finalizado y calificado
      this.viajeCalificado = Boolean(coleccion.finalizado && coleccion.calificacion);
      this.calificacionSeleccionada = coleccion.calificacion ?? 0;
      this.resenaViaje = coleccion.reseña ?? '';

      // Verificar si el viaje existe en el backend, si no existe lo creamos
      this.http.get<any>(`${this.apiUrl}/viajes/${this.viajeId}`, this.getAuthHeaders()).subscribe({
        next: (viajeBackend) => {
          // El viaje existe en el backend, proceder normalmente
          console.log('✅ Viaje existe en backend:', viajeBackend);
          
          // Actualizar estado desde el backend
          this.viajeFinalizado = Boolean(viajeBackend.finalizado);
          this.userRole = viajeBackend.userRole || 'propietario';
          
          // Sincronizar el estado local con el backend
          if (viajeBackend.finalizado !== coleccion.finalizado) {
            coleccion.finalizado = viajeBackend.finalizado;
            this.guardarColeccionLocal(coleccion);
          }
          
          this.cargarDatosViaje(coleccion);
        },
        error: (err) => {
          if (err.status === 404) {
            // El viaje no existe en el backend, lo creamos
            console.log('⚠️ Viaje no existe en backend, creando...');
            this.sincronizarViajeConBackend(coleccion);
          } else {
            console.error('Error al verificar viaje:', err);
            // Intentar cargar datos locales como fallback
            this.cargarDatosLocales(coleccion);
          }
        }
      });
    } else {
      // Si no se encuentra la colección en localStorage, intentar cargar solo desde backend
      console.log('⚠️ Colección no encontrada en localStorage, buscando en backend...');
      this.http.get<any>(`${this.apiUrl}/viajes/${this.viajeId}`, this.getAuthHeaders()).subscribe({
        next: (viajeBackend) => {
          console.log('✅ Viaje encontrado en backend:', viajeBackend);
          
          // Guardar estado del viaje y rol del usuario
          this.viajeFinalizado = Boolean(viajeBackend.finalizado);
          this.userRole = viajeBackend.userRole || 'compartido';
          
          this.viaje = {
            id: viajeBackend.id,
            nombre: viajeBackend.nombre,
            icono: viajeBackend.icono || '✈️',
            fechaInicio: viajeBackend.fecha_inicio || viajeBackend.fechaInicio,
            fechaFin: viajeBackend.fecha_fin || viajeBackend.fechaFin,
            participantes: [],
            itinerario: [],
            recordatorios: [],
            fechaCreacion: new Date(viajeBackend.created_at || Date.now())
          };
          
          // Crear la colección local para mantener sincronizado
          const nuevaColeccion: Coleccion = {
            id: viajeBackend.id,
            nombre: viajeBackend.nombre,
            icono: viajeBackend.icono || '✈️',
            destinos: [],
            fechaCreacion: Date.now(),
            fechaInicio: viajeBackend.fecha_inicio || viajeBackend.fechaInicio,
            fechaFin: viajeBackend.fecha_fin || viajeBackend.fechaFin,
            finalizado: viajeBackend.finalizado
          };
          
          // Guardar en localStorage para invitados
          this.guardarColeccionLocal(nuevaColeccion);
          
          this.cargarDatosViaje(nuevaColeccion);
        },
        error: (err) => {
          console.error('Error al cargar viaje desde backend:', err);
          // El viaje no existe ni en localStorage ni en backend
          this.volver.emit();
        }
      });
    }

    console.log('Detalle del viaje cargado:', this.viaje);
  }
  
  private guardarColeccionLocal(coleccion: Coleccion): void {
    if (!this.isBrowser) return;
    try {
      const colecciones = this.obtenerColecciones();
      const idx = colecciones.findIndex(c => c.id === coleccion.id);
      if (idx >= 0) {
        colecciones[idx] = { ...colecciones[idx], ...coleccion };
      } else {
        colecciones.push(coleccion);
      }
      localStorage.setItem(this.getStorageKey(), JSON.stringify(colecciones));
    } catch (e) {
      console.error('Error guardando colección local:', e);
    }
  }

  private cargarDatosLocales(coleccion: Coleccion): void {
    // Cargar datos solo desde localStorage como fallback
    console.log('Cargando datos desde localStorage como fallback');
    
    // Mapear destinos locales
    if (coleccion.destinos && coleccion.destinos.length > 0) {
      this.viaje!.itinerario = coleccion.destinos.map((destinoId: number) => {
        const destino = this.destinosDB.find(d => d.id === destinoId);
        return {
          id: destinoId,
          nombre: destino?.nombre || 'Destino',
          pais: destino?.pais || '',
          imagen: destino?.imagen || ''
        };
      }).filter(d => d.nombre !== 'Destino');
    }

    // Cargar participantes locales
    const participantesLocal = (coleccion as any)['participantes'] ?? [];
    this.viaje!.participantes = participantesLocal.map((p: any) => ({
      id: String(p.id || Date.now()),
      nombre: p.nombre,
      iniciales: p.iniciales || this.obtenerIniciales(p.nombre || ''),
      color: p.color || this.generarColorAleatorio(),
      email: p.email
    }));

    // Cargar recordatorios locales
    const recordatoriosLocal = (coleccion as any)['recordatorios'] ?? [];
    this.viaje!.recordatorios = recordatoriosLocal.map((r: any) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      fecha: r.fecha,
      completado: Boolean(r.completado)
    }));

    // Agregar usuario actual como participante si no hay ninguno
    if (this.viaje!.participantes.length === 0) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        const nombre = currentUser.email ? currentUser.email.split('@')[0] : 'Usuario';
        this.viaje!.participantes.push({
          id: currentUser.uid || 'u_' + Date.now(),
          nombre: nombre,
          iniciales: this.obtenerIniciales(nombre),
          color: '#FF6B6B',
          email: currentUser.email
        });
      }
    }
  }

  private sincronizarViajeConBackend(coleccion: Coleccion): void {
    // Obtener el ID del usuario actual
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.uid ? parseInt(currentUser.uid) : null;

    // El servidor obtiene automáticamente los datos del usuario de la base de datos
    const viajeData = {
      nombre: coleccion.nombre,
      icono: coleccion.icono,
      destinos: coleccion.destinos || [],
      fechaInicio: coleccion.fechaInicio,
      fechaFin: coleccion.fechaFin,
      usuario_id: usuarioId
    };

    this.http.post<{ id: number }>(`${this.apiUrl}/viajes`, viajeData, this.getAuthHeaders()).subscribe({
      next: (response) => {
        console.log('✅ Viaje creado en backend con ID:', response.id);
        
        // Actualizar el ID en localStorage
        const colecciones = this.obtenerColecciones();
        const idx = colecciones.findIndex(c => c.id === coleccion.id);
        if (idx !== -1) {
          colecciones[idx].id = response.id;
          localStorage.setItem(this.getStorageKey(), JSON.stringify(colecciones));
        }
        
        // Actualizar el ID local
        this.viajeId = response.id;
        if (this.viaje) {
          this.viaje.id = response.id;
        }
        
        // Ahora cargar los datos del viaje con el nuevo ID
        coleccion.id = response.id;
        this.cargarDatosViaje(coleccion);
      },
      error: (err) => {
        console.error('Error al sincronizar viaje con backend:', err);
        // Cargar datos locales como fallback
        this.cargarDatosViaje(coleccion);
      }
    });
  }

  private cargarDatosViaje(coleccion: Coleccion): void {
    // Usar el ID correcto (puede haber sido actualizado)
    const viajeIdActual = this.viaje?.id || this.viajeId;
    const headers = this.getAuthHeaders();

    // Cargar destinos, itinerario, participantes y recordatorios del backend
    const destinos$ = this.http.get<any[]>(`${this.apiUrl}/viajes/${viajeIdActual}/destinos`, headers);
    const itinerario$ = this.http.get<any[]>(`${this.apiUrl}/viajes/${viajeIdActual}/itinerario`, headers);
    const participantes$ = this.http.get<any[]>(`${this.apiUrl}/viajes/${viajeIdActual}/participantes`, headers);
    const recordatorios$ = this.http.get<any[]>(`${this.apiUrl}/viajes/${viajeIdActual}/recordatorios`, headers);

    forkJoin({ destinos: destinos$, itinerario: itinerario$, participantes: participantes$, recordatorios: recordatorios$ }).subscribe({
      next: (result) => {
        console.log('📦 Datos cargados del backend:', result);
        
        // Mapear destinos desde el backend (tabla viaje_destinos con JOIN a destinos)
        this.viaje!.itinerario = (result.destinos || []).map(d => ({
          id: d.id,
          nombre: d.nombre,
          pais: d.pais,
          imagen: d.imagen_principal || d.imagen || '',
          orden: d.orden
        }));
        
        console.log('🗺️ Destinos del viaje:', this.viaje!.itinerario);

        // Mapear participantes desde el backend al formato local
        this.viaje!.participantes = (result.participantes || []).map(p => ({
          id: String(p.id),
          nombre: p.nombre,
          iniciales: p.iniciales || this.obtenerIniciales(p.nombre || ''),
          color: p.color || this.generarColorAleatorio(),
          email: p.email
        }));

        // Asegurar que el creador (usuario actual) aparezca como primer participante
        const currentUser = this.authService.getCurrentUser();
        // Intentar obtener nombre del perfil guardado en localStorage ('travelplus_usuario')
        let ownerName: string | undefined;
        let ownerId: string | undefined;

        if (currentUser) {
          ownerId = currentUser.uid;
          // nombre por defecto desde el email si no hay perfil local
          ownerName = currentUser.email ? currentUser.email.split('@')[0] : undefined;
        }

        try {
          const perfil = localStorage.getItem('travelplus_usuario');
          if (perfil) {
            const p = JSON.parse(perfil);
            if (p && p.nombre) {
              ownerName = p.nombre;
            }
            if (!ownerId && p && p.email) {
              ownerId = 'u_' + p.email;
            }
          }
        } catch (e) {
          // ignore
        }

        if (ownerName && this.viaje!.participantes.length === 0) {
          // Solo agregar si no hay ningún participante (viaje creado localmente sin backend)
          this.viaje!.participantes.unshift({
            id: String(ownerId || ('u_' + ownerName)),
            nombre: ownerName,
            iniciales: this.obtenerIniciales(ownerName),
            color: '#FF6B6B',
            email: currentUser?.email
          });
        }

        // Mapear recordatorios
        this.viaje!.recordatorios = (result.recordatorios || []).map(r => ({
          id: r.id,
          titulo: r.titulo,
          descripcion: r.descripcion,
          fecha: r.fecha,
          completado: Boolean(r.completado)
        }));
        
        // Guardar itinerario del backend si existe
        if (result.itinerario && result.itinerario.length > 0) {
          // El itinerario son las actividades diarias, no los destinos
          console.log('📋 Itinerario de actividades:', result.itinerario);
        }
      },
      error: (err) => {
        console.warn('⚠️ Error al cargar detalles del viaje:', err);
        // En caso de error, intentar cargar desde localStorage como fallback
        this.cargarDatosLocales(coleccion);
      }
    });
  }

  obtenerColecciones(): Coleccion[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al cargar colecciones:', error);
      return [];
    }
  }

  volverAtras(): void {
    this.volver.emit();
  }

  verGastos(): void {
    console.log('Ver gastos del viaje');
    this.mostrarGastos = true;
  }

  volverDeGastos(): void {
    this.mostrarGastos = false;
  }

  verMapa(): void {
    console.log('Ver mapa del viaje');
    this.abrirModalMapa();
  }

  volverDeMapa(): void {
    this.mostrarMapa = false;
  }

  finalizarViaje(): void {
    if (!this.viaje) return;
    this.mostrarModalConfirmarFinalizar = true;
  }

  cancelarFinalizar(): void {
    this.mostrarModalConfirmarFinalizar = false;
  }

  confirmarFinalizarViaje(): void {
    if (!this.viaje) return;
    
    this.finalizandoViaje = true;
    
    const colecciones = this.obtenerColecciones();
    const coleccion = colecciones.find(c => c.id === this.viajeId);
    
    if (coleccion) {
      coleccion.finalizado = true;
      localStorage.setItem(this.getStorageKey(), JSON.stringify(colecciones));
      
      // También actualizar en el backend
      this.http.put(`${this.apiUrl}/viajes/${this.viajeId}`, {
        nombre: coleccion.nombre,
        fechaInicio: coleccion.fechaInicio,
        fechaFin: coleccion.fechaFin,
        finalizado: true
      }, this.getAuthHeaders()).subscribe({
        next: () => console.log('Viaje actualizado en backend'),
        error: (err) => console.warn('Error al actualizar viaje en backend:', err)
      });
      
      this.finalizandoViaje = false;
      this.mostrarModalConfirmarFinalizar = false;
      this.mostrarModalViajeFinalizadoExito = true;
      
      // Cerrar modal de éxito después de 2.5 segundos y mostrar calificación
      setTimeout(() => {
        this.mostrarModalViajeFinalizadoExito = false;
        this.mostrarModalCalificacion = true;
      }, 2500);
    } else {
      this.finalizandoViaje = false;
      this.mostrarModalConfirmarFinalizar = false;
    }
  }

  abrirModalCalificacion(): void {
    this.mostrarModalCalificacion = true;
  }

  cerrarModalCalificacion(): void {
    this.mostrarModalCalificacion = false;
  }

  seleccionarCalificacion(puntos: number): void {
    this.calificacionSeleccionada = puntos;
  }

  guardarCalificacion(): void {
    if (this.calificacionSeleccionada === 0) {
      this.mostrarModalSeleccionaCalificacion = true;
      return;
    }

    const colecciones = this.obtenerColecciones();
    const coleccion = colecciones.find(c => c.id === this.viajeId);
    
    if (coleccion) {
      coleccion.finalizado = true;
      coleccion.calificacion = this.calificacionSeleccionada;
      coleccion.reseña = this.resenaViaje.trim();
      localStorage.setItem(this.getStorageKey(), JSON.stringify(colecciones));
      
      this.viajeCalificado = true;
      this.cerrarModalCalificacion();
      
      // Mostrar modal de agradecimiento
      this.mostrarModalGraciasCalificacion = true;
      setTimeout(() => {
        this.mostrarModalGraciasCalificacion = false;
      }, 2500);
    }
  }

  cerrarModalSeleccionaCalificacion(): void {
    this.mostrarModalSeleccionaCalificacion = false;
  }

  esViajeActivo(): boolean {
    // Primero verificar el estado desde el backend
    if (this.viajeFinalizado) {
      return false;
    }
    // Fallback a localStorage
    const colecciones = this.obtenerColecciones();
    const coleccion = colecciones.find(c => c.id === this.viajeId);
    return !coleccion?.finalizado;
  }

  getEstrellas(): number[] {
    return [1, 2, 3, 4, 5];
  }

  mostrarFormularioAmigo(): void {
    // Mostrar modal para agregar participante
    this.nombreNuevoParticipante = '';
    this.emailNuevoParticipante = '';
    this.mostrarModalAgregarParticipante = true;
  }

  cerrarModalAgregarParticipante(): void {
    this.mostrarModalAgregarParticipante = false;
    this.nombreNuevoParticipante = '';
    this.emailNuevoParticipante = '';
    this.enviandoInvitacion = false;
  }

  enviarInvitacionYAgregarParticipante(): void {
    if (!this.nombreNuevoParticipante.trim() || !this.viaje) {
      return;
    }

    const nombre = this.nombreNuevoParticipante.trim();
    const email = this.emailNuevoParticipante.trim();

    if (!email) {
      this.mensajeErrorInvitacion = 'El correo electrónico es obligatorio para enviar la invitación';
      this.mostrarModalErrorInvitacion = true;
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.mensajeErrorInvitacion = 'Por favor ingresa un correo electrónico válido';
      this.mostrarModalErrorInvitacion = true;
      return;
    }

    this.enviandoInvitacion = true;

    // Primero generar el código de invitación
    const codigoViaje = `${this.viajeId}-${Date.now().toString(36)}`;
    
    // Crear invitación en el backend
    this.http.post<any>(`${this.apiUrl}/invitaciones`, { codigo: codigoViaje, viajeId: this.viajeId }, this.getAuthHeaders()).subscribe({
      next: () => {
        // Enviar email con la invitación
        const frontendOrigin = window.location.origin;
        const joinLink = `${frontendOrigin}/unirse-viaje/${codigoViaje}`;
        const subject = `Invitación a unirte al viaje: ${this.viaje?.nombre}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">🌍 ¡Estás invitado a un viaje!</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Has sido invitado a unirte al viaje "<strong>${this.viaje?.nombre}</strong>".</p>
            <p>Haz clic en el siguiente botón para unirte:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${joinLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Unirme al viaje</a>
            </p>
            <p style="color: #666; font-size: 14px;">O copia este enlace: ${joinLink}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Este correo fue enviado desde TravelPin</p>
          </div>
        `;

        // Llamar al backend de correo
        fetch(`${this.apiUrl}/email/test-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email, subject, html })
        }).then(response => {
          if (!response.ok) throw new Error('Error al enviar correo');
          
          // Correo enviado exitosamente
          // NO agregamos al participante aquí - se agregará cuando acepte la invitación
          
          // Cerrar modal y mostrar éxito
          this.enviandoInvitacion = false;
          this.mostrarModalAgregarParticipante = false;
          this.mostrarModalInvitacionEnviada = true;
          
          // Limpiar campos
          this.nombreNuevoParticipante = '';
          this.emailNuevoParticipante = '';
        }).catch(err => {
          console.error('Error al enviar invitación:', err);
          this.enviandoInvitacion = false;
          this.mensajeErrorInvitacion = 'No se pudo enviar el correo de invitación. Verifica tu conexión.';
          this.mostrarModalErrorInvitacion = true;
        });
      },
      error: (err) => {
        console.error('Error al crear invitación:', err);
        this.enviandoInvitacion = false;
        this.mensajeErrorInvitacion = 'Error al generar la invitación. Intenta de nuevo.';
        this.mostrarModalErrorInvitacion = true;
      }
    });
  }

  cerrarModalInvitacionEnviada(): void {
    this.mostrarModalInvitacionEnviada = false;
  }

  cerrarModalErrorInvitacion(): void {
    this.mostrarModalErrorInvitacion = false;
  }

  agregarAmigo(): void {
    // Método legacy, ahora usamos el modal
    this.mostrarFormularioAmigo();
  }

  cancelarAgregarAmigo(): void {
    this.nuevoAmigo = '';
    this.mostrarAgregarAmigo = false;
    this.cerrarModalAgregarParticipante();
  }

  // Abrir modal de confirmación para eliminar participante
  abrirModalEliminarParticipante(participante: Participante): void {
    this.participanteAEliminar = participante;
    this.mostrarModalEliminarParticipante = true;
  }

  // Cerrar modal de eliminar participante
  cerrarModalEliminarParticipante(): void {
    this.mostrarModalEliminarParticipante = false;
    this.participanteAEliminar = null;
    this.eliminandoParticipante = false;
  }

  // Confirmar eliminación del participante
  confirmarEliminarParticipante(): void {
    if (!this.viaje || !this.participanteAEliminar) return;
    
    this.eliminandoParticipante = true;
    const participante = this.participanteAEliminar;

    // Eliminar del backend
    this.http.delete(`${this.apiUrl}/participantes/${participante.id}`, this.getAuthHeaders()).subscribe({
      next: () => {
        this.viaje!.participantes = this.viaje!.participantes.filter(p => p.id !== participante.id);
        console.log('Participante eliminado correctamente');
        this.cerrarModalEliminarParticipante();
      },
      error: (err) => {
        console.error('Error al eliminar participante:', err);
        // Eliminar localmente de todos modos
        this.viaje!.participantes = this.viaje!.participantes.filter(p => p.id !== participante.id);
        this.cerrarModalEliminarParticipante();
      }
    });
  }

  // Método legacy para compatibilidad (ahora usa modal)
  eliminarParticipante(participante: Participante): void {
    this.abrirModalEliminarParticipante(participante);
  }

  verDestinoEnItinerario(destino: DestinoItinerario): void {
    console.log('Ver destino:', destino.nombre);
    this.verDetalleDestino.emit(destino.id);
  }

  eliminarDestinoItinerario(destino: DestinoItinerario): void {
    if (!this.viaje) return;
    
    const confirmar = confirm(`¿Eliminar ${destino.nombre} del itinerario?`);
    if (confirmar) {
      // Eliminar del backend
      this.http.delete(`${this.apiUrl}/viajes/${this.viaje.id}/itinerario/${destino.id}`, this.getAuthHeaders()).subscribe({
        next: () => {
          this.viaje!.itinerario = this.viaje!.itinerario.filter(d => d.id !== destino.id);
          
          // También actualizar localStorage
          const colecciones = this.obtenerColecciones();
          const coleccion = colecciones.find(c => c.id === this.viajeId);
          if (coleccion) {
            coleccion.destinos = coleccion.destinos.filter((id: number) => id !== destino.id);
            localStorage.setItem(this.getStorageKey(), JSON.stringify(colecciones));
          }
          console.log('Destino eliminado del itinerario');
        },
        error: (err) => {
          console.error('Error al eliminar destino del itinerario:', err);
          // Eliminar localmente de todos modos
          this.viaje!.itinerario = this.viaje!.itinerario.filter(d => d.id !== destino.id);
        }
      });
    }
  }

  toggleRecordatorio(recordatorio: Recordatorio): void {
    recordatorio.completado = !recordatorio.completado;
    // Actualizar en el backend
    this.http.put(`${this.apiUrl}/recordatorios/${recordatorio.id}`, { completado: recordatorio.completado }, this.getAuthHeaders()).subscribe({
      next: () => console.log('Recordatorio actualizado'),
      error: (err) => console.warn('Error al actualizar recordatorio:', err)
    });
  }

  eliminarRecordatorio(recordatorio: Recordatorio): void {
    if (!this.viaje) return;
    
    // Eliminar del backend
    this.http.delete(`${this.apiUrl}/recordatorios/${recordatorio.id}`, this.getAuthHeaders()).subscribe({
      next: () => {
        this.viaje!.recordatorios = this.viaje!.recordatorios.filter(r => r.id !== recordatorio.id);
        console.log('Recordatorio eliminado');
      },
      error: (err) => {
        console.error('Error al eliminar recordatorio:', err);
        // Eliminar localmente de todos modos
        this.viaje!.recordatorios = this.viaje!.recordatorios.filter(r => r.id !== recordatorio.id);
      }
    });
  }

  mostrarFormularioNuevoRecordatorio(): void {
  this.mostrarFormularioRecordatorio = true;
  this.nuevoRecordatorioTitulo = '';
  this.nuevoRecordatorioFecha = '';
}

cancelarRecordatorio(): void {
  this.mostrarFormularioRecordatorio = false;
  this.nuevoRecordatorioTitulo = '';
  this.nuevoRecordatorioFecha = '';
}

agregarRecordatorio(): void {
  if (!this.viaje) return;
  
  if (!this.nuevoRecordatorioTitulo.trim()) {
    alert('Por favor ingresa un título para el recordatorio');
    return;
  }

  if (!this.nuevoRecordatorioFecha.trim()) {
    alert('Por favor selecciona una fecha');
    return;
  }

  const fechaFormateada = this.formatearFecha(this.nuevoRecordatorioFecha);
  const payload = {
    titulo: this.nuevoRecordatorioTitulo.trim(),
    descripcion: 'Nuevo Recordatorio',
    fecha: fechaFormateada
  };

  // Guardar en el backend
  this.http.post<any>(`${this.apiUrl}/viajes/${this.viaje.id}/recordatorios`, payload, this.getAuthHeaders()).subscribe({
    next: (res) => {
      const nuevoRecordatorio: Recordatorio = {
        id: res.id || Date.now(),
        titulo: payload.titulo,
        descripcion: payload.descripcion,
        fecha: fechaFormateada,
        completado: false
      };
      
      this.viaje!.recordatorios.push(nuevoRecordatorio);
      this.cancelarRecordatorio();
      console.log('Recordatorio agregado correctamente');
    },
    error: (err) => {
      console.error('Error al agregar recordatorio:', err);
      alert('Error al guardar el recordatorio. Intenta de nuevo.');
    }
  });
}

formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

  guardarCambios(): void {
    console.log('Cambios guardados');
  }

  obtenerIniciales(nombre: string): string {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  generarColorAleatorio(): string {
    const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    return colores[Math.floor(Math.random() * colores.length)];
  }

 
abrirModalCompartir(): void {
  this.generarEnlaceInvitacion();
  this.mostrarModalCompartir = true;
}

cerrarModalCompartir(): void {
  this.mostrarModalCompartir = false;
  this.emailInvitacion = '';
}

generarEnlaceInvitacion(): void {
  // Generar un código único para el viaje
  const codigoViaje = `${this.viajeId}-${Date.now().toString(36)}`;
  
  // Usar window.location.origin que funciona tanto en local como en producción
  const baseUrl = window.location.origin;
  this.enlaceInvitacion = `${baseUrl}/unirse-viaje/${codigoViaje}`;
  
  // Guardar el código en localStorage para validación local
  const invitaciones = this.obtenerInvitaciones();
  invitaciones[codigoViaje] = {
    viajeId: this.viajeId,
    nombreViaje: this.viaje?.nombre,
    fechaCreacion: Date.now()
  };
  localStorage.setItem('travelplus_invitaciones', JSON.stringify(invitaciones));
  
  // ⭐ IMPORTANTE: También guardar en el backend para que funcione en producción
  this.http.post<any>(`${this.apiUrl}/invitaciones`, { 
    codigo: codigoViaje, 
    viajeId: this.viajeId 
  }, this.getAuthHeaders()).subscribe({
    next: () => {
      console.log('✅ Invitación guardada en el backend:', codigoViaje);
    },
    error: (err) => {
      console.warn('⚠️ Error al guardar invitación en backend (funcionará con localStorage):', err);
    }
  });
}

obtenerInvitaciones(): any {
  try {
    const data = localStorage.getItem('travelplus_invitaciones');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
}

copiarEnlace(): void {
  navigator.clipboard.writeText(this.enlaceInvitacion).then(() => {
    this.mostrarModalLinkCopiado = true;
    setTimeout(() => {
      this.mostrarModalLinkCopiado = false;
    }, 2500);
  }).catch(err => {
    console.error('Error al copiar:', err);
    // Fallback para navegadores que no soportan clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = this.enlaceInvitacion;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.mostrarModalLinkCopiado = true;
    setTimeout(() => {
      this.mostrarModalLinkCopiado = false;
    }, 2500);
  });
}

compartirPorEmail(): void {
  if (!this.emailInvitacion.trim()) {
    this.mensajeCorreoInvalido = 'Por favor ingresa un correo electrónico';
    this.mostrarModalCorreoInvalido = true;
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.emailInvitacion)) {
    this.mensajeCorreoInvalido = 'Por favor ingresa un correo electrónico válido';
    this.mostrarModalCorreoInvalido = true;
    return;
  }

  // Obtener nombre del remitente
  const user = this.authService.getCurrentUser();
  let senderName = 'Un amigo';
  if (user && user.email) {
    senderName = user.email.split('@')[0];
  }

  // Enviar invitación a través del backend
  const payload = {
    email: this.emailInvitacion,
    tripName: this.viaje?.nombre || 'Viaje',
    invitationLink: this.enlaceInvitacion,
    senderName: senderName
  };

  this.http.post<any>(`${this.apiUrl}/viajes/invitar-email`, payload, this.getAuthHeaders()).subscribe({
    next: (res) => {
      console.log('Invitación enviada:', res);
      this.mostrarModalCorreoEnviado = true;
      this.emailInvitacion = ''; // Limpiar el campo
      setTimeout(() => {
        this.mostrarModalCorreoEnviado = false;
        this.cerrarModalCompartir();
      }, 2500);
    },
    error: (err) => {
      console.error('Error al enviar invitación:', err);
      // Fallback: abrir cliente de email
      const asunto = `Invitación a ${this.viaje?.nombre}`;
      const cuerpo = `¡Hola! Te invito a unirte a mi viaje "${this.viaje?.nombre}".\n\nHaz clic en este enlace para unirte:\n${this.enlaceInvitacion}\n\n¡Nos vemos pronto!`;
      const mailtoLink = `mailto:${this.emailInvitacion}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
      window.location.href = mailtoLink;
      
      this.mostrarModalCorreoEnviado = true;
      setTimeout(() => {
        this.mostrarModalCorreoEnviado = false;
        this.cerrarModalCompartir();
      }, 2500);
    }
  });
}

compartirPorWhatsApp(): void {
  const mensaje = `¡Hola! Te invito a unirte a mi viaje "${this.viaje?.nombre}". 

Únete aquí: ${this.enlaceInvitacion}`;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  window.open(whatsappUrl, '_blank');
}

compartirPorRedes(): void {
  // Compartir usando la API nativa del navegador si está disponible
  if (navigator.share) {
    navigator.share({
      title: `Invitación a ${this.viaje?.nombre}`,
      text: `¡Únete a mi viaje!`,
      url: this.enlaceInvitacion
    }).catch(err => console.log('Error al compartir:', err));
  } else {
    this.copiarEnlace();
  }
}

// Reemplaza el método compartir() existente:
compartir(): void {
  this.abrirModalCompartir();
}


  getContadorParticipantes(): string {
    if (!this.viaje) return '0';
    const count = this.viaje.participantes.length;
    return count === 1 ? '1' : `${count}`;
  }

  getContadorItinerario(): string {
    if (!this.viaje) return '0';
    return `${this.viaje.itinerario.length}`;
  }

  cerrarModalCorreoInvalido(): void {
    this.mostrarModalCorreoInvalido = false;
    this.mensajeCorreoInvalido = '';
  }

  cambiarTab(tab: string): void {
    this.navegarATab.emit(tab);
  }

  // Getter para obtener recordatorios ordenados por fecha (del primero al último día)
  get recordatoriosOrdenados(): Recordatorio[] {
    if (!this.viaje || !this.viaje.recordatorios) return [];
    
    return [...this.viaje.recordatorios].sort((a, b) => {
      const fechaA = this.parsearFecha(a.fecha);
      const fechaB = this.parsearFecha(b.fecha);
      return fechaA.getTime() - fechaB.getTime();
    });
  }

  // Helper para parsear fechas en diferentes formatos
  private parsearFecha(fechaStr: string): Date {
    if (!fechaStr) return new Date(0);
    
    // Intentar parseo directo
    let fecha = new Date(fechaStr);
    if (!isNaN(fecha.getTime())) return fecha;
    
    // Formato "dd de mes, yyyy" o "dd mes yyyy"
    const meses: { [key: string]: number } = {
      'ene': 0, 'enero': 0,
      'feb': 1, 'febrero': 1,
      'mar': 2, 'marzo': 2,
      'abr': 3, 'abril': 3,
      'may': 4, 'mayo': 4,
      'jun': 5, 'junio': 5,
      'jul': 6, 'julio': 6,
      'ago': 7, 'agosto': 7,
      'sep': 8, 'sept': 8, 'septiembre': 8,
      'oct': 9, 'octubre': 9,
      'nov': 10, 'noviembre': 10,
      'dic': 11, 'diciembre': 11
    };
    
    // Limpiar la cadena
    const limpio = fechaStr.toLowerCase().replace(/[.,]/g, '').replace(/de /g, '');
    const partes = limpio.split(/\s+/);
    
    if (partes.length >= 3) {
      const dia = parseInt(partes[0], 10);
      const mes = meses[partes[1]];
      const anio = parseInt(partes[2], 10);
      
      if (!isNaN(dia) && mes !== undefined && !isNaN(anio)) {
        return new Date(anio, mes, dia);
      }
    }
    
    return new Date(0);
  }

  // ============================================
  // Métodos del Modal del Mapa con Leaflet
  // ============================================

  async abrirModalMapa(): Promise<void> {
    if (!this.viaje || !this.isBrowser) return;

    this.mostrarModalMapa = true;

    try {
      const leafletModule = await import('leaflet');
      this.L = leafletModule.default || leafletModule;

      setTimeout(() => {
        this.inicializarMapaViaje();
      }, 100);
    } catch (error) {
      console.error('Error al cargar Leaflet:', error);
    }
  }

  private inicializarMapaViaje(): void {
    if (!this.L || !this.viaje) return;

    const mapElement = document.getElementById('mapa-viaje-modal');
    if (!mapElement) {
      setTimeout(() => this.inicializarMapaViaje(), 100);
      return;
    }

    // Destruir mapa anterior si existe
    if (this.mapaLeaflet) {
      this.mapaLeaflet.remove();
    }

    // Coordenadas de destinos
    const coordinadasDestinos: { [key: string]: { lat: number; lng: number } } = {
      'París': { lat: 48.8566, lng: 2.3522 },
      'Roma': { lat: 41.9028, lng: 12.4964 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Tokio': { lat: 35.6762, lng: 139.6503 },
      'Nueva York': { lat: 40.7128, lng: -74.0060 },
      'New York': { lat: 40.7128, lng: -74.0060 },
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'Londres': { lat: 51.5074, lng: -0.1278 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Bali': { lat: -8.3405, lng: 115.0920 },
      'Cancún': { lat: 21.1619, lng: -86.8515 },
      'Cancun': { lat: 21.1619, lng: -86.8515 },
      'Machu Picchu': { lat: -13.1631, lng: -72.5450 },
      'Santorini': { lat: 36.3932, lng: 25.4615 },
      'Dubái': { lat: 25.2048, lng: 55.2708 },
      'Dubai': { lat: 25.2048, lng: 55.2708 },
      'Sydney': { lat: -33.8688, lng: 151.2093 },
      'Maldivas': { lat: 3.2028, lng: 73.2207 },
      'Islandia': { lat: 64.9631, lng: -19.0208 },
      'Marrakech': { lat: 31.6295, lng: -7.9811 },
      'Venecia': { lat: 45.4408, lng: 12.3155 },
      'Ámsterdam': { lat: 52.3676, lng: 4.9041 },
      'Amsterdam': { lat: 52.3676, lng: 4.9041 },
      'Praga': { lat: 50.0755, lng: 14.4378 },
      'Bangkok': { lat: 13.7563, lng: 100.5018 },
      'Cairo': { lat: 30.0444, lng: 31.2357 },
      'El Cairo': { lat: 30.0444, lng: 31.2357 },
      'Cusco': { lat: -13.5319, lng: -71.9675 },
      'Cartagena': { lat: 10.3910, lng: -75.4794 },
      'San Francisco': { lat: 37.7749, lng: -122.4194 },
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'Las Vegas': { lat: 36.1699, lng: -115.1398 },
      'Miami': { lat: 25.7617, lng: -80.1918 },
      'Punta Cana': { lat: 18.5601, lng: -68.3725 },
      'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
      'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
      'México DF': { lat: 19.4326, lng: -99.1332 },
      'Ciudad de México': { lat: 19.4326, lng: -99.1332 },
      'Lima': { lat: -12.0464, lng: -77.0428 },
      'Bogotá': { lat: 4.7110, lng: -74.0721 },
      'Santiago': { lat: -33.4489, lng: -70.6693 },
      'Quito': { lat: -0.1807, lng: -78.4678 },
      'Guayaquil': { lat: -2.1894, lng: -79.8891 },
      'Galápagos': { lat: -0.9538, lng: -90.9656 },
      'Islas Galápagos': { lat: -0.9538, lng: -90.9656 },
      'Madrid': { lat: 40.4168, lng: -3.7038 },
      'Sevilla': { lat: 37.3891, lng: -5.9845 },
      'Granada': { lat: 37.1773, lng: -3.5986 },
      'Berlín': { lat: 52.5200, lng: 13.4050 },
      'Múnich': { lat: 48.1351, lng: 11.5820 },
      'Viena': { lat: 48.2082, lng: 16.3738 },
      'Zurich': { lat: 47.3769, lng: 8.5417 },
      'Ginebra': { lat: 46.2044, lng: 6.1432 },
      'Atenas': { lat: 37.9838, lng: 23.7275 },
      'Mykonos': { lat: 37.4467, lng: 25.3289 },
      'Estambul': { lat: 41.0082, lng: 28.9784 },
      'Moscú': { lat: 55.7558, lng: 37.6173 },
      'San Petersburgo': { lat: 59.9343, lng: 30.3351 },
      'Seúl': { lat: 37.5665, lng: 126.9780 },
      'Hong Kong': { lat: 22.3193, lng: 114.1694 },
      'Singapur': { lat: 1.3521, lng: 103.8198 },
      'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
      'Hanói': { lat: 21.0285, lng: 105.8542 },
      'Ho Chi Minh': { lat: 10.8231, lng: 106.6297 },
      'Phuket': { lat: 7.8804, lng: 98.3923 },
      'Siem Reap': { lat: 13.3671, lng: 103.8448 },
      'Kyoto': { lat: 35.0116, lng: 135.7681 },
      'Osaka': { lat: 34.6937, lng: 135.5023 },
      'Beijing': { lat: 39.9042, lng: 116.4074 },
      'Pekín': { lat: 39.9042, lng: 116.4074 },
      'Shanghai': { lat: 31.2304, lng: 121.4737 },
      'Nueva Delhi': { lat: 28.6139, lng: 77.2090 },
      'Agra': { lat: 27.1767, lng: 78.0081 },
      'Jaipur': { lat: 26.9124, lng: 75.7873 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Goa': { lat: 15.2993, lng: 74.1240 },
      'Katmandú': { lat: 27.7172, lng: 85.3240 },
      'Cape Town': { lat: -33.9249, lng: 18.4241 },
      'Ciudad del Cabo': { lat: -33.9249, lng: 18.4241 },
      'Johannesburgo': { lat: -26.2041, lng: 28.0473 },
      'Safari Kruger': { lat: -23.9884, lng: 31.5547 },
      'Nairobi': { lat: -1.2921, lng: 36.8219 },
      'Zanzíbar': { lat: -6.1659, lng: 39.1989 },
      'Seychelles': { lat: -4.6796, lng: 55.4920 },
      'Mauricio': { lat: -20.3484, lng: 57.5522 },
      'Montreal': { lat: 45.5017, lng: -73.5673 },
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Vancouver': { lat: 49.2827, lng: -123.1207 },
      'Hawái': { lat: 19.8968, lng: -155.5828 },
      'Hawaii': { lat: 19.8968, lng: -155.5828 },
      'Alaska': { lat: 64.2008, lng: -149.4937 },
      'Patagonia': { lat: -41.8101, lng: -68.9063 },
      'Torres del Paine': { lat: -51.2538, lng: -72.3489 },
      'Iguazú': { lat: -25.6953, lng: -54.4367 },
      'Bariloche': { lat: -41.1335, lng: -71.3103 }
    };

    // Recopilar marcadores del itinerario
    const marcadores: { lat: number; lng: number; nombre: string; pais: string; imagen: string }[] = [];
    
    for (const destino of this.viaje.itinerario) {
      let coords = coordinadasDestinos[destino.nombre];
      
      if (!coords) {
        // Buscar coincidencia parcial
        const nombreLower = destino.nombre.toLowerCase();
        for (const [key, value] of Object.entries(coordinadasDestinos)) {
          if (key.toLowerCase().includes(nombreLower) || nombreLower.includes(key.toLowerCase())) {
            coords = value;
            break;
          }
        }
      }

      if (coords) {
        marcadores.push({
          ...coords,
          nombre: destino.nombre,
          pais: destino.pais,
          imagen: destino.imagen
        });
      }
    }

    // Determinar centro y zoom del mapa
    let centerLat = 20;
    let centerLng = 0;
    let zoom = 2;

    if (marcadores.length > 0) {
      const avgLat = marcadores.reduce((sum, m) => sum + m.lat, 0) / marcadores.length;
      const avgLng = marcadores.reduce((sum, m) => sum + m.lng, 0) / marcadores.length;
      centerLat = avgLat;
      centerLng = avgLng;
      zoom = marcadores.length === 1 ? 10 : 4;
    }

    // Crear el mapa
    this.mapaLeaflet = this.L.map('mapa-viaje-modal').setView([centerLat, centerLng], zoom);

    // Agregar capa de OpenStreetMap
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapaLeaflet);

    // Agregar marcadores
    marcadores.forEach((marcador, index) => {
      const customIcon = this.L.divIcon({
        className: 'custom-marker-trip',
        html: `
          <div class="marker-pin-trip">
            <span>${index + 1}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      const marker = this.L.marker([marcador.lat, marcador.lng], { icon: customIcon }).addTo(this.mapaLeaflet);

      const popupContent = `
        <div style="text-align: center; padding: 8px; min-width: 150px;">
          <img src="${marcador.imagen}" alt="${marcador.nombre}" 
               style="width: 120px; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
               onerror="this.style.display='none'">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #2d3748;">${marcador.nombre}</h3>
          <p style="margin: 0; font-size: 12px; color: #718096;">${marcador.pais}</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 200,
        className: 'custom-popup-trip'
      });
    });

    // Si hay múltiples marcadores, ajustar la vista para mostrar todos
    if (marcadores.length > 1) {
      const bounds = this.L.latLngBounds(marcadores.map(m => [m.lat, m.lng]));
      this.mapaLeaflet.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  cerrarModalMapa(): void {
    this.mostrarModalMapa = false;
    if (this.mapaLeaflet) {
      this.mapaLeaflet.remove();
      this.mapaLeaflet = null;
    }
  }
}