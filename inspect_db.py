import sys
sys.path.insert(0, '.')
from app.config.database import SessionLocal
from app.models.listing import Listing

db = SessionLocal()
listings = db.query(Listing).filter(Listing.statut == 'active').limit(10).all()
print(f'Total active listings: {len(listings)}\n')

for idx, l in enumerate(listings):
    titre_short = (l.titre[:40] + '...') if l.titre and len(l.titre) > 40 else l.titre
    print(f'{idx+1}. ID={l.id} | {titre_short}')
    print(f'   Pays O: {repr(l.pays_origine)} | Pays D: {repr(l.pays_destination)}')
    print(f'   Distance: {l.distance_km} | Devise: {repr(l.devise)} | Catégorie: {repr(l.categorie)}')
    print()

db.close()
