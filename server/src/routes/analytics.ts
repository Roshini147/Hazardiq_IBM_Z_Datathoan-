import { Router, Response } from 'express';
import { db } from '../db/database.js';

export const analyticsRouter = Router();

// 1. Overview Dashboard Metrics
analyticsRouter.get('/overview', (req, res: Response) => {
  const areas = db.prepare('SELECT count(*) as count FROM areas').get() as any;
  const highRisk = db.prepare("SELECT count(*) as count FROM risk_assessments WHERE level IN ('HIGH', 'VERY HIGH', 'CRITICAL')").get() as any;
  const criticalVuln = db.prepare('SELECT count(*) as count FROM risk_assessments WHERE vulnerability >= 70').get() as any;
  const capDeficit = db.prepare('SELECT count(*) as count FROM capacity_assessments WHERE deficit > 0').get() as any;
  const relocPriority = db.prepare("SELECT count(*) as count FROM relocation_priorities WHERE level IN ('HIGH', 'CRITICAL')").get() as any;

  // Safe capacity
  const shelterCap = db.prepare('SELECT SUM(total_capacity) as total, SUM(current_occupancy) as occupied, SUM(available_capacity) as available FROM shelters').get() as any;
  const activeAlerts = db.prepare('SELECT count(*) as count FROM alerts WHERE is_active = 1').get() as any;
  const reportedIncidents = db.prepare("SELECT count(*) as count FROM incidents WHERE status IN ('REPORTED', 'UNDER_REVIEW')").get() as any;

  res.json({
    success: true,
    data: {
      assessed_areas: areas?.count || 0,
      high_risk_areas: highRisk?.count || 0,
      critical_vulnerability_areas: criticalVuln?.count || 0,
      capacity_deficit_areas: capDeficit?.count || 0,
      relocation_priority_areas: relocPriority?.count || 0,
      safe_capacity: shelterCap?.available || 0,
      total_shelter_capacity: shelterCap?.total || 0,
      current_shelter_occupancy: shelterCap?.occupied || 0,
      active_alerts: activeAlerts?.count || 0,
      open_incidents: reportedIncidents?.count || 0,
      emergency_status: activeAlerts?.count > 0 ? 'ELEVATED' : 'NORMAL'
    }
  });
});

// 2. Risk Distribution Chart
analyticsRouter.get('/risk-distribution', (req, res: Response) => {
  const rows = db.prepare(`
    SELECT level, count(*) as count
    FROM risk_assessments
    GROUP BY level
    ORDER BY CASE level WHEN 'CRITICAL' THEN 1 WHEN 'VERY HIGH' THEN 2 WHEN 'HIGH' THEN 3 WHEN 'MODERATE' THEN 4 ELSE 5 END
  `).all();
  res.json({ success: true, data: rows });
});

// 3. Historical Disaster Records
analyticsRouter.get('/historical-disasters', (req, res: Response) => {
  const rows = db.prepare('SELECT * FROM disaster_events ORDER BY year DESC, event_date DESC').all();
  res.json({ success: true, data: rows });
});
