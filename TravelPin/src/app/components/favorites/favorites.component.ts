
import { Component, OnInit, Output, EventEmitter, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface DestinoFavorito {
  id: number;
  nombre: string;
  pais: string;
  imagen: string;
  categoria: string;
  rating: number;
  precio: number;
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

  // Base de datos completa de destinos
  todosLosDestinos = [
    {
      id: 1,
      nombre: 'Machu Picchu',
      pais: 'Perú',
      imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
      categoria: 'Aventura',
      rating: 4.7,
      precio: 120
    },
    {
      id: 2,
      nombre: 'Tokio',
      pais: 'Japón',
      imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      categoria: 'Ciudad',
      rating: 4.9,
      precio: 200
    },
    {
      id: 3,
      nombre: 'Maldivas',
      pais: 'Maldivas',
      imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400',
      categoria: 'Playa',
      rating: 5.0,
      precio: 350
    },
    {
      id: 4,
      nombre: 'París',
      pais: 'Francia',
      imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      categoria: 'Cultura',
      rating: 4.8,
      precio: 180
    },
    {
      id: 5,
      nombre: 'Cancún',
      pais: 'México',
      imagen: 'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=400',
      categoria: 'Playa',
      rating: 4.6,
      precio: 150
    },
    {
      id: 6,
      nombre: 'Bali',
      pais: 'Indonesia',
      imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
      categoria: 'Playa',
      rating: 4.8,
      precio: 85
    },
    {
      id: 7,
      nombre: 'Italia',
      pais: 'Italia',
      imagen: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400',
      categoria: 'Cultura',
      rating: 4.9,
      precio: 190
    },
    {
      id: 8,
      nombre: 'Venecia',
      pais: 'Italia',
      imagen: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400',
      categoria: 'Ciudad',
      rating: 4.7,
      precio: 170
    },
    {
      id: 9,
      nombre: 'Fontana di Trevi',
      pais: 'Italia',
      imagen: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
      categoria: 'Cultural',
      rating: 4.8,
      precio: 50
    },
    {
      id: 10,
      nombre: 'Chihuahua',
      pais: 'México',
      imagen: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400',
      categoria: 'Naturaleza',
      rating: 4.6,
      precio: 80
    }
  ];

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.cargarFavoritos();
      
      // Actualizar favoritos cada 2 segundos
      setInterval(() => {
        this.cargarFavoritos();
      }, 2000);
    }
  }

  cargarFavoritos(): void {
    if (!this.isBrowser) return;
    
    try {
      const favoritosGuardados = localStorage.getItem('travelplus_favoritos');
      let favoritosIds: number[] = [];

      if (favoritosGuardados) {
        favoritosIds = JSON.parse(favoritosGuardados);
      } else {
        // Favoritos por defecto (según tu imagen)
        favoritosIds = [7, 8, 9, 10]; // Italia, Venecia, Fontana di Trevi, Chihuahua
        localStorage.setItem('travelplus_favoritos', JSON.stringify(favoritosIds));
      }

      // Convertir IDs a objetos completos con fecha
      this.destinosFavoritos = favoritosIds
        .map(id => {
          const destino = this.todosLosDestinos.find(d => d.id === id);
          if (destino) {
            return {
              ...destino,
              fechaAgregado: new Date()
            };
          }
          return null;
        })
        .filter(d => d !== null) as DestinoFavorito[];

      // Favoritos recientes (últimos 4)
      this.favoritosRecientes = this.destinosFavoritos.slice(-4).reverse();

      console.log('Favoritos cargados:', this.destinosFavoritos.length);
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
      const favoritosGuardados = localStorage.getItem('travelplus_favoritos');
      if (favoritosGuardados) {
        let favoritosIds: number[] = JSON.parse(favoritosGuardados);
        favoritosIds = favoritosIds.filter(id => id !== destino.id);
        localStorage.setItem('travelplus_favoritos', JSON.stringify(favoritosIds));
        
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
}