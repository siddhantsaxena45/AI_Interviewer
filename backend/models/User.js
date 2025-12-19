// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    // Standard Auth Fields
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: function() { 
            // Password is only required if the user didn't sign up with Google
            return !this.googleId; 
        } 
    },

    // Google Auth Field
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true // Allows null values, but ensures uniqueness if a value is present
    },

    // Advanced Feature: Role/Preference for AI Customization
    preferredRole: { 
        type: String, 
        default: 'MERN Stack Developer' 
    },
}, {
    timestamps: true
});

// --- Mongoose Middleware: Hash Password Before Saving ---
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// --- Mongoose Method: Compare Password for Local Login ---
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Compare the entered password with the hashed password in the database
    if (!this.password) return false; // Safety check for Google-signed users
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;