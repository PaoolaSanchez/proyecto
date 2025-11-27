import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
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
export class TripMapComponent implements OnInit, AfterViewInit {
  @Input() nombreViaje?: string;
  @Input() destinos: DestinoMapa[] = [];
  @Output() volver = new EventEmitter<void>();

  private map: any;
  private markers: any[] = [];
  private L: any;

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
    'Dubai': { lat: 25.2048, lng: 55.2708 }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.asignarCoordenadas();
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      // Importar Leaflet solo en el navegador
      this.L = await import('leaflet');
      setTimeout(() => {
        this.inicializarMapa();
      }, 100);
    }
  }

  asignarCoordenadas(): void {
    this.destinos = this.destinos.map(destino => {
      const coords = this.coordinadasDestinos[destino.nombre];
      return {
        ...destino,
        lat: coords?.lat || 0,
        lng: coords?.lng || 0
      };
    });
  }

  inicializarMapa(): void {
    if (!this.L) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Si no hay destinos, mostrar mapa centrado en el mundo
    if (this.destinos.length === 0) {
      this.map = this.L.map('map').setView([20, 0], 2);
      this.agregarTileLayer();
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
}