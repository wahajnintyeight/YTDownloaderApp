import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../theme';
import { moderateScale as ms, scale, verticalScale as vs } from '../utils/responsive';

const DRAWER_HEIGHT = Dimensions.get('window').height * 0.85;

export const getDrawerStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'black',
    },
    drawerContainer: {
      height: DRAWER_HEIGHT,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: ms(20),
      borderTopRightRadius: ms(20),
      overflow: 'hidden',
    },
    dragHandle: {
      width: scale(36),
      height: vs(4),
      backgroundColor: theme.colors.border,
      borderRadius: ms(2),
      alignSelf: 'center',
      marginTop: vs(8),
      marginBottom: vs(16),
      opacity: 0.6,
    },
    header: {
      paddingHorizontal: scale(16),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: ms(18),
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: scale(16),
    },
    videoInfo: {
      flexDirection: 'row',
      marginBottom: vs(16),
    },
    thumbnail: {
      width: scale(120),
      height: vs(68),
      borderRadius: ms(8),
      marginRight: scale(12),
    },
    videoDetails: {
      flex: 1,
    },
    videoTitle: {
      fontSize: ms(16),
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: vs(4),
    },
    videoChannel: {
      fontSize: ms(14),
      color: theme.colors.textSecondary,
    },
    bottomSection: {
      marginTop: 'auto',
      paddingTop: vs(12),
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: vs(16),
    },
    loadingText: {
      marginTop: vs(8),
      fontSize: ms(12),
    },
    downloadButton: {
      paddingVertical: vs(12),
      borderRadius: ms(12),
      alignItems: 'center',
      marginTop: vs(16),
      marginBottom: vs(24),
    },
    downloadButtonText: {
      color: theme.colors.text,
      fontSize: ms(16),
      fontWeight: '600',
    },
  });

export const getSelectorStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: vs(16),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: vs(8),
    },
    title: {
      fontSize: ms(16),
      fontWeight: '600',
      color: theme.colors.text,
    },
    expandButton: {
      paddingHorizontal: scale(8),
      paddingVertical: vs(4),
    },
    expandText: {
      fontSize: ms(12),
      fontWeight: '500',
      color: theme.colors.secondary,
    },
    options: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(8),
    },
  });

export const getOptionButtonStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      paddingHorizontal: scale(12),
      paddingVertical: vs(8),
      borderRadius: ms(20),
      borderWidth: 1,
    },
    text: {
      fontSize: ms(14),
    },
  });
