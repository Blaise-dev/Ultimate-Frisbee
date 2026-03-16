import { Router } from 'express';
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  addAthleteToSession,
  removeAthleteFromSession,
  updateAthleteSessionStatus,
  getSessionAthletes,
  uploadSessionImage,
} from '../controllers/session.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSession } from '../middleware/uploadSession';

const router = Router();

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Récupérer toutes les séances
 *     tags: [Séances]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TRAINING, MATCH, OTHER]
 *         description: Filtrer par type de séance
 *       - in: query
 *         name: coachId
 *         schema:
 *           type: string
 *         description: Filtrer par ID du coach
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Liste des séances
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 */
router.get('/', authenticate, getAllSessions);

/**
 * @swagger
 * /api/sessions/athlete:
 *   post:
 *     summary: Inscrire un athlète à une séance
 *     tags: [Séances]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - athleteId
 *             properties:
 *               sessionId:
 *                 type: string
 *               athleteId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Athlète inscrit avec succès
 */
router.post('/athlete', authenticate, addAthleteToSession);
router.delete('/athlete', authenticate, removeAthleteFromSession);
router.put('/athlete/status', authenticate, authorize('ADMIN', 'COACH'), updateAthleteSessionStatus);

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Récupérer une séance par son ID
 *     tags: [Séances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de la séance
 *       404:
 *         description: Séance non trouvée
 */
router.get('/:id', authenticate, getSessionById);
router.get('/:id/athletes', authenticate, getSessionAthletes);

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Créer une nouvelle séance (Coach/Admin uniquement)
 *     tags: [Séances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - startTime
 *               - endTime
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TRAINING, MATCH, OTHER]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               isRecurrent:
 *                 type: boolean
 *               recurrence:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *     responses:
 *       201:
 *         description: Séance créée avec succès
 *       403:
 *         description: Accès refusé
 */
router.post('/', authenticate, authorize('ADMIN', 'COACH'), createSession);

/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Modifier une séance (Coach/Admin uniquement)
 *     tags: [Séances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Séance modifiée avec succès
 *       403:
 *         description: Accès refusé
 */
router.put('/:id', authenticate, authorize('ADMIN', 'COACH'), updateSession);

/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Supprimer une séance (Coach/Admin uniquement)
 *     tags: [Séances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Séance supprimée avec succès
 *       403:
 *         description: Accès refusé
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'COACH'), deleteSession);

/**
 * @swagger
 * /api/sessions/{id}/image:
 *   post:
 *     summary: Upload une image pour une séance
 *     tags: [Séances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la séance
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image (jpeg, jpg, png, gif, webp, max 10MB)
 *     responses:
 *       200:
 *         description: Image uploadée avec succès
 *       400:
 *         description: Aucun fichier fourni
 *       404:
 *         description: Séance non trouvée
 */
router.post('/:id/image', authenticate, authorize('ADMIN', 'COACH'), uploadSession.single('image'), uploadSessionImage);

export default router;

