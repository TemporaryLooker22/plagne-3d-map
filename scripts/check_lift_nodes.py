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

lift = ways.get('818116187')
print("--- WAY 818116187 (Arpette chair_lift) ---")
print("Tags:", lift['tags'])
for i, nid in enumerate(lift['nodes']):
    n = nodes[nid]
    print(f"[{i+1}/{len(lift['nodes'])}] Node ID {nid}: lon={n['lon']}, lat={n['lat']} | Tags: {n['tags']}")
