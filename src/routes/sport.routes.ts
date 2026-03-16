import { Router } from 'express';
import {
  getAllSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport,
  getSportThemes,
} from '../controllers/sport.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/sports:
 *   get:
 *     summary: Récupérer tous les sports actifs
 *     tags: [Sports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des sports
 */
router.get('/', authenticate, getAllSports);

/**
 * @swagger
 * /api/sports/{id}:
 *   get:
 *     summary: Récupérer un sport par ID
 *     tags: [Sports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du sport
 *       404:
 *         description: Sport non trouvé
 */
router.get('/:id', authenticate, getSportById);

/**
 * @swagger
 * /api/sports/{id}/themes:
 *   get:
 *     summary: Récupérer les thèmes disponibles pour un sport
 *     tags: [Sports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des thèmes du sport
 */
router.get('/:id/themes', authenticate, getSportThemes);

/**
 * @swagger
 * /api/sports:
 *   post:
 *     summary: Créer un nouveau sport (ADMIN uniquement)
 *     tags: [Sports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - themes
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               themes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Sport créé avec succès
 */
router.post('/', authenticate, authorize('ADMIN'), createSport);

/**
 * @swagger
 * /api/sports/{id}:
 *   put:
 *     summary: Mettre à jour un sport (ADMIN uniquement)
 *     tags: [Sports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sport mis à jour
 */
router.put('/:id', authenticate, authorize('ADMIN'), updateSport);

/**
 * @swagger
 * /api/sports/{id}:
 *   delete:
 *     summary: Supprimer un sport (ADMIN uniquement)
 *     tags: [Sports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sport supprimé ou désactivé
 */
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSport);

export default router;
