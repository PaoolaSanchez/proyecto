import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface DestinoBasico {
  id: number;
  nombre: string;
  pais: string;
  categoria: string;
  imagen: string;
  rating: number;
  esFavorito: boolean;
  colorCategoria: string;
}

export interface DestinoCompleto extends DestinoBasico {
  imagenPrincipal: string;
  imagenesGaleria: string[];
  descripcion: string;
  queHacer: string[];
  detallesViaje: {
    mejorEpoca: string;
    duracionRecomendada: string;
    presupuestoPromedio: string;
  };
  consejos: string[];
  queEllevar: string[];
  emergencias: {
    policia: string;
    bomberos: string;
    ambulancia: string;
    embajada: string;
  };
}

// Interface para los destinos que vienen del backend
interface DestinoBackend {
  id: number;
  nombre: string;
  pais: string;
  categoria: string;
  imagen: string;
  imagen_principal?: string;
  rating: number;
  descripcion?: string;
  presupuesto_promedio?: string;
  duracion_recomendada?: string;
  mejor_epoca?: string;
  que_hacer?: string[] | string;
  consejos?: string[] | string;
  que_llevar?: string[] | string;
  emergencias?: any;
  imagenes_galeria?: string[] | string;
}

@Injectable({
  providedIn: 'root'
})
export class DestinosService {
  // Usar configuración de entorno para apuntar al backend correcto
  private apiUrl = environment.apiUrl || '/api';
  
  // Caché de destinos
  private destinosCache = new BehaviorSubject<DestinoCompleto[]>([]);
  public destinos$ = this.destinosCache.asObservable();
  
  // Datos de fallback (si el backend no está disponible)
  private destinosFallback: DestinoCompleto[] = [
    {
      id: 1,
      nombre: 'Machu Picchu',
      pais: 'Perú',
      categoria: 'Aventura',
      imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
      rating: 4.7,
      esFavorito: false,
      colorCategoria: '#4CAF50',
      imagenPrincipal: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
      imagenesGaleria: [
        'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
        'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400',
        'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=400'
      ],
      descripcion: 'Machu Picchu es una antigua ciudad inca ubicada en lo alto de los Andes peruanos.',
      queHacer: [
        'Explorar las ruinas incas',
        'Caminar por el Camino Inca',
        'Visitar el Templo del Sol',
        'Fotografiar la ciudadela al amanecer',
        'Conocer Aguas Calientes'
      ],
      detallesViaje: {
        mejorEpoca: 'Abril a Octubre',
        duracionRecomendada: '3-4 días',
        presupuestoPromedio: '$800 - $1,500 USD'
      },
      consejos: [
        'Reserva tus entradas con anticipación',
        'Aclimátate a la altitud en Cusco primero',
        'Lleva protector solar y repelente'
      ],
      queEllevar: [
        'Pasaporte vigente',
        'Bloqueador solar',
        'Repelente de insectos'
      ],
      emergencias: {
        policia: '105',
        bomberos: '116',
        ambulancia: '117',
        embajada: '+51-1-618-2000'
      }
    },
    {
      id: 2,
      nombre: 'Tokio',
      pais: 'Japón',
      categoria: 'Ciudad',
      imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      rating: 4.9,
      esFavorito: false,
      colorCategoria: '#E91E63',
      imagenPrincipal: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      imagenesGaleria: [
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
        'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400',
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400'
      ],
      descripcion: 'Tokyo es la vibrante capital de Japón, donde la tradición se encuentra con la tecnología.',
      queHacer: [
        'Visitar el Templo Senso-ji',
        'Explorar el cruce de Shibuya',
        'Conocer el Palacio Imperial'
      ],
      detallesViaje: {
        mejorEpoca: 'Marzo a Mayo / Septiembre a Noviembre',
        duracionRecomendada: '5-7 días',
        presupuestoPromedio: '$1,200 - $2,500 USD'
      },
      consejos: [
        'Compra un JR Pass para moverte',
        'Aprende frases básicas en japonés'
      ],
      queEllevar: [
        'Adaptador de corriente',
        'Tarjeta Suica o Pasmo'
      ],
      emergencias: {
        policia: '110',
        bomberos: '119',
        ambulancia: '119',
        embajada: '+81-3-3224-5000'
      }
    },
    {
      id: 3,
      nombre: 'Maldivas',
      pais: 'Maldivas',
      categoria: 'Lujo',
      imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400',
      rating: 5.0,
      esFavorito: false,
      colorCategoria: '#FF9800',
      imagenPrincipal: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
      imagenesGaleria: [
        'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400'
      ],
      descripcion: 'Las Maldivas son un paraíso tropical con aguas cristalinas.',
      queHacer: [
        'Buceo en arrecifes de coral',
        'Snorkel con mantarrayas',
        'Cena romántica en la playa'
      ],
      detallesViaje: {
        mejorEpoca: 'Noviembre a Abril',
        duracionRecomendada: '5-7 días',
        presupuestoPromedio: '$2,500 - $5,000+ USD'
      },
      consejos: [
        'Reserva tu resort con anticipación',
        'Lleva equipo de snorkel propio'
      ],
      queEllevar: [
        'Traje de baño',
        'Protector solar biodegradable',
        'Cámara acuática'
      ],
      emergencias: {
        policia: '119',
        bomberos: '118',
        ambulancia: '102',
        embajada: '+960-332-4740'
      }
    },
    {
      id: 4,
      nombre: 'París',
      pais: 'Francia',
      categoria: 'Cultura',
      imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      rating: 4.8,
      esFavorito: false,
      colorCategoria: '#9C27B0',
      imagenPrincipal: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      imagenesGaleria: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
        'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400',
        'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=400'
      ],
      descripcion: 'París, la Ciudad de la Luz, es sinónimo de romance y arte.',
      queHacer: [
        'Subir a la Torre Eiffel',
        'Visitar el Museo del Louvre',
        'Pasear por los Campos Elíseos'
      ],
      detallesViaje: {
        mejorEpoca: 'Abril a Junio / Septiembre a Octubre',
        duracionRecomendada: '4-6 días',
        presupuestoPromedio: '$1,500 - $3,000 USD'
      },
      consejos: [
        'Compra el Paris Pass',
        'Usa el metro para moverte'
      ],
      queEllevar: [
        'Ropa elegante casual',
        'Zapatos cómodos para caminar',
        'Adaptador europeo'
      ],
      emergencias: {
        policia: '17',
        bomberos: '18',
        ambulancia: '15',
        embajada: '+33-1-43-12-22-22'
      }
    },
    {
      id: 5,
      nombre: 'Cancún',
      pais: 'México',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=400',
      rating: 4.6,
      esFavorito: false,
      colorCategoria: '#00BCD4',
      imagenPrincipal: 'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=800',
      imagenesGaleria: [
        'https://images.unsplash.com/photo-1552082992-3ee6d3f2e6bd?w=400',
        'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=400',
        'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=400'
      ],
      descripcion: 'Cancún es el destino de playa más popular de México.',
      queHacer: [
        'Visitar las ruinas de Chichén Itzá',
        'Nadar en cenotes',
        'Buceo en el museo subacuático'
      ],
      detallesViaje: {
        mejorEpoca: 'Diciembre a Abril',
        duracionRecomendada: '5-7 días',
        presupuestoPromedio: '$800 - $1,800 USD'
      },
      consejos: [
        'Reserva tours con anticipación',
        'Usa protector solar biodegradable'
      ],
      queEllevar: [
        'Traje de baño',
        'Protector solar',
        'Sombrero y lentes de sol'
      ],
      emergencias: {
        policia: '911',
        bomberos: '911',
        ambulancia: '911',
        embajada: '+52-998-883-0272'
      }
    },
    {
      id: 6,
      nombre: 'Bali',
      pais: 'Indonesia',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
      rating: 4.8,
      esFavorito: false,
      colorCategoria: '#00BCD4',
      imagenPrincipal: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
      imagenesGaleria: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
        'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400',
        'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=400'
      ],
      descripcion: 'Bali combina playas paradisíacas y templos sagrados.',
      queHacer: [
        'Visitar templos antiguos',
        'Surf en las mejores playas',
        'Clases de yoga y meditación'
      ],
      detallesViaje: {
        mejorEpoca: 'Abril a Octubre',
        duracionRecomendada: '7-10 días',
        presupuestoPromedio: '$1,000 - $2,200 USD'
      },
      consejos: [
        'Respeta las costumbres religiosas',
        'Lleva ropa modesta para templos'
      ],
      queEllevar: [
        'Sarong para templos',
        'Protector solar',
        'Repelente de insectos'
      ],
      emergencias: {
        policia: '110',
        bomberos: '113',
        ambulancia: '118',
        embajada: '+62-361-233-605'
      }
    }
  ];

  constructor(private http: HttpClient) {
    // Cargar destinos al iniciar
    this.cargarDestinosIniciales();
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  // Cargar destinos desde el backend
  cargarDestinosDesdeBackend(): Observable<DestinoCompleto[]> {
    return this.http.get<{ success: boolean; count: number; data: DestinoBackend[] }>(`${this.apiUrl}/destinos`).pipe(
      map(response => this.convertirDestinosBackend(response.data || [])),
      tap(destinos => {
        this.destinosCache.next(destinos);
        console.log('✅ Destinos cargados desde backend:', destinos.length);
      }),
      catchError(error => {
        console.warn('⚠️ Error cargando destinos del backend, usando datos locales:', error);
        this.destinosCache.next(this.destinosFallback);
        return of(this.destinosFallback);
      })
    );
  }

  // Obtener todos los destinos (versión básica para listados)
  getDestinos(): DestinoBasico[] {
    const destinos = this.destinosCache.value;
    if (destinos.length === 0) {
      return this.destinosFallback.map(d => this.convertirABasico(d));
    }
    return destinos.map(d => this.convertirABasico(d));
  }

  // Obtener un destino completo por ID
  getDestinoById(id: number): DestinoCompleto | undefined {
    const destinos = this.destinosCache.value;
    const destinosABuscar = destinos.length > 0 ? destinos : this.destinosFallback;
    return destinosABuscar.find(d => d.id === id);
  }

  // Actualizar estado de favorito
  actualizarFavorito(id: number, esFavorito: boolean): void {
    const destinos = this.destinosCache.value;
    const destino = destinos.find(d => d.id === id);
    if (destino) {
      destino.esFavorito = esFavorito;
      this.destinosCache.next([...destinos]);
    }
  }

  // Sincronizar favoritos desde localStorage o backend
  sincronizarFavoritos(favoritosIds: number[]): void {
    const destinos = this.destinosCache.value;
    const destinosActualizados = destinos.map(destino => ({
      ...destino,
      esFavorito: favoritosIds.includes(destino.id)
    }));
    this.destinosCache.next(destinosActualizados);
  }

  // Obtener destinos como Observable
  getDestinosObservable(): Observable<DestinoBasico[]> {
    return this.destinos$.pipe(
      map(destinos => destinos.map(d => this.convertirABasico(d)))
    );
  }

  // Obtener un destino completo por ID desde el backend
  getDestinoByIdFromBackend(id: number): Observable<DestinoCompleto> {
    return this.http.get<{ success: boolean; count?: number; data: DestinoBackend }>(`${this.apiUrl}/destinos/${id}`).pipe(
      map(response => {
        const destino = this.convertirDestinosBackend([response.data])[0];
        return destino;
      }),
      // Almacenar en la caché local para que componentes posteriores lo encuentren
      tap((destino: DestinoCompleto) => {
        try {
          const cache = this.destinosCache.value || [];
          const existe = cache.find(d => d.id === destino.id);
          if (existe) {
            const actualizado = cache.map(d => d.id === destino.id ? destino : d);
            this.destinosCache.next([...actualizado]);
          } else {
            this.destinosCache.next([...cache, destino]);
          }
        } catch (e) {
          // no bloquear si la actualización de cache falla
          console.warn('⚠️ Error actualizando cache de destinos:', e);
        }
      }),
      catchError(error => {
        console.warn(`⚠️ Error cargando destino ${id} del backend:`, error);
        // Intentar obtener del fallback
        const fallback = this.destinosFallback.find(d => d.id === id);
        if (fallback) {
          return of(fallback);
        }
        throw error;
      })
    );
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private cargarDestinosIniciales(): void {
    // Intentar cargar desde backend
    this.cargarDestinosDesdeBackend().subscribe({
      next: () => {
        console.log('✅ Destinos inicializados desde backend');
      },
      error: () => {
        console.warn('⚠️ Usando datos locales de fallback');
      }
    });
  }

  private convertirDestinosBackend(destinosBackend: DestinoBackend[]): DestinoCompleto[] {
    return destinosBackend.map(db => {
      // Buscar datos adicionales en fallback solo si no hay datos en el backend
      const fallbackData = this.destinosFallback.find(d => d.id === db.id);
      
      // Parsear campos JSON del backend
      const queHacer = this.parsearArrayJSON(db.que_hacer);
      const consejos = this.parsearArrayJSON(db.consejos);
      const queLlevar = this.parsearArrayJSON(db.que_llevar);
      const emergencias = this.parsearObjetoJSON(db.emergencias);
      const imagenesGaleria = this.parsearArrayJSON(db.imagenes_galeria);
      
      return {
        id: db.id,
        nombre: db.nombre,
        pais: db.pais,
        categoria: db.categoria,
        imagen: db.imagen,
        rating: db.rating,
        esFavorito: false,
        colorCategoria: this.getColorPorCategoria(db.categoria),
        imagenPrincipal: db.imagen_principal || db.imagen,
        imagenesGaleria: imagenesGaleria.length > 0 ? imagenesGaleria : (fallbackData?.imagenesGaleria || [db.imagen]),
        descripcion: db.descripcion || fallbackData?.descripcion || '',
        queHacer: queHacer.length > 0 ? queHacer : (fallbackData?.queHacer || []),
        detallesViaje: {
          mejorEpoca: db.mejor_epoca || fallbackData?.detallesViaje.mejorEpoca || '',
          duracionRecomendada: db.duracion_recomendada || fallbackData?.detallesViaje.duracionRecomendada || '',
          presupuestoPromedio: db.presupuesto_promedio || fallbackData?.detallesViaje.presupuestoPromedio || ''
        },
        consejos: consejos.length > 0 ? consejos : (fallbackData?.consejos || []),
        queEllevar: queLlevar.length > 0 ? queLlevar : (fallbackData?.queEllevar || []),
        emergencias: emergencias && Object.keys(emergencias).length > 0 ? emergencias : (fallbackData?.emergencias || {
          policia: '911',
          bomberos: '911',
          ambulancia: '911',
          embajada: ''
        })
      };
    });
  }

  // Método helper para parsear arrays JSON del backend
  private parsearArrayJSON(valor: string[] | string | undefined): string[] {
    if (!valor) return [];
    if (Array.isArray(valor)) return valor;
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Método helper para parsear objetos JSON del backend
  private parsearObjetoJSON(valor: any): any {
    if (!valor) return {};
    if (typeof valor === 'object' && !Array.isArray(valor)) return valor;
    try {
      return JSON.parse(valor);
    } catch {
      return {};
    }
  }

  private convertirABasico(destino: DestinoCompleto): DestinoBasico {
    return {
      id: destino.id,
      nombre: destino.nombre,
      pais: destino.pais,
      categoria: destino.categoria,
      imagen: destino.imagen,
      rating: destino.rating,
      esFavorito: destino.esFavorito,
      colorCategoria: destino.colorCategoria
    };
  }

  private getColorPorCategoria(categoria: string): string {
    const categoriaLower = (categoria || '').toLowerCase();
    const colores: { [key: string]: string } = {
      'aventura': '#4CAF50',      // Verde - Aventura/Adrenalina
      'ciudad': '#667eea',        // Púrpura/Azul - Urbano
      'lujo': '#ba8b02',          // Dorado - Lujo/Premium
      'cultura': '#f5576c',       // Rosa/Coral - Cultural
      'cultural': '#f5576c',      // Rosa/Coral - Cultural (alias)
      'playa': '#00b4db',         // Azul turquesa - Playa/Mar
      'naturaleza': '#11998e',    // Verde esmeralda - Naturaleza
      'montaña': '#557c93',       // Azul grisáceo - Montaña
      'montana': '#557c93',       // Montaña (sin tilde)
      'romantico': '#E91E63',     // Rosa - Romántico
      'familiar': '#FF9800',      // Naranja - Familiar
      'gastronomia': '#795548',   // Marrón - Gastronomía
      'historico': '#9C27B0',     // Púrpura - Histórico
      'religioso': '#673AB7',     // Índigo - Religioso
      'deportes': '#2196F3',      // Azul - Deportes
      'ecologico': '#8BC34A',     // Verde claro - Ecológico
      'rural': '#795548'          // Marrón - Rural
    };
    return colores[categoriaLower] || '#607D8B';
  }

  // Método para refrescar los destinos
  refrescarDestinos(): Observable<DestinoCompleto[]> {
    return this.cargarDestinosDesdeBackend();
  }
}