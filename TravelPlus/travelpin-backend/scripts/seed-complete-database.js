// Script para llenar la base de datos con datos completos
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'BDTravelPin.db');
const db = new Database(dbPath);

console.log('🚀 Iniciando llenado de base de datos...\n');

// ==================== DESTINOS ====================
const destinos = [
  // México
  {
    nombre: 'Cancún',
    pais: 'México',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200',
    rating: 4.8,
    descripcion: 'Cancún es uno de los destinos turísticos más famosos del mundo, conocido por sus playas de arena blanca, aguas turquesas del Caribe y su vibrante vida nocturna.',
    presupuesto_promedio: '$1,500 - $3,000 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Diciembre a Abril',
    es_popular: 1
  },
  {
    nombre: 'Ciudad de México',
    pais: 'México',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1200',
    rating: 4.6,
    descripcion: 'La capital mexicana es una metrópolis vibrante con rica historia, arquitectura colonial, museos de clase mundial y una escena gastronómica incomparable.',
    presupuesto_promedio: '$800 - $1,500 USD',
    duracion_recomendada: '4-6 días',
    mejor_epoca: 'Marzo a Mayo',
    es_popular: 1
  },
  {
    nombre: 'Oaxaca',
    pais: 'México',
    categoria: 'cultura',
    imagen: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200',
    rating: 4.7,
    descripcion: 'Oaxaca es el corazón cultural de México, famoso por su gastronomía única, mezcal artesanal, zonas arqueológicas y coloridas tradiciones.',
    presupuesto_promedio: '$600 - $1,200 USD',
    duracion_recomendada: '4-5 días',
    mejor_epoca: 'Octubre a Diciembre',
    es_popular: 1
  },
  {
    nombre: 'Playa del Carmen',
    pais: 'México',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200',
    rating: 4.5,
    descripcion: 'Un paraíso costero en la Riviera Maya con playas espectaculares, cenotes místicos y acceso a las ruinas mayas de Tulum.',
    presupuesto_promedio: '$1,200 - $2,500 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Noviembre a Abril',
    es_popular: 1
  },
  {
    nombre: 'Guadalajara',
    pais: 'México',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
    rating: 4.4,
    descripcion: 'La Perla Tapatía es cuna del mariachi y el tequila, con arquitectura colonial, mercados tradicionales y una rica escena artística.',
    presupuesto_promedio: '$700 - $1,300 USD',
    duracion_recomendada: '3-5 días',
    mejor_epoca: 'Octubre a Mayo',
    es_popular: 0
  },
  // Europa
  {
    nombre: 'París',
    pais: 'Francia',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    rating: 4.9,
    descripcion: 'La Ciudad de la Luz enamora con la Torre Eiffel, el Louvre, cafés encantadores y una atmósfera romántica incomparable.',
    presupuesto_promedio: '$2,000 - $4,000 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Abril a Junio, Septiembre a Octubre',
    es_popular: 1
  },
  {
    nombre: 'Barcelona',
    pais: 'España',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
    rating: 4.8,
    descripcion: 'Barcelona combina arquitectura modernista de Gaudí, playas mediterráneas, tapas deliciosas y una vida nocturna vibrante.',
    presupuesto_promedio: '$1,800 - $3,500 USD',
    duracion_recomendada: '4-6 días',
    mejor_epoca: 'Mayo a Junio, Septiembre a Octubre',
    es_popular: 1
  },
  {
    nombre: 'Roma',
    pais: 'Italia',
    categoria: 'cultura',
    imagen: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
    rating: 4.8,
    descripcion: 'La Ciudad Eterna cautiva con el Coliseo, el Vaticano, fuentes barrocas, pasta auténtica y miles de años de historia.',
    presupuesto_promedio: '$1,700 - $3,200 USD',
    duracion_recomendada: '4-6 días',
    mejor_epoca: 'Abril a Junio, Septiembre a Octubre',
    es_popular: 1
  },
  {
    nombre: 'Ámsterdam',
    pais: 'Países Bajos',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200',
    rating: 4.6,
    descripcion: 'Canales pintorescos, museos de Van Gogh y Ana Frank, arquitectura única y una cultura liberal y acogedora.',
    presupuesto_promedio: '$1,600 - $3,000 USD',
    duracion_recomendada: '3-5 días',
    mejor_epoca: 'Abril a Mayo, Septiembre',
    es_popular: 1
  },
  {
    nombre: 'Santorini',
    pais: 'Grecia',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200',
    rating: 4.9,
    descripcion: 'Isla volcánica con icónicas casas blancas y cúpulas azules, atardeceres espectaculares y vinos únicos.',
    presupuesto_promedio: '$2,500 - $5,000 USD',
    duracion_recomendada: '4-5 días',
    mejor_epoca: 'Mayo a Octubre',
    es_popular: 1
  },
  // Asia
  {
    nombre: 'Tokio',
    pais: 'Japón',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
    rating: 4.9,
    descripcion: 'Metrópolis futurista donde conviven templos ancestrales, tecnología de punta, gastronomía excepcional y cultura pop.',
    presupuesto_promedio: '$2,500 - $5,000 USD',
    duracion_recomendada: '7-10 días',
    mejor_epoca: 'Marzo a Mayo, Octubre a Noviembre',
    es_popular: 1
  },
  {
    nombre: 'Bali',
    pais: 'Indonesia',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    rating: 4.7,
    descripcion: 'La Isla de los Dioses ofrece templos místicos, arrozales en terrazas, playas paradisíacas y retiros de bienestar.',
    presupuesto_promedio: '$1,200 - $2,500 USD',
    duracion_recomendada: '7-10 días',
    mejor_epoca: 'Abril a Octubre',
    es_popular: 1
  },
  {
    nombre: 'Bangkok',
    pais: 'Tailandia',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200',
    rating: 4.5,
    descripcion: 'Capital vibrante con templos dorados, mercados flotantes, comida callejera increíble y vida nocturna animada.',
    presupuesto_promedio: '$800 - $1,800 USD',
    duracion_recomendada: '4-6 días',
    mejor_epoca: 'Noviembre a Febrero',
    es_popular: 1
  },
  {
    nombre: 'Singapur',
    pais: 'Singapur',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200',
    rating: 4.7,
    descripcion: 'Ciudad-estado ultramoderna con jardines futuristas, gastronomía multicultural y una mezcla única de culturas.',
    presupuesto_promedio: '$2,000 - $4,000 USD',
    duracion_recomendada: '3-5 días',
    mejor_epoca: 'Febrero a Abril',
    es_popular: 1
  },
  // América del Sur
  {
    nombre: 'Machu Picchu',
    pais: 'Perú',
    categoria: 'aventura',
    imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200',
    rating: 4.9,
    descripcion: 'La ciudadela inca perdida en las montañas, una de las Siete Maravillas del Mundo Moderno.',
    presupuesto_promedio: '$1,500 - $3,000 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Abril a Octubre',
    es_popular: 1
  },
  {
    nombre: 'Río de Janeiro',
    pais: 'Brasil',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200',
    rating: 4.7,
    descripcion: 'La Ciudad Maravillosa con el Cristo Redentor, playas icónicas como Copacabana e Ipanema, y samba en cada esquina.',
    presupuesto_promedio: '$1,200 - $2,500 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Diciembre a Marzo',
    es_popular: 1
  },
  {
    nombre: 'Buenos Aires',
    pais: 'Argentina',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200',
    rating: 4.6,
    descripcion: 'La París de Sudamérica con tango apasionado, arquitectura europea, asados legendarios y barrios con personalidad.',
    presupuesto_promedio: '$1,000 - $2,000 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Marzo a Mayo, Septiembre a Noviembre',
    es_popular: 1
  },
  {
    nombre: 'Cartagena',
    pais: 'Colombia',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1583531172005-521c5f628f6f?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1583531172005-521c5f628f6f?w=1200',
    rating: 4.6,
    descripcion: 'Ciudad colonial amurallada con calles coloridas, historia fascinante y playas caribeñas cercanas.',
    presupuesto_promedio: '$900 - $1,800 USD',
    duracion_recomendada: '4-5 días',
    mejor_epoca: 'Diciembre a Abril',
    es_popular: 1
  },
  // Naturaleza y Aventura
  {
    nombre: 'Islas Galápagos',
    pais: 'Ecuador',
    categoria: 'naturaleza',
    imagen: 'https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=1200',
    rating: 4.9,
    descripcion: 'Archipiélago único con fauna endémica, tortugas gigantes, leones marinos y paisajes volcánicos extraordinarios.',
    presupuesto_promedio: '$3,000 - $6,000 USD',
    duracion_recomendada: '7-10 días',
    mejor_epoca: 'Junio a Diciembre',
    es_popular: 1
  },
  {
    nombre: 'Costa Rica',
    pais: 'Costa Rica',
    categoria: 'naturaleza',
    imagen: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=1200',
    rating: 4.7,
    descripcion: 'Paraíso de biodiversidad con selvas tropicales, volcanes activos, playas en dos océanos y aventura ecoturística.',
    presupuesto_promedio: '$1,500 - $3,000 USD',
    duracion_recomendada: '7-10 días',
    mejor_epoca: 'Diciembre a Abril',
    es_popular: 1
  },
  // Más destinos
  {
    nombre: 'Nueva York',
    pais: 'Estados Unidos',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
    rating: 4.8,
    descripcion: 'La Gran Manzana con Times Square, Central Park, museos de clase mundial y la energía de la ciudad que nunca duerme.',
    presupuesto_promedio: '$2,500 - $5,000 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Abril a Junio, Septiembre a Noviembre',
    es_popular: 1
  },
  {
    nombre: 'Dubái',
    pais: 'Emiratos Árabes',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
    rating: 4.7,
    descripcion: 'Ciudad del futuro con el Burj Khalifa, islas artificiales, centros comerciales lujosos y experiencias únicas en el desierto.',
    presupuesto_promedio: '$2,500 - $5,000 USD',
    duracion_recomendada: '4-6 días',
    mejor_epoca: 'Noviembre a Marzo',
    es_popular: 1
  },
  {
    nombre: 'Maldivas',
    pais: 'Maldivas',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200',
    rating: 4.9,
    descripcion: 'Paraíso tropical con villas sobre el agua, arrecifes de coral, aguas cristalinas y lujo absoluto.',
    presupuesto_promedio: '$4,000 - $10,000 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Noviembre a Abril',
    es_popular: 1
  },
  {
    nombre: 'Praga',
    pais: 'República Checa',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200',
    rating: 4.7,
    descripcion: 'La Ciudad de las Cien Torres con arquitectura gótica y barroca, cerveza artesanal y ambiente bohemio.',
    presupuesto_promedio: '$1,200 - $2,200 USD',
    duracion_recomendada: '3-5 días',
    mejor_epoca: 'Abril a Junio, Septiembre a Octubre',
    es_popular: 1
  },
  {
    nombre: 'Sydney',
    pais: 'Australia',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200',
    rating: 4.7,
    descripcion: 'Metrópolis costera con la icónica Ópera, playas espectaculares como Bondi y un estilo de vida relajado.',
    presupuesto_promedio: '$2,500 - $4,500 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Septiembre a Noviembre, Marzo a Mayo',
    es_popular: 1
  }
];

// ==================== AGENCIAS ====================
const agencias = [
  {
    nombre: 'Viajes Paradiso',
    email: 'info@viajesparadiso.com',
    password: 'paradiso123',
    descripcion: 'Especialistas en viajes de lujo y experiencias únicas. Más de 20 años creando memorias inolvidables.',
    logo: '🌴',
    contacto: '+52 55 1234 5678',
    sitio_web: 'www.viajesparadiso.com'
  },
  {
    nombre: 'Aventura Total',
    email: 'contacto@aventuratotal.com',
    password: 'aventura123',
    descripcion: 'Para los amantes de la adrenalina. Expediciones, trekking y deportes extremos en los mejores destinos.',
    logo: '🏔️',
    contacto: '+52 55 2345 6789',
    sitio_web: 'www.aventuratotal.com'
  },
  {
    nombre: 'Sol y Playa Tours',
    email: 'reservas@solyplaya.com',
    password: 'solplaya123',
    descripcion: 'Los mejores destinos de playa con todo incluido. Relájate mientras nosotros nos encargamos de todo.',
    logo: '🏖️',
    contacto: '+52 55 3456 7890',
    sitio_web: 'www.solyplaya.com'
  },
  {
    nombre: 'Cultural Expeditions',
    email: 'info@culturalexp.com',
    password: 'cultural123',
    descripcion: 'Viajes culturales con guías expertos. Descubre la historia y tradiciones de cada destino.',
    logo: '🏛️',
    contacto: '+52 55 4567 8901',
    sitio_web: 'www.culturalexp.com'
  },
  {
    nombre: 'EcoTravel México',
    email: 'hola@ecotravelmx.com',
    password: 'ecotravel123',
    descripcion: 'Turismo sustentable y responsable. Conecta con la naturaleza respetando el medio ambiente.',
    logo: '🌿',
    contacto: '+52 55 5678 9012',
    sitio_web: 'www.ecotravelmx.com'
  }
];

// ==================== PAQUETES ====================
const paquetes = [
  // Viajes Paradiso
  {
    agencia_nombre: 'Viajes Paradiso',
    nombre: 'Cancún Premium All-Inclusive',
    precio: 25000,
    duracion: '5 días / 4 noches',
    incluye: JSON.stringify(['Vuelo redondo', 'Hotel 5 estrellas', 'Todo incluido', 'Traslados', 'Tour a Chichén Itzá']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada y check-in en hotel. Cena de bienvenida.' },
      { dia: 2, actividades: 'Día libre en playa. Actividades acuáticas opcionales.' },
      { dia: 3, actividades: 'Excursión a Chichén Itzá y cenote sagrado.' },
      { dia: 4, actividades: 'Snorkel en arrecife. Tarde libre para compras.' },
      { dia: 5, actividades: 'Check-out y traslado al aeropuerto.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo redondo', monto: 8000 },
      { concepto: 'Hotel 4 noches', monto: 12000 },
      { concepto: 'Tour Chichén Itzá', monto: 2500 },
      { concepto: 'Snorkel', monto: 1500 },
      { concepto: 'Traslados', monto: 1000 }
    ]),
    destinos: ['Cancún']
  },
  {
    agencia_nombre: 'Viajes Paradiso',
    nombre: 'París Romántico',
    precio: 45000,
    duracion: '6 días / 5 noches',
    incluye: JSON.stringify(['Vuelo redondo', 'Hotel boutique', 'Desayunos', 'Tour Torre Eiffel', 'Crucero por el Sena']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada a París. Paseo por los Campos Elíseos.' },
      { dia: 2, actividades: 'Visita Torre Eiffel y Trocadero. Crucero nocturno.' },
      { dia: 3, actividades: 'Museo del Louvre. Barrio Latino.' },
      { dia: 4, actividades: 'Versalles (día completo).' },
      { dia: 5, actividades: 'Montmartre y Sacré-Cœur. Tarde libre.' },
      { dia: 6, actividades: 'Compras en Le Marais. Vuelo de regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo redondo', monto: 22000 },
      { concepto: 'Hotel 5 noches', monto: 15000 },
      { concepto: 'Tours incluidos', monto: 5000 },
      { concepto: 'Transporte local', monto: 3000 }
    ]),
    destinos: ['París']
  },
  // Aventura Total
  {
    agencia_nombre: 'Aventura Total',
    nombre: 'Machu Picchu Expedition',
    precio: 32000,
    duracion: '7 días / 6 noches',
    incluye: JSON.stringify(['Vuelo redondo', 'Hoteles', 'Tren a Machu Picchu', 'Guía experto', 'Entradas']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada a Cusco. Aclimatación.' },
      { dia: 2, actividades: 'City tour Cusco: Plaza de Armas, Qorikancha.' },
      { dia: 3, actividades: 'Valle Sagrado: Pisac y Ollantaytambo.' },
      { dia: 4, actividades: 'Tren a Aguas Calientes.' },
      { dia: 5, actividades: 'Machu Picchu al amanecer. Tour guiado.' },
      { dia: 6, actividades: 'Montaña Machu Picchu. Retorno a Cusco.' },
      { dia: 7, actividades: 'Vuelo de regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo redondo', monto: 15000 },
      { concepto: 'Hoteles', monto: 8000 },
      { concepto: 'Tren y entradas', monto: 6000 },
      { concepto: 'Guía y tours', monto: 3000 }
    ]),
    destinos: ['Machu Picchu']
  },
  {
    agencia_nombre: 'Aventura Total',
    nombre: 'Costa Rica Aventura Extrema',
    precio: 28000,
    duracion: '8 días / 7 noches',
    incluye: JSON.stringify(['Vuelo', 'Hoteles eco', 'Rafting', 'Canopy', 'Volcán Arenal']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada a San José. Traslado a La Fortuna.' },
      { dia: 2, actividades: 'Caminata al Volcán Arenal. Aguas termales.' },
      { dia: 3, actividades: 'Rafting en Río Pacuare Clase III-IV.' },
      { dia: 4, actividades: 'Canopy y puentes colgantes en Monteverde.' },
      { dia: 5, actividades: 'Reserva biológica. Avistamiento de fauna.' },
      { dia: 6, actividades: 'Traslado a Manuel Antonio. Playa.' },
      { dia: 7, actividades: 'Parque Nacional Manuel Antonio.' },
      { dia: 8, actividades: 'Vuelo de regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo', monto: 10000 },
      { concepto: 'Hoteles eco', monto: 9000 },
      { concepto: 'Actividades extremas', monto: 6000 },
      { concepto: 'Transporte interno', monto: 3000 }
    ]),
    destinos: ['Costa Rica']
  },
  // Sol y Playa Tours
  {
    agencia_nombre: 'Sol y Playa Tours',
    nombre: 'Maldivas Luxury Escape',
    precio: 85000,
    duracion: '6 días / 5 noches',
    incluye: JSON.stringify(['Vuelo', 'Villa sobre agua', 'Todo incluido', 'Snorkel', 'Spa']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada en hidroavión. Check-in villa.' },
      { dia: 2, actividades: 'Snorkel en arrecife privado. Cena romántica.' },
      { dia: 3, actividades: 'Excursión a isla desierta. Picnic.' },
      { dia: 4, actividades: 'Spa balinés. Puesta de sol en yate.' },
      { dia: 5, actividades: 'Buceo con mantarrayas. Cena de despedida.' },
      { dia: 6, actividades: 'Desayuno flotante. Regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo + hidroavión', monto: 35000 },
      { concepto: 'Villa 5 noches', monto: 40000 },
      { concepto: 'Actividades', monto: 7000 },
      { concepto: 'Spa', monto: 3000 }
    ]),
    destinos: ['Maldivas']
  },
  {
    agencia_nombre: 'Sol y Playa Tours',
    nombre: 'Bali Wellness Retreat',
    precio: 35000,
    duracion: '10 días / 9 noches',
    incluye: JSON.stringify(['Vuelo', 'Resorts', 'Clases yoga', 'Spa', 'Tours templos']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada a Denpasar. Traslado a Ubud.' },
      { dia: 2, actividades: 'Yoga al amanecer. Terrazas de arroz.' },
      { dia: 3, actividades: 'Templo Tirta Empul. Ceremonia purificación.' },
      { dia: 4, actividades: 'Traslado a Seminyak. Tarde de playa.' },
      { dia: 5, actividades: 'Día de spa balinés completo.' },
      { dia: 6, actividades: 'Templo Tanah Lot al atardecer.' },
      { dia: 7, actividades: 'Snorkel en Nusa Penida.' },
      { dia: 8, actividades: 'Cascada Tegenungan. Meditación.' },
      { dia: 9, actividades: 'Día libre. Compras artesanías.' },
      { dia: 10, actividades: 'Vuelo de regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo', monto: 18000 },
      { concepto: 'Resorts', monto: 10000 },
      { concepto: 'Spa y wellness', monto: 4000 },
      { concepto: 'Tours', monto: 3000 }
    ]),
    destinos: ['Bali']
  },
  // Cultural Expeditions
  {
    agencia_nombre: 'Cultural Expeditions',
    nombre: 'Roma Imperial',
    precio: 38000,
    duracion: '6 días / 5 noches',
    incluye: JSON.stringify(['Vuelo', 'Hotel céntrico', 'Guía historiador', 'Entradas', 'Audiencia papal']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada. Paseo nocturno Fontana di Trevi.' },
      { dia: 2, actividades: 'Coliseo, Foro Romano y Palatino.' },
      { dia: 3, actividades: 'Vaticano: Museos, Capilla Sixtina, San Pedro.' },
      { dia: 4, actividades: 'Audiencia papal. Panteón y Piazza Navona.' },
      { dia: 5, actividades: 'Excursión a Pompeya.' },
      { dia: 6, actividades: 'Trastevere. Vuelo de regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo', monto: 18000 },
      { concepto: 'Hotel', monto: 12000 },
      { concepto: 'Guía y entradas', monto: 5000 },
      { concepto: 'Excursión Pompeya', monto: 3000 }
    ]),
    destinos: ['Roma']
  },
  {
    agencia_nombre: 'Cultural Expeditions',
    nombre: 'Japón Tradicional y Moderno',
    precio: 65000,
    duracion: '12 días / 11 noches',
    incluye: JSON.stringify(['Vuelo', 'JR Pass', 'Hoteles + Ryokan', 'Tours', 'Ceremonia té']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada a Tokio. Shibuya y Harajuku.' },
      { dia: 2, actividades: 'Templo Senso-ji. Akihabara.' },
      { dia: 3, actividades: 'Shinjuku y Meiji Shrine.' },
      { dia: 4, actividades: 'Tren bala a Kioto.' },
      { dia: 5, actividades: 'Fushimi Inari. Gion (geishas).' },
      { dia: 6, actividades: 'Arashiyama. Bosque bambú.' },
      { dia: 7, actividades: 'Excursión a Nara (ciervos y templos).' },
      { dia: 8, actividades: 'Ceremonia del té. Kinkaku-ji.' },
      { dia: 9, actividades: 'Tren a Hiroshima. Memorial de la Paz.' },
      { dia: 10, actividades: 'Isla Miyajima. Torii flotante.' },
      { dia: 11, actividades: 'Regreso a Tokio. Ginza.' },
      { dia: 12, actividades: 'Vuelo de regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo', monto: 28000 },
      { concepto: 'JR Pass', monto: 8000 },
      { concepto: 'Hoteles', monto: 20000 },
      { concepto: 'Tours y experiencias', monto: 9000 }
    ]),
    destinos: ['Tokio']
  },
  // EcoTravel México
  {
    agencia_nombre: 'EcoTravel México',
    nombre: 'Galápagos Expedición Natural',
    precio: 72000,
    duracion: '8 días / 7 noches',
    incluye: JSON.stringify(['Vuelo', 'Crucero expedición', 'Naturalista', 'Snorkel', 'Kayak']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Vuelo a Baltra. Inicio crucero.' },
      { dia: 2, actividades: 'Isla Santa Cruz. Estación Darwin.' },
      { dia: 3, actividades: 'Isla Isabela. Pingüinos y cormoranes.' },
      { dia: 4, actividades: 'Isla Fernandina. Iguanas marinas.' },
      { dia: 5, actividades: 'Isla Santiago. Lobos marinos.' },
      { dia: 6, actividades: 'Isla Bartolomé. Snorkel con tiburones.' },
      { dia: 7, actividades: 'Isla San Cristóbal. León Dormido.' },
      { dia: 8, actividades: 'Vuelo de regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Vuelo', monto: 15000 },
      { concepto: 'Crucero 7 noches', monto: 50000 },
      { concepto: 'Equipo snorkel', monto: 2000 },
      { concepto: 'Parque nacional', monto: 5000 }
    ]),
    destinos: ['Islas Galápagos']
  },
  {
    agencia_nombre: 'EcoTravel México',
    nombre: 'Oaxaca Ancestral',
    precio: 18000,
    duracion: '5 días / 4 noches',
    incluye: JSON.stringify(['Transporte', 'Hotel boutique', 'Tours', 'Clases cocina', 'Mezcal tour']),
    itinerario: JSON.stringify([
      { dia: 1, actividades: 'Llegada. Walking tour Centro Histórico.' },
      { dia: 2, actividades: 'Monte Albán. Taller textiles zapotecas.' },
      { dia: 3, actividades: 'Clase de cocina oaxaqueña. Mercado.' },
      { dia: 4, actividades: 'Ruta del mezcal. Mitla y Hierve el Agua.' },
      { dia: 5, actividades: 'Tiempo libre. Regreso.' }
    ]),
    gastos: JSON.stringify([
      { concepto: 'Transporte', monto: 4000 },
      { concepto: 'Hotel boutique', monto: 8000 },
      { concepto: 'Tours y entradas', monto: 3500 },
      { concepto: 'Clases y experiencias', monto: 2500 }
    ]),
    destinos: ['Oaxaca']
  }
];

// ==================== USUARIOS DE EJEMPLO ====================
const usuariosEjemplo = [
  {
    nombre: 'María García',
    email: 'maria@ejemplo.com',
    password: 'password123'
  },
  {
    nombre: 'Carlos López',
    email: 'carlos@ejemplo.com',
    password: 'password123'
  },
  {
    nombre: 'Ana Martínez',
    email: 'ana@ejemplo.com',
    password: 'password123'
  }
];

// ==================== FUNCIONES DE INSERCIÓN ====================

async function insertarDestinos() {
  console.log('📍 Insertando destinos...');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO destinos 
    (nombre, pais, categoria, imagen, imagen_principal, rating, descripcion, presupuesto_promedio, duracion_recomendada, mejor_epoca, es_popular)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let insertados = 0;
  for (const destino of destinos) {
    try {
      stmt.run(
        destino.nombre,
        destino.pais,
        destino.categoria,
        destino.imagen,
        destino.imagen_principal,
        destino.rating,
        destino.descripcion,
        destino.presupuesto_promedio,
        destino.duracion_recomendada,
        destino.mejor_epoca,
        destino.es_popular
      );
      insertados++;
    } catch (err) {
      console.log(`   ⚠️ ${destino.nombre} ya existe o error:`, err.message);
    }
  }
  console.log(`   ✅ ${insertados} destinos insertados\n`);
}

async function insertarAgencias() {
  console.log('🏢 Insertando agencias...');
  
  let insertadas = 0;
  for (const agencia of agencias) {
    try {
      const hashedPassword = await bcrypt.hash(agencia.password, 10);
      
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO agencias 
        (nombre, email, password, descripcion, logo, contacto, sitio_web)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        agencia.nombre,
        agencia.email,
        hashedPassword,
        agencia.descripcion,
        agencia.logo,
        agencia.contacto,
        agencia.sitio_web
      );
      
      if (result.changes > 0) insertadas++;
    } catch (err) {
      console.log(`   ⚠️ ${agencia.nombre}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${insertadas} agencias insertadas\n`);
}

async function insertarPaquetes() {
  console.log('📦 Insertando paquetes...');
  
  let insertados = 0;
  for (const paquete of paquetes) {
    try {
      // Obtener ID de la agencia
      const agencia = db.prepare('SELECT id FROM agencias WHERE nombre = ?').get(paquete.agencia_nombre);
      if (!agencia) {
        console.log(`   ⚠️ Agencia no encontrada: ${paquete.agencia_nombre}`);
        continue;
      }
      
      // Verificar si el paquete ya existe
      const existente = db.prepare('SELECT id FROM paquetes WHERE nombre = ? AND agencia_id = ?').get(paquete.nombre, agencia.id);
      if (existente) {
        console.log(`   ⏭️ Paquete ya existe: ${paquete.nombre}`);
        continue;
      }
      
      // Insertar paquete
      const stmt = db.prepare(`
        INSERT INTO paquetes (agencia_id, nombre, precio, duracion, incluye, itinerario, gastos)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        agencia.id,
        paquete.nombre,
        paquete.precio,
        paquete.duracion,
        paquete.incluye,
        paquete.itinerario,
        paquete.gastos
      );
      
      // Insertar relación paquete-destinos
      if (result.lastInsertRowid && paquete.destinos) {
        for (const destinoNombre of paquete.destinos) {
          const destino = db.prepare('SELECT id FROM destinos WHERE nombre = ?').get(destinoNombre);
          if (destino) {
            db.prepare('INSERT OR IGNORE INTO paquete_destinos (paquete_id, destino_id) VALUES (?, ?)')
              .run(result.lastInsertRowid, destino.id);
          }
        }
      }
      
      insertados++;
    } catch (err) {
      console.log(`   ⚠️ Error en paquete ${paquete.nombre}:`, err.message);
    }
  }
  console.log(`   ✅ ${insertados} paquetes insertados\n`);
}

async function insertarUsuariosEjemplo() {
  console.log('👥 Insertando usuarios de ejemplo...');
  
  let insertados = 0;
  for (const usuario of usuariosEjemplo) {
    try {
      const hashedPassword = await bcrypt.hash(usuario.password, 10);
      
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO usuarios (nombre, email, password, email_verified)
        VALUES (?, ?, ?, 1)
      `);
      
      const result = stmt.run(usuario.nombre, usuario.email, hashedPassword);
      if (result.changes > 0) insertados++;
    } catch (err) {
      console.log(`   ⚠️ ${usuario.nombre}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${insertados} usuarios insertados\n`);
}

// ==================== FUNCIÓN PRINCIPAL ====================

async function main() {
  try {
    await insertarDestinos();
    await insertarAgencias();
    await insertarPaquetes();
    await insertarUsuariosEjemplo();
    
    // Mostrar resumen
    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMEN DE LA BASE DE DATOS:');
    console.log('═══════════════════════════════════════');
    
    const counts = {
      destinos: db.prepare('SELECT COUNT(*) as count FROM destinos').get().count,
      agencias: db.prepare('SELECT COUNT(*) as count FROM agencias').get().count,
      paquetes: db.prepare('SELECT COUNT(*) as count FROM paquetes').get().count,
      usuarios: db.prepare('SELECT COUNT(*) as count FROM usuarios').get().count
    };
    
    console.log(`📍 Destinos: ${counts.destinos}`);
    console.log(`🏢 Agencias: ${counts.agencias}`);
    console.log(`📦 Paquetes: ${counts.paquetes}`);
    console.log(`👥 Usuarios: ${counts.usuarios}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('✅ Base de datos llenada exitosamente!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

main();
