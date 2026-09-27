import xml.etree.ElementTree as ET
import json

tree = ET.parse('osm_arpette.xml')
root = tree.getroot()

nodes = {}
for node in root.findall('node'):
    nid = node.attrib['id']
    lat = float(node.attrib['lat'])
    lon = float(node.attrib['lon'])
    tags = {tag.attrib['k']: tag.attrib['v'] for tag in node.findall('tag')}
    nodes[nid] = {'lat': lat, 'lon': lon, 'tags': tags}

ways = {}
for way in root.findall('way'):
    wid = way.attrib['id']
    tags = {tag.attrib['k']: tag.attrib['v'] for tag in way.findall('tag')}
    nd_refs = [nd.attrib['ref'] for nd in way.findall('nd')]
    ways[wid] = {'id': wid, 'tags': tags, 'nodes': nd_refs}

for wid, w in ways.items():
    if wid in ['224261269', '224261270']:
        print(f"Way {wid}: {w['tags']}")
        coords = [[nodes[nid]['lon'], nodes[nid]['lat']] for nid in w['nodes']]
        print("Coords:", coords)

# Also let's check for any buildings or stations around arrival node 7640758887 (lon ~ 6.7166, lat ~ 45.5225)
print("\n--- Features around arrival station (6.7166, 45.5225) ---")
for wid, w in ways.items():
    for nid in w['nodes']:
        n = nodes[nid]
        if abs(n['lon'] - 6.7166) < 0.001 and abs(n['lat'] - 45.5225) < 0.001:
            print(f"Way {wid}: {w['tags']}")
            break
