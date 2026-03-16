import { Router } from 'express';
import { getMatchStats, getAthleteMatchPerformance, compareAthletes } from '../controllers/matchStats.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/match-stats/session/:sessionId
 * @desc Obtenir les statistiques d'un match avec classement des joueurs
 * @access Authenticated
 */
router.get('/session/:sessionId', authenticate, getMatchStats);

/**
 * @route GET /api/match-stats/athlete/:athleteId
 * @desc Obtenir l'évolution des performances d'un athlète sur tous ses matchs
 * @query startDate, endDate (optional)
 * @access Authenticated
 */
router.get('/athlete/:athleteId', authenticate, getAthleteMatchPerformance);

/**
 * @route GET /api/match-stats/compare
 * @desc Comparer les performances de plusieurs athlètes
 * @query athleteIds (required, format: id1,id2,id3)
 * @access Authenticated
 */
router.get('/compare', authenticate, compareAthletes);

export default router;
