import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface DownloadProgressProps {
  progress: number; // 0-100
  filename?: string;
  visible?: boolean;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ 
  progress, 
  filename, 
  visible = true 
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.sm,
      borderRadius: 8,
      marginTop: theme.spacing.sm,
    },
    filename: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    progressContainer: {
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {filename && (
        <Text style={styles.filename} numberOfLines={1}>
          {filename}
        </Text>
      )}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${Math.max(0, Math.min(100, progress))}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {Math.round(progress)}% complete
      </Text>
    </View>
  );
};

export default DownloadProgress;