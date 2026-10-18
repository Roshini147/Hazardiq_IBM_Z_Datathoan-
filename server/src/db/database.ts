import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { parseCSV } from './csv_parser.js';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'hazardiq.db');
export const db = new DatabaseSync(DB_PATH);

export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PUBLIC_USER' CHECK(role IN ('PUBLIC_USER', 'OPERATOR', 'ANALYST', 'ADMIN')),
      preferred_language TEXT NOT NULL DEFAULT 'en',
      preferred_zone TEXT,
      preferred_ward TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Shelters Table (Capacity Management)
  db.exec(`
    CREATE TABLE IF NOT EXISTS shelters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      facility_type TEXT NOT NULL,
      address TEXT NOT NULL,
      area TEXT NOT NULL,
      zone TEXT NOT NULL,
      ward TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      total_capacity INTEGER NOT NULL CHECK(total_capacity >= 0),
      current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK(current_occupancy >= 0),
      available_capacity INTEGER NOT NULL DEFAULT 0,
      capacity_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(capacity_status IN ('AVAILABLE', 'LIMITED', 'FULL', 'NOT_AVAILABLE')),
      operational_status TEXT NOT NULL DEFAULT 'Operational',
      has_generator INTEGER DEFAULT 0,
      has_water INTEGER DEFAULT 1,
      has_toilets INTEGER DEFAULT 1,
      has_medical INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ix_shelters_zone ON shelters(zone);
    CREATE INDEX IF NOT EXISTS ix_shelters_ward ON shelters(ward);
    CREATE INDEX IF NOT EXISTS ix_shelters_status ON shelters(capacity_status);
  `);

  // 3. Relocation Allocations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS relocation_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shelter_id INTEGER NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
      affected_zone TEXT NOT NULL,
      affected_ward TEXT,
      allocated_count INTEGER NOT NULL CHECK(allocated_count > 0),
      authorized_by_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'ALLOCATED' CHECK(status IN ('ALLOCATED', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED')),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Alerts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_ta TEXT,
      severity TEXT NOT NULL CHECK(severity IN ('INFORMATION', 'ADVISORY', 'WARNING', 'EMERGENCY')),
      hazard_type TEXT NOT NULL,
      affected_district TEXT DEFAULT 'Chennai',
      affected_zone TEXT,
      affected_ward TEXT,
      message TEXT NOT NULL,
      message_ta TEXT,
      recommended_action TEXT NOT NULL,
      recommended_action_ta TEXT,
      source TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK(verification_status IN ('UNVERIFIED', 'UNDER_REVIEW', 'VERIFIED')),
      is_active INTEGER NOT NULL DEFAULT 1,
      issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT
    );
  `);

  // 5. Targeted In-App Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alert_id INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ix_notifications_user ON notifications(user_id, is_read);
  `);

  // 6. Citizen Incident Reports
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
      people_affected INTEGER DEFAULT 0,
      area_name TEXT NOT NULL,
      zone TEXT NOT NULL,
      ward TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT NOT NULL DEFAULT 'REPORTED' CHECK(status IN ('REPORTED', 'UNDER_REVIEW', 'VERIFIED', 'RESOLVED')),
      reporter_name TEXT,
      reporter_phone TEXT,
      reported_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ix_incidents_status ON incidents(status);
  `);

  // 7. Areas (Wards / Zones)
  db.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ward TEXT NOT NULL,
      zone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      population INTEGER DEFAULT 0,
      households INTEGER DEFAULT 0,
      elevation_m REAL DEFAULT 5.0
    );
  `);

  // 8. Emergency Resources (Hospitals)
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT,
      name TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      area TEXT DEFAULT '',
      zone TEXT DEFAULT '',
      latitude REAL,
      longitude REAL,
      capacity INTEGER DEFAULT 0,
      emergency_phone TEXT,
      is_emergency_24x7 INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Operational'
    );
  `);

  // 9. Historical Disaster Events
  db.exec(`
    CREATE TABLE IF NOT EXISTS disaster_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      disaster_type TEXT NOT NULL,
      event_date TEXT,
      year INTEGER,
      affected_area TEXT,
      affected_zone TEXT,
      severity TEXT,
      rainfall_mm REAL,
      people_affected INTEGER,
      people_evacuated INTEGER,
      deaths INTEGER,
      primary_cause TEXT
    );
  `);

  // 10. Derived Assessments (Backwards-compatibility & ML indicators)
  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
      hazard_exposure REAL NOT NULL,
      population_exposure REAL NOT NULL,
      vulnerability REAL NOT NULL,
      capacity_deficit REAL NOT NULL,
      accessibility_risk REAL NOT NULL,
      score REAL NOT NULL,
      level TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS capacity_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
      available_capacity REAL NOT NULL,
      required_capacity REAL NOT NULL,
      deficit REAL NOT NULL,
      ratio REAL NOT NULL,
      level TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relocation_priorities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
      score REAL NOT NULL,
      level TEXT NOT NULL,
      recommended_action TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      data_type TEXT,
      coverage TEXT,
      source_url TEXT,
      retrieved_at TEXT,
      confidence REAL DEFAULT 0.8
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDataIfEmpty();
}

function seedDataIfEmpty() {
  const shelterCount = db.prepare('SELECT count(*) as count FROM shelters').get() as { count: number };
  if (shelterCount.count > 0) {
    console.log('Database already initialized and populated.');
    return;
  }

  console.log('Seeding HAZARDIQ database from real Chennai datasets...');
  const DATA_DIR = path.resolve(process.cwd(), '../data');

  // Seed Default Users
  const salt = bcrypt.genSaltSync(10);
  const operatorHash = bcrypt.hashSync('Operator@123', salt);
  const analystHash = bcrypt.hashSync('Analyst@123', salt);
  const adminHash = bcrypt.hashSync('Admin@123', salt);
  const citizenHash = bcrypt.hashSync('Citizen@123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, preferred_language, preferred_zone, preferred_ward)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('tn_operator', 'operator@hazardiq.tn.gov.in', operatorHash, 'OPERATOR', 'en', 'Zone 13 - Adyar', 'Ward 172');
  insertUser.run('tn_analyst', 'analyst@hazardiq.tn.gov.in', analystHash, 'ANALYST', 'en', 'Zone 13 - Adyar', 'Ward 172');
  insertUser.run('tn_admin', 'admin@hazardiq.tn.gov.in', adminHash, 'ADMIN', 'en', 'Zone 10 - Kodambakkam', 'Ward 131');
  insertUser.run('citizen_user', 'citizen@gmail.com', citizenHash, 'PUBLIC_USER', 'ta', 'Zone 13 - Adyar', 'Ward 172');

  // Parse Population
  let popTotal = 4646732;
  const popRows = parseCSV(path.join(DATA_DIR, 'chennai_district_population_census2011.csv'));
  for (const r of popRows) {
    if (r.Category && r.Category.startsWith('Total Population')) {
      const val = parseInt(r.Total.replace(/,/g, ''), 10);
      if (!isNaN(val)) popTotal = val;
    }
  }

  // Parse Elevation
  const elevRows = parseCSV(path.join(DATA_DIR, 'chennai_elevation.csv'));
  const elevList: { lat: number; lon: number; elev: number }[] = [];
  for (const e of elevRows) {
    const lat = parseFloat(e.latitude);
    const lon = parseFloat(e.longitude);
    const elev = parseFloat(e.elevation_m);
    if (!isNaN(lat) && !isNaN(lon) && !isNaN(elev)) {
      elevList.push({ lat, lon, elev });
    }
  }

  // Parse and Ingest Shelters
  const shelterRows = parseCSV(path.join(DATA_DIR, 'chennai_evacuation_relief_shelter_capacity.csv'));
  const insertShelter = db.prepare(`
    INSERT INTO shelters (
      external_id, name, facility_type, address, area, zone, ward, latitude, longitude,
      total_capacity, current_occupancy, available_capacity, capacity_status, operational_status,
      has_generator, has_water, has_toilets, has_medical
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const wardGroups: Record<string, typeof shelterRows> = {};

  for (const s of shelterRows) {
    const extId = s.shelter_id || `CHS_${Math.random()}`;
    const name = s.shelter_name || 'Designated Relief Shelter';
    const ftype = s.facility_type || 'Shelter';
    const addr = s.address || '';
    const area = s.area || '';
    const zone = s.zone || 'Chennai Central';
    const ward = s.ward || 'Ward 1';
    let lat: number | null = parseFloat(s.latitude);
    let lon: number | null = parseFloat(s.longitude);
    if (isNaN(lat!) || isNaN(lon!)) {
      lat = null;
      lon = null;
    }
    const cap = parseInt(s.capacity_persons, 10) || 100;
    const occ = 0;
    const avail = cap;
    const status = 'AVAILABLE';
    const opStatus = s.operational_status || 'Operational';
    const gen = s.backup_generator === 'True' ? 1 : 0;
    const water = s.drinking_water === 'True' ? 1 : 0;
    const toilets = s.toilets_available === 'True' ? 1 : 0;
    const med = s.medical_support_available === 'True' ? 1 : 0;

    insertShelter.run(
      extId, name, ftype, addr, area, zone, ward, lat, lon,
      cap, occ, avail, status, opStatus, gen, water, toilets, med
    );

    const key = `${zone}___${ward}`;
    if (!wardGroups[key]) wardGroups[key] = [];
    wardGroups[key].push(s);
  }

  // Parse and Ingest Hospitals / Resources
  const hospRows = parseCSV(path.join(DATA_DIR, 'chennai_hospitals_emergency_facilities.csv'));
  const insertResource = db.prepare(`
    INSERT INTO resources (
      external_id, name, resource_type, area, zone, latitude, longitude,
      capacity, emergency_phone, is_emergency_24x7, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const h of hospRows) {
    const extId = h.facility_id || `CH_${Math.random()}`;
    const name = h.facility_name || 'Hospital';
    const rtype = h.facility_type || 'Hospital';
    const area = h.area || '';
    const zone = h.zone || '';
    const lat = parseFloat(h.latitude) || 13.0827;
    const lon = parseFloat(h.longitude) || 80.2707;
    const beds = parseInt(h.total_beds, 10) || 0;
    const ephone = h.phone || h.emergency_phone || '108';
    const e24 = h.emergency_24x7 === 'True' ? 1 : 0;
    const stat = h.operational_status || 'Operational';

    insertResource.run(extId, name, rtype, area, zone, lat, lon, beds, ephone, e24, stat);
  }

  // Parse Historical Disaster Damage
  const damageRows = parseCSV(path.join(DATA_DIR, 'chennai_historical_disaster_damage.csv'));
  const insertDamage = db.prepare(`
    INSERT INTO disaster_events (
      event_id, name, disaster_type, event_date, year, affected_area, affected_zone,
      severity, rainfall_mm, people_affected, people_evacuated, deaths, primary_cause
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const d of damageRows) {
    const eid = d.event_id || `EVT_${Math.random()}`;
    const dname = d.disaster_name || 'Chennai Disaster Event';
    const dtype = d.disaster_type || 'Flood';
    const edate = d.event_date || '';
    const year = parseInt(d.year, 10) || 2015;
    const aarea = d.affected_area || '';
    const azone = d.affected_zone || '';
    const sev = d.severity_level || 'High';
    const rain = parseFloat(d.rainfall_mm) || null;
    const aff = parseInt(d.people_affected, 10) || null;
    const evac = parseInt(d.people_evacuated, 10) || null;
    const deaths = parseInt(d.deaths, 10) || null;
    const cause = d.primary_cause || '';

    insertDamage.run(eid, dname, dtype, edate, year, aarea, azone, sev, rain, aff, evac, deaths, cause);
  }

  // Generate Administrative Areas and Assessments
  const insertArea = db.prepare(`
    INSERT INTO areas (name, ward, zone, latitude, longitude, population, households, elevation_m)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRisk = db.prepare(`
    INSERT INTO risk_assessments (
      area_id, hazard_exposure, population_exposure, vulnerability, capacity_deficit,
      accessibility_risk, score, level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCap = db.prepare(`
    INSERT INTO capacity_assessments (
      area_id, available_capacity, required_capacity, deficit, ratio, level
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertReloc = db.prepare(`
    INSERT INTO relocation_priorities (
      area_id, score, level, recommended_action
    ) VALUES (?, ?, ?, ?)
  `);

  const entries = Object.entries(wardGroups);
  const totalAreas = entries.length;

  for (let i = 0; i < totalAreas; i++) {
    const [key, rows] = entries[i];
    const [zone, ward] = key.split('___');
    const areaName = `${ward} (${zone.split(' - ')[1] || zone})`;

    // Derive centroid coordinates
    let latSum = 0, lonSum = 0, count = 0;
    for (const r of rows) {
      const lat = parseFloat(r.latitude);
      const lon = parseFloat(r.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        latSum += lat;
        lonSum += lon;
        count++;
      }
    }
    const lat = count > 0 ? latSum / count : 13.0827 + (Math.random() - 0.5) * 0.1;
    const lon = count > 0 ? lonSum / count : 80.2707 + (Math.random() - 0.5) * 0.1;

    // Approximate elevation from DEM
    let elevation = 6.0;
    if (elevList.length > 0) {
      let minDist = Infinity;
      for (const e of elevList) {
        const d = Math.pow(e.lat - lat, 2) + Math.pow(e.lon - lon, 2);
        if (d < minDist) {
          minDist = d;
          elevation = e.elev;
        }
      }
    }

    const pop = Math.max(15000, Math.floor(popTotal / totalAreas));
    const hh = Math.floor(pop / 4.2);

    const areaRes = insertArea.run(areaName, ward, zone, lat, lon, pop, hh, elevation);
    const areaId = Number(areaRes.lastInsertRowid);

    // Dynamic factors based on actual elevation and shelter capacity
    const lowElevRisk = Math.max(0, Math.min(100, 100 - elevation * 8));
    const hazardExposure = Math.round((lowElevRisk * 0.65 + 35) * 10) / 10;
    const popExposure = Math.round((pop / 30000 * 50) * 10) / 10;
    const vulnerability = Math.round(Math.min(95, 30 + lowElevRisk * 0.35 + (elevation < 4 ? 25 : 0)) * 10) / 10;
    const accessibilityRisk = Math.round(Math.max(10, Math.min(90, lowElevRisk * 0.5 + 20)) * 10) / 10;

    // Shelter capacity for this ward
    const wardShelters = db.prepare('SELECT SUM(total_capacity) as cap FROM shelters WHERE ward = ?').get(ward) as { cap: number };
    const availableCap = wardShelters.cap || 200;
    const requiredCap = Math.round(pop * 0.04);
    const deficit = Math.max(0, requiredCap - availableCap);
    const ratio = availableCap / Math.max(1, requiredCap);
    const capDeficitFactor = Math.min(100, Math.round((deficit / requiredCap) * 100));

    // Calculate Composite Risk Score (0 - 100)
    const compositeScore = Math.round(
      (0.30 * hazardExposure + 0.20 * popExposure + 0.25 * vulnerability + 0.15 * capDeficitFactor + 0.10 * accessibilityRisk) * 10
    ) / 10;

    let riskLevel = 'LOW';
    if (compositeScore >= 80) riskLevel = 'CRITICAL';
    else if (compositeScore >= 65) riskLevel = 'VERY HIGH';
    else if (compositeScore >= 50) riskLevel = 'HIGH';
    else if (compositeScore >= 35) riskLevel = 'MODERATE';

    insertRisk.run(
      areaId, hazardExposure, popExposure, vulnerability, capDeficitFactor, accessibilityRisk,
      compositeScore, riskLevel
    );

    let capLevel = 'SUFFICIENT';
    if (deficit > 500) capLevel = 'CRITICAL DEFICIT';
    else if (deficit > 0) capLevel = 'MODERATE DEFICIT';

    insertCap.run(areaId, availableCap, requiredCap, deficit, ratio, capLevel);

    // Relocation Priority
    const relocScore = Math.round(
      (0.35 * compositeScore + 0.25 * vulnerability + 0.20 * capDeficitFactor + 0.10 * popExposure + 0.10 * accessibilityRisk) * 10
    ) / 10;

    let relocLevel = 'MONITORING';
    let action = 'Maintain standard monitoring and community preparedness.';
    if (relocScore >= 75) {
      relocLevel = 'CRITICAL';
      action = 'Immediate high-priority evacuation routing to upstream safe relief centers.';
    } else if (relocScore >= 60) {
      relocLevel = 'HIGH';
      action = 'Prepare emergency relief shelters and pre-position transport assets.';
    } else if (relocScore >= 45) {
      relocLevel = 'MODERATE';
      action = 'Issue local safety advisories and verify institutional shelter readiness.';
    }

    insertReloc.run(areaId, relocScore, relocLevel, action);
  }

  // Seed Data Sources
  const insertSource = db.prepare(`
    INSERT INTO data_sources (name, description, data_type, coverage, source_url, retrieved_at, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertSource.run(
    'Greater Chennai Corporation Relief Centres 2025',
    'Official designated relief center list with addresses, ward mappings, and rated capacity.',
    'Disaster Preparedness Shelter Registry',
    'Zones 1–15, Greater Chennai Corporation (215 Centres)',
    'https://chennaicorporation.gov.in/gcc/pdf/Relief_Center_details.pdf',
    '2026-09-05',
    0.95
  );

  insertSource.run(
    'Census of India 2011 & Statistical Handbook',
    'Official population demographic enumeration and literacy breakdown for Chennai district.',
    'Demographics & Housing Census',
    'Chennai District (Core & Expanded Municipal Limits)',
    'https://chennai.nic.in/?p=2778',
    '2026-09-05',
    0.90
  );

  insertSource.run(
    'Chennai District Disaster Management Authority (TNSDMA)',
    'Historical flood inundation and severe cyclone impact assessments (2015, Vardah, Nivar, 2021, Michaung).',
    'Historical Disaster Damage Records',
    'Chennai Coastal & River Basin Localities',
    'https://floodlist.com/asia/india-10-dead-cyclone-vardah-tamil-nadu-andhra-pradesh',
    '2026-09-05',
    0.92
  );

  insertSource.run(
    'Survey of India Digital Elevation Dataset',
    'Topographical height above mean sea level across Chennai coordinates.',
    'Digital Elevation Model (DEM)',
    'Chennai District Urban Region (12.85N-13.15N, 80.10E-80.28E)',
    'https://chennai.nic.in',
    '2026-09-05',
    0.85
  );

  // Seed Initial Government Alerts (Bilingual English + Tamil)
  const insertAlert = db.prepare(`
    INSERT INTO alerts (
      title, title_ta, severity, hazard_type, affected_district, affected_zone, affected_ward,
      message, message_ta, recommended_action, recommended_action_ta, source, verification_status, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlert.run(
    'River Inundation Advisory: Adyar Basin',
    'ஆற்று வெள்ளப்பெருக்கு அறிவுறுத்தல்: அடையாறு வடிநிலம்',
    'WARNING',
    'Flood',
    'Chennai',
    'Zone 13 - Adyar',
    'Ward 172',
    'Water level elevated near Saidapet bridge and low-lying banks. Corporation relief shelters activated.',
    'சைதாப்பேட்டை பாலம் மற்றும் தாழ்வான கரையோரப் பகுதிகளில் நீர்மட்டம் உயர்ந்துள்ளது. மாநகராட்சி நிவாரண முகாம்கள் செயல்படத் தொடங்கியுள்ளன.',
    'Residents in low-lying ground floors are advised to move to designated safe schools.',
    'தாழ்வான பகுதிகளில் உள்ள பொதுமக்கள் உடனடியாக அருகிலுள்ள பாதுகாப்பான நிவாரண மையங்களுக்குச் செல்லவும்.',
    'State Disaster Management Authority (TNSDMA)',
    'VERIFIED',
    1
  );

  insertAlert.run(
    'Severe Rainfall Alert: North Chennai Zones',
    'கனமழை எச்சரிக்கை: வடசென்னை பகுதிகள்',
    'ADVISORY',
    'Heavy Rainfall',
    'Chennai',
    'Zone 1 - Thiruvottiyur',
    'Ward 4',
    'Intense rain bands passing over Manali, Ennore, and Thiruvottiyur. Sump pump operations underway.',
    'மணலி, எண்ணூர் மற்றும் திருவொற்றியூர் பகுதிகளில் பலத்த மழை பெய்து வருகிறது. ராட்சத மோட்டார்கள் மூலம் நீர் வெளியேற்றப்பட்டு வருகிறது.',
    'Avoid traveling along coastal arterial roads during peak rainfall hours.',
    'மழை தீவிரமாக இருக்கும் போது கடற்கரை பிரதான சாலைகளில் பயணிப்பதைத் தவிர்க்கவும்.',
    'Regional Meteorological Centre (IMD Chennai)',
    'VERIFIED',
    1
  );

  // Seed Initial Audit Log
  db.prepare(`
    INSERT INTO audit_logs (username, role, action, entity, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('SYSTEM', 'SYSTEM', 'INITIALIZATION', 'DATABASE', 'ALL', 'Initial schema creation, dataset ingestion, and baseline risk scoring complete.');

  console.log('Database initialization complete!');
}
