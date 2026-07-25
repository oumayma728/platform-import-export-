import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.database import SessionLocal
from app.models.models import User, Role

def make_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Erreur : Aucun utilisateur trouvé avec l'email {email}")
            return
        
        user.role = Role.ADMIN
        db.commit()
        print(f"Succès : L'utilisateur {email} est maintenant ADMINISTRATEUR !")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
    else:
        make_admin(sys.argv[1])
