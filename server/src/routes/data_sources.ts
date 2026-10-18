import { Router, Response } from 'express';
import { db } from '../db/database.js';

export const dataSourcesRouter = Router();

dataSourcesRouter.get('/', (req, res: Response) => {
  const rows = db.prepare('SELECT * FROM data_sources ORDER BY confidence DESC').all();
  res.json({ success: true, data: rows });
});
