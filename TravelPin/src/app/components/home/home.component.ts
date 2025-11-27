import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SurveyComponent } from '../survey/survey.component';
import { ResultsComponent } from '../results/results.component';
import { DestinationDetailComponent } from '../destination-detail/destination-detail.component';
import { ExploreComponent } from '../explore/explore.component';
import { TripsComponent } from '../trips/trips.component';
import { TripDetailComponent } from '../trip-detail/trip-detail.component';
import { FavoritesComponent } from '../favorites/favorites.component';
import { ProfileComponent } from '../profile/profile.component';
import { DestinosService, DestinoBasico } from '../../services/destinos.service';

interface Destino {
  id: number;
  nombre: string;
  pais: string;
  categoria: string;
  imagen: string;
  rating: number;
  esFavorito: boolean;
  colorCategoria: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    SurveyComponent, 
    ResultsComponent, 
    DestinationDetailComponent, 
    ExploreComponent, 
    TripsComponent, 
    TripDetailComponent,
    FavoritesComponent,
    ProfileComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  destinos: Destino[] = [];

  currentTab: string = 'inicio';
  mostrarEncuesta: boolean = false;
  mostrarResultados: boolean = false;
  mostrarDetalle: boolean = false;
  mostrarExplorar: boolean = false;
  mostrarViajes: boolean = false;
  mostrarDetalleViaje: boolean = false;
  mostrarFavoritos: boolean = false;
  respuestasUsuario: any = null;
  destinoSeleccionadoId?: number;
  viajeSeleccionadoId?: number;
  private isBrowser: boolean;
  mostrarPerfil: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private destinosService: DestinosService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Cargar destinos desde el servicio
    this.destinos = this.destinosService.getDestinos();
    
    if (this.isBrowser) {
      this.cargarFavoritos();
      this.verificarViajesFinalizados();
      
      // Sincronizar favoritos y verificar viajes cada 2 segundos
      setInterval(() => {
        this.cargarFavoritos();
        this.verificarViajesFinalizados();
      }, 2000);
    }
  }

  verificarViajesFinalizados(): void {
    if (!this.isBrowser) return;
    
    try {
      const coleccionesGuardadas = localStorage.getItem('travelplus_colecciones');
      if (!coleccionesGuardadas) return;
      
      const colecciones = JSON.parse(coleccionesGuardadas);
      const fechaActual = new Date();
      fechaActual.setHours(0, 0, 0, 0);
      
      let huboActualizacion = false;
      
      colecciones.forEach((coleccion: any) => {
        if (coleccion.fechaFin && !coleccion.finalizado) {
          const [dia, mes, anio] = coleccion.fechaFin.split('/').map(Number);
          const fechaFin = new Date(anio, mes - 1, dia);
          fechaFin.setHours(23, 59, 59, 999);
          
          if (fechaActual > fechaFin) {
            coleccion.finalizado = true;
            huboActualizacion = true;
            console.log(`Viaje "${coleccion.nombre}" marcado como finalizado automáticamente`);
          }
        }
      });
      
      if (huboActualizacion) {
        localStorage.setItem('travelplus_colecciones', JSON.stringify(colecciones));
      }
    } catch (error) {
      console.error('Error al verificar viajes finalizados:', error);
    }
  }

  cargarFavoritos(): void {
    if (!this.isBrowser) return;
    
    try {
      const favoritosGuardados = localStorage.getItem('travelplus_favoritos');
      
      if (favoritosGuardados) {
        const favoritosIds: number[] = JSON.parse(favoritosGuardados);
        
        // Sincronizar con el servicio
        this.destinosService.sincronizarFavoritos(favoritosIds);
        
        // Recargar destinos desde el servicio
        this.destinos = this.destinosService.getDestinos();
      }
    } catch (error) {
      console.log('Error al cargar favoritos:', error);
    }
  }

  guardarFavoritos(): void {
    if (!this.isBrowser) return;
    
    try {
      const favoritosIds = this.destinos
        .filter(d => d.esFavorito)
        .map(d => d.id);
      
      localStorage.setItem('travelplus_favoritos', JSON.stringify(favoritosIds));
      console.log('Favoritos guardados:', favoritosIds);
    } catch (error) {
      console.error('Error al guardar favoritos:', error);
    }
  }

  toggleFavorito(destino: Destino): void {
    destino.esFavorito = !destino.esFavorito;
    
    // Actualizar en el servicio también
    this.destinosService.actualizarFavorito(destino.id, destino.esFavorito);
    
    this.guardarFavoritos();
    console.log(`Destino ${destino.nombre} favorito: ${destino.esFavorito}`);
  }

  verOpciones(destino: Destino): void {
    console.log('Ver opciones de:', destino.nombre, 'ID:', destino.id);
    this.destinoSeleccionadoId = destino.id;
    this.mostrarDetalle = true;
    this.mostrarResultados = false;
  }

  encontrarDestino(): void {
    this.mostrarEncuesta = true;
    this.mostrarResultados = false;
    console.log('Abriendo encuesta');
  }

  cerrarEncuesta(): void {
    this.mostrarEncuesta = false;
  }

  procesarResultados(respuestas: any): void {
    console.log('Resultados de la encuesta:', respuestas);
    this.respuestasUsuario = respuestas;
    this.mostrarEncuesta = false;
    this.mostrarResultados = true;
  }

  volverAInicio(): void {
    this.mostrarResultados = false;
  }

  verDetalleDesdeResultados(destinoId: number): void {
    console.log('Ver detalle desde resultados, ID:', destinoId);
    this.destinoSeleccionadoId = destinoId;
    this.mostrarResultados = false;
    this.mostrarDetalle = true;
  }

  cambiarTab(tab: string): void {
    this.currentTab = tab;
    console.log('Tab seleccionado:', tab);
    
    // Resetear todas las vistas
    this.mostrarEncuesta = false;
    this.mostrarResultados = false;
    this.mostrarDetalle = false;
    this.mostrarExplorar = false;
    this.mostrarViajes = false;
    this.mostrarDetalleViaje = false;
    this.mostrarFavoritos = false;
    this.mostrarPerfil = false;
    
    switch(tab) {
      case 'explorar':
        this.mostrarExplorar = true;
        break;
      case 'viajes':
        this.mostrarViajes = true;
        break;
      case 'perfil':
        this.mostrarPerfil = true;
        break;
      case 'inicio':
        break;
      case 'favoritos':
        this.mostrarFavoritos = true;
        break;
    }
  }

  verDetalleDesdeExplorar(destinoId: number): void {
    console.log('Ver detalle desde explorar, ID:', destinoId);
    this.destinoSeleccionadoId = destinoId;
    this.mostrarExplorar = false;
    this.mostrarDetalle = true;
  }

  verDetalleDesdeViajes(destinoId: number): void {
    console.log('Ver detalle desde viajes, ID:', destinoId);
    this.destinoSeleccionadoId = destinoId;
    this.mostrarViajes = false;
    this.mostrarDetalle = true;
  }

  verDetalleViajeDesdeTrips(viajeId: number): void {
    console.log('Ver detalle del viaje desde trips, ID:', viajeId);
    this.viajeSeleccionadoId = viajeId;
    this.mostrarViajes = false;
    this.mostrarDetalleViaje = true;
  }

  verDetalleDesdeFavoritos(destinoId: number): void {
    console.log('Ver detalle desde favoritos, ID:', destinoId);
    this.destinoSeleccionadoId = destinoId;
    this.mostrarFavoritos = false;
    this.mostrarDetalle = true;
  }

  volverAExplorar(): void {
    this.mostrarDetalle = false;
    this.mostrarExplorar = true;
  }

  volverAViajes(): void {
    this.mostrarDetalle = false;
    this.mostrarDetalleViaje = false;
    this.mostrarViajes = true;
  }

  volverAFavoritos(): void {
    this.mostrarDetalle = false;
    this.mostrarFavoritos = true;
  }

  volverDesdeTripDetail(): void {
    console.log('Volver desde trip detail');
    this.mostrarDetalleViaje = false;
    this.mostrarViajes = true;
  }

  verDetalleDestinoDesdeTrip(destinoId: number): void {
    console.log('Ver detalle destino desde trip, ID:', destinoId);
    this.destinoSeleccionadoId = destinoId;
    this.mostrarDetalleViaje = false;
    this.mostrarDetalle = true;
  }

  volverDesdeDetalle(): void {
    console.log('Volver desde detalle');
    this.mostrarDetalle = false;
    
    if (this.mostrarResultados) {
      this.mostrarResultados = true;
    } else if (this.mostrarFavoritos || this.currentTab === 'favoritos') {
      this.mostrarFavoritos = true;
    } else if (this.mostrarExplorar || this.currentTab === 'explorar') {
      this.mostrarExplorar = true;
    } else if (this.mostrarViajes || this.mostrarDetalleViaje || this.currentTab === 'viajes') {
      if (this.viajeSeleccionadoId) {
        this.mostrarDetalleViaje = true;
      } else {
        this.mostrarViajes = true;
      }
    }
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

  getContadorFavoritos(): number {
    return this.destinosFavoritos.length;
  }

  getContadorViajes(): number {
    if (!this.isBrowser) return 0;
    
    try {
      const coleccionesGuardadas = localStorage.getItem('travelplus_colecciones');
      
      if (coleccionesGuardadas) {
        const colecciones = JSON.parse(coleccionesGuardadas);
        
        if (Array.isArray(colecciones)) {
          // Filtrar solo viajes no finalizados
          const viajesProximos = colecciones.filter((coleccion: any) => {
            return !coleccion.finalizado;
          });
          
          return viajesProximos.length;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error al cargar viajes:', error);
      return 0;
    }
  }

  get destinosFavoritos(): Destino[] {
    return this.destinos.filter(d => d.esFavorito);
  }
}