// AI Routes - Grok API Integration
import express from 'express';
import {
    generateAIResponse,
    generateCode,
    explainCode,
    refactorCode
} from '../controllers/grokAiController.js';
import {protect} from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

/**
 * @route   POST /api/ai/chat
 * @desc    Generate AI chat response
 * @access  Private
 */
router.post('/chat', generateAIResponse);

/**
 * @route   POST /api/ai/generate-code
 * @desc    Generate code based on description
 * @access  Private
 */
router.post('/generate-code', generateCode);

/**
 * @route   POST /api/ai/explain
 * @desc    Explain code
 * @access  Private
 */
router.post('/explain', explainCode);

/**
 * @route   POST /api/ai/refactor
 * @desc    Refactor/optimize code
 * @access  Private
 */
router.post('/refactor', refactorCode);

export { router };
