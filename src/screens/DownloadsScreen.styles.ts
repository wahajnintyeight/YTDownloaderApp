import { StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { moderateScale as ms, scale, verticalScale as vs } from '../utils/responsive';

export const getDownloadsScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
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
      justifyContent: 'space-between',
      alignItems: 'center',
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
    cleanupButton: {
      borderWidth: 1,
      borderRadius: ms(6),
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    cleanupButtonText: {
      fontSize: ms(12),
      fontWeight: '600',
    },
    listContainer: {
      flex: 1,
    },
    downloadItem: {
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      borderRadius: ms(10),
      overflow: 'hidden',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 0.5,
      },
      shadowOpacity: 0.1,
      shadowRadius: 1.5,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    thumbnail: {
      width: scale(120),
      height: vs(68),
      borderRadius: ms(8),
      backgroundColor: theme.colors.border,
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    videoTitle: {
      fontSize: ms(14),
      fontWeight: '600',
      lineHeight: ms(18),
      marginBottom: vs(2),
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: ms(11),
      fontWeight: '500',
    },
    statusContainer: {
      alignItems: 'center',
      gap: vs(4),
    },
    statusDot: {
      width: vs(8),
      height: vs(8),
      borderRadius: vs(4),
    },
    statusLabel: {
      fontSize: ms(10),
      fontWeight: '600',
    },
    progressSection: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    cancelButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: ms(4),
      paddingVertical: vs(6),
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: ms(11),
      fontWeight: '600',
    },
    messageContainer: {
      marginHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: vs(6),
      borderRadius: ms(4),
    },
    messageText: {
      fontSize: ms(11),
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyTitle: {
      fontSize: ms(20),
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
      fontSize: ms(16),
      textAlign: 'center',
      lineHeight: ms(24),
    },
    listContent: {
      paddingVertical: theme.spacing.xs,
    },
    sectionHeader: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    sectionHeaderText: {
      fontSize: ms(13),
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
