import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { jobsAPI } from './api';
import { isMockSession } from './storage';

let locationSubscription = null;
let currentJobId = null;

export const LOCATION_ERROR_CODES = {
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    LOCATION_UNAVAILABLE: 'LOCATION_UNAVAILABLE',
    SERVICES_DISABLED: 'SERVICES_DISABLED',
    UNKNOWN: 'UNKNOWN',
};

const mapCoordsToLocation = (location) => ({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy:
        typeof location.coords.accuracy === 'number'
            ? location.coords.accuracy
            : null,
    speed:
        typeof location.coords.speed === 'number' ? location.coords.speed : null,
    heading:
        typeof location.coords.heading === 'number'
            ? location.coords.heading
            : null,
    timestamp:
        typeof location.timestamp === 'number' ? location.timestamp : Date.now(),
});

export const createLocationError = (code, message, cause) => {
    const error = new Error(message);
    error.code = code;
    if (cause) {
        error.cause = cause;
    }
    return error;
};

export const normalizeLocationError = (error) => {
    if (error?.code && Object.values(LOCATION_ERROR_CODES).includes(error.code)) {
        return error;
    }

    const message = error?.message || 'Unable to access location';

    if (
        /permission/i.test(message) &&
        /denied|granted/i.test(message)
    ) {
        return createLocationError(
            LOCATION_ERROR_CODES.PERMISSION_DENIED,
            'Location permission was denied.',
            error
        );
    }

    if (/services?.*disabled|settings.*unsatisfied/i.test(message)) {
        return createLocationError(
            LOCATION_ERROR_CODES.SERVICES_DISABLED,
            'Location services are disabled on this device.',
            error
        );
    }

    if (/unavailable|timeout|could not|get current location/i.test(message)) {
        return createLocationError(
            LOCATION_ERROR_CODES.LOCATION_UNAVAILABLE,
            'Current GPS coordinates are unavailable right now.',
            error
        );
    }

    return createLocationError(
        LOCATION_ERROR_CODES.UNKNOWN,
        message,
        error
    );
};

export const getLocationErrorMessage = (error) =>
    normalizeLocationError(error).message;

export const isLocationPermissionDenied = (error) =>
    normalizeLocationError(error).code ===
    LOCATION_ERROR_CODES.PERMISSION_DENIED;

const normalizePermissionResult = (permission) => ({
    granted: Boolean(permission?.granted),
    canAskAgain: permission?.canAskAgain !== false,
    status: permission?.status || 'undetermined',
});

export const requestForegroundLocationPermission = async () => {
    if (Platform.OS === 'web') {
        return {
            granted: true,
            canAskAgain: true,
            status: 'granted',
        };
    }

    try {
        const permission = await Location.requestForegroundPermissionsAsync();
        return normalizePermissionResult(permission);
    } catch (error) {
        throw normalizeLocationError(error);
    }
};

export const requestLocationPermission = requestForegroundLocationPermission;

const ensureForegroundLocationPermission = async () => {
    if (Platform.OS === 'web') {
        return {
            granted: true,
            canAskAgain: true,
            status: 'granted',
        };
    }

    try {
        const existingPermission = await Location.getForegroundPermissionsAsync();

        if (existingPermission?.granted) {
            return normalizePermissionResult(existingPermission);
        }

        const requestedPermission = await requestForegroundLocationPermission();

        if (!requestedPermission.granted) {
            throw createLocationError(
                LOCATION_ERROR_CODES.PERMISSION_DENIED,
                'Location permission was denied.'
            );
        }

        return requestedPermission;
    } catch (error) {
        throw normalizeLocationError(error);
    }
};

export const getCurrentLocation = async () => {
    try {
        await ensureForegroundLocationPermission();

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return mapCoordsToLocation(location);
    } catch (error) {
        throw normalizeLocationError(error);
    }
};

export const startLocationTracking = async (jobId) => {
    try {
        if (await isMockSession()) {
            currentJobId = jobId;
            console.log('Mock location tracking started for job:', jobId);
            return;
        }

        await ensureForegroundLocationPermission();

        await stopLocationTracking();
        currentJobId = jobId;

        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 10000,
                distanceInterval: 50,
            },
            async (location) => {
                if (!currentJobId) {
                    return;
                }

                try {
                    await jobsAPI.addLocation(
                        currentJobId,
                        mapCoordsToLocation(location)
                    );
                } catch (error) {
                    console.error(
                        'Error sending location update:',
                        getLocationErrorMessage(error)
                    );
                }
            }
        );

        console.log('Location tracking started for job:', jobId);
    } catch (error) {
        const normalizedError = normalizeLocationError(error);
        console.error(
            'Error starting location tracking:',
            normalizedError.message
        );
        throw normalizedError;
    }
};

export const stopLocationTracking = async () => {
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
        console.log('Location tracking stopped');
    }

    currentJobId = null;
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
