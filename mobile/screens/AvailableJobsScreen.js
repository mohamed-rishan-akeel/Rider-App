import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { Button } from '../components/Common';
import { jobsAPI } from '../services/api';
import { colors, spacing, typography, shadows } from '../styles/theme';

export default function AvailableJobsScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const response = await jobsAPI.getAvailable();
            setJobs(response.data.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load jobs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAcceptJob = async (jobId) => {
        try {
            await jobsAPI.acceptJob(jobId);
            Alert.alert('Success', 'Job accepted! Navigate to Active Delivery', [
                { text: 'OK', onPress: () => navigation.navigate('Home') },
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to accept job');
        }
    };

    const renderJob = ({ item }) => (
        <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <Text style={styles.orderNumber}>{item.order_number}</Text>
                <Text style={styles.payment}>${item.payment_amount.toFixed(2)}</Text>
            </View>

            <View style={styles.jobDetails}>
                <Text style={styles.label}>Pickup:</Text>
                <Text style={styles.address}>{item.pickup_address}</Text>

                <Text style={[styles.label, { marginTop: spacing.sm }]}>Dropoff:</Text>
                <Text style={styles.address}>{item.dropoff_address}</Text>

                {item.distance_km && (
                    <Text style={styles.distance}>{item.distance_km.toFixed(1)} km</Text>
                )}

                {item.items_description && (
                    <Text style={styles.items}>Items: {item.items_description}</Text>
                )}
            </View>

            <Button
                title="Accept Job"
                onPress={() => handleAcceptJob(item.id)}
                style={styles.acceptButton}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={jobs}
                renderItem={renderJob}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        setRefreshing(true);
                        loadJobs();
                    }} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No available jobs at the moment</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.lg,
    },
    jobCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.medium,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    orderNumber: {
        ...typography.h3,
    },
    payment: {
        ...typography.h3,
        color: colors.secondary,
    },
    jobDetails: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    address: {
        ...typography.body,
    },
    distance: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    items: {
        ...typography.bodySmall,
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },
    acceptButton: {
        marginTop: spacing.sm,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
