import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface DestinoResultado {
  id: number;
  nombre: string;
  pais: string;
  categoria: string;
  imagen: string;
  rating: number;
  esFavorito: boolean;
  precio: number;
  matchPercentage: number;
  descripcionIA?: string;
  porQueEncaja?: string;
  destacados?: string[];
  presupuestoEstimado?: string;
  mejorEpoca?: string;
}

interface Preferencias {
  clima?: string;
  presupuesto?: string;
  tipo?: string;
  estilo?: string;
  actividades: string[];
}

interface PerfilUsuario {
  titulo: string;
  descripcion: string;
}

interface RespuestaIA {
  perfilViajero: {
    titulo: string;
    descripcion: string;
    caracteristicas: string[];
  };
  recomendaciones: Array<{
    destinoId: number;
    nombre: string;
    porQueEncaja: string;
    destacados: string[];
    descripcion: string;
  }>;
  consejosPersonalizados: string[];
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  @Input() respuestasEncuesta?: Preferencias;
  @Output() verDetalle = new EventEmitter<number>();

  perfilUsuario: PerfilUsuario = {
    titulo: 'Tu perfil de viajero',
    descripcion: 'Hemos seleccionado estos destinos especialmente para ti.'
  };
  
  destinosRecomendados: DestinoResultado[] = [];
  consejosIA: string[] = [];
  currentTab: string = 'inicio';
  cargandoIA: boolean = false;
  errorIA: boolean = false;

  presupuestoLabel: string = '';
  tipoLabel: string = '';

  todosLosDestinos: DestinoResultado[] = [
    {
      id: 1,
      nombre: 'Machu Picchu',
      pais: 'Perú',
      categoria: 'Aventura',
      imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600',
      rating: 4.7,
      esFavorito: true,
      precio: 120,
      matchPercentage: 0
    },
    {
      id: 2,
      nombre: 'Costa Rica',
      pais: 'Costa Rica',
      categoria: 'Naturaleza',
      imagen: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600',
      rating: 4.9,
      esFavorito: true,
      precio: 95,
      matchPercentage: 0
    },
    {
      id: 3,
      nombre: 'Maldivas',
      pais: 'Maldivas',
      categoria: 'Lujo',
      imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600',
      rating: 5.0,
      esFavorito: false,
      precio: 350,
      matchPercentage: 0
    },
    {
      id: 4,
      nombre: 'París',
      pais: 'Francia',
      categoria: 'Cultural',
      imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
      rating: 4.8,
      esFavorito: false,
      precio: 180,
      matchPercentage: 0
    },
    {
      id: 5,
      nombre: 'Tokio',
      pais: 'Japón',
      categoria: 'Ciudad',
      imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
      rating: 4.9,
      esFavorito: false,
      precio: 200,
      matchPercentage: 0
    },
    {
      id: 6,
      nombre: 'Bali',
      pais: 'Indonesia',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
      rating: 4.8,
      esFavorito: true,
      precio: 85,
      matchPercentage: 0
    },
    {
      id: 7,
      nombre: 'Santorini',
      pais: 'Grecia',
      categoria: 'Playa',
      imagen: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600',
      rating: 4.9,
      esFavorito: false,
      precio: 160,
      matchPercentage: 0
    },
    {
      id: 8,
      nombre: 'Patagonia',
      pais: 'Argentina',
      categoria: 'Aventura',
      imagen: 'https://images.unsplash.com/photo-1543519662-eadad632a65f?w=600',
      rating: 4.8,
      esFavorito: false,
      precio: 140,
      matchPercentage: 0
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.respuestasEncuesta) {
      this.calcularRecomendaciones();
      this.calcularLabels();
      // Llamar a la IA después de calcular recomendaciones básicas
      this.generarRecomendacionesConIA();
    }
  }

  calcularLabels(): void {
    if (!this.respuestasEncuesta) return;

    if (this.respuestasEncuesta.presupuesto === 'economico') {
      this.presupuestoLabel = 'Económico';
    } else if (this.respuestasEncuesta.presupuesto === 'moderado') {
      this.presupuestoLabel = 'Moderado';
    } else if (this.respuestasEncuesta.presupuesto === 'lujo') {
      this.presupuestoLabel = 'Lujo';
    }

    if (this.respuestasEncuesta.tipo) {
      this.tipoLabel = this.respuestasEncuesta.tipo.charAt(0).toUpperCase() + 
                       this.respuestasEncuesta.tipo.slice(1);
    }
  }

  calcularRecomendaciones(): void {
    if (!this.respuestasEncuesta) return;

    this.todosLosDestinos.forEach(destino => {
      destino.matchPercentage = this.calcularMatch(destino);
    });

    this.destinosRecomendados = this.todosLosDestinos
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 4);
  }

  calcularMatch(destino: DestinoResultado): number {
    let puntos = 0;
    const maxPuntos = 100;

    if (!this.respuestasEncuesta) return 0;

    if (this.respuestasEncuesta.presupuesto) {
      if (this.respuestasEncuesta.presupuesto === 'economico' && destino.precio < 100) {
        puntos += 30;
      } else if (this.respuestasEncuesta.presupuesto === 'moderado' && destino.precio >= 80 && destino.precio <= 200) {
        puntos += 30;
      } else if (this.respuestasEncuesta.presupuesto === 'lujo' && destino.precio > 180) {
        puntos += 30;
      }
    }

    if (this.respuestasEncuesta.tipo) {
      const tipoMap: { [key: string]: string[] } = {
        'playa': ['Playa', 'Lujo'],
        'montana': ['Aventura', 'Naturaleza'],
        'ciudad': ['Ciudad', 'Cultural'],
        'aventura': ['Aventura', 'Naturaleza'],
        'cultural': ['Cultural', 'Ciudad'],
        'naturaleza': ['Naturaleza', 'Aventura']
      };

      const categoriasCompatibles = tipoMap[this.respuestasEncuesta.tipo] || [];
      if (categoriasCompatibles.includes(destino.categoria)) {
        puntos += 40;
      }
    }

    if (this.respuestasEncuesta.actividades && this.respuestasEncuesta.actividades.length > 0) {
      const actividadMap: { [key: string]: string[] } = {
        'deportes-extremos': ['Aventura'],
        'visitas-culturales': ['Cultural', 'Ciudad'],
        'relajacion': ['Playa', 'Lujo'],
        'gastronomia': ['Cultural', 'Ciudad'],
        'vida-nocturna': ['Ciudad']
      };

      this.respuestasEncuesta.actividades.forEach((actividad: string) => {
        const categoriasCompatibles = actividadMap[actividad] || [];
        if (categoriasCompatibles.includes(destino.categoria)) {
          puntos += 10;
        }
      });
    }

    return Math.min(puntos, maxPuntos);
  }

  async generarRecomendacionesConIA(): Promise<void> {
    if (!this.respuestasEncuesta) return;

    this.cargandoIA = true;
    this.errorIA = false;

    // OPCIÓN 1: Usar IA real (requiere configuración de API)
    // Descomenta esto cuando tengas la API configurada
    /*
    try {
      const destinosDisponibles = this.destinosRecomendados.map(d => ({
        id: d.id,
        nombre: d.nombre,
        pais: d.pais,
        categoria: d.categoria,
        precio: d.precio
      }));

      const prompt = `Eres un experto asesor de viajes...`;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        })
      });

      const data = await response.json();
      const textContent = data.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('');
      
      const cleanText = textContent.replace(/```json|```/g, '').trim();
      const resultado: RespuestaIA = JSON.parse(cleanText);

      this.aplicarResultadosIA(resultado);
    } catch (error) {
      console.error('Error con IA real:', error);
      this.usarRecomendacionesFallback();
    } finally {
      this.cargandoIA = false;
    }
    */

    // OPCIÓN 2: Simulación de IA (para desarrollo)
    // Esta versión genera recomendaciones inteligentes sin necesidad de API
    setTimeout(() => {
      try {
        const resultado = this.generarRecomendacionesSimuladas();
        this.aplicarResultadosIA(resultado);
      } catch (error) {
        console.error('Error al generar recomendaciones:', error);
        this.usarRecomendacionesFallback();
      } finally {
        this.cargandoIA = false;
      }
    }, 2000); // Simula tiempo de procesamiento
  }

  private generarRecomendacionesSimuladas(): RespuestaIA {
    if (!this.respuestasEncuesta) throw new Error('No hay preferencias');

    // Generar perfil personalizado
    const perfiles = this.obtenerPerfilesPersonalizados();
    const clavePerf = `${this.respuestasEncuesta.presupuesto}-${this.respuestasEncuesta.tipo}`;
    const perfilBase = perfiles[clavePerf] || perfiles['default'];

    // Generar recomendaciones para cada destino
    const recomendaciones = this.destinosRecomendados.map(destino => {
      return {
        destinoId: destino.id,
        nombre: destino.nombre,
        porQueEncaja: this.generarPorQueEncaja(destino),
        destacados: this.generarDestacados(destino),
        descripcion: this.generarDescripcion(destino)
      };
    });

    // Generar consejos personalizados
    const consejos = this.generarConsejosPersonalizados();

    return {
      perfilViajero: {
        titulo: perfilBase.titulo,
        descripcion: perfilBase.descripcion,
        caracteristicas: perfilBase.caracteristicas
      },
      recomendaciones,
      consejosPersonalizados: consejos
    };
  }

  private obtenerPerfilesPersonalizados(): any {
    return {
      'economico-aventura': {
        titulo: '🎒 Aventurero Económico',
        descripcion: 'Eres un viajero que busca experiencias auténticas y emocionantes sin comprometer tu presupuesto. Valoras la aventura por encima del lujo.',
        caracteristicas: ['Busca autenticidad', 'Prefiere experiencias locales', 'Flexible y adaptable']
      },
      'economico-playa': {
        titulo: '🏖️ Amante de Playas Accesibles',
        descripcion: 'Disfrutas del sol, mar y arena sin necesidad de resorts lujosos. Buscas destinos playeros con excelente relación calidad-precio.',
        caracteristicas: ['Relax sin lujos', 'Destinos auténticos', 'Playas vírgenes']
      },
      'moderado-ciudad': {
        titulo: '🏙️ Explorador Urbano Equilibrado',
        descripcion: 'Te gusta explorar ciudades con un buen balance entre comodidad y precio. Buscas experiencias urbanas de calidad.',
        caracteristicas: ['Balance perfecto', 'Cultura y confort', 'Experiencias memorables']
      },
      'moderado-cultural': {
        titulo: '🏛️ Viajero Cultural Apasionado',
        descripcion: 'La historia, el arte y la cultura son tu prioridad. Buscas destinos que ofrezcan riqueza cultural con buenas opciones de alojamiento.',
        caracteristicas: ['Historia y arte', 'Museos y monumentos', 'Inmersión cultural']
      },
      'lujo-playa': {
        titulo: '🌴 Buscador de Experiencias Premium',
        descripcion: 'Valoras el máximo confort y exclusividad en paraísos tropicales. Para ti, unas vacaciones perfectas incluyen servicios de lujo.',
        caracteristicas: ['Exclusividad total', 'Servicios premium', 'Experiencias únicas']
      },
      'lujo-ciudad': {
        titulo: '✨ Viajero de Lujo Urbano',
        descripcion: 'Prefieres las mejores experiencias en grandes metrópolis. Hoteles 5 estrellas, restaurantes gourmet y eventos exclusivos.',
        caracteristicas: ['Máximo confort', 'Gastronomía premium', 'Acceso VIP']
      },
      'default': {
        titulo: '🌍 Viajero Personalizado',
        descripcion: 'Tienes un estilo único de viajar que combina diferentes preferencias. Buscamos destinos versátiles que se adapten a ti.',
        caracteristicas: ['Estilo único', 'Flexible', 'Experiencias variadas']
      }
    };
  }

  private generarPorQueEncaja(destino: DestinoResultado): string {
    const razonesBase: { [key: string]: string[] } = {
      'Aventura': [
        'Este destino ofrece increíbles oportunidades para deportes de aventura y exploración',
        'Perfecto para quienes buscan adrenalina y experiencias al aire libre',
        'Cuenta con paisajes espectaculares ideales para aventureros'
      ],
      'Playa': [
        'Sus playas paradisíacas son ideales para relajarse y desconectar',
        'Ofrece el equilibrio perfecto entre relax y actividades acuáticas',
        'Destino costero con aguas cristalinas y arena blanca'
      ],
      'Cultural': [
        'Rica historia y patrimonio cultural que explorar',
        'Museos de clase mundial y arquitectura impresionante',
        'Perfecto para sumergirse en otra cultura'
      ],
      'Ciudad': [
        'Vibrante vida urbana con infinitas opciones de entretenimiento',
        'Mezcla perfecta de modernidad y tradición',
        'Ideal para explorar la vida cosmopolita'
      ],
      'Naturaleza': [
        'Belleza natural incomparable y biodiversidad única',
        'Perfecto para conectar con la naturaleza',
        'Paisajes que te dejarán sin aliento'
      ],
      'Lujo': [
        'Servicios de primera clase y atención personalizada',
        'Experiencias exclusivas y confort excepcional',
        'Resorts de lujo con todas las comodidades'
      ]
    };

    const razones = razonesBase[destino.categoria] || razonesBase['Aventura'];
    const razonBase = razones[Math.floor(Math.random() * razones.length)];

    // Personalizar según presupuesto
    if (this.respuestasEncuesta?.presupuesto === 'economico') {
      return `${razonBase}. Además, ofrece excelente relación calidad-precio, perfecto para tu presupuesto.`;
    } else if (this.respuestasEncuesta?.presupuesto === 'lujo') {
      return `${razonBase}. Cuenta con opciones premium que cumplen con tus altos estándares de calidad.`;
    }
    return `${razonBase}. Se ajusta perfectamente a tus preferencias y presupuesto.`;
  }

  private generarDestacados(destino: DestinoResultado): string[] {
    const destacadosBase: { [key: string]: string[][] } = {
      'Machu Picchu': [
        ['Ciudadela inca del siglo XV', 'Trekking del Camino Inca', 'Vistas espectaculares de montaña'],
        ['Una de las 7 maravillas del mundo', 'Experiencia arqueológica única', 'Cultura andina viva']
      ],
      'Costa Rica': [
        ['Biodiversidad excepcional', 'Playas del Caribe y Pacífico', 'Aventura y ecoturismo'],
        ['Volcanes activos', 'Canopy y tirolesa', 'Vida silvestre abundante']
      ],
      'Maldivas': [
        ['Resorts overwater de lujo', 'Snorkel y buceo de clase mundial', 'Playas de arena blanca'],
        ['Aguas cristalinas turquesas', 'Privacidad y exclusividad', 'Spa y wellness']
      ],
      'París': [
        ['Torre Eiffel y museos icónicos', 'Gastronomía de clase mundial', 'Arquitectura impresionante'],
        ['Arte y cultura por doquier', 'Ciudad del amor y el romance', 'Shopping de lujo']
      ],
      'Tokio': [
        ['Mezcla de tradición y modernidad', 'Gastronomía japonesa auténtica', 'Tecnología de vanguardia'],
        ['Templos históricos', 'Vida nocturna vibrante', 'Cultura pop y anime']
      ],
      'Bali': [
        ['Templos hindúes impresionantes', 'Playas y surf', 'Terrazas de arroz icónicas'],
        ['Yoga y retiros wellness', 'Cultura balinesa única', 'Precios accesibles']
      ],
      'Santorini': [
        ['Atardeceres más bellos del mundo', 'Arquitectura blanca y azul', 'Vinos locales excepcionales'],
        ['Playas volcánicas únicas', 'Pueblos pintorescos', 'Cocina mediterránea']
      ],
      'Patagonia': [
        ['Glaciares imponentes', 'Trekking de nivel mundial', 'Naturaleza prístina'],
        ['Fauna silvestre única', 'Lagos y montañas', 'Aventura extrema']
      ]
    };

    const opciones = destacadosBase[destino.nombre] || [
      ['Experiencias únicas', 'Cultura local auténtica', 'Paisajes impresionantes']
    ];
    
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  private generarDescripcion(destino: DestinoResultado): string {
    const descripciones: { [key: string]: string } = {
      'Machu Picchu': 'Antigua ciudadela inca en lo alto de los Andes peruanos, considerada una obra maestra de la arquitectura.',
      'Costa Rica': 'Paraíso tropical con increíble biodiversidad, perfecto para amantes de la naturaleza y la aventura.',
      'Maldivas': 'Archipiélago de ensueño con aguas cristalinas y resorts de lujo sobre el agua.',
      'París': 'La ciudad de la luz, capital del arte, la moda y la gastronomía francesa.',
      'Tokio': 'Megaciudad fascinante donde la tradición milenaria se encuentra con la tecnología futurista.',
      'Bali': 'Isla indonesia conocida por sus templos, playas, terrazas de arroz y cultura espiritual.',
      'Santorini': 'Isla griega icónica famosa por sus pueblos blancos con cúpulas azules y atardeceres espectaculares.',
      'Patagonia': 'Región de belleza natural extrema con glaciares, montañas y lagos de ensueño.'
    };

    return descripciones[destino.nombre] || `Destino increíble en ${destino.pais} con experiencias únicas que recordarás para siempre.`;
  }

  private generarConsejosPersonalizados(): string[] {
    const consejos: string[] = [];

    if (!this.respuestasEncuesta) return consejos;

    // Consejo de presupuesto
    if (this.respuestasEncuesta.presupuesto === 'economico') {
      consejos.push('Reserva con anticipación para obtener las mejores tarifas y considera viajar en temporada baja');
    } else if (this.respuestasEncuesta.presupuesto === 'lujo') {
      consejos.push('Consulta con un agente de viajes de lujo para experiencias exclusivas y acceso VIP');
    } else {
      consejos.push('Combina hoteles boutique con algunas experiencias premium para el equilibrio perfecto');
    }

    // Consejo de actividades
    if (this.respuestasEncuesta.actividades.includes('deportes-extremos')) {
      consejos.push('Contrata un seguro de viaje que cubra actividades de aventura y deportes extremos');
    }
    if (this.respuestasEncuesta.actividades.includes('gastronomia')) {
      consejos.push('Reserva con anticipación en restaurantes populares y considera un tour gastronómico guiado');
    }
    if (this.respuestasEncuesta.actividades.includes('relajacion')) {
      consejos.push('Dedica tiempo suficiente para disfrutar sin prisas, menos es más cuando buscas relajarte');
    }

    // Consejo general
    consejos.push('Descarga mapas offline y aprende algunas frases básicas del idioma local antes de viajar');

    return consejos.slice(0, 3);
  }

  private aplicarResultadosIA(resultado: RespuestaIA): void {
    // Actualizar perfil de usuario
    this.perfilUsuario = {
      titulo: resultado.perfilViajero.titulo,
      descripcion: resultado.perfilViajero.descripcion
    };

    // Enriquecer destinos con información de la IA
    resultado.recomendaciones.forEach(rec => {
      const destino = this.destinosRecomendados.find(d => d.id === rec.destinoId);
      if (destino) {
        destino.descripcionIA = rec.descripcion;
        destino.porQueEncaja = rec.porQueEncaja;
        destino.destacados = rec.destacados;
      }
    });

    this.consejosIA = resultado.consejosPersonalizados || [];
  }

  private usarRecomendacionesFallback(): void {
    this.errorIA = true;
    this.generarPerfilUsuarioBasico();
  }

  generarPerfilUsuarioBasico(): void {
    if (!this.respuestasEncuesta) return;

    const perfiles: { [key: string]: PerfilUsuario } = {
      'economico-aventura': {
        titulo: 'Aventurero Económico',
        descripcion: 'Eres un aventurero que busca experiencias auténticas sin gastar de más.'
      },
      'economico-playa': {
        titulo: 'Amante de Playas Accesibles',
        descripcion: 'Prefieres destinos de playa accesibles y relajantes.'
      },
      'moderado-ciudad': {
        titulo: 'Explorador Urbano',
        descripcion: 'Disfrutas explorar ciudades con buen balance calidad-precio.'
      },
      'moderado-cultural': {
        titulo: 'Viajero Cultural',
        descripcion: 'Buscas experiencias culturales enriquecedoras.'
      },
      'lujo-playa': {
        titulo: 'Buscador de Experiencias Premium',
        descripcion: 'Valoras el confort y la exclusividad en destinos paradisíacos.'
      },
      'lujo-ciudad': {
        titulo: 'Viajero de Lujo Urbano',
        descripcion: 'Prefieres experiencias premium en grandes ciudades.'
      }
    };

    const clave = `${this.respuestasEncuesta.presupuesto}-${this.respuestasEncuesta.tipo}`;
    this.perfilUsuario = perfiles[clave] || {
      titulo: 'Tu perfil de viajero',
      descripcion: 'Hemos seleccionado estos destinos especialmente para ti.'
    };
  }

  toggleFavorito(destino: DestinoResultado): void {
    destino.esFavorito = !destino.esFavorito;
    console.log(`Destino ${destino.nombre} favorito: ${destino.esFavorito}`);
  }

  verDetalles(destino: DestinoResultado): void {
    console.log('Ver detalles de:', destino.nombre);
    this.verDetalle.emit(destino.id);
  }

  cambiarTab(tab: string): void {
    this.currentTab = tab;
    console.log('Tab seleccionado:', tab);
  }

  getMatchColor(percentage: number): string {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  }

  getMatchLabel(percentage: number): string {
    if (percentage >= 80) return 'Excelente';
    if (percentage >= 60) return 'Bueno';
    if (percentage >= 40) return 'Moderado';
    return 'Bajo';
  }
}