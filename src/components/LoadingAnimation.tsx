import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

type AnimationType = 'search' | 'download' | 'general';

interface LoadingAnimationProps {
  type?: AnimationType;
  visible: boolean;
  size?: 'small' | 'large';
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'general',
  visible,
  size = 'large',
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => {
        rotateAnimation.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, rotateAnim]);

  const getColor = () => {
    switch (type) {
      case 'search':
        return theme.colors.secondary;
      case 'download':
        return theme.colors.accent;
      default:
        return theme.colors.primary;
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    customLoader: {
      width: size === 'large' ? 40 : 24,
      height: size === 'large' ? 40 : 24,
      borderRadius: size === 'large' ? 20 : 12,
      borderWidth: 3,
      borderColor: theme.colors.border,
      borderTopColor: getColor(),
    },
  });

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Custom animated loader */}
      <Animated.View
        style={[
          styles.customLoader,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      />
      
      {/* Fallback to ActivityIndicator for better compatibility */}
      {/* <ActivityIndicator
        size={size}
        color={getColor()}
        animating={visible}
      /> */}
    </Animated.View>
  );
};

export default LoadingAnimation;