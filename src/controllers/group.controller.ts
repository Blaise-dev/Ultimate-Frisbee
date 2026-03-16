import { Request, Response } from 'express';
import prisma from '../config/database';

export const getAllGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          {
            coachId: null, // Groupes sans coach
          },
          {
            coach: {
              user: {
                isDeleted: false, // Groupes avec coach non supprimé
              },
            },
          },
        ],
      },
      include: {
        coach: {
          include: {
            user: {
              select: {
                email: true,
                isDeleted: true,
              },
            },
          },
        },
        sport: true,
        athletes: {
          where: {
            athlete: {
              user: {
                isDeleted: false,
              },
            },
          },
          include: {
            athlete: true,
          },
        },
      },
    });

    console.log(`📊 Groupes trouvés: ${groups.length}`);
    res.json(groups);
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des groupes' });
  }
};

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, description, coachId } = req.body;
    console.log('🏗️ Création groupe - Données reçues:', { name, type, description, coachId });

    const group = await prisma.group.create({
      data: {
        name,
        type,
        description,
        coachId: coachId || null,
      },
      include: {
        coach: {
          include: {
            user: {
              select: {
                email: true,
                isDeleted: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ Groupe créé:', group);
    res.status(201).json(group);
  } catch (error) {
    console.error('❌ Erreur lors de la création du groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la création du groupe' });
  }
};

export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, description, coachId, sportId } = req.body;

    const updateData: any = {
      name,
      type,
      description,
    };

    if (coachId !== undefined) {
      updateData.coachId = coachId || null;
    }

    if (sportId !== undefined) {
      updateData.sportId = sportId || null;
    }

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
      include: {
        coach: true,
      },
    });

    res.json(group);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du groupe' });
  }
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.group.delete({
      where: { id },
    });

    res.json({ message: 'Groupe supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du groupe' });
  }
};

// Récupérer un groupe par son ID
export const getGroupById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        coach: {
          include: {
            user: {
              select: {
                email: true,
                isDeleted: true,
              },
            },
          },
        },
        athletes: {
          where: {
            athlete: {
              user: {
                isDeleted: false,
              },
            },
          },
          include: {
            athlete: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    res.json(group);
  } catch (error) {
    console.error('Erreur lors de la récupération du groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du groupe' });
  }
};

// Obtenir les statistiques d'un groupe
export const getGroupStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const athleteCount = await prisma.athleteGroup.count({
      where: { groupId: id },
    });

    res.json({
      totalAthletes: athleteCount,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

// Inscrire un athlète à un groupe
export const joinGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId, athleteId } = req.body;

    console.log('📝 Inscription au groupe demandée:', { groupId, athleteId });

    // Vérifier si l'athlète est déjà dans le groupe
    const existing = await prisma.athleteGroup.findUnique({
      where: {
        athleteId_groupId: {
          athleteId,
          groupId,
        },
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Vous êtes déjà membre de ce groupe' });
      return;
    }

    await prisma.athleteGroup.create({
      data: {
        athleteId,
        groupId,
      },
    });

    console.log('✅ Inscription au groupe réussie');
    res.status(201).json({ message: 'Inscription au groupe réussie' });
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription au groupe:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription au groupe' });
  }
};

// Désinscrire un athlète d'un groupe
export const leaveGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId, athleteId } = req.body;

    console.log('🗑️ Désinscription du groupe demandée:', { groupId, athleteId });

    await prisma.athleteGroup.delete({
      where: {
        athleteId_groupId: {
          athleteId,
          groupId,
        },
      },
    });

    console.log('✅ Désinscription du groupe réussie');
    res.json({ message: 'Désinscription du groupe réussie' });
  } catch (error) {
    console.error('❌ Erreur lors de la désinscription du groupe:', error);
    res.status(500).json({ error: 'Erreur lors de la désinscription du groupe' });
  }
};
