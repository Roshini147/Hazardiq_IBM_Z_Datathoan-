import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const incidentsRouter = Router();

const ReportIncidentSchema = z.object({
  incident_type: z.string().min(2),
  description: z.string().min(5),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  people_affected: z.number().int().nonnegative().default(0),
  area_name: z.string().min(2),
  zone: z.string().min(2),
  ward: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  reporter_name: z.string().optional(),
  reporter_phone: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['REPORTED', 'UNDER_REVIEW', 'VERIFIED', 'RESOLVED']),
  resolution_notes: z.string().optional()
});

// 1. Submit Incident (Public Citizen)
incidentsRouter.post('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = ReportIncidentSchema.parse(req.body);

    const reporterName = data.reporter_name || req.user?.username || 'Anonymous Resident';
    const reporterPhone = data.reporter_phone || null;

    const stmt = db.prepare(`
      INSERT INTO incidents (
        incident_type, description, severity, people_affected, area_name, zone, ward,
        latitude, longitude, status, reporter_name, reporter_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'REPORTED', ?, ?)
    `);

    const result = stmt.run(
      data.incident_type,
      data.description,
      data.severity,
      data.people_affected,
      data.area_name,
      data.zone,
      data.ward || null,
      data.latitude || null,
      data.longitude || null,
      reporterName,
      reporterPhone
    );

    const incidentId = Number(result.lastInsertRowid);

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'INCIDENT_SUBMISSION', 'INCIDENT', ?, ?)
    `).run(
      req.user?.id || null,
      req.user?.username || 'Public Citizen',
      req.user?.role || 'PUBLIC_USER',
      String(incidentId),
      `Reported ${data.severity} ${data.incident_type} in ${data.area_name} (${data.zone}).`
    );

    res.status(201).json({
      success: true,
      data: {
        id: incidentId,
        status: 'REPORTED',
        message: 'Incident reported successfully. Emergency response team notified.'
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.errors ? err.errors[0].message : err.message }
    });
  }
});

// 2. List Incidents
incidentsRouter.get('/', (req, res: Response) => {
  const { status, zone, severity } = req.query;
  let sql = 'SELECT * FROM incidents WHERE 1=1';
  const params: any[] = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(String(status).toUpperCase());
  }
  if (zone) {
    sql += ' AND zone LIKE ?';
    params.push(`%${zone}%`);
  }
  if (severity) {
    sql += ' AND severity = ?';
    params.push(String(severity).toUpperCase());
  }

  sql += ' ORDER BY reported_at DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, data: rows });
});

// 3. Update Incident Status (Authority Only)
incidentsRouter.patch('/:id/status', authenticateToken, requireRole(['OPERATOR', 'ANALYST', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = UpdateStatusSchema.parse(req.body);
    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id) as any;

    if (!incident) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } });
      return;
    }

    db.prepare('UPDATE incidents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.status, incident.id);

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'INCIDENT_STATUS_UPDATE', 'INCIDENT', ?, ?)
    `).run(
      req.user?.id,
      req.user?.username,
      req.user?.role,
      String(incident.id),
      `Updated incident #${incident.id} (${incident.incident_type}) from ${incident.status} to ${data.status}.`
    );

    res.json({
      success: true,
      data: {
        id: incident.id,
        status: data.status,
        message: `Incident status updated to ${data.status}.`
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
  }
});
