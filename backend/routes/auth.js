const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getTokenExpiryDate,
    authConfig,
} = require('../config/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new delivery partner
 */
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('fullName').trim().notEmpty(),
        body('phone').trim().notEmpty(),
        body('vehicleType').optional().trim(),
        body('vehicleNumber').optional().trim(),
    ],
    async (req, res, next) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }

            const { email, password, fullName, phone, vehicleType, vehicleNumber } = req.body;

            // Check if user already exists
            const existingUser = await query(
                'SELECT id FROM delivery_partners WHERE email = $1',
                [email]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered',
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create new partner
            const result = await query(
                `INSERT INTO delivery_partners 
        (email, password_hash, full_name, phone, vehicle_type, vehicle_number) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, email, full_name, phone, vehicle_type, vehicle_number, status, created_at`,
                [email, passwordHash, fullName, phone, vehicleType || null, vehicleNumber || null]
            );

            const partner = result.rows[0];

            // Generate tokens
            const tokenPayload = { id: partner.id, email: partner.email };
            const accessToken = generateAccessToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            // Store refresh token
            const expiresAt = getTokenExpiryDate(authConfig.refreshTokenExpiry);
            await query(
                'INSERT INTO refresh_tokens (partner_id, token, expires_at) VALUES ($1, $2, $3)',
                [partner.id, refreshToken, expiresAt]
            );

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    partner,
                    accessToken,
                    refreshToken,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    async (req, res, next) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }

            const { email, password } = req.body;

            // Find partner
            const result = await query(
                `SELECT id, email, password_hash, full_name, phone, vehicle_type, 
        vehicle_number, status, rating, total_deliveries 
        FROM delivery_partners WHERE email = $1`,
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
            }

            const partner = result.rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, partner.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
            }

            // Remove password hash from response
            delete partner.password_hash;

            // Generate tokens
            const tokenPayload = { id: partner.id, email: partner.email };
            const accessToken = generateAccessToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            // Store refresh token
            const expiresAt = getTokenExpiryDate(authConfig.refreshTokenExpiry);
            await query(
                'INSERT INTO refresh_tokens (partner_id, token, expires_at) VALUES ($1, $2, $3)',
                [partner.id, refreshToken, expiresAt]
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    partner,
                    accessToken,
                    refreshToken,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required',
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
        }

        // Check if refresh token exists in database
        const tokenResult = await query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
            [refreshToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Refresh token not found or expired',
            });
        }

        // Generate new access token
        const tokenPayload = { id: decoded.id, email: decoded.email };
        const newAccessToken = generateAccessToken(tokenPayload);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 */
router.post('/logout', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Delete refresh token from database
            await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        }

        res.json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
