// backend/middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';

// Define the temporary storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use the OS temporary directory for handling uploads before processing
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Define the filename structure: sessionId-timestamp.ext
        const ext = path.extname(file.originalname);
        
        // Use sessionId from params (route is /:id/submit-answer)
        const sessionId = req.params.id || 'unknown';
        cb(null, `${sessionId}-${Date.now()}${ext}`);
    },
});

// Filter file types (Allow common audio formats, or files if it's a code submission)
const fileFilter = (req, file, cb) => {
    // For audio files (webm/ogg from MediaRecorder), check the mime-type
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
        cb(null, true);
    } 
    // For code submissions, the submission will be JSON/text, not a file, so this middleware is skipped or used conditionally.
    else {
        // If it's a file but not audio, reject it.
        cb(new Error('Invalid file type. Only audio recordings are allowed.'), false);
    }
};

// Initialize multer middleware
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 1024 * 1024 * 10 }, // Limit to 10MB
    fileFilter: fileFilter,
});

// We only need a single file upload for an answer (the audio recording)
const uploadSingleAudio = upload.single('audioFile');

export { uploadSingleAudio };