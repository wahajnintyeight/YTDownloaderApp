export type DialogType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

export interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface DialogConfig {
  type?: DialogType;
  title: string;
  message: string;
  buttons?: DialogButton[];
  dismissible?: boolean; // Can be dismissed by tapping backdrop
  size?: 'default' | 'large';
}

export interface DialogState {
  visible: boolean;
  config: DialogConfig | null;
}