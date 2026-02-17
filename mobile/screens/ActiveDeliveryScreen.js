import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button } from '../components/Common';
import { jobsAPI } from '../services/api';
import { startLocationTracking, stopLocationTracking } from '../services/location';
import { colors, spacing, typography, shadows } from '../styles/theme';

export default function ActiveDeliveryScreen({ route, navigation }) {
    const [job, setJob] = useState(route.params?.job || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (job) {
            // Start location tracking
            startLocationTracking(job.id);
        }

        return () => {
            // Stop tracking when leaving screen
            stopLocationTracking();
        };
    }, [job]);

    const handleStatusUpdate = async (newStatus) => {
        setLoading(true);
        try {
            await jobsAPI.updateStatus(job.id, newStatus);
            setJob({ ...job, status: newStatus });

            if (newStatus === 'delivered') {
                stopLocationTracking();
                navigation.navigate('ProofOfDelivery', { jobId: job.id });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    if (!job) {
        return (
            <View style={styles.container}>
                <Text>No active delivery</Text>
            </View>
        );
    }

    const getNextAction = () => {
        switch (job.status) {
            case 'assigned':
                return {
                    label: 'Arrived at Pickup',
                    action: () => handleStatusUpdate('picked_up'),
                };
            case 'picked_up':
                return {
                    label: 'Start Delivery',
                    action: () => handleStatusUpdate('in_transit'),
                };
            case 'in_transit':
                return {
                    label: 'Mark as Delivered',
                    action: () => handleStatusUpdate('delivered'),
                };
            default:
                return null;
        }
    };

    const nextAction = getNextAction();

    return (
        <ScrollView style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: job.pickup_latitude,
                    longitude: job.pickup_longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker
                    coordinate={{
                        latitude: job.pickup_latitude,
                        longitude: job.pickup_longitude,
                    }}
                    title="Pickup Location"
                    pinColor={colors.primary}
                />
                <Marker
                    coordinate={{
                        latitude: job.dropoff_latitude,
                        longitude: job.dropoff_longitude,
                    }}
                    title="Dropoff Location"
                    pinColor={colors.secondary}
                />
            </MapView>

            <View style={styles.content}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                        {job.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>

                <Text style={styles.orderNumber}>{job.order_number}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup</Text>
                    <Text style={styles.address}>{job.pickup_address}</Text>
                    {job.pickup_contact_name && (
                        <Text style={styles.contact}>Contact: {job.pickup_contact_name}</Text>
                    )}
                    {job.pickup_contact_phone && (
                        <Text style={styles.contact}>Phone: {job.pickup_contact_phone}</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dropoff</Text>
                    <Text style={styles.address}>{job.dropoff_address}</Text>
                    <Text style={styles.contact}>Customer: {job.customer_name}</Text>
                    <Text style={styles.contact}>Phone: {job.customer_phone}</Text>
                </View>

                {job.items_description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Items</Text>
                        <Text style={styles.items}>{job.items_description}</Text>
                    </View>
                )}

                {job.special_instructions && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Special Instructions</Text>
                        <Text style={styles.instructions}>{job.special_instructions}</Text>
                    </View>
                )}

                {nextAction && (
                    <Button
                        title={nextAction.label}
                        onPress={nextAction.action}
                        loading={loading}
                        style={styles.actionButton}
                    />
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    map: {
        height: 300,
    },
    content: {
        padding: spacing.lg,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        marginBottom: spacing.md,
    },
    statusText: {
        ...typography.caption,
        color: colors.surface,
        fontWeight: '600',
    },
    orderNumber: {
        ...typography.h2,
        marginBottom: spacing.lg,
    },
    section: {
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 8,
        ...shadows.small,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    address: {
        ...typography.body,
        marginBottom: spacing.xs,
    },
    contact: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    items: {
        ...typography.body,
    },
    instructions: {
        ...typography.body,
        fontStyle: 'italic',
        color: colors.warning,
    },
    actionButton: {
        marginTop: spacing.md,
    },
});
