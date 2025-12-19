// backend/server.js
import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io'; // Named import for Socket.io Server

// File Imports (Note: Explicit file extensions like .js are often required in ESM)
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5174',
];

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Allow requests from our defined list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // In development, allow all origins for easier debugging
            if (process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global Socket.io instance access
app.set('io', io);

// Basic Route
app.get('/', (req, res) => {
    res.send('AI Interviewer API is running...');
});

// --- ROUTES ---
app.use('/api/users', userRoutes); 
app.use('/api/sessions', sessionRoutes);

// Socket.io Connection Handler

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // --- CRITICAL: Join the user to a private room based on their ID ---
    // In a real app, the userId is verified via JWT on handshake.
    // For this tutorial, we assume the user sends their ID in the handshake query or upon first message.
    const userId = socket.handshake.query.userId; 
    if (userId) {
        // Create a room named after the user's ID
        socket.join(userId); 
        console.log(`Socket ${socket.id} joined room ${userId}`);
    }

    // Other handlers (startInterview, disconnect, etc.) remain here...
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
// --- ERROR MIDDLEWARE (MUST be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n❌ Port ${PORT} is already in use!\n`);
            console.error('To fix this, you can:');
            console.error(`1. Kill the process using port ${PORT}:`);
            console.error(`   Windows: netstat -ano | findstr :${PORT} (then taskkill /PID <PID> /F)`);
            console.error(`   Mac/Linux: lsof -ti:${PORT} | xargs kill -9`);
            console.error(`2. Or change the PORT in your .env file\n`);
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });