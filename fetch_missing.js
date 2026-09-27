const fs = require('fs');

const MISSING_ZONES = [
  { name: 'Plagne Centre et Aime 2000', bbox: '45.502,6.664,45.516,6.680' },
  { name: 'Plagne Bellecote', bbox: '45.506,6.690,45.514,6.703' },
  { name: 'Plagne 1800', bbox: '45.508,6.656,45.516,6.666' },
  { name: 'Plagne Soleil et Villages', bbox: '45.504,6.678,45.512,6.690' },
  { name: 'Montchavin et Les Coches', bbox: '45.548,6.720,45.565,6.745' }
];

async function fetchZone(zone) {
  const query = `
    [out:json][timeout:25];
    (
      way["building"](${zone.bbox});
    );
    out body;
    >;
    out skel qt;
  `;

  console.log(`Fetching ${zone.name}...`);
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Plagne3DApp/1.0'
      },
      body: 'data=' + encodeURIComponent(query)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`-> Received ${data.elements.length} elements for ${zone.name}`);
      return data;
    } else {
      console.warn(`Failed ${zone.name} with HTTP ${res.status}`);
    }
  } catch (e) {
    console.error(`Error for ${zone.name}:`, e.message);
  }
  return { elements: [] };
}

async function run() {
  const existingGeoJSON = JSON.parse(fs.readFileSync('src/data/all_villages_buildings.json', 'utf8'));

  // Ajouter également Belle Plagne
  if (fs.existsSync('src/data/belleplagne_buildings.json')) {
    const bp = JSON.parse(fs.readFileSync('src/data/belleplagne_buildings.json', 'utf8'));
    bp.features.forEach(f => {
      f.properties.village = 'Belle Plagne';
      existingGeoJSON.features.push(f);
    });
  }

  const existingIds = new Set(existingGeoJSON.features.map(f => f.properties.id || f.id));
  console.log(`Starting with ${existingGeoJSON.features.length} existing buildings`);

  const allNodes = new Map();
  const allWays = [];

  for (const zone of MISSING_ZONES) {
    const data = await fetchZone(zone);
    data.elements.filter(e => e.type === 'node').forEach(n => allNodes.set(n.id, [n.lon, n.lat]));
    data.elements.filter(e => e.type === 'way' && e.tags && e.tags.building).forEach(w => allWays.push(w));
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`New ways to convert: ${allWays.length}`);

  function getVillageInfo(lon, lat, name) {
    if (lat > 45.511 && lat < 45.516 && lon > 6.666 && lon < 6.675) {
      return { village: 'Plagne Aime 2000', defaultHeight: 32, color: '#334155' };
    }
    if (lat > 45.503 && lat < 45.510 && lon > 6.670 && lon < 6.680) {
      return { village: 'Plagne Centre', defaultHeight: 18, color: '#475569' };
    }
    if (lat > 45.507 && lat < 45.514 && lon > 6.690 && lon < 6.702) {
      return { village: 'Plagne Bellecôte', defaultHeight: 22, color: '#3b4252' };
    }
    if (lat > 45.508 && lat < 45.515 && lon > 6.657 && lon < 6.667) {
      return { village: 'Plagne 1800', defaultHeight: 12, color: '#526071' };
    }
    if (lat > 45.504 && lat < 45.512 && lon > 6.680 && lon < 6.691) {
      return { village: 'Plagne Soleil & Villages', defaultHeight: 14, color: '#4c566a' };
    }
    if (lat > 45.556) {
      return { village: 'Montchavin', defaultHeight: 12, color: '#57534e' };
    }
    if (lat > 45.545) {
      return { village: 'Les Coches', defaultHeight: 13, color: '#44403c' };
    }
    return { village: 'La Plagne', defaultHeight: 12, color: '#475569' };
  }

  for (const way of allWays) {
    if (existingIds.has(way.id)) continue;
    existingIds.add(way.id);

    const coords = way.nodes.map(id => allNodes.get(id)).filter(Boolean);
    if (coords.length < 3) continue;

    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push([...first]);
    }

    const tags = way.tags || {};
    const name = tags.name || tags['addr:housename'] || '';

    const avgLon = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const info = getVillageInfo(avgLon, avgLat, name);

    let levels = parseInt(tags['building:levels'], 10);
    let height = parseFloat(tags.height);

    if (isNaN(height)) {
      if (!isNaN(levels)) {
        height = levels * 3.3;
      } else {
        if (info.village === 'Plagne Aime 2000' && coords.length > 8) {
          height = 34; // Grand Paquebot des Neiges d'Aime 2000
        } else if (info.village === 'Plagne Bellecôte' && coords.length > 8) {
          height = 24; // Grands ensembles de Bellecôte
        } else if (name.length > 0) {
          height = info.defaultHeight + 4;
        } else {
          height = info.defaultHeight;
        }
      }
    }

    existingGeoJSON.features.push({
      type: 'Feature',
      id: way.id,
      properties: {
        id: way.id,
        name: name,
        village: info.village,
        height: height,
        base_height: 0,
        color: info.color
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    });
  }

  console.log(`\n🎉 Total 3D buildings count across ALL 11 villages: ${existingGeoJSON.features.length}`);

  const stats = {};
  existingGeoJSON.features.forEach(f => {
    const v = f.properties.village || 'Autre';
    stats[v] = (stats[v] || 0) + 1;
  });
  console.log('Building distribution by village:');
  Object.entries(stats).forEach(([k, v]) => console.log(`  - ${k}: ${v} bâtiments`));

  fs.writeFileSync('src/data/all_villages_buildings.json', JSON.stringify(existingGeoJSON, null, 2));
  console.log('Saved to src/data/all_villages_buildings.json');
}

run();
