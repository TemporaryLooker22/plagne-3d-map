const fs = require('fs');

const osmData = JSON.parse(fs.readFileSync('belleplagne_osm.json', 'utf8'));

const nodes = new Map();
osmData.elements.filter(e => e.type === 'node').forEach(n => {
  nodes.set(n.id, [n.lon, n.lat]);
});

const buildingWays = osmData.elements.filter(e => e.type === 'way' && e.tags && e.tags.building);

const features = [];

for (const way of buildingWays) {
  const coords = way.nodes.map(id => nodes.get(id)).filter(Boolean);
  if (coords.length < 3) continue;

  // Assurer la fermeture du polygone
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([...first]);
  }

  const tags = way.tags || {};
  const name = tags.name || tags['addr:housename'] || '';

  // Estimation réaliste de la hauteur en mètres selon l'architecture de Belle Plagne
  let levels = parseInt(tags['building:levels'], 10);
  let height = parseFloat(tags.height);

  if (isNaN(height)) {
    if (!isNaN(levels)) {
      height = levels * 3.2; // 3.2m par étage avec toiture savoyarde
    } else {
      // Déterminer la hauteur selon la renommée ou la surface
      if (name.includes('Balcons') || name.includes('Carlina') || name.includes('Deux Domaines') || name.includes('W 2050')) {
        height = 19;
      } else if (name.includes('Vacances Bleues') || name.includes('Centaure') || name.includes('Odalys')) {
        height = 16;
      } else if (name.includes('Montagnette')) {
        height = 11;
      } else if (name.length > 0) {
        height = 14;
      } else {
        // Chalet standard ou bâtiment de service
        const perimeterArea = coords.length;
        height = perimeterArea > 6 ? 12 : 8;
      }
    }
  }

  // Palette architecturale : tons bois de mélèze, pierre de taille et ardoise
  let color = '#475569'; // Ardoise / pierre par défaut
  if (name.includes('Balcons') || name.includes('Montagnette')) {
    color = '#64748b'; // Bois grisé de montagne
  } else if (name.includes('Carlina') || name.includes('Centaure')) {
    color = '#334155'; // Ardoise foncée élégante
  } else if (name.length > 0) {
    color = '#4b5563'; // Chalet savoyard
  }

  features.push({
    type: 'Feature',
    id: way.id,
    properties: {
      id: way.id,
      name: name,
      height: height,
      base_height: 0,
      color: color,
      type: name.length > 0 ? 'residence' : 'chalet'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    }
  });
}

const geojson = {
  type: 'FeatureCollection',
  features: features
};

console.log('Total 3D building polygons created:', features.length);
fs.writeFileSync('src/data/belleplagne_buildings.json', JSON.stringify(geojson, null, 2));
console.log('Saved to src/data/belleplagne_buildings.json');
