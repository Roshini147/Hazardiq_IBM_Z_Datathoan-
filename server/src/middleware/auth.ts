import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'hazardiq_super_secure_secret_key_2026';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'PUBLIC_USER' | 'OPERATOR' | 'ANALYST' | 'ADMIN';
  preferred_zone?: string;
  preferred_ward?: string;
  preferred_language?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      preferred_zone: user.preferred_zone,
      preferred_ward: user.preferred_ward,
      preferred_language: user.preferred_language,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication token required.' }
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Invalid or expired session token.' }
      });
      return;
    }
    req.user = decoded as AuthUser;
    next();
  });
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireRole(allowedRoles: ('OPERATOR' | 'ANALYST' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as any)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}` }
      });
      return;
    }

    next();
  };
}
