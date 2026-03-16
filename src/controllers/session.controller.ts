import { Request, Response } from 'express';
import prisma from '../config/database';
import path from 'path';
import fs from 'fs';

export const getAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, startDate, endDate } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string);
      }
    }

    const sessions = await prisma.session.findMany({
      where: {
        ...where,
        coach: {
          user: {
            isDeleted: false,
          },
        },
      },
      include: {
        coach: true,
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
        activities: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Erreur lors de la récupération des séances:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des séances' });
  }
};

export const getSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        coach: true,
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
        activities: {
          include: {
            performanceData: {
              include: {
                athlete: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Séance non trouvée' });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error('Erreur lors de la récupération de la séance:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la séance' });
  }
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      type,
      coachId,
      sportId,
      startTime,
      endTime,
      location,
      description,
      imageUrl,
      isRecurrent,
      recurrence,
      athleteIds,
    } = req.body;

    const session = await prisma.session.create({
      data: {
        title,
        type,
        coachId,
        sportId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        description,
        imageUrl,
        isRecurrent,
        recurrence,
        athletes: athleteIds
          ? {
              create: athleteIds.map((athleteId: string) => ({
                athleteId,
              })),
            }
          : undefined,
      },
      include: {
        coach: true,
        sport: true,
        athletes: {
          include: {
            athlete: true,
          },
        },
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Erreur lors de la création de la séance:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la séance' });
  }
};

export const updateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      startTime,
      endTime,
      location,
      description,
      imageUrl,
      isRecurrent,
      recurrence,
    } = req.body;

    const session = await prisma.session.update({
      where: { id },
      data: {
        title,
        type,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        location,
        description,
        imageUrl,
        isRecurrent,
        recurrence,
      },
      include: {
        coach: true,
        athletes: {
          include: {
            athlete: true,
          },
        },
        activities: true,
      },
    });

    res.json(session);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la séance:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la séance' });
  }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.session.delete({
      where: { id },
    });

    res.json({ message: 'Séance supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la séance:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la séance' });
  }
};

export const addAthleteToSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, athleteId } = req.body;

    const athleteSession = await prisma.athleteSession.create({
      data: {
        sessionId,
        athleteId,
      },
      include: {
        athlete: true,
        session: true,
      },
    });

    res.status(201).json(athleteSession);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'athlète à la séance:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'athlète à la séance' });
  }
};

// Retirer un athlète d'une séance
export const removeAthleteFromSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, athleteId } = req.body;

    console.log('🗑️ Désinscription demandée:', { sessionId, athleteId, user: (req as any).user });

    await prisma.athleteSession.delete({
      where: {
        athleteId_sessionId: {
          athleteId,
          sessionId,
        },
      },
    });

    console.log('✅ Désinscription réussie');
    res.json({ message: 'Athlète retiré de la séance avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors du retrait de l\'athlète de la séance:', error);
    res.status(500).json({ error: 'Erreur lors du retrait de l\'athlète de la séance' });
  }
};

// Mettre à jour le statut d'un athlète dans une séance
export const updateAthleteSessionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, athleteId, status } = req.body;

    const athleteSession = await prisma.athleteSession.update({
      where: {
        athleteId_sessionId: {
          athleteId,
          sessionId,
        },
      },
      data: { status },
    });

    res.json({ message: 'Statut mis à jour avec succès', athleteSession });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
};

// Obtenir les athlètes d'une séance
export const getSessionAthletes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const athletes = await prisma.athleteSession.findMany({
      where: { sessionId: id },
      include: {
        athlete: {
          include: {
            user: {
              select: { email: true },
            },
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

// Upload d'image pour une séance
export const uploadSessionImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'Aucun fichier fourni' });
      return;
    }

    // Vérifier que la séance existe
    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      // Supprimer le fichier uploadé si la séance n'existe pas
      fs.unlinkSync(file.path);
      res.status(404).json({ message: 'Séance non trouvée' });
      return;
    }

    // URL de l'image
    const imageUrl = `/uploads/sessions/${file.filename}`;

    // Supprimer l'ancienne image si elle existe
    if (session.imageUrl) {
      const oldImagePath = path.join(__dirname, '../../', session.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Mettre à jour la base de données
    const updatedSession = await prisma.session.update({
      where: { id },
      data: { imageUrl },
      include: {
        coach: true,
        athletes: {
          include: {
            athlete: true,
          },
        },
      },
    });

    res.json({
      message: 'Image de séance uploadée avec succès',
      session: updatedSession,
      imageUrl
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
