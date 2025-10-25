import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const SearchIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle 
      cx="11" 
      cy="11" 
      r="8" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path 
      d="m21 21-4.35-4.35" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path 
      d="M7 10l5 5 5-5" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path 
      d="M12 15V3" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const PlayIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M8 5v14l11-7z" 
      fill={color}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PauseIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect 
      x="6" 
      y="4" 
      width="4" 
      height="16" 
      fill={color}
      rx="1"
    />
    <Rect 
      x="14" 
      y="4" 
      width="4" 
      height="16" 
      fill={color}
      rx="1"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M20 6L9 17l-5-5" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const XIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M18 6L6 18" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path 
      d="M6 6l12 12" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path 
      d="M12 9v4" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path 
      d="M12 17h.01" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const InfoIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke={color} 
      strokeWidth={strokeWidth}
    />
    <Path 
      d="M12 16v-4" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path 
      d="M12 8h.01" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const MoreHorizontalIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="1" fill={color} />
    <Circle cx="19" cy="12" r="1" fill={color} />
    <Circle cx="5" cy="12" r="1" fill={color} />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="m6 9 6 6 6-6" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);