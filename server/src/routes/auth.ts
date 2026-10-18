import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/database.js';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  preferred_zone: z.string().optional(),
  preferred_ward: z.string().optional(),
  preferred_language: z.enum(['en', 'ta']).default('en'),
});

const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const AuthorityLoginSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string(),
  role: z.enum(['OPERATOR', 'ANALYST', 'ADMIN']).optional(),
});

// 1. Citizen Sign Up
authRouter.post('/register', (req, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(data.email, data.username);
    if (existing) {
      res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'A user with this email or username already exists.' }
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, preferred_language, preferred_zone, preferred_ward)
      VALUES (?, ?, ?, 'PUBLIC_USER', ?, ?, ?)
    `);

    const result = stmt.run(
      data.username,
      data.email,
      passwordHash,
      data.preferred_language,
      data.preferred_zone || null,
      data.preferred_ward || null
    );

    const userId = Number(result.lastInsertRowid);
    const authUser = {
      id: userId,
      username: data.username,
      email: data.email,
      role: 'PUBLIC_USER' as const,
      preferred_zone: data.preferred_zone,
      preferred_ward: data.preferred_ward,
      preferred_language: data.preferred_language
    };

    const token = generateToken(authUser);

    // Record audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'USER_REGISTRATION', 'USERS', ?, 'New public citizen registered.')
    `).run(userId, data.username, 'PUBLIC_USER', String(userId));

    res.status(201).json({
      success: true,
      data: {
        token,
        user: authUser
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.errors ? err.errors[0].message : err.message }
    });
  }
});

// 2. User Sign In (Public Citizen)
authRouter.post('/login', (req, res: Response) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(data.email, data.email) as any;

    if (!user || !bcrypt.compareSync(data.password, user.password_hash)) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/username or password.' }
      });
      return;
    }

    const authUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      preferred_zone: user.preferred_zone,
      preferred_ward: user.preferred_ward,
      preferred_language: user.preferred_language
    };

    const token = generateToken(authUser);

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'USER_LOGIN', 'AUTH', ?, 'User logged in successfully.')
    `).run(user.id, user.username, user.role, String(user.id));

    res.json({
      success: true,
      data: {
        token,
        user: authUser
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message }
    });
  }
});

// 3. Authority Login (OPERATOR, ANALYST, ADMIN)
authRouter.post('/authority-login', (req, res: Response) => {
  try {
    const data = AuthorityLoginSchema.parse(req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(data.usernameOrEmail, data.usernameOrEmail) as any;

    if (!user || !bcrypt.compareSync(data.password, user.password_hash)) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid authority credentials.' }
      });
      return;
    }

    if (!['OPERATOR', 'ANALYST', 'ADMIN'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This account does not have emergency authority access.' }
      });
      return;
    }

    const authUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      preferred_zone: user.preferred_zone,
      preferred_ward: user.preferred_ward,
      preferred_language: user.preferred_language
    };

    const token = generateToken(authUser);

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'AUTHORITY_LOGIN', 'COMMAND_CENTER', ?, 'Authority command center login verified.')
    `).run(user.id, user.username, user.role, String(user.id));

    res.json({
      success: true,
      data: {
        token,
        user: authUser
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message }
    });
  }
});

// 4. Session Verification & Profile
authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }
  const user = db.prepare('SELECT id, username, email, role, preferred_language, preferred_zone, preferred_ward, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, data: user });
});

// 5. Update Preferences
authRouter.patch('/preferences', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { preferred_language, preferred_zone, preferred_ward } = req.body;
  db.prepare(`
    UPDATE users
    SET preferred_language = COALESCE(?, preferred_language),
        preferred_zone = COALESCE(?, preferred_zone),
        preferred_ward = COALESCE(?, preferred_ward)
    WHERE id = ?
  `).run(preferred_language || null, preferred_zone || null, preferred_ward || null, req.user.id);

  const updated = db.prepare('SELECT id, username, email, role, preferred_language, preferred_zone, preferred_ward FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, data: updated });
});
