import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useDialog } from '../hooks/useDialog';

const DialogDemo: React.FC = () => {
  const { theme } = useTheme();
  const { showAlert, showConfirm, showSuccess, showError, showDialog } = useDialog();

  const styles = StyleSheet.create({
    container: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryButtonText: {
      color: theme.colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => showAlert('Info Dialog', 'This is an informational message.')}
      >
        <Text style={styles.buttonText}>Show Info Dialog</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => showSuccess('Success!', 'Your action was completed successfully.')}
      >
        <Text style={styles.buttonText}>Show Success Dialog</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => showError('Error', 'Something went wrong. Please try again.')}
      >
        <Text style={styles.buttonText}>Show Error Dialog</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          showConfirm(
            'Confirm Action',
            'Are you sure you want to proceed?',
            () => console.log('Confirmed'),
            () => console.log('Cancelled')
          )
        }
      >
        <Text style={styles.buttonText}>Show Confirm Dialog</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() =>
          showDialog({
            type: 'warning',
            title: 'Warning',
            message: 'This action cannot be undone.',
            buttons: [
              {
                text: 'Cancel',
                onPress: () => console.log('Cancelled'),
                style: 'cancel',
              },
              {
                text: 'Delete',
                onPress: () => console.log('Deleted'),
                style: 'destructive',
              },
            ],
            dismissible: false,
          })
        }
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Show Warning Dialog</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DialogDemo;