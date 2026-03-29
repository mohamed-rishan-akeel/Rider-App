import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {
    SurfaceCard,
    StatusBadge,
    SectionHeader,
} from '../components/Common';
import DeliveryActionControls from '../components/DeliveryActionControls';
import DeliveryStatusTimeline from '../components/DeliveryStatusTimeline';
import {
    startLocationTracking,
    stopLocationTracking,
} from '../services/location';
import { colors, spacing, typography, radii } from '../styles/theme';

const toneForStatus = (status) => {
    if (['accepted', 'picked_up', 'in_transit', 'delivered'].includes(status)) {
        return 'success';
    }
    if (['assigned', 'arrived_at_pickup', 'arrived_at_dropoff'].includes(status)) {
        return 'info';
    }
    if (['failed', 'cancelled'].includes(status)) {
        return 'danger';
    }
    return 'warning';
};

export default function ActiveDeliveryScreen({ route, navigation }) {
    const [job, setJob] = useState(route.params?.job || null);

    useEffect(() => {
        if (job) {
            startLocationTracking(job.id);
        }

        return () => {
            stopLocationTracking();
        };
    }, [job]);

    if (!job) {
        return (
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No active delivery selected.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: job.pickupLatitude ?? job.pickup_latitude,
                    longitude: job.pickupLongitude ?? job.pickup_longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker
                    coordinate={{
                        latitude: job.pickupLatitude ?? job.pickup_latitude,
                        longitude: job.pickupLongitude ?? job.pickup_longitude,
                    }}
                    title="Pickup"
                    pinColor={colors.primary}
                />
                <Marker
                    coordinate={{
                        latitude: job.dropoffLatitude ?? job.dropoff_latitude,
                        longitude: job.dropoffLongitude ?? job.dropoff_longitude,
                    }}
                    title="Dropoff"
                    pinColor={colors.secondary}
                />
            </MapView>

            <ScrollView
                style={styles.sheet}
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
            >
                <SectionHeader
                    eyebrow="Live Route"
                    title={job.orderNumber ?? job.order_number}
                    subtitle="Track the current stop, customer details, and route status."
                    right={
                        <StatusBadge
                            label={(job.status || '').replace(/_/g, ' ')}
                            tone={toneForStatus(job.status)}
                        />
                    }
                />

                <SurfaceCard style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Pickup</Text>
                    <Text style={styles.address}>
                        {job.pickupAddress ?? job.pickup_address}
                    </Text>
                    {job.pickupContactName || job.pickup_contact_name ? (
                        <Text style={styles.contact}>
                            Contact: {job.pickupContactName ?? job.pickup_contact_name}
                        </Text>
                    ) : null}
                    {job.pickupContactPhone || job.pickup_contact_phone ? (
                        <Text style={styles.contact}>
                            Phone: {job.pickupContactPhone ?? job.pickup_contact_phone}
                        </Text>
                    ) : null}
                </SurfaceCard>

                <SurfaceCard style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Dropoff</Text>
                    <Text style={styles.address}>
                        {job.dropoffAddress ?? job.dropoff_address}
                    </Text>
                    <Text style={styles.contact}>
                        Customer: {job.customerName ?? job.customer_name}
                    </Text>
                    <Text style={styles.contact}>
                        Phone: {job.customerPhone ?? job.customer_phone}
                    </Text>
                </SurfaceCard>

                {job.itemSummary || job.items_description ? (
                    <SurfaceCard style={styles.detailCard}>
                        <Text style={styles.cardTitle}>Items</Text>
                        <Text style={styles.body}>
                            {job.itemSummary ?? job.items_description}
                        </Text>
                    </SurfaceCard>
                ) : null}

                {job.specialInstructions || job.special_instructions ? (
                    <SurfaceCard style={styles.detailCard}>
                        <Text style={styles.cardTitle}>Special Instructions</Text>
                        <Text style={styles.body}>
                            {job.specialInstructions ?? job.special_instructions}
                        </Text>
                    </SurfaceCard>
                ) : null}

                <DeliveryStatusTimeline status={job.status} />

                <DeliveryActionControls
                    delivery={job}
                    onDeliveryChange={setJob}
                    onActionSuccess={({ delivery: nextDelivery }) => {
                        if (nextDelivery.status === 'delivered') {
                            stopLocationTracking();
                            navigation.navigate('ProofOfDelivery', {
                                jobId: nextDelivery.id,
                            });
                        }
                    }}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    emptyText: {
        ...typography.body,
    },
    map: {
        height: 280,
    },
    sheet: {
        flex: 1,
        marginTop: -spacing.lg,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        backgroundColor: colors.background,
    },
    sheetContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    detailCard: {
        marginBottom: spacing.md,
    },
    cardTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
    },
    address: {
        ...typography.body,
        marginBottom: spacing.xs,
    },
    contact: {
        ...typography.bodySmall,
    },
    body: {
        ...typography.body,
    },
});
