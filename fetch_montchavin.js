const fs = require('fs');

async function fetchMontchavin() {
  console.log('Waiting 3s for rate limit to clear...');
  await new Promise(r => setTimeout(r, 3000));
  const query = `
    [out:json][timeout:30];
    (
      way["building"](45.548,6.720,45.565,6.745);
    );
    out body;
    >;
    out skel qt;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Plagne3DApp2/1.0'
    },
    body: 'data=' + encodeURIComponent(query)
  });

  if (res.ok) {
    const data = await res.json();
    console.log('Received elements for Montchavin/Les Coches:', data.elements.length);

    const existingGeoJSON = JSON.parse(fs.readFileSync('src/data/all_villages_buildings.json', 'utf8'));
    const existingIds = new Set(existingGeoJSON.features.map(f => f.properties.id || f.id));

    const nodes = new Map();
    data.elements.filter(e => e.type === 'node').forEach(n => nodes.set(n.id, [n.lon, n.lat]));
    const ways = data.elements.filter(e => e.type === 'way' && e.tags && e.tags.building);

    let added = 0;
    for (const way of ways) {
      if (existingIds.has(way.id)) continue;
      existingIds.add(way.id);

      const coords = way.nodes.map(id => nodes.get(id)).filter(Boolean);
      if (coords.length < 3) continue;

      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push([...first]);
      }

      const tags = way.tags || {};
      const name = tags.name || tags['addr:housename'] || '';
      const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      const isMontchavin = avgLat > 45.556;

      existingGeoJSON.features.push({
        type: 'Feature',
        id: way.id,
        properties: {
          id: way.id,
          name: name,
          village: isMontchavin ? 'Montchavin' : 'Les Coches',
          height: isMontchavin ? 12 : 13,
          base_height: 0,
          color: isMontchavin ? '#57534e' : '#44403c'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      });
      added++;
    }

    console.log(`Added ${added} buildings for Montchavin and Les Coches!`);
    console.log(`Total 3D buildings across all 11 stations: ${existingGeoJSON.features.length}`);
    fs.writeFileSync('src/data/all_villages_buildings.json', JSON.stringify(existingGeoJSON, null, 2));
  } else {
    console.log('Failed:', res.status);
  }
}

fetchMontchavin();
