const fs = require('fs');

async function fetchVillageDetails() {
  const query = `
    [out:json][timeout:30];
    (
      way["aerialway"](45.505,6.700,45.518,6.718);
      way["highway"~"pedestrian|steps|footway|residential"](45.508,6.702,45.516,6.715);
    );
    out body;
    >;
    out skel qt;
  `;

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
      fs.writeFileSync('belleplagne_infrastructure.json', JSON.stringify(data, null, 2));
      console.log('Saved infrastructure elements:', data.elements.length);

      const nodes = new Map();
      data.elements.filter(e => e.type === 'node').forEach(n => nodes.set(n.id, [n.lon, n.lat]));

      const ways = data.elements.filter(e => e.type === 'way');
      const lines = [];

      for (const w of ways) {
        const coords = w.nodes.map(id => nodes.get(id)).filter(Boolean);
        if (coords.length < 2) continue;
        const tags = w.tags || {};
        lines.push({
          type: 'Feature',
          properties: {
            name: tags.name || '',
            type: tags.aerialway ? 'lift' : 'path',
            aerialway: tags.aerialway || '',
            highway: tags.highway || ''
          },
          geometry: {
            type: 'LineString',
            coordinates: coords
          }
        });
      }

      fs.writeFileSync('src/data/belleplagne_paths.json', JSON.stringify({
        type: 'FeatureCollection',
        features: lines
      }, null, 2));
      console.log('Saved', lines.length, 'infrastructure paths/lines to src/data/belleplagne_paths.json');
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

fetchVillageDetails();
