import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import type {
    Notification,
    NotificationResponse,
} from 'expo-notifications';
import { partnerAPI } from './api';
import { clearPushToken, getPushToken, savePushToken } from './storage';
import { getCurrentRouteName, navigate } from './navigation';
import type { Delivery } from '../types/delivery';
import type { RootStackParamList } from '../types/navigation';

export type NotificationRouteName =
    | 'Home'
    | 'AssignedDeliveries'
    | 'DeliveryDetails'
    | 'ActiveDelivery'
    | 'ProofOfDelivery'
    | 'JobHistory'
    | 'Profile';

type NotificationEntityId = Delivery['id'];

export type DeliveryNotificationData = {
    screen?: NotificationRouteName;
    deliveryId?: NotificationEntityId | string;
    jobId?: NotificationEntityId | string;
};

export type PushRegistrationStatus = 'granted' | 'denied' | 'error';

export type PushRegistrationResult = {
    status: PushRegistrationStatus;
    pushToken: string | null;
    error: string | null;
};

type NavigationTarget = {
    name: keyof RootStackParamList;
    params?: RootStackParamList[keyof RootStackParamList];
};

type NotificationListenersConfig = {
    onForegroundNotification?: (notification: Notification) => void;
};

const DELIVERY_NOTIFICATIONS_CHANNEL_ID = 'delivery-updates';

let notificationHandlerConfigured = false;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

const coerceEntityId = (
    value: DeliveryNotificationData['deliveryId']
): NotificationEntityId | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const numericValue = Number(value);

        if (Number.isFinite(numericValue)) {
            return numericValue;
        }

        return value;
    }

    return undefined;
};

const getProjectId = () =>
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    undefined;

const configureAndroidChannelAsync = async () => {
    if (Platform.OS !== 'android') {
        return;
    }

    await Notifications.setNotificationChannelAsync(
        DELIVERY_NOTIFICATIONS_CHANNEL_ID,
        {
            name: 'Delivery Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#D96F32',
        }
    );
};

const syncPushTokenAsync = async (pushToken: string) => {
    const normalizedPlatform =
        Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
            ? Platform.OS
            : 'unknown';

    await savePushToken(pushToken);

    try {
        await partnerAPI.updatePushToken(pushToken, normalizedPlatform);
    } catch (error) {
        console.warn('Could not sync push token with backend:', error?.message || error);
    }
};

const hasMeaningfulParams = (
    params: RootStackParamList[keyof RootStackParamList] | undefined
) => typeof params !== 'undefined';

const navigateToNotificationTarget = (target: NavigationTarget | null) => {
    if (!target) {
        return false;
    }

    const currentRouteName = getCurrentRouteName();

    if (currentRouteName === target.name && !hasMeaningfulParams(target.params)) {
        return true;
    }

    navigate(
        target.name,
        target.params as RootStackParamList[keyof RootStackParamList]
    );
    return true;
};

export const parseNotificationData = (
    notificationData: Record<string, unknown> | undefined
): DeliveryNotificationData => ({
    screen:
        typeof notificationData?.screen === 'string'
            ? (notificationData.screen as NotificationRouteName)
            : undefined,
    deliveryId:
        typeof notificationData?.deliveryId === 'string' ||
        typeof notificationData?.deliveryId === 'number'
            ? notificationData.deliveryId
            : undefined,
    jobId:
        typeof notificationData?.jobId === 'string' ||
        typeof notificationData?.jobId === 'number'
            ? notificationData.jobId
            : undefined,
});

export const resolveNotificationTarget = (
    notificationData: DeliveryNotificationData
): NavigationTarget | null => {
    const screen = notificationData.screen ?? 'Home';
    const deliveryId = coerceEntityId(notificationData.deliveryId);
    const jobId = coerceEntityId(notificationData.jobId);

    switch (screen) {
        case 'AssignedDeliveries':
        case 'JobHistory':
        case 'Profile':
        case 'Home':
            return { name: screen };
        case 'ProofOfDelivery':
            return {
                name: 'ProofOfDelivery',
                params: jobId ? { jobId } : undefined,
            };
        case 'ActiveDelivery':
            return jobId
                ? {
                      name: 'ActiveDelivery',
                      params: { jobId },
                  }
                : { name: 'Home' };
        case 'DeliveryDetails':
            return deliveryId
                ? {
                      name: 'DeliveryDetails',
                      params: { deliveryId },
                  }
                : { name: 'AssignedDeliveries' };
        default:
            return { name: 'Home' };
    }
};

export const handleNotificationTapAsync = async (
    response: NotificationResponse | null | undefined
) => {
    if (!response) {
        return false;
    }

    const notificationData = parseNotificationData(
        response.notification.request.content.data
    );
    const handled = navigateToNotificationTarget(
        resolveNotificationTarget(notificationData)
    );

    if (handled) {
        await Notifications.clearLastNotificationResponseAsync();
    }

    return handled;
};

export const registerForPushNotificationsAsync =
    async (): Promise<PushRegistrationResult> => {
        try {
            await configureAndroidChannelAsync();

            const permissions = await Notifications.getPermissionsAsync();
            let finalStatus = permissions.status;

            if (finalStatus !== 'granted') {
                const requestResult =
                    await Notifications.requestPermissionsAsync();
                finalStatus = requestResult.status;
            }

            if (finalStatus !== 'granted') {
                await clearPushToken();
                return {
                    status: 'denied',
                    pushToken: null,
                    error: 'Push notification permission was denied.',
                };
            }

            const existingPushToken = await getPushToken();
            const projectId = getProjectId();
            const tokenResponse = await Notifications.getExpoPushTokenAsync(
                projectId ? { projectId } : undefined
            );
            const pushToken = tokenResponse.data;

            if (!pushToken) {
                return {
                    status: 'error',
                    pushToken: null,
                    error: 'Expo push token was not returned.',
                };
            }

            if (pushToken !== existingPushToken) {
                await syncPushTokenAsync(pushToken);
            }

            return {
                status: 'granted',
                pushToken,
                error: null,
            };
        } catch (error) {
            return {
                status: 'error',
                pushToken: null,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Could not register for push notifications.',
            };
        }
    };

export const consumeInitialNotificationAsync = async () => {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    return handleNotificationTapAsync(lastResponse);
};

export const addNotificationListeners = ({
    onForegroundNotification,
}: NotificationListenersConfig = {}) => {
    if (!notificationHandlerConfigured) {
        notificationHandlerConfigured = true;
    }

    const receivedSubscription =
        Notifications.addNotificationReceivedListener((notification) => {
            onForegroundNotification?.(notification);
        });

    const responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
            void handleNotificationTapAsync(response);
        });

    const tokenSubscription = Notifications.addPushTokenListener((token) => {
        void syncPushTokenAsync(token.data);
    });

    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
        tokenSubscription.remove();
    };
};
