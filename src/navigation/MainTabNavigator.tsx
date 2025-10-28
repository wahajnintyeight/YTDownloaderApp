import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { MainTabParamList } from './types';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { SearchIcon, DownloadIcon } from '../components/icons/ModernIcons';
import BrowseScreen from '../screens/BrowseScreen';
import DownloadsScreen from '../screens/DownloadsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
  const iconSize = 22;
  const strokeWidth = focused ? 2.5 : 2;

  const getIcon = () => {
    switch (name) {
      case 'Browse':
        return <SearchIcon size={iconSize} color={color} strokeWidth={strokeWidth} />;
      case 'Downloads':
        return <DownloadIcon size={iconSize} color={color} strokeWidth={strokeWidth} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      minHeight: 32,
    }}>
      {getIcon()}
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { downloads } = useDownloads();

  // Count active downloads for badge
  const activeDownloads = downloads.filter(
    download => download.status === 'downloading' || download.status === 'pending'
  ).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarPressColor: theme.colors.secondary + '20',
        tabBarPressOpacity: 0.8,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 16,
          height: 70,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Browse" 
        component={BrowseScreen}
        options={{
          tabBarLabel: 'Browse',
        }}
      />
      <Tab.Screen 
        name="Downloads" 
        component={DownloadsScreen}
        options={{
          tabBarLabel: 'Downloads',
          tabBarBadge: activeDownloads > 0 ? activeDownloads : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.secondary,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '600',
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;