
import { Component, OnInit, Output, EventEmitter, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DestinosService, DestinoCompleto } from '../../services/destinos.service';
import { AuthService } from '../../services/auth.service';

interface DestinoFavorito {
  id: number;
  nombre: string;
  pais: string;
  imagen: string;
  categoria: string;
  rating: number;
  fechaAgregado: Date;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  @Output() navegarATab = new EventEmitter<string>();
  @Output() verDetalle = new EventEmitter<number>();

  currentTab: string = 'favoritos';
  destinosFavoritos: DestinoFavorito[] = [];
  favoritosRecientes: DestinoFavorito[] = [];
  private isBrowser: boolean;
  todosLosDestinos: DestinoCompleto[] = [];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private destinosService: DestinosService,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getFavoritosKey(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.uid) {
      return `travelplus_favoritos_${user.uid}`;
    }
    return 'travelplus_favoritos';
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Cargar todos los destinos del servicio
      this.destinosService.cargarDestinosDesdeBackend().subscribe({
        next: (destinos) => {
          this.todosLosDestinos = destinos;
          this.cargarFavoritos();
        },
        error: (error) => {
          console.warn('Error cargando destinos del backend, usando caché:', error);
          // Intentar usar el caché si el backend falla
          const destinosCacheados = this.destinosService.getDestinos();
          console.log('Destinos en caché:', destinosCacheados.length);
          this.cargarFavoritos();
        }
      });
      
      // Actualizar favoritos cada 2 segundos
      setInterval(() => {
        this.cargarFavoritos();
      }, 2000);
    }
  }

  cargarFavoritos(): void {
    if (!this.isBrowser) return;
    
    try {
      const favoritosGuardados = localStorage.getItem(this.getFavoritosKey());
      let favoritosIds: number[] = [];

      if (favoritosGuardados) {
        favoritosIds = JSON.parse(favoritosGuardados);
        // Normalizar IDs a números por seguridad
        favoritosIds = (favoritosIds || []).map((id: any) => Number(id));
      }

      // Convertir IDs a objetos completos con fecha
      this.destinosFavoritos = favoritosIds
        .map(id => {
          const idNum = Number(id);
          let destino = this.todosLosDestinos.find(d => d.id === idNum);
          
          // Si no está en todosLosDestinos, intentar buscar en el caché del servicio
          if (!destino) {
            const destinosCache = this.destinosService.getDestinos();
            const destinoCache = destinosCache.find(d => d.id === id);
            if (destinoCache) {
              destino = destinoCache as DestinoCompleto;
            }
          }
          
          if (destino) {
            return {
              id: destino.id,
              nombre: destino.nombre,
              pais: destino.pais,
              imagen: destino.imagen,
              categoria: destino.categoria,
              rating: destino.rating,
              fechaAgregado: new Date()
            };
          }
          return null;
        })
        .filter(d => d !== null) as DestinoFavorito[];

      // Favoritos recientes (últimos 4)
      this.favoritosRecientes = this.destinosFavoritos.slice(-4).reverse();

      console.log('Favoritos cargados:', this.destinosFavoritos.length, 'IDs:', favoritosIds);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    }
  }

  verDetalleDestino(destinoId: number): void {
    console.log('Ver detalle del destino:', destinoId);
    this.verDetalle.emit(destinoId);
  }

  eliminarDeFavoritos(destino: DestinoFavorito, event: Event): void {
    if (!this.isBrowser) return;
    
    event.stopPropagation();
    
    try {
      const favoritosGuardados = localStorage.getItem(this.getFavoritosKey());
      if (favoritosGuardados) {
        let favoritosIds: number[] = JSON.parse(favoritosGuardados);
        favoritosIds = (favoritosIds || []).map((id: any) => Number(id));
        favoritosIds = favoritosIds.filter(id => id !== destino.id);
        localStorage.setItem(this.getFavoritosKey(), JSON.stringify(favoritosIds));

        this.cargarFavoritos();
        console.log('Destino eliminado de favoritos:', destino.nombre);
      }
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
    }
  }

  navegarTab(tab: string): void {
    this.currentTab = tab;
    this.navegarATab.emit(tab);
    console.log('Navegar a tab:', tab);
  }

  getContadorFavoritos(): string {
    return `${this.destinosFavoritos.length}`;
  }

  getContadorRecientes(): string {
    return `${this.favoritosRecientes.length}`;
  }

  getCategoryClass(categoria: string): string {
    const categoriaLower = categoria?.toLowerCase() || '';
    const claseMap: { [key: string]: string } = {
      'playa': 'category-playa',
      'ciudad': 'category-ciudad',
      'cultural': 'category-cultural',
      'cultura': 'category-cultural',
      'aventura': 'category-aventura',
      'naturaleza': 'category-naturaleza',
      'lujo': 'category-lujo',
      'montaña': 'category-montana',
      'montana': 'category-montana'
    };
    return claseMap[categoriaLower] || 'category-default';
  }
}