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

# Check way 818116187
lift = ways.get('818116187')
print("Lift tags:", lift['tags'])
print("Lift nodes count:", len(lift['nodes']))

for i, nid in enumerate(lift['nodes']):
    node = nodes.get(nid)
    print(f"Node {i+1} (id {nid}): lon={node['lon']}, lat={node['lat']}, tags={node['tags']}")

# Check stations
print("\n--- Stations ---")
for wid, w in ways.items():
    if w['tags'].get('aerialway') == 'station' or 'arpette' in w['tags'].get('name', '').lower():
        print(f"Way {wid}: {w['tags']}")
        coords = [[nodes[nid]['lon'], nodes[nid]['lat']] for nid in w['nodes']]
        print(f"  Coords: {coords[:2]} ... ({len(coords)} points)")

# Check if there are other station nodes or ways near Bellecôte or Col de l'Arpette
for nid, n in nodes.items():
    if n['tags'].get('aerialway') in ['station', 'pylon']:
        # print if near lift nodes
        print(f"Node {nid}: {n['tags']}, lon={n['lon']}, lat={n['lat']}")
