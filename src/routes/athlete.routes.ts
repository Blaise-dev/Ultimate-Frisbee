import { Router } from 'express';
import {
  getAllAthletes,
  getAthleteById,
  createAthlete,
  updateAthlete,
  deleteAthlete,
  addAthleteToGroup,
  removeAthleteFromGroup,
  getAthleteStats,
} from '../controllers/athlete.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllAthletes);
router.get('/:id', authenticate, getAthleteById);
router.post('/', authenticate, authorize('ADMIN', 'COACH'), createAthlete);
router.put('/:id', authenticate, authorize('ADMIN', 'COACH'), updateAthlete);
router.delete('/:id', authenticate, authorize('ADMIN', 'COACH'), deleteAthlete);
router.get('/:id/stats', authenticate, getAthleteStats);
router.post('/group', authenticate, authorize('ADMIN', 'COACH'), addAthleteToGroup);
router.delete('/:athleteId/group/:groupId', authenticate, authorize('ADMIN', 'COACH'), removeAthleteFromGroup);

export default router;
