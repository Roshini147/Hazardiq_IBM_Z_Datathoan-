import { Router, Response } from 'express';
import { db } from '../db/database.js';

export const auditLogsRouter = Router();

auditLogsRouter.get('/', (req, res: Response) => {
  const { action, limit } = req.query;
  const max = Math.min(100, parseInt(String(limit) || '50', 10));

  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (action) {
    sql += ' AND action LIKE ?';
    params.push(`%${action}%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(max);

  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, data: rows });
});
