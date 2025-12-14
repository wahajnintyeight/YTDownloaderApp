import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

/**
 * AdMob Banner Ad Component
 * Uses test ads in development, real ads in production
 */

// Use Google's official test banner ID in dev (always has fill)
// Real ID in production
const BANNER_AD_UNIT_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/6300978111' // Google's official test banner
  : 'ca-app-pub-8661261889949168/1206292886';

interface AppBannerAdProps {
  style?: object;
}

export const AppBannerAd: React.FC<AppBannerAdProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('📢 Banner ad loaded');
        }}
        onAdFailedToLoad={error => {
          console.error('❌ Banner ad failed to load:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
