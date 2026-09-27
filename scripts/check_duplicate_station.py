import json

with open('public/data/all_villages_buildings.json', 'r', encoding='utf-8') as f:
    villages = json.load(f)

found = []
for feat in villages['features']:
    props = feat.get('properties', {})
    name = props.get('name', '').lower()
    if 'arpette' in name or props.get('id') in ['224261269', '224261270']:
        found.append(props)

print(f"Found {len(found)} matching buildings in all_villages_buildings.json:")
for f in found:
    print(f)
