import { Router } from 'express';
import { getAthleteTrainingLoad } from '../controllers/trainingLoad.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/training-load/athlete/{id}:
 *   get:
 *     summary: Analyser la charge d'entraînement d'un athlète
 *     tags: [Training Load]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'athlète
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Analyse de la charge d'entraînement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     athlete:
 *                       type: object
 *                     period:
 *                       type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSessions:
 *                           type: number
 *                         totalHours:
 *                           type: number
 *                         avgSessionsPerWeek:
 *                           type: number
 *                         avgHoursPerWeek:
 *                           type: number
 *                     activityDistribution:
 *                       type: array
 *                     alerts:
 *                       type: array
 *                     weeklyBreakdown:
 *                       type: array
 *       400:
 *         description: Paramètres manquants ou invalides
 *       404:
 *         description: Athlète non trouvé
 */
router.get('/athlete/:id', authenticate, getAthleteTrainingLoad);

export default router;
