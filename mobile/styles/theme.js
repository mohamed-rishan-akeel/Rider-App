export const colors = {
    primary: '#143C8C',
    primaryDark: '#0D2A63',
    primarySoft: '#DCE8FF',
    secondary: '#0F9D7A',
    secondarySoft: '#D9F6EE',
    accent: '#F0B44C',
    accentSoft: '#FFF2D9',
    danger: '#D94B63',
    dangerSoft: '#FFE2E8',
    warning: '#C98A1B',
    warningSoft: '#FFF1D5',
    info: '#4B7BE5',
    infoSoft: '#E5EEFF',
    background: '#F3F6FB',
    backgroundAccent: '#E8EEF8',
    surface: '#FFFFFF',
    surfaceMuted: '#F8FAFD',
    text: '#142033',
    textSecondary: '#63708A',
    textMuted: '#8E99AE',
    border: '#D7DFEC',
    borderStrong: '#C2CDDE',
    success: '#0F9D7A',
    disabled: '#B5C0D3',
    overlay: 'rgba(9, 18, 34, 0.52)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const radii = {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
};

export const typography = {
    hero: {
        fontSize: 36,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.8,
    },
    h1: {
        fontSize: 30,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.6,
    },
    h2: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.4,
    },
    h3: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        color: colors.text,
    },
    bodySmall: {
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
    },
    caption: {
        fontSize: 11,
        lineHeight: 16,
        color: colors.textSecondary,
        letterSpacing: 0.7,
    },
};

export const shadows = {
    small: {
        shadowColor: '#0D1B34',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    medium: {
        shadowColor: '#0D1B34',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
        elevation: 5,
    },
    large: {
        shadowColor: '#0D1B34',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 8,
    },
};
