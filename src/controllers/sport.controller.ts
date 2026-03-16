import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Récupérer tous les sports
 */
export const getAllSports = async (req: Request, res: Response) => {
  try {
    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            groups: true,
            sessions: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: sports,
    });
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sports',
    });
  }
};

/**
 * Récupérer un sport par ID
 */
export const getSportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sport = await prisma.sport.findUnique({
      where: { id },
      include: {
        groups: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        sessions: {
          select: {
            id: true,
            title: true,
            type: true,
            startTime: true,
          },
          take: 10,
          orderBy: { startTime: 'desc' },
        },
        _count: {
          select: {
            groups: true,
            sessions: true,
          },
        },
      },
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Sport non trouvé',
      });
    }

    res.json({
      success: true,
      data: sport,
    });
  } catch (error) {
    console.error('Error fetching sport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du sport',
    });
  }
};

/**
 * Créer un nouveau sport (ADMIN seulement)
 */
export const createSport = async (req: Request, res: Response) => {
  try {
    const { name, description, themes } = req.body;

    // Validation
    if (!name || !themes || !Array.isArray(themes)) {
      return res.status(400).json({
        success: false,
        message: 'Nom et thèmes (array) sont requis',
      });
    }

    // Vérifier si le sport existe déjà
    const existingSport = await prisma.sport.findUnique({
      where: { name },
    });

    if (existingSport) {
      return res.status(400).json({
        success: false,
        message: 'Un sport avec ce nom existe déjà',
      });
    }

    const sport = await prisma.sport.create({
      data: {
        name,
        description,
        themes,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sport créé avec succès',
      data: sport,
    });
  } catch (error) {
    console.error('Error creating sport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du sport',
    });
  }
};

/**
 * Mettre à jour un sport (ADMIN seulement)
 */
export const updateSport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, themes, isActive } = req.body;

    const sport = await prisma.sport.findUnique({ where: { id } });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Sport non trouvé',
      });
    }

    const updatedSport = await prisma.sport.update({
      where: { id },
      data: {
        name: name || sport.name,
        description: description !== undefined ? description : sport.description,
        themes: themes || sport.themes,
        isActive: isActive !== undefined ? isActive : sport.isActive,
      },
    });

    res.json({
      success: true,
      message: 'Sport mis à jour avec succès',
      data: updatedSport,
    });
  } catch (error) {
    console.error('Error updating sport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du sport',
    });
  }
};

/**
 * Supprimer un sport (soft delete - ADMIN seulement)
 */
export const deleteSport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sport = await prisma.sport.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            groups: true,
            sessions: true,
          },
        },
      },
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Sport non trouvé',
      });
    }

    // Vérifier si le sport est utilisé
    if (sport._count.groups > 0 || sport._count.sessions > 0) {
      // Soft delete
      await prisma.sport.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json({
        success: true,
        message: `Sport désactivé (${sport._count.groups} groupes et ${sport._count.sessions} séances associés)`,
      });
    }

    // Hard delete si non utilisé
    await prisma.sport.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Sport supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting sport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du sport',
    });
  }
};

/**
 * Récupérer les thèmes disponibles pour un sport
 */
export const getSportThemes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sport = await prisma.sport.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        themes: true,
      },
    });

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: 'Sport non trouvé',
      });
    }

    res.json({
      success: true,
      data: {
        sportId: sport.id,
        sportName: sport.name,
        themes: sport.themes,
      },
    });
  } catch (error) {
    console.error('Error fetching sport themes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des thèmes',
    });
  }
};
