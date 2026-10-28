"""Run against Compose: python scripts/smoke-test.py [http://localhost:8080]."""
import json
import secrets
import sys
import urllib.error
import urllib.request

base = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'


def call(path, body=None, token=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, data=None if body is None else json.dumps(body).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read()
    assert status == expected, (path, status, raw.decode())
    return json.loads(raw) if raw else None


suffix = secrets.token_hex(5)
account = {'username': 'learner_' + suffix, 'email': suffix + '@example.com', 'password': secrets.token_urlsafe(18), 'address': 'Kohima, Nagaland'}
registered = call('/api/register', account, expected=201)
assert 'password_hash' not in registered['user']
call('/api/register', account, expected=409)
call('/api/login', {**account, 'password': 'incorrect-password'}, expected=401)
login = call('/api/login', account)
id_ = login['userId']
call('/api/users/' + str(id_), expected=401)
profile = call('/api/users/' + str(id_), token=login['token'])
assert profile['user']['username'] == account['username']
call('/api/users/' + str(id_ + 1), token=login['token'], expected=403)
assert '/api/suggest-username' in call('/openapi.json')['paths']
call('/api/suggest-username', {'interests': []}, expected=422)
print('PASS: MySQL registration, duplicate email, login, JWT protection, ownership, OpenAPI, AI validation')
print('Created one smoke-test account:', account['email'])
