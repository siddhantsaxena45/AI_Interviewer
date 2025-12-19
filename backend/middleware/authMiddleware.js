// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Middleware to protect routes
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Check if the Authorization header exists and starts with 'Bearer'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (Format: 'Bearer <token>')
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Get user from the database based on the ID in the token
            // Select('-password') excludes the password field from the result
            req.user = await User.findById(decoded.id).select('-password'); 

            if (!req.user) {
                res.status(401); // Unauthorized
                throw new Error('User not found.');
            }

            next(); // Proceed to the next middleware or controller function
        } catch (error) {
            console.error(error);
            res.status(401); // Unauthorized
            throw new Error('Not authorized, token failed.');
        }
    }

    // 4. If no token is found
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token.');
    }
});

export { protect };

