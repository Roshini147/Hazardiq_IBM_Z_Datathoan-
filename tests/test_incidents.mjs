// tests/test_incidents.mjs
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING CITIZEN INCIDENT REPORTING & VERIFICATION TEST ===');

  // 1. Submit an incident
  const submitRes = await fetch(`${BASE_URL}/api/v1/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incident_type: 'Severe Waterlogging',
      description: 'Waist-deep water accumulation near Saidapet subway.',
      severity: 'HIGH',
      people_affected: 40,
      area_name: 'Saidapet',
      zone: 'Zone 10 - Kodambakkam',
      ward: 'Ward 142',
      reporter_name: 'Ravi Kumar',
      reporter_phone: '9840123456'
    })
  });
  const submitData = await submitRes.json();
  assert(submitData.success, 'Incident submission failed');
  const incidentId = submitData.data.id;
  assert.strictEqual(submitData.data.status, 'REPORTED');
  console.log(`PASS: Citizen successfully submitted incident #${incidentId} with status REPORTED.`);

  // 2. Fetch incidents list
  const listRes = await fetch(`${BASE_URL}/api/v1/incidents?zone=Kodambakkam`);
  const listData = await listRes.json();
  assert(listData.success);
  const found = listData.data.find(i => i.id === incidentId);
  assert(found, 'Submitted incident not found in list query');
  console.log('PASS: Incident listed in query response.');

  // 3. Login as Operator to update status
  const opAuthRes = await fetch(`${BASE_URL}/api/v1/auth/authority-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usernameOrEmail: 'operator@hazardiq.tn.gov.in',
      password: 'Operator@123',
      role: 'OPERATOR'
    })
  });
  const opData = await opAuthRes.json();
  const token = opData.data.token;

  // 4. Update status to VERIFIED
  const verifyRes = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status: 'VERIFIED' })
  });
  const verifyData = await verifyRes.json();
  assert(verifyData.success);
  assert.strictEqual(verifyData.data.status, 'VERIFIED');
  console.log(`PASS: Operator updated incident #${incidentId} status to VERIFIED.`);

  // 5. Update status to RESOLVED
  const resolveRes = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status: 'RESOLVED' })
  });
  const resolveData = await resolveRes.json();
  assert(resolveData.success);
  assert.strictEqual(resolveData.data.status, 'RESOLVED');
  console.log(`PASS: Operator marked incident #${incidentId} as RESOLVED.`);

  // 6. Check audit log
  const auditRes = await fetch(`${BASE_URL}/api/v1/audit-logs?limit=5`);
  const auditData = await auditRes.json();
  assert(auditData.success);
  const auditEntry = auditData.data.find(a => a.entity === 'INCIDENT' && a.entity_id === String(incidentId));
  assert(auditEntry, 'Audit log missing incident update entry!');
  console.log(`PASS: Audit trail confirmed for incident lifecycle: "${auditEntry.details}"`);

  console.log('=== INCIDENT REPORTING & VERIFICATION SUITE PASSED WITH 100% SUCCESS ===');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
