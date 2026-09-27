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

ways = []
for way in root.findall('way'):
    wid = way.attrib['id']
    tags = {tag.attrib['k']: tag.attrib['v'] for tag in way.findall('tag')}
    nd_refs = [nd.attrib['ref'] for nd in way.findall('nd')]
    ways.append({'id': wid, 'tags': tags, 'nodes': nd_refs})

print(f"Total nodes: {len(nodes)}, Total ways: {len(ways)}")

# Find aerialways with Arpette
arpette_ways = []
for w in ways:
    name = w['tags'].get('name', '')
    aerialway = w['tags'].get('aerialway', '')
    if 'arpette' in name.lower() or 'arpette' in str(w['tags']).lower():
        print(f"Found way: {w['id']} - Name: {name} - aerialway: {aerialway}")
        print("Tags:", w['tags'])
        print(f"Node count: {len(w['nodes'])}")
        arpette_ways.append(w)

if not arpette_ways:
    # list all aerialways
    print("Aerialway ways:")
    for w in ways:
        if 'aerialway' in w['tags']:
            print(f"  {w['id']}: {w['tags'].get('name')} ({w['tags'].get('aerialway')})")
