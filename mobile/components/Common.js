import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { colors, spacing, typography, shadows } from '../styles/theme';

export const Button = ({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) => {
    const buttonStyles = [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'outline' && styles.buttonOutline,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        style,
    ];

    const textStyles = [
        styles.buttonText,
        variant === 'primary' && styles.buttonTextPrimary,
        variant === 'secondary' && styles.buttonTextSecondary,
        variant === 'outline' && styles.buttonTextOutline,
        variant === 'danger' && styles.buttonTextDanger,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.surface} />
            ) : (
                <Text style={textStyles}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.small,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonSecondary: {
        backgroundColor: colors.secondary,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    buttonDanger: {
        backgroundColor: colors.danger,
    },
    buttonDisabled: {
        backgroundColor: colors.disabled,
        opacity: 0.6,
    },
    buttonText: {
        ...typography.body,
        fontWeight: '600',
    },
    buttonTextPrimary: {
        color: colors.surface,
    },
    buttonTextSecondary: {
        color: colors.surface,
    },
    buttonTextOutline: {
        color: colors.primary,
    },
    buttonTextDanger: {
        color: colors.surface,
    },
});

export const Input = ({ placeholder, value, onChangeText, secureTextEntry, style, error }) => {
    return (
        <View style={[styles.inputContainer, style]}>
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                placeholderTextColor={colors.textSecondary}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const inputStyles = StyleSheet.create({
    inputContainer: {
        marginBottom: spacing.md,
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
    inputError: {
        borderColor: colors.danger,
    },
    errorText: {
        ...typography.caption,
        color: colors.danger,
        marginTop: spacing.xs,
    },
});

Object.assign(styles, inputStyles);
