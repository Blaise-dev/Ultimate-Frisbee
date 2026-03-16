import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Obtenir les statistiques d'un match (session de type MATCH)
 * Calcule les performances de tous les participants
 */
export const getMatchStats = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Récupérer la session avec les participants et activités
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sport: true,
        coach: true,
        athletes: {
          include: {
            athlete: {
              include: {
                user: true,
              },
            },
          },
        },
        activities: {
          include: {
            performanceData: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Calculer les statistiques par athlète
    const athleteStats = session.athletes.map((athleteSession) => {
      const participant = athleteSession.athlete;
      const athleteId = participant.id;
      
      // Trouver toutes les performances de cet athlète dans ce match
      const performances = session.activities
        .flatMap(activity => activity.performanceData)
        .filter(perf => perf.athleteId === athleteId);

      // Calculer les statistiques (points, passes, blocks, etc.)
      let points = 0;
      let assists = 0;
      let blocks = 0;
      let turnovers = 0;
      let catches = 0;

      performances.forEach(perf => {
        switch (perf.dataType.toLowerCase()) {
          case 'points':
            points += perf.value;
            break;
          case 'assists':
          case 'passes':
            assists += perf.value;
            break;
          case 'blocks':
            blocks += perf.value;
            break;
          case 'turnovers':
          case 'pertes':
            turnovers += perf.value;
            break;
          case 'catches':
          case 'receptions':
            catches += perf.value;
            break;
        }
      });

      // Calculer un score global (pondéré)
      const totalScore = (points * 3) + (assists * 2) + (blocks * 2) + catches - (turnovers * 2);

      return {
        athleteId,
        name: `${participant.firstName} ${participant.lastName}`,
        category: participant.category,
        level: participant.level,
        stats: {
          points,
          assists,
          blocks,
          turnovers,
          catches,
          totalScore,
        },
      };
    });

    // Trier par score total décroissant
    athleteStats.sort((a, b) => b.stats.totalScore - a.stats.totalScore);

    // Ajouter le rang
    const rankedStats = athleteStats.map((stat, index) => ({
      ...stat,
      rank: index + 1,
    }));

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          date: session.startTime,
          type: session.type,
          sport: session.sport?.name,
          coach: session.coach ? `${session.coach.firstName} ${session.coach.lastName}` : undefined,
        },
        participants: session.athletes.length,
        activities: session.activities.length,
        stats: rankedStats,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors du calcul des statistiques de match:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir l'évolution des performances d'un athlète sur tous ses matchs
 */
export const getAthleteMatchPerformance = async (req: Request, res: Response) => {
  try {
    const { athleteId } = req.params;
    const { startDate, endDate } = req.query;

    // Vérifier que l'athlète existe
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { user: true },
    });

    if (!athlete) {
      return res.status(404).json({ error: 'Athlète non trouvé' });
    }

    // Construire les filtres de date
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    // Récupérer toutes les sessions de type MATCH auxquelles l'athlète a participé
    const participations = await prisma.athleteSession.findMany({
      where: {
        athleteId,
        session: {
          type: 'MATCH',
          ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter }),
        },
      },
      include: {
        session: {
          include: {
            activities: {
              include: {
                performanceData: {
                  where: { athleteId },
                },
              },
            },
            coach: true,
            sport: true,
          },
        },
      },
    });

    // Calculer les statistiques par match
    const matchHistory = participations.map((participation) => {
      const session = participation.session;
      const performances = session.activities
        .flatMap(activity => activity.performanceData)
        .filter(perf => perf.athleteId === athleteId);

      let points = 0;
      let assists = 0;
      let blocks = 0;
      let turnovers = 0;
      let catches = 0;

      performances.forEach(perf => {
        switch (perf.dataType.toLowerCase()) {
          case 'points':
            points += perf.value;
            break;
          case 'assists':
          case 'passes':
            assists += perf.value;
            break;
          case 'blocks':
            blocks += perf.value;
            break;
          case 'turnovers':
          case 'pertes':
            turnovers += perf.value;
            break;
          case 'catches':
          case 'receptions':
            catches += perf.value;
            break;
        }
      });

      const totalScore = (points * 3) + (assists * 2) + (blocks * 2) + catches - (turnovers * 2);

      return {
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDate: session.startTime,
        coach: session.coach ? `${session.coach.firstName} ${session.coach.lastName}` : undefined,
        sport: session.sport?.name,
        stats: {
          points,
          assists,
          blocks,
          turnovers,
          catches,
        },
        score: totalScore,
      };
    }).sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

    // Calculer les moyennes
    const totalMatches = matchHistory.length;
    const totals = matchHistory.reduce(
      (acc, match) => ({
        points: acc.points + match.stats.points,
        assists: acc.assists + match.stats.assists,
        blocks: acc.blocks + match.stats.blocks,
        turnovers: acc.turnovers + match.stats.turnovers,
        catches: acc.catches + match.stats.catches,
        totalScore: acc.totalScore + match.score,
      }),
      { points: 0, assists: 0, blocks: 0, turnovers: 0, catches: 0, totalScore: 0 }
    );

    const averages = totalMatches > 0 ? {
      points: +(totals.points / totalMatches).toFixed(2),
      assists: +(totals.assists / totalMatches).toFixed(2),
      blocks: +(totals.blocks / totalMatches).toFixed(2),
      turnovers: +(totals.turnovers / totalMatches).toFixed(2),
      catches: +(totals.catches / totalMatches).toFixed(2),
      totalScore: +(totals.totalScore / totalMatches).toFixed(2),
    } : { points: 0, assists: 0, blocks: 0, turnovers: 0, catches: 0, totalScore: 0 };

    // Trouver le meilleur match
    const bestMatch = matchHistory.length > 0
      ? matchHistory.reduce((best, current) =>
          current.score > best.score ? current : best
        )
      : null;

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          category: athlete.category,
          level: athlete.level,
        },
        summary: {
          totalMatches,
          averages,
          totals,
          bestMatch,
        },
        matchHistory,
      },
      matches: matchHistory,
    });
  } catch (error: any) {
    console.error('Erreur lors du calcul des performances:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Comparer les performances de plusieurs athlètes
 */
export const compareAthletes = async (req: Request, res: Response) => {
  try {
    const { athleteIds } = req.query;

    if (!athleteIds || typeof athleteIds !== 'string') {
      return res.status(400).json({ error: 'athleteIds requis (format: id1,id2,id3)' });
    }

    const ids = (athleteIds as string).split(',');

    if (ids.length < 2) {
      return res.status(400).json({ error: 'Au moins 2 athlètes requis pour la comparaison' });
    }

    // Récupérer les statistiques de chaque athlète
    const comparisons = await Promise.all(
      ids.map(async (id) => {
        const athlete = await prisma.athlete.findUnique({
          where: { id },
        });

        if (!athlete) return null;

        // Calculer les statistiques globales
        const performances = await prisma.activityPerformanceData.findMany({
          where: { athleteId: id },
        });

        let points = 0;
        let assists = 0;
        let blocks = 0;
        let turnovers = 0;
        let catches = 0;

        performances.forEach(perf => {
          switch (perf.dataType.toLowerCase()) {
            case 'points':
              points += perf.value;
              break;
            case 'assists':
            case 'passes':
              assists += perf.value;
              break;
            case 'blocks':
              blocks += perf.value;
              break;
            case 'turnovers':
            case 'pertes':
              turnovers += perf.value;
              break;
            case 'catches':
            case 'receptions':
              catches += perf.value;
              break;
          }
        });

        const totalScore = (points * 3) + (assists * 2) + (blocks * 2) + catches - (turnovers * 2);

        return {
          athleteId: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          category: athlete.category,
          level: athlete.level,
          stats: {
            points,
            assists,
            blocks,
            turnovers,
            catches,
            totalScore,
          },
        };
      })
    );

    const validComparisons = comparisons.filter(c => c !== null);

    res.json({
      success: true,
      data: {
        athletes: validComparisons,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la comparaison:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
