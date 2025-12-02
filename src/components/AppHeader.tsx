import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon } from './icons/ModernIcons';

interface AppHeaderProps {
  title?: string;
  showThemeToggle?: boolean;
  onThemeToggle?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title = 'YT Downloader',
  showThemeToggle = true,
  onThemeToggle,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const handleThemeToggle = () => {
    toggleTheme();
    onThemeToggle?.();
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      minHeight: 72,
    },
    leftSection: {
      flex: 1,
    },
    centerSection: {
      flex: 2,
      alignItems: 'center',
    },
    rightSection: {
      flex: 1,
      alignItems: 'flex-end',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    themeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    brandContainer: {
      alignItems: 'center',
    },
    brandAccent: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      marginTop: 6,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            {/* Left section - can be used for back button or menu */}
          </View>
          
          <View style={styles.centerSection}>
            <View style={styles.brandContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Video Downloader</Text>
              <View style={styles.brandAccent} />
            </View>
          </View>
          
          <View style={styles.rightSection}>
            {/* Theme toggle hidden temporarily due to color inconsistencies */}
            {false && showThemeToggle && (
              <TouchableOpacity
                style={styles.themeButton}
                onPress={handleThemeToggle}
                activeOpacity={0.7}
              >
                {isDark ? (
                  <SunIcon size={20} color="#A0A0A0" strokeWidth={2} />
                ) : (
                  <MoonIcon size={20} color="#A0A0A0" strokeWidth={2} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default AppHeader;