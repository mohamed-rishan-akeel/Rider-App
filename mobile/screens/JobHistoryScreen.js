import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { jobsAPI } from '../services/api';
import { SurfaceCard, StatusBadge, SectionHeader, EmptyState } from '../components/Common';
import { colors, spacing, typography } from '../styles/theme';

const toneForStatus = (status) => (status === 'delivered' ? 'success' : 'warning');

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
        <SurfaceCard style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View style={styles.headerCopy}>
                    <Text style={styles.orderNumber}>{item.order_number}</Text>
                    <Text style={styles.date}>
                        {new Date(item.delivered_at || item.assigned_at).toLocaleDateString()}
                    </Text>
                </View>
                <StatusBadge
                    label={item.status.replace(/_/g, ' ').toUpperCase()}
                    tone={toneForStatus(item.status)}
                />
            </View>

            <Text style={styles.addressLabel}>Pickup</Text>
            <Text style={styles.address}>{item.pickup_address}</Text>
            <Text style={[styles.addressLabel, styles.addressGap]}>Dropoff</Text>
            <Text style={styles.address}>{item.dropoff_address}</Text>

            <View style={styles.footer}>
                <Text style={styles.payment}>${item.payment_amount.toFixed(2)}</Text>
                <Text style={styles.distance}>
                    {item.distance_km ? `${item.distance_km.toFixed(1)} km` : 'Completed'}
                </Text>
            </View>
        </SurfaceCard>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <SectionHeader
                    eyebrow="Archive"
                    title="Delivery History"
                    subtitle="Review previous completed and closed routes."
                />
            </View>

            <FlatList
                data={jobs}
                renderItem={renderJob}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadHistory();
                        }}
                    />
                }
                ListEmptyComponent={
                    <EmptyState
                        title={loading ? 'Loading history...' : 'No delivery history yet'}
                        body="Completed deliveries will appear here once routes are closed."
                    />
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
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    listContent: {
        padding: spacing.lg,
    },
    jobCard: {
        marginBottom: spacing.md,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    headerCopy: {
        flex: 1,
    },
    orderNumber: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    date: {
        ...typography.bodySmall,
    },
    addressLabel: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    addressGap: {
        marginTop: spacing.sm,
    },
    address: {
        ...typography.body,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    payment: {
        ...typography.body,
        color: colors.secondary,
        fontWeight: '800',
    },
    distance: {
        ...typography.bodySmall,
    },
});
