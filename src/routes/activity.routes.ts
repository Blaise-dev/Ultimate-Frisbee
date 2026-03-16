import { Router } from 'express';
import {
  getActivitiesBySession,
  createActivity,
  updateActivity,
  deleteActivity,
  addPerformanceData,
  getPerformanceDataByAthlete,
  upsertBulkPerformanceData,
} from '../controllers/activity.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/session/:sessionId', authenticate, getActivitiesBySession);
router.post('/', authenticate, authorize('ADMIN', 'COACH'), createActivity);
router.put('/:id', authenticate, authorize('ADMIN', 'COACH'), updateActivity);
router.delete('/:id', authenticate, authorize('ADMIN', 'COACH'), deleteActivity);
router.post('/performance', authenticate, authorize('ADMIN', 'COACH'), addPerformanceData);
router.post('/performance/bulk', authenticate, authorize('ADMIN', 'COACH'), upsertBulkPerformanceData);
router.get('/performance/athlete/:athleteId', authenticate, getPerformanceDataByAthlete);

export default router;
