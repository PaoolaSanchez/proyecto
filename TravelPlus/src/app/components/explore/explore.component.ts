import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Destino {
  id: number;
  nombre: string;
  pais: string;
  categoria: string;
  imagen: string;
  rating: number;
  descripcion: string;
}

interface Categoria {
  nombre: string;
  icono: string;
  count: number;
  imagen: string;
}

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit {
  @Output() verDetalle = new EventEmitter<number>();
  @Output() navegarATab = new EventEmitter<string>();

  currentTab: string = 'explorar';
  terminoBusqueda: string = '';
  destinosFiltrados: Destino[] = [];
  mostrarResultados: boolean = false;

  destinos: Destino[] = [
    {
      id: 1,
      nombre: 'Machu Picchu',
      pais: 'Perú',
      categoria: 'Aventura',
      imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
      rating: 4.7,
      descripcion: 'Antigua ciudad inca en los Andes'
    },
    {
      id: 2,
      nombre: 'Tokio',
      pais: 'Japón',
      categoria: 'Ciudad',
      imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      rating: 4.9,
      descripcion: 'Ciudad vibrante con tecnología y tradición'
    },
    {
      id: 3,
      nombre: 'Maldivas',
      pais: 'Maldivas',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400',
      rating: 5.0,
      descripcion: 'Paraíso tropical con aguas cristalinas'
    },
    {
      id: 4,
      nombre: 'París',
      pais: 'Francia',
      categoria: 'Cultura',
      imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      rating: 4.8,
      descripcion: 'La ciudad del amor y la cultura'
    },
    {
      id: 5,
      nombre: 'Cancún',
      pais: 'México',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=400',
      rating: 4.6,
      descripcion: 'Playas paradisíacas del Caribe mexicano'
    },
    {
      id: 6,
      nombre: 'Bali',
      pais: 'Indonesia',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
      rating: 4.8,
      descripcion: 'Isla exótica con templos y playas'
    },
    {
      id: 7,
      nombre: 'Nueva York',
      pais: 'Estados Unidos',
      categoria: 'Ciudad',
      imagen: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
      rating: 4.7,
      descripcion: 'La gran manzana que nunca duerme'
    },
    {
      id: 8,
      nombre: 'Patagonia',
      pais: 'Argentina',
      categoria: 'Aventura',
      imagen: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
      rating: 4.9,
      descripcion: 'Naturaleza salvaje en el fin del mundo'
    },
    {
      id: 9,
      nombre: 'Phuket',
      pais: 'Tailandia',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400',
      rating: 4.6,
      descripcion: 'Playas tropicales y vida nocturna'
    },
    {
      id: 10,
      nombre: 'Santorini',
      pais: 'Grecia',
      categoria: 'Cultura',
      imagen: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400',
      rating: 4.9,
      descripcion: 'Casas blancas y atardeceres mágicos'
    },
    {
      id: 11,
      nombre: 'Praga',
      pais: 'República Checa',
      categoria: 'Cultura',
      imagen: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400',
      rating: 4.7,
      descripcion: 'Ciudad medieval con arquitectura gótica'
    },
    {
      id: 12,
      nombre: 'Panamá',
      pais: 'Panamá',
      categoria: 'Ciudad',
      imagen: 'https://images.unsplash.com/photo-1558972103-dc0c38cb0e6d?w=400',
      rating: 4.5,
      descripcion: 'Puente entre dos océanos'
    }
  ];

  categorias: Categoria[] = [
    {
      nombre: 'Playas',
      icono: '🏖️',
      count: 24,
      imagen: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'
    },
    {
      nombre: 'Montañas',
      icono: '⛰️',
      count: 18,
      imagen: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
    },
    {
      nombre: 'Ciudades',
      icono: '🏙️',
      count: 32,
      imagen: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400'
    },
    {
      nombre: 'Aventura',
      icono: '🎒',
      count: 15,
      imagen: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'
    }
  ];

  ngOnInit(): void {
    this.destinosFiltrados = this.destinos;
  }

  buscarDestinos(): void {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    
    if (termino === '') {
      this.mostrarResultados = false;
      this.destinosFiltrados = this.destinos;
      return;
    }

    this.mostrarResultados = true;
    this.destinosFiltrados = this.destinos.filter(destino => 
      destino.nombre.toLowerCase().includes(termino) ||
      destino.pais.toLowerCase().includes(termino) ||
      destino.categoria.toLowerCase().includes(termino) ||
      destino.descripcion.toLowerCase().includes(termino)
    );

    console.log(`Búsqueda: "${termino}" - Resultados: ${this.destinosFiltrados.length}`);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.mostrarResultados = false;
    this.destinosFiltrados = this.destinos;
  }

  verDetalleDestino(destinoId: number): void {
    console.log('Ver detalle del destino:', destinoId);
    this.verDetalle.emit(destinoId);
  }

  verCategoria(categoria: string): void {
    console.log('Ver categoría:', categoria);
    this.terminoBusqueda = categoria;
    this.buscarDestinos();
  }

  navegarTab(tab: string): void {
    this.currentTab = tab;
    this.navegarATab.emit(tab);
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