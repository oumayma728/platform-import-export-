import urllib.request
import json
import sys

try:
    url = 'http://127.0.0.1:8000/listings?page=1&page_size=10'
    with urllib.request.urlopen(url, timeout=10) as resp:
        data = json.loads(resp.read().decode())
    
    annonces = data.get('annonces', [])
    print(f"Total annonces: {len(annonces)}\n")
    
    for a in annonces[:3]:
        print(f"ID: {a.get('id')} | Titre: {str(a.get('product', 'N/A'))[:40]}")
        print(f"  Pays O: {a.get('originCountry')} | Pays D: {a.get('destinationCountry')}")
        print(f"  Distance: {a.get('distance_km')} | Coût: {a.get('estimated_cost_usd')} | Délai: {a.get('estimated_days')}")
        print(f"  Devise: {a.get('devise')} | Prix: {a.get('prix')} | Prix converti: {a.get('prix_converti')}")
        print()

except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
