"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
class UserController {
    constructor() {
        // Get current authenticated user
        this.getCurrentUser = async (req, res, next) => {
            try {
                if (!req.user?.id) {
                    res.status(401).json({
                        success: false,
                        message: 'User not authenticated'
                    });
                    return;
                }
                const user = await this.userService.getUserById(req.user.id);
                res.status(200).json({
                    success: true,
                    data: user
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Authentication
        this.register = async (req, res, next) => {
            try {
                const { email, password, name, role } = req.body;
                if (!email || !password || !name) {
                    res.status(400).json({
                        success: false,
                        message: 'Please provide email, password and name'
                    });
                    return;
                }
                const result = await this.userService.register({ email, password, name, role });
                res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    data: result
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.login = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    res.status(400).json({
                        success: false,
                        message: 'Please provide email and password'
                    });
                    return;
                }
                const result = await this.userService.login(email, password);
                res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    data: result
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.verifyEmail = async (req, res, next) => {
            try {
                const { token } = req.query;
                if (!token || typeof token !== 'string') {
                    res.status(400).json({
                        success: false,
                        message: 'Verification token is required'
                    });
                    return;
                }
                const result = await this.userService.verifyEmail(token);
                res.status(200).json({
                    success: true,
                    message: result.message
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.googleCallback = async (req, res, next) => {
            try {
                const authResult = req.user;
                if (!authResult) {
                    res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
                    return;
                }
                // Redirect to frontend with token
                res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${authResult.token}`);
            }
            catch (error) {
                next(error);
            }
        };
        // User CRUD
        this.getAllUsers = async (req, res, next) => {
            try {
                const users = await this.userService.getAllUsers();
                res.status(200).json({
                    success: true,
                    data: users
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getUserById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const user = await this.userService.getUserById(id);
                res.status(200).json({
                    success: true,
                    data: user
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.createUser = async (req, res, next) => {
            try {
                const userData = req.body;
                const user = await this.userService.createUser(userData);
                res.status(201).json({
                    success: true,
                    data: user
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.updateUser = async (req, res, next) => {
            try {
                const { id } = req.params;
                const userData = req.body;
                const user = await this.userService.updateUser(id, userData);
                res.status(200).json({
                    success: true,
                    data: user
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteUser = async (req, res, next) => {
            try {
                const { id } = req.params;
                await this.userService.deleteUser(id);
                res.status(200).json({
                    success: true,
                    message: 'User deleted successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.userService = new user_service_1.UserService();
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map