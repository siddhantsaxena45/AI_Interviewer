// backend/models/SessionModel.js
import mongoose from 'mongoose';

const questionSchema = mongoose.Schema({
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ['oral', 'coding'], required: true }, // For Oral or Coding
    idealAnswer: { type: String, default: 'Pending' }, // AI-generated ideal answer

    // User's response
    userAnswerText: { type: String, default: '' },
    userSubmittedCode: { type: String, default: '' }, 
    
    // Status flag for submission and evaluation
    isSubmitted: { type: Boolean, default: false },
    isEvaluated: { type: Boolean, default: false },

    // AI Evaluation Scores
    technicalScore: { type: Number, default: 0 }, // 0-100
    confidenceScore: { type: Number, default: 0 }, // 0-100
    aiFeedback: { type: String, default: 'Not yet submitted or evaluated.' },
});

const sessionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, 
    },
    // User-defined parameters
    role: { type: String, required: true },
    level: { type: String, required: true },
    interviewType: { type: String, enum: ['oral-only', 'coding-mix'], required: true },
    
    // Status and Score
    status: { 
        type: String, 
        enum: ['pending', 'in-progress', 'completed', 'failed'], 
        default: 'pending' 
    },
    overallScore: { type: Number, default: 0 }, // Calculated average score
    metrics: {
        avgTechnical: { type: Number, default: 0 },
        avgConfidence: { type: Number, default: 0 },
    },
    questions: [questionSchema],
    
    // Time tracking for performance metrics
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    
}, {
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;