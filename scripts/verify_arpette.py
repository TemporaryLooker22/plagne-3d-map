import json

for fname in ['public/data/arpette_3d_structures.json', 'public/data/arpette_cables.json', 'public/data/arpette_labels.json']:
    with open(fname, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"{fname}: {len(data['features'])} features, valid JSON OK")
    for feat in data['features'][:3]:
        print("  Sample:", feat['properties']['name'] if 'name' in feat['properties'] else feat['properties'].get('title'), feat['geometry']['type'])
