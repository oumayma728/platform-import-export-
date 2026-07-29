import os
from dotenv import load_dotenv
import stripe

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

session = stripe.checkout.Session.create(
    mode="subscription",
    line_items=[{"price": "price_1TviKWRxfMGs4QClIe2GtcjD", "quantity": 1}],
    success_url="https://example.com/success",
    cancel_url="https://example.com/cancel",
)
print(session.url)