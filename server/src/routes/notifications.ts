import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const notificationsRouter = Router();

// 1. Get user notifications
notificationsRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }

  const notifications = db.prepare(`
    SELECT n.*, a.severity, a.hazard_type, a.affected_zone
    FROM notifications n
    LEFT JOIN alerts a ON n.alert_id = a.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 100
  `).all(req.user.id);

  const unreadCount = (db.prepare('SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id) as any)?.count || 0;

  res.json({
    success: true,
    data: {
      unread_count: unreadCount,
      notifications
    }
  });
});

// 2. Mark specific notification as read
notificationsRouter.patch('/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true, message: 'Notification marked as read.' });
});

// 3. Mark all as read
notificationsRouter.post('/mark-all-read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true, message: 'All notifications marked as read.' });
});
