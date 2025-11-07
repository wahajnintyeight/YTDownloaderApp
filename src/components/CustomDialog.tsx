import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { DialogConfig, DialogType } from '../types/dialog';
import {
  moderateScale as ms,
  scale,
  verticalScale as vs,
} from '../utils/responsive';

interface CustomDialogProps {
  visible: boolean;
  config: DialogConfig | null;
  onDismiss: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculate responsive dialog width
// For small screens (< 360px): 90% of screen width
// For medium screens (360-600px): 85% of screen width, max 340px
// For large screens (> 600px): max 400px
const getDialogWidth = () => {
  if (screenWidth < 360) {
    return screenWidth * 0.9;
  } else if (screenWidth < 600) {
    return Math.min(screenWidth * 0.85, 340);
  } else {
    return Math.min(screenWidth * 0.7, 400);
  }
};

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  config,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Enter animation
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
      contentScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      contentOpacity.value = withTiming(1, { duration: 300 });
    } else {
      // Exit animation
      backdropOpacity.value = withTiming(0, { duration: 250 });
      contentScale.value = withTiming(0.8, { duration: 250 });
      contentOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  const getDialogColor = (type: DialogType): string => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return '#FF9500';
      case 'confirm':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  const getDialogIcon = (type: DialogType): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'confirm':
        return '?';
      default:
        return 'ℹ';
    }
  };

  const handleBackdropPress = () => {
    if (config?.dismissible !== false) {
      onDismiss();
    }
  };

  const handleButtonPress = (onPress: () => void) => {
    onPress();
    onDismiss();
  };

  if (!config) return null;

  const dialogColor = getDialogColor(config.type || 'info');
  const dialogIcon = getDialogIcon(config.type || 'info');

  const dialogWidth = getDialogWidth();
  
  // Determine if buttons should stack vertically (for 3+ buttons or small screens)
  const shouldStackButtons = buttons.length > 2 || screenWidth < 360;

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'black',
    },
    dialogContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: ms(16),
      padding: 0,
      width: dialogWidth,
      maxHeight: screenHeight * 0.8, // Prevent dialog from being too tall
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: vs(8),
      },
      shadowOpacity: 0.25,
      shadowRadius: ms(16),
      elevation: 16,
    },
    header: {
      alignItems: 'center',
      paddingTop: vs(20),
      paddingHorizontal: scale(20),
      paddingBottom: vs(12),
    },
    iconContainer: {
      width: ms(44),
      height: ms(44),
      borderRadius: ms(22),
      backgroundColor: dialogColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: vs(12),
    },
    icon: {
      fontSize: ms(22),
      color: dialogColor,
      fontWeight: 'bold',
    },
    title: {
      fontSize: ms(17),
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: vs(6),
    },
    message: {
      fontSize: ms(14),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: ms(20),
      paddingHorizontal: scale(20),
      paddingBottom: vs(20),
    },
    buttonsContainer: {
      flexDirection: shouldStackButtons ? 'column' : 'row',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    button: {
      flex: shouldStackButtons ? 0 : 1,
      paddingVertical: vs(14),
      paddingHorizontal: scale(16),
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: vs(48), // Ensure touch target is large enough
    },
    buttonSeparator: {
      width: shouldStackButtons ? 0 : 1,
      height: shouldStackButtons ? 1 : 0,
      backgroundColor: theme.colors.border,
    },
    buttonText: {
      fontSize: ms(15),
      fontWeight: '600',
    },
    defaultButtonText: {
      color: theme.colors.primary,
    },
    cancelButtonText: {
      color: theme.colors.textSecondary,
    },
    destructiveButtonText: {
      color: theme.colors.error,
    },
  });

  // Default buttons if none provided
  const buttons = config.buttons || [
    {
      text: 'OK',
      onPress: () => {},
      style: 'default' as const,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        <Animated.View style={[styles.dialogContainer, contentAnimatedStyle]}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{dialogIcon}</Text>
            </View>
            <Text style={styles.title}>{config.title}</Text>
          </View>

          <Text style={styles.message}>{config.message}</Text>

          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <React.Fragment key={index}>
                {index > 0 && <View style={styles.buttonSeparator} />}
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleButtonPress(button.onPress)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' &&
                        styles.destructiveButtonText,
                      button.style === 'default' && styles.defaultButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomDialog;
