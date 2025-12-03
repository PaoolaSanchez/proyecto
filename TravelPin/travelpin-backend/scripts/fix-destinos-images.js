// Script para eliminar duplicados y actualizar imágenes de destinos
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'BDTravelPin.db');
const db = new Database(dbPath);

console.log('🚀 Limpiando duplicados y actualizando imágenes...\n');

// Duplicados a eliminar (mantener el que tiene más datos)
const duplicadosAEliminar = [
  48,  // Bali duplicado
  43,  // Barcelona duplicado
  37,  // Cancún duplicado
  58,  // Dubái duplicado (mantener Dubai 34)
  51,  // Machu Picchu duplicado
  59,  // Maldivas duplicado
  57,  // Nueva York duplicado
  42,  // París duplicado
  47   // Tokio duplicado
];

// Eliminar duplicados
console.log('🗑️ Eliminando destinos duplicados...');
duplicadosAEliminar.forEach(id => {
  try {
    // Primero eliminar referencias en paquete_destinos
    db.prepare('DELETE FROM paquete_destinos WHERE destino_id = ?').run(id);
    // Luego eliminar el destino
    const result = db.prepare('DELETE FROM destinos WHERE id = ?').run(id);
    if (result.changes > 0) {
      console.log(`   ✅ Eliminado destino ID: ${id}`);
    }
  } catch (err) {
    console.log(`   ⚠️ Error eliminando ID ${id}: ${err.message}`);
  }
});

// Imágenes actualizadas con galerías para destinos específicos
const imagenesActualizadas = {
  'Cancún': {
    imagen: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=600',
      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=600',
      'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=600',
      'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=600',
      'https://images.unsplash.com/photo-1535261816923-5a0e0b4e0e72?w=600'
    ]
  },
  'Barcelona': {
    imagen: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600',
      'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600'
    ]
  },
  'Estambul': {
    imagen: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600',
      'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600',
      'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=600',
      'https://images.unsplash.com/photo-1621264448280-37e40ebe0ce7?w=600'
    ]
  },
  'Dubai': {
    imagen: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600',
      'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600',
      'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=600',
      'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600'
    ]
  },
  'Riviera Maya': {
    imagen: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=600',
      'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=600',
      'https://images.unsplash.com/photo-1504730655501-24c39eda5a68?w=600',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600',
      'https://images.unsplash.com/photo-1682685797660-3d847763208e?w=600'
    ]
  },
  'Kioto': {
    imagen: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600',
      'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=600',
      'https://images.unsplash.com/photo-1558862107-d49ef2a04d72?w=600'
    ]
  },
  'Cartagena': {
    imagen: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1583531352515-8884af319dc1?w=600',
      'https://images.unsplash.com/photo-1595883611208-7a807c9f3cca?w=600',
      'https://images.unsplash.com/photo-1558029137-a65c1e18b1b5?w=600',
      'https://images.unsplash.com/photo-1579687196544-08a17a56b2f1?w=600',
      'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=600'
    ]
  },
  'Islas Galápagos': {
    imagen: 'https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=600',
      'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600',
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600',
      'https://images.unsplash.com/photo-1591025207163-942350e47db2?w=600',
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600'
    ]
  },
  'Costa Rica': {
    imagen: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=600',
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600',
      'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=600',
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600',
      'https://images.unsplash.com/photo-1605216663739-05cdaa56ec20?w=600'
    ]
  },
  'Isla Mujeres': {
    imagen: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600',
      'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600'
    ]
  },
  // Actualizar también otros destinos populares con galerías
  'París': {
    imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600',
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600',
      'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=600'
    ]
  },
  'Tokio': {
    imagen: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600',
      'https://images.unsplash.com/photo-1549693578-d683be217e58?w=600',
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600'
    ]
  },
  'Roma': {
    imagen: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600',
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600',
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600'
    ]
  },
  'Nueva York': {
    imagen: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600',
      'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600',
      'https://images.unsplash.com/photo-1522083165195-3424ed129620?w=600',
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600'
    ]
  },
  'Bali': {
    imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600',
      'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=600',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600'
    ]
  },
  'Machu Picchu': {
    imagen: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600',
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600',
      'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=600',
      'https://images.unsplash.com/photo-1548963670-aaaa8f73a5e3?w=600',
      'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=600'
    ]
  },
  'Maldivas': {
    imagen: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
      'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=600',
      'https://images.unsplash.com/photo-1578922746465-3a80a228f223?w=600'
    ]
  },
  'Santorini': {
    imagen: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600',
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600',
      'https://images.unsplash.com/photo-1601581875039-e899893d520c?w=600',
      'https://images.unsplash.com/photo-1560703650-ef3e0f254ae0?w=600'
    ]
  },
  'Londres': {
    imagen: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600',
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600',
      'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600',
      'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=600',
      'https://images.unsplash.com/photo-1494922275316-7d725a574e06?w=600'
    ]
  },
  'Tulum': {
    imagen: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=600',
      'https://images.unsplash.com/photo-1504730655501-24c39eda5a68?w=600',
      'https://images.unsplash.com/photo-1682695795931-a546b3238b13?w=600',
      'https://images.unsplash.com/photo-1571629711070-cdf4960e5b21?w=600',
      'https://images.unsplash.com/photo-1502758895806-6e0a5b10a4e6?w=600'
    ]
  },
  'Cusco': {
    imagen: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600',
      'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=600',
      'https://images.unsplash.com/photo-1574610904882-975c5a2a8929?w=600',
      'https://images.unsplash.com/photo-1548963670-aaaa8f73a5e3?w=600',
      'https://images.unsplash.com/photo-1569940159292-bc7c7a7a3148?w=600'
    ]
  },
  'Patagonia': {
    imagen: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600',
      'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=600',
      'https://images.unsplash.com/photo-1508005244338-f7a534c0dee8?w=600',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600'
    ]
  },
  'Buenos Aires': {
    imagen: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=600',
      'https://images.unsplash.com/photo-1518609571773-39b7d303a87b?w=600',
      'https://images.unsplash.com/photo-1580755485016-1bf13e99ccb2?w=600',
      'https://images.unsplash.com/photo-1588003497155-d45d5bb7a20e?w=600',
      'https://images.unsplash.com/photo-1536086845277-eb1e762cf654?w=600'
    ]
  },
  'Ámsterdam': {
    imagen: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600',
      'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=600',
      'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=600',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600',
      'https://images.unsplash.com/photo-1584003564911-a89e1f1c1b84?w=600'
    ]
  },
  'Praga': {
    imagen: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600',
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=600',
      'https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=600',
      'https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=600',
      'https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600'
    ]
  },
  'Sydney': {
    imagen: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600',
      'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600',
      'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?w=600',
      'https://images.unsplash.com/photo-1530276371031-2511efff91bb?w=600',
      'https://images.unsplash.com/photo-1524293568345-75d62c3664f7?w=600'
    ]
  },
  'Bangkok': {
    imagen: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
      'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600',
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600'
    ]
  },
  'Singapur': {
    imagen: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600',
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=600',
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600',
      'https://images.unsplash.com/photo-1496939376851-89342e90adcd?w=600',
      'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=600'
    ]
  },
  'Río de Janeiro': {
    imagen: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600',
      'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=600',
      'https://images.unsplash.com/photo-1544989164-31dc3c645987?w=600',
      'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=600',
      'https://images.unsplash.com/photo-1551887373-6edba6dacbb1?w=600'
    ]
  },
  'Ciudad de México': {
    imagen: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600',
      'https://images.unsplash.com/photo-1518659526054-190340b32735?w=600',
      'https://images.unsplash.com/photo-1574492844028-5eb9e10a59a1?w=600',
      'https://images.unsplash.com/photo-1558612378-4dff66b1f7f1?w=600',
      'https://images.unsplash.com/photo-1613500241667-0c47f4e54f89?w=600'
    ]
  },
  'Oaxaca': {
    imagen: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600',
      'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=600',
      'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=600',
      'https://images.unsplash.com/photo-1510152651327-f9c7c6e1f0cb?w=600',
      'https://images.unsplash.com/photo-1570737543098-0983d88f796d?w=600'
    ]
  },
  'Playa del Carmen': {
    imagen: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=600',
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600',
      'https://images.unsplash.com/photo-1504730655501-24c39eda5a68?w=600',
      'https://images.unsplash.com/photo-1535262412227-85541e910204?w=600',
      'https://images.unsplash.com/photo-1573780063691-6f7f7a8c4de6?w=600'
    ]
  },
  'Guadalajara': {
    imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    imagen_principal: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
    imagenes_galeria: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600',
      'https://images.unsplash.com/photo-1518659526054-190340b32735?w=600',
      'https://images.unsplash.com/photo-1574492844028-5eb9e10a59a1?w=600',
      'https://images.unsplash.com/photo-1570737543098-0983d88f796d?w=600'
    ]
  }
};

// Actualizar imágenes
console.log('\n🖼️ Actualizando imágenes de destinos...');
const updateStmt = db.prepare(`
  UPDATE destinos 
  SET imagen = ?, imagen_principal = ?, imagenes_galeria = ?
  WHERE nombre = ?
`);

let actualizados = 0;
for (const [nombre, datos] of Object.entries(imagenesActualizadas)) {
  const result = updateStmt.run(
    datos.imagen,
    datos.imagen_principal,
    JSON.stringify(datos.imagenes_galeria),
    nombre
  );
  if (result.changes > 0) {
    actualizados++;
    console.log(`   ✅ ${nombre} actualizado con ${datos.imagenes_galeria.length} imágenes`);
  }
}

// Mostrar resumen final
console.log('\n' + '='.repeat(50));
const total = db.prepare('SELECT COUNT(*) as total FROM destinos').get();
const conGaleria = db.prepare("SELECT COUNT(*) as total FROM destinos WHERE imagenes_galeria IS NOT NULL AND imagenes_galeria != '[]'").get();
console.log('📊 RESUMEN FINAL:');
console.log(`   Total destinos: ${total.total}`);
console.log(`   Destinos con galería de imágenes: ${conGaleria.total}`);
console.log(`   Duplicados eliminados: ${duplicadosAEliminar.length}`);
console.log(`   Destinos actualizados: ${actualizados}`);
console.log('='.repeat(50));

db.close();
console.log('\n✨ Proceso completado');
