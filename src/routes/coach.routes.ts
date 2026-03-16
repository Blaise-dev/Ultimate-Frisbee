import { Router } from 'express';
import {
  getAllCoaches,
  getCoachById,
  createCoach,
  updateCoach,
  deleteCoach,
  getCoachStats,
} from '../controllers/coach.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/coaches:
 *   get:
 *     summary: Récupérer tous les coachs
 *     tags: [Coachs]
 *     responses:
 *       200:
 *         description: Liste des coachs
 */
router.get('/', authenticate, getAllCoaches);

/**
 * @swagger
 * /api/coaches/{id}:
 *   get:
 *     summary: Récupérer un coach par son ID
 *     tags: [Coachs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du coach
 */
router.get('/:id', authenticate, getCoachById);

/**
 * @swagger
 * /api/coaches:
 *   post:
 *     summary: Créer un nouveau coach (Admin uniquement)
 *     tags: [Coachs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Coach créé avec succès
 */
router.post('/', authenticate, authorize('ADMIN'), createCoach);

router.put('/:id', authenticate, authorize('ADMIN'), updateCoach);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCoach);
router.get('/:id/stats', authenticate, getCoachStats);

export default router;
