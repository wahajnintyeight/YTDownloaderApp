import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BrowseScreen from '../screens/BrowseScreen';
import VideoViewerScreen from '../screens/VideoViewerScreen';
import { Video } from '../types/video';

export type BrowseStackParamList = {
  BrowseHome: { testSearch?: boolean } | undefined;
  VideoViewer: { video: Video; youtubeUrl?: string };
};

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export const BrowseStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BrowseHome" component={BrowseScreen} />
      <Stack.Screen name="VideoViewer" component={VideoViewerScreen} />
    </Stack.Navigator>
  );
};
