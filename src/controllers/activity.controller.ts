import { Request, Response } from 'express';
import prisma from '../config/database';

export const getActivitiesBySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const activities = await prisma.activity.findMany({
      where: { sessionId },
      include: {
        performanceData: {
          include: {
            athlete: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json(activities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des activités' });
  }
};

export const createActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, name, theme, description, duration, order } = req.body;

    const activity = await prisma.activity.create({
      data: {
        sessionId,
        name,
        theme,
        description,
        duration,
        order: order || 0,
      },
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'activité' });
  }
};

export const updateActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, theme, description, duration, order } = req.body;

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        name,
        theme,
        description,
        duration,
        order,
      },
    });

    res.json(activity);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'activité:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'activité' });
  }
};

export const deleteActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.activity.delete({
      where: { id },
    });

    res.json({ message: 'Activité supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'activité:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'activité' });
  }
};

export const addPerformanceData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activityId, athleteId, dataType, value, unit, notes } = req.body;

    const performanceData = await prisma.activityPerformanceData.create({
      data: {
        activityId,
        athleteId,
        dataType,
        value,
        unit,
        notes,
      },
      include: {
        activity: true,
        athlete: true,
      },
    });

    res.status(201).json(performanceData);
  } catch (error) {
    console.error('Erreur lors de l\'ajout des données de performance:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout des données de performance' });
  }
};

export const getPerformanceDataByAthlete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { athleteId } = req.params;

    const performanceData = await prisma.activityPerformanceData.findMany({
      where: { athleteId },
      include: {
        activity: {
          include: {
            session: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(performanceData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de performance:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de performance' });
  }
};

/**
 * Mettre à jour les performances en lot pour plusieurs athlètes
 * Supprime les anciennes performances et crée les nouvelles
 */
export const upsertBulkPerformanceData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activityId, performances } = req.body;

    if (!activityId || !Array.isArray(performances)) {
      res.status(400).json({ error: 'activityId et performances (array) requis' });
      return;
    }

    // Supprimer toutes les anciennes performances pour cette activité
    await prisma.activityPerformanceData.deleteMany({
      where: { activityId }
    });

    // Créer les nouvelles performances
    const created: any[] = [];
    for (const perf of performances) {
      const { athleteId, stats } = perf;
      
      // Créer une entrée pour chaque type de stat
      for (const [dataType, value] of Object.entries(stats)) {
        if (typeof value === 'number') {
          const data = await prisma.activityPerformanceData.create({
            data: {
              activityId,
              athleteId,
              dataType,
              value,
            }
          });
          created.push(data);
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `${created.length} performances enregistrées`,
      count: created.length 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des performances:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des performances' });
  }
};
