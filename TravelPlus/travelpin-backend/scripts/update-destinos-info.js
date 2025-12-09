// Script para actualizar destinos con consejos, que_hacer y que_llevar
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'BDTravelPin.db');
const db = new Database(dbPath);

console.log('🚀 Actualizando información de destinos...\n');

// Primero verificamos y agregamos las columnas si no existen
function agregarColumnasNecesarias() {
  const columnas = ['que_hacer', 'consejos', 'que_llevar', 'emergencias', 'imagenes_galeria', 'latitud', 'longitud'];
  
  // Obtener columnas existentes
  const tableInfo = db.prepare("PRAGMA table_info(destinos)").all();
  const columnasExistentes = tableInfo.map(col => col.name);
  
  console.log('📋 Columnas actuales:', columnasExistentes.join(', '));
  
  for (const columna of columnas) {
    if (!columnasExistentes.includes(columna)) {
      try {
        db.prepare(`ALTER TABLE destinos ADD COLUMN ${columna} TEXT`).run();
        console.log(`✅ Columna '${columna}' agregada`);
      } catch (err) {
        console.log(`⚠️ Error agregando '${columna}':`, err.message);
      }
    }
  }
  
  console.log('');
}

agregarColumnasNecesarias();

// Información detallada por destino
const destinosInfo = {
  'Cancún': {
    que_hacer: [
      'Nadar con delfines en Xcaret o Xel-Há',
      'Visitar las ruinas mayas de Tulum y Chichén Itzá',
      'Explorar cenotes como Ik Kil y Dos Ojos',
      'Bucear o hacer snorkel en el arrecife mesoamericano',
      'Disfrutar de la zona hotelera y sus playas',
      'Visitar Isla Mujeres en ferry',
      'Explorar el Museo Subacuático de Arte (MUSA)',
      'Pasear por el centro de Cancún y probar comida local'
    ],
    consejos: [
      'Aplica protector solar biodegradable para proteger los arrecifes',
      'Lleva efectivo en pesos mexicanos para mercados y propinas',
      'Reserva tours con anticipación en temporada alta',
      'El transporte público (R1, R2) es económico y seguro',
      'Negocia precios en mercados y con taxistas',
      'Evita el agua del grifo, bebe agua embotellada',
      'La temporada de huracanes es de junio a noviembre',
      'Usa repelente de insectos, especialmente al atardecer'
    ],
    que_llevar: [
      'Protector solar biodegradable (reef-safe)',
      'Traje de baño y ropa ligera de algodón',
      'Sandalias y zapatos para agua',
      'Gafas de sol y sombrero',
      'Repelente de insectos',
      'Cámara acuática o funda impermeable',
      'Medicamentos para el estómago',
      'Snorkel propio (opcional)'
    ],
    emergencias: {
      policia: '911',
      turista: '078',
      hospital: 'Hospital Galenia: +52 998 891 5200',
      embajada: 'Consulado USA: +52 999 942 5700'
    }
  },
  'Ciudad de México': {
    que_hacer: [
      'Visitar el Museo Nacional de Antropología',
      'Explorar el Centro Histórico y el Zócalo',
      'Pasear por los canales de Xochimilco en trajinera',
      'Subir al Castillo de Chapultepec',
      'Probar tacos en taquerías locales',
      'Visitar la Casa Azul de Frida Kahlo en Coyoacán',
      'Explorar las pirámides de Teotihuacán',
      'Disfrutar de la vida nocturna en Roma y Condesa'
    ],
    consejos: [
      'Usa apps de transporte como Uber o Didi',
      'El metro es muy económico pero evítalo en hora pico',
      'La altitud (2,240m) puede causar mareo los primeros días',
      'Come en puestos con mucha gente local',
      'Visita museos los domingos (entrada gratuita)',
      'Lleva siempre una chamarra, el clima cambia rápido',
      'No ostentes objetos de valor en el transporte público',
      'Prueba el agua de jamaica y el pulque'
    ],
    que_llevar: [
      'Ropa en capas (mañanas frías, tardes cálidas)',
      'Zapatos cómodos para caminar mucho',
      'Paraguas o impermeable ligero',
      'Chamarra o suéter',
      'Protector solar (el sol es más fuerte por la altitud)',
      'Medicamento para el mal de altura (opcional)',
      'Mochila antirrobo',
      'Adaptador de corriente si vienes del extranjero'
    ],
    emergencias: {
      policia: '911',
      turista: '55 5089 7500',
      hospital: 'Hospital ABC: +52 55 5230 8000',
      embajada: 'Embajada USA: +52 55 5080 2000'
    }
  },
  'Oaxaca': {
    que_hacer: [
      'Visitar Monte Albán, ciudad zapoteca',
      'Explorar el centro histórico y sus iglesias',
      'Probar mole negro, tlayudas y chapulines',
      'Visitar una destilería de mezcal',
      'Ir a Hierve el Agua (cascadas petrificadas)',
      'Comprar artesanías en los mercados',
      'Ver el árbol del Tule, el más ancho del mundo',
      'Tomar una clase de cocina oaxaqueña'
    ],
    consejos: [
      'Prueba diferentes tipos de mezcal en mezcalerías',
      'El mejor chocolate caliente está en el Mercado 20 de Noviembre',
      'Visita los pueblos mancomunados para ecoturismo',
      'Reserva con anticipación durante la Guelaguetza (julio)',
      'Los domingos hay tianguis en Tlacolula',
      'Aprende algunas palabras en zapoteco',
      'Lleva efectivo, muchos lugares no aceptan tarjeta',
      'Contrata guías locales para apoyar la economía'
    ],
    que_llevar: [
      'Ropa cómoda y fresca de día, abrigo para la noche',
      'Zapatos cómodos para caminar en empedrados',
      'Sombrero y protector solar',
      'Bolsa de tela para compras en mercados',
      'Cámara con buena memoria',
      'Libreta para anotar recetas',
      'Repelente de insectos',
      'Medicamentos para el estómago'
    ],
    emergencias: {
      policia: '911',
      turista: '951 516 0984',
      hospital: 'Hospital Regional: +52 951 515 1300',
      embajada: 'Consulado USA CDMX: +52 55 5080 2000'
    }
  },
  'Playa del Carmen': {
    que_hacer: [
      'Caminar por la Quinta Avenida',
      'Nadar en cenotes (Gran Cenote, Cenote Azul)',
      'Visitar las ruinas de Tulum',
      'Tomar el ferry a Cozumel para bucear',
      'Explorar el parque Xcaret o Xel-Há',
      'Ver el show de Cirque du Soleil "JOYÀ"',
      'Hacer snorkel con tortugas en Akumal',
      'Visitar la biosfera de Sian Ka\'an'
    ],
    consejos: [
      'Los cenotes más populares se llenan temprano, ve antes de las 10am',
      'Alquila un coche para explorar la Riviera Maya',
      'El bloqueador solar debe ser biodegradable (obligatorio en cenotes)',
      'Cambia dinero en casas de cambio, no en hoteles',
      'Cuidado con el sargazo en ciertas épocas del año',
      'Reserva restaurantes populares con anticipación',
      'Las playas son públicas aunque pasen por hoteles',
      'Uber funciona pero algunos taxistas se oponen'
    ],
    que_llevar: [
      'Varios trajes de baño',
      'Sandalias de agua para cenotes',
      'Bloqueador solar biodegradable',
      'Máscara de snorkel',
      'Cámara GoPro o resistente al agua',
      'Ropa ligera y fresca',
      'Sombrero y lentes de sol',
      'Botiquín básico con antihistamínicos'
    ],
    emergencias: {
      policia: '911',
      turista: '984 877 3340',
      hospital: 'Hospiten: +52 984 803 1002',
      embajada: 'Consulado USA Mérida: +52 999 942 5700'
    }
  },
  'Guadalajara': {
    que_hacer: [
      'Visitar el centro histórico y la Catedral',
      'Explorar el Instituto Cultural Cabañas',
      'Ir a Tlaquepaque y Tonalá para artesanías',
      'Probar la birria y las tortas ahogadas',
      'Visitar una destilería de tequila en Tequila',
      'Ver un espectáculo de mariachi en El Parián',
      'Caminar por la Glorieta Chapalita',
      'Explorar el Mercado San Juan de Dios'
    ],
    consejos: [
      'El tour a Tequila incluye cata y es muy popular',
      'Los domingos hay vía recreativa en Chapultepec',
      'Prueba el tejuino, bebida tradicional tapatía',
      'El transporte público (Mi Macro) es eficiente',
      'Visita Tlaquepaque los fines de semana',
      'El clima es templado todo el año',
      'La FIL (Feria del Libro) es en noviembre',
      'Chapala y Ajijic son excursiones de un día'
    ],
    que_llevar: [
      'Ropa casual y cómoda',
      'Suéter ligero para las noches',
      'Zapatos cómodos para caminar',
      'Protector solar',
      'Bolsa para artesanías',
      'Cámara fotográfica',
      'Sombrero o gorra',
      'Espacio en la maleta para tequila'
    ],
    emergencias: {
      policia: '911',
      turista: '33 3668 1600',
      hospital: 'Hospital Country 2000: +52 33 3854 5000',
      embajada: 'Consulado USA: +52 33 3268 2100'
    }
  },
  'París': {
    que_hacer: [
      'Subir a la Torre Eiffel',
      'Visitar el Museo del Louvre',
      'Pasear por los Campos Elíseos',
      'Explorar el barrio de Montmartre',
      'Visitar la Catedral de Notre-Dame',
      'Pasear por el Jardín de las Tullerías',
      'Tomar un crucero por el Sena',
      'Visitar el Palacio de Versalles'
    ],
    consejos: [
      'Compra entradas online para evitar filas largas',
      'El metro es la forma más eficiente de moverse',
      'Los museos son gratuitos el primer domingo del mes',
      'Aprende frases básicas en francés',
      'Evita los restaurantes turísticos cerca de monumentos',
      'El agua del grifo es segura para beber',
      'Lleva siempre una bolsa reutilizable',
      'Reserva la Torre Eiffel con semanas de anticipación'
    ],
    que_llevar: [
      'Ropa elegante casual (los franceses visten bien)',
      'Zapatos cómodos para caminar',
      'Paraguas compacto',
      'Adaptador de corriente europeo',
      'Chaqueta ligera incluso en verano',
      'Bolso cruzado antirrobo',
      'Foulard o pañuelo',
      'Cámara fotográfica'
    ],
    emergencias: {
      policia: '17',
      emergencias: '112',
      hospital: 'Hôpital Américain: +33 1 46 41 25 25',
      embajada: 'Embajada México: +33 1 53 70 27 70'
    }
  },
  'Barcelona': {
    que_hacer: [
      'Visitar la Sagrada Familia',
      'Pasear por Las Ramblas',
      'Explorar el Parque Güell',
      'Relajarse en la playa de la Barceloneta',
      'Visitar el Barrio Gótico',
      'Ir al mercado de La Boquería',
      'Ver un partido en el Camp Nou',
      'Disfrutar de tapas en El Born'
    ],
    consejos: [
      'Compra entradas anticipadas para la Sagrada Familia',
      'Cuidado con los carteristas en Las Ramblas',
      'El horario de comidas es diferente (almuerzo 14h, cena 21h)',
      'Usa la tarjeta T-Casual para el transporte',
      'Los domingos muchas tiendas están cerradas',
      'Prueba los pintxos en el Barrio Gótico',
      'El Tibidabo tiene vistas espectaculares',
      'Visita los rooftop bars para atardeceres'
    ],
    que_llevar: [
      'Ropa ligera y cómoda',
      'Protector solar',
      'Traje de baño',
      'Zapatos cómodos para empedrados',
      'Gafas de sol',
      'Bolsa antirrobo',
      'Adaptador de corriente europeo',
      'Sombrero o gorra'
    ],
    emergencias: {
      policia: '092',
      emergencias: '112',
      hospital: 'Hospital Clínic: +34 93 227 54 00',
      embajada: 'Consulado México: +34 93 201 18 22'
    }
  },
  'Roma': {
    que_hacer: [
      'Visitar el Coliseo y el Foro Romano',
      'Lanzar una moneda en la Fontana di Trevi',
      'Explorar el Vaticano y la Capilla Sixtina',
      'Pasear por el barrio de Trastevere',
      'Subir a la cúpula de San Pedro',
      'Probar pasta carbonara auténtica',
      'Visitar el Panteón',
      'Pasear por la Plaza de España'
    ],
    consejos: [
      'Reserva el Vaticano y Coliseo online',
      'Viste modestamente para entrar a iglesias',
      'El agua de las fuentes públicas es potable',
      'Evita restaurantes con menú en varios idiomas',
      'El aperitivo es sagrado, prueba un Aperol Spritz',
      'Camina, es la mejor forma de conocer Roma',
      'No te sientes en las escaleras de monumentos',
      'Compra el Roma Pass para ahorrar en transporte'
    ],
    que_llevar: [
      'Ropa que cubra hombros y rodillas (para iglesias)',
      'Zapatos muy cómodos',
      'Botella de agua reutilizable',
      'Adaptador de corriente europeo',
      'Gafas de sol y sombrero',
      'Protector solar',
      'Cámara fotográfica',
      'Guía de viaje o app offline'
    ],
    emergencias: {
      policia: '113',
      emergencias: '112',
      hospital: 'Policlinico Umberto I: +39 06 499 71',
      embajada: 'Embajada México: +39 06 440 2309'
    }
  },
  'Tokio': {
    que_hacer: [
      'Visitar el templo Senso-ji en Asakusa',
      'Explorar el cruce de Shibuya',
      'Pasear por Harajuku y ver la moda',
      'Visitar el Palacio Imperial',
      'Explorar Akihabara (barrio otaku)',
      'Subir a la Tokyo Skytree',
      'Probar ramen auténtico en Shinjuku',
      'Ver el amanecer desde el mercado de pescado'
    ],
    consejos: [
      'Compra un JR Pass si viajarás a otras ciudades',
      'Descarga Google Translate con japonés offline',
      'El efectivo es rey, muchos lugares no aceptan tarjeta',
      'Sigue las reglas del metro (no comer, no hablar por teléfono)',
      'Los konbini (7-Eleven, Lawson) tienen comida excelente',
      'Quítate los zapatos al entrar a casas y algunos restaurantes',
      'El WiFi portátil es esencial',
      'Inclina la cabeza como saludo respetuoso'
    ],
    que_llevar: [
      'Zapatos fáciles de quitar y poner',
      'Adaptador de corriente japonés (tipo A)',
      'Ropa cómoda y modesta',
      'Paraguas plegable',
      'Mascarilla facial',
      'WiFi portátil o SIM japonesa',
      'Efectivo en yenes',
      'Bolsa plegable para compras'
    ],
    emergencias: {
      policia: '110',
      emergencias: '119',
      hospital: 'St. Luke\'s International: +81 3 3541 5151',
      embajada: 'Embajada México: +81 3 3581 1160'
    }
  },
  'Nueva York': {
    que_hacer: [
      'Caminar por Central Park',
      'Visitar la Estatua de la Libertad',
      'Ver un show en Broadway',
      'Explorar Times Square',
      'Subir al Empire State o Top of the Rock',
      'Pasear por el High Line',
      'Visitar el MET y el MoMA',
      'Comer pizza al estilo neoyorquino'
    ],
    consejos: [
      'Usa el metro, es la forma más eficiente de moverse',
      'Compra la MetroCard ilimitada si te quedas varios días',
      'Las propinas son obligatorias (15-20%)',
      'Reserva Broadway con anticipación para mejores precios',
      'Los museos tienen días de pago voluntario',
      'Camina por el puente de Brooklyn al atardecer',
      'Lleva snacks, comer fuera es caro',
      'Descarga apps de mapas offline'
    ],
    que_llevar: [
      'Zapatos muy cómodos (caminarás mucho)',
      'Ropa en capas',
      'Abrigo grueso si es invierno',
      'Mochila cómoda',
      'Batería portátil para el celular',
      'Adaptador de corriente si es necesario',
      'Botella de agua reutilizable',
      'Cámara fotográfica'
    ],
    emergencias: {
      policia: '911',
      emergencias: '911',
      hospital: 'NYC Health: +1 212 562 4141',
      embajada: 'Consulado México: +1 212 217 6400'
    }
  },
  'Machu Picchu': {
    que_hacer: [
      'Recorrer la ciudadela inca al amanecer',
      'Subir al Huayna Picchu o Montaña Machu Picchu',
      'Explorar Cusco y sus ruinas cercanas',
      'Caminar el Camino Inca (4 días)',
      'Visitar el Valle Sagrado',
      'Probar cuy y alpaca',
      'Ver el Templo del Sol',
      'Tomar el tren panorámico desde Ollantaytambo'
    ],
    consejos: [
      'Aclimátate en Cusco 2-3 días antes',
      'Toma mate de coca para el mal de altura',
      'Reserva entrada y Huayna Picchu con meses de anticipación',
      'Lleva tu pasaporte, lo sellan como recuerdo',
      'El clima es impredecible, lleva capas',
      'Contrata guía oficial para entender la historia',
      'No hay cajeros ni comida dentro de la ciudadela',
      'El tren económico es PeruRail Expedition'
    ],
    que_llevar: [
      'Botas de trekking cómodas',
      'Ropa en capas (hace frío y calor)',
      'Impermeable o poncho',
      'Protector solar fuerte',
      'Sombrero y gafas de sol',
      'Repelente de insectos',
      'Snacks y agua',
      'Medicamento para altura (Diamox)'
    ],
    emergencias: {
      policia: '105',
      emergencias: '116',
      hospital: 'Hospital Regional Cusco: +51 84 223 691',
      embajada: 'Embajada México Lima: +51 1 612 1300'
    }
  },
  'Bali': {
    que_hacer: [
      'Ver el amanecer en el templo Uluwatu',
      'Visitar los arrozales de Tegallalang',
      'Explorar el Bosque de los Monos',
      'Tomar una clase de surf en Kuta',
      'Disfrutar de un spa balinés',
      'Visitar el templo Tanah Lot',
      'Explorar Ubud y sus galerías de arte',
      'Hacer snorkel en las Islas Gili'
    ],
    consejos: [
      'Alquila una moto o contrata conductor privado',
      'Respeta las ceremonias religiosas locales',
      'Viste con sarong para entrar a templos',
      'Negocia precios en mercados y con taxistas',
      'El tráfico en el sur es terrible, planifica bien',
      'Prueba el café luwak (el más caro del mundo)',
      'Ubud es más tranquilo que las playas del sur',
      'Las mejores puestas de sol son en la costa oeste'
    ],
    que_llevar: [
      'Ropa ligera y modesta',
      'Sarong para templos',
      'Protector solar y repelente',
      'Sandalias y zapatos para agua',
      'Traje de baño',
      'Medicamentos estomacales',
      'Adaptador de corriente tipo C',
      'Sombrero y gafas de sol'
    ],
    emergencias: {
      policia: '110',
      emergencias: '118',
      hospital: 'BIMC Hospital: +62 361 761 263',
      embajada: 'Embajada México Yakarta: +62 21 520 3980'
    }
  },
  'Londres': {
    que_hacer: [
      'Visitar el Big Ben y el Parlamento',
      'Explorar el Museo Británico (gratis)',
      'Ver el cambio de guardia en Buckingham',
      'Pasear por Hyde Park',
      'Cruzar el Tower Bridge',
      'Explorar Camden Market',
      'Ver un musical en el West End',
      'Tomar afternoon tea tradicional'
    ],
    consejos: [
      'Obtén una Oyster Card para el transporte',
      'Los museos principales son gratuitos',
      'Lleva siempre paraguas',
      'Camina por South Bank para vistas del Támesis',
      'Los pubs cierran temprano, ve antes de las 11pm',
      'Prueba el fish and chips tradicional',
      'El lado izquierdo es para quedarse en escaleras mecánicas',
      'Reserva afternoon tea con anticipación'
    ],
    que_llevar: [
      'Impermeable y paraguas',
      'Capas de ropa',
      'Zapatos impermeables cómodos',
      'Adaptador de corriente UK (tipo G)',
      'Suéter o chaqueta',
      'Bolsa plegable para compras',
      'Tarjeta contactless',
      'Mochila pequeña'
    ],
    emergencias: {
      policia: '999',
      emergencias: '112',
      hospital: 'St Thomas\' Hospital: +44 20 7188 7188',
      embajada: 'Embajada México: +44 20 7499 8586'
    }
  },
  'Buenos Aires': {
    que_hacer: [
      'Ver un show de tango en San Telmo',
      'Pasear por La Boca y el Caminito',
      'Visitar el cementerio de Recoleta',
      'Comer asado argentino',
      'Explorar Palermo y sus parques',
      'Ver un partido de fútbol (Boca o River)',
      'Tomar mate en Plaza de Mayo',
      'Pasear por Puerto Madero'
    ],
    consejos: [
      'El dólar blue tiene mejor tasa que el oficial',
      'Los domingos hay feria en San Telmo',
      'Las cenas empiezan después de las 21h',
      'Prueba las medialunas y el dulce de leche',
      'El subte es la forma más rápida de moverse',
      'Reserva shows de tango con anticipación',
      'La propina es del 10%',
      'Cuidado con los carteristas en zonas turísticas'
    ],
    que_llevar: [
      'Ropa casual elegante',
      'Zapatos cómodos para caminar',
      'Chaqueta para las noches',
      'Adaptador de corriente tipo I',
      'Efectivo en dólares para cambiar',
      'Cámara fotográfica',
      'Protector solar',
      'Mate y bombilla como souvenir'
    ],
    emergencias: {
      policia: '101',
      emergencias: '107',
      hospital: 'Hospital Británico: +54 11 4309 6400',
      embajada: 'Embajada México: +54 11 4821 7170'
    }
  },
  'Santorini': {
    que_hacer: [
      'Ver el atardecer en Oia',
      'Explorar las calles de Fira',
      'Visitar las playas de arena negra',
      'Hacer un tour en barco por la caldera',
      'Probar vino en bodegas locales',
      'Nadar en las aguas termales',
      'Visitar el sitio arqueológico de Akrotiri',
      'Tomar fotos en las iglesias de cúpulas azules'
    ],
    consejos: [
      'Reserva hoteles con vista a la caldera',
      'Oia se llena para el atardecer, llega temprano',
      'Alquila un ATV para explorar la isla',
      'Los precios son altos, lleva presupuesto extra',
      'Visita en temporada baja (mayo, septiembre)',
      'El vino de Santorini es excelente, prueba Assyrtiko',
      'Las escaleras son empinadas, usa calzado adecuado',
      'El ferry es más barato que el avión desde Atenas'
    ],
    que_llevar: [
      'Ropa blanca (para las fotos)',
      'Protector solar alto',
      'Sombrero y gafas de sol',
      'Sandalias cómodas',
      'Traje de baño',
      'Cámara con buena batería',
      'Adaptador europeo tipo C',
      'Vestido o camisa elegante para cenas'
    ],
    emergencias: {
      policia: '100',
      emergencias: '112',
      hospital: 'Health Center Santorini: +30 22860 22222',
      embajada: 'Embajada México Atenas: +30 210 729 4783'
    }
  },
  'Dubái': {
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
      'El alcohol solo se sirve en hoteles y restaurantes con licencia',
      'El metro es moderno y económico',
      'Reserva safari y Burj Khalifa con anticipación',
      'El verano es extremadamente caluroso (evita mayo-septiembre)',
      'Las muestras de afecto público están prohibidas',
      'Usa Careem o Uber para taxis'
    ],
    que_llevar: [
      'Ropa modesta que cubra hombros y rodillas',
      'Protector solar muy alto',
      'Gafas de sol',
      'Sombrero o pañuelo',
      'Ropa elegante para restaurantes',
      'Traje de baño (solo para piscinas/playas)',
      'Adaptador tipo G (UK)',
      'Abanico o ventilador portátil'
    ],
    emergencias: {
      policia: '999',
      emergencias: '998',
      hospital: 'Rashid Hospital: +971 4 219 2000',
      embajada: 'Embajada México: +971 4 343 6383'
    }
  },
  'Sydney': {
    que_hacer: [
      'Ver la Ópera de Sydney',
      'Cruzar el Harbour Bridge',
      'Relajarse en Bondi Beach',
      'Explorar The Rocks',
      'Visitar Taronga Zoo',
      'Hacer snorkel en la Gran Barrera de Coral',
      'Pasear por el Jardín Botánico',
      'Surfear en Manly Beach'
    ],
    consejos: [
      'El protector solar es esencial, el sol es muy fuerte',
      'Usa la Opal Card para transporte',
      'Las estaciones están invertidas respecto al hemisferio norte',
      'El agua del grifo es segura',
      'Los ferries ofrecen vistas espectaculares',
      'Respeta las banderas de seguridad en playas',
      'Australia tiene enchufes tipo I',
      'Prueba el flat white (café australiano)'
    ],
    que_llevar: [
      'Protector solar SPF 50+',
      'Sombrero y gafas de sol',
      'Traje de baño',
      'Ropa casual cómoda',
      'Zapatos para caminar',
      'Repelente de insectos',
      'Adaptador tipo I',
      'Rashguard para el sol'
    ],
    emergencias: {
      policia: '000',
      emergencias: '000',
      hospital: 'Royal Prince Alfred: +61 2 9515 6111',
      embajada: 'Embajada México: +61 2 6273 3963'
    }
  },
  'Cartagena': {
    que_hacer: [
      'Caminar por la Ciudad Amurallada',
      'Visitar el Castillo de San Felipe',
      'Explorar las Islas del Rosario',
      'Pasear por Getsemaní',
      'Probar ceviche fresco',
      'Ver el atardecer desde Café del Mar',
      'Visitar el Palacio de la Inquisición',
      'Bailar salsa en una terraza'
    ],
    consejos: [
      'Negocia precios con vendedores ambulantes',
      'El centro histórico se recorre a pie',
      'Lleva efectivo para vendedores y propinas',
      'Reserva tours a las islas temprano',
      'El calor es intenso, hidrátate constantemente',
      'Los mejores restaurantes están en Santo Domingo',
      'Cuidado con los fotógrafos de "palenqueras"',
      'La vida nocturna está en Getsemaní'
    ],
    que_llevar: [
      'Ropa muy ligera y fresca',
      'Protector solar alto',
      'Sombrero y abanico',
      'Sandalias cómodas',
      'Traje de baño',
      'Repelente de insectos',
      'Botella de agua',
      'Vestido o guayabera para salir'
    ],
    emergencias: {
      policia: '123',
      emergencias: '123',
      hospital: 'Bocagrande: +57 5 665 5270',
      embajada: 'Embajada México Bogotá: +57 1 629 4959'
    }
  },
  'Isla Mujeres': {
    que_hacer: [
      'Nadar con tiburones ballena (temporada)',
      'Visitar Punta Sur y el templo a Ixchel',
      'Hacer snorkel en el arrecife Manchones',
      'Rentar un carrito de golf para explorar',
      'Relajarse en Playa Norte',
      'Visitar la Tortugranja',
      'Ver el atardecer desde el malecón',
      'Probar los mariscos frescos del mercado'
    ],
    consejos: [
      'La isla es pequeña, un día es suficiente',
      'El ferry desde Cancún sale cada 30 minutos',
      'Llega temprano a Playa Norte para conseguir lugar',
      'Los carritos de golf se rentan sin licencia',
      'El tiburón ballena solo está de junio a septiembre',
      'Los precios son más bajos que en Cancún',
      'Hay un OXXO para comprar snacks baratos',
      'El atardecer en la costa oeste es espectacular'
    ],
    que_llevar: [
      'Traje de baño',
      'Bloqueador solar reef-safe',
      'Efectivo en pesos',
      'Toalla de playa',
      'Snorkel (o rentar allá)',
      'Sandalias',
      'Cámara resistente al agua',
      'Gorra o sombrero'
    ],
    emergencias: {
      policia: '911',
      turista: '998 877 0307',
      hospital: 'Centro de Salud: +52 998 877 0117',
      embajada: 'Consulado USA: +52 999 942 5700'
    }
  },
  'Tulum': {
    que_hacer: [
      'Visitar las ruinas mayas frente al mar',
      'Nadar en cenotes (Gran Cenote, Casa Cenote)',
      'Explorar la biosfera de Sian Ka\'an',
      'Disfrutar de los beach clubs',
      'Hacer yoga al amanecer',
      'Visitar Cobá y subir la pirámide',
      'Cenar en restaurantes de playa',
      'Andar en bici por la zona hotelera'
    ],
    consejos: [
      'Llega temprano a las ruinas para evitar calor y multitudes',
      'La zona hotelera es cara, el pueblo es más económico',
      'Renta bici para moverte por la zona hotelera',
      'El bloqueador debe ser biodegradable',
      'Reserva cenotes y restaurantes populares',
      'El efectivo es preferido en muchos lugares',
      'Los mosquitos son intensos al atardecer',
      'Hay sargazo en ciertas épocas del año'
    ],
    que_llevar: [
      'Bloqueador solar biodegradable',
      'Repelente de insectos',
      'Ropa ligera de algodón',
      'Zapatos para agua',
      'Máscara de snorkel',
      'Vestido para restaurantes de playa',
      'Efectivo',
      'Linterna para cenotes'
    ],
    emergencias: {
      policia: '911',
      turista: '984 871 2212',
      hospital: 'Hospiten Riviera Maya: +52 984 803 1002',
      embajada: 'Consulado USA Mérida: +52 999 942 5700'
    }
  },
  'Cusco': {
    que_hacer: [
      'Explorar la Plaza de Armas',
      'Visitar Sacsayhuamán',
      'Caminar por San Blas',
      'Probar el pisco sour peruano',
      'Visitar el mercado de San Pedro',
      'Tomar el tour del Valle Sagrado',
      'Conocer Moray y las Salineras de Maras',
      'Cenar en restaurantes de cocina novoandina'
    ],
    consejos: [
      'Aclimátate 2-3 días antes de ir a Machu Picchu',
      'El mate de coca ayuda con la altura',
      'Camina despacio los primeros días',
      'El Boleto Turístico incluye muchos sitios',
      'Los free walking tours son excelentes',
      'Prueba el cuy al horno',
      'El tren a Machu Picchu sale de Ollantaytambo',
      'Evita comidas pesadas los primeros días'
    ],
    que_llevar: [
      'Ropa en capas (mucho cambio de temperatura)',
      'Zapatos cómodos para empedrados',
      'Protector solar alto',
      'Sombrero y lentes',
      'Medicamento para altura',
      'Suéter o chamarra abrigada',
      'Pasaporte para sellar en Machu Picchu',
      'Efectivo en soles'
    ],
    emergencias: {
      policia: '105',
      turista: '084 235 123',
      hospital: 'Hospital Regional: +51 84 223 691',
      embajada: 'Embajada México Lima: +51 1 612 1300'
    }
  },
  'Ámsterdam': {
    que_hacer: [
      'Pasear en bici por los canales',
      'Visitar el Museo Van Gogh',
      'Explorar la Casa de Ana Frank',
      'Pasear por el Vondelpark',
      'Visitar el Rijksmuseum',
      'Recorrer el barrio Jordaan',
      'Probar queso holandés',
      'Ver los molinos de Zaanse Schans'
    ],
    consejos: [
      'Alquila una bicicleta para moverte',
      'Reserva la Casa de Ana Frank con mucha anticipación',
      'Los coffee shops tienen reglas específicas',
      'El I amsterdam City Card incluye museos y transporte',
      'Cuidado con las bicis cuando camines',
      'Los trenes conectan fácil con otras ciudades',
      'Prueba las bitterballen (croquetas)',
      'El clima es impredecible, lleva paraguas'
    ],
    que_llevar: [
      'Ropa impermeable',
      'Zapatos cómodos para andar en bici',
      'Capas de ropa',
      'Paraguas compacto',
      'Adaptador europeo tipo C/F',
      'Mochila pequeña',
      'Cámara fotográfica',
      'Candado para bici (si alquilas)'
    ],
    emergencias: {
      policia: '112',
      emergencias: '112',
      hospital: 'OLVG Hospital: +31 20 599 9111',
      embajada: 'Embajada México: +31 70 360 2900'
    }
  },
  'Costa Rica': {
    que_hacer: [
      'Visitar el Volcán Arenal',
      'Hacer canopy en Monteverde',
      'Relajarse en playas de Guanacaste',
      'Explorar el Parque Manuel Antonio',
      'Ver perezosos y monos en libertad',
      'Hacer rafting en Pacuare',
      'Visitar las aguas termales',
      'Hacer snorkel en Cahuita'
    ],
    consejos: [
      'Renta un 4x4 para carreteras rurales',
      'La temporada seca es de diciembre a abril',
      'Madruga para ver más fauna',
      'El colón y el dólar se aceptan',
      'Lleva binoculares para ver fauna',
      'Los "ticos" son muy amables, aprovecha para preguntar',
      'Contrata guías naturalistas locales',
      '"Pura vida" es el saludo local'
    ],
    que_llevar: [
      'Ropa ligera y secado rápido',
      'Botas de hiking impermeables',
      'Impermeable o poncho',
      'Repelente de insectos fuerte',
      'Binoculares',
      'Protector solar biodegradable',
      'Traje de baño',
      'Linterna frontal'
    ],
    emergencias: {
      policia: '911',
      emergencias: '911',
      hospital: 'Hospital CIMA: +506 2208 1000',
      embajada: 'Embajada México: +506 2257 0633'
    }
  },
  'Praga': {
    que_hacer: [
      'Cruzar el Puente de Carlos',
      'Visitar el Castillo de Praga',
      'Explorar la Plaza de la Ciudad Vieja',
      'Ver el Reloj Astronómico',
      'Pasear por el barrio judío',
      'Probar cerveza checa en una cervecería',
      'Visitar la catedral de San Vito',
      'Subir a la torre del reloj'
    ],
    consejos: [
      'El puente de Carlos es mágico al amanecer',
      'La cerveza es más barata que el agua',
      'Prueba el trdelník (pastel tradicional)',
      'El transporte público es excelente',
      'Lleva coronas checas, no euros',
      'Los free walking tours son muy buenos',
      'El castillo abre temprano, aprovecha',
      'Cuidado con cambistas callejeros'
    ],
    que_llevar: [
      'Zapatos cómodos para empedrados',
      'Abrigo (incluso en verano puede hacer frío)',
      'Paraguas',
      'Adaptador europeo tipo E',
      'Mochila pequeña',
      'Cámara fotográfica',
      'Guía de viaje',
      'Efectivo en coronas checas'
    ],
    emergencias: {
      policia: '158',
      emergencias: '112',
      hospital: 'Na Homolce Hospital: +420 257 271 111',
      embajada: 'Embajada México: +420 233 350 042'
    }
  },
  'Patagonia': {
    que_hacer: [
      'Visitar el Glaciar Perito Moreno',
      'Hacer trekking en Torres del Paine',
      'Navegar por los fiordos',
      'Ver pingüinos en Punta Tombo',
      'Explorar El Chaltén',
      'Visitar Ushuaia, el fin del mundo',
      'Avistar ballenas en Península Valdés',
      'Fotografiar el Fitz Roy'
    ],
    consejos: [
      'El clima es muy impredecible, prepárate para todo',
      'La temporada alta es de noviembre a marzo',
      'Reserva alojamiento con mucha anticipación',
      'El viento puede ser muy fuerte',
      'Las distancias son enormes, planifica bien',
      'Lleva efectivo, hay pocos cajeros',
      'Contrata tours con guías certificados',
      'El asado patagónico es imperdible'
    ],
    que_llevar: [
      'Ropa técnica en capas',
      'Cortavientos impermeable',
      'Botas de trekking impermeables',
      'Gorro, guantes y bufanda',
      'Lentes de sol',
      'Protector solar alto',
      'Bastones de trekking',
      'Binoculares para fauna'
    ],
    emergencias: {
      policia: '101',
      emergencias: '107',
      hospital: 'Hospital Calafate: +54 2902 491 001',
      embajada: 'Embajada México BA: +54 11 4821 7170'
    }
  }
};

// Función para actualizar destinos
function actualizarDestinos() {
  const updateStmt = db.prepare(`
    UPDATE destinos 
    SET que_hacer = ?, consejos = ?, que_llevar = ?, emergencias = ?
    WHERE nombre = ?
  `);

  let actualizados = 0;
  let noEncontrados = [];

  for (const [nombre, info] of Object.entries(destinosInfo)) {
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
    } else {
      noEncontrados.push(nombre);
    }
  }

  console.log(`\n📊 RESUMEN:`);
  console.log(`   ✅ Destinos actualizados: ${actualizados}`);
  
  if (noEncontrados.length > 0) {
    console.log(`   ⚠️ No encontrados en la BD: ${noEncontrados.join(', ')}`);
  }
}

// Verificar qué destinos existen en la BD
function mostrarDestinosExistentes() {
  const destinos = db.prepare('SELECT id, nombre FROM destinos ORDER BY nombre').all();
  console.log('\n📍 Destinos en la base de datos:');
  destinos.forEach(d => console.log(`   - ${d.nombre} (ID: ${d.id})`));
  console.log(`   Total: ${destinos.length}\n`);
  return destinos;
}

// Ejecutar
console.log('='.repeat(50));
mostrarDestinosExistentes();
console.log('='.repeat(50));
console.log('\n🔄 Actualizando información de destinos...\n');
actualizarDestinos();
console.log('\n='.repeat(50));
console.log('✨ Proceso completado');

db.close();
