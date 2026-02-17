import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { Button } from '../components/Common';
import { partnerAPI, authAPI } from '../services/api';
import { clearTokens, getRefreshToken } from '../services/storage';
import { colors, spacing, typography, shadows } from '../styles/theme';

export default function ProfileScreen({ navigation }) {
    const [partner, setPartner] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await partnerAPI.getProfile();
            setPartner(response.data.data);
            setFormData(response.data.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await partnerAPI.updateProfile({
                fullName: formData.full_name,
                phone: formData.phone,
                vehicleType: formData.vehicle_type,
                vehicleNumber: formData.vehicle_number,
            });

            Alert.alert('Success', 'Profile updated successfully');
            setEditing(false);
            loadProfile();
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const refreshToken = await getRefreshToken();
                        await authAPI.logout(refreshToken);
                    } catch (error) {
                        console.error('Logout error:', error);
                    } finally {
                        await clearTokens();
                        // Navigation will be handled by App.js
                    }
                },
            },
        ]);
    };

    if (!partner) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={editing ? formData.full_name : partner.full_name}
                    onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                    editable={editing}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={partner.email}
                    editable={false}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                    style={styles.input}
                    value={editing ? formData.phone : partner.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    editable={editing}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Vehicle Type</Text>
                <TextInput
                    style={styles.input}
                    value={editing ? formData.vehicle_type : partner.vehicle_type || ''}
                    onChangeText={(text) => setFormData({ ...formData, vehicle_type: text })}
                    editable={editing}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Vehicle Number</Text>
                <TextInput
                    style={styles.input}
                    value={editing ? formData.vehicle_number : partner.vehicle_number || ''}
                    onChangeText={(text) => setFormData({ ...formData, vehicle_number: text })}
                    editable={editing}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.statsSection}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{partner.total_deliveries}</Text>
                    <Text style={styles.statLabel}>Total Deliveries</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{partner.rating?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            {editing ? (
                <View style={styles.actions}>
                    <Button
                        title="Save Changes"
                        onPress={handleSave}
                        loading={loading}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Cancel"
                        onPress={() => {
                            setEditing(false);
                            setFormData(partner);
                        }}
                        variant="outline"
                        style={styles.actionButton}
                    />
                </View>
            ) : (
                <View style={styles.actions}>
                    <Button
                        title="Edit Profile"
                        onPress={() => setEditing(true)}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Logout"
                        onPress={handleLogout}
                        variant="danger"
                        style={styles.actionButton}
                    />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h2,
    },
    section: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        ...typography.body,
        backgroundColor: colors.surface,
    },
    inputDisabled: {
        backgroundColor: colors.background,
        color: colors.textSecondary,
    },
    statsSection: {
        flexDirection: 'row',
        marginVertical: spacing.lg,
        gap: spacing.md,
    },
    statItem: {
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
    actions: {
        marginTop: spacing.lg,
    },
    actionButton: {
        marginBottom: spacing.md,
    },
});
