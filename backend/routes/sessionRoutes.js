// backend/routes/sessionRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadSingleAudio } from '../middleware/uploadMiddleware.js';
import { 
    createSession, 
    getSessionById, 
    getSessions, 
    submitAnswer,
    endSession,
    deleteSession
} from '../controllers/sessionController.js';

const router = express.Router();

// 🔒 Apply protection to ALL routes in this file automatically
router.use(protect);

// 1. Root Routes (Chained for cleanliness)
router.route('/')
    .post(createSession)  // Create Interview
    .get(getSessions);    // Get All Sessions

// 2. ID Routes
// Note: removed 'protect' here because router.use(protect) already handles it
router.route('/:id')
    .get(getSessionById)   // View Details
    .delete(deleteSession); // Delete Session

// 3. Action Routes
router.route('/:id/submit-answer').post(uploadSingleAudio, submitAnswer);
router.route('/:id/end').post(endSession);

export default router;