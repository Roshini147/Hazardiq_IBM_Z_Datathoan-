// tests/test_capacity_engine.mjs
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING HAZARDIQ CRITICAL CAPACITY VERIFICATION SUITE ===');

  // 1. Authenticate as Operator
  const authRes = await fetch(`${BASE_URL}/api/v1/auth/authority-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'operator@hazardiq.tn.gov.in',
      password: 'Operator@123',
      role: 'OPERATOR'
    })
  });
  const authData = await authRes.json();
  assert(authData.success, 'Operator login failed');
  const token = authData.data.token;
  console.log('Operator authentication successful.');

  // Pick a test shelter from database (or get first shelter)
  const sheltersRes = await fetch(`${BASE_URL}/api/v1/shelters`);
  const sheltersList = await sheltersRes.json();
  const testShelter = sheltersList.data[0];
  const shelterId = testShelter.id;
  console.log(`Using Shelter #${shelterId}: "${testShelter.name}" (Capacity: ${testShelter.total_capacity})`);

  // Reset shelter occupancy to 0 first via check-out if needed
  if (testShelter.current_occupancy > 0) {
    await fetch(`${BASE_URL}/api/v1/shelters/${shelterId}/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ count: testShelter.current_occupancy })
    });
  }

  // TEST 1 — AVAILABLE (e.g. allocating up to 300 / 500)
  // Let's allocate 20 people into the shelter
  const alloc1Res = await fetch(`${BASE_URL}/api/v1/shelters/${shelterId}/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ count: 20, affected_zone: 'Zone 1 - Thiruvottiyur', notes: 'Test 1 - Available' })
  });
  const alloc1 = await alloc1Res.json();
  assert(alloc1.success, 'Allocation 1 failed');
  assert.strictEqual(alloc1.data.current_occupancy, 20);
  assert.strictEqual(alloc1.data.capacity_status, 'AVAILABLE');
  console.log('PASS: Test 1 — Available status verified (Occupancy: 20, Status: AVAILABLE)');

  // Allocate until 5 places remain before full capacity
  const remainingBeforeFull = testShelter.total_capacity - 20;
  const allocNearFull = await fetch(`${BASE_URL}/api/v1/shelters/${shelterId}/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ count: remainingBeforeFull - 5, affected_zone: 'Zone 1', notes: 'Fill to near capacity' })
  });
  const nearFullData = await allocNearFull.json();
  assert(nearFullData.success);
  assert.strictEqual(nearFullData.data.capacity_status, 'LIMITED');
  assert.strictEqual(nearFullData.data.available_capacity, 5);
  console.log(`PASS: Test 2 — Limited status verified (Occupancy: ${nearFullData.data.current_occupancy}/${testShelter.total_capacity}, Available: 5, Status: LIMITED)`);

  // TEST 4 — PREVENT OVER-ALLOCATION:
  // Available is 5 places. Attempt to allocate 10 people!
  const overAllocRes = await fetch(`${BASE_URL}/api/v1/shelters/${shelterId}/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ count: 10, affected_zone: 'Zone 1', notes: 'Attempt over-allocation' })
  });
  const overAllocData = await overAllocRes.json();
  assert.strictEqual(overAllocRes.status, 400, 'Over-allocation must return HTTP 400');
  assert.strictEqual(overAllocData.success, false);
  assert(overAllocData.error.message.includes('Insufficient capacity'), 'Error must specify Insufficient capacity');
  assert(overAllocData.error.message.includes('Only 5 places remain available'), 'Error must specify remaining places');
  console.log(`PASS: Test 4 — Over-allocation prevented! Message: "${overAllocData.error.message}"`);

  // TEST 5 — CAPACITY BECOMES FULL:
  // Exactly 5 places remain. Allocate 5 people.
  const fillRes = await fetch(`${BASE_URL}/api/v1/shelters/${shelterId}/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ count: 5, affected_zone: 'Zone 1', notes: 'Fill completely' })
  });
  const fillData = await fillRes.json();
  assert(fillData.success);
  assert.strictEqual(fillData.data.current_occupancy, testShelter.total_capacity);
  assert.strictEqual(fillData.data.available_capacity, 0);
  assert.strictEqual(fillData.data.capacity_status, 'FULL');
  console.log(`PASS: Test 5 & 3 — Shelter FULL verified (Occupancy: ${fillData.data.current_occupancy}/${testShelter.total_capacity}, Available: 0, Status: FULL)`);

  // Verify public capacity endpoint also returns FULL and Available: 0
  const capDetailRes = await fetch(`${BASE_URL}/api/v1/shelters/${shelterId}/capacity`);
  const capDetail = await capDetailRes.json();
  assert.strictEqual(capDetail.data.capacity_status, 'FULL');
  assert.strictEqual(capDetail.data.available_capacity, 0);
  assert.notStrictEqual(capDetail.data.capacity_status, 'AVAILABLE', 'Never show AVAILABLE when available is 0!');
  console.log('PASS: Public capacity transparency verified (Never shows AVAILABLE when full).');

  // TEST 6 — CHECK-OUT:
  // Check out 10 people -> Occupancy decreases, Available becomes 10, Status updates
  const checkoutRes = await fetch(`${BASE_URL}/api/v1/shelters/${shelterId}/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ count: 10 })
  });
  const checkoutData = await checkoutRes.json();
  assert(checkoutData.success);
  assert.strictEqual(checkoutData.data.current_occupancy, testShelter.total_capacity - 10);
  assert.strictEqual(checkoutData.data.available_capacity, 10);
  console.log(`PASS: Test 6 — Check-out verified (Occupancy: ${checkoutData.data.current_occupancy}, Available: 10, Status: ${checkoutData.data.capacity_status})`);

  console.log('=== ALL CRITICAL CAPACITY TEST CASES PASSED WITH 100% SUCCESS ===');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
