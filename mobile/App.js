import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AvailableJobsScreen from './screens/AvailableJobsScreen';
import ActiveDeliveryScreen from './screens/ActiveDeliveryScreen';
import ProofOfDeliveryScreen from './screens/ProofOfDeliveryScreen';
import JobHistoryScreen from './screens/JobHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

// Services
import { getAccessToken } from './services/storage';
import { requestLocationPermission } from './services/location';
import { colors } from './styles/theme';

const Stack = createStackNavigator();

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        requestLocationPermission();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await getAccessToken();
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Listen for auth changes
    useEffect(() => {
        const interval = setInterval(checkAuth, 1000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="auto" />
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: colors.primary,
                        },
                        headerTintColor: colors.surface,
                        headerTitleStyle: {
                            fontWeight: '600',
                        },
                    }}
                >
                    {!isAuthenticated ? (
                        <>
                            <Stack.Screen
                                name="Login"
                                component={LoginScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="Register"
                                component={RegisterScreen}
                                options={{ title: 'Create Account' }}
                            />
                        </>
                    ) : (
                        <>
                            <Stack.Screen
                                name="Home"
                                component={HomeScreen}
                                options={{ title: 'Dashboard' }}
                            />
                            <Stack.Screen
                                name="AvailableJobs"
                                component={AvailableJobsScreen}
                                options={{ title: 'Available Jobs' }}
                            />
                            <Stack.Screen
                                name="ActiveDelivery"
                                component={ActiveDeliveryScreen}
                                options={{ title: 'Active Delivery' }}
                            />
                            <Stack.Screen
                                name="ProofOfDelivery"
                                component={ProofOfDeliveryScreen}
                                options={{ title: 'Proof of Delivery' }}
                            />
                            <Stack.Screen
                                name="JobHistory"
                                component={JobHistoryScreen}
                                options={{ title: 'Delivery History' }}
                            />
                            <Stack.Screen
                                name="Profile"
                                component={ProfileScreen}
                                options={{ title: 'My Profile' }}
                            />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </>
    );
}
