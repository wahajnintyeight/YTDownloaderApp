# Custom Dialog System

## Overview

A comprehensive custom dialog system that replaces React Native's default `Alert` with a theme-aware, smoothly animated modal dialog. The system provides a consistent user experience across the app with vibrant colors and smooth animations.

## Features

- ✅ **Theme Integration**: Automatically adapts to light/dark mode
- ✅ **Smooth Animations**: Uses react-native-reanimated for 60fps animations
- ✅ **Multiple Dialog Types**: Info, Success, Error, Warning, Confirm
- ✅ **Customizable Buttons**: Support for different button styles and actions
- ✅ **Global State Management**: Context-based system for app-wide usage
- ✅ **Accessibility**: Proper modal behavior and accessibility support
- ✅ **TypeScript Support**: Fully typed interfaces and components

## Components

### 1. Dialog Types (`src/types/dialog.ts`)

```typescript
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
  dismissible?: boolean;
}
```

### 2. CustomDialog Component (`src/components/CustomDialog.tsx`)

The main dialog component featuring:
- **Animated backdrop** with fade in/out (0 → 0.5 opacity)
- **Animated content** with scale (0.8 → 1.0) + fade (0 → 1.0)
- **Theme-aware styling** using useTheme hook
- **Icon indicators** for different dialog types
- **Flexible button layout** with proper separators

#### Animation Details
- **Enter Animation**: 300ms duration with spring animation for scale
- **Exit Animation**: 250ms duration with timing animation
- **Backdrop**: Smooth opacity transition
- **Content**: Combined scale and opacity for polished feel

### 3. DialogProvider Context (`src/contexts/DialogContext.tsx`)

Global state management with:
- **Dialog state management** using useReducer
- **Convenience methods** for common dialog types
- **Context provider** that renders the dialog globally

#### Available Methods

```typescript
const {
  showDialog,     // Show custom dialog with full config
  hideDialog,     // Hide current dialog
  showAlert,      // Show info dialog (replaces Alert.alert)
  showConfirm,    // Show confirmation dialog
  showSuccess,    // Show success dialog
  showError,      // Show error dialog
} = useDialog();
```

### 4. useDialog Hook (`src/hooks/useDialog.ts`)

Simple re-export for easy importing:
```typescript
import { useDialog } from '../hooks/useDialog';
```

## Usage Examples

### Basic Alert (replaces Alert.alert)

```typescript
import { useDialog } from '../hooks/useDialog';

const { showAlert } = useDialog();

// Instead of: Alert.alert('Title', 'Message');
showAlert('Title', 'Message');
```

### Success Dialog

```typescript
const { showSuccess } = useDialog();

showSuccess(
  'Download Complete',
  'Your video has been downloaded successfully!',
  () => console.log('User acknowledged')
);
```

### Error Dialog

```typescript
const { showError } = useDialog();

showError(
  'Download Failed',
  'Unable to download the video. Please try again.'
);
```

### Confirmation Dialog

```typescript
const { showConfirm } = useDialog();

showConfirm(
  'Delete Video',
  'Are you sure you want to delete this video?',
  () => deleteVideo(), // onConfirm
  () => console.log('Cancelled') // onCancel (optional)
);
```

### Custom Dialog

```typescript
const { showDialog } = useDialog();

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
      onPress: () => performDelete(),
      style: 'destructive',
    },
  ],
  dismissible: false, // Cannot be dismissed by tapping backdrop
});
```

## Dialog Types and Styling

### Info Dialog
- **Icon**: ℹ (info symbol)
- **Color**: Primary theme color
- **Usage**: General information, notifications

### Success Dialog
- **Icon**: ✓ (checkmark)
- **Color**: Success green (#00B894)
- **Usage**: Successful operations, confirmations

### Error Dialog
- **Icon**: ✕ (X mark)
- **Color**: Error red (theme.colors.error)
- **Usage**: Error messages, failed operations

### Warning Dialog
- **Icon**: ⚠ (warning triangle)
- **Color**: Warning orange (#FF9500)
- **Usage**: Warnings, potentially destructive actions

### Confirm Dialog
- **Icon**: ? (question mark)
- **Color**: Primary theme color
- **Usage**: Confirmation prompts, yes/no questions

## Button Styles

### Default Button
- **Color**: Primary theme color
- **Usage**: Primary actions, confirmations

### Cancel Button
- **Color**: Secondary text color
- **Usage**: Cancel actions, dismissals

### Destructive Button
- **Color**: Error red
- **Usage**: Delete actions, destructive operations

## Integration

### 1. Add DialogProvider to App.tsx

```typescript
import { DialogProvider } from './src/contexts/DialogContext';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DialogProvider>
          <DownloadProvider>
            <AppNavigator />
          </DownloadProvider>
        </DialogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

### 2. Replace Alert.alert calls

```typescript
// Before
import { Alert } from 'react-native';
Alert.alert('Title', 'Message');

// After
import { useDialog } from '../hooks/useDialog';
const { showAlert } = useDialog();
showAlert('Title', 'Message');
```

## Customization

### Theme Colors

The dialog automatically uses theme colors:
- **Background**: `theme.colors.surface`
- **Text**: `theme.colors.text`
- **Secondary Text**: `theme.colors.textSecondary`
- **Border**: `theme.colors.border`
- **Primary**: `theme.colors.primary`
- **Success**: `theme.colors.success`
- **Error**: `theme.colors.error`

### Animation Timing

Modify animation timing in `CustomDialog.tsx`:
```typescript
// Enter animations
backdropOpacity.value = withTiming(0.5, { duration: 300 });
contentScale.value = withSpring(1, { damping: 15, stiffness: 150 });
contentOpacity.value = withTiming(1, { duration: 300 });

// Exit animations
backdropOpacity.value = withTiming(0, { duration: 250 });
contentScale.value = withTiming(0.8, { duration: 250 });
contentOpacity.value = withTiming(0, { duration: 250 });
```

## Testing

### DialogDemo Component

A demo component (`src/components/DialogDemo.tsx`) showcases all dialog types:

```typescript
import DialogDemo from '../components/DialogDemo';

// Use in any screen to test dialogs
<DialogDemo />
```

### Test Button in BrowseScreen

A temporary test button has been added to the BrowseScreen welcome section to demonstrate the dialog functionality.

## Performance Considerations

- **Single Dialog Instance**: Only one dialog can be shown at a time
- **Efficient Animations**: Uses react-native-reanimated for optimal performance
- **Memory Management**: Dialog state is properly cleaned up when hidden
- **Theme Updates**: Automatically responds to theme changes

## Accessibility

- **Modal Behavior**: Uses React Native's Modal component for proper overlay behavior
- **Hardware Back Button**: Properly handles Android back button
- **Screen Reader Support**: Accessible text and button labels
- **Focus Management**: Proper focus handling for keyboard navigation

## Migration Guide

### From Alert.alert

```typescript
// Old way
Alert.alert(
  'Download Started',
  'Your download has begun.',
  [{ text: 'OK', onPress: () => closeModal() }]
);

// New way
showSuccess(
  'Download Started',
  'Your download has begun.',
  () => closeModal()
);
```

### From Custom Modals

Replace custom confirmation modals with the dialog system:

```typescript
// Instead of creating custom modal components
const { showConfirm } = useDialog();

showConfirm(
  'Delete Item',
  'Are you sure?',
  () => deleteItem(),
  () => console.log('Cancelled')
);
```

## Future Enhancements

- **Toast Notifications**: Add non-blocking toast messages
- **Custom Icons**: Support for custom icons per dialog
- **Animation Variants**: Different animation styles (slide, bounce, etc.)
- **Queue System**: Support for multiple dialogs in queue
- **Persistent Dialogs**: Dialogs that survive app backgrounding
- **Rich Content**: Support for custom content beyond text

## Dependencies

- **react-native-reanimated**: For smooth animations
- **React Context API**: For global state management
- **TypeScript**: For type safety and better DX

The custom dialog system provides a polished, consistent user experience that matches your app's design language while being easy to use and maintain.