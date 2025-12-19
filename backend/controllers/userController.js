// backend/controllers/userController.js
import asyncHandler from 'express-async-handler';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Initialize Google OAuth Client (used to verify the ID token from the frontend)
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT (ES6 function style)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

// @desc    Register a new user (Local Auth)
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please enter all required fields (Name, Email, Password).');
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email address.');
    }

    const user = await User.create({ name, email, password });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data provided.');
    }
});


// @desc    Authenticate user & get token (Local Auth)
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Check if user exists AND if the password matches
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id),
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid email or password.');
    }
});


// @desc    Authenticate with Google ID Token
// @route   POST /api/users/google-login
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
    // The Google ID token is sent from the React frontend
    const { token } = req.body; 

    // 1. Verify the Google ID Token using the google-auth-library
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // Extract payload data
    const payload = ticket.getPayload();
    const { email_verified, name, email, sub: googleId } = payload;

    if (!email_verified) {
        res.status(401);
        throw new Error('Google email not verified. Login failed.');
    }
    
    // 2. Find or Create User in our database
    let user = await User.findOne({ email });

    if (user) {
        // Existing user: ensure the googleId is set for future lookups
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
    } else {
        // New user: create a new record
        user = await User.create({ name, email, googleId, password: null });
    }

    // 3. Respond with our internal JWT
    if (user) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            preferredRole: user.preferredRole,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Could not process user creation or login via Google.');
    }
});


const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is populated by the 'protect' middleware
    if (req.user) {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            preferredRole: req.user.preferredRole,
            // You can add more profile info here
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const updateUserProfile=asyncHandler(async(req,res)=>{
  if(req.user){
    const user=await User.findById(req.user._id);
    user.name=req.body.name || user.name;
    user.email=req.body.email || user.email;
    user.preferredRole=req.body.preferredRole || user.preferredRole;
    if(req.body.password){
        user.password=req.body.password;
    }
    await user.save();
    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        preferredRole: user.preferredRole,
        token: generateToken(user._id),
    })
  }
  else{
    res.status(404);
    throw new Error("User not found");
  }
})

export { registerUser, loginUser, googleLogin,getUserProfile,updateUserProfile };
