import urllib.request
import json

query = """
[out:json][timeout:25];
(
  way["aerialway"]["name"~"Arpette",i](45.48,6.65,45.55,6.75);
  relation["aerialway"]["name"~"Arpette",i](45.48,6.65,45.55,6.75);
);
out body;
>;
out skel qt;
"""

import urllib.parse
post_data = urllib.parse.urlencode({'data': query}).encode('utf-8')
req = urllib.request.Request('https://overpass-api.de/api/interpreter', data=post_data, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
res = urllib.request.urlopen(req)
data = json.loads(res.read().decode('utf-8'))

with open('arpette_raw.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f"Total elements: {len(data['elements'])}")
for el in data['elements']:
    tags = el.get('tags', {})
    if 'name' in tags or 'aerialway' in tags:
        print(el.get('type'), el.get('id'), tags)
