import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

export const alertsRouter = Router();

const CreateAlertSchema = z.object({
  title: z.string().min(3),
  title_ta: z.string().optional(),
  severity: z.enum(['INFORMATION', 'ADVISORY', 'WARNING', 'EMERGENCY']),
  hazard_type: z.string(),
  affected_district: z.string().default('Chennai'),
  affected_zone: z.string().optional(),
  affected_ward: z.string().optional(),
  message: z.string().min(5),
  message_ta: z.string().optional(),
  recommended_action: z.string().min(5),
  recommended_action_ta: z.string().optional(),
  source: z.string().default('State Disaster Management Authority (TNSDMA)'),
});

// 1. List Alerts (Public)
alertsRouter.get('/', (req, res: Response) => {
  const { zone, severity, active } = req.query;
  let sql = 'SELECT * FROM alerts WHERE 1=1';
  const params: any[] = [];

  if (active !== undefined && active !== '') {
    sql += ' AND is_active = ?';
    params.push(active === 'true' || active === '1' ? 1 : 0);
  } else {
    sql += ' AND is_active = 1';
  }

  if (zone) {
    sql += " AND (affected_zone LIKE ? OR affected_zone IS NULL OR affected_zone = '' OR affected_zone = 'Citywide')";
    params.push(`%${zone}%`);
  }

  if (severity) {
    sql += ' AND severity = ?';
    params.push(String(severity).toUpperCase());
  }

  sql += " ORDER BY CASE severity WHEN 'EMERGENCY' THEN 1 WHEN 'WARNING' THEN 2 WHEN 'ADVISORY' THEN 3 ELSE 4 END, issued_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, data: rows });
});

// 2. Get Alert by ID
alertsRouter.get('/:id', (req, res: Response) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } });
    return;
  }
  res.json({ success: true, data: alert });
});

// 3. Publish Targeted Alert (Authority Only)
alertsRouter.post('/', authenticateToken, requireRole(['OPERATOR', 'ANALYST', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = CreateAlertSchema.parse(req.body);

    const insertStmt = db.prepare(`
      INSERT INTO alerts (
        title, title_ta, severity, hazard_type, affected_district, affected_zone, affected_ward,
        message, message_ta, recommended_action, recommended_action_ta, source, verification_status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 1)
    `);

    const result = insertStmt.run(
      data.title,
      data.title_ta || data.title,
      data.severity,
      data.hazard_type,
      data.affected_district,
      data.affected_zone || 'Citywide',
      data.affected_ward || null,
      data.message,
      data.message_ta || data.message,
      data.recommended_action,
      data.recommended_action_ta || data.recommended_action,
      data.source
    );

    const alertId = Number(result.lastInsertRowid);

    // TARGETED NOTIFICATION ENGINE:
    // Identify registered users associated with affected geography
    let targetUsers: any[] = [];
    if (!data.affected_zone || data.affected_zone === 'Citywide') {
      targetUsers = db.prepare('SELECT id FROM users').all();
    } else {
      targetUsers = db.prepare("SELECT id FROM users WHERE preferred_zone = ? OR preferred_zone IS NULL OR preferred_zone = ''").all(data.affected_zone);
    }

    const insertNotification = db.prepare(`
      INSERT INTO notifications (user_id, alert_id, title, message, is_read)
      VALUES (?, ?, ?, ?, 0)
    `);

    for (const u of targetUsers) {
      insertNotification.run(
        u.id,
        alertId,
        `[${data.severity}] ${data.title}`,
        data.message
      );
    }

    // Record in audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'PUBLISH_ALERT', 'ALERT', ?, ?)
    `).run(
      req.user?.id,
      req.user?.username,
      req.user?.role,
      String(alertId),
      `Published ${data.severity} alert for ${data.affected_zone || 'Citywide'}. Dispatched targeted in-app notifications to ${targetUsers.length} users.`
    );

    res.status(201).json({
      success: true,
      data: {
        id: alertId,
        ...data,
        targeted_recipients_count: targetUsers.length
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.errors ? err.errors[0].message : err.message }
    });
  }
});
