from pydantic import BaseModel, Field



class PaymentIntentCreate(BaseModel):
    amount: int = Field(gt=0, description="Montant en centimes")
    currency: str = "usd"


class SubscriptionCreate(BaseModel):
    price_id: str
