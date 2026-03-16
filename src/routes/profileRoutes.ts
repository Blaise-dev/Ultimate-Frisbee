import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadProfile } from '../middleware/upload';
import { 
  getProfile, 
  updateProfile, 
  uploadPhoto, 
  banUser, 
  unbanUser,
  deleteOwnAccount,
  deleteUserAccount
} from '../controllers/profileController';

const router = Router();

// Routes pour le profil utilisateur
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/profile/photo', authenticate, uploadProfile.single('photo'), uploadPhoto);
router.delete('/profile', authenticate, deleteOwnAccount);

// Routes admin pour bannir/débannir
router.post('/admin/ban/:userId', authenticate, banUser);
router.post('/admin/unban/:userId', authenticate, unbanUser);
router.delete('/admin/delete/:userId', authenticate, deleteUserAccount);

export default router;
