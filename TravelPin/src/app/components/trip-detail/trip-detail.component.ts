//trip-detail.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TripExpensesComponent } from '../trip-expenses/trip-expenses.component';
import { TripMapComponent } from '../trip-map/trip-map.component';
import { DestinosService, DestinoCompleto } from '../../services/destinos.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
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
export class TripDetailComponent implements OnInit {
  @Input() viajeId?: number;
  @Output() volver = new EventEmitter<void>();
  @Output() verDetalleDestino = new EventEmitter<number>();
  @Output() navegarATab = new EventEmitter<string>();

  private apiUrl = environment.apiUrl;
  
  viaje?: DetalleViaje;
  nuevoAmigo: string = '';
  nuevoAmigoEmail: string = '';
  mostrarAgregarAmigo: boolean = false;
  mostrarGastos: boolean = false;
  mostrarMapa: boolean = false;
  
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


  // Nota: ahora cargamos destinos desde el backend via DestinosService
  destinosDB: DestinoCompleto[] = [];

  constructor(private destinosService: DestinosService, private authService: AuthService, private http: HttpClient) {}

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.uid) {
      return `travelplus_colecciones_${user.uid}`;
    }
    return 'travelplus_colecciones';
  }

  ngOnInit(): void {
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
  }

  cargarDetalleViaje(): void {
    if (!this.viajeId) return;

    const colecciones = this.obtenerColecciones();
    const coleccion = colecciones.find(c => c.id === this.viajeId);

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

      // Verificar si el viaje existe en el backend, si no existe lo creamos
      this.http.get<any>(`/api/viajes/${this.viajeId}`).subscribe({
        next: (viajeBackend) => {
          // El viaje existe en el backend, proceder normalmente
          console.log('✅ Viaje existe en backend:', viajeBackend);
          this.cargarDatosViaje(coleccion);
        },
        error: (err) => {
          if (err.status === 404) {
            // El viaje no existe en el backend, lo creamos
            console.log('⚠️ Viaje no existe en backend, creando...');
            this.sincronizarViajeConBackend(coleccion);
          } else {
            console.error('Error al verificar viaje:', err);
            // Intentar cargar datos de todos modos
            this.cargarDatosViaje(coleccion);
          }
        }
      });

      // Verificar si el viaje está finalizado y calificado
      this.viajeCalificado = Boolean(coleccion.finalizado && coleccion.calificacion);
      this.calificacionSeleccionada = coleccion.calificacion ?? 0;
      this.resenaViaje = coleccion.reseña ?? '';
    }

    console.log('Detalle del viaje cargado:', this.viaje);
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

    this.http.post<{ id: number }>('/api/viajes', viajeData).subscribe({
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

    // Cargar itinerario, participantes y recordatorios del backend
    const itinerario$ = this.http.get<any[]>(`/api/viajes/${viajeIdActual}/itinerario`);
    const participantes$ = this.http.get<any[]>(`/api/viajes/${viajeIdActual}/participantes`);
    const recordatorios$ = this.http.get<any[]>(`/api/viajes/${viajeIdActual}/recordatorios`);

    forkJoin({ itinerario: itinerario$, participantes: participantes$, recordatorios: recordatorios$ }).subscribe({
      next: (result) => {
        // Mapear itinerario desde el backend
        this.viaje!.itinerario = (result.itinerario || []).map(d => ({
          id: d.id,
          nombre: d.nombre,
          pais: d.pais,
          imagen: d.imagen_principal || d.imagen,
          orden: d.orden
        }));

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
      },
      error: (err) => {
        console.warn('⚠️ Error al cargar detalles de destinos/participantes/recordatorios para el viaje:', err);
        // En caso de error, intentar cargar desde localStorage como fallback
        const participantesLocal = (coleccion as any)['participantes'] ?? [];
        this.viaje!.participantes = participantesLocal.map((p: any) => ({
          id: String(p.id || Date.now()),
          nombre: p.nombre,
          iniciales: p.iniciales || this.obtenerIniciales(p.nombre || ''),
          color: p.color || this.generarColorAleatorio(),
          email: p.email
        }));

        const recordatoriosLocal = (coleccion as any)['recordatorios'] ?? [];
        this.viaje!.recordatorios = recordatoriosLocal.map((r: any) => ({
          id: r.id,
          titulo: r.titulo,
          descripcion: r.descripcion,
          fecha: r.fecha,
          completado: Boolean(r.completado)
        }));
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
    this.mostrarMapa = true;
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
      this.http.put(`/api/viajes/${this.viajeId}`, {
        nombre: coleccion.nombre,
        fechaInicio: coleccion.fechaInicio,
        fechaFin: coleccion.fechaFin,
        finalizado: true
      }).subscribe({
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
    this.http.post<any>('/api/invitaciones', { codigo: codigoViaje, viajeId: this.viajeId }).subscribe({
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
        fetch('http://localhost:3000/api/email/test-send', {
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
    this.http.delete(`/api/participantes/${participante.id}`).subscribe({
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
      this.http.delete(`/api/viajes/${this.viaje.id}/itinerario/${destino.id}`).subscribe({
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
    this.http.put(`/api/recordatorios/${recordatorio.id}`, { completado: recordatorio.completado }).subscribe({
      next: () => console.log('Recordatorio actualizado'),
      error: (err) => console.warn('Error al actualizar recordatorio:', err)
    });
  }

  eliminarRecordatorio(recordatorio: Recordatorio): void {
    if (!this.viaje) return;
    
    // Eliminar del backend
    this.http.delete(`/api/recordatorios/${recordatorio.id}`).subscribe({
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
  this.http.post<any>(`/api/viajes/${this.viaje.id}/recordatorios`, payload).subscribe({
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
  
  // En producción, esto sería tu dominio real
  const baseUrl = window.location.origin;
  this.enlaceInvitacion = `${baseUrl}/unirse-viaje/${codigoViaje}`;
  
  // Guardar el código en localStorage para validación posterior
  const invitaciones = this.obtenerInvitaciones();
  invitaciones[codigoViaje] = {
    viajeId: this.viajeId,
    nombreViaje: this.viaje?.nombre,
    fechaCreacion: Date.now()
  };
  localStorage.setItem('travelplus_invitaciones', JSON.stringify(invitaciones));
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

  this.http.post<any>('http://localhost:3000/api/viajes/invitar-email', payload).subscribe({
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
      console.warn('Backend no disponible, intentando puerto alternativo...');
      // Intentar con puerto alternativo
      this.http.post<any>('http://localhost:30001/api/viajes/invitar-email', payload).subscribe({
        next: (res) => {
          console.log('Invitación enviada (puerto alternativo):', res);
          this.mostrarModalCorreoEnviado = true;
          this.emailInvitacion = '';
          setTimeout(() => {
            this.mostrarModalCorreoEnviado = false;
            this.cerrarModalCompartir();
          }, 2500);
        },
        error: (err2) => {
          console.error('Error al enviar invitación:', err2);
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
}