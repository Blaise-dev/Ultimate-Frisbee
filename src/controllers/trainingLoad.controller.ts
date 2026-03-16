import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Analyser la charge d'entraînement pour un athlète
 */
export const getAthleteTrainingLoad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Valider les dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate et endDate sont requis (format: YYYY-MM-DD)',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide',
      });
    }

    // Vérifier que l'athlète existe
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlète non trouvé',
      });
    }

    // Récupérer toutes les séances de l'athlète dans la période
    const sessions = await prisma.session.findMany({
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
        athletes: {
          some: {
            athleteId: id,
            status: {
              in: ['registered', 'attended'], // Exclure les absences
            },
          },
        },
      },
      include: {
        activities: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Calculer les statistiques
    const totalSessions = sessions.length;
    
    // Calcul des heures totales
    const totalHours = sessions.reduce((sum, session) => {
      const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    // Calcul du nombre de semaines
    const periodDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const periodWeeks = Math.max(1, periodDays / 7);

    // Moyennes
    const avgSessionsPerWeek = totalSessions / periodWeeks;
    const avgHoursPerWeek = totalHours / periodWeeks;
    const avgHoursPerSession = totalSessions > 0 ? totalHours / totalSessions : 0;

    // Distribution par type de séance
    const sessionTypeDistribution = sessions.reduce((acc, session) => {
      acc[session.type] = (acc[session.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Distribution des activités par thème
    const activityThemeDistribution: Record<string, { count: number; totalDuration: number }> = {};
    let totalActivityDuration = 0;

    sessions.forEach(session => {
      session.activities.forEach(activity => {
        if (!activityThemeDistribution[activity.theme]) {
          activityThemeDistribution[activity.theme] = { count: 0, totalDuration: 0 };
        }
        activityThemeDistribution[activity.theme].count += 1;
        const duration = activity.duration || 0;
        activityThemeDistribution[activity.theme].totalDuration += duration;
        totalActivityDuration += duration;
      });
    });

    // Calculer les pourcentages
    const activityDistribution = Object.entries(activityThemeDistribution).map(([theme, data]) => ({
      theme,
      count: data.count,
      totalDuration: data.totalDuration,
      percentage: totalActivityDuration > 0 ? (data.totalDuration / totalActivityDuration) * 100 : 0,
    }));

    // Définir les seuils d'alerte
    const alerts: Array<{ level: 'low' | 'high' | 'critical'; message: string }> = [];

    if (avgHoursPerWeek < 2) {
      alerts.push({
        level: 'low',
        message: `Charge d'entraînement faible (${avgHoursPerWeek.toFixed(1)}h/semaine). Recommandé: 3-6h/semaine`,
      });
    } else if (avgHoursPerWeek > 10) {
      alerts.push({
        level: 'high',
        message: `Charge d'entraînement élevée (${avgHoursPerWeek.toFixed(1)}h/semaine). Risque de surcharge.`,
      });
    } else if (avgHoursPerWeek > 15) {
      alerts.push({
        level: 'critical',
        message: `Charge d'entraînement critique (${avgHoursPerWeek.toFixed(1)}h/semaine). Risque de blessure élevé.`,
      });
    }

    if (avgSessionsPerWeek > 6) {
      alerts.push({
        level: 'high',
        message: `Fréquence élevée (${avgSessionsPerWeek.toFixed(1)} séances/semaine). Prévoir récupération suffisante.`,
      });
    }

    // Répartition par semaine
    const weeklyBreakdown: Array<{
      week: string;
      sessions: number;
      hours: number;
    }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      const weekHours = weekSessions.reduce((sum, session) => {
        const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);

      weeklyBreakdown.push({
        week: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
        sessions: weekSessions.length,
        hours: parseFloat(weekHours.toFixed(2)),
      });

      currentDate.setDate(currentDate.getDate() + 7);
    }

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
        },
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          days: Math.round(periodDays),
          weeks: parseFloat(periodWeeks.toFixed(2)),
        },
        summary: {
          totalSessions,
          totalHours: parseFloat(totalHours.toFixed(2)),
          avgSessionsPerWeek: parseFloat(avgSessionsPerWeek.toFixed(2)),
          avgHoursPerWeek: parseFloat(avgHoursPerWeek.toFixed(2)),
          avgHoursPerSession: parseFloat(avgHoursPerSession.toFixed(2)),
        },
        sessionTypeDistribution,
        activityDistribution: activityDistribution.sort((a, b) => b.percentage - a.percentage),
        alerts,
        weeklyBreakdown,
      },
    });
  } catch (error) {
    console.error('Error calculating training load:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la charge d\'entraînement',
    });
  }
};
