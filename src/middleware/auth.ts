import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token manquant' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
    };

    // Vérifier si l'utilisateur existe toujours et n'est pas supprimé
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isDeleted: true, isBanned: true }
    });

    if (!user) {
      res.status(401).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    if (user.isDeleted) {
      res.status(403).json({ error: 'Ce compte a été supprimé' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Ce compte a été banni' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    next();
  };
};
