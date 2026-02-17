export const colors = {
    primary: '#2563EB', // Blue
    primaryDark: '#1E40AF',
    secondary: '#10B981', // Green
    danger: '#EF4444', // Red
    warning: '#F59E0B', // Orange
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    disabled: '#9CA3AF',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
    },
    body: {
        fontSize: 16,
        color: colors.text,
    },
    bodySmall: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    caption: {
        fontSize: 12,
        color: colors.textSecondary,
    },
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
};
