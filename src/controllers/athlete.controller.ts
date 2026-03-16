import { Request, Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

export const getAllAthletes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Vérifier si c'est une requête admin pour voir tous les utilisateurs (incluant supprimés)
    const includeDeleted = req.query.includeDeleted === 'true';
    
    const athletes = await prisma.athlete.findMany({
      where: {
        user: includeDeleted ? undefined : {
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
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    res.json(athletes);
  } catch (error) {
    console.error('Erreur lors de la récupération des athlètes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des athlètes' });
  }
};

export const getAthleteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        groups: {
          include: {
            group: true,
          },
        },
        sessions: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!athlete) {
      res.status(404).json({ error: 'Athlète non trouvé' });
      return;
    }

    res.json(athlete);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'athlète:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'athlète' });
  }
};

export const updateAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, category, level } = req.body;

    const athlete = await prisma.athlete.update({
      where: { id },
      data: {
        firstName,
        lastName,
        category,
        level,
      },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    res.json(athlete);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'athlète:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'athlète' });
  }
};

export const addAthleteToGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { athleteId, groupId } = req.body;

    const athleteGroup = await prisma.athleteGroup.create({
      data: {
        athleteId,
        groupId,
      },
      include: {
        athlete: true,
        group: true,
      },
    });

    res.status(201).json(athleteGroup);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'athlète au groupe:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'athlète au groupe' });
  }
};

export const removeAthleteFromGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { athleteId, groupId } = req.params;

    await prisma.athleteGroup.delete({
      where: {
        athleteId_groupId: {
          athleteId,
          groupId,
        },
      },
    });

    res.json({ message: 'Athlète retiré du groupe avec succès' });
  } catch (error) {
    console.error('Erreur lors du retrait de l\'athlète du groupe:', error);
    res.status(500).json({ error: 'Erreur lors du retrait de l\'athlète du groupe' });
  }
};

// Créer un nouvel athlète
export const createAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, category, level } = req.body;
    
    console.log('📝 Création athlète - Données reçues:', { email, firstName, lastName, category, level });

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('❌ Email déjà utilisé:', email);
      res.status(400).json({ error: 'Email déjà utilisé' });
      return;
    }

    console.log('🔐 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Mot de passe hashé');

    console.log('💾 Création de l\'utilisateur dans la base...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ATHLETE',
        athlete: {
          create: {
            firstName,
            lastName,
            category,
            level,
          },
        },
      },
      include: { athlete: true },
    });
    console.log('✅ Athlète créé avec succès:', user.athlete?.id);

    res.status(201).json({ message: 'Athlète créé avec succès', athlete: user.athlete });
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'athlète:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'athlète' });
  }
};

// Supprimer un athlète
export const deleteAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const athlete = await prisma.athlete.findUnique({ 
      where: { id },
      include: { user: true }
    });
    
    if (!athlete) {
      res.status(404).json({ error: 'Athlète non trouvé' });
      return;
    }

    // Soft delete: marquer l'utilisateur comme supprimé au lieu de le supprimer physiquement
    await prisma.user.update({
      where: { id: athlete.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      }
    });

    res.json({ message: 'Athlète supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'athlète:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'athlète' });
  }
};

// Obtenir les statistiques d'un athlète
export const getAthleteStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sessions = await prisma.athleteSession.count({
      where: { athleteId: id },
    });

    const groups = await prisma.athleteGroup.count({
      where: { athleteId: id },
    });

    const performances = await prisma.activityPerformanceData.count({
      where: { athleteId: id },
    });

    res.json({
      totalSessions: sessions,
      totalGroups: groups,
      totalPerformances: performances,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};
