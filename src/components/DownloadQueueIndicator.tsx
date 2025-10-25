import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import LoadingAnimation from './LoadingAnimation';

interface DownloadQueueIndicatorProps {
  onPress?: () => void;
}

const DownloadQueueIndicator: React.FC<DownloadQueueIndicatorProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const { downloads } = useDownloads();

  const activeDownloads = downloads.filter(
    download => download.status === 'downloading' || download.status === 'pending'
  );

  const completedDownloads = downloads.filter(
    download => download.status === 'completed'
  );

  const failedDownloads = downloads.filter(
    download => download.status === 'failed'
  );

  if (downloads.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing.sm,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    loadingContainer: {
      marginRight: theme.spacing.sm,
    },
    textContainer: {
      flex: 1,
    },
    mainText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    subText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: theme.spacing.xs,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {activeDownloads.length > 0 && (
        <View style={styles.loadingContainer}>
          <LoadingAnimation type="download" visible={true} size="small" />
        </View>
      )}
      
      <View style={styles.textContainer}>
        <Text style={styles.mainText}>
          {activeDownloads.length > 0 
            ? `${activeDownloads.length} downloading...`
            : 'Downloads'
          }
        </Text>
        <Text style={styles.subText}>
          {completedDownloads.length} completed
          {failedDownloads.length > 0 && ` • ${failedDownloads.length} failed`}
        </Text>
      </View>

      {activeDownloads.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeDownloads.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default DownloadQueueIndicator;