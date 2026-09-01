import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

BASE_URL = 'http://127.0.0.1:8000'


def api_request(path, method='GET', token=None, data=None):
    url = BASE_URL + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode('utf-8')
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        content = exc.read().decode('utf-8')
        try:
            payload = json.loads(content)
        except Exception:
            payload = content
        raise RuntimeError(f'HTTP {exc.code} {exc.reason}: {payload}')


def login(email, password):
    data = {'email': email, 'password': password}
    payload = api_request('/auth/login', method='POST', data=data)
    print(f"Logged in {email} as {payload['user']['role']}")
    return payload['access_token'], payload['user']


def main():
    admin_token, _ = login('admin@salonsvirtuels.com', 'admin123')
    exporter_token, exporter_user = login('exportateur@salonsvirtuels.com', 'export123')
    importer_token, importer_user = login('importateur@salonsvirtuels.com', 'import123')

    company_payload = {
        'id': f'company-exporter-{int(datetime.utcnow().timestamp())}',
        'name': 'Export Demo SARL',
        'is_exporter': True,
        'is_importer': False,
        'country': 'FR',
        'description': 'Test export company',
        'website': 'https://example.com',
        'logo_url': None,
        'registration_number': 'FR-999999',
        'certification_docs': [],
        'profile_status': 'EN_ATTENTE_VALIDATION',
    }
    company = api_request('/companies/', method='POST', token=exporter_token, data=company_payload)
    print('Created company:', company['id'])

    updated_company = api_request(f"/companies/{company['id']}/status", method='PATCH', token=admin_token, data={'profile_status': 'VALIDE'})
    assert updated_company['profile_status'] == 'VALIDE'
    print('Validated company:', updated_company['id'])

    salon_payload = {
        'title': 'Salon Test Smoke',
        'category': 'Agroalimentaire',
        'description': 'Salon créé pour test d\'intégration',
        'start_date': (datetime.utcnow() + timedelta(days=10)).date().isoformat(),
        'end_date': (datetime.utcnow() + timedelta(days=12)).date().isoformat(),
        'stand_price': 800.0,
    }
    salon = api_request('/salons/', method='POST', token=exporter_token, data=salon_payload)
    print('Created salon:', salon['id'])

    salon = api_request(f"/salons/{salon['id']}/status", method='PATCH', token=admin_token, data={'status': 'VALIDE'})
    print('Validated salon:', salon['id'])

    stand_payload = {
        'exporter_id': company['id'],
        'company_name': 'Export Demo SARL Stand',
        'products': 'Produit de test',
        'certifications': 'ISO 9001',
        'video_url': 'https://example.com/demo.mp4',
        'documents': [],
    }
    stand = api_request(f"/salons/{salon['id']}/stands", method='POST', token=exporter_token, data=stand_payload)
    print('Created stand:', stand['id'], 'status:', stand['status'])

    importer_company_payload = {
        'id': f'company-importer-{int(datetime.utcnow().timestamp())}',
        'name': 'Import Demo SARL',
        'is_exporter': False,
        'is_importer': True,
        'country': 'FR',
        'description': 'Test importer company',
        'website': 'https://example-import.com',
        'logo_url': None,
        'registration_number': 'FR-888888',
        'certification_docs': [],
        'profile_status': 'EN_ATTENTE_VALIDATION',
    }
    importer_company = api_request('/companies/', method='POST', token=importer_token, data=importer_company_payload)
    print('Created importer company:', importer_company['id'])

    importer_company = api_request(f"/companies/{importer_company['id']}/status", method='PATCH', token=admin_token, data={'profile_status': 'VALIDE'})
    print('Validated importer company:', importer_company['id'])

    rdv_payload = {
        'salon_id': salon['id'],
        'exporter_id': company['id'],
        'importer_id': importer_company['id'],
        'proposed_datetime': (datetime.utcnow() + timedelta(days=15, hours=2)).isoformat(),
    }
    rdv = api_request('/rendez-vous/', method='POST', token=importer_token, data=rdv_payload)
    print('Created rendez-vous:', rdv['id'], 'status:', rdv['status'])

    rdv_confirmed = api_request(f"/rendez-vous/{rdv['id']}/confirm", method='PATCH', token=exporter_token)
    print('Confirmed rendez-vous:', rdv_confirmed['id'], 'status:', rdv_confirmed['status'])

    stand_validated = api_request(f"/stands/{stand['id']}/validate", method='PATCH', token=admin_token)
    print('Validated stand:', stand_validated['id'], 'status:', stand_validated['status'])

    print('Smoke test complete!')


if __name__ == '__main__':
    main()
