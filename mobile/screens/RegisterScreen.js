import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Button } from '../components/Common';
import { authAPI } from '../services/api';
import { saveTokens, saveUserData } from '../services/storage';
import { colors, spacing, typography } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        vehicleType: '',
        vehicleNumber: '',
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.register(formData);
            const { partner, accessToken, refreshToken } = response.data.data;

            await saveTokens(accessToken, refreshToken);
            await saveUserData(partner);

            Alert.alert('Success', 'Account created successfully!');
        } catch (error) {
            Alert.alert(
                'Registration Failed',
                error.response?.data?.message || 'Please try again'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join our delivery network</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name *"
                        value={formData.fullName}
                        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                        placeholderTextColor={colors.textSecondary}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email *"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Phone *"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password *"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        secureTextEntry
                        placeholderTextColor={colors.textSecondary}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Vehicle Type (e.g., Motorcycle, Car)"
                        value={formData.vehicleType}
                        onChangeText={(text) => setFormData({ ...formData, vehicleType: text })}
                        placeholderTextColor={colors.textSecondary}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Vehicle Number"
                        value={formData.vehicleNumber}
                        onChangeText={(text) => setFormData({ ...formData, vehicleNumber: text })}
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Button
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.registerButton}
                    />

                    <Button
                        title="Already have an account? Sign In"
                        onPress={() => navigation.goBack()}
                        variant="outline"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingTop: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        ...typography.body,
        backgroundColor: colors.surface,
    },
    registerButton: {
        marginBottom: spacing.md,
    },
});
