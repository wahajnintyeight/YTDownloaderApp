import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { DialogConfig, DialogState } from '../types/dialog';
import AnimatedDialog from '../components/AnimatedDialog';

interface DialogContextType {
  showDialog: (config: DialogConfig) => void;
  hideDialog: () => void;
  showAlert: (title: string, message: string, onPress?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  showSuccess: (title: string, message: string, onPress?: () => void) => void;
  showError: (title: string, message: string, onPress?: () => void) => void;
}

type DialogAction =
  | { type: 'SHOW_DIALOG'; payload: DialogConfig }
  | { type: 'HIDE_DIALOG' };

const dialogReducer = (state: DialogState, action: DialogAction): DialogState => {
  switch (action.type) {
    case 'SHOW_DIALOG':
      return {
        visible: true,
        config: action.payload,
      };
    case 'HIDE_DIALOG':
      return {
        visible: false,
        config: null,
      };
    default:
      return state;
  }
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dialogReducer, {
    visible: false,
    config: null,
  });

  const showDialog = (config: DialogConfig) => {
    dispatch({ type: 'SHOW_DIALOG', payload: config });
  };

  const hideDialog = () => {
    dispatch({ type: 'HIDE_DIALOG' });
  };

  const showAlert = (title: string, message: string, onPress?: () => void) => {
    showDialog({
      type: 'info',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ],
      dismissible: true,
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showDialog({
      type: 'confirm',
      title,
      message,
      buttons: [
        {
          text: 'Cancel',
          onPress: onCancel || (() => {}),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: onConfirm,
          style: 'default',
        },
      ],
      dismissible: false,
    });
  };

  const showSuccess = (title: string, message: string, onPress?: () => void) => {
    showDialog({
      type: 'success',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ],
      dismissible: true,
    });
  };

  const showError = (title: string, message: string, onPress?: () => void) => {
    showDialog({
      type: 'error',
      title,
      message,
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ],
      dismissible: true,
    });
  };

  const contextValue: DialogContextType = {
    showDialog,
    hideDialog,
    showAlert,
    showConfirm,
    showSuccess,
    showError,
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <AnimatedDialog
        visible={state.visible}
        config={state.config}
        onDismiss={hideDialog}
      />
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};