import stripe
import os
from dotenv import load_dotenv

load_dotenv('c:/Users/abdel/OneDrive/Desktop/projetETE/TUNProject/backend/.env')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

pack_prod = stripe.Product.create(name='Pack 100 Chats')
pack_price = stripe.Price.create(product=pack_prod.id, unit_amount=1500, currency='eur')

sub_prod = stripe.Product.create(name='Premium Mensuel')
sub_price = stripe.Price.create(product=sub_prod.id, unit_amount=4900, currency='eur', recurring={'interval': 'month'})

print(f'PACK_PRICE={pack_price.id}')
print(f'SUB_PRICE={sub_price.id}')
