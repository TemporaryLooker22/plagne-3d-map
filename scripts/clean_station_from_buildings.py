import json

with open('public/data/all_villages_buildings.json', 'r', encoding='utf-8') as f:
    villages = json.load(f)

before_count = len(villages['features'])
villages['features'] = [
    feat for feat in villages['features']
    if feat.get('properties', {}).get('id') not in [224261269, 224261270, '224261269', '224261270']
]
after_count = len(villages['features'])

print(f"Removed {before_count - after_count} duplicate features. New count: {after_count}")

with open('public/data/all_villages_buildings.json', 'w', encoding='utf-8') as f:
    json.dump(villages, f)
