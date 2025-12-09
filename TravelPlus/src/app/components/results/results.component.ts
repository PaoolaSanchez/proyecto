import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DestinosService, DestinoCompleto } from '../../services/destinos.service';
//import { ApiService } from '../services/api.service';

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
  // Campos del backend
  queHacer?: string[];
  consejos?: string[];
  queLlevar?: string[];
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
  @Output() refinarBusqueda = new EventEmitter<void>();
  @Output() verTodosDestinos = new EventEmitter<void>();

  perfilUsuario: PerfilUsuario = {
    titulo: 'Tu perfil de viajero',
    descripcion: 'Hemos seleccionado estos destinos especialmente para ti.'
  };
  
  destinosRecomendados: DestinoResultado[] = [];
  consejosIA: string[] = [];
  currentTab: string = 'inicio';
  cargandoIA: boolean = false;
  errorIA: boolean = false;
  errorMensaje: string = ''; 

  presupuestoLabel: string = '';
  tipoLabel: string = '';

  todosLosDestinos: DestinoResultado[] = [];

  // Datos completos de destinos del backend
  destinosCompletos: DestinoCompleto[] = [];

  constructor(private http: HttpClient, private destinosService: DestinosService) {}
//constructor(private apiService: ApiService) {}
  ngOnInit(): void {
    // Cargar destinos desde backend y mapearlos al formato de resultados
    this.destinosService.cargarDestinosDesdeBackend().subscribe({
      next: (destinos: DestinoCompleto[]) => {
        // Guardar destinos completos para usar con IA
        this.destinosCompletos = destinos;
        
        this.todosLosDestinos = destinos.map(d => ({
          id: d.id,
          nombre: d.nombre,
          pais: d.pais,
          categoria: this.normalizarCategoria(d.categoria || 'General'),
          imagen: d.imagenPrincipal || d.imagen || '',
          rating: d.rating || 4.5,
          esFavorito: false,
          precio: this.estimarPrecio(d),
          matchPercentage: 0,
          queHacer: d.queHacer || [],
          consejos: d.consejos || [],
          queLlevar: d.queEllevar || []
        }));

        if (this.respuestasEncuesta) {
          this.calcularRecomendaciones();
          this.calcularLabels();
          this.generarRecomendacionesConIA();
        }
      },
      error: () => {
        // Si falla la carga, mantener la lista vacía y seguir con la lógica de IA si aplica
        if (this.respuestasEncuesta) {
          this.calcularRecomendaciones();
          this.calcularLabels();
          this.generarRecomendacionesConIA();
        }
      }
    });
  }

  // Normalizar categoría del backend
  private normalizarCategoria(categoria: string): string {
    const mapeo: { [key: string]: string } = {
      'playa': 'Playa',
      'ciudad': 'Ciudad',
      'cultura': 'Cultural',
      'aventura': 'Aventura',
      'naturaleza': 'Naturaleza',
      'lujo': 'Lujo'
    };
    return mapeo[categoria.toLowerCase()] || categoria;
  }

  // Estimar precio basado en datos del destino
  private estimarPrecio(destino: DestinoCompleto): number {
    const presupuesto = destino.detallesViaje?.presupuestoPromedio || '';
    if (presupuesto.includes('5,000') || presupuesto.includes('4,000')) return 250;
    if (presupuesto.includes('3,000') || presupuesto.includes('2,500')) return 180;
    if (presupuesto.includes('2,000') || presupuesto.includes('1,800')) return 120;
    if (presupuesto.includes('1,500') || presupuesto.includes('1,200')) return 90;
    if (presupuesto.includes('800') || presupuesto.includes('600')) return 60;
    return 100;
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
    // Buscar datos reales del destino en la base de datos
    const destinoCompleto = this.destinosCompletos.find(d => d.id === destino.id);
    
    if (destinoCompleto && destinoCompleto.queHacer && destinoCompleto.queHacer.length > 0) {
      // Usar los datos reales de que_hacer de la base de datos
      return destinoCompleto.queHacer.slice(0, 3);
    }

    // Fallback si no hay datos
    const destacadosBase: { [key: string]: string[][] } = {
      'Aventura': [
        ['Experiencias de adrenalina', 'Deportes extremos', 'Naturaleza salvaje']
      ],
      'Playa': [
        ['Playas paradisíacas', 'Deportes acuáticos', 'Atardeceres espectaculares']
      ],
      'Cultural': [
        ['Rica historia', 'Museos y monumentos', 'Gastronomía local']
      ],
      'Ciudad': [
        ['Vida urbana vibrante', 'Compras y entretenimiento', 'Arquitectura impresionante']
      ],
      'Naturaleza': [
        ['Paisajes impresionantes', 'Flora y fauna única', 'Ecoturismo']
      ],
      'Lujo': [
        ['Servicios premium', 'Experiencias exclusivas', 'Confort excepcional']
      ]
    };

    const opciones = destacadosBase[destino.categoria] || [
      ['Experiencias únicas', 'Cultura local auténtica', 'Paisajes impresionantes']
    ];
    
    return opciones[0];
  }

  private generarDescripcion(destino: DestinoResultado): string {
    // Buscar datos reales del destino en la base de datos
    const destinoCompleto = this.destinosCompletos.find(d => d.id === destino.id);
    
    if (destinoCompleto && destinoCompleto.descripcion) {
      // Usar la descripción real de la base de datos
      return destinoCompleto.descripcion;
    }

    // Fallback genérico
    return `Destino increíble en ${destino.pais} con experiencias únicas que recordarás para siempre.`;
  }

  private generarConsejosPersonalizados(): string[] {
    const consejos: string[] = [];

    if (!this.respuestasEncuesta) return consejos;

    // Buscar consejos reales de los destinos recomendados
    const consejosReales: string[] = [];
    this.destinosRecomendados.forEach(destino => {
      const destinoCompleto = this.destinosCompletos.find(d => d.id === destino.id);
      if (destinoCompleto && destinoCompleto.consejos && destinoCompleto.consejos.length > 0) {
        // Agregar 1-2 consejos de cada destino recomendado
        consejosReales.push(...destinoCompleto.consejos.slice(0, 2));
      }
    });

    // Si tenemos consejos reales, usarlos
    if (consejosReales.length > 0) {
      // Mezclar y seleccionar los más relevantes
      const consejosUnicos = [...new Set(consejosReales)];
      return consejosUnicos.slice(0, 3);
    }

    // Fallback: Consejos genéricos basados en preferencias
    if (this.respuestasEncuesta.presupuesto === 'economico') {
      consejos.push('Reserva con anticipación para obtener las mejores tarifas y considera viajar en temporada baja');
    } else if (this.respuestasEncuesta.presupuesto === 'lujo') {
      consejos.push('Consulta con un agente de viajes de lujo para experiencias exclusivas y acceso VIP');
    } else {
      consejos.push('Combina hoteles boutique con algunas experiencias premium para el equilibrio perfecto');
    }

    if (this.respuestasEncuesta.actividades.includes('deportes-extremos')) {
      consejos.push('Contrata un seguro de viaje que cubra actividades de aventura y deportes extremos');
    }
    if (this.respuestasEncuesta.actividades.includes('gastronomia')) {
      consejos.push('Reserva con anticipación en restaurantes populares y considera un tour gastronómico guiado');
    }
    if (this.respuestasEncuesta.actividades.includes('relajacion')) {
      consejos.push('Dedica tiempo suficiente para disfrutar sin prisas, menos es más cuando buscas relajarte');
    }

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

  getCategoryClass(categoria: string): string {
    const categoriaLower = categoria?.toLowerCase() || '';
    const claseMap: { [key: string]: string } = {
      'playa': 'category-playa',
      'ciudad': 'category-ciudad',
      'cultural': 'category-cultural',
      'aventura': 'category-aventura',
      'naturaleza': 'category-naturaleza',
      'lujo': 'category-lujo',
      'montaña': 'category-montana',
      'montana': 'category-montana'
    };
    return claseMap[categoriaLower] || 'category-default';
  }
  reintentar(): void {
    this.errorIA = false;
    this.errorMensaje = '';
    this.generarRecomendacionesConIA();
  }

  // Método para refinar búsqueda - volver a la encuesta
  onRefinarBusqueda(): void {
    console.log('Refinando búsqueda...');
    this.refinarBusqueda.emit();
  }

  // Método para ver todos los destinos
  onVerTodosDestinos(): void {
    console.log('Ver todos los destinos...');
    this.verTodosDestinos.emit();
  }
}