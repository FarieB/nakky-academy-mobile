export const Theme = {
  colors: {
    primary: "#d81b60",
    secondary: "#f8bbd0",
    background: "#f5f5f5",
    card: "#ffffff",
    text: "#222222",
    subtitle: "#666666",
    success: "#4CAF50",
    warning: "#FFC107",
    danger: "#F44336",
    border: "#e5e5e5",
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 20,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

/**
 * Theme colors used by the Expo-generated UI components.
 * Keep these separate from Theme so existing Nakky Academy
 * components using Theme.colors continue working.
 */
export const Colors = {
  light: {
    text: Theme.colors.text,
    background: Theme.colors.background,
    tint: Theme.colors.primary,
    icon: Theme.colors.subtitle,
    tabIconDefault: Theme.colors.subtitle,
    tabIconSelected: Theme.colors.primary,
    card: Theme.colors.card,
    border: Theme.colors.border,
  },

  dark: {
    text: "#ffffff",
    background: "#121212",
    tint: Theme.colors.secondary,
    icon: "#cccccc",
    tabIconDefault: "#999999",
    tabIconSelected: Theme.colors.secondary,
    card: "#1e1e1e",
    border: "#333333",
  },
};
