// tests/test_legacy_endpoints.mjs
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING BACKWARDS-COMPATIBILITY ENDPOINT VERIFICATION ===');

  const endpoints = [
    { url: '/api/dashboard', check: (d) => assert(d.assessed_areas > 0, 'assessed_areas missing') },
    { url: '/api/risk', check: (d) => assert(Array.isArray(d) && d.length > 0 && d[0].factors, 'risk array missing') },
    { url: '/api/hazards', check: (d) => assert(Array.isArray(d) && d.length > 0, 'hazards array missing') },
    { url: '/api/capacity', check: (d) => assert(Array.isArray(d) && d.length > 0, 'capacity array missing') },
    { url: '/api/relocation', check: (d) => assert(Array.isArray(d) && d.length > 0, 'relocation array missing') },
    { url: '/api/safe-areas', check: (d) => assert(Array.isArray(d) && d.length > 0, 'safe-areas array missing') },
    { url: '/api/resources', check: (d) => assert(Array.isArray(d) && d.length === 95, 'expected 95 hospitals') },
    { url: '/api/data-sources', check: (d) => assert(Array.isArray(d) && d.length > 0, 'data-sources missing') },
    { url: '/api/areas', check: (d) => assert(Array.isArray(d) && d.length > 0, 'areas missing') },
    { url: '/api/zones', check: (d) => assert(Array.isArray(d) && d.length > 0, 'zones missing') },
    { url: '/api/wards', check: (d) => assert(Array.isArray(d) && d.length > 0, 'wards missing') },
    { url: '/api/health', check: (d) => assert(d.backend && d.database, 'health status degraded') },
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`);
    assert.strictEqual(res.status, 200, `Endpoint ${ep.url} returned status ${res.status}`);
    const data = await res.json();
    ep.check(data);
    console.log(`PASS: Preserved endpoint ${ep.url} verified.`);
  }

  console.log('=== ALL PRESERVED ENDPOINTS PASSED WITH 100% SUCCESS ===');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
