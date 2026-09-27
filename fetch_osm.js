const fs = require('fs');

async function fetchBuildings() {
  const query = `
    [out:json][timeout:30];
    (
      way["building"](45.506,6.702,45.518,6.716);
      relation["building"](45.506,6.702,45.518,6.716);
    );
    out body;
    >;
    out skel qt;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  for (const url of endpoints) {
    try {
      console.log('Trying', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Plagne3DApp/1.0'
        },
        body: 'data=' + encodeURIComponent(query)
      });
      if (res.ok) {
        const text = await res.text();
        fs.writeFileSync('belleplagne_osm.json', text);
        console.log('Saved OSM data, length:', text.length);
        return;
      } else {
        console.log('Failed:', res.status, res.statusText);
      }
    } catch (e) {
      console.error('Error on', url, e.message);
    }
  }
}

fetchBuildings();
