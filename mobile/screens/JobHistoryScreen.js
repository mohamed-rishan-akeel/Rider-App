import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { jobsAPI } from '../services/api';
import { colors, spacing, typography, shadows } from '../styles/theme';

export default function JobHistoryScreen() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await jobsAPI.getHistory();
            setJobs(response.data.data);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderJob = ({ item }) => (
        <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <Text style={styles.orderNumber}>{item.order_number}</Text>
                <Text style={[styles.status, item.status === 'delivered' && styles.statusDelivered]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>

            <Text style={styles.address}>From: {item.pickup_address}</Text>
            <Text style={styles.address}>To: {item.dropoff_address}</Text>

            <View style={styles.footer}>
                <Text style={styles.payment}>${item.payment_amount.toFixed(2)}</Text>
                <Text style={styles.date}>
                    {new Date(item.delivered_at || item.assigned_at).toLocaleDateString()}
                </Text>
            </View>
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
                        loadHistory();
                    }} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No delivery history yet</Text>
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
        ...shadows.small,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    orderNumber: {
        ...typography.h3,
    },
    status: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    statusDelivered: {
        color: colors.secondary,
    },
    address: {
        ...typography.bodySmall,
        marginBottom: spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    payment: {
        ...typography.body,
        fontWeight: '600',
        color: colors.secondary,
    },
    date: {
        ...typography.bodySmall,
        color: colors.textSecondary,
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
