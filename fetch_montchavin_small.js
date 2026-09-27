const fs = require('fs');

async function fetchSmall(name, bbox) {
  const query = `[out:json][timeout:15];(way["building"](${bbox}););out body;>;out skel qt;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Plagne3D/2.0' },
    body: 'data=' + encodeURIComponent(query)
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`${name}: ${data.elements.length} elements`);
    return data;
  }
  console.log(`${name} failed:`, res.status);
  return { elements: [] };
}

async function run() {
  const m = await fetchSmall('Montchavin', '45.557,6.733,45.564,6.744');
  await new Promise(r => setTimeout(r, 1000));
  const c = await fetchSmall('Les Coches', '45.550,6.726,45.556,6.735');

  const all = [...m.elements, ...c.elements];
  const nodes = new Map();
  all.filter(e => e.type === 'node').forEach(n => nodes.set(n.id, [n.lon, n.lat]));
  const ways = all.filter(e => e.type === 'way' && e.tags && e.tags.building);

  const existingGeoJSON = JSON.parse(fs.readFileSync('src/data/all_villages_buildings.json', 'utf8'));
  const existingIds = new Set(existingGeoJSON.features.map(f => f.properties.id || f.id));

  let added = 0;
  for (const way of ways) {
    if (existingIds.has(way.id)) continue;
    existingIds.add(way.id);

    const coords = way.nodes.map(id => nodes.get(id)).filter(Boolean);
    if (coords.length < 3) continue;

    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push([...first]);

    const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    const isMontchavin = avgLat > 45.556;

    existingGeoJSON.features.push({
      type: 'Feature',
      id: way.id,
      properties: {
        id: way.id,
        name: way.tags.name || '',
        village: isMontchavin ? 'Montchavin' : 'Les Coches',
        height: isMontchavin ? 12 : 14,
        base_height: 0,
        color: isMontchavin ? '#57534e' : '#44403c'
      },
      geometry: { type: 'Polygon', coordinates: [coords] }
    });
    added++;
  }

  console.log(`Added ${added} buildings for Montchavin and Les Coches!`);
  console.log(`Total 3D buildings: ${existingGeoJSON.features.length}`);
  fs.writeFileSync('src/data/all_villages_buildings.json', JSON.stringify(existingGeoJSON, null, 2));
}

run();
