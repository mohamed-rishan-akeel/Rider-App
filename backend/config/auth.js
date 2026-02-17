const jwt = require('jsonwebtoken');
require('dotenv').config();

const authConfig = {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

/**
 * Generate access token
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, authConfig.accessTokenSecret, {
        expiresIn: authConfig.accessTokenExpiry,
    });
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, authConfig.refreshTokenSecret, {
        expiresIn: authConfig.refreshTokenExpiry,
    });
};

/**
 * Verify access token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, authConfig.accessTokenSecret);
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

/**
 * Verify refresh token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, authConfig.refreshTokenSecret);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Calculate token expiry date
 * @param {String} expiryString - Expiry string (e.g., '7d', '15m')
 * @returns {Date} Expiry date
 */
const getTokenExpiryDate = (expiryString) => {
    const now = new Date();
    const match = expiryString.match(/^(\d+)([smhd])$/);

    if (!match) {
        throw new Error('Invalid expiry format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's':
            return new Date(now.getTime() + value * 1000);
        case 'm':
            return new Date(now.getTime() + value * 60 * 1000);
        case 'h':
            return new Date(now.getTime() + value * 60 * 60 * 1000);
        case 'd':
            return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
        default:
            throw new Error('Invalid expiry unit');
    }
};

module.exports = {
    authConfig,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getTokenExpiryDate,
};
