import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SearchIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const SearchIcon: React.FC<SearchIconProps> = ({ 
  size = 20, 
  color = '#FFFFFF',
  strokeWidth = 2 
}) => {
  const iconSize = size;
  const circleSize = iconSize * 0.55;
  const handleLength = iconSize * 0.35;
  
  // Calculate positions for perfect centering
  const circleRadius = circleSize / 2;
  const handleOffset = circleRadius * 0.707; // cos(45°) ≈ 0.707
  
  const styles = StyleSheet.create({
    container: {
      width: iconSize,
      height: iconSize,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    circleContainer: {
      position: 'absolute',
      top: (iconSize - circleSize) / 2 - handleLength * 0.3,
      left: (iconSize - circleSize) / 2 - handleLength * 0.3,
    },
    circle: {
      width: circleSize,
      height: circleSize,
      borderRadius: circleSize / 2,
      borderWidth: strokeWidth,
      borderColor: color,
      backgroundColor: 'transparent',
    },
    handle: {
      position: 'absolute',
      width: handleLength,
      height: strokeWidth,
      backgroundColor: color,
      borderRadius: strokeWidth / 2,
      top: circleSize - strokeWidth / 2,
      left: circleSize - strokeWidth / 2,
      transformOrigin: 'left center',
      transform: [{ rotate: '45deg' }],
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <View style={styles.circle} />
        <View style={styles.handle} />
      </View>
    </View>
  );
};

export default SearchIcon;