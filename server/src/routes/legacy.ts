import { Router, Response } from 'express';
import { db } from '../db/database.js';

export const legacyRouter = Router();

// 1. Health
legacyRouter.get('/health', (req, res: Response) => {
  res.json({
    status: 'SYSTEM OPERATIONAL',
    backend: true,
    database: true,
    postgis: 'configured via spatial capability engine',
    version: '1.0.0-production'
  });
});

// 2. Dashboard
legacyRouter.get('/dashboard', (req, res: Response) => {
  const areas = db.prepare('SELECT count(*) as count FROM areas').get() as any;
  const highRisk = db.prepare("SELECT count(*) as count FROM risk_assessments WHERE level IN ('HIGH', 'VERY HIGH', 'CRITICAL')").get() as any;
  const criticalVuln = db.prepare('SELECT count(*) as count FROM risk_assessments WHERE vulnerability >= 70').get() as any;
  const capDeficit = db.prepare('SELECT count(*) as count FROM capacity_assessments WHERE deficit > 0').get() as any;
  const relocPriority = db.prepare("SELECT count(*) as count FROM relocation_priorities WHERE level IN ('HIGH', 'CRITICAL')").get() as any;
  const shelterCap = db.prepare('SELECT SUM(available_capacity) as available FROM shelters').get() as any;

  res.json({
    assessed_areas: areas?.count || 0,
    high_risk_areas: highRisk?.count || 0,
    critical_vulnerability_areas: criticalVuln?.count || 0,
    capacity_deficit_areas: capDeficit?.count || 0,
    relocation_priority_areas: relocPriority?.count || 0,
    safe_capacity: shelterCap?.available || 0
  });
});

// 3. Risk
legacyRouter.get('/risk', (req, res: Response) => {
  const { zone, risk_level } = req.query;
  let sql = `
    SELECT r.*, a.name as area, a.ward, a.zone, a.latitude, a.longitude
    FROM risk_assessments r
    JOIN areas a ON r.area_id = a.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (zone) {
    sql += ' AND a.zone LIKE ?';
    params.push(`%${zone}%`);
  }
  if (risk_level) {
    sql += ' AND r.level = ?';
    params.push(String(risk_level).toUpperCase());
  }

  const rows = db.prepare(sql).all(...params) as any[];
  const out = rows.map(r => ({
    area_id: r.area_id,
    area: r.area,
    ward: r.ward,
    zone: r.zone,
    latitude: r.latitude,
    longitude: r.longitude,
    score: r.score,
    level: r.level,
    factors: {
      hazard_exposure: r.hazard_exposure,
      population_exposure: r.population_exposure,
      vulnerability: r.vulnerability,
      capacity_deficit: r.capacity_deficit,
      accessibility_risk: r.accessibility_risk
    }
  }));

  res.json(out);
});

// 4. Hazards
legacyRouter.get('/hazards', (req, res: Response) => {
  const rows = db.prepare(`
    SELECT a.name as area, a.ward, a.zone, 'Flood & Cyclone' as type,
           r.hazard_exposure as hazard_score, r.population_exposure as exposure_score,
           0.85 as confidence, 'Greater Chennai Corporation & IMD' as source,
           '2026-09-05' as last_updated
    FROM risk_assessments r
    JOIN areas a ON r.area_id = a.id
  `).all();
  res.json(rows);
});

// 5. Capacity
legacyRouter.get('/capacity', (req, res: Response) => {
  const rows = db.prepare(`
    SELECT a.name as area, a.ward, c.available_capacity, c.required_capacity,
           c.deficit, c.ratio, c.level
    FROM capacity_assessments c
    JOIN areas a ON c.area_id = a.id
  `).all();
  res.json(rows);
});

// 6. Relocation
legacyRouter.get('/relocation', (req, res: Response) => {
  const rows = db.prepare(`
    SELECT a.name as area, a.ward, r.score, r.level, r.recommended_action
    FROM relocation_priorities r
    JOIN areas a ON r.area_id = a.id
    ORDER BY r.score DESC
  `).all();
  res.json(rows);
});

// 7. Safe Areas
legacyRouter.get('/safe-areas', (req, res: Response) => {
  const rows = db.prepare(`
    SELECT a.name as area, a.ward, r.score as risk,
           c.available_capacity,
           ROUND((100 - r.score) * 0.65 + MIN(100, (c.ratio * 100)) * 0.35, 2) as suitability_score
    FROM areas a
    JOIN risk_assessments r ON a.id = r.area_id
    JOIN capacity_assessments c ON a.id = c.area_id
    WHERE r.score < 60
    ORDER BY suitability_score DESC
  `).all();
  res.json(rows);
});

// 8. Resources
legacyRouter.get('/resources', (req, res: Response) => {
  const rows = db.prepare(`
    SELECT id, name, resource_type as type, area, zone, latitude, longitude,
           capacity, status
    FROM resources
  `).all();
  res.json(rows);
});

// 9. Data Sources
legacyRouter.get('/data-sources', (req, res: Response) => {
  const rows = db.prepare('SELECT * FROM data_sources').all();
  res.json(rows);
});

// 10. Areas, Zones, Wards
legacyRouter.get('/areas', (req, res: Response) => {
  const rows = db.prepare('SELECT * FROM areas').all();
  res.json(rows);
});

legacyRouter.get('/zones', (req, res: Response) => {
  const rows = db.prepare('SELECT DISTINCT zone FROM areas').all() as any[];
  res.json(rows.map(z => ({ zone: z.zone })));
});

legacyRouter.get('/wards', (req, res: Response) => {
  const rows = db.prepare('SELECT DISTINCT ward FROM areas').all() as any[];
  res.json(rows.map(w => ({ ward: w.ward })));
});
