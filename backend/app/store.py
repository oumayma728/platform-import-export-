from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

DATA_FILE = Path(__file__).resolve().parent / 'data.json'

@dataclass
class Company:
    id: str
    name: str
    is_exporter: bool
    is_importer: bool
    country: str
    description: str
    owner_id: str | None = None
    website: str | None = None
    logo_url: str | None = None
    registration_number: str | None = None
    certification_docs: Any = field(default_factory=list)
    profile_status: str = 'EN_ATTENTE_VALIDATION'

@dataclass
class User:
    id: str
    email: str
    full_name: str | None = None
    role: str = 'exporter'
    hashed_password: str = ''
    is_active: bool = True
    status: str = 'EN_ATTENTE_VALIDATION'

@dataclass
class Salon:
    id: str
    title: str
    category: str | None = None
    description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    stand_price: float | None = None
    status: str = 'BROUILLON'
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

@dataclass
class Stand:
    id: str
    salon_id: str
    exporter_id: str
    company_name: str
    products: str | None = None
    certifications: str | None = None
    video_url: str | None = None
    documents: list[dict[str, str]] = field(default_factory=list)
    payment_status: str = 'PENDING'
    status: str = 'EN_ATTENTE_VALIDATION'
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

@dataclass
class RendezVous:
    id: str
    salon_id: str
    exporter_id: str
    importer_id: str
    proposed_datetime: str
    status: str = 'PROPOSE'
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

class InMemoryStore:
    def __init__(self) -> None:
        self.companies: list[Company] = []
        self.users: list[User] = []
        self.salons: list[Salon] = []
        self.stands: list[Stand] = []
        self.rendezvous: list[RendezVous] = []
        self.load()

    def load(self) -> None:
        if not DATA_FILE.exists():
            return

        try:
            raw = json.loads(DATA_FILE.read_text(encoding='utf-8'))
            self.companies = [Company(**item) for item in raw.get('companies', [])]
            self.users = [User(**item) for item in raw.get('users', [])]
            self.salons = [Salon(**item) for item in raw.get('salons', [])]
            self.stands = [Stand(**item) for item in raw.get('stands', [])]
            self.rendezvous = [RendezVous(**item) for item in raw.get('rendezvous', [])]
        except (ValueError, TypeError):
            self.companies = []
            self.users = []
            self.salons = []
            self.stands = []
            self.rendezvous = []

    def save(self) -> None:
        DATA_FILE.write_text(
            json.dumps(
                {
                    'companies': [asdict(company) for company in self.companies],
                    'users': [asdict(user) for user in self.users],
                    'salons': [asdict(salon) for salon in self.salons],
                    'stands': [asdict(stand) for stand in self.stands],
                    'rendezvous': [asdict(rdv) for rdv in self.rendezvous],
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding='utf-8',
        )

    def seed_users(self, users: list[User]) -> None:
        if not self.users:
            self.users.extend(users)
            self.save()

    def seed_companies(self, companies: list[Company]) -> None:
        if not self.companies:
            self.companies.extend(companies)
            self.save()

    def get_user(self, user_id: str) -> User | None:
        return next((u for u in self.users if u.id == user_id), None)

    def get_user_by_email(self, email: str) -> User | None:
        return next((u for u in self.users if u.email.lower() == email.lower()), None)

    def create_user(self, payload: dict[str, Any]) -> User:
        user = User(id=str(uuid4()), **payload)
        self.users.append(user)
        self.save()
        return user

    def get_company(self, company_id: str) -> Company | None:
        return next((c for c in self.companies if c.id == company_id), None)

    def list_salons(self) -> list[Salon]:
        return self.salons

    def get_salon(self, salon_id: str) -> Salon | None:
        return next((s for s in self.salons if s.id == salon_id), None)

    def create_salon(self, payload: dict[str, Any]) -> Salon:
        salon = Salon(id=str(uuid4()), **payload)
        self.salons.append(salon)
        self.save()
        return salon

    def update_salon(self, salon_id: str, payload: dict[str, Any]) -> Salon | None:
        salon = self.get_salon(salon_id)
        if not salon:
            return None
        for key, value in payload.items():
            setattr(salon, key, value)
        salon.updated_at = datetime.utcnow().isoformat()
        self.save()
        return salon

    def list_stands_by_salon(self, salon_id: str) -> list[Stand]:
        return [st for st in self.stands if st.salon_id == salon_id]

    def get_stand(self, stand_id: str) -> Stand | None:
        return next((st for st in self.stands if st.id == stand_id), None)

    def create_stand(self, payload: dict[str, Any]) -> Stand:
        stand = Stand(id=str(uuid4()), **payload)
        self.stands.append(stand)
        self.save()
        return stand

    def update_stand(self, stand_id: str, payload: dict[str, Any]) -> Stand | None:
        stand = self.get_stand(stand_id)
        if not stand:
            return None
        for key, value in payload.items():
            setattr(stand, key, value)
        stand.updated_at = datetime.utcnow().isoformat()
        self.save()
        return stand

    def list_rendezvous(self) -> list[RendezVous]:
        return self.rendezvous

    def create_rdv(self, payload: dict[str, Any]) -> RendezVous:
        rdv = RendezVous(id=str(uuid4()), **payload)
        self.rendezvous.append(rdv)
        self.save()
        return rdv

    def update_rdv(self, rdv_id: str, payload: dict[str, Any]) -> RendezVous | None:
        rdv = next((r for r in self.rendezvous if r.id == rdv_id), None)
        if not rdv:
            return None
        for key, value in payload.items():
            setattr(rdv, key, value)
        rdv.updated_at = datetime.utcnow().isoformat()
        self.save()
        return rdv

store = InMemoryStore()
