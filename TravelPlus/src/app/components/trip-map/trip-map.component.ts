import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, PLATFORM_ID, Inject, OnChanges, SimpleChanges, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface DestinoMapa {
  id: number;
  nombre: string;
  pais: string;
  imagen: string;
  lat?: number;
  lng?: number;
}

@Component({
  selector: 'app-trip-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-map.component.html',
  styleUrls: ['./trip-map.component.css']
})
export class TripMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() nombreViaje?: string;
  @Input() destinos: DestinoMapa[] = [];
  @Output() volver = new EventEmitter<void>();
  @Output() navegarATab = new EventEmitter<string>();
  
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map: any;
  private markers: any[] = [];
  private L: any;
  private mapInitialized = false;

  // Coordenadas de destinos populares - Lista ampliada
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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.asignarCoordenadas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['destinos'] && !changes['destinos'].firstChange) {
      this.asignarCoordenadas();
      if (this.mapInitialized && this.L) {
        this.actualizarMapa();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Importar Leaflet solo en el navegador
        const leafletModule = await import('leaflet');
        this.L = leafletModule.default || leafletModule;
        
        // Esperar a que el DOM esté listo
        setTimeout(() => {
          this.inicializarMapa();
        }, 200);
      } catch (error) {
        console.error('Error al cargar Leaflet:', error);
      }
    }
  }

  asignarCoordenadas(): void {
    this.destinos = this.destinos.map(destino => {
      // Buscar coordenadas por nombre exacto o por coincidencia parcial
      let coords = this.coordinadasDestinos[destino.nombre];
      
      if (!coords) {
        // Buscar coincidencia parcial (sin acentos, case insensitive)
        const nombreNormalizado = this.normalizarTexto(destino.nombre);
        for (const [key, value] of Object.entries(this.coordinadasDestinos)) {
          if (this.normalizarTexto(key).includes(nombreNormalizado) || 
              nombreNormalizado.includes(this.normalizarTexto(key))) {
            coords = value;
            break;
          }
        }
      }
      
      return {
        ...destino,
        lat: coords?.lat || 0,
        lng: coords?.lng || 0
      };
    });
  }

  private normalizarTexto(texto: string): string {
    return texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  inicializarMapa(): void {
    if (!this.L || this.mapInitialized) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.warn('Elemento del mapa no encontrado, reintentando...');
      setTimeout(() => this.inicializarMapa(), 100);
      return;
    }

    try {
      // Si no hay destinos, mostrar mapa centrado en el mundo
      if (this.destinos.length === 0) {
        this.map = this.L.map('map').setView([20, 0], 2);
        this.agregarTileLayer();
        this.mapInitialized = true;
        return;
      }

      // Crear el mapa
      this.map = this.L.map('map').setView([20, 0], 2);
      this.agregarTileLayer();

      // Agregar marcadores
      this.agregarMarcadores();

      // Ajustar el mapa para mostrar todos los marcadores
      if (this.markers.length > 0) {
        const group = this.L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
      }
      
      this.mapInitialized = true;
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  private actualizarMapa(): void {
    if (!this.map || !this.L) return;

    // Limpiar marcadores existentes
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Asignar coordenadas y agregar nuevos marcadores
    this.asignarCoordenadas();
    this.agregarMarcadores();

    // Ajustar vista
    if (this.markers.length > 0) {
      const group = this.L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  agregarTileLayer(): void {
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  agregarMarcadores(): void {
    this.destinos.forEach((destino, index) => {
      if (destino.lat && destino.lng) {
        // Crear icono personalizado con número
        const customIcon = this.L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-pin">
              <div class="marker-number">${index + 1}</div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        const marker = this.L.marker([destino.lat, destino.lng], { 
          icon: customIcon 
        }).addTo(this.map);

        // Popup con información del destino
        const popupContent = `
          <div class="custom-popup">
            <img src="${destino.imagen}" alt="${destino.nombre}" class="popup-image">
            <h3 class="popup-title">${destino.nombre}</h3>
            <p class="popup-country">${destino.pais}</p>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 200,
          className: 'custom-popup-container'
        });

        this.markers.push(marker);

        // Abrir popup del primer destino
        if (index === 0) {
          marker.openPopup();
        }
      }
    });

    // Dibujar líneas entre los destinos
    if (this.destinos.length > 1) {
      this.dibujarRuta();
    }
  }

  dibujarRuta(): void {
    const coordinates = this.destinos
      .filter(d => d.lat && d.lng)
      .map(d => [d.lat!, d.lng!] as [number, number]);

    if (coordinates.length > 1) {
      this.L.polyline(coordinates, {
        color: '#667eea',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(this.map);
    }
  }

  centrarEnDestino(destino: DestinoMapa, index: number): void {
    if (destino.lat && destino.lng && this.markers[index] && this.map) {
      this.map.setView([destino.lat, destino.lng], 10);
      this.markers[index].openPopup();
    }
  }

  volverAtras(): void {
    this.volver.emit();
  }

  cambiarTab(tab: string): void {
    this.navegarATab.emit(tab);
  }
}