import os,sys
sys.path.insert(0,os.path.abspath('backend'))
from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_health(): assert client.get('/api/health').status_code==200
def test_dashboard():
    r=client.get('/api/dashboard'); assert r.status_code==200; assert 'assessed_areas' in r.json()
