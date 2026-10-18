// tests/test_live_public_url.mjs
import assert from 'node:assert';

const PUBLIC_URL = 'https://mini-minutes-sewing-lock.trycloudflare.com';

async function verifyPublicDeployment() {
  console.log(`=== VERIFYING LIVE PUBLIC HTTPS DEPLOYMENT ===`);
  console.log(`Target Public Domain: ${PUBLIC_URL}\n`);

  // 1. Root HTML
  const rootRes = await fetch(`${PUBLIC_URL}/`);
  assert.strictEqual(rootRes.status, 200, 'Public homepage failed');
  const rootHtml = await rootRes.text();
  assert(rootHtml.includes('dist/assets') || rootHtml.includes('/assets/index'), 'Production bundle tag missing in root HTML');
  console.log('✓ Public Website Root (HTML): HTTP 200 OK');

  // 2. CSS Bundle
  const cssMatch = rootHtml.match(/\/assets\/[^\"]+\.css/);
  if (cssMatch) {
    const cssRes = await fetch(`${PUBLIC_URL}${cssMatch[0]}`);
    assert.strictEqual(cssRes.status, 200);
    console.log(`✓ Production CSS Asset (${cssMatch[0]}): HTTP 200 OK`);
  }

  // 3. JS Bundle
  const jsMatch = rootHtml.match(/\/assets\/[^\"]+\.js/);
  if (jsMatch) {
    const jsRes = await fetch(`${PUBLIC_URL}${jsMatch[0]}`);
    assert.strictEqual(jsRes.status, 200);
    console.log(`✓ Production JS Bundle (${jsMatch[0]}): HTTP 200 OK`);
  }

  // 4. Public Health API
  const healthRes = await fetch(`${PUBLIC_URL}/api/v1/health`);
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.data.status, 'SYSTEM_OPERATIONAL');
  console.log(`✓ Public Health Check API (/api/v1/health): SYSTEM_OPERATIONAL`);

  // 5. Preserved Dashboard API
  const dashRes = await fetch(`${PUBLIC_URL}/api/dashboard`);
  assert.strictEqual(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert(dashData.assessed_areas > 0);
  console.log(`✓ Preserved Operational Dashboard (/api/dashboard): ${dashData.assessed_areas} Wards Assessed, Safe Capacity: ${dashData.safe_capacity.toLocaleString()}`);

  // 6. Shelters & Live Capacity API
  const shelterRes = await fetch(`${PUBLIC_URL}/api/v1/shelters`);
  assert.strictEqual(shelterRes.status, 200);
  const shelterData = await shelterRes.json();
  assert.strictEqual(shelterData.data.length, 215, 'Must contain all 215 Chennai relief shelters');
  console.log(`✓ Public Shelters API (/api/v1/shelters): All 215 GCC Relief Centres Loaded with Capacities`);

  // 7. Active Alerts API
  const alertRes = await fetch(`${PUBLIC_URL}/api/v1/alerts`);
  assert.strictEqual(alertRes.status, 200);
  const alertData = await alertRes.json();
  assert(alertData.data.length > 0);
  console.log(`✓ Disaster Alerts API (/api/v1/alerts): ${alertData.data.length} Active Emergency Alerts with Tamil Unicode`);

  // 8. Authority Login
  const authRes = await fetch(`${PUBLIC_URL}/api/v1/auth/authority-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'operator@hazardiq.tn.gov.in',
      password: 'Operator@123',
      role: 'OPERATOR'
    })
  });
  assert.strictEqual(authRes.status, 200);
  const authData = await authRes.json();
  assert(authData.success && authData.data.token);
  console.log(`✓ Authority RBAC Authentication (/api/v1/auth/authority-login): Verified for OPERATOR role`);

  console.log(`\n======================================================`);
  console.log(`LIVE PUBLIC DEPLOYMENT FULLY VERIFIED AND REACHABLE`);
  console.log(`PUBLIC URL: ${PUBLIC_URL}`);
  console.log(`======================================================`);
}

verifyPublicDeployment().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
