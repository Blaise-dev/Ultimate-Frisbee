import { Response } from 'express';
import prisma from '../config/database';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';

// Mettre à jour le profil (nom, prénom)
export const updateProfile = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { athlete: true, coach: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    let updatedProfile;

    if (user.role === 'ATHLETE' && user.athlete) {
      updatedProfile = await prisma.athlete.update({
        where: { id: user.athlete.id },
        data: { firstName, lastName }
      });
    } else if (user.role === 'COACH' && user.coach) {
      updatedProfile = await prisma.coach.update({
        where: { id: user.coach.id },
        data: { firstName, lastName }
      });
    } else {
      return res.status(400).json({ message: 'Type de profil non supporté' });
    }

    res.json({ 
      message: 'Profil mis à jour avec succès',
      profile: updatedProfile 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Upload photo de profil
export const uploadPhoto = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { athlete: true, coach: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // URL de la photo
    const photoUrl = `/uploads/profiles/${file.filename}`;

    // Supprimer l'ancienne photo si elle existe
    let oldPhotoPath: string | null = null;
    if (user.role === 'ATHLETE' && user.athlete?.profilePicture) {
      oldPhotoPath = path.join(__dirname, '../../', user.athlete.profilePicture);
    } else if (user.role === 'COACH' && user.coach?.profilePicture) {
      oldPhotoPath = path.join(__dirname, '../../', user.coach.profilePicture);
    }

    // Mettre à jour la base de données
    let updatedProfile;
    if (user.role === 'ATHLETE' && user.athlete) {
      updatedProfile = await prisma.athlete.update({
        where: { id: user.athlete.id },
        data: { profilePicture: photoUrl }
      });
    } else if (user.role === 'COACH' && user.coach) {
      updatedProfile = await prisma.coach.update({
        where: { id: user.coach.id },
        data: { profilePicture: photoUrl }
      });
    }

    // Supprimer l'ancienne photo après mise à jour réussie
    if (oldPhotoPath && fs.existsSync(oldPhotoPath)) {
      fs.unlinkSync(oldPhotoPath);
    }

    res.json({ 
      message: 'Photo de profil mise à jour avec succès',
      photoUrl,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer le profil actuel
export const getProfile = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        athlete: true, 
        coach: true 
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const profile = user.role === 'ATHLETE' ? user.athlete : user.coach;

    res.json({
      email: user.email,
      role: user.role,
      profile
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Bannir un utilisateur (admin uniquement)
export const banUser = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const adminId = req.user?.id;
    const { userId } = req.params;
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (admin?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé - Admin uniquement' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: adminId
      }
    });

    res.json({ 
      message: 'Utilisateur banni avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isBanned: updatedUser.isBanned,
        bannedAt: updatedUser.bannedAt
      }
    });
  } catch (error) {
    console.error('Erreur lors du bannissement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Débannir un utilisateur (admin uniquement)
export const unbanUser = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const adminId = req.user?.id;
    const { userId } = req.params;

    if (!adminId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (admin?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé - Admin uniquement' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedBy: null
      }
    });

    res.json({ 
      message: 'Utilisateur débanni avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isBanned: updatedUser.isBanned
      }
    });
  } catch (error) {
    console.error('Erreur lors du débannissement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un compte utilisateur (par l'utilisateur lui-même)
export const deleteOwnAccount = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    console.log('🗑️ Tentative de suppression de compte par:', userId);

    if (!userId) {
      console.log('❌ Non authentifié');
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('👤 Utilisateur:', { email: user.email, role: user.role });

    // L'admin ne peut pas supprimer son propre compte via cette route
    if (user.role === 'ADMIN') {
      console.log('❌ Admin ne peut pas supprimer son propre compte');
      return res.status(403).json({ message: 'Les administrateurs ne peuvent pas supprimer leur propre compte' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });

    console.log('✅ Compte supprimé avec succès');

    res.json({ 
      message: 'Compte supprimé avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isDeleted: updatedUser.isDeleted
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un compte utilisateur (par l'admin)
export const deleteUserAccount = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const adminId = req.user?.id;
    const { userId } = req.params;

    if (!adminId) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (admin?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé - Admin uniquement' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // L'admin ne peut pas supprimer un autre admin
    if (targetUser.role === 'ADMIN') {
      return res.status(403).json({ message: 'Impossible de supprimer un compte administrateur' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: adminId
      }
    });

    res.json({ 
      message: 'Utilisateur supprimé avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isDeleted: updatedUser.isDeleted
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
