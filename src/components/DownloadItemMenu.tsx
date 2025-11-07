import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Theme } from '../theme';

interface MenuItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface DownloadItemMenuProps {
  visible: boolean;
  items: MenuItem[];
  onClose: () => void;
  theme: Theme;
  position: { x: number; y: number };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DownloadItemMenu: React.FC<DownloadItemMenuProps> = ({
  visible,
  items,
  onClose,
  theme,
  position,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  // Calculate menu position (align to right side of screen with padding)
  const menuRight = SCREEN_WIDTH - position.x - 40;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={{ opacity: opacityAnim }}>
          <View style={[styles.backdropOverlay]} />
        </Animated.View>
      </TouchableOpacity>

      {/* Menu */}
      <Animated.View
        style={[
          styles.menu,
          {
            backgroundColor: theme.colors.surface,
            top: position.y + 8,
            right: menuRight,
            transform: [{ translateY }],
            opacity: opacityAnim,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index < items.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              },
            ]}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.menuItemText,
                {
                  color: item.destructive
                    ? theme.colors.error
                    : theme.colors.text,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    minWidth: 180,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default DownloadItemMenu;
