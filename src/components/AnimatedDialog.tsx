import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { DialogConfig, DialogType } from '../types/dialog';
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from './icons/ModernIcons';

interface AnimatedDialogProps {
  visible: boolean;
  config: DialogConfig | null;
  onDismiss: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const AnimatedDialog: React.FC<AnimatedDialogProps> = ({ visible, config, onDismiss }) => {
  const { theme } = useTheme();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Enter animation - quick and responsive
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animation - quick and snappy
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, contentScale, contentOpacity]);

  const getDialogColor = (type: DialogType): string => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return '#FF1744';
      case 'confirm':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  const getDialogIcon = (type: DialogType, color: string) => {
    const iconSize = 24;
    switch (type) {
      case 'success':
        return <CheckIcon size={iconSize} color={color} strokeWidth={2.5} />;
      case 'error':
        return <XIcon size={iconSize} color={color} strokeWidth={2.5} />;
      case 'warning':
        return <AlertTriangleIcon size={iconSize} color={color} strokeWidth={2.5} />;
      case 'confirm':
        return <InfoIcon size={iconSize} color={color} strokeWidth={2.5} />;
      default:
        return <InfoIcon size={iconSize} color={color} strokeWidth={2.5} />;
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
  const dialogIcon = getDialogIcon(config.type || 'info', dialogColor);

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
      borderRadius: 16,
      padding: 0,
      width: screenWidth - 48,
      maxWidth: 320,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
    header: {
      alignItems: 'center',
      paddingTop: 24,
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: dialogColor + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },

    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    buttonsContainer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonSeparator: {
      width: 1,
      backgroundColor: theme.colors.border,
    },
    buttonText: {
      fontSize: 16,
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
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.dialogContainer,
            {
              transform: [{ scale: contentScale }],
              opacity: contentOpacity,
            },
            config.size === 'large' && {
              width: screenWidth - 24,
              maxWidth: 420,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>{dialogIcon}</View>
            <Text
              style={[
                styles.title,
                config.size === 'large' && { fontSize: 22, marginBottom: 12 },
              ]}
            >
              {config.title}
            </Text>
          </View>

          <Text
            style={[
              styles.message,
              config.size === 'large' && {
                fontSize: 19,
                lineHeight: 26,
                paddingHorizontal: 28,
                paddingBottom: 28,
              },
            ]}
          >
            {config.message}
          </Text>

          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <React.Fragment key={index}>
                {index > 0 && <View style={styles.buttonSeparator} />}
                <TouchableOpacity
                  style={[
                    styles.button,
                    config.size === 'large' && { paddingVertical: 18 },
                  ]}
                  onPress={() => handleButtonPress(button.onPress)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                      button.style === 'default' && styles.defaultButtonText,
                      config.size === 'large' && { fontSize: 17 },
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

export default AnimatedDialog;