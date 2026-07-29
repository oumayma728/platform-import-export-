from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Literal

DEVISES_SUPPORTEES = ("usd", "eur", "gbp", "tnd")

MONTANT_MIN_CENTIMES = 50
class PaymentIntentCreate(BaseModel):
    amount: int = Field(gt=0, le=10_000_000, description="Montant en plus petite unité de la devise(centimes pour USD/EUR)")
    currency: Literal["usd", "eur", "gbp", "tnd"] = Field(default="usd", description="Code devise ISO en minuscules")
    @field_validator("amount")
    @classmethod
    def montant_minimum(cls, value: int) -> int:
        if value < MONTANT_MIN_CENTIMES:
            raise ValueError( f"Le montant doit être d'au moins {MONTANT_MIN_CENTIMES} centimes "
                f"({MONTANT_MIN_CENTIMES / 100:.2f} dans la devise choisie), sinon Stripe le refuse."
            )
        return value

class SubscriptionCreate(BaseModel):
    price_id: str = Field(min_length=5, max_length=100, description="Price ID Stripe de l'abonnement (créé dans le Dashboard Stripe)")
    success_url: HttpUrl= Field(description="URL de redirection après paiement réussi")
    cancel_url: HttpUrl = Field(description="URL de redirection si l'utilisateur annule")
    @field_validator("price_id")
    @classmethod
    def format_price_id(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Le price_id est obligatoire.")
        if not value.startswith("price_"):
            raise ValueError("Le price_id doit commencer par 'price_'.")
        return value