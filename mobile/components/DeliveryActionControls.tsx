import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button, Input, SurfaceCard } from './Common';
import { jobsAPI } from '../services/api';
import { getCurrentLocation } from '../services/location';
import {
    acceptAssignedDelivery,
    rejectAssignedDelivery,
} from '../store/slices/assignedDeliveriesSlice';
import { fetchDriverHome } from '../store/slices/homeSlice';
import type { AppDispatch } from '../store/types';
import type { Delivery } from '../types/delivery';
import {
    DELIVERY_ACTION_LABELS,
    DeliveryWorkflowAction,
    assertValidTransition,
    getAvailableActions,
    getNextStatusForAction,
    isWorkflowStatus,
} from '../utils/deliveryWorkflow';
import { colors, radii, spacing, typography } from '../styles/theme';

type DeliveryActionSuccess = {
    action: DeliveryWorkflowAction;
    delivery: Delivery;
};

type DeliveryActionControlsProps = {
    delivery: Delivery;
    onDeliveryChange?: (delivery: Delivery) => void;
    onActionSuccess?: (result: DeliveryActionSuccess) => void;
};

type ActionRequestState = {
    action: DeliveryWorkflowAction;
    note: string;
};

const ACTION_ORDER: readonly DeliveryWorkflowAction[] = [
    DeliveryWorkflowAction.REJECT,
    DeliveryWorkflowAction.ACCEPT,
    DeliveryWorkflowAction.ARRIVE_PICKUP,
    DeliveryWorkflowAction.PICK_UP,
    DeliveryWorkflowAction.START_TRANSIT,
    DeliveryWorkflowAction.COMPLETE_DELIVERY,
];

const ACTION_VARIANTS: Record<
    DeliveryWorkflowAction,
    'primary' | 'outline' | 'danger'
> = {
    [DeliveryWorkflowAction.ACCEPT]: 'primary',
    [DeliveryWorkflowAction.REJECT]: 'outline',
    [DeliveryWorkflowAction.ARRIVE_PICKUP]: 'primary',
    [DeliveryWorkflowAction.PICK_UP]: 'primary',
    [DeliveryWorkflowAction.START_TRANSIT]: 'primary',
    [DeliveryWorkflowAction.COMPLETE_DELIVERY]: 'danger',
    [DeliveryWorkflowAction.CANCEL]: 'danger',
};

const CRITICAL_ACTION_DETAILS: Partial<
    Record<
        DeliveryWorkflowAction,
        {
            title: string;
            message: string;
            confirmLabel: string;
            noteLabel?: string;
            notePlaceholder?: string;
        }
    >
> = {
    [DeliveryWorkflowAction.REJECT]: {
        title: 'Reject Delivery',
        message: 'This will return the delivery to dispatch and remove it from your queue.',
        confirmLabel: 'Reject Delivery',
    },
    [DeliveryWorkflowAction.ARRIVE_PICKUP]: {
        title: 'Arrived at Pickup',
        message: 'Confirm that you are at the pickup location. You can add an optional note for dispatch.',
        confirmLabel: 'Confirm Arrival',
        noteLabel: 'Pickup Note',
        notePlaceholder: 'Optional: front desk checked in, store queue, gate code...',
    },
    [DeliveryWorkflowAction.PICK_UP]: {
        title: 'Mark Picked Up',
        message: 'Confirm that the order has been collected. You can include an optional pickup note.',
        confirmLabel: 'Confirm Pickup',
        noteLabel: 'Pickup Note',
        notePlaceholder: 'Optional: bag count, packaging issue, merchant note...',
    },
    [DeliveryWorkflowAction.START_TRANSIT]: {
        title: 'Start Transit',
        message: 'Confirm that you have the order and are starting the customer route.',
        confirmLabel: 'Start Transit',
    },
    [DeliveryWorkflowAction.COMPLETE_DELIVERY]: {
        title: 'Mark Delivered',
        message: 'Confirm that the order has been handed off to the customer.',
        confirmLabel: 'Mark Delivered',
    },
};

const getActionTitle = (action: DeliveryWorkflowAction) =>
    DELIVERY_ACTION_LABELS[action] ?? 'Continue';

export default function DeliveryActionControls({
    delivery,
    onDeliveryChange,
    onActionSuccess,
}: DeliveryActionControlsProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [loadingAction, setLoadingAction] =
        useState<DeliveryWorkflowAction | null>(null);
    const [pendingConfirmation, setPendingConfirmation] =
        useState<DeliveryWorkflowAction | null>(null);
    const [pickupNote, setPickupNote] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [lastFailedRequest, setLastFailedRequest] =
        useState<ActionRequestState | null>(null);

    const availableActions = useMemo(() => {
        if (!isWorkflowStatus(delivery.status)) {
            return [];
        }

        const allowed = getAvailableActions(delivery.status).filter((action) =>
            ACTION_ORDER.includes(action)
        );

        return ACTION_ORDER.filter((action) => allowed.includes(action));
    }, [delivery.status]);

    const runAction = async (action: DeliveryWorkflowAction, note = pickupNote) => {
        if (!isWorkflowStatus(delivery.status)) {
            return;
        }

        setLoadingAction(action);
        setActionError(null);
        let didSucceed = false;

        try {
            let nextDelivery: Delivery;

            if (action === DeliveryWorkflowAction.ACCEPT) {
                const result = await dispatch(acceptAssignedDelivery(delivery.id));
                if (acceptAssignedDelivery.rejected.match(result)) {
                    throw new Error(
                        typeof result.payload === 'string'
                            ? result.payload
                            : 'Failed to accept delivery'
                    );
                }

                nextDelivery = {
                    ...delivery,
                    status:
                        getNextStatusForAction(delivery.status, action) ?? delivery.status,
                    acceptedAt: new Date().toISOString(),
                };
            } else if (action === DeliveryWorkflowAction.REJECT) {
                const result = await dispatch(rejectAssignedDelivery(delivery.id));
                if (rejectAssignedDelivery.rejected.match(result)) {
                    throw new Error(
                        typeof result.payload === 'string'
                            ? result.payload
                            : 'Failed to reject delivery'
                    );
                }

                nextDelivery = {
                    ...delivery,
                    status:
                        getNextStatusForAction(delivery.status, action) ?? delivery.status,
                };
            } else {
                const nextStatus = getNextStatusForAction(delivery.status, action);

                if (!nextStatus) {
                    throw new Error(`Action "${action}" is not available`);
                }

                assertValidTransition(delivery.status, nextStatus);

                let locationPayload: { latitude?: number; longitude?: number } = {};

                try {
                    const location = await getCurrentLocation();
                    locationPayload = {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    };
                } catch (error) {
                    console.warn('Could not get location for delivery action update');
                }

                const trimmedNote = note.trim();

                await jobsAPI.updateStatus(delivery.id, nextStatus, {
                    ...locationPayload,
                    ...(trimmedNote ? { reason: trimmedNote } : {}),
                });
                await dispatch(fetchDriverHome());

                nextDelivery = {
                    ...delivery,
                    status: nextStatus,
                };
            }

            onDeliveryChange?.(nextDelivery);
            onActionSuccess?.({ action, delivery: nextDelivery });
            setPickupNote('');
            setLastFailedRequest(null);
            didSucceed = true;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'We could not update the delivery status. Please try again.';

            setActionError(message);
            setLastFailedRequest({
                action,
                note,
            });
        } finally {
            setLoadingAction(null);
            if (didSucceed) {
                setPendingConfirmation(null);
            }
        }
    };

    const handleActionPress = (action: DeliveryWorkflowAction) => {
        if (loadingAction) {
            return;
        }

        if (CRITICAL_ACTION_DETAILS[action]) {
            setActionError(null);
            setPendingConfirmation(action);
            return;
        }

        void runAction(action);
    };

    if (!availableActions.length) {
        return null;
    }

    const confirmation = pendingConfirmation
        ? CRITICAL_ACTION_DETAILS[pendingConfirmation]
        : null;

    return (
        <>
            <View style={styles.actionGroup}>
                {actionError ? (
                    <SurfaceCard style={styles.errorCard}>
                        <Text style={styles.errorTitle}>Action failed</Text>
                        <Text style={styles.errorMessage}>{actionError}</Text>
                        {lastFailedRequest ? (
                            <Button
                                title={`Retry ${getActionTitle(lastFailedRequest.action)}`}
                                variant="outline"
                                onPress={() =>
                                    void runAction(
                                        lastFailedRequest.action,
                                        lastFailedRequest.note
                                    )
                                }
                                loading={loadingAction === lastFailedRequest.action}
                            />
                        ) : null}
                    </SurfaceCard>
                ) : null}

                {availableActions.map((action) => (
                    <Button
                        key={action}
                        title={getActionTitle(action)}
                        variant={ACTION_VARIANTS[action]}
                        onPress={() => handleActionPress(action)}
                        loading={loadingAction === action}
                        disabled={loadingAction !== null && loadingAction !== action}
                        style={styles.actionButton}
                    />
                ))}
            </View>

            <Modal
                transparent
                visible={pendingConfirmation !== null}
                animationType="fade"
                onRequestClose={() => setPendingConfirmation(null)}
            >
                <View style={styles.modalOverlay}>
                    <SurfaceCard style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {confirmation?.title ?? 'Confirm Action'}
                        </Text>
                        <Text style={styles.modalMessage}>
                            {confirmation?.message ?? 'Do you want to continue?'}
                        </Text>

                        {confirmation?.noteLabel ? (
                            <Input
                                label={confirmation.noteLabel}
                                placeholder={confirmation.notePlaceholder}
                                value={pickupNote}
                                onChangeText={setPickupNote}
                                multiline
                                numberOfLines={3}
                            />
                        ) : null}

                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={() => {
                                    setPendingConfirmation(null);
                                    setActionError(null);
                                }}
                                disabled={loadingAction !== null}
                                style={styles.modalButton}
                            />
                            <Button
                                title={confirmation?.confirmLabel ?? 'Continue'}
                                variant={
                                    pendingConfirmation ===
                                    DeliveryWorkflowAction.COMPLETE_DELIVERY
                                        ? 'danger'
                                        : 'primary'
                                }
                                onPress={() =>
                                    pendingConfirmation
                                        ? void runAction(pendingConfirmation)
                                        : undefined
                                }
                                loading={
                                    pendingConfirmation !== null &&
                                    loadingAction === pendingConfirmation
                                }
                                disabled={pendingConfirmation === null}
                                style={styles.modalButton}
                            />
                        </View>
                    </SurfaceCard>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    actionGroup: {
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    actionButton: {
        width: '100%',
    },
    errorCard: {
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.dangerSoft,
    },
    errorTitle: {
        ...typography.h3,
        color: colors.danger,
        marginBottom: spacing.xs,
    },
    errorMessage: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.overlay,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        borderRadius: radii.lg,
        padding: spacing.lg,
    },
    modalTitle: {
        ...typography.h3,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    modalMessage: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    modalButton: {
        flex: 1,
    },
});
