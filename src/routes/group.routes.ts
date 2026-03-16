import { Router } from 'express';
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupStats,
  joinGroup,
  leaveGroup,
} from '../controllers/group.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllGroups);

// Routes pour inscription/désinscription des athlètes (AVANT /:id)
router.post('/join', authenticate, joinGroup);
router.delete('/leave', authenticate, leaveGroup);

// Routes avec paramètres (APRÈS les routes spécifiques)
router.get('/:id', authenticate, getGroupById);
router.post('/', authenticate, authorize('ADMIN', 'COACH'), createGroup);
router.put('/:id', authenticate, authorize('ADMIN', 'COACH'), updateGroup);
router.delete('/:id', authenticate, authorize('ADMIN', 'COACH'), deleteGroup);
router.get('/:id/stats', authenticate, getGroupStats);

export default router;
