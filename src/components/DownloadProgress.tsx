import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

interface DownloadProgressProps {
  progress: number; // 0-100
  visible?: boolean;
  showPercentage?: boolean;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({
  progress,
  visible = true,
  showPercentage = false,
}) => {
  const { theme } = useTheme();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    // Use simpler animation for better performance
    animatedProgress.value = withSpring(Math.max(0, Math.min(100, progress)), {
      damping: 20,
      mass: 0.5,
      stiffness: 100,
      overshootClamping: true,
    });
  }, [progress, animatedProgress]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value}%`,
    };
  });

  const progressColor = progress >= 100 ? (theme.colors.success || '#10b981') : theme.colors.secondary;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: theme.spacing.sm,
    },
    progressContainer: {
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: progressColor,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
      fontWeight: '600',
    },
  }), [theme, progressColor]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            animatedBarStyle,
          ]}
        />
      </View>
      {showPercentage && <Text style={styles.progressText}>{Math.round(progress)}%</Text>}
    </View>
  );
};

export default React.memo(DownloadProgress, (prev, next) => {
  const prevRounded = Math.round(prev.progress);
  const nextRounded = Math.round(next.progress);
  return (
    prevRounded === nextRounded &&
    prev.visible === next.visible &&
    prev.showPercentage === next.showPercentage
  );
});