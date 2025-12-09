// Script para agregar destinos faltantes y actualizar los que no tienen info
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'BDTravelPin.db');
const db = new Database(dbPath);

console.log('🚀 Agregando destinos faltantes y actualizando información...\n');

// Destinos nuevos a agregar
const destinosNuevos = [
  {
    nombre: 'Londres',
    pais: 'Reino Unido',
    categoria: 'ciudad',
    imagen: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
    rating: 4.8,
    descripcion: 'La capital británica combina historia milenaria con modernidad, desde el Big Ben hasta los mercados de Camden, ofreciendo una experiencia cultural incomparable.',
    presupuesto_promedio: '$2,500 - $4,500 USD',
    duracion_recomendada: '5-7 días',
    mejor_epoca: 'Abril a Septiembre',
    es_popular: 1,
    que_hacer: JSON.stringify([
      'Visitar el Big Ben y el Parlamento',
      'Explorar el Museo Británico (gratis)',
      'Ver el cambio de guardia en Buckingham',
      'Pasear por Hyde Park',
      'Cruzar el Tower Bridge',
      'Explorar Camden Market',
      'Ver un musical en el West End',
      'Tomar afternoon tea tradicional'
    ]),
    consejos: JSON.stringify([
      'Obtén una Oyster Card para el transporte',
      'Los museos principales son gratuitos',
      'Lleva siempre paraguas',
      'Camina por South Bank para vistas del Támesis',
      'Los pubs cierran temprano, ve antes de las 11pm',
      'Prueba el fish and chips tradicional',
      'El lado izquierdo es para quedarse en escaleras mecánicas',
      'Reserva afternoon tea con anticipación'
    ]),
    que_llevar: JSON.stringify([
      'Impermeable y paraguas',
      'Capas de ropa',
      'Zapatos impermeables cómodos',
      'Adaptador de corriente UK (tipo G)',
      'Suéter o chaqueta',
      'Bolsa plegable para compras',
      'Tarjeta contactless',
      'Mochila pequeña'
    ]),
    emergencias: JSON.stringify({
      policia: '999',
      emergencias: '112',
      hospital: 'St Thomas Hospital: +44 20 7188 7188',
      embajada: 'Embajada México: +44 20 7499 8586'
    })
  },
  {
    nombre: 'Tulum',
    pais: 'México',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200',
    rating: 4.7,
    descripcion: 'Tulum combina ruinas mayas frente al mar Caribe con cenotes místicos, playas paradisíacas y una vibrante escena de bienestar y gastronomía.',
    presupuesto_promedio: '$1,200 - $2,800 USD',
    duracion_recomendada: '4-6 días',
    mejor_epoca: 'Noviembre a Abril',
    es_popular: 1,
    que_hacer: JSON.stringify([
      'Visitar las ruinas mayas frente al mar',
      'Nadar en cenotes (Gran Cenote, Casa Cenote)',
      'Explorar la biosfera de Sian Ka\'an',
      'Disfrutar de los beach clubs',
      'Hacer yoga al amanecer',
      'Visitar Cobá y subir la pirámide',
      'Cenar en restaurantes de playa',
      'Andar en bici por la zona hotelera'
    ]),
    consejos: JSON.stringify([
      'Llega temprano a las ruinas para evitar calor y multitudes',
      'La zona hotelera es cara, el pueblo es más económico',
      'Renta bici para moverte por la zona hotelera',
      'El bloqueador debe ser biodegradable',
      'Reserva cenotes y restaurantes populares',
      'El efectivo es preferido en muchos lugares',
      'Los mosquitos son intensos al atardecer',
      'Hay sargazo en ciertas épocas del año'
    ]),
    que_llevar: JSON.stringify([
      'Bloqueador solar biodegradable',
      'Repelente de insectos',
      'Ropa ligera de algodón',
      'Zapatos para agua',
      'Máscara de snorkel',
      'Vestido para restaurantes de playa',
      'Efectivo',
      'Linterna para cenotes'
    ]),
    emergencias: JSON.stringify({
      policia: '911',
      turista: '984 871 2212',
      hospital: 'Hospiten Riviera Maya: +52 984 803 1002',
      embajada: 'Consulado USA Mérida: +52 999 942 5700'
    })
  },
  {
    nombre: 'Isla Mujeres',
    pais: 'México',
    categoria: 'playa',
    imagen: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=1200',
    rating: 4.6,
    descripcion: 'Una pequeña isla caribeña frente a Cancún con playas de arena blanca, aguas cristalinas perfectas para snorkel y un ambiente relajado.',
    presupuesto_promedio: '$600 - $1,500 USD',
    duracion_recomendada: '2-4 días',
    mejor_epoca: 'Diciembre a Abril',
    es_popular: 0,
    que_hacer: JSON.stringify([
      'Nadar con tiburones ballena (temporada)',
      'Visitar Punta Sur y el templo a Ixchel',
      'Hacer snorkel en el arrecife Manchones',
      'Rentar un carrito de golf para explorar',
      'Relajarse en Playa Norte',
      'Visitar la Tortugranja',
      'Ver el atardecer desde el malecón',
      'Probar los mariscos frescos del mercado'
    ]),
    consejos: JSON.stringify([
      'La isla es pequeña, un día es suficiente',
      'El ferry desde Cancún sale cada 30 minutos',
      'Llega temprano a Playa Norte para conseguir lugar',
      'Los carritos de golf se rentan sin licencia',
      'El tiburón ballena solo está de junio a septiembre',
      'Los precios son más bajos que en Cancún',
      'Hay un OXXO para comprar snacks baratos',
      'El atardecer en la costa oeste es espectacular'
    ]),
    que_llevar: JSON.stringify([
      'Traje de baño',
      'Bloqueador solar reef-safe',
      'Efectivo en pesos',
      'Toalla de playa',
      'Snorkel (o rentar allá)',
      'Sandalias',
      'Cámara resistente al agua',
      'Gorra o sombrero'
    ]),
    emergencias: JSON.stringify({
      policia: '911',
      turista: '998 877 0307',
      hospital: 'Centro de Salud: +52 998 877 0117',
      embajada: 'Consulado USA: +52 999 942 5700'
    })
  },
  {
    nombre: 'Cusco',
    pais: 'Perú',
    categoria: 'cultura',
    imagen: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200',
    rating: 4.8,
    descripcion: 'La antigua capital del Imperio Inca combina arquitectura colonial con muros incaicos, siendo la puerta de entrada a Machu Picchu y el Valle Sagrado.',
    presupuesto_promedio: '$800 - $1,800 USD',
    duracion_recomendada: '4-6 días',
    mejor_epoca: 'Abril a Octubre',
    es_popular: 1,
    que_hacer: JSON.stringify([
      'Explorar la Plaza de Armas',
      'Visitar Sacsayhuamán',
      'Caminar por San Blas',
      'Probar el pisco sour peruano',
      'Visitar el mercado de San Pedro',
      'Tomar el tour del Valle Sagrado',
      'Conocer Moray y las Salineras de Maras',
      'Cenar en restaurantes de cocina novoandina'
    ]),
    consejos: JSON.stringify([
      'Aclimátate 2-3 días antes de ir a Machu Picchu',
      'El mate de coca ayuda con la altura',
      'Camina despacio los primeros días',
      'El Boleto Turístico incluye muchos sitios',
      'Los free walking tours son excelentes',
      'Prueba el cuy al horno',
      'El tren a Machu Picchu sale de Ollantaytambo',
      'Evita comidas pesadas los primeros días'
    ]),
    que_llevar: JSON.stringify([
      'Ropa en capas (mucho cambio de temperatura)',
      'Zapatos cómodos para empedrados',
      'Protector solar alto',
      'Sombrero y lentes',
      'Medicamento para altura',
      'Suéter o chamarra abrigada',
      'Pasaporte para sellar en Machu Picchu',
      'Efectivo en soles'
    ]),
    emergencias: JSON.stringify({
      policia: '105',
      turista: '084 235 123',
      hospital: 'Hospital Regional: +51 84 223 691',
      embajada: 'Embajada México Lima: +51 1 612 1300'
    })
  },
  {
    nombre: 'Patagonia',
    pais: 'Argentina/Chile',
    categoria: 'naturaleza',
    imagen: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200',
    rating: 4.9,
    descripcion: 'El fin del mundo ofrece glaciares imponentes, montañas dramáticas, fauna única y paisajes de otro planeta en uno de los lugares más remotos de la Tierra.',
    presupuesto_promedio: '$2,500 - $5,000 USD',
    duracion_recomendada: '10-14 días',
    mejor_epoca: 'Noviembre a Marzo',
    es_popular: 1,
    que_hacer: JSON.stringify([
      'Visitar el Glaciar Perito Moreno',
      'Hacer trekking en Torres del Paine',
      'Navegar por los fiordos',
      'Ver pingüinos en Punta Tombo',
      'Explorar El Chaltén',
      'Visitar Ushuaia, el fin del mundo',
      'Avistar ballenas en Península Valdés',
      'Fotografiar el Fitz Roy'
    ]),
    consejos: JSON.stringify([
      'El clima es muy impredecible, prepárate para todo',
      'La temporada alta es de noviembre a marzo',
      'Reserva alojamiento con mucha anticipación',
      'El viento puede ser muy fuerte',
      'Las distancias son enormes, planifica bien',
      'Lleva efectivo, hay pocos cajeros',
      'Contrata tours con guías certificados',
      'El asado patagónico es imperdible'
    ]),
    que_llevar: JSON.stringify([
      'Ropa técnica en capas',
      'Cortavientos impermeable',
      'Botas de trekking impermeables',
      'Gorro, guantes y bufanda',
      'Lentes de sol',
      'Protector solar alto',
      'Bastones de trekking',
      'Binoculares para fauna'
    ]),
    emergencias: JSON.stringify({
      policia: '101',
      emergencias: '107',
      hospital: 'Hospital Calafate: +54 2902 491 001',
      embajada: 'Embajada México BA: +54 11 4821 7170'
    })
  }
];

// Información para destinos existentes sin datos
const infoDestinosExistentes = {
  'Dubai': {
    que_hacer: [
      'Subir al Burj Khalifa',
      'Visitar el Dubai Mall y su acuario',
      'Hacer un safari en el desierto',
      'Explorar el Dubai Creek en abra',
      'Visitar la mezquita de Jumeirah',
      'Disfrutar de Palm Jumeirah',
      'Ver el espectáculo de fuentes del Dubai Mall',
      'Pasear por el zoco de oro y especias'
    ],
    consejos: [
      'Viste modestamente fuera de hoteles y playas',
      'El viernes es día de descanso, muchas cosas cierran',
      'El alcohol solo se sirve en hoteles con licencia',
      'El metro es moderno y económico',
      'Reserva safari y Burj Khalifa con anticipación',
      'El verano es extremadamente caluroso',
      'Las muestras de afecto público están prohibidas',
      'Usa Careem o Uber para taxis'
    ],
    que_llevar: [
      'Ropa modesta que cubra hombros y rodillas',
      'Protector solar muy alto',
      'Gafas de sol',
      'Sombrero o pañuelo',
      'Ropa elegante para restaurantes',
      'Traje de baño',
      'Adaptador tipo G',
      'Abanico portátil'
    ],
    emergencias: {
      policia: '999',
      emergencias: '998',
      hospital: 'Rashid Hospital: +971 4 219 2000',
      embajada: 'Embajada México: +971 4 343 6383'
    }
  },
  'Bangkok': {
    que_hacer: [
      'Visitar el Gran Palacio y Wat Phra Kaew',
      'Explorar Wat Arun al atardecer',
      'Navegar por los canales en longtail boat',
      'Probar street food en Yaowarat (Chinatown)',
      'Visitar el mercado flotante de Damnoen Saduak',
      'Explorar el mercado de fin de semana Chatuchak',
      'Disfrutar de un masaje tailandés tradicional',
      'Ver el Buda Reclinado en Wat Pho'
    ],
    consejos: [
      'Usa el BTS Skytrain para evitar el tráfico',
      'Viste modestamente para entrar a templos',
      'El regateo es normal en mercados',
      'Prueba el pad thai callejero',
      'Lleva pañuelos húmedos, hace mucho calor',
      'Evita los tuk-tuks que ofrecen tours muy baratos',
      'Reserva templos famosos temprano en la mañana',
      'El agua embotellada es muy barata'
    ],
    que_llevar: [
      'Ropa ligera y transpirable',
      'Pantalón largo para templos',
      'Pañuelo para cubrir hombros',
      'Zapatos fáciles de quitar',
      'Protector solar',
      'Repelente de insectos',
      'Paraguas plegable',
      'Botella de agua reutilizable'
    ],
    emergencias: {
      policia: '191',
      emergencias: '1669',
      hospital: 'Bumrungrad Hospital: +66 2 066 8888',
      embajada: 'Embajada México: +66 2 285 0995'
    }
  },
  'Estambul': {
    que_hacer: [
      'Visitar la Mezquita Azul',
      'Explorar Santa Sofía',
      'Perderse en el Gran Bazar',
      'Navegar por el Bósforo',
      'Visitar el Palacio de Topkapi',
      'Probar un baño turco tradicional',
      'Cenar en Karaköy',
      'Ver derviches giróvagos'
    ],
    consejos: [
      'Viste modestamente para entrar a mezquitas',
      'El regateo es obligatorio en el Gran Bazar',
      'Prueba el desayuno turco tradicional',
      'Usa la Istanbulkart para transporte',
      'Los ferries son la forma más bonita de cruzar',
      'Aprende algunas palabras en turco',
      'El té turco es gratis en muchas tiendas',
      'Evita los restaurantes muy cerca de atracciones'
    ],
    que_llevar: [
      'Ropa modesta para mezquitas',
      'Pañuelo para la cabeza (mujeres)',
      'Zapatos cómodos para empedrados',
      'Bolsa para compras en el bazar',
      'Adaptador europeo tipo C',
      'Cámara fotográfica',
      'Protector solar',
      'Chaqueta ligera'
    ],
    emergencias: {
      policia: '155',
      emergencias: '112',
      hospital: 'American Hospital: +90 212 444 3777',
      embajada: 'Embajada México: +90 312 442 3033'
    }
  },
  'Kioto': {
    que_hacer: [
      'Visitar el Fushimi Inari y sus mil torii',
      'Explorar el Bosque de Bambú de Arashiyama',
      'Ver el Pabellón Dorado (Kinkaku-ji)',
      'Pasear por Gion y ver geishas',
      'Visitar el templo Kiyomizu-dera',
      'Participar en una ceremonia del té',
      'Explorar el jardín zen de Ryoan-ji',
      'Caminar por el Camino del Filósofo'
    ],
    consejos: [
      'Visita Fushimi Inari al amanecer para evitar multitudes',
      'Alquila una bicicleta para moverte',
      'Respeta a las geishas, no las persigas para fotos',
      'Los templos cierran temprano (16:00-17:00)',
      'Prueba kaiseki, la alta cocina japonesa',
      'Compra el JR Pass si viajas desde Tokio',
      'El otoño (noviembre) es espectacular',
      'Quítate los zapatos al entrar a templos'
    ],
    que_llevar: [
      'Calcetines bonitos (te los verán en templos)',
      'Zapatos fáciles de quitar',
      'Ropa en capas',
      'Paraguas plegable',
      'Efectivo en yenes',
      'Cámara con buena memoria',
      'Mochila pequeña',
      'WiFi portátil'
    ],
    emergencias: {
      policia: '110',
      emergencias: '119',
      hospital: 'Kyoto University Hospital: +81 75 751 3111',
      embajada: 'Embajada México Tokio: +81 3 3581 1160'
    }
  },
  'Riviera Maya': {
    que_hacer: [
      'Nadar en cenotes cristalinos',
      'Visitar las ruinas de Tulum',
      'Bucear en el arrecife mesoamericano',
      'Explorar el parque Xcaret',
      'Nadar con tortugas en Akumal',
      'Visitar Chichén Itzá',
      'Disfrutar de las playas de arena blanca',
      'Hacer snorkel con tiburones ballena'
    ],
    consejos: [
      'Usa bloqueador biodegradable (obligatorio en cenotes)',
      'Reserva tours con anticipación en temporada alta',
      'Alquila carro para mayor libertad',
      'Visita cenotes temprano antes del calor',
      'Lleva efectivo para propinas y mercados',
      'El sargazo varía según la época',
      'Contrata guías locales en zonas arqueológicas',
      'Evita el agua del grifo'
    ],
    que_llevar: [
      'Bloqueador solar biodegradable',
      'Máscara de snorkel',
      'Zapatos para agua',
      'Repelente de insectos',
      'Cámara acuática',
      'Ropa ligera',
      'Sombrero',
      'Toalla de microfibra'
    ],
    emergencias: {
      policia: '911',
      turista: '078',
      hospital: 'Hospiten: +52 984 803 1002',
      embajada: 'Consulado USA: +52 999 942 5700'
    }
  },
  'Maldivas': {
    que_hacer: [
      'Bucear con mantarrayas y tiburones',
      'Relajarse en una villa sobre el agua',
      'Hacer snorkel en arrecifes de coral',
      'Ver bioluminiscencia en la noche',
      'Nadar con tortugas marinas',
      'Disfrutar de un spa sobre el agua',
      'Hacer excursiones a islas locales',
      'Ver delfines al atardecer'
    ],
    consejos: [
      'Reserva con meses de anticipación',
      'Todo incluido es más económico a largo plazo',
      'El alcohol solo en resorts (islas locales son secas)',
      'La temporada seca es de noviembre a abril',
      'Los hidroaviones son la forma de llegar a resorts lejanos',
      'Lleva efectivo para propinas',
      'El wifi puede ser lento y caro',
      'Respeta el código de vestimenta en islas locales'
    ],
    que_llevar: [
      'Varios trajes de baño',
      'Protector solar reef-safe',
      'Equipo de snorkel propio',
      'Ropa ligera y cómoda',
      'Vestido/camisa elegante para cenas',
      'Cámara subacuática',
      'Repelente de insectos',
      'Sandalias y zapatos para agua'
    ],
    emergencias: {
      policia: '119',
      emergencias: '102',
      hospital: 'ADK Hospital: +960 331 3553',
      embajada: 'Embajada más cercana en Sri Lanka'
    }
  },
  'Singapur': {
    que_hacer: [
      'Ver el espectáculo de luces en Marina Bay Sands',
      'Explorar Gardens by the Bay',
      'Pasear por el barrio de Chinatown',
      'Visitar Little India',
      'Comer en hawker centres',
      'Ver el Merlion',
      'Visitar el zoo nocturno',
      'Comprar en Orchard Road'
    ],
    consejos: [
      'El chicle está prohibido',
      'Las multas son altas por tirar basura',
      'El transporte público es excelente',
      'Los hawker centres tienen comida deliciosa y barata',
      'Lleva chaqueta para el aire acondicionado',
      'El agua del grifo es segura',
      'Descarga la app Grab para transporte',
      'Reserva restaurantes populares con anticipación'
    ],
    que_llevar: [
      'Ropa ligera de algodón',
      'Chaqueta ligera (por el A/C)',
      'Paraguas plegable',
      'Zapatos cómodos',
      'Adaptador tipo G',
      'Protector solar',
      'Botella de agua reutilizable',
      'Cámara fotográfica'
    ],
    emergencias: {
      policia: '999',
      emergencias: '995',
      hospital: 'Singapore General: +65 6222 3322',
      embajada: 'Embajada México: +65 6298 5522'
    }
  },
  'Río de Janeiro': {
    que_hacer: [
      'Subir al Cristo Redentor',
      'Visitar el Pan de Azúcar',
      'Relajarse en Copacabana e Ipanema',
      'Explorar el barrio de Santa Teresa',
      'Ver un partido de fútbol en el Maracaná',
      'Caminar por el Jardín Botánico',
      'Disfrutar de la vida nocturna en Lapa',
      'Probar una feijoada tradicional'
    ],
    consejos: [
      'Evita mostrar objetos de valor',
      'Usa Uber en lugar de taxis callejeros',
      'Visita el Cristo temprano para evitar nubes',
      'Aprende algunas frases en portugués',
      'La caipirinha es la bebida nacional',
      'No vayas a favelas sin guía autorizado',
      'El carnaval es en febrero (reserva con anticipación)',
      'Las playas son gratuitas'
    ],
    que_llevar: [
      'Ropa ligera y de playa',
      'Protector solar alto',
      'Sandalias',
      'Bolsa impermeable',
      'Gorra o sombrero',
      'Canga (toalla de playa local)',
      'Poco efectivo en mano',
      'Cámara (cuidado en la calle)'
    ],
    emergencias: {
      policia: '190',
      emergencias: '192',
      hospital: 'Copa Star: +55 21 2545 3600',
      embajada: 'Consulado México: +55 21 2553 5595'
    }
  },
  'Islas Galápagos': {
    que_hacer: [
      'Nadar con leones marinos',
      'Ver tortugas gigantes en Santa Cruz',
      'Bucear con tiburones martillo',
      'Hacer snorkel con pingüinos',
      'Visitar la Estación Charles Darwin',
      'Explorar los túneles de lava',
      'Avistar piqueros de patas azules',
      'Caminar por los paisajes volcánicos'
    ],
    consejos: [
      'Reserva con meses de anticipación',
      'Paga el impuesto de entrada ($100 USD)',
      'Los cruceros son la mejor forma de ver las islas',
      'Respeta la distancia con los animales (2 metros)',
      'Lleva efectivo, pocos lugares aceptan tarjeta',
      'El equipo de snorkel es esencial',
      'Contrata guías naturalistas certificados',
      'No toques ni alimentes a los animales'
    ],
    que_llevar: [
      'Equipo de snorkel propio',
      'Cámara resistente al agua',
      'Protector solar reef-safe',
      'Zapatos de agua y de hiking',
      'Ropa ligera y sombrero',
      'Binoculares',
      'Medicamento para mareo',
      'Efectivo en dólares'
    ],
    emergencias: {
      policia: '911',
      emergencias: '911',
      hospital: 'Hospital San Cristóbal: +593 5 252 0118',
      embajada: 'Embajada México Quito: +593 2 292 7850'
    }
  }
};

// Insertar destinos nuevos
function insertarDestinosNuevos() {
  const insertStmt = db.prepare(`
    INSERT INTO destinos (nombre, pais, categoria, imagen, imagen_principal, rating, descripcion, 
    presupuesto_promedio, duracion_recomendada, mejor_epoca, es_popular, que_hacer, consejos, que_llevar, emergencias)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let insertados = 0;
  
  for (const destino of destinosNuevos) {
    try {
      insertStmt.run(
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
        destino.es_popular,
        destino.que_hacer,
        destino.consejos,
        destino.que_llevar,
        destino.emergencias
      );
      insertados++;
      console.log(`✅ ${destino.nombre} insertado`);
    } catch (err) {
      console.log(`⚠️ ${destino.nombre}: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Destinos nuevos insertados: ${insertados}\n`);
}

// Actualizar destinos existentes sin info
function actualizarDestinosExistentes() {
  const updateStmt = db.prepare(`
    UPDATE destinos 
    SET que_hacer = ?, consejos = ?, que_llevar = ?, emergencias = ?
    WHERE nombre = ?
  `);

  let actualizados = 0;

  for (const [nombre, info] of Object.entries(infoDestinosExistentes)) {
    const result = updateStmt.run(
      JSON.stringify(info.que_hacer),
      JSON.stringify(info.consejos),
      JSON.stringify(info.que_llevar),
      JSON.stringify(info.emergencias),
      nombre
    );

    if (result.changes > 0) {
      actualizados++;
      console.log(`✅ ${nombre} actualizado`);
    }
  }

  console.log(`\n📊 Destinos existentes actualizados: ${actualizados}\n`);
}

// Verificar resultado final
function verificarResultado() {
  const total = db.prepare('SELECT COUNT(*) as total FROM destinos').get();
  const conInfo = db.prepare('SELECT COUNT(*) as total FROM destinos WHERE que_hacer IS NOT NULL').get();
  
  console.log('='.repeat(50));
  console.log('📊 RESUMEN FINAL:');
  console.log(`   Total destinos: ${total.total}`);
  console.log(`   Con información completa: ${conInfo.total}`);
  console.log('='.repeat(50));
}

// Ejecutar todo
console.log('📍 Insertando destinos nuevos...\n');
insertarDestinosNuevos();

console.log('🔄 Actualizando destinos existentes...\n');
actualizarDestinosExistentes();

verificarResultado();

db.close();
console.log('\n✨ Proceso completado');
