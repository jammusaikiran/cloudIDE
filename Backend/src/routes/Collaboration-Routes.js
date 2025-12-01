import express from 'express';
import { protect } from '../middleware/Authmiddleware.js';
import { 
  createCollaboration, 
  getUserCollaborations, 
  removeCollaborator,
  notifyCollaborators,
  getRegisteredUsers,
  createCollaborativeProject
} from '../controllers/collaborationController.js';

export const router = express.Router();

// Create or update collaboration
router.post('/create', protect, createCollaboration);

// Get user's collaborations (owned and shared)
router.get('/user', protect, getUserCollaborations);

// Remove a collaborator
router.post('/remove', protect, removeCollaborator);

// Send notification to collaborators
router.post('/notify', protect, notifyCollaborators);

// Get all registered users (for sharing)
router.get('/users', protect, getRegisteredUsers);

// Create a new collaborative project
router.post('/project/create', protect, createCollaborativeProject);
