import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    Alert,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { Button } from '../components/Common';
import { partnerAPI, jobsAPI } from '../services/api';
import { getUserData } from '../services/storage';
import { colors, spacing, typography, shadows } from '../styles/theme';

export default function HomeScreen({ navigation }) {
    const [partner, setPartner] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [activeJob, setActiveJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileRes, activeJobRes] = await Promise.all([
                partnerAPI.getProfile(),
                jobsAPI.getActive(),
            ]);

            setPartner(profileRes.data.data);
            setIsOnline(profileRes.data.data.status === 'online');
            setActiveJob(activeJobRes.data.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleStatus = async (value) => {
        try {
            const newStatus = value ? 'online' : 'offline';
            await partnerAPI.updateStatus(newStatus);
            setIsOnline(value);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
                setRefreshing(true);
                loadData();
            }} />}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {partner?.full_name}!</Text>
                <Text style={styles.subtitle}>Ready to deliver?</Text>
            </View>

            <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>You are {isOnline ? 'Online' : 'Offline'}</Text>
                    <Switch
                        value={isOnline}
                        onValueChange={handleToggleStatus}
                        trackColor={{ false: colors.border, true: colors.secondary }}
                        thumbColor={colors.surface}
                    />
                </View>
            </View>

            {activeJob ? (
                <View style={styles.activeJobCard}>
                    <Text style={styles.cardTitle}>Active Delivery</Text>
                    <Text style={styles.orderNumber}>Order: {activeJob.order_number}</Text>
                    <Text style={styles.jobDetail}>Customer: {activeJob.customer_name}</Text>
                    <Text style={styles.jobDetail}>Status: {activeJob.status.replace('_', ' ').toUpperCase()}</Text>
                    <Button
                        title="View Delivery"
                        onPress={() => navigation.navigate('ActiveDelivery', { job: activeJob })}
                        style={styles.viewButton}
                    />
                </View>
            ) : (
                <View style={styles.noJobCard}>
                    <Text style={styles.noJobText}>No active deliveries</Text>
                    <Button
                        title="Browse Available Jobs"
                        onPress={() => navigation.navigate('AvailableJobs')}
                        disabled={!isOnline}
                    />
                </View>
            )}

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{partner?.total_deliveries || 0}</Text>
                    <Text style={styles.statLabel}>Total Deliveries</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{partner?.rating?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            <View style={styles.quickActions}>
                <Button
                    title="Job History"
                    onPress={() => navigation.navigate('JobHistory')}
                    variant="outline"
                    style={styles.actionButton}
                />
                <Button
                    title="Profile"
                    onPress={() => navigation.navigate('Profile')}
                    variant="outline"
                    style={styles.actionButton}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.lg,
        backgroundColor: colors.primary,
    },
    greeting: {
        ...typography.h2,
        color: colors.surface,
    },
    subtitle: {
        ...typography.body,
        color: colors.surface,
        opacity: 0.9,
    },
    statusCard: {
        margin: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: 12,
        ...shadows.medium,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusLabel: {
        ...typography.h3,
    },
    activeJobCard: {
        margin: spacing.lg,
        marginTop: 0,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: 12,
        ...shadows.medium,
        borderLeftWidth: 4,
        borderLeftColor: colors.secondary,
    },
    noJobCard: {
        margin: spacing.lg,
        marginTop: 0,
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: 12,
        ...shadows.small,
        alignItems: 'center',
    },
    cardTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    orderNumber: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    jobDetail: {
        ...typography.bodySmall,
        marginBottom: spacing.xs,
    },
    noJobText: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    viewButton: {
        marginTop: spacing.md,
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: 12,
        alignItems: 'center',
        ...shadows.small,
    },
    statValue: {
        ...typography.h2,
        color: colors.primary,
    },
    statLabel: {
        ...typography.caption,
        marginTop: spacing.xs,
    },
    quickActions: {
        margin: spacing.lg,
        gap: spacing.md,
    },
    actionButton: {
        marginBottom: 0,
    },
});
