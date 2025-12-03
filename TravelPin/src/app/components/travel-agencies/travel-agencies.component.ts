//travel-agencies.component.ts
import { Component, OnInit, Output, EventEmitter, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Agencia {
  id: number;
  nombre: string;
  logo: string;
  descripcion: string;
  contacto?: string;
  sitio_web?: string;
  rating?: number;
  especialidad?: string;
}

interface PaqueteViaje {
  id: number;
  agencia_id: number;
  nombre: string;
  duracion: string;
  precio: number;
  incluye: string[];
  itinerario: { dia: number; actividades: string }[];
  gastos: { concepto: string; monto: number }[];
  destinos?: { id: number; nombre: string; pais: string; imagen_principal?: string }[];
}

@Component({
  selector: 'app-travel-agencies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel-agencies.component.html',
  styleUrls: ['./travel-agencies.component.css']
})
export class TravelAgenciesComponent implements OnInit {
  @Output() navegarATab = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  agencias: Agencia[] = [];
  paquetesPorAgencia: Map<number, PaqueteViaje[]> = new Map();
  
  agenciaSeleccionada?: Agencia;
  paqueteSeleccionado?: PaqueteViaje;
  mostrarDetalleAgencia: boolean = false;
  mostrarDetallePaquete: boolean = false;

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

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.cargarAgencias();
  }

  cargarAgencias(): void {
    this.http.get<Agencia[]>('/api/agencias')
      .subscribe({
        next: (agencias) => {
          this.agencias = agencias.map(a => ({
            ...a,
            rating: 4.5 + Math.random() * 0.5, // Rating aleatorio entre 4.5 y 5
            especialidad: 'Viajes'
          }));
        },
        error: (error) => {
          console.error('Error al cargar agencias:', error);
        }
      });
  }

  cargarPaquetesAgencia(agenciaId: number): void {
    if (this.paquetesPorAgencia.has(agenciaId)) return;
    
    this.http.get<PaqueteViaje[]>(`/api/agencias/${agenciaId}/paquetes`)
      .subscribe({
        next: (paquetes) => {
          this.paquetesPorAgencia.set(agenciaId, paquetes);
        },
        error: (error) => {
          console.error('Error al cargar paquetes:', error);
        }
      });
  }

  verDetalleAgencia(agencia: Agencia): void {
    this.agenciaSeleccionada = agencia;
    this.mostrarDetalleAgencia = true;
    this.cargarPaquetesAgencia(agencia.id);
  }

  cerrarDetalleAgencia(): void {
    this.mostrarDetalleAgencia = false;
    this.agenciaSeleccionada = undefined;
  }

  getPaquetesPorAgencia(agenciaId: number): PaqueteViaje[] {
    return this.paquetesPorAgencia.get(agenciaId) || [];
  }

  verDetallePaquete(paquete: PaqueteViaje): void {
    this.paqueteSeleccionado = paquete;
    this.mostrarDetallePaquete = true;
    this.mostrarDetalleAgencia = false;
  }

  cerrarDetallePaquete(): void {
    this.mostrarDetallePaquete = false;
    this.paqueteSeleccionado = undefined;
  }

  reservarPaquete(): void {
    if (!this.paqueteSeleccionado || !this.isBrowser) return;

    // Validaciones
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

    const fechaInicio = this.formatearFecha(this.fechaSalida);
    const fechaFin = this.calcularFechaFin(this.fechaSalida, this.paqueteSeleccionado.duracion);
    const destinosIds = this.paqueteSeleccionado.destinos?.map(d => d.id) || [];

    // Obtener el ID del usuario actual
    const currentUser = this.authService.getCurrentUser();
    const usuarioId = currentUser?.uid ? parseInt(currentUser.uid) : null;

    const viajeData = {
      nombre: this.paqueteSeleccionado.nombre,
      icono: '✈️',
      destinos: destinosIds,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      usuario_id: usuarioId,
      agencia: {
        id: this.paqueteSeleccionado.agencia_id,
        nombre: this.getAgenciaNombre(this.paqueteSeleccionado.agencia_id),
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
    this.http.post<{ id: number }>('/api/viajes', viajeData).subscribe({
      next: (response) => {
        const viajeId = response.id;
        
        // Agregar itinerario del paquete al viaje
        if (this.paqueteSeleccionado?.itinerario && this.paqueteSeleccionado.itinerario.length > 0) {
          this.paqueteSeleccionado.itinerario.forEach((item) => {
            const itinerarioData = {
              fecha: this.calcularFechaDia(this.fechaSalida, item.dia),
              actividad: item.actividades,
              destino_id: destinosIds[0] || null
            };
            this.http.post(`/api/viajes/${viajeId}/itinerario`, itinerarioData).subscribe({
              error: (err) => console.error('Error al agregar itinerario:', err)
            });
          });
        }
        
        // Agregar gastos del paquete al viaje (multiplicados por número de personas)
        if (this.paqueteSeleccionado?.gastos && this.paqueteSeleccionado.gastos.length > 0) {
          // Crear gastos por cada persona
          for (let persona = 1; persona <= this.numPersonas; persona++) {
            this.paqueteSeleccionado.gastos.forEach((gasto) => {
              const gastoData = {
                concepto: this.numPersonas > 1 ? `${gasto.concepto} (Persona ${persona})` : gasto.concepto,
                monto: gasto.monto,
                participante_id: 1,
                pagado: false
              };
              this.http.post(`/api/viajes/${viajeId}/gastos`, gastoData).subscribe({
                error: (err) => console.error('Error al agregar gasto:', err)
              });
            });
          }
        }

        // Notificar a la agencia sobre la nueva reservación
        this.notificarAgenciaReservacion(viajeId);

        // Guardar también en localStorage para sincronizar
        const nuevaColeccion = {
          id: viajeId,
          nombre: this.paqueteSeleccionado!.nombre,
          icono: '✈️',
          destinos: destinosIds,
          fechaCreacion: Date.now(),
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          finalizado: false,
          agencia: viajeData.agencia
        };

        const colecciones = this.obtenerColecciones();
        colecciones.push(nuevaColeccion);
        localStorage.setItem('travelplus_colecciones', JSON.stringify(colecciones));

        this.emailConfirmacion = this.emailCliente;
        this.mostrarModalReservaExitosa = true;
        
        this.limpiarFormularioReserva();
        this.cerrarDetallePaquete();
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

  private limpiarFormularioReserva(): void {
    this.nombreCliente = '';
    this.emailCliente = '';
    this.telefonoCliente = '';
    this.fechaSalida = '';
    this.numPersonas = 1;
  }

  obtenerColecciones(): any[] {
    try {
      const data = localStorage.getItem('travelplus_colecciones');
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
    }).replace(/\//g, '/');
  }

  calcularFechaFin(fechaInicio: string, duracion: string): string {
    const dias = parseInt(duracion.split(' ')[0]);
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + dias);
    return this.formatearFecha(fecha.toISOString());
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

  volver(): void {
    this.cerrar.emit();
  }

  cerrarModalReservaExitosa(): void {
    this.mostrarModalReservaExitosa = false;
    this.navegarATab.emit('viajes');
  }

  cerrarModalErrorReserva(): void {
    this.mostrarModalErrorReserva = false;
  }

  private notificarAgenciaReservacion(viajeId: number): void {
    if (!this.paqueteSeleccionado || !this.agenciaSeleccionada) return;

    // Obtener email de la agencia
    this.http.get<any>(`/api/agencias/${this.agenciaSeleccionada.id}`).subscribe({
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
          fetch('http://localhost:3000/api/email/test-send', {
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