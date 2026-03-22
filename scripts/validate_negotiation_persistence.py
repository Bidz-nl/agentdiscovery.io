import datetime
import json
import pathlib
import sys
import urllib.error
import urllib.request
import uuid

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3022'
OUTPUT_PATH = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path('scripts/negotiation-persistence-validation.json')
PROVIDER_DID = 'did:adp:seed:pizza-roma-utrecht'


def post(path: str, payload: dict):
    request = urllib.request.Request(
        f'{BASE_URL}{path}',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        body = error.read().decode('utf-8')
        raise RuntimeError(f'POST {path} failed with {error.code}: {body}') from error



def get(path: str):
    request = urllib.request.Request(f'{BASE_URL}{path}', method='GET')
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        body = error.read().decode('utf-8')
        raise RuntimeError(f'GET {path} failed with {error.code}: {body}') from error


nonce = f'nonce-{uuid.uuid4().hex[:12]}'
consumer_did = f'did:adp:test:persistence-consumer-{uuid.uuid4().hex[:8]}'
handshake_payload = {
    'message_type': 'HELLO',
    'did': consumer_did,
    'protocol_version': '2.0',
    'role': 'consumer',
    'supported_versions': ['2.0'],
    'supported_modes': ['compat'],
    'nonce': nonce,
    'timestamp': datetime.datetime.utcnow().replace(microsecond=0).isoformat() + 'Z',
    'signature': 'test-signature',
}
handshake_status, handshake = post('/api/adp/v2/handshake', handshake_payload)
session_id = handshake['session_id']
engage_payload = {
    'agentDid': PROVIDER_DID,
    'session_id': session_id,
    'query': 'Persistence validation order for pizza catering',
    'category': 'food',
    'postcode': '3511AA',
    'targetCapabilityId': 123456,
    'proposal': {
        'price': 1200,
        'currency': 'EUR',
        'message': 'Persistence validation request',
    },
}
engage_status, engage = post('/api/app/compat/negotiations/engage', engage_payload)
negotiation_id = engage['negotiation']['id']
compat_status, compat_detail = get(f'/api/app/compat/negotiations/{negotiation_id}')
resolver_status, resolver_detail = get(f'/api/app/negotiations/{negotiation_id}')
output = {
    'negotiationId': negotiation_id,
    'sessionId': session_id,
    'providerDid': PROVIDER_DID,
    'consumerDid': consumer_did,
    'preRestart': {
        'handshakeStatus': handshake_status,
        'engageStatus': engage_status,
        'compatStatus': compat_status,
        'resolverStatus': resolver_status,
        'compatDetail': compat_detail,
        'resolverDetail': resolver_detail,
        'sameShape': compat_detail == resolver_detail,
    },
}
OUTPUT_PATH.write_text(json.dumps(output, indent=2), encoding='utf-8')
print(json.dumps({'negotiationId': negotiation_id, 'outputPath': str(OUTPUT_PATH)}, indent=2))
