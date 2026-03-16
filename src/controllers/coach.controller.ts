import { Request, Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

// Récupérer tous les coachs
export const getAllCoaches = async (req: Request, res: Response): Promise<void> => {
  try {
    // Vérifier si c'est une requête admin pour voir tous les utilisateurs (incluant supprimés)
    const includeDeleted = req.query.includeDeleted === 'true';
    
    const coaches = await prisma.coach.findMany({
      where: includeDeleted ? {} : {
        user: {
          isDeleted: false,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            isBanned: true,
            bannedAt: true,
            isDeleted: true,
            deletedAt: true,
          },
        },
        sessions: {
          select: {
            id: true,
            title: true,
            type: true,
            startTime: true,
          },
        },
      },
    });

    res.json(coaches);
  } catch (error) {
    console.error('Erreur lors de la récupération des coachs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des coachs' });
  }
};

// Récupérer un coach par son ID
export const getCoachById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        groups: true,
        sessions: {
          include: {
            athletes: {
              include: {
                athlete: true,
              },
            },
            activities: true,
          },
        },
      },
    });

    if (!coach) {
      res.status(404).json({ error: 'Coach non trouvé' });
      return;
    }

    res.json(coach);
  } catch (error) {
    console.error('Erreur lors de la récupération du coach:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du coach' });
  }
};

// Créer un nouveau coach
export const createCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, specialization, experienceYears } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'COACH',
        coach: {
          create: {
            firstName,
            lastName,
            specialization: specialization || null,
            experienceYears: experienceYears ? Number(experienceYears) : null,
          },
        },
      },
      include: { coach: true },
    });

    res.status(201).json({ message: 'Coach créé avec succès', coach: user.coach });
  } catch (error) {
    console.error('Erreur lors de la création du coach:', error);
    res.status(500).json({ error: 'Erreur lors de la création du coach' });
  }
};

// Mettre à jour un coach
export const updateCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, specialization, experienceYears } = req.body;

    const updateData: any = {
      firstName,
      lastName,
    };

    if (specialization !== undefined) {
      updateData.specialization = specialization || null;
    }

    if (experienceYears !== undefined) {
      updateData.experienceYears = experienceYears ? Number(experienceYears) : null;
    }

    const coach = await prisma.coach.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: 'Coach mis à jour avec succès', coach });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du coach:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du coach' });
  }
};

// Supprimer un coach
export const deleteCoach = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const coach = await prisma.coach.findUnique({ 
      where: { id },
      include: { user: true }
    });
    
    if (!coach) {
      res.status(404).json({ error: 'Coach non trouvé' });
      return;
    }

    // Soft delete: marquer l'utilisateur comme supprimé au lieu de le supprimer physiquement
    await prisma.user.update({
      where: { id: coach.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      }
    });

    res.json({ message: 'Coach supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du coach:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du coach' });
  }
};

// Obtenir les statistiques d'un coach
export const getCoachStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const totalSessions = await prisma.session.count({
      where: { coachId: id },
    });

    const upcomingSessions = await prisma.session.count({
      where: {
        coachId: id,
        startTime: {
          gte: new Date(),
        },
      },
    });

    const pastSessions = await prisma.session.count({
      where: {
        coachId: id,
        endTime: {
          lt: new Date(),
        },
      },
    });

    res.json({
      totalSessions,
      upcomingSessions,
      pastSessions,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};
