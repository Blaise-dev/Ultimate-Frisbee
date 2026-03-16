import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/config';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, category, level } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Cet email est déjà utilisé' });
      return;
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur avec transaction pour créer aussi le profil
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        ...(role === 'ATHLETE' && {
          athlete: {
            create: {
              firstName,
              lastName,
              category: category || 'SENIOR',
              level: level || 'BEGINNER',
            },
          },
        }),
        ...(role === 'COACH' && {
          coach: {
            create: {
              firstName,
              lastName,
            },
          },
        }),
      },
      include: {
        athlete: true,
        coach: true,
      },
    });

    // Générer le token JWT
    // @ts-ignore
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as string }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.athlete || user.coach,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        athlete: true,
        coach: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Vérifier si l'utilisateur est supprimé
    if (user.isDeleted) {
      res.status(403).json({ 
        error: 'Accès refusé', 
        message: 'Ce compte a été supprimé.',
        deletedAt: user.deletedAt 
      });
      return;
    }

    // Vérifier si l'utilisateur est banni
    if (user.isBanned) {
      res.status(403).json({ 
        error: 'Accès refusé', 
        message: 'Votre compte a été banni. Contactez un administrateur.',
        bannedAt: user.bannedAt 
      });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Générer le token
    // @ts-ignore
    const signOptions: SignOptions = { expiresIn: config.jwt.expiresIn };
    // @ts-ignore
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      signOptions
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.athlete || user.coach,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        athlete: {
          include: {
            groups: {
              include: {
                group: true,
              },
            },
          },
        },
        coach: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.athlete || user.coach,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
};
