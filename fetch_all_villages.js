const fs = require('fs');

async function fetchAllVillages() {
  console.log('Querying Overpass API for all La Plagne villages buildings...');

  // Requête couvrant l'ensemble du domaine de La Plagne (toutes les stations d'altitude et stations villages)
  // Bounding box: Sud (Champagny 45.44) à Nord (Montchavin 45.57), Ouest (Montalbert 6.62) à Est (Belle Plagne 6.75)
  const query = `
    [out:json][timeout:60];
    (
      way["building"](45.44, 6.62, 45.57, 6.75);
      relation["building"](45.44, 6.62, 45.57, 6.75);
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
        fs.writeFileSync('all_plagne_osm.json', text);
        console.log('Successfully saved OSM data, file size:', (text.length / 1024 / 1024).toFixed(2), 'MB');
        return;
      } else {
        console.log('Endpoint responded with status:', res.status);
      }
    } catch (e) {
      console.error('Error contacting', url, e.message);
    }
  }
}

fetchAllVillages();
