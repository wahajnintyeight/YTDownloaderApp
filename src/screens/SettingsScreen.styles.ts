import { StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { moderateScale as ms } from '../utils/responsive';

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
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButton: {
      padding: 4,
      marginLeft: -4,
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: ms(22),
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: ms(12),
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 14,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: ms(15),
      fontWeight: '600',
      color: theme.colors.text,
    },
    pathContainer: {
      marginBottom: 12,
    },
    pathLabel: {
      fontSize: ms(12),
      color: theme.colors.textSecondary,
      marginBottom: 6,
      fontWeight: '500',
    },
    pathBox: {
      backgroundColor: isDark ? theme.colors.background : '#F9F9F9',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 10,
    },
    pathText: {
      fontSize: ms(12),
      color: theme.colors.text,
      fontFamily: 'monospace',
      lineHeight: ms(16),
    },
    defaultBadge: {
      fontSize: ms(11),
      color: theme.colors.success,
      fontWeight: '600',
      marginTop: 6,
    },
    buttonGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      gap: 6,
    },
    primaryButton: {
      backgroundColor: theme.colors.secondary,
      flex: 1,
      minWidth: 120,
    },
    secondaryButton: {
      backgroundColor: isDark ? theme.colors.background : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.secondary,
      flex: 1,
      minWidth: 120,
    },
    tertiaryButton: {
      backgroundColor: isDark ? theme.colors.background : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.border,
      width: '100%',
    },
    buttonText: {
      fontSize: ms(13),
      fontWeight: '600',
      color: '#fff',
    },
    secondaryButtonText: {
      fontSize: ms(13),
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    tertiaryButtonText: {
      fontSize: ms(13),
      fontWeight: '600',
      color: isDark ? theme.colors.textSecondary : theme.colors.text,
    },
    infoBox: {
      backgroundColor: isDark ? theme.colors.background : '#F9F9F9',
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.secondary,
      padding: 10,
      borderRadius: 6,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
    infoText: {
      fontSize: ms(12),
      color: theme.colors.textSecondary,
      lineHeight: ms(18),
    },
  });
};
