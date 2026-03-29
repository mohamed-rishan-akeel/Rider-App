import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    SurfaceCard,
    StatusBadge,
    SectionHeader,
    EmptyState,
} from '../components/Common';
import AvailabilityToggle from '../components/AvailabilityToggle';
import {
    fetchDriverHome,
    selectHomeProfile,
    selectActiveDelivery,
    selectAssignedDeliveries,
    selectHomeLoading,
    selectHomeRefreshing,
    selectHomeError,
} from '../store/slices/homeSlice';
import { colors, spacing, typography, shadows, radii } from '../styles/theme';

const formatStatus = (value) =>
    value ? value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const statusTone = (status) => {
    if (['delivered', 'online', 'accepted', 'in_transit'].includes(status)) return 'success';
    if (['assigned', 'arrived_at_pickup', 'arrived_at_dropoff'].includes(status)) return 'info';
    if (status === 'failed' || status === 'offline') return 'danger';
    return 'warning';
};

function SummaryCard({ label, value, tone = 'default' }) {
    return (
        <SurfaceCard
            style={[
                styles.summaryCard,
                tone === 'success' && styles.summaryCardSuccess,
            ]}
        >
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
        </SurfaceCard>
    );
}

function DeliveryCard({ title, delivery, ctaLabel, onPress }) {
    return (
        <SurfaceCard style={styles.deliveryCard}>
            <View style={styles.deliveryCardHeader}>
                <View style={styles.deliveryCopy}>
                    <Text style={styles.deliveryOrder}>{delivery.orderNumber}</Text>
                    <Text style={styles.deliveryCustomer}>{delivery.customerName}</Text>
                </View>
                <StatusBadge label={formatStatus(delivery.status)} tone={statusTone(delivery.status)} />
            </View>

            <Text style={styles.deliveryEyebrow}>{title}</Text>
            <Text style={styles.deliveryAddressLabel}>Pickup</Text>
            <Text style={styles.deliveryAddress}>{delivery.pickupAddress}</Text>
            <Text style={[styles.deliveryAddressLabel, styles.deliveryAddressSpacer]}>Dropoff</Text>
            <Text style={styles.deliveryAddress}>{delivery.dropoffAddress}</Text>

            <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    {delivery.distanceKm ? `${delivery.distanceKm.toFixed(1)} km route` : 'Route assigned'}
                </Text>
                <Text style={styles.metaTextStrong}>{formatCurrency(delivery.paymentAmount)}</Text>
            </View>

            {delivery.etaMinutes ? (
                <Text style={styles.etaText}>Pickup ETA around {delivery.etaMinutes} min</Text>
            ) : null}

            <Button title={ctaLabel} onPress={onPress} style={styles.deliveryAction} />
        </SurfaceCard>
    );
}

export default function HomeScreen({ navigation }) {
    const dispatch = useDispatch();
    const profile = useSelector(selectHomeProfile);
    const activeDelivery = useSelector(selectActiveDelivery);
    const assignedDeliveries = useSelector(selectAssignedDeliveries);
    const isLoading = useSelector(selectHomeLoading);
    const isRefreshing = useSelector(selectHomeRefreshing);
    const error = useSelector(selectHomeError);

    useEffect(() => {
        dispatch(fetchDriverHome());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchDriverHome());
    };

    if (isLoading && !profile) {
        return (
            <View style={styles.centerState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.stateTitle}>Loading your dashboard</Text>
                <Text style={styles.stateBody}>Preparing summary, current route, and assigned work.</Text>
            </View>
        );
    }

    if (error && !profile) {
        return (
            <View style={styles.centerState}>
                <Text style={styles.stateTitle}>Dashboard unavailable</Text>
                <Text style={styles.stateBody}>{error}</Text>
                <Button title="Try Again" onPress={handleRefresh} style={styles.retryButton} />
            </View>
        );
    }

    const assignedList = assignedDeliveries || [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.hero}>
                <View style={styles.heroHeader}>
                    <View style={styles.heroCopy}>
                        <StatusBadge label="Driver Home" tone="info" />
                        <Text style={styles.heroTitle}>{profile?.full_name || 'Delivery Partner'}</Text>
                        <Text style={styles.heroSubtitle}>
                            {activeDelivery
                                ? 'Your live delivery is in motion and the next stops are queued.'
                                : 'You are set up for a focused, organized delivery shift.'}
                        </Text>
                    </View>
                    <View style={styles.toggleWrap}>
                        <AvailabilityToggle />
                    </View>
                </View>

                <View style={styles.summaryGrid}>
                    <SummaryCard label="Completed" value={profile?.total_deliveries || 0} />
                    <SummaryCard
                        label="Rating"
                        value={profile?.rating ? profile.rating.toFixed(1) : 'New'}
                        tone="success"
                    />
                </View>
            </View>

            {error ? (
                <SurfaceCard style={styles.inlineAlert}>
                    <Text style={styles.inlineAlertText}>{error}</Text>
                </SurfaceCard>
            ) : null}

            <View style={styles.section}>
                <SectionHeader
                    eyebrow="Live"
                    title="Active Delivery"
                    subtitle={activeDelivery ? 'Current route and customer details.' : 'No delivery in progress right now.'}
                />

                {activeDelivery ? (
                    <DeliveryCard
                        title="Current task"
                        delivery={activeDelivery}
                        ctaLabel="Open Active Delivery"
                        onPress={() => navigation.navigate('ActiveDelivery', { job: activeDelivery })}
                    />
                ) : (
                    <EmptyState
                        title="No active delivery"
                        body="When you accept a delivery, the live route will appear here."
                        action={
                            <Button
                                title="Browse Available Jobs"
                                onPress={() => navigation.navigate('AvailableJobs')}
                                style={styles.emptyAction}
                            />
                        }
                    />
                )}
            </View>

            <View style={styles.section}>
                <SectionHeader
                    eyebrow="Queue"
                    title="Assigned Deliveries"
                    subtitle={`${assignedList.length} job${assignedList.length === 1 ? '' : 's'} lined up for this shift.`}
                    right={
                        <Button
                            title="Manage"
                            variant="ghost"
                            onPress={() => navigation.navigate('AssignedDeliveries')}
                        />
                    }
                />

                {assignedList.length > 0 ? (
                    assignedList.map((delivery) => (
                        <DeliveryCard
                            key={delivery.id}
                            title="Assigned"
                            delivery={delivery}
                            ctaLabel="View Delivery"
                            onPress={() => navigation.navigate('ActiveDelivery', { job: delivery })}
                        />
                    ))
                ) : (
                    <EmptyState
                        title="No assigned deliveries"
                        body="Dispatch will place upcoming work here as jobs are routed to you."
                        action={
                            <Button
                                title="Open Assigned Queue"
                                variant="outline"
                                onPress={() => navigation.navigate('AssignedDeliveries')}
                                style={styles.emptyAction}
                            />
                        }
                    />
                )}
            </View>

            <View style={styles.actions}>
                <Button
                    title="Job History"
                    variant="outline"
                    onPress={() => navigation.navigate('JobHistory')}
                    style={styles.actionButton}
                />
                <Button
                    title="Profile"
                    variant="outline"
                    onPress={() => navigation.navigate('Profile')}
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
    content: {
        paddingBottom: spacing.xl,
    },
    hero: {
        backgroundColor: colors.primary,
        borderBottomLeftRadius: radii.xl,
        borderBottomRightRadius: radii.xl,
        padding: spacing.lg,
        ...shadows.medium,
    },
    heroHeader: {
        gap: spacing.md,
    },
    heroCopy: {
        gap: spacing.sm,
    },
    heroTitle: {
        ...typography.h1,
        color: colors.surface,
        marginTop: spacing.sm,
    },
    heroSubtitle: {
        ...typography.body,
        color: 'rgba(255,255,255,0.84)',
    },
    toggleWrap: {
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.14)',
        shadowOpacity: 0,
        elevation: 0,
    },
    summaryCardSuccess: {
        backgroundColor: 'rgba(15,157,122,0.2)',
    },
    summaryLabel: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.74)',
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    summaryValue: {
        ...typography.h2,
        color: colors.surface,
    },
    inlineAlert: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        backgroundColor: colors.dangerSoft,
    },
    inlineAlertText: {
        ...typography.bodySmall,
        color: colors.danger,
        fontWeight: '700',
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    deliveryCard: {
        marginBottom: spacing.md,
    },
    deliveryCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    deliveryCopy: {
        flex: 1,
    },
    deliveryOrder: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    deliveryCustomer: {
        ...typography.bodySmall,
        color: colors.text,
    },
    deliveryEyebrow: {
        ...typography.caption,
        color: colors.textMuted,
        marginBottom: spacing.sm,
        fontWeight: '700',
    },
    deliveryAddressLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '700',
    },
    deliveryAddressSpacer: {
        marginTop: spacing.sm,
    },
    deliveryAddress: {
        ...typography.body,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    metaText: {
        ...typography.bodySmall,
    },
    metaTextStrong: {
        ...typography.bodySmall,
        color: colors.secondary,
        fontWeight: '800',
    },
    etaText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '700',
        marginTop: spacing.sm,
    },
    deliveryAction: {
        marginTop: spacing.md,
    },
    emptyAction: {
        marginTop: spacing.md,
    },
    actions: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    actionButton: {
        marginBottom: 0,
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.background,
    },
    stateTitle: {
        ...typography.h2,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    stateBody: {
        ...typography.bodySmall,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    retryButton: {
        marginTop: spacing.lg,
        minWidth: 180,
    },
});
