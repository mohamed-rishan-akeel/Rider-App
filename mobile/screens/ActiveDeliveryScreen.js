import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    Modal,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Button, SurfaceCard, StatusBadge, SectionHeader } from '../components/Common';
import { jobsAPI } from '../services/api';
import {
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
} from '../services/location';
import { colors, spacing, typography, radii } from '../styles/theme';

const FAILURE_REASONS = [
    'Customer unreachable',
    'Merchant closed',
    'Incorrect address',
    'Vehicle breakdown',
    'Accident',
    'Weather conditions',
    'Other',
];

const toneForStatus = (status) => {
    if (['accepted', 'picked_up', 'in_transit'].includes(status)) return 'success';
    if (['assigned', 'arrived_at_pickup', 'arrived_at_dropoff'].includes(status)) return 'info';
    if (status === 'failed') return 'danger';
    return 'warning';
};

export default function ActiveDeliveryScreen({ route, navigation }) {
    const [job, setJob] = useState(route.params?.job || null);
    const [loading, setLoading] = useState(false);
    const [failureModalVisible, setFailureModalVisible] = useState(false);

    useEffect(() => {
        if (job) {
            startLocationTracking(job.id);
        }
        return () => {
            stopLocationTracking();
        };
    }, [job]);

    const handleStatusUpdate = async (newStatus, extraData = {}) => {
        setLoading(true);
        try {
            let locationData = {};
            try {
                const location = await getCurrentLocation();
                locationData = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                };
            } catch (locErr) {
                console.warn('Could not get location for status update');
            }

            await jobsAPI.updateStatus(job.id, newStatus, { ...extraData, ...locationData });
            setJob({ ...job, status: newStatus });

            if (newStatus === 'delivered') {
                stopLocationTracking();
                navigation.navigate('ProofOfDelivery', { jobId: job.id });
            } else if (newStatus === 'failed') {
                stopLocationTracking();
                Alert.alert('Job Failed', 'The delivery was marked as failed and logged.');
                navigation.goBack();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update status';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
            setFailureModalVisible(false);
        }
    };

    if (!job) {
        return (
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No active delivery selected.</Text>
            </View>
        );
    }

    const getNextAction = () => {
        switch (job.status) {
            case 'assigned':
                return { label: 'Accept Job', action: () => handleStatusUpdate('accepted') };
            case 'accepted':
                return { label: 'Arrived at Pickup', action: () => handleStatusUpdate('arrived_at_pickup') };
            case 'arrived_at_pickup':
                return { label: 'Picked Up', action: () => handleStatusUpdate('picked_up') };
            case 'picked_up':
                return { label: 'On the Way', action: () => handleStatusUpdate('in_transit') };
            case 'in_transit':
                return { label: 'Arrived at Dropoff', action: () => handleStatusUpdate('arrived_at_dropoff') };
            case 'arrived_at_dropoff':
                return { label: 'Delivered', action: () => handleStatusUpdate('delivered') };
            default:
                return null;
        }
    };

    const nextAction = getNextAction();

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

            <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
                <SectionHeader
                    eyebrow="Live Route"
                    title={job.orderNumber ?? job.order_number}
                    subtitle="Track the current stop, customer details, and route status."
                    right={<StatusBadge label={job.status.replace(/_/g, ' ')} tone={toneForStatus(job.status)} />}
                />

                <SurfaceCard style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Pickup</Text>
                    <Text style={styles.address}>{job.pickupAddress ?? job.pickup_address}</Text>
                    {job.pickupContactName || job.pickup_contact_name ? <Text style={styles.contact}>Contact: {job.pickupContactName ?? job.pickup_contact_name}</Text> : null}
                    {job.pickupContactPhone || job.pickup_contact_phone ? <Text style={styles.contact}>Phone: {job.pickupContactPhone ?? job.pickup_contact_phone}</Text> : null}
                </SurfaceCard>

                <SurfaceCard style={styles.detailCard}>
                    <Text style={styles.cardTitle}>Dropoff</Text>
                    <Text style={styles.address}>{job.dropoffAddress ?? job.dropoff_address}</Text>
                    <Text style={styles.contact}>Customer: {job.customerName ?? job.customer_name}</Text>
                    <Text style={styles.contact}>Phone: {job.customerPhone ?? job.customer_phone}</Text>
                </SurfaceCard>

                {job.itemSummary || job.items_description ? (
                    <SurfaceCard style={styles.detailCard}>
                        <Text style={styles.cardTitle}>Items</Text>
                        <Text style={styles.body}>{job.itemSummary ?? job.items_description}</Text>
                    </SurfaceCard>
                ) : null}

                {job.specialInstructions || job.special_instructions ? (
                    <SurfaceCard style={styles.detailCard}>
                        <Text style={styles.cardTitle}>Special Instructions</Text>
                        <Text style={styles.body}>{job.specialInstructions ?? job.special_instructions}</Text>
                    </SurfaceCard>
                ) : null}

                {nextAction ? (
                    <Button title={nextAction.label} onPress={nextAction.action} loading={loading} style={styles.primaryAction} />
                ) : null}

                {job.status !== 'delivered' && job.status !== 'failed' ? (
                    <Button
                        title="Mark as Failed"
                        onPress={() => setFailureModalVisible(true)}
                        variant="danger"
                    />
                ) : null}
            </ScrollView>

            <Modal
                transparent
                visible={failureModalVisible}
                animationType="slide"
                onRequestClose={() => setFailureModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <SurfaceCard style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reason for Failure</Text>
                        <FlatList
                            data={FAILURE_REASONS}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.reasonItem}
                                    onPress={() => handleStatusUpdate('failed', { reason: item })}
                                >
                                    <Text style={styles.reasonText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item}
                        />
                        <Button title="Cancel" onPress={() => setFailureModalVisible(false)} variant="outline" style={styles.cancelButton} />
                    </SurfaceCard>
                </View>
            </Modal>
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
    primaryAction: {
        marginBottom: spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
        padding: spacing.md,
    },
    modalContent: {
        maxHeight: '80%',
    },
    modalTitle: {
        ...typography.h2,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    reasonItem: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    reasonText: {
        ...typography.body,
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: spacing.md,
    },
});
