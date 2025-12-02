import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

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
  color = '#000',
  strokeWidth: _strokeWidth = 2,
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

export const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .65.39 1.24 1 1.51H21a2 2 0 1 1 0 4h-.09c-.68.27-1.17.86-1.51 1.49Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

export const FolderIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path 
      d="M15 3h6v6" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path 
      d="M10 14L21 3" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="m15 18-6-6 6-6" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SunIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#A0A0A0', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle 
      cx="12" 
      cy="12" 
      r="5" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path 
      d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MoonIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = '#A0A0A0', 
  strokeWidth = 2 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
      stroke={color} 
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);