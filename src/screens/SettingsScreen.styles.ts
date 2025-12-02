import { StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { moderateScale as ms, scale, verticalScale as vs } from '../utils/responsive';

export const getSettingsScreenStyles = (theme: Theme) => {
  const isDark = theme.mode === 'dark';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginLeft: -theme.spacing.xs,
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: ms(28),
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: ms(13),
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: ms(12),
      padding: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: ms(18),
      fontWeight: '600',
      color: theme.colors.text,
    },
    pathContainer: {
      marginBottom: theme.spacing.lg,
    },
    pathLabel: {
      fontSize: ms(14),
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      fontWeight: '500',
    },
    pathBox: {
      backgroundColor: isDark ? theme.colors.background : '#F9F9F9',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: ms(8),
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    pathText: {
      fontSize: ms(13),
      color: theme.colors.text,
      fontFamily: 'monospace',
      lineHeight: ms(18),
    },
    defaultBadge: {
      fontSize: ms(12),
      color: theme.colors.success,
      fontWeight: '600',
    },
    buttonGroup: {
      gap: theme.spacing.sm,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: ms(8),
      gap: theme.spacing.sm,
    },
    primaryButton: {
      backgroundColor: theme.colors.secondary, // Use neon red instead of primary
    },
    secondaryButton: {
      backgroundColor: isDark ? theme.colors.background : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.secondary, // Use neon red
    },
    tertiaryButton: {
      backgroundColor: isDark ? theme.colors.background : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonText: {
      fontSize: ms(14),
      fontWeight: '600',
      color: '#fff',
    },
    secondaryButtonText: {
      fontSize: ms(14),
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    tertiaryButtonText: {
      fontSize: ms(14),
      fontWeight: '600',
      color: isDark ? theme.colors.textSecondary : theme.colors.text,
    },
    infoBox: {
      backgroundColor: isDark ? theme.colors.background : '#F9F9F9',
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.secondary, // Use neon red
      padding: theme.spacing.md,
      borderRadius: ms(8),
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
    infoText: {
      fontSize: ms(13),
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      lineHeight: ms(20),
    },
  });
};