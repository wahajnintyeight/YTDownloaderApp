import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../hooks/useTheme';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [showLoading, setShowLoading] = React.useState(false);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Show loading indicator after 2 seconds
    const loadingTimer = setTimeout(() => {
      setShowLoading(true);
    }, 2000);

    // Navigate to Main screen after initialization
    const navigationTimer = setTimeout(() => {
      navigation.replace('Main');
    }, 3000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(navigationTimer);
    };
  }, [navigation, fadeAnim, scaleAnim]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    logo: {
      fontSize: 48,
      fontWeight: '700',
      color: theme.colors.secondary,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      position: 'absolute',
      bottom: theme.spacing.xxl,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.logo}>YT Downloader</Text>
        <Text style={styles.subtitle}>
          Download your favorite videos{'\n'}in high quality
        </Text>
      </Animated.View>

      {showLoading && (
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={styles.loadingText}>Initializing...</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default SplashScreen;