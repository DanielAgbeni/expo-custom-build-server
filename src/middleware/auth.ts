import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import type { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  userId: string;
  userEmail: string;
  userRole?: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token as string;
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as AuthRequest).userId    = payload.userId;
    (req as AuthRequest).userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById((req as AuthRequest).userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    (req as AuthRequest).userRole = user.role;
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};