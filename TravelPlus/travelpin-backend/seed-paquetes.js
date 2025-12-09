const db = require('better-sqlite3')('BDTravelPin.db');

console.log('=== Insertando paquetes de prueba ===');

// Obtener las agencias existentes
const agencias = db.prepare('SELECT id, nombre FROM agencias').all();
console.log('Agencias:', agencias.map(a => `${a.id}: ${a.nombre}`).join(', '));

// Obtener los destinos existentes
const destinos = db.prepare('SELECT id, nombre FROM destinos').all();
console.log('Destinos:', destinos.map(d => `${d.id}: ${d.nombre}`).join(', '));

// Verificar si ya existen paquetes
const paquetesExistentes = db.prepare('SELECT COUNT(*) as count FROM paquetes').get();
console.log('Paquetes existentes:', paquetesExistentes.count);

if (paquetesExistentes.count === 0) {
  // Insertar paquetes
  const insertPaquete = db.prepare(`
    INSERT INTO paquetes (agencia_id, nombre, precio, duracion, incluye, itinerario, gastos)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertPaqueteDestino = db.prepare(`
    INSERT INTO paquete_destinos (paquete_id, destino_id, orden)
    VALUES (?, ?, ?)
  `);

  // Paquete 1: Viajes Globales - París Romántico
  const p1 = insertPaquete.run(
    11, // Viajes Globales
    'París Romántico - 5 días',
    15000,
    '5 días / 4 noches',
    JSON.stringify(['Vuelo redondo', 'Hotel 4 estrellas', 'Desayunos incluidos', 'Tour Torre Eiffel', 'Crucero por el Sena']),
    JSON.stringify([
      { dia: 1, actividades: 'Llegada a París. Transfer al hotel y recorrido por Montmartre' },
      { dia: 2, actividades: 'Torre Eiffel y Museo del Louvre. Visita guiada' },
      { dia: 3, actividades: 'Excursión al Palacio de Versalles' },
      { dia: 4, actividades: 'Crucero por el Sena y tarde libre para compras' },
      { dia: 5, actividades: 'Transfer al aeropuerto. Fin del viaje' }
    ]),
    JSON.stringify([
      { concepto: 'Vuelo redondo', monto: 8000 },
      { concepto: 'Hotel 4 noches', monto: 4000 },
      { concepto: 'Tours y entradas', monto: 2000 },
      { concepto: 'Transfers', monto: 1000 }
    ])
  );
  // Asignar destino París (buscar el ID)
  const paris = destinos.find(d => d.nombre.toLowerCase().includes('par'));
  if (paris) {
    insertPaqueteDestino.run(p1.lastInsertRowid, paris.id, 0);
  }
  console.log('Paquete 1 creado: París Romántico');

  // Paquete 2: Aventura Total - Machu Picchu
  const p2 = insertPaquete.run(
    12, // Aventura Total
    'Aventura Inca - 4 días',
    12000,
    '4 días / 3 noches',
    JSON.stringify(['Vuelo Lima-Cusco', 'Hotel en Cusco', 'Tren a Aguas Calientes', 'Entrada a Machu Picchu', 'Guía especializado']),
    JSON.stringify([
      { dia: 1, actividades: 'Llegada a Cusco. Aclimatación y city tour' },
      { dia: 2, actividades: 'Valle Sagrado: Pisac y Ollantaytambo' },
      { dia: 3, actividades: 'Visita guiada a Machu Picchu' },
      { dia: 4, actividades: 'Regreso a Lima. Transfer al aeropuerto' }
    ]),
    JSON.stringify([
      { concepto: 'Vuelos', monto: 4000 },
      { concepto: 'Hotel 3 noches', monto: 2500 },
      { concepto: 'Tren turístico', monto: 3000 },
      { concepto: 'Entradas y guía', monto: 2500 }
    ])
  );
  const machu = destinos.find(d => d.nombre.toLowerCase().includes('machu'));
  if (machu) {
    insertPaqueteDestino.run(p2.lastInsertRowid, machu.id, 0);
  }
  console.log('Paquete 2 creado: Aventura Inca');

  // Paquete 3: Playas Paradisíacas - Maldivas
  const p3 = insertPaquete.run(
    13, // Playas Paradisíacas
    'Maldivas All Inclusive - 7 días',
    35000,
    '7 días / 6 noches',
    JSON.stringify(['Vuelo internacional', 'Resort 5 estrellas', 'Todo incluido', 'Spa', 'Actividades acuáticas']),
    JSON.stringify([
      { dia: 1, actividades: 'Llegada. Transfer al resort en lancha privada' },
      { dia: 2, actividades: 'Día libre en la playa privada' },
      { dia: 3, actividades: 'Tour de snorkel en arrecife de coral' },
      { dia: 4, actividades: 'Tratamiento de spa incluido' },
      { dia: 5, actividades: 'Pesca deportiva y cena en la playa' },
      { dia: 6, actividades: 'Día libre para actividades opcionales' },
      { dia: 7, actividades: 'Transfer al aeropuerto' }
    ]),
    JSON.stringify([
      { concepto: 'Vuelo internacional', monto: 15000 },
      { concepto: 'Resort 6 noches', monto: 12000 },
      { concepto: 'Todo incluido', monto: 6000 },
      { concepto: 'Actividades y spa', monto: 2000 }
    ])
  );
  const maldivas = destinos.find(d => d.nombre.toLowerCase().includes('maldiv'));
  if (maldivas) {
    insertPaqueteDestino.run(p3.lastInsertRowid, maldivas.id, 0);
  }
  console.log('Paquete 3 creado: Maldivas All Inclusive');

  // Paquete 4: City Tours Pro - Tokio
  const p4 = insertPaquete.run(
    14, // City Tours Pro
    'Tokio Express - 6 días',
    18000,
    '6 días / 5 noches',
    JSON.stringify(['Vuelo redondo', 'Hotel céntrico', 'Japan Rail Pass', 'Tours guiados', 'Desayunos']),
    JSON.stringify([
      { dia: 1, actividades: 'Llegada a Tokio. Transfer al hotel' },
      { dia: 2, actividades: 'Shibuya, Harajuku y templo Meiji' },
      { dia: 3, actividades: 'Asakusa, Senso-ji y Tokyo Skytree' },
      { dia: 4, actividades: 'Excursión al Monte Fuji' },
      { dia: 5, actividades: 'Akihabara y Ginza. Tarde libre' },
      { dia: 6, actividades: 'Transfer al aeropuerto' }
    ]),
    JSON.stringify([
      { concepto: 'Vuelo redondo', monto: 10000 },
      { concepto: 'Hotel 5 noches', monto: 4000 },
      { concepto: 'Japan Rail Pass', monto: 2000 },
      { concepto: 'Tours y entradas', monto: 2000 }
    ])
  );
  const tokio = destinos.find(d => d.nombre.toLowerCase().includes('tok'));
  if (tokio) {
    insertPaqueteDestino.run(p4.lastInsertRowid, tokio.id, 0);
  }
  console.log('Paquete 4 creado: Tokio Express');

  // Paquete 5: Lujo Travel - Santorini
  const p5 = insertPaquete.run(
    15, // Lujo Travel
    'Santorini de Lujo - 5 días',
    25000,
    '5 días / 4 noches',
    JSON.stringify(['Vuelo business', 'Suite con vista al mar', 'Cenas gourmet', 'Tour en yate', 'Cata de vinos']),
    JSON.stringify([
      { dia: 1, actividades: 'Llegada a Santorini. Transfer al hotel boutique' },
      { dia: 2, actividades: 'Tour por Oia y atardecer' },
      { dia: 3, actividades: 'Tour en yate privado por la caldera' },
      { dia: 4, actividades: 'Cata de vinos y cena gourmet' },
      { dia: 5, actividades: 'Transfer al aeropuerto' }
    ]),
    JSON.stringify([
      { concepto: 'Vuelo business', monto: 12000 },
      { concepto: 'Suite 4 noches', monto: 8000 },
      { concepto: 'Experiencias de lujo', monto: 5000 }
    ])
  );
  const santorini = destinos.find(d => d.nombre.toLowerCase().includes('santorin'));
  if (santorini) {
    insertPaqueteDestino.run(p5.lastInsertRowid, santorini.id, 0);
  }
  console.log('Paquete 5 creado: Santorini de Lujo');

  console.log('\n✅ Paquetes de prueba insertados exitosamente');
} else {
  console.log('Ya existen paquetes en la BD');
}

// Mostrar paquetes
console.log('\n=== Paquetes en la BD ===');
const paquetes = db.prepare(`
  SELECT p.*, GROUP_CONCAT(d.nombre) as destinos_nombres
  FROM paquetes p
  LEFT JOIN paquete_destinos pd ON p.id = pd.paquete_id
  LEFT JOIN destinos d ON pd.destino_id = d.id
  GROUP BY p.id
`).all();

paquetes.forEach(p => {
  console.log(`- ${p.nombre} ($${p.precio}) - Agencia ID: ${p.agencia_id} - Destinos: ${p.destinos_nombres || 'ninguno'}`);
});
