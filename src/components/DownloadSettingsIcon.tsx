import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { DownloadSettingsModal } from './DownloadSettingsModal';

interface DownloadSettingsIconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const DownloadSettingsIcon: React.FC<DownloadSettingsIconProps> = ({
  size = 24,
  color = '#333',
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.iconButton, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.icon, { fontSize: size, color }]}>⚙️</Text>
      </TouchableOpacity>

      <DownloadSettingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontWeight: '600',
  },
});
