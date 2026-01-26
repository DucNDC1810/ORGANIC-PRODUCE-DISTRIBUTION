"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_model_1 = require("../models/User.model");
const AppError_1 = require("../utils/AppError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const email_service_1 = require("./email.service");
class UserService {
    constructor() {
        this.emailService = new email_service_1.EmailService();
    }
    async getAllUsers() {
        return await User_model_1.User.find().select('-password');
    }
    async getUserById(id) {
        const user = await User_model_1.User.findById(id).select('-password');
        if (!user) {
            throw new AppError_1.AppError('User not found', 404);
        }
        return user;
    }
    async createUser(userData) {
        const existingUser = await User_model_1.User.findOne({ email: userData.email });
        if (existingUser) {
            throw new AppError_1.AppError('Email already exists', 400);
        }
        const user = await User_model_1.User.create(userData);
        return user;
    }
    async updateUser(id, userData) {
        const user = await User_model_1.User.findByIdAndUpdate(id, { $set: userData }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            throw new AppError_1.AppError('User not found', 404);
        }
        return user;
    }
    async deleteUser(id) {
        const user = await User_model_1.User.findByIdAndDelete(id);
        if (!user) {
            throw new AppError_1.AppError('User not found', 404);
        }
    }
    // Authentication methods
    async register(userData) {
        // Check if user exists
        const existingUser = await User_model_1.User.findOne({ email: userData.email });
        if (existingUser) {
            throw new AppError_1.AppError('Email already exists', 400);
        }
        // Generate email verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Create user
        const user = await User_model_1.User.create({
            ...userData,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            isEmailVerified: false
        });
        // Send verification email
        try {
            await this.emailService.sendVerificationEmail(user.email, verificationToken, user.name);
        }
        catch (error) {
            console.error('Failed to send verification email:', error);
            // Don't throw error, user is still created
        }
        // Generate token
        const token = this.generateToken(user._id.toString());
        return {
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            },
            token
        };
    }
    async login(email, password) {
        // Find user with password
        const user = await User_model_1.User.findOne({ email }).select('+password');
        if (!user) {
            throw new AppError_1.AppError('Invalid email or password', 401);
        }
        // Check if user has password (not Google OAuth user)
        if (!user.password) {
            throw new AppError_1.AppError('Please login with Google', 401);
        }
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError_1.AppError('Invalid email or password', 401);
        }
        // Generate token
        const token = this.generateToken(user._id.toString());
        return {
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            },
            token
        };
    }
    async verifyEmail(token) {
        const user = await User_model_1.User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });
        if (!user) {
            throw new AppError_1.AppError('Invalid or expired verification token', 400);
        }
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        // Send welcome email
        try {
            await this.emailService.sendWelcomeEmail(user.email, user.name);
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
        }
        return { message: 'Email verified successfully' };
    }
    async googleLogin(profile) {
        const { id, emails, displayName } = profile;
        const email = emails[0].value;
        // Find or create user
        let user = await User_model_1.User.findOne({ $or: [{ googleId: id }, { email }] });
        if (!user) {
            // Create new user with Google
            user = await User_model_1.User.create({
                googleId: id,
                email,
                name: displayName,
                isEmailVerified: true, // Google emails are already verified
                role: 'customer'
            });
        }
        else if (!user.googleId) {
            // Link existing account with Google
            user.googleId = id;
            user.isEmailVerified = true;
            await user.save();
        }
        // Generate token
        const token = this.generateToken(user._id.toString());
        return {
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            },
            token
        };
    }
    generateToken(userId) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined');
        }
        const token = jsonwebtoken_1.default.sign({ id: userId }, jwtSecret, { expiresIn: '15m' } // 15 minutes expiration
        );
        return token;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map