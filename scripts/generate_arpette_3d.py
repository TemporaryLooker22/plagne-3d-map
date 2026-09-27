import math
import json
import xml.etree.ElementTree as ET

# Load OSM data
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
lift_node_ids = lift['nodes']

# Pylon heights according to Leitner technical profile for TSD8 Arpette (16 pylons)
# P1 (compression exit station): 12m
# P2 (compression): 13m
# P3..P6 (climbing line): 16m - 18m
# P7..P10 (intermediate plateau / slope): 15m - 17m
# P11..P14 (ridge climb): 18m - 20m
# P15 (support before crest): 15m
# P16 (support entrance arrival station): 12m
pylon_heights = {
    'P1': 12.0,
    'P2': 13.0,
    'P3': 16.0,
    'P4': 17.5,
    'P5': 16.5,
    'P6': 16.0,
    'P7': 16.0,
    'P8': 17.0,
    'P9': 17.5,
    'P10': 18.0,
    'P11': 19.0,
    'P12': 18.5,
    'P13': 17.0,
    'P14': 16.5,
    'P15': 15.0,
    'P16': 12.5,
}

# Meter to degree conversion at lat 45.515
DEG_LAT_PER_M = 1.0 / 111139.0
DEG_LON_PER_M = 1.0 / (111139.0 * math.cos(math.radians(45.515)))

def get_pylon_offset(lon, lat, dx_m, dy_m):
    return [lon + dx_m * DEG_LON_PER_M, lat + dy_m * DEG_LAT_PER_M]

features = []

# 1. GARE DE DEPART G1 (Bellecôte)
# From OSM way 224261269
g1_poly_coords = [[nodes[nid]['lon'], nodes[nid]['lat']] for nid in ways['224261269']['nodes']]
features.append({
    "type": "Feature",
    "properties": {
        "id": "arpette-g1",
        "name": "Gare Aval TSD8 Arpette (Bellecôte)",
        "type": "station",
        "station_type": "G1 - Départ",
        "altitude": "1 937 m",
        "height": 7.5,
        "min_height": 0,
        "color": "#1e293b",
        "roof_color": "#334155"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [g1_poly_coords]
    }
})

# G1 Vigie (control cabin)
g1_vigie_coords = [[nodes[nid]['lon'], nodes[nid]['lat']] for nid in ways['224261270']['nodes']]
features.append({
    "type": "Feature",
    "properties": {
        "id": "arpette-g1-vigie",
        "name": "Vigie de Commande G1",
        "type": "cabin",
        "height": 4.5,
        "min_height": 0,
        "color": "#0f172a"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [g1_vigie_coords]
    }
})

# Extract pylons list
pylons_info = []
for nid in lift_node_ids:
    node = nodes[nid]
    tags = node.get('tags', {})
    if tags.get('aerialway') == 'pylon':
        pref = tags.get('ref', f"P{len(pylons_info)+1}")
        pylons_info.append({
            'ref': pref,
            'lon': node['lon'],
            'lat': node['lat'],
            'height': pylon_heights.get(pref, 16.0)
        })

print(f"Total extracted pylons: {len(pylons_info)}")

# Overall line orientation
p_start = [pylons_info[0]['lon'], pylons_info[0]['lat']]
p_end = [pylons_info[-1]['lon'], pylons_info[-1]['lat']]
line_dx_m = (p_end[0] - p_start[0]) / DEG_LON_PER_M
line_dy_m = (p_end[1] - p_start[1]) / DEG_LAT_PER_M
line_dist = math.hypot(line_dx_m, line_dy_m)
ux = line_dx_m / line_dist
uy = line_dy_m / line_dist
# Normal vector (pointing left/north-west of the line)
nx = -uy
ny = ux

# 2. GARE D'ARRIVEE G2 (Col / Crête de l'Arpette)
g2_node = nodes[lift_node_ids[-1]]
g2_center = [g2_node['lon'], g2_node['lat']]

# Build rectangular G2 station along (ux, uy)
g2_length = 24.0 # meters along lift direction
g2_width = 8.5   # meters across lift direction
g2_half_l = g2_length / 2.0
g2_half_w = g2_width / 2.0

def make_rect_oriented(center_lon, center_lat, ux, uy, nx, ny, half_u, half_n):
    c1 = [center_lon + (-half_u * ux - half_n * nx) * DEG_LON_PER_M, center_lat + (-half_u * uy - half_n * ny) * DEG_LAT_PER_M]
    c2 = [center_lon + ( half_u * ux - half_n * nx) * DEG_LON_PER_M, center_lat + ( half_u * uy - half_n * ny) * DEG_LAT_PER_M]
    c3 = [center_lon + ( half_u * ux + half_n * nx) * DEG_LON_PER_M, center_lat + ( half_u * uy + half_n * ny) * DEG_LAT_PER_M]
    c4 = [center_lon + (-half_u * ux + half_n * nx) * DEG_LON_PER_M, center_lat + (-half_u * uy + half_n * ny) * DEG_LAT_PER_M]
    return [c1, c2, c3, c4, c1]

# Shift G2 center slightly forward along cable exit
g2_poly = make_rect_oriented(g2_center[0] + (3.0 * ux) * DEG_LON_PER_M, g2_center[1] + (3.0 * uy) * DEG_LAT_PER_M, ux, uy, nx, ny, g2_half_l, g2_half_w)

features.append({
    "type": "Feature",
    "properties": {
        "id": "arpette-g2",
        "name": "Gare Amont TSD8 Arpette (Col de l'Arpette)",
        "type": "station",
        "station_type": "G2 - Arrivée",
        "altitude": "2 348 m",
        "height": 7.0,
        "min_height": 0,
        "color": "#1e293b",
        "roof_color": "#334155"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [g2_poly]
    }
})

# Vigie Amont G2 (operator cabin next to arrival)
vigie2_center = [g2_center[0] + (-2.0 * ux + 6.0 * nx) * DEG_LON_PER_M, g2_center[1] + (-2.0 * uy + 6.0 * ny) * DEG_LAT_PER_M]
vigie2_poly = make_rect_oriented(vigie2_center[0], vigie2_center[1], ux, uy, nx, ny, 2.5, 2.0)
features.append({
    "type": "Feature",
    "properties": {
        "id": "arpette-g2-vigie",
        "name": "Vigie de Commande G2",
        "type": "cabin",
        "height": 4.2,
        "min_height": 0,
        "color": "#0f172a"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [vigie2_poly]
    }
})

# 3. PYLONS (P1 to P16)
# Each pylon gets:
# a) Mast (octagonal tube)
# b) Crossarm (horizontal transversal beam)
# c) Left & Right roller battery assemblies
for p in pylons_info:
    plon = p['lon']
    plat = p['lat']
    ph = p['height']
    pref = p['ref']
    
    # Octagonal mast footprint (radius 1.1m)
    mast_radius = 1.1
    mast_points = []
    for step in range(8):
        angle = step * (2.0 * math.pi / 8.0)
        mx = plon + (mast_radius * math.cos(angle)) * DEG_LON_PER_M
        my = plat + (mast_radius * math.sin(angle)) * DEG_LAT_PER_M
        mast_points.append([mx, my])
    mast_points.append(mast_points[0])
    
    # Mast feature
    features.append({
        "type": "Feature",
        "properties": {
            "id": f"pylon-mast-{pref}",
            "name": f"Pylône {pref} TSD8 Arpette",
            "type": "pylon_mast",
            "pylon_ref": pref,
            "height": ph,
            "min_height": 0,
            "color": "#475569" # galvanized steel
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [mast_points]
        }
    })
    
    # Crossarm (traverse): width 8.2m total (4.1m to each side), length along line 1.4m
    crossarm_poly = make_rect_oriented(plon, plat, ux, uy, nx, ny, 0.7, 4.1)
    features.append({
        "type": "Feature",
        "properties": {
            "id": f"pylon-crossarm-{pref}",
            "name": f"Potence {pref}",
            "type": "pylon_crossarm",
            "pylon_ref": pref,
            "height": ph + 0.4,
            "min_height": ph - 1.2,
            "color": "#1e293b" # dark engineering steel
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [crossarm_poly]
        }
    })
    
    # Left roller assembly (train de galets gauche, at n = +3.4m)
    rl_lon = plon + (3.4 * nx) * DEG_LON_PER_M
    rl_lat = plat + (3.4 * ny) * DEG_LAT_PER_M
    rl_poly = make_rect_oriented(rl_lon, rl_lat, ux, uy, nx, ny, 1.4, 0.45)
    features.append({
        "type": "Feature",
        "properties": {
            "id": f"pylon-roller-l-{pref}",
            "name": f"Galets Gauche {pref}",
            "type": "roller_battery",
            "pylon_ref": pref,
            "height": ph - 0.4,
            "min_height": ph - 1.5,
            "color": "#0f172a"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [rl_poly]
        }
    })
    
    # Right roller assembly (train de galets droit, at n = -3.4m)
    rr_lon = plon + (-3.4 * nx) * DEG_LON_PER_M
    rr_lat = plat + (-3.4 * ny) * DEG_LAT_PER_M
    rr_poly = make_rect_oriented(rr_lon, rr_lat, ux, uy, nx, ny, 1.4, 0.45)
    features.append({
        "type": "Feature",
        "properties": {
            "id": f"pylon-roller-r-{pref}",
            "name": f"Galets Droit {pref}",
            "type": "roller_battery",
            "pylon_ref": pref,
            "height": ph - 0.4,
            "min_height": ph - 1.5,
            "color": "#0f172a"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [rr_poly]
        }
    })

# 4. CABLES (Voie Montée, Voie Descente, Axe Central)
# Left cable path (passing through left roller batteries)
# Right cable path (passing through right roller batteries)
# Center line
all_pts = [[nodes[lift_node_ids[0]]['lon'], nodes[lift_node_ids[0]]['lat']]]
for p in pylons_info:
    all_pts.append([p['lon'], p['lat']])
all_pts.append([g2_center[0], g2_center[1]])

cable_left_coords = []
cable_right_coords = []
for pt in all_pts:
    cl = [pt[0] + (3.4 * nx) * DEG_LON_PER_M, pt[1] + (3.4 * ny) * DEG_LAT_PER_M]
    cr = [pt[0] + (-3.4 * nx) * DEG_LON_PER_M, pt[1] + (-3.4 * ny) * DEG_LAT_PER_M]
    cable_left_coords.append(cl)
    cable_right_coords.append(cr)

cables_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Câble TSD8 Arpette (Voie Montée)",
                "type": "cable",
                "track": "up"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": cable_left_coords
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Câble TSD8 Arpette (Voie Descente)",
                "type": "cable",
                "track": "down"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": cable_right_coords
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Tracé TSD8 Arpette",
                "type": "centerline"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": all_pts
            }
        }
    ]
}

# 5. LABELS & POIs (G1, G2, Pylons)
labels_features = [
    {
        "type": "Feature",
        "properties": {
            "title": "TSD8 ARPETTE - G1 DÉPART",
            "subtitle": "1 937 m · Plagne Bellecôte",
            "type": "station_label",
            "station": "G1"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [nodes[lift_node_ids[0]]['lon'], nodes[lift_node_ids[0]]['lat']]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "title": "TSD8 ARPETTE - G2 ARRIVÉE",
            "subtitle": "2 348 m · Col de l'Arpette",
            "type": "station_label",
            "station": "G2"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [g2_center[0], g2_center[1]]
        }
    }
]

for p in pylons_info:
    labels_features.append({
        "type": "Feature",
        "properties": {
            "title": p['ref'],
            "subtitle": f"H: {p['height']}m",
            "type": "pylon_label",
            "pylon_ref": p['ref']
        },
        "geometry": {
            "type": "Point",
            "coordinates": [p['lon'], p['lat']]
        }
    })

labels_geojson = {
    "type": "FeatureCollection",
    "features": labels_features
}

structures_geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open('public/data/arpette_3d_structures.json', 'w', encoding='utf-8') as f:
    json.dump(structures_geojson, f, indent=2)

with open('public/data/arpette_cables.json', 'w', encoding='utf-8') as f:
    json.dump(cables_geojson, f, indent=2)

with open('public/data/arpette_labels.json', 'w', encoding='utf-8') as f:
    json.dump(labels_geojson, f, indent=2)

print("Generated:")
print(f"  - arpette_3d_structures.json: {len(features)} 3D structural features")
print(f"  - arpette_cables.json: {len(cables_geojson['features'])} cable lines")
print(f"  - arpette_labels.json: {len(labels_geojson['features'])} labels/points")
