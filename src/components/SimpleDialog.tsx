import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { DialogConfig, DialogType } from '../types/dialog';

interface SimpleDialogProps {
  visible: boolean;
  config: DialogConfig | null;
  onDismiss: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const SimpleDialog: React.FC<SimpleDialogProps> = ({ visible, config, onDismiss }) => {
  const { theme } = useTheme();

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

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    icon: {
      fontSize: 24,
      color: dialogColor,
      fontWeight: 'bold',
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
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />

        <View style={styles.dialogContainer}>
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
                      button.style === 'destructive' && styles.destructiveButtonText,
                      button.style === 'default' && styles.defaultButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SimpleDialog;