// backend/routes/sessionRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js'; // Import JWT protection
import { uploadSingleAudio } from '../middleware/uploadMiddleware.js'; // Import audio upload middleware
import { 
    createSession, 
    getSessionById, 
    getSessions, 
    submitAnswer,
    endSession,
    deleteSession
} from '../controllers/sessionController.js';

const router = express.Router();

// Apply the 'protect' middleware to ALL routes in this file
router.use(protect);

// @route POST /api/sessions/
// @desc Create a new interview session (Triggers AI Question Gen)
router.route('/').post(createSession);

// @route GET /api/sessions/
// @desc Get all interview sessions for the current user
router.route('/').get(getSessions);

// @route GET /api/sessions/:id
// @desc Get a specific session detail
router.route('/:id')
    .get(protect, getSessionById)
    .delete(protect, deleteSession);

// @route POST /api/sessions/:id/submit-answer
// @desc Submit an answer (Triggers AI Evaluation/Transcription)
// CRITICAL FIX: This line resolves the 404 error from the frontend submission.
router.route('/:id/submit-answer').post(uploadSingleAudio, submitAnswer);

// @route POST /api/sessions/:id/end
// @desc End the session early
router.route('/:id/end').post(endSession)
;

export default router;