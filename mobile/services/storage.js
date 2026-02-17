import * as SecureStore from 'expo-secure-store';

const KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
};

/**
 * Save authentication tokens securely
 */
export const saveTokens = async (accessToken, refreshToken) => {
    try {
        await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
        console.error('Error saving tokens:', error);
        throw error;
    }
};

/**
 * Get access token
 */
export const getAccessToken = async () => {
    try {
        return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
};

/**
 * Get refresh token
 */
export const getRefreshToken = async () => {
    try {
        return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch (error) {
        console.error('Error getting refresh token:', error);
        return null;
    }
};

/**
 * Clear all tokens (logout)
 */
export const clearTokens = async () => {
    try {
        await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(KEYS.USER_DATA);
    } catch (error) {
        console.error('Error clearing tokens:', error);
    }
};

/**
 * Save user data
 */
export const saveUserData = async (userData) => {
    try {
        await SecureStore.setItemAsync(KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
};

/**
 * Get user data
 */
export const getUserData = async () => {
    try {
        const data = await SecureStore.getItemAsync(KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};
