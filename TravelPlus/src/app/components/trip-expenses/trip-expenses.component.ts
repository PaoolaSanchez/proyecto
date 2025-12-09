//trip-expenses.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TripSyncService, TripEvent } from '../../services/trip-sync.service';
import { Subscription } from 'rxjs';

interface Participante {
  id?: string;
  email?: string;
  nombre: string;
  iniciales?: string;
  color?: string;
  seleccionado?: boolean;
}

interface Gasto {
  id: number;
  descripcion: string;
  monto: number;
  categoria: string;
  pagadoPor: string;
  fecha: string;
  dividirEntre: string[];
  esAgencia?: boolean;
}

interface Pago {
  id: number;
  participante: string; // email o nombre
  monto: number;
  fecha: string;
  descripcion: string;
}

interface GastoDetallado {
  concepto: string;
  monto: number;
  categoria: 'transporte' | 'hospedaje' | 'comida' | 'actividades' | 'otros';
}

interface CategoriaGasto {
  nombre: string;
  total: number;
  color: string;
}

@Component({
  selector: 'app-trip-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-expenses.component.html',
  styleUrls: ['./trip-expenses.component.css']
})
export class TripExpensesComponent implements OnInit, OnDestroy {
  @Input() viajeId?: number;
  @Input() nombreViaje?: string;
  @Input() participantes: Participante[] = [];
  @Output() volver = new EventEmitter<void>();
  @Output() navegarATab = new EventEmitter<string>();

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private tripSyncService = inject(TripSyncService);
  private isBrowser = isPlatformBrowser(this.platformId);
  private syncSubscription?: Subscription;

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

  mostrarModalGasto: boolean = false;
  mostrarModalPago: boolean = false;
  participanteSeleccionadoPago?: Participante;
  
  // Datos del formulario de gasto
  descripcionGasto: string = '';
  montoGasto: string = '';
  categoriaSeleccionada: string = 'Alimentos';

  // Datos del formulario de pago
  montoPago: string = '';
  descripcionPago: string = '';

  categorias: string[] = [
    'Alimentos',
    'Transporte',
    'Hospedaje',
    'Entretenimiento',
    'Compras',
    'Otros'
  ];

  gastos: Gasto[] = [];
  pagos: Pago[] = []; // Nueva propiedad para pagos
  categoriasResumen: CategoriaGasto[] = [];

  ngOnInit(): void {
    // Asegurarse de que los participantes tengan la propiedad seleccionado
    this.participantes = this.participantes.map(p => ({
      ...p,
      seleccionado: p.seleccionado || false
    }));
    
    this.cargarGastos();
    this.cargarPagos();
    
    // Suscribirse a eventos de sincronización en tiempo real
    if (this.viajeId) {
      this.suscribirseASincronizacion();
    }
  }

  ngOnDestroy(): void {
    // Desuscribirse de la sincronización al salir
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  private suscribirseASincronizacion(): void {
    if (!this.viajeId) return;
    
    this.syncSubscription = this.tripSyncService.conectarAViaje(this.viajeId)
      .subscribe((evento: TripEvent) => {
        console.log('📡 Evento de sincronización recibido en gastos:', evento.type);
        
        if (evento.type === 'gasto_agregado') {
          // Recargar gastos cuando otro usuario agregue uno
          this.cargarGastos();
        } else if (evento.type === 'gasto_eliminado') {
          // Recargar gastos cuando otro usuario elimine uno
          this.cargarGastos();
        } else if (evento.type === 'pago_agregado' || evento.type === 'pago_eliminado') {
          // Recargar pagos
          this.cargarPagos();
        }
      });
  }

  cargarGastos(): void {
    if (!this.viajeId) return;

    // Cargar gastos desde el backend
    this.http.get<any[]>(`${environment.apiUrl}/viajes/${this.viajeId}/gastos`, this.getAuthHeaders()).subscribe({
      next: (gastosBackend) => {
        console.log('Gastos cargados del backend:', gastosBackend);
        
        // Convertir formato del backend al formato del componente
        this.gastos = gastosBackend.map(g => ({
          id: g.id,
          descripcion: g.descripcion,
          monto: g.monto,
          categoria: this.mapearCategoria(g.categoria),
          pagadoPor: g.pagadoPor || g.pagado_por || 'Usuario',
          fecha: g.fecha,
          dividirEntre: this.participantes.map(p => p.email || p.nombre),
          esAgencia: g.esAgencia || g.es_agencia || false
        }));
        
        this.calcularResumenCategorias();
      },
      error: (error) => {
        console.error('Error al cargar gastos del backend:', error);
        // Fallback: cargar desde localStorage si el backend falla
        this.cargarGastosDesdeLocalStorage();
      }
    });
  }

  private mapearCategoria(categoria: string): string {
    const mapping: { [key: string]: string } = {
      'general': 'Otros',
      'transporte': 'Transporte',
      'hospedaje': 'Hospedaje',
      'comida': 'Alimentos',
      'actividades': 'Entretenimiento',
      'paquete': 'Paquete Agencia',
      'otros': 'Otros'
    };
    return mapping[categoria?.toLowerCase()] || categoria || 'Otros';
  }

  private cargarGastosDesdeLocalStorage(): void {
    if (!this.isBrowser || !this.viajeId) return;
    
    // Intentar cargar gastos programados de agencia desde localStorage
    const gastosAgencia = this.cargarGastosProgramadosDeAgencia();
    
    const key = `gastos_viaje_${this.viajeId}`;
    const gastosGuardados = localStorage.getItem(key);
    
    if (gastosAgencia.length > 0) {
      this.gastos = [...gastosAgencia];
      if (gastosGuardados) {
        const gastosUsuario: Gasto[] = JSON.parse(gastosGuardados);
        const gastosUsuarioFiltrados = gastosUsuario.filter(g => !g.descripcion.includes('[Agencia]'));
        this.gastos = [...this.gastos, ...gastosUsuarioFiltrados];
      }
    } else if (gastosGuardados) {
      this.gastos = JSON.parse(gastosGuardados);
    }
    
    this.calcularResumenCategorias();
    console.log('Gastos cargados desde localStorage:', this.gastos);
  }

  cargarGastosProgramadosDeAgencia(): Gasto[] {
    if (!this.isBrowser) return [];
    
    try {
      const coleccionesData = localStorage.getItem('travelplus_colecciones');
      if (!coleccionesData) return [];

      const colecciones = JSON.parse(coleccionesData);
      const coleccion = colecciones.find((c: any) => c.id === this.viajeId);

      if (!coleccion || !coleccion.gastosProgramados) return [];

      // Convertir gastos programados de agencia a formato de Gasto
      const gastosAgencia: Gasto[] = coleccion.gastosProgramados.map((gasto: GastoDetallado, index: number) => {
        const categoriaMapping: { [key: string]: string } = {
          'transporte': 'Transporte',
          'hospedaje': 'Hospedaje',
          'comida': 'Alimentos',
          'actividades': 'Entretenimiento',
          'otros': 'Otros'
        };

        return {
          id: Date.now() + index, // ID único
          descripcion: `${gasto.concepto} [Agencia]`, // Marcar como de agencia
          monto: gasto.monto,
          categoria: categoriaMapping[gasto.categoria] || 'Otros',
          pagadoPor: coleccion.agencia?.nombre || 'Agencia',
          fecha: coleccion.fechaInicio || new Date().toLocaleDateString('es-ES'),
          dividirEntre: this.participantes.map(p => p.email || p.nombre) // Dividir entre todos
        };
      });

      return gastosAgencia;
    } catch (error) {
      console.error('Error al cargar gastos programados:', error);
      return [];
    }
  }

  calcularResumenCategorias(): void {
    const colores: { [key: string]: string } = {
      'Alimentos': '#FF6B6B',
      'Transporte': '#4ECDC4',
      'Hospedaje': '#45B7D1',
      'Entretenimiento': '#FFA07A',
      'Compras': '#98D8C8',
      'Paquete Agencia': '#9B59B6',
      'Otros': '#F7DC6F'
    };

    const totalesPorCategoria: { [key: string]: number } = {};

    this.gastos.forEach(gasto => {
      if (!totalesPorCategoria[gasto.categoria]) {
        totalesPorCategoria[gasto.categoria] = 0;
      }
      totalesPorCategoria[gasto.categoria] += gasto.monto;
    });

    this.categoriasResumen = Object.keys(totalesPorCategoria).map(categoria => ({
      nombre: categoria,
      total: totalesPorCategoria[categoria],
      color: colores[categoria] || '#95A5A6'
    }));
  }

  getTotalGastos(): number {
    return this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
  }

  getGastoPorPersona(): number {
    const totalParticipantes = this.participantes.length;
    return totalParticipantes > 0 ? this.getTotalGastos() / totalParticipantes : 0;
  }

  abrirModalGasto(): void {
    this.mostrarModalGasto = true;
    this.limpiarFormulario();
  }

  cerrarModalGasto(): void {
    this.mostrarModalGasto = false;
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.descripcionGasto = '';
    this.montoGasto = '';
    this.categoriaSeleccionada = 'Alimentos';
    this.participantes.forEach(p => p.seleccionado = false);
  }

  toggleParticipante(participante: Participante): void {
    participante.seleccionado = !participante.seleccionado;
  }

  agregarGasto(): void {
    if (!this.descripcionGasto.trim() || !this.montoGasto) {
      alert('Por favor completa la descripción y el monto');
      return;
    }

    const participantesSeleccionados = this.participantes
      .filter(p => p.seleccionado)
      .map(p => p.email || p.nombre);

    if (participantesSeleccionados.length === 0) {
      alert('Selecciona al menos un participante para dividir el gasto');
      return;
    }

    // Obtener el usuario actual
    let pagadoPor = 'Usuario';
    if (this.isBrowser) {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        pagadoPor = currentUser.email || currentUser.nombre || 'Usuario';
      }
    }

    // Mapear categoría al formato del backend
    const categoriaBackend: { [key: string]: string } = {
      'Alimentos': 'comida',
      'Transporte': 'transporte',
      'Hospedaje': 'hospedaje',
      'Entretenimiento': 'actividades',
      'Compras': 'otros',
      'Otros': 'otros'
    };

    const gastoBackend = {
      descripcion: this.descripcionGasto.trim(),
      monto: parseFloat(this.montoGasto),
      categoria: categoriaBackend[this.categoriaSeleccionada] || 'otros',
      pagado_por: pagadoPor,
      fecha: new Date().toISOString().split('T')[0]
    };

    // Guardar en el backend
    this.http.post<any>(
      `${environment.apiUrl}/viajes/${this.viajeId}/gastos`, 
      gastoBackend, 
      this.getAuthHeaders()
    ).subscribe({
      next: (response) => {
        console.log('Gasto guardado en backend:', response);
        
        // Agregar a la lista local
        const nuevoGasto: Gasto = {
          id: response.id || Date.now(),
          descripcion: this.descripcionGasto.trim(),
          monto: parseFloat(this.montoGasto),
          categoria: this.categoriaSeleccionada,
          pagadoPor: pagadoPor,
          fecha: new Date().toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          }),
          dividirEntre: participantesSeleccionados
        };

        this.gastos.push(nuevoGasto);
        this.calcularResumenCategorias();
        this.cerrarModalGasto();
      },
      error: (error) => {
        console.error('Error al guardar gasto en backend:', error);
        // Fallback: guardar localmente
        const nuevoGasto: Gasto = {
          id: Date.now(),
          descripcion: this.descripcionGasto.trim(),
          monto: parseFloat(this.montoGasto),
          categoria: this.categoriaSeleccionada,
          pagadoPor: pagadoPor,
          fecha: new Date().toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          }),
          dividirEntre: participantesSeleccionados
        };

        this.gastos.push(nuevoGasto);
        this.calcularResumenCategorias();
        this.guardarGastosUsuario(); // Solo como fallback
        this.cerrarModalGasto();
        alert('Gasto guardado localmente. Se sincronizará cuando haya conexión.');
      }
    });
  }

  eliminarGasto(gasto: Gasto): void {
    // No permitir eliminar gastos de agencia
    if (gasto.descripcion.includes('[Agencia]')) {
      alert('No puedes eliminar gastos programados de la agencia. Solo puedes eliminar gastos que hayas agregado manualmente.');
      return;
    }

    const confirmar = confirm(`¿Eliminar el gasto "${gasto.descripcion}"?`);
    if (confirmar) {
      // Eliminar del backend
      this.http.delete(
        `${environment.apiUrl}/viajes/${this.viajeId}/gastos/${gasto.id}`,
        this.getAuthHeaders()
      ).subscribe({
        next: () => {
          console.log('Gasto eliminado del backend');
          this.gastos = this.gastos.filter(g => g.id !== gasto.id);
          this.calcularResumenCategorias();
        },
        error: (error) => {
          console.error('Error al eliminar gasto:', error);
          // Eliminar localmente de todos modos
          this.gastos = this.gastos.filter(g => g.id !== gasto.id);
          this.calcularResumenCategorias();
        }
      });
    }
  }

  guardarGastosUsuario(): void {
    if (!this.viajeId) return;

    // Solo guardar los gastos que NO son de agencia
    const gastosUsuario = this.gastos.filter(g => !g.descripcion.includes('[Agencia]'));
    
    const key = `gastos_viaje_${this.viajeId}`;
    localStorage.setItem(key, JSON.stringify(gastosUsuario));
    console.log('Gastos del usuario guardados en localStorage');
  }

  // NUEVOS MÉTODOS PARA PAGOS
  cargarPagos(): void {
    if (!this.viajeId) return;

    // Cargar pagos desde el backend
    this.http.get<any[]>(`${environment.apiUrl}/viajes/${this.viajeId}/pagos`, this.getAuthHeaders()).subscribe({
      next: (pagosBackend) => {
        console.log('Pagos cargados del backend:', pagosBackend);
        
        this.pagos = pagosBackend.map(p => ({
          id: p.id,
          participante: p.participante,
          monto: p.monto,
          fecha: p.fecha,
          descripcion: p.descripcion || 'Pago realizado'
        }));
      },
      error: (error) => {
        console.error('Error al cargar pagos del backend:', error);
        // Fallback: cargar desde localStorage
        this.cargarPagosDesdeLocalStorage();
      }
    });
  }

  private cargarPagosDesdeLocalStorage(): void {
    if (!this.isBrowser || !this.viajeId) return;
    
    const key = `pagos_viaje_${this.viajeId}`;
    const pagosGuardados = localStorage.getItem(key);
    
    if (pagosGuardados) {
      this.pagos = JSON.parse(pagosGuardados);
    }

    console.log('Pagos cargados desde localStorage:', this.pagos);
  }

  guardarPagos(): void {
    if (!this.viajeId) return;

    const key = `pagos_viaje_${this.viajeId}`;
    localStorage.setItem(key, JSON.stringify(this.pagos));
    console.log('Pagos guardados en localStorage');
  }

  abrirModalPago(participante: Participante): void {
    this.participanteSeleccionadoPago = participante;
    this.mostrarModalPago = true;
    this.limpiarFormularioPago();
  }

  cerrarModalPago(): void {
    this.mostrarModalPago = false;
    this.participanteSeleccionadoPago = undefined;
    this.limpiarFormularioPago();
  }

  limpiarFormularioPago(): void {
    this.montoPago = '';
    this.descripcionPago = '';
  }

  agregarPago(): void {
    if (!this.participanteSeleccionadoPago || !this.montoPago) {
      alert('Por favor ingresa el monto del pago');
      return;
    }

    const pagoBackend = {
      participante: this.participanteSeleccionadoPago.email || this.participanteSeleccionadoPago.nombre,
      monto: parseFloat(this.montoPago),
      descripcion: this.descripcionPago.trim() || 'Pago realizado',
      fecha: new Date().toISOString().split('T')[0]
    };

    // Guardar en el backend
    this.http.post<any>(
      `${environment.apiUrl}/viajes/${this.viajeId}/pagos`, 
      pagoBackend, 
      this.getAuthHeaders()
    ).subscribe({
      next: (response) => {
        console.log('Pago guardado en backend:', response);
        
        const nuevoPago: Pago = {
          id: response.id || Date.now(),
          participante: pagoBackend.participante,
          monto: pagoBackend.monto,
          fecha: new Date().toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          }),
          descripcion: pagoBackend.descripcion
        };

        this.pagos.push(nuevoPago);
        this.cerrarModalPago();
      },
      error: (error) => {
        console.error('Error al guardar pago en backend:', error);
        // Fallback: guardar localmente
        const nuevoPago: Pago = {
          id: Date.now(),
          participante: pagoBackend.participante,
          monto: pagoBackend.monto,
          fecha: new Date().toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          }),
          descripcion: pagoBackend.descripcion
        };

        this.pagos.push(nuevoPago);
        this.guardarPagos();
        this.cerrarModalPago();
        alert('Pago guardado localmente. Se sincronizará cuando haya conexión.');
      }
    });
  }

  eliminarPago(pago: Pago): void {
    const confirmar = confirm(`¿Eliminar el pago de ${this.formatearMonto(pago.monto)}?`);
    if (confirmar) {
      // Eliminar del backend
      this.http.delete(
        `${environment.apiUrl}/viajes/${this.viajeId}/pagos/${pago.id}`,
        this.getAuthHeaders()
      ).subscribe({
        next: () => {
          console.log('Pago eliminado del backend');
          this.pagos = this.pagos.filter(p => p.id !== pago.id);
        },
        error: (error) => {
          console.error('Error al eliminar pago:', error);
          // Eliminar localmente de todos modos
          this.pagos = this.pagos.filter(p => p.id !== pago.id);
        }
      });
    }
  }

  getPagosPorParticipante(participante: string): Pago[] {
    return this.pagos.filter(p => p.participante === participante);
  }

  getTotalPagadoPorParticipante(participante: string): number {
    return this.pagos
      .filter(p => p.participante === participante)
      .reduce((sum, p) => sum + p.monto, 0);
  }

  volverAtras(): void {
    this.volver.emit();
  }

  cambiarTab(tab: string): void {
    this.navegarATab.emit(tab);
  }

  formatearMonto(monto: number): string {
    return `$${monto.toLocaleString('es-MX')}`;
  }

  getParticipantesNombres(emails: string[]): string {
    return emails
      .map(email => {
        const participante = this.participantes.find(p => (p.email || p.nombre) === email);
        return participante ? participante.nombre : email;
      })
      .join(', ');
  }

  getBalancePorPersona(email: string): { pagado: number; debe: number; balance: number } {
    const pagado = this.gastos
      .filter(g => g.pagadoPor === email)
      .reduce((sum, g) => sum + g.monto, 0);

    const debe = this.gastos
      .filter(g => g.dividirEntre.includes(email))
      .reduce((sum, g) => sum + (g.monto / g.dividirEntre.length), 0);

    // Sumar los pagos realizados por esta persona
    const pagoRealizado = this.getTotalPagadoPorParticipante(email);

    // Balance: lo que pagó + pagos realizados - lo que debe
    const balance = (pagado + pagoRealizado) - debe;

    return { pagado: pagado + pagoRealizado, debe, balance };
  }

  esGastoDeAgencia(gasto: Gasto): boolean {
    return gasto.esAgencia || gasto.descripcion.includes('[Agencia]');
  }

  getColorCategoria(categoria: string): string {
    const cat = this.categoriasResumen.find(c => c.nombre === categoria);
    return cat ? cat.color : '#95A5A6';
  }

  abs(num: number): number {
    return Math.abs(num);
  }
}