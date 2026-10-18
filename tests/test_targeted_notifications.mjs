// tests/test_targeted_notifications.mjs
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING TARGETED GEOGRAPHIC ALERTS & NOTIFICATIONS TEST ===');

  // 1. Create two test citizens in distinct zones
  const userAdyarRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `citizen_adyar_${Date.now()}`,
      email: `adyar_${Date.now()}@example.com`,
      password: 'Password@123',
      preferred_zone: 'Zone 13 - Adyar',
      preferred_ward: 'Ward 172'
    })
  });
  const userAdyarData = await userAdyarRes.json();
  assert(userAdyarData.success, 'Registration failed for Adyar citizen');
  const tokenAdyar = userAdyarData.data.token;

  const userNorthRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `citizen_north_${Date.now()}`,
      email: `north_${Date.now()}@example.com`,
      password: 'Password@123',
      preferred_zone: 'Zone 1 - Thiruvottiyur',
      preferred_ward: 'Ward 4'
    })
  });
  const userNorthData = await userNorthRes.json();
  assert(userNorthData.success, 'Registration failed for North citizen');
  const tokenNorth = userNorthData.data.token;

  // 2. Login as Operator
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
  const opToken = opData.data.token;

  // 3. Publish an alert TARGETED to Zone 13 - Adyar
  const targetAlertRes = await fetch(`${BASE_URL}/api/v1/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${opToken}`
    },
    body: JSON.stringify({
      title: 'Targeted Flood Alert - Adyar Basin',
      title_ta: 'இலக்கு வைக்கப்பட்ட வெள்ள எச்சரிக்கை - அடையாறு பகுதி',
      severity: 'WARNING',
      hazard_type: 'Flash Flood',
      affected_zone: 'Zone 13 - Adyar',
      affected_ward: 'Ward 172',
      message: 'Canal overflow warning for Adyar residents.',
      message_ta: 'அடையாறு பகுதி மக்களுக்கான கால்வாய் நீர் எச்சரிக்கை.',
      recommended_action: 'Avoid riverfront promenade and prepare emergency kits.',
      recommended_action_ta: 'ஆற்றங்கரை நடைபாதையைத் தவிர்க்கவும்.',
      source: 'Chennai Disaster Control Room'
    })
  });
  const alertResult = await targetAlertRes.json();
  assert(alertResult.success, 'Failed to publish targeted alert');
  console.log(`Alert published. Dispatched to ${alertResult.data.targeted_recipients_count} recipient(s).`);

  // 4. Verify Adyar citizen received in-app notification
  const notifAdyarRes = await fetch(`${BASE_URL}/api/v1/notifications`, {
    headers: { 'Authorization': `Bearer ${tokenAdyar}` }
  });
  const notifAdyarData = await notifAdyarRes.json();
  assert(notifAdyarData.success);
  const foundAlert = notifAdyarData.data.notifications.find(n => n.alert_id === alertResult.data.id);
  assert(foundAlert, 'Targeted notification was NOT delivered to Adyar resident!');
  assert.strictEqual(foundAlert.is_read, 0, 'Initial notification must be unread');
  console.log('PASS: Adyar citizen successfully received targeted notification.');

  // 5. Verify North citizen did NOT receive the Adyar alert
  const notifNorthRes = await fetch(`${BASE_URL}/api/v1/notifications`, {
    headers: { 'Authorization': `Bearer ${tokenNorth}` }
  });
  const notifNorthData = await notifNorthRes.json();
  const northHasAlert = notifNorthData.data.notifications.some(n => n.alert_id === alertResult.data.id);
  assert(!northHasAlert, 'Alert was incorrectly delivered to user outside the target zone!');
  console.log('PASS: Geographic targeting verified — User outside target zone did NOT receive alert.');

  // 6. Test mark as read
  const markReadRes = await fetch(`${BASE_URL}/api/v1/notifications/${foundAlert.id}/read`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tokenAdyar}` }
  });
  const markReadData = await markReadRes.json();
  assert(markReadData.success);
  console.log('PASS: In-app notification successfully marked as read.');

  console.log('=== TARGETED NOTIFICATION SUITE PASSED WITH 100% SUCCESS ===');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
