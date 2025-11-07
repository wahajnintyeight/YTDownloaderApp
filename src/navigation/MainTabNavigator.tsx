import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { MainTabParamList } from './types';
import { useTheme } from '../hooks/useTheme';
import { useDownloads } from '../hooks/useDownloads';
import { SearchIcon, DownloadIcon } from '../components/icons/ModernIcons';
import BrowseScreen from '../screens/BrowseScreen';
import DownloadsScreen from '../screens/DownloadsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main Tab Navigator
 * DRY principle: Centralized navigation configuration
 */
const TabIcon: React.FC<{
  name: keyof MainTabParamList;
  focused: boolean;
  color: string;
}> = ({ name, focused, color }) => {
  const iconSize = 22;
  const strokeWidth = focused ? 2.5 : 2;
  const renderIcon = () => {
    switch (name) {
      case 'Browse':
        return (
          <SearchIcon size={iconSize} color={color} strokeWidth={strokeWidth} />
        );
      case 'Downloads':
        return (
          <DownloadIcon
            size={iconSize}
            color={color}
            strokeWidth={strokeWidth}
          />
        );
      default:
        return null;
    }
  };
  return <View style={styles.iconWrapper}>{renderIcon()}</View>;
};

export const MainTabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { downloads } = useDownloads();

  const activeDownloads = downloads.filter(
    d => d.status === 'downloading' || d.status === 'pending',
  ).length;

  return (
    <Tab.Navigator
      initialRouteName="Browse"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            name={route.name as keyof MainTabParamList}
            focused={focused}
            color={color}
          />
        ),
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarPressColor: theme.colors.secondary + '20',
        tabBarPressOpacity: 0.8,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarLabel: 'Browse' }}
      />
      <Tab.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{
          tabBarLabel: 'Downloads',
          tabBarBadge: activeDownloads > 0 ? activeDownloads : undefined,
          tabBarBadgeStyle: {
            backgroundColor: isDark
              ? theme.colors.error
              : theme.colors.secondary,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '600',
            minWidth: 20,
            height: 20,
            borderRadius: 10,
          },
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0.5,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    height: 70,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 32,
  },
  badge: {
    backgroundColor: '#4ECDC4',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
