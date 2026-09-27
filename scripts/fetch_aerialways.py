import urllib.request
import urllib.parse
import json

query = """[out:json][timeout:30];
(
  way["aerialway"](45.50,6.68,45.53,6.72);
  node["aerialway"](45.50,6.68,45.53,6.72);
);
out body;
>;
out skel qt;"""

urls = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
]

data = urllib.parse.urlencode({'data': query}).encode('utf-8')
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
}

for u in urls:
    try:
        print(f"Trying {u}...")
        req = urllib.request.Request(u, data=data, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode('utf-8'))
            print("Success! Elements count:", len(res_data.get('elements', [])))
            with open("aerialways_plagne.json", "w", encoding="utf-8") as f:
                json.dump(res_data, f, indent=2)
            break
    except Exception as e:
        print(f"Failed {u}: {e}")
