import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../hooks/useTheme';

type AnimationType = 
  | 'loading' 
  | 'downloading' 
  | 'success' 
  | 'error' 
  | 'empty' 
  | 'search';

interface LottieAnimationProps {
  type: AnimationType;
  visible?: boolean;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  onAnimationFinish?: () => void;
}

// Lottie animation sources (using JSON URLs from LottieFiles)
const ANIMATION_SOURCES = {
  loading: require('../assets/animations/loading.json'),
  downloading: require('../assets/animations/downloading.json'),
  success: require('../assets/animations/success.json'),
  error: require('../assets/animations/error.json'),
  empty: require('../assets/animations/empty.json'),
  search: require('../assets/animations/search.json'),
};

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  type,
  visible = true,
  size = 150,
  loop = true,
  autoPlay = true,
  onAnimationFinish,
}) => {
  const { theme } = useTheme();
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible && autoPlay && lottieRef.current) {
      lottieRef.current.play();
    } else if (!visible && lottieRef.current) {
      lottieRef.current.pause();
    }
  }, [visible, autoPlay]);

  if (!visible) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  // Fallback to simple animation if source not found
  let source;
  try {
    source = ANIMATION_SOURCES[type];
  } catch (error) {
    console.warn(`Lottie animation not found for type: ${type}`);
    return null;
  }

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: size, height: size }}
        onAnimationFinish={onAnimationFinish}
        colorFilters={[
          {
            keypath: '*',
            color: theme.colors.primary,
          },
        ]}
      />
    </View>
  );
};

export default LottieAnimation;
