import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class DestinosService {
  private destinosCompletos: DestinoCompleto[] = [
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
      descripcion: 'Machu Picchu es una antigua ciudad inca ubicada en lo alto de los Andes peruanos. Este sitio arqueológico es considerado una de las maravillas del mundo moderno y ofrece vistas espectaculares de las montañas circundantes.',
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
        'Lleva protector solar y repelente',
        'Usa ropa cómoda para caminar',
        'Contrata un guía para mejor experiencia'
      ],
      queEllevar: [
        'Pasaporte vigente',
        'Bloqueador solar',
        'Repelente de insectos',
        'Ropa cómoda y ligera',
        'Zapatos para trekking',
        'Cámara fotográfica',
        'Dinero en efectivo (soles)'
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
      descripcion: 'Tokyo es la vibrante capital de Japón, donde la tradición milenaria se encuentra con la tecnología de vanguardia. Una megalópolis que ofrece templos históricos, jardines zen, rascacielos futuristas y la mejor gastronomía del mundo.',
      queHacer: [
        'Visitar el Templo Senso-ji',
        'Explorar el cruce de Shibuya',
        'Conocer el Palacio Imperial',
        'Probar sushi en Tsukiji',
        'Ver la Torre de Tokyo'
      ],
      detallesViaje: {
        mejorEpoca: 'Marzo a Mayo / Septiembre a Noviembre',
        duracionRecomendada: '5-7 días',
        presupuestoPromedio: '$1,200 - $2,500 USD'
      },
      consejos: [
        'Compra un JR Pass para moverte',
        'Aprende frases básicas en japonés',
        'Lleva efectivo siempre',
        'Respeta las costumbres locales',
        'Visita durante la temporada de cerezos'
      ],
      queEllevar: [
        'Adaptador de corriente',
        'Tarjeta Suica o Pasmo',
        'Ropa modesta para templos',
        'Zapatos fáciles de quitar',
        'Guía de frases en japonés'
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
      descripcion: 'Las Maldivas son un paraíso tropical compuesto por más de 1,000 islas de coral. Famosas por sus aguas cristalinas color turquesa, playas de arena blanca y lujosos resorts sobre el agua, son el destino perfecto para luna de miel y descanso.',
      queHacer: [
        'Buceo en arrecifes de coral',
        'Snorkel con mantarrayas',
        'Cena romántica en la playa',
        'Excursiones en bote',
        'Spa y tratamientos de relajación'
      ],
      detallesViaje: {
        mejorEpoca: 'Noviembre a Abril',
        duracionRecomendada: '5-7 días',
        presupuestoPromedio: '$2,500 - $5,000+ USD'
      },
      consejos: [
        'Reserva tu resort con anticipación',
        'Considera el tipo de pensión',
        'Lleva equipo de snorkel propio',
        'Reserva excursiones desde antes',
        'Respeta el medio ambiente marino'
      ],
      queEllevar: [
        'Traje de baño',
        'Protector solar biodegradable',
        'Cámara acuática',
        'Ropa ligera y fresca',
        'Sandalias de playa',
        'Gafas de sol'
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
      descripcion: 'París, la Ciudad de la Luz, es sinónimo de romance, arte y gastronomía. Con monumentos icónicos como la Torre Eiffel y el Louvre, cafés pintorescos y una arquitectura impresionante, París cautiva a millones de visitantes cada año.',
      queHacer: [
        'Subir a la Torre Eiffel',
        'Visitar el Museo del Louvre',
        'Pasear por los Campos Elíseos',
        'Conocer Notre-Dame',
        'Crucero por el Sena'
      ],
      detallesViaje: {
        mejorEpoca: 'Abril a Junio / Septiembre a Octubre',
        duracionRecomendada: '4-6 días',
        presupuestoPromedio: '$1,500 - $3,000 USD'
      },
      consejos: [
        'Compra el Paris Pass',
        'Aprende francés básico',
        'Usa el metro para moverte',
        'Reserva restaurantes con anticipación',
        'Visita museos en días gratuitos'
      ],
      queEllevar: [
        'Ropa elegante casual',
        'Zapatos cómodos para caminar',
        'Adaptador europeo',
        'Guía turística',
        'Paraguas pequeño'
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
      descripcion: 'Cancún es el destino de playa más popular de México, famoso por sus aguas turquesas, playas de arena blanca, vida nocturna vibrante y acceso a las ruinas mayas. Perfecto para unas vacaciones tropicales inolvidables.',
      queHacer: [
        'Visitar las ruinas de Chichén Itzá',
        'Nadar en cenotes',
        'Buceo en el museo subacuático',
        'Explorar Isla Mujeres',
        'Disfrutar de la vida nocturna'
      ],
      detallesViaje: {
        mejorEpoca: 'Diciembre a Abril',
        duracionRecomendada: '5-7 días',
        presupuestoPromedio: '$800 - $1,800 USD'
      },
      consejos: [
        'Reserva tours con anticipación',
        'Usa protector solar biodegradable',
        'Lleva efectivo para propinas',
        'Cuidado con el sol del mediodía',
        'Prueba la comida local'
      ],
      queEllevar: [
        'Traje de baño',
        'Protector solar',
        'Sombrero y lentes de sol',
        'Ropa ligera',
        'Repelente de mosquitos',
        'Zapatos para agua'
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
      descripcion: 'Bali, la Isla de los Dioses, combina playas paradisíacas, templos sagrados, arrozales en terrazas y una cultura espiritual única. Un destino que ofrece desde surf y yoga hasta aventuras en la jungla.',
      queHacer: [
        'Visitar templos antiguos',
        'Surf en las mejores playas',
        'Clases de yoga y meditación',
        'Explorar arrozales de Ubud',
        'Ver el amanecer en Monte Batur'
      ],
      detallesViaje: {
        mejorEpoca: 'Abril a Octubre',
        duracionRecomendada: '7-10 días',
        presupuestoPromedio: '$1,000 - $2,200 USD'
      },
      consejos: [
        'Respeta las costumbres religiosas',
        'Lleva ropa modesta para templos',
        'Negocia precios en mercados',
        'Contrata un scooter para moverte',
        'Prueba la comida balinesa'
      ],
      queEllevar: [
        'Sarong para templos',
        'Protector solar',
        'Repelente de insectos',
        'Ropa cómoda y ligera',
        'Calzado para caminar',
        'Adaptador de corriente'
      ],
      emergencias: {
        policia: '110',
        bomberos: '113',
        ambulancia: '118',
        embajada: '+62-361-233-605'
      }
    }
  ];

  constructor() {}

  // Obtener todos los destinos (versión básica para listados)
  getDestinos(): DestinoBasico[] {
    return this.destinosCompletos.map(d => ({
      id: d.id,
      nombre: d.nombre,
      pais: d.pais,
      categoria: d.categoria,
      imagen: d.imagen,
      rating: d.rating,
      esFavorito: d.esFavorito,
      colorCategoria: d.colorCategoria
    }));
  }

  // Obtener un destino completo por ID
  getDestinoById(id: number): DestinoCompleto | undefined {
    return this.destinosCompletos.find(d => d.id === id);
  }

  // Actualizar estado de favorito
  actualizarFavorito(id: number, esFavorito: boolean): void {
    const destino = this.destinosCompletos.find(d => d.id === id);
    if (destino) {
      destino.esFavorito = esFavorito;
    }
  }

  // Sincronizar favoritos desde localStorage
  sincronizarFavoritos(favoritosIds: number[]): void {
    this.destinosCompletos.forEach(destino => {
      destino.esFavorito = favoritosIds.includes(destino.id);
    });
  }
}